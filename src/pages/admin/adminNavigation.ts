import {
  CalendarDays,
  CreditCard,
  Download,
  Flag,
  House,
  KeyRound,
  ListOrdered,
  MessagesSquare,
  Percent,
  Settings2,
  Users,
} from "lucide-react"

export const adminNavigation = [
  {
    title: null,
    items: [
      {
        id: "overview",
        title: "Overview",
        description: "Review the queues that need platform attention.",
        icon: House,
      },
    ],
  },
  {
    title: "Moderation",
    items: [
      {
        id: "events",
        title: "Events",
        description:
          "Find events across every visibility and publication status.",
        icon: CalendarDays,
      },
      {
        id: "event-reports",
        title: "Event reports",
        description: "Read, confirm, or dismiss reports submitted by users.",
        icon: Flag,
      },
      {
        id: "support",
        title: "Support cases",
        description:
          "Inspect platform support requests and escalated attendee conversations.",
        icon: MessagesSquare,
      },
    ],
  },
  {
    title: "Commerce",
    items: [
      {
        id: "orders",
        title: "Orders",
        description: "Look up issued orders by event, buyer, or order ID.",
        icon: ListOrdered,
      },
      {
        id: "payments",
        title: "Payments",
        description:
          "Review bank operations and inspect ticket payments, activation fees, and refunds.",
        icon: CreditCard,
      },
      {
        id: "activations",
        title: "Paid sales",
        description: "Review activations and suspend or reinstate paid sales.",
        icon: Settings2,
      },
      {
        id: "promotions",
        title: "Promotion activity",
        description:
          "See issued orders with a recorded promotion and discount.",
        icon: Percent,
      },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        id: "users",
        title: "Users",
        description:
          "Manage accounts, activation status, and authority assignments.",
        icon: Users,
      },
      {
        id: "authorities",
        title: "Authorities",
        description:
          "Manage the authorities available for assignment to users.",
        icon: KeyRound,
      },
      {
        id: "settings",
        title: "Platform settings",
        description:
          "Set the paid-sales activation fee and estimated processing fee rate.",
        icon: Settings2,
      },
      {
        id: "exports",
        title: "Operational exports",
        description:
          "Download operational counts by resource and status as a CSV.",
        icon: Download,
      },
    ],
  },
] as const

export type AdminSection =
  (typeof adminNavigation)[number]["items"][number]["id"]

export function adminPath(section: AdminSection) {
  return section === "overview" ? "/admin" : `/admin/${section}`
}

export function getAdminSection(section: string) {
  return adminNavigation
    .flatMap((group) => [...group.items])
    .find((item) => item.id === section)
}
