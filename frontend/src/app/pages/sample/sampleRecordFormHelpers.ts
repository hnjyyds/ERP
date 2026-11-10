import type {
  SampleRecordCreatePayload,
  SampleRecordImagePayload,
  SampleRequest,
  SampleRequestToRecordPayload,
} from '@/api'
import { emptyToNull, todayInputValue } from '@/app/pages/appHelpers'

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

function _sampleRecordFormFromRequest(
  request: SampleRequest,
  current: SampleRecordFormState,
): SampleRecordFormState {
  const line = request.lines[0]
  return {
    ...current,
    code: `SM-${request.code}`,
    sample_type: 'confirm_sample',
    status: 'registered',
    quantity: line?.quantity ?? current.quantity,
    received_at: todayInputValue(),
    submitted_at: todayInputValue(),
    product_id: line?.product_id ?? request.product_id ?? current.product_id,
    product_code: line?.product_code ?? request.product_code ?? current.product_code,
    product_name: line?.product_name ?? request.product_name ?? current.product_name,
    customer_id: request.customer_id ?? current.customer_id,
    customer_name: request.customer_name,
    supplier_id: request.supplier_id ?? current.supplier_id,
    supplier_name: request.supplier_name ?? current.supplier_name,
    unit: line?.unit ?? current.unit,
    source_type: 'sample_request',
    source_id: request.id,
    source_code: request.code,
    source_note: request.requirements,
    description: line?.requirement ?? request.requirements,
  }
}

function _sampleRequestToRecordPayload(form: SampleRecordFormState): SampleRequestToRecordPayload {
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

export function sampleRecordPayload(form: SampleRecordFormState): SampleRecordCreatePayload {
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
    product_id: emptyToNull(form.product_id),
    product_code: emptyToNull(form.product_code),
    product_name: form.product_name.trim(),
    customer_id: emptyToNull(form.customer_id),
    customer_name: emptyToNull(form.customer_name),
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: emptyToNull(form.supplier_name),
    customer_sku: emptyToNull(form.customer_sku),
    supplier_sku: emptyToNull(form.supplier_sku),
    purchase_contract_id: emptyToNull(form.purchase_contract_id),
    purchase_contract_no: emptyToNull(form.purchase_contract_no),
    source_type: emptyToNull(form.source_type),
    source_id: emptyToNull(form.source_id),
    source_code: emptyToNull(form.source_code),
    source_note: emptyToNull(form.source_note),
    received_at: form.received_at,
    submitted_at: emptyToNull(form.submitted_at),
    quantity: form.quantity,
    unit: form.unit.trim(),
    description: emptyToNull(form.description),
    images,
  }
}
