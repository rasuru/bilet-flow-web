import { Link } from "wouter"

import { Button } from "@/components/ui/button"
import { useSignInViewModel } from "./useSignInViewModel"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

type LoginFormProps = {
  onRegister: () => void
}

export function LoginForm({ onRegister }: LoginFormProps) {
  const { register, fieldErrors, submit, isSubmitting, formError } =
    useSignInViewModel()

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor="login-username">Username or email</FieldLabel>

        <Input
          id="login-username"
          autoComplete="username"
          aria-invalid={fieldErrors.username ? true : undefined}
          {...register("username")}
        />

        {fieldErrors.username && (
          <FieldDescription>{fieldErrors.username.message}</FieldDescription>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="login-password">Password</FieldLabel>

        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={fieldErrors.password ? true : undefined}
          {...register("password")}
        />

        {fieldErrors.password && (
          <FieldDescription>{fieldErrors.password.message}</FieldDescription>
        )}
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Field orientation="horizontal" className="w-auto">
          <Checkbox id="remember-me" {...register("rememberMe")} />
          <FieldLabel htmlFor="remember-me">Remember me</FieldLabel>
        </Field>

        <Link
          to="/account/reset/request"
          className="underline underline-offset-4"
        >
          Forgot password?
        </Link>
      </div>

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
        <Button
          variant={"link"}
          className="text-foreground"
          onClick={onRegister}
        >
          Sign up
        </Button>
      </p>
    </form>
  )
}
