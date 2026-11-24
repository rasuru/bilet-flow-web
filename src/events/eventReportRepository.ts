import { mutationOptions } from "@tanstack/react-query"
import { submitEventReport } from "@/api/eventReports"
import { sessionRepository } from "@/auth/sessionRepository"

export const eventReportRepository = {
  submitMutation(sessionId: number | null, eventId: string) {
    return mutationOptions({
      mutationKey: ["event-report", sessionId, eventId],
      mutationFn: (reason: string) => {
        if (sessionId === null) throw new Error("Sign in to continue.")
        return sessionRepository.authenticatedRequest(sessionId, token => submitEventReport(token, eventId, reason))
      },
      retry: false,
    })
  },
}

