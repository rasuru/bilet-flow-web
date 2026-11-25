import { t, numberFormat } from "@/i18n/locale"
import { useQuery } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import type { PromoQuoteRequest } from "@/api/checkouts"
import { checkoutRepository } from "@/checkout/checkoutRepository"

import {
  promoError,
  useCampaignLinkViewModel,
} from "./useCampaignLinkViewModel"

const codePattern = /^[A-Z0-9]{6,20}$/
const kzt = numberFormat({
  style: "currency",
  currency: "KZT",
})

export function useCheckoutPromoViewModel(
  eventId: string,
  token: string | null,
  selections: PromoQuoteRequest["selections"],
  accessCode?: string
) {
  const link = useCampaignLinkViewModel(eventId, token)
  const linkedCode = link.status === "ready" ? link.code : null
  const [chosenCode, setChosenCode] = useState<string | null>()
  const [draft, setDraft] = useState<string>()
  const [inputError, setInputError] = useState<string>()
  const [checkoutRejection, setCheckoutRejection] = useState<string>()
  const usesLink = chosenCode === undefined
  const code = usesLink ? linkedCode : chosenCode
  const linkLoading = usesLink && link.status === "loading"
  const linkError =
    usesLink && link.status === "error" ? link.message : undefined
  const canQuote =
    selections.length > 0 &&
    selections.length <= 30 &&
    selections.reduce((sum, item) => sum + item.quantity, 0) <= 100
  const request =
    code && canQuote ? { eventId, promoCode: code, selections, ...(accessCode ? { accessCode } : {}) } : null
  const quote = useQuery(checkoutRepository.promoQuoteQuery(request))
  const checking = !!request && (quote.isPending || quote.isFetching)
  const accepted =
    request && !checking && !quote.isError && !checkoutRejection
      ? quote.data
      : undefined
  const discount = accepted && {
    subtotal: kzt.format(accepted.subtotalKzt),
    amount: kzt.format(accepted.discountKzt),
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = (draft ?? code ?? "").trim().toUpperCase()
    if (!codePattern.test(value)) {
      setInputError("Enter a promo code with 6–20 letters or numbers.")
      return
    }
    setInputError(undefined)
    setCheckoutRejection(undefined)
    setDraft(value)
    setChosenCode(value)
    if (value === code && request) void quote.refetch()
  }

  return {
    draft: draft ?? code ?? "",
    chosen: !!code,
    canRemove: !!code || linkLoading || !!linkError,
    pending: linkLoading || checking,
    awaitingSelection: !!code && selections.length === 0,
    appliedCode: accepted?.promoCode,
    amountKzt: accepted?.amountKzt,
    discount,
    // A checkout can only use a code quoted for the current basket.
    blocksOrder: linkLoading || (!!code && !accepted),
    error:
      inputError ??
      checkoutRejection ??
      linkError ??
      (code && selections.length > 0 && !canQuote
        ? t("An order can include up to 100 tickets across 30 ticket types.")
        : undefined) ??
      (request && quote.isError
        ? promoError(
            quote.error,
            t("Couldn’t check the promo code. Try applying it again.")
          )
        : undefined),
    retryLink: usesLink && link.status === "error" ? link.retry : undefined,
    setDraft: (value: string) => {
      setDraft(value)
      setInputError(undefined)
    },
    apply,
    remove: () => {
      setChosenCode(null)
      setDraft("")
      setInputError(undefined)
      setCheckoutRejection(undefined)
    },
    reject: (error: unknown) =>
      setCheckoutRejection(
        promoError(error, t("This promo code could not be applied."))
      ),
  }
}

