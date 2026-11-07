import type {
  CompanyInfo,
  CompanyInfoUpdatePayload,
  OrganizationDataScope,
  OrganizationDepartment,
  OrganizationOptions,
  OrganizationPermission,
  OrganizationRole,
  OrganizationUser,
  UserAvatarType,
} from '../../../api'
import { defaultAvatarPreset } from '../../../shared/ui'
import { t, type TranslationKey } from '../../appI18n'

export const superAdminPermission = 'system:super_admin'

export type OrganizationUserFormState = {
  username: string
  display_name: string
  department_id: string
  role_ids: string[]
  is_active: boolean
  avatar_type: UserAvatarType
  avatar_value: string
}

export type OrganizationDepartmentFormState = {
  name: string
  parent_id: string | null
  sort_order: string
}

export type OrganizationRoleFormState = {
  name: string
  code: string
  data_scope: OrganizationDataScope
  permission_ids: string[]
}

export type CompanyInfoFormState = {
  name: string
  name_en: string
  letterhead: string
  address: string
  address_en: string
  phone: string
  fax: string
  email: string
  website: string
  tax_no: string
  bank_name: string
  bank_account: string
  bank_swift: string
}

export const COMPANY_FIELD_LABELS: Array<{
  key: keyof CompanyInfoFormState
  labelKey: TranslationKey
  full?: boolean
}> = [
  { key: 'name', labelKey: 'organization.company.field.name' },
  { key: 'name_en', labelKey: 'organization.company.field.nameEn' },
  { key: 'letterhead', labelKey: 'organization.company.field.letterhead', full: true },
  { key: 'address', labelKey: 'organization.company.field.address' },
  { key: 'address_en', labelKey: 'organization.company.field.addressEn' },
  { key: 'phone', labelKey: 'organization.company.field.phone' },
  { key: 'fax', labelKey: 'organization.company.field.fax' },
  { key: 'email', labelKey: 'organization.company.field.email' },
  { key: 'website', labelKey: 'organization.company.field.website' },
  { key: 'tax_no', labelKey: 'organization.company.field.taxNo' },
  { key: 'bank_name', labelKey: 'organization.company.field.bankName' },
  { key: 'bank_account', labelKey: 'organization.company.field.bankAccount' },
  { key: 'bank_swift', labelKey: 'organization.company.field.bankSwift' },
]

export function emptyCompanyForm(): CompanyInfoFormState {
  return {
    name: '',
    name_en: '',
    letterhead: '',
    address: '',
    address_en: '',
    phone: '',
    fax: '',
    email: '',
    website: '',
    tax_no: '',
    bank_name: '',
    bank_account: '',
    bank_swift: '',
  }
}

export function companyInfoToForm(info: CompanyInfo): CompanyInfoFormState {
  return {
    name: info.name ?? '',
    name_en: info.name_en ?? '',
    letterhead: info.letterhead ?? '',
    address: info.address ?? '',
    address_en: info.address_en ?? '',
    phone: info.phone ?? '',
    fax: info.fax ?? '',
    email: info.email ?? '',
    website: info.website ?? '',
    tax_no: info.tax_no ?? '',
    bank_name: info.bank_name ?? '',
    bank_account: info.bank_account ?? '',
    bank_swift: info.bank_swift ?? '',
  }
}

export function companyFormToPayload(form: CompanyInfoFormState): CompanyInfoUpdatePayload {
  const trimmed = (value: string) => {
    const next = value.trim()
    return next.length ? next : null
  }
  return {
    name: form.name.trim(),
    name_en: trimmed(form.name_en),
    letterhead: trimmed(form.letterhead),
    address: trimmed(form.address),
    address_en: trimmed(form.address_en),
    phone: trimmed(form.phone),
    fax: trimmed(form.fax),
    email: trimmed(form.email),
    website: trimmed(form.website),
    tax_no: trimmed(form.tax_no),
    bank_name: trimmed(form.bank_name),
    bank_account: trimmed(form.bank_account),
    bank_swift: trimmed(form.bank_swift),
  }
}

export type PasswordRevealState = {
  title: string
  username: string
  password: string
}

export type OrganizationPermissionSection = {
  key: string
  labelKey: TranslationKey | null
  fallbackLabel: string
  items: OrganizationPermission[]
}

