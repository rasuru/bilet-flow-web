import { t } from "@/i18n/locale"
import type { ReactNode } from "react"
import {
  CalendarDays,
  CircleHelp,
  LayoutDashboard,
  Settings,
  Ticket,
} from "lucide-react"
import { Link } from "wouter"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const navigation = [
  {
    section: "dashboard",
    href: "/organizer",
    label: "Dashboard",
    Icon: LayoutDashboard,
  },
  {
    section: "events",
    href: "/organizer/events",
    label: "Events",
    Icon: CalendarDays,
  },
  { section: "support", href: "/support", label: "Support", Icon: CircleHelp },
  {
    section: "settings",
    href: "/account/settings",
    label: "Account settings",
    Icon: Settings,
  },
]

export function OrganizerLayout({
  section,
  children,
}: {
  section: "dashboard" | "events"
  children: ReactNode
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md p-2 font-semibold"
          >
            <Ticket className="size-5" aria-hidden="true" />
            BiletFlow
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("Organizer")}</SidebarGroupLabel>
            <nav aria-label={t("Organizer")}>
              <SidebarMenu>
                {navigation.map(({ section: key, href, label, Icon }) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      isActive={section === key}
                      render={
                        <Link
                          href={href}
                          aria-current={section === key ? "page" : undefined}
                        />
                      }
                    >
                      <Icon aria-hidden="true" />
                      <span>{t(label)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-2 border-b px-4 py-2">
          <SidebarTrigger />
          <Link href="/" className="text-sm font-semibold md:hidden">
            BiletFlow
          </Link>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
