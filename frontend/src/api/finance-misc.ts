import { request } from './core'

export interface MiscFeeItem {
  id: string
  code: string
  name: string
  category: string
  default_allocation_method: string
  is_active: boolean
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
}

export interface MiscFeeItemList {
  items: MiscFeeItem[]
  total: number
}

export interface MiscFeeItemCreatePayload {
  code: string
  name: string
  category: string
  default_allocation_method: string
  is_active: boolean
  remark?: string | null
}

export interface MiscFeeAllocation {
  id: string
  allocation_no: string
  item_id: string
  item_code: string
  item_name: string
  item_category: string
  shipment_plan_id: string
  shipment_no: string
  customer_name: string
  sales_user_id: string | null
  sales_user_name: string | null
  allocated_at: string
  amount: string
  currency: string
  allocation_method: string
  basis: string | null
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
}

export interface MiscFeeAllocationList {
  items: MiscFeeAllocation[]
  total: number
  total_allocated_amount: string
}

export interface MiscFeeAllocationCreatePayload {
  item_id: string
  shipment_plan_id: string
  shipment_no?: string | null
  sales_user_id?: string | null
  sales_user_name?: string | null
  allocated_at: string
  amount: string
  currency: string
  allocation_method: string
  basis?: string | null
  remark?: string | null
}

export function listMiscFeeItems(filters: {
  q?: string
  category?: string
  status?: string
  limit?: number
  offset?: number
} = {}): Promise<MiscFeeItemList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('category', filters.category)
  if (filters.status) params.set('status', filters.status)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<MiscFeeItemList>(`/finance/misc-fee-items${suffix}`)
}

export function createMiscFeeItem(payload: MiscFeeItemCreatePayload): Promise<MiscFeeItem> {
  return request<MiscFeeItem>('/finance/misc-fee-items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listMiscFeeAllocations(filters: {
  q?: string
  item_id?: string
  category?: string
  shipment_no?: string
  sales_user_id?: string
  status?: string
  limit?: number
  offset?: number
} = {}): Promise<MiscFeeAllocationList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.item_id) params.set('item_id', filters.item_id)
  if (filters.category) params.set('category', filters.category)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.status) params.set('status', filters.status)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<MiscFeeAllocationList>(`/finance/misc-fee-allocations${suffix}`)
}

export function createMiscFeeAllocation(
  payload: MiscFeeAllocationCreatePayload,
): Promise<MiscFeeAllocation> {
  return request<MiscFeeAllocation>('/finance/misc-fee-allocations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listMiscFeeAllocationSummary(filters: {
  q?: string
  item_id?: string
  category?: string
  shipment_no?: string
  sales_user_id?: string
  status?: string
} = {}): Promise<MiscFeeAllocationList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.item_id) params.set('item_id', filters.item_id)
  if (filters.category) params.set('category', filters.category)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.status) params.set('status', filters.status)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<MiscFeeAllocationList>(`/finance/misc-fee-allocations/summary${suffix}`)
}
