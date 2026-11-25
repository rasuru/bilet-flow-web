import { t } from "@/i18n/locale"
import { Link } from "wouter"

import type { AdminPayment, OperationResolutionRequest } from "@/api/payments"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

import {
  ActionFeedback,
  AdminDialog,
  AdminTable,
  Details,
  QueryContent,
  RecordButton,
  RecordId,
  StatusBadge,
} from "./AdminUi"
import { formatAmount, formatDate, label } from "./adminPresentation"
import {
  usePaymentDetailsViewModel,
  usePaymentOperationsViewModel,
  usePaymentResolutionViewModel,
} from "./useCommerceViewModels"

const resolutionLabels: Record<
  OperationResolutionRequest["resolution"],
  [string, string]
> = {
  CLEAR_REVIEW: [
    "Clear review flag",
    "Clear the flag after investigating the payment. The existing bank operation remains in place.",
  ],
  CONFIRMED_NOT_EXECUTED_RETRY: [
    "Allow the bank operation to retry",
    "Use only after the bank confirms the operation never executed. A pending bank status alone is insufficient evidence.",
  ],
  FULL_REFUND_CONFIRMED_COMPLETED: [
    "Record a completed full refund",
    "Use after the bank confirms that the full amount was refunded. This reconciles the order or paid-sales activation.",
  ],
  REFUND_CONFIRMED_REJECTED: [
    "Record a rejected refund",
    "Use after the bank confirms rejection of this refund. BiletFlow records the refund as failed.",
  ],
}

export function PaymentReviewQueue({
  sessionId,
  select,
}: {
  sessionId: number
  select: (id: string) => void
}) {
  const query = usePaymentOperationsViewModel(sessionId)
  return (
    <AdminTable
      caption={t("Payments needing review")}
      columns={[
        t("Payment ID"),
        t("Status"),
        t("Bank operation"),
        t("Operation state"),
        "",
      ]}
      items={query.data ?? []}
      rowKey={(item) => item.id}
      state={query}
      empty={t("No payments need review.")}
      cells={(item) => [
        <RecordId value={item.id} />,
        <StatusBadge value={item.status} />,
        item.bankOperation ? label(item.bankOperation) : "—",
        item.bankOperationState ? label(item.bankOperationState) : "—",
        <RecordButton onClick={() => select(item.id)}>
          {t("Review payment")}
        </RecordButton>,
      ]}
    />
  )
}

