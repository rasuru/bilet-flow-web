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
        <Spinner aria-hidden="true" /> Loading ticket inventory…
      </p>
    )
  }
  if (inventory.error) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <p role="alert" className="text-sm text-destructive">
          Could not load ticket inventory.
        </p>
        <Button variant="ghost" size="sm" onClick={inventory.retry}>
          Try again
        </Button>
      </div>
    )
  }
  const totals = inventory.totals
  if (!totals)
    return (
      <p className="text-sm text-muted-foreground">
        Ticket inventory is not configured.
      </p>
    )

  return (
    <section className="space-y-2">
      <h4 className="text-sm font-medium">Ticket inventory</h4>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[
          ["Capacity", totals.capacity],
          ["Sold", totals.sold],
          ["Remaining", totals.available],
          ["Reserved", totals.reserved],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {totals.progress && (
        <Progress value={totals.progress.value} aria-label="Tickets sold">
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
            View details
          </Button>
          <Link
            href={event.campaignsPath}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Manage campaigns
          </Link>
          {event.publicPath && (
            <Link
              href={event.publicPath}
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              View event
            </Link>
          )}
          {event.copyPath && (
            <Button size="sm" variant="outline" onClick={onCopy}>
              Copy link
            </Button>
          )}
          {event.actions.map((action) => (
            <Button
              key={action}
              size="sm"
              variant={action === "cancel" ? "destructive" : "outline"}
              onClick={() => onAction(action)}
            >
              {eventActionLabels[action]}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

