import { queryOptions, type QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import {
  attachVenue,
  createEvent,
  listVenueLayouts,
  publishEvent,
  updateEvent,
  type EventDetailsRequest,
  type VenueLayout,
  type VenueRequest,
} from "@/api/events"
import {
  createAssignedSeatingTicketType,
  createGeneralAdmissionTicketType,
  updateAssignedSeatingTicketType,
  updateGeneralAdmissionTicketType,
  type AssignedSeatingTicketTypeRequest,
  type GeneralAdmissionTicketTypeRequest,
} from "@/api/inventory"
import { sessionRepository } from "@/auth/sessionRepository"

export type TicketRequest =
  GeneralAdmissionTicketTypeRequest | AssignedSeatingTicketTypeRequest

export type EventSubmission = {
  details: EventDetailsRequest
  venue: VenueRequest
  tickets: { key: string; request: TicketRequest }[]
}

export type SubmissionProgress = {
  draftEventId?: string
  details?: EventDetailsRequest
  venue?: VenueRequest
  tickets: Map<string, { id: string; request: TicketRequest }>
}

export type PublishStage =
  | { kind: "createDraft" | "updateDraft" | "saveVenue" | "publish" }
  | { kind: "saveTicket"; position: number; total: number }

const apiBase = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "")

export const allowsLocalEventSave =
  import.meta.env.DEV &&
  /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):8080$/.test(apiBase)

function mockLayout(
  layoutId: string,
  name: string,
  categories: string[]
): VenueLayout {
  return {
    layoutId,
    name,
    seats: categories.map((priceCategory, index) => ({
      seatId: String(index + 1),
      section: "A",
      row: "1",
      seatNumber: String(index + 1),
      accessible: index === 0,
      priceCategory,
    })),
  }
}

const mockLayouts = [
  mockLayout("main-hall", "Main Hall", [
    ...Array<string>(100).fill("PREMIUM"),
    ...Array<string>(400).fill("STANDARD"),
  ]),
  mockLayout(
    "small-auditorium",
    "Small Auditorium",
    Array<string>(180).fill("STANDARD")
  ),
]

async function loadVenueLayouts(): Promise<{
  offline: boolean
  layouts: VenueLayout[]
}> {
  try {
    return { offline: false, layouts: await listVenueLayouts() }
  } catch (error) {
    if (allowsLocalEventSave && error instanceof TypeError) {
      return { offline: true, layouts: mockLayouts }
    }
    throw error
  }
}

export function venueLayoutsQuery() {
  return queryOptions({
    queryKey: ["organizer", "venue-layouts"],
    queryFn: loadVenueLayouts,
    retry: false,
    staleTime: 0,
  })
}

async function refreshEventQueries(
  client: QueryClient,
  sessionId: number,
  eventId: string
) {
  const queries = [
    { queryKey: ["managed-events", sessionId] },
    { queryKey: ["public-events"] },
    { queryKey: ["public-event", eventId] },
  ]
  await Promise.all(queries.map((query) => client.cancelQueries(query)))
  for (const query of queries) void client.invalidateQueries(query)
}

export async function publishNewEvent(
  client: QueryClient,
  sessionId: number,
  submission: EventSubmission,
  progress: SubmissionProgress,
  onStep: (stage: PublishStage, recoveryStep: number) => void
) {
  const requestWithSession = <T>(request: (token: string) => Promise<T>) =>
    sessionRepository.authenticatedRequest(sessionId, request)

  if (!progress.draftEventId) {
    onStep({ kind: "createDraft" }, 4)
    const { id } = await requestWithSession((token) =>
      createEvent(token, submission.details)
    )
    progress.draftEventId = id
    progress.details = submission.details
    await refreshEventQueries(client, sessionId, id)
  } else if (
    JSON.stringify(progress.details) !== JSON.stringify(submission.details)
  ) {
    onStep({ kind: "updateDraft" }, 0)
    const eventId = progress.draftEventId
    await requestWithSession((token) =>
      updateEvent(token, eventId, submission.details)
    )
    progress.details = submission.details
  }

  const eventId = progress.draftEventId
  if (JSON.stringify(progress.venue) !== JSON.stringify(submission.venue)) {
    onStep({ kind: "saveVenue" }, 2)
    await requestWithSession((token) =>
      attachVenue(token, eventId, submission.venue)
    )
    progress.venue = submission.venue
  }

  for (const [index, { key, request }] of submission.tickets.entries()) {
    const saved = progress.tickets.get(key)
    if (JSON.stringify(saved?.request) === JSON.stringify(request)) continue

    onStep(
      {
        kind: "saveTicket",
        position: index + 1,
        total: submission.tickets.length,
      },
      3
    )
    if (saved) {
      await requestWithSession((token) =>
        "priceCategory" in request
          ? updateAssignedSeatingTicketType(token, saved.id, request)
          : updateGeneralAdmissionTicketType(token, saved.id, request)
      )
      saved.request = request
    } else {
      const { id } = await requestWithSession((token) =>
        "priceCategory" in request
          ? createAssignedSeatingTicketType(token, eventId, request)
          : createGeneralAdmissionTicketType(token, eventId, request)
      )
      progress.tickets.set(key, { id, request })
    }
  }

  onStep({ kind: "publish" }, 4)
  await requestWithSession((token) => publishEvent(token, eventId))
  await refreshEventQueries(client, sessionId, eventId)
  return eventId
}

export function saveLocalEvent(submission: EventSubmission) {
  const id = crypto.randomUUID()
  localStorage.setItem(
    `biletflow.local-event.${id}`,
    JSON.stringify({
      id,
      ...submission,
      tickets: submission.tickets.map(({ request }) => request),
    })
  )
  return id
}

export function submissionError(error: unknown) {
  if (error instanceof ApiError) {
    return (
      error.fieldErrors
        .map(({ field, message }) => `${field}: ${message}`)
        .join(" ") || error.message
    )
  }
  if (error instanceof TypeError)
    return "Could not reach the event service. Check your connection and try again."
  return "Could not save the event. Please try again."
}

