import { GlobeIcon } from "lucide-react"

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

import { languages, setLanguage, t, useLanguage, type Language } from "./locale"

export function LanguagePicker() {
  const language = useLanguage()

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-end gap-2 px-4 pt-3 sm:px-6 print:hidden">
      <GlobeIcon aria-hidden="true" className="size-4 text-muted-foreground" />
      <NativeSelect
        aria-label={t("Language")}
        value={language}
        onChange={(event) => setLanguage(event.currentTarget.value as Language)}
      >
        {Object.entries(languages).map(([code, label]) => (
          <NativeSelectOption key={code} value={code} lang={code}>
            {label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}

