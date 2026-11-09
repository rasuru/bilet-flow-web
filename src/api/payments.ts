import { requestEmpty, requestJson, withQuery } from "@/api/client"

export type Payment = {
  id: string
  orderId: string | null
  status: string
  refundId: string | null
  refundStatus: string | null
  reviewRequired: boolean
  bankOperation: string | null
  bankOperationId: string | null
  bankOperationState: string | null
  sandbox: boolean
}

export type HalykPaymentSession = {
  auth: Record<string, unknown>
  scriptUrl: string
  paymentObject: Record<string, unknown>
}

export type ActivationRequest = {
  acceptSandboxTerms: boolean
  simulateIdentityAndPayoutVerification: boolean
}

export type ActivationPayment = {
  paymentId: string
  sandbox: boolean
  verificationSimulated: boolean
}

export type ActivationStatus = "PENDING" | "ACTIVE" | "SUSPENDED"

export type Activation = Omit<ActivationPayment, "paymentId"> & {
  eventId: string
  status: ActivationStatus
  paymentId: string | null
}

export type ActivationChecklist = {
  eventId: string
  status: string
  items: {
    key: string
    done: boolean
    simulated: boolean
    description: string
  }[]
  readyToRequest: boolean
  complete: boolean
  activationFeeKzt: number
  sandbox: boolean
}

export type OrganizerRevenue = {
  sandbox: boolean
  feesEstimated: boolean
  currency: string
  totals: Record<string, number>
}

export type OperationResolutionRequest = {
  expectedOperationId?: string | null
  resolution:
    | "FULL_REFUND_CONFIRMED_COMPLETED"
    | "CLEAR_REVIEW"
    | "CONFIRMED_NOT_EXECUTED_RETRY"
    | "REFUND_CONFIRMED_REJECTED"
  bankSupportReference: string
}

type ListQuery = { offset?: number; limit?: number }

type PaymentPurpose = "TICKET" | "ACTIVATION"
type PaymentStatus =
  "PENDING" | "SUCCEEDED" | "FAILED" | "REFUND_REQUESTED" | "REFUNDED"

export type AdminPaymentQuery = ListQuery & {
  status?: PaymentStatus
  purpose?: PaymentPurpose
  eventId?: string
  payerId?: number
}

export type AdminPayment = {
  id: string
  purpose: PaymentPurpose
  eventId: string | null
  orderId: string | null
  payerId: number
  organizerId: number
  amountKzt: number
  estimatedFeeKzt: number
  status: PaymentStatus
  paidAt: string | null
  failedAt: string | null
  failureReason: string | null
  reviewRequired: boolean
  operationState: string | null
  sandbox: boolean
}

export type ActivationRecord = Activation & {
  organizerId: number
  createdAt: string
  suspendedAt: string | null
  suspensionReason: string | null
  termsVersion: string
}

export type ActivationFee = {
  amountKzt: number
  currency: string
  administratorOverride: boolean
  updatedBy: number | null
  updatedAt: string | null
  sandbox: boolean
}

export type Payout = {
  id: string
  amountKzt: number
  currency: string
  status: "REQUESTED" | "COMPLETED" | "FAILED"
  requestedAt: string
  completedAt: string | null
  providerReference: string | null
  failureReason: string | null
  simulated: boolean
}

export type PayoutBalance = {
  availableKzt: number
  withheldKzt: number
  pendingPayoutKzt: number
  paidOutKzt: number
  deficitKzt: number
  reconciliationPending: boolean
  currency: string
  simulated: boolean
}

export type PayoutRequest = {
  /** UUID. Reuse it with the same amount when retrying a payout. */
  requestId: string
  amountKzt: string | number
  acceptSimulation: boolean
}

const paymentsPath = "/api/payments"
const adminPath = `${paymentsPath}/admin`
const activationFeePath = `${adminPath}/settings/activation-fee`
const payoutsPath = `${paymentsPath}/payouts`

function paymentPath(paymentId: string) {
  return `${paymentsPath}/${encodeURIComponent(paymentId)}`
}

function activationPath(eventId: string) {
  return `${paymentsPath}/events/${encodeURIComponent(eventId)}/activation`
}

export function listPaymentOperations(token: string) {
  return requestJson<Payment[]>(`${paymentsPath}/operations`, { token })
}

export function getPayment(token: string, paymentId: string) {
  return requestJson<Payment>(paymentPath(paymentId), { token })
}

export function createPaymentSession(token: string, paymentId: string) {
  return requestJson<HalykPaymentSession>(`${paymentPath(paymentId)}/session`, {
    token,
    method: "POST",
  })
}

export function startPaidSalesActivation(
  token: string,
  eventId: string,
  json: ActivationRequest
) {
  return requestJson<ActivationPayment>(activationPath(eventId), {
    token,
    method: "POST",
    json,
  })
}

export function getPaidSalesActivation(token: string, eventId: string) {
  return requestJson<Activation>(activationPath(eventId), { token })
}

export function getActivationChecklist(token: string, eventId: string) {
  return requestJson<ActivationChecklist>(
    `${activationPath(eventId)}/checklist`,
    { token }
  )
}

export function getOrganizerRevenue(token: string) {
  return requestJson<OrganizerRevenue>(`${paymentsPath}/revenue/mine`, {
    token,
  })
}

export function resolvePaymentOperation(
  token: string,
  paymentId: string,
  json: OperationResolutionRequest
) {
  return requestEmpty(`${paymentPath(paymentId)}/resolve-operation`, {
    token,
    method: "POST",
    json,
  })
}

export function listAdminPayments(
  token: string,
  query: AdminPaymentQuery = {}
) {
  return requestJson<AdminPayment[]>(
    withQuery(`${adminPath}/payments`, query),
    { token }
  )
}

export function listAdminActivations(
  token: string,
  query: ListQuery & { status?: ActivationStatus } = {}
) {
  return requestJson<ActivationRecord[]>(
    withQuery(`${adminPath}/activations`, query),
    { token }
  )
}

export function suspendPaidSales(
  token: string,
  eventId: string,
  reason: string
) {
  return requestJson<ActivationRecord>(
    `${adminPath}/events/${encodeURIComponent(eventId)}/paid-sales/suspend`,
    {
      token,
      method: "POST",
      json: { reason },
    }
  )
}

export function getActivationFee(token: string) {
  return requestJson<ActivationFee>(activationFeePath, { token })
}

export function updateActivationFee(token: string, amountKzt: string | number) {
  return requestJson<ActivationFee>(activationFeePath, {
    token,
    method: "PUT",
    json: { amountKzt },
  })
}

export function getPayoutBalance(token: string) {
  return requestJson<PayoutBalance>(`${payoutsPath}/balance`, { token })
}

export function listPayouts(token: string, query: ListQuery = {}) {
  return requestJson<Payout[]>(withQuery(payoutsPath, query), { token })
}

export function getPayout(token: string, payoutId: string) {
  return requestJson<Payout>(`${payoutsPath}/${encodeURIComponent(payoutId)}`, {
    token,
  })
}

export function requestPayout(token: string, json: PayoutRequest) {
  return requestJson<Payout>(payoutsPath, { token, method: "POST", json })
}
