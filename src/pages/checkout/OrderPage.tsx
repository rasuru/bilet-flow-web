import { t } from "@/i18n/locale"
import { useQuery } from "@tanstack/react-query"
import { Link } from "wouter"
import { OrderIdentifiers } from "@/checkout/OrderIdentifiers"
import { Badge } from "@/components/ui/badge"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { EventCalendarActions } from "@/events/EventCalendarActions"
import { publicEventRepository } from "@/events/publicEventRepository"
import { ticketDetailsPath } from "@/tickets/ticketPresentation"
import { ticketRepository } from "@/tickets/ticketRepository"

import { useOrderViewModel } from "./useOrderViewModel"

function OrderCalendarActions({ eventId }: { eventId: string }) {
  const { data } = useQuery(publicEventRepository.eventQuery(eventId))
  return data ? <EventCalendarActions event={data} /> : null
}

export function OrderPage({
  sessionId,
  orderId,
}: {
  sessionId: number
  orderId: string
}) {
  const model = useOrderViewModel(sessionId, orderId)
  const order = model.status === "ready" ? model.order : undefined
  const issuedOrderId =
    order?.orderId ?? order?.tickets.find((ticket) => ticket.orderId)?.orderId
  const ticketRecords = useQuery({
    ...ticketRepository.mineQuery(sessionId),
    enabled: !issuedOrderId && Boolean(order?.tickets.length),
  })
  const linkedOrderId = ticketRecords.data?.find((ticket) =>
    order?.tickets.some((issued) => issued.id === ticket.id)
  )?.orderId

  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-6 sm:px-6">
      <Link
        href={
          model.status === "ready"
            ? `/events/${encodeURIComponent(model.order.eventId)}`
            : "/events"
        }
        className={buttonVariants({ variant: "ghost" })}
      >
        {model.status === "ready" ? t("Back to event") : t("Discover events")}
      </Link>

      <Link
        href={`/support/new?orderId=${encodeURIComponent(orderId)}`}
        className={buttonVariants({ variant: "outline" })}
      >
        {t("Get order support")}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{t("Your order")}</h1>
          </CardTitle>
        </CardHeader>
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
              {model.order.sandbox && (
                <Badge variant="secondary">
                  {t("Sandbox · Demo transaction")}
                </Badge>
              )}
              <OrderIdentifiers
                checkoutId={model.order.id}
                orderId={issuedOrderId ?? linkedOrderId}
              />
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <dt className="text-muted-foreground">{t("Status")}</dt>
                <dd className="font-medium capitalize" role="status">
                  {model.statusLabel}
                </dd>
                <dt className="text-muted-foreground">
                  {t("Ticket subtotal")}
                </dt>
                <dd>{model.subtotal ?? t("Unavailable")}</dd>
                {(model.order.promoCode ||
                  Boolean(model.order.discountKzt)) && (
                  <>
                    <dt className="text-muted-foreground">
                      {t("Promo discount")} {model.order.promoCode}
                    </dt>
                    <dd>{model.discount ?? t("Unavailable")}</dd>
                  </>
                )}
                {model.processingFee !== null && (
                  <>
                    <dt className="text-muted-foreground">
                      {t("Processing fee")}
                    </dt>
                    <dd>{model.processingFee}</dd>
                  </>
                )}
                <dt className="font-semibold">{t("Total (KZT)")}</dt>
                <dd className="font-semibold">{model.total}</dd>
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
              {model.order.status === "COMPLETED" && (
                <OrderCalendarActions eventId={model.order.eventId} />
              )}
              {model.error && <FieldError>{model.error}</FieldError>}
              {model.paymentMessage && (
                <p className="text-muted-foreground">{model.paymentMessage}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {model.pay && (
                  <Button onClick={model.pay} disabled={model.busy}>
                    {model.paying
                      ? t("Opening Halyk ePay…")
                      : model.order.sandbox
                        ? t("Pay in Halyk sandbox")
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
    </main>
  )
}
