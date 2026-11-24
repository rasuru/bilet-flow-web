import { CalendarPlus, ChartNoAxesColumn, TicketCheck } from "lucide-react"
import { Link } from "wouter"

import { useSessionViewModel } from "@/auth/useSessionViewModel"
import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { t } from "@/i18n/locale"

const steps = [
  {
    Icon: CalendarPlus,
    title: "Save a draft",
    detail: "Start with the event name and schedule.",
  },
  {
    Icon: TicketCheck,
    title: "Set up tickets",
    detail: "Choose admission, ticket quantities and prices.",
  },
  {
    Icon: ChartNoAxesColumn,
    title: "Run your event",
    detail: "Invite event administrators and track ticket sales.",
  },
]

export function OrganizerStartPage() {
  const session = useSessionViewModel()
  const signedIn = session.status === "signedIn"

  return (
    <SitePage width="content">
      <BackLink href="/">{t("Home")}</BackLink>
      <Card className="gap-6 bg-primary/10 p-5 sm:p-8">
        <PageHeading
          description={t(
            "Create a draft with your BiletFlow account. Add a venue and tickets when you’re ready, then publish from your organizer dashboard."
          )}
        >
          {t("Organize an event")}
        </PageHeading>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/organizer/events/new"
            className={buttonVariants({ className: "min-h-11" })}
          >
            <CalendarPlus aria-hidden="true" />{" "}
            {t(signedIn ? "Create event" : "Sign in to create an event")}
          </Link>
          {signedIn && (
            <Link
              href="/organizer"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-11",
              })}
            >
              {t("Organizer dashboard")}
            </Link>
          )}
        </div>
      </Card>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map(({ Icon, title, detail }) => {
          return (
            <li key={title}>
              <Card className="h-full">
                <CardHeader className="gap-3">
                  <Icon className="size-5" aria-hidden="true" />
                  <h2 className="font-semibold">{t(title)}</h2>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  {t(detail)}
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ol>
    </SitePage>
  )
}
