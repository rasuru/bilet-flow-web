import { useLocation, useSearch } from "wouter"

import type { AccountResponse } from "@/api/auth"
import { sessionRepository } from "@/auth/sessionRepository"

export function useSettingsViewModel(account: AccountResponse) {
  const [, navigate] = useLocation()
  const params = new URLSearchParams(useSearch())
  return {
    name:
      [account.firstName, account.lastName].filter(Boolean).join(" ").trim() ||
      account.login,
    returnToOrganizer: params.get("from") === "organizer",
    signOut() {
      sessionRepository.signOut()
      navigate("/", { replace: true })
    },
  }
}
