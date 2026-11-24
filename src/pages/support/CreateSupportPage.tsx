import { useEventReturn } from "@/components/site/useEventReturn"
import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { t } from "@/i18n/locale"
import { Link } from "wouter"
import type { SupportCategory, SupportType } from "@/api/support"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { categories } from "@/support/supportPresentation"
import { useCreateSupportViewModel } from "./useCreateSupportViewModel"

export function CreateSupportPage({
  sessionId,
}: {
  sessionId: number
  accountId: number
}) {
  const model = useCreateSupportViewModel(sessionId)
  const { href: eventReturn } = useEventReturn()
  const returnState = model.returnTo.href.startsWith("/events/")
    ? { eventReturn }
    : undefined
  return (
    <SitePage width="form">
      <BackLink href={model.returnTo.href} state={returnState}>
        {model.returnTo.label}
      </BackLink>
      <PageHeading
        description={t("Describe your issue to start a support conversation.")}
      >
        {t("Contact support")}
      </PageHeading>
      <Card>
        <CardContent>
          <form
            aria-busy={model.busy}
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              model.submit()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="support-recipient">{t("Who can help?")}</Label>
              <NativeSelect
                id="support-recipient"
                value={model.type}
                onChange={(e) => model.setType(e.target.value as SupportType)}
              >
                {model.eventContext && (
                  <NativeSelectOption value="ATTENDEE_SUPPORT">
                    {t("Event organizer")}
                  </NativeSelectOption>
                )}
                <NativeSelectOption value="PLATFORM_SUPPORT">
                  {t("BiletFlow platform support")}
                </NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-category">{t("Issue category")}</Label>
              <NativeSelect
                id="support-category"
                value={model.category}
                onChange={(e) =>
                  model.setCategory(e.target.value as SupportCategory)
                }
              >
                {categories.map((c) => (
                  <NativeSelectOption key={c.value} value={c.value}>
                    {t(c.label)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-subject">{t("Subject")}</Label>
              <Input
                id="support-subject"
                value={model.subject}
                onChange={(e) => model.setSubject(e.target.value)}
                maxLength={255}
                placeholder={t("What do you need help with?")}
                required
              />
            </div>
            {model.links.length > 0 && (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{t("Related to")}</p>
                <div className="flex flex-wrap gap-3">
                  {model.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-primary underline underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <p className="text-muted-foreground">
                  {t("These references will be included in your request.")}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="support-message">{t("Message")}</Label>
              <Textarea
                id="support-message"
                value={model.message}
                onChange={(e) => model.setMessage(e.target.value)}
                maxLength={4000}
                placeholder={t(
                  "Include details that will help support understand the problem…"
                )}
                required
              />
            </div>
            {model.eventContext && !model.links.length && (
              <p className="text-sm text-muted-foreground">
                {t(
                  "For this platform request, include any relevant event or purchase details in your message."
                )}
              </p>
            )}
            {model.error && (
              <p role="alert" className="text-sm text-destructive">
                {t(model.error)}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Link
                href={model.returnTo.href}
                state={returnState}
                className={buttonVariants({ variant: "outline" })}
              >
                {t("Cancel")}
              </Link>
              <Button type="submit" disabled={model.busy}>
                {model.busy ? t("Creating…") : t("Create request")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </SitePage>
  )
}
