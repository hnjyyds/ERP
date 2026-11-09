// 单证与退税：表单状态、payload 映射、状态标签

import { Tag } from 'antd'
import type { ReactNode } from 'react'
import type {
  CustomsReceiptRegisterPayload,
  TaxRefundRegisterPayload,
  VerificationDocumentCreatePayload,
  VerificationRegisterPayload,
} from '@/api'
import { daysFromTodayInputValue, emptyToNull, todayInputValue } from '@/app/pages/appHelpers'
import {
  verificationDocumentStatusOptions,
  verificationReminderStatusOptions,
} from '@/shared/formOptions'

import { optionLabel } from './labels'

export type VerificationDocumentFormState = {
  document_no: string
  received_at: string
  owner_user_id: string
  owner_user_name: string
  shipment_plan_id: string
  shipment_no: string
  customer_name: string
  currency: string
  refundable_amount: string
  valid_until: string
  remark: string
}

export type CustomsReceiptFormState = {
  customs_declaration_no: string
  customs_receipt_no: string
  received_at: string
  remark: string
}

export type VerificationRegisterFormState = {
  verification_no: string
  verified_at: string
  remark: string
}

export type TaxRefundFormState = {
  refund_no: string
  refunded_at: string
  amount: string
  currency: string
  bank_receipt_no: string
  remark: string
}

export function initialVerificationDocumentForm(): VerificationDocumentFormState {
  return {
    document_no: '',
    received_at: todayInputValue(),
    owner_user_id: '',
    owner_user_name: '',
    shipment_plan_id: '',
    shipment_no: '',
    customer_name: '',
    currency: 'USD',
    refundable_amount: '',
    valid_until: daysFromTodayInputValue(30),
    remark: '',
  }
}

export function initialCustomsReceiptForm(): CustomsReceiptFormState {
  return {
    customs_declaration_no: '',
    customs_receipt_no: '',
    received_at: todayInputValue(),
    remark: '',
  }
}

export function initialVerificationRegisterForm(): VerificationRegisterFormState {
  return {
    verification_no: '',
    verified_at: todayInputValue(),
    remark: '',
  }
}

export function initialTaxRefundForm(currency = 'USD', amount = ''): TaxRefundFormState {
  return {
    refund_no: '',
    refunded_at: todayInputValue(),
    amount,
    currency,
    bank_receipt_no: '',
    remark: '',
  }
}

export function verificationDocumentPayload(
  form: VerificationDocumentFormState,
): VerificationDocumentCreatePayload {
  return {
    received_at: form.received_at,
    owner_user_id: emptyToNull(form.owner_user_id),
    owner_user_name: emptyToNull(form.owner_user_name),
    shipment_plan_id: emptyToNull(form.shipment_plan_id),
    shipment_no: emptyToNull(form.shipment_no),
    customer_name: emptyToNull(form.customer_name),
    currency: form.currency.trim(),
    refundable_amount: form.refundable_amount.trim(),
    valid_until: form.valid_until,
    remark: emptyToNull(form.remark),
  }
}

export function customsReceiptPayload(form: CustomsReceiptFormState): CustomsReceiptRegisterPayload {
  return {
    customs_declaration_no: form.customs_declaration_no.trim(),
    customs_receipt_no: form.customs_receipt_no.trim(),
    received_at: form.received_at,
    remark: emptyToNull(form.remark),
  }
}

export function verificationRegisterPayload(form: VerificationRegisterFormState): VerificationRegisterPayload {
  return {
    verified_at: form.verified_at,
    remark: emptyToNull(form.remark),
  }
}

export function taxRefundPayload(form: TaxRefundFormState): TaxRefundRegisterPayload {
  return {
    refunded_at: form.refunded_at,
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    bank_receipt_no: emptyToNull(form.bank_receipt_no),
    remark: emptyToNull(form.remark),
  }
}

export function verificationDocumentStatusLabel(value: string): string {
  return optionLabel(verificationDocumentStatusOptions, value)
}

export function verificationDocumentStatusTag(value: string): ReactNode {
  const color =
    value === 'refunded'
      ? 'success'
      : value === 'verified'
        ? 'processing'
        : value === 'customs_receipt_registered'
          ? 'warning'
          : 'default'
  return <Tag color={color}>{verificationDocumentStatusLabel(value)}</Tag>
}

export function verificationReminderStatusLabel(value: string): string {
  return optionLabel(verificationReminderStatusOptions, value)
}

export function verificationReminderStatusTag(value: string): ReactNode {
  const color = value === 'done' ? 'success' : value === 'overdue' ? 'error' : 'default'
  return <Tag color={color}>{verificationReminderStatusLabel(value)}</Tag>
}
