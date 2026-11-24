import type { PublicEvent } from "@/api/events"
import { Button, buttonVariants } from "@/components/ui/button"
import { t } from "@/i18n/locale"

type CalendarEvent = Pick<
  PublicEvent,
  "id" | "title" | "description" | "startAt" | "endAt" | "venue" | "status"
>

function calendarDate(date: Date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, "")
}

function escapeText(text: string) {
  return text
    .replaceAll("\\", "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;")
}

function foldLine(line: string) {
  const encoder = new TextEncoder()
  let result = ""
  let bytes = 0
  for (const character of line) {
    const size = encoder.encode(character).length
    if (bytes + size > 75) {
      result += "\r\n "
      bytes = 1
    }
    result += character
    bytes += size
  }
  return result
}

export function EventCalendarActions({ event }: { event: CalendarEvent }) {
  const start = new Date(event.startAt)
  const end = new Date(event.endAt)
  if (!(start < end)) return null

  const startsAt = calendarDate(start)
  const endsAt = calendarDate(end)
  const cancelled = event.status === "CANCELLED"
  const eventUrl = new URL(
    `/events/${encodeURIComponent(event.id)}`,
    window.location.origin
  ).href
  const location = event.venue
    ? [event.venue.name, event.venue.address].filter(Boolean).join(", ")
    : ""
  const google = new URL("https://calendar.google.com/calendar/render")
  google.search = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startsAt}/${endsAt}`,
    details: [event.description, eventUrl].filter(Boolean).join("\n\n"),
    location,
  }).toString()

  function download() {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BiletFlow//Event Calendar//EN",
      "BEGIN:VEVENT",
      `UID:${encodeURIComponent(event.id)}@biletflow`,
      `DTSTAMP:${calendarDate(new Date())}`,
      `DTSTART:${startsAt}`,
      `DTEND:${endsAt}`,
      `SUMMARY:${escapeText(event.title)}`,
      `LOCATION:${escapeText(location)}`,
      `DESCRIPTION:${escapeText(event.description ?? "")}`,
      `URL:${eventUrl}`,
      ...(cancelled ? ["STATUS:CANCELLED", "SEQUENCE:1"] : []),
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ]
    const file = new Blob([lines.map(foldLine).join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    })
    const url = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = url
    link.download = `biletflow-${encodeURIComponent(event.id)}.ics`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={download}>
        {cancelled
          ? t("Download calendar cancellation (.ics)")
          : t("Download calendar (.ics)")}
      </Button>
      {!cancelled && (
        <a
          href={google.href}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("Add to Google Calendar")}
        </a>
      )}
    </div>
  )
}
