import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react"
import { Link } from "wouter"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

import { useMyTicketsViewModel } from "./useMyTicketsViewModel"

export function MyTicketsPage({
  sessionId,
  verifiedEmail,
}: {
  sessionId: number
  verifiedEmail: string | null
}) {
  const model = useMyTicketsViewModel(sessionId, verifiedEmail)
  const activity = model.activity

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <Link href="/" className={buttonVariants({ variant: "ghost" })}>
        <ArrowLeftIcon aria-hidden="true" />
        Home
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">My tickets</h1>

      {model.loading && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Spinner aria-hidden="true" /> Loading your tickets…
        </p>
      )}
      {model.error && (
        <div className="space-y-2">
          <FieldError>Couldn’t load your tickets and events.</FieldError>
          <Button variant="outline" onClick={model.retry}>
            Try again
          </Button>
        </div>
      )}

      {activity && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Upcoming events</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity.upcoming.length ? (
                <ul className="divide-y">
                  {activity.upcoming.map((event) => (
                    <li
                      key={event.id}
                      className="space-y-1 py-3 first:pt-0 last:pb-0"
                    >
                      <Link
                        href={event.href}
                        className="font-medium hover:underline"
                      >
                        {event.title}
                      </Link>
                      <p className="text-muted-foreground">
                        <time dateTime={event.startAt}>{event.starts}</time>
                      </p>
                      {event.venue && (
                        <p className="text-muted-foreground">{event.venue}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    You don’t have any upcoming events.
                  </p>
                  <Link
                    href="/events"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    Discover events
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>Ticket orders</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activity.orders.length ? (
                  <ul className="divide-y">
                    {activity.orders.map((order) => (
                      <li
                        key={order.id}
                        className="space-y-3 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{order.title}</h3>
                            <p className="text-muted-foreground capitalize">
                              {order.status} · {order.total}
                            </p>
                          </div>
                          <Link
                            href={order.href}
                            aria-label={`${order.awaitingPayment ? "Continue payment" : "View order"} for ${order.title}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                            })}
                          >
                            {order.awaitingPayment
                              ? "Continue payment"
                              : "View order"}
                            <ArrowUpRightIcon aria-hidden="true" />
                          </Link>
                        </div>
                        {order.tickets.length > 0 && (
                          <ul className="space-y-1 text-muted-foreground">
                            {order.tickets.map((ticket) => (
                              <li
                                key={ticket.id}
                                className="flex flex-wrap items-start justify-between gap-2 py-1"
                              >
                                <div className="min-w-0">
                                  <p className="font-medium break-all text-foreground">
                                    {ticket.attendee}
                                  </p>
                                  <p>{ticket.status}</p>
                                </div>
                                <Link
                                  href={ticket.href}
                                  aria-label={`Open ticket for ${ticket.attendee}`}
                                  className={buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                  })}
                                >
                                  Open ticket
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    You haven’t placed any ticket orders yet.
                  </p>
                )}
              </CardContent>
            </Card>
            {activity.linkedTickets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <h2>Other tickets in your account</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y">
                    {activity.linkedTickets.map((ticket) => (
                      <li
                        key={ticket.id}
                        className="space-y-1 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-medium">{ticket.title}</p>
                          <Link
                            href={ticket.href}
                            aria-label={`Open ticket for ${ticket.title}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                            })}
                          >
                            Open ticket
                          </Link>
                        </div>
                        <p className="text-muted-foreground">
                          {ticket.status} ·{" "}
                          <span className="font-mono">{ticket.code}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
