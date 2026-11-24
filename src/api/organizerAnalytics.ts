import { requestJson, withQuery } from "@/api/client"
import { eventPath } from "@/api/events"

export type OrganizerAnalyticsFilters = {
  from?: string
  through?: string
  ticketTypeId?: string
}

export type OrganizerSales = {
  tickets: number
  grossKzt: number
  discountsKzt: number
  refundsKzt: number
  netKzt: number
}

export type OrganizerAnalyticsOverview = {
  inventory: { capacity: number; sold: number; remaining: number; held: number }
  sales: OrganizerSales
  attendance: { registered: number; checkedIn: number; absent: number } | null
  campaigns: { redemptions: number; sales: OrganizerSales }
}

export type OrganizerAnalytics = {
  inventory: OrganizerAnalyticsOverview["inventory"] & {
    ticketTypes: { id: string; name: string }[]
    sharedCapacity: boolean
  }
  sales: OrganizerSales
  dailySales: { date: string; sales: OrganizerSales }[]
  ticketSales: { id: string; sales: OrganizerSales }[]
  campaignSales: {
    id: string
    name: string
    redemptions: number
    sales: OrganizerSales
    codes: { code: string; redemptions: number; sales: OrganizerSales }[]
  }[]
  attendance: OrganizerAnalyticsOverview["attendance"]
  ticketsWithoutOrderDate: number
}

export function getOrganizerAnalytics(
  token: string,
  eventId: string,
  filters: OrganizerAnalyticsFilters
) {
  return requestJson<OrganizerAnalytics>(
    withQuery(`${eventPath(eventId)}/analytics`, filters),
    { token }
  )
}

export function getOrganizerAnalyticsOverview(token: string) {
  return requestJson<OrganizerAnalyticsOverview>("/api/events/mine/analytics", {
    token,
  })
}
