import { EventAccessSettings } from "./EventAccessSettings"
import { BackLink } from "@/components/site/SitePage"
import { useEffect, useRef } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { ManagedEventAction } from "@/events/managedEventRepository"
import { t } from "@/i18n/locale"
import { OrganizerEventHistory } from "./OrganizerEventHistory"
import { OrganizerAnalyticsPanel } from "./OrganizerAnalyticsPanel"
import { AttachEventVenue, EditEventDetails } from "./OrganizerEventSettings"
import { usePaidSalesViewModel } from "./usePaidSalesViewModel"
import { Badge } from "@/components/ui/badge"
import { PaidSalesActivation } from "./PaidSalesActivation"
import { OrganizerEventStaff } from "./OrganizerEventStaff"
import { OrganizerTicketTypes } from "./OrganizerTicketTypes"
import { OrganizerCampaignsSection } from "./OrganizerCampaignsSection"
import { OrganizerEventCard } from "./OrganizerEventCard"
import { eventActionLabels } from "./organizerEventPresentation"
import { OrganizerLayout } from "./OrganizerLayout"
import { useOrganizerViewModel } from "./useOrganizerViewModel"

const actionDescriptions = {
  publish: "Publish the event page. Paid tickets remain unavailable until paid sales are activated. Discovery requires at least one purchasable ticket.",
  unpublish: "Take the event off sale and remove its public page.",
  cancel: "Cancellation cannot be undone. New sales and admission will stop, and attendees will be notified. Completed paid orders are not automatically refunded.",
} satisfies Record<ManagedEventAction, string>

export function ManageEventPage({
  sessionId,
  eventId,
}: {
  sessionId: number
  eventId: string
}) {
  const model = useOrganizerViewModel(sessionId, eventId)
  const { event, managedEvent, confirmation } = model
  const paidSales = usePaidSalesViewModel(sessionId, eventId)
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    title.current?.focus({ preventScroll: true })
  }, [])

  return (
    <OrganizerLayout eventSections={model.eventSections}>
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-5 sm:px-6 sm:py-7 xl:px-10">
        <BackLink href={model.dashboardPath}>
          {t("Organizer dashboard")}
        </BackLink>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h1
          ref={title}
          tabIndex={-1}
          className="w-fit max-w-full rounded-sm text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-semibold tracking-tight wrap-anywhere outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {event?.title ?? t("Manage event")}
        </h1>
        {managedEvent?.status !== "CANCELLED" && paidSales.loaded && paidSales.active && (
          <Badge variant="outline" className="border-green-600/40 bg-green-500/10 leading-none text-green-700 dark:text-green-400">
            {t("Paid sales activated")}
          </Badge>
        )}
        </div>

        {model.loading && (
          <p role="status" className="flex items-center gap-2 text-sm">
            <Spinner aria-hidden="true" /> {t("Loading event…")}
          </p>
        )}
        {model.error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription className="space-y-2">
              <p>{model.error}</p>
              <Button size="sm" variant="outline" onClick={model.retry}>
                {t("Try again")}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {model.notice && (
          <Alert variant={model.notice.error ? "destructive" : "default"}>
            <AlertDescription role={model.notice.error ? "alert" : "status"}>
              {model.notice.text}
            </AlertDescription>
          </Alert>
        )}
        {event && managedEvent && (
          <>
            <EventAccessSettings key={managedEvent.id} event={managedEvent} sessionId={sessionId} />
            {managedEvent.status !== "CANCELLED" && <PaidSalesActivation vm={paidSales} />}
            {managedEvent.status === "CANCELLED" && (
              <Alert>
                <AlertDescription>
                  {t("This event is cancelled. Ticket sales and admission are closed. Existing paid orders must be refunded separately.")}
                </AlertDescription>
              </Alert>
            )}
            <section
              id="organizer-details"
              aria-labelledby="manage-event-details"
              className="scroll-mt-4"
            >
              <Card>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>
                    <h2 id="manage-event-details" className="text-lg">
                      {t("Event")}
                    </h2>
                  </CardTitle>
                  {managedEvent.status !== "CANCELLED" && (
                    <EditEventDetails
                      sessionId={sessionId}
                      event={managedEvent}
                      notify={model.notify}
                      actions={event.menuActions}
                      onAction={model.requestAction}
                    />
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <OrganizerEventCard
                    event={event}
                    onCopy={() => {
                      if (event.copyPath)
                        void model.copyEventLink(event.copyPath)
                    }}
                    venueAction={
                      managedEvent.status === "DRAFT" && !managedEvent.venue ? (
                        <AttachEventVenue
                          sessionId={sessionId}
                          event={managedEvent}
                          notify={model.notify}
                        />
                      ) : undefined
                    }
                  />
                </CardContent>
              </Card>
            </section>
            <OrganizerTicketTypes
              sessionId={sessionId}
              event={managedEvent}
              notify={model.notify}
            />
            <OrganizerEventStaff
              sessionId={sessionId}
              event={managedEvent}
              notify={model.notify}
            />
            <OrganizerCampaignsSection
              sessionId={sessionId}
              eventId={event.id}
              campaignsPath={event.campaignsPath}
              dashboardFilters={model.dashboardFilters}
            />
            <div id="organizer-analytics" className="scroll-mt-4">
              <OrganizerAnalyticsPanel
                sessionId={sessionId}
                eventId={event.id}
              />
            </div>
            <OrganizerEventHistory key={event.id} sessionId={sessionId} eventId={event.id} />
          </>
        )}

        <AlertDialog
          open={Boolean(confirmation)}
          onOpenChange={(open) => {
            if (!open) model.closeConfirmation()
          }}
        >
          {confirmation && (
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("{0}?", t(eventActionLabels[confirmation.action]))}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="mb-2 block font-medium wrap-anywhere text-foreground">
                    {confirmation.title}
                  </span>
                  {t(actionDescriptions[confirmation.action])}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {(confirmation.error || !confirmation.allowed) && (
                <p role="alert" className="text-sm text-destructive">
                  {confirmation.error ??
                    t("This action is no longer available for this event.")}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={confirmation.busy}>
                  {t("Back")}
                </AlertDialogCancel>
                <Button
                  variant={
                    confirmation.action === "cancel" ? "destructive" : "default"
                  }
                  disabled={!confirmation.allowed || confirmation.busy}
                  onClick={() => void model.confirmAction()}
                >
                  {confirmation.busy && <Spinner aria-hidden="true" />}
                  {t(eventActionLabels[confirmation.action])}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          )}
        </AlertDialog>
      </div>
    </OrganizerLayout>
  )
}

