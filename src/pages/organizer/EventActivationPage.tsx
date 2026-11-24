import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "wouter"

import {
  createPaymentSession,
  getActivationChecklist,
  getPaidSalesActivation,
  startPaidSalesActivation,
} from "@/api/payments"
import { sessionRepository } from "@/auth/sessionRepository"
import { openHalykPayment } from "@/checkout/halykPayment"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { numberFormat, statusText, t } from "@/i18n/locale"
import { payoutAccountRepository } from "@/payments/payoutAccountRepository"

const currency = numberFormat({ style: "currency", currency: "KZT" })

export function EventActivationPage({
  eventId,
  sessionId,
}: {
  eventId: string
  sessionId: number
}) {
  const [verified, setVerified] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [paymentId, setPaymentId] = useState<string>()
  const returnPath = `/organizer/events/${encodeURIComponent(eventId)}/activate`
  const checklist = useQuery({
    queryKey: ["activation-checklist", sessionId, eventId],
    queryFn: () =>
      sessionRepository.authenticatedRequest(sessionId, (token) =>
        getActivationChecklist(token, eventId)
      ),
    refetchInterval: ({ state }) =>
      state.data?.status === "PENDING" || (paymentId && !state.data?.complete)
        ? 5_000
        : false,
  })
  const payout = useQuery(payoutAccountRepository.accountQuery(sessionId))
  const data = checklist.data
  const pending = data?.status === "PENDING" || !!paymentId
  const active = data?.status === "ACTIVE"
  const suspended = data?.status === "SUSPENDED"
  const canPay = Boolean(
    data?.sandbox &&
    !data.complete &&
    !active &&
    !suspended &&
    !checklist.isError &&
    (pending ||
      (data.readyToRequest &&
        payout.data &&
        !payout.isError &&
        verified &&
        accepted))
  )
  const payment = useMutation({
    mutationFn: () =>
      sessionRepository.authenticatedRequest(sessionId, async (token) => {
        const latest = await getActivationChecklist(token, eventId)
        if (!latest.sandbox)
          throw new Error(t("Sandbox activation is unavailable."))
        if (latest.complete || ["ACTIVE", "SUSPENDED"].includes(latest.status))
          return

        let id = paymentId
        if (latest.status === "PENDING") {
          const activation = await getPaidSalesActivation(token, eventId)
          if (activation.status !== "PENDING") return
          if (!activation.sandbox || !activation.paymentId)
            throw new Error(t("No pending sandbox payment was found."))
          id = activation.paymentId
        }
        if (!id) {
          if (!latest.readyToRequest || !payout.data || !verified || !accepted)
            throw new Error(t("Complete the activation requirements first."))
          const activation = await startPaidSalesActivation(token, eventId, {
            acceptSandboxTerms: accepted,
            simulateIdentityAndPayoutVerification: verified,
          })
          if (!activation.sandbox)
            throw new Error(t("Sandbox activation is unavailable."))
          id = activation.paymentId
        }

        setPaymentId(id)
        const session = await createPaymentSession(token, id)
        await openHalykPayment(session, returnPath, { sandboxOnly: true })
      }),
    onSettled: () => checklist.refetch(),
  })

  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-6 sm:px-6">
      <Link
        href={"/organizer/events/" + encodeURIComponent(eventId)}
        className={buttonVariants({ variant: "ghost" })}
      >
        {t("Manage event")}
      </Link>
      <Link
        href={`/organizer/events/${encodeURIComponent(eventId)}/orders`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {t("Orders & Manage")}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{t("Activate Paid Sales")}</h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklist.isPending && (
            <p role="status">{t("Loading activation checklist…")}</p>
          )}
          {checklist.isError && (
            <p role="alert">{t(checklist.error.message)}</p>
          )}
          {data && (
            <>
              <p role="status">
                {t("Status")}: {statusText(data.status)}
              </p>
              <p>
                {t("Activation fee")}: {currency.format(data.activationFeeKzt)}
              </p>
              <ul className="space-y-2">
                {data.items.map((item) => (
                  <li key={item.key}>
                    {t(item.description)} ·{" "}
                    {item.done ? t("Complete") : t("Pending")}
                    {item.simulated && ` · ${t("Simulated")}`}
                  </li>
                ))}
              </ul>
              {!active && !suspended && !data.complete && (
                <>
                  {payout.isPending && (
                    <p role="status">{t("Loading payout account…")}</p>
                  )}
                  {payout.isError && (
                    <p role="alert">{t(payout.error.message)}</p>
                  )}
                  {payout.data === null && (
                    <Link
                      href="/account/settings"
                      className={buttonVariants({ variant: "outline" })}
                    >
                      {t("Set up payout account")}
                    </Link>
                  )}
                  {data.sandbox ? (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault()
                        if (canPay && !payment.isPending) payment.mutate()
                      }}
                    >
                      {!pending && (
                        <fieldset
                          className="space-y-3"
                          disabled={payment.isPending}
                        >
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={verified}
                              onCheckedChange={setVerified}
                            />
                            {t("Simulate identity and payout verification")}
                          </label>
                          <label className="flex items-center gap-2">
                            <Checkbox
                              checked={accepted}
                              onCheckedChange={setAccepted}
                            />
                            {t("I accept the sandbox terms")}
                          </label>
                        </fieldset>
                      )}
                      <Button
                        type="submit"
                        disabled={!canPay || payment.isPending}
                      >
                        {payment.isPending
                          ? t("Opening Halyk sandbox…")
                          : pending
                            ? t("Resume sandbox payment")
                            : t("Pay activation fee in Halyk sandbox")}
                      </Button>
                    </form>
                  ) : (
                    <p>{t("Sandbox activation is unavailable.")}</p>
                  )}
                </>
              )}
            </>
          )}
          {payment.isError && !active && (
            <p role="alert">{t(payment.error.message)}</p>
          )}
          <Button
            variant="outline"
            disabled={
              checklist.isFetching || payout.isFetching || payment.isPending
            }
            onClick={() => {
              void checklist.refetch()
              void payout.refetch()
            }}
          >
            {t("Refresh status")}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
