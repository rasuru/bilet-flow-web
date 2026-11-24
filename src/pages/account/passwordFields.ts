import { z } from "zod"

export const newPasswordFields = {
  newPassword: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(100, "Password must be at most 100 characters")
    .refine((value) => value.trim() !== "", "Enter a password"),
  confirmPassword: z.string(),
}

export const matchingPasswords = {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}

export function passwordsMatch(values: {
  newPassword: string
  confirmPassword: string
}) {
  return values.newPassword === values.confirmPassword
}
