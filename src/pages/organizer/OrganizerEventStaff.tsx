import type { ManagedEvent } from "@/api/events"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { t } from "@/i18n/locale"
import { useEventStaffViewModel } from "./useEventManagementViewModels"

export function OrganizerEventStaff({
  sessionId,
  event,
  notify,
}: {
  sessionId: number
  event: ManagedEvent
  notify: (message: string) => void
}) {
  const model = useEventStaffViewModel(sessionId, event, notify)
  const editable = event.status !== "CANCELLED"
  const removal = model.staff.find(({ userId }) => userId === model.removing)
  return (
    <section
      id="organizer-staff"
      aria-labelledby="event-staff-title"
      className="scroll-mt-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id="event-staff-title" className="text-lg">
              {t("Event administrators")}
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {model.staff.length ? (
            <ul className="divide-y border-y">
              {model.staff.map(({ userId, name, assignedAt }) => (
                <li
                  key={userId}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div className="min-w-0 wrap-anywhere">
                    <p className="font-medium">{name}</p>
                    <p className="text-muted-foreground">
                      {t("Assigned {0}", assignedAt)}
                    </p>
                  </div>
                  {editable && (
                    <Button
                      variant="ghost"
                      className="min-h-10"
                      disabled={model.busy}
                      aria-label={t("Remove {0}", name)}
                      onClick={() => model.requestRemoval(userId)}
                    >
                      {t("Remove")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("No event administrators assigned.")}
            </p>
          )}
          {editable && (
            <>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Event administrators can check in attendees and handle event support requests."
                )}
              </p>
              <form
                className="flex max-w-lg flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  model.search()
                }}
              >
                <Field className="min-w-0 flex-1 basis-44">
                  <FieldLabel htmlFor="staff-username">
                    {t("Account username")}
                  </FieldLabel>
                  <Input
                    id="staff-username"
                    className="h-10"
                    value={model.input}
                    onChange={(e) => model.updateInput(e.target.value)}
                    autoComplete="off"
                    maxLength={50}
                    disabled={model.busy}
                  />
                </Field>
                <Button
                  type="submit"
                  variant="outline"
                  className="min-h-10"
                  disabled={model.searching || model.busy}
                >
                  {t("Find account")}
                </Button>
              </form>
              {model.searching && (
                <p role="status" className="flex items-center gap-2 text-sm">
                  <Spinner aria-hidden="true" /> {t("Searching…")}
                </p>
              )}
              {model.searchError && (
                <p role="alert" className="text-sm text-destructive">
                  {model.searchError}
                </p>
              )}
              {model.searched &&
                (model.results.length ? (
                  <ul className="max-w-lg divide-y rounded-lg border">
                    {model.results.map(({ id, login, assigned }) => (
                      <li
                        key={id}
                        className="flex flex-wrap items-center justify-between gap-2 p-3"
                      >
                        <span className="min-w-0 text-sm font-medium wrap-anywhere">
                          {login}
                        </span>
                        {assigned ? (
                          <span className="text-sm text-muted-foreground">
                            {t("Already assigned")}
                          </span>
                        ) : (
                          <Button
                            disabled={model.busy}
                            onClick={() => void model.assign(id)}
                          >
                            {model.busy && <Spinner aria-hidden="true" />}
                            {t("Assign administrator")}
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p role="status" className="text-sm text-muted-foreground">
                    {t(
                      "No account found. Check the username and search again."
                    )}
                  </p>
                ))}
              {model.error && !removal && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{model.error}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
        <AlertDialog
          open={Boolean(removal)}
          onOpenChange={(open) => {
            if (!open && !model.busy) model.requestRemoval(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("Remove event administrator?")}
              </AlertDialogTitle>
              <AlertDialogDescription className="wrap-anywhere">
                {t(
                  "{0} will lose administrator access to this event.",
                  removal?.name ?? ""
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {model.error && (
              <p role="alert" className="text-sm text-destructive">
                {model.error}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={model.busy}>
                {t("Back")}
              </AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={model.busy}
                onClick={() => void model.remove()}
              >
                {model.busy && <Spinner aria-hidden="true" />}
                {t("Remove administrator")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </section>
  )
}
