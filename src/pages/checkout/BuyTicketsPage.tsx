import { useEventReturn } from "@/components/site/useEventReturn"
import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { t } from "@/i18n/locale"

import { refundPolicyDescription } from "@/events/refundPolicyPresentation"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { TicketOrderForm } from "@/pages/events/TicketOrderForm"
import { useCampaignToken } from "@/pages/events/useCampaignLinkViewModel"
import { campaignEventPath } from "@/promotions/campaignLinks"
import { useEventDetailsViewModel } from "@/pages/events/useEventDetailsViewModel"

export function BuyTicketsPage({ eventId }: { eventId: string }) {
  const model = useEventDetailsViewModel(eventId)
  const token = useCampaignToken()
  const { href: eventReturn } = useEventReturn()

  return (
    <SitePage width={model.status === "ready" && model.layout ? "wide" : "content"}>
      <BackLink
        href={campaignEventPath(eventId, token)}
        state={{ eventReturn }}
      >
        {t("Back to event")}
      </BackLink>

      <PageHeading
        description={model.status === "ready" ? model.event.title : undefined}
      >
        {t("Get tickets")}
      </PageHeading>
      {model.status === "ready" && (
        <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
          <time dateTime={model.event.start.instant}>
            {model.event.start.label}
          </time>
          {model.event.venue && <span>{model.event.venue.name}</span>}
        </p>
      )}

      {model.status === "loading" && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Spinner aria-hidden="true" /> {t("Loading event…")}
        </p>
      )}
      {model.status === "missing" && <p>{t("This event is unavailable.")}</p>}
      {model.status === "error" && (
        <div className="space-y-2">
          <FieldError>{t("Couldn’t load this event.")}</FieldError>
          <Button variant="outline" onClick={model.retry}>
            {t("Try again")}
          </Button>
        </div>
      )}
      {model.status === "ready" && (
        <>
          {model.showTickets && (
            <p className="text-sm text-muted-foreground">{refundPolicyDescription(model.event.refundHoursBeforeStart)}</p>
          )}
          {model.salesMessage && <p role="status">{model.salesMessage}</p>}
          {model.loadingTickets || model.loadingAvailability ? (
            <p role="status" className="flex items-center gap-2 text-sm">
              <Spinner aria-hidden="true" /> {t("Checking tickets…")}
            </p>
          ) : null}
          {model.ticketError && (
            <div className="space-y-2">
              <FieldError>{t("Couldn’t load ticket types.")}</FieldError>
              <Button variant="outline" onClick={model.retryTickets}>
                {t("Try again")}
              </Button>
            </div>
          )}
          {model.availabilityError && (
            <div className="space-y-2">
              <FieldError>
                {t("Couldn’t check ticket availability.")}
              </FieldError>
              <Button variant="outline" onClick={model.retryAvailability}>
                {t("Try again")}
              </Button>
            </div>
          )}
          {model.showTickets &&
            !model.loadingTickets &&
            !model.ticketError &&
            model.tickets.length === 0 && (
              <p>{t("There are no tickets listed for this event.")}</p>
            )}
          {!model.loadingTickets && !model.loadingAvailability && !model.ticketError && !model.availabilityError &&
            model.tickets.length > 0 && !model.canSelectTickets && !model.salesMessage && (
              <p role="status">{t("No tickets are currently available for purchase.")}</p>
            )}
          {model.tickets.length > 0 && (
            <TicketOrderForm
              key={`${eventId}:${token ?? ""}`}
              layout={model.layout}
              seatAvailability={model.seatAvailability}
              eventId={eventId}
              campaignToken={token}
              tickets={model.tickets}
              refreshAvailability={model.retryAvailability}
              seatingLabel={model.event.seatingLabel}
            />
          )}
        </>
      )}
    </SitePage>
  )
}

