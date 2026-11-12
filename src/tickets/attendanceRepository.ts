import {
  queryOptions,
  skipToken,
  type QueryClient,
} from "@tanstack/react-query"

import { listMyCheckouts, type Checkout } from "@/api/checkouts"
import { ApiError } from "@/api/client"
import { getPublicEvent, type PublicEvent } from "@/api/events"
import { listMyTickets, type Ticket, type TicketStatus } from "@/api/tickets"
import { sessionRepository } from "@/auth/sessionRepository"

export type AttendanceActivity = {
  tickets: Ticket[]
  orders: Checkout[]
  events: PublicEvent[]
  attending: Set<string>
}

function attendanceKey(sessionId: number | null) {
  return ["attendance", sessionId] as const
}

function canAttend(status: TicketStatus) {
  return status === "VALID" || status === "CHECKED_IN"
}

async function loadRecords(sessionId: number, includeOrders: boolean) {
  return Promise.all([
    sessionRepository.authenticatedRequest(sessionId, listMyTickets),
    includeOrders
      ? sessionRepository.authenticatedRequest(sessionId, listMyCheckouts)
      : [],
  ])
}

function attendingEventIds(
  tickets: Ticket[],
  orders: Checkout[],
  email: string | null
) {
  const eventIds = new Set(
    tickets
      .filter((ticket) => canAttend(ticket.status))
      .map((ticket) => ticket.eventId)
  )
  for (const order of orders) {
    if (
      order.status === "COMPLETED" &&
      order.tickets.some(
        (ticket) =>
          canAttend(ticket.status) &&
          ticket.attendeeEmail.trim().toLowerCase() === email
      )
    ) {
      eventIds.add(order.eventId)
    }
  }
  return eventIds
}

async function loadEvents(eventIds: Iterable<string>) {
  const events = await Promise.all(
    [...eventIds].map(async (id) => {
      try {
        return await getPublicEvent(id)
      } catch (error) {
        if (error instanceof ApiError && [403, 404].includes(error.status))
          return null
        throw error
      }
    })
  )
  return events.filter((event) => event !== null)
}

export const attendanceRepository = {
  eventsQuery(sessionId: number | null, verifiedEmail: string | null) {
    const email = verifiedEmail?.trim().toLowerCase() || null
    return queryOptions({
      queryKey: [...attendanceKey(sessionId), "events", email],
      queryFn:
        sessionId === null
          ? skipToken
          : async () => {
              const [tickets, orders] = await loadRecords(sessionId, !!email)
              return loadEvents(attendingEventIds(tickets, orders, email))
            },
    })
  },

  activityQuery(sessionId: number, verifiedEmail: string | null) {
    const email = verifiedEmail?.trim().toLowerCase() || null
    return queryOptions({
      queryKey: [...attendanceKey(sessionId), "activity", email],
      queryFn: async (): Promise<AttendanceActivity> => {
        const [tickets, orders] = await loadRecords(sessionId, true)
        const attending = attendingEventIds(tickets, orders, email)
        const eventIds = new Set([
          ...attending,
          ...tickets.map(({ eventId }) => eventId),
          ...orders.map(({ eventId }) => eventId),
        ])
        const events = await loadEvents(eventIds)
        return { tickets, orders, events, attending }
      },
    })
  },

  invalidate(client: QueryClient, sessionId: number) {
    return client.invalidateQueries({ queryKey: attendanceKey(sessionId) })
  },
}
