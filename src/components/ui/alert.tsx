import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva("rounded-lg border px-4 py-3 text-sm", {
  variants: {
    variant: {
      default: "bg-muted/50 text-foreground",
      destructive: "border-destructive/30 bg-destructive/5 text-destructive",
    },
  },
  defaultVariants: { variant: "default" },
})

function Alert({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-description"
      className={cn("leading-relaxed", className)}
      {...props}
    />
  )
}

export { Alert, AlertDescription }

