import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type WizardStep = "basics" | "schedule" | "venue" | "tickets" | "review"
type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE"
type SeatingMode = "GENERAL_ADMISSION" | "ASSIGNED_SEATING"

const STEP_ORDER: WizardStep[] = ["basics", "schedule", "venue", "tickets", "review"]
const STEP_LABELS: Record<WizardStep, string> = {
  basics: "Basics",
  schedule: "Schedule",
  venue: "Venue & Admission",
  tickets: "Tickets",
  review: "Review",
}

const TIME_ZONES = ["UTC", "UTC+02:00", "UTC+03:00", "UTC+05:00", "UTC+06:00"]

type GaTicketDraft = {
  clientId: string
  name: string
  description: string
  isFree: boolean
  price: string
  capacity: string
  maxPerOrder: string
  salesStartAt: string
  salesEndAt: string
  status: "ACTIVE" | "HIDDEN"
}

function newGaDraft(): GaTicketDraft {
  return {
    clientId: crypto.randomUUID(),
    name: "",
    description: "",
    isFree: true,
    price: "0",
    capacity: "",
    maxPerOrder: "4",
    salesStartAt: "",
    salesEndAt: "",
    status: "ACTIVE",
  }
}

type AssignedTicketDraft = {
  name: string
  description: string
  isFree: boolean
  price: string
  maxPerOrder: string
  salesStartAt: string
  salesEndAt: string
  status: "ACTIVE" | "HIDDEN"
}

function newAssignedDraft(category: string): AssignedTicketDraft {
  return {
    name: category,
    description: "",
    isFree: true,
    price: "0",
    maxPerOrder: "4",
    salesStartAt: "",
    salesEndAt: "",
    status: "ACTIVE",
  }
}

type Seat = { section: string; row: string; seatNumber: string; accessible: boolean; priceCategory: string }
type VenueLayout = { layoutId: string; name: string; seats: Seat[] }

const MOCK_LAYOUTS: VenueLayout[] = [
  {
    layoutId: "main-hall",
    name: "Main Hall",
    seats: [
      ...Array.from({ length: 8 }, (_, i) => ({
        section: "A",
        row: "1",
        seatNumber: String(i + 1),
        accessible: i === 0,
        priceCategory: "PREMIUM",
      })),
      ...Array.from({ length: 92 }, (_, i) => ({
        section: "A",
        row: String(2 + Math.floor(i / 20)),
        seatNumber: String((i % 20) + 1),
        accessible: false,
        priceCategory: "PREMIUM",
      })),
      ...Array.from({ length: 400 }, (_, i) => ({
        section: "B",
        row: String(1 + Math.floor(i / 25)),
        seatNumber: String((i % 25) + 1),
        accessible: i % 50 === 0,
        priceCategory: "STANDARD",
      })),
    ],
  },
  {
    layoutId: "small-auditorium",
    name: "Small Auditorium",
    seats: Array.from({ length: 180 }, (_, i) => ({
      section: "A",
      row: String(1 + Math.floor(i / 20)),
      seatNumber: String((i % 20) + 1),
      accessible: i % 30 === 0,
      priceCategory: "STANDARD",
    })),
  },
]

const fieldClassName =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

