import { SeatMap } from "@/components/seating/SeatMap"
import type { LayoutPreview } from "@/events/seatMapPresentation"
import type { SeatingMode, VenueLayout } from "@/api/events"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { t } from "@/i18n/locale"
import type { EventDraft } from "./createEventDraft"
import { EventTextField } from "./EventDetailsFields"


export function EventVenueFields({
  event,
  setField,
  seatingMode,
  changeSeatingMode,
  layouts,
  layoutPreviews,
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
  layoutPreviews: LayoutPreview[]
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
          <FieldLabel>{t("Venue layout")}</FieldLabel>
          <div role="group" aria-label={t("Venue layout")} className="grid gap-3 sm:grid-cols-2">
            {layoutPreviews.map((preview) => (
              <button key={preview.id} type="button" disabled={loadingLayouts} aria-pressed={event.layoutId === preview.id}
                onClick={() => selectLayout(preview.id)}
                className="min-w-0 space-y-2 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary/30">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-semibold">{preview.name}</p><p className="text-xs text-muted-foreground">{preview.capacityLabel}</p></div>
                  {event.layoutId === preview.id && <span className="text-xs font-medium text-primary">{t("Selected")}</span>}
                </div>
                <SeatMap model={preview.map} compact />
                <p className="text-xs text-muted-foreground">{preview.categoryLabel}</p>
              </button>
            ))}
          </div>
          {loadingLayouts && <p role="status" className="text-sm">{t("Loading layouts…")}</p>}
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

