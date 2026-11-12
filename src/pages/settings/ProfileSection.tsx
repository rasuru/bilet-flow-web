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
          label="First name"
          autoComplete="given-name"
          error={model.errors.firstName?.message}
          {...model.register("firstName")}
        />
        <AccountFormField
          label="Last name"
          autoComplete="family-name"
          error={model.errors.lastName?.message}
          {...model.register("lastName")}
        />
        <AccountFormField
          label="Account email"
          type="email"
          autoComplete="email"
          error={model.errors.email?.message}
          {...model.register("email")}
        />
        <AccountFormField
          label="Profile image URL"
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
            {model.isSubmitting ? "Saving…" : "Save profile"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
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
      <h2 className="text-lg font-semibold">Profile and contact email</h2>
      <p className="text-sm text-muted-foreground">
        BiletFlow uses your account email for sign-in and password reset.
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
              <dt className="text-muted-foreground">Username</dt>
              <dd className="break-all">{account.login}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="wrap-anywhere">
                {[account.firstName, account.lastName]
                  .filter(Boolean)
                  .join(" ") || "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Account email</dt>
              <dd className="wrap-anywhere">{account.email || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Profile image URL</dt>
              <dd className="wrap-anywhere">{account.imageUrl || "Not set"}</dd>
            </div>
          </dl>
          {saved && (
            <p role="status" className="text-sm">
              Profile saved.
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
            Edit profile
          </Button>
        </>
      )}
    </section>
  )
}
