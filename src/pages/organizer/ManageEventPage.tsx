import { ArrowLeft } from "lucide-react"
import { useEffect, useRef } from "react"
import { Link } from "wouter"

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
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { ManagedEventAction } from "@/events/managedEventRepository"
import { t } from "@/i18n/locale"
import { OrganizerAnalyticsPanel } from "./OrganizerAnalyticsPanel"
import { OrganizerEventCard } from "./OrganizerEventCard"
import { eventActionLabels } from "./organizerEventPresentation"
import { OrganizerLayout } from "./OrganizerLayout"
import { useOrganizerViewModel } from "./useOrganizerViewModel"

const actionDescriptions = {
  publish: "Publish this event with its current visibility and schedule.",
  unpublish: "Take the event off sale and remove its public page.",
  cancel: "Stop new sales and admission. Attendees will be notified.",
} satisfies Record<ManagedEventAction, string>

export function ManageEventPage({
  sessionId,
  eventId,
}: {
  sessionId: number
  eventId: string
}) {
  const model = useOrganizerViewModel(sessionId, eventId)
  const { event, confirmation } = model
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    title.current?.focus({ preventScroll: true })
  }, [])

  return (
    <OrganizerLayout>
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-5 sm:px-6 sm:py-7 xl:px-10">
        <Link
          href={model.dashboardPath}
          className={buttonVariants({
            variant: "ghost",
            className: "-ml-2 h-10",
          })}
        >
          <ArrowLeft aria-hidden="true" /> {t("Organizer dashboard")}
        </Link>
        <h1
          ref={title}
          tabIndex={-1}
          className="w-fit max-w-full rounded-sm text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-semibold tracking-tight wrap-anywhere outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {event?.title ?? t("Manage event")}
        </h1>

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
        {event && (
          <>
            <OrganizerEventCard
              event={event}
              onAction={model.requestAction}
              onCopy={() => {
                if (event.copyPath) void model.copyEventLink(event.copyPath)
              }}
            />
            <OrganizerAnalyticsPanel sessionId={sessionId} eventId={event.id} />
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
