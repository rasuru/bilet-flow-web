import { ApiError } from "@/api/client"
import type {
  SupportCategory,
  SupportStatus,
  SupportContext,
} from "@/api/support"

export const categories: { value: SupportCategory; label: string }[] = [
  { value: "TICKET_DELIVERY", label: "Ticket delivery" },
  { value: "PAYMENT", label: "Payment" },
  { value: "REFUND", label: "Refund" },
  { value: "SEATING", label: "Seating" },
  { value: "EVENT_INFORMATION", label: "Event information" },
  { value: "CHECK_IN", label: "Check-in" },
  { value: "ACCOUNT", label: "Account" },
  { value: "TECHNICAL", label: "Technical problem" },
  { value: "OTHER", label: "Other" },
]
export const statuses: { value: SupportStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_FOR_CUSTOMER", label: "Waiting for customer" },
  { value: "RESOLVED", label: "Resolved" },
]
export const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})
export const supportPath = (id: string) => `/support/${encodeURIComponent(id)}`
export function supportNewPath(context: SupportContext = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(context))
    if (value) params.set(key, value)
  return `/support/new${params.size ? `?${params}` : ""}`
}
export function contextLinks(context: SupportContext) {
  return [
    context.eventId && {
      label: "Event",
      href: `/events/${encodeURIComponent(context.eventId)}`,
    },
    context.orderId && {
      label: "Order",
      href: `/orders/${encodeURIComponent(context.orderId)}`,
    },
    context.ticketId && {
      label: "Ticket",
      href: `/my-tickets/${encodeURIComponent(context.ticketId)}`,
    },
  ].filter((link): link is { label: string; href: string } => !!link)
}

export function supportError(error: unknown, fallback: string) {
  return error instanceof ApiError
    ? (error.fieldErrors[0]?.message ??
        (error.status < 500 ? error.body?.detail : undefined) ??
        error.message)
    : fallback
}

export const supportRecipient = (
  type: "PLATFORM_SUPPORT" | "ATTENDEE_SUPPORT"
) => (type === "PLATFORM_SUPPORT" ? "Platform support" : "Event organizer")
