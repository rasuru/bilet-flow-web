import { queryOptions, type QueryClient } from "@tanstack/react-query"
import { getPayoutBalance, listPayouts, requestPayout, type PayoutRequest } from "@/api/payments"
import { sessionRepository } from "@/auth/sessionRepository"
import { ApiError } from "@/api/client"

const key = (sessionId: number) => ["organizer-payouts", sessionId] as const
export const payoutPageSize = 20
const intentKey = (accountId: number) => `biletflow.payout-intent.${accountId}`

export const payoutRepository = {
  balanceQuery(sessionId: number) {
    return queryOptions({
      queryKey: [...key(sessionId), "balance"],
      queryFn: () => sessionRepository.authenticatedRequest(sessionId, getPayoutBalance),
      refetchInterval: 5000,
    })
  },
  historyQuery(sessionId: number, page: number) {
    return queryOptions({
      queryKey: [...key(sessionId), "history", page],
      queryFn: () => sessionRepository.authenticatedRequest(sessionId, (token) =>
        listPayouts(token, { offset: page * payoutPageSize, limit: payoutPageSize + 1 })),
      refetchInterval: 5000,
    })
  },
  readIntent(accountId: number): PayoutRequest | null {
    try {
      const raw = localStorage.getItem(intentKey(accountId))
      if (!raw) return null
      const value = JSON.parse(raw) as PayoutRequest
      return typeof value.requestId === "string" && typeof value.amountKzt === "string" && value.acceptSimulation === true ? value : null
    } catch {
      return null
    }
  },
  async request(client: QueryClient, sessionId: number, accountId: number, amount: string) {
    const previous = this.readIntent(accountId)
    if (previous && String(previous.amountKzt) !== amount) {
      throw new Error("A previous payout request must be retried first.")
    }
    const intent = previous ?? { requestId: crypto.randomUUID(), amountKzt: amount, acceptSimulation: true }
    // Persist before sending so a lost response or reload cannot create a second payout.
    localStorage.setItem(intentKey(accountId), JSON.stringify(intent))
    try {
      const payout = await sessionRepository.authenticatedRequest(sessionId, (token) => requestPayout(token, intent))
      localStorage.removeItem(intentKey(accountId))
      return payout
    } catch (error) {
      // A rejected request can be corrected; ambiguous failures retain the original ID.
      if (error instanceof ApiError && [400, 403, 404, 409, 422].includes(error.status)) {
        localStorage.removeItem(intentKey(accountId))
      }
      throw error
    } finally {
      void client.invalidateQueries({ queryKey: key(sessionId) })
    }
  },
}

