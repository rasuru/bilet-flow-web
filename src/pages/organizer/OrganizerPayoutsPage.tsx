import { Link } from "wouter"
import { Wallet, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { t } from "@/i18n/locale"
import { OrganizerLayout } from "./OrganizerLayout"
import { useOrganizerPayoutsViewModel } from "./useOrganizerPayoutsViewModel"

export function OrganizerPayoutsPage({ sessionId, accountId }: { sessionId: number; accountId: number }) {
  const m = useOrganizerPayoutsViewModel(sessionId, accountId)
  return (
    <OrganizerLayout isFinances>
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-3xl font-semibold tracking-tight">{t("Finances")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("Manage revenue and payouts across all your events.")}</p></div>
          <Button variant="outline" onClick={m.retry}><RefreshCw />{t("Refresh")}</Button>
        </header>
        {[m.balanceError, m.accountError, m.historyError].filter(Boolean).map((error, i) => <Alert key={i} variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>)}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card className="gap-5 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Wallet className="size-4" />{t("Available balance")}</div>
            {m.balanceLoading ? <Skeleton className="h-12 w-48" /> : m.balance && <>
              <p className="text-4xl font-semibold tracking-tight tabular-nums text-emerald-800 dark:text-emerald-300">{m.balance.available}</p>
              <dl className="grid grid-cols-2 gap-4 border-t pt-4">{m.balance.metrics.map(metric => <div key={metric.label}><dt className="text-sm text-muted-foreground">{metric.label}</dt><dd className="mt-1 font-medium tabular-nums">{metric.value}</dd></div>)}</dl>
              {m.balance.blocked && <Alert><AlertDescription>{t("Payouts are temporarily blocked while payments or refunds are reconciled.")}</AlertDescription></Alert>}
            </>}
            <div className="space-y-2 border-t pt-4">
              <h2 className="font-medium">{t("Payout account")}</h2>
              {m.accountLoading ? <Skeleton className="h-8 w-40" /> : m.account ? <><p className="text-sm">{m.account.holderName}</p><p className="text-sm text-muted-foreground">{m.account.maskedIban}</p></> : !m.accountError && <p className="text-sm text-muted-foreground">{t("You haven’t set up a payout account yet.")}</p>}
              <Link href="/account/settings?from=organizer#payout" className={buttonVariants({ variant: "outline", size: "sm" })}>{t("Payout account")}</Link>
            </div>
          </Card>
          <Card className="gap-4 p-5 sm:p-6">
            <h2 className="text-xl font-semibold">{t("Request payout")}</h2>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); m.submit() }}>
              <div className="space-y-2"><Label htmlFor="payout-amount">{t("Amount (KZT)")}</Label><Input id="payout-amount" inputMode="decimal" value={m.amount} disabled={m.locked} onChange={e => m.setAmount(e.target.value)} aria-invalid={Boolean(m.validation)} aria-describedby={m.validation ? "payout-validation" : undefined} />
                {m.validation && <p id="payout-validation" className="text-sm text-destructive">{m.validation}</p>}</div>
              <div className="flex items-start gap-3"><Checkbox id="payout-consent" checked={m.consent} disabled={m.locked} onCheckedChange={m.setConsent} /><Label htmlFor="payout-consent" className="leading-normal">{t("I understand this payout is simulated and no real money will be transferred.")}</Label></div>
              {m.retrying && <Alert><AlertDescription>{t("A previous request has an uncertain result. Retry it safely before requesting another payout.")}</AlertDescription></Alert>}
              {m.submitError && <p role="alert" className="text-sm text-destructive">{m.submitError}</p>}
              {m.success && <p role="status" className="text-sm">{m.success}</p>}
              <Button type="submit" className="w-full" disabled={!m.canSubmit}>{t(m.submitting ? "Submitting…" : m.retrying ? "Retry payout request" : "Request payout")}</Button>
            </form>
          </Card>
        </div>
        <Card className="gap-4 p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{t("Payout history")}</h2>
          {m.historyLoading ? <Skeleton className="h-24 w-full" /> : m.rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-muted-foreground"><tr><th className="py-3 pr-4 font-medium">{t("Date")}</th><th className="py-3 pr-4 font-medium">{t("Amount")}</th><th className="py-3 pr-4 font-medium">{t("Status")}</th><th className="py-3 font-medium">{t("Details")}</th></tr></thead><tbody>{m.rows.map(row => <tr key={row.id} className="border-b last:border-0"><td className="py-3 pr-4 whitespace-nowrap">{row.date}</td><td className="py-3 pr-4 whitespace-nowrap tabular-nums">{row.amount}</td><td className="py-3 pr-4"><Badge>{row.status}</Badge></td><td className="py-3 text-muted-foreground">{row.completed && <div>{row.completed}</div>}{row.reference && <div className="break-all">{row.reference}</div>}{row.failure && <div className="text-destructive">{row.failure}</div>}</td></tr>)}</tbody></table></div> : !m.historyError && <p className="py-8 text-center text-sm text-muted-foreground">{t("No payouts yet.")}</p>}
          <div className="flex items-center justify-between gap-3"><Button variant="outline" size="sm" disabled={!m.previous} onClick={m.previous ?? undefined}>{t("Previous")}</Button><span className="text-sm text-muted-foreground">{t("Page {0}", m.page)}</span><Button variant="outline" size="sm" disabled={!m.next} onClick={m.next ?? undefined}>{t("Next")}</Button></div>
        </Card>
      </main>
    </OrganizerLayout>
  )
}

