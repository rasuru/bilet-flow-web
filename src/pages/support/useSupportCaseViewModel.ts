import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { SupportStatus } from "@/api/support"
import { supportRepository } from "@/support/supportRepository"
import { categories, contextLinks, dateTime, statuses } from "@/support/supportPresentation"

export function useSupportCaseViewModel(sessionId: number, accountId: number, caseId: string) {
  const client = useQueryClient()
  const [draft, setDraft] = useState("")
  const [validation, setValidation] = useState<string | null>(null)
  const query = useQuery({ ...supportRepository.caseQuery(sessionId, accountId, caseId), refetchInterval: 15000 })
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: supportRepository.keys.all(sessionId) }),
      client.invalidateQueries({ queryKey: supportRepository.keys.case(sessionId, caseId) }),
    ])
  }
  const send = useMutation({ mutationFn: (message: string) => supportRepository.send(sessionId, accountId, caseId, message), onSuccess: async () => { setDraft(""); await refresh() } })
  const update = useMutation({ mutationFn: (data: { status?: SupportStatus; assignedTo?: string | null }) => supportRepository.update(sessionId, accountId, caseId, data), onSuccess: refresh })
  const item = query.data
  return {
    loading: query.isPending, error: query.isError, missing: query.isSuccess && !item,
    retry: () => void query.refetch(),
    case: item && {
      id: item.id, subject: item.subject, scope: item.scope, recipient: item.recipient,
      staff: item.scope !== "MY_REQUESTS", canReply: item.status !== "RESOLVED",
      status: item.status, statusLabel: statuses.find((s) => s.value === item.status)!.label,
      category: categories.find((c) => c.value === item.category)!.label,
      assignedTo: item.assignedTo ?? "Unassigned", context: contextLinks(item.context),
      messages: item.messages.map((m) => ({ ...m,
        authorLabel: m.author === "CUSTOMER" ? "Customer" : "Support team",
        own: item.scope === "MY_REQUESTS" ? m.author === "CUSTOMER" : m.author === "STAFF",
        createdLabel: dateTime.format(new Date(m.createdAt)),
      })),
    },
    draft, setDraft, busy: send.isPending || update.isPending,
    actionError: validation ?? (send.isError || update.isError ? "That action failed. Please try again." : null),
    send: () => {
      const message = draft.trim()
      if (!message || message.length > 5000) return setValidation("Enter a message up to 5000 characters.")
      setValidation(null)
      send.mutate(message)
    },
    setStatus: (status: SupportStatus) => update.mutate({ status }),
    setAssignment: (assignedTo: string | null) => update.mutate({ assignedTo }),
  }
}


