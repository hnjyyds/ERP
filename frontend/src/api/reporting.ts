import { request } from './core'

export interface ApprovalDocument {
  document_type: string
  document_type_label: string
  document_id: string
  document_no: string
  counterparty_name: string
  applicant_user_id: string | null
  applicant_user_name: string | null
  business_date: string
  submitted_at: string | null
  approved_at: string | null
  status: string
  status_label: string
  amount: string
  currency: string
  source_path: string
}

export interface ApprovalTypeSummary {
  document_type: string
  document_type_label: string
  pending_count: number
  approved_count: number
  total_count: number
}

export interface ApprovalQuery {
  items: ApprovalDocument[]
  total: number
  pending_count: number
  approved_count: number
  type_summaries: ApprovalTypeSummary[]
}

export interface ReportingSummary {
  date_from: string | null
  date_to: string | null
  currency_label: string
  export_contract_count: number
  export_contract_amount: string
  purchase_contract_count: number
  purchase_contract_amount: string
  shipment_count: number
  shipment_receivable_amount: string
  shipment_profit_amount: string
  settlement_count: number
  settlement_gross_profit: string
}

export interface StatusAmountStatistic {
  status: string
  status_label: string
  currency: string
  count: number
  amount: string
  source_path: string
}

export interface ReportDocumentStatistic {
  document_id: string
  document_no: string
  party_name: string
  business_user_name: string | null
  business_date: string
  status: string
  status_label: string
  amount: string
  currency: string
  source_path: string
}

export interface CustomerShipmentStatistic {
  customer_id: string | null
  customer_name: string
  currency: string
  shipment_count: number
  receivable_amount: string
  profit_amount: string
  source_path: string
}

export interface SalesMonthlyShipmentStatistic {
  period: string
  sales_user_id: string | null
  sales_user_name: string | null
  currency: string
  shipment_count: number
  shipped_amount: string
  source_path: string
}

export interface ShipmentStatisticItem {
  shipment_id: string
  shipment_no: string
  customer_name: string
  shipment_date: string
  status: string
  status_label: string
  receivable_amount: string
  profit_amount: string
  currency: string
  source_path: string
}

export interface ReportingStatistics {
  summary: ReportingSummary
  export_contract_statuses: StatusAmountStatistic[]
  purchase_contract_statuses: StatusAmountStatistic[]
  export_contract_items: ReportDocumentStatistic[]
  purchase_contract_items: ReportDocumentStatistic[]
  customer_shipments: CustomerShipmentStatistic[]
  sales_monthly_shipments: SalesMonthlyShipmentStatistic[]
  shipment_items: ShipmentStatisticItem[]
}

export function listApprovalDocuments(filters: {
  document_type?: string
  status?: string
  applicant_user_id?: string
  date_from?: string
  date_to?: string
} = {}): Promise<ApprovalQuery> {
  const params = new URLSearchParams()
  if (filters.document_type) params.set('document_type', filters.document_type)
  if (filters.status) params.set('status', filters.status)
  if (filters.applicant_user_id) params.set('applicant_user_id', filters.applicant_user_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ApprovalQuery>(`/reporting/approvals${suffix}`)
}

export function listReportingStatistics(filters: {
  date_from?: string
  date_to?: string
  customer_id?: string
  supplier_id?: string
  sales_user_id?: string
  approval_status?: string
} = {}): Promise<ReportingStatistics> {
  const params = new URLSearchParams()
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.approval_status) params.set('approval_status', filters.approval_status)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ReportingStatistics>(`/reporting/statistics${suffix}`)
}
