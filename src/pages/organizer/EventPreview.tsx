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

function dateLabel(value: string) {
  return value.replace("T", " at ")
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
              {visibilityDetails[event.visibility].label}
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
              Open event image
            </a>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-medium">Event schedule ({event.timeZone})</dt>
              <dd className="text-muted-foreground">
                {dateLabel(event.startAt)} to {dateLabel(event.endAt)}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Registration</dt>
              <dd className="text-muted-foreground">
                {event.registrationOpensAt
                  ? `Opens ${dateLabel(event.registrationOpensAt)}`
                  : "Open when published"}
                {event.registrationClosesAt &&
                  ` · Closes ${dateLabel(event.registrationClosesAt)}`}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Venue</dt>
              <dd className="text-muted-foreground">
                {event.venueName}, {event.venueAddress}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Admission</dt>
              <dd className="text-muted-foreground">
                {layout
                  ? `Assigned seating · ${layout.name} · ${layout.seats.length} seats`
                  : `General admission · Capacity ${event.venueCapacity}`}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>
            <h2>Ticket tiers</h2>
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
                      ? "Free"
                      : `${ticket.price} KZT`}
                  </Badge>
                </div>
                {ticket.description && <p>{ticket.description}</p>}
                <p className="text-muted-foreground">
                  {ticket.capacity} tickets · Max {ticket.maxPerOrder} per order
                  {layout && ` · ${ticket.id}`}
                </p>
                <p className="text-muted-foreground">
                  {ticket.customSales
                    ? `On sale ${dateLabel(ticket.salesStartAt)} to ${dateLabel(ticket.salesEndAt)} (${event.timeZone})`
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
