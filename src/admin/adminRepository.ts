import { queryOptions, type QueryClient } from "@tanstack/react-query"

import { ApiError, type OffsetQuery } from "@/api/client"
import {
  listEventReports,
  getEventReport,
  reviewEventReport,
  type EventReportQuery,
  type ReviewEventReportRequest,
} from "@/api/eventReports"
import {
  listAdminEvents,
  getAdminEvent,
  suspendEvent,
  reinstateEvent,
  type AdminEventQuery,
} from "@/api/events"
import { downloadOperationsReport } from "@/api/operationalReports"
import {
  listAdminOrders,
  getAdminOrder,
  executeAdminOrderAction,
  type AdminOrderAction,
  listPromotionActivity,
  type AdminOrder,
  type AdminOrderQuery,
  type PromotionActivityQuery,
} from "@/api/orders"
import {
  listAdminPayments,
  listAdminActivations,
  moderatePaidSales,
  listPaymentOperations,
  getAdminPayment,
  resolvePaymentOperation,
  getProcessingFeeRate,
  updateProcessingFeeRate,
  type OperationResolutionRequest,
  getActivationFee,
  updateActivationFee,
  type AdminPaymentQuery,
  type ActivationStatus,
} from "@/api/payments"
import {
  listAdminSupportCases,
  getAdminSupportCase,
  type AdminSupportCaseQuery,
} from "@/api/supportAdministration"
import {
  listAdminUsers,
  findAdminUserIdentities,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  listAuthorities,
  createAuthority,
  deleteAuthority,
  type AdminUser,
  type AdminUserRequest,
} from "@/api/users"
import { sessionRepository } from "@/auth/sessionRepository"
import { attendanceRepository } from "@/tickets/attendanceRepository"

const request = sessionRepository.authenticatedRequest
const pageSize = 20

export type FeeSetting = "activation-fee" | "processing-fee-rate"

function key(sessionId: number, resource: string) {
  return ["admin", sessionId, resource] as const
}

function read<T>(
  sessionId: number,
  resource: string,
  parameters: unknown,
  readRequest: (token: string) => Promise<T>
) {
  return queryOptions({
    queryKey: [...key(sessionId, resource), parameters],
    queryFn: () => request(sessionId, readRequest),
    retry: (count, error) =>
      count < 2 && !(error instanceof ApiError && error.status < 500),
  })
}

function list<T, Filters extends OffsetQuery>(
  sessionId: number,
  resource: string,
  load: (token: string, query: Filters) => Promise<T[]>,
  filters: Filters,
  page: number,
  size = pageSize
) {
  const params = { ...filters, offset: page * size, limit: size + 1 }
  return read(sessionId, resource, params, async (token) => {
    const items = await load(token, params)
    return { items: items.slice(0, size), hasNext: items.length > size }
  })
}

function refresh(
  client: QueryClient,
  sessionId: number,
  ...resources: string[]
) {
  return Promise.all(
    resources.map((resource) =>
      client.invalidateQueries({ queryKey: key(sessionId, resource) })
    )
  )
}

async function refreshEvent(
  client: QueryClient,
  sessionId: number,
  eventId: string
) {
  await Promise.all([
    refresh(client, sessionId, "events", "event"),
    client.invalidateQueries({ queryKey: ["public-events"] }),
    client.invalidateQueries({ queryKey: ["public-event", eventId] }),
    client.invalidateQueries({ queryKey: ["home", "organized-events"] }),
    attendanceRepository.invalidate(client, sessionId),
  ])
}

function isOwnAccount(sessionId: number, user: AdminUser) {
  const session = sessionRepository.getSnapshot()
  return (
    session.status === "signedIn" &&
    session.sessionId === sessionId &&
    session.account.id === user.id
  )
}

