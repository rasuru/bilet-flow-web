import { t } from "@/i18n/locale"
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

import { ApiError } from "@/api/client"
import {
  managedEventRepository,
  type ManagedEventAction,
} from "@/events/managedEventRepository"
import {
  eventStatusLabels,
  presentInventory,
  presentOrganizerEvent,
  type OrganizerEvent,
  type OrganizerEventStatus,
} from "./organizerEventPresentation"

type Filter = "all" | OrganizerEventStatus
type PendingAction = { eventId: string; action: ManagedEventAction }

const actionResults: Record<ManagedEventAction, string> = {
  publish: "Event published.",
  unpublish: "Event unpublished.",
  cancel: "Event cancelled.",
}

export function useOrganizerViewModel(sessionId: number) {
  const client = useQueryClient()
  const query = useQuery(managedEventRepository.mineQuery(sessionId))
  const changeStatus = useMutation(
    managedEventRepository.changeStatusMutation(client, sessionId)
  )
  const [filter, setFilter] = useState<Filter>("all")
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    error?: boolean
  } | null>(null)
  const changingStatus = useRef(false)

  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const events = (query.data ?? []).map((event) =>
    presentOrganizerEvent(event, now)
  )
  const counts = new Map<OrganizerEventStatus, number>()
  for (const event of events)
    counts.set(event.status, (counts.get(event.status) ?? 0) + 1)

  const visible =
    filter === "all"
      ? events
      : events.filter((event) => event.status === filter)
  const preview = events.find((event) => event.id === previewId)
  const inventoryEvents =
    preview && !visible.some((event) => event.id === preview.id)
      ? [...visible, preview]
      : visible
  const inventoryQueries = useQueries({
    queries: inventoryEvents.map((event) =>
      managedEventRepository.inventoryQuery(sessionId, event.id)
    ),
  })
  const inventories = new Map(
    inventoryEvents.map((event, index) => [event.id, inventoryQueries[index]])
  )

  function withInventory(event: OrganizerEvent) {
    const inventory = inventories.get(event.id)
    return {
      ...event,
      inventory: {
        loading: inventory?.isPending ?? false,
        error: inventory?.isError ?? false,
        totals: presentInventory(inventory?.data),
        retry: () => void inventory?.refetch(),
      },
    }
  }

  const pendingEvent = events.find((event) => event.id === pending?.eventId)

  async function confirmAction() {
    if (
      !pending ||
      !pendingEvent?.actions.includes(pending.action) ||
      changingStatus.current
    )
      return
    changingStatus.current = true
    setNotice(null)
    try {
      await changeStatus.mutateAsync(pending)
      setPending(null)
      setNotice({ text: actionResults[pending.action] })
    } catch {
      // The mutation retains the error for the confirmation dialog.
    } finally {
      changingStatus.current = false
    }
  }

  async function copyEventLink(path: string) {
    try {
      await navigator.clipboard.writeText(
        new URL(path, window.location.origin).href
      )
      setNotice({ text: "Event link copied." })
    } catch {
      setNotice({
        text: "Could not copy the link. Open the event and copy its address.",
        error: true,
      })
    }
  }

  return {
    total: events.length,
    loading: query.isPending,
    error: query.isError
      ? query.error instanceof ApiError
        ? t(query.error.message)
        : t("Couldn’t load your events.")
      : null,
    retry: () => void query.refetch(),
    filter,
    setFilter,
    filters: [
      { value: "all" as const, label: t("All"), count: events.length },
      ...Object.entries(eventStatusLabels).map(([status, label]) => {
        const value = status as OrganizerEventStatus
        return { value, label: t(label), count: counts.get(value) ?? 0 }
      }),
    ],
    summary: [
      { label: t("Upcoming"), count: counts.get("upcoming") ?? 0 },
      { label: t("Active"), count: counts.get("active") ?? 0 },
      { label: t("Drafts"), count: counts.get("draft") ?? 0 },
    ],
    events: visible.map(withInventory),
    preview: preview ? withInventory(preview) : null,
    setPreviewId,
    notice: notice ? { ...notice, text: t(notice.text) } : null,
    confirmation:
      pending && pendingEvent
        ? {
            action: pending.action,
            title: pendingEvent.title,
            allowed: pendingEvent.actions.includes(pending.action),
            busy: changeStatus.isPending,
            error: changeStatus.isError
              ? changeStatus.error instanceof ApiError
                ? t(changeStatus.error.message)
                : t("Could not change the event status. Try again.")
              : null,
          }
        : null,
    requestAction(eventId: string, action: ManagedEventAction) {
      changeStatus.reset()
      setPending({ eventId, action })
    },
    closeConfirmation() {
      if (!changingStatus.current) setPending(null)
    },
    confirmAction,
    copyEventLink,
  }
}

export type OrganizerEventCardModel = ReturnType<
  typeof useOrganizerViewModel
>["events"][number]

