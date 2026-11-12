import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { sessionRepository } from "@/auth/sessionRepository"
import {
  matchingPasswords,
  newPasswordFields,
  passwordsMatch,
} from "@/pages/account/passwordFields"

const schema = z
  .object({
    currentPassword: z
      .string()
      .refine((value) => value.trim() !== "", "Enter your current password"),
    ...newPasswordFields,
  })
  .refine(passwordsMatch, matchingPasswords)

export function useChangePasswordViewModel(sessionId: number) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    isComplete: form.formState.isSubmitSuccessful,
    submit: form.handleSubmit(async ({ currentPassword, newPassword }) => {
      try {
        await sessionRepository.changePassword(
          sessionId,
          currentPassword,
          newPassword
        )
        form.reset()
      } catch (error) {
        form.setError("root", {
          message:
            error instanceof Error
              ? error.message
              : "Could not change your password.",
        })
      }
    }),
  }
}