export function PaymentDetails({
  sessionId,
  paymentId,
  onClose,
  onResolved,
}: {
  sessionId: number
  paymentId: string
  onClose: () => void
  onResolved: () => void
}) {
  const { query, labels } = usePaymentDetailsViewModel(sessionId, paymentId)
  const model = usePaymentResolutionViewModel(sessionId, query.data, onResolved)
  const payment = query.data
  return (
    <AdminDialog
      title={t("Payment details")}
      onClose={onClose}
      pending={model.pending}
    >
      <QueryContent state={query}>
        {payment && (
          <div className="grid gap-4">
            <PaymentRecord
              payment={payment}
              eventTitle={
                payment.eventId ? labels.events.get(payment.eventId) : undefined
              }
              payer={labels.users.get(payment.payerId)}
              organizer={labels.users.get(payment.organizerId)}
            />
            {!!payment.resolutions.length && (
              <form
                className="grid gap-3 border-t pt-4"
                onSubmit={model.submit}
              >
                <Field>
                  <FieldLabel htmlFor="payment-resolution">
                    {t("Resolution")}
                  </FieldLabel>
                  <NativeSelect
                    id="payment-resolution"
                    className="w-full"
                    value={model.choice ?? ""}
                    onChange={(event) =>
                      model.setChoice(event.currentTarget.value)
                    }
                    required
                    disabled={model.pending}
                  >
                    <NativeSelectOption value="">
                      {t("Choose a resolution")}
                    </NativeSelectOption>
                    {payment.resolutions.map((option) => (
                      <NativeSelectOption key={option} value={option}>
                        {t(resolutionLabels[option][0])}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  {model.choice && (
                    <FieldDescription>
                      {t(resolutionLabels[model.choice][1])}
                    </FieldDescription>
                  )}
                </Field>
                <div
                  className="grid gap-3"
                  key={model.choice ?? "no-resolution"}
                >
                  <Field>
                    <FieldLabel htmlFor="bank-support-reference">
                      {t("Bank support reference")}
                    </FieldLabel>
                    <Input
                      id="bank-support-reference"
                      name="reference"
                      maxLength={200}
                      pattern={".*\\S.*"}
                      required
                      disabled={model.pending}
                    />
                  </Field>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      className="mt-1"
                      type="checkbox"
                      name="confirmed"
                      required
                      disabled={model.pending}
                    />
                    {t("I verified this outcome independently with the bank.")}
                  </label>
                </div>
                <Button
                  type="submit"
                  className="justify-self-end"
                  disabled={!model.choice || model.pending}
                >
                  {model.pending ? t("Saving…") : t("Record resolution")}
                </Button>
              </form>
            )}
            <ActionFeedback error={model.error} />
          </div>
        )}
      </QueryContent>
    </AdminDialog>
  )
}

function PaymentRecord({
  payment,
  eventTitle,
  payer,
  organizer,
}: {
  payment: AdminPayment
  eventTitle?: string
  payer?: string
  organizer?: string
}) {
  return (
    <>
      <Details
        fields={[
          [t("Payment ID"), <RecordId value={payment.id} />],
          [t("Status"), <StatusBadge value={payment.status} />],
          [t("Purpose"), label(payment.purpose)],
          [t("Environment"), payment.sandbox ? t("Sandbox") : t("Production")],
          [t("Amount"), formatAmount(payment.amountKzt)],
          [t("Estimated fee"), formatAmount(payment.estimatedFeeKzt)],
          [
            t("Event"),
            payment.eventId && (
              <Link
                className="text-primary underline"
                href={`/admin/events?eventId=${encodeURIComponent(payment.eventId)}`}
              >
                {eventTitle ?? <RecordId value={payment.eventId} />}
              </Link>
            ),
          ],
          [
            t("Order ID"),
            payment.orderId && (
              <Link
                className="text-primary underline"
                href={`/admin/orders?orderId=${encodeURIComponent(payment.orderId)}`}
              >
                <RecordId value={payment.orderId} />
              </Link>
            ),
          ],
          [t("Payer"), payer ?? <RecordId value={payment.payerId} />],
          [
            t("Organizer"),
            organizer ?? <RecordId value={payment.organizerId} />,
          ],
          [t("Paid"), formatDate(payment.paidAt)],
          [t("Failed"), formatDate(payment.failedAt)],
          [t("Refund ID"), <RecordId value={payment.refundId} />],
          [
            t("Refund status"),
            payment.refundStatus && label(payment.refundStatus),
          ],
          [
            t("Bank operation"),
            payment.bankOperation && label(payment.bankOperation),
          ],
          [t("Operation ID"), <RecordId value={payment.bankOperationId} />],
          [t("Operation dispatched"), formatDate(payment.bankOperationAt)],
          [
            t("Operation state"),
            payment.operationState && label(payment.operationState),
          ],
          [t("Review required"), payment.reviewRequired ? t("Yes") : t("No")],
        ]}
      />
      {payment.failureReason && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm wrap-anywhere text-destructive">
          {payment.failureReason}
        </p>
      )}
      {payment.orderId && (
        <Link
          href={`/admin/orders?orderId=${encodeURIComponent(payment.orderId)}`}
          className={buttonVariants({
            variant: "outline",
            className: "justify-self-start",
          })}
        >
          {t("View order")}
        </Link>
      )}
    </>
  )
}
