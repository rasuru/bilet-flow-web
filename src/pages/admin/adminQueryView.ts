import type { UseQueryResult } from "@tanstack/react-query"

import { adminError } from "./adminPresentation"

export function adminQueryView<T>(query: UseQueryResult<T>) {
  return {
    data: query.data,
    loading: query.isPending,
    busy: query.isFetching,
    error: adminError(query.error),
    retry: () => void query.refetch(),
  }
}
