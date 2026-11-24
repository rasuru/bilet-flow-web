import { BackLink, SitePage } from "@/components/site/SitePage"
import { t } from "@/i18n/locale"
import { DownloadIcon, PrinterIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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
import { Spinner } from "@/components/ui/spinner"

import { useTicketDetailsViewModel } from "./useTicketDetailsViewModel"

function AdmissionQr({ image, onLoad }: { image: Blob; onLoad: () => void }) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const url = URL.createObjectURL(image)
    element.src = url
    return () => URL.revokeObjectURL(url)
  }, [image])

  return (
    <img
      ref={ref}
      alt={t("Admission QR code")}
      width={224}
      height={224}
      onLoad={onLoad}
      className="size-56 max-w-full rounded-md bg-white object-contain p-2"
    />
  )
}

export function TicketDetailsPage({
  sessionId,
  ticketId,
  verifiedEmail,
}: {
  sessionId: number
  ticketId: string
  verifiedEmail: string | null
}) {
  const model = useTicketDetailsViewModel(sessionId, ticketId, verifiedEmail)
  const [loadedQr, setLoadedQr] = useState<Blob>()

  return (
    <SitePage width="form">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <BackLink href="/my-tickets">{t("My tickets")}</BackLink>

        <Link
          href={`/support/new?ticketId=${encodeURIComponent(ticketId)}`}
          className={buttonVariants({
            variant: "outline",
            className: "print:hidden",
          })}
        >
          {t("Get ticket support")}
        </Link>
      </div>
      {model.status === "loading" && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Spinner aria-hidden="true" /> {t("Loading your ticket…")}
        </p>
      )}
      {model.status === "missing" && (
        <p>{t("This ticket is unavailable in your account.")}</p>
      )}
      {model.status === "error" && (
        <div className="space-y-2">
          <FieldError>{t("Couldn’t load this ticket.")}</FieldError>
          <Button variant="outline" onClick={model.retry}>
            {t("Try again")}
          </Button>
        </div>
      )}
      {model.status === "ready" && (
        <Card className="print:break-inside-avoid print:bg-white print:text-black print:ring-0">
          <CardHeader>
            <CardDescription className="print:text-black">
              {t("BiletFlow ticket")}
            </CardDescription>
            <CardTitle>
              <h1 className="text-[clamp(1.5rem,4vw,2rem)] leading-tight font-semibold">
                {model.title}
              </h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
              <dt>{t("Status")}</dt>
              <dd className="font-semibold">
                {model.statusLabel}
                {model.eventCancelled && " · Event cancelled"}
              </dd>
              {model.date && (
                <>
                  <dt>{t("Starts")}</dt>
                  <dd>
                    <time dateTime={model.date.instant}>
                      {model.date.label}
                    </time>
                  </dd>
                </>
              )}
              {model.venue && (
                <>
                  <dt>{t("Venue")}</dt>
                  <dd>
                    {model.venue.name}
                    <br />
                    {model.venue.address}
                  </dd>
                </>
              )}
              <dt>{t("Attendee")}</dt>
              <dd className="break-all">{model.attendee}</dd>
              <dt>{t("Seating")}</dt>
              <dd>{model.seating}</dd>
            </dl>

            {!model.mayAccessDocument ? (
              <p className="text-muted-foreground">
                {t(
                  "The attendee can open the admission QR and PDF using their verified account."
                )}
              </p>
            ) : !model.forAdmission ? (
              <p>{t("This ticket is currently unavailable for admission.")}</p>
            ) : (
              <div className="space-y-2 rounded-lg border p-4">
                <h2 className="font-semibold">{t("Admission QR code")}</h2>
                {model.qrImage ? (
                  <>
                    <AdmissionQr
                      image={model.qrImage}
                      onLoad={() => setLoadedQr(model.qrImage)}
                    />
                    <p className="font-mono break-all">{model.code}</p>
                  </>
                ) : model.qrError ? (
                  <div className="space-y-2 print:hidden">
                    <FieldError>{t("Couldn’t load the QR code.")}</FieldError>
                    <Button variant="outline" size="sm" onClick={model.retryQr}>
                      {t("Retry QR code")}
                    </Button>
                  </div>
                ) : (
                  <p role="status">{t("Loading QR code…")}</p>
                )}
              </div>
            )}

            <div className="space-y-2 print:hidden">
              {model.downloadError && (
                <FieldError>{model.downloadError}</FieldError>
              )}
              <div className="flex flex-wrap gap-2">
                {model.mayAccessDocument && (
                  <>
                    <Button
                      onClick={model.download}
                      disabled={model.downloading}
                    >
                      <DownloadIcon aria-hidden="true" />
                      {model.downloading
                        ? t("Downloading…")
                        : t("Download PDF")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={model.print}
                      disabled={
                        model.forAdmission &&
                        (!model.qrImage || loadedQr !== model.qrImage)
                      }
                    >
                      <PrinterIcon aria-hidden="true" />
                      {t("Print ticket")}
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  onClick={model.retry}
                  disabled={model.refreshing}
                >
                  {t("Refresh status")}
                </Button>
                {model.eventHref && (
                  <Link
                    href={model.eventHref}
                    className={buttonVariants({ variant: "ghost" })}
                  >
                    {t("View event")}
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </SitePage>
  )
}
