import { t, dateFormat, numberFormat, statusText } from "@/i18n/locale"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import {
  checkoutRepository,
  isCheckoutPending,
} from "@/checkout/checkoutRepository"
import { openPayment } from "@/checkout/openPayment"
import { useLocation } from "wouter"

const kzt = numberFormat({
  style: "currency",
  currency: "KZT",
})
const dateTime = dateFormat({
  dateStyle: "medium",
  timeStyle: "short",
})

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

export function useOrderViewModel(sessionId: number, orderId: string) {
  const client = useQueryClient()
  const [, navigate] = useLocation()
  const query = useQuery(checkoutRepository.orderQuery(sessionId, orderId))
  const cancel = useMutation({
    mutationFn: () => checkoutRepository.cancel(client, sessionId, orderId),
    onError: () => void query.refetch(),
  })
  const refund = useMutation({
    mutationFn: () => checkoutRepository.selfRefund(client, sessionId, orderId),
    onError: () => void query.refetch(),
  })
  const pay = useMutation({
    mutationFn: async (paymentId: string) => {
      const paymentSession = await checkoutRepository.paymentSession(
        sessionId,
        paymentId
      )
      await openPayment(paymentSession, `/orders/${encodeURIComponent(orderId)}`, navigate)
    },
    onError: () => void query.refetch(),
  })

  const order = query.data
  if (!order) {
    return {
      status: query.isPending ? "loading" : "error",
      error: errorMessage(query.error, t("Couldn’t load your order.")),
      refresh: () => void query.refetch(),
    } as const
  }

  const pending = isCheckoutPending(order)
  const busy = pay.isPending || cancel.isPending || refund.isPending
  const paymentId = order.paymentId
  const free = order.amountKzt === 0
  const awaitingPayment = order.status === "AWAITING_PAYMENT"
  const completed = order.status === "COMPLETED"
  const refundLabel = order.refundState === "PENDING"
    ? t("Refund pending")
    : order.refundState === "REFUNDED"
      ? t("Refunded")
      : order.refundState === "FAILED"
        ? t("Refund failed")
        : null
  const statusLabel = order.refundState === "REFUNDED" ? t("Refunded") : completed
    ? free
      ? t("Free order confirmed")
      : t("Payment confirmed")
    : awaitingPayment
      ? t("Awaiting payment")
      : statusText(order.status)
  const paymentMessage =
    completed && free
      ? t("Your total was zero. Your tickets were issued immediately.")
      : awaitingPayment && paymentId
        ? t("Complete payment to receive your tickets.")
        : null

  return {
    status: "ready",
    statusLabel,
    paymentMessage,
    refundLabel,
    showRefund: (!free && completed) || !!order.refundState,
    refundDeadline: order.selfRefundDeadline
      ? dateTime.format(new Date(order.selfRefundDeadline))
      : null,
    canRefund: order.selfRefundAvailable === true && !query.isError,
    requestRefund: () => {
      if (!busy) refund.mutate()
    },
    tickets: completed ? order.tickets : [],
    order,
    total: kzt.format(order.amountKzt),
    promotion:
      order.promoCode &&
      order.subtotalKzt !== undefined &&
      order.discountKzt !== undefined
        ? {
            code: order.promoCode,
            subtotal: kzt.format(order.subtotalKzt),
            discount: kzt.format(order.discountKzt),
          }
        : null,
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
    error: refund.isError
      ? t(refund.error instanceof ApiError
          ? refund.error.body?.detail ?? refund.error.message
          : "Could not request the refund.")
      : cancel.isError
      ? errorMessage(cancel.error, t("Couldn’t cancel your order."))
      : pay.isError
        ? errorMessage(pay.error, t("Could not open the payment. Try again."))
        : query.isError
          ? t("Couldn’t refresh your order status.")
          : null,
  } as const
}
