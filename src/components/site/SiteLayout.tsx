import type { ReactNode } from "react"
import { ArrowUpRight, Compass, Ticket, UserRound } from "lucide-react"
import { Link, useLocation } from "wouter"

import { useSessionViewModel } from "@/auth/useSessionViewModel"
import { buttonVariants } from "@/components/ui/button"
import { LanguagePicker } from "@/i18n/LanguagePicker"
import { t } from "@/i18n/locale"

export function SiteLayout({ children }: { children: ReactNode }) {
  const [path] = useLocation()
  const session = useSessionViewModel()
  const signedIn = session.status === "signedIn"
  const eventsActive = path === "/events" || path.startsWith("/events/")
  const ticketsActive =
    path === "/my-tickets" ||
    path.startsWith("/my-tickets/") ||
    path.startsWith("/orders/")
  const organizerActive = path === "/organizer/start"
  const accountActive = path === "/account/settings"
  return (
    <div className="flex min-h-svh flex-col bg-muted/35 print:min-h-0 print:bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-3 print:hidden"
      >
        {t("Skip to main content")}
      </a>
      <header className="border-b bg-background print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 sm:px-6 lg:gap-x-7">
          <Link
            href="/"
            aria-current={path === "/" ? "page" : undefined}
            className="flex min-h-11 items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Ticket aria-hidden="true" className="size-4" />
            </span>
            BiletFlow
          </Link>
          <nav
            aria-label={t("Main navigation")}
            className="order-last flex w-full flex-wrap items-center gap-x-1 gap-y-0.5 border-t pt-1 sm:order-none sm:w-auto sm:border-0 sm:pt-0"
          >
            <Link
              href="/events"
              aria-current={eventsActive ? "page" : undefined}
              className={buttonVariants({
                variant: eventsActive ? "secondary" : "ghost",
                className: "h-auto min-h-10 py-2 whitespace-normal",
              })}
            >
              <Compass aria-hidden="true" /> {t("Discover events")}
            </Link>
            <Link
              href="/my-tickets"
              aria-current={ticketsActive ? "page" : undefined}
              className={buttonVariants({
                variant: ticketsActive ? "secondary" : "ghost",
                className: "h-auto min-h-10 py-2 whitespace-normal",
              })}
            >
              <Ticket aria-hidden="true" /> {t("My tickets")}
            </Link>
            <Link
              href="/organizer/start"
              aria-current={organizerActive ? "page" : undefined}
              className={buttonVariants({
                variant: organizerActive ? "secondary" : "ghost",
                className: "h-auto min-h-10 py-2 whitespace-normal",
              })}
            >
              {t("Organize")}
            </Link>
          </nav>
          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-2">
            <LanguagePicker />
            {session.status !== "restoring" && (
              <Link
                href={signedIn ? "/account/settings" : "/sign-in"}
                aria-current={accountActive ? "page" : undefined}
                className={buttonVariants({
                  variant: accountActive ? "secondary" : "ghost",
                  className: "h-auto min-h-10 py-2 whitespace-normal",
                })}
              >
                <UserRound aria-hidden="true" />{" "}
                {t(signedIn ? "Account" : "Sign in")}
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t bg-background print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-sm sm:px-6">
          <Link href="/" className="rounded-sm font-semibold hover:underline">
            BiletFlow
          </Link>
          <nav
            aria-label={t("Helpful links")}
            className="flex flex-wrap items-center gap-x-5 gap-y-1"
          >
            <Link
              href="/support"
              className="inline-flex min-h-10 items-center rounded-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {t("Support")}
            </Link>
            {session.canAccessAdmin && (
              <Link
                href="/admin"
                className="inline-flex min-h-10 items-center gap-1 rounded-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                {t("Administration")}{" "}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            )}
          </nav>
        </div>
      </footer>
    </div>
  )
}
