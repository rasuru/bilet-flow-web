import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError } from "@/api/client"
import { openHalykPayment } from "@/checkout/halykPayment"
import { paidSalesRepository } from "@/payments/paidSalesRepository"
import { numberFormat, t } from "@/i18n/locale"
import { manageEventPath } from "./organizerEventPresentation"

const kzt = numberFormat({ style: "currency", currency: "KZT" })
const itemLabels: Record<string, string> = {
  EVENT_ACCEPTS_PAID_SALES: "Event has not started or been cancelled",
  PAID_TICKET_TYPE: "At least one paid ticket tier",
  IDENTITY_VERIFICATION: "Identity and payout verification",
  PAYOUT_ACCOUNT_REGISTERED: "Payout account registered",
  PAID_EVENT_TERMS_ACCEPTED: "Paid-event terms accepted",
  ACTIVATION_FEE_PAID: "Activation fee paid",
}

export function usePaidSalesViewModel(sessionId: number, eventId: string) {
  const client = useQueryClient()
  const query = useQuery(paidSalesRepository.checklistQuery(sessionId, eventId))
  const [terms, setTerms] = useState(false)
  const [verification, setVerification] = useState(false)
  const previous = useRef<string | undefined>(undefined)
  const [returned, setReturned] = useState(() => new URLSearchParams(window.location.search).get("activation-return") === "1")
  const [successOpen, setSuccessOpen] = useState(false)
  const checklist = query.data
  const status = checklist?.status
  useEffect(() => {
    if (status === "ACTIVE" && previous.current !== "ACTIVE") {
      void paidSalesRepository.refresh(client, sessionId, eventId)
    }
    if (status === "ACTIVE" && (returned || previous.current === "PENDING")) {
      setSuccessOpen(true)
      setReturned(false)
      const url = new URL(window.location.href)
      url.searchParams.delete("activation-return")
      window.history.replaceState(window.history.state, "", url)
    }
    previous.current = status
  }, [client, sessionId, eventId, status, returned])
  const payment = useMutation({
    mutationFn: async () => {
      const session = await paidSalesRepository.paymentSession(sessionId, eventId, {
        acceptSandboxTerms: terms,
        simulateIdentityAndPayoutVerification: verification,
      })
      await openHalykPayment(session, `${manageEventPath(eventId)}?activation-return=1`)
    },
    onSettled: () => void query.refetch(),
  })
  const active = status === "ACTIVE"
  const suspended = status === "SUSPENDED"
  const pending = status === "PENDING"
  const hasPaidTickets = checklist?.items.some(item => item.key === "PAID_TICKET_TYPE" && item.done) ?? false
  const needsPayout = checklist?.items.some(item => item.key === "PAYOUT_ACCOUNT_REGISTERED" && !item.done) ?? false
  const canRequest = Boolean(checklist?.readyToRequest && !active && !suspended && !query.isError)
  const canPay = canRequest && terms && verification && !payment.isPending
  return {
    active, suspended, hasPaidTickets, successOpen,
    closeSuccess: () => setSuccessOpen(false),
    showBlock: query.isPending || query.isError || (!active && (hasPaidTickets || pending || suspended)),
    loading: query.isPending,
    refreshing: query.isFetching,
    loaded: Boolean(checklist),
    statusLabel: t(active ? "Activated" : suspended ? "Suspended" : pending ? "Awaiting activation payment" : hasPaidTickets ? "Not activated" : "Not required"),
    statusClass: active ? "border-green-600 text-green-700 dark:text-green-400" : suspended ? "border-destructive text-destructive" : undefined,
    pending,
    showChecklist: Boolean(checklist && (hasPaidTickets || active || pending || suspended)),
    showRefresh: pending || query.isError || payment.isError,
    message: t(active ? "Paid sales are enabled for this event." : suspended ? "Paid sales have been suspended by the platform." : pending ? "Attendees cannot purchase paid tickets until the activation payment is confirmed." : hasPaidTickets ? "Activate paid sales to make paid tickets purchasable. Published events with no purchasable tickets are hidden from discovery." : "Free tickets do not require paid sales activation."),
    fee: checklist && !active && !suspended && hasPaidTickets ? kzt.format(checklist.activationFeeKzt) : null,
    feeLabel: t(pending ? "Current activation fee" : "One-time activation fee"),
    items: checklist?.items.filter(item => !item.done && ["EVENT_ACCEPTS_PAID_SALES", "PAID_TICKET_TYPE", "PAYOUT_ACCOUNT_REGISTERED"].includes(item.key)).map(item => ({ key: item.key, done: item.done, label: t(itemLabels[item.key] ?? item.description) })) ?? [],
    needsPayout: needsPayout && !active && !suspended && hasPaidTickets,
    canRequest, canPay, terms, setTerms, verification, setVerification,
    paying: payment.isPending,
    payLabel: t(pending ? "Continue activation payment" : "Activate paid sales"),
    pay: () => { if (canPay) payment.mutate() },
    refresh: () => { payment.reset(); void query.refetch() },
    error: payment.isError ? (payment.error instanceof ApiError ? t(payment.error.message) : t("Could not open the activation payment. Try again.")) : query.isError ? t("Could not load paid sales status.") : null,
  }
}

