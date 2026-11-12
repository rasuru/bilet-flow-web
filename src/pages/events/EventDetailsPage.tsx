import { ArrowLeftIcon, CalendarDaysIcon, MapPinIcon } from "lucide-react"
import { Link } from "wouter"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

import { useEventDetailsViewModel } from "./useEventDetailsViewModel"

export function EventDetailsPage({ eventId }: { eventId: string }) {
  const model = useEventDetailsViewModel(eventId)

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <Link href="/events" className={buttonVariants({ variant: "ghost" })}>
        <ArrowLeftIcon aria-hidden="true" />
        Discover events
      </Link>

      {model.status === "loading" && <Loading>Loading event…</Loading>}

      {model.status === "missing" && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Event unavailable</h1>
            </CardTitle>
            <CardDescription>
              This event is no longer available or the link is incorrect.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {model.status === "error" && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Couldn’t load event</h1>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={model.retry}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {model.status === "ready" && (
        <EventDetails model={model} eventId={eventId} />
      )}
    </main>
  )
}

type ReadyModel = Extract<
  ReturnType<typeof useEventDetailsViewModel>,
  { status: "ready" }
>

function Loading({ children }: { children: string }) {
  return (
    <p
      className="flex items-center gap-2 text-sm text-muted-foreground"
      role="status"
    >
      <Spinner aria-hidden="true" />
      {children}
    </p>
  )
}

function EventDetails({
  model,
  eventId,
}: {
  model: ReadyModel
  eventId: string
}) {
  const { event } = model

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <article className="min-w-0 space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {event.category}
          </p>
          <h1 className="text-3xl font-bold tracking-tight break-words sm:text-4xl">
            {event.title}
          </h1>
        </header>

        {event.imageUrl && (
          <AspectRatio
            ratio={16 / 9}
            className="overflow-hidden rounded-xl bg-muted"
          >
            <img
              src={event.imageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          </AspectRatio>
        )}

        <Card>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <CalendarDaysIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <div>
                  <dt className="font-medium">Date and time</dt>
                  <dd className="text-muted-foreground">
                    <time dateTime={event.start.instant}>
                      {event.start.label}
                    </time>
                    <span className="block">
                      Ends{" "}
                      <time dateTime={event.end.instant}>
                        {event.end.label}
                      </time>
                    </span>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPinIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <div>
                  <dt className="font-medium">Venue</dt>
                  <dd className="text-muted-foreground">
                    {event.venue ? (
                      <>
                        <span className="block">{event.venue.name}</span>
                        {event.venue.address}
                      </>
                    ) : (
                      "Venue details pending"
                    )}
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        {event.description && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">About the event</h2>
            <p className="leading-relaxed break-words whitespace-pre-wrap">
              {event.description}
            </p>
          </section>
        )}
      </article>

      <section aria-labelledby="event-tickets">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 id="event-tickets">Tickets</h2>
            </CardTitle>
            {event.venue && model.showTickets && (
              <CardDescription>{event.seatingLabel}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {model.salesMessage && (
              <p className="font-medium">{model.salesMessage}</p>
            )}
            {model.loadingTickets && <Loading>Loading tickets…</Loading>}
            {model.ticketError && (
              <div className="space-y-2">
                <p role="alert">Couldn’t load ticket types.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={model.retryTickets}
                >
                  Try again
                </Button>
              </div>
            )}
            {model.showTickets &&
              !model.loadingTickets &&
              !model.ticketError &&
              !model.tickets.length && (
                <p className="text-muted-foreground">
                  There are no tickets listed for this event.
                </p>
              )}
            {model.loadingAvailability && (
              <Loading>Checking availability…</Loading>
            )}
            {model.availabilityError && (
              <div className="space-y-2">
                <p role="alert">Couldn’t check ticket availability.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={model.retryAvailability}
                >
                  Try again
                </Button>
              </div>
            )}
            {!model.ticketError && model.tickets.length > 0 && (
              <ul className="divide-y">
                {model.tickets.map((ticket) => (
                  <li key={ticket.id} className="space-y-1 py-3 first:pt-0">
                    <div className="flex flex-wrap justify-between gap-x-3">
                      <h3 className="font-semibold">{ticket.name}</h3>
                      <p className="font-semibold tabular-nums">
                        {ticket.price}
                      </p>
                    </div>
                    {ticket.description && (
                      <p className="break-words text-muted-foreground">
                        {ticket.description}
                      </p>
                    )}
                    {ticket.availability && (
                      <p className="text-muted-foreground">
                        {ticket.availability}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!model.ticketError &&
              model.tickets.some((ticket) => ticket.orderLimit > 0) && (
                <Link
                  href={`/events/${encodeURIComponent(eventId)}/buy`}
                  className={buttonVariants({
                    size: "lg",
                    className: "w-full",
                  })}
                >
                  Get tickets
                </Link>
              )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
