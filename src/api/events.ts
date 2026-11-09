import { requestEmpty, requestJson } from "@/api/client"

export type EventVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE"
export type EventStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "CANCELLED"
export type SeatingMode = "GENERAL_ADMISSION" | "ASSIGNED_SEATING"

export type RegistrationWindowRequest =
  | { mode: "ALWAYS_OPEN" }
  | { mode: "OPENS_AT"; startAt: string }
  | { mode: "BOUNDED"; startAt: string; endAt: string }

export type EventScheduleRequest = {
  /** ISO 8601 instants with an offset or Z. */
  startAt: string
  endAt: string
  registrationWindow: RegistrationWindowRequest
}

export type EventDetailsRequest = EventScheduleRequest & {
  title: string
  description?: string | null
  category: string
  imageUrl?: string | null
  visibility: EventVisibility
}

type VenueDetails = { name: string; address: string }
export type VenueRequest = VenueDetails & { capacity: number } & (
    | { seatingMode: "GENERAL_ADMISSION" }
    | { seatingMode: "ASSIGNED_SEATING"; venueLayoutId: string }
  )

export type AssignStaffRequest = { staffUserId: number; role: "EVENT_ADMIN" }

export type PublicEvent = {
  id: string
  title: string
  description: string | null
  category: string
  imageUrl: string | null
  visibility: EventVisibility
  status: EventStatus
  startAt: string
  endAt: string
  registrationWindow: {
    mode: RegistrationWindowRequest["mode"]
    startAt: string | null
    endAt: string | null
  }
  venue:
    | (VenueDetails & {
        totalCapacity: number
        seatingMode: SeatingMode
        venueLayoutId: string | null
      })
    | null
}

export type ManagedEvent = PublicEvent & {
  staff: { userId: number; role: "EVENT_ADMIN"; assignedAt: string }[]
}

export type VenueLayout = {
  layoutId: string
  name: string
  seats: {
    seatId: string
    section: string
    row: string
    seatNumber: string
    accessible: boolean
    priceCategory: string | null
  }[]
}

const eventsPath = "/api/events"

export function eventPath(eventId: string) {
  return `${eventsPath}/${encodeURIComponent(eventId)}`
}

export function listPublicEvents() {
  return requestJson<PublicEvent[]>(eventsPath)
}

export function getPublicEvent(eventId: string) {
  return requestJson<PublicEvent>(eventPath(eventId))
}

export function listMyEvents(token: string) {
  return requestJson<ManagedEvent[]>(`${eventsPath}/mine`, { token })
}

export function listAssignedCheckInEvents(token: string) {
  return requestJson<PublicEvent[]>(`${eventsPath}/assigned-for-check-in`, {
    token,
  })
}

export function getManagedEvent(token: string, eventId: string) {
  return requestJson<ManagedEvent>(`${eventPath(eventId)}/manage`, { token })
}

export function createEvent(token: string, json: EventDetailsRequest) {
  return requestJson<{ id: string }>(eventsPath, {
    token,
    method: "POST",
    json,
  })
}

export function updateEvent(
  token: string,
  eventId: string,
  json: EventDetailsRequest
) {
  return requestEmpty(eventPath(eventId), { token, method: "PUT", json })
}

export function publishEvent(token: string, eventId: string) {
  return requestEmpty(`${eventPath(eventId)}/publish`, {
    token,
    method: "POST",
  })
}

export function unpublishEvent(token: string, eventId: string) {
  return requestEmpty(`${eventPath(eventId)}/unpublish`, {
    token,
    method: "POST",
  })
}

export function cancelEvent(token: string, eventId: string) {
  return requestEmpty(`${eventPath(eventId)}/cancel`, { token, method: "POST" })
}

export function duplicateEvent(
  token: string,
  eventId: string,
  json: EventScheduleRequest
) {
  return requestJson<{ id: string }>(`${eventPath(eventId)}/duplicate`, {
    token,
    method: "POST",
    json,
  })
}

export function attachVenue(
  token: string,
  eventId: string,
  json: VenueRequest
) {
  return requestEmpty(`${eventPath(eventId)}/venue`, {
    token,
    method: "POST",
    json,
  })
}

export function assignStaff(
  token: string,
  eventId: string,
  json: AssignStaffRequest
) {
  return requestEmpty(`${eventPath(eventId)}/staff`, {
    token,
    method: "POST",
    json,
  })
}

export function removeStaff(
  token: string,
  eventId: string,
  staffUserId: number
) {
  return requestEmpty(`${eventPath(eventId)}/staff/${staffUserId}`, {
    token,
    method: "DELETE",
  })
}

export function listVenueLayouts() {
  return requestJson<VenueLayout[]>("/api/venue-layouts")
}

export function getVenueLayout(layoutId: string) {
  return requestJson<VenueLayout>(
    `/api/venue-layouts/${encodeURIComponent(layoutId)}`
  )
}
