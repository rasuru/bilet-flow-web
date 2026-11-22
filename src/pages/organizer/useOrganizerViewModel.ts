import { useQuery } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import type { EventStatus } from "@/api/events"
import { managedEventRepository } from "@/events/managedEventRepository"
import { organizerCampaignsPath } from "@/promotions/campaignLinks"

const statusLabels: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  UNPUBLISHED: "Unpublished",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
}
const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })

export function useOrganizerViewModel(sessionId: number) {
  const query = useQuery(managedEventRepository.mineQuery(sessionId))
  return {
    loading: query.isPending,
    error: query.isError
      ? query.error instanceof ApiError
        ? query.error.message
        : "Couldn’t load your events."
      : null,
    retry: () => void query.refetch(),
    events: (query.data ?? []).map((event) => ({
      id: event.id,
      title: event.title,
      date: date.format(new Date(event.startAt)),
      startAt: event.startAt,
      status: statusLabels[event.status],
      campaignPath: organizerCampaignsPath(event.id),
    })),
  }
}
