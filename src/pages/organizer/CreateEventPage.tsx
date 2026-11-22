import type { ComponentProps, ReactNode } from "react"
import { Link } from "wouter"

import type { EventVisibility, SeatingMode } from "@/api/events"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
import {
  timeZones,
  visibilityDetails,
  type EventDraft,
} from "./createEventDraft"
import { EventPreview } from "./EventPreview"
import { TicketTierFields } from "./TicketTierFields"
import { useCreateEventViewModel } from "./useCreateEventViewModel"

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

const textareaClassName =
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function CreateEventPage() {
  const vm = useCreateEventViewModel()
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
    needsSignIn,
    busy,
    publishStep,
    result,
    locked,
    navigate,
  } = vm

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
        {!result && (
          <nav aria-label="Event form progress" className="mb-6">
            <ol className="grid grid-cols-5 gap-2 text-center">
              {steps.map((label, index) => (
                <li key={label}>
                  <button
                    type="button"
                    aria-current={index === step ? "step" : undefined}
                    disabled={busy || locked}
                    className="flex w-full flex-col items-center gap-2 rounded-md text-xs focus-visible:outline-ring disabled:opacity-60"
                    onClick={() => navigate(index)}
                  >
                    <span
                      className={`grid size-7 place-items-center rounded-full ${index === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {index + 1}
                    </span>
                    <span>{label}</span>
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
                {result
                  ? result.local
                    ? "Event saved locally"
                    : "Event published"
                  : "Create new event"}
              </h1>
            </CardTitle>
            <CardDescription>
              {result ? event.title : steps[step]}
            </CardDescription>
            {import.meta.env.DEV && !result && (
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy || locked || loadingLayouts}
                  onClick={vm.fillSample}
                >
                  Fill sample event
                </Button>
              </CardAction>
            )}
          </CardHeader>

          {result ? (
            <CardContent>
              {result.local ? (
                <p role="status" className="text-sm">
                  The development API is unavailable. This event was saved in
                  this browser only.
                </p>
              ) : (
                <Link
                  href={`/events/${encodeURIComponent(result.id)}`}
                  className="text-sm underline"
                >
                  View event
                </Link>
              )}
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
                    {eventInput("title", "Event title", { required: true })}
                    {eventInput("category", "Category", { required: true })}
                    <Field id="description" label="Description (optional)">
                      <textarea
                        id="description"
                        className={textareaClassName}
                        value={event.description}
                        onChange={(e) =>
                          setField("description", e.target.value)
                        }
                      />
                    </Field>
                    {eventInput("imageUrl", "Image URL (optional)", {
                      type: "url",
                    })}
                    <Field id="visibility" label="Visibility">
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
                              {label}
                            </NativeSelectOption>
                          )
                        )}
                      </NativeSelect>
                      <FieldDescription id="visibility-description">
                        {visibilityDetails[event.visibility].description}
                      </FieldDescription>
                    </Field>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {eventInput("startAt", "Starts", {
                        type: "datetime-local",
                        required: true,
                      })}
                      {eventInput("endAt", "Ends", {
                        type: "datetime-local",
                        required: true,
                      })}
                    </div>
                    <Field id="timeZone" label="Time zone">
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
                        "Registration opens (optional)",
                        {
                          type: "datetime-local",
                          "aria-describedby": "registration-description",
                        }
                      )}
                      {eventInput(
                        "registrationClosesAt",
                        "Registration closes (optional)",
                        {
                          type: "datetime-local",
                          "aria-describedby": "registration-description",
                        }
                      )}
                    </div>
                    <FieldDescription id="registration-description">
                      Registration limits when buyers can order tickets across
                      all tiers. Leave both dates blank to open registration
                      when the event is published.
                    </FieldDescription>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Field id="admission" label="Admission mode">
                      <NativeSelect
                        id="admission"
                        className="w-full"
                        value={seatingMode}
                        disabled={loadingLayouts}
                        onChange={(e) =>
                          vm.changeSeatingMode(e.target.value as SeatingMode)
                        }
                      >
                        <NativeSelectOption value="GENERAL_ADMISSION">
                          General admission
                        </NativeSelectOption>
                        <NativeSelectOption value="ASSIGNED_SEATING">
                          Assigned seating
                        </NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    {eventInput("venueName", "Venue name", { required: true })}
                    {eventInput("venueAddress", "Address", { required: true })}
                    {assigned ? (
                      <Field id="layoutId" label="Venue layout">
                        <NativeSelect
                          id="layoutId"
                          className="w-full"
                          required
                          value={event.layoutId}
                          disabled={loadingLayouts || !layouts.length}
                          onChange={(e) => selectLayout(e.target.value)}
                        >
                          <NativeSelectOption value="">
                            {loadingLayouts
                              ? "Loading layouts…"
                              : "Select a layout"}
                          </NativeSelectOption>
                          {layouts.map((layout) => (
                            <NativeSelectOption
                              key={layout.layoutId}
                              value={layout.layoutId}
                            >
                              {layout.name} ({layout.seats.length} seats)
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        {layoutsOffline && layouts.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Sample layouts are available for local saves.
                          </p>
                        )}
                        {!loadingLayouts &&
                          (layoutError || !layouts.length) && (
                            <>
                              <p className="text-sm" role="status">
                                {layoutError ||
                                  "No venue layouts are available."}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => void refreshLayouts()}
                              >
                                Reload layouts
                              </Button>
                            </>
                          )}
                      </Field>
                    ) : (
                      eventInput("venueCapacity", "Total event capacity", {
                        type: "number",
                        min: 1,
                        required: true,
                      })
                    )}
                  </>
                )}
                {step === 3 && (
                  <>
                    <FieldDescription>
                      Prices are in KZT. Enter 0 for a free ticket.
                    </FieldDescription>
                    {tickets.map((ticket, index) => (
                      <TicketTierFields
                        key={ticket.id}
                        ticket={ticket}
                        title={
                          assigned ? ticket.id : `Ticket tier ${index + 1}`
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
                          !assigned && tickets.length > 1
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
                        Add ticket tier
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
                    {locked && (
                      <Alert>
                        <AlertDescription>
                          An event draft exists on the server. Retry to continue
                          publishing it.
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
                {step === 4 && error && needsSignIn && (
                  <Link
                    href="/sign-in"
                    target="_blank"
                    rel="noopener"
                    className="text-sm underline"
                  >
                    Open sign-in
                  </Link>
                )}
              </CardContent>
              <CardFooter className="mt-6 justify-end gap-3">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || locked}
                    onClick={() => navigate(step - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={busy || (step === 2 && loadingLayouts)}
                >
                  {step === 4
                    ? busy
                      ? "Publishing…"
                      : locked
                        ? "Retry publishing"
                        : "Publish event"
                    : step === 3
                      ? "Continue to review"
                      : "Continue"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </main>
  )
}
