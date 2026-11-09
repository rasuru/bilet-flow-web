import { Button } from "@/components/ui/button"
import { useRegisterViewModel } from "./useRegisterViewModel"

type RegisterFormProps = {
  onLogin: () => void
}

const inputClassName =
  "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

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
      <div>
        <label className="text-sm font-medium" htmlFor="register-login">
          Username
        </label>

        <input
          id="register-login"
          autoComplete="username"
          aria-invalid={fieldErrors.login ? true : undefined}
          className={inputClassName}
          {...register("login")}
        />

        {fieldErrors.login && (
          <p className="mt-1 text-sm text-destructive">
            {fieldErrors.login.message}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="register-email">
          Email
        </label>

        <input
          id="register-email"
          type="email"
          autoComplete="email"
          aria-invalid={fieldErrors.email ? true : undefined}
          className={inputClassName}
          {...register("email")}
        />

        {fieldErrors.email && (
          <p className="mt-1 text-sm text-destructive">
            {fieldErrors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="register-password">
          Password
        </label>

        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={fieldErrors.password ? true : undefined}
          className={inputClassName}
          {...register("password")}
        />

        {fieldErrors.password && (
          <p className="mt-1 text-sm text-destructive">
            {fieldErrors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          className="text-sm font-medium"
          htmlFor="register-confirm-password"
        >
          Confirm password
        </label>

        <input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={fieldErrors.confirmPassword ? true : undefined}
          className={inputClassName}
          {...register("confirmPassword")}
        />

        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-sm text-destructive">
            {fieldErrors.confirmPassword.message}
          </p>
        )}
      </div>

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
        <button
          type="button"
          className="font-medium text-foreground underline underline-offset-4"
          onClick={onLogin}
        >
          Log in
        </button>
      </p>
    </form>
  )
}
