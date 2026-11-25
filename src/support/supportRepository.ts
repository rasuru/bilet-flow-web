import { queryOptions, type QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/api/client"
import * as support from "@/api/support"
import {
  escalateSupportCase,
  openPlatformSupportCase,
  type OpenPlatformSupportCaseRequest,
} from "@/api/supportAdministration"
import { sessionRepository } from "@/auth/sessionRepository"

const listKey = (sessionId: number) => ["support", sessionId, "list"] as const
const detailKey = (sessionId: number, caseId: string) =>
  ["support", sessionId, "case", caseId] as const

const contextKey = (sessionId: number, caseId: string) =>
  [...detailKey(sessionId, caseId), "context"] as const

function retryRead(count: number, error: Error) {
  return count < 2 && (!(error instanceof ApiError) || error.status >= 500)
}

async function write(
  client: QueryClient,
  sessionId: number,
  request: (token: string) => Promise<support.SupportCase>
) {
  const saved = await sessionRepository.authenticatedRequest(sessionId, request)
  const key = detailKey(sessionId, saved.id)
  await client.cancelQueries({ queryKey: key })
  client.setQueryData(key, saved)
  void client.invalidateQueries({ queryKey: listKey(sessionId) })
  return saved
}

export const supportRepository = {
  watchCase(client: QueryClient, sessionId: number, caseId: string) {
    let disposed = false
    let socket: WebSocket | undefined
    let retryTimer: number | undefined
    let delay = 1_000

    function retry() {
      if (disposed) return
      retryTimer = window.setTimeout(() => void connect(), delay)
      delay = Math.min(delay * 2, 30_000)
    }

    async function connect() {
      try {
        const { ticket } = await sessionRepository.authenticatedRequest(
          sessionId,
          (token) => support.createSupportSocketTicket(token, caseId)
        )
        if (disposed) return
        const connection = support.openSupportSocket()
        socket = connection
        connection.onopen = () => {
          if (!disposed) connection.send(ticket)
        }
        connection.onmessage = ({ data }) => {
          if (disposed || (data !== "ready" && data !== "changed")) return
          if (data === "ready") delay = 1_000
          void client.invalidateQueries({
            queryKey: detailKey(sessionId, caseId),
          })
          if (data === "changed")
            void client.invalidateQueries({ queryKey: listKey(sessionId) })
        }
        connection.onclose = retry
      } catch (error) {
        if (error instanceof ApiError && [401, 403, 404].includes(error.status))
          return
        retry()
      }
    }

    void connect()
    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
      if (socket && socket.readyState < WebSocket.CLOSING) socket.close()
    }
  },

  contextQuery(sessionId: number, caseId: string, enabled: boolean) {
    return queryOptions({
      queryKey: contextKey(sessionId, caseId),
      queryFn: () => sessionRepository.authenticatedRequest(sessionId, (token) => support.getResolutionContext(token, caseId)),
      enabled,
      refetchInterval: 10_000,
      retry: retryRead,
    })
  },
  async resolve(client: QueryClient, sessionId: number, caseId: string, request: support.ResolutionRequest) {
    const key = contextKey(sessionId, caseId)
    await client.cancelQueries({ queryKey: key })
    try {
      const saved = await sessionRepository.authenticatedRequest(sessionId, (token) => support.executeResolutionAction(token, caseId, request))
      await client.cancelQueries({ queryKey: key })
      client.setQueryData(key, saved)
      return saved
    } finally {
      void client.invalidateQueries({ queryKey: detailKey(sessionId, caseId) })
    }
  },
  listQuery(sessionId: number) {
    return queryOptions({
      queryKey: listKey(sessionId),
      queryFn: () =>
        sessionRepository.authenticatedRequest(
          sessionId,
          support.listSupportCases
        ),
      refetchInterval: 30_000,
      retry: retryRead,
    })
  },
  caseQuery(sessionId: number, caseId: string) {
    return queryOptions({
      queryKey: detailKey(sessionId, caseId),
      queryFn: () =>
        sessionRepository.authenticatedRequest(sessionId, (token) =>
          support.getSupportCase(token, caseId)
        ),
      refetchInterval: 15_000,
      retry: retryRead,
    })
  },
  create(
    client: QueryClient,
    sessionId: number,
    data: support.CreateSupportCase
  ) {
    return write(client, sessionId, (token) =>
      support.createSupportCase(token, data)
    )
  },
  async createForOrganizer(
    client: QueryClient,
    sessionId: number,
    data: OpenPlatformSupportCaseRequest
  ) {
    const receipt = await sessionRepository.authenticatedRequest(
      sessionId,
      (token) => openPlatformSupportCase(token, data)
    )
    void client.invalidateQueries({ queryKey: listKey(sessionId) })
    return { id: receipt.caseId }
  },
  send(
    client: QueryClient,
    sessionId: number,
    caseId: string,
    message: string
  ) {
    return write(client, sessionId, (token) =>
      support.sendSupportMessage(token, caseId, message)
    )
  },
  changeStatus(
    client: QueryClient,
    sessionId: number,
    caseId: string,
    status: support.SupportStatus
  ) {
    return write(client, sessionId, (token) =>
      support.changeSupportStatus(token, caseId, status)
    )
  },
  assign(
    client: QueryClient,
    sessionId: number,
    caseId: string,
    supportUserId: number
  ) {
    return write(client, sessionId, (token) =>
      support.assignSupportCase(token, caseId, supportUserId)
    )
  },
  async escalate(client: QueryClient, sessionId: number, caseId: string) {
    await sessionRepository.authenticatedRequest(sessionId, (token) =>
      escalateSupportCase(token, caseId)
    )
    await Promise.all([
      client.invalidateQueries({ queryKey: detailKey(sessionId, caseId) }),
      client.invalidateQueries({ queryKey: listKey(sessionId) }),
    ])
  },
}

