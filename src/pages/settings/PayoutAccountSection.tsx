import { useId, useState } from "react"
import { Controller } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
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
  const consentId = useId()
  const consentErrorId = `${consentId}-error`

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
        <Controller
          name="acceptSimulation"
          control={model.control}
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id={consentId}
                name={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                disabled={model.isSubmitting}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? consentErrorId : undefined}
              />
              <FieldContent>
                <FieldLabel htmlFor={consentId}>
                  I agree to use this account for simulated payouts.
                </FieldLabel>
                <FieldError id={consentErrorId} errors={[fieldState.error]} />
              </FieldContent>
            </Field>
          )}
        />
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
