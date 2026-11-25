import { t } from "@/i18n/locale"

export function refundPolicyDescription(hours: number | null) {
  if (hours === null) return t("Contact order support to request a refund.")
  if (hours === 0)
    return t(
      "Full refunds for unused orders are available until the event starts."
    )
  return t(
    "Full refunds for unused orders are available up to {0} hours before the event starts.",
    hours
  )
}
