import { Select } from 'antd'
import type { ReactNode } from 'react'

import {
  exportQuotationStatusOptions,
  freightMethodOptions,
  sampleDeliveryStatusOptions,
} from '@/shared/formOptions'
import { emptyToNull, todayInputValue } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type {
  Customer,
  ExportQuotation,
  ExportQuotationApprovePayload,
  ExportQuotationConfirmContractPayload,
  ExportQuotationCreatePayload,
} from '@/api'

export function sampleDeliveryStatusLabel(value: string): string {
  const option = sampleDeliveryStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function exportQuotationStatusLabel(value: string): string {
  const option = exportQuotationStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function freightMethodLabel(value: string): string {
  const option = freightMethodOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function customerDisplayName(customer: Customer): string {
  return customer.cn_name || customer.en_name || customer.code
}

export function customerOptionLabel(customer: Customer): string {
  return [customer.code, customerDisplayName(customer), customer.country]
    .filter(Boolean)
    .join(' / ')
}

export function renderCustomerOptions(customers: Customer[]): ReactNode {
  return customers.map((customer) => {
    const label = customerOptionLabel(customer)
    return (
      <Select.Option key={customer.id} value={customer.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

export type ExportQuotationFormState = {
  code: string
  quote_date: string
  customer_id: string
  customer_name: string
  sales_user_id: string
  sales_user_name: string
  currency: string
  trade_term: string
  valid_until: string
  description: string
  product_id: string
  product_code: string
  product_name: string
  specification: string
  model: string
  quantity: string
  unit: string
  unit_price: string
  freight_method: string
  freight_amount: string
  purchase_reference_supplier_name: string
  purchase_reference_price: string
  line_remark: string
}

export type ExportQuotationApproveFormState = {
  reviewer_name: string
  approved_at: string
}

export type ExportQuotationContractFormState = {
  confirmed_at: string
}

export function initialExportQuotationForm(): ExportQuotationFormState {
  return {
    code: '',
    quote_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    sales_user_id: '',
    sales_user_name: '',
    currency: 'USD',
    trade_term: 'FOB Ningbo',
    valid_until: todayInputValue(),
    description: '',
    product_id: '',
    product_code: '',
    product_name: '',
    specification: '',
    model: '',
    quantity: '1',
    unit: 'pcs',
    unit_price: '1.00',
    freight_method: 'sea',
    freight_amount: '0.00',
    purchase_reference_supplier_name: '',
    purchase_reference_price: '',
    line_remark: '',
  }
}

export function initialExportQuotationApproveForm(): ExportQuotationApproveFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
  }
}

export function initialExportQuotationContractForm(): ExportQuotationContractFormState {
  return {
    confirmed_at: todayInputValue(),
  }
}

export function exportQuotationToForm(quotation: ExportQuotation): ExportQuotationFormState {
  const line = quotation.lines[0]
  return {
    code: quotation.code,
    quote_date: quotation.quote_date,
    customer_id: quotation.customer_id ?? '',
    customer_name: quotation.customer_name,
    sales_user_id: quotation.sales_user_id ?? '',
    sales_user_name: quotation.sales_user_name ?? '',
    currency: quotation.currency,
    trade_term: quotation.trade_term,
    valid_until: quotation.valid_until ?? '',
    description: quotation.description ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    specification: line?.specification ?? '',
    model: line?.model ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
    unit_price: line?.unit_price ?? '1.00',
    freight_method: line?.freight_method ?? 'sea',
    freight_amount: line?.freight_amount ?? '0.00',
    purchase_reference_supplier_name: line?.purchase_reference_supplier_name ?? '',
    purchase_reference_price: line?.purchase_reference_price ?? '',
    line_remark: line?.remark ?? '',
  }
}

export function exportQuotationPayload(form: ExportQuotationFormState): ExportQuotationCreatePayload {
  return {
    quote_date: form.quote_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    currency: form.currency.trim(),
    trade_term: form.trade_term.trim(),
    valid_until: emptyToNull(form.valid_until),
    description: emptyToNull(form.description),
    lines: [
      {
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        specification: emptyToNull(form.specification),
        model: emptyToNull(form.model),
        quantity: form.quantity,
        unit: form.unit.trim(),
        unit_price: form.unit_price,
        freight_method: form.freight_method,
        freight_amount: form.freight_amount,
        purchase_reference_supplier_name: emptyToNull(form.purchase_reference_supplier_name),
        purchase_reference_price: emptyToNull(form.purchase_reference_price),
        remark: emptyToNull(form.line_remark),
      },
    ],
  }
}

export function exportQuotationApprovePayload(
  form: ExportQuotationApproveFormState,
): ExportQuotationApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

export function exportQuotationContractPayload(
  form: ExportQuotationContractFormState,
): ExportQuotationConfirmContractPayload {
  return {
    confirmed_at: form.confirmed_at,
  }
}
