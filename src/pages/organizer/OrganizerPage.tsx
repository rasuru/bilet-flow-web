import { numberFormat, t } from "@/i18n/locale"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { Link } from "wouter"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import type { ManagedEventAction } from "@/events/managedEventRepository"
import { OrganizerEventCard, OrganizerInventory } from "./OrganizerEventCard"
import { eventActionLabels } from "./organizerEventPresentation"
import { OrganizerLayout } from "./OrganizerLayout"
import { useOrganizerViewModel } from "./useOrganizerViewModel"

const integer = numberFormat({ maximumFractionDigits: 0 })

const actionDescriptions = {
  publish: "Publish this event with its current visibility and schedule.",
  unpublish: "Take the event off sale and remove its public page.",
  cancel: "Stop new sales and admission. Attendees will be notified.",
} satisfies Record<ManagedEventAction, string>

export function OrganizerPage({
  sessionId,
  section = "dashboard",
}: {
  sessionId: number
  section?: "dashboard" | "events"
}) {
  const model = useOrganizerViewModel(sessionId)
  const { preview, confirmation } = model
  const total = model.total

  return (
    <OrganizerLayout section={section}>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            {section === "dashboard" ? t("Organizer dashboard") : t("Events")}
          </h1>
          <Link href="/organizer/events/new" className={buttonVariants()}>
            <Plus aria-hidden="true" /> {t("Create event")}
          </Link>
        </div>

        {model.loading && (
          <p role="status" className="flex items-center gap-2 text-sm">
            <Spinner aria-hidden="true" /> {t("Loading events…")}
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

        {section === "dashboard" && total > 0 && (
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>
                <h2>{t("Event summary")}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {model.summary.map(({ label, count }) => (
                <Progress
                  key={label}
                  value={count}
                  max={total}
                  aria-label={label}
                  getAriaValueText={() =>
                    t(
                      "{0} of {1} events",
                      integer.format(count),
                      integer.format(total)
                    )
                  }
                >
                  <span className="flex w-full justify-between text-sm">
                    {label}
                    <strong className="tabular-nums">
                      {integer.format(count)}
                    </strong>
                  </span>
                </Progress>
              ))}
            </CardContent>
          </Card>
        )}

        {model.notice && (
          <p
            role={model.notice.error ? "alert" : "status"}
            className={
              model.notice.error ? "text-sm text-destructive" : "text-sm"
            }
          >
            {model.notice.text}
          </p>
        )}

        {total > 0 && (
          <section className="space-y-4" aria-labelledby="organizer-events">
            <h2 id="organizer-events" className="text-lg font-semibold">
              {t("Your events")}
            </h2>
            <div
              role="group"
              aria-label={t("Filter events by status")}
              className="flex flex-wrap gap-2"
            >
              {model.filters.map(({ value, label, count }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={model.filter === value ? "secondary" : "outline"}
                  aria-pressed={model.filter === value}
                  onClick={() => model.setFilter(value)}
                >
                  {label}{" "}
                  <span className="tabular-nums">{integer.format(count)}</span>
                </Button>
              ))}
            </div>
            {model.events.length === 0 && (
              <p role="status" className="text-sm text-muted-foreground">
                {t("No events match this status.")}
              </p>
            )}
            {model.events.map((event) => (
              <OrganizerEventCard
                key={event.id}
                event={event}
                onPreview={() => model.setPreviewId(event.id)}
                onAction={(action) => model.requestAction(event.id, action)}
                onCopy={() => {
                  if (event.copyPath) void model.copyEventLink(event.copyPath)
                }}
              />
            ))}
          </section>
        )}

        {!model.loading && !model.error && total === 0 && (
          <Card className="shadow-none">
            <CardContent className="text-sm text-muted-foreground">
              {t("You haven’t organized any events yet.")}
            </CardContent>
          </Card>
        )}

        <Dialog
          open={Boolean(preview)}
          onOpenChange={(open) => {
            if (!open) model.setPreviewId(null)
          }}
        >
          {preview && (
            <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="wrap-anywhere">
                  {preview.title}
                </DialogTitle>
                <DialogDescription>{preview.category}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{preview.statusLabel}</Badge>
                <Badge variant="outline">{preview.visibility}</Badge>
              </div>
              {preview.description && (
                <p className="text-sm wrap-anywhere whitespace-pre-wrap">
                  {preview.description}
                </p>
              )}
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {[
                  [t("Starts"), preview.starts],
                  [t("Ends"), preview.ends],
                  [
                    t("Venue"),
                    [preview.venue, preview.address].filter(Boolean).join(", "),
                  ],
                  [t("Admission"), preview.admission],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="wrap-anywhere">{value}</dd>
                  </div>
                ))}
              </dl>
              <OrganizerInventory inventory={preview.inventory} />
            </DialogContent>
          )}
        </Dialog>

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

