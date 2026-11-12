import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useSearch } from "wouter"
import { z } from "zod"

import { accountRepository } from "@/auth/accountRepository"
import {
  matchingPasswords,
  newPasswordFields,
  passwordsMatch,
} from "./passwordFields"

const requestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(5, "Enter a valid email address")
    .max(254, "Email address is too long")
    .pipe(z.email("Enter a valid email address")),
})

const finishSchema = z
  .object(newPasswordFields)
  .refine(passwordsMatch, matchingPasswords)

export function useRequestPasswordResetViewModel() {
  const form = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  })

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    isComplete: form.formState.isSubmitSuccessful,
    submit: form.handleSubmit(async ({ email }) => {
      try {
        await accountRepository.requestPasswordReset(email)
      } catch (error) {
        form.setError("root", {
          message:
            error instanceof Error
              ? error.message
              : "Could not request a reset link.",
        })
      }
    }),
  }
}

export function useFinishPasswordResetViewModel(key: string) {
  const form = useForm({
    resolver: zodResolver(finishSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    isComplete: form.formState.isSubmitSuccessful,
    submit: form.handleSubmit(async ({ newPassword }) => {
      if (!key) return

      try {
        await accountRepository.finishPasswordReset(key, newPassword)
        form.reset()
      } catch (error) {
        form.setError("root", {
          message:
            error instanceof Error
              ? error.message
              : "Could not reset your password.",
        })
      }
    }),
  }
}

export function usePasswordResetKey() {
  return new URLSearchParams(useSearch()).get("key")?.trim() ?? ""
}
