import { queryOptions, skipToken } from "@tanstack/react-query"

import { listMyCheckouts } from "@/api/checkouts"
import { ApiError } from "@/api/client"
import { getVenueLayout } from "@/api/events"
import { getTicketPdf, getTicketQr, listMyTickets } from "@/api/tickets"
import { sessionRepository } from "@/auth/sessionRepository"
import { publicEventRepository } from "@/events/publicEventRepository"

export function loadTicketRecords(sessionId: number, includeOrders: boolean) {
  return Promise.all([
    sessionRepository.authenticatedRequest(sessionId, listMyTickets),
    includeOrders
      ? sessionRepository.authenticatedRequest(sessionId, listMyCheckouts)
      : [],
  ])
}

async function readIfAvailable<T>(request: Promise<T>) {
  try {
    return await request
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status))
      return null
    throw error
  }
}

export const ticketRepository = {
  detailQuery(sessionId: number, ticketId: string) {
    return queryOptions({
      queryKey: ["ticket", sessionId, ticketId],
      queryFn: async ({ client }) => {
        const [tickets, orders] = await loadTicketRecords(sessionId, true)
        const linked = tickets.find((ticket) => ticket.id === ticketId)
        const order = orders.find((entry) =>
          entry.tickets.some((ticket) => ticket.id === ticketId)
        )
        const issued = order?.tickets.find((ticket) => ticket.id === ticketId)
        const ticket = linked ?? issued
        const eventId = linked?.eventId ?? order?.eventId
        if (!ticket || !eventId) return null

        const event = await readIfAvailable(
          client.fetchQuery(publicEventRepository.eventQuery(eventId))
        )
        const layoutId = event?.venue?.venueLayoutId
        const layout =
          ticket.seatId && layoutId
            ? await readIfAvailable(getVenueLayout(layoutId))
            : null
        const seat = layout?.seats.find((seat) => seat.seatId === ticket.seatId)
        return { ticket, event, seat, linked: !!linked, orderId: order?.id }
      },
    })
  },

  qrQuery(sessionId: number, ticketId: string | null) {
    return queryOptions({
      queryKey: ["ticket-qr", sessionId, ticketId],
      queryFn:
        ticketId === null
          ? skipToken
          : () =>
              sessionRepository.authenticatedRequest(sessionId, (token) =>
                getTicketQr(token, ticketId)
              ),
      retry: false,
      gcTime: 0,
    })
  },

  pdf(sessionId: number, ticketId: string) {
    return sessionRepository.authenticatedRequest(sessionId, (token) =>
      getTicketPdf(token, ticketId)
    )
  },
}
