import {
  CalendarPlus,
  CircleHelp,
  KeyRound,
  LogOut,
  UserRound,
  Wallet,
} from "lucide-react"
import { Link } from "wouter"

import type { AccountResponse } from "@/api/auth"
import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { t } from "@/i18n/locale"
import { ChangePasswordSection } from "./ChangePasswordSection"
import { PayoutAccountSection } from "./PayoutAccountSection"
import { ProfileSection } from "./ProfileSection"
import { useSettingsViewModel } from "./useSettingsViewModel"

const sections = [
  { id: "profile", title: "Profile and contact email", Icon: UserRound },
  { id: "security", title: "Password", Icon: KeyRound },
  { id: "payout", title: "Payout account", Icon: Wallet },
]

export function SettingsPage({
  account,
  sessionId,
}: {
  account: AccountResponse
  sessionId: number
}) {
  const model = useSettingsViewModel(account)
  return (
    <SitePage width="content">
      <BackLink href={model.returnToOrganizer ? "/organizer" : "/"}>
        {t(model.returnToOrganizer ? "Organizer dashboard" : "Home")}
      </BackLink>
      <PageHeading>{t("Account settings")}</PageHeading>
      <div className="grid min-w-0 items-start gap-5 md:grid-cols-[minmax(12rem,15rem)_minmax(0,1fr)]">
        <Card className="md:sticky md:top-5">
          <CardHeader>
            <span className="grid size-11 place-items-center rounded-xl bg-primary/20 text-foreground">
              <UserRound className="size-5" aria-hidden="true" />
            </span>
            <CardTitle className="text-lg break-words">{model.name}</CardTitle>
            {account.email && (
              <p className="text-sm wrap-anywhere text-muted-foreground">
                {account.email}
              </p>
            )}
            <Badge variant="secondary" className="mt-1">
              {t(
                account.activated
                  ? "Account verified"
                  : "Email verification pending"
              )}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <nav aria-label={t("Account settings")} className="grid gap-1">
              {sections.map(({ id, title, Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={buttonVariants({
                    variant: "ghost",
                    className:
                      "h-auto min-h-10 justify-start py-2 text-left whitespace-normal",
                  })}
                >
                  <Icon aria-hidden="true" /> {t(title)}
                </a>
              ))}
            </nav>
            <div className="border-t pt-3">
              <Button
                type="button"
                variant="outline"
                className="min-h-10"
                onClick={model.signOut}
              >
                <LogOut aria-hidden="true" /> {t("Log out")}
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="min-w-0 space-y-4">
          <ProfileSection account={account} sessionId={sessionId} />
          <ChangePasswordSection sessionId={sessionId} />
          <PayoutAccountSection sessionId={sessionId} />
          <div className="flex flex-wrap gap-2">
            <Link
              href="/organizer/start"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-10",
              })}
            >
              <CalendarPlus aria-hidden="true" /> {t("Organize an event")}
            </Link>
            <Link
              href="/support"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-10",
              })}
            >
              <CircleHelp aria-hidden="true" /> {t("Support")}
            </Link>
          </div>
        </div>
      </div>
    </SitePage>
  )
}
