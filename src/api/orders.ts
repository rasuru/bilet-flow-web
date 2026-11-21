import { requestJson, withQuery } from "@/api/client"
import type { OffsetQuery } from "@/api/client"

export type OrderStatus = "COMPLETED" | "CANCELLED"

export type AdminOrder = {
  id: string
  eventId: string
  ownerId: number
  status: OrderStatus
  promotionId: string | null
  discountAmount: number
  discountCurrency: string
  totalAmount: number
  totalCurrency: string
  paymentId: string | null
  refundId: string | null
}

type EventOrderQuery = OffsetQuery & {
  eventId?: string
  status?: OrderStatus
}

export type AdminOrderQuery = EventOrderQuery & {
  orderId?: string
  ownerId?: number
}

export type PromotionActivityQuery = EventOrderQuery & {
  promotionId?: string
}

export type PromotionActivity = AdminOrder & { promotionId: string }

export function listAdminOrders(token: string, query: AdminOrderQuery = {}) {
  return requestJson<AdminOrder[]>(withQuery("/api/admin/orders", query), {
    token,
  })
}

/** Returns issued orders with recorded promotion attribution. */
export function listPromotionActivity(
  token: string,
  query: PromotionActivityQuery = {}
) {
  return requestJson<PromotionActivity[]>(
    withQuery("/api/admin/promotion-activity", query),
    { token }
  )
}
