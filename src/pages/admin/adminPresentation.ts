import { ApiError } from "@/api/client"

export const uuidPattern =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"

export const eventStatuses = [
  "DRAFT",
  "PUBLISHED",
  "UNPUBLISHED",
  "SUSPENDED",
  "CANCELLED",
] as const
export const visibilities = ["PUBLIC", "UNLISTED", "PRIVATE"] as const
export const reportStatuses = ["OPEN", "CONFIRMED", "DISMISSED"] as const
export const supportStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
] as const
export const paymentStatuses = [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUND_REQUESTED",
  "REFUNDED",
] as const
export const paymentPurposes = ["TICKET", "ACTIVATION"] as const
export const activationStatuses = ["PENDING", "ACTIVE", "SUSPENDED"] as const
export const orderStatuses = ["COMPLETED", "CANCELLED"] as const

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateTime.format(date)
}

export function formatAmount(value: number, currency = "KZT") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(value)
}

const labels: Record<string, string> = {
  ATTENDEE_SUPPORT: "Attendee support",
  PLATFORM_SUPPORT: "Platform support",
  ACTIVATION: "Activation fee",
  TICKET: "Ticket purchase",
  REQUESTER: "Requester",
  SUPPORT_AGENT: "Support agent",
}

export function label(value: string) {
  return (
    labels[value] ??
    value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ")
  )
}

export function adminError(error: unknown) {
  if (!error) return null
  if (error instanceof ApiError) {
    return (
      error.fieldErrors.map((field) => field.message).join(" ") ||
      (error.status < 500 ? error.body?.detail : undefined) ||
      error.message
    )
  }
  return error instanceof Error ? error.message : "Something went wrong."
}

export function filterValue<T extends string>(
  values: readonly T[],
  value: string | null
) {
  return values.find((option) => option === value)
}
