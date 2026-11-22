import type { EventVisibility } from "@/api/events"

export const timeZones = [
  "UTC",
  "UTC+02:00",
  "UTC+03:00",
  "UTC+05:00",
  "UTC+06:00",
]

export const visibilityDetails = {
  PUBLIC: {
    label: "Public",
    description: "Anyone can find the event in discovery.",
  },
  UNLISTED: {
    label: "Unlisted",
    description: "Anyone with the event link can view it.",
  },
  PRIVATE: {
    label: "Private",
    description: "The public event page is unavailable.",
  },
} satisfies Record<EventVisibility, { label: string; description: string }>

const initialEvent = {
  title: "",
  description: "",
  category: "",
  imageUrl: "",
  visibility: "PUBLIC" as EventVisibility,
  startAt: "",
  endAt: "",
  timeZone: "UTC",
  registrationOpensAt: "",
  registrationClosesAt: "",
  venueName: "",
  venueAddress: "",
  venueCapacity: "",
  layoutId: "",
}

export type TicketDraft = {
  id: string
  name: string
  description: string
  price: string
  capacity: string
  maxPerOrder: string
  customSales: boolean
  salesStartAt: string
  salesEndAt: string
}

export function newTicket(name = "", capacity = ""): TicketDraft {
  return {
    id: crypto.randomUUID(),
    name,
    description: "",
    price: "0",
    capacity,
    maxPerOrder: "1",
    customSales: false,
    salesStartAt: "",
    salesEndAt: "",
  }
}

export function instant(value: string, timeZone: string) {
  return new Date(`${value}${timeZone === "UTC" ? "Z" : timeZone.slice(3)}`)
}

export type EventDraft = typeof initialEvent

const minute = 60_000

function dateTimeInput(timestamp: number, timeZone: string) {
  const offset = timeZone === "UTC" ? 0 : Number(timeZone.slice(4, 6)) * 60
  return new Date(timestamp + offset * minute).toISOString().slice(0, 16)
}

export function createEventDraft(now: number): EventDraft {
  const nextWeek = new Date(now)
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7)
  nextWeek.setUTCHours(18, 0, 0, 0)
  return {
    ...initialEvent,
    startAt: dateTimeInput(+nextWeek, initialEvent.timeZone),
    endAt: dateTimeInput(+nextWeek + 2 * 60 * minute, initialEvent.timeZone),
  }
}

export function sampleEventDraft(now: number): EventDraft {
  return {
    ...createEventDraft(now),
    title: "Sample jazz night",
    category: "Music",
    description: "An evening of live jazz with local musicians.",
    venueName: "City Arts Hall",
    venueAddress: "10 Abay Avenue, Almaty",
    venueCapacity: "100",
  }
}

export function defaultSalesWindow(event: EventDraft, openedAt: number) {
  const start = +instant(event.startAt, event.timeZone)
  const end = +instant(event.endAt, event.timeZone)
  if (!(start < end)) return { salesStartAt: "", salesEndAt: "" }

  // Events can already be in progress. Use their end time in that case.
  const closesAt = start > openedAt ? start : end
  return {
    salesStartAt: dateTimeInput(
      Math.min(openedAt, closesAt - minute),
      event.timeZone
    ),
    salesEndAt: closesAt === start ? event.startAt : event.endAt,
  }
}
