import { useMutation, useQuery } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import { ticketRepository } from "@/tickets/ticketRepository"
import { ticketStatusLabels } from "@/tickets/ticketPresentation"

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export function useTicketDetailsViewModel(
  sessionId: number,
  ticketId: string,
  verifiedEmail: string | null
) {
  const detail = useQuery(ticketRepository.detailQuery(sessionId, ticketId))
  const record = detail.data
  const ticket = record?.ticket
  const event = record?.event
  const mayAccessDocument =
    !!ticket &&
    (record.linked ||
      ticket.attendeeEmail.trim().toLowerCase() ===
        verifiedEmail?.trim().toLowerCase())
  const forAdmission =
    !detail.isError &&
    ticket?.status === "VALID" &&
    event?.status !== "CANCELLED"
  const qr = useQuery(
    ticketRepository.qrQuery(
      sessionId,
      mayAccessDocument && forAdmission ? ticketId : null
    )
  )
  const pdf = useMutation({
    mutationFn: () => ticketRepository.pdf(sessionId, ticketId),
    onSuccess: (file) => {
      const url = URL.createObjectURL(file)
      const link = document.createElement("a")
      link.href = url
      link.download = `biletflow-ticket-${ticketId}.pdf`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
    },
  })

  const state = {
    retry: () => void detail.refetch(),
    refreshing: detail.isFetching,
  }
  if (detail.isError) return { ...state, status: "error" } as const
  if (detail.isPending) return { ...state, status: "loading" } as const
  if (!record) return { ...state, status: "missing" } as const

  const seat = record.seat
  const seating = seat
    ? `${seat.section} · Row ${seat.row} · Seat ${seat.seatNumber}${seat.accessible ? " · Accessible" : ""}`
    : record.ticket.seatId
      ? "Assigned seat · details unavailable"
      : "General admission"

  return {
    ...state,
    status: "ready",
    title: event?.title ?? "Event details unavailable",
    eventHref: event ? `/events/${encodeURIComponent(event.id)}` : null,
    date: event
      ? {
          instant: event.startAt,
          label: dateTime.format(new Date(event.startAt)),
        }
      : null,
    venue: event?.venue,
    seating,
    attendee: record.ticket.attendeeEmail,
    code:
      "ticketCode" in record.ticket
        ? record.ticket.ticketCode
        : record.ticket.code,
    statusLabel: ticketStatusLabels[record.ticket.status],
    eventCancelled: event?.status === "CANCELLED",
    mayAccessDocument,
    forAdmission,
    qrImage: forAdmission && !qr.isError ? qr.data : undefined,
    qrError: qr.isError,
    retryQr: () => void qr.refetch(),
    download: () => pdf.mutate(),
    downloading: pdf.isPending,
    downloadError: pdf.isError
      ? pdf.error instanceof ApiError
        ? pdf.error.message
        : "Couldn’t download the ticket PDF."
      : null,
    print: () => window.print(),
  } as const
}
