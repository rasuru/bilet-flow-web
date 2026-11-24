import type { ReactNode } from "react"

import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { Card } from "@/components/ui/card"

export function AccountFlowPage({
  title,
  href,
  backLabel,
  children,
}: {
  title: string
  href: string
  backLabel: string
  children: ReactNode
}) {
  return (
    <SitePage width="compact" className="sm:py-12">
      <BackLink href={href}>{backLabel}</BackLink>
      <Card className="gap-5 p-5 sm:p-7">
        <PageHeading>{title}</PageHeading>
        {children}
      </Card>
    </SitePage>
  )
}
