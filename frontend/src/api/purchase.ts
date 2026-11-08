import { request } from './core'
import type { ApprovalSubmitPayload } from './system'

export interface PurchaseContractStatistics {
  total_quantity: string
  total_amount: string
  received_quantity: string
  unreceived_quantity: string
  paid_amount: string
  unpaid_amount: string
}

export interface PurchaseContractLine {
  id: string
  contract_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  unit_price: string
  amount: string
  received_quantity: string
  unreceived_quantity: string
  source_export_contract_id: string | null
  source_export_contract_no: string | null
  source_export_contract_line_id: string | null
  remark: string | null
}

export interface PurchaseContractSourceLink {
  id: string
  contract_id: string
  export_contract_id: string
  export_contract_no: string
  export_contract_line_id: string
  customer_name: string
  product_id: string | null
  product_code: string | null
  demand_quantity: string
  unit: string
}

export interface PurchaseContractReminder {
  id: string
  contract_id: string
  reminder_type: string
  title: string
  due_date: string
  amount: string | null
  currency: string
  status: string
}

export interface PurchaseContract {
  id: string
  code: string
  contract_date: string
  supplier_id: string | null
  supplier_name: string
  buyer_user_id: string | null
  buyer_user_name: string | null
  qc_user_id: string | null
  qc_user_name: string | null
  currency: string
  delivery_date: string
  payment_terms: string
  source_type: string
  remarks: string | null
  approval_status: string
  submitted_at: string | null
  approved_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  cancelled_at: string | null
  cancelled_by_id: string | null
  cancelled_by_name: string | null
  cancel_reason: string | null
  reissued_from_id: string | null
  reissued_from_code: string | null
  reissue_reason: string | null
  owner_user_id: string
  statistics: PurchaseContractStatistics
  lines: PurchaseContractLine[]
  source_links: PurchaseContractSourceLink[]
  reminders: PurchaseContractReminder[]
}

export interface PurchaseContractListSummary {
  submitted_count: number
  approved_count: number
  total_amount: string
  currency: string | null
}

export interface PurchaseContractList {
  items: PurchaseContract[]
  total: number
  summary: PurchaseContractListSummary
}

export interface PurchaseContractReminderList {
  items: PurchaseContractReminder[]
  total: number
}

export interface PurchaseContractLinePayload {
  product_id?: string | null
  product_code?: string | null
  product_name: string
  specification?: string | null
  model?: string | null
  quantity: string
  unit: string
  unit_price: string
  source_export_contract_id?: string | null
  source_export_contract_no?: string | null
  source_export_contract_line_id?: string | null
  remark?: string | null
}

export interface PurchaseContractCreatePayload {
  contract_date: string
  supplier_id?: string | null
  supplier_name: string
  buyer_user_id?: string | null
  buyer_user_name?: string | null
  qc_user_id?: string | null
  qc_user_name?: string | null
  currency: string
  delivery_date: string
  payment_terms: string
  source_type: 'export_contract' | 'stock_purchase' | 'manual'
  remarks?: string | null
  lines: PurchaseContractLinePayload[]
}

export interface PurchaseContractGeneratePayload {
  contract_date: string
  supplier_id?: string | null
  supplier_name: string
  buyer_user_id?: string | null
  buyer_user_name?: string | null
  qc_user_id?: string | null
  qc_user_name?: string | null
  currency: string
  delivery_date: string
  payment_terms: string
  unit_price: string
  remarks?: string | null
  sources: Array<{ export_contract_id: string }>
}

export interface PurchaseContractApprovePayload {
  decision: 'approved' | 'rejected'
  reviewer_name?: string
  approved_at: string
  rejection_reason?: string | null
}

export interface PurchaseInvoiceNoticeLine {
  id: string
  notice_id: string
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  product_id: string | null
  product_code: string | null
  product_name: string
  customs_name: string
  invoice_name: string
  quantity: string
  unit: string
  amount: string
  currency: string
  remark: string | null
}

export interface PurchaseInvoiceNoticeReminder {
  id: string
  notice_id: string
  title: string
  due_date: string
  status: string
}

export interface PurchaseInvoiceNotice {
  id: string
  code: string
  notice_date: string
  supplier_id: string | null
  supplier_name: string
  customs_declaration_id: string | null
  customs_declaration_no: string
  declaration_date: string
  currency: string
  remarks: string | null
  status: string
  sent_at: string | null
  sender_name: string | null
  tax_invoice_no: string | null
  tax_invoice_received_at: string | null
  total_quantity: string
  total_amount: string
  owner_user_id: string
  lines: PurchaseInvoiceNoticeLine[]
  reminders: PurchaseInvoiceNoticeReminder[]
}

