import { requestJson, withQuery } from "@/api/client"
import { eventPath } from "@/api/events"

export type HistoryCategory = "EVENT" | "TICKETING" | "CHECK_IN" | "PROMOTIONS" | "REFUNDS" | "PAYMENTS" | "SUPPORT"
export type HistoryEntry = {
  id: string
  timestamp: string
  actorUserId: number | null
  category: HistoryCategory
  action: string
  entityType: string
  entityId: string | null
  description: string
}
export type HistoryQuery = { from?: string; to?: string; category?: HistoryCategory; page: number; size: number }
export type HistoryPage = { entries: HistoryEntry[]; page: number; size: number; total: number }

export function getEventHistory(token: string, eventId: string, query: HistoryQuery) {
  return requestJson<HistoryPage>(withQuery(`${eventPath(eventId)}/history`, query), { token })
}