export type OrganizationPermissionGroup = {
  key: string
  labelKey: TranslationKey
  sections: OrganizationPermissionSection[]
}

type PermissionSectionDefinition = {
  key: string
  labelKey: TranslationKey
  prefixes: string[]
}

type PermissionGroupDefinition = {
  key: string
  labelKey: TranslationKey
  sections: PermissionSectionDefinition[]
}

const permissionModuleLabelKeys: Record<string, TranslationKey> = {
  dashboard: 'organization.permission.module.dashboard',
  system: 'organization.permission.module.system',
  organization: 'organization.permission.module.organization',
  masterdata: 'organization.permission.module.masterdata',
  sample: 'organization.permission.module.sample',
  sales: 'organization.permission.module.sales',
  purchase: 'organization.permission.module.purchase',
  qualityWarehouse: 'organization.permission.module.qualityWarehouse',
  finance: 'organization.permission.module.finance',
  other: 'organization.permission.module.other',
}

const permissionSectionLabelKeys: Record<string, TranslationKey> = {
  'dashboard:dashboard': 'organization.permission.section.dashboard',
  'dashboard:schedule': 'organization.permission.section.schedule',
  'dashboard:announcement': 'organization.permission.section.announcement',
  'system:system': 'organization.permission.section.system',
  'organization:user': 'organization.permission.section.organizationUser',
  'organization:role': 'organization.permission.section.organizationRole',
  'masterdata:product': 'organization.permission.section.product',
  'masterdata:customer': 'organization.permission.section.customer',
  'masterdata:supplier': 'organization.permission.section.supplier',
  'masterdata:partner': 'organization.permission.section.partner',
  'masterdata:document_party': 'organization.permission.section.documentParty',
  'sample:request': 'organization.permission.section.sampleRequest',
  'sample:record': 'organization.permission.section.sampleRecord',
  'sample:delivery': 'organization.permission.section.sampleDelivery',
  'sales:quotation': 'organization.permission.section.quotation',
  'sales:contract': 'organization.permission.section.salesContract',
  'sales:shipment': 'organization.permission.section.shipment',
  'purchase:inquiry': 'organization.permission.section.inquiry',
  'purchase:contract': 'organization.permission.section.purchaseContract',
  'purchase:invoice_notice': 'organization.permission.section.invoiceNotice',
  'purchase:followup': 'organization.permission.section.purchaseFollowup',
  'followup:template': 'organization.permission.section.followupTemplate',
  'followup:plan': 'organization.permission.section.followupPlan',
  'quality:inspection': 'organization.permission.section.qualityInspection',
  'warehouse:inbound_plan': 'organization.permission.section.inboundPlan',
  'warehouse:inbound_order': 'organization.permission.section.inboundOrder',
  'warehouse:outbound_plan': 'organization.permission.section.outboundPlan',
  'warehouse:outbound_order': 'organization.permission.section.outboundOrder',
  'finance:finance': 'organization.permission.section.finance',
  'finance:reporting': 'organization.permission.section.reporting',
}

