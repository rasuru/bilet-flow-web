import { ChevronDown, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { languages, setLanguage, t, useLanguage, type Language } from "./locale"

export function LanguagePicker() {
  const language = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${t("Language")} (${languages[language]})`}
        render={
          <Button variant="ghost" className="h-10 min-w-10 print:hidden" />
        }
      >
        <Globe aria-hidden="true" />
        <span lang={language} className="hidden sm:inline">
          {languages[language]}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="hidden size-3.5 text-muted-foreground sm:block"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(value) => setLanguage(value as Language)}
        >
          {Object.entries(languages).map(([code, label]) => (
            <DropdownMenuRadioItem
              key={code}
              value={code}
              lang={code}
              closeOnClick
              className="min-h-9 pl-2.5"
            >
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
