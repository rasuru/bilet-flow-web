import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * UI-only login/signup screen — no API calls. Submitting either form just
 * navigates straight to the event-creation wizard, standing in for "you're
 * signed in now."
 */

type Mode = "login" | "signup"

export function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("login")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!emailIsValid) {
      setError("Enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }

    setError(null)
    navigate("/organizer/events/new")
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="w-[380px]">
        <div className="mb-4 grid grid-cols-2 rounded-lg border p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setError(null)
            }}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup")
              setError(null)
            }}
            className={`rounded-md py-1.5 font-medium transition-colors ${
              mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Sign up
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "login" ? "Welcome back" : "Create an account"}</CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Log in to manage your events."
                : "Set up an organizer account to start creating events."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {mode === "signup" && (
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                {mode === "login" ? "Log in" : "Sign up"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default AuthPage
