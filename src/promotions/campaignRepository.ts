import {
  queryOptions,
  skipToken,
  type QueryClient,
} from "@tanstack/react-query"

import {
  createCampaign,
  endCampaign,
  getCampaignQr,
  listCampaigns,
  resolveCampaignLink,
  setPromoCodeEnabled,
  type Campaign,
  type CreateCampaignRequest,
} from "@/api/campaigns"
import { ApiError } from "@/api/client"
import { sessionRepository } from "@/auth/sessionRepository"

function campaignsKey(sessionId: number, eventId: string) {
  return ["campaigns", sessionId, eventId] as const
}

function updateCampaign(
  client: QueryClient,
  sessionId: number,
  campaign: Campaign
) {
  client.setQueryData<Campaign[]>(
    campaignsKey(sessionId, campaign.eventId),
    (previous) => {
      const campaigns = previous ?? []
      return campaigns.some(({ id }) => id === campaign.id)
        ? campaigns.map((item) => (item.id === campaign.id ? campaign : item))
        : [...campaigns, campaign]
    }
  )
}

export function retryCampaignRead(count: number, error: Error) {
  return count < 2 && (!(error instanceof ApiError) || error.status >= 500)
}

export const campaignRepository = {
  campaignsQuery(sessionId: number, eventId: string, enabled: boolean) {
    return queryOptions({
      queryKey: campaignsKey(sessionId, eventId),
      queryFn: enabled
        ? () =>
            sessionRepository.authenticatedRequest(sessionId, (token) =>
              listCampaigns(token, eventId)
            )
        : skipToken,
      retry: retryCampaignRead,
    })
  },

  linkQuery(campaignToken: string | null) {
    return queryOptions({
      queryKey: ["campaign-link", campaignToken],
      queryFn:
        campaignToken === null
          ? skipToken
          : () => resolveCampaignLink(campaignToken),
      retry: retryCampaignRead,
    })
  },

  async create(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    request: CreateCampaignRequest
  ) {
    const campaign = await sessionRepository.authenticatedRequest(
      sessionId,
      (token) => createCampaign(token, eventId, request)
    )
    await client.cancelQueries({ queryKey: campaignsKey(sessionId, eventId) })
    updateCampaign(client, sessionId, campaign)
    void client.invalidateQueries({
      queryKey: campaignsKey(sessionId, eventId),
    })
  },

  async end(client: QueryClient, sessionId: number, campaignId: string) {
    const campaign = await sessionRepository.authenticatedRequest(
      sessionId,
      (token) => endCampaign(token, campaignId)
    )
    await client.cancelQueries({
      queryKey: campaignsKey(sessionId, campaign.eventId),
    })
    updateCampaign(client, sessionId, campaign)
    void client.invalidateQueries({
      queryKey: campaignsKey(sessionId, campaign.eventId),
    })
  },

  async setCodeEnabled(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    codeId: string,
    enabled: boolean
  ) {
    const updated = await sessionRepository.authenticatedRequest(
      sessionId,
      (token) => setPromoCodeEnabled(token, codeId, enabled)
    )
    const key = campaignsKey(sessionId, eventId)
    await client.cancelQueries({ queryKey: key })
    client.setQueryData<Campaign[]>(key, (previous) =>
      previous?.map((campaign) =>
        campaign.id === updated.campaignId
          ? {
              ...campaign,
              promoCodes: campaign.promoCodes.map((code) =>
                code.id === codeId ? updated : code
              ),
            }
          : campaign
      )
    )
    void client.invalidateQueries({ queryKey: key })
  },

  qr(sessionId: number, campaignId: string, codeId: string) {
    return sessionRepository.authenticatedRequest(sessionId, (token) =>
      getCampaignQr(token, campaignId, codeId)
    )
  },
}
