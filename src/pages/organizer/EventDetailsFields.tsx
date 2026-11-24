import type { ComponentProps, ReactNode } from "react"
import type { EventVisibility } from "@/api/events"
import {
  Field as ShadcnField,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { t } from "@/i18n/locale"
import {
  timeZones,
  visibilityDetails,
  type EventDraft,
} from "./createEventDraft"

function EventField({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) {
  return (
    <ShadcnField>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
    </ShadcnField>
  )
}

type EventFieldsProps = {
  event: EventDraft
  setField: <Key extends keyof EventDraft>(
    key: Key,
    value: EventDraft[Key]
  ) => void
}

export function EventTextField({
  name,
  label,
  value,
  onChange,
  ...props
}: Omit<ComponentProps<typeof Input>, "onChange"> & {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <EventField id={name} label={label}>
      <Input
        {...props}
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </EventField>
  )
}

export function EventDetailsFields({
  event,
  setField,
  section,
  dateStep = 60,
}: EventFieldsProps & { section?: "basics" | "schedule"; dateStep?: number }) {
  function eventInput(
    key: keyof Omit<EventDraft, "visibility">,
    label: string,
    props: ComponentProps<typeof Input> = {}
  ) {
    return (
      <EventTextField
        {...props}
        name={key}
        label={label}
        value={event[key]}
        onChange={(value) => setField(key, value)}
      />
    )
  }
  return (
    <>
      {section !== "schedule" && (
        <>
          {eventInput("title", t("Event title"), { required: true })}
          {eventInput("category", t("Category"), { required: true })}
          <EventField id="description" label={t("Description (optional)")}>
            <Textarea
              id="description"
              value={event.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </EventField>
          {eventInput("imageUrl", t("Image URL (optional)"), {
            type: "url",
          })}
          <EventField id="visibility" label={t("Visibility")}>
            <NativeSelect
              id="visibility"
              aria-describedby="visibility-description"
              className="w-full"
              value={event.visibility}
              onChange={(e) =>
                setField("visibility", e.target.value as EventVisibility)
              }
            >
              {Object.entries(visibilityDetails).map(([value, { label }]) => (
                <NativeSelectOption key={value} value={value}>
                  {t(label)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription id="visibility-description">
              {t(visibilityDetails[event.visibility].description)}
            </FieldDescription>
          </EventField>
        </>
      )}
      {section !== "basics" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {eventInput("startAt", t("Starts"), {
              type: "datetime-local",
              step: dateStep,
              required: true,
            })}
            {eventInput("endAt", t("Ends"), {
              type: "datetime-local",
              step: dateStep,
              required: true,
            })}
          </div>
          <EventField id="timeZone" label={t("Time zone")}>
            <NativeSelect
              id="timeZone"
              className="w-full"
              value={event.timeZone}
              onChange={(e) => setField("timeZone", e.target.value)}
            >
              {timeZones.map((zone) => (
                <NativeSelectOption key={zone}>{zone}</NativeSelectOption>
              ))}
            </NativeSelect>
          </EventField>
          <div className="grid gap-4 sm:grid-cols-2">
            {eventInput(
              "registrationOpensAt",
              t("Registration opens (optional)"),
              {
                type: "datetime-local",
                step: dateStep,
                "aria-describedby": "registration-description",
              }
            )}
            {eventInput(
              "registrationClosesAt",
              t("Registration closes (optional)"),
              {
                type: "datetime-local",
                step: dateStep,
                "aria-describedby": "registration-description",
              }
            )}
          </div>
          <FieldDescription id="registration-description">
            {t(
              "Registration limits when buyers can order tickets across all tiers. Leave both dates blank to open registration when the event is published."
            )}
          </FieldDescription>
        </>
      )}
    </>
  )
}
