import { useQuery } from "@tanstack/react-query"

import { activateAccount } from "@/api/auth"
import { buttonVariants } from "@/components/ui/button"

function PageContainer({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <section className="w-full max-w-sm">
        {children}
      </section>
    </main>
  )
}

export function ActivateAccountPage() {
  const key = new URLSearchParams(
    window.location.search
  ).get("key")

  const activationQuery = useQuery({
    queryKey: ["account-activation", key],
    queryFn: () => activateAccount(key!),
    enabled: Boolean(key),
    retry: false,
  })

  if (!key) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-semibold">
          Invalid activation link
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This activation link does not contain an activation key.
        </p>

        <a
          href="/"
          className={buttonVariants({
            className: "mt-6",
          })}
        >
          Go to login
        </a>
      </PageContainer>
    )
  }

  if (activationQuery.isPending) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          Activating account…
        </p>
      </PageContainer>
    )
  }

  if (activationQuery.isError) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-semibold">
          Account activation failed
        </h1>

        <p
          className="mt-2 text-sm leading-relaxed text-destructive"
          role="alert"
        >
          {activationQuery.error.message}
        </p>

        <a
          href="/"
          className={buttonVariants({
            variant: "outline",
            className: "mt-6",
          })}
        >
          Go to login
        </a>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold">
        Account verified
      </h1>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Your account has been activated. You can now log in.
      </p>

      <a
        href="/"
        className={buttonVariants({
          className: "mt-6",
        })}
      >
        Log in
      </a>
    </PageContainer>
  )
}


