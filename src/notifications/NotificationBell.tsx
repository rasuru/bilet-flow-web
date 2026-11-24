import { Popover } from "@base-ui/react/popover"
import { useQuery } from "@tanstack/react-query"
import { BellIcon } from "lucide-react"
import { useState } from "react"
import { Link } from "wouter"

import { listMyCheckouts } from "@/api/checkouts"
import { sessionRepository } from "@/auth/sessionRepository"
import { Button } from "@/components/ui/button"
import { dateFormat, statusText, t } from "@/i18n/locale"
import { payoutAccountRepository } from "@/payments/payoutAccountRepository"
import { supportRepository } from "@/support/supportRepository"
import { ticketDetailsPath } from "@/tickets/ticketPresentation"
import { ticketRepository } from "@/tickets/ticketRepository"

type Activity = {
  key: string
  title: string
  detail?: string
  at?: string | null
  href: string
}

const date = dateFormat({ dateStyle: "medium", timeStyle: "short" })

function loadRead(storageKey: string): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]")
    return Array.isArray(saved)
      ? saved.filter((key) => typeof key === "string")
      : []
  } catch {
    return []
  }
}

export function NotificationBell({
  sessionId,
  accountId,
}: {
  sessionId: number
  accountId: number
}) {
  const storageKey = `biletflow.notifications.read.${accountId}`
  const [read, setRead] = useState(() => loadRead(storageKey))
  const [open, setOpen] = useState(false)
  const ticketQuery = useQuery({
    ...ticketRepository.mineQuery(sessionId),
    refetchInterval: 30_000,
    retry: false,
  })
  const orderQuery = useQuery({
    queryKey: ["notifications", sessionId, "orders"],
    queryFn: () =>
      sessionRepository.authenticatedRequest(sessionId, listMyCheckouts),
    refetchInterval: 30_000,
    retry: false,
  })
  const support = useQuery(supportRepository.listQuery(sessionId))
  const payout = useQuery(payoutAccountRepository.accountQuery(sessionId))

  const activities: Activity[] = []
  for (const ticket of ticketQuery.data ?? []) {
    if (ticket.status === "VALID" || ticket.status === "CHECKED_IN") {
      activities.push({
        key: `ticket:${ticket.id}`,
        title: t("Ticket confirmed"),
        at: ticket.issuedAt,
        href: ticketDetailsPath(ticket.id),
      })
    }
  }
  for (const order of orderQuery.data ?? []) {
    if (order.refundState === "REFUNDED") {
      activities.push({
        key: `refund:${order.id}:${order.refundId ?? ""}`,
        title: t("Order refunded"),
        href: `/orders/${encodeURIComponent(order.id)}`,
      })
    }
  }
  for (const item of support.data ?? []) {
    activities.push({
      key: `support:${item.id}:${item.updatedAt}:${item.status}`,
      title: item.subject,
      detail: t("Support case · {0}", statusText(item.status)),
      at: item.updatedAt,
      href: `/support/${encodeURIComponent(item.id)}`,
    })
  }
  if (payout.data) {
    activities.push({
      key: `payout:${payout.data.updatedAt}:${payout.data.verification}`,
      title: t("Payout verification"),
      detail: statusText(payout.data.verification),
      at: payout.data.updatedAt,
      href: "/account/settings",
    })
  }
  const readSet = new Set(read)
  const recent = activities
    .sort(
      (a, b) =>
        Number(readSet.has(a.key)) - Number(readSet.has(b.key)) ||
        (Date.parse(b.at ?? "") || 0) - (Date.parse(a.at ?? "") || 0)
    )
    .slice(0, 12)
  const unread = recent.filter((item) => !readSet.has(item.key)).length
  const sources = [ticketQuery, orderQuery, support, payout]

  function markRead(keys: string[]) {
    const next = [...new Set([...keys, ...read])].slice(0, 200)
    setRead(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // Read state remains available in memory for this session.
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={<Button type="button" variant="ghost" size="icon-sm" />}
        aria-label={
          unread ? t("Notifications ({0} unread)", unread) : t("Notifications")
        }
        className="relative"
      >
        <BellIcon aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 size-2 rounded-full bg-primary"
            aria-hidden="true"
          />
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={8}
          align="end"
          collisionPadding={12}
          className="z-50"
        >
          <Popover.Popup className="w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <Popover.Title className="font-semibold">
                {t("Notifications")}
              </Popover.Title>
              {unread > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => markRead(activities.map((item) => item.key))}
                >
                  {t("Mark all as read")}
                </Button>
              )}
            </div>
            {sources.some((source) => source.isError) && (
              <p className="py-2 text-sm text-muted-foreground">
                {t("Some activity could not be loaded.")}
              </p>
            )}
            {recent.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">
                {sources.some((source) => source.isPending)
                  ? t("Loading activity…")
                  : t("No recent activity")}
              </p>
            ) : (
              <ul className="max-h-80 divide-y overflow-auto">
                {recent.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-2 py-2 hover:bg-muted focus-visible:outline-ring"
                      onClick={() => {
                        markRead([item.key])
                        setOpen(false)
                      }}
                    >
                      <span className="block text-sm font-medium break-words">
                        {!readSet.has(item.key) && (
                          <>
                            <span
                              className="mr-1.5 inline-block size-1.5 rounded-full bg-primary"
                              aria-hidden="true"
                            />
                            <span className="sr-only">{t("Unread")} </span>
                          </>
                        )}
                        {item.title}
                      </span>
                      {item.detail && (
                        <span className="block text-xs text-muted-foreground">
                          {item.detail}
                        </span>
                      )}
                      {item.at && Number.isFinite(Date.parse(item.at)) && (
                        <time
                          dateTime={item.at}
                          className="block text-xs text-muted-foreground"
                        >
                          {date.format(new Date(item.at))}
                        </time>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