const sidebarPermissionCatalog: PermissionGroupDefinition[] = [
  {
    key: 'dashboard',
    labelKey: 'organization.permission.module.dashboard',
    sections: [
      {
        key: 'dashboard:dashboard',
        labelKey: 'organization.permission.section.dashboard',
        prefixes: ['dashboard:', 'schedule:', 'announcement:'],
      },
    ],
  },
  {
    key: 'system',
    labelKey: 'organization.permission.module.system',
    sections: [
      {
        key: 'system:organization',
        labelKey: 'organization.permission.section.organization',
        prefixes: ['system:', 'organization:'],
      },
    ],
  },
  {
    key: 'masterdata',
    labelKey: 'organization.permission.module.masterdata',
    sections: [
      { key: 'masterdata:product', labelKey: 'organization.permission.section.product', prefixes: ['masterdata:product:'] },
      { key: 'masterdata:customer', labelKey: 'organization.permission.section.customer', prefixes: ['masterdata:customer:'] },
      { key: 'masterdata:supplier', labelKey: 'organization.permission.section.supplier', prefixes: ['masterdata:supplier:'] },
      { key: 'masterdata:partner', labelKey: 'organization.permission.section.partner', prefixes: ['masterdata:partner:'] },
      { key: 'masterdata:document_party', labelKey: 'organization.permission.section.documentParty', prefixes: ['masterdata:document_party:'] },
    ],
  },
  {
    key: 'sample',
    labelKey: 'organization.permission.module.sample',
    sections: [
      { key: 'sample:request', labelKey: 'organization.permission.section.sampleRequest', prefixes: ['sample:request:'] },
      { key: 'sample:record', labelKey: 'organization.permission.section.sampleRecord', prefixes: ['sample:record:'] },
      { key: 'sample:delivery', labelKey: 'organization.permission.section.sampleDelivery', prefixes: ['sample:delivery:'] },
    ],
  },
  {
    key: 'sales',
    labelKey: 'organization.permission.module.sales',
    sections: [
      { key: 'sales:quotation', labelKey: 'organization.permission.section.quotation', prefixes: ['sales:quotation:'] },
      { key: 'sales:contract', labelKey: 'organization.permission.section.salesContract', prefixes: ['sales:contract:'] },
      { key: 'sales:shipment', labelKey: 'organization.permission.section.shipment', prefixes: ['sales:shipment:'] },
    ],
  },
  {
    key: 'purchase',
    labelKey: 'organization.permission.module.purchase',
    sections: [
      { key: 'purchase:inquiry', labelKey: 'organization.permission.section.inquiry', prefixes: ['purchase:inquiry:'] },
      { key: 'purchase:contract', labelKey: 'organization.permission.section.purchaseContract', prefixes: ['purchase:contract:'] },
      { key: 'purchase:invoice_notice', labelKey: 'organization.permission.section.invoiceNotice', prefixes: ['purchase:invoice_notice:'] },
      { key: 'purchase:followup', labelKey: 'organization.permission.section.purchaseFollowup', prefixes: ['followup:', 'purchase:followup:'] },
    ],
  },
  {
    key: 'qualityWarehouse',
    labelKey: 'organization.permission.module.qualityWarehouse',
    sections: [
      { key: 'quality:inspection', labelKey: 'organization.permission.section.qualityInspection', prefixes: ['quality:inspection:'] },
      { key: 'warehouse:inbound_plan', labelKey: 'organization.permission.section.inboundPlan', prefixes: ['warehouse:inbound_plan:'] },
      { key: 'warehouse:inbound_order', labelKey: 'organization.permission.section.inboundOrder', prefixes: ['warehouse:inbound_order:'] },
      { key: 'warehouse:outbound_plan', labelKey: 'organization.permission.section.outboundPlan', prefixes: ['warehouse:outbound_plan:'] },
      { key: 'warehouse:outbound_order', labelKey: 'organization.permission.section.outboundOrder', prefixes: ['warehouse:outbound_order:'] },
    ],
  },
  {
    key: 'finance',
    labelKey: 'organization.permission.module.finance',
    sections: [
      { key: 'finance:finance', labelKey: 'organization.permission.section.finance', prefixes: ['finance:'] },
      { key: 'finance:reporting', labelKey: 'organization.permission.section.reporting', prefixes: ['reporting:'] },
    ],
  },
]

const permissionSectionOrder = [
  'dashboard:dashboard',
  'dashboard:schedule',
  'dashboard:announcement',
  'system:system',
  'organization:user',
  'organization:role',
  'masterdata:product',
  'masterdata:customer',
  'masterdata:supplier',
  'masterdata:partner',
  'masterdata:document_party',
  'sample:request',
  'sample:record',
  'sample:delivery',
  'sales:quotation',
  'sales:contract',
  'sales:shipment',
  'purchase:inquiry',
  'purchase:contract',
  'purchase:invoice_notice',
  'purchase:followup',
  'followup:template',
  'followup:plan',
  'quality:inspection',
  'warehouse:inbound_plan',
  'warehouse:inbound_order',
  'warehouse:outbound_plan',
  'warehouse:outbound_order',
  'finance:finance',
  'finance:reporting',
]

const permissionActionOrder: Record<string, number> = {
  view: 10,
  view_all: 20,
  create: 30,
  edit: 40,
  approve: 50,
  export: 60,
  send: 70,
  'credit:view': 80,
  'credit:edit': 90,
  'fee:view': 100,
  'fee:edit': 110,
  allow_negative: 120,
  manage: 130,
  super_admin: 140,
}

