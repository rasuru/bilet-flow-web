import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"

import { ApiError } from "@/api/client"
import type { ManagedEvent, SeatingMode } from "@/api/events"
import type { TicketType } from "@/api/inventory"
import { managedEventRepository } from "@/events/managedEventRepository"
import { submissionError } from "@/events/organizerEventRepository"
import { dateFormat, numberFormat, statusText, t } from "@/i18n/locale"
import {
  buildEventDetails,
  buildVenue,
  defaultSalesWindow,
  eventDraftFrom,
  instant,
  newTicket,
  positiveInteger,
  validPrice,
  validateEventBasics,
  validateEventSchedule,
  type EventDraft,
  type TicketDraft,
} from "./createEventDraft"

const dateTime = dateFormat({ dateStyle: "medium", timeStyle: "short" })
const priceFormat = numberFormat({
  style: "currency",
  currency: "KZT",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
})

type Notify = (message: string) => void

function loadError(error: Error | null, fallback: string) {
  return error ? t(error instanceof ApiError ? error.message : fallback) : null
}

function useSaveManagement<Values>(
  save: (values: Values) => Promise<void>,
  onSaved: () => void
) {
  const inFlight = useRef(false)
  const [validation, setValidation] = useState<string | null>(null)
  const mutation = useMutation({ mutationFn: save })
  return {
    busy: mutation.isPending,
    reset() {
      setValidation(null)
      mutation.reset()
    },
    error: validation
      ? t(validation)
      : mutation.isError
        ? t(submissionError(mutation.error))
        : null,
    async submit(values: Values, message?: string | null) {
      if (inFlight.current) return
      setValidation(message ?? null)
      mutation.reset()
      if (message) return
      inFlight.current = true
      try {
        await mutation.mutateAsync(values)
        onSaved()
      } catch {
        // Keep the form open with its input and the mutation error.
      } finally {
        inFlight.current = false
      }
    },
  }
}

function useEventFields(original: ManagedEvent) {
  const [initial, setInitial] = useState(() => eventDraftFrom(original))
  const [event, setEvent] = useState(initial)
  function setField<Key extends keyof EventDraft>(
    key: Key,
    value: EventDraft[Key]
  ) {
    setEvent((previous) => ({ ...previous, [key]: value }))
  }
  return {
    initial,
    event,
    setField,
    reset() {
      const next = eventDraftFrom(original)
      setInitial(next)
      setEvent(next)
    },
  }
}

export function useEditEventViewModel(
  sessionId: number,
  original: ManagedEvent,
  onSaved: () => void
) {
  const client = useQueryClient()
  const fields = useEventFields(original)
  const { initial, event, setField } = fields
  const save = useSaveManagement(
    (values: EventDraft) =>
      managedEventRepository.updateDetails(
        client,
        sessionId,
        original.id,
        buildEventDetails(values, original)
      ),
    onSaved
  )
  return {
    ...save,
    hasUnsavedChanges: JSON.stringify(event) !== JSON.stringify(initial),
    event,
    setField,
    reset() {
      fields.reset()
      save.reset()
    },
    submit: () =>
      save.submit(
        event,
        validateEventBasics(event, original) ??
          validateEventSchedule(event, initial)
      ),
  }
}

export function useAttachVenueViewModel(
  sessionId: number,
  original: ManagedEvent,
  onSaved: () => void
) {
  const client = useQueryClient()
  const fields = useEventFields(original)
  const { event, setField } = fields
  const [seatingMode, changeSeatingMode] =
    useState<SeatingMode>("GENERAL_ADMISSION")
  const assigned = seatingMode === "ASSIGNED_SEATING"
  const layouts = useQuery(managedEventRepository.venueLayoutsQuery(assigned))
  const layout = layouts.data?.find(
    ({ layoutId }) => layoutId === event.layoutId
  )
  const save = useSaveManagement(
    () =>
      managedEventRepository.attachVenue(
        client,
        sessionId,
        original.id,
        buildVenue(event, seatingMode, layout)
      ),
    onSaved
  )

  function validate() {
    if (!event.venueName.trim() || !event.venueAddress.trim())
      return "Enter the venue name and address."
    if (assigned && !layout?.seats.length) return "Select a venue layout."
    if (assigned && !layout?.seats.some((seat) => seat.priceCategory))
      return "Select a layout with seats assigned to price categories."
    if (!assigned && !positiveInteger(event.venueCapacity))
      return "Enter a positive whole number for venue capacity."
    return null
  }

  return {
    ...save,
    event,
    setField,
    seatingMode,
    changeSeatingMode,
    reset() {
      fields.reset()
      changeSeatingMode("GENERAL_ADMISSION")
      save.reset()
    },
    layouts: layouts.data ?? [],
    loadingLayouts: assigned && layouts.isPending,
    layoutError:
      loadError(layouts.error, "Could not load venue layouts.") ?? "",
    selectLayout: (id: string) => setField("layoutId", id),
    refreshLayouts: () => void layouts.refetch(),
    submit: () => save.submit(undefined, validate()),
  }
}

