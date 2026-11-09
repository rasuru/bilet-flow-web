import { Button } from "@/components/ui/button"
import { useSignInViewModel } from "./useSignInViewModel"

type LoginFormProps = {
  onRegister: () => void
}

const inputClassName =
  "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function LoginForm({ onRegister }: LoginFormProps) {
  const { register, fieldErrors, submit, isSubmitting, formError } =
    useSignInViewModel()

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <div>
        <label className="text-sm font-medium" htmlFor="login-username">
          Username or email
        </label>

        <input
          id="login-username"
          autoComplete="username"
          aria-invalid={fieldErrors.username ? true : undefined}
          className={inputClassName}
          {...register("username")}
        />

        {fieldErrors.username && (
          <p className="mt-1 text-sm text-destructive">
            {fieldErrors.username.message}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="login-password">
          Password
        </label>

        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
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

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("rememberMe")} />
        Remember me
      </label>

      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="font-medium text-foreground underline underline-offset-4"
          onClick={onRegister}
        >
          Sign up
        </button>
      </p>
    </form>
  )
}
