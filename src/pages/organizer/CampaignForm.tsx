import { useId } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

import { useCreateCampaignViewModel } from "./useCreateCampaignViewModel"

export function CampaignForm({
  sessionId,
  eventId,
  ticketTypes,
  ticketTypesLoading,
  ticketTypesError,
  retryTicketTypes,
  onCreated,
}: {
  sessionId: number
  eventId: string
  ticketTypes: { id: string; name: string }[]
  ticketTypesLoading: boolean
  ticketTypesError: string | null
  retryTicketTypes: () => void
  onCreated: () => void
}) {
  const model = useCreateCampaignViewModel(sessionId, eventId, onCreated)
  const id = useId()
  const { draft, edit } = model
  const percentage = draft.discountType === "PERCENTAGE"

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Create campaign</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={model.submit} noValidate>
          <FieldSet disabled={model.pending}>
            <Field>
              <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
              <Input
                id={`${id}-name`}
                autoFocus
                maxLength={100}
                required
                value={draft.name}
                onChange={(e) => edit({ name: e.currentTarget.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${id}-kind`}>Discount type</FieldLabel>
                <NativeSelect
                  id={`${id}-kind`}
                  value={draft.discountType}
                  onChange={(e) =>
                    edit({
                      discountType:
                        e.currentTarget.value === "FIXED_KZT"
                          ? "FIXED_KZT"
                          : "PERCENTAGE",
                    })
                  }
                >
                  <NativeSelectOption value="PERCENTAGE">
                    Percentage
                  </NativeSelectOption>
                  <NativeSelectOption value="FIXED_KZT">
                    Fixed KZT
                  </NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-value`}>
                  {percentage ? "Discount (%)" : "Discount (KZT)"}
                </FieldLabel>
                <Input
                  id={`${id}-value`}
                  required
                  inputMode="decimal"
                  value={draft.discountValue}
                  onChange={(e) =>
                    edit({ discountValue: e.currentTarget.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-start`}>Starts</FieldLabel>
                <Input
                  id={`${id}-start`}
                  type="datetime-local"
                  required
                  value={draft.validFrom}
                  onChange={(e) => edit({ validFrom: e.currentTarget.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${id}-end`}>Ends</FieldLabel>
                <Input
                  id={`${id}-end`}
                  type="datetime-local"
                  required
                  value={draft.validUntil}
                  onChange={(e) => edit({ validUntil: e.currentTarget.value })}
                />
              </Field>
            </div>
            <FieldDescription>
              Dates and times use your device’s time zone.
            </FieldDescription>
            <Field>
              <FieldLabel htmlFor={`${id}-limit`}>Redemption limit</FieldLabel>
              <Input
                id={`${id}-limit`}
                inputMode="numeric"
                value={draft.maxRedemptions}
                aria-describedby={`${id}-limit-hint`}
                onChange={(e) =>
                  edit({ maxRedemptions: e.currentTarget.value })
                }
              />
              <FieldDescription id={`${id}-limit-hint`}>
                Leave blank for unlimited redemptions.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-scope`}>Eligible tickets</FieldLabel>
              <NativeSelect
                id={`${id}-scope`}
                value={draft.ticketScope}
                onChange={(e) =>
                  edit({
                    ticketScope:
                      e.currentTarget.value === "selected" ? "selected" : "all",
                  })
                }
              >
                <NativeSelectOption value="all">
                  All ticket types
                </NativeSelectOption>
                <NativeSelectOption value="selected">
                  Selected ticket types
                </NativeSelectOption>
              </NativeSelect>
            </Field>
            {draft.ticketScope === "selected" && (
              <FieldSet className="gap-3">
                <FieldLegend variant="label">Select ticket types</FieldLegend>
                {ticketTypesLoading && (
                  <p role="status">Loading ticket types…</p>
                )}
                {ticketTypesError && (
                  <div className="space-y-2">
                    <FieldError>{ticketTypesError}</FieldError>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={retryTicketTypes}
                    >
                      Retry ticket types
                    </Button>
                  </div>
                )}
                {!ticketTypesLoading &&
                  !ticketTypesError &&
                  ticketTypes.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No ticket types are configured for this event.
                    </p>
                  )}
                {ticketTypes.map((ticket) => (
                  <Field orientation="horizontal" key={ticket.id}>
                    <Checkbox
                      id={`${id}-${ticket.id}`}
                      checked={draft.ticketIds.includes(ticket.id)}
                      onCheckedChange={(checked) =>
                        model.toggleTicketType(ticket.id, checked)
                      }
                    />
                    <FieldLabel htmlFor={`${id}-${ticket.id}`}>
                      {ticket.name}
                    </FieldLabel>
                  </Field>
                ))}
              </FieldSet>
            )}
            {model.error && <FieldError>{model.error}</FieldError>}
            <div>
              <Button type="submit">
                {model.pending ? "Creating…" : "Create campaign"}
              </Button>
            </div>
          </FieldSet>
        </form>
      </CardContent>
    </Card>
  )
}
