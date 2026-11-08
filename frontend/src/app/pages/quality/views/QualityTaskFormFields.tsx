import type { ReactNode } from 'react'

import type { CompletionErrors } from '../qualityTaskHelpers'

export function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <span className="form-field-label">
      {children}
      <span aria-hidden="true" className="form-required-mark">
        *
      </span>
    </span>
  )
}

export function CompletionError({
  field,
  errors,
}: {
  field: string
  errors: CompletionErrors
}) {
  const message = errors[field]
  if (!message) return null
  return (
    <span className="form-field-error" id={`quality-task-${field}-error`}>
      {message}
    </span>
  )
}
