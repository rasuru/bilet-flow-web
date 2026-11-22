import { lazy, Suspense, type ReactNode } from "react"
import { Link, Redirect, Route, Switch } from "wouter"

import { useSessionViewModel } from "@/auth/useSessionViewModel"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ActivateAccountPage } from "@/pages/account/ActivateAccountPage"
import {
  FinishPasswordResetPage,
  RequestPasswordResetPage,
} from "@/pages/account/PasswordResetPages"
import { AuthPage } from "@/pages/auth/AuthPage"
import { BuyTicketsPage } from "@/pages/checkout/BuyTicketsPage"
import { OrderPage } from "@/pages/checkout/OrderPage"
import { EventDetailsPage } from "@/pages/events/EventDetailsPage"
import { EventDiscoveryPage, HomePage } from "@/pages/home/HomePage"

import { SupportListPage } from "@/pages/support/SupportListPage"
import { CreateSupportPage } from "@/pages/support/CreateSupportPage"
import { SupportCasePage } from "@/pages/support/SupportCasePage"
import { SettingsPage } from "@/pages/settings/SettingsPage"
import { EventCampaignsPage } from "@/pages/organizer/EventCampaignsPage"
import { OrganizerPage } from "@/pages/organizer/OrganizerPage"
import { MyTicketsPage } from "@/pages/tickets/MyTicketsPage"
import { TicketDetailsPage } from "@/pages/tickets/TicketDetailsPage"

const AdminDashboardPage = lazy(() =>
  import("@/pages/admin/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
  }))
)

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
      <Route path="/admin/:section?">
        {({ section }) => (
          <SignedInRoute>
            {({ account, canAccessAdmin, sessionId }) =>
              canAccessAdmin ? (
                <Suspense
                  fallback={
                    <main className="grid min-h-svh place-items-center">
                      <Spinner aria-label="Loading administration" />
                    </main>
                  }
                >
                  <AdminDashboardPage
                    key={sessionId}
                    login={account.login}
                    sessionId={sessionId}
                    section={section ?? "overview"}
                  />
                </Suspense>
              ) : (
                <main className="mx-auto max-w-lg space-y-4 px-4 py-12">
                  <h1 className="text-2xl font-semibold">
                    Administrator access required
                  </h1>
                  <Link
                    href="/"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Back to site
                  </Link>
                </main>
              )
            }
          </SignedInRoute>
        )}
      </Route>
      <Route path="/organizer/events/:eventId/campaigns">
        {({ eventId }) => (
          <SignedInRoute>
            {({ sessionId }) => (
              <EventCampaignsPage
                key={`${sessionId}:${eventId}`}
                sessionId={sessionId}
                eventId={eventId}
              />
            )}
          </SignedInRoute>
        )}
      </Route>
      <Route path="/organizer">
        <SignedInRoute>
          {({ sessionId }) => (
            <OrganizerPage key={sessionId} sessionId={sessionId} />
          )}
        </SignedInRoute>
      </Route>
      <Route path="/events" component={EventDiscoveryPage} />
      <Route path="/events/:eventId/buy">
        {({ eventId }) => <BuyTicketsPage key={eventId} eventId={eventId} />}
      </Route>
      <Route path="/events/:eventId">
        {({ eventId }) => <EventDetailsPage key={eventId} eventId={eventId} />}
      </Route>
      <Route path="/my-tickets/:ticketId">
        {({ ticketId }) => (
          <SignedInRoute>
            {({ account, sessionId }) => (
              <TicketDetailsPage
                key={`${sessionId}:${ticketId}`}
                sessionId={sessionId}
                ticketId={ticketId}
                verifiedEmail={account.activated ? account.email : null}
              />
            )}
          </SignedInRoute>
        )}
      </Route>
      <Route path="/my-tickets">
        <SignedInRoute>
          {({ account, sessionId }) => (
            <MyTicketsPage
              key={sessionId}
              sessionId={sessionId}
              verifiedEmail={account.activated ? account.email : null}
            />
          )}
        </SignedInRoute>
      </Route>
      <Route path="/orders/:orderId">
        {({ orderId }) => (
          <SignedInRoute>
            {({ sessionId }) => (
              <OrderPage
                key={`${sessionId}:${orderId}`}
                orderId={orderId}
                sessionId={sessionId}
              />
            )}
          </SignedInRoute>
        )}
      </Route>
      <Route path="/support/new">
        <SignedInRoute>{({ account, sessionId }) => <CreateSupportPage key={sessionId} accountId={account.id} sessionId={sessionId} />}</SignedInRoute>
      </Route>
      <Route path="/support/:caseId">
        {({ caseId }) => <SignedInRoute>{({ account, sessionId }) => <SupportCasePage key={`${sessionId}:${caseId}`} accountId={account.id} sessionId={sessionId} caseId={caseId} />}</SignedInRoute>}
      </Route>
      <Route path="/support">
        <SignedInRoute>{({ account, sessionId }) => <SupportListPage key={sessionId} accountId={account.id} sessionId={sessionId} />}</SignedInRoute>
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


