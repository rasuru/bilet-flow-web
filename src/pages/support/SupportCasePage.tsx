import { t } from "@/i18n/locale"
import { ArrowLeftIcon, SendIcon } from "lucide-react"
import { Link } from "wouter"
import type { SupportStatus } from "@/api/support"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useSupportCaseViewModel } from "./useSupportCaseViewModel"

export function SupportCasePage({
  sessionId,
  accountId,
  caseId,
}: {
  sessionId: number
  accountId: number
  caseId: string
}) {
  const model = useSupportCaseViewModel(sessionId, accountId, caseId)
  const item = model.case
  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
      <Link href="/support" className={buttonVariants({ variant: "ghost" })}>
        <ArrowLeftIcon aria-hidden="true" /> {t("Support inbox")}
      </Link>
      {model.loading && (
        <p role="status" className="flex items-center gap-2">
          <Spinner /> {t("Loading conversation…")}
        </p>
      )}
      {model.error && (
        <div role="alert">
          {t(model.error)}{" "}
          <Button variant="outline" onClick={model.retry}>
            {t("Try again")}
          </Button>
        </div>
      )}
      {model.missing && (
        <Card>
          <CardHeader>
            <CardTitle>{t("Request not found")}</CardTitle>
            <CardDescription>
              {t("This request is unavailable to your account.")}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {item && (
        <>
          <Card>
            <CardHeader>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {item.staff ? t("Staff inbox") : t("My request")}
              </p>
              <CardTitle>
                <h1 className="text-2xl break-words">{item.subject}</h1>
              </CardTitle>
              <CardDescription>
                {item.category} · {item.recipient} · {item.statusLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.context.length > 0 && (
                <div className="flex flex-wrap gap-3 text-sm">
                  {t("Related:")}{" "}
                  {item.context.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-primary underline underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
              {item.escalated && (
                <p className="text-sm text-muted-foreground">
                  {t("Forwarded to platform support.")}
                </p>
              )}
              {item.staff && (
                <div className="space-y-4 border-t pt-4">
                  <p className="text-sm">
                    {t("Assigned to:")} {item.assignedTo}
                  </p>
                  {item.canReply && (
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="case-status">{t("Case status")}</Label>
                        <NativeSelect
                          id="case-status"
                          value={item.status}
                          disabled={model.busy}
                          onChange={(event) =>
                            model.setStatus(
                              event.currentTarget.value as SupportStatus
                            )
                          }
                        >
                          {item.statusChoices.map((status) => (
                            <NativeSelectOption
                              key={status.value}
                              value={status.value}
                            >
                              {t(status.label)}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </div>
                      <form
                        className="space-y-2"
                        onSubmit={(event) => {
                          event.preventDefault()
                          model.assign()
                        }}
                      >
                        <Label htmlFor="support-agent">
                          {t("Support agent ID")}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="support-agent"
                            inputMode="numeric"
                            value={model.assignee}
                            onChange={(event) =>
                              model.setAssignee(event.currentTarget.value)
                            }
                            disabled={model.busy}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            disabled={model.busy}
                          >
                            {model.assignee.trim()
                              ? t("Assign")
                              : t("Assign to me")}
                          </Button>
                        </div>
                      </form>
                      {item.canEscalate && (
                        <Button
                          variant="outline"
                          disabled={model.busy}
                          onClick={model.escalate}
                        >
                          {t("Escalate to platform support")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {model.actionError && (
                <p role="alert" className="text-sm text-destructive">
                  {t(model.actionError)}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>{t("Conversation")}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ol className="space-y-4" aria-label={t("Case messages")}>
                {item.messages.map((message) => (
                  <li
                    key={message.id}
                    className={`flex ${message.own ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] space-y-2 rounded-xl p-4 sm:max-w-[80%] ${message.own ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-80">
                        <span className="font-semibold">
                          {message.authorLabel}
                        </span>
                        <time dateTime={message.sentAt}>
                          {message.createdLabel}
                        </time>
                      </div>
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              {item.canReply ? (
                <form
                  className="space-y-3 border-t pt-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    model.send()
                  }}
                >
                  <Label htmlFor="support-reply">{t("Your reply")}</Label>
                  <Textarea
                    disabled={model.busy}
                    id="support-reply"
                    value={model.draft}
                    onChange={(e) => model.setDraft(e.target.value)}
                    maxLength={4000}
                    placeholder={t("Write a reply…")}
                    required
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={model.busy}>
                      <SendIcon aria-hidden="true" />{" "}
                      {model.busy ? t("Sending…") : t("Send reply")}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="border-t pt-4 text-sm text-muted-foreground">
                  {t("This request has been resolved. Replies are closed.")}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}