export interface PurchaseInvoiceNoticeListSummary {
  sent_count: number
  received_count: number
  total_amount: string
  currency: string | null
}

export interface PurchaseInvoiceNoticeList {
  items: PurchaseInvoiceNotice[]
  total: number
  summary: PurchaseInvoiceNoticeListSummary
}

export interface PurchaseInvoiceNoticeReminderList {
  items: PurchaseInvoiceNoticeReminder[]
  total: number
}

export interface PurchaseInvoiceNoticeLinePayload {
  supplier_id?: string | null
  supplier_name: string
  purchase_contract_id?: string | null
  purchase_contract_no?: string | null
  product_id?: string | null
  product_code?: string | null
  product_name: string
  customs_name: string
  invoice_name: string
  quantity: string
  unit: string
  amount: string
  remark?: string | null
}

export interface PurchaseInvoiceNoticeGeneratePayload {
  customs_declaration_id?: string | null
  customs_declaration_no: string
  declaration_date: string
  notice_date: string
  currency: string
  remarks?: string | null
  lines: PurchaseInvoiceNoticeLinePayload[]
}

export interface PurchaseInvoiceNoticeSendPayload {
  sender_name: string
  sent_at: string
}

export interface PurchaseInvoiceNoticeReceivePayload {
  tax_invoice_no: string
  received_at: string
}

export interface PurchaseInquiryLine {
  id: string
  inquiry_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
}

export interface SupplierSampleEvidence {
  sample_record_id: string
  sample_code: string
  sample_type: string
  status: string
  supplier_id: string | null
  supplier_name: string | null
  product_id: string | null
  product_code: string | null
  product_name: string
  received_at: string
  quantity: string
  unit: string
}

export interface SupplierQuotation {
  id: string
  inquiry_id: string
  inquiry_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  supplier_id: string | null
  supplier_name: string
  quoted_at: string
  unit_price: string
  currency: string
  lead_time_days: number | null
  min_order_quantity: string | null
  sample_available: boolean
  has_sample: boolean
  remark: string | null
}

export interface PurchaseInquiry {
  id: string
  code: string
  inquiry_date: string
  buyer_user_id: string | null
  buyer_user_name: string | null
  status: string
  template_name: string | null
  template_sent_at: string | null
  remarks: string | null
  owner_user_id: string
  lines: PurchaseInquiryLine[]
  quotations: SupplierQuotation[]
}

export interface PurchaseInquiryListSummary {
  sent_count: number
  quoted_count: number
  quotation_count: number
}

export interface PurchaseInquiryList {
  items: PurchaseInquiry[]
  total: number
  summary: PurchaseInquiryListSummary
}

export interface SupplierSampleEvidenceList {
  items: SupplierSampleEvidence[]
  total: number
}

export interface PurchaseInquiryReference {
  product_id: string | null
  product_code: string | null
  product_name: string
  supplier_name: string
  reference_price: string
  currency: string
  quote_date: string
  source_inquiry_no: string
}

export interface PurchaseInquiryReferenceList {
  items: PurchaseInquiryReference[]
  total: number
}

export interface PurchaseInquiryTemplate {
  filename: string
  content_type: string
  content: string
}

export interface PurchaseInquiryLinePayload {
  product_id?: string | null
  product_code?: string | null
  product_name: string
  specification?: string | null
  model?: string | null
  quantity: string
  unit: string
}

export interface PurchaseInquiryCreatePayload {
  inquiry_date: string
  buyer_user_id?: string | null
  buyer_user_name?: string | null
  remarks?: string | null
  lines: PurchaseInquiryLinePayload[]
}

export interface SupplierQuotationPayload {
  inquiry_line_id: string
  supplier_id?: string | null
  supplier_name: string
  quoted_at: string
  unit_price: string
  currency: string
  lead_time_days?: number | null
  min_order_quantity?: string | null
  sample_available: boolean
  remark?: string | null
}

export interface PurchaseInquiryTemplatePayload {
  template_name: string
  recipient_emails: string[]
}

export function listPurchaseContracts(filters: {
  q?: string
  approval_status?: string
  supplier_id?: string
  source_type?: string
  limit?: number
  offset?: number
} = {}): Promise<PurchaseContractList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.approval_status) params.set('approval_status', filters.approval_status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.source_type) params.set('source_type', filters.source_type)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PurchaseContractList>(`/purchase/contracts${suffix}`)
}

