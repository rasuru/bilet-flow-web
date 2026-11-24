import { RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { t } from "@/i18n/locale"
import { useEventHistoryViewModel } from "./useEventHistoryViewModel"

export function OrganizerEventHistory({ sessionId, eventId }: { sessionId: number; eventId: string }) {
  const vm = useEventHistoryViewModel(sessionId, eventId)
  return (
    <section id="organizer-history" aria-labelledby="event-history-title" className="scroll-mt-4">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle><h2 id="event-history-title" className="text-lg">{t("Activity history")}</h2></CardTitle>
          <Button variant="outline" disabled={!vm.canRefresh} onClick={vm.refresh}><RefreshCwIcon aria-hidden="true" />{t("Refresh")}</Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-2"><Label htmlFor="history-category">{t("Activity type")}</Label>
              <NativeSelect id="history-category" className="w-full" value={vm.category} onChange={e => vm.setCategory(e.target.value)}>
                {vm.categories.map(option => <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>)}
              </NativeSelect>
            </div>
            <div className="space-y-2"><Label htmlFor="history-from">{t("From date")}</Label><Input id="history-from" type="date" value={vm.from} onChange={e => vm.setFrom(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="history-to">{t("Through date")}</Label><Input id="history-to" type="date" value={vm.to} onChange={e => vm.setTo(e.target.value)} /></div>
            <Button variant="ghost" onClick={vm.clear}>{t("Clear filters")}</Button>
          </div>
          {vm.loading && <p role="status" className="flex items-center gap-2 text-sm"><Spinner />{t("Loading activity…")}</p>}
          {vm.error && <p role="alert" className="text-sm text-destructive">{vm.error}</p>}
          {vm.empty && <p className="py-4 text-sm text-muted-foreground">{t("No activity matches these filters.")}</p>}
          {!vm.error && <ol className="space-y-0" aria-busy={vm.refreshing}>
            {vm.entries.map(entry => (
              <li key={entry.id} className="relative ml-2 grid gap-2 border-l border-border pb-6 pl-5 last:border-transparent last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto]">
                <span aria-hidden="true" className="absolute -left-1.5 top-1.5 size-3 rounded-full border-2 border-card bg-muted-foreground" />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-medium wrap-anywhere">{entry.action}</p><Badge variant="outline">{entry.category}</Badge></div>
                  {entry.description && <p className="text-sm wrap-anywhere">{entry.description}</p>}
                  <p className="text-xs text-muted-foreground wrap-anywhere">{entry.actor}</p>
                  <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">{t("Affected record")}</summary><p className="mt-1 break-all">{entry.entity}</p></details>
                </div>
                <time dateTime={entry.timestamp} className="text-sm text-muted-foreground sm:text-right">{entry.date}</time>
              </li>
            ))}
          </ol>}
          {vm.capped && <p className="text-sm text-muted-foreground">{t("Only the newest 10,000 matching entries can be viewed. Narrow the filters to see older activity.")}</p>}
          {(vm.range || vm.previous) && <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted-foreground">{vm.range}</p><div className="flex gap-2"><Button variant="outline" disabled={!vm.previous} onClick={vm.goPrevious}>{t("Previous")}</Button><Button variant="outline" disabled={!vm.next} onClick={vm.goNext}>{t("Next")}</Button></div></div>}
        </CardContent>
      </Card>
    </section>
  )
}

