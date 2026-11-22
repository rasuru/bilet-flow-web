import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useLocation, useSearch } from "wouter"

import type { SupportCategory, SupportType } from "@/api/support"
import { managedEventRepository } from "@/events/managedEventRepository"
import {
  contextLinks,
  supportError,
  supportPath,
} from "@/support/supportPresentation"
import { supportRepository } from "@/support/supportRepository"

export function useCreateSupportViewModel(sessionId: number) {
  const params = new URLSearchParams(useSearch())
  const [, navigate] = useLocation()
  const client = useQueryClient()
  const context = {
    eventId: params.get("eventId") || undefined,
    orderId: params.get("orderId") || undefined,
    ticketId: params.get("ticketId") || undefined,
  }
  const eventContext = !!(
    context.eventId ||
    context.orderId ||
    context.ticketId
  )
  const [type, setType] = useState<SupportType>(
    eventContext ? "ATTENDEE_SUPPORT" : "PLATFORM_SUPPORT"
  )
  const [category, setCategory] = useState<SupportCategory>(
    eventContext ? "EVENT_INFORMATION" : "ACCOUNT"
  )
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [validation, setValidation] = useState<string>()
  const managed = useQuery(
    managedEventRepository.mineQuery(
      type === "PLATFORM_SUPPORT" && context.eventId ? sessionId : null
    )
  )
  const organizerEventId = managed.data?.find(
    (event) => event.id === context.eventId
  )?.id
  const links = contextLinks(
    type === "ATTENDEE_SUPPORT" ? context : { eventId: organizerEventId }
  )
  const mutation = useMutation({
    mutationFn: () =>
      organizerEventId && type === "PLATFORM_SUPPORT"
        ? supportRepository.createForOrganizer(client, sessionId, {
            subject: subject.trim(),
            category,
            message: message.trim(),
            eventId: organizerEventId,
          })
        : supportRepository.create(client, sessionId, {
            type,
            subject: subject.trim(),
            category,
            initialMessage: message.trim(),
            ...(type === "ATTENDEE_SUPPORT" ? context : {}),
          }),
    onSuccess: (item) => navigate(supportPath(item.id)),
  })
  return {
    type,
    setType,
    category,
    setCategory,
    subject,
    setSubject,
    message,
    setMessage,
    eventContext,
    links,
    busy:
      mutation.isPending ||
      (type === "PLATFORM_SUPPORT" && !!context.eventId && managed.isLoading),
    error:
      validation ??
      (mutation.isError
        ? supportError(mutation.error, "Couldn’t create the request.")
        : null),
    submit: () => {
      if (
        mutation.isPending ||
        (type === "PLATFORM_SUPPORT" && !!context.eventId && managed.isLoading)
      )
        return
      if (!subject.trim() || subject.trim().length > 255)
        return setValidation("Enter a subject of up to 255 characters.")
      if (!message.trim() || message.trim().length > 4000)
        return setValidation("Enter a message of up to 4000 characters.")
      setValidation(undefined)
      mutation.mutate()
    },
  }
}
