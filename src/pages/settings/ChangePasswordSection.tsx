import { t } from "@/i18n/locale"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AccountFormField } from "@/pages/account/AccountFormField"
import { NewPasswordFields } from "@/pages/account/NewPasswordFields"
import { useChangePasswordViewModel } from "./useChangePasswordViewModel"

export function ChangePasswordSection({ sessionId }: { sessionId: number }) {
  const model = useChangePasswordViewModel(sessionId)

  return (
    <section
      id="security"
      className="scroll-mt-5"
      aria-labelledby="security-heading"
    >
      <Card className="gap-4 p-5">
        <h2
          id="security-heading"
          className="text-xl font-semibold tracking-tight"
        >
          {t("Change password")}
        </h2>
        <details className="group">
          <summary className="w-fit cursor-pointer rounded-md py-2 font-medium focus-visible:outline-2 focus-visible:outline-ring">
            {t("Update your password")}
          </summary>
          <form noValidate onSubmit={model.submit} className="mt-4">
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
        </details>
      </Card>
    </section>
  )
}
