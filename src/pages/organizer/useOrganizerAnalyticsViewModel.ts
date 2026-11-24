import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { ApiError } from "@/api/client"
import type {
  OrganizerAnalytics,
  OrganizerAnalyticsFilters,
  OrganizerAnalyticsOverview,
  OrganizerSales,
} from "@/api/organizerAnalytics"
import { managedEventRepository } from "@/events/managedEventRepository"
import { organizerAnalyticsRepository } from "@/events/organizerAnalyticsRepository"
import { dateFormat, numberFormat, t } from "@/i18n/locale"

const integer = numberFormat({ maximumFractionDigits: 0 })
const money = numberFormat({
  style: "currency",
  currency: "KZT",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
const percent = numberFormat({ style: "percent", maximumFractionDigits: 1 })
const chartDate = dateFormat({
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})
const periodDate = dateFormat({ dateStyle: "medium", timeZone: "UTC" })
const dayInMilliseconds = 86_400_000

export function useOrganizerAnalyticsOverviewViewModel(sessionId: number) {
  const query = useQuery(organizerAnalyticsRepository.overviewQuery(sessionId))
  const data = query.data
  return {
    loading: query.isPending,
    error: query.isError ? t("Could not load analytics.") : null,
    retry: () => void query.refetch(),
    summary: data && {
      inventory: presentInventory(data.inventory),
      sales: presentSales(data.sales),
      attendance: presentAttendance(data.attendance),
      campaignTotals: {
        redemptions: integer.format(data.campaigns.redemptions),
        ...presentSales(data.campaigns.sales),
      },
    },
  }
}

type Draft = { from: string; through: string; ticketTypeId: string }
const allTime: Draft = { from: "", through: "", ticketTypeId: "" }

export function useOrganizerAnalyticsViewModel(
  sessionId: number,
  eventId: string
) {
  const [draft, setDraft] = useState(allTime)
  const [filters, setFilters] = useState<OrganizerAnalyticsFilters>({})
  const [metric, setMetric] = useState<"tickets" | "grossKzt">("tickets")
  const types = useQuery(
    managedEventRepository.ticketTypesQuery(sessionId, eventId, true)
  )
  const query = useQuery(
    organizerAnalyticsRepository.reportQuery(sessionId, eventId, filters)
  )
  const invalidDates = Boolean(
    draft.from && draft.through && draft.from > draft.through
  )

  return {
    draft,
    update: (values: Partial<Draft>) =>
      setDraft((previous) => ({ ...previous, ...values })),
    submit() {
      if (invalidDates) return
      setFilters({
        from: draft.from || undefined,
        through: draft.through || undefined,
        ticketTypeId: draft.ticketTypeId || undefined,
      })
    },
    reset() {
      setDraft(allTime)
      setFilters({})
    },
    appliedPeriod: formatPeriod(filters),
    dateError: invalidDates
      ? t("The end date must be on or after the start date.")
      : null,
    showReset: Boolean(
      draft.from ||
      draft.through ||
      draft.ticketTypeId ||
      filters.from ||
      filters.through ||
      filters.ticketTypeId
    ),
    ticketTypes: query.data?.inventory.ticketTypes ?? types.data ?? [],
    ticketTypesLoading: types.isPending && !query.isSuccess,
    ticketTypesError: types.isError && !query.isSuccess,
    loading: query.isPending,
    error: query.isError
      ? query.error instanceof ApiError &&
        [403, 404].includes(query.error.status)
        ? t("Analytics are unavailable for this event.")
        : t("Could not load analytics.")
      : null,
    retry: () => {
      void query.refetch()
      if (types.isError) void types.refetch()
    },
    report: query.isSuccess ? presentReport(query.data, metric) : null,
    metric,
    setMetric,
  }
}

function formatPeriod({ from, through }: OrganizerAnalyticsFilters) {
  const first = from && periodDate.format(new Date(from))
  const last = through && periodDate.format(new Date(through))
  if (first && last) return t("{0} to {1}", first, last)
  if (first) return t("From {0}", first)
  if (last) return t("Through {0}", last)
  return t("All time")
}

function presentSales(sales: OrganizerSales) {
  return {
    tickets: integer.format(sales.tickets),
    gross: money.format(sales.grossKzt),
    discounts: money.format(sales.discountsKzt),
    refunds: money.format(sales.refundsKzt),
    net: money.format(sales.netKzt),
  }
}

function presentRate(numerator: number, denominator: number) {
  const rate = denominator > 0 ? numerator / denominator : 0
  return { value: rate * 100, label: percent.format(rate) }
}

function presentInventory(
  inventory: OrganizerAnalyticsOverview["inventory"],
  sharedCapacity = false
) {
  return {
    configured: inventory.capacity > 0,
    rate: presentRate(inventory.sold, inventory.capacity),
    capacity: integer.format(inventory.capacity),
    sold: integer.format(inventory.sold),
    remaining: integer.format(inventory.remaining),
    held: integer.format(inventory.held),
    sharedCapacity,
  }
}

function presentAttendance(
  attendance: OrganizerAnalyticsOverview["attendance"]
) {
  return (
    attendance && {
      rate: presentRate(attendance.checkedIn, attendance.registered),
      registered: integer.format(attendance.registered),
      checkedIn: integer.format(attendance.checkedIn),
      absent: integer.format(attendance.absent),
    }
  )
}

function presentReport(
  report: OrganizerAnalytics,
  metric: "tickets" | "grossKzt"
) {
  const { inventory, attendance } = report
  const ticketNames = new Map(
    inventory.ticketTypes.map(({ id, name }) => [id, name])
  )
  return {
    inventory: presentInventory(inventory, inventory.sharedCapacity),
    sales: presentSales(report.sales),
    chart: chartBuckets(report.dailySales, metric),
    ticketSales: report.ticketSales.map(({ id, sales }) => ({
      id,
      name: ticketNames.get(id) ?? t("Ticket type {0}", id),
      ...presentSales(sales),
    })),
    campaigns: report.campaignSales.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      redemptions: integer.format(campaign.redemptions),
      ...presentSales(campaign.sales),
      codes: campaign.codes.map(({ code, redemptions, sales }) => ({
        code,
        redemptions: integer.format(redemptions),
        ...presentSales(sales),
      })),
    })),
    attendance: presentAttendance(attendance),
    undated: report.ticketsWithoutOrderDate
      ? t(
          "{0} tickets have no recorded order date and are omitted from the chart.",
          integer.format(report.ticketsWithoutOrderDate)
        )
      : null,
  }
}

