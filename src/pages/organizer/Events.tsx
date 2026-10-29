import { useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  Ban,
  CalendarDays,
  Eye,
  EyeOff,
  MapPin,
  MoreHorizontal,
  Send,
  Ticket,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"


type EventStatus = "upcoming" | "active" | "draft" | "completed" | "cancelled"
type EventVisibility = "public" | "unlisted" | "private"
type EventAction = "publish" | "unpublish" | "cancel"

export type OrganizerEvent = {
  id: number
  title: string
  description: string
  category: string
  status: EventStatus
  visibility: EventVisibility
  startsAt: string
  endsAt: string
  venue: string
  admission: "general" | "assigned"
  ticketsSold: number
  ticketCapacity: number
  setupComplete: boolean
  ticketTypesConfigured: boolean
}

const initialEvents: OrganizerEvent[] = [
  {
    id: 1,
    title: "Event title",
    description: "Event description. Describes the event. Placeholder words etc etc etc.",
    category: "category",
    status: "active",
    visibility: "public",
    startsAt: "2026-10-15T18:55",
    endsAt: "2026-10-15T19:55",
    venue: "venue",
    admission: "general",
    ticketsSold: 100,
    ticketCapacity: 300,
    setupComplete: true,
    ticketTypesConfigured: true,
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
  upcoming: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  active: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  draft:
    "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  completed:
    "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
}

const visibilityLabels: Record<EventVisibility, string> = {
  public: "Public",
  unlisted: "Unlisted",
  private: "Private",
}

const admissionLabels: Record<OrganizerEvent["admission"], string> = {
  general: "General admission",
  assigned: "Assigned seating",
}

const actionLabels: Record<EventAction, string> = {
  publish: "Publish event",
  unpublish: "Unpublish event",
  cancel: "Cancel event",
}

const actionDescriptions: Record<EventAction, string> = {
  publish:
    "Publish this event",
  unpublish:
    "Return this event to draft",
  cancel:
    "Cancel this event",
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return "Not scheduled"

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Almaty",
  }).format(date)
}

function getSetupIssues(event: OrganizerEvent, now = Date.now()) {
  const issues: string[] = []
  const start = Date.parse(event.startsAt)
  const end = Date.parse(event.endsAt)

  if (
    !event.title.trim() ||
    !event.description.trim() ||
    !event.category.trim()
  ) {
    issues.push("Complete the basic event details")
  }
  if (!event.venue.trim()) issues.push("Add a venue")
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    issues.push("Set the event date and time")
  } else if (end <= start) {
    issues.push("Set an end time after the start time")
  } else if (end <= now) {
    issues.push("Update the schedule before publishing")
  }
  if (event.ticketCapacity <= 0) issues.push("Set the event capacity")
  if (!event.ticketTypesConfigured)
    issues.push("Configure at least one ticket type")
  if (!event.setupComplete && issues.length === 0)
    issues.push("Finish event setup")

  return issues
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

function VisibilityBadge({ visibility }: { visibility: EventVisibility }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {visibilityLabels[visibility]}
    </span>
  )
}

function TicketInventory({ event }: { event: OrganizerEvent }) {
  const percentage =
    event.ticketCapacity > 0
      ? Math.min(
        100,
        Math.max(0, (event.ticketsSold / event.ticketCapacity) * 100)
      )
      : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">Ticket inventory</span>
        <span className="font-medium">
          {event.ticketCapacity > 0
            ? `${event.ticketsSold} / ${event.ticketCapacity} sold`
            : "Capacity not set"}
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-1.5"
        aria-label={`Ticket inventory for ${event.title}`}
        aria-valuetext={`${event.ticketsSold} sold, capacity ${event.ticketCapacity}`}
      />
    </div>
  )
}



