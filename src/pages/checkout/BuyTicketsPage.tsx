import { ArrowLeftIcon } from "lucide-react"
import { Link } from "wouter"

import { Button, buttonVariants } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { TicketOrderForm } from "@/pages/events/TicketOrderForm"
import { useEventDetailsViewModel } from "@/pages/events/useEventDetailsViewModel"

export function BuyTicketsPage({ eventId }: { eventId: string }) {
  const model = useEventDetailsViewModel(eventId)

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <Link
        href={`/events/${encodeURIComponent(eventId)}`}
        className={buttonVariants({ variant: "ghost" })}
      >
        <ArrowLeftIcon aria-hidden="true" />
        Back to event
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Get tickets</h1>
        {model.status === "ready" && (
          <>
            <p className="text-lg font-medium">{model.event.title}</p>
            <p className="text-sm text-muted-foreground">
              <time dateTime={model.event.start.instant}>
                {model.event.start.label}
              </time>
              {model.event.venue && <> · {model.event.venue.name}</>}
            </p>
          </>
        )}
      </header>

      {model.status === "loading" && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Spinner aria-hidden="true" /> Loading event…
        </p>
      )}
      {model.status === "missing" && <p>This event is unavailable.</p>}
      {model.status === "error" && (
        <div className="space-y-2">
          <FieldError>Couldn’t load this event.</FieldError>
          <Button variant="outline" onClick={model.retry}>
            Try again
          </Button>
        </div>
      )}
      {model.status === "ready" && (
        <>
          {model.salesMessage && <p role="status">{model.salesMessage}</p>}
          {model.loadingTickets || model.loadingAvailability ? (
            <p role="status" className="flex items-center gap-2 text-sm">
              <Spinner aria-hidden="true" /> Checking tickets…
            </p>
          ) : null}
          {model.ticketError && (
            <div className="space-y-2">
              <FieldError>Couldn’t load ticket types.</FieldError>
              <Button variant="outline" onClick={model.retryTickets}>
                Try again
              </Button>
            </div>
          )}
          {model.availabilityError && (
            <div className="space-y-2">
              <FieldError>Couldn’t check ticket availability.</FieldError>
              <Button variant="outline" onClick={model.retryAvailability}>
                Try again
              </Button>
            </div>
          )}
          {model.showTickets &&
            !model.loadingTickets &&
            !model.ticketError &&
            model.tickets.length === 0 && (
              <p>There are no tickets listed for this event.</p>
            )}
          {model.tickets.length > 0 && (
            <TicketOrderForm
              eventId={eventId}
              tickets={model.tickets}
              refreshAvailability={model.retryAvailability}
              seatingLabel={model.event.seatingLabel}
            />
          )}
        </>
      )}
    </main>
  )
}
