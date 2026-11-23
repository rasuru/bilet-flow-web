import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

import type { CreateCampaignRequest, DiscountType } from "@/api/campaigns"
import { campaignRepository } from "@/promotions/campaignRepository"

import { campaignActionError } from "./useCampaignsViewModel"

type Draft = {
  name: string
  discountType: DiscountType
  discountValue: string
  validFrom: string
  validUntil: string
  maxRedemptions: string
  ticketScope: "all" | "selected"
  ticketIds: string[]
}

const emptyDraft: Draft = {
  name: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  validFrom: "",
  validUntil: "",
  maxRedemptions: "",
  ticketScope: "all",
  ticketIds: [],
}

function validate(draft: Draft): CreateCampaignRequest | string {
  const name = draft.name.trim()
  const discountValue = Number(draft.discountValue)
  const scale = draft.discountType === "PERCENTAGE" ? 4 : 2
  const validFrom = new Date(draft.validFrom)
  const validUntil = new Date(draft.validUntil)
  const max = draft.maxRedemptions.trim()
  const maxRedemptions = max === "" ? null : Number(max)

  if (!name || name.length > 100)
    return "Enter a campaign name of up to 100 characters."
  if (
    !new RegExp(
      `^(?:\\d{1,15}(?:\\.\\d{1,${scale}})?|\\.\\d{1,${scale}})$`
    ).test(draft.discountValue) ||
    discountValue <= 0
  ) {
    return `Enter a positive discount with up to ${scale} decimal places.`
  }
  if (draft.discountType === "PERCENTAGE" && discountValue > 100)
    return "A percentage discount can’t exceed 100%."
  if (
    !Number.isFinite(validFrom.valueOf()) ||
    !Number.isFinite(validUntil.valueOf()) ||
    validUntil <= validFrom
  ) {
    return "Enter a start and end date, with the end after the start."
  }
  if (
    maxRedemptions !== null &&
    (!/^\d+$/.test(max) ||
      !Number.isInteger(maxRedemptions) ||
      maxRedemptions < 1 ||
      maxRedemptions > 2_147_483_647)
  ) {
    return "Enter a positive whole number for the redemption limit."
  }
  if (draft.ticketScope === "selected" && draft.ticketIds.length === 0)
    return "Select at least one ticket type."

  return {
    name,
    discountType: draft.discountType,
    discountValue,
    validFrom: validFrom.toISOString(),
    validUntil: validUntil.toISOString(),
    maxRedemptions,
    applicableTicketTypeIds: draft.ticketScope === "all" ? [] : draft.ticketIds,
  }
}

export function useCreateCampaignViewModel(
  sessionId: number,
  eventId: string,
  onCreated: () => void
) {
  const [draft, setDraft] = useState(emptyDraft)
  const [validationError, setValidationError] = useState<string>()
  const client = useQueryClient()
  const create = useMutation({
    mutationFn: (request: CreateCampaignRequest) =>
      campaignRepository.create(client, sessionId, eventId, request),
    onSuccess: onCreated,
  })

  function edit(change: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...change }))
    setValidationError(undefined)
    if (create.isError) create.reset()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (create.isPending) return
    const request = validate(draft)
    if (typeof request === "string") setValidationError(request)
    else create.mutate(request)
  }

  return {
    draft,
    edit,
    submit,
    toggleTicketType: (id: string, checked: boolean) =>
      edit({
        ticketIds: checked
          ? [...draft.ticketIds, id]
          : draft.ticketIds.filter((item) => item !== id),
      }),
    pending: create.isPending,
    error:
      validationError ??
      (create.isError
        ? campaignActionError(create.error, "Couldn’t create the campaign.")
        : null),
  }
}
