import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import { adminRepository } from "@/admin/adminRepository"
import type { PaymentProvider } from "@/api/payments"
import { t } from "@/i18n/locale"
import { adminError } from "./adminPresentation"
import { adminQueryView } from "./adminQueryView"

export function usePaymentProviderViewModel(sessionId: number) {
  const client = useQueryClient()
  const query = useQuery(adminRepository.paymentProvider(sessionId))
  const [draft, setDraft] = useState<PaymentProvider>()
  const save = useMutation({
    mutationFn: (provider: PaymentProvider) =>
      adminRepository.changePaymentProvider(client, sessionId, provider),
    onSuccess: () => setDraft(undefined),
  })
  const current = query.data?.provider
  const value = draft ?? current
  const canSave =
    !!current &&
    !!value &&
    value !== current &&
    !save.isPending &&
    !query.isError

  return {
    query: adminQueryView(query),
    current,
    value,
    canSave,
    saving: save.isPending,
    success: save.isSuccess ? t("Payment provider saved.") : null,
    error: save.error
      ? (adminError(save.error) ?? t("Could not save the payment provider."))
      : null,
    change: (provider: string) => {
      if (provider === "HALYK" || provider === "MOCK") {
        save.reset()
        setDraft(provider)
      }
    },
    submit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (canSave) save.mutate(value)
    },
  }
}
