import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { t } from "@/i18n/locale"
import { ArrowUpRightIcon, PlusIcon } from "lucide-react"
import { Link } from "wouter"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useSupportListViewModel } from "./useSupportListViewModel"

type Model = ReturnType<typeof useSupportListViewModel>
function CaseList({ cases, empty }: { cases: Model["cases"]; empty: string }) {
  if (!cases.length)
    return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="divide-y">
      {cases.map((item) => (
        <li key={item.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <Link href={item.href} className="font-medium hover:underline">
                {item.subject}
              </Link>
              <p className="text-xs text-muted-foreground">
                {item.category} · {item.recipient} · {item.status} ·{" "}
                <time dateTime={item.updatedAt}>{item.updatedLabel}</time>
              </p>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {item.preview}
              </p>
            </div>
            <Link
              href={item.href}
              aria-label={t("Open {0}", item.subject)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("View")} <ArrowUpRightIcon aria-hidden="true" />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}
export function SupportListPage({
  sessionId,
  accountId,
}: {
  sessionId: number
  accountId: number
}) {
  const model = useSupportListViewModel(sessionId, accountId)
  return (
    <SitePage width="content">
      <BackLink href="/">{t("Home")}</BackLink>
      <PageHeading
        description={t("Get help and keep track of conversations.")}
        action={
          <Link
            href="/support/new"
            className={buttonVariants({ className: "min-h-10" })}
          >
            <PlusIcon aria-hidden="true" /> {t("New request")}
          </Link>
        }
      >
        {t("Support")}
      </PageHeading>
      {model.loading && (
        <p role="status" className="flex items-center gap-2">
          <Spinner /> {t("Loading requests…")}
        </p>
      )}
      {model.error && (
        <div role="alert" className="flex items-center gap-3">
          {t(model.error)}{" "}
          <Button variant="outline" onClick={model.retry}>
            {t("Try again")}
          </Button>
        </div>
      )}
      {!model.loading && !model.error && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>{t("My requests")}</h2>
              </CardTitle>
              <CardDescription>
                {t("Conversations you've started")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CaseList
                cases={model.cases.filter((c) => c.scope === "MY_REQUESTS")}
                empty={t("You haven’t contacted support yet.")}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>{t("Event support inbox")}</h2>
              </CardTitle>
              <CardDescription>
                {t("Requests from attendees for events you support")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CaseList
                cases={model.cases.filter((c) => c.scope === "EVENT_INBOX")}
                empty={t("No attendee requests.")}
              />
            </CardContent>
          </Card>
          {model.canAccessAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>{t("Platform support inbox")}</h2>
                </CardTitle>
                <CardDescription>
                  {t("Platform requests and escalated attendee cases")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaseList
                  cases={model.cases.filter(
                    (c) => c.scope === "PLATFORM_INBOX"
                  )}
                  empty={t("No platform cases.")}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </SitePage>
  )
}
