// 应付与付款：表单状态、payload 映射、状态标签

import { Tag } from 'antd'
import type { ReactNode } from 'react'
import type {
  PaymentRequestApprovePayload,
  PaymentRequestCreatePayload,
  SupplierInvoice,
  SupplierInvoiceCreatePayload,
} from '@/api'
import { daysFromTodayInputValue, emptyToNull, todayInputValue } from '@/app/pages/appHelpers'
import {
  paymentRequestStatusOptions,
  paymentTypeOptions,
  supplierInvoiceStatusOptions,
} from '@/shared/formOptions'

import { optionLabel } from './labels'

export type SupplierInvoiceFormState = {
  invoice_no: string
  invoice_date: string
  supplier_id: string
  supplier_name: string
  purchase_invoice_notice_id: string
  purchase_invoice_notice_code: string
  purchase_contract_id: string
  purchase_contract_no: string
  total_amount: string
  currency: string
  due_date: string
  remark: string
}

export type PaymentRequestFormState = {
  request_no: string
  supplier_invoice_id: string
  payment_type: string
  request_date: string
  requested_amount: string
  currency: string
  reviewer_id: string
  remark: string
}

export type PaymentApprovalFormState = {
  approved_amount: string
  approved_at: string
  reviewer_name: string
  payment_account: string
  remark: string
}

export function initialSupplierInvoiceForm(): SupplierInvoiceFormState {
  return {
    invoice_no: '',
    invoice_date: todayInputValue(),
    supplier_id: '',
    supplier_name: '',
    purchase_invoice_notice_id: '',
    purchase_invoice_notice_code: '',
    purchase_contract_id: '',
    purchase_contract_no: '',
    total_amount: '',
    currency: 'CNY',
    due_date: daysFromTodayInputValue(30),
    remark: '',
  }
}

export function initialPaymentRequestForm(invoice?: SupplierInvoice): PaymentRequestFormState {
  return {
    request_no: '',
    supplier_invoice_id: invoice?.id ?? '',
    payment_type: 'goods_payment',
    request_date: todayInputValue(),
    requested_amount: invoice?.unpaid_amount ?? '',
    currency: invoice?.currency ?? 'CNY',
    reviewer_id: '',
    remark: '',
  }
}

export function initialPaymentApprovalForm(
  amount = '',
  reviewerName = '',
): PaymentApprovalFormState {
  return {
    approved_amount: amount,
    approved_at: todayInputValue(),
    reviewer_name: reviewerName,
    payment_account: '',
    remark: '',
  }
}

export function supplierInvoicePayload(form: SupplierInvoiceFormState): SupplierInvoiceCreatePayload {
  return {
    invoice_no: form.invoice_no.trim(),
    invoice_date: form.invoice_date,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    purchase_invoice_notice_id: emptyToNull(form.purchase_invoice_notice_id),
    purchase_invoice_notice_code: emptyToNull(form.purchase_invoice_notice_code),
    purchase_contract_id: emptyToNull(form.purchase_contract_id),
    purchase_contract_no: emptyToNull(form.purchase_contract_no),
    total_amount: form.total_amount.trim(),
    currency: form.currency.trim(),
    due_date: emptyToNull(form.due_date),
    remark: emptyToNull(form.remark),
  }
}

export function paymentRequestPayload(form: PaymentRequestFormState): PaymentRequestCreatePayload {
  return {
    supplier_invoice_id: form.supplier_invoice_id.trim(),
    payment_type: form.payment_type,
    request_date: form.request_date,
    requested_amount: form.requested_amount.trim(),
    currency: form.currency.trim(),
    reviewer_id: form.reviewer_id,
    remark: emptyToNull(form.remark),
  }
}

export function paymentApprovalPayload(form: PaymentApprovalFormState): PaymentRequestApprovePayload {
  return {
    approved_amount: form.approved_amount.trim(),
    approved_at: form.approved_at,
    payment_account: emptyToNull(form.payment_account),
    remark: emptyToNull(form.remark),
  }
}

export function supplierInvoiceStatusLabel(value: string): string {
  return optionLabel(supplierInvoiceStatusOptions, value)
}

export function supplierInvoiceStatusTag(value: string): ReactNode {
  const color = value === 'paid' ? 'success' : value === 'partial' ? 'warning' : 'default'
  return <Tag color={color}>{supplierInvoiceStatusLabel(value)}</Tag>
}

export function paymentRequestStatusLabel(value: string): string {
  return optionLabel(paymentRequestStatusOptions, value)
}

export function paymentRequestStatusTag(value: string): ReactNode {
  const color = value === 'approved' ? 'success' : value === 'submitted' ? 'processing' : 'error'
  return <Tag color={color}>{paymentRequestStatusLabel(value)}</Tag>
}

export function paymentTypeLabel(value: string): string {
  return optionLabel(paymentTypeOptions, value)
}
