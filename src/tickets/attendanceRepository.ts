import {
  queryOptions,
  skipToken,
  type QueryClient,
} from "@tanstack/react-query"

import type { Checkout } from "@/api/checkouts"
import { ApiError } from "@/api/client"
import { getPublicEvent, type PublicEvent } from "@/api/events"
import type { Ticket, TicketStatus } from "@/api/tickets"
import { loadTicketRecords } from "./ticketRepository"

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

function attendingTickets(
  tickets: Ticket[],
  orders: Checkout[],
  email: string | null
) {
  const byId = new Map<
    string,
    {
      id: string
      eventId: string
      attendeeEmail: string
      status: TicketStatus
    }
  >()
  for (const order of orders) {
    if (order.status !== "COMPLETED") continue
    for (const ticket of order.tickets) {
      if (ticket.attendeeEmail.trim().toLowerCase() === email) {
        byId.set(ticket.id, { ...ticket, eventId: order.eventId })
      }
    }
  }
  for (const ticket of tickets) byId.set(ticket.id, ticket)
  return [...byId.values()].filter((ticket) => canAttend(ticket.status))
}

function attendingEventIds(
  tickets: Ticket[],
  orders: Checkout[],
  email: string | null
) {
  return new Set(
    attendingTickets(tickets, orders, email).map(({ eventId }) => eventId)
  )
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
              const [tickets, orders] = await loadTicketRecords(
                sessionId,
                !!email
              )
              return loadEvents(attendingEventIds(tickets, orders, email))
            },
    })
  },

  eventTicketsQuery(
    sessionId: number | null,
    verifiedEmail: string | null,
    eventId: string
  ) {
    const email = verifiedEmail?.trim().toLowerCase() || null
    return queryOptions({
      queryKey: [...attendanceKey(sessionId), "event-tickets", email, eventId],
      queryFn:
        sessionId === null
          ? skipToken
          : async () => {
              const [tickets, orders] = await loadTicketRecords(
                sessionId,
                !!email
              )
              return attendingTickets(tickets, orders, email).filter(
                (ticket) => ticket.eventId === eventId
              )
            },
    })
  },

  activityQuery(sessionId: number, verifiedEmail: string | null) {
    const email = verifiedEmail?.trim().toLowerCase() || null
    return queryOptions({
      queryKey: [...attendanceKey(sessionId), "activity", email],
      queryFn: async (): Promise<AttendanceActivity> => {
        const [tickets, orders] = await loadTicketRecords(sessionId, true)
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
