import { Link } from "wouter"

import { AccountFlowPage } from "@/components/site/AccountFlowPage"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { t } from "@/i18n/locale"
import { useActivateAccountViewModel } from "./useActivateAccountViewModel"

export function ActivateAccountPage() {
  const { hasKey, isActivating, errorMessage } = useActivateAccountViewModel()
  const title = !hasKey
    ? "Invalid activation link"
    : isActivating
      ? "Activating account…"
      : errorMessage !== undefined
        ? "Account activation failed"
        : "Account verified"

  return (
    <AccountFlowPage title={t(title)} href="/" backLabel={t("Home")}>
      {!hasKey ? (
        <Alert role="alert" variant="destructive">
          <AlertDescription>
            {t("This activation link does not contain an activation key.")}
          </AlertDescription>
        </Alert>
      ) : isActivating ? (
        <p role="status" className="flex gap-2 text-muted-foreground">
          <Spinner aria-hidden="true" /> {t("Activating account…")}
        </p>
      ) : errorMessage !== undefined ? (
        <Alert role="alert" variant="destructive">
          <AlertDescription>{t(errorMessage)}</AlertDescription>
        </Alert>
      ) : (
        <p className="text-muted-foreground">
          {t("Your account has been activated. You can now log in.")}
        </p>
      )}
      {!isActivating && (
        <Link
          href="/sign-in"
          className={buttonVariants({
            className: "min-h-10 justify-self-start",
          })}
        >
          {t("Go to login")}
        </Link>
      )}
    </AccountFlowPage>
  )
}
