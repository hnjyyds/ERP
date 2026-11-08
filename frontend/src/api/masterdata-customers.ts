import { request } from './core'

export interface CustomerContact {
  id: string
  customer_id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
}

export interface CustomerCreditProfile {
  credit_grade: string
  credit_limit: string | null
  currency: string
  payment_terms: string
  risk_note: string | null
}

export interface Customer {
  id: string
  code: string
  cn_name: string
  en_name: string
  country: string
  address: string | null
  website: string | null
  status: string
  owner_user_id: string
  contacts: CustomerContact[]
  primary_contact: CustomerContact | null
  credit_profile: CustomerCreditProfile | null
}

export interface CustomerListSummary {
  active_count: number
  contact_count: number
  credit_profile_count: number
}

export interface CustomerList {
  items: Customer[]
  total: number
  summary: CustomerListSummary
}

export interface CustomerContactPayload {
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  is_primary: boolean
}

export interface CustomerCreditProfilePayload {
  credit_grade: string
  credit_limit: string
  currency: string
  payment_terms: string
  risk_note?: string | null
}

export interface CustomerCreatePayload {
  code: string
  cn_name: string
  en_name: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  contacts: CustomerContactPayload[]
  credit_profile?: CustomerCreditProfilePayload | null
}

export interface CustomerUpdatePayload {
  cn_name: string
  en_name: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  credit_profile?: CustomerCreditProfilePayload | null
}

export interface CustomerTransaction {
  source_type: string
  source_code: string
  occurred_at: string
  amount: string | null
  summary: string
}

export interface CustomerTransactionList {
  items: CustomerTransaction[]
  total: number
}

export function listCustomers(filters: {
  q?: string
  country?: string
  credit_grade?: string
  status?: string
  limit?: number
  offset?: number
} = {}): Promise<CustomerList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.country) params.set('country', filters.country)
  if (filters.credit_grade) params.set('credit_grade', filters.credit_grade)
  if (filters.status) params.set('status', filters.status)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<CustomerList>(`/masterdata/customers${suffix}`)
}

export function createCustomer(payload: CustomerCreatePayload): Promise<Customer> {
  return request<Customer>('/masterdata/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCustomer(
  customerId: string,
  payload: CustomerUpdatePayload,
): Promise<Customer> {
  return request<Customer>(`/masterdata/customers/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deactivateCustomer(customerId: string): Promise<Customer> {
  return request<Customer>(`/masterdata/customers/${customerId}`, {
    method: 'DELETE',
  })
}

export function addCustomerContact(
  customerId: string,
  payload: CustomerContactPayload,
): Promise<CustomerContact> {
  return request<CustomerContact>(`/masterdata/customers/${customerId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCustomerContact(
  customerId: string,
  contactId: string,
  payload: CustomerContactPayload,
): Promise<CustomerContact> {
  return request<CustomerContact>(`/masterdata/customers/${customerId}/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteCustomerContact(
  customerId: string,
  contactId: string,
): Promise<CustomerContact> {
  return request<CustomerContact>(`/masterdata/customers/${customerId}/contacts/${contactId}`, {
    method: 'DELETE',
  })
}

export function listCustomerTransactions(customerId: string): Promise<CustomerTransactionList> {
  return request<CustomerTransactionList>(`/masterdata/customers/${customerId}/transactions`)
}
