import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  AccountRequestError,
  sessionRepository,
} from "@/auth/sessionRepository"

const email = z
  .string()
  .min(5, "Enter a valid email address")
  .max(254, "Email address is too long")
  .pipe(z.email("Enter a valid email address"))
const imageUrl = z
  .string()
  .max(256, "Image URL must be at most 256 characters")
  .pipe(
    z.url({ protocol: /^https?$/, error: "Enter an HTTP or HTTPS image URL" })
  )

const schema = z.object({
  firstName: z
    .string()
    .trim()
    .max(50, "First name must be at most 50 characters"),
  lastName: z
    .string()
    .trim()
    .max(50, "Last name must be at most 50 characters"),
  email: z.string().trim(),
  imageUrl: z.string().trim(),
})

type Profile = Parameters<typeof sessionRepository.saveProfile>[1]

export function useProfileViewModel(
  sessionId: number,
  profile: Profile,
  onSaved: () => void
) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      email: profile.email ?? "",
      imageUrl: profile.imageUrl ?? "",
    },
  })

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    submit: form.handleSubmit(async (values) => {
      // Preserve existing values, including a missing email or a legacy image URL.
      const emailChanged = values.email !== (profile.email?.trim() ?? "")
      const imageChanged = values.imageUrl !== (profile.imageUrl?.trim() ?? "")

      if (emailChanged) {
        const result = email.safeParse(values.email)
        if (!result.success) {
          form.setError(
            "email",
            { message: result.error.issues[0]?.message },
            { shouldFocus: true }
          )
          return
        }
      }

      if (imageChanged && values.imageUrl) {
        const result = imageUrl.safeParse(values.imageUrl)
        if (!result.success) {
          form.setError(
            "imageUrl",
            { message: result.error.issues[0]?.message },
            { shouldFocus: true }
          )
          return
        }
      }

      try {
        await sessionRepository.saveProfile(sessionId, {
          firstName: values.firstName || null,
          lastName: values.lastName || null,
          email: emailChanged ? values.email : profile.email,
          imageUrl: imageChanged ? values.imageUrl || null : profile.imageUrl,
        })
        onSaved()
      } catch (error) {
        if (
          error instanceof AccountRequestError &&
          error.duplicateField === "email"
        ) {
          form.setError("email", { message: error.message })
          return
        }

        form.setError("root", {
          message:
            error instanceof Error
              ? error.message
              : "Could not save your profile.",
        })
      }
    }),
  }
}
