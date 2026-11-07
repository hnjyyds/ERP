import { request } from './core'

export interface FeePaymentAllocation {
  id: string
  fee_payment_request_id: string
  partner_fee_invoice_id: string
  allocated_at: string
  amount: string
  currency: string
  remark: string | null
}

export interface FeePaymentRequest {
  id: string
  request_no: string
  partner_fee_invoice_id: string
  partner_fee_invoice_no: string
  partner_id: string | null
  partner_name: string
  partner_type: string | null
  shipment_plan_id: string | null
  shipment_no: string | null
  sales_user_id: string | null
  sales_user_name: string | null
  fee_type: string
  request_date: string
  requested_amount: string
  approved_amount: string
  paid_amount: string
  currency: string
  status: string
  requester_user_id: string
  requester_user_name: string
  reviewer_id: string | null
  reviewer_name: string | null
  approved_at: string | null
  payment_account: string | null
  remark: string | null
}

export interface PartnerFeeInvoice {
  id: string
  invoice_no: string
  invoice_date: string
  partner_id: string | null
  partner_name: string
  partner_type: string | null
  shipment_plan_id: string | null
  shipment_no: string | null
  sales_user_id: string | null
  sales_user_name: string | null
  fee_type: string
  total_amount: string
  paid_amount: string
  unpaid_amount: string
  currency: string
  due_date: string | null
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  fee_payment_requests: FeePaymentRequest[]
  allocations: FeePaymentAllocation[]
}

export interface PartnerFeeInvoiceList {
  items: PartnerFeeInvoice[]
  total: number
}

export interface PartnerFeeInvoiceCreatePayload {
  invoice_no: string
  invoice_date: string
  partner_id?: string | null
  partner_name: string
  partner_type?: string | null
  shipment_plan_id?: string | null
  shipment_no?: string | null
  sales_user_id?: string | null
  sales_user_name?: string | null
  fee_type: string
  total_amount: string
  currency: string
  due_date?: string | null
  remark?: string | null
}

export interface FeePaymentRequestCreatePayload {
  partner_fee_invoice_id: string
  request_date: string
  requested_amount: string
  currency: string
  reviewer_id: string
  remark?: string | null
}

export interface FeePaymentRequestApprovePayload {
  approved_amount: string
  approved_at: string
  payment_account?: string | null
  remark?: string | null
}

export interface FeePaymentRequestList {
  items: FeePaymentRequest[]
  total: number
}

export interface FeePayableItem {
  partner_fee_invoice_id: string
  invoice_no: string
  partner_id: string | null
  partner_name: string
  partner_type: string | null
  shipment_plan_id: string | null
  shipment_no: string | null
  sales_user_id: string | null
  sales_user_name: string | null
  fee_type: string
  currency: string
  total_amount: string
  paid_amount: string
  payable_amount: string
  due_date: string | null
  status: string
}

export interface FeePayableList {
  items: FeePayableItem[]
  total: number
  total_payable_amount: string
}

export function listPartnerFeeInvoices(filters: {
  q?: string
  status?: string
  fee_type?: string
  partner_id?: string
  sales_user_id?: string
  shipment_no?: string
} = {}): Promise<PartnerFeeInvoiceList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.fee_type) params.set('fee_type', filters.fee_type)
  if (filters.partner_id) params.set('partner_id', filters.partner_id)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PartnerFeeInvoiceList>(`/finance/partner-fee-invoices${suffix}`)
}

export function createPartnerFeeInvoice(
  payload: PartnerFeeInvoiceCreatePayload,
): Promise<PartnerFeeInvoice> {
  return request<PartnerFeeInvoice>('/finance/partner-fee-invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listFeePaymentRequests(filters: {
  q?: string
  status?: string
  fee_type?: string
  partner_id?: string
  sales_user_id?: string
  shipment_no?: string
} = {}): Promise<FeePaymentRequestList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.fee_type) params.set('fee_type', filters.fee_type)
  if (filters.partner_id) params.set('partner_id', filters.partner_id)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<FeePaymentRequestList>(`/finance/fee-payment-requests${suffix}`)
}

export function createFeePaymentRequest(
  payload: FeePaymentRequestCreatePayload,
): Promise<FeePaymentRequest> {
  return request<FeePaymentRequest>('/finance/fee-payment-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveFeePaymentRequest(
  feePaymentRequestId: string,
  payload: FeePaymentRequestApprovePayload,
): Promise<FeePaymentRequest> {
  return request<FeePaymentRequest>(`/finance/fee-payment-requests/${feePaymentRequestId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listFeePayables(filters: {
  q?: string
  status?: string
  fee_type?: string
  partner_id?: string
  sales_user_id?: string
  shipment_no?: string
} = {}): Promise<FeePayableList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.fee_type) params.set('fee_type', filters.fee_type)
  if (filters.partner_id) params.set('partner_id', filters.partner_id)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<FeePayableList>(`/finance/fee-payables${suffix}`)
}
