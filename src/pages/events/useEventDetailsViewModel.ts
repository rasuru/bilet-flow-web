import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { ApiError } from "@/api/client"
import type { PublicEvent, VenueLayout } from "@/api/events"
import type { EventInventory, TicketType } from "@/api/inventory"
import { publicEventRepository } from "@/events/publicEventRepository"

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatTime(instant: string) {
  return dateTime.format(new Date(instant))
}

function eventSalesMessage(event: PublicEvent, now: number) {
  if (event.status === "CANCELLED") return "This event was cancelled."
  if (Date.parse(event.endAt) <= now) return "This event has ended."

  const { startAt, endAt } = event.registrationWindow
  if (startAt && Date.parse(startAt) > now) {
    return `Registration opens ${formatTime(startAt)}.`
  }
  if (endAt && Date.parse(endAt) <= now) return "Registration is closed."
  return null
}

function availableByCategory(inventory: EventInventory, layout: VenueLayout) {
  const availableIds = new Set(
    inventory.seatAvailability
      .filter((seat) => seat.status === "AVAILABLE")
      .map((seat) => seat.seatId)
  )
  const counts = new Map<string, number>()

  for (const seat of layout.seats) {
    const category = seat.priceCategory
    if (category !== null && availableIds.has(seat.seatId)) {
      counts.set(category, (counts.get(category) ?? 0) + 1)
    }
  }

  return counts
}

function ticketAvailabilityLabel(
  ticket: TicketType,
  remaining: number | undefined,
  now: number
) {
  if (ticket.status === "CLOSED" || Date.parse(ticket.salesEndAt) <= now) {
    return "Sales closed"
  }
  if (ticket.status === "PAUSED") return "Sales paused"
  if (Date.parse(ticket.salesStartAt) > now) {
    return `Sales open ${formatTime(ticket.salesStartAt)}`
  }
  if (remaining === undefined) return "Availability unknown"
  if (remaining === 0) return "Sold out"
  return `${remaining} remaining`
}

export function useEventDetailsViewModel(eventId: string) {
  const eventQuery = useQuery(publicEventRepository.eventQuery(eventId))
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])
  const event = eventQuery.isError ? undefined : eventQuery.data
  const isViewable =
    event &&
    event.visibility !== "PRIVATE" &&
    (event.status === "PUBLISHED" || event.status === "CANCELLED")
  const salesMessage = isViewable ? eventSalesMessage(event, now) : null
  const showTickets = !!isViewable && event.status !== "CANCELLED"

  const ticketQuery = useQuery(
    publicEventRepository.ticketTypesQuery(showTickets ? eventId : null)
  )
  const ticketTypes = ticketQuery.data?.filter(
    ({ status }) => status !== "HIDDEN"
  )
  const loadAvailability =
    !!event?.venue && !salesMessage && !!ticketTypes?.length
  const availability = useQuery(
    publicEventRepository.availabilityQuery(
      loadAvailability ? eventId : null,
      event?.venue?.venueLayoutId ?? null
    )
  )

  if (eventQuery.isPending) return { status: "loading" } as const
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
  const byCategory =
    inventory && layout ? availableByCategory(inventory, layout) : undefined
  const byTicketType = new Map(
    inventory?.gaAvailability.map((item) => [item.ticketTypeId, item.available])
  )

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
      seatingLabel:
        event.venue?.seatingMode === "ASSIGNED_SEATING"
          ? "Assigned seating"
          : "General admission",
    },
    salesMessage,
    showTickets,
    loadingTickets: showTickets && ticketQuery.isPending,
    ticketError: showTickets && ticketQuery.isError,
    retryTickets: () => void ticketQuery.refetch(),
    loadingAvailability: loadAvailability && availability.isPending,
    availabilityError: loadAvailability && availability.isError,
    retryAvailability: () => void availability.refetch(),
    tickets: (ticketTypes ?? []).map((ticket) => {
      const remaining =
        ticket.priceCategory === null
          ? byTicketType.get(ticket.id)
          : byCategory && (byCategory.get(ticket.priceCategory) ?? 0)
      return {
        id: ticket.id,
        name: ticket.name,
        description: ticket.description,
        price:
          ticket.price.amount === 0
            ? "Free"
            : new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: ticket.price.currency,
              }).format(ticket.price.amount),
        maxPerOrder: ticket.maxPerOrder,
        availability:
          salesMessage || (availability.isPending && loadAvailability)
            ? null
            : ticketAvailabilityLabel(ticket, remaining, now),
      }
    }),
  } as const
}
