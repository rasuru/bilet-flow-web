import { ArrowDown, Plus } from "lucide-react"
import { Link, Redirect, useSearchParams } from "wouter"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { t } from "@/i18n/locale"
import { OrganizerAnalyticsSummary } from "./OrganizerAnalyticsSummary"
import { OrganizerEventList } from "./OrganizerEventList"
import { manageEventPath } from "./organizerEventPresentation"
import { OrganizerLayout } from "./OrganizerLayout"
import { useOrganizerAnalyticsOverviewViewModel } from "./useOrganizerAnalyticsViewModel"
import { useOrganizerEventsViewModel } from "./useOrganizerEventsViewModel"

export function OrganizerDashboardPage({ sessionId }: { sessionId: number }) {
  const [params] = useSearchParams()
  const eventId = params.get("event")
  if (eventId) return <Redirect to={manageEventPath(eventId)} replace />

  return <Dashboard sessionId={sessionId} />
}

function Dashboard({ sessionId }: { sessionId: number }) {
  const events = useOrganizerEventsViewModel(sessionId)
  const empty = !events.loading && !events.error && events.events.length === 0

  return (
    <OrganizerLayout isDashboard>
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-8 px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-semibold tracking-tight">
            {t("Organizer dashboard")}
          </h1>
          {!empty && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/organizer/events/new"
                className={buttonVariants({ className: "h-10 px-4" })}
              >
                <Plus aria-hidden="true" /> {t("Create event")}
              </Link>
              {events.events.length > 0 && (
                <a
                  href="#organizer-events"
                  className={buttonVariants({
                    variant: "ghost",
                    className: "h-10 px-2 sm:hidden",
                  })}
                >
                  {t("Your events")} <ArrowDown aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </header>

        {!empty && <AnalyticsOverview sessionId={sessionId} />}
        <OrganizerEventList model={events} />
      </div>
    </OrganizerLayout>
  )
}

function AnalyticsOverview({ sessionId }: { sessionId: number }) {
  const { summary, loading, error, retry } =
    useOrganizerAnalyticsOverviewViewModel(sessionId)

  return (
    <section className="space-y-3" aria-labelledby="organizer-overview">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="organizer-overview"
          className="text-xl font-semibold tracking-tight"
        >
          {t("All events overview")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("All time")}</p>
      </div>
      {loading && (
        <Skeleton
          className="h-48 w-full"
          role="status"
          aria-label={t("Loading analytics…")}
        />
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <p>{error}</p>
            <Button size="sm" variant="outline" onClick={retry}>
              {t("Try again")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {summary && <OrganizerAnalyticsSummary summary={summary} />}
    </section>
  )
}
