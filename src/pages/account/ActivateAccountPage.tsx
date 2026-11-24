import { t } from "@/i18n/locale"
import { buttonVariants } from "@/components/ui/button"
import { useActivateAccountViewModel } from "./useActivateAccountViewModel"

function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <section className="w-full max-w-sm">{children}</section>
    </main>
  )
}

export function ActivateAccountPage() {
  const { hasKey, isActivating, errorMessage } = useActivateAccountViewModel()

  if (!hasKey) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-semibold">
          {t("Invalid activation link")}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("This activation link does not contain an activation key.")}
        </p>

        <a
          href="/"
          className={buttonVariants({
            className: "mt-6",
          })}
        >
          {t("Go to login")}
        </a>
      </PageContainer>
    )
  }

  if (isActivating) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          {t("Activating account…")}
        </p>
      </PageContainer>
    )
  }

  if (errorMessage !== undefined) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-semibold">
          {t("Account activation failed")}
        </h1>

        <p
          className="mt-2 text-sm leading-relaxed text-destructive"
          role="alert"
        >
          {t(errorMessage)}
        </p>

        <a
          href="/"
          className={buttonVariants({
            variant: "outline",
            className: "mt-6",
          })}
        >
          {t("Go to login")}
        </a>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold">{t("Account verified")}</h1>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t("Your account has been activated. You can now log in.")}
      </p>

      <a
        href="/"
        className={buttonVariants({
          className: "mt-6",
        })}
      >
        {t("Log in")}
      </a>
    </PageContainer>
  )
}


