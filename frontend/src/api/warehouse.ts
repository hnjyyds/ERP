import { request } from './core'
import type { ApprovalSubmitPayload } from './system'

export interface InboundPlanLine {
  id: string
  plan_id: string
  purchase_contract_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  planned_quantity: string
  received_quantity: string
  unit: string
  status: string
  remark: string | null
}

export interface InboundPlan {
  id: string
  code: string
  purchase_contract_id: string
  purchase_contract_no: string
  supplier_id: string | null
  supplier_name: string
  inbound_type: string
  planned_date: string
  status: string
  warehouse_id: string | null
  warehouse_name: string | null
  location_id: string | null
  location_name: string | null
  operator_name: string | null
  owner_user_id: string
  lines: InboundPlanLine[]
}

export interface InboundPlanList {
  items: InboundPlan[]
  total: number
}

export interface InboundPlanGeneratePayload {
  purchase_contract_id: string
  inbound_type: string
  planned_date?: string | null
}

export interface InboundPlanSchedulePayload {
  planned_date: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

export interface InboundOrderLine {
  id: string
  order_id: string
  plan_line_id: string
  purchase_contract_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  stock_status: string
  remark: string | null
}

export interface InboundOrder {
  id: string
  code: string
  plan_id: string
  purchase_contract_id: string
  purchase_contract_no: string
  supplier_id: string | null
  supplier_name: string
  inbound_type: string
  inbound_mode: string
  inbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  status: string
  submitted_at: string | null
  approved_at: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  owner_user_id: string
  lines: InboundOrderLine[]
}

export interface InboundOrderList {
  items: InboundOrder[]
  total: number
}

export interface InboundOrderLinePayload {
  plan_line_id: string
  product_id?: string | null
  product_code?: string | null
  product_name: string
  quantity: string
  unit: string
  remark?: string | null
}

export interface InboundOrderGeneratePayload {
  plan_id: string
  inbound_mode: string
  inbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  lines: InboundOrderLinePayload[]
}

export interface InboundOrderSubmitPayload {
  reviewer_id: string
}

export interface InboundOrderApprovePayload {
  approved_at: string
}

export interface OutboundPlanLine {
  id: string
  plan_id: string
  source_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  planned_quantity: string
  outbound_quantity: string
  unit: string
  status: string
  remark: string | null
}

export interface OutboundPlan {
  id: string
  code: string
  source_type: string
  source_id: string
  source_code: string
  outbound_type: string
  planned_date: string
  status: string
  customer_id: string | null
  customer_name: string | null
  warehouse_id: string | null
  warehouse_name: string | null
  location_id: string | null
  location_name: string | null
  operator_name: string | null
  owner_user_id: string
  lines: OutboundPlanLine[]
}

export interface OutboundPlanList {
  items: OutboundPlan[]
  total: number
}

export interface OutboundPlanGeneratePayload {
  shipment_plan_id: string
  outbound_type: string
  planned_date?: string | null
}

export interface OutboundPlanSchedulePayload {
  planned_date: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

export interface OutboundOrderLine {
  id: string
  order_id: string
  plan_line_id: string
  source_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  stock_status: string
  remark: string | null
}

export interface OutboundOrder {
  id: string
  code: string
  plan_id: string
  source_type: string
  source_id: string
  source_code: string
  outbound_type: string
  customer_id: string | null
  customer_name: string | null
  outbound_mode: string
  outbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  status: string
  exception_reason: string | null
  submitted_at: string | null
  approved_at: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  owner_user_id: string
  lines: OutboundOrderLine[]
}

export interface OutboundOrderList {
  items: OutboundOrder[]
  total: number
}

export interface OutboundOrderLinePayload {
  plan_line_id: string
  product_id?: string | null
  product_code?: string | null
  product_name: string
  quantity: string
  unit: string
  remark?: string | null
}

export interface OutboundOrderGeneratePayload {
  plan_id: string
  outbound_mode: string
  outbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  exception_reason?: string | null
  lines: OutboundOrderLinePayload[]
}

export interface OutboundOrderApprovePayload {
  reviewer_name?: string
  approved_at: string
  allow_negative?: boolean
}

export interface InventoryBalance {
  id: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  product_id: string | null
  product_code: string | null
  product_name: string
  available_quantity: string
  locked_quantity: string
  pending_inspection_quantity: string
  unit: string
}

export interface InventoryBalanceList {
  items: InventoryBalance[]
  total: number
}

export interface InventoryLedger {
  id: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  product_id: string | null
  product_code: string | null
  product_name: string
  direction: string
  quantity: string
  unit: string
  stock_status: string
  source_type: string
  source_id: string
  source_code: string
  occurred_at: string
  remark: string | null
}

export interface InventoryLedgerList {
  items: InventoryLedger[]
  total: number
}

export function listOutboundPlans(filters: {
  q?: string
  status?: string
  outbound_type?: string
  source_type?: string
  customer_id?: string
  source_id?: string
} = {}): Promise<OutboundPlanList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.outbound_type) params.set('outbound_type', filters.outbound_type)
  if (filters.source_type) params.set('source_type', filters.source_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.source_id) params.set('source_id', filters.source_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<OutboundPlanList>(`/warehouse/outbound-plans${suffix}`)
}

export function generateOutboundPlanFromShipment(
  payload: OutboundPlanGeneratePayload,
): Promise<OutboundPlan> {
  return request<OutboundPlan>('/warehouse/outbound-plans/from-shipment', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function scheduleOutboundPlan(
  planId: string,
  payload: OutboundPlanSchedulePayload,
): Promise<OutboundPlan> {
  return request<OutboundPlan>(`/warehouse/outbound-plans/${planId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listOutboundOrders(filters: {
  q?: string
  status?: string
  outbound_mode?: string
  outbound_type?: string
  customer_id?: string
  source_id?: string
} = {}): Promise<OutboundOrderList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.outbound_mode) params.set('outbound_mode', filters.outbound_mode)
  if (filters.outbound_type) params.set('outbound_type', filters.outbound_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.source_id) params.set('source_id', filters.source_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<OutboundOrderList>(`/warehouse/outbound-orders${suffix}`)
}

export function generateOutboundOrderFromPlan(
  payload: OutboundOrderGeneratePayload,
): Promise<OutboundOrder> {
  return request<OutboundOrder>('/warehouse/outbound-orders/from-plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitOutboundOrder(
  orderId: string,
  payload: ApprovalSubmitPayload,
): Promise<OutboundOrder> {
  return request<OutboundOrder>(`/warehouse/outbound-orders/${orderId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveOutboundOrder(
  orderId: string,
  payload: OutboundOrderApprovePayload,
): Promise<OutboundOrder> {
  return request<OutboundOrder>(`/warehouse/outbound-orders/${orderId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listInboundPlans(filters: {
  q?: string
  inbound_type?: string
  status?: string
  supplier_id?: string
  purchase_contract_id?: string
} = {}): Promise<InboundPlanList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.inbound_type) params.set('inbound_type', filters.inbound_type)
  if (filters.status) params.set('status', filters.status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_id) params.set('purchase_contract_id', filters.purchase_contract_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<InboundPlanList>(`/warehouse/inbound-plans${suffix}`)
}

export function generateInboundPlanFromPurchaseContract(
  payload: InboundPlanGeneratePayload,
): Promise<InboundPlan> {
  return request<InboundPlan>('/warehouse/inbound-plans/from-purchase-contract', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function scheduleInboundPlan(
  planId: string,
  payload: InboundPlanSchedulePayload,
): Promise<InboundPlan> {
  return request<InboundPlan>(`/warehouse/inbound-plans/${planId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listInboundOrders(filters: {
  q?: string
  status?: string
  inbound_mode?: string
  supplier_id?: string
  purchase_contract_id?: string
} = {}): Promise<InboundOrderList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.inbound_mode) params.set('inbound_mode', filters.inbound_mode)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_id) params.set('purchase_contract_id', filters.purchase_contract_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<InboundOrderList>(`/warehouse/inbound-orders${suffix}`)
}

export function generateInboundOrderFromPlan(
  payload: InboundOrderGeneratePayload,
): Promise<InboundOrder> {
  return request<InboundOrder>('/warehouse/inbound-orders/from-plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitInboundOrder(
  orderId: string,
  payload: InboundOrderSubmitPayload,
): Promise<InboundOrder> {
  return request<InboundOrder>(`/warehouse/inbound-orders/${orderId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveInboundOrder(
  orderId: string,
  payload: InboundOrderApprovePayload,
): Promise<InboundOrder> {
  return request<InboundOrder>(`/warehouse/inbound-orders/${orderId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listInventoryBalances(filters: {
  q?: string
  warehouse_id?: string
  location_id?: string
  product_id?: string
} = {}): Promise<InventoryBalanceList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.warehouse_id) params.set('warehouse_id', filters.warehouse_id)
  if (filters.location_id) params.set('location_id', filters.location_id)
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<InventoryBalanceList>(`/warehouse/inbound-orders/inventory-balances${suffix}`)
}

export function listInventoryLedgers(filters: {
  q?: string
  source_id?: string
  product_id?: string
} = {}): Promise<InventoryLedgerList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.source_id) params.set('source_id', filters.source_id)
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<InventoryLedgerList>(`/warehouse/inbound-orders/inventory-ledgers${suffix}`)
}
