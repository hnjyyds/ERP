import { request } from './core'

export interface PartnerContact {
  id: string
  partner_id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
}

export interface Partner {
  id: string
  code: string
  cn_name: string
  en_name: string
  partner_type: string
  country: string
  address: string | null
  website: string | null
  status: string
  owner_user_id: string
  contacts: PartnerContact[]
  primary_contact: PartnerContact | null
}

export interface PartnerList {
  items: Partner[]
  total: number
}

export interface PartnerContactPayload {
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  is_primary: boolean
}

export interface PartnerCreatePayload {
  code: string
  cn_name: string
  en_name: string
  partner_type: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  contacts: PartnerContactPayload[]
}

export interface PartnerUpdatePayload {
  cn_name: string
  en_name: string
  partner_type: string
  country: string
  address?: string | null
  website?: string | null
  status: string
}

export interface PartnerFeeRecord {
  source_type: string
  source_code: string
  occurred_at: string
  amount: string | null
  summary: string
}

export interface PartnerFeeRecordList {
  items: PartnerFeeRecord[]
  total: number
}

export interface DocumentParty {
  id: string
  code: string
  party_type: string
  display_name: string
  customer_id: string | null
  customer_name: string | null
  country: string
  address: string | null
  contact_person: string | null
  email: string | null
  phone: string | null
  bank_name: string | null
  swift_code: string | null
  account_no: string | null
  tax_id: string | null
  remarks: string | null
  is_default: boolean
  status: string
  owner_user_id: string
}

export interface DocumentPartyList {
  items: DocumentParty[]
  total: number
}

export interface DocumentPartyCreatePayload {
  code: string
  party_type: string
  display_name: string
  customer_id?: string | null
  customer_name?: string | null
  country: string
  address?: string | null
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  bank_name?: string | null
  swift_code?: string | null
  account_no?: string | null
  tax_id?: string | null
  remarks?: string | null
  is_default: boolean
  status: string
}

export type DocumentPartyUpdatePayload = Omit<DocumentPartyCreatePayload, 'code'>

export function listPartners(filters: {
  q?: string
  partner_type?: string
} = {}): Promise<PartnerList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.partner_type) params.set('partner_type', filters.partner_type)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PartnerList>(`/masterdata/partners${suffix}`)
}

export function createPartner(payload: PartnerCreatePayload): Promise<Partner> {
  return request<Partner>('/masterdata/partners', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePartner(
  partnerId: string,
  payload: PartnerUpdatePayload,
): Promise<Partner> {
  return request<Partner>(`/masterdata/partners/${partnerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deactivatePartner(partnerId: string): Promise<Partner> {
  return request<Partner>(`/masterdata/partners/${partnerId}`, {
    method: 'DELETE',
  })
}

export function addPartnerContact(
  partnerId: string,
  payload: PartnerContactPayload,
): Promise<PartnerContact> {
  return request<PartnerContact>(`/masterdata/partners/${partnerId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePartnerContact(
  partnerId: string,
  contactId: string,
  payload: PartnerContactPayload,
): Promise<PartnerContact> {
  return request<PartnerContact>(`/masterdata/partners/${partnerId}/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deletePartnerContact(
  partnerId: string,
  contactId: string,
): Promise<PartnerContact> {
  return request<PartnerContact>(`/masterdata/partners/${partnerId}/contacts/${contactId}`, {
    method: 'DELETE',
  })
}

export function listPartnerFeeRecords(partnerId: string): Promise<PartnerFeeRecordList> {
  return request<PartnerFeeRecordList>(`/masterdata/partners/${partnerId}/fee-records`)
}

export function listDocumentParties(filters: {
  q?: string
  party_type?: string
  customer_id?: string
} = {}): Promise<DocumentPartyList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.party_type) params.set('party_type', filters.party_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<DocumentPartyList>(`/masterdata/document-parties${suffix}`)
}

export function createDocumentParty(
  payload: DocumentPartyCreatePayload,
): Promise<DocumentParty> {
  return request<DocumentParty>('/masterdata/document-parties', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDocumentParty(
  partyId: string,
  payload: DocumentPartyUpdatePayload,
): Promise<DocumentParty> {
  return request<DocumentParty>(`/masterdata/document-parties/${partyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deactivateDocumentParty(partyId: string): Promise<DocumentParty> {
  return request<DocumentParty>(`/masterdata/document-parties/${partyId}`, {
    method: 'DELETE',
  })
}

export function lookupDocumentParties(filters: {
  party_type: string
  customer_id?: string
}): Promise<DocumentPartyList> {
  const params = new URLSearchParams()
  params.set('party_type', filters.party_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  return request<DocumentPartyList>(`/masterdata/document-parties/lookup?${params.toString()}`)
}
