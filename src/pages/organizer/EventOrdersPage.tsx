import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "wouter"

import { refundCheckout } from "@/api/checkouts"
import { duplicateEvent, type ManagedEvent } from "@/api/events"
import { hideTicketType, unhideTicketType } from "@/api/inventory"
import { getPayment } from "@/api/payments"
import { getCheckInCounts, searchAttendees } from "@/api/tickets"
import { sessionRepository } from "@/auth/sessionRepository"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { managedEventRepository } from "@/events/managedEventRepository"
import { publicEventRepository } from "@/events/publicEventRepository"
import { statusText, t } from "@/i18n/locale"

type EventScope = { sessionId: number; eventId: string }

function refreshEvent(
  client: ReturnType<typeof useQueryClient>,
  scope: EventScope
) {
  return Promise.all([
    client.invalidateQueries({ queryKey: ["managed-events", scope.sessionId] }),
    client.invalidateQueries({ queryKey: ["public-event", scope.eventId] }),
    client.invalidateQueries({ queryKey: ["public-events"] }),
    client.invalidateQueries({
      queryKey: ["event-attendance", scope.sessionId, scope.eventId],
    }),
    client.invalidateQueries({
      queryKey: ["event-attendees", scope.sessionId, scope.eventId],
    }),
  ])
}

export function EventOrdersPage(scope: EventScope) {
  const { sessionId, eventId } = scope
  const event = useQuery(managedEventRepository.eventQuery(sessionId, eventId))

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
      <Link
        href={"/organizer/events/" + encodeURIComponent(eventId)}
        className={buttonVariants({ variant: "ghost" })}
      >
        {t("Manage event")}
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t("Orders & Manage")}</h1>
        {event.data && (
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-medium">{event.data.title}</h2>
            <Badge variant="outline">{statusText(event.data.status)}</Badge>
          </div>
        )}
      </header>
      {event.isPending && <p role="status">{t("Loading event…")}</p>}
      {event.isError && (
        <div className="space-y-2">
          <FieldError>{t(event.error.message)}</FieldError>
          <Button variant="outline" onClick={() => void event.refetch()}>
            {t("Try again")}
          </Button>
        </div>
      )}
      <OrderRefunds {...scope} canSearch={event.isSuccess} />
      {event.isSuccess && (
        <>
          <TicketInventory
            {...scope}
            assigned={event.data.venue?.seatingMode === "ASSIGNED_SEATING"}
          />
          <DuplicateEventSection {...scope} event={event.data} />
        </>
      )}
    </main>
  )
}

