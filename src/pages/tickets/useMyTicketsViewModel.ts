import { useQuery } from "@tanstack/react-query"

import type { TicketStatus } from "@/api/tickets"
import {
  attendanceRepository,
  type AttendanceActivity,
} from "@/tickets/attendanceRepository"

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})
const currency = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "KZT",
})

const ticketStatus: Record<TicketStatus, string> = {
  VALID: "Valid",
  CHECKED_IN: "Checked in",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  REFUND_PENDING: "Refund pending",
}

function toActivity(data: AttendanceActivity) {
  const now = Date.now()
  const eventsById = new Map(data.events.map((event) => [event.id, event]))
  const orderTicketIds = new Set(
    data.orders.flatMap((order) => order.tickets.map((ticket) => ticket.id))
  )

  return {
    upcoming: data.events
      .filter(
        (event) =>
          data.attending.has(event.id) &&
          event.status === "PUBLISHED" &&
          Date.parse(event.endAt) >= now
      )
      .sort(
        (first, second) =>
          Date.parse(first.startAt) - Date.parse(second.startAt)
      )
      .map((event) => ({
        id: event.id,
        href: `/events/${encodeURIComponent(event.id)}`,
        title: event.title,
        startAt: event.startAt,
        starts: dateTime.format(new Date(event.startAt)),
        venue: event.venue?.name,
      })),
    orders: [...data.orders]
      .sort(
        (first, second) =>
          Date.parse(second.expiresAt) - Date.parse(first.expiresAt)
      )
      .map((order) => ({
        id: order.id,
        href: `/orders/${encodeURIComponent(order.id)}`,
        title: eventsById.get(order.eventId)?.title ?? "Event unavailable",
        total:
          order.amountKzt === 0 ? "Free" : currency.format(order.amountKzt),
        status:
          order.refundState === "PENDING"
            ? "Refund pending"
            : order.refundState === "REFUNDED"
              ? "Refunded"
              : order.status === "COMPLETED"
                ? "Confirmed"
                : order.status.toLowerCase().replaceAll("_", " "),
        awaitingPayment: order.status === "AWAITING_PAYMENT",
        tickets: order.tickets.map((ticket) => ({
          id: ticket.id,
          attendee: ticket.attendeeEmail,
          status: ticketStatus[ticket.status],
        })),
      })),
    linkedTickets: data.tickets
      .filter((ticket) => !orderTicketIds.has(ticket.id))
      .map((ticket) => {
        const event = eventsById.get(ticket.eventId)
        return {
          id: ticket.id,
          title: event?.title ?? "Event unavailable",
          href: event ? `/events/${encodeURIComponent(event.id)}` : null,
          code: ticket.ticketCode,
          status: ticketStatus[ticket.status],
        }
      }),
  }
}

export function useMyTicketsViewModel(
  sessionId: number,
  verifiedEmail: string | null
) {
  const query = useQuery({
    ...attendanceRepository.activityQuery(sessionId, verifiedEmail),
    select: toActivity,
  })
  return {
    loading: query.isPending,
    error: query.isError,
    retry: () => void query.refetch(),
    activity: query.data,
  }
}
