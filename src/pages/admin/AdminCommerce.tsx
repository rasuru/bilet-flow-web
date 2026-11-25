import { t } from "@/i18n/locale"
import { useState } from "react"
import { Download } from "lucide-react"
import { Link } from "wouter"

import type { FeeSetting } from "@/admin/adminRepository"
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

import { AdminOrderDetails } from "./AdminOrderDetails"
import { PaymentDetails, PaymentReviewQueue } from "./AdminPaymentReview"

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
  useFeeSettingViewModel,
  useActivationsViewModel,
  useAdminOrdersViewModel,
  useAdminPaymentsViewModel,
  useOperationsExportViewModel,
  useModerateActivationViewModel,
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
  const { filters, query, selected, select, labels } = useAdminOrdersViewModel(
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
          promotedOnly ? t("Promotion ID") : t("Event"),
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
          promotedOnly ? (
            <RecordId value={item.promotionId} />
          ) : (
            <Link
              className="text-primary hover:underline"
              href={`/admin/events?eventId=${encodeURIComponent(item.eventId)}`}
            >
              {labels.events.get(item.eventId) ?? (
                <RecordId value={item.eventId} />
              )}
            </Link>
          ),
          promotedOnly
            ? formatAmount(item.discountAmount, item.discountCurrency)
            : (labels.users.get(item.ownerId) ?? (
                <RecordId value={item.ownerId} />
              )),
          <span className="whitespace-nowrap tabular-nums">
            {formatAmount(item.totalAmount, item.totalCurrency)}
          </span>,
          <RecordButton onClick={() => select(item.id)}>
            {t("View order")}
          </RecordButton>,
        ]}
      />
      {selected && (
        <AdminOrderDetails
          key={selected}
          sessionId={sessionId}
          orderId={selected}
          onClose={() => select(null)}
        />
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
  const { filters, query, selected, select, labels } =
    useAdminPaymentsViewModel(
      sessionId,
      params,
      params.get("queue") !== "review"
    )
  const { draft, change } = filters

  const review = params.get("queue") === "review"
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <>
      <nav aria-label={t("Payment views")} className="flex flex-wrap gap-2">
        <Link
          href="/admin/payments?queue=review"
          aria-current={review ? "page" : undefined}
          className={buttonVariants({
            variant: review ? "default" : "outline",
          })}
        >
          {t("Needs review")}
        </Link>
        <Link
          href="/admin/payments"
          aria-current={!review ? "page" : undefined}
          className={buttonVariants({
            variant: review ? "outline" : "default",
          })}
        >
          {t("All payments")}
        </Link>
      </nav>
      <ActionFeedback error={null} success={notice} />
      {review ? (
        <PaymentReviewQueue sessionId={sessionId} select={select} />
      ) : (
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
              t("Event"),
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
                  <p className="text-xs text-destructive">
                    {t("Review required")}
                  </p>
                )}
              </div>,
              <span className="whitespace-nowrap tabular-nums">
                {formatAmount(item.amountKzt)}
              </span>,
              item.eventId ? (
                <Link
                  className="text-primary hover:underline"
                  href={`/admin/events?eventId=${encodeURIComponent(item.eventId)}`}
                >
                  {labels.events.get(item.eventId) ?? (
                    <RecordId value={item.eventId} />
                  )}
                </Link>
              ) : (
                "—"
              ),
              labels.users.get(item.payerId) ?? (
                <RecordId value={item.payerId} />
              ),
              <span className="whitespace-nowrap">
                {formatDate(item.failedAt ?? item.paidAt)}
              </span>,
              <RecordButton onClick={() => select(item.id)}>
                {t("View payment")}
              </RecordButton>,
            ]}
          />
        </>
      )}
      {selected && (
        <PaymentDetails
          key={selected}
          sessionId={sessionId}
          paymentId={selected}
          onClose={() => select(null)}
          onResolved={() => {
            setNotice(t("Payment resolution recorded."))
            select(null)
          }}
        />
      )}
    </>
  )
}

