import { useQuery } from "@tanstack/react-query"
import { useSearch } from "wouter"

import { activateAccount } from "@/api/auth"

export function useActivateAccountViewModel() {
  const search = useSearch()
  const key = new URLSearchParams(search).get("key") ?? ""

  const activation = useQuery({
    queryKey: ["account-activation", key],
    queryFn: async () => {
      await activateAccount(key)
      return true
    },
    enabled: key !== "",
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return {
    hasKey: key !== "",
    isActivating: activation.isPending,
    errorMessage: activation.error?.message,
  }
}
