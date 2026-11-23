import { useQuery } from "@tanstack/react-query"
import { useSearch } from "wouter"

import { ApiError, problemTypes } from "@/api/client"
import { campaignRepository } from "@/promotions/campaignRepository"

const tokenPattern = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i

export function useCampaignToken() {
  return new URLSearchParams(useSearch()).get("promo")?.trim() || null
}

export function promoError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback
  return error.type === problemTypes.promoCodeRejected
    ? error.body?.detail || error.message
    : error.message
}

export function useCampaignLinkViewModel(
  eventId: string,
  token: string | null
) {
  const valid = token !== null && tokenPattern.test(token)
  const query = useQuery(
    campaignRepository.linkQuery(valid ? token.toLowerCase() : null)
  )
  if (token === null) return { status: "none" } as const
  if (
    !valid ||
    (query.data && query.data.eventId.toLowerCase() !== eventId.toLowerCase())
  ) {
    return {
      status: "error",
      message: "This promo link is invalid for this event.",
    } as const
  }
  if (query.isError) {
    const error = query.error
    const message =
      error instanceof ApiError && error.status === 404
        ? "This promo link could not be found."
        : promoError(error, "Couldn’t check this promo link.")
    return {
      status: "error",
      message,
      retry:
        !(error instanceof ApiError) ||
        error.status >= 500 ||
        error.status === 429
          ? () => void query.refetch()
          : undefined,
    } as const
  }
  if (query.data) return { status: "ready", code: query.data.code } as const
  return { status: "loading" } as const
}
