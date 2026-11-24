import type { ReactNode } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { t } from "@/i18n/locale"

export function EventManagementDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  action,
  model,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  title: string
  description?: string
  action: string
  model: { busy: boolean; error: string | null; submit: () => void }
  children: ReactNode
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!model.busy) onOpenChange(next)
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="min-h-10 max-w-full whitespace-normal"
          />
        }
      >
        {trigger}
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="wrap-anywhere">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          noValidate
          aria-busy={model.busy}
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            model.submit()
          }}
        >
          <fieldset disabled={model.busy} className="min-w-0 space-y-4">
            {children}
          </fieldset>
          {model.error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{model.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" type="button" disabled={model.busy} />
              }
            >
              {t("Back")}
            </DialogClose>
            <Button type="submit" disabled={model.busy}>
              {model.busy && <Spinner aria-hidden="true" />}
              {action}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
