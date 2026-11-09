import { request } from './core'
import type { ApprovalSubmitPayload } from './system'

export interface SampleRequestLine {
  id: string
  sample_request_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  quantity: string
  unit: string
  requirement: string | null
}

export interface SampleProgress {
  id: string
  sample_request_id: string
  stage: string
  status: string
  occurred_at: string
  note: string | null
  handler_name: string | null
}

export interface SampleFee {
  id: string
  sample_request_id: string
  fee_type: string
  amount: string
  currency: string
  payee_type: string
  payee_name: string
  remark: string | null
  payment_status: string
  payment_request_no: string | null
  finance_invoice_no: string | null
  finance_payment_request_id: string | null
}

export interface SampleRequest {
  id: string
  code: string
  request_date: string
  customer_id: string | null
  customer_name: string
  product_id: string | null
  product_code: string | null
  product_name: string | null
  supplier_id: string | null
  supplier_name: string | null
  sales_user_id: string | null
  sales_user_name: string | null
  destination: string
  requirements: string
  due_date: string | null
  status: string
  owner_user_id: string
  lines: SampleRequestLine[]
  progress_events: SampleProgress[]
  fees: SampleFee[]
}

export interface SampleRequestListSummary {
  in_progress_count: number
}

export interface SampleRequestList {
  items: SampleRequest[]
  total: number
  summary: SampleRequestListSummary
}

export interface SampleRequestLinePayload {
  product_id?: string | null
  product_code?: string | null
  product_name: string
  specification?: string | null
  quantity: string
  unit: string
  requirement?: string | null
}

export interface SampleRequestCreatePayload {
  request_date: string
  customer_id?: string | null
  customer_name: string
  product_id?: string | null
  product_code?: string | null
  product_name?: string | null
  supplier_id?: string | null
  supplier_name?: string | null
  sales_user_id?: string | null
  sales_user_name?: string | null
  destination: string
  requirements: string
  due_date?: string | null
  status: string
  lines: SampleRequestLinePayload[]
}

export interface SampleProgressPayload {
  stage: string
  status: string
  occurred_at: string
  note?: string | null
  handler_name?: string | null
}

export interface SampleFeePayload {
  fee_type: string
  amount: string
  currency: string
  payee_type: string
  payee_name: string
  remark?: string | null
}

export interface SampleRecordImage {
  id: string
  sample_record_id: string
  file_id: string
  filename: string
  url: string
  caption: string | null
  is_primary: boolean
}

export interface SampleRecordStockSummary {
  sample_record_id: string
  received_quantity: string
  delivered_quantity: string
  retained_quantity: string
  unit: string
}

export interface SampleRecordStockEvent {
  id: string
  sample_record_id: string
  event_type: string
  quantity: string
  unit: string
  occurred_at: string
  delivery_no: string | null
  recipient: string | null
  note: string | null
}

export interface SampleRecordFollowupEvent {
  id: string
  sample_record_id: string
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  node_code: string
  node_label: string
  actual_date: string
  event_type: string
}

export interface SampleRecord {
  id: string
  code: string
  sample_type: string
  status: string
  product_id: string | null
  product_code: string | null
  product_name: string
  customer_id: string | null
  customer_name: string | null
  supplier_id: string | null
  supplier_name: string | null
  customer_sku: string | null
  supplier_sku: string | null
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  source_type: string | null
  source_id: string | null
  source_code: string | null
  source_note: string | null
  received_at: string
  submitted_at: string | null
  quantity: string
  unit: string
  description: string | null
  owner_user_id: string
  images: SampleRecordImage[]
  stock_summary: SampleRecordStockSummary
  stock_events: SampleRecordStockEvent[]
  followup_events: SampleRecordFollowupEvent[]
}

export interface SampleRecordListSummary {
  total: number
  confirm_sample_count: number
}

export interface SampleRecordList {
  items: SampleRecord[]
  total: number
  summary?: SampleRecordListSummary
}

export interface SampleRequestToRecordPayload {
  sample_type: string
  status: string
  received_at: string
  submitted_at?: string | null
  quantity: string
  unit: string
  customer_sku?: string | null
  supplier_sku?: string | null
  purchase_contract_id?: string | null
  purchase_contract_no?: string | null
  description?: string | null
  images: SampleRecordImagePayload[]
}

export interface SampleRecordImagePayload {
  file_id: string
  filename: string
  url: string
  caption?: string | null
  is_primary: boolean
}

export interface SampleRecordCreatePayload {
  sample_type: string
  status: string
  product_id?: string | null
  product_code?: string | null
  product_name: string
  customer_id?: string | null
  customer_name?: string | null
  supplier_id?: string | null
  supplier_name?: string | null
  customer_sku?: string | null
  supplier_sku?: string | null
  purchase_contract_id?: string | null
  purchase_contract_no?: string | null
  source_type?: string | null
  source_id?: string | null
  source_code?: string | null
  source_note?: string | null
  received_at: string
  submitted_at?: string | null
  quantity: string
  unit: string
  description?: string | null
  images: SampleRecordImagePayload[]
}

