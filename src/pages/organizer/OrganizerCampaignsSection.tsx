import { ArrowRight } from "lucide-react"
import { Link } from "wouter"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { t } from "@/i18n/locale"
import { useCampaignsViewModel } from "./useCampaignsViewModel"

export function OrganizerCampaignsSection({
  sessionId,
  eventId,
  campaignsPath,
  dashboardFilters,
}: {
  sessionId: number
  eventId: string
  campaignsPath: string
  dashboardFilters: string
}) {
  const model = useCampaignsViewModel(sessionId, eventId)

  return (
    <section id="organizer-campaigns" aria-labelledby="organizer-campaigns-title" className="scroll-mt-4">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            <h2 id="organizer-campaigns-title" className="text-lg">{t("Campaigns")}</h2>
          </CardTitle>
          <Link
            href={campaignsPath}
            state={{ organizerEventFilters: dashboardFilters }}
            className={buttonVariants({ variant: "outline", className: "min-h-10" })}
          >
            {t("Manage campaigns")} <ArrowRight aria-hidden="true" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {model.loading && (
            <p role="status" className="flex items-center gap-2 text-sm">
              <Spinner aria-hidden="true" /> {t("Loading campaigns…")}
            </p>
          )}
          {model.error && (
            <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
              <p>{model.error}</p>
              <Button variant="outline" size="sm" onClick={model.retry}>{t("Try again")}</Button>
            </div>
          )}
          {!model.loading && !model.error && model.campaigns.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("This event has no campaigns yet.")}</p>
          )}
          <ul className="space-y-3 empty:hidden">
            {model.campaigns.map(({ id, name, discount, status }) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-3 py-1">
                <div className="min-w-0">
                  <p className="font-medium wrap-anywhere">{name}</p>
                  <p className="text-sm text-muted-foreground">{discount}</p>
                </div>
                <Badge variant="outline">{status}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
