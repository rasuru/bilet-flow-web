import { queryOptions, skipToken } from "@tanstack/react-query"

import { sessionRepository } from "@/auth/sessionRepository"
import { ApiError } from "@/api/client"
import {
  getPublicEvent,
  getVenueLayout,
  listPublicEvents,
  type EventDiscoveryParams,
} from "@/api/events"
import { getEventInventory, listPublicTicketTypes } from "@/api/inventory"

function retryPublicRead(count: number, error: Error) {
  return count < 2 && (!(error instanceof ApiError) || error.status >= 500)
}

function eventRequest<T>(sessionId: number | null, request: (token?: string) => Promise<T>) {
  return sessionId === null
    ? request()
    : sessionRepository.authenticatedRequest(sessionId, request)
}

export const publicEventRepository = {
  discoveryQuery(params: EventDiscoveryParams) {
    return queryOptions({
      queryKey: ["public-events", params],
      queryFn: () => listPublicEvents(params),
      retry: retryPublicRead,
      refetchInterval: 30_000,
    })
  },

  eventQuery(eventId: string, sessionId: number | null = null) {
    return queryOptions({
      queryKey: ["public-event", eventId, "details", sessionId],
      queryFn: () => eventRequest(sessionId, (token) => getPublicEvent(eventId, token)),
      retry: retryPublicRead,
      refetchInterval: 15_000,
    })
  },

  ticketTypesQuery(eventId: string | null, sessionId: number | null) {
    return queryOptions({
      queryKey: ["public-event", eventId, "ticket-types", sessionId],
      queryFn:
        eventId === null
          ? skipToken
          : () => eventRequest(sessionId, (token) => listPublicTicketTypes(eventId, token)),
      retry: retryPublicRead,
      refetchInterval: 10_000,
    })
  },

  availabilityQuery(eventId: string | null, layoutId: string | null, sessionId: number | null) {
    return queryOptions({
      queryKey: ["public-event", eventId, "availability", layoutId, sessionId],
      queryFn:
        eventId === null
          ? skipToken
          : async () => {
              const [inventory, layout] = await Promise.all([
                eventRequest(sessionId, (token) => getEventInventory(eventId, token))
                  .catch((error: unknown) => {
                  if (layoutId && error instanceof ApiError && error.status === 404) return null
                  throw error
                }),
                layoutId === null ? null : getVenueLayout(layoutId),
              ])
              return { inventory, layout }
            },
      retry: retryPublicRead,
      refetchInterval: layoutId ? 5_000 : 30_000,
    })
  },
}

