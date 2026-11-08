import { request } from './core'
import type { SampleDeliveryList } from './sample'
import type { ApprovalSubmitPayload } from './system'

export interface ExportQuotationLine {
  id: string
  quotation_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  unit_price: string
  amount: string
  freight_method: string
  freight_amount: string
  purchase_reference_supplier_name: string | null
  purchase_reference_price: string | null
  remark: string | null
}

export interface ExportQuotation {
  id: string
  code: string
  quote_date: string
  customer_id: string | null
  customer_name: string
  sales_user_id: string | null
  sales_user_name: string | null
  currency: string
  trade_term: string
  valid_until: string | null
  description: string | null
  total_amount: string
  approval_status: string
  submitted_at: string | null
  approved_at: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  confirmed_at: string | null
  generated_contract_id: string | null
  generated_contract_no: string | null
  owner_user_id: string
  lines: ExportQuotationLine[]
}

export interface ExportQuotationListSummary {
  submitted_count: number
  approved_count: number
  total_amount: string
  currency: string | null
}

export interface ExportQuotationList {
  items: ExportQuotation[]
  total: number
  summary: ExportQuotationListSummary
}

export interface ExportQuotationLinePayload {
  product_id?: string | null
  product_code?: string | null
  product_name: string
  specification?: string | null
  model?: string | null
  quantity: string
  unit: string
  unit_price: string
  freight_method: string
  freight_amount: string
  purchase_reference_supplier_name?: string | null
  purchase_reference_price?: string | null
  remark?: string | null
}

export interface ExportQuotationCreatePayload {
  quote_date: string
  customer_id?: string | null
  customer_name: string
  sales_user_id?: string | null
  sales_user_name?: string | null
  currency: string
  trade_term: string
  valid_until?: string | null
  description?: string | null
  lines: ExportQuotationLinePayload[]
}

export interface ExportQuotationApprovePayload {
  reviewer_name?: string
  approved_at: string
}

export interface ExportQuotationConfirmContractPayload {
  confirmed_at: string
}

export interface ExportQuotationPurchaseReference {
  product_id: string | null
  product_code: string | null
  product_name: string
  supplier_name: string
  reference_price: string
  currency: string
  quote_date: string
  source_quotation_no: string
}

export interface ExportQuotationPurchaseReferenceList {
  items: ExportQuotationPurchaseReference[]
  total: number
}

export interface ExportQuotationExport {
  filename: string
  content_type: string
  content: string
}

export interface ExportQuotationContract {
  quotation_id: string
  quotation_no: string
  contract_id: string
  contract_no: string
  customer_id: string | null
  customer_name: string
  confirmed_at: string
  currency: string
  trade_term: string
  total_amount: string
}

export interface ExportContractLine {
  id: string
  contract_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  barcode: string | null
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  unit_price: string
  amount: string
  purchased_quantity: string
  unpurchased_quantity: string
  shipped_quantity: string
  unshipped_quantity: string
  shipped_amount: string
  unshipped_amount: string
  image_url: string | null
  remark: string | null
}

export interface ExportContractSignature {
  id: string
  contract_id: string
  signed_by: string
  signed_at: string
  signature_method: string
  file_no: string | null
  remark: string | null
}

export interface ExportContractAdvancePayment {
  id: string
  contract_id: string
  payment_no: string
  received_at: string
  amount: string
  currency: string
  payer_name: string
  remark: string | null
}

export interface ExportContractStatistics {
  total_quantity: string
  total_amount: string
  shipped_quantity: string
  shipped_amount: string
  unshipped_quantity: string
  unshipped_amount: string
  purchased_quantity: string
  unpurchased_quantity: string
  advance_payment_amount: string
}

export interface ExportContractPurchaseStatus {
  product_id: string | null
  product_code: string | null
  product_name: string
  total_quantity: string
  purchased_quantity: string
  unpurchased_quantity: string
  unit: string
  status: string
}

export interface ExportContractShipmentStatus {
  product_id: string | null
  product_code: string | null
  product_name: string
  planned_ship_date: string
  total_quantity: string
  shipped_quantity: string
  unshipped_quantity: string
  shipped_amount: string
  unshipped_amount: string
  unit: string
  status: string
}

export interface ExportContract {
  id: string
  code: string
  contract_date: string
  customer_id: string | null
  customer_name: string
  sales_user_id: string | null
  sales_user_name: string | null
  currency: string
  trade_term: string
  planned_ship_date: string
  payment_terms: string
  source_quotation_id: string | null
  source_quotation_no: string | null
  remarks: string | null
  approval_status: string
  submitted_at: string | null
  approved_at: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  signature_status: string
  customer_signed_at: string | null
  cancelled_at: string | null
  cancelled_by_id: string | null
  cancelled_by_name: string | null
  cancel_reason: string | null
  reissued_from_id: string | null
  reissued_from_code: string | null
  reissue_reason: string | null
  owner_user_id: string
  statistics: ExportContractStatistics
  lines: ExportContractLine[]
  signatures: ExportContractSignature[]
  advance_payments: ExportContractAdvancePayment[]
  purchase_statuses: ExportContractPurchaseStatus[]
  shipment_statuses: ExportContractShipmentStatus[]
}

