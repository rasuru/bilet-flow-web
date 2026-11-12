import { queryOptions } from "@tanstack/react-query"

import {
  activateAccount,
  finishPasswordReset,
  registerAccount,
  requestPasswordReset,
} from "@/api/auth"
import type { RegisterRequest } from "@/api/auth"
import { accountRequest } from "./accountRequestError"

export { AccountRequestError } from "./accountRequestError"

export const accountRepository = {
  register(request: RegisterRequest) {
    return accountRequest(() => registerAccount(request))
  },

  requestPasswordReset(email: string) {
    return accountRequest(() => requestPasswordReset(email))
  },

  finishPasswordReset(key: string, newPassword: string) {
    return accountRequest(() => finishPasswordReset({ key, newPassword }))
  },

  activationQuery(key: string) {
    return queryOptions({
      queryKey: ["account-activation", key],
      queryFn: () =>
        accountRequest(async () => {
          await activateAccount(key)
          return true
        }),
      enabled: key !== "",
      // A successful activation consumes the key.
      retry: false,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })
  },
}
