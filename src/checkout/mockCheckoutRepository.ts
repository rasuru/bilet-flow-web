import { queryOptions, type QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import {
  chooseMockOutcome,
  getMockCheckout,
  type MockPaymentScenario,
} from "@/api/payments"
import { sessionRepository } from "@/auth/sessionRepository"

function checkoutKey(sessionId: number, paymentId: string) {
  return ["mock-checkout", sessionId, paymentId] as const
}

export const mockCheckoutRepository = {
  checkout(sessionId: number, paymentId: string) {
    return queryOptions({
      queryKey: checkoutKey(sessionId, paymentId),
      queryFn: () =>
        sessionRepository.authenticatedRequest(sessionId, (token) =>
          getMockCheckout(token, paymentId)
        ),
      retry: (count, error) =>
        count < 2 && (!(error instanceof ApiError) || error.status >= 500),
      refetchInterval: ({ state }) =>
        state.data?.status === "PENDING" && !state.data.closed ? 1_500 : false,
    })
  },

  async choose(
    client: QueryClient,
    sessionId: number,
    paymentId: string,
    scenario: MockPaymentScenario
  ) {
    const checkout = await sessionRepository.authenticatedRequest(
      sessionId,
      (token) => chooseMockOutcome(token, paymentId, scenario)
    )
    const key = checkoutKey(sessionId, paymentId)
    await client.cancelQueries({ queryKey: key, exact: true })
    client.setQueryData(key, checkout)
  },
}