function permissionModuleKey(permission: OrganizationPermission) {
  const namespace = permission.code.split(':')[0] ?? 'other'
  if (namespace === 'schedule' || namespace === 'announcement') return 'dashboard'
  if (namespace === 'followup') return 'purchase'
  if (namespace === 'quality' || namespace === 'warehouse') return 'qualityWarehouse'
  if (namespace === 'reporting') return 'finance'
  return permissionModuleLabelKeys[namespace] ? namespace : 'other'
}

function permissionSectionKey(permission: OrganizationPermission) {
  const [namespace, resource = 'general'] = permission.code.split(':')
  if (namespace === 'dashboard') return 'dashboard:dashboard'
  if (namespace === 'schedule') return 'dashboard:schedule'
  if (namespace === 'announcement') return 'dashboard:announcement'
  if (namespace === 'system') return 'system:system'
  if (namespace === 'finance') return 'finance:finance'
  if (namespace === 'reporting') return 'finance:reporting'
  return `${namespace ?? 'other'}:${resource}`
}

function permissionSectionLabelKey(permission: OrganizationPermission): TranslationKey | null {
  const key = permissionSectionKey(permission)
  return permissionSectionLabelKeys[key] ?? null
}

function permissionSectionFallbackLabel(permission: OrganizationPermission) {
  const key = permissionSectionKey(permission)
  const resource = key.split(':')[1] ?? key
  return resource
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function permissionSectionText(section: OrganizationPermissionSection) {
  return section.labelKey ? t(section.labelKey) : section.fallbackLabel
}

function permissionActionKey(permission: OrganizationPermission) {
  const parts = permission.code.split(':')
  return parts.slice(2).join(':') || parts[1] || permission.code
}

const permissionCategoryLabelKeys: Record<string, TranslationKey> = {
  functional: 'organization.permission.category.functional',
  data: 'organization.permission.category.data',
  field: 'organization.permission.category.field',
  process: 'organization.permission.category.process',
}

export function permissionCategoryLabel(permission: OrganizationPermission) {
  return t(permissionCategoryLabelKeys[permission.category] ?? permissionCategoryLabelKeys.functional)
}

function sortPermissions(items: OrganizationPermission[]) {
  return [...items].sort((left, right) => {
    const leftRank = permissionActionOrder[permissionActionKey(left)] ?? 999
    const rightRank = permissionActionOrder[permissionActionKey(right)] ?? 999
    return leftRank - rightRank || left.code.localeCompare(right.code)
  })
}

export function countSelectedPermissions(items: OrganizationPermission[], selectedIds: string[]) {
  return items.filter((permission) => selectedIds.includes(permission.id)).length
}

function orderedIndex(order: string[], key: string) {
  const index = order.indexOf(key)
  return index >= 0 ? index : order.length
}

function permissionMatchesSection(permission: OrganizationPermission, section: PermissionSectionDefinition) {
  return section.prefixes.some((prefix) => permission.code.startsWith(prefix))
}

export function groupOrganizationPermissions(
  permissions: OrganizationPermission[],
): OrganizationPermissionGroup[] {
  const usedPermissionIds = new Set<string>()
  const catalogGroups = sidebarPermissionCatalog.map((group) => ({
    key: group.key,
    labelKey: group.labelKey,
    sections: group.sections.map((section) => {
      const items = sortPermissions(permissions.filter((permission) => permissionMatchesSection(permission, section)))
      items.forEach((permission) => usedPermissionIds.add(permission.id))
      return {
        key: section.key,
        labelKey: section.labelKey,
        fallbackLabel: '',
        items,
      }
    }),
  }))

  const uncataloguedSections = new Map<string, OrganizationPermissionSection>()
  permissions.filter((permission) => !usedPermissionIds.has(permission.id)).forEach((permission) => {
    const moduleKey = permissionModuleKey(permission)
    const sectionKey = permissionSectionKey(permission)
    const key = `${moduleKey}:${sectionKey}`
    const section = uncataloguedSections.get(key) ?? {
      key: sectionKey,
      labelKey: permissionSectionLabelKey(permission),
      fallbackLabel: permissionSectionFallbackLabel(permission),
      items: [],
    }
    section.items.push(permission)
    uncataloguedSections.set(key, section)
  })

  if (!uncataloguedSections.size) return catalogGroups

  return [
    ...catalogGroups,
    {
      key: 'other',
      labelKey: 'organization.permission.module.other',
      sections: Array.from(uncataloguedSections.values())
        .sort((left, right) => orderedIndex(permissionSectionOrder, left.key) - orderedIndex(permissionSectionOrder, right.key))
        .map((section) => ({
          ...section,
          items: sortPermissions(section.items),
        })),
    },
  ]
}

function safeOrganizationText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function normalizeAvatarType(value: unknown): UserAvatarType {
  return value === 'upload' ? 'upload' : 'preset'
}

function normalizeOrganizationPermission(
  permission: Partial<OrganizationPermission> | null | undefined,
): OrganizationPermission {
  const code = safeOrganizationText(permission?.code)
  const name = safeOrganizationText(permission?.name, code || t('organization.permission.unnamed'))
  const category = safeOrganizationText(permission?.category, 'functional') || 'functional'
  return {
    id: safeOrganizationText(permission?.id, code || name),
    code,
    name,
    category,
  }
}

function normalizeOrganizationRole(role: Partial<OrganizationRole> | null | undefined): OrganizationRole {
  const code = safeOrganizationText(role?.code)
  const name = safeOrganizationText(role?.name, code || t('organization.role.unnamed'))
  return {
    id: safeOrganizationText(role?.id, code || name),
    name,
    code,
    data_scope: normalizeDataScope(role?.data_scope),
    permissions: Array.isArray(role?.permissions)
      ? role.permissions.map((permission) => normalizeOrganizationPermission(permission))
      : [],
  }
}

export const dataScopeOrder: OrganizationDataScope[] = ['self', 'department', 'department_tree', 'all']

export const dataScopeLabels: Record<OrganizationDataScope, TranslationKey> = {
  self: 'organization.role.dataScope.self',
  department: 'organization.role.dataScope.department',
  department_tree: 'organization.role.dataScope.departmentTree',
  all: 'organization.role.dataScope.all',
}

function normalizeDataScope(value: unknown): OrganizationDataScope {
  return dataScopeOrder.includes(value as OrganizationDataScope)
    ? (value as OrganizationDataScope)
    : 'self'
}

function normalizeOrganizationDepartment(
  department: Partial<OrganizationDepartment> | null | undefined,
): OrganizationDepartment {
  const name = safeOrganizationText(department?.name, t('organization.department.unnamed'))
  return {
    id: safeOrganizationText(department?.id, name),
    name,
    parent_id: typeof department?.parent_id === 'string' ? department.parent_id : null,
    sort_order: typeof department?.sort_order === 'number' ? department.sort_order : 0,
  }
}

function normalizeOrganizationUser(user: Partial<OrganizationUser> | null | undefined): OrganizationUser {
  const username = safeOrganizationText(user?.username, 'unknown')
  const displayName = safeOrganizationText(user?.display_name, username)
  return {
    id: safeOrganizationText(user?.id, username),
    username,
    display_name: displayName,
    department_id: typeof user?.department_id === 'string' ? user.department_id : null,
    department_name: safeOrganizationText(user?.department_name, t('organization.user.unassignedDepartment')),
    avatar_type: normalizeAvatarType(user?.avatar_type),
    avatar_value: safeOrganizationText(user?.avatar_value, defaultAvatarPreset),
    roles: Array.isArray(user?.roles) ? user.roles.map((role) => normalizeOrganizationRole(role)) : [],
    is_active: typeof user?.is_active === 'boolean' ? user.is_active : true,
    created_at: safeOrganizationText(user?.created_at),
    password_set: typeof user?.password_set === 'boolean' ? user.password_set : true,
  }
}

export function normalizeOrganizationOptions(
  options: Partial<OrganizationOptions> | null | undefined,
): OrganizationOptions {
  return {
    departments: Array.isArray(options?.departments)
      ? options.departments.map((department) => normalizeOrganizationDepartment(department))
      : [],
    roles: Array.isArray(options?.roles) ? options.roles.map((role) => normalizeOrganizationRole(role)) : [],
    permissions: Array.isArray(options?.permissions)
      ? options.permissions.map((permission) => normalizeOrganizationPermission(permission))
      : [],
  }
}

export function normalizeOrganizationUserList(
  userList: Partial<{ users: Array<Partial<OrganizationUser> | null | undefined> }> | null | undefined,
) {
  return Array.isArray(userList?.users) ? userList.users.map((user) => normalizeOrganizationUser(user)) : []
}

export function formatOrganizationDateTime(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}
