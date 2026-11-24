import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "wouter"

import { ApiError } from "@/api/client"
import type { OrganizerEventSales } from "@/api/organizerAnalytics"
import { managedEventRepository } from "@/events/managedEventRepository"
import { numberFormat, t } from "@/i18n/locale"
import {
  eventStatusLabels,
  presentOrganizerEvent,
  type OrganizerEvent,
  type OrganizerEventStatus,
} from "./organizerEventPresentation"
import { useOrganizerClock } from "./useOrganizerClock"

const statusOrder: readonly OrganizerEventStatus[] = [
  "active",
  "upcoming",
  "draft",
  "unpublished",
  "published",
  "completed",
  "cancelled",
  "suspended",
]

const pricingOptions = [
  { value: "all", label: "All ticket prices" },
  { value: "has-paid", label: "Has paid tickets" },
  { value: "PAID", label: "Paid tickets only" },
  { value: "FREE", label: "Free tickets only" },
  { value: "UNCONFIGURED", label: "No ticket types" },
] as const

const sortOptions = [
  { value: "schedule", label: "Schedule priority" },
  { value: "tickets", label: "Most tickets sold" },
  { value: "grossKzt", label: "Highest gross sales" },
  { value: "netKzt", label: "Highest net revenue" },
  { value: "soonest", label: "Earliest start date" },
  { value: "latest", label: "Latest start date" },
  { value: "title", label: "Event name" },
] as const

const salesLabels = {
  tickets: "Tickets sold",
  grossKzt: "Gross sales",
  netKzt: "Net revenue",
} as const
const pricingLabels = {
  PAID: "Paid only",
  FREE: "Free only",
  MIXED: "Paid and free",
  UNCONFIGURED: "No ticket types",
} as const
const integer = numberFormat({ maximumFractionDigits: 0 })
const money = numberFormat({
  style: "currency",
  currency: "KZT",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

type EventSalesSource = {
  eventSales: OrganizerEventSales[] | undefined
  loading: boolean
  error: string | null
  retry: () => void
}

function compareStart(a: OrganizerEvent, b: OrganizerEvent, reverse: boolean) {
  const aStart = Number.isFinite(a.startsAt)
    ? a.startsAt
    : reverse
      ? -Infinity
      : Infinity
  const bStart = Number.isFinite(b.startsAt)
    ? b.startsAt
    : reverse
      ? -Infinity
      : Infinity
  return reverse ? bStart - aStart : aStart - bStart
}

function compareSchedule(a: OrganizerEvent, b: OrganizerEvent) {
  return (
    statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) ||
    compareStart(a, b, a.status !== "upcoming") ||
    a.title.localeCompare(b.title)
  )
}

function isSalesSort(value: string): value is keyof typeof salesLabels {
  return value === "tickets" || value === "grossKzt" || value === "netKzt"
}

function optionValues<T extends string>(
  options: readonly { value: T; label: string }[]
) {
  return options.map(({ value, label }) => ({ value, label: t(label) }))
}

export function useOrganizerEventsViewModel(
  sessionId: number,
  overview: EventSalesSource
) {
  const query = useQuery(managedEventRepository.mineQuery(sessionId))
  const now = useOrganizerClock()
  const [params, setParams] = useSearchParams()
  const filter =
    statusOrder.find((status) => status === params.get("status")) ?? "all"
  const pricing =
    pricingOptions.find(({ value }) => value === params.get("pricing"))
      ?.value ?? "all"
  const sort =
    sortOptions.find(({ value }) => value === params.get("sort"))?.value ??
    "schedule"
  const search = params.get("q") ?? ""
  const needle = search.trim().toLocaleLowerCase()
  const salesSort = isSalesSort(sort)
  const needsSales = salesSort || pricing !== "all"
  const metric = salesSort ? sort : "tickets"
  const waitingForSales = needsSales && !overview.eventSales
  const byEvent = new Map(
    overview.eventSales?.map((entry) => [entry.eventId, entry])
  )
  const events = (query.data ?? []).map((event) =>
    presentOrganizerEvent(event, now)
  )
  const statuses = new Set(events.map((event) => event.status))

  const visible = (waitingForSales ? [] : events)
    .filter((event) => {
      if (filter !== "all" && event.status !== filter) return false
      if (
        needle &&
        ![event.title, event.venue].some((value) =>
          value.toLocaleLowerCase().includes(needle)
        )
      )
        return false
      if (pricing === "all") return true
      const kind = byEvent.get(event.id)?.pricing
      return pricing === "has-paid"
        ? kind === "PAID" || kind === "MIXED"
        : kind === pricing
    })
    .sort((a, b) => {
      if (salesSort) {
        const aValue = byEvent.get(a.id)?.sales[metric] ?? -Infinity
        const bValue = byEvent.get(b.id)?.sales[metric] ?? -Infinity
        return bValue - aValue || compareSchedule(a, b)
      }
      if (sort === "title")
        return a.title.localeCompare(b.title) || compareSchedule(a, b)
      if (sort === "soonest" || sort === "latest")
        return compareStart(a, b, sort === "latest") || compareSchedule(a, b)
      return compareSchedule(a, b)
    })
    .map((event) => {
      const stats = byEvent.get(event.id)
      return {
        ...event,
        pricingLabel: stats ? t(pricingLabels[stats.pricing]) : null,
        salesValue: stats
          ? (metric === "tickets" ? integer : money).format(stats.sales[metric])
          : null,
      }
    })

  function setFilterParam(
    key: "q" | "status" | "pricing" | "sort",
    value: string
  ) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true }
    )
  }

  return {
    events,
    loading: query.isPending,
    error: query.isError
      ? query.error instanceof ApiError
        ? t(query.error.message)
        : t("Couldn’t load your events.")
      : null,
    retry: () => void query.refetch(),
    filter,
    setFilter: (value: string) =>
      setFilterParam("status", value === "all" ? "" : value),
    pricing,
    setPricing: (value: string) =>
      setFilterParam("pricing", value === "all" ? "" : value),
    sort,
    setSort: (value: string) =>
      setFilterParam("sort", value === "schedule" ? "" : value),
    search,
    returnFilters: params.toString(),
    setSearch: (value: string) => setFilterParam("q", value),
    clearFilters: () =>
      setParams(sort === "schedule" ? {} : { sort }, { replace: true }),
    visible,
    salesLabel: t(salesLabels[metric]),
    salesLoading: waitingForSales && overview.loading,
    salesUnavailable: waitingForSales && !overview.loading,
    retrySales: overview.error ? overview.retry : undefined,
    incompleteSales:
      needsSales &&
      Boolean(overview.eventSales) &&
      events.some((event) => !byEvent.has(event.id)),
    filters: [
      { value: "all", label: t("All statuses") },
      ...statusOrder
        .filter((status) => statuses.has(status) || status === filter)
        .map((value) => ({ value, label: t(eventStatusLabels[value]) })),
    ],
    pricingOptions: optionValues(pricingOptions),
    sortOptions: optionValues(sortOptions),
  }
}

