import { useEffect, useSyncExternalStore } from "react"

import { sessionRepository } from "./sessionRepository"

export function useSessionViewModel() {
  const session = useSyncExternalStore(
    sessionRepository.subscribe,
    sessionRepository.getSnapshot
  )

  useEffect(() => {
    if (sessionRepository.getSnapshot().status === "restoring") {
      void sessionRepository.restoreSession()
    }
  }, [])

  return {
    ...session,
    errorMessage:
      session.status === "restoreFailed"
        ? session.error instanceof Error
          ? session.error.message
          : "Could not restore your session."
        : undefined,
    retry: sessionRepository.restoreSession,
  }
}