export function AdminActivations({ sessionId }: { sessionId: number }) {
  const { filters, query, selected, select, labels } =
    useActivationsViewModel(sessionId)
  const [notice, setNotice] = useState<string | null>(null)
  return (
    <>
      <Link
        href="/admin/settings"
        className={buttonVariants({ variant: "outline" })}
      >
        {t("Fee settings")}
      </Link>
      <ActionFeedback error={null} success={notice} />
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
        columns={[t("Event"), t("Status"), t("Organizer"), t("Requested"), ""]}
        items={query.data?.items ?? []}
        rowKey={(item) => item.eventId}
        state={query}
        empty={t("No activations match this filter.")}
        pagination={{ ...filters, hasNext: query.data?.hasNext ?? false }}
        cells={(item) => [
          <Link
            className="text-primary hover:underline"
            href={`/admin/events?eventId=${encodeURIComponent(item.eventId)}`}
          >
            {labels.events.get(item.eventId) ?? (
              <RecordId value={item.eventId} />
            )}
          </Link>,
          <StatusBadge value={item.status} />,
          labels.users.get(item.organizerId) ?? (
            <RecordId value={item.organizerId} />
          ),
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
          onSuccess={() => {
            setNotice(
              t(
                selected.status === "SUSPENDED"
                  ? "Paid sales reinstated."
                  : "Paid sales suspended."
              )
            )
            select(null)
          }}
        />
      )}
    </>
  )
}

function ActivationDialog({
  sessionId,
  record,
  onClose,
  onSuccess,
}: {
  sessionId: number
  record: ActivationRecord
  onClose: () => void
  onSuccess: () => void
}) {
  const model = useModerateActivationViewModel(sessionId, record, onSuccess)
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
          [
            t("Payment ID"),
            record.paymentId && (
              <Link
                className="text-primary underline"
                href={`/admin/payments?paymentId=${encodeURIComponent(record.paymentId)}`}
              >
                {record.paymentId}
              </Link>
            ),
          ],
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
      {record.status !== "PENDING" && (
        <form className="grid gap-3 border-t pt-4" onSubmit={model.submit}>
          <Field>
            <FieldLabel htmlFor="activation-reason">
              {t(
                record.status === "SUSPENDED"
                  ? "Reinstatement reason"
                  : "Suspension reason"
              )}
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
                record.status === "SUSPENDED"
                  ? "Reinstatement restores paid sales when registration is open. No new fee is charged."
                  : "This pauses paid sales for the event. Existing tickets stay valid."
              )}
            </FieldDescription>
          </Field>
          <ActionFeedback error={model.error} />
          <Button
            type="submit"
            variant={record.status === "SUSPENDED" ? "default" : "destructive"}
            className="justify-self-end"
            disabled={model.pending}
          >
            {model.pending
              ? t("Saving…")
              : t(
                  record.status === "SUSPENDED"
                    ? "Reinstate paid sales"
                    : "Suspend paid sales"
                )}
          </Button>
        </form>
      )}
    </AdminDialog>
  )
}

export function AdminSettings({ sessionId }: { sessionId: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FeeSettingCard sessionId={sessionId} setting="activation-fee" />
      <FeeSettingCard sessionId={sessionId} setting="processing-fee-rate" />
    </div>
  )
}

function FeeSettingCard({
  sessionId,
  setting,
}: {
  sessionId: number
  setting: FeeSetting
}) {
  const model = useFeeSettingViewModel(sessionId, setting)
  const activation = setting === "activation-fee"
  const fee = model.query.data
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t(activation ? "Activation fee" : "Processing fee rate")}</h2>
        </CardTitle>
        <CardDescription>
          {t(
            activation
              ? "Applies to new paid-sales activation requests."
              : "Applies to the estimated fee on new ticket payments."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QueryContent state={model.query}>
          {fee && (
            <form className="grid gap-3" onSubmit={model.submit}>
              <div className="flex flex-wrap items-end gap-3">
                <Field className="w-full sm:max-w-56">
                  <FieldLabel htmlFor={setting}>
                    {activation
                      ? t(
                          "Amount ({0})",
                          fee.currency === "KZT" ? "₸" : (fee.currency ?? "₸")
                        )
                      : t("Rate (%)")}
                  </FieldLabel>
                  <Input
                    id={setting}
                    inputMode="decimal"
                    required
                    maxLength={activation ? 20 : 5}
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
