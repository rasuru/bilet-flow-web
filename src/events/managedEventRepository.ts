import {
  mutationOptions,
  queryOptions,
  skipToken,
  type QueryClient,
} from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import {
  cancelEvent,
  getManagedEvent,
  listMyEvents,
  publishEvent,
  unpublishEvent,
} from "@/api/events"
import { getEventInventory, listManagedTicketTypes } from "@/api/inventory"
import { sessionRepository } from "@/auth/sessionRepository"

function retryRead(count: number, error: Error) {
  return count < 2 && (!(error instanceof ApiError) || error.status >= 500)
}

const eventActions = {
  publish: publishEvent,
  unpublish: unpublishEvent,
  cancel: cancelEvent,
}

export type ManagedEventAction = keyof typeof eventActions

export const managedEventRepository = {
  inventoryQuery(sessionId: number, eventId: string) {
    return queryOptions({
      queryKey: ["managed-events", sessionId, eventId, "inventory"],
      queryFn: () =>
        sessionRepository.authenticatedRequest(sessionId, async (token) => {
          try {
            return await getEventInventory(eventId, token)
          } catch (error) {
            if (error instanceof ApiError && error.status === 404) return null
            throw error
          }
        }),
      retry: retryRead,
      staleTime: 30_000,
    })
  },

  changeStatusMutation(client: QueryClient, sessionId: number) {
    return mutationOptions({
      mutationKey: ["managed-events", sessionId, "change-status"],
      mutationFn: ({
        eventId,
        action,
      }: {
        eventId: string
        action: ManagedEventAction
      }) =>
        sessionRepository.authenticatedRequest(sessionId, (token) =>
          eventActions[action](token, eventId)
        ),
      onSuccess: async (_data, { eventId }) => {
        const queries = [
          { queryKey: ["managed-events", sessionId] },
          { queryKey: ["public-events"] },
          { queryKey: ["public-event", eventId] },
        ]
        await Promise.all(queries.map((query) => client.cancelQueries(query)))
        await Promise.all(
          queries.map((query) => client.invalidateQueries(query))
        )
      },
    })
  },

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

