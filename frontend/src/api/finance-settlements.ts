import { request } from './core'

export interface ProfitCostItem {
  id: string
  settlement_id: string
  shipment_plan_id: string
  shipment_no: string
  cost_no: string
  cost_type: string
  source_type: string
  source_id: string | null
  source_no: string | null
  cost_date: string
  amount: string
  currency: string
  direction: string
  reason: string | null
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
}

export interface FinancialSettlement {
  id: string
  settlement_no: string
  shipment_plan_id: string
  shipment_no: string
  customer_name: string
  settlement_date: string
  currency: string
  sales_income: string
  purchase_cost_amount: string
  partner_fee_amount: string
  misc_fee_amount: string
  tax_refund_amount: string
  manual_cost_amount: string
  gross_profit: string
  gross_profit_rate: string
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  created_at: string
  cost_items: ProfitCostItem[]
}

export interface FinancialSettlementList {
  items: FinancialSettlement[]
  total: number
  total_sales_income: string
  total_gross_profit: string
}

export interface ProfitCalculationList {
  items: FinancialSettlement[]
  total: number
  total_sales_income: string
  total_gross_profit: string
}

export interface FinancialSettlementCreatePayload {
  shipment_plan_id: string
  shipment_no?: string | null
  settlement_date: string
  remark?: string | null
}

export interface ManualProfitCostCreatePayload {
  cost_type: string
  cost_date: string
  amount: string
  currency: string
  source_no?: string | null
  reason: string
  remark?: string | null
}

export function listFinancialSettlements(filters: {
  q?: string
  status?: string
  shipment_no?: string
} = {}): Promise<FinancialSettlementList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<FinancialSettlementList>(`/finance/settlements${suffix}`)
}

export function createFinancialSettlement(
  payload: FinancialSettlementCreatePayload,
): Promise<FinancialSettlement> {
  return request<FinancialSettlement>('/finance/settlements', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addManualProfitCost(
  settlementId: string,
  payload: ManualProfitCostCreatePayload,
): Promise<FinancialSettlement> {
  return request<FinancialSettlement>(`/finance/settlements/${settlementId}/manual-costs`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listProfitCalculations(filters: {
  q?: string
  shipment_no?: string
} = {}): Promise<ProfitCalculationList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ProfitCalculationList>(`/finance/profit-calculations${suffix}`)
}
