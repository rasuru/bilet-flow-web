import { t } from "@/i18n/locale"
import { AccountFlowPage } from "@/components/site/AccountFlowPage"
import { useState } from "react"

import { LoginForm } from "@/pages/auth/LoginForm"
import { RegisterForm } from "@/pages/auth/RegisterForm"

type AuthMode = "login" | "register"

export function AuthPage({
  forOrganizer = false,
  creatingEvent = false,
}: {
  forOrganizer?: boolean
  creatingEvent?: boolean
}) {
  const [mode, setMode] = useState<AuthMode>("login")

  return (
    <AccountFlowPage
      title={t(
        mode === "register"
          ? "Create an account"
          : creatingEvent
            ? "Sign in to create an event"
            : "Log in"
      )}
      href={forOrganizer ? "/organizer/start" : "/"}
      backLabel={t(forOrganizer ? "Organize an event" : "Home")}
    >
      {mode === "login" ? (
        <LoginForm onRegister={() => setMode("register")} />
      ) : (
        <RegisterForm onLogin={() => setMode("login")} />
      )}
    </AccountFlowPage>
  )
}
