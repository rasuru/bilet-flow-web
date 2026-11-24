import { Monitor, Moon, Sun } from "lucide-react"

import { useTheme, type Theme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguagePicker } from "@/i18n/LanguagePicker"
import { t, useLanguage } from "@/i18n/locale"

const themes = {
  system: { label: "System", Icon: Monitor },
  light: { label: "Light", Icon: Sun },
  dark: { label: "Dark", Icon: Moon },
}

function ThemePicker() {
  const { theme, setTheme } = useTheme()
  useLanguage()
  const { label, Icon: CurrentIcon } = themes[theme]
  const name = t("Theme ({0})", t(label))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={name}
        title={name}
        render={<Button variant="ghost" size="icon" className="size-10" />}
      >
        <CurrentIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
        >
          {Object.entries(themes).map(([value, { label, Icon }]) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              closeOnClick
              className="min-h-9 pl-2.5"
            >
              <Icon aria-hidden="true" />
              {t(label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppearanceControls() {
  return (
    <div className="flex shrink-0 items-center gap-0.5 print:hidden">
      <ThemePicker />
      <LanguagePicker />
    </div>
  )
}