export interface SampleRecordStockEventPayload {
  event_type: string
  quantity: string
  unit: string
  occurred_at: string
  delivery_no?: string | null
  recipient?: string | null
  note?: string | null
}

export interface SampleRecordImportPayload {
  records: SampleRecordCreatePayload[]
}

export interface SampleRecordImportResult {
  created_count: number
  records: SampleRecord[]
}

export interface CsvExportResult {
  filename: string
  content_type: string
  content: string
  total: number
}

export interface SampleDeliveryLine {
  id: string
  delivery_id: string
  sample_record_id: string
  sample_code: string | null
  sample_type: string
  product_id: string | null
  product_code: string | null
  product_name: string
  quantity: string
  unit: string
  remark: string | null
}

export interface SampleDeliveryFee {
  id: string
  delivery_id: string
  fee_type: string
  amount: string
  currency: string
  payer_type: string
  remark: string | null
}

export interface SampleDelivery {
  id: string
  code: string
  delivery_date: string
  customer_id: string | null
  customer_name: string
  supplier_id: string | null
  supplier_name: string | null
  factory_id: string | null
  factory_name: string | null
  recipient_name: string
  recipient_company: string | null
  recipient_address: string
  express_company: string
  tracking_no: string | null
  quote_id: string | null
  quote_no: string | null
  remark: string | null
  status: string
  submitted_at: string | null
  approved_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  owner_user_id: string
  lines: SampleDeliveryLine[]
  fees: SampleDeliveryFee[]
  fee_total: string
}

export interface SampleDeliveryListSummary {
  total: number
  pending_count: number
  approved_count: number
}

export interface SampleDeliveryList {
  items: SampleDelivery[]
  total: number
  summary?: SampleDeliveryListSummary
}

export interface SampleDeliveryLinePayload {
  sample_record_id: string
  sample_code?: string | null
  sample_type: string
  product_id?: string | null
  product_code?: string | null
  product_name: string
  quantity: string
  unit: string
  remark?: string | null
}

export interface SampleDeliveryFeePayload {
  fee_type: string
  amount: string
  currency: string
  payer_type: string
  remark?: string | null
}

export interface SampleDeliveryCreatePayload {
  delivery_date: string
  customer_id?: string | null
  customer_name: string
  supplier_id?: string | null
  supplier_name?: string | null
  factory_id?: string | null
  factory_name?: string | null
  recipient_name: string
  recipient_company?: string | null
  recipient_address: string
  express_company: string
  tracking_no?: string | null
  quote_id?: string | null
  quote_no?: string | null
  remark?: string | null
  lines: SampleDeliveryLinePayload[]
  fees: SampleDeliveryFeePayload[]
}

export interface SampleDeliveryApprovePayload {
  reviewer_name?: string
  approved_at: string
}

export interface SampleDeliveryRejectPayload {
  rejected_at: string
  rejection_reason: string
}

export interface SampleDeliveryTrackingPayload {
  express_company: string
  tracking_no: string
  status: string
}

export interface SampleDeliveryFeeStatistic {
  customer_id: string | null
  customer_name: string
  express_company: string
  currency: string
  total_amount: string
  delivery_count: number
}

export interface SampleDeliveryFeeStatistics {
  items: SampleDeliveryFeeStatistic[]
  total_amount: string
  currency: string
}

export interface SampleDeliveryStatusStatistic {
  status: string
  delivery_count: number
  total_quantity: string
}

export interface SampleDeliveryCustomerStatistic {
  customer_id: string | null
  customer_name: string
  delivery_count: number
  total_quantity: string
}

export interface SampleDeliveryExpressStatistic {
  express_company: string
  delivery_count: number
  total_quantity: string
}

export interface SampleDeliveryStatistics {
  total_deliveries: number
  total_quantity: string
  by_status: SampleDeliveryStatusStatistic[]
  by_customer: SampleDeliveryCustomerStatistic[]
  by_express: SampleDeliveryExpressStatistic[]
}

export function listSampleRequests(filters: {
  q?: string
  status?: string
  customer_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
} = {}): Promise<SampleRequestList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleRequestList>(`/sample/requests${suffix}`)
}