export interface ExportContractListSummary {
  submitted_count: number
  approved_count: number
  total_amount: string
  advance_payment_amount: string
  currency: string | null
}

export interface ExportContractList {
  items: ExportContract[]
  total: number
  summary: ExportContractListSummary
}

export interface ExportContractLinePayload {
  product_id?: string | null
  product_code?: string | null
  product_name: string
  barcode?: string | null
  specification?: string | null
  model?: string | null
  quantity: string
  unit: string
  unit_price: string
  purchased_quantity?: string
  shipped_quantity?: string
  image_url?: string | null
  remark?: string | null
}

export interface ExportContractCreatePayload {
  contract_date: string
  customer_id?: string | null
  customer_name: string
  sales_user_id?: string | null
  sales_user_name?: string | null
  currency: string
  trade_term: string
  planned_ship_date: string
  payment_terms: string
  source_quotation_id?: string | null
  source_quotation_no?: string | null
  remarks?: string | null
  lines: ExportContractLinePayload[]
}

export interface ExportContractApprovePayload {
  reviewer_name?: string
  approved_at: string
}

export interface ExportContractSignaturePayload {
  signed_by: string
  signed_at: string
  signature_method: string
  file_no?: string | null
  remark?: string | null
}

export interface ExportContractAdvancePaymentPayload {
  payment_no: string
  received_at: string
  amount: string
  currency: string
  payer_name: string
  remark?: string | null
}

export interface ExportContractExport {
  filename: string
  content_type: string
  content: string
}

export interface ShipmentLine {
  id: string
  shipment_id: string
  contract_id: string
  contract_no: string
  contract_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  unit_price: string
  amount: string
  planned_ship_date: string
}

export interface ShipmentFinanceOverview {
  receivable_amount: string
  payable_amount: string
  profit_amount: string
  profit_rate: string
  currency: string
}

export interface ShipmentReminder {
  shipment_id: string
  shipment_no: string
  reminder_date: string
  message: string
  status: string
}

export interface ShipmentContractProgress {
  contract_id: string
  contract_no: string
  purchase_statuses: ExportContractPurchaseStatus[]
  shipment_statuses: ExportContractShipmentStatus[]
}

export interface ShipmentPlan {
  id: string
  code: string
  shipment_date: string
  planned_ship_date: string
  customer_id: string | null
  customer_name: string
  currency: string
  shipping_method: string
  port_of_loading: string
  port_of_destination: string
  vessel_name: string | null
  container_no: string | null
  booking_no: string | null
  document_owner_name: string | null
  approval_status: string
  submitted_at: string | null
  approved_at: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  remarks: string | null
  owner_user_id: string
  finance_overview: ShipmentFinanceOverview
  reminder: ShipmentReminder
  lines: ShipmentLine[]
  contract_progresses: ShipmentContractProgress[]
}

export interface ShipmentPlanListSummary {
  submitted_count: number
  approved_count: number
  receivable_amount: string
  profit_amount: string
  currency: string | null
}

export interface ShipmentPlanList {
  items: ShipmentPlan[]
  total: number
  summary: ShipmentPlanListSummary
}

export interface ShipmentReminderList {
  items: ShipmentReminder[]
  total: number
}

export interface ShipmentContractSelectionPayload {
  contract_id: string
  quantity?: string | null
}

export interface ShipmentPlanGeneratePayload {
  shipment_date: string
  planned_ship_date: string
  shipping_method: string
  port_of_loading: string
  port_of_destination: string
  vessel_name?: string | null
  container_no?: string | null
  booking_no?: string | null
  document_owner_name?: string | null
  estimated_payable_amount: string
  remarks?: string | null
  selections: ShipmentContractSelectionPayload[]
}

export interface ShipmentApprovePayload {
  reviewer_name?: string
  approved_at: string
}

export function listExportQuotations(filters: {
  q?: string
  approval_status?: string
  customer_id?: string
  limit?: number
  offset?: number
} = {}): Promise<ExportQuotationList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.approval_status) params.set('approval_status', filters.approval_status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ExportQuotationList>(`/sales/quotations${suffix}`)
}

