import type {
  Customer,
  CustomerContact,
  CustomerCreatePayload,
  CustomerTransaction,
  CustomerUpdatePayload,
  Partner,
  PartnerContact as ApiPartnerContact,
  PartnerContactPayload as ApiPartnerContactPayload,
  PartnerCreatePayload as ApiPartnerCreatePayload,
  PartnerFeeRecord,
  PartnerUpdatePayload as ApiPartnerUpdatePayload,
  Supplier,
  SupplierContact,
  SupplierCreatePayload,
  SupplierTransaction,
  SupplierUpdatePayload,
} from '../../../api'

export type TradingPartnerKind = 'customer' | 'supplier' | 'partner'

export type PartnerEntity = Customer | Supplier | Partner
export type PartnerContact = CustomerContact | SupplierContact | ApiPartnerContact
export type PartnerTransaction = CustomerTransaction | SupplierTransaction | PartnerFeeRecord

export type PartnerListResult = {
  items: PartnerEntity[]
  total: number
}

export type TransactionListResult = {
  items: PartnerTransaction[]
  total: number
}

export type PartnerContactPayload = {
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  is_primary: boolean
}

export type PartnerCreatePayload = CustomerCreatePayload | SupplierCreatePayload | ApiPartnerCreatePayload
export type PartnerUpdatePayload = CustomerUpdatePayload | SupplierUpdatePayload | ApiPartnerUpdatePayload

export type PartnerFormState = {
  code: string
  cn_name: string
  en_name: string
  partner_type: string
  country: string
  address: string
  website: string
  status: string
  contact_name: string
  contact_title: string
  contact_email: string
  contact_phone: string
  contact_is_primary: boolean
  credit_grade: string
  credit_limit: string
  currency: string
  payment_terms: string
  risk_note: string
}

export type ContactFormState = {
  name: string
  title: string
  email: string
  phone: string
  is_primary: boolean
}

export const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
]

export const formStatusOptions = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
]

export const creditGradeOptions = [
  { value: '', label: '全部信用等级' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

export const formCreditGradeOptions = creditGradeOptions.filter((option) => option.value)

export const partnerTypeOptions = [
  { value: 'express', label: '快件公司' },
  { value: 'freight_forwarder', label: '货代公司' },
  { value: 'insurer', label: '保险公司' },
  { value: 'carrier', label: '运输公司' },
]

export function initialPartnerForm(prefix: string): PartnerFormState {
  return {
    code: `${prefix}-${Date.now().toString().slice(-6)}`,
    cn_name: '',
    en_name: '',
    partner_type: 'freight_forwarder',
    country: '',
    address: '',
    website: '',
    status: 'active',
    contact_name: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    contact_is_primary: true,
    credit_grade: 'A',
    credit_limit: '',
    currency: 'USD',
    payment_terms: '',
    risk_note: '',
  }
}

export function initialContactForm(contact?: PartnerContact): ContactFormState {
  return {
    name: contact?.name ?? '',
    title: contact?.title ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    is_primary: contact?.is_primary ?? false,
  }
}

export function entityToForm(entity: PartnerEntity): PartnerFormState {
  return {
    code: entity.code,
    cn_name: entity.cn_name,
    en_name: entity.en_name,
    partner_type: isPartnerEntity(entity) ? entity.partner_type : 'freight_forwarder',
    country: entity.country,
    address: entity.address ?? '',
    website: entity.website ?? '',
    status: entity.status,
    contact_name: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    contact_is_primary: true,
    credit_grade: hasCreditProfile(entity) ? entity.credit_profile?.credit_grade ?? 'A' : 'A',
    credit_limit: hasCreditProfile(entity) ? entity.credit_profile?.credit_limit ?? '' : '',
    currency: hasCreditProfile(entity) ? entity.credit_profile?.currency ?? 'USD' : 'USD',
    payment_terms: hasCreditProfile(entity) ? entity.credit_profile?.payment_terms ?? '' : '',
    risk_note: hasCreditProfile(entity) ? entity.credit_profile?.risk_note ?? '' : '',
  }
}

export function validatePartnerForm(
  form: PartnerFormState,
  requireCode: boolean,
  kind: TradingPartnerKind,
): string {
  if (requireCode && !form.code.trim()) return '请填写编号'
  if (!form.cn_name.trim()) return '请填写中文名称'
  if (!form.en_name.trim()) return '请填写英文名称'
  if (kind === 'partner' && !form.partner_type) return '请选择合作伙伴类型'
  if (!form.country.trim()) return '请填写国家/地区'
  return ''
}

export function partnerCreatePayload(
  form: PartnerFormState,
  kind: TradingPartnerKind,
): PartnerCreatePayload {
  const firstContact = contactPayload({
    name: form.contact_name,
    title: form.contact_title,
    email: form.contact_email,
    phone: form.contact_phone,
    is_primary: form.contact_is_primary,
  })
  const base = {
    code: form.code.trim(),
    cn_name: form.cn_name.trim(),
    en_name: form.en_name.trim(),
    country: form.country.trim(),
    address: emptyToNull(form.address),
    website: emptyToNull(form.website),
    status: form.status,
    contacts: firstContact.name ? [firstContact] : [],
  }
  if (kind === 'partner') {
    return {
      ...base,
      partner_type: form.partner_type,
      contacts: base.contacts as ApiPartnerContactPayload[],
    }
  }
  return {
    ...base,
    credit_profile: creditProfilePayload(form),
  }
}

export function partnerUpdatePayload(
  form: PartnerFormState,
  kind: TradingPartnerKind,
): PartnerUpdatePayload {
  const base = {
    cn_name: form.cn_name.trim(),
    en_name: form.en_name.trim(),
    country: form.country.trim(),
    address: emptyToNull(form.address),
    website: emptyToNull(form.website),
    status: form.status,
  }
  if (kind === 'partner') {
    return {
      ...base,
      partner_type: form.partner_type,
    }
  }
  return {
    ...base,
    credit_profile: creditProfilePayload(form),
  }
}

export function contactPayload(form: ContactFormState): PartnerContactPayload {
  return {
    name: form.name.trim(),
    title: emptyToNull(form.title),
    email: emptyToNull(form.email),
    phone: emptyToNull(form.phone),
    is_primary: form.is_primary,
  }
}

export function partnerTypeLabel(value: string): string {
  return partnerTypeOptions.find((item) => item.value === value)?.label ?? value
}

export function getContactEntityId(contact: PartnerContact): string {
  if ('customer_id' in contact) return contact.customer_id
  if ('supplier_id' in contact) return contact.supplier_id
  return contact.partner_id
}

function creditProfilePayload(form: PartnerFormState) {
  const hasCreditProfile = [
    form.credit_grade,
    form.credit_limit,
    form.currency,
    form.payment_terms,
    form.risk_note,
  ].some((value) => value.trim())
  if (!hasCreditProfile) return null
  return {
    credit_grade: form.credit_grade || 'A',
    credit_limit: form.credit_limit || '0',
    currency: form.currency.trim() || 'USD',
    payment_terms: form.payment_terms.trim() || '未设置',
    risk_note: emptyToNull(form.risk_note),
  }
}

function hasCreditProfile(entity: PartnerEntity): entity is Customer | Supplier {
  return 'credit_profile' in entity
}

function isPartnerEntity(entity: PartnerEntity): entity is Partner {
  return 'partner_type' in entity
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
