// 合作方费用：表单状态、payload 映射、状态标签

import { Tag } from 'antd'
import type { ReactNode } from 'react'
import type {
  FeePaymentRequestApprovePayload,
  FeePaymentRequestCreatePayload,
  PartnerFeeInvoice,
  PartnerFeeInvoiceCreatePayload,
} from '@/api'
import { daysFromTodayInputValue, emptyToNull, todayInputValue } from '@/app/pages/appHelpers'
import {
  feePaymentRequestStatusOptions,
  feeTypeOptions,
  partnerFeeInvoiceStatusOptions,
} from '@/shared/formOptions'

import { optionLabel } from './labels'

export type PartnerFeeInvoiceFormState = {
  invoice_no: string
  invoice_date: string
  partner_id: string
  partner_name: string
  partner_type: string
  shipment_plan_id: string
  shipment_no: string
  sales_user_id: string
  sales_user_name: string
  fee_type: string
  total_amount: string
  currency: string
  due_date: string
  remark: string
}

export type FeePaymentRequestFormState = {
  request_no: string
  partner_fee_invoice_id: string
  request_date: string
  requested_amount: string
  currency: string
  reviewer_id: string
  remark: string
}

export type FeePaymentApprovalFormState = {
  approved_amount: string
  approved_at: string
  reviewer_name: string
  payment_account: string
  remark: string
}

export function initialPartnerFeeInvoiceForm(): PartnerFeeInvoiceFormState {
  return {
    invoice_no: '',
    invoice_date: todayInputValue(),
    partner_id: '',
    partner_name: '',
    partner_type: 'freight_forwarder',
    shipment_plan_id: '',
    shipment_no: '',
    sales_user_id: '',
    sales_user_name: '',
    fee_type: 'freight',
    total_amount: '',
    currency: 'USD',
    due_date: daysFromTodayInputValue(30),
    remark: '',
  }
}

export function initialFeePaymentRequestForm(invoice?: PartnerFeeInvoice): FeePaymentRequestFormState {
  return {
    request_no: '',
    partner_fee_invoice_id: invoice?.id ?? '',
    request_date: todayInputValue(),
    requested_amount: invoice?.unpaid_amount ?? '',
    currency: invoice?.currency ?? 'USD',
    reviewer_id: '',
    remark: '',
  }
}

export function initialFeePaymentApprovalForm(
  amount = '',
  reviewerName = '',
): FeePaymentApprovalFormState {
  return {
    approved_amount: amount,
    approved_at: todayInputValue(),
    reviewer_name: reviewerName,
    payment_account: '',
    remark: '',
  }
}

export function partnerFeeInvoicePayload(form: PartnerFeeInvoiceFormState): PartnerFeeInvoiceCreatePayload {
  return {
    invoice_no: form.invoice_no.trim(),
    invoice_date: form.invoice_date,
    partner_id: emptyToNull(form.partner_id),
    partner_name: form.partner_name.trim(),
    partner_type: emptyToNull(form.partner_type),
    shipment_plan_id: emptyToNull(form.shipment_plan_id),
    shipment_no: emptyToNull(form.shipment_no),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    fee_type: form.fee_type,
    total_amount: form.total_amount.trim(),
    currency: form.currency.trim(),
    due_date: emptyToNull(form.due_date),
    remark: emptyToNull(form.remark),
  }
}

export function feePaymentRequestPayload(form: FeePaymentRequestFormState): FeePaymentRequestCreatePayload {
  return {
    partner_fee_invoice_id: form.partner_fee_invoice_id.trim(),
    request_date: form.request_date,
    requested_amount: form.requested_amount.trim(),
    currency: form.currency.trim(),
    reviewer_id: form.reviewer_id,
    remark: emptyToNull(form.remark),
  }
}

export function feePaymentApprovalPayload(form: FeePaymentApprovalFormState): FeePaymentRequestApprovePayload {
  return {
    approved_amount: form.approved_amount.trim(),
    approved_at: form.approved_at,
    payment_account: emptyToNull(form.payment_account),
    remark: emptyToNull(form.remark),
  }
}

export function partnerFeeInvoiceStatusLabel(value: string): string {
  return optionLabel(partnerFeeInvoiceStatusOptions, value)
}

export function partnerFeeInvoiceStatusTag(value: string): ReactNode {
  const color = value === 'paid' ? 'success' : value === 'partial' ? 'warning' : 'default'
  return <Tag color={color}>{partnerFeeInvoiceStatusLabel(value)}</Tag>
}

export function feePaymentRequestStatusLabel(value: string): string {
  return optionLabel(feePaymentRequestStatusOptions, value)
}

export function feePaymentRequestStatusTag(value: string): ReactNode {
  const color = value === 'approved' ? 'success' : value === 'submitted' ? 'processing' : 'error'
  return <Tag color={color}>{feePaymentRequestStatusLabel(value)}</Tag>
}

export function feeTypeLabel(value: string): string {
  return optionLabel(feeTypeOptions, value)
}
