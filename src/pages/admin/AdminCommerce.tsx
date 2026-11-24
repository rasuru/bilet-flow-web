import { t } from "@/i18n/locale"
import { Download } from "lucide-react"
import { Link } from "wouter"

import type { ActivationRecord } from "@/api/payments"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  ActionFeedback,
  AdminDialog,
  AdminTable,
  Details,
  FilterInput,
  Filters,
  FilterSelect,
  QueryContent,
  RecordButton,
  RecordId,
  StatusBadge,
} from "./AdminUi"
import {
  activationStatuses,
  formatAmount,
  formatDate,
  label,
  orderStatuses,
  paymentPurposes,
  paymentStatuses,
  uuidPattern,
} from "./adminPresentation"
import {
  useActivationFeeViewModel,
  useActivationsViewModel,
  useAdminOrdersViewModel,
  useAdminPaymentsViewModel,
  useOperationsExportViewModel,
  useSuspendActivationViewModel,
} from "./useCommerceViewModels"

export function AdminOrders({
  sessionId,
  params,
  promotedOnly = false,
}: {
  sessionId: number
  params: URLSearchParams
  promotedOnly?: boolean
}) {
  const { filters, query, selected, select } = useAdminOrdersViewModel(
    sessionId,
    params,
    promotedOnly
  )
  const { draft, change } = filters

  return (
    <>
      <Filters onApply={filters.apply} onReset={filters.reset}>
        <FilterInput
          id="order-event"
          label={t("Event ID")}
          pattern={uuidPattern}
          value={draft.eventId ?? ""}
          onChange={(e) =>
            change("eventId", e.currentTarget.value || undefined)
          }
        />
        <FilterSelect
          id="order-status"
          title={t("Order status")}
          values={orderStatuses}
          value={draft.status}
          onChange={(value) => change("status", value)}
        />
        {promotedOnly ? (
          <FilterInput
            id="promotion-id"
            label={t("Promotion ID")}
            pattern={uuidPattern}
            value={draft.promotionId ?? ""}
            onChange={(e) =>
              change("promotionId", e.currentTarget.value || undefined)
            }
          />
        ) : (
          <>
            <FilterInput
              id="order-id"
              label={t("Order ID")}
              pattern={uuidPattern}
              value={draft.orderId ?? ""}
              onChange={(e) =>
                change("orderId", e.currentTarget.value || undefined)
              }
            />
            <FilterInput
              id="order-owner"
              label={t("Buyer ID")}
              type="number"
              min={1}
              step={1}
              max={Number.MAX_SAFE_INTEGER}
              value={draft.ownerId ?? ""}
              onChange={(e) =>
                change(
                  "ownerId",
                  e.currentTarget.value === ""
                    ? undefined
                    : e.currentTarget.valueAsNumber
                )
              }
            />
          </>
        )}
      </Filters>
      <AdminTable
        caption={promotedOnly ? t("Promotion activity") : t("Orders")}
        columns={[
          t("Order ID"),
          t("Status"),
          promotedOnly ? t("Promotion ID") : t("Event ID"),
          promotedOnly ? t("Discount") : t("Buyer"),
          t("Total"),
          "",
        ]}
        items={query.data?.items ?? []}
        rowKey={(item) => item.id}
        state={query}
        empty={
          promotedOnly
            ? t("No attributed orders match these filters.")
            : t("No orders match these filters.")
        }
        pagination={{ ...filters, hasNext: query.data?.hasNext ?? false }}
        cells={(item) => [
          <RecordId value={item.id} />,
          <StatusBadge value={item.status} />,
          <RecordId value={promotedOnly ? item.promotionId : item.eventId} />,
          promotedOnly ? (
            formatAmount(item.discountAmount, item.discountCurrency)
          ) : (
            <RecordId value={item.ownerId} />
          ),
          <span className="whitespace-nowrap tabular-nums">
            {formatAmount(item.totalAmount, item.totalCurrency)}
          </span>,
          <RecordButton onClick={() => select(item)}>
            {t("View order")}
          </RecordButton>,
        ]}
      />
      {selected && (
        <AdminDialog title={t("Order details")} onClose={() => select(null)}>
          <Details
            fields={[
              [t("Order ID"), <RecordId value={selected.id} />],
              [t("Status"), <StatusBadge value={selected.status} />],
              [t("Event ID"), <RecordId value={selected.eventId} />],
              [t("Buyer ID"), selected.ownerId],
              [
                t("Total"),
                formatAmount(selected.totalAmount, selected.totalCurrency),
              ],
              [
                t("Discount"),
                formatAmount(
                  selected.discountAmount,
                  selected.discountCurrency
                ),
              ],
              [t("Promotion ID"), <RecordId value={selected.promotionId} />],
              [t("Payment ID"), <RecordId value={selected.paymentId} />],
              [t("Refund ID"), <RecordId value={selected.refundId} />],
            ]}
          />
          <Link
            href={`/admin/events?eventId=${encodeURIComponent(selected.eventId)}`}
            className={buttonVariants({
              variant: "outline",
              className: "justify-self-start",
            })}
          >
            {t("View event")}
          </Link>
        </AdminDialog>
      )}
    </>
  )
}

