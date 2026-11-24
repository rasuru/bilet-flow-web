import { t } from "@/i18n/locale"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { AccountFormField } from "@/pages/account/AccountFormField"
import { useProfileViewModel } from "./useProfileViewModel"

type Props = {
  sessionId: number
  account: Parameters<typeof useProfileViewModel>[1] & { login: string }
}

function ProfileForm({
  account,
  sessionId,
  onSaved,
  onCancel,
}: Props & {
  onSaved: () => void
  onCancel: () => void
}) {
  const model = useProfileViewModel(sessionId, account, onSaved)

  return (
    <form noValidate onSubmit={model.submit}>
      <fieldset disabled={model.isSubmitting} className="flex flex-col gap-4">
        <AccountFormField
          label={t("First name")}
          autoComplete="given-name"
          error={model.errors.firstName?.message}
          {...model.register("firstName")}
        />
        <AccountFormField
          label={t("Last name")}
          autoComplete="family-name"
          error={model.errors.lastName?.message}
          {...model.register("lastName")}
        />
        <AccountFormField
          label={t("Account email")}
          type="email"
          autoComplete="email"
          error={model.errors.email?.message}
          {...model.register("email")}
        />
        <AccountFormField
          label={t("Profile image URL")}
          type="url"
          error={model.errors.imageUrl?.message}
          {...model.register("imageUrl")}
        />
        {model.errors.root?.message && (
          <p role="alert" className="text-sm text-destructive">
            {model.errors.root.message}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">
            {model.isSubmitting ? t("Saving…") : t("Save profile")}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("Cancel")}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

export function ProfileSection({ account, sessionId }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-lg font-semibold">
        {t("Profile and contact email")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("BiletFlow uses your account email for sign-in and password reset.")}
      </p>
      {isEditing ? (
        <ProfileForm
          account={account}
          sessionId={sessionId}
          onCancel={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false)
            setSaved(true)
          }}
        />
      ) : (
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("Username")}</dt>
              <dd className="break-all">{account.login}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("Name")}</dt>
              <dd className="wrap-anywhere">
                {[account.firstName, account.lastName]
                  .filter(Boolean)
                  .join(" ") || t("Not set")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("Account email")}</dt>
              <dd className="wrap-anywhere">{account.email || t("Not set")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t("Profile image URL")}
              </dt>
              <dd className="wrap-anywhere">
                {account.imageUrl || t("Not set")}
              </dd>
            </div>
          </dl>
          {saved && (
            <p role="status" className="text-sm">
              {t("Profile saved.")}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSaved(false)
              setIsEditing(true)
            }}
          >
            {t("Edit profile")}
          </Button>
        </>
      )}
    </section>
  )
}


