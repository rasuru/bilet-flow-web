import { t, dateFormat, uiText } from "@/i18n/locale"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  CalendarPlus,
  LucideClock,
  LucideMapPin,
  Search,
  Ticket,
} from "lucide-react"
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { Link, useLocation, useSearch } from "wouter"

import {
  type EventDiscoveryPage as DiscoveryPageResponse,
  type EventDiscoveryItem,
  type EventSalesStatus,
  type PublicEvent,
} from "@/api/events"
import { managedEventRepository } from "@/events/managedEventRepository"
import { publicEventRepository } from "@/events/publicEventRepository"
import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { manageEventPath } from "@/pages/organizer/organizerEventPresentation"
import { ticketDetailsPath } from "@/tickets/ticketPresentation"
import { useSessionViewModel } from "@/auth/useSessionViewModel"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { attendanceRepository } from "@/tickets/attendanceRepository"

const discoveryPath = "/events"
const organizerDashboardPath = "/organizer"
const previewSize = 4
const overviewSize = 3
const attendeePreviewSize = 2
const pageSize = 12

function eventDetailsPath(eventId: string) {
  return `${discoveryPath}/${encodeURIComponent(eventId)}`
}

const defaultFilters = {
  query: "",
  category: "",
  availableOnly: false,
  sort: "startAt,asc" as "startAt,asc" | "startAt,desc",
}

const shortDateTime = dateFormat({
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

const dateTimeWithYear = dateFormat({
  dateStyle: "medium",
  timeStyle: "short",
})

const salesLabels: Record<EventSalesStatus, string | null> = {
  AVAILABLE: null,
  SOLD_OUT: "Sold out",
  COMING_SOON: "Coming soon",
  REGISTRATION_CLOSED: "Registration closed",
  UNAVAILABLE: "Tickets unavailable",
}

function formatStartAt(startAt: string) {
  const date = new Date(startAt)
  const formatter =
    date.getFullYear() === new Date().getFullYear()
      ? shortDateTime
      : dateTimeWithYear

  return formatter.format(date)
}

function toCard(
  event: EventDiscoveryItem & {
    venueName?: string | null
    venueAddress?: string | null
  }
) {
  const venueName = event.venueName ?? null
  const venueAddress = event.venueAddress ?? null
  const venue =
    venueName || venueAddress
      ? { name: venueName, address: venueAddress }
      : null

  return {
    id: event.id,
    href: eventDetailsPath(event.id),
    title: event.title,
    category: event.category,
    imageUrl: event.imageUrl,
    startAt: event.startAt,
    dateLabel: formatStartAt(event.startAt),
    venue,
    salesLabel: uiText(salesLabels[event.salesStatus]),
  }
}

function toResults(page: DiscoveryPageResponse) {
  const pageNumber = page.page + 1
  return {
    cards: page.items.map(toCard),
    countLabel: t(
      page.totalItems === 1 ? "{0} event" : "{0} events",
      page.totalItems
    ),
    totalPages: page.totalPages,
    pagination: {
      visible: page.totalPages > 1,
      label: t("Page {0} of {1}", pageNumber, page.totalPages),
      canGoBack: page.page > 0,
      canGoForward: pageNumber < page.totalPages,
    },
  }
}

function discoveryHref(
  search: string,
  filters: typeof defaultFilters,
  page: number
) {
  const params = new URLSearchParams(search)
  const values = {
    page: page === 0 ? "" : String(page + 1),
    query: filters.query,
    category: filters.category,
    availableOnly: filters.availableOnly ? "true" : "",
    sort: filters.sort === defaultFilters.sort ? "" : filters.sort,
  }
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value)
    else params.delete(key)
  }
  return params.size ? `${discoveryPath}?${params}` : discoveryPath
}

