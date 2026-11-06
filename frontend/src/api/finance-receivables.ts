import { request } from './core'

export interface BankReceiptClaim {
  id: string
  receipt_id: string
  claimed_by_user_id: string
  claimed_by_user_name: string
  claimed_at: string
  note: string | null
}

export interface BankReceiptAllocation {
  id: string
  receipt_id: string
  allocation_type: string
  contract_id: string | null
  contract_no: string | null
  invoice_no: string | null
  allocated_at: string
  amount: string
  currency: string
  remark: string | null
}

export interface BankReceipt {
  id: string
  receipt_no: string
  received_at: string
  payer_name: string
  customer_id: string | null
  customer_name: string | null
  amount: string
  allocated_amount: string
  unallocated_amount: string
  currency: string
  bank_account: string
  reference_no: string | null
  receipt_type: string
  status: string
  claim_message: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  claims: BankReceiptClaim[]
  allocations: BankReceiptAllocation[]
}

export interface BankReceiptList {
  items: BankReceipt[]
  total: number
}

export interface BankReceiptCreatePayload {
  receipt_no: string
  received_at: string
  payer_name: string
  customer_id?: string | null
  customer_name?: string | null
  amount: string
  currency: string
  bank_account: string
  reference_no?: string | null
  receipt_type: string
  remark?: string | null
}

export interface BankReceiptClaimPayload {
  claimed_at: string
  sales_user_id?: string | null
  sales_user_name?: string | null
  note?: string | null
}

export interface BankReceiptAllocationPayload {
  allocation_type: string
  contract_id?: string | null
  contract_no?: string | null
  invoice_no?: string | null
  allocated_at: string
  amount: string
  currency: string
  remark?: string | null
}

export interface ReceivableItem {
  contract_id: string
  contract_no: string
  customer_id: string | null
  customer_name: string
  sales_user_id: string | null
  sales_user_name: string | null
  currency: string
  total_amount: string
  received_amount: string
  receivable_amount: string
  status: string
}

export interface ReceivableList {
  items: ReceivableItem[]
  total: number
  total_receivable_amount: string
}

export interface PaymentAllocation {
  id: string
  payment_request_id: string
  supplier_invoice_id: string
  allocated_at: string
  amount: string
  currency: string
  remark: string | null
}

export interface SupplierPaymentRequest {
  id: string
  request_no: string
  supplier_invoice_id: string
  supplier_invoice_no: string
  supplier_id: string | null
  supplier_name: string
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  payment_type: string
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

export interface SupplierInvoice {
  id: string
  invoice_no: string
  invoice_date: string
  supplier_id: string | null
  supplier_name: string
  purchase_invoice_notice_id: string | null
  purchase_invoice_notice_code: string | null
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  total_amount: string
  paid_amount: string
  unpaid_amount: string
  currency: string
  due_date: string | null
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  payment_requests: SupplierPaymentRequest[]
  allocations: PaymentAllocation[]
}

export interface SupplierInvoiceList {
  items: SupplierInvoice[]
  total: number
}

export interface SupplierInvoiceCreatePayload {
  invoice_no: string
  invoice_date: string
  supplier_id?: string | null
  supplier_name: string
  purchase_invoice_notice_id?: string | null
  purchase_invoice_notice_code?: string | null
  purchase_contract_id?: string | null
  purchase_contract_no?: string | null
  total_amount: string
  currency: string
  due_date?: string | null
  remark?: string | null
}

export interface PaymentRequestCreatePayload {
  request_no: string
  supplier_invoice_id: string
  payment_type: string
  request_date: string
  requested_amount: string
  currency: string
  reviewer_id: string
  remark?: string | null
}

export interface PaymentRequestApprovePayload {
  approved_amount: string
  approved_at: string
  payment_account?: string | null
  remark?: string | null
}

export interface SupplierPaymentRequestList {
  items: SupplierPaymentRequest[]
  total: number
}

export interface PayableItem {
  supplier_invoice_id: string
  invoice_no: string
  supplier_id: string | null
  supplier_name: string
  purchase_invoice_notice_id: string | null
  purchase_invoice_notice_code: string | null
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  currency: string
  total_amount: string
  paid_amount: string
  payable_amount: string
  due_date: string | null
  status: string
}

export interface PayableList {
  items: PayableItem[]
  total: number
  total_payable_amount: string
}

export function listBankReceipts(filters: {
  q?: string
  status?: string
  customer_id?: string
} = {}): Promise<BankReceiptList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<BankReceiptList>(`/finance/receipts${suffix}`)
}

export function createBankReceipt(payload: BankReceiptCreatePayload): Promise<BankReceipt> {
  return request<BankReceipt>('/finance/receipts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function claimBankReceipt(
  receiptId: string,
  payload: BankReceiptClaimPayload,
): Promise<BankReceipt> {
  return request<BankReceipt>(`/finance/receipts/${receiptId}/claim`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function allocateBankReceipt(
  receiptId: string,
  payload: BankReceiptAllocationPayload,
): Promise<BankReceipt> {
  return request<BankReceipt>(`/finance/receipts/${receiptId}/allocations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listReceivables(filters: {
  q?: string
  customer_id?: string
  sales_user_id?: string
  contract_no?: string
  invoice_no?: string
} = {}): Promise<ReceivableList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.contract_no) params.set('contract_no', filters.contract_no)
  if (filters.invoice_no) params.set('invoice_no', filters.invoice_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ReceivableList>(`/finance/receivables${suffix}`)
}

export function listSupplierInvoices(filters: {
  q?: string
  status?: string
  supplier_id?: string
  purchase_contract_no?: string
} = {}): Promise<SupplierInvoiceList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_no) params.set('purchase_contract_no', filters.purchase_contract_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SupplierInvoiceList>(`/finance/supplier-invoices${suffix}`)
}

export function createSupplierInvoice(
  payload: SupplierInvoiceCreatePayload,
): Promise<SupplierInvoice> {
  return request<SupplierInvoice>('/finance/supplier-invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPaymentRequests(filters: {
  q?: string
  status?: string
  payment_type?: string
  supplier_id?: string
} = {}): Promise<SupplierPaymentRequestList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.payment_type) params.set('payment_type', filters.payment_type)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SupplierPaymentRequestList>(`/finance/payment-requests${suffix}`)
}

export function createPaymentRequest(
  payload: PaymentRequestCreatePayload,
): Promise<SupplierPaymentRequest> {
  return request<SupplierPaymentRequest>('/finance/payment-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approvePaymentRequest(
  paymentRequestId: string,
  payload: PaymentRequestApprovePayload,
): Promise<SupplierPaymentRequest> {
  return request<SupplierPaymentRequest>(`/finance/payment-requests/${paymentRequestId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPayables(filters: {
  q?: string
  status?: string
  supplier_id?: string
  purchase_contract_no?: string
} = {}): Promise<PayableList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_no) params.set('purchase_contract_no', filters.purchase_contract_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PayableList>(`/finance/payables${suffix}`)
}
