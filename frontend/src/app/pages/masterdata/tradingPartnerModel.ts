import type {
  Customer,
  CustomerContact,
  CustomerTransaction,
  Supplier,
  SupplierContact,
  SupplierTransaction,
} from '../../../api'

export type PartnerEntity = Customer | Supplier
export type PartnerContact = CustomerContact | SupplierContact
export type PartnerTransaction = CustomerTransaction | SupplierTransaction

export type PartnerListResult = {
  items: PartnerEntity[]
  total: number
}

export type TransactionListResult = {
  items: PartnerTransaction[]
  total: number
}

export type PartnerCreatePayload = {
  code: string
  cn_name: string
  en_name: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  contacts: PartnerContactPayload[]
  credit_profile?: PartnerCreditProfilePayload | null
}

export type PartnerUpdatePayload = Omit<PartnerCreatePayload, 'code' | 'contacts'>

export type PartnerContactPayload = {
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  is_primary: boolean
}

export type PartnerCreditProfilePayload = {
  credit_grade: string
  credit_limit: string
  currency: string
  payment_terms: string
  risk_note?: string | null
}

export type PartnerFormState = {
  code: string
  cn_name: string
  en_name: string
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

export function initialPartnerForm(prefix: string): PartnerFormState {
  return {
    code: `${prefix}-${Date.now().toString().slice(-6)}`,
    cn_name: '',
    en_name: '',
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

export function initialContactForm(): ContactFormState {
  return {
    name: '',
    title: '',
    email: '',
    phone: '',
    is_primary: false,
  }
}

export function entityToForm(entity: PartnerEntity): PartnerFormState {
  return {
    code: entity.code,
    cn_name: entity.cn_name,
    en_name: entity.en_name,
    country: entity.country,
    address: entity.address ?? '',
    website: entity.website ?? '',
    status: entity.status,
    contact_name: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    contact_is_primary: true,
    credit_grade: entity.credit_profile?.credit_grade ?? 'A',
    credit_limit: entity.credit_profile?.credit_limit ?? '',
    currency: entity.credit_profile?.currency ?? 'USD',
    payment_terms: entity.credit_profile?.payment_terms ?? '',
    risk_note: entity.credit_profile?.risk_note ?? '',
  }
}

export function validatePartnerForm(form: PartnerFormState, requireCode: boolean): string {
  if (requireCode && !form.code.trim()) return '请填写编号'
  if (!form.cn_name.trim()) return '请填写中文名称'
  if (!form.en_name.trim()) return '请填写英文名称'
  if (!form.country.trim()) return '请填写国家/地区'
  return ''
}

export function partnerCreatePayload(form: PartnerFormState): PartnerCreatePayload {
  const firstContact = contactPayload({
    name: form.contact_name,
    title: form.contact_title,
    email: form.contact_email,
    phone: form.contact_phone,
    is_primary: form.contact_is_primary,
  })
  return {
    code: form.code.trim(),
    cn_name: form.cn_name.trim(),
    en_name: form.en_name.trim(),
    country: form.country.trim(),
    address: emptyToNull(form.address),
    website: emptyToNull(form.website),
    status: form.status,
    contacts: firstContact.name ? [firstContact] : [],
    credit_profile: creditProfilePayload(form),
  }
}

export function partnerUpdatePayload(form: PartnerFormState): PartnerUpdatePayload {
  return {
    cn_name: form.cn_name.trim(),
    en_name: form.en_name.trim(),
    country: form.country.trim(),
    address: emptyToNull(form.address),
    website: emptyToNull(form.website),
    status: form.status,
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

function creditProfilePayload(form: PartnerFormState): PartnerCreditProfilePayload | null {
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

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
