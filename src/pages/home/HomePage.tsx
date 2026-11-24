import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { LucideClock, LucideMapPin } from "lucide-react"
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
import { organizerCampaignsPath } from "@/promotions/campaignLinks"
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

const shortDateTime = new Intl.DateTimeFormat("ru", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

const dateTimeWithYear = new Intl.DateTimeFormat("ru", {
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
    salesLabel: salesLabels[event.salesStatus],
  }
}

function toResults(page: DiscoveryPageResponse) {
  const pageNumber = page.page + 1
  return {
    cards: page.items.map(toCard),
    countLabel: `${page.totalItems} ${page.totalItems === 1 ? "event" : "events"}`,
    totalPages: page.totalPages,
    pagination: {
      visible: page.totalPages > 1,
      label: `Page ${pageNumber} of ${page.totalPages}`,
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
    select: toResults,
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
      ? "Updating results…"
      : results?.countLabel,
    pagination: shouldReplace ? undefined : results?.pagination,
    previousHref: canGoBack ? discoveryHref(search, filters, page - 1) : null,
    nextHref: canGoForward ? discoveryHref(search, filters, page + 1) : null,
  }
}

function EventCard({ card }: { card: ReturnType<typeof toCard> }) {
  return (
    <Link
      href={card.href}
      className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Card className="h-full gap-0 overflow-hidden py-0 transition-colors group-hover:bg-muted/50">
        <div className="bg-muted">
          <AspectRatio ratio={16 / 9}>
            {card.imageUrl && (
              <img
                src={card.imageUrl}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            )}
          </AspectRatio>
        </div>

        <CardHeader className="gap-1 px-4 pt-4 pb-2">
          <p className="text-sm text-muted-foreground">{card.category}</p>
          <CardTitle>
            <h2>{card.title}</h2>
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
            <p className="pt-1 text-sm font-medium">{card.salesLabel}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export function EventDiscoveryPage() {
  const viewModel = useEventDiscoveryViewModel()

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Discover events</h1>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Home
        </Link>
      </header>

      <Card>
        <CardContent>
          <form onSubmit={viewModel.submitFilters} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
              <Field>
                <FieldLabel htmlFor="discovery-query">Search events</FieldLabel>
                <Input
                  id="discovery-query"
                  type="search"
                  value={viewModel.draft.query}
                  placeholder="Search by title or description"
                  onChange={viewModel.changeQuery}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="discovery-category">Category</FieldLabel>
                <Input
                  id="discovery-category"
                  value={viewModel.draft.category}
                  placeholder="Any category"
                  onChange={viewModel.changeCategory}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="discovery-sort">Sort by date</FieldLabel>
                <NativeSelect
                  id="discovery-sort"
                  className="w-full"
                  value={viewModel.draft.sort}
                  onChange={viewModel.changeSort}
                >
                  <NativeSelectOption value="startAt,asc">
                    Earliest first
                  </NativeSelectOption>
                  <NativeSelectOption value="startAt,desc">
                    Latest first
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
                  Tickets available now
                </FieldLabel>
              </Field>
              <Button
                type="button"
                variant="ghost"
                onClick={viewModel.clearFilters}
              >
                Clear filters
              </Button>
              <Button type="submit">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section aria-label="Discovery results" aria-busy={viewModel.busy}>
        {viewModel.showLoading && (
          <div role="status" className="flex items-center gap-2 text-sm">
            <Spinner />
            Loading events…
          </div>
        )}

        {viewModel.showError && (
          <div role="alert" className="space-y-2">
            <p>Couldn’t load events.</p>
            <Button variant="outline" onClick={viewModel.retry}>
              Try again
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
              <p>No events match your filters.</p>
              <Button variant="outline" onClick={viewModel.clearFilters}>
                Clear filters
              </Button>
            </CardContent>
          </Card>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {viewModel.cards.map((card) => (
            <li key={card.id}>
              <EventCard card={card} />
            </li>
          ))}
        </ul>

        {viewModel.pagination?.visible && (
          <nav
            aria-label="Event results pages"
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            {viewModel.previousHref ? (
              <Link
                href={viewModel.previousHref}
                className={buttonVariants({ variant: "outline" })}
              >
                Previous
              </Link>
            ) : (
              <Button variant="outline" disabled>
                Previous
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
                Next
              </Link>
            ) : (
              <Button variant="outline" disabled>
                Next
              </Button>
            )}
          </nav>
        )}
      </section>
    </main>
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
  href?: string
}

function toOverviewEvent(event: PublicEvent): OverviewEvent {
  return {
    id: event.id,
    title: event.title,
    startAt: event.startAt,
    dateLabel: formatStartAt(event.startAt),
    venueName: event.venue?.name ?? null,
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
      .sort(byStartDate)
      .slice(0, overviewSize)
      .map((event) => ({
        ...toOverviewEvent(event),
        statusLabel: organizerStatusLabels[event.status],
        href: organizerCampaignsPath(event.id),
      })),
  }
}

function toAttendeeOverview(events: PublicEvent[]) {
  const now = Date.now()
  return events
    .filter(
      (event) => event.status === "PUBLISHED" && isCurrentEvent(event, now)
    )
    .sort(byStartDate)
    .slice(0, attendeePreviewSize)
    .map((event) => ({
      ...toOverviewEvent(event),
      href: eventDetailsPath(event.id),
    }))
}

function useHomeViewModel() {
  const session = useSessionViewModel()
  const sessionId = session.status === "signedIn" ? session.sessionId : null

  const organized = useQuery({
    ...managedEventRepository.mineQuery(sessionId),
    select: toOrganizerOverview,
  })
  const attending = useQuery({
    ...attendanceRepository.eventsQuery(
      sessionId,
      session.status === "signedIn" && session.account.activated
        ? session.account.email
        : null
    ),
    select: toAttendeeOverview,
  })
  const discovery = useQuery({
    ...publicEventRepository.discoveryQuery({ page: 0, size: previewSize }),
    select: toResults,
  })

  const isSignedIn = sessionId !== null
  const organizerItems = organized.data?.items ?? []
  const attendeeItems = attending.data ?? []
  const previewCards = discovery.data?.cards ?? []

  return {
    canAccessAdmin: session.canAccessAdmin,
    accountLink:
      session.status === "restoring"
        ? null
        : isSignedIn
          ? { href: "/account/settings", label: "Account" }
          : { href: "/sign-in", label: "Sign in" },
    showOrganizerOverview: isSignedIn && !!organized.data?.hasEvents,
    organizerItems,
    showOrganizerEmpty: organizerItems.length === 0,
    showAttendeeOverview: isSignedIn,
    showAttendeeEmpty: attending.isSuccess && attendeeItems.length === 0,
    attendeeItems,
    showOverviewLoading:
      isSignedIn && (organized.isPending || attending.isPending),
    showOverviewError:
      isSignedIn &&
      ((organized.isError && !organized.data) ||
        (attending.isError && !attending.data)),
    retryOverview: () => {
      if (organized.isError) void organized.refetch()
      if (attending.isError) void attending.refetch()
    },
    previewCards,
    showPreviewLoading: discovery.isPending,
    showPreviewError: discovery.isError && !discovery.data,
    showPreviewEmpty: !!discovery.data && previewCards.length === 0,
    retryPreview: () => void discovery.refetch(),
  }
}

function OverviewList({ items }: { items: OverviewEvent[] }) {
  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
          <p className="text-sm font-medium">
            {item.href ? (
              <Link href={item.href} className="hover:underline">
                {item.title}
              </Link>
            ) : (
              item.title
            )}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <LucideClock aria-hidden="true" className="size-4 shrink-0" />
            <time dateTime={item.startAt}>{item.dateLabel}</time>
          </p>
          {item.venueName && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <LucideMapPin aria-hidden="true" className="size-4 shrink-0" />
              {item.venueName}
            </p>
          )}
          {item.statusLabel && (
            <p className="text-sm text-muted-foreground">{item.statusLabel}</p>
          )}
        </li>
      ))}
    </ul>
  )
}

export function HomePage() {
  const viewModel = useHomeViewModel()

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="mr-auto text-2xl font-bold">BiletFlow</h1>
        {viewModel.canAccessAdmin && (
          <Link
            href="/admin"
            className={buttonVariants({ variant: "outline" })}
          >
            Administration
          </Link>
        )}
        <Link href="/support" className={buttonVariants({ variant: "outline" })}>Support</Link>
        {viewModel.accountLink && (
          <Link
            href={viewModel.accountLink.href}
            className={buttonVariants({ variant: "outline" })}
          >
            {viewModel.accountLink.label}
          </Link>
        )}
      </header>

      <div className="grid gap-4 empty:hidden lg:grid-cols-2">
        {viewModel.showOrganizerOverview && (
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>
                <h2>Events you organize</h2>
              </CardTitle>
              <Link
                href={organizerDashboardPath}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Organizer dashboard
              </Link>
            </CardHeader>
            <CardContent>
              {viewModel.showOrganizerEmpty ? (
                <p className="text-sm text-muted-foreground">
                  No current or draft events.
                </p>
              ) : (
                <OverviewList items={viewModel.organizerItems} />
              )}
            </CardContent>
          </Card>
        )}

        {viewModel.showAttendeeOverview && (
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>
                <h2>Events you’re attending</h2>
              </CardTitle>
              <Link
                href="/my-tickets"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                My tickets
              </Link>
            </CardHeader>
            <CardContent>
              {viewModel.showAttendeeEmpty ? (
                <p className="text-sm text-muted-foreground">
                  No upcoming events.
                </p>
              ) : (
                <OverviewList items={viewModel.attendeeItems} />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {viewModel.showOverviewLoading && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Spinner />
          Loading your events…
        </p>
      )}

      {viewModel.showOverviewError && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
          Some of your events couldn’t be loaded.
          <Button variant="outline" size="sm" onClick={viewModel.retryOverview}>
            Try again
          </Button>
        </div>
      )}

      <section aria-labelledby="home-public-events">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="home-public-events" className="text-lg font-semibold">
            Public events
          </h2>
          <Link
            href={discoveryPath}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            View all
          </Link>
        </div>

        {viewModel.showPreviewLoading && (
          <p role="status" className="flex items-center gap-2 text-sm">
            <Spinner />
            Loading public events…
          </p>
        )}
        {viewModel.showPreviewError && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            Couldn’t load public events.
            <Button
              variant="outline"
              size="sm"
              onClick={viewModel.retryPreview}
            >
              Try again
            </Button>
          </div>
        )}
        {viewModel.showPreviewEmpty && (
          <p className="text-sm text-muted-foreground">
            No public events to show right now.
          </p>
        )}

        <ul className="flex snap-x gap-4 overflow-x-auto p-1">
          {viewModel.previewCards.map((card) => (
            <li key={card.id} className="w-60 shrink-0 snap-start sm:w-72">
              <EventCard card={card} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}



