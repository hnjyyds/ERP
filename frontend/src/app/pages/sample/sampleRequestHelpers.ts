import type {
  SampleRequest,
  SampleRequestCreatePayload,
  SampleRequestLinePayload,
  SampleRequestToRecordPayload,
  SampleRecordImagePayload,
  SampleFeePayload,
  SampleProgressPayload,
} from '@/api'
import { t } from '@/app/appI18n'
import { emptyToNull, todayInputValue } from '@/app/pages/appHelpers'
import {
  sampleDestinationOptions,
  sampleFeeTypeOptions,
  sampleProgressStageOptions,
  sampleStatusOptions,
} from '@/shared/formOptions'

export type SampleRecordFormState = {
  code: string
  sample_type: string
  status: string
  quantity: string
  received_at: string
  submitted_at: string
  product_id: string
  product_code: string
  product_name: string
  customer_id: string
  customer_name: string
  supplier_id: string
  supplier_name: string
  customer_sku: string
  supplier_sku: string
  purchase_contract_id: string
  purchase_contract_no: string
  unit: string
  source_type: string
  source_id: string
  source_code: string
  source_note: string
  description: string
  image_file_id: string
  image_filename: string
  image_url: string
  image_caption: string
}

export function sampleRecordFormFromRequest(
  request: SampleRequest,
  current: SampleRecordFormState,
): SampleRecordFormState {
  const line = request.lines[0]
  return {
    ...current,
    code: '',
    sample_type: 'confirm_sample',
    product_id: line?.product_id ?? current.product_id,
    product_code: line?.product_code ?? current.product_code,
    product_name: line?.product_name ?? current.product_name,
    customer_id: request.customer_id ?? current.customer_id,
    customer_name: request.customer_name ?? current.customer_name,
    supplier_id: request.supplier_id ?? current.supplier_id,
    supplier_name: request.supplier_name ?? current.supplier_name,
    source_type: 'sample_request',
    source_id: request.id,
    source_code: request.code,
    source_note: t('sample.request.message.recordSourceNote', { code: request.code }),
  }
}

export function sampleRequestToRecordPayload(
  form: SampleRecordFormState,
): SampleRequestToRecordPayload {
  const images: SampleRecordImagePayload[] = []
  if (form.image_file_id.trim() && form.image_filename.trim() && form.image_url.trim()) {
    images.push({
      file_id: form.image_file_id.trim(),
      filename: form.image_filename.trim(),
      url: form.image_url.trim(),
      caption: emptyToNull(form.image_caption),
      is_primary: true,
    })
  }

  return {
    sample_type: form.sample_type,
    status: form.status,
    received_at: form.received_at,
    submitted_at: emptyToNull(form.submitted_at),
    quantity: form.quantity,
    unit: form.unit.trim(),
    customer_sku: emptyToNull(form.customer_sku),
    supplier_sku: emptyToNull(form.supplier_sku),
    purchase_contract_id: emptyToNull(form.purchase_contract_id),
    purchase_contract_no: emptyToNull(form.purchase_contract_no),
    description: emptyToNull(form.description),
    images,
  }
}

export type SampleRequestFormState = {
  code: string
  status: string
  request_date: string
  due_date: string
  customer_id: string
  customer_name: string
  product_id: string
  product_code: string
  product_name: string
  supplier_id: string
  supplier_name: string
  sales_user_id: string
  sales_user_name: string
  destination: string
  requirements: string
  line_product_id: string
  line_product_code: string
  line_product_name: string
  line_specification: string
  line_quantity: string
  line_unit: string
  line_requirement: string
}

export type SampleProgressFormState = {
  stage: string
  status: string
  occurred_at: string
  handler_name: string
  note: string
}

export type SampleFeeFormState = {
  fee_type: string
  amount: string
  currency: string
  payee_type: string
  payee_name: string
  remark: string
}

