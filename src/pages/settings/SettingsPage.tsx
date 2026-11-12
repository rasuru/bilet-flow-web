import type { ComponentProps } from "react"
import { Link, useLocation } from "wouter"

import { sessionRepository } from "@/auth/sessionRepository"
import { Button } from "@/components/ui/button"
import { ChangePasswordSection } from "./ChangePasswordSection"
import { ProfileSection } from "./ProfileSection"

export function SettingsPage({
  account,
  sessionId,
}: ComponentProps<typeof ProfileSection>) {
  const [_, navigate] = useLocation()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <header className="space-y-2">
        <Link to="/" className="text-sm underline underline-offset-4">
          Back to home
        </Link>
        <h1 className="mt-8 text-2xl font-semibold">Account settings</h1>
      </header>
      <ProfileSection account={account} sessionId={sessionId} />
      <ChangePasswordSection sessionId={sessionId} />
      <Button
        variant={"outline"}
        className="mt-4"
        onClick={() => {
          sessionRepository.signOut()
          navigate("/")
        }}
      >
        Log out
      </Button>
    </main>
  )
}
