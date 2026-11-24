import { ArrowRight, CalendarDays, Plus, Search } from "lucide-react"
import { Link } from "wouter"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { numberFormat, t } from "@/i18n/locale"
import { useOrganizerEventsViewModel } from "./useOrganizerEventsViewModel"

const integer = numberFormat({ maximumFractionDigits: 0 })
const rowColumns =
  "lg:grid-cols-[minmax(0,1fr)_minmax(6rem,0.32fr)_minmax(6rem,0.28fr)_minmax(6rem,0.3fr)_6rem]"

export function OrganizerEventList({
  model,
}: {
  model: ReturnType<typeof useOrganizerEventsViewModel>
}) {
  const hasEvents = model.events.length > 0
  return (
    <section className="space-y-4" aria-labelledby="organizer-events">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="organizer-events"
          tabIndex={-1}
          className="scroll-mt-4 text-xl font-semibold tracking-tight"
        >
          {t("Your events")}
        </h2>
        {hasEvents && !model.salesLoading && !model.salesUnavailable && (
          <p role="status" className="text-sm text-muted-foreground">
            {t(
              "{0} of {1} events",
              integer.format(model.visible.length),
              integer.format(model.events.length)
            )}
          </p>
        )}
      </div>

      {model.loading && (
        <div
          role="status"
          aria-label={t("Loading events…")}
          className="space-y-2"
        >
          <Skeleton className="h-12" />
          <Skeleton className="h-24" />
        </div>
      )}
      {model.error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="space-y-2">
            <p>{model.error}</p>
            <Button size="sm" variant="outline" onClick={model.retry}>
              {t("Try again")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {!model.loading && !model.error && !hasEvents && (
        <div className="rounded-xl border bg-card p-6 sm:p-8">
          <CalendarDays
            aria-hidden="true"
            className="mb-3 size-5 text-muted-foreground"
          />
          <p className="font-medium">
            {t("You haven’t organized any events yet.")}
          </p>
          <Link
            href="/organizer/events/new"
            className={buttonVariants({ className: "mt-4 h-10" })}
          >
            <Plus aria-hidden="true" /> {t("Create event")}
          </Link>
        </div>
      )}
      {hasEvents && (
        <div className="rounded-xl border bg-card">
          <div className="flex flex-wrap items-center gap-3 p-3 sm:px-4">
            <div className="relative min-w-0 flex-[1_1_13rem] sm:max-w-80">
              <Label htmlFor="organizer-search" className="sr-only">
                {t("Search events")}
              </Label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="organizer-search"
                type="search"
                className="h-10 pl-9"
                placeholder={t("Event or venue")}
                value={model.search}
                onChange={(e) => model.setSearch(e.currentTarget.value)}
              />
            </div>
            <Label htmlFor="organizer-status" className="sr-only">
              {t("Filter events by status")}
            </Label>
            <NativeSelect
              id="organizer-status"
              className="max-w-full [&>select]:h-10"
              value={model.filter}
              onChange={(e) => model.setFilter(e.currentTarget.value)}
            >
              {model.filters.map(({ value, label }) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Label htmlFor="organizer-pricing" className="sr-only">
              {t("Filter events by ticket price")}
            </Label>
            <NativeSelect
              id="organizer-pricing"
              className="max-w-full [&>select]:h-10"
              value={model.pricing}
              onChange={(e) => model.setPricing(e.currentTarget.value)}
            >
              {model.pricingOptions.map(({ value, label }) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Label htmlFor="organizer-sort" className="sr-only">
              {t("Sort events by")}
            </Label>
            <NativeSelect
              id="organizer-sort"
              className="max-w-full [&>select]:h-10"
              value={model.sort}
              onChange={(e) => model.setSort(e.currentTarget.value)}
            >
              {model.sortOptions.map(({ value, label }) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {(model.search ||
              model.filter !== "all" ||
              model.pricing !== "all") && (
              <Button
                variant="ghost"
                className="h-10"
                onClick={model.clearFilters}
              >
                {t("Clear filters")}
              </Button>
            )}
          </div>
          {model.incompleteSales && (
            <p
              role="status"
              className="border-t px-4 py-3 text-sm text-muted-foreground"
            >
              {t("Sales or ticket prices are unavailable for some events.")}
            </p>
          )}
          {model.salesLoading ? (
            <p
              role="status"
              className="border-t px-4 py-3 text-sm text-muted-foreground"
            >
              {t("Loading event sales and ticket prices…")}
            </p>
          ) : model.salesUnavailable ? (
            <div
              role="status"
              className="flex flex-wrap items-center gap-3 border-t px-4 py-3 text-sm text-muted-foreground"
            >
              <p>
                {t(
                  "This view needs sales and ticket prices. Try again or change the sort or filters."
                )}
              </p>
              {model.retrySales && (
                <Button size="sm" variant="outline" onClick={model.retrySales}>
                  {t("Retry sales data")}
                </Button>
              )}
            </div>
          ) : model.visible.length === 0 ? (
            <p className="border-t p-5 text-sm text-muted-foreground">
              {t("No events match your search and filters.")}
            </p>
          ) : (
            <>
              <div
                aria-hidden="true"
                className={`hidden ${rowColumns} gap-3 border-y bg-muted/45 px-4 py-2.5 text-xs font-medium text-muted-foreground lg:grid`}
              >
                <span>{t("Event")}</span>
                <span>{t("Starts")}</span>
                <span>{t("Status")}</span>
                <span>{model.salesLabel}</span>
                <span />
              </div>
              <ul className="divide-y border-t lg:border-t-0">
                {model.visible.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    filters={model.returnFilters}
                    salesLabel={model.salesLabel}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function EventRow({
  event,
  filters,
  salesLabel,
}: {
  event: ReturnType<typeof useOrganizerEventsViewModel>["visible"][number]
  filters: string
  salesLabel: string
}) {
  const metadata = `organizer-event-${event.id}`
  return (
    <li>
      <Link
        href={event.managePath}
        state={{ organizerEventFilters: filters }}
        className={`group grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-4 py-3.5 hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${rowColumns} lg:gap-3`}
        aria-label={t("Manage {0}", event.title)}
        aria-describedby={`${metadata}-venue ${metadata}-date ${metadata}-status ${metadata}-sales`}
      >
        <div className="col-start-1 min-w-0">
          <p className="font-semibold wrap-anywhere">{event.title}</p>
          <p
            id={`${metadata}-venue`}
            className="mt-0.5 text-sm wrap-anywhere text-muted-foreground"
          >
            {event.venue}
          </p>
        </div>
        <div
          id={`${metadata}-date`}
          className="col-start-1 row-start-2 min-w-0 text-sm tabular-nums lg:col-start-2 lg:row-start-1"
        >
          <span>{event.startDate}</span>
          {event.startTime && (
            <span className="text-muted-foreground lg:mt-0.5 lg:block">
              <span className="lg:hidden"> · </span>
              {event.startTime}
            </span>
          )}
        </div>
        <div
          id={`${metadata}-status`}
          className="col-start-1 row-start-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 lg:col-start-3 lg:row-start-1 lg:flex-col lg:items-start"
        >
          <Badge
            variant={
              event.status === "active" || event.status === "upcoming"
                ? "secondary"
                : "outline"
            }
            className="h-auto w-fit max-w-full gap-1 whitespace-normal"
          >
            {(event.status === "active" || event.status === "upcoming") && (
              <span
                aria-hidden="true"
                className={
                  event.status === "active"
                    ? "size-1.5 rounded-full bg-emerald-700 dark:bg-emerald-300"
                    : "size-1.5 rounded-full border border-current"
                }
              />
            )}
            {event.statusLabel}
          </Badge>
          {event.pricingLabel && (
            <span className="text-xs wrap-anywhere text-muted-foreground">
              {event.pricingLabel}
            </span>
          )}
        </div>
        <div
          id={`${metadata}-sales`}
          className="col-start-1 row-start-4 min-w-0 text-sm wrap-anywhere tabular-nums empty:hidden lg:col-start-4 lg:row-start-1"
        >
          {event.salesValue !== null && (
            <>
              <span className="mr-1.5 text-xs text-muted-foreground lg:sr-only">
                {salesLabel}
              </span>
              <span className="font-medium">{event.salesValue}</span>
            </>
          )}
        </div>
        <span
          aria-hidden="true"
          className="col-start-2 row-span-4 row-start-1 flex w-fit items-center justify-end gap-2 justify-self-end rounded-md border px-2.5 py-2 text-sm font-medium group-hover:bg-background lg:col-start-5 lg:row-span-1 lg:w-24 lg:justify-center"
        >
          <span className="hidden lg:inline">{t("Manage")}</span>
          <ArrowRight className="size-4 shrink-0" />
        </span>
      </Link>
    </li>
  )
}
