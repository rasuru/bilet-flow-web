import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  FileEdit,
  LayoutDashboard,
  MapPin,
  Plus,
  Settings,
  Ticket,
  UserCircle,
  Users,
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
} from "@/components/ui/chart"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type EventStatus = "upcoming" | "active" | "draft"
  | "completed" | "cancelled"

type EventVisibility = "public" | "unlisted" | "private"

type Event = {
  id: number
  title: string
  status: EventStatus
  visibility?: EventVisibility
  date: string
  time: string
  venue?: string
  admission: string
  setupComplete?: boolean
  ticketTypesConfigured?: boolean
  ticketsSold?: number
  ticketCapacity?: number
}

const events: Event[] = [
  {
    id: 1,
    title: "Title",
    status: "active",
    visibility: "public",
    date: "date",
    time: "18:00",
    venue: "Place",
    admission: "general",
    setupComplete: true,
    ticketTypesConfigured: true,
    ticketsSold: 500,
    ticketCapacity: 500,
  },
]

const statusLabels: Record<EventStatus, string> = {
  upcoming: "Upcoming",
  active: "Active",
  draft: "Draft",
  completed: "Completed",
  cancelled: "Cancelled",
}

const statusStyles: Record<EventStatus, string> = {
  upcoming: "bg-blue-50 text-blue-700",
  active: "bg-green-50 text-green-700",
  draft: "bg-orange-50 text-orange-700",
  completed: "bg-stone-100 text-stone-700",
  cancelled: "bg-red-50 text-red-700",
}

function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}

function VisibilityBadge({ visibility }: { visibility?: EventVisibility }) {
  if (!visibility) return null

  return (
    <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
    </span>
  )
}

function MenuSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            BiletFlow
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Organizer</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton>
                <CalendarDays />
                <span>Events</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <CircleHelp />
                <span>Support</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-auto py-2.5">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">Organizer</p>
                <p className="truncate text-xs text-muted-foreground">
                  Manage profile
                </p>
              </div>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

const summaryChartConfig = {
  value: {
    label: "Events",
  },
  upcoming: {
    label: "Upcoming",
    color: "hsl(var(--chart-1))",
  },
  active: {
    label: "Active",
    color: "hsl(var(--chart-2))",
  },
  drafts: {
    label: "Drafts",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

function SummaryChart({
                        summary,
                      }: {
  summary: { upcoming: number; active: number; drafts: number }
}) {
  const data = [
    { status: "upcoming", label: "Upcoming", value: summary.upcoming, fill: "var(--color-upcoming)" },
    { status: "active", label: "Active", value: summary.active, fill: "var(--color-active)" },
    { status: "drafts", label: "Drafts", value: summary.drafts, fill: "var(--color-drafts)" },
  ]

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">
          Event summary
        </CardTitle>
        <CardDescription>
          Upcoming, active, and drafted events
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={summaryChartConfig} className="h-[220px] w-full">
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

function EventCard({ event }: { event: Event }) {
  const isDraft = event.status === "draft"
  const isCompleted = event.status === "completed"
  const isCancelled = event.status === "cancelled"
  const isUnlisted = event.visibility === "unlisted"

  return (
    <Card className="group shadow-none transition-colors hover:border-foreground/20">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight">
                  {event.title}
                </h3>
                <StatusBadge status={event.status} />
                <VisibilityBadge visibility={event.visibility} />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`More options for ${event.title}`}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>
                {event.date} · {event.time}
              </span>
            </div>

            {event.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span>{event.admission}</span>
            </div>
          </div>

          {isDraft && (
            <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-3 dark:border-orange-900 dark:bg-orange-950/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                    Setup incomplete
                  </p>
                  {!event.ticketTypesConfigured && (
                    <p className="mt-0.5 text-xs text-orange-800/80 dark:text-orange-300/80">
                      No ticket types configured
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {event.ticketsSold !== undefined &&
            event.ticketCapacity !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Ticket inventory
                  </span>
                  <span className="font-medium">
                    {event.ticketsSold} / {event.ticketCapacity} sold
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (event.ticketsSold / event.ticketCapacity) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            {isDraft ? (
              <Button size="sm" className="gap-2">
                <FileEdit className="h-4 w-4" />
                Continue setup
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <>
                <Button size="sm">
                  {isCompleted || isCancelled ? "View event" : "Manage event"}
                </Button>

                {!isCompleted && !isCancelled && !isUnlisted && (
                  <Button variant="outline" size="sm">
                    View event
                  </Button>
                )}

                {isUnlisted && (
                  <Button variant="outline" size="sm" className="gap-2">
                    <Copy className="h-3.5 w-3.5" />
                    Copy link
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NeedsAttention() {
  const attentionItems = [
    {
      type: "soon",
      title: "Title",
      description: "Event is currently active",
      action: "Open event",
    },
  ]

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Needs attention
        </h2>
        <p className="text-sm text-muted-foreground">
          Important things that may need your attention.
        </p>
      </div>

      <div className="space-y-2">
        {attentionItems.map((item) => (
          <Card key={item.title} className="shadow-none">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {item.type === "warning" ? (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  ) : (
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" className="shrink-0">
                {item.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<EventStatus>("upcoming")

  const summary = useMemo(() => {
    return {
      upcoming: events.filter((event) => event.status === "upcoming").length,
      active: events.filter((event) => event.status === "active").length,
      drafts: events.filter((event) => event.status === "draft").length,
    }
  }, [])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => event.status === activeTab)
  }, [activeTab])

  const tabs: EventStatus[] = [
    "upcoming",
    "active",
    "draft",
    "completed",
    "cancelled",
  ]

  return (
    <SidebarProvider>
      <MenuSidebar />

      <SidebarInset className="bg-muted/30">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="lg:hidden">
                <span className="font-semibold">BiletFlow</span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>

              <Button variant="ghost" className="gap-2">
                <UserCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Organizer</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">
                Organizer
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Organizer Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Manage your events and event operations.
              </p>
            </div>

            <Button size="lg" className="gap-2">
              <Plus />
              Create event
            </Button>
          </section>

          <section>
            <SummaryChart summary={summary} />
          </section>

          <NeedsAttention />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                My Events
              </h2>
              <p className="text-sm text-muted-foreground">
                Select an event to manage its details and operations.
              </p>
            </div>

            <div className="overflow-x-auto border-b">
              <div className="flex min-w-max gap-1">
                {tabs.map((tab) => {
                  const count = events.filter(
                    (event) => event.status === tab
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

            {filteredEvents.length > 0 ? (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <Card className="shadow-none">
                <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold">
                    No {statusLabels[activeTab].toLowerCase()} events
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Events in this category will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Dashboard