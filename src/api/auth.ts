import { ApiError, requestEmpty, requestJson, withQuery } from "@/api/client"

export type RegisterRequest = {
  login: string
  email: string
  password: string
  firstName?: string
  lastName?: string
  langKey?: string
}

export type AuthenticateRequest = {
  username: string
  password: string
  rememberMe: boolean
}

export type AuthenticateResponse = {
  id_token: string
}

export type AccountResponse = {
  id: number
  login: string
  firstName: string | null
  lastName: string | null
  email: string | null
  imageUrl: string | null
  activated: boolean
  langKey: string | null
  authorities: string[]
}

export type UpdateAccountRequest = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  imageUrl?: string | null
  langKey?: string | null
}

export function registerAccount(json: RegisterRequest) {
  return requestEmpty("/api/register", { method: "POST", json })
}

export function authenticate(json: AuthenticateRequest) {
  return requestJson<AuthenticateResponse>("/api/authenticate", {
    method: "POST",
    json,
  })
}

export async function isAuthenticated(token?: string): Promise<boolean> {
  try {
    await requestEmpty("/api/authenticate", { token })
    return true
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return false
    throw error
  }
}

export function activateAccount(key: string) {
  return requestEmpty(withQuery("/api/activate", { key }))
}

export function getAccount(token: string) {
  return requestJson<AccountResponse>("/api/account", { token })
}

/** Include the current values for fields the user wants to keep. */
export function updateAccount(token: string, json: UpdateAccountRequest) {
  return requestEmpty("/api/account", { token, method: "POST", json })
}

export function changePassword(
  token: string,
  json: {
    currentPassword: string
    newPassword: string
  }
) {
  return requestEmpty("/api/account/change-password", {
    token,
    method: "POST",
    json,
  })
}

export function requestPasswordReset(email: string) {
  return requestEmpty("/api/account/reset-password/init", {
    method: "POST",
    json: { email },
  })
}

export function finishPasswordReset(json: {
  key: string
  newPassword: string
}) {
  return requestEmpty("/api/account/reset-password/finish", {
    method: "POST",
    json,
  })
}
