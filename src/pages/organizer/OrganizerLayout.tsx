import { TransactionNotice } from "@/components/site/TransactionNotice"
import { BrandLogo } from "@/components/site/BrandLogo"
import { BackLink } from "@/components/site/SitePage"
import { AppearanceControls } from "@/components/site/AppearanceControls"
import { t } from "@/i18n/locale"
import type { CSSProperties, ReactNode } from "react"
import { CircleHelp, LayoutDashboard, Settings } from "lucide-react"
import { Link } from "wouter"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
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
  { section: "support", href: "/support", label: "Support", Icon: CircleHelp },
  {
    section: "settings",
    href: "/account/settings?from=organizer",
    label: "Account settings",
    Icon: Settings,
  },
]

export function OrganizerLayout({
  isDashboard = false,
  children,
}: {
  isDashboard?: boolean
  children: ReactNode
}) {
  return (
    <SidebarProvider style={{ "--sidebar-width": "13rem" } as CSSProperties}>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader className="px-3 pt-5">
          <Link
            href="/"
            className="flex min-h-10 items-center gap-2 rounded-md px-3 font-semibold focus-visible:outline-2 focus-visible:outline-ring"
          >
            <BrandLogo />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-3">
            <nav aria-label={t("Organizer")}>
              <SidebarMenu className="gap-1">
                {navigation.map(({ section: key, href, label, Icon }) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      className="min-h-10 rounded-lg px-3"
                      isActive={key === "dashboard"}
                      render={
                        <Link
                          href={href}
                          aria-current={
                            key === "dashboard" && isDashboard
                              ? "page"
                              : undefined
                          }
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
      <SidebarInset id="main-content" className="min-w-0 bg-muted/35">
        <header className="flex min-h-14 items-center gap-2 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger className="size-10" />
          <BackLink href="/">{t("Home")}</BackLink>
          <div className="ml-auto">
            <AppearanceControls />
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t bg-background px-4 py-4 sm:px-6 print:hidden">
          <TransactionNotice />
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
