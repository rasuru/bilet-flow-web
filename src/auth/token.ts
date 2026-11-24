const LOCAL_TOKEN_KEY = "biletflow.auth.token"
const SESSION_TOKEN_KEY = "biletflow.auth.token"
let inMemoryToken: string | null | undefined

export function getAuthToken(): string | null {
  if (inMemoryToken !== undefined) return inMemoryToken
  try {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY)
    if (token !== null) return token
  } catch {
    // The other storage may still be available.
  }
  try {
    return localStorage.getItem(LOCAL_TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeAuthToken(token: string, rememberMe: boolean): void {
  clearAuthToken()

  try {
    if (rememberMe) localStorage.setItem(LOCAL_TOKEN_KEY, token)
    else sessionStorage.setItem(SESSION_TOKEN_KEY, token)
    if (inMemoryToken === null) inMemoryToken = token
  } catch {
    inMemoryToken = token
  }
}

export function clearAuthToken(): void {
  inMemoryToken = undefined
  try {
    localStorage.removeItem(LOCAL_TOKEN_KEY)
  } catch {
    inMemoryToken = null
  }
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
  } catch {
    inMemoryToken = null
  }
}
