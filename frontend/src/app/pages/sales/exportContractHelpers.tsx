import { Select } from 'antd'
import type { ReactNode } from 'react'

import type {
  AssignableUser,
  CurrentUser,
  Customer,
  ExportContract,
  ExportContractAdvancePaymentPayload,
  ExportContractApprovePayload,
  ExportContractCreatePayload,
  ExportContractSignaturePayload,
  Product,
} from '@/api'
import { exportContractStatusOptions } from '@/shared/formOptions'
import { t } from '@/app/appI18n'
import { emptyToNull, todayInputValue } from '@/app/pages/appHelpers'

export function customerDisplayName(customer: Customer): string {
  return customer.cn_name || customer.en_name || customer.code
}

export function customerOptionLabel(customer: Customer): string {
  return [customer.code, customerDisplayName(customer), customer.country].filter(Boolean).join(' / ')
}

export function renderCustomerOptions(customers: Customer[]): ReactNode {
  return customers.map((customer) => {
    const displayName = customerDisplayName(customer)
    const description = [customer.code, customer.country].filter(Boolean).join(' · ')
    return (
      <Select.Option key={customer.id} value={customer.id} label={displayName}>
        <div className="remote-select-option">
          <span className="remote-select-option-title">{displayName}</span>
          <span className="remote-select-option-desc">{description}</span>
        </div>
      </Select.Option>
    )
  })
}

export function assignableUserOptionLabel(user: AssignableUser): string {
  return [user.display_name, user.username, user.department_name].filter(Boolean).join(' / ')
}

export function renderAssignableUserOptions(users: AssignableUser[]): ReactNode {
  return users.map((user) => (
    <Select.Option key={user.id} value={user.id} label={user.display_name}>
      <div className="remote-select-option">
        <span className="remote-select-option-title">{user.display_name}</span>
        <span className="remote-select-option-desc">
          {[user.username, user.department_name].filter(Boolean).join(' · ')}
        </span>
      </div>
    </Select.Option>
  ))
}

export function contractProgressStatusLabel(value: string): string {
  if (value === 'completed') return t('sales.contract.progress.completed')
  if (value === 'partial') return t('sales.contract.progress.partial')
  if (value === 'pending') return t('sales.contract.progress.pending')
  return value
}


export type ExportContractLineFormState = {
  key: string
  product_id: string
  product_code: string
  product_name: string
  barcode: string
  specification: string
  model: string
  quantity: string
  unit: string
  unit_price: string
  purchased_quantity: string
  shipped_quantity: string
  image_url: string
  line_remark: string
}

export type ExportContractFormState = {
  code: string
  contract_date: string
  customer_id: string
  customer_name: string
  sales_user_id: string
  sales_user_name: string
  currency: string
  trade_term: string
  planned_ship_date: string
  payment_terms: string
  source_quotation_id: string
  source_quotation_no: string
  remarks: string
  lines: ExportContractLineFormState[]
}

export type ExportContractApproveFormState = {
  reviewer_name: string
  approved_at: string
}

export type ExportContractSignatureFormState = {
  signed_by: string
  signed_at: string
  signature_method: string
  file_no: string
  remark: string
}

export type ExportContractAdvancePaymentFormState = {
  payment_no: string
  received_at: string
  amount: string
  currency: string
  payer_name: string
  remark: string
}


export function initialExportContractForm(currentUser?: CurrentUser): ExportContractFormState {
  return {
    code: '',
    contract_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    sales_user_id: currentUser?.id ?? '',
    sales_user_name: currentUser?.display_name ?? '',
    currency: 'USD',
    trade_term: 'FOB Ningbo',
    planned_ship_date: todayInputValue(),
    payment_terms: '30% T/T in advance, balance before shipment',
    source_quotation_id: '',
    source_quotation_no: '',
    remarks: '',
    lines: [],
  }
}

export function initialExportContractApproveForm(): ExportContractApproveFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
  }
}

export function initialExportContractSignatureForm(): ExportContractSignatureFormState {
  return {
    signed_by: '',
    signed_at: todayInputValue(),
    signature_method: 'email_scan',
    file_no: '',
    remark: '',
  }
}

export function initialExportContractAdvancePaymentForm(): ExportContractAdvancePaymentFormState {
  return {
    payment_no: '',
    received_at: todayInputValue(),
    amount: '',
    currency: 'USD',
    payer_name: '',
    remark: '',
  }
}

