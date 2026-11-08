import type { ReactNode } from 'react'

import { fieldIds, type QualityTaskValidationField } from '../qualityInspectionMeta'

export function RequiredFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="form-field-label">
      {children}
      <span aria-hidden="true" className="form-required-mark">
        *
      </span>
    </span>
  )
}

export function FieldError({
  field,
  message,
}: {
  field: QualityTaskValidationField
  message?: string
}) {
  if (!message) return null
  return (
    <span className="form-field-error" id={`${fieldIds[field]}-error`}>
      {message}
    </span>
  )
}
