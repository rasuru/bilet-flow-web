import { CalendarRange, ChartNoAxesColumn, Megaphone } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { t } from "@/i18n/locale"
import { OrganizerAnalyticsSummary } from "./OrganizerAnalyticsSummary"
import {
  useOrganizerAnalyticsViewModel,
  type OrganizerAnalyticsModel,
  type OrganizerAnalyticsReport,
} from "./useOrganizerAnalyticsViewModel"

export function OrganizerAnalyticsPanel({
  sessionId,
  eventId,
}: {
  sessionId: number
  eventId: string
}) {
  const model = useOrganizerAnalyticsViewModel(sessionId, eventId)
  const { report } = model

  return (
    <section className="space-y-5" aria-labelledby="event-analytics">
      <h2 id="event-analytics" className="text-xl font-semibold tracking-tight">
        {t("Event analytics")}
      </h2>
      <AnalyticsFilters model={model} />
      {model.loading && (
        <div
          role="status"
          aria-label={t("Loading analytics…")}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      )}
      {model.error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription className="space-y-2">
            <p>{model.error}</p>
            <Button variant="outline" size="sm" onClick={model.retry}>
              {t("Try again")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {report && (
        <>
          <OrganizerAnalyticsSummary summary={report} />
          <SalesChart
            chart={report.chart}
            metric={model.metric}
            setMetric={model.setMetric}
            undated={report.undated}
          />
          <TicketSalesCard rows={report.ticketSales} />
          <CampaignSalesCard rows={report.campaigns} />
        </>
      )}
    </section>
  )
}

function AnalyticsFilters({ model }: { model: OrganizerAnalyticsModel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 className="flex items-center gap-2">
            <CalendarRange
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            {t("Report filters")}
          </h3>
        </CardTitle>
        <CardDescription>
          {t("Order dates use Kazakhstan time (Asia/Almaty).")}
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">{model.appliedPeriod}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            model.submit()
          }}
        >
          <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto]">
            <Field className="min-w-0 gap-1.5">
              <FieldLabel htmlFor="analytics-from">
                {t("Start date")}
              </FieldLabel>
              <Input
                id="analytics-from"
                type="date"
                className="min-w-0"
                value={model.draft.from}
                onChange={(e) => model.update({ from: e.currentTarget.value })}
              />
            </Field>
            <Field className="min-w-0 gap-1.5">
              <FieldLabel htmlFor="analytics-through">
                {t("End date")}
              </FieldLabel>
              <Input
                id="analytics-through"
                type="date"
                className="min-w-0"
                value={model.draft.through}
                aria-invalid={Boolean(model.dateError)}
                aria-describedby={
                  model.dateError ? "analytics-date-error" : undefined
                }
                onChange={(e) =>
                  model.update({ through: e.currentTarget.value })
                }
              />
            </Field>
            <Field className="min-w-0 gap-1.5">
              <FieldLabel htmlFor="analytics-ticket-type">
                {t("Ticket type")}
              </FieldLabel>
              <NativeSelect
                id="analytics-ticket-type"
                className="w-full"
                value={model.draft.ticketTypeId}
                disabled={model.ticketTypesLoading || model.ticketTypesError}
                onChange={(e) =>
                  model.update({ ticketTypeId: e.currentTarget.value })
                }
              >
                <NativeSelectOption value="">
                  {t("All ticket types")}
                </NativeSelectOption>
                {model.ticketTypes.map(({ id, name }) => (
                  <NativeSelectOption key={id} value={id}>
                    {name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={Boolean(model.dateError)}>
                {t("Apply filters")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!model.showReset}
                onClick={model.reset}
              >
                {t("Reset")}
              </Button>
            </div>
          </div>
          {model.dateError && (
            <FieldError id="analytics-date-error" className="mt-2">
              {model.dateError}
            </FieldError>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

function SalesChart({
  chart,
  metric,
  setMetric,
  undated,
}: {
  chart: OrganizerAnalyticsReport["chart"]
  metric: OrganizerAnalyticsModel["metric"]
  setMetric: OrganizerAnalyticsModel["setMetric"]
  undated: string | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 className="flex items-center gap-2">
            <ChartNoAxesColumn
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />{" "}
            {t("Sales over time")}
          </h3>
        </CardTitle>
        <CardDescription>{t("By order date")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {chart.length ? (
          <>
            <div
              role="group"
              aria-label={t("Sales chart metric")}
              className="flex flex-wrap gap-2"
            >
              {(
                [
                  ["tickets", t("Tickets sold")],
                  ["grossKzt", t("Gross sales")],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={metric === value ? "secondary" : "outline"}
                  aria-pressed={metric === value}
                  onClick={() => setMetric(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <figure>
              <div
                aria-hidden="true"
                className="relative h-36 rounded-t-md border-b bg-muted/25 px-2 sm:h-44 sm:px-4"
              >
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-evenly">
                  <span className="border-t border-dashed" />
                  <span className="border-t border-dashed" />
                  <span className="border-t border-dashed" />
                </div>
                <div className="relative flex h-full items-end gap-1.5 pt-4 sm:gap-2.5">
                  {chart.map((point) => (
                    <div
                      key={point.key}
                      className="flex h-full max-w-28 min-w-0 flex-1 items-end"
                      title={t("{0} · {1}", point.period, point.amount)}
                    >
                      <span
                        className="w-full rounded-t-sm bg-emerald-700 dark:bg-emerald-400"
                        style={{ height: `${point.height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <figcaption
                className="flex gap-1.5 px-2 pt-2 text-xs text-muted-foreground sm:gap-2.5 sm:px-4"
                aria-hidden="true"
              >
                {chart.map((point) => (
                  <span
                    key={point.key}
                    className="max-w-28 min-w-0 flex-1 whitespace-nowrap"
                  >
                    {point.showLabel ? point.label : null}
                  </span>
                ))}
              </figcaption>
            </figure>
            <details className="rounded-lg border px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium">
                {t("View chart values")}
              </summary>
              <dl className="mt-2 max-h-64 divide-y overflow-y-auto">
                {chart.map((point) => (
                  <div
                    key={point.key}
                    className="flex flex-wrap justify-between gap-2 py-2 text-sm"
                  >
                    <dt>{point.period}</dt>
                    <dd className="tabular-nums">{point.amount}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("No dated sales for these filters.")}
          </p>
        )}
        {undated && <p className="text-xs text-muted-foreground">{undated}</p>}
      </CardContent>
    </Card>
  )
}

const headerCell =
  "px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap"
const amountCell = "px-3 py-3 text-right whitespace-nowrap tabular-nums"

const ticketSalesColumns = [
  { key: "tickets", label: "Tickets sold" },
  { key: "net", label: "Net revenue" },
  { key: "gross", label: "Gross sales" },
  { key: "discounts", label: "Discounts" },
  { key: "refunds", label: "Confirmed refunds" },
] as const

function TicketSalesCard({
  rows,
}: {
  rows: OrganizerAnalyticsReport["ticketSales"]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 id="analytics-ticket-sales">{t("Sales by ticket type")}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div
            className="overflow-x-auto rounded-lg border focus-visible:outline-ring"
            role="region"
            tabIndex={0}
            aria-labelledby="analytics-ticket-sales"
          >
            <table
              aria-labelledby="analytics-ticket-sales"
              className="w-full min-w-max"
            >
              <thead className="bg-muted/55">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                  >
                    {t("Ticket type")}
                  </th>
                  {ticketSalesColumns.map(({ key, label }) => (
                    <th key={key} scope="col" className={headerCell}>
                      {t(label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id} className="first:border-t">
                    <th
                      scope="row"
                      className="max-w-56 px-3 py-3 text-left font-medium wrap-anywhere"
                    >
                      {row.name}
                    </th>
                    {ticketSalesColumns.map(({ key }) => (
                      <td key={key} className={amountCell}>
                        {row[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("This event has no ticket types yet.")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function CampaignSalesCard({
  rows,
}: {
  rows: OrganizerAnalyticsReport["campaigns"]
}) {
  const headings = [
    t("Confirmed redemptions"),
    t("Attributed tickets"),
    t("Net revenue"),
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3 id="analytics-campaign-sales" className="flex items-center gap-2">
            <Megaphone
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />{" "}
            {t("Campaigns and promo codes")}
          </h3>
        </CardTitle>
        <CardDescription>
          {t("Attribution for the selected orders and ticket types")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length ? (
          <div
            className="overflow-x-auto rounded-lg border focus-visible:outline-ring"
            role="region"
            tabIndex={0}
            aria-labelledby="analytics-campaign-sales"
          >
            <table
              aria-labelledby="analytics-campaign-sales"
              className="w-full min-w-max"
            >
              <thead className="bg-muted/55">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                  >
                    {t("Campaign or code")}
                  </th>
                  {headings.map((label) => (
                    <th key={label} scope="col" className={headerCell}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              {rows.map((row) => (
                <tbody key={row.id} className="border-t">
                  <tr className="font-semibold">
                    <th
                      scope="row"
                      className="max-w-56 px-3 py-3 text-left wrap-anywhere"
                    >
                      {row.name}
                    </th>
                    <td className={amountCell}>{row.redemptions}</td>
                    <td className={amountCell}>{row.tickets}</td>
                    <td className={amountCell}>{row.net}</td>
                  </tr>
                  {row.codes.map((code) => (
                    <tr
                      key={code.code}
                      className="border-t text-muted-foreground"
                    >
                      <th
                        scope="row"
                        className="px-6 py-2 text-left font-mono text-xs font-medium"
                      >
                        {code.code}
                      </th>
                      <td className={amountCell}>{code.redemptions}</td>
                      <td className={amountCell}>{code.tickets}</td>
                      <td className={amountCell}>{code.net}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("No confirmed redemptions for these filters.")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

