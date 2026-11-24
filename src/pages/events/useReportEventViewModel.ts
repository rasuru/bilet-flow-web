import { useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { ApiError } from "@/api/client"
import { useSessionViewModel } from "@/auth/useSessionViewModel"
import { eventReportRepository } from "@/events/eventReportRepository"
import { t } from "@/i18n/locale"

export function useReportEventViewModel(eventId: string) {
  const session = useSessionViewModel()
  const sessionId = session.status === "signedIn" ? session.sessionId : null
  const mutation = useMutation(eventReportRepository.submitMutation(sessionId, eventId))
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [validation, setValidation] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [receipt, setReceipt] = useState<{ sessionId: number; reportId: string } | null>(null)
  const busy = useRef(false)
  const submitted = receipt !== null && receipt.sessionId === sessionId
  function changeOpen(value: boolean) {
    if (busy.current) return
    if (!value) { setValidation(null); mutation.reset() }
    setOpen(value)
  }
  async function submit() {
    if (sessionId === null || busy.current || submitted) return
    if (!reason.trim() || reason.trim().length > 1000) { setValidation("Enter a reason between 1 and 1,000 characters."); return }
    setValidation(null)
    busy.current = true
    try {
      const result = await mutation.mutateAsync(reason.trim())
      setReceipt({ sessionId, reportId: result.reportId })
      setReason("")
    } catch { /* Mutation exposes the error; keep the reason for retry. */ }
    finally { busy.current = false }
  }
  return {
    open, changeOpen, reason, setReason: (value: string) => { setReason(value); setValidation(null); mutation.reset() },
    submitted, signedIn: sessionId !== null, restoring: session.status === "restoring", restoreFailed: session.status === "restoreFailed", retrySession: session.retry,
    registering, setRegistering,
    busy: mutation.isPending, submit,
    remaining: t("{0} / 1,000 characters", reason.length),
    error: validation ? t(validation) : mutation.isError ? t(mutation.error instanceof ApiError ? mutation.error.message : "Could not submit the report. Try again.") : null,
  }
}

