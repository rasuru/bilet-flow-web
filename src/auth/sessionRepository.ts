import { createStore } from "zustand/vanilla"

import { authenticate, getAccount } from "@/api/auth"
import type { AccountResponse, AuthenticateRequest } from "@/api/auth"
import { ApiError } from "@/api/client"
import { clearAuthToken, getAuthToken, storeAuthToken } from "@/auth/token"

type SessionState =
  | { status: "restoring" }
  | { status: "signedOut" }
  | { status: "signedIn"; account: AccountResponse }
  | { status: "restoreFailed"; error: unknown }

const store = createStore<SessionState>(() => ({ status: "restoring" }))
let revision = 0
let restoration: Promise<void> | undefined

function signOut() {
  clearAuthToken()
  revision += 1
  restoration = undefined
  store.setState({ status: "signedOut" }, true)
}

async function restoreSavedSession(attempt: number) {
  try {
    const token = getAuthToken()
    if (!token) {
      store.setState({ status: "signedOut" }, true)
      return
    }

    const account = await getAccount(token)
    if (attempt === revision) {
      store.setState({ status: "signedIn", account }, true)
    }
  } catch (error) {
    if (attempt !== revision) return

    if (error instanceof ApiError && error.status === 401) {
      try {
        signOut()
        return
      } catch (storageError) {
        store.setState({ status: "restoreFailed", error: storageError }, true)
        return
      }
    }

    store.setState({ status: "restoreFailed", error }, true)
  }
}

function restoreSession() {
  if (restoration) return restoration
  const attempt = ++revision
  store.setState({ status: "restoring" }, true)
  restoration = restoreSavedSession(attempt).finally(() => {
    if (attempt === revision) restoration = undefined
  })
  return restoration
}

async function signIn(request: AuthenticateRequest) {
  const attempt = ++revision
  restoration = undefined
  const { id_token: token } = await authenticate(request)
  const account = await getAccount(token)
  if (attempt !== revision) return

  storeAuthToken(token, request.rememberMe)
  store.setState({ status: "signedIn", account }, true)
}

export const sessionRepository = {
  getSnapshot: store.getState,
  subscribe: store.subscribe,
  restoreSession,
  signIn,
  signOut,
}