export function createPurchaseContract(
  payload: PurchaseContractCreatePayload,
): Promise<PurchaseContract> {
  return request<PurchaseContract>('/purchase/contracts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePurchaseContract(
  contractId: string,
  payload: PurchaseContractCreatePayload,
): Promise<PurchaseContract> {
  return request<PurchaseContract>(`/purchase/contracts/${contractId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function generatePurchaseContractFromExportContracts(
  payload: PurchaseContractGeneratePayload,
): Promise<PurchaseContract> {
  return request<PurchaseContract>('/purchase/contracts/generate-from-export-contracts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitPurchaseContract(
  contractId: string,
  payload: ApprovalSubmitPayload,
): Promise<PurchaseContract> {
  return request<PurchaseContract>(`/purchase/contracts/${contractId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approvePurchaseContract(
  contractId: string,
  payload: PurchaseContractApprovePayload,
): Promise<PurchaseContract> {
  return request<PurchaseContract>(`/purchase/contracts/${contractId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function cancelPurchaseContract(
  contractId: string,
  payload: { reason: string },
): Promise<PurchaseContract> {
  return request<PurchaseContract>(`/purchase/contracts/${contractId}/cancel`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function reissuePurchaseContract(
  contractId: string,
  payload: { reason: string },
): Promise<PurchaseContract> {
  return request<PurchaseContract>(`/purchase/contracts/${contractId}/reissue`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPurchaseContractReminders(): Promise<PurchaseContractReminderList> {
  return request<PurchaseContractReminderList>('/purchase/contracts/reminders')
}

export function listPurchaseInvoiceNotices(filters: {
  q?: string
  status?: string
  supplier_id?: string
  customs_declaration_id?: string
  limit?: number
  offset?: number
} = {}): Promise<PurchaseInvoiceNoticeList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.customs_declaration_id) {
    params.set('customs_declaration_id', filters.customs_declaration_id)
  }
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PurchaseInvoiceNoticeList>(`/purchase/invoice-notices${suffix}`)
}

export function generatePurchaseInvoiceNoticesFromDeclaration(
  payload: PurchaseInvoiceNoticeGeneratePayload,
): Promise<PurchaseInvoiceNoticeList> {
  return request<PurchaseInvoiceNoticeList>('/purchase/invoice-notices/from-customs-declaration', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function sendPurchaseInvoiceNotice(
  noticeId: string,
  payload: PurchaseInvoiceNoticeSendPayload,
): Promise<PurchaseInvoiceNotice> {
  return request<PurchaseInvoiceNotice>(`/purchase/invoice-notices/${noticeId}/send`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function receivePurchaseInvoiceNoticeTaxInvoice(
  noticeId: string,
  payload: PurchaseInvoiceNoticeReceivePayload,
): Promise<PurchaseInvoiceNotice> {
  return request<PurchaseInvoiceNotice>(
    `/purchase/invoice-notices/${noticeId}/receive-tax-invoice`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function listPurchaseInvoiceNoticeReminders(): Promise<PurchaseInvoiceNoticeReminderList> {
  return request<PurchaseInvoiceNoticeReminderList>('/purchase/invoice-notices/reminders')
}

export function listPurchaseInquiries(filters: {
  q?: string
  status?: string
  product_id?: string
  supplier_id?: string
  limit?: number
  offset?: number
} = {}): Promise<PurchaseInquiryList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.product_id) params.set('product_id', filters.product_id)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PurchaseInquiryList>(`/purchase/inquiries${suffix}`)
}

export function createPurchaseInquiry(
  payload: PurchaseInquiryCreatePayload,
): Promise<PurchaseInquiry> {
  return request<PurchaseInquiry>('/purchase/inquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePurchaseInquiry(
  inquiryId: string,
  payload: PurchaseInquiryCreatePayload,
): Promise<PurchaseInquiry> {
  return request<PurchaseInquiry>(`/purchase/inquiries/${inquiryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function addPurchaseInquiryQuotation(
  inquiryId: string,
  payload: SupplierQuotationPayload,
): Promise<PurchaseInquiry> {
  return request<PurchaseInquiry>(`/purchase/inquiries/${inquiryId}/quotations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function sendPurchaseInquiryTemplate(
  inquiryId: string,
  payload: PurchaseInquiryTemplatePayload,
): Promise<PurchaseInquiryTemplate> {
  return request<PurchaseInquiryTemplate>(`/purchase/inquiries/${inquiryId}/send-template`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPurchaseInquirySupplierSamples(filters: {
  product_id?: string
  supplier_id?: string
} = {}): Promise<SupplierSampleEvidenceList> {
  const params = new URLSearchParams()
  if (filters.product_id) params.set('product_id', filters.product_id)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SupplierSampleEvidenceList>(`/purchase/inquiries/supplier-samples${suffix}`)
}

export function listPurchaseInquiryReferences(filters: {
  product_id?: string
} = {}): Promise<PurchaseInquiryReferenceList> {
  const params = new URLSearchParams()
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PurchaseInquiryReferenceList>(`/purchase/inquiries/references${suffix}`)
}
