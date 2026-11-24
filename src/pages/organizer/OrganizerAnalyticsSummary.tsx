import { Progress } from "@/components/ui/progress"
import { t } from "@/i18n/locale"
import type { OrganizerAnalyticsReport } from "./useOrganizerAnalyticsViewModel"

type Summary = Pick<
  OrganizerAnalyticsReport,
  "inventory" | "sales" | "attendance"
> & {
  campaignTotals?: { redemptions: string; tickets: string; net: string }
}

export function OrganizerAnalyticsSummary({ summary }: { summary: Summary }) {
  const { inventory, sales, attendance, campaignTotals } = summary
  return (
    <div className="grid overflow-hidden rounded-xl border bg-card lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
      <section className="min-w-0 bg-[#16362e] p-5 text-[#f1faee] sm:p-6">
        <h3 className="text-sm font-medium text-[#c4ddd1]">
          {t("Net demonstration revenue")}
        </h3>
        <p className="mt-2 text-3xl leading-tight font-semibold tracking-tight wrap-anywhere tabular-nums sm:text-4xl">
          {sales.net}
        </p>
        <dl className="mt-5 space-y-2 border-t border-white/25 pt-4 text-sm">
          {[
            [t("Gross sales"), sales.gross],
            [t("Discounts"), sales.discounts],
            [t("Confirmed refunds"), sales.refunds],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex flex-wrap justify-between gap-x-3 gap-y-1"
            >
              <dt className="text-[#c4ddd1]">{label}</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="min-w-0 divide-y px-5 sm:px-6">
        <section className="space-y-2 py-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h3 className="text-sm font-semibold">{t("Ticket inventory")}</h3>
            {inventory.configured && (
              <div className="text-sm font-medium tabular-nums">
                {t("{0} sold", inventory.rate.label)}
              </div>
            )}
          </div>
          {inventory.configured && (
            <Progress
              value={inventory.rate.value}
              aria-label={t("Capacity sold")}
              className="[&_[data-slot=progress-indicator]]:bg-emerald-700 motion-reduce:[&_[data-slot=progress-indicator]]:transition-none dark:[&_[data-slot=progress-indicator]]:bg-emerald-400"
            />
          )}
          <p className="text-sm text-muted-foreground">
            {inventory.configured
              ? t(
                  "{0} sold of {1} capacity · {2} available · {3} held",
                  inventory.sold,
                  inventory.capacity,
                  inventory.remaining,
                  inventory.held
                )
              : t("Ticket inventory is not configured.")}
          </p>
          {inventory.sharedCapacity && (
            <p className="text-xs text-muted-foreground">
              {t("Current inventory for the shared seat category")}
            </p>
          )}
        </section>
        <section className="space-y-1 py-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h3 className="text-sm font-semibold">{t("Attendance")}</h3>
            {attendance && (
              <div className="text-sm font-medium tabular-nums">
                {t("{0} check-in rate", attendance.rate.label)}
              </div>
            )}
          </div>
          {attendance ? (
            <p className="text-sm text-muted-foreground">
              {t(
                "{0} of {1} checked in · {2} not checked in",
                attendance.checkedIn,
                attendance.registered,
                attendance.absent
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {campaignTotals
                ? t("Attendance is available once an event starts.")
                : t("Attendance is available once the event starts.")}
            </p>
          )}
        </section>
        {campaignTotals && (
          <section className="space-y-1 py-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <h3 className="text-sm font-semibold">{t("Campaigns")}</h3>
              <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="text-muted-foreground">
                  {t("Net revenue")}
                </span>
                <span className="font-medium tabular-nums">
                  {campaignTotals.net}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t(
                "{0} confirmed redemptions · {1} attributed tickets",
                campaignTotals.redemptions,
                campaignTotals.tickets
              )}
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
