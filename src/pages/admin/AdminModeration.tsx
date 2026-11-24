import { t } from "@/i18n/locale"
import { Link } from "wouter"

import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
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
  eventStatuses,
  formatDate,
  label,
  reportStatuses,
  supportStatuses,
  uuidPattern,
  visibilities,
} from "./adminPresentation"
import {
  useAdminSupportCaseViewModel,
  useEventListViewModel,
  useEventModerationViewModel,
  useEventReportViewModel,
  useReportListViewModel,
  useSupportListViewModel,
} from "./useModerationViewModels"

type SectionProps = { sessionId: number; params: URLSearchParams }

export function AdminEvents({ sessionId, params }: SectionProps) {
  const { filters, query, selected, select } = useEventListViewModel(
    sessionId,
    params
  )
  const { draft, change } = filters
  return (
    <>
      <Filters onApply={filters.apply} onReset={filters.reset}>
        <FilterInput
          id="event-search"
          label={t("Title or category")}
          type="search"
          maxLength={255}
          value={draft.search ?? ""}
          onChange={(e) => change("search", e.currentTarget.value)}
        />
        <FilterSelect
          id="event-status"
          title={t("Event status")}
          values={eventStatuses}
          value={draft.status}
          onChange={(value) => change("status", value)}
        />
        <FilterSelect
          id="event-visibility"
          title={t("Visibility")}
          values={visibilities}
          value={draft.visibility}
          onChange={(value) => change("visibility", value)}
        />
        <FilterInput
          id="event-organizer"
          label={t("Organizer ID")}
          type="number"
          min={1}
          step={1}
          max={Number.MAX_SAFE_INTEGER}
          value={draft.organizerId ?? ""}
          onChange={(e) =>
            change(
              "organizerId",
              e.currentTarget.value === ""
                ? undefined
                : e.currentTarget.valueAsNumber
            )
          }
        />
      </Filters>
      <AdminTable
        caption={t("Events")}
        columns={[
          t("Event"),
          t("Status"),
          t("Visibility"),
          t("Starts"),
          t("Organizer"),
          "",
        ]}
        items={query.data?.items ?? []}
        rowKey={(event) => event.id}
        state={query}
        empty={t("No events match these filters.")}
        pagination={{ ...filters, hasNext: query.data?.hasNext ?? false }}
        cells={(event) => [
          <div className="min-w-40">
            <div className="font-medium">{event.title}</div>
            <div className="text-xs text-muted-foreground">
              {event.category}
            </div>
          </div>,
          <StatusBadge value={event.status} />,
          label(event.visibility),
          <span className="whitespace-nowrap">
            {formatDate(event.startsAt)}
          </span>,
          <RecordId value={event.organizerId} />,
          <RecordButton onClick={() => select(event.id)}>
            {t("View event")}
          </RecordButton>,
        ]}
      />
      {selected && (
        <EventDialog
          key={selected}
          sessionId={sessionId}
          id={selected}
          onClose={() => select(null)}
        />
      )}
    </>
  )
}

