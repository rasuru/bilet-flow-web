import { t } from "@/i18n/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCwIcon, MailIcon, RotateCcwIcon, TicketIcon } from "lucide-react"
import type { useSupportResolutionViewModel } from "./useSupportResolutionViewModel"

type Model = ReturnType<typeof useSupportResolutionViewModel>
type Context = NonNullable<Model["context"]>
type Payment = NonNullable<Context["payment"]>
type Action = NonNullable<Context["order"]>["actions"][number]

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm wrap-anywhere">{value}</dd></div>
}
function PaymentDetails({ payment }: { payment: Payment }) {
  return <div className="space-y-2 rounded-lg border p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{t("Payment")}</span><Badge variant="outline">{payment.status}</Badge></div>
    <dl className="grid grid-cols-2 gap-2">
      <Detail label={t("Refund status")} value={payment.refund} />
      <Detail label={t("Bank operation")} value={payment.operation} />
      <div className="col-span-2"><Detail label={t("Payment ID")} value={payment.id} /></div>
    </dl>
    {payment.reviewRequired && <p role="status" className="rounded-md bg-amber-500/10 p-2 text-sm text-amber-800 dark:text-amber-300">{t("Payment requires manual review.")}</p>}
  </div>
}
function ActionButton({ action, model }: { action: Action; model: Model }) {
  return <Button type="button" variant={action.destructive ? "destructive" : "outline"} className="h-auto min-h-10 w-full justify-start whitespace-normal text-left" disabled={model.actionsDisabled} onClick={() => model.choose(action)}>
    {action.action === "RESEND_TICKET" ? <MailIcon aria-hidden="true" /> : <RotateCcwIcon aria-hidden="true" />}{action.label}
  </Button>
}
export function SupportResolutionPanel({ model }: { model: Model }) {
  const context = model.context
  return <aside aria-label={t("Case context")} className="min-w-0 space-y-4">
    <Card>
      <CardHeader><div className="flex items-center justify-between gap-2"><CardTitle><h2>{t("Case context")}</h2></CardTitle><Button type="button" variant="ghost" size="icon" aria-label={t("Refresh")} disabled={model.refreshing || model.busy} onClick={model.refresh}><RefreshCwIcon aria-hidden="true" className={model.refreshing ? "animate-spin" : undefined} /></Button></div></CardHeader>
      <CardContent className="min-w-0 space-y-4">
        {model.loading && <p role="status" className="flex items-center gap-2 text-sm"><Spinner />{t("Loading case context…")}</p>}
        {model.error && <p role="alert" className="text-sm text-destructive wrap-anywhere">{model.error}</p>}
        {model.receipt && <p role="status" className="rounded-lg border border-emerald-600/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">{model.receipt}</p>}
        {context && <>
          <section className="space-y-1"><h3 className="text-xs font-medium text-muted-foreground">{t("Customer")}</h3><p className="font-medium wrap-anywhere">{context.customer}</p><p className="text-xs text-muted-foreground">{context.customerId}</p></section>
          {context.event && <section className="space-y-1 border-t pt-4"><h3 className="text-xs font-medium text-muted-foreground">{t("Event")}</h3><p className="font-medium wrap-anywhere">{context.event.title}</p><p className="text-sm text-muted-foreground">{context.event.date}</p><p className="text-sm wrap-anywhere text-muted-foreground">{context.event.location}</p>{context.event.state && <Badge variant="outline">{context.event.state}</Badge>}</section>}
          {context.order && <section className="space-y-3 border-t pt-4">
            <h3 className="text-xs font-medium text-muted-foreground">{t("Associated order")}</h3>
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xl font-semibold tabular-nums">{context.order.amount}</p><Badge variant="outline">{context.order.status}</Badge></div>
            <dl className="grid grid-cols-2 gap-2"><Detail label={t("Purchaser")} value={context.order.owner} /><Detail label={t("Created")} value={context.order.date} /><Detail label={t("Refund status")} value={context.order.refund} /><div className="col-span-2"><Detail label={t("Order ID")} value={context.order.id} /></div></dl>
            {context.order.refundPending && <p role="status" className="rounded-lg bg-muted p-3 text-sm">{t("Refund pending. This status refreshes automatically.")}</p>}
            {context.payment && <PaymentDetails payment={context.payment} />}
            <h3 className="text-sm font-medium">{t("Tickets")} <span className="text-muted-foreground">({context.order.tickets.length})</span></h3>
            {context.order.tickets.map(ticket => <div key={ticket.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-start gap-2"><TicketIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground"/><div className="min-w-0 flex-1"><p className="text-sm font-medium wrap-anywhere">{ticket.attendeeEmail}</p><div className="mt-1 flex flex-wrap gap-1"><Badge variant="outline">{ticket.status}</Badge>{ticket.linked && <Badge>{t("Linked ticket")}</Badge>}</div></div></div>
              <dl><Detail label={t("Ticket ID")} value={ticket.id} /></dl>
              {ticket.actions.map(action => <ActionButton key={action.key} action={action} model={model} />)}
            </div>)}
            {context.order.actions.length > 0 && <div className="space-y-2 border-t pt-3"><h3 className="text-sm font-medium">{t("Order actions")}</h3><p className="text-xs text-muted-foreground">{t("These actions affect every ticket in the order.")}</p>{context.order.actions.map(action => <ActionButton key={action.key} action={action} model={model} />)}</div>}
          </section>}
          {context.activation && <section className="space-y-3 border-t pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium">{t("Paid-sales activation")}</h3><Badge variant="outline">{context.activation.status}</Badge></div>{context.activation.payment && <PaymentDetails payment={context.activation.payment} />}</section>}
          {!context.order && !context.activation && <p className="border-t pt-3 text-sm text-muted-foreground">{t("No order or activation is linked to this case.")}</p>}
        </>}
      </CardContent>
    </Card>
    {context && <Card><CardHeader><CardTitle><h2>{t("Action history")}</h2></CardTitle></CardHeader><CardContent>
      {context.history.length === 0 ? <p className="text-sm text-muted-foreground">{t("No recorded actions yet.")}</p> : <ol className="divide-y">{context.history.map(entry => <li key={entry.id} className="space-y-1 py-3 first:pt-0 last:pb-0"><p className="text-sm font-medium wrap-anywhere">{entry.label}</p><p className="text-xs text-muted-foreground">{entry.actor} · <time dateTime={entry.occurredAt}>{entry.date}</time></p>{entry.details && <p className="text-sm wrap-anywhere whitespace-pre-wrap">{entry.details}</p>}</li>)}</ol>}
    </CardContent></Card>}
    <Dialog open={!!model.confirmation} onOpenChange={open => { if (!open) model.close() }}>
      {model.confirmation && <DialogContent showCloseButton={!model.busy} className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader><DialogTitle>{model.confirmation.title}</DialogTitle><DialogDescription>{model.confirmation.description}</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); model.confirm() }}>
          <div className="space-y-2"><Label htmlFor="resolution-reason">{model.confirmation.financial ? t("Reason (required)") : t("Reason (optional)")}</Label><Textarea id="resolution-reason" value={model.reason} onChange={event => model.setReason(event.target.value)} maxLength={200} required={model.confirmation.financial} disabled={model.busy} /><p className="text-xs text-muted-foreground tabular-nums">{model.reason.length}/200</p></div>
          {model.unavailable && <p role="alert" className="text-sm text-destructive">{t("This action is no longer available. Close this dialog and refresh the case.")}</p>}
          {model.actionError && <p role="alert" className="text-sm text-destructive wrap-anywhere">{model.actionError}</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={model.busy} onClick={model.close}>{t("Cancel")}</Button><Button type="submit" variant={model.confirmation.destructive ? "destructive" : "default"} disabled={!model.canConfirm}>{model.busy && <Spinner />}{t("Confirm")}</Button></DialogFooter>
        </form>
      </DialogContent>}
    </Dialog>
  </aside>
}

