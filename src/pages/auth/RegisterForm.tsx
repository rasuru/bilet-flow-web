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
          <h2 className="text-xl font-semibold">Verification link sent</h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Check your email and open the verification link to activate your
            account.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={onLogin}>
          Back to login
        </Button>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <AccountFormField
        label="Username"
        autoComplete="username"
        error={fieldErrors.login?.message}
        {...register("login")}
      />
      <AccountFormField
        label="Email"
        type="email"
        autoComplete="email"
        error={fieldErrors.email?.message}
        {...register("email")}
      />
      <AccountFormField
        label="Password"
        type="password"
        autoComplete="new-password"
        error={fieldErrors.password?.message}
        {...register("password")}
      />
      <AccountFormField
        label="Confirm password"
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
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Button
          type="button"
          variant="link"
          className="h-auto px-0 text-foreground"
          onClick={onLogin}
        >
          Log in
        </Button>
      </p>
    </form>
  )
}
