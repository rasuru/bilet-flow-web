import { queryOptions } from "@tanstack/react-query"

import { activateAccount, registerAccount } from "@/api/auth"
import type { RegisterRequest } from "@/api/auth"
import { accountRequest } from "./accountRequestError"

export { AccountRequestError } from "./accountRequestError"

export const accountRepository = {
  register(request: RegisterRequest) {
    return accountRequest(() => registerAccount(request))
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
