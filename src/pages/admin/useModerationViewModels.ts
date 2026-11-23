import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { adminRepository } from "@/admin/adminRepository"
import type { ReviewEventReportRequest } from "@/api/eventReports"
import type { AdminEventQuery } from "@/api/events"
import type { AdminSupportCaseQuery } from "@/api/supportAdministration"

import { adminError, filterValue, reportStatuses } from "./adminPresentation"
import { adminQueryView } from "./adminQueryView"
import { useAdminFilters } from "./useAdminFilters"

export function useEventListViewModel(
  sessionId: number,
  params: URLSearchParams
) {
  const filters = useAdminFilters<AdminEventQuery>({})
  const [selected, select] = useState(params.get("eventId"))
  const query = useQuery(
    adminRepository.events(
      sessionId,
      {
        ...filters.filters,
        search: filters.filters.search?.trim() || undefined,
      },
      filters.page
    )
  )

  return { filters, query: adminQueryView(query), selected, select }
}

export function useEventModerationViewModel(
  sessionId: number,
  eventId: string
) {
  const client = useQueryClient()
  const event = useQuery(adminRepository.event(sessionId, eventId))
  const canModerate = Boolean(event.data && event.data.status !== "CANCELLED")
  const reinstating = event.data?.status === "SUSPENDED"
  const [confirming, setConfirming] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [validation, setValidation] = useState<string | null>(null)
  const action = useMutation({
    mutationFn: (command: { reason: string } | "reinstate") =>
      adminRepository.moderateEvent(client, sessionId, eventId, command),
    onSuccess: (_, command) => {
      setConfirming(false)
      setSuccess(
        command === "reinstate" ? "Event reinstated." : "Event suspended."
      )
    },
  })

  function submit(form: FormEvent<HTMLFormElement>) {
    form.preventDefault()
    if (action.isPending || !canModerate) return
    if (reinstating) {
      action.mutate("reinstate")
      return
    }
    const reason = String(
      new FormData(form.currentTarget).get("reason") ?? ""
    ).trim()
    setValidation(reason ? null : "Enter a suspension reason.")
    if (reason) action.mutate({ reason })
  }

  return {
    query: adminQueryView(event),
    canModerate,
    reinstating,
    confirming,
    begin: () => {
      action.reset()
      setValidation(null)
      setSuccess(null)
      setConfirming(true)
    },
    cancel: () => {
      action.reset()
      setValidation(null)
      setConfirming(false)
    },
    submit,
    pending: action.isPending,
    error: validation ?? adminError(action.error),
    success,
  }
}

export function useReportListViewModel(
  sessionId: number,
  params: URLSearchParams
) {
  const filters = useAdminFilters({
    status: filterValue(reportStatuses, params.get("status")),
    eventId: params.get("eventId") ?? "",
  })
  const [selected, select] = useState(params.get("reportId"))
  const query = useQuery(
    adminRepository.reports(
      sessionId,
      {
        status: filters.filters.status,
        eventId: filters.filters.eventId.trim() || undefined,
      },
      filters.page
    )
  )

  return { filters, query: adminQueryView(query), selected, select }
}

export function useEventReportViewModel(sessionId: number, reportId: string) {
  const client = useQueryClient()
  const report = useQuery(adminRepository.report(sessionId, reportId))
  const [validation, setValidation] = useState<string | null>(null)
  const review = useMutation({
    mutationFn: (changes: ReviewEventReportRequest) =>
      adminRepository.reviewReport(client, sessionId, reportId, changes),
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (review.isPending || report.data?.status !== "OPEN") return
    const values = new FormData(event.currentTarget)
    const decision = values.get("decision")
    const note = String(values.get("note") ?? "").trim()
    setValidation(note ? null : "Enter a review note.")
    if ((decision === "CONFIRM" || decision === "DISMISS") && note)
      review.mutate({ decision, note })
  }

  return {
    query: adminQueryView(report),
    canReview: report.data?.status === "OPEN",
    submit,
    pending: review.isPending,
    error: validation ?? adminError(review.error),
    success: review.isSuccess ? "Review saved." : null,
  }
}

export function useSupportListViewModel(
  sessionId: number,
  params: URLSearchParams
) {
  const filters = useAdminFilters<AdminSupportCaseQuery>({
    escalatedOnly: params.get("escalatedOnly") === "true",
    eventId: params.get("eventId") ?? undefined,
  })
  const [selected, select] = useState(params.get("caseId"))
  const query = useQuery(
    adminRepository.supportCases(
      sessionId,
      {
        ...filters.filters,
        eventId: filters.filters.eventId?.trim() || undefined,
      },
      filters.page
    )
  )

  return { filters, query: adminQueryView(query), selected, select }
}

export function useAdminSupportCaseViewModel(
  sessionId: number,
  caseId: string
) {
  return adminQueryView(
    useQuery(adminRepository.supportCase(sessionId, caseId))
  )
}
