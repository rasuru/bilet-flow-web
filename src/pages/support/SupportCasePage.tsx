import { ArrowLeftIcon, SendIcon } from "lucide-react"
import { Link } from "wouter"
import type { SupportStatus } from "@/api/support"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { statuses } from "@/support/supportPresentation"
import { useSupportCaseViewModel } from "./useSupportCaseViewModel"

export function SupportCasePage({ sessionId, accountId, caseId }: { sessionId: number; accountId: number; caseId: string }) {
  const model = useSupportCaseViewModel(sessionId, accountId, caseId)
  const item = model.case
  return <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
    <Link href="/support" className={buttonVariants({ variant: "ghost" })}><ArrowLeftIcon aria-hidden="true" /> Support inbox</Link>
    {model.loading && <p role="status" className="flex items-center gap-2"><Spinner /> Loading conversation…</p>}
    {model.error && <div role="alert">Couldn’t load this conversation. <Button variant="outline" onClick={model.retry}>Try again</Button></div>}
    {model.missing && <Card><CardHeader><CardTitle>Request not found</CardTitle><CardDescription>This request is unavailable in your demo inbox.</CardDescription></CardHeader></Card>}
    {item && <>
      <Card><CardHeader><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.staff ? "Staff inbox · demo" : "My request · demo"}</p><CardTitle><h1 className="text-2xl break-words">{item.subject}</h1></CardTitle><CardDescription>{item.category} · {item.recipient === "PLATFORM" ? "Platform support · " : item.recipient === "ORGANIZER" ? "Event organizer · " : ""}{item.statusLabel}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {item.context.length > 0 && <div className="flex flex-wrap gap-3 text-sm">Related: {item.context.map((link) => <Link key={link.href} href={link.href} className="text-primary underline underline-offset-4">{link.label}</Link>)}</div>}
          {item.staff && <div className="flex flex-wrap items-end gap-4 border-t pt-4">
            <div className="space-y-2"><Label htmlFor="case-status">Case status</Label><NativeSelect id="case-status" value={item.status} disabled={model.busy} onChange={(e) => model.setStatus(e.target.value as SupportStatus)}>{statuses.map((s) => <NativeSelectOption key={s.value} value={s.value}>{s.label}</NativeSelectOption>)}</NativeSelect></div>
            <div className="space-y-2"><p className="text-sm font-medium">Assigned to: {item.assignedTo}</p><Button size="sm" variant="outline" disabled={model.busy} onClick={() => model.setAssignment(item.assignedTo === "Demo staff" ? null : "Demo staff")}>{item.assignedTo === "Demo staff" ? "Unassign" : "Assign to me (demo)"}</Button></div>
          </div>}
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle><h2>Conversation</h2></CardTitle><CardDescription>Messages are saved locally; no one else receives them.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <ol className="space-y-4" aria-label="Case messages">{item.messages.map((message) => <li key={message.id} className={`flex ${message.own ? "justify-end" : "justify-start"}`}><div className={`max-w-[90%] space-y-2 rounded-xl p-4 sm:max-w-[80%] ${message.own ? "bg-primary text-primary-foreground" : "bg-muted"}`}><div className="flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-80"><span className="font-semibold">{message.authorLabel}</span><time dateTime={message.createdAt}>{message.createdLabel}</time></div><p className="whitespace-pre-wrap break-words text-sm">{message.content}</p></div></li>)}</ol>
          {item.canReply ? <form className="space-y-3 border-t pt-4" onSubmit={(e) => { e.preventDefault(); model.send() }}><Label htmlFor="support-reply">Your reply</Label><Textarea id="support-reply" value={model.draft} onChange={(e) => model.setDraft(e.target.value)} maxLength={5000} placeholder="Write a reply…" required /><div className="flex justify-end"><Button type="submit" disabled={model.busy}><SendIcon aria-hidden="true" /> {model.busy ? "Sending…" : "Send reply"}</Button></div></form> : <p className="border-t pt-4 text-sm text-muted-foreground">This request has been resolved. Replies are closed.</p>}
          {model.actionError && <p role="alert" className="text-sm text-destructive">{model.actionError}</p>}
        </CardContent>
      </Card>
    </>}
  </main>
}


