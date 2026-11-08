import type {
  PurchaseInquiry,
  PurchaseInquiryCreatePayload,
  PurchaseInquiryTemplatePayload,
  SupplierQuotation,
  SupplierQuotationPayload,
} from '@/api'
import { emptyToNull, todayInputValue } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { purchaseInquiryStatusOptions } from '@/shared/formOptions'

export type PurchaseInquiryFormState = {
  code: string
  inquiry_date: string
  buyer_user_id: string
  buyer_user_name: string
  remarks: string
  product_id: string
  product_code: string
  product_name: string
  specification: string
  model: string
  quantity: string
  unit: string
}

export type PurchaseQuotationFormState = {
  supplier_id: string
  supplier_name: string
  quoted_at: string
  unit_price: string
  currency: string
  lead_time_days: string
  min_order_quantity: string
  sample_available: boolean
  remark: string
}

export type PurchaseInquiryTemplateFormState = {
  template_name: string
  recipient_emails: string
}

export function initialPurchaseInquiryForm(): PurchaseInquiryFormState {
  return {
    code: '',
    inquiry_date: todayInputValue(),
    buyer_user_id: 'u-001',
    buyer_user_name: '',
    remarks: '',
    product_id: '',
    product_code: '',
    product_name: '',
    specification: '',
    model: '',
    quantity: '1000',
    unit: 'pcs',
  }
}

export function initialPurchaseQuotationForm(): PurchaseQuotationFormState {
  return {
    supplier_id: '',
    supplier_name: '',
    quoted_at: todayInputValue(),
    unit_price: '0.78',
    currency: 'USD',
    lead_time_days: '18',
    min_order_quantity: '800',
    sample_available: true,
    remark: '',
  }
}

export function initialPurchaseInquiryTemplateForm(): PurchaseInquiryTemplateFormState {
  return {
    template_name: '',
    recipient_emails: 'supplier@example.com',
  }
}

export function purchaseInquiryToForm(inquiry: PurchaseInquiry): PurchaseInquiryFormState {
  const line = inquiry.lines[0]
  return {
    code: inquiry.code,
    inquiry_date: inquiry.inquiry_date,
    buyer_user_id: inquiry.buyer_user_id ?? '',
    buyer_user_name: inquiry.buyer_user_name ?? '',
    remarks: inquiry.remarks ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    specification: line?.specification ?? '',
    model: line?.model ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
  }
}

export function purchaseInquiryPayload(form: PurchaseInquiryFormState): PurchaseInquiryCreatePayload {
  return {
    inquiry_date: form.inquiry_date,
    buyer_user_id: emptyToNull(form.buyer_user_id),
    buyer_user_name: emptyToNull(form.buyer_user_name),
    remarks: emptyToNull(form.remarks),
    lines: [
      {
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        specification: emptyToNull(form.specification),
        model: emptyToNull(form.model),
        quantity: form.quantity,
        unit: form.unit.trim(),
      },
    ],
  }
}

export function purchaseQuotationPayload(
  form: PurchaseQuotationFormState,
  inquiryLineId: string,
): SupplierQuotationPayload {
  const leadTime = Number(form.lead_time_days)
  return {
    inquiry_line_id: inquiryLineId,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    quoted_at: form.quoted_at,
    unit_price: form.unit_price,
    currency: form.currency.trim(),
    lead_time_days: Number.isNaN(leadTime) ? null : leadTime,
    min_order_quantity: emptyToNull(form.min_order_quantity),
    sample_available: form.sample_available,
    remark: emptyToNull(form.remark),
  }
}

export function purchaseInquiryTemplatePayload(
  form: PurchaseInquiryTemplateFormState,
): PurchaseInquiryTemplatePayload {
  return {
    template_name: form.template_name.trim(),
    recipient_emails: form.recipient_emails
      .split(/[,\n;，；]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  }
}

export function purchaseInquiryStatusLabel(value: string): string {
  const option = purchaseInquiryStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function sampleRecordStatusLabel(value: string): string {
  if (value === 'registered') return t('purchase.inquiry.detail.sampleStatusRegistered')
  if (value === 'submitted') return t('purchase.inquiry.detail.sampleStatusSubmitted')
  if (value === 'confirmed') return t('purchase.inquiry.detail.sampleStatusConfirmed')
  if (value === 'archived') return t('purchase.inquiry.detail.sampleStatusArchived')
  return value
}

export function lowestSupplierQuotation(quotations: SupplierQuotation[]): SupplierQuotation | null {
  if (quotations.length === 0) return null
  return quotations.reduce((lowest, item) =>
    Number(item.unit_price) < Number(lowest.unit_price) ? item : lowest,
  )
}