function useEventDiscoveryViewModel() {
  const [, navigate] = useLocation()
  const search = useSearch()
  const current = new URLSearchParams(search)
  const rawPage = current.get("page")
  const pageNumber =
    rawPage && /^[1-9][0-9]*$/.test(rawPage) ? Number(rawPage) : 1
  const validPage = Number.isInteger(pageNumber) && pageNumber <= 2_147_483_648
  const page = validPage ? pageNumber - 1 : 0
  const filters: typeof defaultFilters = {
    query: current.get("query")?.trim() ?? "",
    category: current.get("category")?.trim() ?? "",
    availableOnly: current.get("availableOnly") === "true",
    sort:
      current.get("sort") === "startAt,desc" ? "startAt,desc" : "startAt,asc",
  }
  const filterKey = JSON.stringify(filters)
  const [editing, setEditing] = useState({ filterKey, draft: filters })
  if (editing.filterKey !== filterKey) setEditing({ filterKey, draft: filters })
  const draft = editing.filterKey === filterKey ? editing.draft : filters

  const events = useQuery({
    ...publicEventRepository.discoveryQuery({
      ...filters,
      page,
      size: pageSize,
    }),
    select: (result) => toResults(result),
    placeholderData: keepPreviousData,
  })

  const lastPage =
    events.data && !events.isPlaceholderData && !events.isError
      ? Math.max(0, events.data.totalPages - 1)
      : undefined
  const correctedPage = lastPage === undefined ? page : Math.min(page, lastPage)
  const shouldReplace =
    correctedPage !== page || (rawPage !== null && rawPage !== String(page + 1))
  const correctedHref = shouldReplace
    ? discoveryHref(search, filters, correctedPage)
    : null
  useEffect(() => {
    if (correctedHref) navigate(correctedHref, { replace: true })
  }, [correctedHref, navigate])

  function setFilter<K extends keyof typeof defaultFilters>(
    field: K,
    value: (typeof defaultFilters)[K]
  ) {
    setEditing({ filterKey, draft: { ...draft, [field]: value } })
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const applied = {
      ...draft,
      query: draft.query.trim(),
      category: draft.category.trim(),
    }
    setEditing({ filterKey, draft: applied })
    const href = discoveryHref(search, applied, 0)
    if (href !== (search ? `${discoveryPath}?${search}` : discoveryPath))
      navigate(href)
  }

  function clearFilters() {
    setEditing({ filterKey, draft: defaultFilters })
    const href = discoveryHref(search, defaultFilters, 0)
    if (href !== (search ? `${discoveryPath}?${search}` : discoveryPath))
      navigate(href)
  }

  const results = events.data
  const canGoBack = !events.isPlaceholderData && !!results?.pagination.canGoBack
  const canGoForward =
    !events.isPlaceholderData && !!results?.pagination.canGoForward

  return {
    draft,
    changeQuery: (event: ChangeEvent<HTMLInputElement>) =>
      setFilter("query", event.currentTarget.value),
    changeCategory: (event: ChangeEvent<HTMLInputElement>) =>
      setFilter("category", event.currentTarget.value),
    changeAvailability: (checked: boolean | "indeterminate") =>
      setFilter("availableOnly", checked === true),
    changeSort: (event: ChangeEvent<HTMLSelectElement>) =>
      setFilter(
        "sort",
        event.currentTarget.value === "startAt,desc"
          ? "startAt,desc"
          : "startAt,asc"
      ),
    submitFilters,
    clearFilters,
    retry: () => void events.refetch(),
    busy: events.isFetching,
    showLoading: events.isPending || shouldReplace,
    showError: events.isError && !results,
    showEmpty:
      !!results &&
      results.cards.length === 0 &&
      !events.isPlaceholderData &&
      !shouldReplace,
    cards: shouldReplace ? [] : (results?.cards ?? []),
    resultLabel: events.isPlaceholderData
      ? t("Updating results…")
      : results?.countLabel,
    pagination: shouldReplace ? undefined : results?.pagination,
    previousHref: canGoBack ? discoveryHref(search, filters, page - 1) : null,
    nextHref: canGoForward ? discoveryHref(search, filters, page + 1) : null,
  }
}

