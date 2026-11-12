import { useId } from "react"

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
}: {
  eventId: string
  tickets: OrderTicket[]
  refreshAvailability: () => void
  seatingLabel: string
}) {
  const model = useTicketOrderViewModel(eventId, tickets, refreshAvailability)
  const formId = useId()
  const { session } = model
  const signedIn = session.status === "signedIn"
  const showAuth = session.status === "signedOut" && model.authMode !== null

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_19rem]">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Choose tickets</h2>
          </CardTitle>
          <CardDescription>{seatingLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <form id={formId} onSubmit={model.submit} noValidate>
            <fieldset
              disabled={model.isSubmitting || model.retryingOrder}
              className="divide-y"
            >
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
                        Limit {ticket.maxPerOrder} per order
                      </p>
                      {ticket.availability && <p>{ticket.availability}</p>}
                    </div>
                    {(ticket.orderLimit > 0 || attendees.length > 0) && (
                      <Field>
                        <FieldLabel htmlFor={quantityId}>
                          Quantity{" "}
                          <span className="sr-only">for {ticket.name}</span>
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
                              {attendees.length} (unavailable)
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
                          <p className="font-medium">Ticket {index + 1}</p>
                          {seats && (
                            <Field>
                              <FieldLabel htmlFor={`seat-${id}`}>
                                Seat
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
                                  Choose a seat
                                </NativeSelectOption>
                                {attendee.seatId &&
                                  !seats.some(
                                    ({ id }) => id === attendee.seatId
                                  ) && (
                                    <NativeSelectOption
                                      value={attendee.seatId}
                                      disabled
                                    >
                                      Seat no longer available
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
                                Attendee email
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
            <h2>Order summary</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <div className="flex justify-between font-semibold">
                <span>Estimated total</span>
                <span>{model.totalLabel}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {model.isFree
                  ? "Free tickets are issued when you place the order."
                  : "Paid orders continue to Halyk ePay after you reserve your tickets."}
              </p>
              {model.formError && <FieldError>{model.formError}</FieldError>}
              {session.status === "restoring" && (
                <p role="status">Checking your session…</p>
              )}
              {session.status === "restoreFailed" && (
                <div className="space-y-2">
                  <FieldError>Couldn’t restore your session.</FieldError>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void session.retry()}
                  >
                    Try again
                  </Button>
                </div>
              )}
              {!showAuth && (signedIn || session.status === "signedOut") && (
                <Button
                  type="submit"
                  form={formId}
                  className="w-full"
                  disabled={model.isSubmitting}
                >
                  {model.isSubmitting
                    ? "Placing order…"
                    : signedIn
                      ? model.retryingOrder
                        ? "Retry order"
                        : model.isFree
                          ? "Get free tickets"
                          : "Reserve tickets"
                      : "Sign in to order"}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                disabled={model.isSubmitting || model.retryingOrder}
                onClick={model.clearSelection}
              >
                Clear selection
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Choose a quantity to see your order total.
            </p>
          )}
          {showAuth && model.hasSelection && (
            <section
              className="space-y-3 border-t pt-4"
              aria-label="Sign in to order"
            >
              <h3 className="font-semibold">
                {model.authMode === "login"
                  ? "Sign in to order"
                  : "Create an account"}
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