export function createExportQuotation(
  payload: ExportQuotationCreatePayload,
): Promise<ExportQuotation> {
  return request<ExportQuotation>('/sales/quotations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateExportQuotation(
  quotationId: string,
  payload: ExportQuotationCreatePayload,
): Promise<ExportQuotation> {
  return request<ExportQuotation>(`/sales/quotations/${quotationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function submitExportQuotation(
  quotationId: string,
  payload: ApprovalSubmitPayload,
): Promise<ExportQuotation> {
  return request<ExportQuotation>(`/sales/quotations/${quotationId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveExportQuotation(
  quotationId: string,
  payload: ExportQuotationApprovePayload,
): Promise<ExportQuotation> {
  return request<ExportQuotation>(`/sales/quotations/${quotationId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function confirmExportQuotationContract(
  quotationId: string,
  payload: ExportQuotationConfirmContractPayload,
): Promise<ExportQuotationContract> {
  return request<ExportQuotationContract>(`/sales/quotations/${quotationId}/confirm-contract`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getExportQuotationHistory(filters: {
  customer_id?: string
  product_id?: string
} = {}): Promise<ExportQuotationList> {
  const params = new URLSearchParams()
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ExportQuotationList>(`/sales/quotations/history${suffix}`)
}

export function getExportQuotationPurchaseReferences(filters: {
  product_id?: string
} = {}): Promise<ExportQuotationPurchaseReferenceList> {
  const params = new URLSearchParams()
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ExportQuotationPurchaseReferenceList>(
    `/sales/quotations/purchase-references${suffix}`,
  )
}

export function getExportQuotationSampleDeliveries(
  quotationId: string,
): Promise<SampleDeliveryList> {
  return request<SampleDeliveryList>(`/sales/quotations/${quotationId}/sample-deliveries`)
}

export function exportExportQuotation(
  quotationId: string,
  format: 'pdf' | 'excel',
): Promise<ExportQuotationExport> {
  return request<ExportQuotationExport>(`/sales/quotations/${quotationId}/export?format=${format}`)
}

export function listExportContracts(filters: {
  q?: string
  approval_status?: string
  customer_id?: string
  limit?: number
  offset?: number
} = {}): Promise<ExportContractList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.approval_status) params.set('approval_status', filters.approval_status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ExportContractList>(`/sales/contracts${suffix}`)
}

export function createExportContract(
  payload: ExportContractCreatePayload,
): Promise<ExportContract> {
  return request<ExportContract>('/sales/contracts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateExportContract(
  contractId: string,
  payload: ExportContractCreatePayload,
): Promise<ExportContract> {
  return request<ExportContract>(`/sales/contracts/${contractId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function submitExportContract(
  contractId: string,
  payload: ApprovalSubmitPayload,
): Promise<ExportContract> {
  return request<ExportContract>(`/sales/contracts/${contractId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveExportContract(
  contractId: string,
  payload: ExportContractApprovePayload,
): Promise<ExportContract> {
  return request<ExportContract>(`/sales/contracts/${contractId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function cancelExportContract(
  contractId: string,
  payload: { reason: string },
): Promise<ExportContract> {
  return request<ExportContract>(`/sales/contracts/${contractId}/cancel`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function reissueExportContract(
  contractId: string,
  payload: { reason: string },
): Promise<ExportContract> {
  return request<ExportContract>(`/sales/contracts/${contractId}/reissue`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function registerExportContractSignature(
  contractId: string,
  payload: ExportContractSignaturePayload,
): Promise<ExportContract> {
  return request<ExportContract>(`/sales/contracts/${contractId}/signature`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addExportContractAdvancePayment(
  contractId: string,
  payload: ExportContractAdvancePaymentPayload,
): Promise<ExportContractAdvancePayment> {
  return request<ExportContractAdvancePayment>(`/sales/contracts/${contractId}/advance-payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function exportExportContract(
  contractId: string,
  format: 'pdf' | 'excel',
): Promise<ExportContractExport> {
  return request<ExportContractExport>(`/sales/contracts/${contractId}/export?format=${format}`)
}

export function listShipments(filters: {
  q?: string
  approval_status?: string
  customer_id?: string
  contract_id?: string
  limit?: number
  offset?: number
} = {}): Promise<ShipmentPlanList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.approval_status) params.set('approval_status', filters.approval_status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.contract_id) params.set('contract_id', filters.contract_id)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ShipmentPlanList>(`/sales/shipments${suffix}`)
}

export function generateShipmentFromContracts(
  payload: ShipmentPlanGeneratePayload,
): Promise<ShipmentPlan> {
  return request<ShipmentPlan>('/sales/shipments/from-contracts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitShipment(
  shipmentId: string,
  payload: ApprovalSubmitPayload,
): Promise<ShipmentPlan> {
  return request<ShipmentPlan>(`/sales/shipments/${shipmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveShipment(
  shipmentId: string,
  payload: ShipmentApprovePayload,
): Promise<ShipmentPlan> {
  return request<ShipmentPlan>(`/sales/shipments/${shipmentId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listShipmentReminders(): Promise<ShipmentReminderList> {
  return request<ShipmentReminderList>('/sales/shipments/reminders')
}
