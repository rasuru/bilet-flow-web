import { useQuery } from "@tanstack/react-query"
import { useSearch } from "wouter"

import { accountRepository } from "@/auth/accountRepository"

export function useActivateAccountViewModel() {
  const search = useSearch()
  const key = new URLSearchParams(search).get("key") ?? ""

  const activation = useQuery(accountRepository.activationQuery(key))

  return {
    hasKey: key !== "",
    isActivating: activation.isPending,
    errorMessage: activation.error?.message,
  }
}
