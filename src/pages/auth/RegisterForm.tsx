import { t } from "@/i18n/locale"
import { Button } from "@/components/ui/button"
import { AccountFormField } from "@/pages/account/AccountFormField"
import { useRegisterViewModel } from "./useRegisterViewModel"

type RegisterFormProps = {
  onLogin: () => void
}

export function RegisterForm({ onLogin }: RegisterFormProps) {
  const {
    register,
    fieldErrors,
    submit,
    isSubmitting,
    formError,
    isRegistered,
  } = useRegisterViewModel()

  if (isRegistered) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold">
            {t("Verification link sent")}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t(
              "Check your email and open the verification link to activate your account."
            )}
          </p>
        </div>

        <Button type="button" variant="outline" onClick={onLogin}>
          {t("Back to login")}
        </Button>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <AccountFormField
        label={t("Username")}
        autoComplete="username"
        error={fieldErrors.login?.message}
        {...register("login")}
      />
      <AccountFormField
        label={t("Email")}
        type="email"
        autoComplete="email"
        error={fieldErrors.email?.message}
        {...register("email")}
      />
      <AccountFormField
        label={t("Password")}
        type="password"
        autoComplete="new-password"
        error={fieldErrors.password?.message}
        {...register("password")}
      />
      <AccountFormField
        label={t("Confirm password")}
        type="password"
        autoComplete="new-password"
        error={fieldErrors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? t("Creating account…") : t("Create account")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("Already have an account?")}{" "}
        <Button
          type="button"
          variant="link"
          className="h-auto px-0 text-foreground"
          onClick={onLogin}
        >
          {t("Log in")}
        </Button>
      </p>
    </form>
  )
}


