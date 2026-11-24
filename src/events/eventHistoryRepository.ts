import { queryOptions, skipToken } from "@tanstack/react-query"
import { getEventHistory, type HistoryQuery } from "@/api/eventHistory"
import { sessionRepository } from "@/auth/sessionRepository"

export const eventHistoryRepository = {
  query(sessionId: number, eventId: string, filters: HistoryQuery | null) {
    return queryOptions({
      queryKey: ["managed-events", sessionId, eventId, "history", filters],
      queryFn: filters ? () => sessionRepository.authenticatedRequest(sessionId, token => getEventHistory(token, eventId, filters)) : skipToken,
      retry: false,
      refetchInterval: filters ? 30_000 : false,
    })
  },
}

