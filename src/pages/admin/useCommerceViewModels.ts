import { t } from "@/i18n/locale"
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { adminRepository, type FeeSetting } from "@/admin/adminRepository"
import type {
  AdminOrderAction,
  AdminOrderQuery,
  PromotionActivityQuery,
} from "@/api/orders"
import type {
  ActivationRecord,
  ActivationStatus,
  AdminPayment,
  AdminPaymentQuery,
  OperationResolutionRequest,
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
  const [selected, select] = useState(params.get("orderId"))
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
  const labels = useCommerceLabels(
    sessionId,
    query.data?.items.map((item) => ({
      eventId: item.eventId,
      userId: item.ownerId,
    })) ?? []
  )
  return { filters, query: adminQueryView(query), selected, select, labels }
}

export function useAdminPaymentsViewModel(
  sessionId: number,
  params: URLSearchParams,
  listEnabled: boolean
) {
  const filters = useAdminFilters<AdminPaymentQuery>({
    status: filterValue(paymentStatuses, params.get("status")),
    eventId: params.get("eventId") ?? undefined,
  })
  const paymentParam = params.get("paymentId")
  const [selected, select] = useState<string | null>(paymentParam)
  const query = useQuery({
    ...adminRepository.payments(sessionId, filters.filters, filters.page),
    enabled: listEnabled,
  })
  const labels = useCommerceLabels(
    sessionId,
    listEnabled
      ? (query.data?.items.map((item) => ({
          eventId: item.eventId,
          userId: item.payerId,
        })) ?? [])
      : []
  )
  return { filters, query: adminQueryView(query), selected, select, labels }
}

export function useActivationsViewModel(sessionId: number) {
  const filters = useAdminFilters<{ status?: ActivationStatus }>({})
  const query = useQuery(
    adminRepository.activations(sessionId, filters.filters.status, filters.page)
  )
  const [selected, select] = useState<ActivationRecord | null>(null)
  const labels = useCommerceLabels(
    sessionId,
    query.data?.items.map((item) => ({
      eventId: item.eventId,
      userId: item.organizerId,
    })) ?? []
  )
  return { filters, query: adminQueryView(query), selected, select, labels }
}

export function useModerateActivationViewModel(
  sessionId: number,
  record: ActivationRecord,
  onSuccess: () => void
) {
  const client = useQueryClient()
  const [validation, setValidation] = useState<string | null>(null)
  const action = record.status === "SUSPENDED" ? "reinstate" : "suspend"
  const mutation = useMutation({
    mutationFn: (reason: string) =>
      adminRepository.moderateActivation(
        client,
        sessionId,
        record.eventId,
        reason,
        action
      ),
    onSuccess,
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mutation.isPending || record.status === "PENDING") return
    const reason = String(
      new FormData(event.currentTarget).get("reason") ?? ""
    ).trim()
    setValidation(reason ? null : t("Enter a reason."))
    if (reason) mutation.mutate(reason)
  }

  return {
    submit,
    pending: mutation.isPending,
    error: validation ?? adminError(mutation.error),
  }
}

export function useFeeSettingViewModel(sessionId: number, setting: FeeSetting) {
  const client = useQueryClient()
  const query = useQuery(adminRepository.feeSetting(sessionId, setting))
  const [draft, setDraft] = useState<string | null>(null)
  const [validation, setValidation] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: (amount: string) =>
      adminRepository.saveFeeSetting(client, sessionId, setting, amount),
    onSuccess: () => {
      setDraft(null)
      setValidation(null)
    },
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mutation.isPending || draft === null) return
    const value = draft.trim().replace(",", ".")
    const valid =
      setting === "activation-fee"
        ? /^\d{1,17}(?:\.\d{1,2})?$/.test(value) && /[1-9]/.test(value)
        : /^\d{1,2}(?:\.\d{1,2})?$/.test(value)
    if (!valid) {
      setValidation(
        setting === "activation-fee"
          ? t("Enter a positive fee in tenge with up to two decimal places.")
          : t(
              "Enter a percentage from 0 to 99.99 with up to two decimal places."
            )
      )
      return
    }
    mutation.mutate(value)
  }

  return {
    query: adminQueryView(query),
    submit,
    value: draft ?? (query.data ? String(query.data.value) : ""),
    change: (value: string) => {
      setDraft(value)
      setValidation(null)
      mutation.reset()
    },
    canSave:
      draft !== null &&
      draft !== String(query.data?.value) &&
      !mutation.isPending,
    pending: mutation.isPending,
    error: validation ?? adminError(mutation.error),
    success: mutation.isSuccess ? t("Fee saved.") : null,
  }
}

function useCommerceLabels(
  sessionId: number,
  rows: { eventId: string | null; userId: number }[]
) {
  const ids = [...new Set(rows.map((row) => row.userId))].sort((a, b) => a - b)
  const users = useQuery({
    ...adminRepository.commerceUsers(sessionId, ids),
    enabled: ids.length > 0,
  })
  const eventIds = [
    ...new Set(rows.flatMap((row) => (row.eventId ? [row.eventId] : []))),
  ]
  const events = useQueries({
    queries: eventIds.map((id) => ({
      ...adminRepository.event(sessionId, id),
      staleTime: 60_000,
    })),
  })
  return {
    users: new Map(users.data?.map((user) => [user.id, user.login])),
    events: new Map(
      events.flatMap(({ data }) =>
        data ? [[data.id, data.title] as const] : []
      )
    ),
  }
}

