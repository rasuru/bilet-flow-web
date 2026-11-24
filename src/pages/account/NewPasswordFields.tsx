import { t } from "@/i18n/locale"
import type { ComponentProps } from "react"

import { AccountFormField } from "./AccountFormField"

type InputProps = Omit<ComponentProps<typeof AccountFormField>, "label">

export function NewPasswordFields({
  password,
  confirmation,
}: {
  password: InputProps
  confirmation: InputProps
}) {
  return (
    <>
      <AccountFormField
        {...password}
        label={t("New password")}
        type="password"
        autoComplete="new-password"
      />
      <AccountFormField
        {...confirmation}
        label={t("Confirm new password")}
        type="password"
        autoComplete="new-password"
      />
    </>
  )
}


