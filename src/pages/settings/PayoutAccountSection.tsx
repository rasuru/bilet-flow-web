import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { AccountFormField } from "@/pages/account/AccountFormField"
import {
  usePayoutAccountViewModel,
  useSavePayoutAccountViewModel,
} from "./usePayoutAccountViewModel"

function PayoutAccountForm({
  sessionId,
  holderName,
  onSaved,
  onCancel,
}: {
  sessionId: number
  holderName: string
  onSaved: () => void
  onCancel: () => void
}) {
  const model = useSavePayoutAccountViewModel(sessionId, holderName, onSaved)
  const consentErrorId = useId()

  return (
    <form noValidate onSubmit={model.submit}>
      <fieldset disabled={model.isSubmitting} className="flex flex-col gap-4">
        <AccountFormField
          label="Account holder name"
          error={model.errors.holderName?.message}
          {...model.register("holderName")}
        />
        <AccountFormField
          label="Kazakhstan IBAN"
          autoComplete="off"
          spellCheck={false}
          error={model.errors.iban?.message}
          {...model.register("iban")}
        />
        <div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              aria-invalid={model.errors.acceptSimulation ? true : undefined}
              aria-describedby={
                model.errors.acceptSimulation ? consentErrorId : undefined
              }
              {...model.register("acceptSimulation")}
            />
            I agree to use this account for simulated payouts.
          </label>
          {model.errors.acceptSimulation && (
            <p id={consentErrorId} className="mt-1 text-sm text-destructive">
              {model.errors.acceptSimulation.message}
            </p>
          )}
        </div>
        {model.errors.root?.message && (
          <p role="alert" className="text-sm text-destructive">
            {model.errors.root.message}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">
            {model.isSubmitting ? "Saving…" : "Save payout account"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

export function PayoutAccountSection({ sessionId }: { sessionId: number }) {
  const model = usePayoutAccountViewModel(sessionId)
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-lg font-semibold">Payout account</h2>
      <p className="text-sm text-muted-foreground">
        BiletFlow simulates payouts. The backend checks the IBAN format and
        displays a masked account number.
      </p>
      {model.isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading payout account…
        </p>
      ) : model.account === undefined ? (
        <>
          <p role="alert" className="text-sm text-destructive">
            {model.error || "Could not load the payout account."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void model.retry()}
          >
            Try again
          </Button>
        </>
      ) : isEditing ? (
        <PayoutAccountForm
          sessionId={sessionId}
          holderName={model.account?.holderName ?? ""}
          onCancel={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false)
            setSaved(true)
          }}
        />
      ) : (
        <>
          {model.account ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Account holder</dt>
                <dd className="wrap-anywhere">{model.account.holderName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">IBAN</dt>
                <dd>{model.account.maskedIban}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              You haven’t set up a payout account yet.
            </p>
          )}
          {saved && (
            <p role="status" className="text-sm">
              Payout account saved.
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
            {model.account ? "Replace payout account" : "Set up payout account"}
          </Button>
        </>
      )}
    </section>
  )
}
