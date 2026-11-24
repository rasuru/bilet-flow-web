import { useSyncExternalStore } from "react"

import { kazakh, russian } from "./messages"

export const languages = {
  en: "English",
  ru: "Русский",
  kk: "Қазақша",
} as const

export type Language = keyof typeof languages

const storageKey = "biletflow.language"
const locales: Record<Language, string> = { en: "en", ru: "ru-KZ", kk: "kk-KZ" }
const dictionaries = { ru: russian, kk: kazakh }
const listeners = new Set<() => void>()

function supported(value: string | null | undefined): Language | undefined {
  const code = value?.toLowerCase().split("-")[0]
  if (code === "kz") return "kk"
  return code === "en" || code === "ru" || code === "kk" ? code : undefined
}

function initialLanguage(): Language {
  try {
    const stored = supported(window.localStorage.getItem(storageKey))
    if (stored) return stored
  } catch {
    // Storage may be disabled.
  }
  if (typeof navigator !== "undefined") {
    for (const preference of navigator.languages ?? [navigator.language]) {
      const match = supported(preference)
      if (match) return match
    }
  }
  return "en"
}

let language = initialLanguage()

function updateDocument() {
  if (typeof document !== "undefined") document.documentElement.lang = language
}

updateDocument()

export function setLanguage(next: Language) {
  if (language === next) return
  language = next
  try {
    window.localStorage.setItem(storageKey, next)
  } catch {
    // Keep the selection for this session when storage is disabled.
  }
  updateDocument()
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useLanguage() {
  return useSyncExternalStore(
    subscribe,
    () => language,
    () => "en" as const
  )
}

export function t(message: string, ...values: (string | number)[]): string {
  const dictionary = language === "en" ? undefined : dictionaries[language]
  const template =
    dictionary && Object.hasOwn(dictionary, message)
      ? dictionary[message]
      : message
  return values.length
    ? template.replace(/\{(\d+)\}/g, (key, index: string) => {
        const value = values[Number(index)]
        return value === undefined ? key : String(value)
      })
    : template
}

export function uiText(message: string | null | undefined) {
  return message == null ? message : t(message)
}

export function dateFormat(options: Intl.DateTimeFormatOptions) {
  const formatters = new Map<Language, Intl.DateTimeFormat>()
  return {
    format(value: Date | number) {
      let formatter = formatters.get(language)
      if (!formatter) {
        formatter = new Intl.DateTimeFormat(locales[language], options)
        formatters.set(language, formatter)
      }
      return formatter.format(value)
    },
  }
}

export function numberFormat(options: Intl.NumberFormatOptions) {
  const formatters = new Map<Language, Intl.NumberFormat>()
  return {
    format(value: number) {
      let formatter = formatters.get(language)
      if (!formatter) {
        formatter = new Intl.NumberFormat(locales[language], options)
        formatters.set(language, formatter)
      }
      if (options.style === "currency" && options.currency?.toUpperCase() === "KZT") {
        const amount = formatter
          .formatToParts(value)
          .filter((part) => part.type !== "currency")
          .map((part) => part.value)
          .join("")
          .trim()
        return `${amount}\u00a0₸`
      }
      return formatter.format(value)
    },
  }
}

const statusMessages: Readonly<Record<string, string>> = {
  AWAITING_PAYMENT: "Awaiting payment",
  PAYMENT_FAILED: "Payment failed",
  IN_PROGRESS: "In progress",
}

export function statusText(status: string) {
  const words = status.toLowerCase().replaceAll("_", " ")
  return t(
    statusMessages[status] ?? words.charAt(0).toUpperCase() + words.slice(1)
  )
}

