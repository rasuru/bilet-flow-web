import { ArrowLeftIcon, ArrowUpRightIcon, PlusIcon } from "lucide-react"
import { Link } from "wouter"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useSupportListViewModel } from "./useSupportListViewModel"

type Model = ReturnType<typeof useSupportListViewModel>
function CaseList({ cases, empty }: { cases: Model["cases"]; empty: string }) {
  if (!cases.length) return <p className="text-sm text-muted-foreground">{empty}</p>
  return <ul className="divide-y">{cases.map((item) => <li key={item.id} className="py-4 first:pt-0 last:pb-0">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <Link href={item.href} className="font-medium hover:underline">{item.subject}</Link>
        <p className="text-xs text-muted-foreground">{item.category} · {item.recipient === "PLATFORM" ? "Platform support · " : item.recipient === "ORGANIZER" ? "Event organizer · " : ""}{item.status} · <time dateTime={item.updatedAt}>{item.updatedLabel}</time></p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.preview}</p>
      </div>
      <Link href={item.href} aria-label={`Open ${item.subject}`} className={buttonVariants({ variant: "outline", size: "sm" })}>View <ArrowUpRightIcon aria-hidden="true" /></Link>
    </div>
  </li>)}</ul>
}
export function SupportListPage({ sessionId, accountId }: { sessionId: number; accountId: number }) {
  const model = useSupportListViewModel(sessionId, accountId)
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
    <Link href="/" className={buttonVariants({ variant: "ghost" })}><ArrowLeftIcon aria-hidden="true" /> Home</Link>
    <header className="flex flex-wrap items-start justify-between gap-3"><div className="space-y-1"><h1 className="text-3xl font-bold tracking-tight">Support</h1><p className="text-sm text-muted-foreground">Get help and keep track of conversations.</p></div>
      <Link href="/support/new" className={buttonVariants()}><PlusIcon aria-hidden="true" /> New request</Link>
    </header>
    <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Demo mode: cases and messages are stored in this browser. They are not sent to BiletFlow support.</p>
    {model.loading && <p role="status" className="flex items-center gap-2"><Spinner /> Loading requests…</p>}
    {model.error && <div role="alert" className="flex items-center gap-3">Couldn’t load requests. <Button variant="outline" onClick={model.retry}>Try again</Button></div>}
    {!model.loading && !model.error && <div className="space-y-5">
      <Card><CardHeader><CardTitle><h2>My requests</h2></CardTitle><CardDescription>Conversations you've started</CardDescription></CardHeader><CardContent><CaseList cases={model.cases.filter((c) => c.scope === "MY_REQUESTS")} empty="You haven’t contacted support yet." /></CardContent></Card>
      <Card><CardHeader><CardTitle><h2>Event support inbox</h2></CardTitle><CardDescription>Sample attendee conversations for organizer staff</CardDescription></CardHeader><CardContent><CaseList cases={model.cases.filter((c) => c.scope === "EVENT_INBOX")} empty="No attendee requests." /></CardContent></Card>
      <Card><CardHeader><CardTitle><h2>Platform support inbox</h2></CardTitle><CardDescription>Sample cases for platform administrators</CardDescription></CardHeader><CardContent><CaseList cases={model.cases.filter((c) => c.scope === "PLATFORM_INBOX")} empty="No platform cases." /></CardContent></Card>
    </div>}
  </main>
}


