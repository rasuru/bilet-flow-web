import { useState } from "react"

import { LoginForm } from "@/pages/auth/LoginForm"
import { RegisterForm } from "@/pages/auth/RegisterForm"

type AuthMode = "login" | "register"

type AuthPageProps = {
  onAuthenticated: () => void
}

export function AuthPage({
  onAuthenticated,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login")

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <section className="w-full max-w-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">
            {mode === "login"
              ? "Log in"
              : "Create an account"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Log in to continue to BiletFlow."
              : "Create your BiletFlow account."}
          </p>
        </header>

        {mode === "login" ? (
          <LoginForm
            onAuthenticated={onAuthenticated}
            onRegister={() => setMode("register")}
          />
        ) : (
          <RegisterForm
            onLogin={() => setMode("login")}
          />
        )}
      </section>
    </main>
  )
}