function EventDialog({
  sessionId,
  id,
  onClose,
}: {
  sessionId: number
  id: string
  onClose: () => void
}) {
  const model = useEventModerationViewModel(sessionId, id)
  const event = model.query.data
  const { reinstating } = model
  return (
    <AdminDialog
      title={event?.title ?? t("Event details")}
      onClose={onClose}
      pending={model.pending}
    >
      <QueryContent state={model.query}>
        {event && (
          <div className="space-y-4">
            <Details
              fields={[
                [t("Status"), <StatusBadge value={event.status} />],
                [t("Visibility"), label(event.visibility)],
                [t("Starts"), formatDate(event.startAt)],
                [t("Ends"), formatDate(event.endAt)],
                [t("Venue"), event.venue?.name],
                [t("Category"), event.category],
                [t("Event ID"), <RecordId value={event.id} />],
                [t("Assigned staff"), event.staff.length],
              ]}
            />
            {event.description && (
              <p className="text-sm wrap-anywhere whitespace-pre-wrap text-muted-foreground">
                {event.description}
              </p>
            )}
            <ActionFeedback error={model.error} success={model.success} />
            {model.confirming ? (
              <form className="grid gap-3" onSubmit={model.submit}>
                {reinstating ? (
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "The event will return to its status before suspension."
                    )}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "Suspension hides the event page and blocks new checkout and check-in."
                      )}
                    </p>
                    <Field>
                      <FieldLabel htmlFor="event-reason">
                        {t("Suspension reason")}
                      </FieldLabel>
                      <Textarea
                        id="event-reason"
                        name="reason"
                        required
                        maxLength={200}
                        rows={3}
                        disabled={model.pending}
                      />
                    </Field>
                  </>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={model.pending}
                    onClick={model.cancel}
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    type="submit"
                    variant={reinstating ? "default" : "destructive"}
                    disabled={model.pending}
                  >
                    {model.pending
                      ? t("Saving…")
                      : reinstating
                        ? t("Confirm reinstatement")
                        : t("Confirm suspension")}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap justify-between gap-2">
                <Link
                  href={`/admin/event-reports?eventId=${encodeURIComponent(event.id)}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("Event reports")}
                </Link>
                {model.canModerate && (
                  <Button
                    variant={reinstating ? "default" : "destructive"}
                    onClick={model.begin}
                  >
                    {reinstating ? t("Reinstate event") : t("Suspend event")}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </QueryContent>
    </AdminDialog>
  )
}

export function AdminEventReports({ sessionId, params }: SectionProps) {
  const { filters, query, selected, select } = useReportListViewModel(
    sessionId,
    params
  )
  return (
    <>
      <Filters onApply={filters.apply} onReset={filters.reset}>
        <FilterSelect
          id="report-status"
          title={t("Review status")}
          values={reportStatuses}
          value={filters.draft.status}
          onChange={(value) => filters.change("status", value)}
        />
        <FilterInput
          id="report-event"
          label={t("Event ID")}
          pattern={uuidPattern}
          value={filters.draft.eventId}
          onChange={(e) => filters.change("eventId", e.currentTarget.value)}
        />
      </Filters>
      <AdminTable
        caption={t("Event reports")}
        columns={[t("Reason"), t("Status"), t("Event ID"), t("Submitted"), ""]}
        items={query.data?.items ?? []}
        rowKey={(report) => report.id}
        state={query}
        empty={t("No event reports match these filters.")}
        pagination={{ ...filters, hasNext: query.data?.hasNext ?? false }}
        cells={(report) => [
          <p className="line-clamp-2 max-w-96 min-w-40 font-medium wrap-anywhere">
            {report.reason}
          </p>,
          <StatusBadge value={report.status} />,
          <RecordId value={report.eventId} />,
          <span className="whitespace-nowrap">
            {formatDate(report.submittedAt)}
          </span>,
          <RecordButton onClick={() => select(report.id)}>
            {t("View report")}
          </RecordButton>,
        ]}
      />
      {selected && (
        <ReportDialog
          key={selected}
          sessionId={sessionId}
          id={selected}
          onClose={() => select(null)}
        />
      )}
    </>
  )
}

function ReportDialog({
  sessionId,
  id,
  onClose,
}: {
  sessionId: number
  id: string
  onClose: () => void
}) {
  const model = useEventReportViewModel(sessionId, id)
  const report = model.query.data
  return (
    <AdminDialog
      title={t("Event report")}
      onClose={onClose}
      pending={model.pending}
    >
      <QueryContent state={model.query}>
        {report && (
          <div className="space-y-4">
            <p className="text-sm wrap-anywhere whitespace-pre-wrap">
              {report.reason}
            </p>
            <Details
              fields={[
                [t("Status"), <StatusBadge value={report.status} />],
                [t("Submitted"), formatDate(report.submittedAt)],
                [t("Reporter ID"), <RecordId value={report.reporterId} />],
                [t("Event ID"), <RecordId value={report.eventId} />],
                ...(report.reviewedAt
                  ? ([
                      [t("Reviewed"), formatDate(report.reviewedAt)],
                      [
                        t("Reviewer ID"),
                        <RecordId value={report.reviewerId} />,
                      ],
                    ] as [string, import("react").ReactNode][])
                  : []),
              ]}
            />
            {report.reviewNote && (
              <p className="rounded-lg border p-3 text-sm wrap-anywhere whitespace-pre-wrap">
                {report.reviewNote}
              </p>
            )}
            <Link
              href={`/admin/events?eventId=${encodeURIComponent(report.eventId)}`}
              className={buttonVariants({ variant: "outline" })}
            >
              {t("View reported event")}
            </Link>
            <ActionFeedback error={model.error} success={model.success} />
            {model.canReview && (
              <form
                onSubmit={model.submit}
                className="grid gap-3 border-t pt-4"
              >
                <Field>
                  <FieldLabel htmlFor="review-decision">
                    {t("Decision")}
                  </FieldLabel>
                  <NativeSelect
                    id="review-decision"
                    name="decision"
                    defaultValue=""
                    required
                    disabled={model.pending}
                  >
                    <NativeSelectOption value="" disabled>
                      {t("Select decision")}
                    </NativeSelectOption>
                    <NativeSelectOption value="CONFIRM">
                      {t("Confirm report")}
                    </NativeSelectOption>
                    <NativeSelectOption value="DISMISS">
                      {t("Dismiss report")}
                    </NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="review-note">
                    {t("Review note")}
                  </FieldLabel>
                  <Textarea
                    id="review-note"
                    name="note"
                    maxLength={1000}
                    required
                    rows={3}
                    disabled={model.pending}
                  />
                </Field>
                <Button
                  type="submit"
                  className="justify-self-end"
                  disabled={model.pending}
                >
                  {model.pending ? t("Saving…") : t("Save decision")}
                </Button>
              </form>
            )}
          </div>
        )}
      </QueryContent>
    </AdminDialog>
  )
}

export function AdminSupport({ sessionId, params }: SectionProps) {
  const { filters, query, selected, select } = useSupportListViewModel(
    sessionId,
    params
  )
  return (
    <>
      <Filters onApply={filters.apply} onReset={filters.reset}>
        <FilterSelect
          id="support-status"
          title={t("Case status")}
          values={supportStatuses}
          value={filters.draft.status}
          onChange={(value) => filters.change("status", value)}
        />
        <FilterInput
          id="support-event"
          label={t("Event ID")}
          pattern={uuidPattern}
          value={filters.draft.eventId ?? ""}
          onChange={(e) => filters.change("eventId", e.currentTarget.value)}
        />
        <div className="flex min-h-8 items-center gap-2">
          <Checkbox
            id="escalated-only"
            checked={!!filters.draft.escalatedOnly}
            onCheckedChange={(checked) =>
              filters.change("escalatedOnly", checked === true)
            }
          />
          <FieldLabel htmlFor="escalated-only">
            {t("Escalated only")}
          </FieldLabel>
        </div>
      </Filters>
      <AdminTable
        caption={t("Support cases")}
        columns={[t("Subject"), t("Status"), t("Queue"), t("Updated"), ""]}
        items={query.data?.items ?? []}
        rowKey={(item) => item.id}
        state={query}
        empty={t("No support cases match these filters.")}
        pagination={{ ...filters, hasNext: query.data?.hasNext ?? false }}
        cells={(item) => [
          <div className="min-w-40">
            <div className="font-medium">{item.subject}</div>
            <div className="text-xs text-muted-foreground">
              {label(item.category)}
            </div>
          </div>,
          <StatusBadge value={item.status} />,
          item.escalatedAt ? t("Escalated") : label(item.type),
          <span className="whitespace-nowrap">
            {formatDate(item.updatedAt)}
          </span>,
          <RecordButton onClick={() => select(item.id)}>
            {t("View case")}
          </RecordButton>,
        ]}
      />
      {selected && (
        <SupportDialog
          key={selected}
          sessionId={sessionId}
          id={selected}
          onClose={() => select(null)}
        />
      )}
    </>
  )
}

function SupportDialog({
  sessionId,
  id,
  onClose,
}: {
  sessionId: number
  id: string
  onClose: () => void
}) {
  const query = useAdminSupportCaseViewModel(sessionId, id)
  const item = query.data?.supportCase
  return (
    <AdminDialog title={item?.subject ?? t("Support case")} onClose={onClose}>
      <QueryContent state={query}>
        {item && (
          <div className="space-y-4">
            <Details
              fields={[
                [t("Status"), <StatusBadge value={item.status} />],
                [t("Category"), label(item.category)],
                [t("Requester ID"), <RecordId value={item.requesterUserId} />],
                [
                  t("Assignee ID"),
                  <RecordId value={item.assignedSupportUserId} />,
                ],
                [t("Event ID"), <RecordId value={item.eventId} />],
                [t("Order ID"), <RecordId value={item.orderId} />],
                [t("Ticket ID"), <RecordId value={item.ticketId} />],
                [t("Escalated"), formatDate(item.escalatedAt)],
              ]}
            />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t("Conversation")}</h3>
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={`/support/${encodeURIComponent(item.id)}`}
              >
                {t("Open conversation")}
              </Link>
              <ul className="space-y-2">
                {query.data?.messages.map((message) => (
                  <li key={message.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {label(message.authorType)} · {message.authorUserId}
                      </span>
                      <time dateTime={message.sentAt}>
                        {formatDate(message.sentAt)}
                      </time>
                    </div>
                    <p className="mt-1.5 text-sm wrap-anywhere whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </QueryContent>
    </AdminDialog>
  )
}

