import { useState } from "react"

import type { ManagedEvent } from "@/api/events"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { refundPolicyDescription } from "@/events/refundPolicyPresentation"
import { t } from "@/i18n/locale"

import {
  useOrganizerAttendeeInvitations,
  useOrganizerRefundPolicy,
} from "./useOrganizerEventAccess"

type EventSettings = { sessionId: number; event: ManagedEvent }

export function OrganizerRefundPolicy({ sessionId, event }: EventSettings) {
  const model = useOrganizerRefundPolicy(sessionId, event)
  return (
    <Card id="organizer-refund-policy" className="scroll-mt-4">
      <CardHeader>
        <CardTitle>
          <h2>{t("Refund policy")}</h2>
        </CardTitle>
        <CardDescription>
          {refundPolicyDescription(model.current)}
        </CardDescription>
      </CardHeader>
      {event.status !== "CANCELLED" && (
        <CardContent>
          <form className="space-y-3" onSubmit={model.submit}>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full space-y-2 sm:w-60">
                <FieldLabel htmlFor="refund-hours">
                  {t("Refund cutoff in hours before start")}
                </FieldLabel>
                <Input
                  id="refund-hours"
                  type="number"
                  min={0}
                  max={8760}
                  step={1}
                  inputMode="numeric"
                  value={model.value}
                  disabled={model.saving}
                  aria-describedby="refund-cutoff-help"
                  onChange={(change) => model.change(change.target.value)}
                />
              </div>
              <Button type="submit" disabled={!model.canSave}>
                {t(model.saving ? "Saving…" : "Save refund policy")}
              </Button>
            </div>
            <p
              id="refund-cutoff-help"
              className="text-sm text-muted-foreground"
            >
              {t(
                "Use 0 for refunds until the event starts. Leave blank to handle requests through support. Changes apply to future orders."
              )}
            </p>
            {model.error && <FieldError>{model.error}</FieldError>}
            {model.saved && (
              <p role="status" className="text-sm">
                {t("Refund policy saved.")}
              </p>
            )}
          </form>
        </CardContent>
      )}
    </Card>
  )
}

export function OrganizerAttendeeInvitations({
  sessionId,
  event,
}: EventSettings) {
  const model = useOrganizerAttendeeInvitations(sessionId, event)
  const [revoking, setRevoking] = useState<string>()
  return (
    <Card id="organizer-invitations" className="scroll-mt-4">
      <CardHeader>
        <CardTitle>
          <h2>{t("Attendee invitations")}</h2>
        </CardTitle>
        <CardDescription>
          {t(
            "Invite people by email. They can open the private event once they accept and the event is published."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {model.canInvite && (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={model.submit}
          >
            <div className="w-full max-w-sm space-y-2 sm:flex-1">
              <FieldLabel htmlFor="attendee-invitation-email">
                {t("Attendee email")}
              </FieldLabel>
              <Input
                id="attendee-invitation-email"
                type="email"
                maxLength={254}
                autoComplete="off"
                required
                value={model.email}
                disabled={model.busy}
                onChange={(change) => model.setEmail(change.target.value)}
              />
            </div>
            <Button type="submit" disabled={model.busy || !model.email.trim()}>
              {t("Send invitation")}
            </Button>
          </form>
        )}
        {model.error && <FieldError>{model.error}</FieldError>}
        {model.status && (
          <p role="status" className="text-sm">
            {model.status}
          </p>
        )}
        {model.loading && (
          <p role="status" className="text-sm">
            {t("Loading…")}
          </p>
        )}
        {model.loadError && (
          <div className="space-y-2">
            <FieldError>{t("Could not load attendee invitations.")}</FieldError>
            <Button variant="outline" size="sm" onClick={model.retry}>
              {t("Try again")}
            </Button>
          </div>
        )}
        {!model.loading &&
          !model.loadError &&
          model.invitations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("No invitations yet.")}
            </p>
          )}
        {model.invitations.length > 0 && (
          <ul className="divide-y">
            {model.invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-sm font-medium wrap-anywhere">
                    {invitation.email}
                  </span>
                  <Badge variant="outline">
                    {t(
                      invitation.accepted ? "Accepted" : "Awaiting acceptance"
                    )}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {model.canInvite && !invitation.accepted && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={model.busy}
                      onClick={() => model.resend(invitation.id)}
                      aria-label={t(
                        "Resend invitation to {0}",
                        invitation.email
                      )}
                    >
                      {t("Resend email")}
                    </Button>
                  )}
                  <AlertDialog
                    open={revoking === invitation.id}
                    onOpenChange={(open) =>
                      setRevoking(open ? invitation.id : undefined)
                    }
                  >
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={t(
                            "Revoke invitation for {0}",
                            invitation.email
                          )}
                          disabled={model.busy}
                        />
                      }
                    >
                      {t("Revoke")}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("Revoke invitation?")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t(
                            "Remove private event access for {0}. Completed orders stay in place.",
                            invitation.email
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => {
                            setRevoking(undefined)
                            model.revoke(invitation.id)
                          }}
                          disabled={model.busy}
                        >
                          {t("Revoke")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