function chartBuckets(
  data: OrganizerAnalytics["dailySales"],
  metric: "tickets" | "grossKzt"
) {
  if (!data.length) return []
  const first = Date.parse(data[0].date)
  const last = Date.parse(data[data.length - 1].date)
  const days = Math.round((last - first) / dayInMilliseconds) + 1
  const bucketDays = Math.ceil(days / 24)
  const values = Array.from({ length: Math.ceil(days / bucketDays) }, () => 0)
  for (const { date, sales } of data) {
    const offset = (Date.parse(date) - first) / dayInMilliseconds
    values[Math.floor(offset / bucketDays)] += sales[metric]
  }
  const max = Math.max(...values)
  const formatter = metric === "tickets" ? integer : money
  return values.map((value, index) => {
    const start = first + index * bucketDays * dayInMilliseconds
    const end = Math.min(last, start + (bucketDays - 1) * dayInMilliseconds)
    return {
      key: start,
      label: chartDate.format(start),
      period:
        start === end
          ? periodDate.format(start)
          : t("{0} to {1}", periodDate.format(start), periodDate.format(end)),
      height: max > 0 ? (value / max) * 100 : 0,
      amount: formatter.format(value),
      showLabel: index % Math.ceil(values.length / 5) === 0,
    }
  })
}

export type OrganizerAnalyticsModel = ReturnType<
  typeof useOrganizerAnalyticsViewModel
>
export type OrganizerAnalyticsReport = NonNullable<
  OrganizerAnalyticsModel["report"]
>
