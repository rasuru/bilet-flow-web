import { t, useLanguage } from "@/i18n/locale"
import { lazy, Suspense, useEffect, type ReactNode } from "react"
import { Redirect, Route, Switch, useLocation } from "wouter"

import { useSessionViewModel } from "@/auth/useSessionViewModel"
import { SiteLayout } from "@/components/site/SiteLayout"
import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { Button } from "@/components/ui/button"
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
import { CreateEventPage } from "@/pages/organizer/CreateEventPage"
import { ManageEventPage } from "@/pages/organizer/ManageEventPage"
import { OrganizerStartPage } from "@/pages/organizer/OrganizerStartPage"
import { OrganizerDashboardPage } from "@/pages/organizer/OrganizerDashboardPage"
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
  const [path] = useLocation()
  const session = useSessionViewModel()
  const { status, errorMessage, retry } = session

  if (status === "signedOut") {
    return (
      <AuthPage
        forOrganizer={path === "/organizer" || path.startsWith("/organizer/")}
        creatingEvent={path === "/organizer/events/new"}
      />
    )
  }

  if (status === "restoring") {
    return (
      <SitePage width="compact" className="py-12">
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Spinner aria-hidden="true" />
          {t("Loading…")}
        </p>
      </SitePage>
    )
  }

  if (status === "restoreFailed") {
    return (
      <SitePage width="compact" className="py-12">
        <BackLink href="/">{t("Home")}</BackLink>
        <div className="w-full max-w-sm">
          <PageHeading>{t("Could not load account")}</PageHeading>

          <p className="mt-2 text-sm text-destructive" role="alert">
            {t(errorMessage ?? "Could not restore your session.")}
          </p>
          <Button className="mt-4" onClick={() => void retry()}>
            {t("Try again")}
          </Button>
        </div>
      </SitePage>
    )
  }

  return children(session)
}

export function App() {
  useLanguage()
  const [path] = useLocation()
  const session = useSessionViewModel()
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0)
  }, [path])
  const organizerWorkspace =
    /^\/organizer(?:\/events\/[^/]+(?:\/campaigns)?)?\/?$/.test(path) &&
    path !== "/organizer/start"
  const adminWorkspace = /^\/admin(?:\/[^/]+)?\/?$/.test(path)
  const ownLayout =
    (session.status === "signedIn" && organizerWorkspace) ||
    (session.canAccessAdmin && adminWorkspace)
  const routes = (
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
                      <Spinner aria-label={t("Loading administration")} />
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
                <SitePage width="compact">
                  <BackLink href="/">{t("Home")}</BackLink>
                  <PageHeading>
                    {t("Administrator access required")}
                  </PageHeading>
                </SitePage>
              )
            }
          </SignedInRoute>
        )}
      </Route>
      <Route path="/organizer/start" component={OrganizerStartPage} />
      <Route path="/organizer/events/new">
        <SignedInRoute>
          {({ sessionId }) => (
            <CreateEventPage key={sessionId} sessionId={sessionId} />
          )}
        </SignedInRoute>
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
      <Route path="/organizer/events/:eventId">
        {({ eventId }) => (
          <SignedInRoute>
            {({ sessionId }) => (
              <ManageEventPage
                key={`${sessionId}:${eventId}`}
                sessionId={sessionId}
                eventId={eventId}
              />
            )}
          </SignedInRoute>
        )}
      </Route>
      <Route path="/organizer/dashboard">
        <Redirect to="/organizer" replace />
      </Route>
      <Route path="/organizer/events">
        <Redirect to="/organizer" replace />
      </Route>

      <Route path="/organizer/support">
        <Redirect to="/support" />
      </Route>

      <Route path="/organizer/profile">
        <Redirect to="/account/settings" />
      </Route>

      <Route path="/organizer">
        <SignedInRoute>
          {({ sessionId }) => (
            <OrganizerDashboardPage key={sessionId} sessionId={sessionId} />
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
        <SignedInRoute>
          {({ account, sessionId }) => (
            <CreateSupportPage
              key={sessionId}
              accountId={account.id}
              sessionId={sessionId}
            />
          )}
        </SignedInRoute>
      </Route>
      <Route path="/support/:caseId">
        {({ caseId }) => (
          <SignedInRoute>
            {({ account, sessionId }) => (
              <SupportCasePage
                key={`${sessionId}:${caseId}`}
                accountId={account.id}
                sessionId={sessionId}
                caseId={caseId}
                platformAdmin={account.authorities.includes("ROLE_ADMIN")}
              />
            )}
          </SignedInRoute>
        )}
      </Route>
      <Route path="/support">
        <SignedInRoute>
          {({ account, sessionId }) => (
            <SupportListPage
              key={sessionId}
              accountId={account.id}
              sessionId={sessionId}
            />
          )}
        </SignedInRoute>
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
        <SitePage>
          <BackLink href="/">{t("Home")}</BackLink>
          <PageHeading>{t("Page not found")}</PageHeading>
        </SitePage>
      </Route>
    </Switch>
  )
  return ownLayout ? routes : <SiteLayout>{routes}</SiteLayout>
}

export default App

