import { Select } from 'antd'
import type { ReactNode } from 'react'

import type {
  AssignableUser,
  Product,
  PurchaseContract,
  PurchaseContractApprovePayload,
  PurchaseContractCreatePayload,
  PurchaseContractGeneratePayload,
  PurchaseContractListSummary,
  Supplier,
} from '@/api'
import {
  purchaseContractSourceTypeOptions,
  purchaseContractStatusOptions,
} from '@/shared/formOptions'
import { t } from '@/app/appI18n'
import { emptyToNull, todayInputValue } from '@/app/pages/appHelpers'

export type PurchaseContractListFilters = {
  q: string
  status: string
  supplier: string
  source: string
}

export const emptyPurchaseContractSummary: PurchaseContractListSummary = {
  submitted_count: 0,
  approved_count: 0,
  total_amount: '0',
  currency: null,
}

export function purchaseContractFiltersFromParams(
  params: URLSearchParams,
): PurchaseContractListFilters {
  return {
    q: params.get('q') ?? '',
    status: params.get('status') ?? '',
    supplier: params.get('supplier') ?? '',
    source: params.get('source') ?? '',
  }
}

export function supplierOptionLabel(supplier: Supplier): string {
  return [supplier.code, supplier.cn_name, supplier.en_name].filter(Boolean).join(' / ')
}

export function assignableUserOptionLabel(user: AssignableUser): string {
  return [user.display_name, user.username, user.department_name].filter(Boolean).join(' / ')
}

export function productOptionLabel(product: Product): string {
  return [product.code, product.cn_name, product.en_name].filter(Boolean).join(' / ')
}

