import { queryOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import { getPayoutAccount, putPayoutAccount } from "@/api/payoutAccount"
import type { PayoutAccountRequest } from "@/api/payoutAccount"
import { sessionRepository } from "@/auth/sessionRepository"

function queryKey(sessionId: number) {
  return ["payout-account", sessionId] as const
}

export const payoutAccountRepository = {
  accountQuery(sessionId: number) {
    return queryOptions({
      queryKey: queryKey(sessionId),
      queryFn: async () => {
        try {
          return await sessionRepository.authenticatedRequest(
            sessionId,
            getPayoutAccount
          )
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) return null
          throw error
        }
      },
      retry: (count, error) =>
        count < 2 && (!(error instanceof ApiError) || error.status >= 500),
    })
  },

  async saveAccount(
    client: QueryClient,
    sessionId: number,
    request: PayoutAccountRequest
  ) {
    const key = queryKey(sessionId)
    const account = await sessionRepository.authenticatedRequest(
      sessionId,
      (token) => putPayoutAccount(token, request)
    )

    await client.cancelQueries({ queryKey: key, exact: true })
    const session = sessionRepository.getSnapshot()
    if (session.status === "signedIn" && session.sessionId === sessionId) {
      client.setQueryData(key, account)
    }
  },
}