const textareaClassName =
  "min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function WizardStepper({ current, onSelectStep }: { current: WizardStep; onSelectStep: (step: WizardStep) => void }) {
  const currentIndex = STEP_ORDER.indexOf(current)
  return (
    <ol className="mb-6 flex items-center gap-2">
      {STEP_ORDER.map((step, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectStep(step)}
              className="flex items-center gap-2 text-left focus:outline-none"
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`hidden text-xs sm:inline ${
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </button>
            {index < STEP_ORDER.length - 1 && <div className="h-px flex-1 bg-border" />}
          </li>
        )
      })}
    </ol>
  )
}

export function CreateEventPage() {
  const [step, setStep] = useState<WizardStep>("basics")
  const [error, setError] = useState<string | null>(null)

  // Status & Management
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "CANCELLED">("DRAFT")

  // Step 1: Basics
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC")

  // Step 2: Schedule
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [timeZone, setTimeZone] = useState(TIME_ZONES[0])
  const [registrationOpensAt, setRegistrationOpensAt] = useState("")
  const [registrationClosesAt, setRegistrationClosesAt] = useState("")

  // Step 3: Venue & Admission
  const [seatingMode, setSeatingMode] = useState<SeatingMode>("GENERAL_ADMISSION")
  const [venueName, setVenueName] = useState("")
  const [venueAddress, setVenueAddress] = useState("")
  const [venueCapacity, setVenueCapacity] = useState("")
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)

  // Step 4: Tickets
  const [gaTicketTypes, setGaTicketTypes] = useState<GaTicketDraft[]>([])
  const [gaDrafts, setGaDrafts] = useState<GaTicketDraft[]>([newGaDraft()])
  const [assignedTicketTypes, setAssignedTicketTypes] = useState<Record<string, AssignedTicketDraft>>({})
  const [assignedDrafts, setAssignedDrafts] = useState<Record<string, AssignedTicketDraft>>({})

  // Navigation
  function goToStep(targetStep: WizardStep) {
    setError(null)
    setStep(targetStep)
  }

  function goNext() {
    const currentIndex = STEP_ORDER.indexOf(step)
    if (currentIndex < STEP_ORDER.length - 1) {
      setError(null)
      setStep(STEP_ORDER[currentIndex + 1])
    }
  }

  function goBack() {
    const currentIndex = STEP_ORDER.indexOf(step)
    if (currentIndex > 0) {
      setError(null)
      setStep(STEP_ORDER[currentIndex - 1])
    }
  }

  // Ticket Handlers
  function createGaTicket(clientId: string) {
    const draft = gaDrafts.find((t) => t.clientId === clientId)
    if (!draft || !draft.name.trim()) return
    setError(null)
    setGaTicketTypes((prev) => [...prev, draft])
    setGaDrafts((prev) => {
      const rest = prev.filter((t) => t.clientId !== clientId)
      return rest.length > 0 ? rest : [newGaDraft()]
    })
  }

  function toggleGaTicketVisibility(clientId: string) {
    setGaTicketTypes((prev) =>
      prev.map((t) =>
        t.clientId === clientId ? { ...t, status: t.status === "HIDDEN" ? "ACTIVE" : "HIDDEN" } : t
      )
    )
  }

  function createAssignedTicket(cat: string) {
    const draft = assignedDrafts[cat] ?? newAssignedDraft(cat)
    if (!draft.name.trim()) return
    setError(null)
    setAssignedTicketTypes((prev) => ({ ...prev, [cat]: draft }))
  }

  function toggleAssignedTicketVisibility(cat: string) {
    setAssignedTicketTypes((prev) => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        status: prev[cat].status === "HIDDEN" ? "ACTIVE" : "HIDDEN",
      },
    }))
  }

  const selectedLayout = MOCK_LAYOUTS.find((l) => l.layoutId === selectedLayoutId) ?? null
  const layoutCategories = selectedLayout
    ? Array.from(new Set(selectedLayout.seats.map((s) => s.priceCategory)))
    : []
  const seatCountByCategory = new Map<string, number>()
  for (const seat of selectedLayout?.seats ?? []) {
    seatCountByCategory.set(seat.priceCategory, (seatCountByCategory.get(seat.priceCategory) ?? 0) + 1)
  }

  const hasTicketTypes =
    seatingMode === "ASSIGNED_SEATING"
      ? Object.keys(assignedTicketTypes).length > 0
      : gaTicketTypes.length > 0

  return (
    <div className="flex min-h-svh items-start justify-center p-4 pt-12 bg-muted/30">
      <div className="w-[560px]">
        {status === "DRAFT" && <WizardStepper current={step} onSelectStep={goToStep} />}

        <Card>
          <CardHeader>
            <CardTitle>
              {status !== "DRAFT"
                ? "Event Workspace"
                : step === "review"
                  ? "Review & publish"
                  : "Create new event"}
            </CardTitle>
            <CardDescription>
              {status !== "DRAFT" ? `Status: ${status}` : STEP_LABELS[step]}
            </CardDescription>
          </CardHeader>

          {/* Event Workspace Page */}
          {status !== "DRAFT" && (
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="text-sm font-medium">Events</div>
                <div className="rounded-lg border p-4 space-y-3 bg-background">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base">{title || "Untitled Event"}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        status === "PUBLISHED"
                          ? "bg-emerald-950 text-emerald-300"
                          : status === "UNPUBLISHED"
                            ? "bg-amber-950 text-amber-300"
                            : "bg-rose-950 text-rose-300"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
                    <p>Category: {category || "Not set"}</p>
                    <p>Venue: {venueName || "Not set"}</p>
                    <p>Start: {startAt || "Not set"}</p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    {status === "UNPUBLISHED" && (
                      <Button size="sm" onClick={() => setStatus("PUBLISHED")}>
                        Publish
                      </Button>
                    )}
                    {status === "PUBLISHED" && (
                      <Button size="sm" variant="outline" onClick={() => setStatus("UNPUBLISHED")}>
                        Unpublish
                      </Button>
                    )}
                    {status !== "CANCELLED" && (
                      <Button size="sm" variant="destructive" onClick={() => setStatus("CANCELLED")}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Button variant="ghost" className="w-full" onClick={() => setStatus("DRAFT")}>
                Return to Editor
              </Button>
            </CardContent>
          )}

          {/* Step 1: Basics */}
          {status === "DRAFT" && step === "basics" && (
            <>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Event title</Label>
                  <input
                    id="title"
                    className={fieldClassName}
                    placeholder=""
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <input
                    id="category"
                    className={fieldClassName}
                    placeholder=""
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className={textareaClassName}
                    placeholder=""
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    id="visibility"
                    className={fieldClassName}
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as Visibility)}
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="UNLISTED">Unlisted</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={goNext}>Continue</Button>
              </CardFooter>
            </>
          )}

          {/* Step 2: Schedule */}
          {status === "DRAFT" && step === "schedule" && (
            <>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startAt">Starts</Label>
                    <input
                      id="startAt"
                      type="datetime-local"
                      className={fieldClassName}
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endAt">Ends</Label>
                    <input
                      id="endAt"
                      type="datetime-local"
                      className={fieldClassName}
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timeZone">Time zone</Label>
                  <select
                    id="timeZone"
                    className={fieldClassName}
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                  >
                    {TIME_ZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="regOpens">Registration opens</Label>
                    <input
                      id="regOpens"
                      type="datetime-local"
                      className={fieldClassName}
                      value={registrationOpensAt}
                      onChange={(e) => setRegistrationOpensAt(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="regCloses">Registration closes</Label>
                    <input
                      id="regCloses"
                      type="datetime-local"
                      className={fieldClassName}
                      value={registrationClosesAt}
                      onChange={(e) => setRegistrationClosesAt(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={goBack}>
                  Back
                </Button>
                <Button onClick={goNext}>Continue</Button>
              </CardFooter>
            </>
          )}

          {/* Step 3: Venue & Admission */}
          {status === "DRAFT" && step === "venue" && (
            <>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Admission Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSeatingMode("GENERAL_ADMISSION")}
                      className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                        seatingMode === "GENERAL_ADMISSION"
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-input"
                      }`}
                    >
                      General Admission
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeatingMode("ASSIGNED_SEATING")}
                      className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                        seatingMode === "ASSIGNED_SEATING"
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-input"
                      }`}
                    >
                      Assigned Seating
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="venueName">Venue name</Label>
                  <input
                    id="venueName"
                    className={fieldClassName}
                    placeholder=""
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="venueAddress">Address</Label>
                  <input
                    id="venueAddress"
                    className={fieldClassName}
                    placeholder=""
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                  />
                </div>

                {seatingMode === "GENERAL_ADMISSION" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="venueCapacity">Total event capacity</Label>
                    <input
                      id="venueCapacity"
                      type="number"
                      className={fieldClassName}
                      placeholder=""
                      value={venueCapacity}
                      onChange={(e) => setVenueCapacity(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label>Predefined Layout</Label>
                    <div className="space-y-2">
                      {MOCK_LAYOUTS.map((layout) => (
                        <button
                          key={layout.layoutId}
                          type="button"
                          onClick={() => setSelectedLayoutId(layout.layoutId)}
                          className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                            selectedLayoutId === layout.layoutId
                              ? "border-primary bg-primary/5 font-medium"
                              : "border-input"
                          }`}
                        >
                          {layout.name} ({layout.seats.length} seats)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={goBack}>
                  Back
                </Button>
                <Button onClick={goNext}>Continue</Button>
              </CardFooter>
            </>
          )}

          {/* Step 4: Tickets */}
          {status === "DRAFT" && step === "tickets" && (
            <>
              <CardContent className="space-y-4">
                {seatingMode === "ASSIGNED_SEATING" ? (
                  <div className="space-y-4">
                    {layoutCategories.map((cat) => {
                      const existing = assignedTicketTypes[cat]
                      const draft = assignedDrafts[cat] ?? newAssignedDraft(cat)

                      if (existing) {
                        return (
                          <div
                            key={cat}
                            className="flex items-center justify-between rounded-lg border p-3 text-sm"
                          >
                            <div>
                              <div className="font-medium">
                                {cat} ({seatCountByCategory.get(cat)} seats)
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {existing.name} ({existing.isFree ? "Free" : existing.price})
                                {existing.status === "HIDDEN" && " (Hidden)"}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleAssignedTicketVisibility(cat)}
                            >
                              {existing.status === "HIDDEN" ? "Unhide" : "Hide"}
                            </Button>
                          </div>
                        )
                      }

                      return (
                        <div key={cat} className="space-y-3 rounded-lg border p-3">
                          <div className="text-sm font-medium">
                            Category: {cat} ({seatCountByCategory.get(cat)} seats)
                          </div>
                          <input
                            className={fieldClassName}
                            placeholder="Ticket name"
                            value={draft.name}
                            onChange={(e) =>
                              setAssignedDrafts((prev) => ({
                                ...prev,
                                [cat]: { ...draft, name: e.target.value },
                              }))
                            }
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              className={fieldClassName}
                              value={draft.isFree ? "FREE" : "PAID"}
                              onChange={(e) =>
                                setAssignedDrafts((prev) => ({
                                  ...prev,
                                  [cat]: { ...draft, isFree: e.target.value === "FREE" },
                                }))
                              }
                            >
                              <option value="FREE">Free</option>
                              <option value="PAID">Paid</option>
                            </select>
                            {!draft.isFree && (
                              <input
                                type="number"
                                className={fieldClassName}
                                placeholder="Price"
                                value={draft.price}
                                onChange={(e) =>
                                  setAssignedDrafts((prev) => ({
                                    ...prev,
                                    [cat]: { ...draft, price: e.target.value },
                                  }))
                                }
                              />
                            )}
                          </div>
                          <input
                            type="number"
                            className={fieldClassName}
                            placeholder="Max per order"
                            value={draft.maxPerOrder}
                            onChange={(e) =>
                              setAssignedDrafts((prev) => ({
                                ...prev,
                                [cat]: { ...draft, maxPerOrder: e.target.value },
                              }))
                            }
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="datetime-local"
                              className={fieldClassName}
                              value={draft.salesStartAt}
                              onChange={(e) =>
                                setAssignedDrafts((prev) => ({
                                  ...prev,
                                  [cat]: { ...draft, salesStartAt: e.target.value },
                                }))
                              }
                            />
                            <input
                              type="datetime-local"
                              className={fieldClassName}
                              value={draft.salesEndAt}
                              onChange={(e) =>
                                setAssignedDrafts((prev) => ({
                                  ...prev,
                                  [cat]: { ...draft, salesEndAt: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <Button size="sm" onClick={() => createAssignedTicket(cat)}>
                            Save Ticket Category
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gaTicketTypes.length > 0 && (
                      <div className="space-y-2">
                        {gaTicketTypes.map((ticket) => (
                          <div
                            key={ticket.clientId}
                            className="flex items-center justify-between rounded-lg border p-3 text-sm"
                          >
                            <div>
                              <div className="font-medium">{ticket.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {ticket.isFree ? "Free" : ticket.price} (Capacity: {ticket.capacity})
                                {ticket.status === "HIDDEN" && " (Hidden)"}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleGaTicketVisibility(ticket.clientId)}
                            >
                              {ticket.status === "HIDDEN" ? "Unhide" : "Hide"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      {gaDrafts.map((draft) => (
                        <div key={draft.clientId} className="space-y-3 rounded-lg border p-3">
                          <input
                            className={fieldClassName}
                            placeholder="Ticket name"
                            value={draft.name}
                            onChange={(e) =>
                              setGaDrafts((prev) =>
                                prev.map((t) =>
                                  t.clientId === draft.clientId ? { ...t, name: e.target.value } : t
                                )
                              )
                            }
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              className={fieldClassName}
                              value={draft.isFree ? "FREE" : "PAID"}
                              onChange={(e) =>
                                setGaDrafts((prev) =>
                                  prev.map((t) =>
                                    t.clientId === draft.clientId
                                      ? {
                                          ...t,
                                          isFree: e.target.value === "FREE",
                                          price: e.target.value === "FREE" ? "0" : t.price,
                                        }
                                      : t
                                  )
                                )
                              }
                            >
                              <option value="FREE">Free</option>
                              <option value="PAID">Paid</option>
                            </select>
                            {!draft.isFree && (
                              <input
                                type="number"
                                className={fieldClassName}
                                placeholder="Price"
                                value={draft.price}
                                onChange={(e) =>
                                  setGaDrafts((prev) =>
                                    prev.map((t) =>
                                      t.clientId === draft.clientId
                                        ? { ...t, price: e.target.value }
                                        : t
                                    )
                                  )
                                }
                              />
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              className={fieldClassName}
                              placeholder="Capacity"
                              value={draft.capacity}
                              onChange={(e) =>
                                setGaDrafts((prev) =>
                                  prev.map((t) =>
                                    t.clientId === draft.clientId
                                      ? { ...t, capacity: e.target.value }
                                      : t
                                  )
                                )
                              }
                            />
                            <input
                              type="number"
                              className={fieldClassName}
                              placeholder="Max per order"
                              value={draft.maxPerOrder}
                              onChange={(e) =>
                                setGaDrafts((prev) =>
                                  prev.map((t) =>
                                    t.clientId === draft.clientId
                                      ? { ...t, maxPerOrder: e.target.value }
                                      : t
                                  )
                                )
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="datetime-local"
                              className={fieldClassName}
                              value={draft.salesStartAt}
                              onChange={(e) =>
                                setGaDrafts((prev) =>
                                  prev.map((t) =>
                                    t.clientId === draft.clientId
                                      ? { ...t, salesStartAt: e.target.value }
                                      : t
                                  )
                                )
                              }
                            />
                            <input
                              type="datetime-local"
                              className={fieldClassName}
                              value={draft.salesEndAt}
                              onChange={(e) =>
                                setGaDrafts((prev) =>
                                  prev.map((t) =>
                                    t.clientId === draft.clientId
                                      ? { ...t, salesEndAt: e.target.value }
                                      : t
                                  )
                                )
                              }
                            />
                          </div>
                          <Button size="sm" onClick={() => createGaTicket(draft.clientId)}>
                            Add Ticket
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={goBack}>
                  Back
                </Button>
                <Button onClick={goNext}>Continue to Review</Button>
              </CardFooter>
            </>
          )}

          {/* Step 5: Review */}
          {status === "DRAFT" && step === "review" && (
            <>
              <CardContent className="space-y-4">
                <div className="space-y-1 rounded-lg border p-4 text-sm">
                  <p className="font-medium">{title || "Untitled Event"}</p>
                  <p className="text-muted-foreground">{description || "No description."}</p>
                  <p className="text-muted-foreground">
                    Category: {category || "Not set"} | Visibility: {visibility}
                  </p>
                  <p className="text-muted-foreground">
                    Mode: {seatingMode === "ASSIGNED_SEATING" ? "Assigned Seating" : "General Admission"}
                  </p>
                </div>

                <ul className="space-y-2 rounded-lg border p-4 text-sm">
                  <li className="flex items-center gap-2">
                    <span className={title ? "text-emerald-600" : "text-muted-foreground"}>
                      {title ? "✓" : "○"}
                    </span>
                    Title
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={category ? "text-emerald-600" : "text-muted-foreground"}>
                      {category ? "✓" : "○"}
                    </span>
                    Category
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={startAt && endAt ? "text-emerald-600" : "text-muted-foreground"}>
                      {startAt && endAt ? "✓" : "○"}
                    </span>
                    Schedule
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={venueName ? "text-emerald-600" : "text-muted-foreground"}>
                      {venueName ? "✓" : "○"}
                    </span>
                    Venue setup
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={hasTicketTypes ? "text-emerald-600" : "text-muted-foreground"}>
                      {hasTicketTypes ? "✓" : "○"}
                    </span>
                    Ticket types configured
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={goBack}>
                  Back
                </Button>
                <Button onClick={() => setStatus("PUBLISHED")}>Publish Event</Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default CreateEventPage