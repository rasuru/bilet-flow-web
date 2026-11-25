import { queryOptions, type QueryClient } from "@tanstack/react-query"

import {
  acceptAttendeeInvitation,
  inviteAttendee,
  listAttendeeInvitations,
  resendAttendeeInvitation,
  revokeAttendeeInvitation,
  updateEventRefundPolicy,
  type ManagedEvent,
} from "@/api/events"
import { sessionRepository } from "@/auth/sessionRepository"
import { managedEventRepository } from "./managedEventRepository"

export type InvitationAction =
  { type: "invite"; email: string } | { type: "resend" | "revoke"; id: string }

function invitationKey(sessionId: number, eventId: string) {
  return ["attendee-invitations", sessionId, eventId] as const
}

export const eventAccessRepository = {
  invitationQuery(sessionId: number, eventId: string) {
    return queryOptions({
      queryKey: invitationKey(sessionId, eventId),
      queryFn: () =>
        sessionRepository.authenticatedRequest(sessionId, (token) =>
          listAttendeeInvitations(token, eventId)
        ),
      retry: false,
    })
  },

  async changeInvitation(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    action: InvitationAction
  ) {
    try {
      await sessionRepository.authenticatedRequest(sessionId, (token) => {
        switch (action.type) {
          case "invite":
            return inviteAttendee(token, eventId, action.email)
          case "resend":
            return resendAttendeeInvitation(token, eventId, action.id)
          case "revoke":
            return revokeAttendeeInvitation(token, eventId, action.id)
        }
      })
    } finally {
      // An invitation can be saved even when the mail server is unavailable.
      await client.invalidateQueries({
        queryKey: invitationKey(sessionId, eventId),
      })
    }
  },

  async accept(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    invitation: string
  ) {
    await sessionRepository.authenticatedRequest(sessionId, (token) =>
      acceptAttendeeInvitation(token, eventId, invitation)
    )
    void client.invalidateQueries({ queryKey: ["public-event", eventId] })
  },

  async saveRefundPolicy(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    hours: number | null
  ) {
    await sessionRepository.authenticatedRequest(sessionId, (token) =>
      updateEventRefundPolicy(token, eventId, hours)
    )
    const { queryKey } = managedEventRepository.eventQuery(sessionId, eventId)
    await client.cancelQueries({ queryKey, exact: true })
    client.setQueryData<ManagedEvent>(queryKey, (event) =>
      event ? { ...event, refundHoursBeforeStart: hours } : event
    )
    void client.invalidateQueries({ queryKey: ["managed-events", sessionId] })
    void client.invalidateQueries({ queryKey: ["public-event", eventId] })
  },
}
