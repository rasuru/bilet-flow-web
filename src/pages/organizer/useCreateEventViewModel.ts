import { useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"

import type {
  RegistrationWindowRequest,
  SeatingMode,
  VenueLayout,
  VenueRequest,
} from "@/api/events"
import {
  allowsLocalEventSave,
  venueLayoutsQuery,
  publishNewEvent,
  saveLocalEvent,
  submissionError,
  type EventSubmission,
  type PublishStage,
  type SubmissionProgress,
} from "@/events/organizerEventRepository"
import { t } from "@/i18n/locale"
import {
  createEventDraft,
  defaultSalesWindow,
  instant,
  newTicket,
  sampleEventDraft,
  type EventDraft,
  type TicketDraft,
} from "./createEventDraft"

type Stage = PublishStage | { kind: "checkConnection" }
type ValidationMessage = [message: string, ...values: (number | string)[]]
type SubmissionFailure = { stage: Stage; detail: string }

function progressText(stage: Stage) {
  switch (stage.kind) {
    case "checkConnection":
      return t("Checking connection…")
    case "createDraft":
      return t("Creating event draft…")
    case "updateDraft":
      return t("Updating event draft…")
    case "saveVenue":
      return t("Saving venue…")
    case "saveTicket":
      return t("Saving ticket tier {0} of {1}…", stage.position, stage.total)
    case "publish":
      return t("Publishing event…")
  }
}

function failureText({ stage, detail }: SubmissionFailure) {
  const message = t(detail)
  switch (stage.kind) {
    case "checkConnection":
      return t("Could not check the connection. {0}", message)
    case "createDraft":
      return t("Could not create the event draft. {0}", message)
    case "updateDraft":
      return t("Could not update the event draft. {0}", message)
    case "saveVenue":
      return t("Could not save the venue. {0}", message)
    case "saveTicket":
      return t(
        "Could not save ticket tier {0} of {1}. {2}",
        stage.position,
        stage.total,
        message
      )
    case "publish":
      return t("Could not publish the event. {0}", message)
  }
}

function positiveInteger(value: string) {
  return (
    /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) > 0
  )
}

function httpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export function useCreateEventViewModel(sessionId: number) {
  const queryClient = useQueryClient()
  const [openedAt] = useState(Date.now)
  const [event, setEvent] = useState(() => createEventDraft(openedAt))
  const [seatingMode, setSeatingMode] =
    useState<SeatingMode>("GENERAL_ADMISSION")
  const [gaTickets, setGaTickets] = useState(() => [
    newTicket("General admission", "1"),
  ])
  const [assignedTickets, setAssignedTickets] = useState<TicketDraft[]>([])
  const [layouts, setLayouts] = useState<VenueLayout[]>([])
  const [layoutsOffline, setLayoutsOffline] = useState(false)
  const [loadingLayouts, setLoadingLayouts] = useState(false)
  const [layoutError, setLayoutError] = useState("")
  const [step, setStep] = useState(0)
  const [error, setError] = useState<
    ValidationMessage | SubmissionFailure | null
  >(null)
  const [busy, setBusy] = useState(false)
  const [publishStep, setPublishStep] = useState<Stage | null>(null)
  const [result, setResult] = useState<{ id: string; local: boolean } | null>(
    null
  )
  const progress = useRef<SubmissionProgress>({ tickets: new Map() })
  const submissionInFlight = useRef(false)
  const [savedDraft, setSavedDraft] = useState<{
    id: string
    ticketKeys: string[]
  } | null>(null)

  const assigned = seatingMode === "ASSIGNED_SEATING"
  const autoSales = defaultSalesWindow(event, openedAt)
  const tickets = (assigned ? assignedTickets : gaTickets).map((ticket) => ({
    ...ticket,
    ...(ticket.customSales ? {} : autoSales),
  }))
  const selectedLayout = layouts.find(
    ({ layoutId }) => layoutId === event.layoutId
  )

  function setField<Key extends keyof EventDraft>(
    key: Key,
    value: EventDraft[Key]
  ) {
    setEvent((previous) => ({ ...previous, [key]: value }))
  }

  function selectLayout(id: string, available = layouts) {
    setField("layoutId", id)
    const counts = new Map<string, number>()
    for (const seat of available.find((layout) => layout.layoutId === id)
      ?.seats ?? []) {
      if (seat.priceCategory)
        counts.set(
          seat.priceCategory,
          (counts.get(seat.priceCategory) ?? 0) + 1
        )
    }
    setAssignedTickets((previous) =>
      Array.from(counts, ([category, count]) => {
        const capacity = String(count)
        const existing =
          id === event.layoutId
            ? previous.find((ticket) => ticket.id === category)
            : undefined
        return {
          ...(existing ?? newTicket(category, capacity)),
          capacity,
          id: category,
        }
      })
    )
  }

  async function refreshLayouts() {
    setLoadingLayouts(true)
    setLayoutError("")
    try {
      const { layouts: next, offline } =
        await queryClient.fetchQuery(venueLayoutsQuery())
      setLayouts(next)
      setLayoutsOffline(offline)
      if (
        !next.some(({ layoutId }) => layoutId === event.layoutId) ||
        offline !== layoutsOffline
      ) {
        selectLayout("", next)
      } else {
        selectLayout(event.layoutId, next)
      }
    } catch (err) {
      setLayoutError(submissionError(err))
    } finally {
      setLoadingLayouts(false)
    }
  }

  function updateTicket(id: string, changes: Partial<Omit<TicketDraft, "id">>) {
    const setTickets = assigned ? setAssignedTickets : setGaTickets
    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === id ? { ...ticket, ...changes } : ticket
      )
    )
  }

  function setCustomSales(ticket: TicketDraft, enabled: boolean) {
    updateTicket(ticket.id, {
      customSales: enabled,
      ...(enabled ? autoSales : {}),
    })
  }

  function fillSample() {
    if (busy || savedDraft || result || loadingLayouts) return
    setEvent(sampleEventDraft(Date.now()))
    setSeatingMode("GENERAL_ADMISSION")
    setGaTickets([
      {
        ...newTicket("General admission", "80"),
        price: "2500",
        maxPerOrder: "4",
      },
    ])
    setError(null)
    setStep(4)
  }

  function changeSeatingMode(mode: SeatingMode) {
    setSeatingMode(mode)
    if (mode === "ASSIGNED_SEATING") void refreshLayouts()
  }

  function validate(index: number): ValidationMessage | null {
    if (index === 0) {
      if (!event.title.trim() || !event.category.trim())
        return ["Enter an event title and category."]
      if (event.imageUrl.trim() && !httpUrl(event.imageUrl.trim()))
        return ["Enter an image URL starting with http:// or https://."]
    }
    if (index === 1) {
      if (
        !(
          instant(event.startAt, event.timeZone) <
          instant(event.endAt, event.timeZone)
        )
      )
        return ["Enter an event end time after the start time."]
      if (
        event.registrationClosesAt &&
        (!event.registrationOpensAt ||
          event.registrationOpensAt >= event.registrationClosesAt)
      ) {
        return ["Enter a registration opening time before the closing time."]
      }
      if (
        event.registrationOpensAt >= event.endAt ||
        event.registrationClosesAt > event.endAt
      )
        return ["Registration must take place before the event ends."]
    }
    if (index === 2) {
      if (!event.venueName.trim() || !event.venueAddress.trim())
        return ["Enter the venue name and address."]
      if (assigned && layoutError) return [layoutError]
      if (assigned && (loadingLayouts || !selectedLayout?.seats.length))
        return ["Select a venue layout."]
      if (assigned && !selectedLayout?.seats.some((seat) => seat.priceCategory))
        return ["Select a layout with seats assigned to price categories."]
      if (!assigned && !positiveInteger(event.venueCapacity))
        return ["Enter a positive whole number for venue capacity."]
    }
    if (index === 3) {
      if (!tickets.length)
        return ["Add at least one ticket tier with available seats."]
      const names = new Set<string>()
      for (const [i, ticket] of tickets.entries()) {
        const name = ticket.name.trim().toLowerCase()
        if (!name || names.has(name))
          return ["Ticket tier {0}: enter a unique name.", i + 1]
        names.add(name)
        if (
          !/^\d+(\.\d{1,2})?$/.test(ticket.price) ||
          !Number.isFinite(Number(ticket.price))
        )
          return [
            "Ticket tier {0}: enter a nonnegative price with up to two decimal places.",
            i + 1,
          ]
        if (!positiveInteger(ticket.capacity))
          return [
            "Ticket tier {0}: enter a positive whole number for quantity.",
            i + 1,
          ]
        if (
          !positiveInteger(ticket.maxPerOrder) ||
          Number(ticket.maxPerOrder) > Number(ticket.capacity)
        )
          return [
            "Ticket tier {0}: max per order must be between 1 and the tier quantity.",
            i + 1,
          ]
        if (
          !ticket.salesStartAt ||
          !ticket.salesEndAt ||
          ticket.salesStartAt >= ticket.salesEndAt ||
          ticket.salesEndAt > event.endAt
        ) {
          return [
            "Ticket tier {0}: enter a sales window that starts before it closes and ends by the event end time.",
            i + 1,
          ]
        }
      }
      if (
        !assigned &&
        tickets.reduce((total, ticket) => total + Number(ticket.capacity), 0) >
          Number(event.venueCapacity)
      )
        return ["Total ticket quantity exceeds venue capacity."]
    }
    return null
  }

  function navigate(target: number) {
    if (busy) return
    for (let index = 0; index < target; index++) {
      const message = validate(index)
      if (message) {
        setStep(index)
        setError(message)
        return
      }
    }
    setError(null)
    setStep(target)
  }

  function buildSubmission(): EventSubmission {
    const toIso = (value: string) =>
      instant(value, event.timeZone).toISOString()
    let registrationWindow: RegistrationWindowRequest = { mode: "ALWAYS_OPEN" }
    if (event.registrationOpensAt) {
      const startAt = toIso(event.registrationOpensAt)
      registrationWindow = event.registrationClosesAt
        ? {
            mode: "BOUNDED",
            startAt,
            endAt: toIso(event.registrationClosesAt),
          }
        : { mode: "OPENS_AT", startAt }
    }
    const venueInfo = {
      name: event.venueName.trim(),
      address: event.venueAddress.trim(),
    }
    const venue: VenueRequest =
      selectedLayout && assigned
        ? {
            ...venueInfo,
            seatingMode: "ASSIGNED_SEATING",
            capacity: selectedLayout.seats.length,
            venueLayoutId: selectedLayout.layoutId,
          }
        : {
            ...venueInfo,
            seatingMode: "GENERAL_ADMISSION",
            capacity: Number(event.venueCapacity),
          }

    return {
      details: {
        title: event.title.trim(),
        category: event.category.trim(),
        description: event.description.trim() || null,
        imageUrl: event.imageUrl.trim() || null,
        visibility: event.visibility,
        startAt: toIso(event.startAt),
        endAt: toIso(event.endAt),
        registrationWindow,
      },
      venue,
      tickets: tickets.map((ticket) => {
        const details = {
          name: ticket.name.trim(),
          description: ticket.description.trim(),
          price: ticket.price,
          maxPerOrder: Number(ticket.maxPerOrder),
          salesStartAt: toIso(ticket.salesStartAt),
          salesEndAt: toIso(ticket.salesEndAt),
        }
        const request = assigned
          ? { ...details, priceCategory: ticket.id }
          : { ...details, capacity: Number(ticket.capacity) }
        return { key: ticket.id, request }
      }),
    }
  }

  async function submit() {
    if (submissionInFlight.current || result) return
    if (step < 4) {
      navigate(step + 1)
      return
    }
    for (let index = 0; index < 4; index++) {
      const message = validate(index)
      if (message) {
        setStep(index)
        setError(message)
        return
      }
    }
    submissionInFlight.current = true
    setBusy(true)
    setPublishStep({ kind: "checkConnection" })
    setError(null)
    let recoveryStep = 4
    let stage: Stage = { kind: "checkConnection" }
    try {
      const submission = buildSubmission()
      if (!progress.current.draftEventId && allowsLocalEventSave) {
        const { offline } = await queryClient.fetchQuery(venueLayoutsQuery())
        if (assigned && offline !== layoutsOffline) {
          setStep(2)
          setLayouts([])
          selectLayout("", [])
          setLayoutError(
            "The backend connection changed. Reload layouts and select a layout again."
          )
          return
        }
        if (offline) {
          setResult({ id: saveLocalEvent(submission), local: true })
          return
        }
      }
      const id = await publishNewEvent(
        queryClient,
        sessionId,
        submission,
        progress.current,
        (nextStage, step) => {
          stage = nextStage
          recoveryStep = step
          setPublishStep(nextStage)
        }
      )
      setResult({ id, local: false })
    } catch (err) {
      const { draftEventId, tickets } = progress.current
      if (draftEventId) {
        setSavedDraft({ id: draftEventId, ticketKeys: [...tickets.keys()] })
      }
      setStep(recoveryStep)
      setError({ stage, detail: submissionError(err) })
    } finally {
      submissionInFlight.current = false
      setBusy(false)
    }
  }

  return {
    event,
    setField,
    seatingMode,
    changeSeatingMode,
    assigned,
    tickets,
    layouts,
    layoutsOffline,
    loadingLayouts,
    layoutError: t(layoutError),
    selectLayout,
    refreshLayouts,
    selectedLayout,
    step,
    error: Array.isArray(error) ? t(...error) : error ? failureText(error) : "",
    busy,
    publishStep: publishStep ? progressText(publishStep) : "",
    result,
    savedDraft,
    navigate,
    submit,
    fillSample,
    updateTicket,
    setCustomSales,
    salesSummary:
      autoSales.salesEndAt === event.startAt
        ? t("On sale immediately until event starts.")
        : t("Sales close when the event ends."),
    addTicket: () => setGaTickets((previous) => [...previous, newTicket()]),
    removeTicket: (id: string) =>
      setGaTickets((previous) => previous.filter((ticket) => ticket.id !== id)),
  }
}


