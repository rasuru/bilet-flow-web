import { t } from "@/i18n/locale"
import { ArrowLeftIcon, DownloadIcon, LinkIcon } from "lucide-react"
import { useState } from "react"
import { Link } from "wouter"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

import { manageEventPath } from "./organizerEventPresentation"
import { CampaignForm } from "./CampaignForm"
import {
  useCampaignActions,
  useCampaignsViewModel,
  type CampaignItem,
} from "./useCampaignsViewModel"

export function EventCampaignsPage({
  sessionId,
  eventId,
}: {
  sessionId: number
  eventId: string
}) {
  const model = useCampaignsViewModel(sessionId, eventId)
  const [showForm, setShowForm] = useState(false)
  const canCreate =
    model.event &&
    model.event.status !== "CANCELLED" &&
    !model.loading &&
    !model.error

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <Link
        href={manageEventPath(eventId)}
        className={buttonVariants({ variant: "ghost" })}
      >
        <ArrowLeftIcon aria-hidden="true" /> {t("Manage event")}
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("Campaigns")}
          </h1>
          {model.event && (
            <p className="text-muted-foreground">{model.event.title}</p>
          )}
        </div>
        {canCreate && (
          <Button
            variant={showForm ? "outline" : "default"}
            aria-expanded={showForm}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? t("Close form") : t("New campaign")}
          </Button>
        )}
      </header>
      {model.loading && (
        <p role="status" className="flex items-center gap-2">
          <Spinner aria-hidden="true" /> {t("Loading campaigns…")}
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
      {showForm && canCreate && (
        <CampaignForm
          sessionId={sessionId}
          eventId={eventId}
          ticketTypes={model.ticketTypes}
          ticketTypesLoading={model.ticketTypesLoading}
          ticketTypesError={model.ticketTypesError}
          retryTicketTypes={model.retryTicketTypes}
          onCreated={() => setShowForm(false)}
        />
      )}
      {!model.loading && !model.error && model.campaigns.length === 0 && (
        <Card>
          <CardContent>
            <p className="text-muted-foreground">
              {t("This event has no campaigns yet.")}
            </p>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4 empty:hidden">
        {model.campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            sessionId={sessionId}
            eventId={eventId}
            campaign={campaign}
          />
        ))}
      </div>
    </main>
  )
}

function CampaignCard({
  sessionId,
  eventId,
  campaign,
}: {
  sessionId: number
  eventId: string
  campaign: CampaignItem
}) {
  const actions = useCampaignActions(sessionId, eventId, campaign.id)
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>
              <h2 className="break-words">{campaign.name}</h2>
            </CardTitle>
            <CardDescription>
              {campaign.discount} · {campaign.status}
            </CardDescription>
          </div>
          {campaign.canEnd && !actions.confirmEnd && (
            <Button
              variant="outline"
              size="sm"
              disabled={actions.pending}
              onClick={() => actions.setConfirmEnd(true)}
            >
              {t("End campaign")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.confirmEnd && campaign.canEnd && (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm">
              {t(
                "End this campaign permanently? Its promo codes will stop accepting new redemptions."
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={actions.pending}
                onClick={() => actions.run({ kind: "end" })}
              >
                {t("End permanently")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={actions.pending}
                onClick={() => actions.setConfirmEnd(false)}
              >
                {t("Keep campaign")}
              </Button>
            </div>
          </div>
        )}
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("Validity")}</dt>
            <dd>{campaign.dates}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("Eligible tickets")}</dt>
            <dd>{campaign.ticketTypes}</dd>
          </div>
        </dl>
        <dl className="grid grid-cols-2 gap-3 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-3">
          {campaign.metrics.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        {campaign.codes.map((code) => (
          <div className="space-y-3" key={code.id}>
            <Separator />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("Promo code ·")}{" "}
                {code.enabled ? t("Enabled") : t("Disabled")}
              </p>
              <code className="font-semibold select-all">{code.code}</code>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={actions.pending}
                onClick={() =>
                  actions.run({ kind: "copy", value: code.code, isLink: false })
                }
              >
                {t("Copy code")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actions.pending}
                onClick={() =>
                  actions.run({
                    kind: "copy",
                    value: code.sharePath,
                    isLink: true,
                  })
                }
              >
                <LinkIcon aria-hidden="true" /> {t("Copy campaign link")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={actions.pending}
                onClick={() =>
                  actions.run({
                    kind: "download",
                    codeId: code.id,
                    code: code.code,
                  })
                }
              >
                <DownloadIcon aria-hidden="true" /> {t("Download campaign QR")}
              </Button>
              {code.canToggle && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={actions.pending}
                  onClick={() =>
                    actions.run({
                      kind: "toggle",
                      codeId: code.id,
                      enabled: !code.enabled,
                    })
                  }
                >
                  {code.enabled ? t("Disable code") : t("Enable code")}
                </Button>
              )}
            </div>
          </div>
        ))}
        {actions.message && (
          <p role="status" className="text-sm">
            {t(actions.message)}
          </p>
        )}
        {actions.error && <FieldError>{actions.error}</FieldError>}
      </CardContent>
    </Card>
  )
}
