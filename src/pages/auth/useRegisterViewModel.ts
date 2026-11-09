import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { registerAccount } from "@/api/auth"

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
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof schema>

export function useRegisterViewModel() {
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

  return {
    register: form.register,
    fieldErrors: form.formState.errors,
    submit: form.handleSubmit((values) => {
      if (!mutation.isPending) mutation.mutate(values)
    }),
    isSubmitting: mutation.isPending,
    formError: mutation.error?.message,
    isRegistered: mutation.isSuccess,
  }
}
