import { useState } from "react"
import { Ticket } from "lucide-react"

const assetPath = import.meta.env.BASE_URL

export function BrandLogo() {
  return (
    <span className="inline-flex shrink-0 items-center">
      <span className="sr-only">BiletFlow</span>
      <LogoVariant theme="light" />
      <LogoVariant theme="dark" />
    </span>
  )
}

function LogoVariant({ theme }: { theme: "light" | "dark" }) {
  const [logoUnavailable, setLogoUnavailable] = useState(false)
  const visibility =
    theme === "light"
      ? "inline-flex [.dark_&]:hidden"
      : "hidden [.dark_&]:inline-flex"

  return (
    <span aria-hidden="true" className={visibility}>
      {logoUnavailable ? (
        <span className="inline-flex h-8 items-center gap-2 text-sm font-semibold tracking-tight">
          <BrandIcon />
          BiletFlow
        </span>
      ) : (
        <img
          src={`${assetPath}biletflow-logo-${theme}.svg`}
          alt=""
          className="h-8 w-auto max-w-32 object-contain object-left"
          onError={() => setLogoUnavailable(true)}
        />
      )}
    </span>
  )
}

function BrandIcon() {
  const [unavailable, setUnavailable] = useState(false)

  return unavailable ? (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
      <Ticket className="size-4" />
    </span>
  ) : (
    <img
      src={`${assetPath}biletflow-icon.svg`}
      alt=""
      className="size-8 shrink-0 object-contain"
      onError={() => setUnavailable(true)}
    />
  )
}
