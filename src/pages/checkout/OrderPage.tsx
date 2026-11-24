import { t } from "@/i18n/locale"
import { Link } from "wouter"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
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

