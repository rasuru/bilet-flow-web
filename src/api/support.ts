import { API_BASE_URL, requestJson } from "@/api/client"

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

export function createSupportSocketTicket(token: string, caseId: string) {
  return requestJson<{ ticket: string }>(`${casePath(caseId)}/socket-ticket`, {
    token,
    method: "POST",
  })
}

export function openSupportSocket() {
  const endpoint = new URL(
    `${API_BASE_URL}/websocket/support`,
    window.location.href
  )
  endpoint.protocol = endpoint.protocol === "https:" ? "wss:" : "ws:"
  return new WebSocket(endpoint)
}

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

export type ResolutionAction = "RESEND_TICKET" | "REVERSE_CHECK_IN" | "CANCEL_FREE_ORDER" | "REQUEST_REFUND"
export type AvailableResolutionAction = { action: ResolutionAction; ticketId?: string | null }
export type ResolutionRequest = AvailableResolutionAction & { reason?: string }
export type ResolutionTicket = { id: string; ticketTypeId: string; seatId: string | null; attendeeEmail: string; status: string }
export type ResolutionPayment = import("@/api/payments").Payment
export type ResolutionContext = {
  caseId: string
  requesterUserId: number
  requesterEmail: string | null
  eventId: string | null
  event: { title: string; startsAt: string; endsAt: string; venue: string | null; address: string | null; cancelled: boolean; suspended: boolean } | null
  linkedTicketId: string | null
  order: { id: string; eventId: string; ownerUserId: number; status: string; amountKzt: number; paymentId: string | null; refundState: string | null; refundId: string | null; createdAt: string; tickets: ResolutionTicket[] } | null
  payment: ResolutionPayment | null
  activation: { status: string; payment: ResolutionPayment | null } | null
  actions: AvailableResolutionAction[]
  history: { id: string; caseId: string; eventId: string | null; occurredAt: string; actorUserId: number; action: string; details: string | null }[]
}
export function getResolutionContext(token: string, caseId: string) {
  return requestJson<ResolutionContext>(`${casePath(caseId)}/context`, { token })
}
export function executeResolutionAction(token: string, caseId: string, json: ResolutionRequest) {
  return requestJson<ResolutionContext>(`${casePath(caseId)}/actions`, { token, method: "POST", json })
}

