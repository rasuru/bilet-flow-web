import { queryOptions } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import {
  attachVenue,
  createEvent,
  listVenueLayouts,
  publishEvent,
  type EventDetailsRequest,
  type VenueLayout,
  type VenueRequest,
} from "@/api/events"
import {
  createAssignedSeatingTicketType,
  createGeneralAdmissionTicketType,
  type AssignedSeatingTicketTypeRequest,
  type GeneralAdmissionTicketTypeRequest,
} from "@/api/inventory"

export type TicketRequest =
  GeneralAdmissionTicketTypeRequest | AssignedSeatingTicketTypeRequest

export type EventSubmission = {
  details: EventDetailsRequest
  venue: VenueRequest
  tickets: TicketRequest[]
}

export type SubmissionProgress = {
  eventId?: string
  venueSaved?: boolean
  ticketsSaved: number
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
  token: string,
  submission: EventSubmission,
  progress: SubmissionProgress,
  onStep: (message: string) => void
) {
  if (!progress.eventId) {
    onStep("Creating event draft…")
    const { id } = await createEvent(token, submission.details)
    progress.eventId = id
  }

  if (!progress.venueSaved) {
    onStep("Saving venue…")
    await attachVenue(token, progress.eventId, submission.venue)
    progress.venueSaved = true
  }

  for (const ticket of submission.tickets.slice(progress.ticketsSaved)) {
    onStep(
      `Saving ticket tier ${progress.ticketsSaved + 1} of ${submission.tickets.length}…`
    )
    if ("priceCategory" in ticket) {
      await createAssignedSeatingTicketType(token, progress.eventId, ticket)
    } else {
      await createGeneralAdmissionTicketType(token, progress.eventId, ticket)
    }
    progress.ticketsSaved += 1
  }

  onStep("Publishing event…")
  await publishEvent(token, progress.eventId)
  return progress.eventId
}

export function saveLocalEvent(submission: EventSubmission) {
  const id = crypto.randomUUID()
  localStorage.setItem(
    `biletflow.local-event.${id}`,
    JSON.stringify({ id, ...submission })
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
