import type { ComponentProps } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { TicketDraft } from "./createEventDraft"

type TicketTierFieldsProps = {
  ticket: TicketDraft
  title: string
  readOnlyQuantity: boolean
  timeZone: string
  salesSummary: string
  onChange: (changes: Partial<Omit<TicketDraft, "id">>) => void
  onCustomSales: (enabled: boolean) => void
  onRemove?: () => void
}

export function TicketTierFields({
  ticket,
  title,
  readOnlyQuantity,
  timeZone,
  salesSummary,
  onChange,
  onCustomSales,
  onRemove,
}: TicketTierFieldsProps) {
  function input(
    key: keyof Omit<TicketDraft, "id" | "customSales">,
    label: string,
    props: ComponentProps<typeof Input> = {},
    description?: string
  ) {
    const id = `ticket-${ticket.id}-${key}`
    return (
      <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Input
          {...props}
          id={id}
          value={ticket[key]}
          aria-describedby={description ? `${id}-description` : undefined}
          onChange={(e) => onChange({ [key]: e.target.value })}
        />
        {description && (
          <FieldDescription id={`${id}-description`}>
            {description}
          </FieldDescription>
        )}
      </Field>
    )
  }

  const salesId = `ticket-${ticket.id}-custom-sales`
  const validPrice = ticket.price !== "" && Number(ticket.price) >= 0

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <h2>{title}</h2>
          {validPrice && (
            <Badge>{Number(ticket.price) === 0 ? "Free" : "Paid"}</Badge>
          )}
        </CardTitle>
        {onRemove && (
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              aria-label={`Remove ${title.toLowerCase()}`}
            >
              Remove
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {input("name", "Tier name", { required: true })}
          {input("description", "Ticket description (optional)")}
          <div className="grid gap-4 sm:grid-cols-3">
            {input("price", "Price (KZT)", {
              type: "number",
              min: 0,
              step: "0.01",
              required: true,
            })}
            {input(
              "capacity",
              "Quantity",
              {
                type: "number",
                min: 1,
                readOnly: readOnlyQuantity,
                required: true,
              },
              readOnlyQuantity ? "Set by the venue layout." : undefined
            )}
            {input(
              "maxPerOrder",
              "Max per order",
              { type: "number", min: 1, required: true },
              "Maximum tickets from this tier in one order."
            )}
          </div>
          <div className="space-y-3 rounded-lg border p-3">
            <Field orientation="horizontal">
              <Checkbox
                id={salesId}
                checked={ticket.customSales}
                onCheckedChange={onCustomSales}
                aria-describedby={`${salesId}-description`}
              />
              <FieldLabel htmlFor={salesId}>Custom sales window</FieldLabel>
            </Field>
            <FieldDescription id={`${salesId}-description`}>
              {ticket.customSales
                ? `Sales times use ${timeZone}.`
                : salesSummary}
            </FieldDescription>
            {ticket.customSales && (
              <div className="grid gap-3 sm:grid-cols-2">
                {input("salesStartAt", "Sales start", {
                  type: "datetime-local",
                  required: true,
                })}
                {input("salesEndAt", "Sales end", {
                  type: "datetime-local",
                  required: true,
                })}
              </div>
            )}
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
