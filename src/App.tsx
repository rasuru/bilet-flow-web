import { Route, Switch } from "wouter"

import { useSessionViewModel } from "@/auth/useSessionViewModel"
import { Button } from "@/components/ui/button"
import { ActivateAccountPage } from "@/pages/account/ActivateAccountPage"
import { AuthPage } from "@/pages/auth/AuthPage"
import { HomePage } from "@/pages/home/HomePage"

function RootPage() {
  const { status, errorMessage, retry } = useSessionViewModel()

  if (status === "signedOut") {
    return <AuthPage />
  }

  if (status === "restoring") {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    )
  }

  if (status === "restoreFailed") {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold">Could not load account</h1>

          <p className="mt-2 text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
          <Button className="mt-4" onClick={() => void retry()}>
            Try again
          </Button>
        </div>
      </main>
    )
  }

  return <HomePage />
}

export function App() {
  return (
    <Switch>
      <Route path="/account/activate" component={ActivateAccountPage} />

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
