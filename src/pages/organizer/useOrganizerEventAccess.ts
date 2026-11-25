import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { ApiError } from "@/api/client"
import type { ManagedEvent } from "@/api/events"
import {
  eventAccessRepository,
  type InvitationAction,
} from "@/events/eventAccessRepository"
import { t } from "@/i18n/locale"

function message(error: Error, fallback: string) {
  return t(
    error instanceof ApiError ? (error.body?.detail ?? error.message) : fallback
  )
}

export function useOrganizerRefundPolicy(
  sessionId: number,
  event: ManagedEvent
) {
  const client = useQueryClient()
  const [draft, setDraft] = useState<string>()
  const [validation, setValidation] = useState(false)
  const current = event.refundHoursBeforeStart ?? null
  const value = draft ?? String(current ?? "")
  const save = useMutation({
    mutationFn: (hours: number | null) =>
      eventAccessRepository.saveRefundPolicy(
        client,
        sessionId,
        event.id,
        hours
      ),
    onSuccess: () => setDraft(undefined),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const hours = value === "" ? null : Number(value)
    if (
      hours !== null &&
      (!Number.isInteger(hours) || hours < 0 || hours > 8760)
    ) {
      setValidation(true)
      return
    }
    if (!save.isPending && hours !== current) save.mutate(hours)
  }

  return {
    current,
    value,
    change: (next: string) => {
      setValidation(false)
      save.reset()
      setDraft(next)
    },
    canSave: value !== String(current ?? "") && !save.isPending,
    saving: save.isPending,
    saved: save.isSuccess,
    error: validation
      ? t("Enter a whole number from 0 to 8,760.")
      : save.error && message(save.error, "Could not save the refund policy."),
    submit,
  }
}

export function useOrganizerAttendeeInvitations(
  sessionId: number,
  event: ManagedEvent
) {
  const client = useQueryClient()
  const [email, setEmail] = useState("")
  const query = useQuery(
    eventAccessRepository.invitationQuery(sessionId, event.id)
  )
  const mutation = useMutation({
    mutationFn: (action: InvitationAction) =>
      eventAccessRepository.changeInvitation(
        client,
        sessionId,
        event.id,
        action
      ),
    onSuccess: (_, action) => {
      if (action.type === "invite") setEmail("")
    },
  })
  const canInvite = event.status !== "CANCELLED" && event.status !== "SUSPENDED"

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canInvite && email.trim() && !mutation.isPending) {
      mutation.mutate({ type: "invite", email: email.trim() })
    }
  }

  return {
    email,
    setEmail,
    invitations: query.data ?? [],
    loading: query.isPending,
    busy: mutation.isPending,
    loadError: query.isError,
    retry: () => void query.refetch(),
    canInvite,
    submit,
    resend: (id: string) => mutation.mutate({ type: "resend", id }),
    revoke: (id: string) => mutation.mutate({ type: "revoke", id }),
    error:
      mutation.error &&
      message(mutation.error, "Could not update the invitation."),
    status: mutation.isSuccess
      ? t(
          mutation.variables.type === "revoke"
            ? "Invitation revoked."
            : "Invitation email sent."
        )
      : null,
  }
}
