import { useState, type FormEvent } from "react"

export function useAdminFilters<T extends object>(initial: T) {
  const [draft, setDraft] = useState(initial)
  const [request, setRequest] = useState({ filters: initial, page: 0 })

  function change<K extends keyof T>(key: K, value: T[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequest({ filters: draft, page: 0 })
  }

  function reset() {
    setDraft(initial)
    setRequest({ filters: initial, page: 0 })
  }

  return {
    draft,
    change,
    apply,
    reset,
    filters: request.filters,
    page: request.page,
    previous: () =>
      setRequest((current) => ({
        ...current,
        page: Math.max(0, current.page - 1),
      })),
    next: () =>
      setRequest((current) => ({ ...current, page: current.page + 1 })),
  }
}
