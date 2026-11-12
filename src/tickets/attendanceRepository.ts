import {
  queryOptions,
  skipToken,
  type QueryClient,
} from "@tanstack/react-query"

import { listMyCheckouts } from "@/api/checkouts"
import { ApiError } from "@/api/client"
import { getPublicEvent } from "@/api/events"
import { listMyTickets, type TicketStatus } from "@/api/tickets"
import { sessionRepository } from "@/auth/sessionRepository"

function attendanceKey(sessionId: number | null) {
  return ["home", "attendee-events", sessionId] as const
}

function canAttend(status: TicketStatus) {
  return status === "VALID" || status === "CHECKED_IN"
}

async function loadEvents(sessionId: number, verifiedEmail: string | null) {
  const [tickets, orders] = await Promise.all([
    sessionRepository.authenticatedRequest(sessionId, listMyTickets),
    verifiedEmail
      ? sessionRepository.authenticatedRequest(sessionId, listMyCheckouts)
      : [],
  ])

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
          ticket.attendeeEmail.trim().toLowerCase() === verifiedEmail
      )
    ) {
      eventIds.add(order.eventId)
    }
  }

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
      queryKey: [...attendanceKey(sessionId), email],
      queryFn:
        sessionId === null ? skipToken : () => loadEvents(sessionId, email),
    })
  },

  invalidate(client: QueryClient, sessionId: number) {
    return client.invalidateQueries({ queryKey: attendanceKey(sessionId) })
  },
}
