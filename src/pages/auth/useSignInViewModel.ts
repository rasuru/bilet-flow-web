import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  AccountRequestError,
  sessionRepository,
} from "@/auth/sessionRepository"

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

export function useSignInViewModel() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  })

  const mutation = useMutation({
    mutationFn: sessionRepository.signIn,
    onError: (error) => {
      if (!(error instanceof AccountRequestError)) return

      for (const { field, message, code } of error.fieldErrors) {
        if (field === "username" || field === "password") {
          form.setError(field, { type: code ?? "server", message })
        }
      }
    },
  })

  return {
    register: form.register,
    control: form.control,
    fieldErrors: form.formState.errors,
    submit: form.handleSubmit((values) => {
      if (!mutation.isPending) mutation.mutate(values)
    }),
    isSubmitting: mutation.isPending,
    formError: mutation.error?.message,
  }
}
