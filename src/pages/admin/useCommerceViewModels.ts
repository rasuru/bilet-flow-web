import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { adminRepository } from "@/admin/adminRepository"
import type {
  AdminOrder,
  AdminOrderQuery,
  PromotionActivityQuery,
} from "@/api/orders"
import type {
  ActivationRecord,
  ActivationStatus,
  AdminPayment,
  AdminPaymentQuery,
} from "@/api/payments"

import {
  adminError,
  filterValue,
  orderStatuses,
  paymentStatuses,
} from "./adminPresentation"
import { adminQueryView } from "./adminQueryView"
import { useAdminFilters } from "./useAdminFilters"

export function useAdminOrdersViewModel(
  sessionId: number,
  params: URLSearchParams,
  promotedOnly: boolean
) {
  const filters = useAdminFilters<AdminOrderQuery & PromotionActivityQuery>({
    eventId: params.get("eventId") ?? undefined,
    orderId: params.get("orderId") ?? undefined,
    status: filterValue(orderStatuses, params.get("status")),
  })
  const [selected, select] = useState<AdminOrder | null>(null)
  const { eventId, orderId, ownerId, status, promotionId } = filters.filters
  const query = useQuery(
    promotedOnly
      ? adminRepository.promotions(
          sessionId,
          { eventId, status, promotionId },
          filters.page
        )
      : adminRepository.orders(
          sessionId,
          { eventId, status, orderId, ownerId },
          filters.page
        )
  )
  return { filters, query: adminQueryView(query), selected, select }
}

export function useAdminPaymentsViewModel(
  sessionId: number,
  params: URLSearchParams
) {
  const filters = useAdminFilters<AdminPaymentQuery>({
    status: filterValue(paymentStatuses, params.get("status")),
    eventId: params.get("eventId") ?? undefined,
  })
  const [selected, select] = useState<AdminPayment | null>(null)
  const [initialPaymentId, setInitialPaymentId] = useState(
    params.get("paymentId")
  )
  const query = useQuery(
    adminRepository.payments(sessionId, filters.filters, filters.page)
  )
  return {
    filters,
    query: adminQueryView(query),
    selected:
      selected ??
      query.data?.items.find((item) => item.id === initialPaymentId),
    select: (payment: AdminPayment | null) => {
      setInitialPaymentId(null)
      select(payment)
    },
  }
}

export function useActivationsViewModel(sessionId: number) {
  const filters = useAdminFilters<{ status?: ActivationStatus }>({})
  const query = useQuery(
    adminRepository.activations(sessionId, filters.filters.status, filters.page)
  )
  const [selected, select] = useState<ActivationRecord | null>(null)
  return { filters, query: adminQueryView(query), selected, select }
}

export function useSuspendActivationViewModel(
  sessionId: number,
  record: ActivationRecord,
  onSuccess: () => void
) {
  const client = useQueryClient()
  const [validation, setValidation] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: (reason: string) =>
      adminRepository.suspendActivation(
        client,
        sessionId,
        record.eventId,
        reason
      ),
    onSuccess,
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mutation.isPending || record.status !== "ACTIVE") return
    const reason = String(
      new FormData(event.currentTarget).get("reason") ?? ""
    ).trim()
    setValidation(reason ? null : "Enter a suspension reason.")
    if (reason) mutation.mutate(reason)
  }

  return {
    submit,
    pending: mutation.isPending,
    error: validation ?? adminError(mutation.error),
  }
}

export function useActivationFeeViewModel(sessionId: number) {
  const client = useQueryClient()
  const query = useQuery(adminRepository.activationFee(sessionId))
  const [draft, setDraft] = useState<string | null>(null)
  const [validation, setValidation] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: (amount: string) =>
      adminRepository.saveActivationFee(client, sessionId, amount),
    onSuccess: () => {
      setDraft(null)
      setValidation(null)
    },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mutation.isPending || draft === null) return
    if (!/^\d{1,17}(?:\.\d{1,2})?$/.test(draft) || !/[1-9]/.test(draft)) {
      setValidation(
        "Enter a positive fee in KZT with up to two decimal places."
      )
      return
    }
    mutation.mutate(draft)
  }

  return {
    query: adminQueryView(query),
    submit,
    value: draft ?? (query.data ? String(query.data.amountKzt) : ""),
    change: (value: string) => {
      setDraft(value)
      setValidation(null)
      mutation.reset()
    },
    canSave:
      draft !== null &&
      draft !== String(query.data?.amountKzt) &&
      !mutation.isPending,
    pending: mutation.isPending,
    error: validation ?? adminError(mutation.error),
    success: mutation.isSuccess ? "Activation fee updated." : null,
  }
}

export function useOperationsExportViewModel(sessionId: number) {
  const download = useMutation({
    mutationFn: (eventId?: string) =>
      adminRepository.operationsReport(sessionId, eventId),
    onSuccess: (file) => {
      const url = URL.createObjectURL(file)
      const link = document.createElement("a")
      link.href = url
      link.download = "operations.csv"
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
    },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (download.isPending) return
    const eventId = String(
      new FormData(event.currentTarget).get("eventId") ?? ""
    ).trim()
    download.mutate(eventId || undefined)
  }

  return {
    submit,
    pending: download.isPending,
    error: adminError(download.error),
    success: download.isSuccess ? "CSV download started." : null,
  }
}
