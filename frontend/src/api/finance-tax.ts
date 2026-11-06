import { request } from './core'

export interface VerificationTaxRefund {
  id: string
  verification_document_id: string
  refund_no: string
  refunded_at: string
  amount: string
  currency: string
  bank_receipt_no: string | null
  remark: string | null
}

export interface VerificationDocument {
  id: string
  document_no: string
  received_at: string
  owner_user_id: string | null
  owner_user_name: string | null
  shipment_plan_id: string | null
  shipment_no: string | null
  customer_name: string | null
  currency: string
  refundable_amount: string
  refunded_amount: string
  unrefunded_amount: string
  valid_until: string
  reminder_date: string
  reminder_status: string
  reminder_message: string
  status: string
  customs_declaration_no: string | null
  customs_receipt_no: string | null
  customs_receipt_at: string | null
  verification_no: string | null
  verified_at: string | null
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  refunds: VerificationTaxRefund[]
}

export interface VerificationDocumentList {
  items: VerificationDocument[]
  total: number
}

export interface VerificationDocumentCreatePayload {
  document_no: string
  received_at: string
  owner_user_id?: string | null
  owner_user_name?: string | null
  shipment_plan_id?: string | null
  shipment_no?: string | null
  customer_name?: string | null
  currency: string
  refundable_amount: string
  valid_until: string
  remark?: string | null
}

export interface CustomsReceiptRegisterPayload {
  customs_declaration_no: string
  customs_receipt_no: string
  received_at: string
  remark?: string | null
}

export interface VerificationRegisterPayload {
  verification_no: string
  verified_at: string
  remark?: string | null
}

export interface TaxRefundRegisterPayload {
  refund_no: string
  refunded_at: string
  amount: string
  currency: string
  bank_receipt_no?: string | null
  remark?: string | null
}

export interface VerificationUsageItem {
  verification_document_id: string
  document_no: string
  shipment_plan_id: string | null
  shipment_no: string | null
  owner_user_id: string | null
  owner_user_name: string | null
  customer_name: string | null
  currency: string
  refundable_amount: string
  refunded_amount: string
  unrefunded_amount: string
  valid_until: string
  reminder_date: string
  reminder_status: string
  status: string
  customs_receipt_no: string | null
  verification_no: string | null
}

export interface VerificationUsageList {
  items: VerificationUsageItem[]
  total: number
  total_refunded_amount: string
}

export interface CustomsReceiptMatchRecord {
  declaration_no: string
  customs_receipt_no: string
  verification_document_id: string
  verification_document_no: string
}

export interface CustomsReceiptAutoMatchResult {
  matched_count: number
  unmatched_count: number
  matched_records: CustomsReceiptMatchRecord[]
}

export function listVerificationDocuments(filters: {
  q?: string
  status?: string
  owner_user_id?: string
  shipment_no?: string
  reminder_status?: string
} = {}): Promise<VerificationDocumentList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.owner_user_id) params.set('owner_user_id', filters.owner_user_id)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  if (filters.reminder_status) params.set('reminder_status', filters.reminder_status)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<VerificationDocumentList>(`/finance/verification-documents${suffix}`)
}

export function createVerificationDocument(
  payload: VerificationDocumentCreatePayload,
): Promise<VerificationDocument> {
  return request<VerificationDocument>('/finance/verification-documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function registerVerificationCustomsReceipt(
  verificationDocumentId: string,
  payload: CustomsReceiptRegisterPayload,
): Promise<VerificationDocument> {
  return request<VerificationDocument>(
    `/finance/verification-documents/${verificationDocumentId}/customs-receipt`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function registerVerification(
  verificationDocumentId: string,
  payload: VerificationRegisterPayload,
): Promise<VerificationDocument> {
  return request<VerificationDocument>(
    `/finance/verification-documents/${verificationDocumentId}/verify`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function registerTaxRefund(
  verificationDocumentId: string,
  payload: TaxRefundRegisterPayload,
): Promise<VerificationDocument> {
  return request<VerificationDocument>(
    `/finance/verification-documents/${verificationDocumentId}/tax-refunds`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function listVerificationUsage(filters: {
  q?: string
  status?: string
  owner_user_id?: string
  shipment_no?: string
  reminder_status?: string
} = {}): Promise<VerificationUsageList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.owner_user_id) params.set('owner_user_id', filters.owner_user_id)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  if (filters.reminder_status) params.set('reminder_status', filters.reminder_status)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<VerificationUsageList>(`/finance/verification-usage${suffix}`)
}

export function autoMatchCustomsReceipts(): Promise<CustomsReceiptAutoMatchResult> {
  return request<CustomsReceiptAutoMatchResult>(
    '/finance/customs-declaration-records/auto-match',
    { method: 'POST' },
  )
}
