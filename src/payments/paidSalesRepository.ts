import { queryOptions, type QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/api/client"
import {
  createPaymentSession,
  getActivationChecklist,
  startPaidSalesActivation,
  type ActivationRequest,
} from "@/api/payments"
import { sessionRepository } from "@/auth/sessionRepository"
import { refreshManagedEvent } from "@/events/managedEventRepository"

export const paidSalesRepository = {
  checklistQuery(sessionId: number, eventId: string) {
    return queryOptions({
      queryKey: ["paid-sales", sessionId, eventId],
      queryFn: () => sessionRepository.authenticatedRequest(sessionId, (token) =>
        getActivationChecklist(token, eventId)),
      retry: (count, error) => count < 2 && (!(error instanceof ApiError) || error.status >= 500),
      staleTime: 0,
      refetchInterval: (query) => query.state.data?.status === "PENDING" ? 3000 : false,
    })
  },
  async paymentSession(sessionId: number, eventId: string, request: ActivationRequest) {
    const activation = await sessionRepository.authenticatedRequest(sessionId, (token) =>
      startPaidSalesActivation(token, eventId, request))
    return sessionRepository.authenticatedRequest(sessionId, (token) =>
      createPaymentSession(token, activation.paymentId))
  },
  refresh(client: QueryClient, sessionId: number, eventId: string) {
    return refreshManagedEvent(client, sessionId, eventId)
  },
}