function OrderRefunds({
  sessionId,
  eventId,
  canSearch,
}: EventScope & { canSearch: boolean }) {
  const client = useQueryClient()
  const [id, setId] = useState("")
  const [reason, setReason] = useState("")
  const [email, setEmail] = useState("")
  const [search, setSearch] = useState("")
  const attendees = useQuery({
    queryKey: ["event-attendees", sessionId, eventId, search],
    enabled: canSearch && search !== "",
    queryFn: () =>
      sessionRepository.authenticatedRequest(sessionId, (token) =>
        searchAttendees(token, eventId, search)
      ),
    retry: false,
  })
  const refund = useMutation({
    mutationFn: ({
      checkoutId,
      refundReason,
    }: {
      checkoutId: string
      refundReason?: string
    }) =>
      sessionRepository.authenticatedRequest(sessionId, (token) =>
        refundCheckout(token, checkoutId, refundReason)
      ),
    onSuccess: () => refreshEvent(client, { sessionId, eventId }),
  })
  const paymentId = refund.data?.paymentId
  const payment = useQuery({
    queryKey: ["refund-payment", sessionId, paymentId],
    enabled: false,
    queryFn: paymentId
      ? () =>
          sessionRepository.authenticatedRequest(sessionId, (token) =>
            getPayment(token, paymentId)
          )
      : skipToken,
    retry: false,
  })

  return (
    <>
      {canSearch && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("Find attendees")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (email.trim() === search) void attendees.refetch()
                else setSearch(email.trim())
              }}
            >
              <Field className="w-full sm:max-w-sm">
                <FieldLabel htmlFor="attendee-email">
                  {t("Attendee email")}
                </FieldLabel>
                <Input
                  id="attendee-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Button
                type="submit"
                variant="outline"
                disabled={attendees.isFetching || !email.trim()}
              >
                {t("Search")}
              </Button>
            </form>
            {attendees.isError && (
              <FieldError>{t(attendees.error.message)}</FieldError>
            )}
            {attendees.isSuccess && attendees.data.length === 0 && (
              <p role="status">{t("No attendees found.")}</p>
            )}
            {attendees.data && attendees.data.length > 0 && (
              <ul className="divide-y">
                {attendees.data.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div className="min-w-0 space-y-1">
                      {ticket.attendeeName && <p>{ticket.attendeeName}</p>}
                      <p className="break-all">{ticket.attendeeEmail}</p>
                      <p className="text-sm break-all text-muted-foreground">
                        {t("Order ID")} {ticket.orderId}
                      </p>
                      <Badge variant="outline">
                        {statusText(ticket.status)}
                      </Badge>
                    </div>
                    {["VALID", "CHECKED_IN"].includes(ticket.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={refund.isPending}
                        onClick={() => {
                          setId(ticket.orderId)
                          refund.reset()
                          document.getElementById("refund-checkout-id")?.focus()
                        }}
                      >
                        {t("Refund Order")}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("Refund by Checkout / Order ID")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              const checkoutId = id.trim()
              if (!checkoutId || refund.isPending) return
              if (
                window.confirm(t("Issue a full refund for {0}?", checkoutId))
              ) {
                refund.mutate({
                  checkoutId,
                  refundReason: reason.trim() || undefined,
                })
              }
            }}
          >
            <Field>
              <FieldLabel htmlFor="refund-checkout-id">
                {t("Checkout / Order ID")}
              </FieldLabel>
              <Input
                id="refund-checkout-id"
                required
                value={id}
                onChange={(event) => setId(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="refund-reason">
                {t("Reason (optional)")}
              </FieldLabel>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </Field>
            <Button
              type="submit"
              variant="destructive"
              disabled={refund.isPending || !id.trim()}
            >
              {refund.isPending ? t("Requesting refund…") : t("Refund Order")}
            </Button>
          </form>
          {refund.isError && <FieldError>{t(refund.error.message)}</FieldError>}
          {refund.data && (
            <div className="space-y-2">
              <p role="status" className="break-all">
                {t("Checkout")} {refund.data.id}{" "}
                <Badge variant="outline">
                  {statusText(
                    payment.data?.refundStatus ??
                      refund.data.refundState ??
                      refund.data.status
                  )}
                </Badge>
              </p>
              {paymentId && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={payment.isFetching}
                  onClick={() => void payment.refetch()}
                >
                  {t("Refresh refund status")}
                </Button>
              )}
              {payment.isError && (
                <FieldError>{t(payment.error.message)}</FieldError>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function TicketInventory({
  sessionId,
  eventId,
  assigned,
}: EventScope & { assigned: boolean }) {
  const client = useQueryClient()
  const tiers = useQuery(
    managedEventRepository.ticketTypesQuery(sessionId, eventId, true)
  )
  const attendance = useQuery({
    queryKey: ["event-attendance", sessionId, eventId],
    queryFn: () =>
      sessionRepository.authenticatedRequest(sessionId, (token) =>
        getCheckInCounts(token, eventId)
      ),
    retry: false,
  })
  const needsSeatCounts =
    assigned &&
    tiers.data?.some(
      (tier) =>
        tier.available == null || tier.reserved == null || tier.sold == null
    )
  const availability = useQuery(
    publicEventRepository.availabilityQuery(
      needsSeatCounts ? eventId : null,
      null
    )
  )
  const seats = availability.data?.inventory
  const seatCounts =
    seats?.inventoryKind === "ASSIGNED_SEATING"
      ? seats.seatAvailability.reduce(
          (counts, seat) => {
            if (seat.status === "AVAILABLE") counts.available++
            if (seat.status === "HELD") counts.reserved++
            if (seat.status === "SOLD") counts.sold++
            return counts
          },
          { available: 0, reserved: 0, sold: 0 }
        )
      : undefined
  const visibility = useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      sessionRepository.authenticatedRequest(sessionId, (token) =>
        hidden ? unhideTicketType(token, id) : hideTicketType(token, id)
      ),
    onSuccess: () => refreshEvent(client, { sessionId, eventId }),
  })
  const countKeys = ["available", "reserved", "sold"] as const
  const countLabels = {
    available: "Available",
    reserved: "Reserved",
    sold: "Sold",
  }
  const unavailable = t("Unavailable")
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("Ticket inventory")}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {countKeys.map((key) => (
            <div key={key}>
              <dt>{t(countLabels[key])}</dt>
              <dd>
                {tiers.isSuccess &&
                tiers.data.every((tier) => tier[key] != null)
                  ? tiers.data.reduce((sum, tier) => sum + (tier[key] ?? 0), 0)
                  : (seatCounts?.[key] ?? unavailable)}
              </dd>
            </div>
          ))}
          <div>
            <dt>{t("Refunded")}</dt>
            <dd>{unavailable}</dd>
          </div>
          <div>
            <dt>{t("Checked in")}</dt>
            <dd>{attendance.data?.checkedIn ?? unavailable}</dd>
          </div>
        </dl>
        {attendance.isError && (
          <FieldError>
            {t("Check-in counts could not be loaded.")}{" "}
            {t(attendance.error.message)}
          </FieldError>
        )}
        {tiers.isPending && <p role="status">{t("Loading ticket types…")}</p>}
        {tiers.isError && <FieldError>{t(tiers.error.message)}</FieldError>}
        {visibility.isError && (
          <FieldError>{t(visibility.error.message)}</FieldError>
        )}
        <ul className="divide-y">
          {tiers.data?.map((tier) => (
            <li
              key={tier.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="space-y-1">
                <h3 className="font-medium">
                  {tier.name}{" "}
                  <Badge variant="outline">{statusText(tier.status)}</Badge>
                </h3>
                <dl className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                  {countKeys.map((key) => (
                    <div key={key} className="flex gap-1">
                      <dt>{t(countLabels[key])}</dt>
                      <dd>{tier[key] ?? unavailable}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={visibility.isPending || tiers.isError}
                onClick={() =>
                  visibility.mutate({
                    id: tier.id,
                    hidden: tier.status === "HIDDEN",
                  })
                }
              >
                {tier.status === "HIDDEN" ? t("Unhide tier") : t("Hide tier")}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function DuplicateEventSection({
  sessionId,
  eventId,
  event,
}: EventScope & { event: ManagedEvent }) {
  const client = useQueryClient()
  const [startAt, setStartAt] = useState("")
  const [scheduleError, setScheduleError] = useState("")
  const action = useMutation({
    mutationFn: (newStart: Date) =>
      sessionRepository.authenticatedRequest(sessionId, async (token) => {
        const shift = +newStart - Date.parse(event.startAt)
        const move = (instant: string) =>
          new Date(Date.parse(instant) + shift).toISOString()
        const window = event.registrationWindow
        const draft = await duplicateEvent(token, eventId, {
          startAt: newStart.toISOString(),
          endAt: move(event.endAt),
          registrationWindow:
            window.mode === "BOUNDED" && window.startAt && window.endAt
              ? {
                  mode: "BOUNDED",
                  startAt: move(window.startAt),
                  endAt: move(window.endAt),
                }
              : window.mode === "OPENS_AT" && window.startAt
                ? { mode: "OPENS_AT", startAt: move(window.startAt) }
                : { mode: "ALWAYS_OPEN" },
        })
        return { kind: "duplicated", id: draft.id } as const
      }),
    onSuccess: () => refreshEvent(client, { sessionId, eventId }),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("Duplicate Event")}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(submission) => {
            submission.preventDefault()
            if (action.isPending) return
            const newStart = new Date(startAt)
            if (!(+newStart > Date.now())) {
              setScheduleError(
                t("Choose a future start time for the new draft.")
              )
              return
            }
            setScheduleError("")
            if (
              window.confirm(t("Duplicate {0} as a new draft?", event.title))
            ) {
              action.mutate(newStart)
            }
          }}
        >
          <Field className="w-full sm:max-w-sm">
            <FieldLabel htmlFor="duplicate-start">
              {t("New event start (your local time)")}
            </FieldLabel>
            <Input
              id="duplicate-start"
              type="datetime-local"
              value={startAt}
              required
              onChange={(change) => setStartAt(change.target.value)}
            />
          </Field>
          <Button type="submit" variant="outline" disabled={action.isPending}>
            {t("Duplicate Event")}
          </Button>
        </form>
        {scheduleError && <FieldError>{scheduleError}</FieldError>}
        {action.isPending && <p role="status">{t("Updating event…")}</p>}
        {action.isError && <FieldError>{t(action.error.message)}</FieldError>}
        {action.data?.kind === "duplicated" && (
          <p role="status">
            {t("Draft created.")}{" "}
            <Link
              className="underline"
              href={`/organizer/events/${encodeURIComponent(action.data.id)}/orders`}
            >
              {t("Manage new draft")}
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
