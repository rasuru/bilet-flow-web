import type { ReactNode } from "react"
import { Link } from "wouter"

import { Button } from "@/components/ui/button"
import { AccountFormField } from "./AccountFormField"
import { NewPasswordFields } from "./NewPasswordFields"
import {
  useFinishPasswordResetViewModel,
  usePasswordResetKey,
  useRequestPasswordResetViewModel,
} from "./usePasswordResetViewModel"

function ResetPage({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <section className="w-full max-w-sm space-y-5">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {children}
        <Link to="/" replace className="text-sm underline underline-offset-4">
          Back to login
        </Link>
      </section>
    </main>
  )
}

export function RequestPasswordResetPage() {
  const model = useRequestPasswordResetViewModel()

  return (
    <ResetPage title="Reset your password">
      {model.isComplete ? (
        <p role="status" className="text-sm text-muted-foreground">
          If an eligible account uses this email address, you’ll receive a
          password reset link.
        </p>
      ) : (
        <form noValidate onSubmit={model.submit}>
          <fieldset
            disabled={model.isSubmitting}
            className="flex flex-col gap-4"
          >
            <p className="text-sm text-muted-foreground">
              Enter your account email address to request a reset link.
            </p>
            <AccountFormField
              label="Email address"
              type="email"
              autoComplete="email"
              error={model.errors.email?.message}
              {...model.register("email")}
            />
            {model.errors.root?.message && (
              <p role="alert" className="text-sm text-destructive">
                {model.errors.root.message}
              </p>
            )}
            <Button type="submit" size="lg">
              {model.isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </fieldset>
        </form>
      )}
    </ResetPage>
  )
}

function FinishPasswordResetForm({ resetKey }: { resetKey: string }) {
  const model = useFinishPasswordResetViewModel(resetKey)

  if (model.isComplete) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Your password has been reset. You can now log in with your new password.
      </p>
    )
  }

  return (
    <form noValidate onSubmit={model.submit}>
      <fieldset disabled={model.isSubmitting} className="flex flex-col gap-4">
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
        <Button type="submit" size="lg">
          {model.isSubmitting ? "Saving…" : "Set new password"}
        </Button>
      </fieldset>
    </form>
  )
}

export function FinishPasswordResetPage() {
  const key = usePasswordResetKey()

  return (
    <ResetPage title="Choose a new password">
      {key ? (
        <FinishPasswordResetForm key={key} resetKey={key} />
      ) : (
        <p role="alert" className="text-sm text-destructive">
          This link is missing its password reset key.
        </p>
      )}
      <p className="text-sm">
        <Link
          to="/account/reset/request"
          replace
          className="underline underline-offset-4"
        >
          Request a new reset link
        </Link>
      </p>
    </ResetPage>
  )
}
