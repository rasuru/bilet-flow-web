import { useId } from "react"
import type { ComponentProps } from "react"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type Props = Omit<ComponentProps<typeof Input>, "id"> & {
  label: string
  error?: string
}

export function AccountFormField({ label, error, ...input }: Props) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        {...input}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId ?? input["aria-describedby"]}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}
