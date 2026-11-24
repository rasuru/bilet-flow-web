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
    })
  },

  eventQuery(eventId: string) {
    return queryOptions({
      queryKey: ["public-event", eventId],
      queryFn: () => getPublicEvent(eventId),
      retry: retryPublicRead,
    })
  },

  ticketTypesQuery(eventId: string | null) {
    return queryOptions({
      queryKey: ["public-event", eventId, "ticket-types"],
      queryFn:
        eventId === null ? skipToken : () => listPublicTicketTypes(eventId),
      retry: retryPublicRead,
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
                getEventInventory(eventId),
                layoutId === null ? null : getVenueLayout(layoutId),
              ])
              return { inventory, layout }
            },
      retry: retryPublicRead,
      refetchInterval: 5_000,
      refetchOnWindowFocus: "always",
    })
  },
}
