import { useState } from "react"

import type { ManagedEvent } from "@/api/events"
import { Button } from "@/components/ui/button"
import type { ManagedEventAction } from "@/events/managedEventRepository"
import type { OrganizerEvent } from "./organizerEventPresentation"
import { t } from "@/i18n/locale"
import { EventDetailsFields } from "./EventDetailsFields"
import { EventManagementDialog } from "./EventManagementDialog"
import { EventVenueFields } from "./EventVenueFields"
import {
  useAttachVenueViewModel,
  useEditEventViewModel,
} from "./useEventManagementViewModels"

type SettingsProps = {
  sessionId: number
  event: ManagedEvent
  notify: (message: string) => void
}

export function EditEventDetails({ sessionId, event, notify, actions, onAction }: SettingsProps & {
  actions: OrganizerEvent["menuActions"]
  onAction: (action: ManagedEventAction) => void
}) {
  const [open, setOpen] = useState(false)
  const model = useEditEventViewModel(sessionId, event, () => {
    setOpen(false)
    notify("Event details saved.")
  })
  const lifecycleDisabled = model.busy || model.hasUnsavedChanges
  function requestAction(action: ManagedEventAction) {
    if (lifecycleDisabled) return
    setOpen(false)
    onAction(action)
  }
  return (
    <EventManagementDialog
      open={open}
      onOpenChange={(next) => {
        if (next) model.reset()
        setOpen(next)
      }}
      trigger={t("Edit event")}
      title={t("Edit event")}
      action={t("Save changes")}
      model={model}
      additionalActions={actions.length > 0 && (
        <section className="space-y-2 rounded-lg bg-muted/50 p-3" aria-label={t("Event status")}>
          <h3 className="font-medium">{t("Event status")}</h3>
          {model.hasUnsavedChanges && (
            <p className="text-sm text-muted-foreground" role="status">
              {t("Save changes before changing the event status.")}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {actions.map(({ action, label, variant }) => (
              <Button
                key={action}
                type="button"
                variant={variant === "destructive" ? "destructive" : "outline"}
                className="min-h-9 max-w-full whitespace-normal"
                disabled={lifecycleDisabled}
                onClick={() => requestAction(action)}
              >
                {label}
              </Button>
            ))}
          </div>
        </section>
      )}
    >
      <EventDetailsFields
        event={model.event}
        setField={model.setField}
        dateStep={0.001}
      />
    </EventManagementDialog>
  )
}

export function AttachEventVenue({ sessionId, event, notify }: SettingsProps) {
  const [open, setOpen] = useState(false)
  const model = useAttachVenueViewModel(sessionId, event, () => {
    setOpen(false)
    notify("Venue added.")
  })
  return (
    <EventManagementDialog
      open={open}
      onOpenChange={(next) => {
        if (next) model.reset()
        setOpen(next)
      }}
      trigger={t("Add venue")}
      title={t("Add venue")}
      action={t("Save venue")}
      model={model}
    >
      <EventVenueFields {...model} />
    </EventManagementDialog>
  )
}

