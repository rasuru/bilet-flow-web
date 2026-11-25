import type { PaymentSession } from "@/api/payments"
import { openHalykPayment } from "./halykPayment"

export async function openPayment(
  session: PaymentSession,
  returnPath: string,
  navigate: (path: string) => void
) {
  if ("mockPaymentId" in session && session.mockPaymentId) {
    navigate(`/payments/${encodeURIComponent(session.mockPaymentId)}/mock`)
    return
  }
  if ("paymentObject" in session) {
    await openHalykPayment(session, returnPath)
    return
  }
  throw new Error("Could not open the payment.")
}
