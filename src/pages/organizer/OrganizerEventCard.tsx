import { numberFormat, t } from "@/i18n/locale"
import { CalendarDays, MapPin, Users } from "lucide-react"
import { Link } from "wouter"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import type { ManagedEventAction } from "@/events/managedEventRepository"
import { eventActionLabels } from "./organizerEventPresentation"
import type { OrganizerEventCardModel } from "./useOrganizerViewModel"

const integer = numberFormat({ maximumFractionDigits: 0 })

export function OrganizerInventory({
  inventory,
}: {
  inventory: OrganizerEventCardModel["inventory"]
}) {
  if (inventory.loading) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Spinner aria-hidden="true" /> {t("Loading ticket inventory…")}
      </p>
    )
  }
  if (inventory.error) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p role="alert" className="text-sm text-destructive">
          {t("Could not load ticket inventory.")}
        </p>
        <Button variant="ghost" size="sm" onClick={inventory.retry}>
          {t("Try again")}
        </Button>
      </div>
    )
  }
  const totals = inventory.totals
  if (!totals)
    return (
      <p className="text-sm text-muted-foreground">
        {t("Ticket inventory is not configured.")}
      </p>
    )

  return (
    <section className="space-y-2">
      <h4 className="text-sm font-medium">{t("Ticket inventory")}</h4>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {(
          [
            [t("Capacity"), totals.capacity],
            [t("Sold"), totals.sold],
            [t("Remaining"), totals.available],
            [t("Reserved"), totals.reserved],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">
              {integer.format(value)}
            </dd>
          </div>
        ))}
      </dl>
      {totals.progress && (
        <Progress value={totals.progress.value} aria-label={t("Tickets sold")}>
          <span className="text-sm text-muted-foreground">
            {totals.progress.label}
          </span>
        </Progress>
      )}
    </section>
  )
}

export function OrganizerEventCard({
  event,
  onPreview,
  onAction,
  onCopy,
}: {
  event: OrganizerEventCardModel
  onPreview: () => void
  onAction: (action: ManagedEventAction) => void
  onCopy: () => void
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <h3 className="wrap-anywhere">{event.title}</h3>
          <Badge variant="secondary">{event.statusLabel}</Badge>
          <Badge variant="outline">{event.visibility}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" aria-hidden="true" />{" "}
            {event.starts}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />{" "}
            {event.venue}
          </span>
          <span className="flex items-center gap-2">
            <Users className="size-4 shrink-0" aria-hidden="true" />{" "}
            {event.admission}
          </span>
        </div>
        {event.draftMessage && (
          <Alert>
            <AlertDescription>{event.draftMessage}</AlertDescription>
          </Alert>
        )}
        <OrganizerInventory inventory={event.inventory} />
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button size="sm" variant="outline" onClick={onPreview}>
            {t("View details")}
          </Button>
          <Link
            href={event.campaignsPath}
            aria-label={t("Manage campaigns for {0}", event.title)}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            {t("Manage campaigns")}
          </Link>
          {event.publicPath && (
            <Link
              href={event.publicPath}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              {t("View event")}
            </Link>
          )}
          {event.copyPath && (
            <Button size="sm" variant="outline" onClick={onCopy}>
              {t("Copy link")}
            </Button>
          )}
          {event.actions.map((action) => (
            <Button
              key={action}
              size="sm"
              variant={action === "cancel" ? "destructive" : "outline"}
              onClick={() => onAction(action)}
            >
              {t(eventActionLabels[action])}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
