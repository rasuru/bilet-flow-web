import { queryOptions, skipToken } from "@tanstack/react-query"

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

export const publicEventRepository = {
  discoveryQuery(params: EventDiscoveryParams) {
    return queryOptions({
      queryKey: ["public-events", params],
      queryFn: () => listPublicEvents(params),
      retry: retryPublicRead,
      refetchInterval: 30_000,
    })
  },

  eventQuery(eventId: string, access?: string) {
    return queryOptions({
      queryKey: access ? ["public-event", eventId, "access", access] : ["public-event", eventId],
      queryFn: () => getPublicEvent(eventId, access),
      retry: retryPublicRead,
      refetchInterval: 15_000,
    })
  },

  ticketTypesQuery(eventId: string | null, access?: string) {
    return queryOptions({
      queryKey: ["public-event", eventId, "ticket-types", ...(access ? [access] : [])],
      queryFn:
        eventId === null ? skipToken : () => listPublicTicketTypes(eventId, access),
      retry: retryPublicRead,
      refetchInterval: 10_000,
    })
  },

  availabilityQuery(eventId: string | null, layoutId: string | null) {
    return queryOptions({
      queryKey: ["public-event", eventId, "availability", layoutId],
      queryFn:
        eventId === null
          ? skipToken
          : async () => {
              const [inventory, layout] = await Promise.all([
                getEventInventory(eventId).catch((error: unknown) => {
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