export function usePaymentOperationsViewModel(sessionId: number) {
  return adminQueryView(useQuery(adminRepository.paymentOperations(sessionId)))
}

export function usePaymentDetailsViewModel(
  sessionId: number,
  paymentId: string
) {
  const query = useQuery(adminRepository.payment(sessionId, paymentId))
  const labels = useCommerceLabels(
    sessionId,
    query.data
      ? [
          { eventId: query.data.eventId, userId: query.data.payerId },
          { eventId: null, userId: query.data.organizerId },
        ]
      : []
  )
  return { query: adminQueryView(query), labels }
}

export function usePaymentResolutionViewModel(
  sessionId: number,
  payment: AdminPayment | undefined,
  onSuccess: () => void
) {
  const client = useQueryClient()
  const [selection, select] = useState<{
    resolution: OperationResolutionRequest["resolution"]
    operationId: string | null
    operationAt: string | null
    operationState: string | null
  }>()
  const [validation, setValidation] = useState<string | null>(null)
  const paymentId = payment?.id
  const choice =
    payment &&
    selection &&
    selection.operationId === payment.bankOperationId &&
    selection.operationAt === payment.bankOperationAt &&
    selection.operationState === payment.operationState &&
    payment.resolutions.includes(selection.resolution)
      ? selection.resolution
      : undefined
  const mutation = useMutation({
    mutationFn: (
      request: OperationResolutionRequest & { paymentId: string }
    ) => {
      const { paymentId, ...resolution } = request
      return adminRepository.resolvePayment(
        client,
        sessionId,
        paymentId,
        resolution
      )
    },
    onSuccess,
    onError: (_error, request) =>
      client.invalidateQueries({
        queryKey: adminRepository.payment(sessionId, request.paymentId)
          .queryKey,
      }),
  })
  function setChoice(value: string) {
    const resolution = payment?.resolutions.find((option) => option === value)
    select(
      payment && resolution
        ? {
            resolution,
            operationId: payment.bankOperationId,
            operationAt: payment.bankOperationAt,
            operationState: payment.operationState,
          }
        : undefined
    )
    setValidation(null)
    mutation.reset()
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mutation.isPending || !paymentId || !choice || !selection) return
    const data = new FormData(event.currentTarget)
    const reference = String(data.get("reference") ?? "").trim()
    if (!reference || data.get("confirmed") !== "on") {
      setValidation(
        t("Enter a bank support reference and confirm the bank outcome.")
      )
      return
    }
    setValidation(null)
    mutation.mutate({
      paymentId,
      expectedOperationId: selection.operationId,
      expectedOperationAt: selection.operationAt,
      bankSupportReference: reference,
      resolution: choice,
    })
  }
  return {
    submit,
    choice,
    setChoice,
    pending: mutation.isPending,
    error:
      validation ??
      adminError(mutation.error) ??
      (selection && !choice
        ? t(
            "The payment operation changed. Review the current details before resolving."
          )
        : null),
  }
}

export function useOrderDetailsViewModel(sessionId: number, orderId: string) {
  const client = useQueryClient()
  const query = useQuery(adminRepository.order(sessionId, orderId))
  const [selected, select] = useState<AdminOrderAction | null>(null)
  const [validation, setValidation] = useState<string | null>(null)
  const cases = useQuery(
    adminRepository.supportCases(sessionId, { orderId }, 0, 5)
  )
  const labels = useCommerceLabels(
    sessionId,
    query.data
      ? [
          {
            eventId: null,
            userId: query.data.order.ownerUserId,
          },
        ]
      : []
  )
  const mutation = useMutation({
    mutationFn: (action: AdminOrderAction & { reason?: string }) =>
      adminRepository.changeOrder(client, sessionId, orderId, action),
    onSuccess: () => select(null),
    onError: () => query.refetch(),
  })
  const allowed =
    query.data?.actions.some(
      (action) =>
        action.action === selected?.action &&
        action.ticketId === selected.ticketId
    ) ?? false
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !allowed || mutation.isPending) return
    const reason = String(
      new FormData(event.currentTarget).get("reason") ?? ""
    ).trim()
    if (selected.action !== "RESEND_TICKET" && !reason) {
      setValidation(t("Enter a reason."))
      return
    }
    setValidation(null)
    mutation.mutate({ ...selected, ...(reason ? { reason } : {}) })
  }
  return {
    query: adminQueryView(query),
    cases: adminQueryView(cases),
    buyer: query.data
      ? labels.users.get(query.data.order.ownerUserId)
      : undefined,
    selected,
    select: (action: AdminOrderAction | null) => {
      mutation.reset()
      setValidation(null)
      select(action)
    },
    allowed,
    submit,
    pending: mutation.isPending,
    error: validation ?? adminError(mutation.error),
    success: mutation.isSuccess ? t("Order action recorded.") : null,
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
    success: download.isSuccess ? t("CSV download started.") : null,
  }
}
