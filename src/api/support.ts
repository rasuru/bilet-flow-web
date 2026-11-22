import { requestJson } from "@/api/client"

export type SupportCategory =
  | "TICKET_DELIVERY"
  | "PAYMENT"
  | "REFUND"
  | "SEATING"
  | "EVENT_INFORMATION"
  | "CHECK_IN"
  | "ACCOUNT"
  | "TECHNICAL"
  | "OTHER"
export type SupportStatus =
  "OPEN" | "IN_PROGRESS" | "WAITING_FOR_CUSTOMER" | "RESOLVED"
export type SupportContext = {
  eventId?: string | null
  orderId?: string | null
  ticketId?: string | null
}
export type SupportType = "ATTENDEE_SUPPORT" | "PLATFORM_SUPPORT"
export type SupportMessage = {
  id: string
  authorUserId: number
  authorType: "REQUESTER" | "SUPPORT_AGENT"
  content: string
  sentAt: string
}
export type SupportCase = Required<SupportContext> & {
  id: string
  type: SupportType
  requesterUserId: number
  subject: string
  category: SupportCategory
  status: SupportStatus
  assignedSupportUserId: number | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  escalatedAt: string | null
  messages: SupportMessage[]
}
export type CreateSupportCase = SupportContext & {
  type: SupportType
  subject: string
  category: SupportCategory
  initialMessage: string
}

const casesPath = "/api/support/cases"
const casePath = (id: string) => `${casesPath}/${encodeURIComponent(id)}`

export function listSupportCases(token: string) {
  return requestJson<SupportCase[]>(casesPath, { token })
}
export function getSupportCase(token: string, caseId: string) {
  return requestJson<SupportCase>(casePath(caseId), { token })
}
export function createSupportCase(token: string, json: CreateSupportCase) {
  return requestJson<SupportCase>(casesPath, { token, method: "POST", json })
}
export function sendSupportMessage(
  token: string,
  caseId: string,
  content: string
) {
  return requestJson<SupportCase>(`${casePath(caseId)}/messages`, {
    token,
    method: "POST",
    json: { content },
  })
}
export function changeSupportStatus(
  token: string,
  caseId: string,
  status: SupportStatus
) {
  return requestJson<SupportCase>(`${casePath(caseId)}/status`, {
    token,
    method: "PATCH",
    json: { status },
  })
}
export function assignSupportCase(
  token: string,
  caseId: string,
  supportUserId: number
) {
  return requestJson<SupportCase>(`${casePath(caseId)}/assignment`, {
    token,
    method: "PATCH",
    json: { supportUserId },
  })
}
