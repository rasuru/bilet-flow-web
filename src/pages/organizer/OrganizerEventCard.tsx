import { CalendarDays, ChevronDown, MapPin, Users } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "wouter"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { t } from "@/i18n/locale"
import type { ManagedEventAction } from "@/events/managedEventRepository"
import {
  eventActionLabels,
  type OrganizerEvent,
} from "./organizerEventPresentation"

export function OrganizerEventCard({
  event,
  onAction,
  onCopy,
  venueAction,
}: {
  event: OrganizerEvent
  onAction: (action: ManagedEventAction) => void
  onCopy: () => void
  venueAction?: ReactNode
}) {
  const [firstAction] = event.actions
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{event.statusLabel}</Badge>
        <Badge variant="outline">{event.visibility}</Badge>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {[
          { Icon: CalendarDays, value: event.starts },
          { Icon: MapPin, value: event.venue },
          { Icon: Users, value: event.admission },
        ].map(({ Icon, value }) => (
          <span
            key={value}
            className="flex min-w-0 items-start gap-2 wrap-anywhere"
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{" "}
            {value}
          </span>
        ))}
      </div>

      {event.draftMessage && (
        <Alert>
          <AlertDescription>{event.draftMessage}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        {venueAction}
        <Link
          href={event.campaignsPath}
          className={buttonVariants({ variant: "outline", className: "h-10" })}
        >
          {t("Manage campaigns")}
        </Link>
        {event.publicPath && (
          <Link
            href={event.publicPath}
            className={buttonVariants({
              variant: "outline",
              className: "h-10",
            })}
          >
            {t("View event")}
          </Link>
        )}
        {event.copyPath && (
          <Button variant="outline" className="h-10" onClick={onCopy}>
            {t("Copy link")}
          </Button>
        )}
        {event.actions.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" className="h-10" />}
            >
              {t("Event status")} <ChevronDown aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {event.actions.map((action) => (
                <DropdownMenuItem
                  key={action}
                  className="min-h-9"
                  variant={action === "cancel" ? "destructive" : "default"}
                  onClick={() => onAction(action)}
                >
                  {t(eventActionLabels[action])}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          firstAction && (
            <Button className="h-10" onClick={() => onAction(firstAction)}>
              {t(eventActionLabels[firstAction])}
            </Button>
          )
        )}
      </div>

      <details className="border-t pt-2">
        <summary className="w-fit cursor-pointer rounded-md py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
          {t("More event information")}
        </summary>
        <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-3">
          {[
            [t("Category"), event.category],
            [t("Ends"), event.ends],
            [t("Address"), event.address],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="wrap-anywhere">{value}</dd>
              </div>
            ))}
        </dl>
        {event.description && (
          <p className="mt-3 text-sm wrap-anywhere whitespace-pre-wrap">
            {event.description}
          </p>
        )}
      </details>
    </div>
  )
}
