import { queryOptions, type QueryClient } from "@tanstack/react-query"

import {
  cancelCheckout,
  createCheckout,
  getCheckout,
  type Checkout,
  type CheckoutRequest,
} from "@/api/checkouts"
import { ApiError } from "@/api/client"
import { createPaymentSession } from "@/api/payments"
import { sessionRepository } from "@/auth/sessionRepository"
import { attendanceRepository } from "@/tickets/attendanceRepository"

function checkoutKey(sessionId: number, checkoutId: string) {
  return ["checkout", sessionId, checkoutId] as const
}

export function isCheckoutPending(order: Checkout) {
  return order.status === "IN_PROGRESS" || order.status === "AWAITING_PAYMENT"
}

export const checkoutRepository = {
  async place(
    client: QueryClient,
    sessionId: number,
    accountId: number,
    request: CheckoutRequest
  ) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(request))
    )
    const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("")
    const storageKey = `checkout-attempt:${accountId}:${request.eventId}`
    const stored = sessionStorage.getItem(storageKey)?.split(":")
    const idempotencyKey =
      stored?.[0] === fingerprint && stored[1] ? stored[1] : crypto.randomUUID()
    sessionStorage.setItem(storageKey, `${fingerprint}:${idempotencyKey}`)

    const order = await sessionRepository.authenticatedRequest(
      sessionId,
      (token) => createCheckout(token, idempotencyKey, request)
    )
    if (
      sessionStorage.getItem(storageKey) === `${fingerprint}:${idempotencyKey}`
    ) {
      sessionStorage.removeItem(storageKey)
    }
    client.setQueryData(checkoutKey(sessionId, order.id), order)
    if (order.status === "COMPLETED") {
      void attendanceRepository.invalidate(client, sessionId)
    }
    void client.invalidateQueries({
      queryKey: ["public-event", request.eventId, "availability"],
    })
    return order
  },

  orderQuery(sessionId: number, checkoutId: string) {
    return queryOptions({
      queryKey: checkoutKey(sessionId, checkoutId),
      queryFn: async ({ client }) => {
        const key = checkoutKey(sessionId, checkoutId)
        const previous = client.getQueryData<Checkout>(key)
        const order = await sessionRepository.authenticatedRequest(
          sessionId,
          (token) => getCheckout(token, checkoutId)
        )
        if (order.status === "COMPLETED" && previous?.status !== "COMPLETED") {
          void attendanceRepository.invalidate(client, sessionId)
        }
        return order
      },
      retry: (count, error) =>
        count < 2 && (!(error instanceof ApiError) || error.status >= 500),
      refetchInterval: ({ state }) => {
        const order = state.data
        return order && isCheckoutPending(order) ? 3_000 : false
      },
    })
  },

  async cancel(client: QueryClient, sessionId: number, checkoutId: string) {
    const order = await sessionRepository.authenticatedRequest(
      sessionId,
      (token) => cancelCheckout(token, checkoutId)
    )
    const key = checkoutKey(sessionId, checkoutId)
    await client.cancelQueries({ queryKey: key, exact: true })
    client.setQueryData(key, order)
    void client.invalidateQueries({
      queryKey: ["public-event", order.eventId, "availability"],
    })
  },

  paymentSession(sessionId: number, paymentId: string) {
    return sessionRepository.authenticatedRequest(sessionId, (token) =>
      createPaymentSession(token, paymentId)
    )
  },
}
