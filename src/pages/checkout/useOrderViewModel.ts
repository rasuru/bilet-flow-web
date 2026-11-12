import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import {
  checkoutRepository,
  isCheckoutPending,
} from "@/checkout/checkoutRepository"
import { openHalykPayment } from "@/checkout/halykPayment"

const kzt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "KZT",
})
const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

export function useOrderViewModel(sessionId: number, orderId: string) {
  const client = useQueryClient()
  const query = useQuery(checkoutRepository.orderQuery(sessionId, orderId))
  const cancel = useMutation({
    mutationFn: () => checkoutRepository.cancel(client, sessionId, orderId),
    onError: () => void query.refetch(),
  })
  const pay = useMutation({
    mutationFn: async (paymentId: string) => {
      const paymentSession = await checkoutRepository.paymentSession(
        sessionId,
        paymentId
      )
      await openHalykPayment(
        paymentSession,
        `/orders/${encodeURIComponent(orderId)}`
      )
    },
    onError: () => void query.refetch(),
  })

  const order = query.data
  if (!order) {
    return {
      status: query.isPending ? "loading" : "error",
      error: errorMessage(query.error, "Couldn’t load your order."),
      refresh: () => void query.refetch(),
    } as const
  }

  const pending = isCheckoutPending(order)
  const busy = pay.isPending || cancel.isPending
  const paymentId = order.paymentId
  const free = order.amountKzt === 0
  const awaitingPayment = order.status === "AWAITING_PAYMENT"
  const completed = order.status === "COMPLETED"
  const statusLabel = completed
    ? free
      ? "Free order confirmed"
      : "Payment confirmed"
    : awaitingPayment
      ? "Awaiting payment"
      : order.status.toLowerCase().replaceAll("_", " ")
  const paymentMessage =
    completed && free
      ? "Your total was zero. Your tickets were issued immediately."
      : awaitingPayment && paymentId
        ? order.sandbox
          ? "Complete the test payment on Halyk ePay to receive your tickets."
          : "Complete payment on Halyk ePay to receive your tickets."
        : null

  return {
    status: "ready",
    statusLabel,
    paymentMessage,
    tickets: completed ? order.tickets : [],
    order,
    total: kzt.format(order.amountKzt),
    expiresAt: pending ? dateTime.format(new Date(order.expiresAt)) : null,
    busy,
    canCancel: pending && !query.isError,
    pay:
      awaitingPayment && paymentId && !query.isError
        ? () => {
            if (!busy) {
              cancel.reset()
              pay.mutate(paymentId)
            }
          }
        : null,
    paying: pay.isPending,
    cancel: () => {
      if (!busy) {
        pay.reset()
        cancel.mutate()
      }
    },
    cancelling: cancel.isPending,
    refresh: () => void query.refetch(),
    refreshing: query.isFetching,
    error: cancel.isError
      ? errorMessage(cancel.error, "Couldn’t cancel your order.")
      : pay.isError
        ? errorMessage(pay.error, "Couldn’t open Halyk ePay. Try again.")
        : query.isError
          ? "Couldn’t refresh your order status."
          : null,
  } as const
}
