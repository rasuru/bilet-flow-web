import { Link } from "wouter"

import { buttonVariants } from "@/components/ui/button"

export function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Placeholder home page</h1>
      <Link
        to="/account/settings"
        className={buttonVariants({ variant: "outline" })}
      >
        Account settings
      </Link>
    </main>
  )
}
