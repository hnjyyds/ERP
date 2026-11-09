// 收款与应收：表单状态、payload 映射、状态标签

import { Tag } from 'antd'
import type { ReactNode } from 'react'
import type {
  BankReceiptAllocationPayload,
  BankReceiptClaimPayload,
  BankReceiptCreatePayload,
} from '@/api'
import { translate } from '@/locales'
import { emptyToNull, getRuntimeSettings, todayInputValue } from '@/app/pages/appHelpers'
import {
  allocationTypeOptions,
  receiptStatusOptions,
  receiptTypeOptions,
} from '@/shared/formOptions'

import { optionLabel } from './labels'

export type BankReceiptFormState = {
  receipt_no: string
  received_at: string
  payer_name: string
  customer_id: string
  customer_name: string
  amount: string
  currency: string
  bank_account: string
  reference_no: string
  receipt_type: string
  remark: string
}

export type ReceiptClaimFormState = {
  claimed_at: string
  sales_user_id: string
  sales_user_name: string
  note: string
}

export type ReceiptAllocationFormState = {
  allocation_type: string
  contract_id: string
  contract_no: string
  invoice_no: string
  allocated_at: string
  amount: string
  currency: string
  remark: string
}

export function initialBankReceiptForm(): BankReceiptFormState {
  return {
    receipt_no: '',
    received_at: todayInputValue(),
    payer_name: '',
    customer_id: '',
    customer_name: '',
    amount: '',
    currency: 'USD',
    bank_account: '',
    reference_no: '',
    receipt_type: 'advance',
    remark: '',
  }
}

export function initialReceiptClaimForm(): ReceiptClaimFormState {
  return {
    claimed_at: todayInputValue(),
    sales_user_id: '',
    sales_user_name: '',
    note: '',
  }
}

export function initialReceiptAllocationForm(currency = 'USD'): ReceiptAllocationFormState {
  return {
    allocation_type: 'contract',
    contract_id: '',
    contract_no: '',
    invoice_no: '',
    allocated_at: todayInputValue(),
    amount: '',
    currency,
    remark: '',
  }
}

export function bankReceiptPayload(form: BankReceiptFormState): BankReceiptCreatePayload {
  return {
    received_at: form.received_at,
    payer_name: form.payer_name.trim(),
    customer_id: emptyToNull(form.customer_id),
    customer_name: emptyToNull(form.customer_name),
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    bank_account: form.bank_account.trim(),
    reference_no: emptyToNull(form.reference_no),
    receipt_type: form.receipt_type,
    remark: emptyToNull(form.remark),
  }
}

export function receiptClaimPayload(form: ReceiptClaimFormState): BankReceiptClaimPayload {
  return {
    claimed_at: form.claimed_at,
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    note: emptyToNull(form.note),
  }
}

export function receiptAllocationPayload(
  form: ReceiptAllocationFormState,
): BankReceiptAllocationPayload {
  return {
    allocation_type: form.allocation_type,
    contract_id: emptyToNull(form.contract_id),
    contract_no: emptyToNull(form.contract_no),
    invoice_no: emptyToNull(form.invoice_no),
    allocated_at: form.allocated_at,
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    remark: emptyToNull(form.remark),
  }
}

export function receiptStatusLabel(value: string): string {
  return optionLabel(receiptStatusOptions, value)
}

export function receiptStatusColor(value: string): string {
  if (value === 'allocated') return 'success'
  if (value === 'partially_allocated') return 'processing'
  if (value === 'claimed') return 'warning'
  return 'default'
}

export function receiptStatusTag(value: string): ReactNode {
  return <Tag color={receiptStatusColor(value)}>{receiptStatusLabel(value)}</Tag>
}

export function receiptTypeLabel(value: string): string {
  return optionLabel(receiptTypeOptions, value)
}

export function allocationTypeLabel(value: string): string {
  return optionLabel(allocationTypeOptions, value)
}

export function receivableStatusLabel(value: string): string {
  if (value === 'paid') return translate(getRuntimeSettings().language, 'finance.receivable.status.paid')
  if (value === 'partial') return translate(getRuntimeSettings().language, 'finance.receivable.status.partial')
  return translate(getRuntimeSettings().language, 'finance.receivable.status.unpaid')
}

export function receivableStatusTag(value: string): ReactNode {
  const color = value === 'paid' ? 'success' : value === 'partial' ? 'warning' : 'default'
  return <Tag color={color}>{receivableStatusLabel(value)}</Tag>
}
