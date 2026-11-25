import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { dateFormat, numberFormat, statusText, t } from "@/i18n/locale"
import { payoutRepository, payoutPageSize } from "@/payments/payoutRepository"
import { payoutAccountRepository } from "@/payments/payoutAccountRepository"

const money = numberFormat({ style: "currency", currency: "KZT", maximumFractionDigits: 2 })
const date = dateFormat({ dateStyle: "medium", timeStyle: "short" })

export function useOrganizerPayoutsViewModel(sessionId: number, accountId: number) {
  const client = useQueryClient()
  const [page, setPage] = useState(0)
  const [intent, setIntent] = useState(() => payoutRepository.readIntent(accountId))
  const [amount, setAmount] = useState(() => String(intent?.amountKzt ?? ""))
  const [consent, setConsent] = useState(Boolean(intent))
  const balance = useQuery(payoutRepository.balanceQuery(sessionId))
  const history = useQuery(payoutRepository.historyQuery(sessionId, page))
  const account = useQuery(payoutAccountRepository.accountQuery(sessionId))
  const mutation = useMutation({
    mutationFn: () => payoutRepository.request(client, sessionId, accountId, amount.trim().replace(",", ".")),
    onSuccess: () => { setAmount(""); setConsent(false); setPage(0) },
    onSettled: () => {
      const pending = payoutRepository.readIntent(accountId)
      setIntent(pending)
      if (pending) { setAmount(String(pending.amountKzt)); setConsent(true) }
    },
  })
  const value = balance.data
  const normalized = amount.trim().replace(",", ".")
  const valid = /^\d{1,17}(\.\d{1,2})?$/.test(normalized) && Number(normalized) > 0 && Number(normalized) <= (value?.availableKzt ?? 0)
  const canSubmit = !mutation.isPending && (Boolean(intent) || (valid && consent && Boolean(account.data) && !account.isError && !balance.isError && !value?.reconciliationPending))
  const error = (e: Error | null) => e ? t(e.message) : null
  return {
    balance: value ? {
      available: money.format(value.availableKzt),
      metrics: [
        { label: t("Pending payouts"), value: money.format(value.pendingPayoutKzt) },
        { label: t("Total paid out"), value: money.format(value.paidOutKzt) },
        { label: t("Withheld funds"), value: money.format(value.withheldKzt) },
        { label: t("Balance deficit"), value: money.format(value.deficitKzt) },
      ],
      blocked: value.reconciliationPending,
    } : null,
    account: account.data,
    accountLoading: account.isPending,
    balanceLoading: balance.isPending,
    historyLoading: history.isPending,
    balanceError: error(balance.error), historyError: error(history.error), accountError: error(account.error),
    retry: () => { void balance.refetch(); void history.refetch(); void account.refetch() },
    rows: (history.data ?? []).slice(0, payoutPageSize).map(p => ({
      id: p.id, amount: money.format(p.amountKzt), status: statusText(p.status),
      date: date.format(new Date(p.requestedAt)),
      completed: p.completedAt ? date.format(new Date(p.completedAt)) : null,
      reference: p.providerReference, failure: p.failureReason,
    })),
    page: page + 1, previous: page > 0 ? () => setPage(p => p - 1) : null,
    next: (history.data?.length ?? 0) > payoutPageSize ? () => setPage(p => p + 1) : null,
    amount, setAmount, consent, setConsent, canSubmit,
    locked: Boolean(intent) || mutation.isPending,
    retrying: Boolean(intent), submitting: mutation.isPending,
    validation: amount && !valid && !intent ? t("Enter a positive amount within your available balance (up to two decimal places).") : null,
    submitError: error(mutation.error),
    success: mutation.isSuccess ? t("Payout request received. Check its status in the history below.") : null,
    submit: () => { if (canSubmit) mutation.mutate() },
  }
}