export function initialSampleRecordForm(): SampleRecordFormState {
  return {
    code: '',
    sample_type: 'confirm_sample',
    status: 'registered',
    quantity: '1',
    received_at: todayInputValue(),
    submitted_at: todayInputValue(),
    product_id: '',
    product_code: '',
    product_name: '',
    customer_id: '',
    customer_name: '',
    supplier_id: '',
    supplier_name: '',
    customer_sku: '',
    supplier_sku: '',
    purchase_contract_id: '',
    purchase_contract_no: '',
    unit: 'pcs',
    source_type: 'sample_request',
    source_id: '',
    source_code: '',
    source_note: '',
    description: '',
    image_file_id: '',
    image_filename: '',
    image_url: '',
    image_caption: '',
  }
}

export function initialSampleRequestForm(): SampleRequestFormState {
  return {
    code: '',
    status: 'draft',
    request_date: todayInputValue(),
    due_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    product_id: '',
    product_code: '',
    product_name: '',
    supplier_id: '',
    supplier_name: '',
    sales_user_id: '',
    sales_user_name: '',
    destination: 'in_house',
    requirements: '',
    line_product_id: '',
    line_product_code: '',
    line_product_name: '',
    line_specification: '',
    line_quantity: '1',
    line_unit: 'pcs',
    line_requirement: '',
  }
}
export function initialSampleProgressForm(): SampleProgressFormState {
  return {
    stage: 'sent_to_factory',
    status: 'in_progress',
    occurred_at: todayInputValue(),
    handler_name: '',
    note: '',
  }
}

export function initialSampleFeeForm(): SampleFeeFormState {
  return {
    fee_type: 'sample_making',
    amount: '0',
    currency: 'USD',
    payee_type: 'supplier',
    payee_name: '',
    remark: '',
  }
}

export function sampleRequestPayload(form: SampleRequestFormState): SampleRequestCreatePayload {
  const lines: SampleRequestLinePayload[] = []
  if (form.line_product_name.trim()) {
    lines.push({
      product_id: emptyToNull(form.line_product_id),
      product_code: emptyToNull(form.line_product_code),
      product_name: form.line_product_name.trim(),
      specification: emptyToNull(form.line_specification),
      quantity: form.line_quantity,
      unit: form.line_unit.trim(),
      requirement: emptyToNull(form.line_requirement),
    })
  }

  return {
    request_date: form.request_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    product_id: emptyToNull(form.product_id),
    product_code: emptyToNull(form.product_code),
    product_name: emptyToNull(form.product_name),
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: emptyToNull(form.supplier_name),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    destination: form.destination,
    requirements: form.requirements.trim(),
    due_date: emptyToNull(form.due_date),
    status: form.status,
    lines,
  }
}

export function sampleProgressPayload(form: SampleProgressFormState): SampleProgressPayload {
  return {
    stage: form.stage,
    status: form.status,
    occurred_at: form.occurred_at,
    handler_name: emptyToNull(form.handler_name),
    note: emptyToNull(form.note),
  }
}

export function sampleFeePayload(form: SampleFeeFormState): SampleFeePayload {
  return {
    fee_type: form.fee_type,
    amount: form.amount,
    currency: form.currency.trim(),
    payee_type: form.payee_type,
    payee_name: form.payee_name.trim(),
    remark: emptyToNull(form.remark),
  }
}

export function sampleStatusLabel(value: string): string {
  const option = sampleStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function sampleDestinationLabel(value: string): string {
  const option = sampleDestinationOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function sampleProgressStageLabel(value: string): string {
  const option = sampleProgressStageOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function sampleFeeTypeLabel(value: string): string {
  const option = sampleFeeTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function samplePaymentStatusLabel(value: string): string {
  if (value === 'requested') return t('sample.request.paymentStatus.requested')
  if (value === 'paid') return t('sample.request.paymentStatus.paid')
  return t('sample.request.paymentStatus.notRequested')
}