export function useManagedTicketsViewModel(
  sessionId: number,
  event: ManagedEvent
) {
  const query = useQuery(
    managedEventRepository.ticketTypesQuery(
      sessionId,
      event.id,
      Boolean(event.venue)
    )
  )
  return {
    tickets:
      query.data?.map((ticket) => ({
        ticket,
        price:
          Number(ticket.price.amount) === 0
            ? t("Free")
            : priceFormat.format(ticket.price.amount),
        status: statusText(ticket.status),
        salesWindow: t(
          "{0} to {1}",
          dateTime.format(new Date(ticket.salesStartAt)),
          dateTime.format(new Date(ticket.salesEndAt))
        ),
      })) ?? [],
    loading: Boolean(event.venue) && query.isPending,
    loaded: Boolean(query.data),
    error: event.venue
      ? loadError(query.error, "Could not load ticket tiers.")
      : null,
    retry: () => void query.refetch(),
  }
}

export function useEditTicketPriceViewModel(
  sessionId: number,
  ticket: TicketType,
  onSaved: () => void
) {
  const client = useQueryClient()
  const [price, setPrice] = useState(String(ticket.price.amount))
  const save = useSaveManagement(
    (value: string) =>
      managedEventRepository.changeTicketPrice(
        client,
        sessionId,
        ticket.eventId,
        ticket.id,
        value
      ),
    onSaved
  )
  return {
    ...save,
    price,
    setPrice,
    reset() {
      setPrice(String(ticket.price.amount))
      save.reset()
    },
    submit: () =>
      save.submit(
        price,
        validPrice(price)
          ? null
          : "Enter a nonnegative price with up to two decimal places."
      ),
  }
}

export function useAddTicketViewModel(
  sessionId: number,
  event: ManagedEvent,
  tickets: TicketType[],
  onSaved: () => void
) {
  const client = useQueryClient()
  const assigned = event.venue?.seatingMode === "ASSIGNED_SEATING"
  const layout = useQuery(
    managedEventRepository.venueLayoutQuery(event.venue?.venueLayoutId ?? null)
  )
  const [schedule] = useState(() => eventDraftFrom(event))
  const newDraft = () => ({
    ...newTicket(),
    customSales: true,
    ...defaultSalesWindow(eventDraftFrom(event), Date.now()),
  })
  const [draft, setDraft] = useState(newDraft)
  const [category, setCategory] = useState("")
  const categories = new Map<string, number>()
  for (const { priceCategory } of layout.data?.seats ?? []) {
    if (priceCategory)
      categories.set(priceCategory, (categories.get(priceCategory) ?? 0) + 1)
  }
  const categoryCapacity = categories.get(category)
  const ticket = assigned
    ? { ...draft, capacity: categoryCapacity?.toString() ?? "" }
    : draft
  const capacityRemaining =
    (event.venue?.totalCapacity ?? 0) -
    tickets.reduce((sum, type) => sum + (type.totalCapacity ?? 0), 0)
  const save = useSaveManagement(() => {
    const details = {
      name: ticket.name.trim(),
      description: ticket.description.trim(),
      price: ticket.price,
      maxPerOrder: Number(ticket.maxPerOrder),
      salesStartAt: instant(
        ticket.salesStartAt,
        schedule.timeZone
      ).toISOString(),
      salesEndAt: instant(ticket.salesEndAt, schedule.timeZone).toISOString(),
    }
    return managedEventRepository.addTicket(
      client,
      sessionId,
      event.id,
      assigned
        ? { ...details, priceCategory: category }
        : { ...details, capacity: Number(ticket.capacity) }
    )
  }, onSaved)

  function validate() {
    if (assigned && !categoryCapacity) return "Select a seat price category."
    if (!ticket.name.trim()) return "Enter a ticket tier name."
    if (!validPrice(ticket.price))
      return "Enter a nonnegative price with up to two decimal places."
    if (!positiveInteger(ticket.capacity))
      return "Enter a positive whole number for quantity."
    if (!assigned && Number(ticket.capacity) > capacityRemaining)
      return "Total ticket quantity exceeds venue capacity."
    if (
      !positiveInteger(ticket.maxPerOrder) ||
      Number(ticket.maxPerOrder) > Number(ticket.capacity)
    )
      return "Max per order must be between 1 and the tier quantity."
    const opens = +instant(ticket.salesStartAt, schedule.timeZone)
    const closes = +instant(ticket.salesEndAt, schedule.timeZone)
    if (!(opens < closes) || closes > Date.parse(event.endAt))
      return "Enter a sales window that starts before it closes and ends by the event end time."
    return null
  }

  return {
    ...save,
    ticket,
    assigned,
    category,
    setCategory,
    reset() {
      setDraft(newDraft())
      setCategory("")
      save.reset()
    },
    categories: Array.from(categories.keys()),
    loadingCategories: assigned && layout.isLoading,
    categoryError: loadError(layout.error, "Could not load the venue layout."),
    retryCategories: () => void layout.refetch(),
    updateTicket: (changes: Partial<Omit<TicketDraft, "id">>) =>
      setDraft((previous) => ({ ...previous, ...changes })),
    submit: () => save.submit(undefined, validate()),
  }
}

