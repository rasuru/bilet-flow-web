import { t } from "@/i18n/locale"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { useHistoryState } from "wouter/use-browser-location"

import { ApiError } from "@/api/client"
import {
  managedEventRepository,
  type ManagedEventAction,
} from "@/events/managedEventRepository"
import { presentOrganizerEvent } from "./organizerEventPresentation"
import { useOrganizerClock } from "./useOrganizerClock"

const actionResults: Record<ManagedEventAction, string> = {
  publish: "Event published.",
  unpublish: "Event unpublished.",
  cancel: "Event cancelled.",
}

export function useOrganizerViewModel(sessionId: number, eventId: string) {
  const historyState = useHistoryState<{
    organizerEventFilters?: string
    organizerNotice?: string
  } | null>()
  const [initialFilters] = useState(historyState?.organizerEventFilters)
  const filters = new URLSearchParams(initialFilters)
  const returnSearch = new URLSearchParams()
  for (const key of ["q", "status", "pricing", "sort"]) {
    const value = filters.get(key)
    if (value) returnSearch.set(key, value)
  }
  const dashboardPath = returnSearch.size
    ? `/organizer?${returnSearch}`
    : "/organizer"

  const client = useQueryClient()
  const query = useQuery(managedEventRepository.eventQuery(sessionId, eventId))
  const changeStatus = useMutation(
    managedEventRepository.changeStatusMutation(client, sessionId)
  )
  const [pending, setPending] = useState<ManagedEventAction | null>(null)
  const [notice, setNotice] = useState<{
    text: string
    error?: boolean
  } | null>(() =>
    historyState?.organizerNotice
      ? { text: historyState.organizerNotice }
      : null
  )
  const changingStatus = useRef(false)

  const now = useOrganizerClock()
  const event = query.data ? presentOrganizerEvent(query.data, now) : null

  async function confirmAction() {
    if (!pending || !event?.actions.includes(pending) || changingStatus.current)
      return
    changingStatus.current = true
    setNotice(null)
    try {
      await changeStatus.mutateAsync({ eventId, action: pending })
      setPending(null)
      setNotice({ text: actionResults[pending] })
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
    event,
    eventSections: event ? [
      { id: "organizer-details", label: t("Event") },
      { id: "organizer-tickets", label: t("Ticket tiers") },
      { id: "organizer-refund-policy", label: t("Refund policy") },
      ...(query.data?.visibility === "PRIVATE"
        ? [{ id: "organizer-invitations", label: t("Attendee invitations") }]
        : []),
      { id: "organizer-staff", label: t("Event administrators") },
      { id: "organizer-campaigns", label: t("Campaigns") },
      { id: "organizer-analytics", label: t("Analytics") },
      { id: "organizer-history", label: t("Activity history") },
    ] : [],
    managedEvent: query.data,
    notify: (text: string) => setNotice({ text }),
    dashboardPath,
    dashboardFilters: returnSearch.toString(),
    loading: query.isPending,
    error: query.isError
      ? query.error instanceof ApiError
        ? t(query.error.message)
        : t("Could not load this event.")
      : null,
    retry: () => void query.refetch(),
    notice: notice ? { ...notice, text: t(notice.text) } : null,
    confirmation:
      pending && event
        ? {
            action: pending,
            title: event.title,
            allowed: event.actions.includes(pending),
            busy: changeStatus.isPending,
            error: changeStatus.isError
              ? changeStatus.error instanceof ApiError
                ? t(changeStatus.error.message)
                : t("Could not change the event status. Try again.")
              : null,
          }
        : null,
    requestAction(action: ManagedEventAction) {
      changeStatus.reset()
      setPending(action)
    },
    closeConfirmation() {
      if (!changingStatus.current) setPending(null)
    },
    confirmAction,
    copyEventLink,
  }
}

