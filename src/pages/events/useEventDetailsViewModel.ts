import { t, dateFormat, numberFormat } from "@/i18n/locale"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { ApiError } from "@/api/client"
import { useSessionViewModel } from "@/auth/useSessionViewModel"
import type { PublicEvent } from "@/api/events"
import type { PublicTicketType } from "@/api/inventory"
import { publicEventRepository } from "@/events/publicEventRepository"

const dateTime = dateFormat({
  dateStyle: "medium",
  timeStyle: "short",
})

function formatTime(instant: string) {
  return dateTime.format(new Date(instant))
}

function eventSalesMessage(event: PublicEvent, now: number) {
  if (event.status === "CANCELLED") return t("This event was cancelled.")
  if (Date.parse(event.endAt) <= now) return t("This event has ended.")

  if (Date.parse(event.startAt) <= now) return t("Registration is closed.")

  const { startAt, endAt } = event.registrationWindow
  if (startAt && Date.parse(startAt) > now) {
    return t("Registration opens {0}.", formatTime(startAt))
  }
  if (endAt && Date.parse(endAt) <= now) return t("Registration is closed.")
  return null
}

function ticketAvailabilityLabel(
  ticket: PublicTicketType,
  remaining: number | undefined
) {
  if (ticket.status === "PAUSED") return t("Sales paused")
  switch (ticket.purchaseStatus) {
    case "SALES_NOT_ACTIVE":
      return t("Ticket sales have not opened yet.")
    case "REGISTRATION_CLOSED":
      return t("Registration is closed.")
    case "COMING_SOON":
      return t("Sales open {0}", formatTime(ticket.salesStartAt))
    case "SALES_CLOSED":
      return t("Sales closed")
    case "SOLD_OUT":
      return t("Sold out")
    case "UNAVAILABLE":
      return t("Tickets unavailable")
    case "AVAILABLE":
      if (!ticket.purchasable || remaining === undefined) return t("Availability unknown")
      return remaining === 0 ? t("Sold out") : t("{0} remaining", remaining)
    default:
      return t("Availability unknown")
  }
}

export function useEventDetailsViewModel(eventId: string) {
  const session = useSessionViewModel()
  const sessionId = session.status === "signedIn" ? session.sessionId : null
  const eventQuery = useQuery({
    ...publicEventRepository.eventQuery(eventId, sessionId),
    enabled: session.status !== "restoring",
  })
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])
  const event = eventQuery.isError ? undefined : eventQuery.data
  const isViewable =
    event &&
    (event.status === "PUBLISHED" || event.status === "CANCELLED")
  const salesMessage = isViewable ? eventSalesMessage(event, now) : null
  const showTickets = !!isViewable && event.status !== "CANCELLED"

  const ticketQuery = useQuery(
    publicEventRepository.ticketTypesQuery(showTickets ? eventId : null, sessionId)
  )
  const ticketTypes = ticketQuery.data?.filter(
    ({ status }) => status !== "HIDDEN"
  )
  const loadAvailability =
    !!event?.venue && showTickets && (!!event.venue.venueLayoutId || (!salesMessage && !!ticketTypes?.length))
  const availability = useQuery(
    publicEventRepository.availabilityQuery(
      loadAvailability ? eventId : null,
      event?.venue?.venueLayoutId ?? null,
      sessionId
    )
  )

  if (session.status === "restoring" || eventQuery.isPending) return { status: "loading" } as const
  if (eventQuery.isError) {
    const error = eventQuery.error
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      return { status: "missing" } as const
    }
    return {
      status: "error",
      retry: () => void eventQuery.refetch(),
    } as const
  }
  if (!isViewable) return { status: "missing" } as const

  const inventory = availability.isError
    ? undefined
    : availability.data?.inventory
  const layout = availability.data?.layout
  const availableSeatIds = new Set(
    inventory?.seatAvailability
      .filter((seat) => seat.status === "AVAILABLE")
      .map((seat) => seat.seatId)
  )
  const availableSeats = inventory
    ? layout?.seats.filter((seat) => availableSeatIds.has(seat.seatId))
    : undefined
  const byTicketType = new Map(
    inventory?.gaAvailability.map((item) => [item.ticketTypeId, item.available])
  )

  const tickets = (ticketTypes ?? []).map((ticket) => {
    const assigned = event.venue?.seatingMode === "ASSIGNED_SEATING"
    const seats =
      assigned && ticket.priceCategory !== null
        ? availableSeats?.filter(
            (seat) => seat.priceCategory === ticket.priceCategory
          )
        : undefined
    const remaining = assigned ? seats?.length : byTicketType.get(ticket.id)
    const active =
      !salesMessage &&
      !ticketQuery.isError &&
      !availability.isError &&
      ticket.purchasable === true &&
      ticket.purchaseStatus === "AVAILABLE"
    return {
      id: ticket.id,
      priceCategory: ticket.priceCategory,
      name: ticket.name,
      description: ticket.description,
      price:
        ticket.price.amount === 0
          ? t("Free")
          : numberFormat({
              style: "currency",
              currency: ticket.price.currency,
            }).format(ticket.price.amount),
      maxPerOrder: ticket.maxPerOrder,
      orderLimit: active
        ? Math.min(remaining ?? 0, ticket.maxPerOrder, 100)
        : 0,
      amount: ticket.price.amount,
      seats: assigned
        ? (active ? seats ?? [] : []).map((seat) => ({
            id: seat.seatId,
            label: t(
              "{0} · Row {1} · Seat {2}",
              seat.section,
              seat.row,
              seat.seatNumber
            ),
          }))
        : null,
      availability:
        salesMessage || (availability.isPending && loadAvailability)
          ? null
          : ticketQuery.isError || availability.isError
            ? t("Availability unknown")
            : ticketAvailabilityLabel(ticket, remaining),
    }
  })

  return {
    status: "ready",
    event: {
      title: event.title,
      category: event.category,
      description: event.description,
      imageUrl: event.imageUrl,
      start: { instant: event.startAt, label: formatTime(event.startAt) },
      end: { instant: event.endAt, label: formatTime(event.endAt) },
      venue: event.venue,
      refundHoursBeforeStart: event.refundHoursBeforeStart ?? null,
      seatingLabel:
        event.venue?.seatingMode === "ASSIGNED_SEATING"
          ? t("Assigned seating")
          : t("General admission"),
    },
    salesMessage: salesMessage ?? (
      !ticketQuery.isError && tickets.length > 0 &&
      ticketTypes?.every((ticket) => ticket.purchaseStatus === "SALES_NOT_ACTIVE")
        ? t("Ticket sales have not opened yet.") : null
    ),
    layout: layout ?? null,
    seatAvailability: inventory?.seatAvailability ?? [],
    showTickets,
    loadingTickets: showTickets && ticketQuery.isPending,
    ticketError: showTickets && ticketQuery.isError,
    retryTickets: () => void ticketQuery.refetch(),
    loadingAvailability: loadAvailability && availability.isPending,
    availabilityError: loadAvailability && availability.isError,
    retryAvailability: () => {
      void eventQuery.refetch()
      void ticketQuery.refetch()
      if (loadAvailability) void availability.refetch()
    },
    tickets,
    canSelectTickets: tickets.some((ticket) => ticket.orderLimit > 0),
  } as const
}

