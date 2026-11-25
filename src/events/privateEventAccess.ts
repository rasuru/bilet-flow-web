import { useSearch } from "wouter"

export function useEventAccessCode() {
  return new URLSearchParams(useSearch()).get("access")?.trim() || undefined
}

export function withEventAccess(path: string, accessCode?: string) {
  if (!accessCode) return path
  const [pathname, search] = path.split("?", 2)
  const params = new URLSearchParams(search)
  params.set("access", accessCode)
  return pathname + "?" + params.toString()
}
