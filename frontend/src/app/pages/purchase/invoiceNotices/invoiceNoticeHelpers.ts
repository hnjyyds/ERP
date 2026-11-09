// 开票通知：表单状态、payload 映射与状态文案

import type {
  PurchaseInvoiceNoticeGeneratePayload,
  PurchaseInvoiceNoticeLinePayload,
  PurchaseInvoiceNoticeReceivePayload,
  PurchaseInvoiceNoticeSendPayload,
} from '@/api'
import { t } from '@/app/appI18n'
import { emptyToNull, todayInputValue } from '@/app/pages/appHelpers'
import { purchaseInvoiceNoticeStatusOptions } from '@/shared/formOptions'

export type PurchaseInvoiceNoticeFormState = {
  customs_declaration_id: string
  customs_declaration_no: string
  declaration_date: string
  notice_date: string
  currency: string
  remarks: string
  supplier_id_a: string
  supplier_name_a: string
  purchase_contract_id_a: string
  purchase_contract_no_a: string
  product_id_a: string
  product_code_a: string
  product_name_a: string
  customs_name_a: string
  invoice_name_a: string
  quantity_a: string
  unit_a: string
  amount_a: string
  remark_a: string
  supplier_id_b: string
  supplier_name_b: string
  purchase_contract_id_b: string
  purchase_contract_no_b: string
  product_id_b: string
  product_code_b: string
  product_name_b: string
  customs_name_b: string
  invoice_name_b: string
  quantity_b: string
  unit_b: string
  amount_b: string
  remark_b: string
}

export type PurchaseInvoiceNoticeSendFormState = {
  sender_name: string
  sent_at: string
}

export type PurchaseInvoiceNoticeReceiveFormState = {
  tax_invoice_no: string
  received_at: string
}

export function initialPurchaseInvoiceNoticeForm(): PurchaseInvoiceNoticeFormState {
  return {
    customs_declaration_id: crypto.randomUUID(),
    customs_declaration_no: '',
    declaration_date: todayInputValue(),
    notice_date: todayInputValue(),
    currency: 'CNY',
    remarks: '',
    supplier_id_a: 'supplier-pack-a',
    supplier_name_a: '',
    purchase_contract_id_a: 'pc-pack-a',
    purchase_contract_no_a: 'PC-2026-PACK-A',
    product_id_a: 'product-bag',
    product_code_a: 'BAG-40',
    product_name_a: 'Eco Shopping Bag',
    customs_name_a: '',
    invoice_name_a: '',
    quantity_a: '1000',
    unit_a: 'pcs',
    amount_a: '5200.00',
    remark_a: '',
    supplier_id_b: 'supplier-label-a',
    supplier_name_b: '',
    purchase_contract_id_b: 'pc-label-a',
    purchase_contract_no_b: 'PC-2026-LABEL-A',
    product_id_b: 'product-label',
    product_code_b: 'LABEL-01',
    product_name_b: 'Hang Tag',
    customs_name_b: '',
    invoice_name_b: '',
    quantity_b: '450',
    unit_b: 'pcs',
    amount_b: '360.00',
    remark_b: '',
  }
}

export function initialPurchaseInvoiceNoticeSendForm(): PurchaseInvoiceNoticeSendFormState {
  return {
    sender_name: '',
    sent_at: todayInputValue(),
  }
}

export function initialPurchaseInvoiceNoticeReceiveForm(): PurchaseInvoiceNoticeReceiveFormState {
  return {
    tax_invoice_no: 'VAT-2026-001',
    received_at: todayInputValue(),
  }
}

export function purchaseInvoiceNoticeGeneratePayload(
  form: PurchaseInvoiceNoticeFormState,
): PurchaseInvoiceNoticeGeneratePayload {
  return {
    customs_declaration_id: emptyToNull(form.customs_declaration_id),
    customs_declaration_no: form.customs_declaration_no.trim(),
    declaration_date: form.declaration_date,
    notice_date: form.notice_date,
    currency: form.currency.trim(),
    remarks: emptyToNull(form.remarks),
    lines: purchaseInvoiceNoticeLinePayloads(form),
  }
}

export function purchaseInvoiceNoticeLinePayloads(
  form: PurchaseInvoiceNoticeFormState,
): PurchaseInvoiceNoticeLinePayload[] {
  const candidates: PurchaseInvoiceNoticeLinePayload[] = [
    {
      supplier_id: emptyToNull(form.supplier_id_a),
      supplier_name: form.supplier_name_a.trim(),
      purchase_contract_id: emptyToNull(form.purchase_contract_id_a),
      purchase_contract_no: emptyToNull(form.purchase_contract_no_a),
      product_id: emptyToNull(form.product_id_a),
      product_code: emptyToNull(form.product_code_a),
      product_name: form.product_name_a.trim(),
      customs_name: form.customs_name_a.trim(),
      invoice_name: form.invoice_name_a.trim(),
      quantity: form.quantity_a,
      unit: form.unit_a.trim(),
      amount: form.amount_a,
      remark: emptyToNull(form.remark_a),
    },
    {
      supplier_id: emptyToNull(form.supplier_id_b),
      supplier_name: form.supplier_name_b.trim(),
      purchase_contract_id: emptyToNull(form.purchase_contract_id_b),
      purchase_contract_no: emptyToNull(form.purchase_contract_no_b),
      product_id: emptyToNull(form.product_id_b),
      product_code: emptyToNull(form.product_code_b),
      product_name: form.product_name_b.trim(),
      customs_name: form.customs_name_b.trim(),
      invoice_name: form.invoice_name_b.trim(),
      quantity: form.quantity_b,
      unit: form.unit_b.trim(),
      amount: form.amount_b,
      remark: emptyToNull(form.remark_b),
    },
  ]

  return candidates.filter(
    (line) =>
      line.supplier_name &&
      line.product_name &&
      line.customs_name &&
      line.invoice_name &&
      line.quantity &&
      line.unit,
  )
}

export function purchaseInvoiceNoticeSendPayload(
  form: PurchaseInvoiceNoticeSendFormState,
): PurchaseInvoiceNoticeSendPayload {
  return {
    sender_name: form.sender_name.trim(),
    sent_at: form.sent_at,
  }
}

export function purchaseInvoiceNoticeReceivePayload(
  form: PurchaseInvoiceNoticeReceiveFormState,
): PurchaseInvoiceNoticeReceivePayload {
  return {
    tax_invoice_no: form.tax_invoice_no.trim(),
    received_at: form.received_at,
  }
}

export function purchaseInvoiceNoticeStatusLabel(value: string): string {
  const option = purchaseInvoiceNoticeStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function purchaseInvoiceReminderStatusLabel(value: string): string {
  if (value === 'open') return t('purchase.invoiceNotice.detail.reminderStatusOpen')
  if (value === 'done') return t('purchase.invoiceNotice.detail.reminderStatusDone')
  return value
}
