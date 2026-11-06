import { request } from './core'
import type { CsvExportResult } from './sample'

// ---- 财务统计报表 (finance reports, read-only) ----

export interface ReceiptUsageDetailRow {
  receipt_no: string
  received_at: string
  payer_name: string
  customer_name: string | null
  allocation_type: string
  contract_no: string | null
  invoice_no: string | null
  allocated_at: string
  currency: string
  amount: string
}

export interface ReceiptUsageCurrencySummary {
  currency: string
  allocation_count: number
  allocated_amount: string
}

export interface ReceiptUsageDetailReport {
  rows: ReceiptUsageDetailRow[]
  currency_summaries: ReceiptUsageCurrencySummary[]
  total_count: number
}

export interface BankReceiptCurrencySummary {
  currency: string
  receipt_count: number
  total_amount: string
  allocated_amount: string
  unallocated_amount: string
}

export interface BankReceiptOperatorSummary {
  operator_name: string
  currency: string
  receipt_count: number
  total_amount: string
}

export interface BankReceiptSummaryReport {
  currency_summaries: BankReceiptCurrencySummary[]
  operator_summaries: BankReceiptOperatorSummary[]
  receipt_count: number
}

export interface GoodsPaymentQueryRow {
  request_no: string
  request_date: string
  supplier_invoice_no: string
  supplier_name: string
  purchase_contract_no: string | null
  payment_type: string
  currency: string
  requested_amount: string
  approved_amount: string
  paid_amount: string
  outstanding_amount: string
  status: string
}

export interface GoodsPaymentCurrencySummary {
  currency: string
  request_count: number
  requested_amount: string
  approved_amount: string
  paid_amount: string
  outstanding_amount: string
}

export interface GoodsPaymentQueryReport {
  rows: GoodsPaymentQueryRow[]
  currency_summaries: GoodsPaymentCurrencySummary[]
  total_count: number
}

export interface FeePaymentQueryRow {
  request_no: string
  request_date: string
  partner_fee_invoice_no: string
  partner_name: string
  partner_type: string | null
  fee_type: string
  shipment_no: string | null
  sales_user_name: string | null
  currency: string
  requested_amount: string
  approved_amount: string
  paid_amount: string
  outstanding_amount: string
  status: string
}

export interface FeePaymentCurrencySummary {
  currency: string
  request_count: number
  requested_amount: string
  approved_amount: string
  paid_amount: string
  outstanding_amount: string
}

export interface FeePaymentQueryReport {
  rows: FeePaymentQueryRow[]
  currency_summaries: FeePaymentCurrencySummary[]
  total_count: number
}

export interface CustomsReceiptCollectionRow {
  document_no: string
  received_at: string
  owner_user_name: string | null
  shipment_no: string | null
  customer_name: string | null
  customs_declaration_no: string | null
  customs_receipt_no: string | null
  reminder_date: string
  reminder_status: string
  valid_until: string
  currency: string
  refundable_amount: string
}

export interface CustomsReceiptStatusSummary {
  reminder_status: string
  count: number
}

export interface CustomsReceiptCollectionReport {
  rows: CustomsReceiptCollectionRow[]
  status_summaries: CustomsReceiptStatusSummary[]
  total_count: number
}

export interface TaxRefundStatusSummary {
  status: string
  currency: string
  document_count: number
  refundable_amount: string
  refunded_amount: string
  outstanding_amount: string
}

export interface TaxRefundCurrencyTotal {
  currency: string
  document_count: number
  refundable_amount: string
  refunded_amount: string
  outstanding_amount: string
}

export interface TaxRefundStatisticsReport {
  status_summaries: TaxRefundStatusSummary[]
  currency_totals: TaxRefundCurrencyTotal[]
  document_count: number
  refund_record_count: number
}

// ---- 财务统计报表 API（只读）----

export function financeReportSuffix(filters: Record<string, string | boolean | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === '' || value === false) continue
    params.set(key, String(value))
  }
  return params.size > 0 ? `?${params.toString()}` : ''
}

