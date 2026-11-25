import { requestJson, withQuery } from "@/api/client"
import type { Payment } from "@/api/payments"
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

export type AdminOrderAction = {
  action: "RESEND_TICKET" | "CANCEL_FREE_ORDER" | "REQUEST_REFUND"
  ticketId: string | null
}

export type AdminOrderDetail = {
  summary: AdminOrder
  eventTitle: string
  payment: Payment | null
  actions: AdminOrderAction[]
  order: {
    id: string
    eventId: string
    status: string
    ownerUserId: number
    amountKzt: number
    paymentId: string | null
    refundState: string | null
    refundId: string | null
    createdAt: string
    tickets: {
      id: string
      ticketTypeId: string
      seatId: string | null
      attendeeEmail: string
      status: string
    }[]
  }
}

function orderPath(id: string) {
  return `/api/admin/orders/${encodeURIComponent(id)}`
}

export function getAdminOrder(token: string, id: string) {
  return requestJson<AdminOrderDetail>(orderPath(id), { token })
}

export function executeAdminOrderAction(
  token: string,
  id: string,
  json: AdminOrderAction & { reason?: string }
) {
  return requestJson<AdminOrderDetail>(`${orderPath(id)}/actions`, {
    token,
    method: "POST",
    json,
  })
}

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
