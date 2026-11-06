import { request } from './core'

// ---- 报销管理 (reimbursements) ----

export interface ReimbursementItem {
  id: string
  expense_item: string
  amount: string
  remark: string | null
}

export interface Reimbursement {
  id: string
  reimbursement_no: string
  applicant_user_id: string
  applicant_user_name: string
  department: string
  category: string
  currency: string
  amount: string
  reason: string | null
  status: string
  reviewer_id: string | null
  reviewer_name: string | null
  approved_by_user_id: string | null
  approved_by_user_name: string | null
  approval_remark: string | null
  payment_method: string | null
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  items: ReimbursementItem[]
}

export interface ReimbursementList {
  items: Reimbursement[]
  total: number
  total_amount: string
}

export interface ReimbursementItemCreatePayload {
  expense_item: string
  amount: string
  remark?: string | null
}

export interface ReimbursementCreatePayload {
  reimbursement_no: string
  applicant_user_id: string
  applicant_user_name: string
  department: string
  category: string
  currency: string
  amount: string
  reviewer_id: string
  reason?: string | null
  remark?: string | null
  items?: ReimbursementItemCreatePayload[]
}

export interface ReimbursementApprovePayload {
  approved: boolean
  approval_remark?: string | null
}

export interface ReimbursementPayPayload {
  payment_method: string
  remark?: string | null
}

// ---- 报销管理 API ----

export function listReimbursements(filters: {
  q?: string
  status?: string
  category?: string
  applicant_user_id?: string
} = {}): Promise<ReimbursementList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.category) params.set('category', filters.category)
  if (filters.applicant_user_id) params.set('applicant_user_id', filters.applicant_user_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ReimbursementList>(`/finance/reimbursements${suffix}`)
}

export function createReimbursement(payload: ReimbursementCreatePayload): Promise<Reimbursement> {
  return request<Reimbursement>('/finance/reimbursements', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveReimbursement(
  reimbursementId: string,
  payload: ReimbursementApprovePayload,
): Promise<Reimbursement> {
  return request<Reimbursement>(`/finance/reimbursements/${reimbursementId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function payReimbursement(
  reimbursementId: string,
  payload: ReimbursementPayPayload,
): Promise<Reimbursement> {
  return request<Reimbursement>(`/finance/reimbursements/${reimbursementId}/pay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
