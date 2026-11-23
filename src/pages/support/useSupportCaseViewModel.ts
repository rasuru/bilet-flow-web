import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import type { SupportStatus } from "@/api/support"
import { ApiError } from "@/api/client"
import { managedEventRepository } from "@/events/managedEventRepository"
import {
  categories,
  contextLinks,
  dateTime,
  statuses,
  supportError,
  supportRecipient,
} from "@/support/supportPresentation"
import { supportRepository } from "@/support/supportRepository"

type StaffAction =
  | { kind: "status"; status: SupportStatus }
  | { kind: "assign"; userId: number }
  | { kind: "escalate" }

export function useSupportCaseViewModel(
  sessionId: number,
  accountId: number,
  caseId: string
) {
  const client = useQueryClient()
  const [draft, setDraft] = useState("")
  const [assignee, setAssignee] = useState("")
  const [validation, setValidation] = useState<string>()
  const query = useQuery(supportRepository.caseQuery(sessionId, caseId))
  const unavailable =
    query.error instanceof ApiError && [403, 404].includes(query.error.status)
  const item = unavailable ? undefined : query.data
  const staff = item && item.requesterUserId !== accountId
  const attendee = item?.type === "ATTENDEE_SUPPORT"
  const open = item && item.status !== "RESOLVED"
  useEffect(() => {
    if (open) return supportRepository.watchCase(client, sessionId, caseId)
  }, [client, sessionId, caseId, open])
  const managed = useQuery(
    managedEventRepository.mineQuery(
      staff && attendee && open ? sessionId : null
    )
  )
  const send = useMutation({
    mutationFn: (message: string) =>
      supportRepository.send(client, sessionId, caseId, message),
    onSuccess: () => setDraft(""),
  })
  const update = useMutation({
    mutationFn: async (action: StaffAction) => {
      if (action.kind === "status")
        await supportRepository.changeStatus(
          client,
          sessionId,
          caseId,
          action.status
        )
      else if (action.kind === "assign")
        await supportRepository.assign(client, sessionId, caseId, action.userId)
      else await supportRepository.escalate(client, sessionId, caseId)
    },
    onSuccess: (_, action) => {
      if (action.kind === "assign") setAssignee("")
    },
  })
  const busy = send.isPending || update.isPending
  function run(action: StaffAction) {
    if (busy) return
    setValidation(undefined)
    send.reset()
    update.mutate(action)
  }
  return {
    loading: query.isPending,
    error:
      query.isError && !unavailable
        ? supportError(query.error, "Couldn’t load this conversation.")
        : null,
    missing: unavailable,
    retry: () => void query.refetch(),
    case: item && {
      id: item.id,
      subject: item.subject,
      recipient: supportRecipient(item.type),
      staff,
      canReply: open,
      canEscalate:
        staff &&
        attendee &&
        open &&
        !item.escalatedAt &&
        managed.data?.some((event) => event.id === item.eventId),
      escalated: !!item.escalatedAt,
      status: item.status,
      statusLabel:
        statuses.find((entry) => entry.value === item.status)?.label ??
        item.status,
      statusChoices: statuses.filter(
        ({ value }) => value === item.status || (open && value !== "OPEN")
      ),
      category:
        categories.find((entry) => entry.value === item.category)?.label ??
        item.category,
      assignedTo:
        item.assignedSupportUserId === accountId
          ? "You"
          : item.assignedSupportUserId
            ? `User ${item.assignedSupportUserId}`
            : "Unassigned",
      context: contextLinks(item),
      messages: item.messages.map((message) => ({
        ...message,
        authorLabel:
          message.authorUserId === accountId
            ? "You"
            : message.authorType === "REQUESTER"
              ? "Requester"
              : "Support team",
        own: message.authorUserId === accountId,
        createdLabel: dateTime.format(new Date(message.sentAt)),
      })),
    },
    draft,
    setDraft,
    assignee,
    setAssignee,
    busy,
    actionError:
      validation ??
      (send.isError || update.isError
        ? supportError(
            send.error ?? update.error,
            "That action failed. Try again."
          )
        : null),
    send: () => {
      if (busy) return
      const message = draft.trim()
      if (!message || message.length > 4000)
        return setValidation("Enter a message up to 4000 characters.")
      setValidation(undefined)
      update.reset()
      send.mutate(message)
    },
    setStatus: (status: SupportStatus) => run({ kind: "status", status }),
    assign: () => {
      const userId = Number(assignee || accountId)
      if (!Number.isSafeInteger(userId) || userId < 1)
        return setValidation("Enter a valid support agent ID.")
      run({ kind: "assign", userId })
    },
    escalate: () => run({ kind: "escalate" }),
  }
}
