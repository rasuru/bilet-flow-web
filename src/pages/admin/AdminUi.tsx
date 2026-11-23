import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import type { ComponentProps, FormEventHandler, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import { filterValue, label } from "./adminPresentation"

type QueryState = {
  loading: boolean
  busy: boolean
  error: string | null
  retry: () => void
}

export function QueryContent({
  state,
  children,
}: {
  state: QueryState
  children: ReactNode
}) {
  if (state.loading) {
    return (
      <div
        className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground"
        role="status"
      >
        <Spinner aria-hidden="true" /> Loading…
      </div>
    )
  }
  if (state.error !== null) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
        <Button size="sm" variant="outline" onClick={state.retry}>
          Try again
        </Button>
      </div>
    )
  }
  return <div aria-busy={state.busy}>{children}</div>
}

export function AdminTable<T>({
  columns,
  items,
  rowKey,
  cells,
  state,
  empty,
  pagination,
  caption,
}: {
  columns: string[]
  items: T[]
  rowKey: (item: T) => string | number
  cells: (item: T) => ReactNode[]
  state: QueryState
  empty: string
  caption: string
  pagination?: {
    page: number
    hasNext: boolean
    previous: () => void
    next: () => void
  }
}) {
  return (
    <Card className="gap-0 py-0">
      <QueryContent state={state}>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{caption}</caption>
              <thead className="border-b bg-muted/55 text-muted-foreground">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-xs font-medium whitespace-nowrap"
                      scope="col"
                    >
                      {column || <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr
                    key={rowKey(item)}
                    className="transition-colors hover:bg-muted/35"
                  >
                    {cells(item).map((cell, index) => (
                      <td
                        key={columns[index]}
                        className="px-4 py-3 align-middle"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {empty}
          </p>
        )}
      </QueryContent>
      {pagination && (pagination.page > 0 || pagination.hasNext) && (
        <nav
          aria-label={`${caption} pagination`}
          className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"
        >
          <p className="text-xs text-muted-foreground">
            Page {pagination.page + 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 0 || state.busy}
              onClick={pagination.previous}
            >
              <ArrowLeft aria-hidden="true" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext || state.busy}
              onClick={pagination.next}
            >
              Next <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </Card>
  )
}

const statusTone: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  ACTIVE: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  COMPLETED: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  SUCCEEDED: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  OPEN: "bg-amber-500/15 text-amber-900 dark:text-amber-300",
  PENDING: "bg-amber-500/15 text-amber-900 dark:text-amber-300",
  SUSPENDED: "bg-amber-500/15 text-amber-900 dark:text-amber-300",
  FAILED: "bg-destructive/10 text-destructive",
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        statusTone[value] ?? "bg-muted text-muted-foreground"
      )}
    >
      {label(value)}
    </span>
  )
}

export function RecordId({
  value,
}: {
  value: string | number | null | undefined
}) {
  if (value == null) return <span className="text-muted-foreground">—</span>
  return (
    <span
      className="font-mono text-xs break-all text-muted-foreground"
      title={String(value)}
    >
      {value}
    </span>
  )
}

export function RecordButton({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      {children}
    </Button>
  )
}

export function Filters({
  children,
  onApply,
  onReset,
}: {
  children: ReactNode
  onApply: FormEventHandler<HTMLFormElement>
  onReset: () => void
}) {
  return (
    <Card className="px-4">
      <form onSubmit={onApply} className="flex flex-wrap items-end gap-3">
        {children}
        <div className="flex shrink-0 gap-2">
          <Button type="submit">Apply filters</Button>
          <Button type="button" variant="ghost" onClick={onReset}>
            Reset
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function FilterInput({
  label: text,
  id,
  className,
  ...props
}: ComponentProps<typeof Input> & { label: string; id: string }) {
  return (
    <Field className={cn("min-w-32 flex-1 basis-40", className)}>
      <FieldLabel htmlFor={id}>{text}</FieldLabel>
      <Input id={id} {...props} />
    </Field>
  )
}

export function FilterSelect<T extends string>({
  id,
  title,
  values,
  value,
  onChange,
  allLabel = "All",
}: {
  id: string
  title: string
  values: readonly T[]
  value: T | undefined
  onChange: (value: T | undefined) => void
  allLabel?: string
}) {
  return (
    <Field className="min-w-32 flex-1 basis-36">
      <FieldLabel htmlFor={id}>{title}</FieldLabel>
      <NativeSelect
        id={id}
        value={value ?? ""}
        onChange={(event) =>
          onChange(filterValue(values, event.currentTarget.value))
        }
      >
        <NativeSelectOption value="">{allLabel}</NativeSelectOption>
        {values.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {label(option)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  )
}

export function AdminDialog({
  title,
  description,
  children,
  onClose,
  pending = false,
}: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  pending?: boolean
}) {
  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 bg-black/45 data-ending-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border bg-popover p-5 text-popover-foreground shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <DialogPrimitive.Title className="text-lg font-semibold break-words">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  aria-label="Close dialog"
                />
              }
            >
              <X aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function Details({ fields }: { fields: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-5 gap-y-4 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-2">
      {fields.map(([title, value]) => (
        <div className="min-w-0 space-y-1" key={title}>
          <dt className="text-xs text-muted-foreground">{title}</dt>
          <dd className="break-words">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ActionFeedback({
  error,
  success,
}: {
  error: string | null
  success?: string | null
}) {
  return (
    <>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-muted-foreground">
          {success}
        </p>
      )}
    </>
  )
}
