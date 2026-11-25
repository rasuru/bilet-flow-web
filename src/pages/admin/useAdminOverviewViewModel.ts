import { t } from "@/i18n/locale"
import { useQuery } from "@tanstack/react-query"
import { CreditCard, Flag, MessagesSquare } from "lucide-react"

import { adminRepository } from "@/admin/adminRepository"

import { formatDate, label } from "./adminPresentation"
import { adminQueryView } from "./adminQueryView"

export function useAdminOverviewViewModel(sessionId: number) {
  const reports = useQuery(
    adminRepository.reports(sessionId, { status: "OPEN" }, 0, 5)
  )
  const payments = useQuery(adminRepository.paymentOperations(sessionId))
  const support = useQuery(
    adminRepository.supportCases(sessionId, { escalatedOnly: true }, 0, 5)
  )

  return [
    {
      id: "reports",
      title: t("Open event reports"),
      icon: Flag,
      href: "/admin/event-reports?status=OPEN",
      empty: t("No open reports."),
      query: adminQueryView(reports),
      items: reports.data?.items.map((item) => ({
        id: item.id,
        title: item.reason,
        subtitle: formatDate(item.submittedAt),
        href: `/admin/event-reports?status=OPEN&reportId=${encodeURIComponent(item.id)}`,
      })),
    },
    {
      id: "payments",
      title: t("Payments needing review"),
      icon: CreditCard,
      href: "/admin/payments?queue=review",
      empty: t("No payments need review."),
      query: adminQueryView(payments),
      items: payments.data?.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.id,
        subtitle: item.bankOperation
          ? label(item.bankOperation)
          : label(item.status),
        href: `/admin/payments?queue=review&paymentId=${encodeURIComponent(item.id)}`,
      })),
    },
    {
      id: "support",
      title: t("Escalated support"),
      icon: MessagesSquare,
      href: "/admin/support?escalatedOnly=true",
      empty: t("No escalated cases."),
      query: adminQueryView(support),
      items: support.data?.items.map((item) => ({
        id: item.id,
        title: item.subject,
        subtitle: label(item.status),
        href: `/admin/support?escalatedOnly=true&caseId=${encodeURIComponent(item.id)}`,
      })),
    },
  ]
}
