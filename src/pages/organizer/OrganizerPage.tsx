import { t } from "@/i18n/locale"
import { Link } from "wouter"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

import { useOrganizerViewModel } from "./useOrganizerViewModel"

export function OrganizerPage({ sessionId }: { sessionId: number }) {
  const model = useOrganizerViewModel(sessionId)
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <Link href="/" className={buttonVariants({ variant: "ghost" })}>
        {t("Back to home")}
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">
        {t("Organizer dashboard")}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("Your events")}</h2>
          </CardTitle>
          <CardAction>
            <Link href="/organizer/events/new" className={buttonVariants()}>
              {t("Create event")}
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {model.loading && (
            <p role="status" className="flex items-center gap-2">
              <Spinner aria-hidden="true" /> {t("Loading events…")}
            </p>
          )}
          {model.error && (
            <div className="space-y-2">
              <FieldError>{model.error}</FieldError>
              <Button variant="outline" onClick={model.retry}>
                {t("Try again")}
              </Button>
            </div>
          )}
          {!model.loading && !model.error && model.events.length === 0 && (
            <p className="text-muted-foreground">
              {t("You haven’t organized any events yet.")}
            </p>
          )}
          {model.events.length > 0 && (
            <ul className="divide-y">
              {model.events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold break-words">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      <time dateTime={event.startAt}>{event.date}</time> ·{" "}
                      {event.status}
                    </p>
                  </div>
                  <Link
                    href={event.campaignPath}
                    aria-label={t("Manage campaigns for {0}", event.title)}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    {t("Manage campaigns")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

