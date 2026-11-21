import { requestJson, withQuery } from "@/api/client"
import type { OffsetQuery } from "@/api/client"
import { eventPath } from "@/api/events"

export type EventReportStatus = "OPEN" | "DISMISSED" | "CONFIRMED"

export type EventReport = {
  id: string
  eventId: string
  reporterId: number
  reason: string
  submittedAt: string
  status: EventReportStatus
  reviewerId: number | null
  reviewedAt: string | null
  reviewNote: string | null
}

export type EventReportQuery = OffsetQuery & {
  eventId?: string
  status?: EventReportStatus
}

export type ReviewEventReportRequest = {
  decision: "DISMISS" | "CONFIRM"
  note: string
}

const adminReportsPath = "/api/admin/event-reports"

function adminReportPath(reportId: string) {
  return `${adminReportsPath}/${encodeURIComponent(reportId)}`
}

export function submitEventReport(
  token: string,
  eventId: string,
  reason: string
) {
  return requestJson<{ reportId: string }>(`${eventPath(eventId)}/reports`, {
    token,
    method: "POST",
    json: { reason },
  })
}

export function listEventReports(token: string, query: EventReportQuery = {}) {
  return requestJson<EventReport[]>(withQuery(adminReportsPath, query), {
    token,
  })
}

export function getEventReport(token: string, reportId: string) {
  return requestJson<EventReport>(adminReportPath(reportId), { token })
}

export function reviewEventReport(
  token: string,
  reportId: string,
  json: ReviewEventReportRequest
) {
  return requestJson<EventReport>(`${adminReportPath(reportId)}/review`, {
    token,
    method: "POST",
    json,
  })
}
