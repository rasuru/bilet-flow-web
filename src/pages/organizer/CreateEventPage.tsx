import { numberFormat, t } from "@/i18n/locale"
import type { ComponentProps, ReactNode } from "react"
import { Link, Redirect } from "wouter"

import type { EventVisibility, SeatingMode } from "@/api/events"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field as ShadcnField,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import {
  timeZones,
  visibilityDetails,
  type EventDraft,
} from "./createEventDraft"
import { EventPreview } from "./EventPreview"
import { TicketTierFields } from "./TicketTierFields"
import { useCreateEventViewModel } from "./useCreateEventViewModel"

const seatCount = numberFormat({ maximumFractionDigits: 0 })

const steps = ["Basics", "Schedule", "Venue & Admission", "Tickets", "Review"]
function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) {
  return (
    <ShadcnField>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
    </ShadcnField>
  )
}

export function CreateEventPage({ sessionId }: { sessionId: number }) {
  const vm = useCreateEventViewModel(sessionId)
  const {
    event,
    setField,
    seatingMode,
    assigned,
    tickets,
    layouts,
    layoutsOffline,
    loadingLayouts,
    layoutError,
    selectLayout,
    refreshLayouts,
    step,
    error,
    busy,
    publishStep,
    result,
    savedDraft,
    navigate,
  } = vm
  const hasSavedTickets = Boolean(savedDraft?.ticketKeys.length)

  if (result && !result.local) {
    return <Redirect to="/organizer" replace />
  }

  function eventInput(
    key: keyof Omit<EventDraft, "visibility">,
    label: string,
    props: ComponentProps<typeof Input> = {}
  ) {
    return (
      <Field id={key} label={label}>
        <Input
          {...props}
          id={key}
          value={event[key]}
          onChange={(e) => setField(key, e.target.value)}
        />
      </Field>
    )
  }

  return (
    <main className="flex min-h-svh items-start justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className={buttonVariants({ variant: "ghost", className: "mb-6" })}
        >
          {t("Back to home")}
        </Link>
        {!result && (
          <nav aria-label={t("Event form progress")} className="mb-6">
            <ol className="grid grid-cols-5 gap-2 text-center">
              {steps.map((label, index) => (
                <li key={label}>
                  <button
                    type="button"
                    aria-current={index === step ? "step" : undefined}
                    disabled={busy}
                    className="flex w-full flex-col items-center gap-2 rounded-md text-xs focus-visible:outline-ring disabled:opacity-60"
                    onClick={() => navigate(index)}
                  >
                    <span
                      className={`grid size-7 place-items-center rounded-full ${index === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {index + 1}
                    </span>
                    <span>{t(label)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>
                {result ? t("Event saved locally") : t("Create new event")}
              </h1>
            </CardTitle>
            <CardDescription>
              {result ? event.title : t(steps[step])}
            </CardDescription>
            {import.meta.env.DEV && !result && (
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy || Boolean(savedDraft) || loadingLayouts}
                  onClick={vm.fillSample}
                >
                  {t("Fill sample event")}
                </Button>
              </CardAction>
            )}
          </CardHeader>

          {result ? (
            <CardContent>
              <p role="status" className="text-sm">
                {t(
                  "The development API is unavailable. This event was saved in this browser only."
                )}
              </p>
            </CardContent>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void vm.submit()
              }}
              noValidate
              aria-busy={busy}
            >
              <CardContent className="space-y-4">
                {step === 0 && (
                  <>
                    {eventInput("title", t("Event title"), { required: true })}
                    {eventInput("category", t("Category"), { required: true })}
                    <Field id="description" label={t("Description (optional)")}>
                      <Textarea
                        id="description"
                        value={event.description}
                        onChange={(e) =>
                          setField("description", e.target.value)
                        }
                      />
                    </Field>
                    {eventInput("imageUrl", t("Image URL (optional)"), {
                      type: "url",
                    })}
                    <Field id="visibility" label={t("Visibility")}>
                      <NativeSelect
                        id="visibility"
                        aria-describedby="visibility-description"
                        className="w-full"
                        value={event.visibility}
                        onChange={(e) =>
                          setField(
                            "visibility",
                            e.target.value as EventVisibility
                          )
                        }
                      >
                        {Object.entries(visibilityDetails).map(
                          ([value, { label }]) => (
                            <NativeSelectOption key={value} value={value}>
                              {t(label)}
                            </NativeSelectOption>
                          )
                        )}
                      </NativeSelect>
                      <FieldDescription id="visibility-description">
                        {t(visibilityDetails[event.visibility].description)}
                      </FieldDescription>
                    </Field>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {eventInput("startAt", t("Starts"), {
                        type: "datetime-local",
                        required: true,
                      })}
                      {eventInput("endAt", t("Ends"), {
                        type: "datetime-local",
                        required: true,
                      })}
                    </div>
                    <Field id="timeZone" label={t("Time zone")}>
                      <NativeSelect
                        id="timeZone"
                        className="w-full"
                        value={event.timeZone}
                        onChange={(e) => setField("timeZone", e.target.value)}
                      >
                        {timeZones.map((zone) => (
                          <NativeSelectOption key={zone}>
                            {zone}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {eventInput(
                        "registrationOpensAt",
                        t("Registration opens (optional)"),
                        {
                          type: "datetime-local",
                          "aria-describedby": "registration-description",
                        }
                      )}
                      {eventInput(
                        "registrationClosesAt",
                        t("Registration closes (optional)"),
                        {
                          type: "datetime-local",
                          "aria-describedby": "registration-description",
                        }
                      )}
                    </div>
                    <FieldDescription id="registration-description">
                      {t(
                        "Registration limits when buyers can order tickets across all tiers. Leave both dates blank to open registration when the event is published."
                      )}
                    </FieldDescription>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Field id="admission" label={t("Admission mode")}>
                      <NativeSelect
                        id="admission"
                        className="w-full"
                        value={seatingMode}
                        disabled={loadingLayouts || hasSavedTickets}
                        onChange={(e) =>
                          vm.changeSeatingMode(e.target.value as SeatingMode)
                        }
                      >
                        <NativeSelectOption value="GENERAL_ADMISSION">
                          {t("General admission")}
                        </NativeSelectOption>
                        <NativeSelectOption value="ASSIGNED_SEATING">
                          {t("Assigned seating")}
                        </NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    {eventInput("venueName", t("Venue name"), {
                      required: true,
                    })}
                    {eventInput("venueAddress", t("Address"), {
                      required: true,
                    })}
                    {assigned ? (
                      <Field id="layoutId" label={t("Venue layout")}>
                        <NativeSelect
                          id="layoutId"
                          className="w-full"
                          required
                          value={event.layoutId}
                          disabled={
                            loadingLayouts || !layouts.length || hasSavedTickets
                          }
                          onChange={(e) => selectLayout(e.target.value)}
                        >
                          <NativeSelectOption value="">
                            {loadingLayouts
                              ? t("Loading layouts…")
                              : t("Select a layout")}
                          </NativeSelectOption>
                          {layouts.map((layout) => (
                            <NativeSelectOption
                              key={layout.layoutId}
                              value={layout.layoutId}
                            >
                              {t(
                                "{0} ({1} seats)",
                                layout.name,
                                seatCount.format(layout.seats.length)
                              )}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        {layoutsOffline && layouts.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {t("Sample layouts are available for local saves.")}
                          </p>
                        )}
                        {!loadingLayouts &&
                          (layoutError || !layouts.length) && (
                            <>
                              <p className="text-sm" role="status">
                                {layoutError ||
                                  t("No venue layouts are available.")}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={hasSavedTickets}
                                onClick={() => void refreshLayouts()}
                              >
                                {t("Reload layouts")}
                              </Button>
                            </>
                          )}
                      </Field>
                    ) : (
                      eventInput("venueCapacity", t("Total event capacity"), {
                        type: "number",
                        min: 1,
                        required: true,
                      })
                    )}
                    {hasSavedTickets && (
                      <FieldDescription>
                        {t(
                          "Admission mode and layout are fixed once a ticket tier is saved."
                        )}
                      </FieldDescription>
                    )}
                  </>
                )}
                {step === 3 && (
                  <>
                    <FieldDescription>
                      {t("Prices are in KZT. Enter 0 for a free ticket.")}
                    </FieldDescription>
                    {tickets.map((ticket, index) => (
                      <TicketTierFields
                        key={ticket.id}
                        ticket={ticket}
                        title={
                          assigned ? ticket.id : t("Ticket tier {0}", index + 1)
                        }
                        readOnlyQuantity={assigned}
                        timeZone={event.timeZone}
                        salesSummary={vm.salesSummary}
                        onChange={(changes) =>
                          vm.updateTicket(ticket.id, changes)
                        }
                        onCustomSales={(enabled) =>
                          vm.setCustomSales(ticket, enabled)
                        }
                        onRemove={
                          !assigned &&
                          tickets.length > 1 &&
                          !savedDraft?.ticketKeys.includes(ticket.id)
                            ? () => vm.removeTicket(ticket.id)
                            : undefined
                        }
                      />
                    ))}
                    {!assigned && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={vm.addTicket}
                      >
                        {t("Add ticket tier")}
                      </Button>
                    )}
                  </>
                )}
                {step === 4 && (
                  <>
                    <EventPreview
                      event={event}
                      tickets={tickets}
                      layout={assigned ? vm.selectedLayout : undefined}
                      salesSummary={vm.salesSummary}
                    />
                    {savedDraft && (
                      <Alert>
                        <AlertDescription>
                          {t(
                            "Publishing will continue using your saved draft."
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
                <p role="status" className={busy ? "text-sm" : "sr-only"}>
                  {busy ? publishStep : ""}
                </p>
                {error && (
                  <Alert role="alert" variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="mt-6 justify-end gap-3">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => navigate(step - 1)}
                  >
                    {t("Back")}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={busy || (step === 2 && loadingLayouts)}
                >
                  {step === 4
                    ? busy
                      ? t("Publishing…")
                      : t("Publish event")
                    : step === 3
                      ? t("Continue to review")
                      : t("Continue")}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </main>
  )
}


