import { requestJson } from "@/api/client"
import type { Ticket } from "@/api/tickets"

export type CheckoutRequest = {
  eventId: string
  promoCode?: string
  selections: {
    ticketTypeId: string
    /** Empty for general admission. For assigned seating, order must match attendeeEmails. */
    seats: string[]
    attendeeEmails: string[]
  }[]
}

export type PromoQuoteRequest = {
  eventId: string
  promoCode: string
  selections: { ticketTypeId: string; quantity: number }[]
}

export type PromoQuote = {
  promotionId: string
  promoCode: string
  subtotalKzt: number
  discountKzt: number
  amountKzt: number
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
  subtotalKzt?: number
  discountKzt?: number
  promoCode?: string | null
  createdAt?: string | null
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

export function quotePromotion(json: PromoQuoteRequest) {
  return requestJson<PromoQuote>(`${checkoutsPath}/quote`, {
    method: "POST",
    json,
  })
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
