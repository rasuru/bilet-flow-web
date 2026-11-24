import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ApiError } from "@/api/client"
import type { HistoryCategory } from "@/api/eventHistory"
import { eventHistoryRepository } from "@/events/eventHistoryRepository"
import { dateFormat, statusText, t } from "@/i18n/locale"

const categories: Record<HistoryCategory, string> = {
  EVENT: "Event", TICKETING: "Ticketing", CHECK_IN: "Check-in", PROMOTIONS: "Campaigns",
  REFUNDS: "Refunds", PAYMENTS: "Payments", SUPPORT: "Support",
}
const dateTime = dateFormat({ dateStyle: "medium", timeStyle: "short" })
const size = 20
const maxDepth = 10_000

function boundary(day: string, exclusive = false) {
  if (!day) return undefined
  const date = new Date(`${day}T00:00:00`)
  if (exclusive) date.setDate(date.getDate() + 1)
  return date.toISOString()
}

export function useEventHistoryViewModel(sessionId: number, eventId: string) {
  const [category, setCategory] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(0)
  const invalid = Boolean(from && to && from > to)
  const filters = invalid ? null : { category: category ? category as HistoryCategory : undefined, from: boundary(from), to: boundary(to, true), page, size }
  const query = useQuery(eventHistoryRepository.query(sessionId, eventId, filters))
  const total = query.data?.total ?? 0
  const limit = Math.min(total, maxDepth)
  return {
    categories: [{ value: "", label: t("All activity") }, ...Object.entries(categories).map(([value, label]) => ({ value, label: t(label) }))],
    category, from, to,
    setCategory: (value: string) => { setCategory(value); setPage(0) },
    setFrom: (value: string) => { setFrom(value); setPage(0) },
    setTo: (value: string) => { setTo(value); setPage(0) },
    clear: () => { setCategory(""); setFrom(""); setTo(""); setPage(0) },
    loading: !invalid && query.isPending,
    refreshing: query.isFetching,
    error: invalid ? t("Start date must not be after end date.") : query.isError ? t(query.error instanceof ApiError ? query.error.message : "Could not load activity history.") : null,
    canRefresh: !invalid && !query.isFetching,
    refresh: () => void query.refetch(),
    entries: (query.data?.entries ?? []).map(entry => ({
      id: `${entry.category}:${entry.id}:${entry.action}`,
      timestamp: entry.timestamp,
      date: dateTime.format(new Date(entry.timestamp)),
      category: t(categories[entry.category] ?? entry.category),
      action: statusText(entry.action),
      description: entry.description,
      actor: entry.actorUserId === null ? t("System / unknown actor") : t("User #{0}", entry.actorUserId),
      entity: entry.entityId ? `${statusText(entry.entityType)} · ${entry.entityId}` : statusText(entry.entityType),
    })),
    empty: !invalid && query.isSuccess && total === 0,
    range: query.isSuccess && total > 0 ? t("{0}–{1} of {2}", page * size + 1, Math.min(page * size + size, total), total) : null,
    previous: page > 0 && !query.isFetching,
    next: (page + 1) * size < limit && !query.isFetching,
    goPrevious: () => setPage(p => Math.max(0, p - 1)),
    goNext: () => setPage(p => p + 1),
    capped: total > maxDepth,
  }
}

