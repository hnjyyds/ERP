import { request } from './core'
import { financeReportSuffix } from './finance-reports'

export interface FinanceOverviewSummary {
  shipment_count: number
  currency_label: string
  receivable_amount: string
  payable_amount: string
  profit_amount: string
  profit_rate: string
  invoice_notice_count: number
  invoice_notice_amount: string
  sample_fee_count: number
  sample_fee_amount: string
  partner_count: number
  active_partner_count: number
}

export interface FinanceCurrencySummary {
  currency: string
  shipment_count: number
  receivable_amount: string
  payable_amount: string
  profit_amount: string
  profit_rate: string
}

export interface FinanceStatusAmount {
  status: string
  currency: string
  count: number
  amount: string
}

export interface FinancePartnerTypeSummary {
  partner_type: string
  count: number
}

export interface FinanceShipmentProfit {
  id: string
  code: string
  shipment_date: string
  planned_ship_date: string
  customer_name: string
  currency: string
  approval_status: string
  receivable_amount: string
  payable_amount: string
  profit_amount: string
  profit_rate: string
}

export interface FinanceOverview {
  summary: FinanceOverviewSummary
  currency_summaries: FinanceCurrencySummary[]
  invoice_notice_statuses: FinanceStatusAmount[]
  sample_fee_statuses: FinanceStatusAmount[]
  partner_type_summaries: FinancePartnerTypeSummary[]
  shipment_profit_items: FinanceShipmentProfit[]
}

export interface FinanceReportFieldExplanation {
  label: string
  field: string
  formula: string
}

export interface FinanceReportExplanation {
  report_key: string
  title: string
  source_tables: string[]
  metric_rules: string[]
  fields: FinanceReportFieldExplanation[]
}

export interface FinanceReportDrilldownItem {
  label: string
  value: string | null
  target_path: string | null
}

export interface FinanceReportDrilldown {
  report_key: string
  source_type: string
  source_no: string
  items: FinanceReportDrilldownItem[]
}

export function getFinanceOverview(): Promise<FinanceOverview> {
  return request<FinanceOverview>('/finance/overview')
}

export function explainFinanceReport(reportKey: string): Promise<FinanceReportExplanation> {
  return request<FinanceReportExplanation>(`/finance/reports/${reportKey}/explain`)
}

export function drilldownFinanceReport(
  reportKey: string,
  sourceNo: string,
): Promise<FinanceReportDrilldown> {
  const suffix = financeReportSuffix({ source_no: sourceNo })
  return request<FinanceReportDrilldown>(`/finance/reports/${reportKey}/drilldown${suffix}`)
}
