import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import type { AvailableResolutionAction } from "@/api/support"
import { ApiError } from "@/api/client"
import { t } from "@/i18n/locale"
import { actionConfirmation, actionKey, actionReceipt, resolutionPresentation } from "@/support/resolutionPresentation"
import { supportError } from "@/support/supportPresentation"
import { supportRepository } from "@/support/supportRepository"

export function useSupportResolutionViewModel(sessionId: number, caseId: string, enabled: boolean, open: boolean, otherBusy: boolean) {
  const client = useQueryClient()
  const query = useQuery(supportRepository.contextQuery(sessionId, caseId, enabled))
  const [choice, setChoice] = useState<AvailableResolutionAction | null>(null)
  const [reason, setReason] = useState("")
  const [receipt, setReceipt] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: (request: AvailableResolutionAction & { reason?: string }) => supportRepository.resolve(client, sessionId, caseId, request),
    onSuccess: (_, request) => { setChoice(null); setReason(""); setReceipt(actionReceipt(request)) },
    retry: false,
  })
  const denied = query.error instanceof ApiError && [401, 403, 404].includes(query.error.status)
  const data = enabled && !denied ? query.data : undefined
  const confirmation = choice && data ? actionConfirmation(choice, data) : null
  const busy = mutation.isPending || otherBusy
  const eligible = !!choice && !!data?.actions.some(action => actionKey(action) === actionKey(choice))
  const canConfirm = !!confirmation && eligible && open && !busy && !query.isError && (!confirmation.financial || !!reason.trim()) && reason.length <= 200
  function close() { if (!mutation.isPending) { setChoice(null); setReason(""); mutation.reset() } }
  return {
    loading: enabled && query.isPending,
    error: enabled && query.isError ? supportError(query.error, t("Could not load case context.")) : null,
    refresh: () => void query.refetch(), refreshing: query.isFetching,
    context: data ? resolutionPresentation(data) : null,
    busy, actionsDisabled: busy || !open || query.isError,
    receipt, actionError: mutation.isError ? supportError(mutation.error, t("That action failed. Try again.")) : null,
    confirmation, reason, setReason, canConfirm, close,
    unavailable: !!choice && (!eligible || !open || query.isError),
    choose: (action: AvailableResolutionAction) => {
      if (busy || !open || query.isError || !data?.actions.some(entry => actionKey(entry) === actionKey(action))) return
      mutation.reset(); setReceipt(null); setReason(""); setChoice(action)
    },
    confirm: () => { if (canConfirm && choice) mutation.mutate({ action: choice.action, ticketId: choice.ticketId ?? undefined, reason: reason.trim() || undefined }) },
  }
}