export function AdminPayments({
  sessionId,
  params,
}: {
  sessionId: number
  params: URLSearchParams
}) {
  const { filters, query, selected, select } = useAdminPaymentsViewModel(
    sessionId,
    params
  )
  const { draft, change } = filters

  return (
    <>
      <Filters onApply={filters.apply} onReset={filters.reset}>
        <FilterSelect
          id="payment-status"
          title={t("Payment status")}
          values={paymentStatuses}
          value={draft.status}
          onChange={(value) => change("status", value)}
        />
        <FilterSelect
          id="payment-purpose"
          title={t("Purpose")}
          values={paymentPurposes}
          value={draft.purpose}
          onChange={(value) => change("purpose", value)}
        />
        <FilterInput
          id="payment-event"
          label={t("Event ID")}
          pattern={uuidPattern}
          value={draft.eventId ?? ""}
          onChange={(e) =>
            change("eventId", e.currentTarget.value || undefined)
          }
        />
        <FilterInput
          id="payment-payer"
          label={t("Payer ID")}
          type="number"
          min={1}
          step={1}
          max={Number.MAX_SAFE_INTEGER}
          value={draft.payerId ?? ""}
          onChange={(e) =>
            change(
              "payerId",
              e.currentTarget.value === ""
                ? undefined
                : e.currentTarget.valueAsNumber
            )
          }
        />
      </Filters>
      <AdminTable
        caption={t("Payments")}
        columns={[
          t("Payment"),
          t("Status"),
          t("Amount"),
          t("Payer"),
          t("Paid or failed at"),
          "",
        ]}
        items={query.data?.items ?? []}
        rowKey={(item) => item.id}
        state={query}
        empty={t("No payments match these filters.")}
        pagination={{ ...filters, hasNext: query.data?.hasNext ?? false }}
        cells={(item) => [
          <div className="min-w-36">
            <div className="font-medium">{label(item.purpose)}</div>
            <RecordId value={item.id} />
          </div>,
          <div className="space-y-1">
            <StatusBadge value={item.status} />
            {item.reviewRequired && (
              <p className="text-xs text-destructive">{t("Review required")}</p>
            )}
          </div>,
          <span className="whitespace-nowrap tabular-nums">
            {formatAmount(item.amountKzt)}
          </span>,
          item.payerId,
          <span className="whitespace-nowrap">
            {formatDate(item.failedAt ?? item.paidAt)}
          </span>,
          <RecordButton onClick={() => select(item)}>
            {t("View payment")}
          </RecordButton>,
        ]}
      />
      {selected && (
        <AdminDialog title={t("Payment details")} onClose={() => select(null)}>
          <Details
            fields={[
              [t("Payment ID"), <RecordId value={selected.id} />],
              [t("Status"), <StatusBadge value={selected.status} />],
              [t("Purpose"), label(selected.purpose)],
              [
                t("Environment"),
                selected.sandbox ? t("Sandbox") : t("Production"),
              ],
              [t("Amount"), formatAmount(selected.amountKzt)],
              [t("Estimated fee"), formatAmount(selected.estimatedFeeKzt)],
              [t("Event ID"), <RecordId value={selected.eventId} />],
              [t("Order ID"), <RecordId value={selected.orderId} />],
              [t("Payer ID"), selected.payerId],
              [t("Organizer ID"), selected.organizerId],
              [t("Paid"), formatDate(selected.paidAt)],
              [t("Failed"), formatDate(selected.failedAt)],
              [
                t("Operation state"),
                selected.operationState ? label(selected.operationState) : null,
              ],
              [
                t("Review required"),
                selected.reviewRequired ? t("Yes") : t("No"),
              ],
            ]}
          />
          {selected.failureReason && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm wrap-anywhere text-destructive">
              {selected.failureReason}
            </p>
          )}
          {selected.orderId && (
            <Link
              href={`/admin/orders?orderId=${encodeURIComponent(selected.orderId)}`}
              className={buttonVariants({
                variant: "outline",
                className: "justify-self-start",
              })}
            >
              {t("View order")}
            </Link>
          )}
        </AdminDialog>
      )}
    </>
  )
}

export function AdminActivations({ sessionId }: { sessionId: number }) {
  const { filters, query, selected, select } =
    useActivationsViewModel(sessionId)
  return (
    <>
      <ActivationFeeCard sessionId={sessionId} />
      <Filters onApply={filters.apply} onReset={filters.reset}>
        <FilterSelect
          id="activation-status"
          title={t("Activation status")}
          values={activationStatuses}
          value={filters.draft.status}
          onChange={(value) => filters.change("status", value)}
        />
      </Filters>
      <AdminTable
        caption={t("Paid-sales activations")}
        columns={[
          t("Event ID"),
          t("Status"),
          t("Organizer"),
          t("Requested"),
          "",
        ]}
        items={query.data?.items ?? []}
        rowKey={(item) => item.eventId}
        state={query}
        empty={t("No activations match this filter.")}
        pagination={{ ...filters, hasNext: query.data?.hasNext ?? false }}
        cells={(item) => [
          <RecordId value={item.eventId} />,
          <StatusBadge value={item.status} />,
          item.organizerId,
          <span className="whitespace-nowrap">
            {formatDate(item.createdAt)}
          </span>,
          <RecordButton onClick={() => select(item)}>
            {t("View activation")}
          </RecordButton>,
        ]}
      />
      {selected && (
        <ActivationDialog
          sessionId={sessionId}
          record={selected}
          onClose={() => select(null)}
        />
      )}
    </>
  )
}

