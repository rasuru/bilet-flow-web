import { Link } from "wouter"
import { ArrowRight, CheckCircle2, CreditCard } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { t } from "@/i18n/locale"
import type { usePaidSalesViewModel } from "./usePaidSalesViewModel"

export function PaidSalesActivation({ vm }: { vm: ReturnType<typeof usePaidSalesViewModel> }) {
  return (
    <>
      <Dialog open={vm.successOpen} onOpenChange={open => { if (!open) vm.closeSuccess() }}>
        <DialogContent>
          <DialogHeader>
            <CheckCircle2 aria-hidden="true" className="mb-2 size-10 text-green-600 dark:text-green-400" />
            <DialogTitle className="text-xl">{t("Paid sales activated")}</DialogTitle>
            <DialogDescription>{t("Paid sales are enabled for this event.")}</DialogDescription>
          </DialogHeader>
          <Button className="min-h-11 bg-green-700 text-white hover:bg-green-800 dark:bg-green-400 dark:text-green-950 dark:hover:bg-green-300" onClick={vm.closeSuccess}>
            {t("Continue managing event")}
          </Button>
        </DialogContent>
      </Dialog>
      {vm.showBlock && (
        <section id="organizer-paid-sales" aria-labelledby="paid-sales-title" className="scroll-mt-4">
          <Card className="overflow-hidden border-green-600/25 bg-green-50/70 py-0 dark:bg-green-950/25 dark:border-green-800/60">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CreditCard className="size-5 text-green-700 dark:text-green-400" aria-hidden="true" />
                    <h2 id="paid-sales-title" className="text-xl font-semibold tracking-tight">{t("Paid sales activation")}</h2>
                    {vm.loaded && <Badge variant="outline" className={vm.statusClass}>{vm.statusLabel}</Badge>}
                  </div>
                  {vm.loaded && <p className="max-w-xl text-sm text-muted-foreground">{vm.message}</p>}
                </div>
                {vm.fee && <div className="shrink-0 sm:text-right">
                  <p className="text-sm text-muted-foreground">{vm.feeLabel}</p>
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">{vm.fee}</p>
                </div>}
              </div>
              {vm.loading && <p role="status" className="flex items-center gap-2 text-sm"><Spinner />{t("Loading paid sales status…")}</p>}
              {vm.error && <Alert variant="destructive"><AlertDescription>{vm.error}</AlertDescription></Alert>}
              {vm.showChecklist && !vm.suspended && vm.items.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {vm.items.map(item => <li key={item.key}>{item.label}</li>)}
                </ul>
              )}
              {vm.needsPayout && <Link href="/account/settings" className={buttonVariants({ variant: "default", className: "min-h-11" })}>{t("Configure payout account")}<ArrowRight /></Link>}
              {vm.canRequest && (
                <div className="space-y-4 border-t border-green-600/20 pt-4">
                  <label className="flex items-start gap-3 text-sm leading-relaxed">
                    <Checkbox checked={vm.terms} disabled={vm.paying} onCheckedChange={vm.setTerms} />
                    {t("I accept the sandbox paid-event terms: activation is charged per event and paid sales begin only after payment confirmation.")}
                  </label>
                  <label className="flex items-start gap-3 text-sm leading-relaxed">
                    <Checkbox checked={vm.verification} disabled={vm.paying} onCheckedChange={vm.setVerification} />
                    {t("I agree to simulated identity and payout verification.")}
                  </label>
                  <details className="text-sm text-muted-foreground">
                    <summary className="cursor-pointer underline-offset-4 hover:underline">{t("What is verification?")}</summary>
                    <p className="mt-2 max-w-xl">{t("Verification confirms who receives ticket revenue and where it is paid. For this demo, no documents or bank verification are required.")}</p>
                  </details>
                  {vm.pending && <p className="text-sm text-muted-foreground">{t("The payment page shows the amount for your existing payment attempt.")}</p>}
                  <Button className="min-h-11 w-full whitespace-normal bg-green-700 px-5 text-white hover:bg-green-800 dark:bg-green-400 dark:text-green-950 dark:hover:bg-green-300 sm:w-auto" disabled={!vm.canPay} onClick={vm.pay}>
                    {vm.paying ? <Spinner /> : <CreditCard />}{vm.payLabel}<ArrowRight />
                  </Button>
                </div>
              )}
              {vm.showRefresh && <Button variant="outline" disabled={vm.paying || vm.refreshing} onClick={vm.refresh}>{t("Refresh status")}</Button>}
            </CardContent>
          </Card>
        </section>
      )}
    </>
  )
}

