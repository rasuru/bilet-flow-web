import { useQuery } from "@tanstack/react-query"

import { useSessionViewModel } from "@/auth/useSessionViewModel"
import {
  categories,
  dateTime,
  statuses,
  supportError,
  supportPath,
  supportRecipient,
} from "@/support/supportPresentation"
import { supportRepository } from "@/support/supportRepository"

export function useSupportListViewModel(sessionId: number, accountId: number) {
  const { canAccessAdmin } = useSessionViewModel()
  const query = useQuery({
    ...supportRepository.listQuery(sessionId),
    select: (cases) =>
      [...cases]
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .map((item) => ({
          id: item.id,
          href: supportPath(item.id),
          subject: item.subject,
          scope:
            item.requesterUserId === accountId
              ? "MY_REQUESTS"
              : item.type === "PLATFORM_SUPPORT" ||
                  (canAccessAdmin && item.escalatedAt)
                ? "PLATFORM_INBOX"
                : "EVENT_INBOX",
          recipient: supportRecipient(item.type),
          status:
            statuses.find((entry) => entry.value === item.status)?.label ??
            item.status,
          category:
            categories.find((entry) => entry.value === item.category)?.label ??
            item.category,
          updatedAt: item.updatedAt,
          updatedLabel: dateTime.format(new Date(item.updatedAt)),
          preview: item.messages.at(-1)?.content,
        })),
  })
  return {
    loading: query.isPending,
    error: query.isError
      ? supportError(query.error, "Couldn’t load requests.")
      : null,
    retry: () => void query.refetch(),
    cases: query.data ?? [],
    canAccessAdmin,
  }
}
