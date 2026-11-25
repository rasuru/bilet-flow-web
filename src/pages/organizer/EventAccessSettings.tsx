import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import {
  removeRefundPolicy,
  rotatePrivateAccess,
  saveRefundPolicy,
  type ManagedEvent,
  type RefundPolicyRequest,
} from "@/api/events"
import { sessionRepository } from "@/auth/sessionRepository"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { withEventAccess } from "@/events/privateEventAccess"
import { t } from "@/i18n/locale"

export function EventAccessSettings({
  event,
  sessionId,
}: {
  event: ManagedEvent
  sessionId: number
}) {
  const client = useQueryClient()
  const [allowed, setAllowed] = useState(
    event.refundPolicy?.refundsAllowed ?? true
  )
  const [hours, setHours] = useState(
    String(event.refundPolicy?.cutoffHoursBeforeStart ?? 0)
  )
  const [terms, setTerms] = useState(event.refundPolicy?.terms ?? "")
  const [copied, setCopied] = useState("")
  const [policyMessage, setPolicyMessage] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const managedKey = ["managed-events", sessionId, event.id]

  const policy = useMutation({
    mutationFn: (value: RefundPolicyRequest | null) =>
      sessionRepository.authenticatedRequest(sessionId, (token) =>
        value
          ? saveRefundPolicy(token, event.id, value)
          : removeRefundPolicy(token, event.id)
      ),
    onSuccess: async (_, value) => {
      if (!value) {
        setAllowed(true)
        setHours("0")
        setTerms("")
      }
      setPolicyMessage(
        value ? t("Refund policy saved.") : t("Refund policy removed.")
      )
      await Promise.all([
        client.invalidateQueries({ queryKey: managedKey }),
        client.invalidateQueries({ queryKey: ["public-event", event.id] }),
      ])
    },
  })

  const rotate = useMutation({
    mutationFn: () =>
      sessionRepository.authenticatedRequest(sessionId, (token) =>
        rotatePrivateAccess(token, event.id)
      ),
    onSuccess: async (access) => {
      await client.cancelQueries({ queryKey: managedKey, exact: true })
      client.setQueryData<ManagedEvent>(
        managedKey,
        (current) =>
          current && { ...current, privateAccessCode: access.accessCode }
      )
      setInviteMessage(
        t("New invite link created. The previous link no longer works.")
      )
      await client.invalidateQueries({ queryKey: ["public-event", event.id] })
    },
  })

  function save(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault()
    if (policy.isPending) return
    const cutoff = Number(hours)
    if (
      allowed &&
      (!hours.trim() ||
        !Number.isInteger(cutoff) ||
        cutoff < 0 ||
        cutoff > 8760)
    ) {
      setPolicyMessage(t("Enter a whole number from 0 to 8760 hours."))
      return
    }
    setPolicyMessage("")
    policy.mutate({
      refundsAllowed: allowed,
      cutoffHoursBeforeStart: allowed ? cutoff : null,
      terms: terms.trim() || null,
    })
  }

  const code = event.privateAccessCode
  const invite = code
    ? new URL(
        withEventAccess("/events/" + encodeURIComponent(event.id), code),
        window.location.origin
      ).href
    : undefined

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("Refund policy")}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowed}
                disabled={policy.isPending}
                onChange={(change) => setAllowed(change.target.checked)}
              />
              {t("Allow refunds")}
            </label>
            {allowed && (
              <label className="block space-y-1">
                <span>{t("Refund cutoff in hours before the event")}</span>
                <Input
                  type="number"
                  min={0}
                  max={8760}
                  step={1}
                  required
                  value={hours}
                  disabled={policy.isPending}
                  onChange={(change) => setHours(change.target.value)}
                />
              </label>
            )}
            <label className="block space-y-1">
              <span>{t("Refund terms (optional)")}</span>
              <Textarea
                maxLength={2000}
                value={terms}
                disabled={policy.isPending}
                onChange={(change) => setTerms(change.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={policy.isPending}>
                {t("Save refund policy")}
              </Button>
              {event.refundPolicy && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={policy.isPending}
                  onClick={() => {
                    if (
                      !window.confirm(t("Remove this event?s refund policy?"))
                    )
                      return
                    setPolicyMessage("")
                    policy.mutate(null)
                  }}
                >
                  {t("Remove policy")}
                </Button>
              )}
            </div>
            {policyMessage && <p role="status">{policyMessage}</p>}
            {policy.isError && (
              <FieldError>{t(policy.error.message)}</FieldError>
            )}
          </form>
        </CardContent>
      </Card>
      {event.visibility === "PRIVATE" && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("Private event invite")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invite && (
              <Input
                aria-label={t("Private invite link")}
                readOnly
                value={invite}
                onFocus={(focus) => focus.currentTarget.select()}
              />
            )}
            <div className="flex flex-wrap gap-2">
              {invite && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={rotate.isPending}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(invite)
                      setCopied(t("Invite link copied."))
                    } catch {
                      setCopied(
                        t("Select the invite link to copy it manually.")
                      )
                    }
                  }}
                >
                  {t("Copy invite link")}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={rotate.isPending}
                onClick={() => {
                  if (
                    code &&
                    !window.confirm(
                      t(
                        "Replace the invite link? The previous link will stop working."
                      )
                    )
                  )
                    return
                  setCopied("")
                  setInviteMessage("")
                  rotate.mutate()
                }}
              >
                {t(code ? "Replace invite link" : "Generate invite link")}
              </Button>
            </div>
            {(copied || inviteMessage) && (
              <p role="status">{copied || inviteMessage}</p>
            )}
            {rotate.isError && (
              <FieldError>{t(rotate.error.message)}</FieldError>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}
