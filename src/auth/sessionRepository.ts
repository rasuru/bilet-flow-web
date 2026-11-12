import { createStore } from "zustand/vanilla"

import {
  authenticate,
  changePassword,
  getAccount,
  updateAccount,
} from "@/api/auth"
import type { AccountResponse, AuthenticateRequest } from "@/api/auth"
import { ApiError } from "@/api/client"
import { clearAuthToken, getAuthToken, storeAuthToken } from "@/auth/token"
import { accountRequest } from "./accountRequestError"

export { AccountRequestError } from "./accountRequestError"

type SessionState =
  | { status: "restoring" }
  | { status: "signedOut" }
  | { status: "signedIn"; account: AccountResponse; sessionId: number }
  | { status: "restoreFailed"; error: unknown }

const store = createStore<SessionState>(() => ({ status: "restoring" }))
let revision = 0
let sessionToken: string | undefined
let restoration: Promise<void> | undefined

function signOut() {
  clearAuthToken()
  sessionToken = undefined
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
      sessionToken = token
      store.setState({ status: "signedIn", account, sessionId: attempt }, true)
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
  const { id_token: token } = await accountRequest(() => authenticate(request))
  const account = await accountRequest(() => getAccount(token))
  if (attempt !== revision) return

  storeAuthToken(token, request.rememberMe)
  sessionToken = token
  store.setState({ status: "signedIn", account, sessionId: attempt }, true)
}

async function authenticatedRequest<T>(
  sessionId: number,
  request: (token: string) => Promise<T>
): Promise<T> {
  const session = store.getState()
  const token = sessionToken
  if (
    session.status !== "signedIn" ||
    session.sessionId !== sessionId ||
    !token
  ) {
    throw new Error("Sign in to continue.")
  }

  try {
    return await request(token)
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      revision === sessionId
    ) {
      signOut()
    }
    throw error
  }
}

type ProfileUpdate = Pick<
  AccountResponse,
  "firstName" | "lastName" | "email" | "imageUrl"
>

async function saveProfile(sessionId: number, profile: ProfileUpdate) {
  const session = store.getState()
  if (session.status !== "signedIn") throw new Error("Sign in to continue.")

  // The API replaces profile fields. Keep the existing email when it is null
  // in the request and preserve the account's language setting.
  const changes = {
    ...profile,
    email: profile.email?.toLowerCase() ?? session.account.email,
  }
  await accountRequest(() =>
    authenticatedRequest(sessionId, (token) =>
      updateAccount(token, { ...changes, langKey: session.account.langKey })
    )
  )

  const current = store.getState()
  if (current.status === "signedIn" && current.sessionId === sessionId) {
    store.setState(
      { ...current, account: { ...current.account, ...changes } },
      true
    )
  }
}

export const sessionRepository = {
  getSnapshot: store.getState,
  subscribe: store.subscribe,
  restoreSession,
  signIn,
  signOut,
  authenticatedRequest,
  saveProfile,
  changePassword(
    sessionId: number,
    currentPassword: string,
    newPassword: string
  ) {
    return accountRequest(() =>
      authenticatedRequest(sessionId, (token) =>
        changePassword(token, { currentPassword, newPassword })
      )
    )
  },
}
