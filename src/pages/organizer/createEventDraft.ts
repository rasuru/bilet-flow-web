import type {
  EventDetailsRequest,
  EventVisibility,
  ManagedEvent,
  RegistrationWindowRequest,
  SeatingMode,
  VenueLayout,
  VenueRequest,
} from "@/api/events"

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
    description: "Only people who accept an email invitation can access this event.",
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

export function positiveInteger(value: string) {
  return (
    /^\d+$/.test(value) && Number(value) > 0 && Number(value) <= 2_147_483_647
  )
}

export function validPrice(value: string) {
  return /^\d+(\.\d{1,2})?$/.test(value) && Number.isFinite(Number(value))
}

export function validateEventBasics(
  event: EventDraft,
  original?: ManagedEvent
) {
  if (!event.title.trim() || !event.category.trim())
    return "Enter an event title and category."
  if (event.imageUrl.trim() && event.imageUrl !== original?.imageUrl) {
    try {
      if (["http:", "https:"].includes(new URL(event.imageUrl.trim()).protocol))
        return null
    } catch {
      // Use the same validation message for malformed and unsupported URLs.
    }
    return "Enter an image URL starting with http:// or https://."
  }
  return null
}

export function validateEventSchedule(
  event: EventDraft,
  original?: EventDraft
) {
  const toTime = (value: string) => +instant(value, event.timeZone)
  if (!(toTime(event.startAt) < toTime(event.endAt)))
    return "Enter an event end time after the start time."
  if (
    original &&
    event.timeZone === original.timeZone &&
    event.endAt === original.endAt &&
    event.registrationOpensAt === original.registrationOpensAt &&
    event.registrationClosesAt === original.registrationClosesAt
  )
    return null
  const opens = toTime(event.registrationOpensAt)
  const closes = toTime(event.registrationClosesAt)
  if (event.registrationClosesAt && !(opens < closes))
    return "Enter a registration opening time before the closing time."
  if (opens >= toTime(event.endAt) || closes > toTime(event.endAt))
    return "Registration must take place before the event ends."
  return null
}

export function eventDraftFrom(event: ManagedEvent): EventDraft {
  const utcInput = (value: string | null) =>
    value ? new Date(value).toISOString().slice(0, -1) : ""
  return {
    ...initialEvent,
    title: event.title,
    category: event.category,
    description: event.description ?? "",
    imageUrl: event.imageUrl ?? "",
    visibility: event.visibility,
    startAt: utcInput(event.startAt),
    endAt: utcInput(event.endAt),
    registrationOpensAt: utcInput(event.registrationWindow.startAt),
    registrationClosesAt: utcInput(event.registrationWindow.endAt),
  }
}

export function buildEventDetails(
  event: EventDraft,
  original?: ManagedEvent
): EventDetailsRequest {
  const toIso = (value: string, previous?: string | null) =>
    previous && +instant(value, event.timeZone) === Date.parse(previous)
      ? previous
      : instant(value, event.timeZone).toISOString()
  let registrationWindow: RegistrationWindowRequest = { mode: "ALWAYS_OPEN" }
  if (event.registrationOpensAt) {
    const startAt = toIso(
      event.registrationOpensAt,
      original?.registrationWindow.startAt
    )
    registrationWindow = event.registrationClosesAt
      ? {
          mode: "BOUNDED",
          startAt,
          endAt: toIso(
            event.registrationClosesAt,
            original?.registrationWindow.endAt
          ),
        }
      : { mode: "OPENS_AT", startAt }
  }

  return {
    title: event.title.trim(),
    category: event.category.trim(),
    description: event.description.trim() || null,
    imageUrl: event.imageUrl.trim() || null,
    visibility: event.visibility,
    startAt: toIso(event.startAt, original?.startAt),
    endAt: toIso(event.endAt, original?.endAt),
    registrationWindow,
  }
}

export function buildVenue(
  event: EventDraft,
  mode: SeatingMode,
  layout?: VenueLayout
): VenueRequest {
  const venue = {
    name: event.venueName.trim(),
    address: event.venueAddress.trim(),
  }
  if (mode === "ASSIGNED_SEATING" && layout) {
    return {
      ...venue,
      seatingMode: mode,
      capacity: layout.seats.length,
      venueLayoutId: layout.layoutId,
    }
  }
  return {
    ...venue,
    seatingMode: "GENERAL_ADMISSION",
    capacity: Number(event.venueCapacity),
  }
}