export function createSampleRequest(
  payload: SampleRequestCreatePayload,
): Promise<SampleRequest> {
  return request<SampleRequest>('/sample/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addSampleProgress(
  requestId: string,
  payload: SampleProgressPayload,
): Promise<SampleProgress> {
  return request<SampleProgress>(`/sample/requests/${requestId}/progress`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addSampleFee(requestId: string, payload: SampleFeePayload): Promise<SampleFee> {
  return request<SampleFee>(`/sample/requests/${requestId}/fees`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function requestSampleFeePayment(
  requestId: string,
  feeId: string,
  payload: ApprovalSubmitPayload,
): Promise<SampleFee> {
  return request<SampleFee>(`/sample/requests/${requestId}/fees/${feeId}/payment-request`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createSampleRecordFromRequest(
  requestId: string,
  payload: SampleRequestToRecordPayload,
): Promise<SampleRecord> {
  return request<SampleRecord>(`/sample/requests/${requestId}/sample-record`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listSampleRecords(filters: {
  q?: string
  sample_type?: string
  customer_id?: string
  purchase_contract_id?: string
  limit?: number
  offset?: number
} = {}): Promise<SampleRecordList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.sample_type) params.set('sample_type', filters.sample_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.purchase_contract_id) {
    params.set('purchase_contract_id', filters.purchase_contract_id)
  }
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleRecordList>(`/sample/records${suffix}`)
}

export function createSampleRecord(
  payload: SampleRecordCreatePayload,
): Promise<SampleRecord> {
  return request<SampleRecord>('/sample/records', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addSampleRecordImage(
  recordId: string,
  payload: SampleRecordImagePayload,
): Promise<SampleRecordImage> {
  return request<SampleRecordImage>(`/sample/records/${recordId}/images`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addSampleRecordStockEvent(
  recordId: string,
  payload: SampleRecordStockEventPayload,
): Promise<SampleRecordStockEvent> {
  return request<SampleRecordStockEvent>(`/sample/records/${recordId}/stock-events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function importSampleRecords(
  payload: SampleRecordImportPayload,
): Promise<SampleRecordImportResult> {
  return request<SampleRecordImportResult>('/sample/records/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function exportSampleRecords(filters: {
  q?: string
  sample_type?: string
  customer_id?: string
  purchase_contract_id?: string
} = {}): Promise<CsvExportResult> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.sample_type) params.set('sample_type', filters.sample_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.purchase_contract_id) params.set('purchase_contract_id', filters.purchase_contract_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<CsvExportResult>(`/sample/records/export${suffix}`)
}

export function listSampleDeliveries(filters: {
  q?: string
  status?: string
  customer_id?: string
  express_company?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
} = {}): Promise<SampleDeliveryList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.express_company) params.set('express_company', filters.express_company)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleDeliveryList>(`/sample/deliveries${suffix}`)
}

export function createSampleDelivery(
  payload: SampleDeliveryCreatePayload,
): Promise<SampleDelivery> {
  return request<SampleDelivery>('/sample/deliveries', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSampleDelivery(
  deliveryId: string,
  payload: SampleDeliveryCreatePayload,
): Promise<SampleDelivery> {
  return request<SampleDelivery>(`/sample/deliveries/${deliveryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function submitSampleDelivery(
  deliveryId: string,
  payload: ApprovalSubmitPayload,
): Promise<SampleDelivery> {
  return request<SampleDelivery>(`/sample/deliveries/${deliveryId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveSampleDelivery(
  deliveryId: string,
  payload: SampleDeliveryApprovePayload,
): Promise<SampleDelivery> {
  return request<SampleDelivery>(`/sample/deliveries/${deliveryId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function rejectSampleDelivery(
  deliveryId: string,
  payload: SampleDeliveryRejectPayload,
): Promise<SampleDelivery> {
  return request<SampleDelivery>(`/sample/deliveries/${deliveryId}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function withdrawSampleDelivery(deliveryId: string): Promise<SampleDelivery> {
  return request<SampleDelivery>(`/sample/deliveries/${deliveryId}/withdraw`, {
    method: 'POST',
  })
}

export function updateSampleDeliveryTracking(
  deliveryId: string,
  payload: SampleDeliveryTrackingPayload,
): Promise<SampleDelivery> {
  return request<SampleDelivery>(`/sample/deliveries/${deliveryId}/tracking`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getSampleDeliveryFeeStatistics(filters: {
  customer_id?: string
  date_from?: string
  date_to?: string
  express_company?: string
} = {}): Promise<SampleDeliveryFeeStatistics> {
  const params = new URLSearchParams()
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.express_company) params.set('express_company', filters.express_company)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleDeliveryFeeStatistics>(`/sample/deliveries/fee-statistics${suffix}`)
}

export function getSampleDeliveryStatistics(filters: {
  customer_id?: string
  date_from?: string
  date_to?: string
  express_company?: string
} = {}): Promise<SampleDeliveryStatistics> {
  const params = new URLSearchParams()
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.express_company) params.set('express_company', filters.express_company)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleDeliveryStatistics>(`/sample/deliveries/statistics${suffix}`)
}

export function exportSampleDeliveries(filters: {
  customer_id?: string
  date_from?: string
  date_to?: string
  express_company?: string
} = {}): Promise<CsvExportResult> {
  const params = new URLSearchParams()
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.express_company) params.set('express_company', filters.express_company)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<CsvExportResult>(`/sample/deliveries/export${suffix}`)
}

export function getSampleDeliverySampleHistory(
  sampleRecordId: string,
): Promise<SampleDeliveryList> {
  return request<SampleDeliveryList>(`/sample/deliveries/history/sample/${sampleRecordId}`)
}

export function getSampleDeliveryQuoteHistory(filters: {
  customer_id?: string
  product_id?: string
} = {}): Promise<SampleDeliveryList> {
  const params = new URLSearchParams()
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleDeliveryList>(`/sample/deliveries/quote-history${suffix}`)
}
