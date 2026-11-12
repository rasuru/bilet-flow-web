import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { payoutAccountRepository } from "@/payments/payoutAccountRepository"

function hasValidIbanChecksum(iban: string) {
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  const digits = Array.from(rearranged, (character) =>
    Number.parseInt(character, 36)
  ).join("")
  return BigInt(digits) % 97n === 1n
}

const schema = z.object({
  holderName: z
    .string()
    .trim()
    .min(1, "Enter the account holder’s name")
    .max(100, "Account holder name must be at most 100 characters"),
  iban: z
    .string()
    .max(40, "IBAN must be at most 40 characters")
    .transform((value) => value.replaceAll(" ", "").toUpperCase())
    .pipe(
      z
        .string()
        .regex(/^KZ\d{5}[A-Z0-9]{13}$/, {
          message: "Enter a Kazakhstan IBAN",
          abort: true,
        })
        .refine(hasValidIbanChecksum, {
          message: "IBAN check digits do not match",
          abort: true,
        })
    ),
  acceptSimulation: z
    .boolean()
    .refine(Boolean, "Confirm that this payout account is for simulation"),
})

export function usePayoutAccountViewModel(sessionId: number) {
  const query = useQuery(payoutAccountRepository.accountQuery(sessionId))

  return {
    account: query.data,
    isLoading: query.isPending,
    error: query.error?.message,
    retry: query.refetch,
  }
}

export function useSavePayoutAccountViewModel(
  sessionId: number,
  holderName: string,
  onSaved: () => void
) {
  const client = useQueryClient()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { holderName, iban: "", acceptSimulation: false },
  })

  return {
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    submit: form.handleSubmit(async (values) => {
      try {
        await payoutAccountRepository.saveAccount(client, sessionId, values)
        onSaved()
      } catch (error) {
        form.setError("root", {
          message:
            error instanceof Error
              ? error.message
              : "Could not save the payout account.",
        })
      }
    }),
  }
}
