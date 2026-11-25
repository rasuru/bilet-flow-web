import { t } from "@/i18n/locale"
import { Link } from "wouter"

import type { AdminOrderAction } from "@/api/orders"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

import {
  ActionFeedback,
  AdminDialog,
  Details,
  QueryContent,
  RecordId,
  StatusBadge,
} from "./AdminUi"
import { formatAmount, formatDate, label } from "./adminPresentation"
import { useOrderDetailsViewModel } from "./useCommerceViewModels"

const actionText: Record<AdminOrderAction["action"], [string, string]> = {
  RESEND_TICKET: [
    "Resend ticket email",
    "Queue another copy of this ticket for the attendee's email address.",
  ],
  CANCEL_FREE_ORDER: [
    "Cancel free order",
    "Cancel this order and invalidate all of its tickets.",
  ],
  REQUEST_REFUND: [
    "Request full refund",
    "Send a full refund request to the bank. Settlement may take time.",
  ],
}

export function AdminOrderDetails({
  sessionId,
  orderId,
  onClose,
}: {
  sessionId: number
  orderId: string
  onClose: () => void
}) {
  const model = useOrderDetailsViewModel(sessionId, orderId)
  const detail = model.query.data
  const order = detail?.order
  const payment = detail?.payment
  return (
    <AdminDialog
      title={t("Order details")}
      onClose={onClose}
      pending={model.pending}
    >
      <QueryContent state={model.query}>
        {detail && order && (
          <div className="grid gap-4">
            <Details
              fields={[
                [t("Order ID"), <RecordId value={order.id} />],
                [t("Status"), <StatusBadge value={order.status} />],
                [
                  t("Event"),
                  <Link
                    className="text-primary underline"
                    href={`/admin/events?eventId=${encodeURIComponent(order.eventId)}`}
                  >
                    {detail.eventTitle || order.eventId}
                  </Link>,
                ],
                [
                  t("Buyer"),
                  model.buyer ?? <RecordId value={order.ownerUserId} />,
                ],
                [
                  t("Total"),
                  formatAmount(
                    detail.summary.totalAmount,
                    detail.summary.totalCurrency
                  ),
                ],
                [
                  t("Discount"),
                  formatAmount(
                    detail.summary.discountAmount,
                    detail.summary.discountCurrency
                  ),
                ],
                [
                  t("Promotion ID"),
                  <RecordId value={detail.summary.promotionId} />,
                ],
                [t("Created"), formatDate(order.createdAt)],
                [
                  t("Payment"),
                  payment && (
                    <Link
                      className="text-primary underline"
                      href={`/admin/payments?paymentId=${encodeURIComponent(payment.id)}`}
                    >
                      {label(payment.status)}
                    </Link>
                  ),
                ],
                [
                  t("Refund status"),
                  payment?.refundStatus
                    ? label(payment.refundStatus)
                    : order.refundState && label(order.refundState),
                ],
                [
                  t("Refund ID"),
                  <RecordId value={payment?.refundId ?? order.refundId} />,
                ],
              ]}
            />
            {payment?.reviewRequired && (
              <p className="text-sm text-destructive">
                {t("Payment review required")}
              </p>
            )}
            <section className="space-y-2 border-t pt-4">
              <h3 className="text-sm font-semibold">{t("Issued tickets")}</h3>
              {order.tickets.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("No tickets were issued.")}
                </p>
              )}
              <ul className="grid gap-2">
                {order.tickets.map((ticket) => {
                  const resend = detail.actions.find(
                    (action) =>
                      action.action === "RESEND_TICKET" &&
                      action.ticketId === ticket.id
                  )
                  return (
                    <li
                      key={ticket.id}
                      className="grid gap-2 rounded-lg border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm wrap-anywhere">
                          {ticket.attendeeEmail}
                        </span>
                        <StatusBadge value={ticket.status} />
                      </div>
                      <Details
                        fields={[
                          [t("Ticket ID"), <RecordId value={ticket.id} />],
                          [
                            t("Ticket type ID"),
                            <RecordId value={ticket.ticketTypeId} />,
                          ],
                          [t("Seat ID"), <RecordId value={ticket.seatId} />],
                        ]}
                      />
                      {resend && !model.selected && (
                        <Button
                          className="justify-self-start"
                          size="sm"
                          variant="outline"
                          onClick={() => model.select(resend)}
                        >
                          {t(actionText.RESEND_TICKET[0])}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
            {!model.selected && (
              <div className="flex flex-wrap gap-2">
                {detail.actions
                  .filter((action) => action.ticketId === null)
                  .map((action) => (
                    <Button
                      key={action.action}
                      variant="outline"
                      onClick={() => model.select(action)}
                    >
                      {t(actionText[action.action][0])}
                    </Button>
                  ))}
              </div>
            )}
            {model.selected && (
              <form
                className="grid gap-3 rounded-lg border p-3"
                onSubmit={model.submit}
              >
                <p className="text-sm font-medium">
                  {t(actionText[model.selected.action][0])}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(actionText[model.selected.action][1])}
                </p>
                {model.selected.ticketId && (
                  <RecordId value={model.selected.ticketId} />
                )}
                {model.selected.action !== "RESEND_TICKET" && (
                  <Field>
                    <FieldLabel htmlFor="order-action-reason">
                      {t("Reason")}
                    </FieldLabel>
                    <Textarea
                      id="order-action-reason"
                      name="reason"
                      maxLength={200}
                      required
                      disabled={model.pending}
                    />
                  </Field>
                )}
                {!model.allowed && (
                  <p role="status" className="text-sm text-destructive">
                    {t("This action is no longer available for the order.")}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => model.select(null)}
                    disabled={model.pending}
                  >
                    {t("Back")}
                  </Button>
                  <Button
                    type="submit"
                    variant={
                      model.selected.action === "RESEND_TICKET"
                        ? "default"
                        : "destructive"
                    }
                    disabled={!model.allowed || model.pending}
                  >
                    {model.pending ? t("Saving…") : t("Confirm action")}
                  </Button>
                </div>
              </form>
            )}
            <ActionFeedback error={model.error} success={model.success} />
            <section className="space-y-2 border-t pt-4">
              <h3 className="text-sm font-semibold">
                {t("Linked support cases")}
              </h3>
              <QueryContent state={model.cases}>
                {model.cases.data?.items.length ? (
                  <ul className="grid gap-2">
                    {model.cases.data.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/support/${encodeURIComponent(item.id)}`}
                          className="text-sm text-primary underline"
                        >
                          {item.subject}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("No support cases are linked to this order.")}
                  </p>
                )}
                {model.cases.data?.hasNext && (
                  <Link
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                    href={`/admin/support?orderId=${encodeURIComponent(order.id)}`}
                  >
                    {t("View all linked cases")}
                  </Link>
                )}
              </QueryContent>
            </section>
          </div>
        )}
      </QueryContent>
    </AdminDialog>
  )
}
