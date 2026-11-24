import { t, dateFormat, numberFormat } from "@/i18n/locale"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import type { Campaign } from "@/api/campaigns"
import { ApiError } from "@/api/client"
import { managedEventRepository } from "@/events/managedEventRepository"
import { campaignEventPath } from "@/promotions/campaignLinks"
import { campaignRepository } from "@/promotions/campaignRepository"

const dateTime = dateFormat({
  dateStyle: "medium",
  timeStyle: "short",
})
const money = numberFormat({
  style: "currency",
  currency: "KZT",
})
const percent = numberFormat({
  style: "percent",
  maximumFractionDigits: 4,
})

export function campaignActionError(error: unknown, fallback: string) {
  return error instanceof ApiError
    ? (error.fieldErrors[0]?.message ?? error.body?.detail ?? error.message)
    : fallback
}

function presentCampaign(
  campaign: Campaign,
  ticketNames: Map<string, string>,
  now: number
) {
  const ended = campaign.status === "ENDED"
  const expired = Date.parse(campaign.validUntil) <= now
  return {
    id: campaign.id,
    name: campaign.name,
    discount:
      campaign.discountType === "PERCENTAGE"
        ? t("{0} off", percent.format(campaign.discountValue / 100))
        : t("{0} off", money.format(campaign.discountValue)),
    status: ended
      ? t("Ended")
      : expired
        ? t("Expired")
        : Date.parse(campaign.validFrom) > now
          ? t("Scheduled")
          : t("Active"),
    canEnd: !ended && !expired,
    dates: `${dateTime.format(new Date(campaign.validFrom))} – ${dateTime.format(new Date(campaign.validUntil))}`,
    ticketTypes: campaign.applicableTicketTypeIds.length
      ? campaign.applicableTicketTypeIds
          .map((id) => ticketNames.get(id) ?? t("Ticket type unavailable"))
          .join(", ")
      : t("All ticket types"),
    metrics: [
      {
        label: t("Confirmed redemptions"),
        value: campaign.confirmedRedemptions,
      },
      {
        label: t("Remaining redemptions"),
        value: campaign.remainingRedemptions ?? t("Unlimited"),
      },
      { label: t("Tickets sold"), value: campaign.ticketsSold },
      { label: t("Gross"), value: money.format(campaign.grossRevenue.amount) },
      {
        label: t("Discounts"),
        value: money.format(campaign.totalDiscountGiven.amount),
      },
      {
        label: t("Net before refunds"),
        value: money.format(campaign.netRevenue.amount),
      },
    ],
    codes: campaign.promoCodes.map((code) => ({
      id: code.id,
      code: code.code,
      enabled: code.enabled,
      canToggle: !ended && !expired,
      sharePath: campaignEventPath(campaign.eventId, code.campaignToken),
    })),
  }
}

export type CampaignItem = ReturnType<typeof presentCampaign>

export function useCampaignsViewModel(sessionId: number, eventId: string) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const event = useQuery(managedEventRepository.eventQuery(sessionId, eventId))
  const campaigns = useQuery(
    campaignRepository.campaignsQuery(sessionId, eventId, event.isSuccess)
  )
  const ticketTypes = useQuery(
    managedEventRepository.ticketTypesQuery(sessionId, eventId, event.isSuccess)
  )
  const ticketNames = new Map(
    ticketTypes.data?.map(({ id, name }) => [id, name])
  )
  return {
    event: event.data,
    loading: event.isPending || (event.isSuccess && campaigns.isPending),
    campaigns: (campaigns.data ?? []).map((item) =>
      presentCampaign(item, ticketNames, now)
    ),
    error:
      event.isError || campaigns.isError
        ? campaignActionError(
            event.error ?? campaigns.error,
            t("Couldn’t load campaigns.")
          )
        : null,
    retry: () => {
      if (event.isError) void event.refetch()
      else void campaigns.refetch()
    },
    ticketTypes: ticketTypes.data?.map(({ id, name }) => ({ id, name })) ?? [],
    ticketTypesLoading: ticketTypes.isPending && event.isSuccess,
    ticketTypesError: ticketTypes.isError
      ? campaignActionError(ticketTypes.error, t("Couldn’t load ticket types."))
      : null,
    retryTicketTypes: () => void ticketTypes.refetch(),
  }
}

type CampaignAction =
  | { kind: "end" }
  | { kind: "toggle"; codeId: string; enabled: boolean }
  | { kind: "download"; codeId: string; code: string }
  | { kind: "copy"; value: string; isLink: boolean }

export function useCampaignActions(
  sessionId: number,
  eventId: string,
  campaignId: string
) {
  const client = useQueryClient()
  const [confirmEnd, setConfirmEnd] = useState(false)
  const action = useMutation({
    mutationFn: async (operation: CampaignAction) => {
      switch (operation.kind) {
        case "end":
          await campaignRepository.end(client, sessionId, campaignId)
          return "Campaign ended."
        case "toggle":
          await campaignRepository.setCodeEnabled(
            client,
            sessionId,
            eventId,
            operation.codeId,
            operation.enabled
          )
          return operation.enabled
            ? t("Promo code enabled.")
            : t("Promo code disabled.")
        case "download": {
          const file = await campaignRepository.qr(
            sessionId,
            campaignId,
            operation.codeId
          )
          const url = URL.createObjectURL(file)
          const link = document.createElement("a")
          link.href = url
          link.download = `biletflow-campaign-${operation.code}.png`
          document.body.append(link)
          link.click()
          link.remove()
          window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
          return "Campaign QR download started."
        }
        case "copy":
          await navigator.clipboard.writeText(
            operation.isLink
              ? new URL(operation.value, window.location.origin).href
              : operation.value
          )
          return operation.isLink
            ? t("Campaign link copied.")
            : t("Promo code copied.")
      }
    },
    onSuccess: (_, operation) => {
      if (operation.kind === "end") setConfirmEnd(false)
    },
  })
  return {
    confirmEnd,
    setConfirmEnd,
    run: (operation: CampaignAction) => action.mutate(operation),
    pending: action.isPending,
    message: action.data,
    error: action.isError
      ? campaignActionError(
          action.error,
          action.variables?.kind === "copy"
            ? t("Couldn’t copy to the clipboard.")
            : t("Couldn’t complete this action. Try again.")
        )
      : null,
  }
}


