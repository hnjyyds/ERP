import { Modal, Select, Skeleton } from 'antd'
import {
  Building2,
  Copy,
  Pencil,
  KeyRound,
  LayoutDashboard,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import {
  createOrganizationDepartment,
  createOrganizationRole,
  createOrganizationUser,
  deleteOrganizationDepartment,
  deleteOrganizationRole,
  deleteOrganizationUser,
  getCompanyInfo,
  getOrganizationOptions,
  listOrganizationUsers,
  resetOrganizationUserPassword,
  updateCompanyInfo,
  updateOrganizationDepartment,
  updateOrganizationRole,
  updateOrganizationRolePermissions,
  updateOrganizationUser,
  type CompanyInfo,
  type CompanyInfoUpdatePayload,
  type CurrentUser,
  type OrganizationDataScope,
  type OrganizationDepartment,
  type OrganizationDepartmentCreatePayload,
  type OrganizationDepartmentUpdatePayload,
  type OrganizationOptions,
  type OrganizationPermission,
  type OrganizationPasswordResetResult,
  type OrganizationRole,
  type OrganizationRoleCreatePayload,
  type OrganizationRolePermissionUpdatePayload,
  type OrganizationRoleUpdatePayload,
  type OrganizationUser,
  type OrganizationUserCreatePayload,
  type OrganizationUserCreateResult,
  type OrganizationUserUpdatePayload,
  type UserAvatarType,
} from '../../../api'
import { showError } from '../../../shared/errors'
import { Metric, UserAvatar, UserAvatarPicker, defaultAvatarPreset } from '../../../shared/ui'
import { t, type TranslationKey } from '../../appI18n'

const superAdminPermission = 'system:super_admin'

type OrganizationUserFormState = {
  username: string
  display_name: string
  department_id: string
  role_ids: string[]
  is_active: boolean
  avatar_type: UserAvatarType
  avatar_value: string
}

type OrganizationDepartmentFormState = {
  name: string
  parent_id: string | null
  sort_order: string
}

type OrganizationRoleFormState = {
  name: string
  code: string
  data_scope: OrganizationDataScope
  permission_ids: string[]
}

type CompanyInfoFormState = {
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

const COMPANY_FIELD_LABELS: Array<{
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

function emptyCompanyForm(): CompanyInfoFormState {
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

function companyInfoToForm(info: CompanyInfo): CompanyInfoFormState {
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

function companyFormToPayload(form: CompanyInfoFormState): CompanyInfoUpdatePayload {
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

type PasswordRevealState = {
  title: string
  username: string
  password: string
}

type OrganizationPermissionSection = {
  key: string
  labelKey: TranslationKey | null
  fallbackLabel: string
  items: OrganizationPermission[]
}

type OrganizationPermissionGroup = {
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

const _permissionModuleOrder = [
  'dashboard',
  'system',
  'organization',
  'masterdata',
  'sample',
  'sales',
  'purchase',
  'qualityWarehouse',
  'finance',
  'other',
]

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

function permissionSectionText(section: OrganizationPermissionSection) {
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

function permissionCategoryLabel(permission: OrganizationPermission) {
  return t(permissionCategoryLabelKeys[permission.category] ?? permissionCategoryLabelKeys.functional)
}

function sortPermissions(items: OrganizationPermission[]) {
  return [...items].sort((left, right) => {
    const leftRank = permissionActionOrder[permissionActionKey(left)] ?? 999
    const rightRank = permissionActionOrder[permissionActionKey(right)] ?? 999
    return leftRank - rightRank || left.code.localeCompare(right.code)
  })
}

function countSelectedPermissions(items: OrganizationPermission[], selectedIds: string[]) {
  return items.filter((permission) => selectedIds.includes(permission.id)).length
}

function orderedIndex(order: string[], key: string) {
  const index = order.indexOf(key)
  return index >= 0 ? index : order.length
}

function permissionMatchesSection(permission: OrganizationPermission, section: PermissionSectionDefinition) {
  return section.prefixes.some((prefix) => permission.code.startsWith(prefix))
}

function groupOrganizationPermissions(permissions: OrganizationPermission[]): OrganizationPermissionGroup[] {
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

const dataScopeOrder: OrganizationDataScope[] = ['self', 'department', 'department_tree', 'all']

const dataScopeLabels: Record<OrganizationDataScope, TranslationKey> = {
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

function normalizeOrganizationOptions(
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

function normalizeOrganizationUserList(
  userList: Partial<{ users: Array<Partial<OrganizationUser> | null | undefined> }> | null | undefined,
) {
  return Array.isArray(userList?.users) ? userList.users.map((user) => normalizeOrganizationUser(user)) : []
}

function formatOrganizationDateTime(value: string | null) {
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

type OrganizationUsersPageProps = {
  currentUser: CurrentUser
}

export function OrganizationUsersPage({ currentUser }: OrganizationUsersPageProps) {
  const canManageOrganization = currentUser.permissions.includes(superAdminPermission)
  const [users, setUsers] = useState<OrganizationUser[]>([])
  const [departments, setDepartments] = useState<OrganizationDepartment[]>([])
  const [roles, setRoles] = useState<OrganizationRole[]>([])
  const [permissions, setPermissions] = useState<OrganizationPermission[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [permissionFormIds, setPermissionFormIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit' | null>(null)
  const [departmentModalMode, setDepartmentModalMode] = useState<'create' | 'edit' | null>(null)
  const [roleModalMode, setRoleModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingRoleId, setEditingRoleId] = useState('')
  const [form, setForm] = useState<OrganizationUserFormState>(() => ({
    username: '',
    display_name: '',
    department_id: '',
    role_ids: [],
    is_active: true,
    avatar_type: 'preset',
    avatar_value: defaultAvatarPreset,
  }))
  const [departmentForm, setDepartmentForm] = useState<OrganizationDepartmentFormState>(() => ({
    name: '',
    parent_id: null,
    sort_order: '0',
  }))
  const [roleForm, setRoleForm] = useState<OrganizationRoleFormState>(() => ({
    name: '',
    code: '',
    data_scope: 'self',
    permission_ids: [],
  }))
  const [passwordReveal, setPasswordReveal] = useState<PasswordRevealState | null>(null)
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [companyForm, setCompanyForm] = useState<CompanyInfoFormState>(() => emptyCompanyForm())
  const [companyUpdatedAt, setCompanyUpdatedAt] = useState<string | null>(null)
  const [companyLoaded, setCompanyLoaded] = useState(false)

  useEffect(() => {
    if (!canManageOrganization) {
      setLoading(false)
      setActionError(t('organization.message.noPermission'))
      return
    }
    void loadOrganization()
    void loadCompanyInfo()
  }, [canManageOrganization])

  const activeUsers = users.filter((user) => user.is_active)
  const inactiveUsers = users.filter((user) => !user.is_active)
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null
  const selectedDepartment =
    departments.find((department) => department.id === selectedDepartmentId) ?? departments[0] ?? null
  const permissionGroups = groupOrganizationPermissions(permissions)
  const filteredUsers = users.filter((user) => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return true
    return [user.username, user.display_name, user.department_name, user.roles.map((role) => role.name).join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })

  async function loadOrganization(nextSelectedId?: string, nextRoleId?: string, nextDepartmentId?: string) {
    setLoading(true)
    setActionError('')
    try {
      const [options, userList] = await Promise.all([getOrganizationOptions(), listOrganizationUsers()])
      const normalizedOptions = normalizeOrganizationOptions(options)
      const normalizedUsers = normalizeOrganizationUserList(userList)
      setDepartments(normalizedOptions.departments)
      setRoles(normalizedOptions.roles)
      setPermissions(normalizedOptions.permissions)
      setUsers(normalizedUsers)
      const preferredId =
        nextSelectedId ??
        (selectedUserId && normalizedUsers.some((user) => user.id === selectedUserId) ? selectedUserId : '')
      setSelectedUserId(preferredId || normalizedUsers[0]?.id || '')
      const preferredRoleId =
        nextRoleId ??
        (selectedRoleId && normalizedOptions.roles.some((role) => role.id === selectedRoleId)
          ? selectedRoleId
          : '')
      const nextRole =
        normalizedOptions.roles.find((role) => role.id === preferredRoleId) ?? normalizedOptions.roles[0] ?? null
      setSelectedRoleId(nextRole?.id ?? '')
      setPermissionFormIds(nextRole?.permissions.map((permission) => permission.id) ?? [])
      const preferredDepartmentId =
        nextDepartmentId ??
        (selectedDepartmentId &&
        normalizedOptions.departments.some((department) => department.id === selectedDepartmentId)
          ? selectedDepartmentId
          : '')
      setSelectedDepartmentId(preferredDepartmentId || normalizedOptions.departments[0]?.id || '')
    } catch (caught) {
      showError(caught, t('organization.message.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadCompanyInfo() {
    try {
      const info = await getCompanyInfo()
      setCompanyInfo(info)
      setCompanyForm(companyInfoToForm(info))
      setCompanyUpdatedAt(info.updated_at)
    } catch {
      // 公司信息加载失败不阻塞组织管理主流程。
    } finally {
      setCompanyLoaded(true)
    }
  }

  function openCompanyModal() {
    setCompanyForm(companyInfo ? companyInfoToForm(companyInfo) : emptyCompanyForm())
    setActionError('')
    setCompanyModalOpen(true)
  }

  function closeCompanyModal() {
    setCompanyForm(companyInfo ? companyInfoToForm(companyInfo) : emptyCompanyForm())
    setCompanyModalOpen(false)
  }

  async function handleSaveCompanyInfo(event: FormEvent) {
    event.preventDefault()
    if (!companyForm.name.trim()) {
      setActionError(t('organization.company.validation.nameRequired'))
      return
    }
    setActionError('')
    setBusyAction('company-save')
    try {
      const updated = await updateCompanyInfo(companyFormToPayload(companyForm))
      setCompanyInfo(updated)
      setCompanyForm(companyInfoToForm(updated))
      setCompanyUpdatedAt(updated.updated_at)
      setCompanyModalOpen(false)
      setActionMessage(t('organization.company.message.saved'))
    } catch (caught) {
      showError(caught, t('organization.company.message.saveFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  function resetCreateForm() {
    setForm({
      username: '',
      display_name: '',
      department_id: departments[0]?.id ?? '',
      role_ids: roles[0] ? [roles[0].id] : [],
      is_active: true,
      avatar_type: 'preset',
      avatar_value: defaultAvatarPreset,
    })
  }

  function openCreateModal() {
    if (!departments.length) {
      setActionError(t('organization.user.message.departmentRequiredFirst'))
      return
    }
    resetCreateForm()
    setUserModalMode('create')
  }

  function openEditModal(user: OrganizationUser) {
    setForm({
      username: user.username,
      display_name: user.display_name,
      department_id: user.department_id ?? departments[0]?.id ?? '',
      role_ids: user.roles.map((role) => role.id),
      is_active: user.is_active,
      avatar_type: user.avatar_type,
      avatar_value: user.avatar_value || defaultAvatarPreset,
    })
    setUserModalMode('edit')
  }

  function resetDepartmentForm(department?: OrganizationDepartment) {
    setDepartmentForm({
      name: department?.name ?? '',
      parent_id: department?.parent_id ?? null,
      sort_order: String(department?.sort_order ?? departments.length * 10),
    })
  }

  function openCreateDepartmentModal() {
    resetDepartmentForm()
    setDepartmentModalMode('create')
  }

  function openEditDepartmentModal(department: OrganizationDepartment) {
    setSelectedDepartmentId(department.id)
    resetDepartmentForm(department)
    setDepartmentModalMode('edit')
  }

  function toggleRole(roleId: string) {
    setForm((current) => {
      const exists = current.role_ids.includes(roleId)
      return {
        ...current,
        role_ids: exists
          ? current.role_ids.filter((id) => id !== roleId)
          : [...current.role_ids, roleId],
      }
    })
  }

  function selectRoleForPermissions(role: OrganizationRole) {
    setSelectedRoleId(role.id)
    setPermissionFormIds(role.permissions.map((permission) => permission.id))
  }

  function selectRoleIdForPermissions(roleId: string) {
    const role = roles.find((item) => item.id === roleId)
    if (role) selectRoleForPermissions(role)
  }

  function togglePermission(permissionId: string) {
    setPermissionFormIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
    )
  }

  function setPermissionIds(permissionIds: string[], shouldSelect: boolean) {
    setPermissionFormIds((current) => {
      const next = new Set(current)
      permissionIds.forEach((permissionId) => {
        if (shouldSelect) {
          next.add(permissionId)
        } else {
          next.delete(permissionId)
        }
      })
      return Array.from(next)
    })
  }

  function setSectionPermissions(section: OrganizationPermissionSection, shouldSelect: boolean) {
    setPermissionIds(section.items.map((permission) => permission.id), shouldSelect)
  }

  function setGroupPermissions(group: OrganizationPermissionGroup, shouldSelect: boolean) {
    setPermissionIds(
      group.sections.flatMap((section) => section.items.map((permission) => permission.id)),
      shouldSelect,
    )
  }

  async function submitRolePermissions() {
    if (!selectedRole) return
    setBusyAction(`permissions-${selectedRole.id}`)
    setActionError('')
    setActionMessage('')
    try {
      const payload: OrganizationRolePermissionUpdatePayload = {
        permission_ids: permissionFormIds,
      }
      const updated = await updateOrganizationRolePermissions(selectedRole.id, payload)
      setActionMessage(t('organization.permission.message.updated', { name: updated.name }))
      await loadOrganization(undefined, updated.id)
    } catch (caught) {
      showError(caught, t('organization.permission.message.saveFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  async function copyPassword(password: string) {
    try {
      await navigator.clipboard.writeText(password)
      setActionMessage(t('organization.message.passwordCopied'))
    } catch {
      setActionError(t('organization.message.copyFailed'))
    }
  }

  async function submitUserForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (userModalMode === 'create' && !departments.length) {
      setActionError(t('organization.user.message.departmentRequiredFirst'))
      return
    }
    if (!form.username.trim() || !form.display_name.trim()) {
      setActionError(t('organization.user.validation.required'))
      return
    }
    if (!form.department_id) {
      setActionError(t('organization.user.validation.departmentRequired'))
      return
    }
    setBusyAction(userModalMode ?? 'user')
    setActionError('')
    setActionMessage('')
    try {
      if (userModalMode === 'create') {
        const payload: OrganizationUserCreatePayload = {
          username: form.username.trim(),
          display_name: form.display_name.trim(),
          department_id: form.department_id,
          role_ids: form.role_ids,
          is_active: form.is_active,
          avatar_type: form.avatar_type,
          avatar_value: form.avatar_value,
        }
        const created: OrganizationUserCreateResult = await createOrganizationUser(payload)
        setUserModalMode(null)
        setPasswordReveal({
          title: t('organization.user.modal.initialPasswordTitle'),
          username: created.user.username,
          password: created.initial_password,
        })
        setActionMessage(t('organization.user.message.created'))
        await loadOrganization(created.user.id)
      }
      if (userModalMode === 'edit' && selectedUser) {
        const payload: OrganizationUserUpdatePayload = {
          display_name: form.display_name.trim(),
          department_id: form.department_id,
          role_ids: form.role_ids,
          is_active: form.is_active,
          avatar_type: form.avatar_type,
          avatar_value: form.avatar_value,
        }
        const updated = await updateOrganizationUser(selectedUser.id, payload)
        setUserModalMode(null)
        setActionMessage(t('organization.user.message.updated'))
        await loadOrganization(updated.id)
      }
    } catch (caught) {
      showError(caught, t('organization.message.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  async function submitDepartmentForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = departmentForm.name.trim()
    if (!name) {
      setActionError(t('organization.department.validation.nameRequired'))
      return
    }
    const sortOrder = Number.parseInt(departmentForm.sort_order, 10)
    setBusyAction(departmentModalMode === 'edit' ? `department-${selectedDepartment?.id}` : 'department')
    setActionError('')
    setActionMessage('')
    try {
      if (departmentModalMode === 'create') {
        const payload: OrganizationDepartmentCreatePayload = {
          name,
          parent_id: departmentForm.parent_id || null,
          sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
        }
        const created = await createOrganizationDepartment(payload)
        setDepartmentModalMode(null)
        setActionMessage(t('organization.department.message.created'))
        await loadOrganization(undefined, undefined, created.id)
      }
      if (departmentModalMode === 'edit' && selectedDepartment) {
        const payload: OrganizationDepartmentUpdatePayload = {
          name,
          parent_id: departmentForm.parent_id || null,
          sort_order: Number.isNaN(sortOrder) ? selectedDepartment.sort_order : sortOrder,
        }
        const updated = await updateOrganizationDepartment(selectedDepartment.id, payload)
        setDepartmentModalMode(null)
        setActionMessage(t('organization.department.message.updated'))
        await loadOrganization(undefined, undefined, updated.id)
      }
    } catch (caught) {
      showError(caught, t('organization.department.message.saveFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  function openCreateRoleModal() {
    setEditingRoleId('')
    setRoleForm({ name: '', code: '', data_scope: 'self', permission_ids: [] })
    setRoleModalMode('create')
  }

  function openEditRoleModal(role: OrganizationRole) {
    setEditingRoleId(role.id)
    setRoleForm({
      name: role.name,
      code: role.code,
      data_scope: role.data_scope,
      permission_ids: role.permissions.map((permission) => permission.id),
    })
    setRoleModalMode('edit')
  }

  function toggleRoleFormPermission(permissionId: string) {
    setRoleForm((current) => ({
      ...current,
      permission_ids: current.permission_ids.includes(permissionId)
        ? current.permission_ids.filter((id) => id !== permissionId)
        : [...current.permission_ids, permissionId],
    }))
  }

  function setRoleFormSectionPermissions(section: OrganizationPermissionSection, shouldSelect: boolean) {
    setRoleForm((current) => {
      const next = new Set(current.permission_ids)
      section.items.forEach((permission) => {
        if (shouldSelect) next.add(permission.id)
        else next.delete(permission.id)
      })
      return { ...current, permission_ids: Array.from(next) }
    })
  }

  async function submitRoleForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = roleForm.name.trim()
    const code = roleForm.code.trim()
    if (!name) {
      setActionError(t('organization.role.validation.nameRequired'))
      return
    }
    if (!/^[a-z][a-z0-9_]*$/.test(code)) {
      setActionError(t('organization.role.validation.codeInvalid'))
      return
    }
    setBusyAction(roleModalMode === 'edit' ? `role-${editingRoleId}` : 'role')
    setActionError('')
    setActionMessage('')
    try {
      if (roleModalMode === 'create') {
        const payload: OrganizationRoleCreatePayload = {
          name,
          code,
          data_scope: roleForm.data_scope,
          permission_ids: roleForm.permission_ids,
        }
        const created = await createOrganizationRole(payload)
        setRoleModalMode(null)
        setActionMessage(t('organization.role.message.created'))
        await loadOrganization(undefined, created.id)
      }
      if (roleModalMode === 'edit' && editingRoleId) {
        const payload: OrganizationRoleUpdatePayload = { name, code, data_scope: roleForm.data_scope }
        const updated = await updateOrganizationRole(editingRoleId, payload)
        setRoleModalMode(null)
        setActionMessage(t('organization.role.message.updated'))
        await loadOrganization(undefined, updated.id)
      }
    } catch (caught) {
      showError(caught, t('organization.role.message.saveFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  function confirmDeleteRole(role: OrganizationRole) {
    const relatedUsers = users.filter((user) => user.roles.some((item) => item.id === role.id))
    Modal.confirm({
      centered: true,
      title: t('organization.role.modal.deleteTitle'),
      content: relatedUsers.length
        ? t('organization.role.message.assignedToUsers', { name: role.name, count: relatedUsers.length })
        : t('organization.role.message.deleteConfirm', { name: role.name }),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true, disabled: relatedUsers.length > 0 },
      onOk: async () => {
        if (relatedUsers.length) return
        setBusyAction(`role-delete-${role.id}`)
        setActionError('')
        setActionMessage('')
        try {
          await deleteOrganizationRole(role.id)
          setActionMessage(t('organization.role.message.deleted'))
          await loadOrganization()
        } catch (caught) {
          showError(caught, t('organization.role.message.deleteFailed'))
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  function confirmDeactivate(user: OrganizationUser) {
    Modal.confirm({
      centered: true,
      title: t('organization.user.modal.deleteTitle'),
      content: t('organization.user.message.deleteConfirm', { name: user.display_name }),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        setBusyAction(`delete-${user.id}`)
        setActionError('')
        setActionMessage('')
        try {
          const deleted = await deleteOrganizationUser(user.id)
          setActionMessage(t('organization.user.message.deactivated'))
          await loadOrganization(deleted.id)
        } catch (caught) {
          showError(caught, t('organization.user.message.deleteFailed'))
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  function confirmDeleteDepartment(department: OrganizationDepartment) {
    const relatedUsers = users.filter((user) => user.department_id === department.id)
    Modal.confirm({
      centered: true,
      title: t('organization.department.modal.deleteTitle'),
      content: relatedUsers.length
        ? t('organization.department.message.hasUsers', { name: department.name, count: relatedUsers.length })
        : t('organization.department.message.deleteConfirm', { name: department.name }),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true, disabled: relatedUsers.length > 0 },
      onOk: async () => {
        if (relatedUsers.length) return
        setBusyAction(`department-delete-${department.id}`)
        setActionError('')
        setActionMessage('')
        try {
          const deleted = await deleteOrganizationDepartment(department.id)
          setActionMessage(t('organization.department.message.deleted'))
          await loadOrganization(undefined, undefined, deleted.id === selectedDepartmentId ? undefined : selectedDepartmentId)
        } catch (caught) {
          showError(caught, t('organization.department.message.deleteFailed'))
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  function confirmResetPassword(user: OrganizationUser) {
    Modal.confirm({
      centered: true,
      title: t('organization.user.modal.resetPasswordTitle'),
      content: t('organization.user.message.resetConfirm', { name: user.display_name }),
      okText: t('organization.user.action.resetPassword'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        setBusyAction(`reset-${user.id}`)
        setActionError('')
        setActionMessage('')
        try {
          const reset: OrganizationPasswordResetResult = await resetOrganizationUserPassword(user.id)
          setPasswordReveal({
            title: t('organization.user.modal.temporaryPasswordTitle'),
            username: reset.user.username,
            password: reset.temporary_password,
          })
          setActionMessage(t('organization.user.message.passwordReset'))
          await loadOrganization(reset.user.id)
        } catch (caught) {
          showError(caught, t('organization.user.message.resetFailed'))
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  if (loading && users.length === 0) {
    return <Skeleton active paragraph={{ rows: 10 }} />
  }

  return (
    <section className="organization-page">
      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}

      <div className="organization-summary" aria-label={t('organization.pageAria')}>
        <Metric label={t('organization.metric.users')} value={users.length} icon={<UsersRound size={17} />} />
        <Metric label={t('organization.metric.active')} value={activeUsers.length} icon={<ShieldCheck size={17} />} />
        <Metric
          label={t('organization.metric.inactive')}
          value={inactiveUsers.length}
          icon={<Trash2 size={17} />}
          intent="warning"
        />
        <Metric
          label={t('organization.metric.departments')}
          value={departments.length}
          icon={<LayoutDashboard size={17} />}
        />
        <Metric label={t('organization.metric.roles')} value={roles.length} icon={<KeyRound size={17} />} />
      </div>

      <div className="organization-toolbar">
        <label className="organization-search">
          <Search size={17} />
          <input
            aria-label={t('organization.filter.search')}
            placeholder={t('organization.filter.search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="organization-toolbar-actions">
          {!departments.length ? <span>{t('organization.user.hint.createDepartmentFirst')}</span> : null}
          <button
            className="inline-submit"
            disabled={!departments.length}
            type="button"
            onClick={openCreateModal}
          >
            <Plus size={15} />
            {t('organization.user.action.create')}
          </button>
        </div>
      </div>

      <section className="organization-company" aria-label={t('organization.company.pageAria')}>
        <header className="organization-departments-head">
          <div>
            <Building2 size={18} />
            <div>
              <h2>{t('organization.company.title')}</h2>
              <p>
                {t('organization.company.description')}
                {companyUpdatedAt
                  ? t('organization.company.updatedAt', { value: formatOrganizationDateTime(companyUpdatedAt) })
                  : ''}
              </p>
            </div>
          </div>
          <button
            className="secondary-inline"
            disabled={!companyLoaded}
            type="button"
            onClick={openCompanyModal}
          >
            <Pencil size={15} />
            {t('organization.company.action.edit')}
          </button>
        </header>
        {companyLoaded ? (
          <div className="organization-company-summary">
            <div className="organization-company-identity">
              <span>{t('organization.company.field.currentLetterhead')}</span>
              <strong>{companyInfo?.name || t('organization.company.placeholder.nameEmpty')}</strong>
              <small>
                {companyInfo?.name_en ||
                  companyInfo?.letterhead ||
                  t('organization.company.placeholder.subtitleEmpty')}
              </small>
            </div>
            <div className="organization-company-facts">
              <div>
                <span>{t('organization.company.field.phone')}</span>
                <strong>{companyInfo?.phone || '-'}</strong>
              </div>
              <div>
                <span>{t('organization.company.field.email')}</span>
                <strong>{companyInfo?.email || '-'}</strong>
              </div>
              <div>
                <span>{t('organization.company.field.bankName')}</span>
                <strong>{companyInfo?.bank_name || '-'}</strong>
              </div>
              <div>
                <span>{t('organization.company.field.bankAccount')}</span>
                <strong>{companyInfo?.bank_account || '-'}</strong>
              </div>
            </div>
          </div>
        ) : (
          <Skeleton active paragraph={{ rows: 2 }} />
        )}
      </section>

      <div className="organization-structure">
      <section className="organization-departments" aria-label={t('organization.department.pageAria')}>
        <header className="organization-departments-head">
          <div>
            <Building2 size={18} />
            <div>
              <h2>{t('organization.department.title')}</h2>
              <p>{t('organization.department.description')}</p>
            </div>
          </div>
          <button className="secondary-inline" type="button" onClick={openCreateDepartmentModal}>
            <Plus size={15} />
            {t('organization.department.action.create')}
          </button>
        </header>
        {departments.length ? (
          <div className="organization-department-grid">
            {departments.map((department) => {
              const parent = departments.find((item) => item.id === department.parent_id)
              const relatedUsers = users.filter((user) => user.department_id === department.id).length
              return (
                <article className="organization-department-card" key={department.id}>
                  <button
                    className="organization-department-main"
                    type="button"
                    onClick={() => openEditDepartmentModal(department)}
                  >
                    <strong>{department.name}</strong>
                    <small>
                      {parent
                        ? t('organization.department.card.parent', { name: parent.name })
                        : t('organization.department.card.topLevel')}{' '}
                      · {t('organization.department.card.userCount', { count: relatedUsers })}
                    </small>
                  </button>
                  <button
                    aria-label={t('organization.department.action.editAria', { name: department.name })}
                    className="secondary-inline icon-only"
                    type="button"
                    onClick={() => openEditDepartmentModal(department)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    aria-label={t('organization.department.action.deleteAria', { name: department.name })}
                    className="danger-inline icon-only"
                    disabled={busyAction === `department-delete-${department.id}`}
                    type="button"
                    onClick={() => confirmDeleteDepartment(department)}
                  >
                    <Trash2 size={15} />
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="organization-department-empty">{t('organization.department.empty')}</div>
        )}
      </section>

      <section className="organization-departments" aria-label={t('organization.role.pageAria')}>
        <header className="organization-departments-head">
          <div>
            <KeyRound size={18} />
            <div>
              <h2>{t('organization.role.title')}</h2>
              <p>{t('organization.role.description')}</p>
            </div>
          </div>
          <button className="secondary-inline" type="button" onClick={openCreateRoleModal}>
            <Plus size={15} />
            {t('organization.role.action.create')}
          </button>
        </header>
        {roles.length ? (
          <div className="organization-department-grid">
            {roles.map((role) => {
              const relatedUsers = users.filter((user) => user.roles.some((item) => item.id === role.id)).length
              const isSuperAdmin = role.code === 'super_admin'
              return (
                <article className="organization-department-card" key={role.id}>
                  <button
                    className="organization-department-main"
                    type="button"
                    onClick={() => openEditRoleModal(role)}
                  >
                    <strong>{role.name}</strong>
                    <small>
                      {role.code} ·{' '}
                      {t('organization.role.card.permissionCount', { count: role.permissions.length })} ·{' '}
                      {t('organization.role.card.userCount', { count: relatedUsers })} ·{' '}
                      {t(dataScopeLabels[role.data_scope])}
                    </small>
                  </button>
                  <button
                    aria-label={t('organization.role.action.editAria', { name: role.name })}
                    className="secondary-inline icon-only"
                    type="button"
                    onClick={() => openEditRoleModal(role)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    aria-label={t('organization.role.action.deleteAria', { name: role.name })}
                    className="danger-inline icon-only"
                    disabled={isSuperAdmin || relatedUsers > 0 || busyAction === `role-delete-${role.id}`}
                    title={
                      isSuperAdmin
                        ? t('organization.role.tooltip.superAdminLocked')
                        : relatedUsers > 0
                          ? t('organization.role.tooltip.assignedLocked')
                          : undefined
                    }
                    type="button"
                    onClick={() => confirmDeleteRole(role)}
                  >
                    <Trash2 size={15} />
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="organization-department-empty">{t('organization.role.empty')}</div>
        )}
      </section>
      </div>

      <div className="organization-layout">
        <section className="organization-list" aria-label={t('organization.user.listAria')}>
          {filteredUsers.length ? (
            filteredUsers.map((user) => (
              <button
                aria-pressed={selectedUser?.id === user.id}
                className={selectedUser?.id === user.id ? 'organization-user-row active' : 'organization-user-row'}
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
              >
                <UserAvatar
                  avatarType={user.avatar_type}
                  avatarValue={user.avatar_value}
                  label={user.display_name}
                />
                <span className="organization-user-main">
                  <strong>{user.display_name}</strong>
                  <small>
                    {user.username} · {user.department_name || t('organization.user.unassignedDepartment')}
                  </small>
                </span>
                <span className={user.is_active ? 'organization-status active' : 'organization-status inactive'}>
                  {user.is_active ? t('status.active') : t('status.inactive')}
                </span>
              </button>
            ))
          ) : (
            <div className="dashboard-empty">{t('organization.user.empty.noMatch')}</div>
          )}
        </section>

        <section className="organization-detail" aria-label={t('organization.user.detailAria')}>
          {selectedUser ? (
            <>
              <div className="organization-detail-head">
                <div>
                  <UserAvatar
                    avatarType={selectedUser.avatar_type}
                    avatarValue={selectedUser.avatar_value}
                    label={selectedUser.display_name}
                    size="lg"
                  />
                  <div>
                    <p>{selectedUser.username}</p>
                    <h2>{selectedUser.display_name}</h2>
                  </div>
                </div>
                <span
                  className={
                    selectedUser.is_active ? 'organization-status active' : 'organization-status inactive'
                  }
                >
                  {selectedUser.is_active
                    ? t('organization.user.status.activeDetail')
                    : t('organization.user.status.inactiveDetail')}
                </span>
              </div>

              <div className="organization-detail-grid">
                <div>
                  <span>{t('organization.user.field.department')}</span>
                  <strong>{selectedUser.department_name || t('organization.user.unassignedDepartment')}</strong>
                </div>
                <div>
                  <span>{t('organization.user.field.role')}</span>
                  <strong>
                    {selectedUser.roles.map((role) => role.name).join(t('organization.user.roleSeparator')) ||
                      t('organization.user.noRoles')}
                  </strong>
                </div>
                <div>
                  <span>{t('organization.user.field.password')}</span>
                  <strong>{selectedUser.password_set ? '******' : t('common.notSet')}</strong>
                </div>
                <div>
                  <span>{t('organization.user.field.createdAt')}</span>
                  <strong>{formatOrganizationDateTime(selectedUser.created_at)}</strong>
                </div>
              </div>

              <div className="organization-actions">
                <button className="secondary-inline" type="button" onClick={() => openEditModal(selectedUser)}>
                  <Save size={15} />
                  {t('organization.user.action.editProfile')}
                </button>
                <button
                  className="secondary-inline"
                  disabled={!roles.length}
                  type="button"
                  onClick={() => setPermissionModalOpen(true)}
                >
                  <ShieldCheck size={15} />
                  {t('organization.user.action.editPermissions')}
                </button>
                <button
                  className="secondary-inline"
                  disabled={busyAction === `reset-${selectedUser.id}`}
                  type="button"
                  onClick={() => confirmResetPassword(selectedUser)}
                >
                  <KeyRound size={15} />
                  {t('organization.user.action.resetPassword')}
                </button>
                <button
                  className="danger-inline"
                  disabled={selectedUser.id === currentUser.id || busyAction === `delete-${selectedUser.id}`}
                  type="button"
                  onClick={() => confirmDeactivate(selectedUser)}
                >
                  <Trash2 size={15} />
                  {t('organization.user.action.delete')}
                </button>
              </div>
            </>
          ) : (
            <div className="dashboard-empty">{t('organization.user.empty.select')}</div>
          )}
        </section>
      </div>

      <Modal
        centered
        className="organization-company-modal"
        footer={null}
        open={companyModalOpen}
        title={t('organization.company.modal.editTitle')}
        width={900}
        onCancel={closeCompanyModal}
      >
        <form
          className="dashboard-form modal-dashboard-form organization-form organization-company-modal-form"
          onSubmit={handleSaveCompanyInfo}
        >
          <div className="organization-company-grid">
            {COMPANY_FIELD_LABELS.map((field) => (
              <label
                key={field.key}
                className={field.full ? 'organization-company-field full' : 'organization-company-field'}
              >
                <span>
                  {t(field.labelKey)}
                  {field.key === 'name' ? ' *' : ''}
                </span>
                <input
                  aria-label={t(field.labelKey)}
                  value={companyForm[field.key]}
                  onChange={(event) =>
                    setCompanyForm({ ...companyForm, [field.key]: event.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={closeCompanyModal}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction === 'company-save'} type="submit">
              <Save size={15} />
              {t('organization.company.action.save')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={permissionModalOpen}
        title={t('organization.permission.modal.title')}
        width={960}
        onCancel={() => setPermissionModalOpen(false)}
      >
        <section className="organization-permissions in-modal" aria-label={t('organization.permission.pageAria')}>
        <div className="organization-permissions-head">
          <div>
            <span>{t('organization.permission.title')}</span>
            <p>{t('organization.permission.description')}</p>
          </div>
          <div className="organization-permission-actions">
            <label className="organization-permission-role-select">
              <span>{t('organization.permission.configRole')}</span>
              <Select
                disabled={!roles.length}
                options={roles.map((role) => ({ label: role.name, value: role.id }))}
                value={selectedRole?.id}
                onChange={selectRoleIdForPermissions}
              />
            </label>
            <button
              className="inline-submit"
              disabled={!selectedRole || busyAction === `permissions-${selectedRole.id}`}
              type="button"
              onClick={() => void submitRolePermissions()}
            >
              <Save size={15} />
              {t('organization.permission.action.save')}
            </button>
          </div>
        </div>

        <div className="organization-permission-layout">
          <div className="organization-permission-groups">
            {permissionGroups.map((group) => {
              const groupItems = group.sections.flatMap((section) => section.items)
              const groupSelectedCount = countSelectedPermissions(groupItems, permissionFormIds)
              const groupFullySelected = groupItems.length > 0 && groupSelectedCount === groupItems.length
              return (
                <section className="organization-permission-module" key={group.key}>
                  <header>
                    <div>
                      <span>{t('organization.permission.sidebarModule')}</span>
                      <h3>{t(group.labelKey)}</h3>
                    </div>
                    <label className="organization-permission-bulk">
                      <input
                        aria-label={t('organization.permission.selectAllAria', { name: t(group.labelKey) })}
                        checked={groupFullySelected}
                        disabled={!groupItems.length}
                        type="checkbox"
                        onChange={(event) => setGroupPermissions(group, event.target.checked)}
                      />
                      {groupSelectedCount}/{groupItems.length}
                    </label>
                  </header>
                  <div className="organization-permission-sections">
                    {group.sections.map((section) => {
                      const selectedCount = countSelectedPermissions(section.items, permissionFormIds)
                      const sectionFullySelected = section.items.length > 0 && selectedCount === section.items.length
                      return (
                        <div className="organization-permission-section" key={section.key}>
                          <div className="organization-permission-section-head">
                            <div>
                              <small>{t(group.labelKey)}</small>
                              <strong>{permissionSectionText(section)}</strong>
                            </div>
                            <label>
                              <input
                                aria-label={t('organization.permission.selectAllAria', {
                                  name: permissionSectionText(section),
                                })}
                                checked={sectionFullySelected}
                                disabled={!section.items.length}
                                type="checkbox"
                                onChange={(event) => setSectionPermissions(section, event.target.checked)}
                              />
                              {selectedCount}/{section.items.length}
                            </label>
                          </div>
                          <div className="organization-permission-checks">
                            {section.items.length ? (
                              section.items.map((permission) => {
                                const checked = permissionFormIds.includes(permission.id)
                                return (
                                  <label className={checked ? 'selected' : ''} key={permission.id}>
                                    <input
                                      aria-label={permission.name}
                                      checked={checked}
                                      type="checkbox"
                                      onChange={() => togglePermission(permission.id)}
                                    />
                                    <span>
                                      {permission.name}
                                      <em
                                        className={`organization-permission-tag tag-${permission.category}`}
                                      >
                                        {permissionCategoryLabel(permission)}
                                      </em>
                                    </span>
                                    <small>{permission.code}</small>
                                  </label>
                                )
                              })
                            ) : (
                              <div className="organization-permission-missing">
                                {t('organization.permission.none')}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
        </section>
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(userModalMode)}
        title={
          userModalMode === 'create'
            ? t('organization.user.modal.createTitle')
            : t('organization.user.modal.editTitle')
        }
        width={760}
        onCancel={() => setUserModalMode(null)}
      >
        <form className="dashboard-form modal-dashboard-form organization-form" onSubmit={submitUserForm}>
          <UserAvatarPicker
            label={form.display_name || form.username || t('organization.user.avatarFallback')}
            value={{
              avatar_type: form.avatar_type,
              avatar_value: form.avatar_value,
            }}
            onChange={(avatar) => setForm({ ...form, ...avatar })}
          />
          <div className="dashboard-form-row">
            <label>
              <span>{t('organization.user.field.username')}</span>
              <input
                aria-label={t('organization.user.field.username')}
                disabled={userModalMode === 'edit'}
                placeholder={t('organization.user.placeholder.username')}
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
              />
            </label>
            <label>
              <span>{t('organization.user.field.displayName')}</span>
              <input
                aria-label={t('organization.user.field.displayName')}
                value={form.display_name}
                onChange={(event) => setForm({ ...form, display_name: event.target.value })}
              />
            </label>
          </div>
          <label>
            <span>{t('organization.user.field.department')}</span>
            <Select
              disabled={!departments.length}
              options={departments.map((department) => ({
                value: department.id,
                label: department.name,
              }))}
              placeholder={t('organization.user.placeholder.department')}
              value={form.department_id || undefined}
              onChange={(value) => setForm({ ...form, department_id: value })}
            />
          </label>
          <div className="organization-role-picker">
            <span>{t('organization.user.field.role')}</span>
            <div>
              {roles.map((role) => {
                const checked = form.role_ids.includes(role.id)
                return (
                  <button
                    aria-pressed={checked}
                    className={checked ? 'selected' : ''}
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                  >
                    <ShieldCheck size={15} />
                    {role.name}
                  </button>
                )
              })}
            </div>
          </div>
          <label className="organization-toggle">
            <input
              aria-label={t('organization.user.field.accountActive')}
              checked={form.is_active}
              type="checkbox"
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            <span>{t('organization.user.field.accountActive')}</span>
          </label>
          {userModalMode === 'create' ? (
            <div className="organization-password-note">
              {t('organization.user.hint.initialPassword')}
            </div>
          ) : null}
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setUserModalMode(null)}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction === userModalMode} type="submit">
              {userModalMode === 'create'
                ? t('organization.user.action.createSubmit')
                : t('organization.user.action.saveSubmit')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(departmentModalMode)}
        title={
          departmentModalMode === 'create'
            ? t('organization.department.modal.createTitle')
            : t('organization.department.modal.editTitle')
        }
        width={520}
        onCancel={() => setDepartmentModalMode(null)}
      >
        <form className="dashboard-form modal-dashboard-form organization-form" onSubmit={submitDepartmentForm}>
          <label>
            <span>{t('organization.department.field.name')}</span>
            <input
              aria-label={t('organization.department.field.name')}
              placeholder={t('organization.department.placeholder.name')}
              value={departmentForm.name}
              onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })}
            />
          </label>
          <label>
            <span>{t('organization.department.field.parent')}</span>
            <Select
              allowClear
              options={departments
                .filter((department) => department.id !== selectedDepartment?.id)
                .map((department) => ({
                  value: department.id,
                  label: department.name,
                }))}
              placeholder={t('organization.department.placeholder.parent')}
              value={departmentForm.parent_id || undefined}
              onChange={(value) => setDepartmentForm({ ...departmentForm, parent_id: value ?? null })}
            />
          </label>
          <label>
            <span>{t('organization.department.field.sort')}</span>
            <input
              aria-label={t('organization.department.field.sortAria')}
              min={0}
              type="number"
              value={departmentForm.sort_order}
              onChange={(event) => setDepartmentForm({ ...departmentForm, sort_order: event.target.value })}
            />
          </label>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setDepartmentModalMode(null)}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction?.startsWith('department')} type="submit">
              {departmentModalMode === 'create'
                ? t('organization.department.action.createSubmit')
                : t('organization.department.action.saveSubmit')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(roleModalMode)}
        title={
          roleModalMode === 'create'
            ? t('organization.role.modal.createTitle')
            : t('organization.role.modal.editTitle')
        }
        width={roleModalMode === 'create' ? 960 : 520}
        onCancel={() => setRoleModalMode(null)}
      >
        <form className="dashboard-form modal-dashboard-form organization-form" onSubmit={submitRoleForm}>
          <div className="dashboard-form-row">
            <label>
              <span>{t('organization.role.field.name')}</span>
              <input
                aria-label={t('organization.role.field.name')}
                placeholder={t('organization.role.placeholder.name')}
                value={roleForm.name}
                onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })}
              />
            </label>
            <label>
              <span>{t('organization.role.field.code')}</span>
              <input
                aria-label={t('organization.role.field.code')}
                placeholder={t('organization.role.placeholder.code')}
                value={roleForm.code}
                onChange={(event) => setRoleForm({ ...roleForm, code: event.target.value })}
              />
            </label>
          </div>
          <div className="dashboard-form-row">
            <label className="organization-data-scope-field">
              <span>{t('organization.role.field.dataScope')}</span>
              <Select
                options={dataScopeOrder.map((scope) => ({
                  label: t(dataScopeLabels[scope]),
                  value: scope,
                }))}
                value={roleForm.data_scope}
                onChange={(value) =>
                  setRoleForm({ ...roleForm, data_scope: (value as OrganizationDataScope) ?? 'self' })
                }
              />
              <small className="organization-data-scope-hint">
                {t('organization.role.hint.dataScope')}
              </small>
            </label>
          </div>
          {roleModalMode === 'create' ? (
            <div className="organization-permission-layout">
              <div className="organization-permission-groups">
                {permissionGroups.map((group) => (
                  <section className="organization-permission-module" key={group.key}>
                    <header>
                      <div>
                        <span>{t('organization.permission.sidebarModule')}</span>
                        <h3>{t(group.labelKey)}</h3>
                      </div>
                    </header>
                    <div className="organization-permission-sections">
                      {group.sections.map((section) => {
                        const selectedCount = countSelectedPermissions(section.items, roleForm.permission_ids)
                        const sectionFullySelected =
                          section.items.length > 0 && selectedCount === section.items.length
                        return (
                          <div className="organization-permission-section" key={section.key}>
                            <div className="organization-permission-section-head">
                              <div>
                                <small>{t(group.labelKey)}</small>
                                <strong>{permissionSectionText(section)}</strong>
                              </div>
                              <label>
                                <input
                                  aria-label={t('organization.permission.selectAllAria', {
                                    name: permissionSectionText(section),
                                  })}
                                  checked={sectionFullySelected}
                                  disabled={!section.items.length}
                                  type="checkbox"
                                  onChange={(event) =>
                                    setRoleFormSectionPermissions(section, event.target.checked)
                                  }
                                />
                                {selectedCount}/{section.items.length}
                              </label>
                            </div>
                            <div className="organization-permission-checks">
                              {section.items.length ? (
                                section.items.map((permission) => {
                                  const checked = roleForm.permission_ids.includes(permission.id)
                                  return (
                                    <label className={checked ? 'selected' : ''} key={permission.id}>
                                      <input
                                        aria-label={permission.name}
                                        checked={checked}
                                        type="checkbox"
                                        onChange={() => toggleRoleFormPermission(permission.id)}
                                      />
                                      <span>{permission.name}</span>
                                      <small>{permission.code}</small>
                                    </label>
                                  )
                                })
                              ) : (
                                <div className="organization-permission-missing">
                                  {t('organization.permission.none')}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <div className="organization-password-note">
              {t('organization.role.hint.editPermissions')}
            </div>
          )}
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setRoleModalMode(null)}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction?.startsWith('role')} type="submit">
              {roleModalMode === 'create'
                ? t('organization.role.action.createSubmit')
                : t('organization.role.action.saveSubmit')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(passwordReveal)}
        title={passwordReveal?.title ?? t('organization.user.field.password')}
        width={520}
        onCancel={() => setPasswordReveal(null)}
      >
        {passwordReveal ? (
          <section className="organization-password-reveal">
            <p>
              {t('organization.user.message.passwordOnce', {
                username: passwordReveal.username,
                title: passwordReveal.title,
              })}
            </p>
            <div>
              <code>{passwordReveal.password}</code>
              <button
                className="inline-submit"
                type="button"
                onClick={() => void copyPassword(passwordReveal.password)}
              >
                <Copy size={15} />
                {t('organization.action.copy')}
              </button>
            </div>
            <div className="modal-actions">
              <button className="secondary-inline" type="button" onClick={() => setPasswordReveal(null)}>
                {t('common.close')}
              </button>
            </div>
          </section>
        ) : null}
      </Modal>
    </section>
  )
}