export function useEventStaffViewModel(
  sessionId: number,
  event: ManagedEvent,
  notify: Notify
) {
  const client = useQueryClient()
  const [input, setInput] = useState("")
  const [login, setLogin] = useState("")
  const [searchError, setSearchError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)
  const query = useQuery(
    managedEventRepository.userSearchQuery(sessionId, login)
  )
  const directory = useQuery(
    managedEventRepository.staffDirectoryQuery(
      sessionId,
      event.staff.map(({ userId }) => userId)
    )
  )
  const knownLogins = new Map(
    [...(directory.data ?? []), ...(query.data ?? [])].map(({ id, login }) => [
      id,
      login,
    ])
  )
  const save = useSaveManagement(
    ({ userId, action }: { userId: number; action: "assign" | "remove" }) =>
      managedEventRepository.changeStaff(
        client,
        sessionId,
        event.id,
        userId,
        action
      ),
    () => {
      notify(
        removing === null
          ? "Event administrator assigned."
          : "Event administrator removed."
      )
      setRemoving(null)
    }
  )
  const assigned = new Set(event.staff.map(({ userId }) => userId))
  return {
    ...save,
    input,
    updateInput(next: string) {
      setInput(next)
      setLogin("")
      setSearchError(null)
    },
    search() {
      const next = input.trim().toLowerCase()
      if (!/^[a-z0-9!$&*+=?^_`{|}~.@-]{1,50}$/.test(next)) {
        setSearchError("Enter an account username.")
      } else if (next === login) {
        void query.refetch()
      } else {
        setLogin(next)
      }
    },
    searching: query.isFetching,
    searched: !!login && query.isSuccess && !query.isFetching,
    searchError: searchError
      ? t(searchError)
      : query.isError
        ? t("Could not find accounts. Try searching again.")
        : null,
    results:
      query.data?.map((user) => ({
        ...user,
        assigned: assigned.has(user.id),
      })) ?? [],
    directoryError: directory.isError,
    retryDirectory: () => void directory.refetch(),
    staff: event.staff.map(({ userId, assignedAt }) => ({
      userId,
      name:
        knownLogins.get(userId) ??
        (directory.isPending ? t("Loading account…") : t("User #{0}", userId)),
      assignedAt: dateTime.format(new Date(assignedAt)),
    })),
    removing,
    requestRemoval(userId: number | null) {
      save.reset()
      setRemoving(userId)
    },
    assign: (userId: number) => save.submit({ userId, action: "assign" }),
    remove: () =>
      removing === null
        ? undefined
        : save.submit({ userId: removing, action: "remove" }),
  }
}

