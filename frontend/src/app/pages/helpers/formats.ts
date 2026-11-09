import { translate } from '@/locales'
import { partnerTypeOptions } from '@/shared/formOptions'

import { getRuntimeSettings } from './runtimeSettings'

export function formatMoney(value?: string | null, currency?: string | null): string {
  if (!value) return translate(getRuntimeSettings().language, 'common.notSet')
  const numeric = Number(value)
  const amount = Number.isFinite(numeric)
    ? numeric.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: value.includes('.') ? 2 : 0,
      })
    : value
  return `${currency ?? 'USD'} ${amount}`
}

export function formatFinanceAmount(value?: string | null, currency?: string | null): string {
  if (!value) return '-'
  const numeric = Number(value)
  const amount = Number.isFinite(numeric)
    ? numeric.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: value.includes('.') ? 2 : 0,
      })
    : value
  if (!currency || currency === '-' || currency === '多币种') return amount
  return `${currency} ${amount}`
}

export function nullableText(value: string | null): string {
  return value ?? '-'
}

export function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

export function trimDecimal(value: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  return Number.isInteger(numeric) ? String(numeric) : String(numeric)
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function formatPercent(value?: string | null): string {
  if (!value) return '-'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  return `${(numeric * 100).toFixed(1)}%`
}

export function partnerTypeLabel(value: string): string {
  const option = partnerTypeOptions.find((item) => item.value === value)
  return option ? translate(getRuntimeSettings().language, option.labelKey) : value
}
