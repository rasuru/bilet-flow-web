import { t } from "@/i18n/locale"
import { useId } from "react"
import type { VenueLayout } from "@/api/events"
import type { SeatAvailability } from "@/api/inventory"
import { SeatMap } from "@/components/seating/SeatMap"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { LoginForm } from "@/pages/auth/LoginForm"
import { RegisterForm } from "@/pages/auth/RegisterForm"

import {
  useTicketOrderViewModel,
  type OrderTicket,
} from "./useTicketOrderViewModel"

export function TicketOrderForm({
  eventId,
  tickets,
  refreshAvailability,
  seatingLabel,
  campaignToken,
  layout,
  seatAvailability,
}: {
  eventId: string
  tickets: OrderTicket[]
  refreshAvailability: () => void
  seatingLabel: string
  campaignToken: string | null
  layout: VenueLayout | null
  seatAvailability: SeatAvailability[]
}) {
  const model = useTicketOrderViewModel(
    eventId,
    tickets,
    refreshAvailability,
    campaignToken,
    layout,
    seatAvailability
  )
  const formId = useId()
  const promoInputId = useId()
  const promo = model.promo
  const { session } = model
  const signedIn = session.status === "signedIn"
  const showAuth = session.status === "signedOut" && model.authMode !== null

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_19rem]">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("Choose tickets")}</h2>
          </CardTitle>
          <CardDescription>{seatingLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id={formId} onSubmit={model.submit} noValidate>
            <fieldset
              disabled={model.isSubmitting || model.retryingOrder}
              className="divide-y"
            >
              {model.map && (
                <div className="space-y-3 pb-5">
                  <p className="text-sm text-muted-foreground">{t("Choose seats on the map. Select again to remove a seat.")}</p>
                  <SeatMap model={model.map} onSelect={model.toggleSeat} disabled={model.isSubmitting || model.retryingOrder} />
                  <p className="text-xs text-muted-foreground">{t("Seats are reserved only when you place your order.")}</p>
                </div>
              )}
              {tickets.map((ticket) => {
                const attendees = model.draft[ticket.id] ?? []
                const quantityId = `quantity-${ticket.id}`
                return (
                  <div key={ticket.id} className="space-y-3 py-3 first:pt-0">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <h3 className="font-semibold">{ticket.name}</h3>
                        <p className="font-semibold tabular-nums">
                          {ticket.price}
                        </p>
                      </div>
                      {ticket.description && (
                        <p className="break-words text-muted-foreground">
                          {ticket.description}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {t("Limit {0} per order", ticket.maxPerOrder)}
                      </p>
                      {ticket.availability && <p>{ticket.availability}</p>}
                    </div>
                    {!model.map && (ticket.orderLimit > 0 || attendees.length > 0) && (
                      <Field>
                        <FieldLabel htmlFor={quantityId}>
                          {t("Quantity")}{" "}
                          <span className="sr-only">
                            {t("for")} {ticket.name}
                          </span>
                        </FieldLabel>
                        <NativeSelect
                          id={quantityId}
                          value={attendees.length}
                          onChange={(event) =>
                            model.setQuantity(
                              ticket.id,
                              Number(event.currentTarget.value)
                            )
                          }
                        >
                          {attendees.length > ticket.orderLimit && (
                            <NativeSelectOption
                              value={attendees.length}
                              disabled
                            >
                              {attendees.length} {t("(unavailable)")}
                            </NativeSelectOption>
                          )}
                          {Array.from(
                            { length: ticket.orderLimit + 1 },
                            (_, count) => (
                              <NativeSelectOption key={count} value={count}>
                                {count}
                              </NativeSelectOption>
                            )
                          )}
                        </NativeSelect>
                      </Field>
                    )}
                    {attendees.map((attendee, index) => {
                      const id = `${ticket.id}-${index}`
                      const seats = ticket.seats?.filter(
                        (seat) =>
                          seat.id === attendee.seatId ||
                          !model.selectedSeatIds.has(seat.id)
                      )
                      return (
                        <div
                          className="space-y-2 rounded-lg border p-3"
                          key={id}
                        >
                          <p className="font-medium">
                            {t("Ticket {0}", index + 1)}
                          </p>
                          {model.map && (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm">{model.map.seats.find((seat) => seat.id === attendee.seatId)?.location ?? attendee.seatId}</span>
                              <Button type="button" size="sm" variant="outline" onClick={() => model.removeSeat(ticket.id, attendee.seatId)}>{t("Remove")}</Button>
                              {!ticket.seats?.some((seat) => seat.id === attendee.seatId) && <FieldError>{t("Seat no longer available")}</FieldError>}
                            </div>
                          )}
                          {seats && !model.map && (
                            <Field>
                              <FieldLabel htmlFor={`seat-${id}`}>
                                {t("Seat")}
                              </FieldLabel>
                              <NativeSelect
                                id={`seat-${id}`}
                                value={attendee.seatId}
                                onChange={(event) =>
                                  model.editAttendee(ticket.id, index, {
                                    seatId: event.currentTarget.value,
                                  })
                                }
                              >
                                <NativeSelectOption value="">
                                  {t("Choose a seat")}
                                </NativeSelectOption>
                                {attendee.seatId &&
                                  !seats.some(
                                    ({ id }) => id === attendee.seatId
                                  ) && (
                                    <NativeSelectOption
                                      value={attendee.seatId}
                                      disabled
                                    >
                                      {t("Seat no longer available")}
                                    </NativeSelectOption>
                                  )}
                                {seats.map((seat) => (
                                  <NativeSelectOption
                                    key={seat.id}
                                    value={seat.id}
                                  >
                                    {seat.label}
                                  </NativeSelectOption>
                                ))}
                              </NativeSelect>
                            </Field>
                          )}
                          {signedIn && (
                            <Field>
                              <FieldLabel htmlFor={`email-${id}`}>
                                {t("Attendee email")}
                              </FieldLabel>
                              <Input
                                id={`email-${id}`}
                                type="email"
                                value={
                                  attendee.email ?? session.account.email ?? ""
                                }
                                onChange={(event) =>
                                  model.editAttendee(ticket.id, index, {
                                    email: event.currentTarget.value,
                                  })
                                }
                              />
                            </Field>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </fieldset>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("Order summary")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={promo.apply} className="space-y-2">
            <Field>
              <FieldLabel htmlFor={promoInputId}>{t("Promo code")}</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id={promoInputId}
                  value={promo.draft}
                  maxLength={20}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={model.isSubmitting || model.retryingOrder}
                  aria-invalid={!!promo.error}
                  aria-describedby={
                    promo.error ? `${promoInputId}-error` : undefined
                  }
                  onChange={(event) =>
                    promo.setDraft(event.currentTarget.value)
                  }
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={
                    !promo.draft.trim() ||
                    promo.pending ||
                    model.isSubmitting ||
                    model.retryingOrder
                  }
                >
                  {t("Apply")}
                </Button>
              </div>
            </Field>
            {promo.pending && (
              <p role="status" className="flex items-center gap-2 text-sm">
                <Spinner aria-hidden="true" /> {t("Checking promo…")}
              </p>
            )}
            {promo.appliedCode && (
              <p role="status" className="text-sm font-medium">
                {t("Code {0} applied", promo.appliedCode)}
              </p>
            )}
            {promo.awaitingSelection && (
              <p className="text-sm text-muted-foreground">
                {t("Choose tickets to check this code.")}
              </p>
            )}
            {promo.error && (
              <FieldError id={`${promoInputId}-error`}>
                {t(promo.error)}
              </FieldError>
            )}
            <div className="flex flex-wrap gap-2 empty:hidden">
              {promo.retryLink && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={promo.retryLink}
                  disabled={model.isSubmitting || model.retryingOrder}
                >
                  {t("Retry promo link")}
                </Button>
              )}
              {promo.canRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={promo.remove}
                  disabled={model.isSubmitting || model.retryingOrder}
                >
                  {t("Remove promo")}
                </Button>
              )}
            </div>
          </form>
          {model.hasSelection ? (
            <div className="space-y-3">
              <ul className="space-y-2">
                {tickets
                  .filter((ticket) => model.draft[ticket.id]?.length)
                  .map((ticket) => (
                    <li key={ticket.id} className="flex justify-between gap-3">
                      <span>{ticket.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        × {model.draft[ticket.id].length}
                      </span>
                    </li>
                  ))}
              </ul>
              <Separator />
              {promo.discount && (
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt>{t("Subtotal")}</dt>
                    <dd>{promo.discount.subtotal}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>{t("Discount")}</dt>
                    <dd>−{promo.discount.amount}</dd>
                  </div>
                </dl>
              )}
              <div className="flex justify-between font-semibold">
                <span>{t("Estimated total")}</span>
                <span>
                  {promo.chosen && !promo.appliedCode ? "—" : model.totalLabel}
                </span>
              </div>
              {model.maySubmit && (
                <p className="text-sm text-muted-foreground">
                  {model.isFree
                    ? t("Free tickets are issued when you place the order.")
                    : t(
                        "Paid orders continue to Halyk ePay after you reserve your tickets."
                      )}
                </p>
              )}
              {model.formError && <FieldError>{model.formError}</FieldError>}
              {session.status === "restoring" && (
                <p role="status">{t("Checking your session…")}</p>
              )}
              {session.status === "restoreFailed" && (
                <div className="space-y-2">
                  <FieldError>{t("Couldn’t restore your session.")}</FieldError>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void session.retry()}
                  >
                    {t("Try again")}
                  </Button>
                </div>
              )}
              {!showAuth && (signedIn || session.status === "signedOut") && (
                <Button
                  type="submit"
                  form={formId}
                  className="w-full"
                  disabled={model.isSubmitting || !model.maySubmit}
                >
                  {model.isSubmitting
                    ? t("Placing order…")
                    : signedIn
                      ? model.retryingOrder
                        ? t("Retry order")
                        : model.isFree
                          ? t("Get free tickets")
                          : t("Reserve tickets")
                      : t("Sign in to order")}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                disabled={model.isSubmitting || model.retryingOrder}
                onClick={model.clearSelection}
              >
                {t("Clear selection")}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t(model.map ? "Choose a seat to see your order total." : "Choose a quantity to see your order total.")}
            </p>
          )}
          {showAuth && model.hasSelection && (
            <section
              className="space-y-3 border-t pt-4"
              aria-label={t("Sign in to order")}
            >
              <h3 className="font-semibold">
                {model.authMode === "login"
                  ? t("Sign in to order")
                  : t("Create an account")}
              </h3>
              {model.authMode === "login" ? (
                <LoginForm onRegister={() => model.setAuthMode("register")} />
              ) : (
                <RegisterForm onLogin={() => model.setAuthMode("login")} />
              )}
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