export const adminRepository = {
  events(sessionId: number, filters: AdminEventQuery, page: number) {
    return list(sessionId, "events", listAdminEvents, filters, page)
  },
  event(sessionId: number, eventId: string) {
    return read(sessionId, "event", eventId, (token) =>
      getAdminEvent(token, eventId)
    )
  },
  async moderateEvent(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    action: { reason: string } | "reinstate"
  ) {
    const event = await request(sessionId, (token) =>
      action === "reinstate"
        ? reinstateEvent(token, eventId)
        : suspendEvent(token, eventId, action.reason)
    )
    client.setQueryData([...key(sessionId, "event"), eventId], event)
    await refreshEvent(client, sessionId, eventId)
  },
  reports(
    sessionId: number,
    filters: EventReportQuery,
    page: number,
    size?: number
  ) {
    return list(sessionId, "reports", listEventReports, filters, page, size)
  },
  report(sessionId: number, reportId: string) {
    return read(sessionId, "report", reportId, (token) =>
      getEventReport(token, reportId)
    )
  },
  async reviewReport(
    client: QueryClient,
    sessionId: number,
    reportId: string,
    review: ReviewEventReportRequest
  ) {
    const report = await request(sessionId, (token) =>
      reviewEventReport(token, reportId, review)
    )
    client.setQueryData([...key(sessionId, "report"), reportId], report)
    await refresh(client, sessionId, "reports", "report")
  },
  supportCases(
    sessionId: number,
    filters: AdminSupportCaseQuery,
    page: number,
    size?: number
  ) {
    return list(
      sessionId,
      "support",
      listAdminSupportCases,
      filters,
      page,
      size
    )
  },
  supportCase(sessionId: number, caseId: string) {
    return read(sessionId, "support-case", caseId, (token) =>
      getAdminSupportCase(token, caseId)
    )
  },
  order(sessionId: number, orderId: string) {
    return {
      ...read(sessionId, "order", orderId, (token) =>
        getAdminOrder(token, orderId)
      ),
      refetchInterval: 15_000,
    }
  },
  async changeOrder(
    client: QueryClient,
    sessionId: number,
    orderId: string,
    action: AdminOrderAction & { reason?: string }
  ) {
    const result = await request(sessionId, (token) =>
      executeAdminOrderAction(token, orderId, action)
    )
    client.setQueryData([...key(sessionId, "order"), orderId], result)
    await refresh(
      client,
      sessionId,
      "order",
      "orders",
      "promotions",
      "payments",
      "payment",
      "payment-operations"
    )
  },
  orders(sessionId: number, filters: AdminOrderQuery, page: number) {
    return list(sessionId, "orders", listAdminOrders, filters, page)
  },
  promotions(sessionId: number, filters: PromotionActivityQuery, page: number) {
    return list<AdminOrder, PromotionActivityQuery>(
      sessionId,
      "promotions",
      listPromotionActivity,
      filters,
      page
    )
  },
  payments(
    sessionId: number,
    filters: AdminPaymentQuery,
    page: number,
    size?: number
  ) {
    return list(sessionId, "payments", listAdminPayments, filters, page, size)
  },
  payment(sessionId: number, paymentId: string) {
    return {
      ...read(sessionId, "payment", paymentId, (token) =>
        getAdminPayment(token, paymentId)
      ),
      refetchInterval: 15_000,
    }
  },
  paymentOperations(sessionId: number) {
    return {
      ...read(sessionId, "payment-operations", null, listPaymentOperations),
      refetchInterval: 15_000,
    }
  },
  async resolvePayment(
    client: QueryClient,
    sessionId: number,
    paymentId: string,
    resolution: OperationResolutionRequest
  ) {
    await request(sessionId, (token) =>
      resolvePaymentOperation(token, paymentId, resolution)
    )
    await refresh(
      client,
      sessionId,
      "payment",
      "payments",
      "payment-operations",
      "order",
      "orders",
      "promotions",
      "activations"
    )
  },
  activations(
    sessionId: number,
    status: ActivationStatus | undefined,
    page: number
  ) {
    const filters: OffsetQuery & { status?: ActivationStatus } = { status }
    return list(sessionId, "activations", listAdminActivations, filters, page)
  },
  async moderateActivation(
    client: QueryClient,
    sessionId: number,
    eventId: string,
    reason: string,
    action: "suspend" | "reinstate"
  ) {
    await request(sessionId, (token) =>
      moderatePaidSales(token, eventId, reason, action)
    )
    await Promise.all([
      refresh(client, sessionId, "activations"),
      refreshEvent(client, sessionId, eventId),
    ])
  },
  feeSetting(sessionId: number, setting: FeeSetting) {
    return read(sessionId, setting, null, async (token) => {
      if (setting === "activation-fee") {
        const fee = await getActivationFee(token)
        return { ...fee, value: fee.amountKzt }
      }
      const fee = await getProcessingFeeRate(token)
      return { ...fee, currency: null, value: fee.ratePercent }
    })
  },
  async saveFeeSetting(
    client: QueryClient,
    sessionId: number,
    setting: FeeSetting,
    value: string
  ) {
    const fee = await request(sessionId, async (token) => {
      if (setting === "activation-fee") {
        const fee = await updateActivationFee(token, value)
        return { ...fee, value: fee.amountKzt }
      }
      const fee = await updateProcessingFeeRate(token, value)
      return { ...fee, currency: null, value: fee.ratePercent }
    })
    client.setQueryData([...key(sessionId, setting), null], fee)
    await refresh(client, sessionId, setting)
  },
  commerceUsers(sessionId: number, ids: number[]) {
    return read(sessionId, "commerce-users", ids, (token) =>
      findAdminUserIdentities(token, ids.map(String))
    )
  },
  users(sessionId: number, page: number, q: string) {
    return read(sessionId, "users", { page, q }, async (token) => {
      const data = await listAdminUsers(token, {
        page,
        q: q || undefined,
        size: pageSize,
        sort: ["id,asc"],
      })
      return {
        items: data.items,
        hasNext:
          data.totalCount === null
            ? (data.linkHeader?.includes('rel="next"') ??
              data.items.length === pageSize)
            : (page + 1) * pageSize < data.totalCount,
      }
    })
  },
  user(sessionId: number, login: string) {
    return read(sessionId, "user", login, (token) => getAdminUser(token, login))
  },
  async saveUser(
    client: QueryClient,
    sessionId: number,
    user: AdminUser | null,
    changes: AdminUserRequest
  ) {
    const updated = await request(sessionId, async (token) => {
      if (user) return updateAdminUser(token, { ...changes, id: user.id })
      await createAdminUser(token, changes)
      return null
    })
    if (user && updated && isOwnAccount(sessionId, user)) {
      if (
        updated.login !== user.login ||
        !updated.activated ||
        !updated.authorities.includes("ROLE_ADMIN")
      ) {
        sessionRepository.signOut()
        return
      }
      await sessionRepository.restoreSession()
    }
    await refresh(client, sessionId, "users", "user", "commerce-users")
  },
  async deleteUser(client: QueryClient, sessionId: number, user: AdminUser) {
    await request(sessionId, (token) => deleteAdminUser(token, user.login))
    if (isOwnAccount(sessionId, user)) sessionRepository.signOut()
    await refresh(client, sessionId, "users", "user", "commerce-users")
  },
  authorities(sessionId: number) {
    return read(sessionId, "authorities", null, listAuthorities)
  },
  async createAuthority(client: QueryClient, sessionId: number, name: string) {
    await request(sessionId, (token) => createAuthority(token, name))
    await refresh(client, sessionId, "authorities")
  },
  async deleteAuthority(client: QueryClient, sessionId: number, name: string) {
    await request(sessionId, (token) => deleteAuthority(token, name))
    await refresh(client, sessionId, "authorities", "users", "user")
  },
  operationsReport(sessionId: number, eventId?: string) {
    return request(sessionId, (token) =>
      downloadOperationsReport(token, eventId)
    )
  },
}