function EventCard({
  card,
  returnHref,
}: {
  card: ReturnType<typeof toCard>
  returnHref: string
}) {
  return (
    <Link
      href={card.href}
      state={{ eventReturn: returnHref }}
      className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Card className="h-full gap-0 overflow-hidden py-0 transition-colors group-hover:bg-muted/50">
        {card.imageUrl && (
          <div className="bg-muted">
            <AspectRatio ratio={16 / 9}>
              <img
                src={card.imageUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            </AspectRatio>
          </div>
        )}

        <CardHeader className="gap-1 px-4 pt-4 pb-2">
          <p className="text-sm text-muted-foreground">{card.category}</p>
          <CardTitle>
            <h3 className="text-lg font-semibold wrap-anywhere group-hover:underline">
              {card.title}
            </h3>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-1 px-4 pb-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LucideClock aria-hidden="true" className="size-4 shrink-0" />
            <time dateTime={card.startAt}>{card.dateLabel}</time>
          </p>

          {card.venue && (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <LucideMapPin
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <div>
                {card.venue.name && <p>{card.venue.name}</p>}
                {card.venue.address && <p>{card.venue.address}</p>}
              </div>
            </div>
          )}

          {card.salesLabel && (
            <Badge variant="secondary" className="mt-2">
              {card.salesLabel}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export function EventDiscoveryPage() {
  const viewModel = useEventDiscoveryViewModel()

  const search = useSearch()
  const returnHref = search ? `/events?${search}` : "/events"

  return (
    <SitePage>
      <BackLink href="/">{t("Home")}</BackLink>
      <PageHeading>{t("Discover events")}</PageHeading>

      <Card>
        <CardContent>
          <form onSubmit={viewModel.submitFilters} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
              <Field>
                <FieldLabel htmlFor="discovery-query">
                  {t("Search events")}
                </FieldLabel>
                <Input
                  id="discovery-query"
                  type="search"
                  value={viewModel.draft.query}
                  placeholder={t("Search by title or description")}
                  onChange={viewModel.changeQuery}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="discovery-category">
                  {t("Category")}
                </FieldLabel>
                <Input
                  id="discovery-category"
                  value={viewModel.draft.category}
                  placeholder={t("Any category")}
                  onChange={viewModel.changeCategory}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="discovery-sort">
                  {t("Sort by date")}
                </FieldLabel>
                <NativeSelect
                  id="discovery-sort"
                  className="w-full"
                  value={viewModel.draft.sort}
                  onChange={viewModel.changeSort}
                >
                  <NativeSelectOption value="startAt,asc">
                    {t("Earliest first")}
                  </NativeSelectOption>
                  <NativeSelectOption value="startAt,desc">
                    {t("Latest first")}
                  </NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Field orientation="horizontal" className="mr-auto w-auto">
                <Checkbox
                  id="discovery-available"
                  checked={viewModel.draft.availableOnly}
                  onCheckedChange={viewModel.changeAvailability}
                />
                <FieldLabel htmlFor="discovery-available">
                  {t("Tickets available now")}
                </FieldLabel>
              </Field>
              <Button
                type="button"
                variant="ghost"
                onClick={viewModel.clearFilters}
              >
                {t("Clear filters")}
              </Button>
              <Button type="submit">{t("Search")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section aria-label={t("Discovery results")} aria-busy={viewModel.busy}>
        {viewModel.showLoading && (
          <div role="status" className="flex items-center gap-2 text-sm">
            <Spinner />
            {t("Loading events…")}
          </div>
        )}

        {viewModel.showError && (
          <div role="alert" className="space-y-2">
            <p>{t("Couldn’t load events.")}</p>
            <Button variant="outline" onClick={viewModel.retry}>
              {t("Try again")}
            </Button>
          </div>
        )}

        {viewModel.resultLabel && (
          <p className="mb-3 text-sm text-muted-foreground" role="status">
            {viewModel.resultLabel}
          </p>
        )}

        {viewModel.showEmpty && (
          <Card>
            <CardContent className="space-y-3">
              <p>{t("No events match your filters.")}</p>
              <Button variant="outline" onClick={viewModel.clearFilters}>
                {t("Clear filters")}
              </Button>
            </CardContent>
          </Card>
        )}

        <ul
          aria-label={t("Public events")}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {viewModel.cards.map((card) => (
            <li key={card.id}>
              <EventCard card={card} returnHref={returnHref} />
            </li>
          ))}
        </ul>

        {viewModel.pagination?.visible && (
          <nav
            aria-label={t("Event results pages")}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            {viewModel.previousHref ? (
              <Link
                href={viewModel.previousHref}
                className={buttonVariants({ variant: "outline" })}
              >
                {t("Previous")}
              </Link>
            ) : (
              <Button variant="outline" disabled>
                {t("Previous")}
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {viewModel.pagination.label}
            </span>
            {viewModel.nextHref ? (
              <Link
                href={viewModel.nextHref}
                className={buttonVariants({ variant: "outline" })}
              >
                {t("Next")}
              </Link>
            ) : (
              <Button variant="outline" disabled>
                {t("Next")}
              </Button>
            )}
          </nav>
        )}
      </section>
    </SitePage>
  )
}

const organizerStatusLabels: Record<PublicEvent["status"], string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  UNPUBLISHED: "Unpublished",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
}

type OverviewEvent = {
  id: string
  title: string
  startAt: string
  dateLabel: string
  venueName: string | null
  statusLabel?: string
  href: string
  ticketHref?: string
}

function toOverviewEvent(event: PublicEvent): OverviewEvent {
  return {
    id: event.id,
    title: event.title,
    startAt: event.startAt,
    dateLabel: formatStartAt(event.startAt),
    venueName: event.venue?.name ?? null,
    href: eventDetailsPath(event.id),
  }
}

function isCurrentEvent(event: PublicEvent, now: number) {
  return event.status !== "CANCELLED" && Date.parse(event.endAt) >= now
}

function byStartDate(first: PublicEvent, second: PublicEvent) {
  return Date.parse(first.startAt) - Date.parse(second.startAt)
}

function toOrganizerOverview(events: PublicEvent[]) {
  const now = Date.now()
  return {
    hasEvents: events.length > 0,
    items: events
      .filter((event) => event.status === "DRAFT" || isCurrentEvent(event, now))
      .sort(
        (first, second) =>
          Number(first.status === "DRAFT") -
            Number(second.status === "DRAFT") || byStartDate(first, second)
      )
      .slice(0, overviewSize)
      .map((event) => ({
        ...toOverviewEvent(event),
        statusLabel: t(organizerStatusLabels[event.status]),
        href: manageEventPath(event.id),
      })),
  }
}

function toAttendeeOverview(
  items: { event: PublicEvent; ticketIds: string[] }[]
) {
  const now = Date.now()
  return items
    .filter(
      ({ event }) => event.status === "PUBLISHED" && isCurrentEvent(event, now)
    )
    .sort((first, second) => byStartDate(first.event, second.event))
    .slice(0, attendeePreviewSize)
    .map(({ event, ticketIds }) => ({
      ...toOverviewEvent(event),
      ticketHref:
        ticketIds.length === 1 ? ticketDetailsPath(ticketIds[0]) : undefined,
    }))
}

function useHomeViewModel() {
  const session = useSessionViewModel()
  const account = session.status === "signedIn" ? session.account : null
  const sessionId = session.status === "signedIn" ? session.sessionId : null
  const organized = useQuery({
    ...managedEventRepository.mineQuery(sessionId),
    select: toOrganizerOverview,
  })
  const attending = useQuery({
    ...attendanceRepository.upcomingEventsQuery(
      sessionId,
      account?.activated ? account.email : null
    ),
    select: toAttendeeOverview,
  })
  const discovery = useQuery({
    ...publicEventRepository.discoveryQuery({ page: 0, size: previewSize }),
    select: toResults,
  })
  const [, navigate] = useLocation()
  const [search, setSearch] = useState("")
  return {
    account,
    restoring: session.status === "restoring",
    organized,
    attending,
    discovery,
    search,
    setSearch,
    browse(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      navigate(
        discoveryHref("", { ...defaultFilters, query: search.trim() }, 0)
      )
    },
  }
}

function OverviewList({
  items,
  organizer = false,
}: {
  items: OverviewEvent[]
  organizer?: boolean
}) {
  return (
    <ul className="divide-y border-y">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 py-3"
        >
          <div className="min-w-0 space-y-1">
            <Link
              href={item.href}
              state={organizer ? undefined : { eventReturn: "/" }}
              className="rounded-sm font-semibold wrap-anywhere hover:underline"
            >
              {item.title}
            </Link>
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <time dateTime={item.startAt}>{item.dateLabel}</time>
              {item.venueName && (
                <span className="wrap-anywhere">{item.venueName}</span>
              )}
            </p>
            {item.statusLabel && (
              <Badge variant="secondary">{item.statusLabel}</Badge>
            )}
          </div>
          {item.ticketHref && (
            <Link
              href={item.ticketHref}
              className={buttonVariants({
                variant: index === 0 ? "default" : "outline",
                className: "min-h-10",
              })}
            >
              <Ticket aria-hidden="true" /> {t("Open ticket")}
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}

function HomeFailure({
  children,
  retry,
}: {
  children: string
  retry: () => void
}) {
  return (
    <Alert role="alert" variant="destructive">
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        <p>{children}</p>
        <Button variant="outline" onClick={retry}>
          {t("Try again")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function HomeSearch({
  model,
}: {
  model: Pick<
    ReturnType<typeof useHomeViewModel>,
    "browse" | "search" | "setSearch"
  >
}) {
  return (
    <form
      onSubmit={model.browse}
      role="search"
      className="flex min-w-0 flex-wrap items-end gap-2"
    >
      <Field className="min-w-0 flex-1 basis-40">
        <FieldLabel htmlFor="home-search">{t("Search events")}</FieldLabel>
        <Input
          id="home-search"
          className="h-11 bg-background"
          type="search"
          value={model.search}
          onChange={(event) => model.setSearch(event.target.value)}
          placeholder={t("Search by title or description")}
        />
      </Field>
      <Button type="submit" className="h-11">
        <Search aria-hidden="true" /> {t("Search")}
      </Button>
    </form>
  )
}

export function HomePage() {
  const model = useHomeViewModel()
  const { account, organized, attending, discovery } = model
  const nextEvents = attending.data ?? []
  const cards = discovery.data?.cards ?? []
  const firstName = account?.firstName?.trim() || account?.login

  return (
    <SitePage className="space-y-8">
      {firstName ? (
        <PageHeading>{t("Welcome back, {0}", firstName)}</PageHeading>
      ) : (
        <section className="grid items-end gap-6 rounded-2xl border bg-primary/10 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <PageHeading
            description={t(
              "Find upcoming events, get tickets, or start organizing your own."
            )}
          >
            {t("Find your next event")}
          </PageHeading>
          <HomeSearch model={model} />
        </section>
      )}

      {model.restoring && (
        <Skeleton
          className="h-28"
          role="status"
          aria-label={t("Loading your events…")}
        />
      )}
      {account && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>
                <h2 className="text-xl font-semibold tracking-tight">
                  {t("Upcoming events")}
                </h2>
              </CardTitle>
              <Link
                href="/my-tickets"
                className={buttonVariants({
                  className: "min-h-10",
                  variant: nextEvents.length ? "outline" : "ghost",
                })}
              >
                <Ticket aria-hidden="true" /> {t("My tickets")}
              </Link>
            </CardHeader>
            <CardContent>
              {attending.isPending ? (
                <Skeleton
                  className="h-16"
                  role="status"
                  aria-label={t("Loading your events…")}
                />
              ) : attending.isError ? (
                <HomeFailure retry={() => void attending.refetch()}>
                  {t("Couldn’t load your tickets and events.")}
                </HomeFailure>
              ) : nextEvents.length ? (
                <OverviewList items={nextEvents} />
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    {t("You don’t have any upcoming events.")}
                  </p>
                  <Link
                    href="/events"
                    className={buttonVariants({
                      variant: "link",
                      className: "px-0",
                    })}
                  >
                    {t("Browse events")} <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>
                <h2 className="text-xl font-semibold tracking-tight">
                  {t("Events you organize")}
                </h2>
              </CardTitle>
              {organized.data?.hasEvents && (
                <Link
                  href={organizerDashboardPath}
                  className={buttonVariants({
                    variant: "outline",
                    className: "min-h-10",
                  })}
                >
                  {t("Organizer dashboard")}
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {organized.isPending ? (
                <Skeleton
                  className="h-16"
                  role="status"
                  aria-label={t("Loading your events…")}
                />
              ) : organized.isError ? (
                <HomeFailure retry={() => void organized.refetch()}>
                  {t("Couldn’t load your events.")}
                </HomeFailure>
              ) : organized.data?.hasEvents ? (
                organized.data.items.length ? (
                  <OverviewList items={organized.data.items} organizer />
                ) : (
                  <p className="text-muted-foreground">
                    {t("No current or draft events.")}
                  </p>
                )
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    {t(
                      "Start a draft whenever you’re ready to plan your first event."
                    )}
                  </p>
                  <Link
                    href="/organizer/start"
                    className={buttonVariants({
                      variant: "link",
                      className: "px-0",
                    })}
                  >
                    <CalendarPlus aria-hidden="true" />{" "}
                    {t("Become an organizer")}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <section aria-labelledby="home-public-events" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="home-public-events"
            className="text-xl font-semibold tracking-tight"
          >
            {t("Public events")}
          </h2>
          <Link
            href={discoveryPath}
            className={buttonVariants({
              variant: "outline",
              className: "min-h-10",
            })}
          >
            {t("View all events")} <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        {account && (
          <div className="max-w-lg">
            <HomeSearch model={model} />
          </div>
        )}

        {discovery.isPending ? (
          <Skeleton
            className="h-36"
            role="status"
            aria-label={t("Loading public events…")}
          />
        ) : discovery.isError ? (
          <HomeFailure retry={() => void discovery.refetch()}>
            {t("Couldn’t load public events.")}
          </HomeFailure>
        ) : !cards.length ? (
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                {t("No public events to show right now.")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <li key={card.id}>
                <EventCard card={card} returnHref="/" />
              </li>
            ))}
          </ul>
        )}
      </section>

      {!account && !model.restoring && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("Planning an event?")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("Create a draft and set up ticket sales when you’re ready.")}
            </p>
          </div>
          <Link
            href="/organizer/start"
            className={buttonVariants({
              variant: "outline",
              className: "min-h-10",
            })}
          >
            <CalendarPlus aria-hidden="true" /> {t("Become an organizer")}
          </Link>
        </section>
      )}
    </SitePage>
  )
}
