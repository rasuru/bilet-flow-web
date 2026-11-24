import { requestFile, withQuery } from "@/api/client"

export function downloadOperationsReport(token: string, eventId?: string) {
  return requestFile(
    withQuery("/api/admin/reports/operations.csv", { eventId }),
    token
  )
}
