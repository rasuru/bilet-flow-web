import { requestEmpty, requestJson, withQuery } from "@/api/client"
import type { OffsetQuery } from "@/api/client"
import type { SupportCategory, SupportStatus } from "@/api/support"

type SupportIssueCategory = SupportCategory | "OTHER"

export type AdminSupportCase = {
  id: string
  type: "ATTENDEE_SUPPORT" | "PLATFORM_SUPPORT"
  requesterUserId: number
  subject: string
  category: SupportIssueCategory
  eventId: string | null
  orderId: string | null
  ticketId: string | null
  status: SupportStatus
  assignedSupportUserId: number | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  escalatedAt: string | null
}

export type AdminSupportCaseDetail = {
  supportCase: AdminSupportCase
  messages: {
    id: string
    authorUserId: number
    authorType: "REQUESTER" | "SUPPORT_AGENT"
    content: string
    sentAt: string
  }[]
}

export type AdminSupportCaseQuery = OffsetQuery & {
  status?: SupportStatus
  eventId?: string
  orderId?: string
  escalatedOnly?: boolean
}

export type OpenPlatformSupportCaseRequest = {
  subject: string
  category: SupportIssueCategory
  message: string
  eventId?: string
}

const adminSupportCasesPath = "/api/admin/support-cases"
const supportCasesPath = "/api/support/cases"

export function listAdminSupportCases(
  token: string,
  query: AdminSupportCaseQuery = {}
) {
  return requestJson<AdminSupportCase[]>(
    withQuery(adminSupportCasesPath, query),
    { token }
  )
}

export function getAdminSupportCase(token: string, caseId: string) {
  return requestJson<AdminSupportCaseDetail>(
    `${adminSupportCasesPath}/${encodeURIComponent(caseId)}`,
    { token }
  )
}

export function openPlatformSupportCase(
  token: string,
  json: OpenPlatformSupportCaseRequest
) {
  return requestJson<{ caseId: string }>(`${supportCasesPath}/platform`, {
    token,
    method: "POST",
    json,
  })
}

export function escalateSupportCase(token: string, caseId: string) {
  return requestEmpty(
    `${supportCasesPath}/${encodeURIComponent(caseId)}/escalate`,
    { token, method: "POST" }
  )
}
