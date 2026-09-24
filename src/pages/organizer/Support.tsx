import { useMemo, useState } from "react"
import {
  ArrowRight,
  CircleHelp,
  Clock3,
  MessageSquare,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart.tsx"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts" //fix color of bar

//Authorized staff shall be able to assign a case and change its status among Open, In Progress, Waiting for Customer, and Resolved.
type SupportStatus = "open" | "inProgress" | "waiting" | "resolved"

//An organizer shall be able to open a platform-support request concerning account, activation, payment, or technical issues.
type SupportCategory = "account" | "activation" | "payment" | "technical"

type SupportCase = {
  id: string
  title: string
  category: SupportCategory
  status: SupportStatus
  preview: string
  updated: string
  event?: string
}

const supportCases: SupportCase[] = [
  {
    id: "1",
    title: "Payment activation issue",
    category: "payment",
    status: "inProgress",
    preview:
      "Example event: payment activation issue",
    updated: "time", // fix later
    event: "example event",
  }
]

const statusLabels: Record<SupportStatus, string> = {
  open: "Open",
  inProgress: "In progress",
  waiting: "Waiting for you",
  resolved: "Resolved",
}

const statusStyles: Record<SupportStatus, string> = {
  open: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  inProgress:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  waiting:
    "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  resolved:
    "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
}

const categoryLabels: Record<SupportCategory, string> = {
  account: "Account",
  activation: "Activation",
  payment: "Payment",
  technical: "Technical",
}

function StatusBadge({ status }: { status: SupportStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}

const summaryChartConfig = {
  value: {
    label: "Cases",
  },
  open: {
    label: "Open",
    color: "hsl(var(--chart-1))",
  },
  inProgress: {
    label: "In progress",
    color: "hsl(var(--chart-2))",
  },
  waiting: {
    label: "Waiting for you",
    color: "hsl(var(--chart-3))",
  },
  resolved: {
    label: "Resolved",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

function SummaryChart({
  summary,
}: {
  summary: {
    open: number
    inProgress: number
    waiting: number
    resolved: number
  }
}) {
  const data = [
    {
      status: "open",
      label: "Open",
      value: summary.open,
      fill: "var(--color-open)",
    },
    {
      status: "inProgress",
      label: "In progress",
      value: summary.inProgress,
      fill: "var(--color-inProgress)",
    },
    {
      status: "waiting",
      label: "Waiting",
      value: summary.waiting,
      fill: "var(--color-waiting)",
    },
    {
      status: "resolved",
      label: "Resolved",
      value: summary.resolved,
      fill: "var(--color-resolved)",
    },
  ]
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">
          Event summary
        </CardTitle>
        <CardDescription>Upcoming, active, and drafted events</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={summaryChartConfig}
          className="h-[220px] w-full"
        >
          <BarChart data={data} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="value" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
function SupportCaseCard({ supportCase }: { supportCase: SupportCase }) {
  return (
    <Card className="group shadow-none transition-colors hover:border-foreground/20">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold tracking-tight">
                  {supportCase.title}
                </h3>

                <StatusBadge status={supportCase.status} />
              </div>

              <p className="text-xs text-muted-foreground">
                Case #{supportCase.id}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>{categoryLabels[supportCase.category]}</span>

            {supportCase.event && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="truncate">{supportCase.event}</span>
              </>
            )}
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground">
            {supportCase.preview}
          </p>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Updated {supportCase.updated}
            </div>

            <Button variant="outline" size="sm" className="gap-2 sm:self-end">
              Open case
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Support() {
  const [activeTab, setActiveTab] = useState<SupportStatus>("open")

  const summary = useMemo(() => {
    return {
      open: supportCases.filter((supportCase) => supportCase.status === "open")
        .length,
      inProgress: supportCases.filter(
        (supportCase) => supportCase.status === "inProgress"
      ).length,
      waiting: supportCases.filter(
        (supportCase) => supportCase.status === "waiting"
      ).length,
      resolved: supportCases.filter(
        (supportCase) => supportCase.status === "resolved"
      ).length,
    }
  }, [])

  const filteredCases = useMemo(() => {
    return supportCases.filter(
      (supportCase) => supportCase.status === activeTab
    )
  }, [activeTab])

  const tabs: SupportStatus[] = ["open", "inProgress", "waiting", "resolved"]

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <CircleHelp className="h-5 w-5 text-muted-foreground" />

              <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
            </div>

            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New support request
            </Button>
          </div>

          <section>
            <SummaryChart summary={summary} />
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Your support cases
              </h2>
            </div>

            <div className="overflow-x-auto border-b">
              <div className="flex min-w-max gap-1">
                {tabs.map((tab) => {
                  const count = supportCases.filter(
                    (supportCase) => supportCase.status === tab
                  ).length

                  const isActive = activeTab === tab

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`relative px-3 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {statusLabels[tab]}

                      <span
                        className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>

                      {isActive && (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {filteredCases.length > 0 ? (
              <div className="space-y-3">
                {filteredCases.map((supportCase) => (
                  <SupportCaseCard
                    key={supportCase.id}
                    supportCase={supportCase}
                  />
                ))}
              </div>
            ) : (
              <Card className="shadow-none">
                <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <h3 className="font-medium">
                    No {statusLabels[activeTab].toLowerCase()} cases
                  </h3>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
