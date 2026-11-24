import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { Link } from "wouter"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const widths = {
  wide: "max-w-7xl",
  content: "max-w-5xl",
  form: "max-w-2xl",
  compact: "max-w-lg",
}

export function SitePage({
  width = "wide",
  children,
  className,
}: {
  width?: keyof typeof widths
  children: ReactNode
  className?: string
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn(
        "mx-auto w-full min-w-0 space-y-6 px-4 py-5 outline-none sm:px-6 sm:py-8 print:max-w-none print:p-0",
        widths[width],
        className
      )}
    >
      {children}
    </main>
  )
}

export function BackLink({
  href,
  children,
  className,
  state,
}: {
  href: string
  children: ReactNode
  className?: string
  state?: Record<string, unknown>
}) {
  return (
    <Link
      href={href}
      state={state}
      className={buttonVariants({
        variant: "ghost",
        className: cn(
          "-ml-2 h-auto min-h-10 max-w-full justify-start py-2 text-left whitespace-normal print:hidden",
          className
        ),
      })}
    >
      <ArrowLeft aria-hidden="true" />
      {children}
    </Link>
  )
}

export function PageHeading({
  children,
  description,
  action,
}: {
  children: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-semibold tracking-tight wrap-anywhere">
          {children}
        </h1>
        {description && (
          <p className="max-w-prose text-sm leading-relaxed wrap-anywhere text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  )
}
