import { useState } from "react"

import type { ManagedEvent } from "@/api/events"
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

export function EditEventDetails({ sessionId, event, notify }: SettingsProps) {
  const [open, setOpen] = useState(false)
  const model = useEditEventViewModel(sessionId, event, () => {
    setOpen(false)
    notify("Event details saved.")
  })
  return (
    <EventManagementDialog
      open={open}
      onOpenChange={(next) => {
        if (next) model.reset()
        setOpen(next)
      }}
      trigger={t("Edit event details")}
      title={t("Edit event details")}
      action={t("Save changes")}
      model={model}
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
