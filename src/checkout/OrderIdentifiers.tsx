import { useState } from "react"

import { Button } from "@/components/ui/button"
import { t } from "@/i18n/locale"

function Identifier({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  const [feedback, setFeedback] = useState("")
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium">{label}</dt>
      <dd className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 font-mono text-sm break-all select-all">
          {value || t("Unavailable")}
        </span>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label={t("Copy {0}", label)}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value)
                setFeedback(t("Copied"))
              } catch {
                setFeedback(
                  t("Copy unavailable. Select the ID to copy it manually.")
                )
              }
            }}
          >
            {t("Copy ID")}
          </Button>
        )}
        <span role="status" className="text-sm text-muted-foreground">
          {feedback}
        </span>
      </dd>
    </div>
  )
}

export function OrderIdentifiers({
  checkoutId,
  orderId,
}: {
  checkoutId: string
  orderId?: string | null
}) {
  return (
    <dl className="space-y-2">
      <Identifier
        key={checkoutId}
        label={t("Checkout ID")}
        value={checkoutId}
      />
      <Identifier
        key={`order:${orderId}`}
        label={t("Order ID")}
        value={orderId}
      />
    </dl>
  )
}
