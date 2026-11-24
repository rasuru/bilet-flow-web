import { useState } from "react"

import type { ManagedEvent } from "@/api/events"
import type { TicketType } from "@/api/inventory"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { t } from "@/i18n/locale"
import { EventManagementDialog } from "./EventManagementDialog"
import { TicketTierFields } from "./TicketTierFields"
import {
  useAddTicketViewModel,
  useEditTicketPriceViewModel,
  useManagedTicketsViewModel,
} from "./useEventManagementViewModels"

export function OrganizerTicketTypes({
  sessionId,
  event,
  notify,
}: {
  sessionId: number
  event: ManagedEvent
  notify: (message: string) => void
}) {
  const model = useManagedTicketsViewModel(sessionId, event)
  const editable = event.status !== "CANCELLED"
  return (
    <section
      id="organizer-tickets"
      aria-labelledby="ticket-types-title"
      className="scroll-mt-4"
    >
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            <h2 id="ticket-types-title" className="text-lg">
              {t("Ticket tiers")}
            </h2>
          </CardTitle>
          {editable && event.venue && model.loaded && !model.error && (
            <AddTicket
              sessionId={sessionId}
              event={event}
              tickets={model.tickets.map(({ ticket }) => ticket)}
              notify={notify}
            />
          )}
        </CardHeader>
        <CardContent>
          {!event.venue && (
            <p className="text-sm text-muted-foreground">
              {t("Add a venue before setting up ticket tiers.")}
            </p>
          )}
          {model.loading && (
            <p role="status" className="flex items-center gap-2 text-sm">
              <Spinner aria-hidden="true" /> {t("Loading ticket tiers…")}
            </p>
          )}
          {model.error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <p>{model.error}</p>
                <Button variant="outline" size="sm" onClick={model.retry}>
                  {t("Try again")}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {event.venue && model.loaded && !model.tickets.length && (
            <p className="text-sm text-muted-foreground">
              {t("This event has no ticket tiers yet.")}
            </p>
          )}
          {model.tickets.length > 0 && (
            <ul className="divide-y border-y">
              {model.tickets.map(({ ticket, price, status, salesWindow }) => (
                <li
                  key={ticket.id}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 py-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.7fr)_auto] lg:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-medium wrap-anywhere">{ticket.name}</h3>
                    <Badge variant="outline">{status}</Badge>
                  </div>
                  <div className="order-3 col-span-2 text-sm text-muted-foreground lg:order-0 lg:col-span-1">
                    <p>{salesWindow}</p>
                    {ticket.totalCapacity !== null && ticket.sold !== null && (
                      <p>
                        {t(
                          "{0} of {1} sold",
                          ticket.sold,
                          ticket.totalCapacity
                        )}
                      </p>
                    )}
                    {ticket.priceCategory && (
                      <p className="wrap-anywhere">{ticket.priceCategory}</p>
                    )}
                  </div>
                  <p className="text-right font-medium tabular-nums lg:text-left">
                    {price}
                  </p>
                  {editable && (
                    <div className="order-4 col-span-2 lg:order-0 lg:col-span-1">
                      <EditPrice
                        sessionId={sessionId}
                        ticket={ticket}
                        notify={notify}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function EditPrice({
  sessionId,
  ticket,
  notify,
}: {
  sessionId: number
  ticket: TicketType
  notify: (message: string) => void
}) {
  const [open, setOpen] = useState(false)
  const model = useEditTicketPriceViewModel(sessionId, ticket, () => {
    setOpen(false)
    notify("Ticket price saved.")
  })
  return (
    <EventManagementDialog
      open={open}
      onOpenChange={(next) => {
        if (next) model.reset()
        setOpen(next)
      }}
      trigger={t("Edit price")}
      title={t("Edit price for {0}", ticket.name)}
      description={t("The new price applies to future purchases.")}
      action={t("Save price")}
      model={model}
    >
      <Field>
        <FieldLabel htmlFor="ticket-price">{t("Price (KZT)")}</FieldLabel>
        <Input
          id="ticket-price"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={model.price}
          onChange={(e) => model.setPrice(e.target.value)}
          required
        />
        <FieldDescription>{t("Enter 0 for a free ticket.")}</FieldDescription>
      </Field>
    </EventManagementDialog>
  )
}

function AddTicket({
  sessionId,
  event,
  tickets,
  notify,
}: {
  sessionId: number
  event: ManagedEvent
  tickets: TicketType[]
  notify: (message: string) => void
}) {
  const [open, setOpen] = useState(false)
  const model = useAddTicketViewModel(sessionId, event, tickets, () => {
    setOpen(false)
    notify("Ticket tier added.")
  })
  return (
    <EventManagementDialog
      open={open}
      onOpenChange={(next) => {
        if (next) model.reset()
        setOpen(next)
      }}
      trigger={t("Add ticket tier")}
      title={t("Add ticket tier")}
      description={t("Prices are in KZT. Enter 0 for a free ticket.")}
      action={t("Save ticket tier")}
      model={model}
    >
      {model.assigned && (
        <Field>
          <FieldLabel htmlFor="ticket-category">
            {t("Seat price category")}
          </FieldLabel>
          <NativeSelect
            id="ticket-category"
            value={model.category}
            onChange={(e) => model.setCategory(e.target.value)}
            className="w-full"
            required
            disabled={!model.categories.length}
          >
            <NativeSelectOption value="">
              {model.loadingCategories
                ? t("Loading layouts…")
                : t("Select a seat price category")}
            </NativeSelectOption>
            {model.categories.map((category) => (
              <NativeSelectOption key={category} value={category}>
                {category}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {model.categoryError ? (
            <>
              <p role="alert" className="text-sm text-destructive">
                {model.categoryError}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={model.retryCategories}
              >
                {t("Try again")}
              </Button>
            </>
          ) : (
            !model.loadingCategories &&
            !model.categories.length && (
              <FieldDescription>
                {t("This layout has no seat price categories.")}
              </FieldDescription>
            )
          )}
        </Field>
      )}
      <TicketTierFields
        ticket={model.ticket}
        readOnlyQuantity={model.assigned}
        timeZone="UTC"
        onChange={model.updateTicket}
      />
    </EventManagementDialog>
  )
}
