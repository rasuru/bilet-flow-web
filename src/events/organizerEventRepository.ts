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

export async function publishNewEvent(
  client: QueryClient,
  sessionId: number,
  token: string,
  submission: EventSubmission,
  progress: SubmissionProgress,
  onStep: (message: string, recoveryStep: number) => void
) {
  if (!progress.draftEventId) {
    onStep("Creating event draft…", 4)
    const { id } = await createEvent(token, submission.details)
    progress.draftEventId = id
    progress.details = submission.details
  } else if (
    JSON.stringify(progress.details) !== JSON.stringify(submission.details)
  ) {
    onStep("Updating event draft…", 0)
    await updateEvent(token, progress.draftEventId, submission.details)
    progress.details = submission.details
  }

  const eventId = progress.draftEventId
  if (JSON.stringify(progress.venue) !== JSON.stringify(submission.venue)) {
    onStep("Saving venue…", 2)
    await attachVenue(token, eventId, submission.venue)
    progress.venue = submission.venue
  }

  for (const [index, { key, request }] of submission.tickets.entries()) {
    const saved = progress.tickets.get(key)
    if (JSON.stringify(saved?.request) === JSON.stringify(request)) continue

    onStep(
      `Saving ticket tier ${index + 1} of ${submission.tickets.length}…`,
      3
    )
    if (saved) {
      if ("priceCategory" in request) {
        await updateAssignedSeatingTicketType(token, saved.id, request)
      } else {
        await updateGeneralAdmissionTicketType(token, saved.id, request)
      }
      saved.request = request
    } else {
      const { id } =
        "priceCategory" in request
          ? await createAssignedSeatingTicketType(token, eventId, request)
          : await createGeneralAdmissionTicketType(token, eventId, request)
      progress.tickets.set(key, { id, request })
    }
  }

  onStep("Publishing event…", 4)
  await publishEvent(token, eventId)
  void client.invalidateQueries({ queryKey: ["managed-events", sessionId] })
  void client.invalidateQueries({ queryKey: ["public-events"] })
  void client.invalidateQueries({ queryKey: ["public-event", eventId] })
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
