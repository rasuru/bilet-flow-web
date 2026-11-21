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
          label="Event ID"
          pattern={uuidPattern}
          value={draft.eventId ?? ""}
          onChange={(e) =>
            change("eventId", e.currentTarget.value || undefined)
          }
        />
        <FilterSelect
          id="order-status"
          title="Order status"
          values={orderStatuses}
          value={draft.status}
          onChange={(value) => change("status", value)}
        />
        {promotedOnly ? (
          <FilterInput
            id="promotion-id"
            label="Promotion ID"
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
              label="Order ID"
              pattern={uuidPattern}
              value={draft.orderId ?? ""}
              onChange={(e) =>
                change("orderId", e.currentTarget.value || undefined)
              }
            />
            <FilterInput
              id="order-owner"
              label="Buyer ID"
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
        caption={promotedOnly ? "Promotion activity" : "Orders"}
        columns={[
          "Order ID",
          "Status",
          promotedOnly ? "Promotion ID" : "Event ID",
          promotedOnly ? "Discount" : "Buyer",
          "Total",
          "",
        ]}
        items={query.data?.items ?? []}
        rowKey={(item) => item.id}
        state={query}
        empty={
          promotedOnly
            ? "No attributed orders match these filters."
            : "No orders match these filters."
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
          <RecordButton onClick={() => select(item)}>View order</RecordButton>,
        ]}
      />
      {selected && (
        <AdminDialog title="Order details" onClose={() => select(null)}>
          <Details
            fields={[
              ["Order ID", <RecordId value={selected.id} />],
              ["Status", <StatusBadge value={selected.status} />],
              ["Event ID", <RecordId value={selected.eventId} />],
              ["Buyer ID", selected.ownerId],
              [
                "Total",
                formatAmount(selected.totalAmount, selected.totalCurrency),
              ],
              [
                "Discount",
                formatAmount(
                  selected.discountAmount,
                  selected.discountCurrency
                ),
              ],
              ["Promotion ID", <RecordId value={selected.promotionId} />],
              ["Payment ID", <RecordId value={selected.paymentId} />],
              ["Refund ID", <RecordId value={selected.refundId} />],
            ]}
          />
          <Link
            href={`/admin/events?eventId=${encodeURIComponent(selected.eventId)}`}
            className={buttonVariants({
              variant: "outline",
              className: "justify-self-start",
            })}
          >
            View event
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
          title="Payment status"
          values={paymentStatuses}
          value={draft.status}
          onChange={(value) => change("status", value)}
        />
        <FilterSelect
          id="payment-purpose"
          title="Purpose"
          values={paymentPurposes}
          value={draft.purpose}
          onChange={(value) => change("purpose", value)}
        />
        <FilterInput
          id="payment-event"
          label="Event ID"
          pattern={uuidPattern}
          value={draft.eventId ?? ""}
          onChange={(e) =>
            change("eventId", e.currentTarget.value || undefined)
          }
        />
        <FilterInput
          id="payment-payer"
          label="Payer ID"
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
        caption="Payments"
        columns={[
          "Payment",
          "Status",
          "Amount",
          "Payer",
          "Paid or failed at",
          "",
        ]}
        items={query.data?.items ?? []}
        rowKey={(item) => item.id}
        state={query}
        empty="No payments match these filters."
        pagination={{ ...filters, hasNext: query.data?.hasNext ?? false }}
        cells={(item) => [
          <div className="min-w-36">
            <div className="font-medium">{label(item.purpose)}</div>
            <RecordId value={item.id} />
          </div>,
          <div className="space-y-1">
            <StatusBadge value={item.status} />
            {item.reviewRequired && (
              <p className="text-xs text-destructive">Review required</p>
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
            View payment
          </RecordButton>,
        ]}
      />
      {selected && (
        <AdminDialog title="Payment details" onClose={() => select(null)}>
          <Details
            fields={[
              ["Payment ID", <RecordId value={selected.id} />],
              ["Status", <StatusBadge value={selected.status} />],
              ["Purpose", label(selected.purpose)],
              ["Environment", selected.sandbox ? "Sandbox" : "Production"],
              ["Amount", formatAmount(selected.amountKzt)],
              ["Estimated fee", formatAmount(selected.estimatedFeeKzt)],
              ["Event ID", <RecordId value={selected.eventId} />],
              ["Order ID", <RecordId value={selected.orderId} />],
              ["Payer ID", selected.payerId],
              ["Organizer ID", selected.organizerId],
              ["Paid", formatDate(selected.paidAt)],
              ["Failed", formatDate(selected.failedAt)],
              [
                "Operation state",
                selected.operationState ? label(selected.operationState) : null,
              ],
              ["Review required", selected.reviewRequired ? "Yes" : "No"],
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
              View order
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
          title="Activation status"
          values={activationStatuses}
          value={filters.draft.status}
          onChange={(value) => filters.change("status", value)}
        />
      </Filters>
      <AdminTable
        caption="Paid-sales activations"
        columns={["Event ID", "Status", "Organizer", "Requested", ""]}
        items={query.data?.items ?? []}
        rowKey={(item) => item.eventId}
        state={query}
        empty="No activations match this filter."
        pagination={{ ...filters, hasNext: query.data?.hasNext ?? false }}
        cells={(item) => [
          <RecordId value={item.eventId} />,
          <StatusBadge value={item.status} />,
          item.organizerId,
          <span className="whitespace-nowrap">
            {formatDate(item.createdAt)}
          </span>,
          <RecordButton onClick={() => select(item)}>
            View activation
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
      title="Paid-sales activation"
      onClose={onClose}
      pending={model.pending}
    >
      <Details
        fields={[
          ["Event ID", <RecordId value={record.eventId} />],
          ["Status", <StatusBadge value={record.status} />],
          ["Payment ID", <RecordId value={record.paymentId} />],
          ["Organizer ID", record.organizerId],
          ["Requested", formatDate(record.createdAt)],
          ["Suspended", formatDate(record.suspendedAt)],
          ["Terms version", record.termsVersion],
          [
            "Verification simulated",
            record.verificationSimulated ? "Yes" : "No",
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
              Suspension reason
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
              This pauses paid sales for the event. Existing tickets stay valid.
            </FieldDescription>
          </Field>
          <ActionFeedback error={model.error} />
          <Button
            type="submit"
            variant="destructive"
            className="justify-self-end"
            disabled={model.pending}
          >
            {model.pending ? "Suspending…" : "Suspend paid sales"}
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
          <h2>Activation fee</h2>
        </CardTitle>
        <CardDescription>
          Applies to new paid-sales activation requests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QueryContent state={model.query}>
          {fee && (
            <form className="grid gap-3" onSubmit={model.submit}>
              <div className="flex flex-wrap items-end gap-3">
                <Field className="w-full sm:max-w-56">
                  <FieldLabel htmlFor="fee-amount">
                    Amount ({fee.currency})
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
                  {model.pending ? "Saving…" : "Save fee"}
                </Button>
              </div>
              {fee.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Updated {formatDate(fee.updatedAt)}
                  {fee.updatedBy ? ` by user ${fee.updatedBy}` : ""}.
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
          <h2>Operations summary</h2>
        </CardTitle>
        <CardDescription>
          The CSV includes counts for events, orders, payments, refunds,
          tickets, activations, event reports, and platform support cases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={model.submit}>
          <Field>
            <FieldLabel htmlFor="export-event">Event ID (optional)</FieldLabel>
            <Input
              id="export-event"
              name="eventId"
              pattern={uuidPattern}
              disabled={model.pending}
            />
            <FieldDescription>
              Leave blank to export platform-wide counts.
            </FieldDescription>
          </Field>
          <ActionFeedback error={model.error} success={model.success} />
          <Button
            type="submit"
            className="justify-self-start"
            disabled={model.pending}
          >
            <Download aria-hidden="true" />{" "}
            {model.pending ? "Preparing CSV…" : "Download CSV"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
