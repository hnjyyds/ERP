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

const COMPANY_FIELD_LABELS: Array<{ key: keyof CompanyInfoFormState; label: string; full?: boolean }> = [
  { key: 'name', label: '公司名称' },
  { key: 'name_en', label: '英文名称' },
  { key: 'letterhead', label: '单证抬头', full: true },
  { key: 'address', label: '地址' },
  { key: 'address_en', label: '英文地址' },
  { key: 'phone', label: '电话' },
  { key: 'fax', label: '传真' },
  { key: 'email', label: '邮箱' },
  { key: 'website', label: '网站' },
  { key: 'tax_no', label: '税号' },
  { key: 'bank_name', label: '开户行' },
  { key: 'bank_account', label: '银行账号' },
  { key: 'bank_swift', label: 'SWIFT' },
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
  label: string
  items: OrganizationPermission[]
}

type OrganizationPermissionGroup = {
  key: string
  label: string
  sections: OrganizationPermissionSection[]
}

type PermissionSectionDefinition = {
  key: string
  label: string
  prefixes: string[]
}

type PermissionGroupDefinition = {
  key: string
  label: string
  sections: PermissionSectionDefinition[]
}

const permissionModuleOrder = [
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

const permissionModuleLabels: Record<string, string> = {
  dashboard: '工作桌面',
  system: '系统管理',
  organization: '组织管理',
  masterdata: '基础资料',
  sample: '样品业务',
  sales: '销售出口',
  purchase: '采购业务',
  qualityWarehouse: '质检仓库',
  finance: '财务报表',
  other: '其他权限',
}

const permissionSectionLabels: Record<string, string> = {
  'dashboard:dashboard': '工作桌面',
  'dashboard:schedule': '个人日程',
  'dashboard:announcement': '公司公告',
  'system:system': '系统权限',
  'organization:user': '组织用户',
  'organization:role': '角色权限',
  'masterdata:product': '商品资料',
  'masterdata:customer': '客户资料',
  'masterdata:supplier': '供应商资料',
  'masterdata:partner': '合作伙伴',
  'masterdata:document_party': '单证资料',
  'sample:request': '打样管理',
  'sample:record': '样品登记',
  'sample:delivery': '寄样管理',
  'sales:quotation': '出口报价',
  'sales:contract': '出口合同',
  'sales:shipment': '出货明细',
  'purchase:inquiry': '采购询价',
  'purchase:contract': '采购合同',
  'purchase:invoice_notice': '开票通知',
  'purchase:followup': '采购跟单',
  'followup:template': '跟单模板',
  'followup:plan': '采购跟单计划',
  'quality:inspection': 'QC 查验',
  'warehouse:inbound_plan': '入库计划',
  'warehouse:inbound_order': '货物入库',
  'warehouse:outbound_plan': '出库计划',
  'warehouse:outbound_order': '货物出库',
  'finance:finance': '财务管理',
  'finance:reporting': '经理查询',
}

const sidebarPermissionCatalog: PermissionGroupDefinition[] = [
  {
    key: 'dashboard',
    label: '工作桌面',
    sections: [
      {
        key: 'dashboard:dashboard',
        label: '工作桌面',
        prefixes: ['dashboard:', 'schedule:', 'announcement:'],
      },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    sections: [
      {
        key: 'system:organization',
        label: '组织管理',
        prefixes: ['system:', 'organization:'],
      },
    ],
  },
  {
    key: 'masterdata',
    label: '基础资料',
    sections: [
      { key: 'masterdata:product', label: '商品资料', prefixes: ['masterdata:product:'] },
      { key: 'masterdata:customer', label: '客户资料', prefixes: ['masterdata:customer:'] },
      { key: 'masterdata:supplier', label: '供应商资料', prefixes: ['masterdata:supplier:'] },
      { key: 'masterdata:partner', label: '合作伙伴', prefixes: ['masterdata:partner:'] },
      { key: 'masterdata:document_party', label: '单证资料', prefixes: ['masterdata:document_party:'] },
    ],
  },
  {
    key: 'sample',
    label: '样品业务',
    sections: [
      { key: 'sample:request', label: '打样管理', prefixes: ['sample:request:'] },
      { key: 'sample:record', label: '样品登记', prefixes: ['sample:record:'] },
      { key: 'sample:delivery', label: '寄样管理', prefixes: ['sample:delivery:'] },
    ],
  },
  {
    key: 'sales',
    label: '销售出口',
    sections: [
      { key: 'sales:quotation', label: '出口报价', prefixes: ['sales:quotation:'] },
      { key: 'sales:contract', label: '出口合同', prefixes: ['sales:contract:'] },
      { key: 'sales:shipment', label: '出货明细', prefixes: ['sales:shipment:'] },
    ],
  },
  {
    key: 'purchase',
    label: '采购业务',
    sections: [
      { key: 'purchase:inquiry', label: '采购询价', prefixes: ['purchase:inquiry:'] },
      { key: 'purchase:contract', label: '采购合同', prefixes: ['purchase:contract:'] },
      { key: 'purchase:invoice_notice', label: '开票通知', prefixes: ['purchase:invoice_notice:'] },
      { key: 'purchase:followup', label: '采购跟单', prefixes: ['followup:', 'purchase:followup:'] },
    ],
  },
  {
    key: 'qualityWarehouse',
    label: '质检仓库',
    sections: [
      { key: 'quality:inspection', label: 'QC 查验', prefixes: ['quality:inspection:'] },
      { key: 'warehouse:inbound_plan', label: '入库计划', prefixes: ['warehouse:inbound_plan:'] },
      { key: 'warehouse:inbound_order', label: '货物入库', prefixes: ['warehouse:inbound_order:'] },
      { key: 'warehouse:outbound_plan', label: '出库计划', prefixes: ['warehouse:outbound_plan:'] },
      { key: 'warehouse:outbound_order', label: '货物出库', prefixes: ['warehouse:outbound_order:'] },
    ],
  },
  {
    key: 'finance',
    label: '财务报表',
    sections: [
      { key: 'finance:finance', label: '财务管理', prefixes: ['finance:'] },
      { key: 'finance:reporting', label: '经理查询', prefixes: ['reporting:'] },
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
  return permissionModuleLabels[namespace] ? namespace : 'other'
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

function permissionSectionLabel(permission: OrganizationPermission) {
  const key = permissionSectionKey(permission)
  if (permissionSectionLabels[key]) return permissionSectionLabels[key]
  const resource = key.split(':')[1] ?? key
  return resource
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function permissionActionKey(permission: OrganizationPermission) {
  const parts = permission.code.split(':')
  return parts.slice(2).join(':') || parts[1] || permission.code
}

const permissionCategoryLabels: Record<string, string> = {
  functional: '功能',
  data: '数据',
  field: '字段',
  process: '流程',
}

function permissionCategoryLabel(permission: OrganizationPermission) {
  return permissionCategoryLabels[permission.category] ?? permissionCategoryLabels.functional
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
    label: group.label,
    sections: group.sections.map((section) => {
      const items = sortPermissions(permissions.filter((permission) => permissionMatchesSection(permission, section)))
      items.forEach((permission) => usedPermissionIds.add(permission.id))
      return {
        key: section.key,
        label: section.label,
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
      label: permissionSectionLabel(permission),
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
      label: '其他权限',
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
  const name = safeOrganizationText(permission?.name, code || '未命名权限')
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
  const name = safeOrganizationText(role?.name, code || '未命名角色')
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

const dataScopeLabels: Record<OrganizationDataScope, string> = {
  self: '仅本人',
  department: '本部门',
  department_tree: '本部门及下级',
  all: '全部数据',
}

function normalizeDataScope(value: unknown): OrganizationDataScope {
  return dataScopeOrder.includes(value as OrganizationDataScope)
    ? (value as OrganizationDataScope)
    : 'self'
}

function normalizeOrganizationDepartment(
  department: Partial<OrganizationDepartment> | null | undefined,
): OrganizationDepartment {
  const name = safeOrganizationText(department?.name, '未命名部门')
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
    department_name: safeOrganizationText(user?.department_name, '未分配部门'),
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

type OrganizationTranslateKey = 'common.cancel' | 'common.close'

type OrganizationUsersPageProps = {
  currentUser: CurrentUser
  translate?: (key: OrganizationTranslateKey) => string
}

function defaultOrganizationTranslate(key: OrganizationTranslateKey) {
  const labels: Record<OrganizationTranslateKey, string> = {
    'common.cancel': '取消',
    'common.close': '关闭',
  }
  return labels[key]
}

export function OrganizationUsersPage({
  currentUser,
  translate = defaultOrganizationTranslate,
}: OrganizationUsersPageProps) {
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
      setActionError('缺少组织管理权限')
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
      showError(caught, '组织管理数据加载失败')
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
      setActionError('请填写公司名称')
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
      setActionMessage('公司信息已保存')
    } catch (caught) {
      showError(caught, '公司信息保存失败')
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
      setActionError('请先新增部门')
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
      setActionMessage(`${updated.name} 权限已更新`)
      await loadOrganization(undefined, updated.id)
    } catch (caught) {
      showError(caught, '权限保存失败')
    } finally {
      setBusyAction(null)
    }
  }

  async function copyPassword(password: string) {
    try {
      await navigator.clipboard.writeText(password)
      setActionMessage('密码已复制')
    } catch {
      setActionError('复制失败，请手动选择密码')
    }
  }

  async function submitUserForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (userModalMode === 'create' && !departments.length) {
      setActionError('请先新增部门')
      return
    }
    if (!form.username.trim() || !form.display_name.trim()) {
      setActionError('请填写用户名和姓名')
      return
    }
    if (!form.department_id) {
      setActionError('请选择部门')
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
          title: '初始密码',
          username: created.user.username,
          password: created.initial_password,
        })
        setActionMessage('用户已创建')
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
        setActionMessage('用户已更新')
        await loadOrganization(updated.id)
      }
    } catch (caught) {
      showError(caught, '操作失败')
    } finally {
      setBusyAction(null)
    }
  }

  async function submitDepartmentForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = departmentForm.name.trim()
    if (!name) {
      setActionError('请填写部门名称')
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
        setActionMessage('部门已创建')
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
        setActionMessage('部门已更新')
        await loadOrganization(undefined, undefined, updated.id)
      }
    } catch (caught) {
      showError(caught, '部门保存失败')
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
      setActionError('请填写角色名称')
      return
    }
    if (!/^[a-z][a-z0-9_]*$/.test(code)) {
      setActionError('角色编码需以小写字母开头，仅含小写字母、数字和下划线')
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
        setActionMessage('角色已创建')
        await loadOrganization(undefined, created.id)
      }
      if (roleModalMode === 'edit' && editingRoleId) {
        const payload: OrganizationRoleUpdatePayload = { name, code, data_scope: roleForm.data_scope }
        const updated = await updateOrganizationRole(editingRoleId, payload)
        setRoleModalMode(null)
        setActionMessage('角色已更新')
        await loadOrganization(undefined, updated.id)
      }
    } catch (caught) {
      showError(caught, '角色保存失败')
    } finally {
      setBusyAction(null)
    }
  }

  function confirmDeleteRole(role: OrganizationRole) {
    const relatedUsers = users.filter((user) => user.roles.some((item) => item.id === role.id))
    Modal.confirm({
      centered: true,
      title: '删除角色',
      content: relatedUsers.length
        ? `${role.name} 已分配给 ${relatedUsers.length} 个用户，不能删除。请先解除这些用户的该角色。`
        : `删除后 ${role.name} 将从角色列表中移除，是否继续？`,
      okText: '删除',
      cancelText: translate('common.cancel'),
      okButtonProps: { danger: true, disabled: relatedUsers.length > 0 },
      onOk: async () => {
        if (relatedUsers.length) return
        setBusyAction(`role-delete-${role.id}`)
        setActionError('')
        setActionMessage('')
        try {
          await deleteOrganizationRole(role.id)
          setActionMessage('角色已删除')
          await loadOrganization()
        } catch (caught) {
          showError(caught, '角色删除失败')
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  function confirmDeactivate(user: OrganizationUser) {
    Modal.confirm({
      centered: true,
      title: '删除用户',
      content: `删除后 ${user.display_name} 将无法登录，历史业务记录会保留。是否继续？`,
      okText: '删除',
      cancelText: translate('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        setBusyAction(`delete-${user.id}`)
        setActionError('')
        setActionMessage('')
        try {
          const deleted = await deleteOrganizationUser(user.id)
          setActionMessage('用户已停用')
          await loadOrganization(deleted.id)
        } catch (caught) {
          showError(caught, '删除失败')
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
      title: '删除部门',
      content: relatedUsers.length
        ? `${department.name} 下还有 ${relatedUsers.length} 个用户，不能删除。`
        : `删除后 ${department.name} 将从部门列表中移除，是否继续？`,
      okText: '删除',
      cancelText: translate('common.cancel'),
      okButtonProps: { danger: true, disabled: relatedUsers.length > 0 },
      onOk: async () => {
        if (relatedUsers.length) return
        setBusyAction(`department-delete-${department.id}`)
        setActionError('')
        setActionMessage('')
        try {
          const deleted = await deleteOrganizationDepartment(department.id)
          setActionMessage('部门已删除')
          await loadOrganization(undefined, undefined, deleted.id === selectedDepartmentId ? undefined : selectedDepartmentId)
        } catch (caught) {
          showError(caught, '部门删除失败')
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  function confirmResetPassword(user: OrganizationUser) {
    Modal.confirm({
      centered: true,
      title: '重置密码',
      content: `系统将为 ${user.display_name} 生成新的临时密码，旧密码会立即失效。`,
      okText: '重置密码',
      cancelText: translate('common.cancel'),
      onOk: async () => {
        setBusyAction(`reset-${user.id}`)
        setActionError('')
        setActionMessage('')
        try {
          const reset: OrganizationPasswordResetResult = await resetOrganizationUserPassword(user.id)
          setPasswordReveal({
            title: '临时密码',
            username: reset.user.username,
            password: reset.temporary_password,
          })
          setActionMessage('密码已重置')
          await loadOrganization(reset.user.id)
        } catch (caught) {
          showError(caught, '重置失败')
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

      <div className="organization-summary" aria-label="组织概览">
        <Metric label="用户" value={users.length} icon={<UsersRound size={17} />} />
        <Metric label="启用" value={activeUsers.length} icon={<ShieldCheck size={17} />} />
        <Metric label="停用" value={inactiveUsers.length} icon={<Trash2 size={17} />} intent="warning" />
        <Metric label="部门" value={departments.length} icon={<LayoutDashboard size={17} />} />
        <Metric label="角色" value={roles.length} icon={<KeyRound size={17} />} />
      </div>

      <div className="organization-toolbar">
        <label className="organization-search">
          <Search size={17} />
          <input
            placeholder="搜索用户、部门或角色"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="organization-toolbar-actions">
          {!departments.length ? <span>请先新增部门后再添加成员</span> : null}
          <button
            className="inline-submit"
            disabled={!departments.length}
            type="button"
            onClick={openCreateModal}
          >
            <Plus size={15} />
            新增用户
          </button>
        </div>
      </div>

      <section className="organization-company" aria-label="公司信息">
        <header className="organization-departments-head">
          <div>
            <Building2 size={18} />
            <div>
              <h2>公司信息</h2>
              <p>
                公司抬头、银行信息用于单证和对外文件。
                {companyUpdatedAt ? `（最近更新 ${formatOrganizationDateTime(companyUpdatedAt)}）` : ''}
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
            编辑公司信息
          </button>
        </header>
        {companyLoaded ? (
          <div className="organization-company-summary">
            <div className="organization-company-identity">
              <span>当前抬头</span>
              <strong>{companyInfo?.name || '未填写公司名称'}</strong>
              <small>{companyInfo?.name_en || companyInfo?.letterhead || '暂无英文名称或单证抬头'}</small>
            </div>
            <div className="organization-company-facts">
              <div>
                <span>电话</span>
                <strong>{companyInfo?.phone || '-'}</strong>
              </div>
              <div>
                <span>邮箱</span>
                <strong>{companyInfo?.email || '-'}</strong>
              </div>
              <div>
                <span>开户行</span>
                <strong>{companyInfo?.bank_name || '-'}</strong>
              </div>
              <div>
                <span>银行账号</span>
                <strong>{companyInfo?.bank_account || '-'}</strong>
              </div>
            </div>
          </div>
        ) : (
          <Skeleton active paragraph={{ rows: 2 }} />
        )}
      </section>

      <div className="organization-structure">
      <section className="organization-departments" aria-label="部门管理">
        <header className="organization-departments-head">
          <div>
            <Building2 size={18} />
            <div>
              <h2>部门管理</h2>
              <p>初始部门为空，由超级管理员先创建部门，再新增成员。</p>
            </div>
          </div>
          <button className="secondary-inline" type="button" onClick={openCreateDepartmentModal}>
            <Plus size={15} />
            新增部门
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
                      {parent ? `上级 ${parent.name}` : '一级部门'} · {relatedUsers} 人
                    </small>
                  </button>
                  <button
                    aria-label={`编辑 ${department.name}`}
                    className="secondary-inline icon-only"
                    type="button"
                    onClick={() => openEditDepartmentModal(department)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    aria-label={`删除 ${department.name}`}
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
          <div className="organization-department-empty">暂无部门。请先新增部门，再创建成员账号。</div>
        )}
      </section>

      <section className="organization-departments" aria-label="角色管理">
        <header className="organization-departments-head">
          <div>
            <KeyRound size={18} />
            <div>
              <h2>角色管理</h2>
              <p>新增、改名或删除角色；已分配给用户的角色需先解除关联才能删除。</p>
            </div>
          </div>
          <button className="secondary-inline" type="button" onClick={openCreateRoleModal}>
            <Plus size={15} />
            新增角色
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
                      {role.code} · {role.permissions.length} 项权限 · {relatedUsers} 人 ·{' '}
                      {dataScopeLabels[role.data_scope]}
                    </small>
                  </button>
                  <button
                    aria-label={`编辑 ${role.name}`}
                    className="secondary-inline icon-only"
                    type="button"
                    onClick={() => openEditRoleModal(role)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    aria-label={`删除 ${role.name}`}
                    className="danger-inline icon-only"
                    disabled={isSuperAdmin || relatedUsers > 0 || busyAction === `role-delete-${role.id}`}
                    title={
                      isSuperAdmin
                        ? '超级管理员角色不可删除'
                        : relatedUsers > 0
                          ? '角色已分配给用户，不能删除'
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
          <div className="organization-department-empty">暂无角色。请先新增角色，再为用户分配。</div>
        )}
      </section>
      </div>

      <div className="organization-layout">
        <section className="organization-list" aria-label="用户列表">
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
                    {user.username} · {user.department_name || '未分配部门'}
                  </small>
                </span>
                <span className={user.is_active ? 'organization-status active' : 'organization-status inactive'}>
                  {user.is_active ? '启用' : '停用'}
                </span>
              </button>
            ))
          ) : (
            <div className="dashboard-empty">没有匹配的用户</div>
          )}
        </section>

        <section className="organization-detail" aria-label="用户详情">
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
                  {selectedUser.is_active ? '启用中' : '已停用'}
                </span>
              </div>

              <div className="organization-detail-grid">
                <div>
                  <span>部门</span>
                  <strong>{selectedUser.department_name || '未分配部门'}</strong>
                </div>
                <div>
                  <span>角色</span>
                  <strong>{selectedUser.roles.map((role) => role.name).join('、') || '暂无角色'}</strong>
                </div>
                <div>
                  <span>密码</span>
                  <strong>{selectedUser.password_set ? '******' : '未设置'}</strong>
                </div>
                <div>
                  <span>创建时间</span>
                  <strong>{formatOrganizationDateTime(selectedUser.created_at)}</strong>
                </div>
              </div>

              <div className="organization-actions">
                <button className="secondary-inline" type="button" onClick={() => openEditModal(selectedUser)}>
                  <Save size={15} />
                  编辑资料
                </button>
                <button
                  className="secondary-inline"
                  disabled={!roles.length}
                  type="button"
                  onClick={() => setPermissionModalOpen(true)}
                >
                  <ShieldCheck size={15} />
                  编辑用户权限
                </button>
                <button
                  className="secondary-inline"
                  disabled={busyAction === `reset-${selectedUser.id}`}
                  type="button"
                  onClick={() => confirmResetPassword(selectedUser)}
                >
                  <KeyRound size={15} />
                  重置密码
                </button>
                <button
                  className="danger-inline"
                  disabled={selectedUser.id === currentUser.id || busyAction === `delete-${selectedUser.id}`}
                  type="button"
                  onClick={() => confirmDeactivate(selectedUser)}
                >
                  <Trash2 size={15} />
                  删除用户
                </button>
              </div>
            </>
          ) : (
            <div className="dashboard-empty">请选择用户</div>
          )}
        </section>
      </div>

      <Modal
        centered
        className="organization-company-modal"
        footer={null}
        open={companyModalOpen}
        title="编辑公司信息"
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
                  {field.label}
                  {field.key === 'name' ? ' *' : ''}
                </span>
                <input
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
              {translate('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction === 'company-save'} type="submit">
              <Save size={15} />
              保存公司信息
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={permissionModalOpen}
        title="按侧边栏功能授权"
        width={960}
        onCancel={() => setPermissionModalOpen(false)}
      >
        <section className="organization-permissions in-modal" aria-label="角色权限配置">
        <div className="organization-permissions-head">
          <div>
            <span>权限配置</span>
            <p>先选择角色，再按左侧导航对应的功能勾选权限；没有勾选的板块不会出现在该角色用户的侧边栏。</p>
          </div>
          <div className="organization-permission-actions">
            <label className="organization-permission-role-select">
              <span>配置角色</span>
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
              保存权限
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
                      <span>侧边栏模块</span>
                      <h3>{group.label}</h3>
                    </div>
                    <label className="organization-permission-bulk">
                      <input
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
                              <small>{group.label}</small>
                              <strong>{section.label}</strong>
                            </div>
                            <label>
                              <input
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
                              <div className="organization-permission-missing">暂无可配置权限</div>
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
        title={userModalMode === 'create' ? '新增用户' : '编辑用户'}
        width={760}
        onCancel={() => setUserModalMode(null)}
      >
        <form className="dashboard-form modal-dashboard-form organization-form" onSubmit={submitUserForm}>
          <UserAvatarPicker
            label={form.display_name || form.username || '用户'}
            value={{
              avatar_type: form.avatar_type,
              avatar_value: form.avatar_value,
            }}
            onChange={(avatar) => setForm({ ...form, ...avatar })}
          />
          <div className="dashboard-form-row">
            <label>
              <span>用户名</span>
              <input
                disabled={userModalMode === 'edit'}
                placeholder="用于登录，如 sales.chen"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
              />
            </label>
            <label>
              <span>姓名</span>
              <input
                value={form.display_name}
                onChange={(event) => setForm({ ...form, display_name: event.target.value })}
              />
            </label>
          </div>
          <label>
            <span>部门</span>
            <Select
              disabled={!departments.length}
              options={departments.map((department) => ({
                value: department.id,
                label: department.name,
              }))}
              placeholder="请选择部门"
              value={form.department_id || undefined}
              onChange={(value) => setForm({ ...form, department_id: value })}
            />
          </label>
          <div className="organization-role-picker">
            <span>角色</span>
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
              checked={form.is_active}
              type="checkbox"
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            <span>账号启用</span>
          </label>
          {userModalMode === 'create' ? (
            <div className="organization-password-note">
              系统会自动生成初始密码，创建成功后只展示一次。
            </div>
          ) : null}
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setUserModalMode(null)}>
              {translate('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction === userModalMode} type="submit">
              {userModalMode === 'create' ? '创建用户' : '保存修改'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(departmentModalMode)}
        title={departmentModalMode === 'create' ? '新增部门' : '编辑部门'}
        width={520}
        onCancel={() => setDepartmentModalMode(null)}
      >
        <form className="dashboard-form modal-dashboard-form organization-form" onSubmit={submitDepartmentForm}>
          <label>
            <span>部门名称</span>
            <input
              placeholder="如 业务部、财务部"
              value={departmentForm.name}
              onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })}
            />
          </label>
          <label>
            <span>上级部门</span>
            <Select
              allowClear
              options={departments
                .filter((department) => department.id !== selectedDepartment?.id)
                .map((department) => ({
                  value: department.id,
                  label: department.name,
                }))}
              placeholder="不选择则为一级部门"
              value={departmentForm.parent_id || undefined}
              onChange={(value) => setDepartmentForm({ ...departmentForm, parent_id: value ?? null })}
            />
          </label>
          <label>
            <span>排序</span>
            <input
              min={0}
              type="number"
              value={departmentForm.sort_order}
              onChange={(event) => setDepartmentForm({ ...departmentForm, sort_order: event.target.value })}
            />
          </label>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setDepartmentModalMode(null)}>
              {translate('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction?.startsWith('department')} type="submit">
              {departmentModalMode === 'create' ? '创建部门' : '保存部门'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(roleModalMode)}
        title={roleModalMode === 'create' ? '新增角色' : '编辑角色'}
        width={roleModalMode === 'create' ? 960 : 520}
        onCancel={() => setRoleModalMode(null)}
      >
        <form className="dashboard-form modal-dashboard-form organization-form" onSubmit={submitRoleForm}>
          <div className="dashboard-form-row">
            <label>
              <span>角色名称</span>
              <input
                placeholder="如 业务主管、财务"
                value={roleForm.name}
                onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })}
              />
            </label>
            <label>
              <span>角色编码</span>
              <input
                placeholder="小写字母，如 sales_manager"
                value={roleForm.code}
                onChange={(event) => setRoleForm({ ...roleForm, code: event.target.value })}
              />
            </label>
          </div>
          <div className="dashboard-form-row">
            <label className="organization-data-scope-field">
              <span>数据范围</span>
              <Select
                options={dataScopeOrder.map((scope) => ({
                  label: dataScopeLabels[scope],
                  value: scope,
                }))}
                value={roleForm.data_scope}
                onChange={(value) =>
                  setRoleForm({ ...roleForm, data_scope: (value as OrganizationDataScope) ?? 'self' })
                }
              />
              <small className="organization-data-scope-hint">
                控制该角色用户能查看的业务单据范围（按单据负责人所属部门判定）。
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
                        <span>侧边栏模块</span>
                        <h3>{group.label}</h3>
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
                                <small>{group.label}</small>
                                <strong>{section.label}</strong>
                              </div>
                              <label>
                                <input
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
                                <div className="organization-permission-missing">暂无可配置权限</div>
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
              如需调整该角色的权限，请在用户详情中点击「编辑用户权限」后选择此角色保存。
            </div>
          )}
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setRoleModalMode(null)}>
              {translate('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction?.startsWith('role')} type="submit">
              {roleModalMode === 'create' ? '创建角色' : '保存角色'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(passwordReveal)}
        title={passwordReveal?.title ?? '密码'}
        width={520}
        onCancel={() => setPasswordReveal(null)}
      >
        {passwordReveal ? (
          <section className="organization-password-reveal">
            <p>
              {passwordReveal.username} 的{passwordReveal.title}仅展示这一次，请复制后交给账号使用人。
            </p>
            <div>
              <code>{passwordReveal.password}</code>
              <button
                className="inline-submit"
                type="button"
                onClick={() => void copyPassword(passwordReveal.password)}
              >
                <Copy size={15} />
                复制
              </button>
            </div>
            <div className="modal-actions">
              <button className="secondary-inline" type="button" onClick={() => setPasswordReveal(null)}>
                {translate('common.close')}
              </button>
            </div>
          </section>
        ) : null}
      </Modal>
    </section>
  )
}
