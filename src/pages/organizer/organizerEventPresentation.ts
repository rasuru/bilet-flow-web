import { dateFormat, t } from "@/i18n/locale"
import type { ManagedEvent } from "@/api/events"
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

const listDate = dateFormat({
  day: "numeric",
  month: "numeric",
  year: "numeric",
})
const listTime = dateFormat({ timeStyle: "short" })

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

export function manageEventPath(eventId: string) {
  return `/organizer/events/${encodeURIComponent(eventId)}`
}

export function presentOrganizerEvent(event: ManagedEvent, now: number) {
  const status = eventStatus(event, now)
  const startsAt = Date.parse(event.startAt)
  const publicPath =
    event.status === "PUBLISHED"
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
  }

  if (event.status !== "CANCELLED" && Date.parse(event.endAt) > now) {
    actions.push("cancel")
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
    startsAt,
    startDate: Number.isFinite(startsAt)
      ? listDate.format(startsAt)
      : t("Not scheduled"),
    startTime: Number.isFinite(startsAt) ? listTime.format(startsAt) : null,
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
    managePath: manageEventPath(event.id),
    campaignsPath: organizerCampaignsPath(event.id),
    actions,
    hasActions: actions.length > 0,
    menuActions: actions.map((action) => ({
      action,
      label: t(eventActionLabels[action]),
      variant: action === "cancel" ? "destructive" as const : "default" as const,
    })),
  }
}

export type OrganizerEvent = ReturnType<typeof presentOrganizerEvent>

