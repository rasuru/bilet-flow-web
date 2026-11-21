import { queryOptions } from "@tanstack/react-query"
import * as support from "@/api/support"
import { sessionRepository } from "@/auth/sessionRepository"

// The only layer that knows how to reach the support service and refresh its data.
const keys = {
  all: (sessionId: number) => ["support", sessionId] as const,
  case: (sessionId: number, caseId: string) => ["support", sessionId, caseId] as const,
}
export const supportRepository = {
  keys,
  listQuery(sessionId: number, accountId: number) {
    return queryOptions({ queryKey: keys.all(sessionId), queryFn: () =>
      sessionRepository.authenticatedRequest(sessionId, () => support.listSupportCases(accountId)) })
  },
  caseQuery(sessionId: number, accountId: number, caseId: string) {
    return queryOptions({ queryKey: keys.case(sessionId, caseId), queryFn: () =>
      sessionRepository.authenticatedRequest(sessionId, () => support.getSupportCase(accountId, caseId)) })
  },
  create(sessionId: number, accountId: number, data: support.CreateSupportCase) {
    return sessionRepository.authenticatedRequest(sessionId, () => support.createSupportCase(accountId, data))
  },
  send(sessionId: number, accountId: number, caseId: string, message: string) {
    return sessionRepository.authenticatedRequest(sessionId, () => support.sendSupportMessage(accountId, caseId, message))
  },
  update(sessionId: number, accountId: number, caseId: string, data: {status?: support.SupportStatus; assignedTo?: string | null}) {
    return sessionRepository.authenticatedRequest(sessionId, () => support.updateSupportCase(accountId, caseId, data))
  },
}


