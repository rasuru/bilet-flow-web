import { Controller } from "react-hook-form"
import { Link } from "wouter"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { AccountFormField } from "@/pages/account/AccountFormField"
import { useSignInViewModel } from "./useSignInViewModel"

type LoginFormProps = {
  onRegister: () => void
}

export function LoginForm({ onRegister }: LoginFormProps) {
  const { register, control, fieldErrors, submit, isSubmitting, formError } =
    useSignInViewModel()

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <AccountFormField
        label="Username or email"
        autoComplete="username"
        error={fieldErrors.username?.message}
        {...register("username")}
      />
      <AccountFormField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={fieldErrors.password?.message}
        {...register("password")}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Field orientation="horizontal" className="w-auto">
          <Controller
            name="rememberMe"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="remember-me"
                name={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
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
          type="button"
          variant="link"
          className="h-auto px-0 text-foreground"
          onClick={onRegister}
        >
          Sign up
        </Button>
      </p>
    </form>
  )
}
