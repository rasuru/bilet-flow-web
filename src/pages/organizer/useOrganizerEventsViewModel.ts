import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "wouter"

import { ApiError } from "@/api/client"
import { managedEventRepository } from "@/events/managedEventRepository"
import { t } from "@/i18n/locale"
import {
  eventStatusLabels,
  presentOrganizerEvent,
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

export function useOrganizerEventsViewModel(sessionId: number) {
  const query = useQuery(managedEventRepository.mineQuery(sessionId))
  const now = useOrganizerClock()
  const [params, setParams] = useSearchParams()
  const requestedStatus = params.get("status")
  const filter =
    statusOrder.find((status) => status === requestedStatus) ?? "all"
  const search = params.get("q") ?? ""
  const needle = search.trim().toLocaleLowerCase()

  const events = (query.data ?? [])
    .map((event) => presentOrganizerEvent(event, now))
    .sort((a, b) => {
      const rank = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      if (rank) return rank
      return (
        (a.status === "upcoming"
          ? a.startsAt - b.startsAt
          : b.startsAt - a.startsAt) || a.title.localeCompare(b.title)
      )
    })
  const counts = new Map<OrganizerEventStatus, number>()
  for (const event of events)
    counts.set(event.status, (counts.get(event.status) ?? 0) + 1)

  function setFilterParam(key: "q" | "status", value: string) {
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
    search,
    returnFilters: params.toString(),
    setSearch: (value: string) => setFilterParam("q", value),
    clearFilters: () => setParams({}, { replace: true }),
    visible: events.filter(
      (event) =>
        (filter === "all" || event.status === filter) &&
        [event.title, event.venue].some((value) =>
          value.toLocaleLowerCase().includes(needle)
        )
    ),
    filters: [
      { value: "all", label: t("All statuses") },
      ...statusOrder
        .filter((status) => counts.has(status) || status === filter)
        .map((value) => ({ value, label: t(eventStatusLabels[value]) })),
    ],
  }
}
