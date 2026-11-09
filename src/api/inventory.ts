import { requestEmpty, requestJson } from "@/api/client"
import { eventPath } from "@/api/events"
import type { SeatingMode } from "@/api/events"

type TicketTypeDetails = {
  name: string
  description: string
  /** KZT. Use a decimal string to preserve the exact amount. */
  price: string | number
  maxPerOrder: number
  salesStartAt: string
  salesEndAt: string
}

export type GeneralAdmissionTicketTypeRequest = TicketTypeDetails & {
  capacity: number
}
export type AssignedSeatingTicketTypeRequest = TicketTypeDetails & {
  priceCategory: string
}

export type TicketType = Omit<TicketTypeDetails, "price"> & {
  id: string
  eventId: string
  price: { amount: number; currency: string }
  status: "ACTIVE" | "PAUSED" | "HIDDEN" | "CLOSED"
  priceCategory: string | null
  totalCapacity: number | null
  reserved: number | null
  sold: number | null
  available: number | null
}

export type GeneralAdmissionAvailability = {
  ticketTypeId: string
  totalCapacity: number
  reserved: number
  sold: number
  available: number
}

export type SeatAvailability = {
  seatId: string
  status: "AVAILABLE" | "HELD" | "SOLD"
}

export type EventInventory = {
  inventoryId: string
  eventId: string
  inventoryKind: SeatingMode
  gaAvailability: GeneralAdmissionAvailability[]
  seatAvailability: SeatAvailability[]
}

function eventTicketTypesPath(eventId: string) {
  return `${eventPath(eventId)}/ticket-types`
}

function ticketTypePath(ticketTypeId: string) {
  return `/api/ticket-types/${encodeURIComponent(ticketTypeId)}`
}

export function getEventInventory(eventId: string) {
  return requestJson<EventInventory>(`${eventPath(eventId)}/inventory`)
}

export function listGeneralAdmissionAvailability(eventId: string) {
  return requestJson<GeneralAdmissionAvailability[]>(
    `${eventPath(eventId)}/availability`
  )
}

export function listSeatAvailability(eventId: string) {
  return requestJson<SeatAvailability[]>(`${eventPath(eventId)}/seat-map`)
}

export function listPublicTicketTypes(eventId: string) {
  return requestJson<TicketType[]>(eventTicketTypesPath(eventId))
}

export function listManagedTicketTypes(token: string, eventId: string) {
  return requestJson<TicketType[]>(`${eventTicketTypesPath(eventId)}/manage`, {
    token,
  })
}

export function createGeneralAdmissionTicketType(
  token: string,
  eventId: string,
  json: GeneralAdmissionTicketTypeRequest
) {
  return requestJson<{ id: string }>(
    `${eventTicketTypesPath(eventId)}/general-admission`,
    { token, method: "POST", json }
  )
}

export function createAssignedSeatingTicketType(
  token: string,
  eventId: string,
  json: AssignedSeatingTicketTypeRequest
) {
  return requestJson<{ id: string }>(
    `${eventTicketTypesPath(eventId)}/assigned-seating`,
    { token, method: "POST", json }
  )
}

export function updateGeneralAdmissionTicketType(
  token: string,
  ticketTypeId: string,
  json: GeneralAdmissionTicketTypeRequest
) {
  return requestEmpty(`${ticketTypePath(ticketTypeId)}/general-admission`, {
    token,
    method: "PUT",
    json,
  })
}

export function updateAssignedSeatingTicketType(
  token: string,
  ticketTypeId: string,
  json: AssignedSeatingTicketTypeRequest
) {
  return requestEmpty(`${ticketTypePath(ticketTypeId)}/assigned-seating`, {
    token,
    method: "PUT",
    json,
  })
}

export function hideTicketType(token: string, ticketTypeId: string) {
  return requestEmpty(`${ticketTypePath(ticketTypeId)}/hide`, {
    token,
    method: "POST",
  })
}

export function unhideTicketType(token: string, ticketTypeId: string) {
  return requestEmpty(`${ticketTypePath(ticketTypeId)}/unhide`, {
    token,
    method: "POST",
  })
}
