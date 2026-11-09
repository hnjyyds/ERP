import type {
  SampleDelivery,
  SampleDeliveryApprovePayload,
  SampleDeliveryCreatePayload,
  SampleDeliveryFeeStatistics,
  SampleDeliveryStatistics,
  SampleDeliveryTrackingPayload,
} from '@/api'
import { t } from '@/app/appI18n'
import {
  sampleDeliveryStatusOptions,
  sampleDeliveryFeeTypeOptions,
  sampleDeliveryPayerTypeOptions,
  sampleRecordTypeOptions,
} from '@/shared/formOptions'
import { todayInputValue, emptyToNull } from '@/app/pages/appHelpers'

export function sampleDeliveryFeeTypeLabel(value: string): string {
  const option = sampleDeliveryFeeTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function sampleRecordTypeLabel(value: string): string {
  const option = sampleRecordTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function sampleDeliveryStatusLabel(value: string): string {
  const option = sampleDeliveryStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function sampleDeliveryPayerTypeLabel(value: string): string {
  const option = sampleDeliveryPayerTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export type SampleDeliveryFormState = {
  code: string
  delivery_date: string
  customer_id: string
  customer_name: string
  supplier_id: string
  supplier_name: string
  factory_id: string
  factory_name: string
  recipient_name: string
  recipient_company: string
  recipient_address: string
  express_company: string
  tracking_no: string
  quote_id: string
  quote_no: string
  remark: string
  sample_record_id: string
  sample_code: string
  sample_type: string
  product_id: string
  product_code: string
  product_name: string
  quantity: string
  unit: string
  line_remark: string
  fee_type: string
  fee_amount: string
  fee_currency: string
  fee_payer_type: string
  fee_remark: string
}

export type SampleDeliveryApproveFormState = {
  reviewer_name: string
  approved_at: string
}

export type SampleDeliveryTrackingFormState = {
  express_company: string
  tracking_no: string
  status: string
}

export function initialSampleDeliveryFeeStatistics(): SampleDeliveryFeeStatistics {
  return {
    items: [],
    total_amount: '0.00',
    currency: 'USD',
  }
}

export function initialSampleDeliveryStatistics(): SampleDeliveryStatistics {
  return {
    total_deliveries: 0,
    total_quantity: '0.00',
    by_status: [],
    by_customer: [],
    by_express: [],
  }
}

export function initialSampleDeliveryForm(): SampleDeliveryFormState {
  return {
    code: '',
    delivery_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    supplier_id: '',
    supplier_name: '',
    factory_id: '',
    factory_name: '',
    recipient_name: '',
    recipient_company: '',
    recipient_address: '',
    express_company: 'DHL',
    tracking_no: '',
    quote_id: '',
    quote_no: '',
    remark: '',
    sample_record_id: '',
    sample_code: '',
    sample_type: 'confirm_sample',
    product_id: '',
    product_code: '',
    product_name: '',
    quantity: '1',
    unit: 'pcs',
    line_remark: '',
    fee_type: 'express',
    fee_amount: '0.00',
    fee_currency: 'USD',
    fee_payer_type: 'company',
    fee_remark: '',
  }
}

export function initialSampleDeliveryApproveForm(): SampleDeliveryApproveFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
  }
}

export function initialSampleDeliveryTrackingForm(): SampleDeliveryTrackingFormState {
  return {
    express_company: 'DHL',
    tracking_no: '',
    status: 'shipped',
  }
}

export function sampleDeliveryToForm(delivery: SampleDelivery): SampleDeliveryFormState {
  const line = delivery.lines[0]
  const fee = delivery.fees[0]
  return {
    code: delivery.code,
    delivery_date: delivery.delivery_date,
    customer_id: delivery.customer_id ?? '',
    customer_name: delivery.customer_name,
    supplier_id: delivery.supplier_id ?? '',
    supplier_name: delivery.supplier_name ?? '',
    factory_id: delivery.factory_id ?? '',
    factory_name: delivery.factory_name ?? '',
    recipient_name: delivery.recipient_name,
    recipient_company: delivery.recipient_company ?? '',
    recipient_address: delivery.recipient_address,
    express_company: delivery.express_company,
    tracking_no: delivery.tracking_no ?? '',
    quote_id: delivery.quote_id ?? '',
    quote_no: delivery.quote_no ?? '',
    remark: delivery.remark ?? '',
    sample_record_id: line?.sample_record_id ?? '',
    sample_code: line?.sample_code ?? '',
    sample_type: line?.sample_type ?? 'confirm_sample',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
    line_remark: line?.remark ?? '',
    fee_type: fee?.fee_type ?? 'express',
    fee_amount: fee?.amount ?? '0.00',
    fee_currency: fee?.currency ?? 'USD',
    fee_payer_type: fee?.payer_type ?? 'company',
    fee_remark: fee?.remark ?? '',
  }
}

export function sampleDeliveryPayload(form: SampleDeliveryFormState): SampleDeliveryCreatePayload {
  return {
    delivery_date: form.delivery_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: emptyToNull(form.supplier_name),
    factory_id: emptyToNull(form.factory_id),
    factory_name: emptyToNull(form.factory_name),
    recipient_name: form.recipient_name.trim(),
    recipient_company: emptyToNull(form.recipient_company),
    recipient_address: form.recipient_address.trim(),
    express_company: form.express_company.trim(),
    tracking_no: emptyToNull(form.tracking_no),
    quote_id: emptyToNull(form.quote_id),
    quote_no: emptyToNull(form.quote_no),
    remark: emptyToNull(form.remark),
    lines: [
      {
        sample_record_id: form.sample_record_id.trim(),
        sample_code: emptyToNull(form.sample_code),
        sample_type: form.sample_type,
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        quantity: form.quantity,
        unit: form.unit.trim(),
        remark: emptyToNull(form.line_remark),
      },
    ],
    fees: [
      {
        fee_type: form.fee_type,
        amount: form.fee_amount,
        currency: form.fee_currency.trim(),
        payer_type: form.fee_payer_type,
        remark: emptyToNull(form.fee_remark),
      },
    ],
  }
}

export function sampleDeliveryApprovePayload(
  form: SampleDeliveryApproveFormState,
): SampleDeliveryApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

export function sampleDeliveryTrackingPayload(
  form: SampleDeliveryTrackingFormState,
): SampleDeliveryTrackingPayload {
  return {
    express_company: form.express_company.trim(),
    tracking_no: form.tracking_no.trim(),
    status: form.status,
  }
}
