import { useQuery } from "@tanstack/react-query"
import { supportRepository } from "@/support/supportRepository"
import { categories, dateTime, statuses, supportPath } from "@/support/supportPresentation"

export function useSupportListViewModel(sessionId: number, accountId: number) {
  const query = useQuery({ ...supportRepository.listQuery(sessionId, accountId), select: (cases) =>
    [...cases].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((item) => ({
      id: item.id, href: supportPath(item.id), subject: item.subject,
      scope: item.scope, recipient: item.recipient, status: statuses.find((x) => x.value === item.status)!.label,
      category: categories.find((x) => x.value === item.category)!.label,
      updatedAt: item.updatedAt, updatedLabel: dateTime.format(new Date(item.updatedAt)),
      preview: item.messages.at(-1)?.content ?? "No messages yet",
    })) })
  return { loading: query.isPending, error: query.isError, retry: () => void query.refetch(), cases: query.data ?? [] }
}


