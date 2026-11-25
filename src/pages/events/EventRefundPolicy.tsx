import type { RefundPolicy } from "@/api/events"
import { dateFormat, t } from "@/i18n/locale"

const cutoffFormat = dateFormat({ dateStyle: "medium", timeStyle: "short" })

export function EventRefundPolicy({
  policy,
}: {
  policy?: RefundPolicy | null
}) {
  if (!policy) return null
  const cutoff = policy.refundableUntil
  return (
    <section className="space-y-1 rounded-lg border p-4">
      <h2 className="font-semibold">{t("Refund policy")}</h2>
      <p>{t(policy.summary)}</p>
      {cutoff && (
        <p>
          {t("Refund deadline")}{" "}
          <time dateTime={cutoff}>{cutoffFormat.format(new Date(cutoff))}</time>
        </p>
      )}
      {policy.terms && (
        <p className="wrap-anywhere whitespace-pre-wrap">{policy.terms}</p>
      )}
    </section>
  )
}
