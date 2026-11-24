import { useEventReturn } from "@/components/site/useEventReturn"
import { BackLink, SitePage } from "@/components/site/SitePage"
import { t } from "@/i18n/locale"
import { CalendarDaysIcon, MapPinIcon } from "lucide-react"
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
import { FieldError } from "@/components/ui/field"
import { campaignEventPath } from "@/promotions/campaignLinks"
import { Spinner } from "@/components/ui/spinner"

import {
  useCampaignLinkViewModel,
  useCampaignToken,
} from "./useCampaignLinkViewModel"
import { useEventTicketsViewModel } from "./useEventTicketsViewModel"
import { ReportEvent } from "./ReportEvent"
import { useEventDetailsViewModel } from "./useEventDetailsViewModel"

export function EventDetailsPage({ eventId }: { eventId: string }) {
  const model = useEventDetailsViewModel(eventId)
  const returnTo = useEventReturn()

  return (
    <SitePage width="wide">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink href={returnTo.href}>{t(returnTo.label)}</BackLink>
        <Link
          href={`/support/new?eventId=${encodeURIComponent(eventId)}`}
          state={{ eventReturn: returnTo.href }}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("Get event support")}
        </Link>
      </div>

      {model.status === "loading" && <Loading>{t("Loading event…")}</Loading>}

      {model.status === "missing" && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>{t("Event unavailable")}</h1>
            </CardTitle>
            <CardDescription>
              {t("This event is no longer available or the link is incorrect.")}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {model.status === "error" && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>{t("Couldn’t load event")}</h1>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={model.retry}>
              {t("Try again")}
            </Button>
          </CardContent>
        </Card>
      )}

      {model.status === "ready" && (
        <EventDetails model={model} eventId={eventId} />
      )}
    </SitePage>
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
  const { href: eventReturn } = useEventReturn()
  const yourTickets = useEventTicketsViewModel(eventId)
  const campaignToken = useCampaignToken()
  const promo = useCampaignLinkViewModel(eventId, campaignToken)

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <article className="min-w-0 space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {event.category}
          </p>
          <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-semibold tracking-tight wrap-anywhere">
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
                  <dt className="font-medium">{t("Date and time")}</dt>
                  <dd className="text-muted-foreground">
                    <time dateTime={event.start.instant}>
                      {event.start.label}
                    </time>
                    <span className="block">
                      {t("Ends")}{" "}
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
                  <dt className="font-medium">{t("Venue")}</dt>
                  <dd className="text-muted-foreground">
                    {event.venue ? (
                      <>
                        <span className="block">{event.venue.name}</span>
                        {event.venue.address}
                      </>
                    ) : (
                      t("Venue details pending")
                    )}
                  </dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        {event.description && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">{t("About the event")}</h2>
            <p className="leading-relaxed break-words whitespace-pre-wrap">
              {event.description}
            </p>
          </section>
        )}
        <ReportEvent key={eventId} eventId={eventId} />
      </article>

      <aside className="space-y-4">
        {yourTickets.length > 0 && (
          <section aria-labelledby="your-event-tickets">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2 id="your-event-tickets">{t("Your tickets")}</h2>
                </CardTitle>
                <CardDescription>
                  {yourTickets.length === 1
                    ? t("You have a ticket for this event.")
                    : t(
                        "You have {0} tickets for this event.",
                        yourTickets.length
                      )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {yourTickets.map((ticket) => (
                    <li
                      key={ticket.id}
                      className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium break-all">
                          {ticket.attendee}
                        </p>
                        <p className="text-muted-foreground">{ticket.status}</p>
                      </div>
                      <Link
                        href={ticket.href}
                        aria-label={t("Open ticket for {0}", ticket.attendee)}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        {t("Open ticket")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}
        <section aria-labelledby="event-tickets">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 id="event-tickets">{t("Tickets")}</h2>
              </CardTitle>
              {event.venue && model.showTickets && (
                <CardDescription>{event.seatingLabel}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {promo.status === "loading" && (
                <Loading>{t("Checking promo link…")}</Loading>
              )}
              {promo.status === "ready" && (
                <p role="status" className="text-sm">
                  {t(
                    "Promo code {0} will be checked when you choose tickets.",
                    promo.code
                  )}
                </p>
              )}
              {promo.status === "error" && (
                <div className="space-y-2">
                  <FieldError>{promo.message}</FieldError>
                  {promo.retry && (
                    <Button variant="outline" size="sm" onClick={promo.retry}>
                      {t("Try promo link again")}
                    </Button>
                  )}
                </div>
              )}
              {model.salesMessage && (
                <p className="font-medium">{model.salesMessage}</p>
              )}
              {model.loadingTickets && (
                <Loading>{t("Loading tickets…")}</Loading>
              )}
              {model.ticketError && (
                <div className="space-y-2">
                  <p role="alert">{t("Couldn’t load ticket types.")}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={model.retryTickets}
                  >
                    {t("Try again")}
                  </Button>
                </div>
              )}
              {model.showTickets &&
                !model.loadingTickets &&
                !model.ticketError &&
                !model.tickets.length && (
                  <p className="text-muted-foreground">
                    {t("There are no tickets listed for this event.")}
                  </p>
                )}
              {model.loadingAvailability && (
                <Loading>{t("Checking availability…")}</Loading>
              )}
              {model.availabilityError && (
                <div className="space-y-2">
                  <p role="alert">{t("Couldn’t check ticket availability.")}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={model.retryAvailability}
                  >
                    {t("Try again")}
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
                    href={campaignEventPath(
                      eventId,
                      promo.status === "error" && !promo.retry
                        ? null
                        : campaignToken,
                      true
                    )}
                    state={{ eventReturn }}
                    className={buttonVariants({
                      size: "lg",
                      className: "w-full",
                    })}
                  >
                    {t("Get tickets")}
                  </Link>
                )}
            </CardContent>
          </Card>
        </section>
      </aside>
    </div>
  )
}

