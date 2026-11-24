import { useEventReturn } from "@/components/site/useEventReturn"
import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { t } from "@/i18n/locale"
import { Link } from "wouter"
import { useHistoryState } from "wouter/use-browser-location"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { ticketDetailsPath } from "@/tickets/ticketPresentation"

import { useOrderViewModel } from "./useOrderViewModel"

export function OrderPage({
  sessionId,
  orderId,
}: {
  sessionId: number
  orderId: string
}) {
  const model = useOrderViewModel(sessionId, orderId)
  const { href: eventReturn } = useEventReturn()
  const state = useHistoryState<{ orderFrom?: string } | null>()
  const eventParent =
    model.status === "ready" && state?.orderFrom !== "/my-tickets"

  return (
    <SitePage width="form">
      <BackLink
        state={eventParent ? { eventReturn } : undefined}
        href={
          eventParent
            ? `/events/${encodeURIComponent(model.order.eventId)}`
            : "/my-tickets"
        }
      >
        {t(eventParent ? "Back to event" : "My tickets")}
      </BackLink>

      <PageHeading
        action={
          <Link
            href={`/support/new?orderId=${encodeURIComponent(orderId)}`}
            className={buttonVariants({
              variant: "outline",
              className: "min-h-10",
            })}
          >
            {t("Get order support")}
          </Link>
        }
      >
        {t("Your order")}
      </PageHeading>
      <Card>
        <CardContent className="space-y-4">
          {model.status === "loading" && (
            <p role="status" className="flex items-center gap-2">
              <Spinner aria-hidden="true" /> {t("Loading order…")}
            </p>
          )}
          {model.status === "error" && (
            <>
              <FieldError>{model.error}</FieldError>
              <Button variant="outline" onClick={model.refresh}>
                {t("Try again")}
              </Button>
            </>
          )}
          {model.status === "ready" && (
            <>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
                <dt className="text-muted-foreground">{t("Status")}</dt>
                <dd className="font-medium capitalize" role="status">
                  {model.statusLabel}
                </dd>
                <dt className="text-muted-foreground">{t("Order ID")}</dt>
                <dd className="break-all">{model.order.id}</dd>
                {model.promotion && (
                  <>
                    <dt className="text-muted-foreground">{t("Subtotal")}</dt>
                    <dd>{model.promotion.subtotal}</dd>
                    <dt className="text-muted-foreground">
                      {t("Promo")} {model.promotion.code}
                    </dt>
                    <dd>−{model.promotion.discount}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">{t("Total")}</dt>
                <dd>{model.total}</dd>
                {model.expiresAt && (
                  <>
                    <dt className="text-muted-foreground">
                      {t("Hold expires")}
                    </dt>
                    <dd>
                      <time dateTime={model.order.expiresAt}>
                        {model.expiresAt}
                      </time>
                    </dd>
                  </>
                )}
              </dl>
              {model.error && <FieldError>{model.error}</FieldError>}
              {model.paymentMessage && (
                <p className="text-muted-foreground">{model.paymentMessage}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {model.pay && (
                  <Button onClick={model.pay} disabled={model.busy}>
                    {model.paying
                      ? t("Opening Halyk ePay…")
                      : t("Pay with Halyk ePay")}
                  </Button>
                )}
                {model.canCancel && (
                  <Button
                    variant="outline"
                    onClick={model.cancel}
                    disabled={model.busy}
                  >
                    {model.cancelling ? t("Cancelling…") : t("Cancel order")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={model.refresh}
                  disabled={model.refreshing || model.busy}
                >
                  {t("Refresh status")}
                </Button>
              </div>
              {model.tickets.length > 0 && (
                <section className="space-y-2 border-t pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">{t("Issued tickets")}</h2>
                    <Link
                      href="/"
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      {t("Go to home")}
                    </Link>
                  </div>
                  <ul className="divide-y">
                    {model.tickets.map((ticket) => (
                      <li
                        key={ticket.id}
                        className="flex flex-wrap justify-between gap-2 py-2"
                      >
                        <span className="break-all">
                          {ticket.attendeeEmail}
                          <span className="block font-mono">{ticket.code}</span>
                        </span>
                        <Link
                          href={ticketDetailsPath(ticket.id)}
                          aria-label={t(
                            "Open ticket for {0}",
                            ticket.attendeeEmail
                          )}
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
                </section>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </SitePage>
  )
}
