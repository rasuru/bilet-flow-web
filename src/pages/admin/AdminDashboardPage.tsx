import { t } from "@/i18n/locale"
import { ArrowUpRight, ShieldCheck } from "lucide-react"
import { Link, useSearch } from "wouter"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  AdminActivations,
  AdminExports,
  AdminOrders,
  AdminPayments,
} from "./AdminCommerce"
import { AdminEventReports, AdminEvents, AdminSupport } from "./AdminModeration"
import { AdminOverview } from "./AdminOverview"
import { AdminAuthorities, AdminUsers } from "./AdminPlatform"
import {
  adminNavigation,
  adminPath,
  getAdminSection,
  type AdminSection,
} from "./adminNavigation"

export function AdminDashboardPage({
  sessionId,
  login,
  section: sectionId,
}: {
  sessionId: number
  login: string
  section: string
}) {
  const search = useSearch()
  const section = getAdminSection(sectionId)
  const title = section?.title ?? t("Section not found")

  return (
    <div className="min-h-svh bg-muted/35 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="border-b bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-svh lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:py-5">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" className="size-[18px]" />
            </span>
            <span className="block">
              <span className="block text-sm font-semibold tracking-tight">
                BiletFlow
              </span>
              <span className="block text-xs text-muted-foreground">
                {t("Administration")}
              </span>
            </span>
          </Link>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "lg:hidden",
            })}
          >
            {t("Back to site")} <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        <nav
          aria-label={t("Admin sections")}
          className="flex gap-2 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-4 lg:pb-5"
        >
          {adminNavigation.map((group) => (
            <div
              key={group.title ?? "main"}
              className="flex shrink-0 gap-1 lg:block"
            >
              {group.title && (
                <p className="mb-1 hidden px-2.5 text-xs font-medium text-muted-foreground lg:block">
                  {t(group.title)}
                </p>
              )}
              {group.items.map((item) => {
                const current = item.id === section?.id
                return (
                  <Link
                    key={item.id}
                    href={adminPath(item.id)}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-8 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap outline-offset-2 hover:bg-sidebar-accent focus-visible:outline-2",
                      current
                        ? "bg-primary/20 text-sidebar-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon aria-hidden="true" className="size-4 shrink-0" />{" "}
                    {t(item.title)}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="hidden items-center justify-between gap-4 border-b bg-background px-6 py-3 lg:flex xl:px-8">
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t("Back to site")} <ArrowUpRight aria-hidden="true" />
          </Link>
          <Link
            href="/account/settings"
            className="max-w-56 truncate rounded-md text-sm font-medium text-muted-foreground hover:underline focus-visible:outline"
          >
            {login}
          </Link>
        </header>
        <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:py-8 xl:px-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              {t(title)}
            </h1>
            {section && (
              <p className="text-sm text-muted-foreground">
                {t(section.description)}
              </p>
            )}
          </div>
          {section ? (
            <AdminSectionContent
              key={`${section.id}:${search}`}
              section={section.id}
              sessionId={sessionId}
              params={new URLSearchParams(search)}
            />
          ) : (
            <Link
              href="/admin"
              className={buttonVariants({ variant: "outline" })}
            >
              {t("Go to overview")}
            </Link>
          )}
        </main>
      </div>
    </div>
  )
}

function AdminSectionContent({
  section,
  sessionId,
  params,
}: {
  section: AdminSection
  sessionId: number
  params: URLSearchParams
}) {
  switch (section) {
    case "overview":
      return <AdminOverview sessionId={sessionId} />
    case "events":
      return <AdminEvents sessionId={sessionId} params={params} />
    case "event-reports":
      return <AdminEventReports sessionId={sessionId} params={params} />
    case "support":
      return <AdminSupport sessionId={sessionId} params={params} />
    case "orders":
      return <AdminOrders sessionId={sessionId} params={params} />
    case "payments":
      return <AdminPayments sessionId={sessionId} params={params} />
    case "activations":
      return <AdminActivations sessionId={sessionId} />
    case "promotions":
      return <AdminOrders sessionId={sessionId} params={params} promotedOnly />
    case "users":
      return <AdminUsers sessionId={sessionId} />
    case "authorities":
      return <AdminAuthorities sessionId={sessionId} />
    case "exports":
      return <AdminExports sessionId={sessionId} />
  }
}

