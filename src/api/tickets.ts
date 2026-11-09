import { requestEmpty, requestFile, requestJson, withQuery } from "@/api/client"
import { eventPath } from "@/api/events"

export type TicketStatus =
  "VALID" | "CHECKED_IN" | "CANCELLED" | "REFUNDED" | "REFUND_PENDING"

export type Ticket = {
  id: string
  ticketTypeId: string
  eventId: string
  orderId: string
  attendeeEmail: string
  ownerUserId: number | null
  seatId: string | null
  ticketCode: string
  status: TicketStatus
  issuedAt: string
}

export type TicketValidation = {
  ticketId: string
  eventId: string
  ticketTypeId: string
  seatId: string | null
  status: TicketStatus
  validForEntry: boolean
}

export type CheckInCounts = { registered: number; checkedIn: number }

function ticketPath(ticketId: string) {
  return `/api/tickets/${encodeURIComponent(ticketId)}`
}

function checkInPath(eventId: string) {
  return `${eventPath(eventId)}/check-in`
}

function checkInTicketPath(eventId: string, ticketCode: string) {
  return `${checkInPath(eventId)}/tickets/${encodeURIComponent(ticketCode)}`
}

export function getTicketPdf(token: string, ticketId: string) {
  return requestFile(`${ticketPath(ticketId)}/pdf`, token)
}

export function getTicketQr(token: string, ticketId: string) {
  return requestFile(`${ticketPath(ticketId)}/qr`, token)
}

export function searchAttendees(token: string, eventId: string, email: string) {
  return requestJson<Ticket[]>(
    withQuery(`${checkInPath(eventId)}/attendees`, { email }),
    { token }
  )
}

export function listMyTickets(token: string) {
  return requestJson<Ticket[]>("/api/tickets/mine", { token })
}

export function claimTicket(token: string, ticketId: string) {
  return requestJson<Ticket>(`${ticketPath(ticketId)}/claim`, {
    token,
    method: "POST",
  })
}

export function requestTicketDelivery(token: string, ticketId: string) {
  return requestEmpty(`${ticketPath(ticketId)}/delivery`, {
    token,
    method: "POST",
  })
}

export function validateTicket(
  token: string,
  eventId: string,
  ticketCode: string
) {
  return requestJson<TicketValidation>(
    `${checkInTicketPath(eventId, ticketCode)}/validation`,
    { token }
  )
}

export function checkInTicket(
  token: string,
  eventId: string,
  ticketCode: string
) {
  return requestJson<Ticket>(checkInTicketPath(eventId, ticketCode), {
    token,
    method: "POST",
  })
}

export function reverseCheckIn(
  token: string,
  eventId: string,
  ticketCode: string
) {
  return requestJson<Ticket>(
    `${checkInTicketPath(eventId, ticketCode)}/reverse`,
    { token, method: "POST" }
  )
}

export function getCheckInCounts(token: string, eventId: string) {
  return requestJson<CheckInCounts>(`${checkInPath(eventId)}/counts`, { token })
}
