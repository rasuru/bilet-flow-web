import type { SeatingMode, VenueLayout } from "@/api/events"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { numberFormat, t } from "@/i18n/locale"
import type { EventDraft } from "./createEventDraft"
import { EventTextField } from "./EventDetailsFields"

const seatCount = numberFormat({ maximumFractionDigits: 0 })

export function EventVenueFields({
  event,
  setField,
  seatingMode,
  changeSeatingMode,
  layouts,
  layoutsOffline = false,
  loadingLayouts,
  layoutError,
  selectLayout,
  refreshLayouts,
}: {
  event: EventDraft
  setField: <Key extends keyof EventDraft>(
    key: Key,
    value: EventDraft[Key]
  ) => void
  seatingMode: SeatingMode
  changeSeatingMode: (mode: SeatingMode) => void
  layouts: VenueLayout[]
  layoutsOffline?: boolean
  loadingLayouts: boolean
  layoutError: string
  selectLayout: (id: string) => void
  refreshLayouts: () => void
}) {
  const assigned = seatingMode === "ASSIGNED_SEATING"
  return (
    <>
      <Field>
        <FieldLabel htmlFor="admission">{t("Admission mode")}</FieldLabel>
        <NativeSelect
          id="admission"
          className="w-full"
          value={seatingMode}
          disabled={loadingLayouts}
          onChange={(e) => changeSeatingMode(e.target.value as SeatingMode)}
        >
          <NativeSelectOption value="GENERAL_ADMISSION">
            {t("General admission")}
          </NativeSelectOption>
          <NativeSelectOption value="ASSIGNED_SEATING">
            {t("Assigned seating")}
          </NativeSelectOption>
        </NativeSelect>
      </Field>
      <EventTextField
        name="venueName"
        label={t("Venue name")}
        value={event.venueName}
        onChange={(value) => setField("venueName", value)}
        required
      />
      <EventTextField
        name="venueAddress"
        label={t("Address")}
        value={event.venueAddress}
        onChange={(value) => setField("venueAddress", value)}
        required
      />
      {assigned ? (
        <Field>
          <FieldLabel htmlFor="layoutId">{t("Venue layout")}</FieldLabel>
          <NativeSelect
            id="layoutId"
            className="w-full"
            required
            value={event.layoutId}
            disabled={loadingLayouts || !layouts.length}
            onChange={(e) => selectLayout(e.target.value)}
          >
            <NativeSelectOption value="">
              {loadingLayouts ? t("Loading layouts…") : t("Select a layout")}
            </NativeSelectOption>
            {layouts.map((layout) => (
              <NativeSelectOption key={layout.layoutId} value={layout.layoutId}>
                {t(
                  "{0} ({1} seats)",
                  layout.name,
                  seatCount.format(layout.seats.length)
                )}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {layoutsOffline && layouts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("Sample layouts are available for local saves.")}
            </p>
          )}
          {!loadingLayouts && (layoutError || !layouts.length) && (
            <>
              <p className="text-sm" role="status">
                {layoutError || t("No venue layouts are available.")}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void refreshLayouts()}
              >
                {t("Reload layouts")}
              </Button>
            </>
          )}
        </Field>
      ) : (
        <EventTextField
          name="venueCapacity"
          label={t("Total event capacity")}
          value={event.venueCapacity}
          onChange={(value) => setField("venueCapacity", value)}
          type="number"
          min={1}
          required
        />
      )}
      <FieldDescription>
        {t("Venue and admission settings are fixed after you save them.")}
      </FieldDescription>
    </>
  )
}
