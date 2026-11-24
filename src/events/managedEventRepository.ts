import {
  mutationOptions,
  queryOptions,
  skipToken,
  type QueryClient,
} from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import {
  assignStaff,
  attachVenue,
  cancelEvent,
  getManagedEvent,
  getVenueLayout,
  listMyEvents,
  listVenueLayouts,
  publishEvent,
  removeStaff,
  unpublishEvent,
  updateEvent,
  type EventDetailsRequest,
  type VenueRequest,
} from "@/api/events"
import {
  createAssignedSeatingTicketType,
  createGeneralAdmissionTicketType,
  listManagedTicketTypes,
  updateAssignedSeatingTicketType,
  updateGeneralAdmissionTicketType,
} from "@/api/inventory"
import { findDirectoryUsers } from "@/api/users"
import { sessionRepository } from "@/auth/sessionRepository"
import type { TicketRequest } from "./organizerEventRepository"

function retryRead(count: number, error: Error) {
  return count < 2 && (!(error instanceof ApiError) || error.status >= 500)
}

const eventActions = {
  publish: publishEvent,
  unpublish: unpublishEvent,
  cancel: cancelEvent,
}

export type ManagedEventAction = keyof typeof eventActions

export async function refreshManagedEvent(
  client: QueryClient,
  sessionId: number,
  eventId: string
) {
  const queries = [
    { queryKey: ["managed-events", sessionId, eventId] },
    { queryKey: ["managed-events", sessionId], exact: true },
    { queryKey: ["managed-events", sessionId, "analytics-overview"] },
    { queryKey: ["public-events"] },
    { queryKey: ["public-event", eventId] },
  ]
  await Promise.all(queries.map((query) => client.cancelQueries(query)))
  await Promise.all(queries.map((query) => client.invalidateQueries(query)))
}

export const managedEventRepository = {
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
      onSuccess: (_data, { eventId }) =>
        refreshManagedEvent(client, sessionId, eventId),
    })
  },

  updateDetails(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    details: EventDetailsRequest
  ) {
    return updateManagedEvent(client, sessionId, eventId, (token) =>
      updateEvent(token, eventId, details)
    )
  },

  attachVenue(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    venue: VenueRequest
  ) {
    return updateManagedEvent(client, sessionId, eventId, (token) =>
      attachVenue(token, eventId, venue)
    )
  },

  addTicket(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    request: TicketRequest
  ) {
    return updateManagedEvent(client, sessionId, eventId, (token) =>
      "priceCategory" in request
        ? createAssignedSeatingTicketType(token, eventId, request)
        : createGeneralAdmissionTicketType(token, eventId, request)
    )
  },

  changeTicketPrice(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    ticketId: string,
    price: string
  ) {
    return updateManagedEvent(client, sessionId, eventId, async (token) => {
      // The API replaces all editable fields. Read the latest configuration
      // so a price change does not send back the form's older snapshot.
      const ticket = (await listManagedTicketTypes(token, eventId)).find(
        ({ id }) => id === ticketId
      )
      if (!ticket) throw new Error("Ticket tier is no longer available.")
      const {
        name,
        description,
        maxPerOrder,
        salesStartAt,
        salesEndAt,
        priceCategory,
        totalCapacity,
      } = ticket
      const details = {
        name,
        description,
        maxPerOrder,
        salesStartAt,
        salesEndAt,
        price,
      }
      if (priceCategory !== null) {
        await updateAssignedSeatingTicketType(token, ticketId, {
          ...details,
          priceCategory,
        })
      } else {
        if (totalCapacity === null)
          throw new Error("Ticket tier capacity is unavailable.")
        await updateGeneralAdmissionTicketType(token, ticketId, {
          ...details,
          capacity: totalCapacity,
        })
      }
    })
  },

  changeStaff(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    userId: number,
    action: "assign" | "remove"
  ) {
    return updateManagedEvent(client, sessionId, eventId, (token) =>
      action === "assign"
        ? assignStaff(token, eventId, {
            staffUserId: userId,
            role: "EVENT_ADMIN",
          })
        : removeStaff(token, eventId, userId)
    )
  },

  userSearchQuery(sessionId: number, login: string) {
    return queryOptions({
      queryKey: ["organizer", sessionId, "staff-search", login],
      queryFn: login
        ? () =>
            sessionRepository.authenticatedRequest(sessionId, (token) =>
              findDirectoryUsers(token, { login })
            )
        : skipToken,
      retry: false,
    })
  },

  staffDirectoryQuery(sessionId: number, userIds: number[]) {
    const ids = [...new Set(userIds)]
      .sort((first, second) => first - second)
      .map(String)
    return queryOptions({
      queryKey: ["organizer", sessionId, "staff-directory", ids],
      queryFn: ids.length
        ? () =>
            sessionRepository.authenticatedRequest(sessionId, async (token) => {
              const batches = []
              for (let index = 0; index < ids.length; index += 100) {
                batches.push(
                  findDirectoryUsers(token, {
                    ids: ids.slice(index, index + 100),
                  })
                )
              }
              return (await Promise.all(batches)).flat()
            })
        : skipToken,
      retry: false,
      staleTime: 60_000,
    })
  },

  venueLayoutsQuery(enabled: boolean) {
    return queryOptions({
      queryKey: ["organizer", "managed-venue-layouts"],
      queryFn: enabled ? listVenueLayouts : skipToken,
      retry: false,
    })
  },

  venueLayoutQuery(layoutId: string | null) {
    return queryOptions({
      queryKey: ["organizer", "managed-venue-layouts", layoutId],
      queryFn: layoutId ? () => getVenueLayout(layoutId) : skipToken,
      retry: false,
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

async function updateManagedEvent<T>(
  client: QueryClient,
  sessionId: number,
  eventId: string,
  request: (token: string) => Promise<T>
) {
  await sessionRepository.authenticatedRequest(sessionId, request)
  await refreshManagedEvent(client, sessionId, eventId)
}
