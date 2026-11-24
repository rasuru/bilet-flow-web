import { queryOptions } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import {
  getOrganizerAnalytics,
  getOrganizerAnalyticsOverview,
  type OrganizerAnalyticsFilters,
} from "@/api/organizerAnalytics"
import { sessionRepository } from "@/auth/sessionRepository"

function retryRead(count: number, error: Error) {
  return count < 2 && (!(error instanceof ApiError) || error.status >= 500)
}

export const organizerAnalyticsRepository = {
  overviewQuery(sessionId: number) {
    return queryOptions({
      queryKey: ["managed-events", sessionId, "analytics-overview"],
      queryFn: () =>
        sessionRepository.authenticatedRequest(
          sessionId,
          getOrganizerAnalyticsOverview
        ),
      retry: retryRead,
      staleTime: 15_000,
    })
  },

  reportQuery(
    sessionId: number,
    eventId: string,
    filters: OrganizerAnalyticsFilters
  ) {
    return queryOptions({
      queryKey: ["managed-events", sessionId, eventId, "analytics", filters],
      queryFn: () =>
        sessionRepository.authenticatedRequest(sessionId, (token) =>
          getOrganizerAnalytics(token, eventId, filters)
        ),
      retry: retryRead,
      staleTime: 15_000,
    })
  },
}