function ActivationDialog({
  sessionId,
  record,
  onClose,
}: {
  sessionId: number
  record: ActivationRecord
  onClose: () => void
}) {
  const model = useSuspendActivationViewModel(sessionId, record, onClose)
  return (
    <AdminDialog
      title={t("Paid-sales activation")}
      onClose={onClose}
      pending={model.pending}
    >
      <Details
        fields={[
          [t("Event ID"), <RecordId value={record.eventId} />],
          [t("Status"), <StatusBadge value={record.status} />],
          [t("Payment ID"), <RecordId value={record.paymentId} />],
          [t("Organizer ID"), record.organizerId],
          [t("Requested"), formatDate(record.createdAt)],
          [t("Suspended"), formatDate(record.suspendedAt)],
          [t("Terms version"), record.termsVersion],
          [
            t("Verification simulated"),
            record.verificationSimulated ? t("Yes") : t("No"),
          ],
        ]}
      />
      {record.suspensionReason && (
        <p className="text-sm wrap-anywhere text-muted-foreground">
          {record.suspensionReason}
        </p>
      )}
      {record.status === "ACTIVE" && (
        <form className="grid gap-3 border-t pt-4" onSubmit={model.submit}>
          <Field>
            <FieldLabel htmlFor="activation-reason">
              {t("Suspension reason")}
            </FieldLabel>
            <Textarea
              id="activation-reason"
              name="reason"
              maxLength={200}
              required
              rows={3}
              disabled={model.pending}
            />
            <FieldDescription>
              {t(
                "This pauses paid sales for the event. Existing tickets stay valid."
              )}
            </FieldDescription>
          </Field>
          <ActionFeedback error={model.error} />
          <Button
            type="submit"
            variant="destructive"
            className="justify-self-end"
            disabled={model.pending}
          >
            {model.pending ? t("Suspending…") : t("Suspend paid sales")}
          </Button>
        </form>
      )}
    </AdminDialog>
  )
}

function ActivationFeeCard({ sessionId }: { sessionId: number }) {
  const model = useActivationFeeViewModel(sessionId)
  const fee = model.query.data
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("Activation fee")}</h2>
        </CardTitle>
        <CardDescription>
          {t("Applies to new paid-sales activation requests.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QueryContent state={model.query}>
          {fee && (
            <form className="grid gap-3" onSubmit={model.submit}>
              <div className="flex flex-wrap items-end gap-3">
                <Field className="w-full sm:max-w-56">
                  <FieldLabel htmlFor="fee-amount">
                    {model.amountLabel}
                  </FieldLabel>
                  <Input
                    id="fee-amount"
                    inputMode="decimal"
                    required
                    maxLength={20}
                    value={model.value}
                    onChange={(e) => model.change(e.currentTarget.value)}
                    disabled={model.pending}
                  />
                </Field>
                <Button type="submit" disabled={!model.canSave}>
                  {model.pending ? t("Saving…") : t("Save fee")}
                </Button>
              </div>
              {fee.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  {t("Updated")} {formatDate(fee.updatedAt)}
                  {fee.updatedBy ? t(" by user {0}", fee.updatedBy) : ""}.
                </p>
              )}
              <ActionFeedback error={model.error} success={model.success} />
            </form>
          )}
        </QueryContent>
      </CardContent>
    </Card>
  )
}

export function AdminExports({ sessionId }: { sessionId: number }) {
  const model = useOperationsExportViewModel(sessionId)
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>
          <h2>{t("Operations summary")}</h2>
        </CardTitle>
        <CardDescription>
          {t(
            "The CSV includes counts for events, orders, payments, refunds, tickets, activations, event reports, and platform support cases."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={model.submit}>
          <Field>
            <FieldLabel htmlFor="export-event">
              {t("Event ID (optional)")}
            </FieldLabel>
            <Input
              id="export-event"
              name="eventId"
              pattern={uuidPattern}
              disabled={model.pending}
            />
            <FieldDescription>
              {t("Leave blank to export platform-wide counts.")}
            </FieldDescription>
          </Field>
          <ActionFeedback error={model.error} success={model.success} />
          <Button
            type="submit"
            className="justify-self-start"
            disabled={model.pending}
          >
            <Download aria-hidden="true" />{" "}
            {model.pending ? t("Preparing CSV…") : t("Download CSV")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

