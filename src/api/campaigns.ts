import { requestFile, requestJson } from "@/api/client"
import { eventPath } from "@/api/events"

type Money = { amount: number; currency: string }
export type DiscountType = "PERCENTAGE" | "FIXED_KZT"
export type CreateCampaignRequest = {
  name: string
  discountType: DiscountType
  discountValue: number
  validFrom: string
  validUntil: string
  applicableTicketTypeIds: string[]
  maxRedemptions: number | null
}

export type PromoCode = {
  id: string
  campaignId: string
  code: string
  campaignToken: string
  enabled: boolean
}

export type Campaign = CreateCampaignRequest & {
  id: string
  eventId: string
  status: "ACTIVE" | "ENDED"
  usedRedemptions: number
  confirmedRedemptions: number
  remainingRedemptions: number | null
  ticketsSold: number
  grossRevenue: Money
  totalDiscountGiven: Money
  netRevenue: Money
  promoCodes: PromoCode[]
}

function campaignsPath(eventId: string) {
  return `${eventPath(eventId)}/campaigns`
}

function campaignPath(campaignId: string) {
  return `/api/campaigns/${encodeURIComponent(campaignId)}`
}

export function listCampaigns(token: string, eventId: string) {
  return requestJson<Campaign[]>(campaignsPath(eventId), { token })
}

export function createCampaign(
  token: string,
  eventId: string,
  json: CreateCampaignRequest
) {
  return requestJson<Campaign>(campaignsPath(eventId), {
    token,
    method: "POST",
    json,
  })
}

export function endCampaign(token: string, campaignId: string) {
  return requestJson<Campaign>(`${campaignPath(campaignId)}/end`, {
    token,
    method: "POST",
  })
}

export function setPromoCodeEnabled(
  token: string,
  codeId: string,
  enabled: boolean
) {
  return requestJson<PromoCode>(
    `/api/promo-codes/${encodeURIComponent(codeId)}/${enabled ? "enable" : "disable"}`,
    {
      token,
      method: "POST",
    }
  )
}

export function getCampaignQr(
  token: string,
  campaignId: string,
  codeId: string
) {
  return requestFile(
    `${campaignPath(campaignId)}/promo-codes/${encodeURIComponent(codeId)}/qr`,
    token
  )
}

export function resolveCampaignLink(campaignToken: string) {
  return requestJson<{ eventId: string; code: string }>(
    `/api/campaign-links/${encodeURIComponent(campaignToken)}`
  )
}
