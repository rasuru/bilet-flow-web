import { t } from "@/i18n/locale"

export function TransactionNotice() {
  return (
    <p className="text-xs text-muted-foreground">
      {t("This is a demo. All transactions are simulated.")}
    </p>
  )
}
