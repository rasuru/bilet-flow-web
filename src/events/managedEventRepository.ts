import { queryOptions, skipToken } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import { getManagedEvent, listMyEvents } from "@/api/events"
import { listManagedTicketTypes } from "@/api/inventory"
import { sessionRepository } from "@/auth/sessionRepository"

function retryRead(count: number, error: Error) {
  return count < 2 && (!(error instanceof ApiError) || error.status >= 500)
}

export const managedEventRepository = {
  mineQuery(sessionId: number | null) {
    return queryOptions({
      queryKey: ["managed-events", sessionId],
      queryFn:
        sessionId === null
          ? skipToken
          : () =>
              sessionRepository.authenticatedRequest(sessionId, listMyEvents),
      retry: retryRead,
    })
  },

  eventQuery(sessionId: number, eventId: string) {
    return queryOptions({
      queryKey: ["managed-events", sessionId, eventId],
      queryFn: () =>
        sessionRepository.authenticatedRequest(sessionId, (token) =>
          getManagedEvent(token, eventId)
        ),
      retry: retryRead,
    })
  },

  ticketTypesQuery(sessionId: number, eventId: string, enabled: boolean) {
    return queryOptions({
      queryKey: ["managed-events", sessionId, eventId, "ticket-types"],
      queryFn: enabled
        ? () =>
            sessionRepository.authenticatedRequest(sessionId, (token) =>
              listManagedTicketTypes(token, eventId)
            )
        : skipToken,
      retry: retryRead,
    })
  },
}
