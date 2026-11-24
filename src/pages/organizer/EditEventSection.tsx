import { useMutation } from "@tanstack/react-query"
import { useState } from "react"

import {
  attachVenue,
  updateEvent,
  type ManagedEvent,
  type RegistrationWindowRequest,
  type VenueRequest,
} from "@/api/events"
import { sessionRepository } from "@/auth/sessionRepository"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { t } from "@/i18n/locale"

function localDateTime(instant: string) {
  const date = new Date(instant)
  if (!Number.isFinite(+date)) return ""
  return new Date(+date - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 19)
}

function registrationRequest(
  window: ManagedEvent["registrationWindow"]
): RegistrationWindowRequest {
  if (window.mode === "ALWAYS_OPEN") return { mode: "ALWAYS_OPEN" }
  if (window.mode === "OPENS_AT" && window.startAt)
    return { mode: "OPENS_AT", startAt: window.startAt }
  if (window.mode === "BOUNDED" && window.startAt && window.endAt)
    return { mode: "BOUNDED", startAt: window.startAt, endAt: window.endAt }
  throw new Error(t("The existing registration window is incomplete."))
}

export function EditEventSection({
  event,
  sessionId,
  refresh,
}: {
  event: ManagedEvent
  sessionId: number
  refresh: () => Promise<unknown>
}) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("Edit Event")}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <EventEditor
            event={event}
            sessionId={sessionId}
            refresh={refresh}
            close={(success) => {
              setEditing(false)
              setSaved(success)
            }}
          />
        ) : (
          <div className="space-y-2">
            {saved && <p role="status">{t("Event changes saved.")}</p>}
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              {t("Edit Event")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EventEditor({
  event,
  sessionId,
  refresh,
  close,
}: {
  event: ManagedEvent
  sessionId: number
  refresh: () => Promise<unknown>
  close: (success: boolean) => void
}) {
  const [draft, setDraft] = useState(() => ({
    title: event.title,
    description: event.description ?? "",
    venueName: event.venue?.name ?? "",
    venueAddress: event.venue?.address ?? "",
    startAt: localDateTime(event.startAt),
    endAt: localDateTime(event.endAt),
  }))
  const save = useMutation({
    mutationFn: () =>
      sessionRepository.authenticatedRequest(sessionId, async (token) => {
        const title = draft.title.trim()
        const description = draft.description.trim() || null
        const start = new Date(draft.startAt)
        const end = new Date(draft.endAt)
        if (!title || !(start < end))
          throw new Error(
            t("Enter a title and an end time after the start time.")
          )
        const registration = event.registrationWindow
        if (
          (registration.startAt && Date.parse(registration.startAt) >= +end) ||
          (registration.endAt && Date.parse(registration.endAt) > +end)
        )
          throw new Error(
            t(
              "The event must end after registration opens and no earlier than registration closes."
            )
          )
        const venue = event.venue
        const name = draft.venueName.trim()
        const address = draft.venueAddress.trim()
        let venueRequest: VenueRequest | undefined
        if (venue && (name !== venue.name || address !== venue.address)) {
          if (!name || !address)
            throw new Error(t("Enter the venue name and address."))
          const details = { name, address, capacity: venue.totalCapacity }
          if (venue.seatingMode === "ASSIGNED_SEATING") {
            if (!venue.venueLayoutId)
              throw new Error(t("The existing venue layout is unavailable."))
            venueRequest = {
              ...details,
              seatingMode: "ASSIGNED_SEATING",
              venueLayoutId: venue.venueLayoutId,
            }
          } else {
            venueRequest = { ...details, seatingMode: "GENERAL_ADMISSION" }
          }
        }
        const startAt =
          draft.startAt === localDateTime(event.startAt)
            ? event.startAt
            : start.toISOString()
        const endAt =
          draft.endAt === localDateTime(event.endAt)
            ? event.endAt
            : end.toISOString()
        if (
          title !== event.title ||
          description !== event.description ||
          startAt !== event.startAt ||
          endAt !== event.endAt
        ) {
          await updateEvent(token, event.id, {
            title,
            description,
            startAt,
            endAt,
            category: event.category,
            imageUrl: event.imageUrl,
            visibility: event.visibility,
            registrationWindow: registrationRequest(registration),
          })
        }
        if (venueRequest) await attachVenue(token, event.id, venueRequest)
      }),
    onSettled: refresh,
    onSuccess: () => close(true),
  })

  function input(key: keyof typeof draft, label: string, type = "text") {
    return (
      <Field>
        <FieldLabel htmlFor={`edit-${key}`}>{t(label)}</FieldLabel>
        <Input
          id={`edit-${key}`}
          type={type}
          required
          step={type === "datetime-local" ? 1 : undefined}
          value={draft[key]}
          onChange={(change) =>
            setDraft({ ...draft, [key]: change.target.value })
          }
        />
      </Field>
    )
  }
  return (
    <form
      onSubmit={(submission) => {
        submission.preventDefault()
        if (!save.isPending) save.mutate()
      }}
    >
      <fieldset disabled={save.isPending} className="space-y-4">
        {input("title", "Title")}
        <Field>
          <FieldLabel htmlFor="edit-description">{t("Description")}</FieldLabel>
          <Textarea
            id="edit-description"
            value={draft.description}
            onChange={(change) =>
              setDraft({ ...draft, description: change.target.value })
            }
          />
        </Field>
        {event.venue && (
          <>
            {input("venueName", "Venue name")}
            {input("venueAddress", "Venue address")}
          </>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {input("startAt", "Start (your local time)", "datetime-local")}
          {input("endAt", "End (your local time)", "datetime-local")}
        </div>
        {save.isError && <FieldError>{t(save.error.message)}</FieldError>}
        <div className="flex gap-2">
          <Button type="submit">
            {save.isPending ? t("Saving…") : t("Save changes")}
          </Button>
          <Button type="button" variant="outline" onClick={() => close(false)}>
            {t("Cancel")}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
