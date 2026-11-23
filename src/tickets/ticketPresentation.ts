import type { TicketStatus } from "@/api/tickets"

export const ticketStatusLabels: Record<TicketStatus, string> = {
  VALID: "Valid",
  CHECKED_IN: "Checked in",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  REFUND_PENDING: "Refund pending",
}

export function ticketDetailsPath(ticketId: string) {
  return `/my-tickets/${encodeURIComponent(ticketId)}`
}
