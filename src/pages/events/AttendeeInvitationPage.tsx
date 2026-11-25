import { Link } from "wouter"

import { AccountFlowPage } from "@/components/site/AccountFlowPage"
import { Button, buttonVariants } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { t } from "@/i18n/locale"

import { useAttendeeInvitationViewModel } from "./useAttendeeInvitationViewModel"

export function AttendeeInvitationPage({
  sessionId,
  eventId,
  email,
}: {
  sessionId: number
  eventId: string
  email: string | null
}) {
  const model = useAttendeeInvitationViewModel(sessionId, eventId)
  return (
    <AccountFlowPage
      title={t("Private event invitation")}
      href="/"
      backLabel={t("Home")}
    >
      {model.accepted ? (
        <div className="space-y-3">
          <p role="status">
            {t(
              "Invitation accepted. You can open the event once the organizer publishes it."
            )}
          </p>
          <Link
            className={buttonVariants()}
            href={`/events/${encodeURIComponent(eventId)}`}
          >
            {t("Open event")}
          </Link>
        </div>
      ) : model.valid ? (
        <>
          {email && (
            <p className="text-sm wrap-anywhere text-muted-foreground">
              {t("Signed in as {0}.", email)}
            </p>
          )}
          {model.error && <FieldError>{model.error}</FieldError>}
          <div className="flex flex-wrap gap-2">
            <Button disabled={model.accepting} onClick={model.accept}>
              {t(model.accepting ? "Accepting…" : "Accept invitation")}
            </Button>
            <Button
              variant="outline"
              disabled={model.accepting}
              onClick={model.signOut}
            >
              {t("Use another account")}
            </Button>
          </div>
        </>
      ) : (
        <p>{t("Open the original invitation link from your email.")}</p>
      )}
    </AccountFlowPage>
  )
}
