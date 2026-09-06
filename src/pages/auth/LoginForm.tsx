import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { authenticate } from "@/api/auth"
import { storeAuthToken } from "@/auth/token"
import { Button } from "@/components/ui/button"

const schema = z.object({
  username: z
    .string()
    .min(1, "Username or email is required")
    .max(254, "Username or email is too long"),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(100, "Password is too long"),
  rememberMe: z.boolean(),
})

type LoginFormValues = z.infer<typeof schema>

type LoginFormProps = {
  onAuthenticated: () => void
  onRegister: () => void
}

const inputClassName =
  "mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function LoginForm({
  onAuthenticated,
  onRegister,
}: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  })

  const mutation = useMutation({
    mutationFn: authenticate,
    onSuccess: (response, request) => {
      storeAuthToken(response.id_token, request.rememberMe)
      onAuthenticated()
    },
  })

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
          htmlFor="login-username"
        >
          Username or email
        </label>

        <input
          id="login-username"
          autoComplete="username"
          aria-invalid={
            form.formState.errors.username ? true : undefined
          }
          className={inputClassName}
          {...form.register("username")}
        />

        {form.formState.errors.username && (
          <p className="mt-1 text-sm text-destructive">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      <div>
        <label
          className="text-sm font-medium"
          htmlFor="login-password"
        >
          Password
        </label>

        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          {...form.register("rememberMe")}
        />
        Remember me
      </label>

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
        {mutation.isPending ? "Logging in…" : "Log in"}
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


