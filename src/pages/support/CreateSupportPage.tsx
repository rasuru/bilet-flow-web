import { ArrowLeftIcon } from "lucide-react"
import { Link } from "wouter"
import type { SupportCategory } from "@/api/support"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { categories, contextLinks } from "@/support/supportPresentation"
import { useCreateSupportViewModel } from "./useCreateSupportViewModel"

export function CreateSupportPage({ sessionId, accountId }: { sessionId: number; accountId: number }) {
  const model = useCreateSupportViewModel(sessionId, accountId)
  return <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
    <Link href="/support" className={buttonVariants({ variant: "ghost" })}><ArrowLeftIcon aria-hidden="true" /> All requests</Link>
    <Card><CardHeader><CardTitle><h1 className="text-2xl">Contact support</h1></CardTitle><CardDescription>Describe your issue. A conversation will be created in your support inbox (demo only).</CardDescription></CardHeader>
    <CardContent><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); model.submit() }}>
      <div className="space-y-2"><Label htmlFor="support-recipient">Who can help?</Label><NativeSelect id="support-recipient" value={model.recipient} onChange={(e) => model.setRecipient(e.target.value as "ORGANIZER" | "PLATFORM")}><NativeSelectOption value="ORGANIZER">Event organizer</NativeSelectOption><NativeSelectOption value="PLATFORM">BiletFlow platform support</NativeSelectOption></NativeSelect></div>
      <div className="space-y-2"><Label htmlFor="support-category">Issue category</Label><NativeSelect id="support-category" value={model.category} onChange={(e) => model.setCategory(e.target.value as SupportCategory)}>{categories.map((c) => <NativeSelectOption key={c.value} value={c.value}>{c.label}</NativeSelectOption>)}</NativeSelect></div>
      <div className="space-y-2"><Label htmlFor="support-subject">Subject</Label><Input id="support-subject" value={model.subject} onChange={(e) => model.setSubject(e.target.value)} maxLength={120} placeholder="What do you need help with?" required /></div>
      {contextLinks(model.context).length > 0 && <div className="space-y-1 text-sm"><p className="font-medium">Related to</p><div className="flex flex-wrap gap-3">{contextLinks(model.context).map((link) => <Link key={link.href} href={link.href} className="text-primary underline underline-offset-4">{link.label}</Link>)}</div><p className="text-muted-foreground">These references will be included in your request.</p></div>}
      <div className="space-y-2"><Label htmlFor="support-message">Message</Label><Textarea id="support-message" value={model.message} onChange={(e) => model.setMessage(e.target.value)} maxLength={5000} placeholder="Include details that will help support understand the problem…" required /></div>
      {model.error && <p role="alert" className="text-sm text-destructive">{model.error}</p>}
      <div className="flex justify-end gap-2"><Link href="/support" className={buttonVariants({ variant: "outline" })}>Cancel</Link><Button type="submit" disabled={model.busy}>{model.busy ? "Creating…" : "Create request"}</Button></div>
    </form></CardContent></Card>
  </main>
}


