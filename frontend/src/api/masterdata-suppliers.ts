import { request } from './core'

export interface SupplierContact {
  id: string
  supplier_id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
}

export interface SupplierCreditProfile {
  credit_grade: string
  credit_limit: string | null
  currency: string
  payment_terms: string
  risk_note: string | null
}

export interface Supplier {
  id: string
  code: string
  cn_name: string
  en_name: string
  country: string
  address: string | null
  website: string | null
  status: string
  owner_user_id: string
  contacts: SupplierContact[]
  primary_contact: SupplierContact | null
  credit_profile: SupplierCreditProfile | null
}

export interface SupplierListSummary {
  active_count: number
  contact_count: number
  credit_profile_count: number
}

export interface SupplierList {
  items: Supplier[]
  total: number
  summary: SupplierListSummary
}

export interface SupplierContactPayload {
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  is_primary: boolean
}

export interface SupplierCreditProfilePayload {
  credit_grade: string
  credit_limit: string
  currency: string
  payment_terms: string
  risk_note?: string | null
}

export interface SupplierCreatePayload {
  code: string
  cn_name: string
  en_name: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  contacts: SupplierContactPayload[]
  credit_profile?: SupplierCreditProfilePayload | null
}

export interface SupplierUpdatePayload {
  cn_name: string
  en_name: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  credit_profile?: SupplierCreditProfilePayload | null
}

export interface SupplierTransaction {
  source_type: string
  source_code: string
  occurred_at: string
  amount: string | null
  summary: string
}

export interface SupplierTransactionList {
  items: SupplierTransaction[]
  total: number
}

export function listSuppliers(filters: {
  q?: string
  country?: string
  credit_grade?: string
  status?: string
  limit?: number
  offset?: number
} = {}): Promise<SupplierList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.country) params.set('country', filters.country)
  if (filters.credit_grade) params.set('credit_grade', filters.credit_grade)
  if (filters.status) params.set('status', filters.status)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SupplierList>(`/masterdata/suppliers${suffix}`)
}

export function createSupplier(payload: SupplierCreatePayload): Promise<Supplier> {
  return request<Supplier>('/masterdata/suppliers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSupplier(
  supplierId: string,
  payload: SupplierUpdatePayload,
): Promise<Supplier> {
  return request<Supplier>(`/masterdata/suppliers/${supplierId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deactivateSupplier(supplierId: string): Promise<Supplier> {
  return request<Supplier>(`/masterdata/suppliers/${supplierId}`, {
    method: 'DELETE',
  })
}

export function addSupplierContact(
  supplierId: string,
  payload: SupplierContactPayload,
): Promise<SupplierContact> {
  return request<SupplierContact>(`/masterdata/suppliers/${supplierId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSupplierContact(
  supplierId: string,
  contactId: string,
  payload: SupplierContactPayload,
): Promise<SupplierContact> {
  return request<SupplierContact>(`/masterdata/suppliers/${supplierId}/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteSupplierContact(
  supplierId: string,
  contactId: string,
): Promise<SupplierContact> {
  return request<SupplierContact>(`/masterdata/suppliers/${supplierId}/contacts/${contactId}`, {
    method: 'DELETE',
  })
}

export function listSupplierTransactions(supplierId: string): Promise<SupplierTransactionList> {
  return request<SupplierTransactionList>(`/masterdata/suppliers/${supplierId}/transactions`)
}
