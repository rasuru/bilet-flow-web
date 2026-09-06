import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { registerAccount } from "@/api/auth"
import { Button } from "@/components/ui/button"

const schema = z
  .object({
    login: z
      .string()
      .min(1, "Username is required")
      .max(50, "Username must be at most 50 characters"),
    email: z
      .string()
      .min(5, "Email is too short")
      .max(254, "Email is too long")
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(4, "Password must be at least 4 characters")
      .max(100, "Password must be at most 100 characters"),
    confirmPassword: z.string(),
  })
  .refine(
    (values) => values.password === values.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  )

type RegisterFormValues = z.infer<typeof schema>

type RegisterFormProps = {
  onLogin: () => void
}

const inputClassName =
  "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function RegisterForm({
  onLogin,
}: RegisterFormProps) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      login: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      registerAccount({
        login: values.login,
        email: values.email,
        password: values.password,
      }),
  })

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold">
            Verification link sent
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Check your email and open the verification link to
            activate your account.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onLogin}
        >
          Back to login
        </Button>
      </div>
    )
  }

  const submit = form.handleSubmit((values) => {
    mutation.mutate(values)
  })

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={submit}
    >
      <div>
        <label
          className="text-sm font-medium"
          htmlFor="register-login"
        >
          Username
        </label>

        <input
          id="register-login"
          autoComplete="username"
          aria-invalid={
            form.formState.errors.login ? true : undefined
          }
          className={inputClassName}
          {...form.register("login")}
        />

        {form.formState.errors.login && (
          <p className="mt-1 text-sm text-destructive">
            {form.formState.errors.login.message}
          </p>
        )}
      </div>

      <div>
        <label
          className="text-sm font-medium"
          htmlFor="register-email"
        >
          Email
        </label>

        <input
          id="register-email"
          type="email"
          autoComplete="email"
          aria-invalid={
            form.formState.errors.email ? true : undefined
          }
          className={inputClassName}
          {...form.register("email")}
        />

        {form.formState.errors.email && (
          <p className="mt-1 text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label
          className="text-sm font-medium"
          htmlFor="register-password"
        >
          Password
        </label>

        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={
            form.formState.errors.password ? true : undefined
          }
          className={inputClassName}
          {...form.register("password")}
        />

        {form.formState.errors.password && (
          <p className="mt-1 text-sm text-destructive">
            {form.formState.errors.password.message}
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
          aria-invalid={
            form.formState.errors.confirmPassword
              ? true
              : undefined
          }
          className={inputClassName}
          {...form.register("confirmPassword")}
        />

        {form.formState.errors.confirmPassword && (
          <p className="mt-1 text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {mutation.error && (
        <p
          className="text-sm text-destructive"
          role="alert"
        >
          {mutation.error.message}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={mutation.isPending}
      >
        {mutation.isPending
          ? "Creating account…"
          : "Create account"}
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


