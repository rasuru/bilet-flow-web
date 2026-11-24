import { BackLink } from "@/components/site/SitePage"
import { useEffect, useRef } from "react"
import { t } from "@/i18n/locale"
import { Link, Redirect } from "wouter"

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
import { FieldDescription } from "@/components/ui/field"
import { EventDetailsFields } from "./EventDetailsFields"
import { EventVenueFields } from "./EventVenueFields"
import { OrganizerLayout } from "./OrganizerLayout"
import { manageEventPath } from "./organizerEventPresentation"
import { EventPreview } from "./EventPreview"
import { TicketTierFields } from "./TicketTierFields"
import { useCreateEventViewModel } from "./useCreateEventViewModel"

const steps = ["Basics", "Schedule", "Venue & Admission", "Tickets", "Review"]

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

  const stepTitle = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    stepTitle.current?.focus({ preventScroll: true })
  }, [step])

  if (result && !result.local) {
    return (
      <Redirect
        to={manageEventPath(result.id)}
        state={{
          organizerNotice: result.published
            ? "Event published."
            : "Draft saved.",
        }}
        replace
      />
    )
  }

  return (
    <OrganizerLayout>
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-5 sm:px-6 sm:py-7">
        <BackLink href="/organizer">{t("Organizer dashboard")}</BackLink>
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-semibold tracking-tight">
          {result ? t("Event saved locally") : t("Create new event")}
        </h1>
        {!result && (
          <nav aria-label={t("Event form progress")} className="mb-6">
            <ol className="flex flex-wrap gap-2">
              {steps.map((label, index) => (
                <li key={label}>
                  <button
                    type="button"
                    aria-current={index === step ? "step" : undefined}
                    disabled={busy}
                    className={buttonVariants({
                      variant: index === step ? "secondary" : "ghost",
                      size: "sm",
                    })}
                    onClick={() => navigate(index)}
                  >
                    <span>{t(label)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <Card>
          <CardHeader>
            {result ? (
              <CardDescription className="wrap-anywhere">
                {event.title}
              </CardDescription>
            ) : (
              <CardTitle>
                <h2
                  ref={stepTitle}
                  tabIndex={-1}
                  className="w-fit rounded-sm text-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  {t(steps[step])}
                </h2>
              </CardTitle>
            )}
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
                void vm.submit("publish")
              }}
              noValidate
              aria-busy={busy}
            >
              <CardContent>
                <fieldset disabled={busy} className="min-w-0 space-y-4">
                  {step < 2 && (
                    <EventDetailsFields
                      event={event}
                      setField={setField}
                      section={step === 0 ? "basics" : "schedule"}
                    />
                  )}
                  {step === 2 &&
                    (vm.venueSaved ? (
                      <div className="space-y-2">
                        <p className="text-sm">
                          {event.venueName} · {event.venueAddress}
                        </p>
                        <FieldDescription>
                          {t(
                            "Venue and admission settings are fixed after you save them."
                          )}
                        </FieldDescription>
                      </div>
                    ) : (
                      <EventVenueFields
                        event={event}
                        setField={setField}
                        seatingMode={seatingMode}
                        changeSeatingMode={vm.changeSeatingMode}
                        layouts={layouts}
                        layoutsOffline={layoutsOffline}
                        loadingLayouts={loadingLayouts}
                        layoutError={layoutError}
                        selectLayout={selectLayout}
                        refreshLayouts={() => void refreshLayouts()}
                      />
                    ))}
                  {(step === 3 || step === 4) && vm.hasPaidTickets && (
                    <Alert className="border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                      <AlertDescription>
                        <strong className="mb-1 block">{t("Paid sales require activation")}</strong>
                        <span>{t("A one-time activation fee applies to events with paid tickets. You can save or publish now and activate paid sales from event management. Paid tickets cannot be purchased until activation is complete.")}</span>
                      </AlertDescription>
                    </Alert>
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
                            assigned
                              ? ticket.id
                              : t("Ticket tier {0}", index + 1)
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
                </fieldset>
                {!busy && step < 2 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t("Save a draft to add a venue and tickets later.")}
                  </p>
                )}
                <p role="status" className={busy ? "mt-4 text-sm" : "sr-only"}>
                  {busy ? publishStep : ""}
                </p>
                {savedDraft && (
                  <Link
                    href={manageEventPath(savedDraft.id)}
                    className={buttonVariants({
                      variant: "link",
                      className: "px-0",
                    })}
                  >
                    {t("Open saved draft")}
                  </Link>
                )}
                {error && (
                  <Alert role="alert" variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="mt-6 flex-wrap justify-end gap-2">
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
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void vm.submit("draft")}
                >
                  {t("Save draft")}
                </Button>
                <Button
                  type="submit"
                  disabled={busy || (step === 2 && loadingLayouts)}
                >
                  {step === 4
                    ? t("Publish event")
                    : step === 3
                      ? t("Continue to review")
                      : t("Continue")}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </OrganizerLayout>
  )
}