export function renderSupplierOptions(suppliers: Supplier[]): ReactNode {
  return suppliers.map((supplier) => {
    const label = supplierOptionLabel(supplier)
    return (
      <Select.Option key={supplier.id} value={supplier.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

export function renderAssignableUserOptions(users: AssignableUser[]): ReactNode {
  return users.map((user) => {
    const label = assignableUserOptionLabel(user)
    return (
      <Select.Option key={user.id} value={user.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

export function renderProductOptions(products: Product[]): ReactNode {
  return products.map((product) => {
    const label = productOptionLabel(product)
    return (
      <Select.Option key={product.id} value={product.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

export function mergePurchaseLineRemark(current: string, addition: string): string {
  if (!current.trim()) return addition
  if (current.includes(addition)) return current
  return `${current}; ${addition}`
}

export function productToPurchaseLine(product: Product): PurchaseContractLineFormState {
  return {
    key: product.id,
    product_id: product.id,
    product_code: product.code,
    product_name: product.cn_name || product.en_name || product.code,
    specification: product.specification ?? '',
    model: product.model ?? '',
    quantity: '1',
    unit: product.unit,
    unit_price: '0',
    source_export_contract_id: '',
    source_export_contract_no: '',
    source_export_contract_line_id: '',
    remark: product.package_info
      ? t('purchase.contract.message.packageRemark', { info: product.package_info })
      : '',
  }
}

export type PurchaseContractLineFormState = {
  key: string
  product_id: string
  product_code: string
  product_name: string
  specification: string
  model: string
  quantity: string
  unit: string
  unit_price: string
  source_export_contract_id: string
  source_export_contract_no: string
  source_export_contract_line_id: string
  remark: string
}

export type PurchaseContractFormState = {
  code: string
  contract_date: string
  supplier_id: string
  supplier_name: string
  buyer_user_id: string
  buyer_user_name: string
  qc_user_id: string
  qc_user_name: string
  currency: string
  delivery_date: string
  payment_terms: string
  source_type: PurchaseContractCreatePayload['source_type']
  remarks: string
  lines: PurchaseContractLineFormState[]
}

export type PurchaseContractGenerateFormState = {
  code: string
  contract_date: string
  source_contract_id_a: string
  source_contract_id_b: string
  supplier_id: string
  supplier_name: string
  buyer_user_id: string
  buyer_user_name: string
  qc_user_id: string
  qc_user_name: string
  currency: string
  delivery_date: string
  unit_price: string
  payment_terms: string
  remarks: string
}

export type PurchaseContractApproveFormState = {
  reviewer_name: string
  approved_at: string
  rejection_reason: string
}

export function initialPurchaseContractForm(): PurchaseContractFormState {
  return {
    code: '',
    contract_date: todayInputValue(),
    supplier_id: '',
    supplier_name: '',
    buyer_user_id: '',
    buyer_user_name: '',
    qc_user_id: '',
    qc_user_name: '',
    currency: 'RMB',
    delivery_date: todayInputValue(),
    payment_terms: '',
    source_type: 'manual',
    remarks: '',
    lines: [],
  }
}

export function initialPurchaseContractGenerateForm(): PurchaseContractGenerateFormState {
  return {
    code: '',
    contract_date: todayInputValue(),
    source_contract_id_a: '',
    source_contract_id_b: '',
    supplier_id: '',
    supplier_name: '',
    buyer_user_id: '',
    buyer_user_name: '',
    qc_user_id: '',
    qc_user_name: '',
    currency: 'USD',
    delivery_date: todayInputValue(),
    unit_price: '0',
    payment_terms: '',
    remarks: '',
  }
}

export function initialPurchaseContractApproveForm(): PurchaseContractApproveFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
    rejection_reason: '',
  }
}

export function purchaseContractToForm(contract: PurchaseContract): PurchaseContractFormState {
  return {
    code: contract.code,
    contract_date: contract.contract_date,
    supplier_id: contract.supplier_id ?? '',
    supplier_name: contract.supplier_name,
    buyer_user_id: contract.buyer_user_id ?? '',
    buyer_user_name: contract.buyer_user_name ?? '',
    qc_user_id: contract.qc_user_id ?? '',
    qc_user_name: contract.qc_user_name ?? '',
    currency: contract.currency,
    delivery_date: contract.delivery_date,
    payment_terms: contract.payment_terms,
    source_type: contract.source_type as PurchaseContractCreatePayload['source_type'],
    remarks: contract.remarks ?? '',
    lines: contract.lines.map((line) => ({
      key: line.id,
      product_id: line.product_id ?? '',
      product_code: line.product_code ?? '',
      product_name: line.product_name,
      specification: line.specification ?? '',
      model: line.model ?? '',
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unit_price,
      source_export_contract_id: line.source_export_contract_id ?? '',
      source_export_contract_no: line.source_export_contract_no ?? '',
      source_export_contract_line_id: line.source_export_contract_line_id ?? '',
      remark: line.remark ?? '',
    })),
  }
}

export function purchaseContractPayload(form: PurchaseContractFormState): PurchaseContractCreatePayload {
  return {
    contract_date: form.contract_date,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    buyer_user_id: emptyToNull(form.buyer_user_id),
    buyer_user_name: emptyToNull(form.buyer_user_name),
    qc_user_id: emptyToNull(form.qc_user_id),
    qc_user_name: emptyToNull(form.qc_user_name),
    currency: form.currency.trim(),
    delivery_date: form.delivery_date,
    payment_terms: form.payment_terms.trim(),
    source_type: form.source_type,
    remarks: emptyToNull(form.remarks),
    lines: form.lines.map((line) => ({
      product_id: emptyToNull(line.product_id),
      product_code: emptyToNull(line.product_code),
      product_name: line.product_name.trim(),
      specification: emptyToNull(line.specification),
      model: emptyToNull(line.model),
      quantity: line.quantity,
      unit: line.unit.trim(),
      unit_price: line.unit_price,
      source_export_contract_id: emptyToNull(line.source_export_contract_id),
      source_export_contract_no: emptyToNull(line.source_export_contract_no),
      source_export_contract_line_id: emptyToNull(line.source_export_contract_line_id),
      remark: emptyToNull(line.remark),
    })),
  }
}

export function purchaseContractGeneratePayload(
  form: PurchaseContractGenerateFormState,
): PurchaseContractGeneratePayload {
  const sources = [form.source_contract_id_a, form.source_contract_id_b]
    .map((item) => item.trim())
    .filter(Boolean)
    .map((export_contract_id) => ({ export_contract_id }))

  return {
    contract_date: form.contract_date,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    buyer_user_id: emptyToNull(form.buyer_user_id),
    buyer_user_name: emptyToNull(form.buyer_user_name),
    qc_user_id: emptyToNull(form.qc_user_id),
    qc_user_name: emptyToNull(form.qc_user_name),
    currency: form.currency.trim(),
    delivery_date: form.delivery_date,
    payment_terms: form.payment_terms.trim(),
    unit_price: form.unit_price,
    remarks: emptyToNull(form.remarks),
    sources,
  }
}

export function purchaseContractApprovePayload(
  form: PurchaseContractApproveFormState,
  decision: PurchaseContractApprovePayload['decision'],
): PurchaseContractApprovePayload {
  return {
    decision,
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
    rejection_reason: decision === 'rejected' ? form.rejection_reason.trim() : null,
  }
}

export function purchaseContractStatusLabel(value: string): string {
  const option = purchaseContractStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function purchaseContractSourceTypeLabel(value: string): string {
  const option = purchaseContractSourceTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function purchaseReminderTypeLabel(value: string): string {
  if (value === 'payment') return t('purchase.contract.detail.reminderTypePayment')
  if (value === 'delivery') return t('purchase.contract.detail.reminderTypeDelivery')
  return value
}

export function purchaseReminderStatusLabel(value: string): string {
  if (value === 'open') return t('purchase.contract.detail.reminderStatusOpen')
  if (value === 'closed') return t('purchase.contract.detail.reminderStatusClosed')
  return value
}
