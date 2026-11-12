import type { ReactNode } from "react"
import { Redirect, Route, Switch } from "wouter"

import { useSessionViewModel } from "@/auth/useSessionViewModel"
import { Button } from "@/components/ui/button"
import { ActivateAccountPage } from "@/pages/account/ActivateAccountPage"
import {
  FinishPasswordResetPage,
  RequestPasswordResetPage,
} from "@/pages/account/PasswordResetPages"
import { AuthPage } from "@/pages/auth/AuthPage"
import { EventDetailsPage } from "@/pages/events/EventDetailsPage"
import { EventDiscoveryPage, HomePage } from "@/pages/home/HomePage"

import { SettingsPage } from "@/pages/settings/SettingsPage"

type SignedInSession = Extract<
  ReturnType<typeof useSessionViewModel>,
  { status: "signedIn" }
>

function SignedInRoute({
  children,
}: {
  children: (session: SignedInSession) => ReactNode
}) {
  const session = useSessionViewModel()
  const { status, errorMessage, retry } = session

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

  return children(session)
}

export function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/events" component={EventDiscoveryPage} />
      <Route path="/events/:eventId">
        {({ eventId }) => <EventDetailsPage key={eventId} eventId={eventId} />}
      </Route>
      <Route path="/sign-in">
        <SignedInRoute>{() => <Redirect to="/" />}</SignedInRoute>
      </Route>

      <Route path="/account/activate" component={ActivateAccountPage} />

      <Route
        path="/account/reset/request"
        component={RequestPasswordResetPage}
      />
      <Route path="/account/reset/finish" component={FinishPasswordResetPage} />
      <Route path="/account/settings">
        <SignedInRoute>
          {({ account, sessionId }) => (
            <SettingsPage
              key={sessionId}
              account={account}
              sessionId={sessionId}
            />
          )}
        </SignedInRoute>
      </Route>

      <Route>
        <main className="p-6">
          <p>Page not found</p>
        </main>
      </Route>
    </Switch>
  )
}

export default App
