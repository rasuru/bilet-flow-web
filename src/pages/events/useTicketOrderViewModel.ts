import { t, numberFormat } from "@/i18n/locale"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState, type FormEvent } from "react"
import { useLocation } from "wouter"
import { z } from "zod"

import type { CheckoutRequest } from "@/api/checkouts"
import { ApiError, problemTypes } from "@/api/client"
import { useSessionViewModel } from "@/auth/useSessionViewModel"
import { checkoutRepository } from "@/checkout/checkoutRepository"

import { useCheckoutPromoViewModel } from "./useCheckoutPromoViewModel"

import type { useEventDetailsViewModel } from "./useEventDetailsViewModel"

type EventModel = Extract<
  ReturnType<typeof useEventDetailsViewModel>,
  { status: "ready" }
>
export type OrderTicket = EventModel["tickets"][number]
type Attendee = { email?: string; seatId: string }
const blankAttendee: Attendee = { seatId: "" }
const emailSchema = z.email()
const kzt = numberFormat({
  style: "currency",
  currency: "KZT",
})

export function useTicketOrderViewModel(
  eventId: string,
  tickets: OrderTicket[],
  refreshAvailability: () => void,
  campaignToken: string | null
) {
  const [draft, setDraft] = useState<Record<string, Attendee[]>>({})
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null)
  const [formError, setFormError] = useState<string>()
  const [retryRequest, setRetryRequest] = useState<{
    accountId: number
    request: CheckoutRequest
  }>()
  const submitting = useRef(false)
  const session = useSessionViewModel()
  const client = useQueryClient()
  const [, navigate] = useLocation()
  const order = useMutation({
    mutationFn: async (request: CheckoutRequest) => {
      if (session.status !== "signedIn")
        throw new Error(t("Sign in to place your order."))
      return checkoutRepository.place(
        client,
        session.sessionId,
        session.account.id,
        request
      )
    },
  })

  const selectedSeatIds = new Set(
    Object.values(draft).flatMap((attendees) =>
      attendees.map((attendee) => attendee.seatId).filter(Boolean)
    )
  )
  const promoSelections = Object.entries(draft)
    .filter(([, attendees]) => attendees.length > 0)
    .map(([ticketTypeId, attendees]) => ({
      ticketTypeId,
      quantity: attendees.length,
    }))
    .sort((first, second) =>
      first.ticketTypeId.localeCompare(second.ticketTypeId)
    )
  const promo = useCheckoutPromoViewModel(
    eventId,
    campaignToken,
    promoSelections
  )
  const subtotal = tickets.reduce(
    (sum, ticket) => sum + (draft[ticket.id]?.length ?? 0) * ticket.amount,
    0
  )

  const total = promo.amountKzt ?? subtotal

  function setQuantity(ticketId: string, quantity: number) {
    setDraft((current) => ({
      ...current,
      [ticketId]: Array.from(
        { length: quantity },
        (_, index) => current[ticketId]?.[index] ?? blankAttendee
      ),
    }))
    setFormError(undefined)
  }

  function editAttendee(
    ticketId: string,
    index: number,
    changes: Partial<Attendee>
  ) {
    setDraft((current) => ({
      ...current,
      [ticketId]: current[ticketId].map((attendee, position) =>
        index === position ? { ...attendee, ...changes } : attendee
      ),
    }))
    setFormError(undefined)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (order.isPending || (!retryRequest && promo.blocksOrder)) return
    if (session.status === "signedOut") {
      setAuthMode("login")
      return
    }
    if (session.status !== "signedIn") return

    if (retryRequest?.accountId === session.account.id) {
      await place(retryRequest.request, retryRequest.accountId)
      return
    }
    if (retryRequest) {
      setFormError("Sign in with the account that started this order.")
      return
    }

    const selections: CheckoutRequest["selections"] = []
    const seatsUsed = new Set<string>()
    for (const [ticketTypeId, attendees] of Object.entries(draft)) {
      if (!attendees.length) continue
      const ticket = tickets.find((item) => item.id === ticketTypeId)
      if (!ticket || attendees.length > ticket.orderLimit) {
        setFormError(
          "Ticket availability changed. Update your selection and try again."
        )
        return
      }
      const attendeeEmails = attendees.map(({ email }) =>
        (email ?? session.account.email ?? "").trim()
      )
      if (
        !attendeeEmails.every((email) => emailSchema.safeParse(email).success)
      ) {
        setFormError("Enter a valid email address for each attendee.")
        return
      }
      const seats = ticket.seats ? attendees.map(({ seatId }) => seatId) : []
      for (const seatId of seats) {
        if (
          seatsUsed.has(seatId) ||
          !ticket.seats?.some((seat) => seat.id === seatId)
        ) {
          setFormError("Choose a different available seat for each ticket.")
          return
        }
        seatsUsed.add(seatId)
      }
      selections.push({ ticketTypeId, seats, attendeeEmails })
    }
    if (!selections.length) {
      setFormError("Choose at least one ticket.")
      return
    }

    if (
      selections.length > 30 ||
      selections.reduce(
        (count, selection) => count + selection.attendeeEmails.length,
        0
      ) > 100
    ) {
      setFormError(
        "An order can include up to 100 tickets across 30 ticket types."
      )
      return
    }
    selections.sort((first, second) =>
      first.ticketTypeId.localeCompare(second.ticketTypeId)
    )
    await place(
      {
        eventId,
        selections,
        ...(promo.appliedCode ? { promoCode: promo.appliedCode } : {}),
      },
      session.account.id
    )
  }

  async function place(request: CheckoutRequest, accountId: number) {
    if (submitting.current) return
    submitting.current = true
    setFormError(undefined)
    try {
      const checkout = await order.mutateAsync(request)
      navigate(`/orders/${encodeURIComponent(checkout.id)}`)
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status < 500 &&
        error.status !== 429
      ) {
        setRetryRequest(undefined)
        if (error.type === problemTypes.promoCodeRejected) {
          promo.reject(error)
        } else {
          setFormError(error.fieldErrors[0]?.message ?? error.message)
          if ([404, 409].includes(error.status)) refreshAvailability()
        }
      } else {
        setRetryRequest({ accountId, request })
        setFormError(
          "Couldn’t confirm your order. Retry to check the same order attempt."
        )
      }
    } finally {
      submitting.current = false
    }
  }

  return {
    promo,
    draft,
    selectedSeatIds,
    isFree: total === 0,
    totalLabel: total === 0 ? t("Free") : kzt.format(total),
    hasSelection: Object.values(draft).some(
      (attendees) => attendees.length > 0
    ),
    setQuantity,
    editAttendee,
    submit,
    formError,
    isSubmitting: order.isPending,
    maySubmit: !!retryRequest || !promo.blocksOrder,
    retryingOrder: !!retryRequest,
    session,
    authMode,
    setAuthMode,
    clearSelection: () => {
      setDraft({})
      setAuthMode(null)
      setFormError(undefined)
    },
  }
}

