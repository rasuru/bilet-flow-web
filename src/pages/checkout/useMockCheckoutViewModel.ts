import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import type { MockPaymentScenario } from "@/api/payments"
import { mockCheckoutRepository } from "@/checkout/mockCheckoutRepository"
import { dateFormat, numberFormat, t } from "@/i18n/locale"

const amountFormat = numberFormat({ style: "currency", currency: "KZT" })
const dateTime = dateFormat({ dateStyle: "medium", timeStyle: "short" })

export function useMockCheckoutViewModel(sessionId: number, paymentId: string) {
  const client = useQueryClient()
  const query = useQuery(mockCheckoutRepository.checkout(sessionId, paymentId))
  const choose = useMutation({
    mutationFn: (scenario: MockPaymentScenario) =>
      mockCheckoutRepository.choose(client, sessionId, paymentId, scenario),
    onError: () => void query.refetch(),
  })
  const checkout = query.data
  const back = checkout?.orderId
    ? {
        href: `/orders/${encodeURIComponent(checkout.orderId)}`,
        label: t("Back to order"),
      }
    : checkout
      ? {
          href: `/organizer/events/${encodeURIComponent(checkout.eventId)}?activation-return=1`,
          label: t("Back to event management"),
        }
      : { href: "/", label: t("Home") }

  const status =
    checkout?.status === "REFUNDED"
      ? t("Refunded")
      : checkout?.status === "SUCCEEDED"
        ? t("Payment confirmed")
        : checkout?.expired
          ? t("Payment expired")
          : checkout?.status === "FAILED"
            ? t("Payment failed")
            : checkout?.closed
              ? t("Payment closed")
              : checkout?.scenario
                ? t("Payment pending")
                : null

  return {
    checkout,
    back,
    status,
    total: checkout ? amountFormat.format(checkout.amountKzt) : null,
    deadline: checkout ? dateTime.format(new Date(checkout.expiresAt)) : null,
    loading: query.isPending,
    queryError: query.isError,
    refresh: () => void query.refetch(),
    pending: choose.isPending,
    canChoose: !!checkout?.canChoose && !query.isError,
    delayAvailable: checkout?.canDelay === true,
    choose: (scenario: MockPaymentScenario) => {
      if (checkout?.canChoose && !query.isError && !choose.isPending)
        choose.mutate(scenario)
    },
    mutationError: choose.error
      ? t(
          choose.error instanceof ApiError
            ? (choose.error.body?.detail ?? choose.error.message)
            : "Could not simulate the payment. Try again."
        )
      : null,
  }
}
