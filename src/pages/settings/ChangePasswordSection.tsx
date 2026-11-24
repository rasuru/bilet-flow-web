import { t } from "@/i18n/locale"
import { Button } from "@/components/ui/button"
import { AccountFormField } from "@/pages/account/AccountFormField"
import { NewPasswordFields } from "@/pages/account/NewPasswordFields"
import { useChangePasswordViewModel } from "./useChangePasswordViewModel"

export function ChangePasswordSection({ sessionId }: { sessionId: number }) {
  const model = useChangePasswordViewModel(sessionId)

  return (
    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-lg font-semibold">{t("Change password")}</h2>
      <form noValidate onSubmit={model.submit}>
        <fieldset
          disabled={model.isSubmitting}
          className="flex flex-col items-start gap-4 [&>div]:w-full"
        >
          <AccountFormField
            label={t("Current password")}
            type="password"
            autoComplete="current-password"
            error={model.errors.currentPassword?.message}
            {...model.register("currentPassword")}
          />
          <NewPasswordFields
            password={{
              ...model.register("newPassword"),
              error: model.errors.newPassword?.message,
            }}
            confirmation={{
              ...model.register("confirmPassword"),
              error: model.errors.confirmPassword?.message,
            }}
          />
          {model.errors.root?.message && (
            <p role="alert" className="text-sm text-destructive">
              {model.errors.root.message}
            </p>
          )}
          {model.isComplete && (
            <p role="status" className="text-sm">
              {t("Password changed.")}
            </p>
          )}
          <Button type="submit">
            {model.isSubmitting ? t("Saving…") : t("Change password")}
          </Button>
        </fieldset>
      </form>
    </section>
  )
}


