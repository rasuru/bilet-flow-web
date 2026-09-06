const LOCAL_TOKEN_KEY = "biletflow.auth.token"
const SESSION_TOKEN_KEY = "biletflow.auth.token"

export function getAuthToken(): string | null {
  return (
    sessionStorage.getItem(SESSION_TOKEN_KEY) ??
    localStorage.getItem(LOCAL_TOKEN_KEY)
  )
}

export function storeAuthToken(
  token: string,
  rememberMe: boolean
): void {
  clearAuthToken()

  if (rememberMe) {
    localStorage.setItem(LOCAL_TOKEN_KEY, token)
    return
  }

  sessionStorage.setItem(SESSION_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(LOCAL_TOKEN_KEY)
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
}


