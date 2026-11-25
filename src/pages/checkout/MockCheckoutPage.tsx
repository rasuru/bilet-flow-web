import { BackLink, PageHeading, SitePage } from "@/components/site/SitePage"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { t } from "@/i18n/locale"

import { useMockCheckoutViewModel } from "./useMockCheckoutViewModel"

export function MockCheckoutPage({
  sessionId,
  paymentId,
}: {
  sessionId: number
  paymentId: string
}) {
  const model = useMockCheckoutViewModel(sessionId, paymentId)
  const checkout = model.checkout
  return (
    <SitePage width="form">
      <BackLink href={model.back.href}>{model.back.label}</BackLink>
      <PageHeading
        description={t(
          "Simulate a payment. No money moves and no card details are needed."
        )}
      >
        {t("Mock checkout")}
      </PageHeading>
      {model.loading && (
        <p className="flex items-center gap-2" role="status">
          <Spinner aria-hidden="true" /> {t("Loading payment…")}
        </p>
      )}
      {model.queryError && (
        <div className="space-y-2">
          <FieldError>{t("Could not load this mock payment.")}</FieldError>
          <Button variant="outline" onClick={model.refresh}>
            {t("Try again")}
          </Button>
        </div>
      )}
      {checkout && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>
                {t(
                  checkout.orderId ? "Ticket payment" : "Paid sales activation"
                )}
              </h2>
            </CardTitle>
            <p className="text-3xl font-semibold tabular-nums">{model.total}</p>
            {model.canChoose && (
              <p className="text-sm text-muted-foreground">
                {t("Payment expires at {0}.", model.deadline ?? "")}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {model.status && (
              <Alert>
                <AlertDescription role="status">
                  <span className="font-medium">{model.status}</span>
                  {checkout.status === "PENDING" &&
                    !checkout.closed &&
                    checkout.scenario === "DELAYED_SUCCESS" && (
                      <span>
                        {t(
                          "The simulator will confirm this payment automatically."
                        )}
                      </span>
                    )}
                </AlertDescription>
              </Alert>
            )}
            {model.canChoose && (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    className="min-h-10"
                    disabled={model.pending}
                    onClick={() => model.choose("SUCCESS")}
                  >
                    {t("Succeed now")}
                  </Button>
                  <Button
                    className="min-h-10"
                    variant="outline"
                    disabled={model.pending || !model.delayAvailable}
                    onClick={() => model.choose("DELAYED_SUCCESS")}
                  >
                    {t("Succeed after {0} seconds", checkout.delaySeconds)}
                  </Button>
                  <Button
                    className="min-h-10"
                    variant="outline"
                    disabled={model.pending}
                    onClick={() => model.choose("FAILURE")}
                  >
                    {t("Simulate failure")}
                  </Button>
                  <Button
                    className="min-h-10"
                    variant="outline"
                    disabled={model.pending}
                    onClick={() => model.choose("EXPIRATION")}
                  >
                    {t("Expire payment")}
                  </Button>
                </div>
                {!model.delayAvailable && (
                  <p className="text-sm text-muted-foreground">
                    {t("This payment expires too soon to simulate a delay.")}
                  </p>
                )}
              </>
            )}
            {model.pending && (
              <p className="text-sm" role="status">
                {t("Saving the simulated outcome…")}
              </p>
            )}
            {model.mutationError && (
              <FieldError>{model.mutationError}</FieldError>
            )}
          </CardContent>
        </Card>
      )}
    </SitePage>
  )
}
