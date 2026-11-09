import { requestJson } from "@/api/client"
import type { Ticket } from "@/api/tickets"

export type CheckoutRequest = {
  eventId: string
  selections: {
    ticketTypeId: string
    /** Empty for general admission. For assigned seating, order must match attendeeEmails. */
    seats: string[]
    attendeeEmails: string[]
  }[]
}

type IssuedTicket = Pick<
  Ticket,
  "id" | "status" | "ticketTypeId" | "seatId" | "attendeeEmail"
> & {
  code: string
}

export type Checkout = {
  id: string
  eventId: string
  status: string
  amountKzt: number
  expiresAt: string
  paymentId: string | null
  refundState: "PENDING" | "REFUNDED" | "FAILED" | null
  refundId: string | null
  tickets: IssuedTicket[]
  sandbox: boolean
}

const checkoutsPath = "/api/checkouts"

function checkoutPath(checkoutId: string) {
  return `${checkoutsPath}/${encodeURIComponent(checkoutId)}`
}

/** Use the same UUID and request when retrying the same purchase. */
export function createCheckout(
  token: string,
  idempotencyKey: string,
  json: CheckoutRequest
) {
  return requestJson<Checkout>(checkoutsPath, {
    token,
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    json,
  })
}

export function listMyCheckouts(token: string) {
  return requestJson<Checkout[]>(checkoutsPath, { token })
}

export function getCheckout(token: string, checkoutId: string) {
  return requestJson<Checkout>(checkoutPath(checkoutId), { token })
}

export function cancelCheckout(token: string, checkoutId: string) {
  return requestJson<Checkout>(`${checkoutPath(checkoutId)}/cancel`, {
    token,
    method: "POST",
  })
}

export function refundCheckout(
  token: string,
  checkoutId: string,
  reason: string
) {
  return requestJson<Checkout>(`${checkoutPath(checkoutId)}/refund`, {
    token,
    method: "POST",
    json: { reason },
  })
}
