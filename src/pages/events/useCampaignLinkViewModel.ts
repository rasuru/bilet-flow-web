import { t } from "@/i18n/locale"
import { useQuery } from "@tanstack/react-query"
import { useSearch } from "wouter"

import { ApiError, problemTypes } from "@/api/client"
import { campaignRepository } from "@/promotions/campaignRepository"

const tokenPattern = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i

export function useCampaignToken() {
  return new URLSearchParams(useSearch()).get("promo")?.trim() || null
}

const promoErrorMessages: Readonly<Record<string, string>> = {
  NOT_YET_VALID: "This promo code is not yet valid.",
  EXPIRED: "This promo code has expired.",
  DISABLED: "This promo code is disabled.",
  CAMPAIGN_ENDED: "This campaign has ended.",
  EXHAUSTED: "This promo code has reached its redemption limit.",
  INAPPLICABLE: "This promo code does not apply to these tickets.",
  NOT_FOUND: "Promo code not found",
}

export function promoError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback
  if (error.type !== problemTypes.promoCodeRejected) return t(error.message)
  const reason = error.body?.reason
  return t(
    reason && Object.hasOwn(promoErrorMessages, reason)
      ? promoErrorMessages[reason]
      : error.body?.detail || error.message
  )
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
      message: t("This promo link is invalid for this event."),
    } as const
  }
  if (query.isError) {
    const error = query.error
    const message =
      error instanceof ApiError && error.status === 404
        ? t("This promo link could not be found.")
        : promoError(error, t("Couldn’t check this promo link."))
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

