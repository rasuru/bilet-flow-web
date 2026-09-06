import { useEffect, useReducer } from "react"
import { useQuery } from "@tanstack/react-query"
import { Route, Switch } from "wouter"

import { getAccount } from "@/api/auth"
import { ApiError } from "@/api/client"
import {
  clearAuthToken,
  getAuthToken,
} from "@/auth/token"
import { ActivateAccountPage } from "@/pages/account/ActivateAccountPage"
import { AuthPage } from "@/pages/auth/AuthPage"
import { HomePage } from "@/pages/home/HomePage"

function RootPage() {
  const [authRevision, authChanged] = useReducer(
    (revision: number) => revision + 1,
    0
  )

  const token = getAuthToken()

  const accountQuery = useQuery({
    queryKey: ["account", authRevision],
    queryFn: getAccount,
    enabled: token !== null,
    retry: false,
  })

  const unauthorized =
    accountQuery.error instanceof ApiError &&
    accountQuery.error.status === 401

  useEffect(() => {
    if (!unauthorized) {
      return
    }

    clearAuthToken()
    authChanged()
  }, [unauthorized])

  if (!token || unauthorized) {
    return (
      <AuthPage onAuthenticated={authChanged} />
    )
  }

  if (accountQuery.isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          Loading…
        </p>
      </main>
    )
  }

  if (accountQuery.isError) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold">
            Could not load account
          </h1>

          <p
            className="mt-2 text-sm text-destructive"
            role="alert"
          >
            {accountQuery.error.message}
          </p>
        </div>
      </main>
    )
  }

  return <HomePage />
}

export function App() {
  return (
    <Switch>
      <Route
        path="/account/activate"
        component={ActivateAccountPage}
      />

      <Route path="/" component={RootPage} />

      <Route>
        <main className="p-6">
          <p>Page not found</p>
        </main>
      </Route>
    </Switch>
  )
}

export default App


