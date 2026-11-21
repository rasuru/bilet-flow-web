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
          label="Title or category"
          type="search"
          maxLength={255}
          value={draft.search ?? ""}
          onChange={(e) => change("search", e.currentTarget.value)}
        />
        <FilterSelect
          id="event-status"
          title="Event status"
          values={eventStatuses}
          value={draft.status}
          onChange={(value) => change("status", value)}
        />
        <FilterSelect
          id="event-visibility"
          title="Visibility"
          values={visibilities}
          value={draft.visibility}
          onChange={(value) => change("visibility", value)}
        />
        <FilterInput
          id="event-organizer"
          label="Organizer ID"
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
        caption="Events"
        columns={["Event", "Status", "Visibility", "Starts", "Organizer", ""]}
        items={query.data?.items ?? []}
        rowKey={(event) => event.id}
        state={query}
        empty="No events match these filters."
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
            View event
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
      title={event?.title ?? "Event details"}
      onClose={onClose}
      pending={model.pending}
    >
      <QueryContent state={model.query}>
        {event && (
          <div className="space-y-4">
            <Details
              fields={[
                ["Status", <StatusBadge value={event.status} />],
                ["Visibility", label(event.visibility)],
                ["Starts", formatDate(event.startAt)],
                ["Ends", formatDate(event.endAt)],
                ["Venue", event.venue?.name],
                ["Category", event.category],
                ["Event ID", <RecordId value={event.id} />],
                ["Assigned staff", event.staff.length],
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
                    The event will return to its status before suspension.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Suspension hides the event page and blocks new checkout
                      and check-in.
                    </p>
                    <Field>
                      <FieldLabel htmlFor="event-reason">
                        Suspension reason
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
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant={reinstating ? "default" : "destructive"}
                    disabled={model.pending}
                  >
                    {model.pending
                      ? "Saving…"
                      : reinstating
                        ? "Confirm reinstatement"
                        : "Confirm suspension"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap justify-between gap-2">
                <Link
                  href={`/admin/event-reports?eventId=${encodeURIComponent(event.id)}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Event reports
                </Link>
                {model.canModerate && (
                  <Button
                    variant={reinstating ? "default" : "destructive"}
                    onClick={model.begin}
                  >
                    {reinstating ? "Reinstate event" : "Suspend event"}
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
          title="Review status"
          values={reportStatuses}
          value={filters.draft.status}
          onChange={(value) => filters.change("status", value)}
        />
        <FilterInput
          id="report-event"
          label="Event ID"
          pattern={uuidPattern}
          value={filters.draft.eventId}
          onChange={(e) => filters.change("eventId", e.currentTarget.value)}
        />
      </Filters>
      <AdminTable
        caption="Event reports"
        columns={["Reason", "Status", "Event ID", "Submitted", ""]}
        items={query.data?.items ?? []}
        rowKey={(report) => report.id}
        state={query}
        empty="No event reports match these filters."
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
            View report
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
    <AdminDialog title="Event report" onClose={onClose} pending={model.pending}>
      <QueryContent state={model.query}>
        {report && (
          <div className="space-y-4">
            <p className="text-sm wrap-anywhere whitespace-pre-wrap">
              {report.reason}
            </p>
            <Details
              fields={[
                ["Status", <StatusBadge value={report.status} />],
                ["Submitted", formatDate(report.submittedAt)],
                ["Reporter ID", <RecordId value={report.reporterId} />],
                ["Event ID", <RecordId value={report.eventId} />],
                ...(report.reviewedAt
                  ? ([
                      ["Reviewed", formatDate(report.reviewedAt)],
                      ["Reviewer ID", <RecordId value={report.reviewerId} />],
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
              View reported event
            </Link>
            <ActionFeedback error={model.error} success={model.success} />
            {model.canReview && (
              <form
                onSubmit={model.submit}
                className="grid gap-3 border-t pt-4"
              >
                <Field>
                  <FieldLabel htmlFor="review-decision">Decision</FieldLabel>
                  <NativeSelect
                    id="review-decision"
                    name="decision"
                    defaultValue=""
                    required
                    disabled={model.pending}
                  >
                    <NativeSelectOption value="" disabled>
                      Select decision
                    </NativeSelectOption>
                    <NativeSelectOption value="CONFIRM">
                      Confirm report
                    </NativeSelectOption>
                    <NativeSelectOption value="DISMISS">
                      Dismiss report
                    </NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="review-note">Review note</FieldLabel>
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
                  {model.pending ? "Saving…" : "Save decision"}
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
          title="Case status"
          values={supportStatuses}
          value={filters.draft.status}
          onChange={(value) => filters.change("status", value)}
        />
        <FilterInput
          id="support-event"
          label="Event ID"
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
          <FieldLabel htmlFor="escalated-only">Escalated only</FieldLabel>
        </div>
      </Filters>
      <AdminTable
        caption="Support cases"
        columns={["Subject", "Status", "Queue", "Updated", ""]}
        items={query.data?.items ?? []}
        rowKey={(item) => item.id}
        state={query}
        empty="No support cases match these filters."
        pagination={{ ...filters, hasNext: query.data?.hasNext ?? false }}
        cells={(item) => [
          <div className="min-w-40">
            <div className="font-medium">{item.subject}</div>
            <div className="text-xs text-muted-foreground">
              {label(item.category)}
            </div>
          </div>,
          <StatusBadge value={item.status} />,
          item.escalatedAt ? "Escalated" : label(item.type),
          <span className="whitespace-nowrap">
            {formatDate(item.updatedAt)}
          </span>,
          <RecordButton onClick={() => select(item.id)}>
            View case
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
    <AdminDialog title={item?.subject ?? "Support case"} onClose={onClose}>
      <QueryContent state={query}>
        {item && (
          <div className="space-y-4">
            <Details
              fields={[
                ["Status", <StatusBadge value={item.status} />],
                ["Category", label(item.category)],
                ["Requester ID", <RecordId value={item.requesterUserId} />],
                [
                  "Assignee ID",
                  <RecordId value={item.assignedSupportUserId} />,
                ],
                ["Event ID", <RecordId value={item.eventId} />],
                ["Order ID", <RecordId value={item.orderId} />],
                ["Ticket ID", <RecordId value={item.ticketId} />],
                ["Escalated", formatDate(item.escalatedAt)],
              ]}
            />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Conversation</h3>
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
