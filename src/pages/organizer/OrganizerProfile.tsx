import { useState, type FormEvent } from "react"
import {
  Building2,
  Check,
  CreditCard,
  UserCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type OrganizerProfileData = {
  organizerName: string
  contactName: string
  email: string
  phone: string
}

type PayoutAccount = {
  accountHolder: string
  accountReference: string
}

type VerificationStatus = "notStarted" | "verified"

const initialProfile: OrganizerProfileData = {
  organizerName: "",
  contactName: "",
  email: "",
  phone: "",
}

const initialPayout: PayoutAccount = {
  accountHolder: "",
  accountReference: "",
}

const statusLabels: Record<VerificationStatus, string> = {
  notStarted: "Not verified",
  verified: "Verified (simulation)",
}

const statusStyles: Record<VerificationStatus, string> = {
  notStarted:
    "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  verified:
    "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}

export function OrganizerProfile() {
  const [savedProfile, setSavedProfile] = useState(initialProfile)
  const [profile, setProfile] = useState(initialProfile)
  const [savedPayout, setSavedPayout] = useState(initialPayout)
  const [payout, setPayout] = useState(initialPayout)
  const [identityStatus, setIdentityStatus] =
    useState<VerificationStatus>("notStarted")
  const [payoutStatus, setPayoutStatus] =
    useState<VerificationStatus>("notStarted")
  const [message, setMessage] = useState("")

  const profileChanged = Object.keys(profile).some(
    (key) =>
      profile[key as keyof OrganizerProfileData] !==
      savedProfile[key as keyof OrganizerProfileData]
  )
  const payoutChanged = Object.keys(payout).some(
    (key) =>
      payout[key as keyof PayoutAccount] !==
      savedPayout[key as keyof PayoutAccount]
  )
  const hasChanges = profileChanged || payoutChanged
  const contactComplete = Boolean(
    savedProfile.organizerName.trim() &&
    savedProfile.contactName.trim() &&
    savedProfile.email.trim()
  )
  const payoutComplete = Boolean(
    savedPayout.accountHolder && savedPayout.accountReference
  )

  function updateProfile(field: keyof OrganizerProfileData, value: string) {
    setProfile((current) => ({ ...current, [field]: value }))
    setMessage("")
  }

  function updatePayout(field: keyof PayoutAccount, value: string) {
    setPayout((current) => ({ ...current, [field]: value }))
    setMessage("")
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hasChanges) return
    if (
      !profile.organizerName.trim() ||
      !profile.contactName.trim() ||
      !profile.email.trim()
    ) {
      setMessage("Enter an organizer name, contact name, and contact email.")
      return
    }
    const accountHolder = payout.accountHolder.trim()
    const accountReference = payout.accountReference.trim()
    if (Boolean(accountHolder) !== Boolean(accountReference)) {
      setMessage("Provide both payout fields, or leave both empty.")
      return
    }
    const nextProfile = {
      organizerName: profile.organizerName.trim(),
      contactName: profile.contactName.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
    }
    const nextPayout = { accountHolder, accountReference }
    setSavedProfile(nextProfile)
    setProfile(nextProfile)
    setSavedPayout(nextPayout)
    setPayout(nextPayout)

    if (profileChanged) setIdentityStatus("notStarted")
    if (payoutChanged) setPayoutStatus("notStarted")
    setMessage("Changes saved.")
  }

  function handleDiscard() {
    setProfile({ ...savedProfile })
    setPayout({ ...savedPayout })
    setMessage("Unsaved changes discarded.")
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
          <div>
            <div className="flex items-center gap-2">
              <UserCircle
                className="h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
              <h1 className="text-2xl font-semibold tracking-tight">
                Organizer Profile
              </h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your organizer contact and payout information.
            </p>
          </div>


          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                    <Building2
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    Contact information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="organizer-name">Organizer name *</Label>
                    <Input
                      id="organizer-name"
                      required
                      maxLength={120}
                      value={profile.organizerName}
                      onChange={(event) =>
                        updateProfile("organizerName", event.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-name">Contact name *</Label>
                    <Input
                      id="contact-name"
                      required
                      maxLength={120}
                      value={profile.contactName}
                      onChange={(event) =>
                        updateProfile("contactName", event.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-email">Contact email *</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      required
                      maxLength={254}
                      value={profile.email}
                      aria-describedby="contact-email-help"
                      onChange={(event) =>
                        updateProfile("email", event.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-phone">
                      Phone number (optional)
                    </Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      maxLength={30}
                      value={profile.phone}
                      onChange={(event) =>
                        updateProfile("phone", event.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
                    <CreditCard
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    Payout information
                  </CardTitle>

                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="account-holder">Account holder</Label>
                    <Input
                      id="account-holder"
                      maxLength={120}
                      placeholder="Example organizer"
                      value={payout.accountHolder}
                      onChange={(event) =>
                        updatePayout("accountHolder", event.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="account-reference">
                      Demo payout account reference
                    </Label>
                    <Input
                      id="account-reference"
                      maxLength={80}
                      placeholder="DEMO-ACCOUNT-001"
                      value={payout.accountReference}
                      aria-describedby="payout-help"
                      onChange={(event) =>
                        updatePayout("accountReference", event.target.value)
                      }
                    />

                  </div>

                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p
                role="status"
                aria-live="polite"
                className="text-sm text-muted-foreground"
              >
                {message ||
                  (hasChanges
                    ? "You have unsaved changes."
                    : "No unsaved changes.")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasChanges}
                  onClick={handleDiscard}
                >
                  Discard changes
                </Button>
                <Button type="submit" disabled={!hasChanges} className="gap-2">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Save changes
                </Button>
              </div>
            </div>
          </form>

          <Card className="shadow-none">

            <CardContent className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Identity verification</p>
                  <StatusBadge status={identityStatus} />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    hasChanges ||
                    !contactComplete ||
                    identityStatus === "verified"
                  }
                  onClick={() => {
                    setIdentityStatus("verified")
                    setMessage(
                      "Identity verification completed."
                    )
                  }}
                >
                  Simulate identity verification
                </Button>
              </div>
              <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Payout verification</p>
                  <StatusBadge status={payoutStatus} />
                  {!payoutComplete && (
                    <p className="text-xs text-muted-foreground">
                      Save a demo payout account to continue.
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    hasChanges || !payoutComplete || payoutStatus === "verified"
                  }
                  onClick={() => {
                    setPayoutStatus("verified")
                    setMessage(
                      "Payout verification completed."
                    )
                  }}
                >
                  Simulate payout verification
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default OrganizerProfile