function EventCard({
                     event,
                     onPreview,
                     onAction,
                   }: {
  event: OrganizerEvent
  onPreview: () => void
  onAction: (action: EventAction) => void
}) {
  const isDraft = event.status === "draft"
  const isPublished = event.status === "upcoming" || event.status === "active"
  const setupIssues = isDraft ? getSetupIssues(event) : []

  return (
    <Card className="group shadow-none transition-colors hover:border-foreground/20">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight break-words">
                  {event.title}
                </h3>
                <StatusBadge status={event.status} />
                <VisibilityBadge visibility={event.visibility} />
              </div>
              <p className="text-xs text-muted-foreground">{event.category}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label={`Actions for ${event.title}`}
                  />
                }
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview event
                </DropdownMenuItem>

                {(isDraft || isPublished) && <DropdownMenuSeparator />}
                {isDraft && (
                  <DropdownMenuItem
                    disabled={setupIssues.length > 0}
                    onClick={() => onAction("publish")}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Publish event
                  </DropdownMenuItem>
                )}
                {isPublished && (
                  <>
                    <DropdownMenuItem onClick={() => onAction("unpublish")}>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Unpublish event
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={() => onAction("cancel")}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel event
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formatDateTime(event.startsAt)}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{event.venue || "Venue not set"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{admissionLabels[event.admission]}</span>
            </div>
          </div>

          {isDraft && setupIssues.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-3 dark:border-orange-900 dark:bg-orange-950/20">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                    Setup incomplete
                  </p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-orange-800 dark:text-orange-300">
                    {setupIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <TicketInventory event={event} />

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={onPreview}
              aria-label={`View details: ${event.title}`}
            >
              View details
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Events() {
  const [events, setEvents] = useState<OrganizerEvent[]>(initialEvents)
  const [activeTab, setActiveTab] = useState<EventStatus>("upcoming")
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<{
    eventId: number
    action: EventAction
  } | null>(null)
  const [message, setMessage] = useState("")

  const summary = useMemo(() => {
    return {
      upcoming: events.filter((event) => event.status === "upcoming").length,
      active: events.filter((event) => event.status === "active").length,
      draft: events.filter((event) => event.status === "draft").length,
      completed: events.filter((event) => event.status === "completed").length,
      cancelled: events.filter((event) => event.status === "cancelled").length,
    }
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => event.status === activeTab)
  }, [events, activeTab])

  const tabs: EventStatus[] = [
    "upcoming",
    "active",
    "draft",
    "completed",
    "cancelled",
  ]
  const previewEvent = events.find((event) => event.id === previewId)
  const pendingEvent = events.find(
    (event) => event.id === pendingAction?.eventId
  )

  function handleConfirmAction() {
    if (!pendingAction || !pendingEvent) return
    const { action } = pendingAction
    const isPublished =
      pendingEvent.status === "upcoming" || pendingEvent.status === "active"

    if (
      action === "publish" &&
      (pendingEvent.status !== "draft" ||
        getSetupIssues(pendingEvent).length > 0)
    ) {
      setMessage(
        "Complete the event setup and check its schedule before publishing."
      )
      setPendingAction(null)
      return
    }
    if (action !== "publish" && !isPublished) {
      setMessage("This action is available for upcoming and active events.")
      setPendingAction(null)
      return
    }

    const nextStatus: EventStatus =
      action === "publish"
        ? Date.parse(pendingEvent.startsAt) <= Date.now()
          ? "active"
          : "upcoming"
        : action === "unpublish"
          ? "draft"
          : "cancelled"

    setEvents((current) =>
      current.map((event) =>
        event.id === pendingEvent.id ? { ...event, status: nextStatus } : event
      )
    )
    setActiveTab(nextStatus)
    setMessage(`"${pendingEvent.title}" moved to ${statusLabels[nextStatus]}.`)
    setPendingAction(null)
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays
                className="h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
              <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your events, continue drafts, and review past events.
            </p>
          </div>

          <section className="space-y-4" aria-labelledby="events-heading">
            <div>
              <h2
                id="events-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Your events
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a status to browse your events.
              </p>
            </div>

            <div className="overflow-x-auto border-b">
              <div
                className="flex min-w-max gap-1"
                role="group"
                aria-label="Filter events by status"
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab

                  return (
                    <button
                      key={tab}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setActiveTab(tab)
                        setMessage("")
                      }}
                      className={`relative px-3 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {statusLabels[tab]}
                      <span
                        className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        {summary[tab]}
                      </span>
                      {isActive && (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {message ||
                `${filteredEvents.length} ${statusLabels[activeTab].toLowerCase()} ${filteredEvents.length === 1 ? "event" : "events"}`}
            </p>

            {filteredEvents.length > 0 ? (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPreview={() => setPreviewId(event.id)}
                    onAction={(action) =>
                      setPendingAction({ eventId: event.id, action })
                    }
                  />
                ))}
              </div>
            ) : (
              <Card className="shadow-none">
                <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                    <CalendarDays
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-medium">
                    No {statusLabels[activeTab].toLowerCase()} events
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Events in this category will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          <Dialog
            open={Boolean(previewEvent)}
            onOpenChange={(open) => {
              if (!open) setPreviewId(null)
            }}
          >
            {previewEvent && (
              <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle className="pr-5 break-words">
                    {previewEvent.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={previewEvent.status} />
                    <VisibilityBadge visibility={previewEvent.visibility} />
                  </div>
                  <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
                    {previewEvent.description}
                  </p>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    {[
                      ["Category", previewEvent.category],
                      ["Admission", admissionLabels[previewEvent.admission]],
                      ["Starts", formatDateTime(previewEvent.startsAt)],
                      ["Ends", formatDateTime(previewEvent.endsAt)],
                      ["Venue", previewEvent.venue || "Venue not set"],
                      [
                        "Capacity",
                        previewEvent.ticketCapacity > 0
                          ? String(previewEvent.ticketCapacity)
                          : "Not set",
                      ],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="mt-1 font-medium break-words">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="border-t pt-4">
                    <TicketInventory event={previewEvent} />
                  </div>
                  {previewEvent.status === "draft" &&
                    getSetupIssues(previewEvent).length > 0 && (
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="flex items-center gap-2 text-sm font-medium">
                          <Ticket className="h-4 w-4" aria-hidden="true" />
                          Remaining setup
                        </p>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {getSetupIssues(previewEvent).map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </DialogContent>
            )}
          </Dialog>

          <AlertDialog
            open={Boolean(pendingAction && pendingEvent)}
            onOpenChange={(open) => {
              if (!open) setPendingAction(null)
            }}
          >
            {pendingAction && pendingEvent && (
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {actionLabels[pendingAction.action]}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="mb-2 block font-medium break-words text-foreground">
                      {pendingEvent.title}
                    </span>
                    {actionDescriptions[pendingAction.action]}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmAction}
                    className={
                      pendingAction.action === "cancel"
                        ? "bg-destructive text-white hover:bg-destructive/90"
                        : undefined
                    }
                  >
                    {actionLabels[pendingAction.action]}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            )}
          </AlertDialog>
        </div>
      </main>
    </div>
  )
}

export default Events

