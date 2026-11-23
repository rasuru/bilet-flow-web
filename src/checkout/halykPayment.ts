import type { HalykPaymentSession } from "@/api/payments"

declare global {
  interface Window {
    halyk?: { pay: (payment: Record<string, unknown>) => void }
  }
}

const allowedScripts = new Set([
  "https://test-epay.epayment.kz/payform/payment-api.js",
  "https://test-epay.homebank.kz/payform/payment-api.js",
  "https://epay.homebank.kz/payform/payment-api.js",
])

let loadedScript: { url: string; promise: Promise<void> } | undefined

function loadPaymentScript(url: string) {
  if (!allowedScripts.has(url))
    throw new Error("The payment service returned an unrecognized script URL.")
  if (loadedScript?.url === url) return loadedScript.promise
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = url
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      reject(new Error("Couldn’t load Halyk ePay. Try again."))
    }
    document.head.append(script)
  }).catch((error: unknown) => {
    if (loadedScript?.url === url) loadedScript = undefined
    throw error
  })
  loadedScript = { url, promise }
  return promise
}

export async function openHalykPayment(
  { auth, scriptUrl, paymentObject }: HalykPaymentSession,
  orderPath: string
) {
  const paymentAuth = paymentObject.auth ?? auth
  if (
    !paymentAuth ||
    typeof paymentAuth !== "object" ||
    !("access_token" in paymentAuth) ||
    typeof paymentAuth.access_token !== "string" ||
    !paymentAuth.access_token.trim()
  ) {
    throw new Error("Halyk ePay did not return a payment token.")
  }

  await loadPaymentScript(scriptUrl)
  if (!window.halyk?.pay) throw new Error("Halyk ePay is unavailable.")
  const returnUrl = new URL(orderPath, window.location.origin).href
  window.halyk.pay({
    ...paymentObject,
    auth: paymentAuth,
    backLink: returnUrl,
    failureBackLink: returnUrl,
    autoBackLink: true,
  })
}
