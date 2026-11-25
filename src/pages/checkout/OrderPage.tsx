import { useEventReturn } from "@/components/site/useEventReturn"
import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { t } from "@/i18n/locale"
import { useState } from "react"
import { Link } from "wouter"
import { useHistoryState } from "wouter/use-browser-location"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  const [refundOpen, setRefundOpen] = useState(false)
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
                      ? t("Opening payment…")
                      : t("Continue to payment")}
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
              {model.showRefund && (
                <section className="space-y-3 border-t pt-4" aria-labelledby="order-refund-heading">
                  <h2 id="order-refund-heading" className="font-semibold">{t("Refund")}</h2>
                  {model.refundLabel && <p role="status" className="text-sm">{model.refundLabel}</p>}
                  {model.canRefund && model.refundDeadline && (
                    <p className="text-sm text-muted-foreground">
                      {t("Request a full refund for this unused order by {0}.", model.refundDeadline)}
                    </p>
                  )}
                  {!model.canRefund && !model.refundLabel && (
                    <p className="text-sm text-muted-foreground">{t("Self-service refund is unavailable for this order.")}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {model.canRefund && (
                      <AlertDialog open={refundOpen} onOpenChange={setRefundOpen}>
                        <AlertDialogTrigger render={<Button variant="outline" disabled={model.busy} />}>
                          {t("Request full refund")}
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("Request full refund")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("Request a refund of {0} for the entire order ({1} tickets). The bank must confirm the refund.", model.total, model.tickets.length)}
                              {" "}{t("Tickets cannot be used while the bank processes the refund.")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={model.busy}
                              onClick={() => {
                                setRefundOpen(false)
                                model.requestRefund()
                              }}
                            >
                              {t("Request full refund")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {model.order.refundState !== "REFUNDED" && (
                      <Link
                        href={`/support/new?orderId=${encodeURIComponent(orderId)}&category=REFUND`}
                        className={buttonVariants({ variant: "ghost" })}
                      >
                        {t("Get refund help")}
                      </Link>
                    )}
                  </div>
                </section>
              )}
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
