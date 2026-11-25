import type { AvailableResolutionAction, ResolutionContext, ResolutionPayment } from "@/api/support"
import { t, numberFormat, statusText } from "@/i18n/locale"
import { dateTime } from "./supportPresentation"

const money = numberFormat({ style: "currency", currency: "KZT" })
const labels: Record<string, string> = {
  RESEND_TICKET: "Resend ticket", REVERSE_CHECK_IN: "Reverse check-in",
  CANCEL_FREE_ORDER: "Cancel free order", REQUEST_REFUND: "Request full refund",
  VALID: "Valid", CHECKED_IN: "Checked in", CANCELLED: "Cancelled", REFUNDED: "Refunded",
  COMPLETED: "Completed", PENDING: "Pending", SUCCEEDED: "Succeeded", FAILED: "Failed",
  ACTIVE: "Active", SUSPENDED: "Suspended", REFUND_REQUESTED: "Refund requested",
  CAPTURED: "Captured", AUTHORIZED: "Authorized", OPEN: "Open", RESOLVED: "Resolved",
  CREATED: "Created", NONE: "None",
  CASE_OPENED: "Support case opened", CASE_ASSIGNED: "Support case assigned",
  CASE_STATUS_CHANGED: "Support case status changed", CASE_ESCALATED: "Support case escalated",
  ACTION_RESEND_TICKET: "Ticket email queued", ACTION_REVERSE_CHECK_IN: "Check-in reversed",
  ACTION_CANCEL_FREE_ORDER: "Free order cancelled", ACTION_REQUEST_REFUND: "Refund requested",
}
const status = (value: string | null | undefined) => value ? (labels[value] ? t(labels[value]) : statusText(value)) : "—"
export function actionLabel(action: AvailableResolutionAction) { return status(action.action) }
export function actionKey(action: AvailableResolutionAction) { return `${action.action}:${action.ticketId ?? "order"}` }
export function actionConfirmation(action: AvailableResolutionAction, context: ResolutionContext) {
  const order = context.order
  const email = order?.tickets.find(ticket => ticket.id === action.ticketId)?.attendeeEmail ?? "—"
  const financial = action.action === "REQUEST_REFUND" || action.action === "CANCEL_FREE_ORDER"
  const description = action.action === "REQUEST_REFUND"
    ? t("Request a refund of {0} for the entire order ({1} tickets). The bank must confirm the refund.", money.format(order?.amountKzt ?? 0), order?.tickets.length ?? 0)
    : action.action === "CANCEL_FREE_ORDER"
      ? t("Cancel the entire free order ({0} tickets) and release its inventory.", order?.tickets.length ?? 0)
      : action.action === "RESEND_TICKET"
        ? t("Queue delivery of the existing ticket to {0}.", email)
        : t("Allow the ticket for {0} to be used for admission again.", email)
  return { title: actionLabel(action), description, financial, destructive: action.action !== "RESEND_TICKET" }
}
export function actionReceipt(action: AvailableResolutionAction) {
  return t(action.action === "RESEND_TICKET" ? "Ticket email queued." : action.action === "REQUEST_REFUND" ? "Refund requested. Check its status below." : action.action === "CANCEL_FREE_ORDER" ? "Free order cancelled." : "Check-in reversed.")
}
function paymentView(payment: ResolutionPayment | null) {
  if (!payment) return null
  return { id: payment.id, status: status(payment.status), refund: status(payment.refundStatus), operation: [payment.bankOperation, payment.bankOperationState].filter(Boolean).map(status).join(" · ") || "—", reviewRequired: payment.reviewRequired }
}
export function resolutionPresentation(context: ResolutionContext) {
  const order = context.order
  const actions = context.actions.map(action => ({ ...action, key: actionKey(action), label: actionLabel(action), destructive: action.action !== "RESEND_TICKET" }))
  return {
    customer: context.requesterEmail ?? t("User {0}", context.requesterUserId),
    customerId: t("User {0}", context.requesterUserId),
    event: context.event && { ...context.event, date: dateTime.format(new Date(context.event.startsAt)), location: [context.event.venue, context.event.address].filter(Boolean).join(" · "), state: context.event.cancelled ? t("Cancelled") : context.event.suspended ? t("Suspended") : null },
    order: order && { id: order.id, owner: t("User {0}", order.ownerUserId), amount: money.format(order.amountKzt), status: status(order.status), refund: status(order.refundState), refundPending: order.refundState === "PENDING", date: dateTime.format(new Date(order.createdAt)), tickets: order.tickets.map(ticket => ({ ...ticket, status: status(ticket.status), linked: ticket.id === context.linkedTicketId, actions: actions.filter(action => action.ticketId === ticket.id) })), actions: actions.filter(action => !action.ticketId) },
    payment: paymentView(context.payment),
    activation: context.activation && { status: status(context.activation.status), payment: paymentView(context.activation.payment) },
    history: context.history.slice().reverse().map(entry => ({ ...entry, label: status(entry.action), date: dateTime.format(new Date(entry.occurredAt)), actor: t("User {0}", entry.actorUserId) })),
  }
}

