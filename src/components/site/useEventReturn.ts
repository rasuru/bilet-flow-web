import { useHistoryState } from "wouter/use-browser-location"

export function useEventReturn() {
  const state = useHistoryState<{ eventReturn?: string } | null>()
  if (state?.eventReturn === "/") return { href: "/", label: "Home" }
  if (state?.eventReturn === "/my-tickets")
    return { href: "/my-tickets", label: "My tickets" }
  return {
    href: state?.eventReturn?.startsWith("/events?")
      ? state.eventReturn
      : "/events",
    label: "Discover events",
  }
}