export function getReceiptUsageReport(filters: {
  date_from?: string
  date_to?: string
  currency?: string
  receipt_no?: string
} = {}): Promise<ReceiptUsageDetailReport> {
  const suffix = financeReportSuffix(filters)
  return request<ReceiptUsageDetailReport>(`/finance/reports/receipt-usage${suffix}`)
}

export function exportReceiptUsageReport(filters: {
  date_from?: string
  date_to?: string
  currency?: string
  receipt_no?: string
} = {}): Promise<CsvExportResult> {
  const suffix = financeReportSuffix(filters)
  return request<CsvExportResult>(`/finance/reports/receipt-usage/export${suffix}`)
}

export function getBankReceiptSummaryReport(filters: {
  date_from?: string
  date_to?: string
  currency?: string
  receipt_type?: string
} = {}): Promise<BankReceiptSummaryReport> {
  const suffix = financeReportSuffix(filters)
  return request<BankReceiptSummaryReport>(`/finance/reports/bank-receipt-summary${suffix}`)
}

export function exportBankReceiptSummaryReport(filters: {
  date_from?: string
  date_to?: string
  currency?: string
  receipt_type?: string
} = {}): Promise<CsvExportResult> {
  const suffix = financeReportSuffix(filters)
  return request<CsvExportResult>(`/finance/reports/bank-receipt-summary/export${suffix}`)
}

export function getGoodsPaymentReport(filters: {
  date_from?: string
  date_to?: string
  currency?: string
  supplier_name?: string
  status?: string
} = {}): Promise<GoodsPaymentQueryReport> {
  const suffix = financeReportSuffix(filters)
  return request<GoodsPaymentQueryReport>(`/finance/reports/goods-payment${suffix}`)
}

export function exportGoodsPaymentReport(filters: {
  date_from?: string
  date_to?: string
  currency?: string
  supplier_name?: string
  status?: string
} = {}): Promise<CsvExportResult> {
  const suffix = financeReportSuffix(filters)
  return request<CsvExportResult>(`/finance/reports/goods-payment/export${suffix}`)
}

export function getFeePaymentReport(filters: {
  date_from?: string
  date_to?: string
  currency?: string
  partner_name?: string
  fee_type?: string
  sales_user_id?: string
  status?: string
} = {}): Promise<FeePaymentQueryReport> {
  const suffix = financeReportSuffix(filters)
  return request<FeePaymentQueryReport>(`/finance/reports/fee-payment${suffix}`)
}

export function exportFeePaymentReport(filters: {
  date_from?: string
  date_to?: string
  currency?: string
  partner_name?: string
  fee_type?: string
  sales_user_id?: string
  status?: string
} = {}): Promise<CsvExportResult> {
  const suffix = financeReportSuffix(filters)
  return request<CsvExportResult>(`/finance/reports/fee-payment/export${suffix}`)
}

export function getCustomsReceiptCollectionReport(filters: {
  date_from?: string
  date_to?: string
  owner_user_id?: string
  reminder_status?: string
  include_registered?: boolean
} = {}): Promise<CustomsReceiptCollectionReport> {
  const suffix = financeReportSuffix(filters)
  return request<CustomsReceiptCollectionReport>(
    `/finance/reports/customs-receipt-collection${suffix}`,
  )
}

export function exportCustomsReceiptCollectionReport(filters: {
  date_from?: string
  date_to?: string
  owner_user_id?: string
  reminder_status?: string
  include_registered?: boolean
} = {}): Promise<CsvExportResult> {
  const suffix = financeReportSuffix(filters)
  return request<CsvExportResult>(
    `/finance/reports/customs-receipt-collection/export${suffix}`,
  )
}

export function getTaxRefundStatisticsReport(filters: {
  date_from?: string
  date_to?: string
  currency?: string
  status?: string
} = {}): Promise<TaxRefundStatisticsReport> {
  const suffix = financeReportSuffix(filters)
  return request<TaxRefundStatisticsReport>(`/finance/reports/tax-refund-statistics${suffix}`)
}

export function exportTaxRefundStatisticsReport(filters: {
  date_from?: string
  date_to?: string
  currency?: string
  status?: string
} = {}): Promise<CsvExportResult> {
  const suffix = financeReportSuffix(filters)
  return request<CsvExportResult>(`/finance/reports/tax-refund-statistics/export${suffix}`)
}
