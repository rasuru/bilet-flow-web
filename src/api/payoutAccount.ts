import { requestJson } from "@/api/client"

export type PayoutAccount = {
  holderName: string
  maskedIban: string
  bankCode: string
  verification: "SIMULATED"
  registeredAt: string
  updatedAt: string
  simulated: boolean
}

export type PayoutAccountRequest = {
  holderName: string
  iban: string
  acceptSimulation: boolean
}

const payoutAccountPath = "/api/payments/payout-account"

export function getPayoutAccount(token: string) {
  return requestJson<PayoutAccount>(payoutAccountPath, { token })
}

export function putPayoutAccount(token: string, json: PayoutAccountRequest) {
  return requestJson<PayoutAccount>(payoutAccountPath, {
    token,
    method: "PUT",
    json,
  })
}
