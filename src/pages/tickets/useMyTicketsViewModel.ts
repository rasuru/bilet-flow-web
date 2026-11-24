import { t, dateFormat, numberFormat, statusText } from "@/i18n/locale"
import { useQuery } from "@tanstack/react-query"

import {
  attendanceRepository,
  type AttendanceActivity,
} from "@/tickets/attendanceRepository"

import {
  ticketDetailsPath,
  ticketStatusLabels,
} from "@/tickets/ticketPresentation"

const dateTime = dateFormat({
  dateStyle: "medium",
  timeStyle: "short",
})
const currency = numberFormat({
  style: "currency",
  currency: "KZT",
})

function toActivity(data: AttendanceActivity) {
  const now = Date.now()
  const eventsById = new Map(data.events.map((event) => [event.id, event]))
  const orderIdsByTicket = new Map(
    data.tickets.map((ticket) => [ticket.id, ticket.orderId])
  )
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
          Date.parse(second.createdAt ?? second.expiresAt) -
          Date.parse(first.createdAt ?? first.expiresAt)
      )
      .map((order) => ({
        id: order.id,
        orderId:
          order.orderId ??
          order.tickets
            .map((ticket) => ticket.orderId ?? orderIdsByTicket.get(ticket.id))
            .find(Boolean),
        href: `/orders/${encodeURIComponent(order.id)}`,
        title: eventsById.get(order.eventId)?.title ?? t("Event unavailable"),
        total:
          order.amountKzt === 0 ? t("Free") : currency.format(order.amountKzt),
        status:
          order.refundState === "PENDING"
            ? t("Refund pending")
            : order.refundState === "REFUNDED"
              ? t("Refunded")
              : order.status === "COMPLETED"
                ? t("Confirmed")
                : statusText(order.status),
        placedAt: order.createdAt
          ? {
              instant: order.createdAt,
              label: dateTime.format(new Date(order.createdAt)),
            }
          : null,
        awaitingPayment: order.status === "AWAITING_PAYMENT",
        tickets: order.tickets.map((ticket) => ({
          id: ticket.id,
          attendee: ticket.attendeeEmail,
          href: ticketDetailsPath(ticket.id),
          status: t(ticketStatusLabels[ticket.status]),
        })),
      })),
    linkedTickets: data.tickets
      .filter((ticket) => !orderTicketIds.has(ticket.id))
      .map((ticket) => {
        const event = eventsById.get(ticket.eventId)
        return {
          id: ticket.id,
          title: event?.title ?? t("Event unavailable"),
          href: ticketDetailsPath(ticket.id),
          code: ticket.ticketCode,
          status: t(ticketStatusLabels[ticket.status]),
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
    select: (data) => toActivity(data),
  })
  return {
    loading: query.isPending,
    error: query.isError,
    retry: () => void query.refetch(),
    activity: query.data,
  }
}
