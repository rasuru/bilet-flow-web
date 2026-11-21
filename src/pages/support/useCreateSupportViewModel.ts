import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useLocation, useSearch } from "wouter"
import { useState } from "react"
import type { SupportCategory } from "@/api/support"
import { supportRepository } from "@/support/supportRepository"
import { supportPath } from "@/support/supportPresentation"

export function useCreateSupportViewModel(sessionId: number, accountId: number) {
  const params = new URLSearchParams(useSearch())
  const [, navigate] = useLocation()
  const client = useQueryClient()
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState<SupportCategory>("EVENT_INFORMATION")
  const [recipient, setRecipient] = useState<"ORGANIZER" | "PLATFORM">("ORGANIZER")
  const [message, setMessage] = useState("")
  const [validation, setValidation] = useState<string | null>(null)
  const context = {
    ...(params.get("eventId") && { eventId: params.get("eventId")! }),
    ...(params.get("orderId") && { orderId: params.get("orderId")! }),
    ...(params.get("ticketId") && { ticketId: params.get("ticketId")! }),
  }
  const mutation = useMutation({ mutationFn: () => supportRepository.create(sessionId, accountId, {
    subject: subject.trim(), category, recipient, message: message.trim(), context,
  }), onSuccess: async (item) => {
    await client.invalidateQueries({ queryKey: supportRepository.keys.all(sessionId) })
    navigate(supportPath(item.id))
  } })
  return { subject, setSubject, category, setCategory, recipient, setRecipient,
    message, setMessage, context, busy: mutation.isPending,
    error: validation ?? (mutation.isError ? "Couldn’t create the request. Please try again." : null),
    submit: () => {
      if (!subject.trim() || subject.trim().length > 120) return setValidation("Subject must be between 1 and 120 characters.")
      if (!message.trim() || message.trim().length > 5000) return setValidation("Message must be between 1 and 5000 characters.")
      setValidation(null)
      mutation.mutate()
    } }
}


