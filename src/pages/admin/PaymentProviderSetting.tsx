import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { t } from "@/i18n/locale"
import { ActionFeedback, QueryContent } from "./AdminUi"
import { usePaymentProviderViewModel } from "./usePaymentProviderViewModel"

export function PaymentProviderSetting({ sessionId }: { sessionId: number }) {
  const model = usePaymentProviderViewModel(sessionId)
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>
          <h2>{t("Payment provider")}</h2>
        </CardTitle>
        <CardDescription>
          {t(
            "Applies to new ticket payments and activation fees. Existing payments and refunds stay with their original provider."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QueryContent state={model.query}>
          {model.current && (
            <form className="grid gap-3" onSubmit={model.submit}>
              <div className="flex flex-wrap items-end gap-3">
                <Field className="w-full sm:max-w-64">
                  <FieldLabel htmlFor="sandbox-provider">
                    {t("Provider for new payments")}
                  </FieldLabel>
                  <NativeSelect
                    id="sandbox-provider"
                    value={model.value}
                    disabled={model.saving}
                    onChange={(event) =>
                      model.change(event.currentTarget.value)
                    }
                    className="w-full"
                  >
                    <NativeSelectOption value="HALYK">
                      {t("Halyk ePay sandbox")}
                    </NativeSelectOption>
                    <NativeSelectOption value="MOCK">
                      {t("BiletFlow mock checkout")}
                    </NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Button type="submit" disabled={!model.canSave}>
                  {t(model.saving ? "Saving…" : "Save provider")}
                </Button>
              </div>
              <ActionFeedback error={model.error} success={model.success} />
            </form>
          )}
        </QueryContent>
      </CardContent>
    </Card>
  )
}
