// 杂费与报销：表单状态、payload 映射、状态标签

import { Tag } from 'antd'
import type { ReactNode } from 'react'
import type {
  MiscFeeAllocationCreatePayload,
  MiscFeeItem,
  MiscFeeItemCreatePayload,
} from '@/api'
import { translate, type TranslationKey } from '@/locales'
import { emptyToNull, getRuntimeSettings, todayInputValue } from '@/app/pages/appHelpers'
import {
  miscFeeAllocationMethodOptions,
  miscFeeCategoryOptions,
  miscFeeItemStatusOptions,
} from '@/shared/formOptions'

import { optionLabel } from './labels'

export type MiscFeeItemFormState = {
  code: string
  name: string
  category: string
  default_allocation_method: string
  is_active: boolean
  remark: string
}

export type MiscFeeAllocationFormState = {
  allocation_no: string
  item_id: string
  shipment_plan_id: string
  shipment_no: string
  sales_user_id: string
  sales_user_name: string
  allocated_at: string
  amount: string
  currency: string
  allocation_method: string
  basis: string
  remark: string
}

export function initialMiscFeeItemForm(): MiscFeeItemFormState {
  return {
    code: '',
    name: '',
    category: 'office',
    default_allocation_method: 'manual',
    is_active: true,
    remark: '',
  }
}

export function initialMiscFeeAllocationForm(item?: MiscFeeItem): MiscFeeAllocationFormState {
  return {
    allocation_no: '',
    item_id: item?.id ?? '',
    shipment_plan_id: '',
    shipment_no: '',
    sales_user_id: '',
    sales_user_name: '',
    allocated_at: todayInputValue(),
    amount: '',
    currency: 'USD',
    allocation_method: item?.default_allocation_method ?? 'manual',
    basis: '',
    remark: '',
  }
}

export function miscFeeItemPayload(form: MiscFeeItemFormState): MiscFeeItemCreatePayload {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    category: form.category,
    default_allocation_method: form.default_allocation_method,
    is_active: form.is_active,
    remark: emptyToNull(form.remark),
  }
}

export function miscFeeAllocationPayload(
  form: MiscFeeAllocationFormState,
  selectedItem: MiscFeeItem | null,
): MiscFeeAllocationCreatePayload {
  return {
    item_id: form.item_id.trim() || selectedItem?.id || '',
    shipment_plan_id: form.shipment_plan_id.trim(),
    shipment_no: emptyToNull(form.shipment_no),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    allocated_at: form.allocated_at,
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    allocation_method: form.allocation_method,
    basis: emptyToNull(form.basis),
    remark: emptyToNull(form.remark),
  }
}

export function miscFeeCategoryLabel(value: string): string {
  return optionLabel(miscFeeCategoryOptions, value)
}

export function miscFeeAllocationMethodLabel(value: string): string {
  return optionLabel(miscFeeAllocationMethodOptions, value)
}

export function miscFeeItemStatusLabel(value: string): string {
  return optionLabel(miscFeeItemStatusOptions, value)
}

export function miscFeeItemStatusTag(value: string): ReactNode {
  const color = value === 'active' ? 'success' : 'default'
  return <Tag color={color}>{miscFeeItemStatusLabel(value)}</Tag>
}

export function reimbursementCategoryLabel(value: string): string {
  const labelKeys: Record<string, TranslationKey> = {
    travel: 'finance.reimbursement.category.travel',
    office: 'finance.reimbursement.category.office',
    entertainment: 'finance.reimbursement.category.entertainment',
    other: 'finance.reimbursement.category.other',
  }
  const labelKey = labelKeys[value]
  return labelKey ? translate(getRuntimeSettings().language, labelKey) : value
}

export function reimbursementStatusTag(value: string): ReactNode {
  const config: Record<string, { color: string; labelKey: TranslationKey }> = {
    submitted: { color: 'processing', labelKey: 'finance.reimbursement.status.submitted' },
    approved: { color: 'success', labelKey: 'finance.reimbursement.status.approved' },
    rejected: { color: 'error', labelKey: 'finance.reimbursement.status.rejected' },
    paid: { color: 'default', labelKey: 'finance.reimbursement.status.paid' },
  }
  const item = config[value]
  if (!item) return <Tag color="default">{value}</Tag>
  return <Tag color={item.color}>{translate(getRuntimeSettings().language, item.labelKey)}</Tag>
}
