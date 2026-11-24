import { dateFormat, numberFormat, t } from "@/i18n/locale"
import type { ManagedEvent } from "@/api/events"
import type { EventInventory } from "@/api/inventory"
import type { ManagedEventAction } from "@/events/managedEventRepository"
import { organizerCampaignsPath } from "@/promotions/campaignLinks"

export const eventStatusLabels = {
  upcoming: "Upcoming",
  active: "Active",
  draft: "Draft",
  completed: "Completed",
  cancelled: "Cancelled",
  unpublished: "Unpublished",
  suspended: "Suspended",
  published: "Published",
}

export type OrganizerEventStatus = keyof typeof eventStatusLabels

export const eventActionLabels = {
  publish: "Publish event",
  unpublish: "Unpublish event",
  cancel: "Cancel event",
} satisfies Record<ManagedEventAction, string>

const visibilityLabels = {
  PUBLIC: "Public",
  UNLISTED: "Unlisted",
  PRIVATE: "Private",
}

const dateTime = dateFormat({
  dateStyle: "medium",
  timeStyle: "short",
})

function formatDateTime(value: string) {
  const time = Date.parse(value)
  return Number.isFinite(time) ? dateTime.format(time) : t("Not scheduled")
}

function eventStatus(event: ManagedEvent, now: number): OrganizerEventStatus {
  switch (event.status) {
    case "DRAFT":
      return "draft"
    case "UNPUBLISHED":
      return "unpublished"
    case "CANCELLED":
      return "cancelled"
    case "SUSPENDED":
      return "suspended"
    case "PUBLISHED": {
      const start = Date.parse(event.startAt)
      const end = Date.parse(event.endAt)
      if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end)
        return "published"
      if (end <= now) return "completed"
      return start > now ? "upcoming" : "active"
    }
  }
}

export function presentOrganizerEvent(event: ManagedEvent, now: number) {
  const status = eventStatus(event, now)
  const publicPath =
    event.status === "PUBLISHED" && event.visibility !== "PRIVATE"
      ? `/events/${encodeURIComponent(event.id)}`
      : null
  const actions: ManagedEventAction[] = []
  if (
    (status === "draft" || status === "unpublished") &&
    event.venue &&
    Date.parse(event.endAt) > now
  ) {
    actions.push("publish")
  }
  if (status === "active" || status === "upcoming" || status === "published") {
    actions.push("unpublish")
    if (Date.parse(event.endAt) > now) actions.push("cancel")
  }

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    status,
    statusLabel: t(eventStatusLabels[status]),
    draftMessage:
      status === "draft"
        ? !event.venue
          ? t("Add a venue before publishing this draft.")
          : Date.parse(event.endAt) > now
            ? t("This event is a draft.")
            : t("Update the schedule before publishing this draft.")
        : null,
    visibility: t(visibilityLabels[event.visibility]),
    starts: formatDateTime(event.startAt),
    ends: formatDateTime(event.endAt),
    venue: event.venue?.name ?? t("Venue not set"),
    address: event.venue?.address,
    admission: event.venue
      ? event.venue.seatingMode === "GENERAL_ADMISSION"
        ? t("General admission")
        : t("Assigned seating")
      : t("Admission not configured"),
    publicPath,
    copyPath: event.visibility === "UNLISTED" ? publicPath : null,
    campaignsPath: organizerCampaignsPath(event.id),
    actions,
  }
}

export type OrganizerEvent = ReturnType<typeof presentOrganizerEvent>

function inventoryTotals(inventory: EventInventory | null | undefined) {
  if (!inventory) return null

  if (inventory.inventoryKind === "GENERAL_ADMISSION") {
    if (!inventory.gaAvailability.length) return null
    return inventory.gaAvailability.reduce(
      (totals, row) => ({
        capacity: totals.capacity + row.totalCapacity,
        sold: totals.sold + row.sold,
        reserved: totals.reserved + row.reserved,
        available: totals.available + row.available,
      }),
      { capacity: 0, sold: 0, reserved: 0, available: 0 }
    )
  }

  const seats = inventory.seatAvailability
  return seats.length
    ? {
        capacity: seats.length,
        sold: seats.filter((seat) => seat.status === "SOLD").length,
        reserved: seats.filter((seat) => seat.status === "HELD").length,
        available: seats.filter((seat) => seat.status === "AVAILABLE").length,
      }
    : null
}

const percent = numberFormat({
  style: "percent",
  maximumFractionDigits: 1,
})

export function presentInventory(inventory: EventInventory | null | undefined) {
  const totals = inventoryTotals(inventory)
  if (!totals) return null
  const sold = totals.capacity > 0 ? totals.sold / totals.capacity : null
  return {
    ...totals,
    progress:
      sold === null
        ? null
        : {
            value: Math.min(sold * 100, 100),
            label: t("{0} sold", percent.format(sold)),
          },
  }
}
