export function campaignEventPath(
  eventId: string,
  token?: string | null,
  buy = false
) {
  const event = `/events/${encodeURIComponent(eventId)}${buy ? "/buy" : ""}`
  if (!token) return event
  return `${event}?${new URLSearchParams({ promo: token })}`
}

export function organizerCampaignsPath(eventId: string) {
  return `/organizer/events/${encodeURIComponent(eventId)}/campaigns`
}
