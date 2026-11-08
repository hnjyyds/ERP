import { request } from './core'

// ---- 口岸数据导入 (port data import) ----

export interface CustomsDeclarationRecord {
  id: string
  batch_id: string
  declaration_no: string
  customs_receipt_no: string | null
  trade_type: string
  export_contract_no: string | null
  customs_date: string | null
  product_name: string
  hs_code: string | null
  quantity: string | null
  unit: string | null
  amount: string
  currency: string
  customer_or_supplier: string | null
  match_status: string
  verification_document_id: string | null
  verification_document_no: string | null
}

export interface CustomsDeclarationRecordList {
  items: CustomsDeclarationRecord[]
  total: number
}

export interface PortImportBatch {
  id: string
  batch_no: string
  source: string
  imported_at: string
  record_count: number
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  records: CustomsDeclarationRecord[]
}

export interface PortImportBatchList {
  items: PortImportBatch[]
  total: number
}

export interface CustomsDeclarationRecordCreatePayload {
  declaration_no: string
  customs_receipt_no?: string | null
  trade_type: string
  export_contract_no?: string | null
  customs_date?: string | null
  product_name: string
  hs_code?: string | null
  quantity?: string | null
  unit?: string | null
  amount: string
  currency: string
  customer_or_supplier?: string | null
}

export interface PortImportBatchCreatePayload {
  batch_no: string
  source: string
  imported_at: string
  record_count: number
  remark?: string | null
  records: CustomsDeclarationRecordCreatePayload[]
}

// ---- 口岸数据导入 API ----

export function listPortImportBatches(filters: {
  source?: string
  status?: string
  limit?: number
  offset?: number
} = {}): Promise<PortImportBatchList> {
  const params = new URLSearchParams()
  if (filters.source) params.set('source', filters.source)
  if (filters.status) params.set('status', filters.status)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PortImportBatchList>(`/finance/port-import-batches${suffix}`)
}

export function createPortImportBatch(
  payload: PortImportBatchCreatePayload,
): Promise<PortImportBatch> {
  return request<PortImportBatch>('/finance/port-import-batches', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listCustomsDeclarationRecords(filters: {
  declaration_no?: string
  customs_receipt_no?: string
  trade_type?: string
  batch_id?: string
  limit?: number
  offset?: number
} = {}): Promise<CustomsDeclarationRecordList> {
  const params = new URLSearchParams()
  if (filters.declaration_no) params.set('declaration_no', filters.declaration_no)
  if (filters.customs_receipt_no) params.set('customs_receipt_no', filters.customs_receipt_no)
  if (filters.trade_type) params.set('trade_type', filters.trade_type)
  if (filters.batch_id) params.set('batch_id', filters.batch_id)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<CustomsDeclarationRecordList>(`/finance/customs-declaration-records${suffix}`)
}