export function exportContractToForm(contract: ExportContract): ExportContractFormState {
  return {
    code: contract.code,
    contract_date: contract.contract_date,
    customer_id: contract.customer_id ?? '',
    customer_name: contract.customer_name,
    sales_user_id: contract.sales_user_id ?? '',
    sales_user_name: contract.sales_user_name ?? '',
    currency: contract.currency,
    trade_term: contract.trade_term,
    planned_ship_date: contract.planned_ship_date,
    payment_terms: contract.payment_terms,
    source_quotation_id: contract.source_quotation_id ?? '',
    source_quotation_no: contract.source_quotation_no ?? '',
    remarks: contract.remarks ?? '',
    lines: contract.lines.map((line, index) => ({
      key: line.id || `${line.product_id ?? 'line'}-${index}`,
      product_id: line.product_id ?? '',
      product_code: line.product_code ?? '',
      product_name: line.product_name,
      barcode: line.barcode ?? '',
      specification: line.specification ?? '',
      model: line.model ?? '',
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unit_price,
      purchased_quantity: line.purchased_quantity,
      shipped_quantity: line.shipped_quantity,
      image_url: line.image_url ?? '',
      line_remark: line.remark ?? '',
    })),
  }
}

export function exportContractPayload(form: ExportContractFormState): ExportContractCreatePayload {
  return {
    contract_date: form.contract_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    currency: form.currency.trim(),
    trade_term: form.trade_term.trim(),
    planned_ship_date: form.planned_ship_date,
    payment_terms: form.payment_terms.trim(),
    source_quotation_id: emptyToNull(form.source_quotation_id),
    source_quotation_no: emptyToNull(form.source_quotation_no),
    remarks: emptyToNull(form.remarks),
    lines: form.lines.map((line) => ({
      product_id: emptyToNull(line.product_id),
      product_code: emptyToNull(line.product_code),
      product_name: line.product_name.trim(),
      barcode: emptyToNull(line.barcode),
      specification: emptyToNull(line.specification),
      model: emptyToNull(line.model),
      quantity: line.quantity,
      unit: line.unit.trim(),
      unit_price: line.unit_price,
      purchased_quantity: line.purchased_quantity || '0',
      shipped_quantity: line.shipped_quantity || '0',
      image_url: emptyToNull(line.image_url),
      remark: emptyToNull(line.line_remark),
    })),
  }
}

export function productToContractLine(product: Product): ExportContractLineFormState {
  return {
    key: product.id,
    product_id: product.id,
    product_code: product.code,
    product_name: product.cn_name || product.en_name || product.code,
    barcode: '',
    specification: product.specification ?? '',
    model: product.model ?? '',
    quantity: '1',
    unit: product.unit || 'pcs',
    unit_price: '1.00',
    purchased_quantity: '0',
    shipped_quantity: '0',
    image_url: product.image_url ?? '',
    line_remark: product.package_info ? `包装: ${product.package_info}` : '',
  }
}

export function exportContractApprovePayload(
  form: ExportContractApproveFormState,
): ExportContractApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

export function exportContractSignaturePayload(
  form: ExportContractSignatureFormState,
): ExportContractSignaturePayload {
  return {
    signed_by: form.signed_by.trim(),
    signed_at: form.signed_at,
    signature_method: form.signature_method.trim(),
    file_no: emptyToNull(form.file_no),
    remark: emptyToNull(form.remark),
  }
}

export function exportContractAdvancePaymentPayload(
  form: ExportContractAdvancePaymentFormState,
): ExportContractAdvancePaymentPayload {
  return {
    payment_no: form.payment_no.trim(),
    received_at: form.received_at,
    amount: form.amount,
    currency: form.currency.trim(),
    payer_name: form.payer_name.trim(),
    remark: emptyToNull(form.remark),
  }
}

export function exportContractStatusLabel(value: string): string {
  const option = exportContractStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function signatureStatusLabel(value: string): string {
  if (value === 'signed') return t('sales.contract.signatureStatus.signed')
  if (value === 'not_signed') return t('sales.contract.signatureStatus.notSigned')
  if (value === 'pending') return t('sales.contract.signatureStatus.pending')
  return value
}

