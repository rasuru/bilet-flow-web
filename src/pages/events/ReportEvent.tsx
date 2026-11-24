import { FlagIcon, CheckCircle2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { LoginForm } from "@/pages/auth/LoginForm"
import { RegisterForm } from "@/pages/auth/RegisterForm"
import { t } from "@/i18n/locale"
import { useReportEventViewModel } from "./useReportEventViewModel"

export function ReportEvent({ eventId }: { eventId: string }) {
  const vm = useReportEventViewModel(eventId)
  return (
    <>
      <Button variant="ghost" className="text-muted-foreground" onClick={() => vm.changeOpen(true)}><FlagIcon aria-hidden="true" />{t("Report event")}</Button>
      <Dialog open={vm.open} onOpenChange={vm.changeOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md" showCloseButton={!vm.busy}>
          <DialogHeader>
            <DialogTitle>{t(vm.submitted ? "Report received" : "Report event")}</DialogTitle>
            <DialogDescription>{t(vm.submitted ? "Your report is on record for the moderation team to review." : "Tell us what is wrong with this event. The platform moderation team will review your report.")}</DialogDescription>
          </DialogHeader>
          {vm.submitted ? <div className="space-y-4"><CheckCircle2Icon className="size-8 text-green-600 dark:text-green-400" aria-hidden="true" /><Button className="w-full" onClick={() => vm.changeOpen(false)}>{t("Close")}</Button></div>
            : vm.restoring ? <p role="status"><Spinner /> {t("Loading…")}</p>
            : vm.restoreFailed ? <Button variant="outline" onClick={vm.retrySession}>{t("Try again")}</Button>
            : !vm.signedIn ? <div className="space-y-4"><p className="text-sm text-muted-foreground">{t("Sign in to report an event.")}</p>{vm.registering ? <RegisterForm onLogin={() => vm.setRegistering(false)} /> : <LoginForm onRegister={() => vm.setRegistering(true)} />}</div>
            : <form className="space-y-4" noValidate onSubmit={e => { e.preventDefault(); void vm.submit() }}>
              <div className="space-y-2"><Label htmlFor="report-reason">{t("Reason for reporting")}</Label><Textarea id="report-reason" value={vm.reason} onChange={e => vm.setReason(e.target.value)} maxLength={1000} disabled={vm.busy} required aria-invalid={Boolean(vm.error)} aria-describedby="report-count report-error" placeholder={t("Describe the issue with this event.")} /><p id="report-count" className="text-right text-xs text-muted-foreground">{vm.remaining}</p><p id="report-error" role={vm.error ? "alert" : undefined} className="text-sm text-destructive">{vm.error}</p></div>
              <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={vm.busy} onClick={() => vm.changeOpen(false)}>{t("Back")}</Button><Button type="submit" disabled={vm.busy}>{vm.busy && <Spinner />}{t("Submit report")}</Button></div>
            </form>}
        </DialogContent>
      </Dialog>
    </>
  )
}

