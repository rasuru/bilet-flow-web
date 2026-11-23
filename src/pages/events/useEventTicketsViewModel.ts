import { useQuery } from "@tanstack/react-query"

import { useSessionViewModel } from "@/auth/useSessionViewModel"
import { attendanceRepository } from "@/tickets/attendanceRepository"
import {
  ticketDetailsPath,
  ticketStatusLabels,
} from "@/tickets/ticketPresentation"

export function useEventTicketsViewModel(eventId: string) {
  const session = useSessionViewModel()
  const signedIn = session.status === "signedIn"
  const query = useQuery(
    attendanceRepository.eventTicketsQuery(
      signedIn ? session.sessionId : null,
      signedIn && session.account.activated ? session.account.email : null,
      eventId
    )
  )

  if (query.isError || !query.data) return []
  return query.data.map((ticket) => ({
    id: ticket.id,
    href: ticketDetailsPath(ticket.id),
    attendee: ticket.attendeeEmail,
    status: ticketStatusLabels[ticket.status],
  }))
}
