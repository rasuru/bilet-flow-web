import {
  apiRequest,
  authenticatedApiRequest,
} from "@/api/client"

export type RegisterRequest = {
  login: string
  email: string
  password: string
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
  firstName?: string
  lastName?: string
  email?: string
  imageUrl?: string
  activated: boolean
  langKey?: string
  authorities: string[]
}

export async function registerAccount(
  request: RegisterRequest
): Promise<void> {
  await apiRequest<void>("/api/register", {
    method: "POST",
    body: JSON.stringify(request),
  })
}

export async function authenticate(
  request: AuthenticateRequest
): Promise<AuthenticateResponse> {
  return apiRequest<AuthenticateResponse>("/api/authenticate", {
    method: "POST",
    body: JSON.stringify(request),
  })
}

export async function activateAccount(
  key: string
): Promise<null> {
  await apiRequest<void>(
    `/api/activate?key=${encodeURIComponent(key)}`
  )

  return null
}

export async function getAccount(): Promise<AccountResponse> {
  return authenticatedApiRequest<AccountResponse>("/api/account")
}