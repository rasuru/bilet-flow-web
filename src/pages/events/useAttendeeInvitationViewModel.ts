import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { ApiError } from "@/api/client"
import { sessionRepository } from "@/auth/sessionRepository"
import { eventAccessRepository } from "@/events/eventAccessRepository"
import { t } from "@/i18n/locale"

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useAttendeeInvitationViewModel(
  sessionId: number,
  eventId: string
) {
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? ""
  )
  const client = useQueryClient()
  const accept = useMutation({
    mutationFn: () =>
      eventAccessRepository.accept(client, sessionId, eventId, token),
    onSuccess: () => {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname
      )
    },
  })

  return {
    valid: uuid.test(token),
    accepting: accept.isPending,
    accepted: accept.isSuccess,
    accept: () => accept.mutate(),
    signOut: sessionRepository.signOut,
    error: accept.error
      ? t(
          accept.error instanceof ApiError
            ? (accept.error.body?.detail ?? accept.error.message)
            : "Could not accept the invitation. Try again."
        )
      : null,
  }
}
