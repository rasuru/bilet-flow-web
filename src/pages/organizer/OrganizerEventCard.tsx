import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "wouter"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { t } from "@/i18n/locale"
import type { OrganizerEvent } from "./organizerEventPresentation"

export function OrganizerEventCard({
  event,
  onCopy,
  venueAction,
}: {
  event: OrganizerEvent
  onCopy: () => void
  venueAction?: ReactNode
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{event.statusLabel}</Badge>
        <Badge variant="outline">{event.visibility}</Badge>
      </div>

      <div className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <p className="font-medium wrap-anywhere">{event.starts}</p>
            <p className="text-muted-foreground wrap-anywhere">{t("Ends")}: {event.ends}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-start gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <p className="font-medium wrap-anywhere">{event.venue}</p>
            {event.address && <p className="text-muted-foreground wrap-anywhere">{event.address}</p>}
          </div>
        </div>
        <div className="flex min-w-0 items-start gap-2.5">
          <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <p className="font-medium wrap-anywhere">{event.admission}</p>
            {event.category && <p className="text-muted-foreground wrap-anywhere">{event.category}</p>}
          </div>
        </div>
      </div>

      {event.description && (
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground wrap-anywhere whitespace-pre-wrap">
          {event.description}
        </p>
      )}
      {event.draftMessage && (
        <Alert>
          <AlertDescription>{event.draftMessage}</AlertDescription>
        </Alert>
      )}
      {(venueAction || event.publicPath || event.copyPath) && (
      <div className="flex flex-wrap items-center gap-2">
        {venueAction}
        {event.publicPath && (
          <Link href={event.publicPath} className={buttonVariants({ variant: "default", className: "min-h-10" })}>
            {t("View event page")}
            <ArrowUpRight aria-hidden="true" />
          </Link>
        )}
        {event.copyPath && (
          <Button variant="ghost" className="min-h-10" onClick={onCopy}>
            {t("Copy link")}
          </Button>
        )}
      </div>
      )}
    </div>
  )
}

