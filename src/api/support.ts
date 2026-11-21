// Mock service contract. Replace this implementation with HTTP requests when the
// Support & Case Management API is available; callers do not depend on storage.
export type SupportCategory =
  | "TICKET_DELIVERY" | "PAYMENT" | "REFUND" | "SEATING"
  | "EVENT_INFORMATION" | "CHECK_IN" | "ACCOUNT" | "TECHNICAL"
export type SupportStatus = "OPEN" | "IN_PROGRESS" | "WAITING_FOR_CUSTOMER" | "RESOLVED"
export type SupportContext = { eventId?: string; orderId?: string; ticketId?: string }
export type SupportMessage = {
  id: string
  author: "CUSTOMER" | "STAFF"
  content: string
  createdAt: string
}
export type SupportCase = {
  id: string
  scope: "MY_REQUESTS" | "EVENT_INBOX" | "PLATFORM_INBOX"
  subject: string
  category: SupportCategory
  recipient?: "ORGANIZER" | "PLATFORM"
  status: SupportStatus
  context: SupportContext
  assignedTo: string | null
  createdAt: string
  updatedAt: string
  messages: SupportMessage[]
}
export type CreateSupportCase = {
  subject: string
  category: SupportCategory
  message: string
  context: SupportContext
  recipient: "ORGANIZER" | "PLATFORM"
}

// Session-specific demo storage deliberately avoids presenting a shared/global
// inbox as real authorization. The backend must enforce event ownership and access.
const key = (accountId: number) => `biletflow:mock-support:v1:${accountId}`
const now = () => new Date().toISOString()
const uid = () => crypto.randomUUID()
function samples(): SupportCase[] {
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  return [
    { id: "demo-101", scope: "MY_REQUESTS", subject: "I haven't received my ticket",
      category: "TICKET_DELIVERY", status: "WAITING_FOR_CUSTOMER", context: {},
      assignedTo: "Event support", createdAt: yesterday, updatedAt: yesterday,
      messages: [
        { id: "demo-m1", author: "CUSTOMER", content: "My confirmation arrived, but I can't find my ticket.", createdAt: yesterday },
        { id: "demo-m2", author: "STAFF", content: "Please check My tickets in your account. Let us know if it's still missing.", createdAt: yesterday },
      ] },
    { id: "demo-102", scope: "EVENT_INBOX", subject: "Question about accessible seating",
      category: "SEATING", status: "OPEN", context: {}, assignedTo: null,
      createdAt: yesterday, updatedAt: yesterday,
      messages: [{ id: "demo-m3", author: "CUSTOMER", content: "Is there step-free access to the seating area?", createdAt: yesterday }] },
    { id: "demo-103", scope: "PLATFORM_INBOX", subject: "Problem with paid sales activation",
      category: "TECHNICAL", status: "IN_PROGRESS", context: {}, assignedTo: "Platform support",
      createdAt: yesterday, updatedAt: yesterday,
      messages: [{ id: "demo-m4", author: "CUSTOMER", content: "I can't complete activation for my event.", createdAt: yesterday }] },
  ]
}
function read(accountId: number): SupportCase[] {
  const saved = localStorage.getItem(key(accountId))
  if (!saved) return samples()
  const value: unknown = JSON.parse(saved)
  if (!Array.isArray(value)) throw new Error("Demo support data is invalid.")
  return value as SupportCase[]
}
function write(accountId: number, cases: SupportCase[]) {
  localStorage.setItem(key(accountId), JSON.stringify(cases))
}
export async function listSupportCases(accountId: number): Promise<SupportCase[]> {
  return structuredClone(read(accountId))
}
export async function getSupportCase(accountId: number, caseId: string): Promise<SupportCase | null> {
  return structuredClone(read(accountId).find((item) => item.id === caseId) ?? null)
}
export async function createSupportCase(accountId: number, request: CreateSupportCase): Promise<SupportCase> {
  const timestamp = now()
  const item: SupportCase = {
    id: uid(), scope: "MY_REQUESTS", subject: request.subject,
    category: request.category, recipient: request.recipient, status: "OPEN", context: request.context,
    assignedTo: null, createdAt: timestamp, updatedAt: timestamp,
    messages: [{ id: uid(), author: "CUSTOMER", content: request.message, createdAt: timestamp }],
  }
  write(accountId, [item, ...read(accountId)])
  return structuredClone(item)
}
export async function sendSupportMessage(accountId: number, caseId: string, content: string): Promise<void> {
  const cases = read(accountId)
  const item = cases.find((entry) => entry.id === caseId)
  if (!item) throw new Error("Support case not found.")
  if (item.status === "RESOLVED") throw new Error("This case is resolved.")
  const timestamp = now()
  item.messages.push({ id: uid(), author: item.scope === "MY_REQUESTS" ? "CUSTOMER" : "STAFF", content, createdAt: timestamp })
  item.updatedAt = timestamp
  if (item.scope === "MY_REQUESTS") item.status = "OPEN"
  else item.status = "WAITING_FOR_CUSTOMER"
  write(accountId, cases)
}
export async function updateSupportCase(accountId: number, caseId: string, changes: { status?: SupportStatus; assignedTo?: string | null }): Promise<void> {
  const cases = read(accountId)
  const item = cases.find((entry) => entry.id === caseId)
  if (!item) throw new Error("Support case not found.")
  if (item.scope === "MY_REQUESTS") throw new Error("Only staff can manage cases.")
  if (changes.status !== undefined) item.status = changes.status
  if (changes.assignedTo !== undefined) item.assignedTo = changes.assignedTo
  item.updatedAt = now()
  write(accountId, cases)
}


