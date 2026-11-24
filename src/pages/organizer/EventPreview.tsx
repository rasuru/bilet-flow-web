import { dateFormat, numberFormat, t } from "@/i18n/locale"
import type { VenueLayout } from "@/api/events"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  visibilityDetails,
  type EventDraft,
  type TicketDraft,
} from "./createEventDraft"

// The inputs hold wall-clock times in the event’s selected time zone.
const dateTime = dateFormat({
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})
const count = numberFormat({ maximumFractionDigits: 0 })
const price = numberFormat({ style: "currency", currency: "KZT" })

function dateLabel(value: string) {
  const wallTime = Date.parse(`${value}Z`)
  return Number.isFinite(wallTime) ? dateTime.format(wallTime) : value
}

export function EventPreview({
  event,
  tickets,
  layout,
  salesSummary,
}: {
  event: EventDraft
  tickets: TicketDraft[]
  layout?: VenueLayout
  salesSummary: string
}) {
  return (
    <div className="grid gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>
            <h2>{event.title}</h2>
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            {event.category}{" "}
            <Badge variant="outline">
              {t(visibilityDetails[event.visibility].label)}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {event.description && (
            <p className="whitespace-pre-wrap">{event.description}</p>
          )}
          {event.imageUrl && (
            <a
              className="underline underline-offset-4"
              href={event.imageUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("Open event image")}
            </a>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-medium">
                {t("Event schedule ({0})", event.timeZone)}
              </dt>
              <dd className="text-muted-foreground">
                {t(
                  "{0} to {1}",
                  dateLabel(event.startAt),
                  dateLabel(event.endAt)
                )}
              </dd>
            </div>
            <div>
              <dt className="font-medium">{t("Registration")}</dt>
              <dd className="text-muted-foreground">
                {event.registrationOpensAt
                  ? t("Opens {0}", dateLabel(event.registrationOpensAt))
                  : t("Open when published")}
                {event.registrationClosesAt &&
                  ` · ${t("Closes {0}", dateLabel(event.registrationClosesAt))}`}
              </dd>
            </div>
            <div>
              <dt className="font-medium">{t("Venue")}</dt>
              <dd className="text-muted-foreground">
                {event.venueName}, {event.venueAddress}
              </dd>
            </div>
            <div>
              <dt className="font-medium">{t("Admission")}</dt>
              <dd className="text-muted-foreground">
                {layout
                  ? t(
                      "Assigned seating · {0} · {1} seats",
                      layout.name,
                      count.format(layout.seats.length)
                    )
                  : t(
                      "General admission · Capacity {0}",
                      count.format(Number(event.venueCapacity))
                    )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>
            <h2>{t("Ticket tiers")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                className="space-y-1 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{ticket.name}</h3>
                  <Badge>
                    {Number(ticket.price) === 0
                      ? t("Free")
                      : price.format(Number(ticket.price))}
                  </Badge>
                </div>
                {ticket.description && <p>{ticket.description}</p>}
                <p className="text-muted-foreground">
                  {t(
                    "{0} tickets · Max {1} per order",
                    count.format(Number(ticket.capacity)),
                    count.format(Number(ticket.maxPerOrder))
                  )}
                  {layout && ` · ${ticket.id}`}
                </p>
                <p className="text-muted-foreground">
                  {ticket.customSales
                    ? t(
                        "On sale {0} to {1} ({2})",
                        dateLabel(ticket.salesStartAt),
                        dateLabel(ticket.salesEndAt),
                        event.timeZone
                      )
                    : salesSummary}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

