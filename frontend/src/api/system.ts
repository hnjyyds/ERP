import { getRuntimeSettings } from '../app/pages/appHelpers'
import { translate, type TranslationKey } from '../locales'
import { apiBaseUrl, readApiError, request } from './core'
import type { ApiResponse } from './core'

function tr(key: TranslationKey) {
  return translate(getRuntimeSettings().language, key)
}

export interface MenuItem {
  id: string
  label: string
  path: string
  icon: string
  required_permission: string
  sort_order: number
}

export type UserAvatarType = 'preset' | 'upload'

export interface UserAvatarFields {
  avatar_type: UserAvatarType
  avatar_value: string
}

export interface CurrentUser {
  id: string
  username: string
  display_name: string
  department_name: string
  avatar_type: UserAvatarType
  avatar_value: string
  roles: string[]
  permissions: string[]
}

export interface AssignableUser {
  id: string
  username: string
  display_name: string
  department_name: string
  avatar_type: UserAvatarType
  avatar_value: string
}

export interface ApprovalSubmitPayload {
  reviewer_id: string
}

export interface OrganizationDepartment {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
}

export type OrganizationDataScope = 'self' | 'department' | 'department_tree' | 'all'

export interface OrganizationRole {
  id: string
  name: string
  code: string
  data_scope: OrganizationDataScope
  permissions: OrganizationPermission[]
}

export interface OrganizationPermission {
  id: string
  code: string
  name: string
  category: string
}

export interface OrganizationUser {
  id: string
  username: string
  display_name: string
  department_id: string | null
  department_name: string
  avatar_type: UserAvatarType
  avatar_value: string
  roles: OrganizationRole[]
  is_active: boolean
  created_at: string
  password_set: boolean
}

export interface OrganizationOptions {
  departments: OrganizationDepartment[]
  roles: OrganizationRole[]
  permissions: OrganizationPermission[]
}

export interface OrganizationUserCreatePayload {
  username: string
  display_name: string
  department_id: string
  role_ids: string[]
  is_active: boolean
  avatar_type: UserAvatarType
  avatar_value: string
}

export interface OrganizationUserUpdatePayload {
  display_name?: string
  department_id?: string
  role_ids?: string[]
  is_active?: boolean
  avatar_type?: UserAvatarType
  avatar_value?: string
}

export interface OrganizationDepartmentCreatePayload {
  name: string
  parent_id?: string | null
  sort_order: number
}

export interface OrganizationDepartmentUpdatePayload {
  name?: string
  parent_id?: string | null
  sort_order?: number
}

export interface OrganizationRolePermissionUpdatePayload {
  permission_ids: string[]
}

export interface OrganizationRoleCreatePayload {
  name: string
  code: string
  data_scope?: OrganizationDataScope
  permission_ids: string[]
}

export interface OrganizationRoleUpdatePayload {
  name?: string
  code?: string
  data_scope?: OrganizationDataScope
}

export interface OrganizationUserCreateResult {
  user: OrganizationUser
  initial_password: string
}

export interface OrganizationPasswordResetResult {
  user: OrganizationUser
  temporary_password: string
}

export interface CompanyInfo {
  name: string
  name_en: string | null
  letterhead: string | null
  address: string | null
  address_en: string | null
  phone: string | null
  fax: string | null
  email: string | null
  website: string | null
  tax_no: string | null
  bank_name: string | null
  bank_account: string | null
  bank_swift: string | null
  logo: string | null
  updated_at: string | null
}

export type CompanyInfoUpdatePayload = Partial<Omit<CompanyInfo, 'updated_at'>>

export interface McpResourceInfo {
  key: string
  label: string
  tools: string[]
}

export interface McpSettings {
  enabled: boolean
  server_name: string
  transport: 'streamable_http'
  endpoint_path: string
  token_parameter: string
  token_prefix_required: boolean
  credential_available: boolean
  credential_issued_at: string | null
  credential_expires_at: string | null
  tool_count: number
  resources: McpResourceInfo[]
  updated_by: string | null
  updated_at: string | null
}

export interface McpSettingsUpdatePayload {
  enabled: boolean
}

export interface McpCredential {
  access_token: string
  token_type: 'Bearer'
  expires_at: string
}

export interface AuthSession {
  access_token: string
  token_type: string
  user: CurrentUser
  menus: MenuItem[]
}

export interface CurrentUserAvatarUpdatePayload {
  avatar_type: UserAvatarType
  avatar_value: string
}

export type AppLanguage = 'zh-CN' | 'en-US'

export type AppTimeZone = 'Asia/Shanghai' | 'UTC'

export interface I18nLanguageConfig {
  code: AppLanguage
  label: string
  description: string
  time_zone: AppTimeZone
}

export interface I18nConfig {
  default_language: AppLanguage
  supported_languages: I18nLanguageConfig[]
  messages: Record<AppLanguage, Record<string, string>>
  path_labels: Record<string, Record<AppLanguage, string>>
  page_titles: Record<string, Record<AppLanguage, string>>
  sidebar_groups: Record<string, Record<AppLanguage, string>>
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const nextUsername = username.trim()
  if (!nextUsername || !password) {
    throw new Error(tr('auth.validation.credentialsRequired'))
  }

  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: nextUsername, password }),
  })

  if (!response.ok) {
    const { message } = await readApiError(response)
    if (response.status === 401) throw new Error(message || tr('auth.error.invalidCredentials'))
    if (response.status === 422) throw new Error(tr('auth.validation.credentialsRequired'))
    throw new Error(message || tr('auth.error.requestFailed'))
  }

  const body = (await response.json()) as ApiResponse<AuthSession>
  if (!body.success || body.error) {
    throw new Error(body.error?.message ?? tr('auth.error.invalidCredentials'))
  }
  return body.data
}

export function getCurrentSession(): Promise<{ user: CurrentUser; menus: MenuItem[] }> {
  return request<{ user: CurrentUser; menus: MenuItem[] }>('/auth/me')
}

export function getMcpSettings(): Promise<McpSettings> {
  return request<McpSettings>('/system/mcp')
}

export function updateMcpSettings(payload: McpSettingsUpdatePayload): Promise<McpSettings> {
  return request<McpSettings>('/system/mcp', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function createMcpCredential(): Promise<McpCredential> {
  return request<McpCredential>('/system/mcp/credentials', {
    method: 'POST',
  })
}

export function updateCurrentUserAvatar(
  payload: CurrentUserAvatarUpdatePayload,
): Promise<{ user: CurrentUser; menus: MenuItem[] }> {
  return request<{ user: CurrentUser; menus: MenuItem[] }>('/auth/me/avatar', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function listAssignableUsers(
  requiredPermission?: string,
): Promise<{ users: AssignableUser[] }> {
  const params = new URLSearchParams()
  if (requiredPermission) params.set('required_permission', requiredPermission)
  const query = params.toString()
  return request<{ users: AssignableUser[] }>(`/auth/users${query ? `?${query}` : ''}`)
}

export function getOrganizationOptions(): Promise<OrganizationOptions> {
  return request<OrganizationOptions>('/organization/options')
}

export function listOrganizationUsers(): Promise<{ users: OrganizationUser[] }> {
  return request<{ users: OrganizationUser[] }>('/organization/users')
}

export function createOrganizationDepartment(
  payload: OrganizationDepartmentCreatePayload,
): Promise<OrganizationDepartment> {
  return request<OrganizationDepartment>('/organization/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateOrganizationDepartment(
  departmentId: string,
  payload: OrganizationDepartmentUpdatePayload,
): Promise<OrganizationDepartment> {
  return request<OrganizationDepartment>(`/organization/departments/${departmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteOrganizationDepartment(departmentId: string): Promise<OrganizationDepartment> {
  return request<OrganizationDepartment>(`/organization/departments/${departmentId}`, {
    method: 'DELETE',
  })
}

export function createOrganizationUser(
  payload: OrganizationUserCreatePayload,
): Promise<OrganizationUserCreateResult> {
  return request<OrganizationUserCreateResult>('/organization/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateOrganizationUser(
  userId: string,
  payload: OrganizationUserUpdatePayload,
): Promise<OrganizationUser> {
  return request<OrganizationUser>(`/organization/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteOrganizationUser(userId: string): Promise<OrganizationUser> {
  return request<OrganizationUser>(`/organization/users/${userId}`, {
    method: 'DELETE',
  })
}

export function resetOrganizationUserPassword(userId: string): Promise<OrganizationPasswordResetResult> {
  return request<OrganizationPasswordResetResult>(`/organization/users/${userId}/reset-password`, {
    method: 'POST',
  })
}

export function updateOrganizationRolePermissions(
  roleId: string,
  payload: OrganizationRolePermissionUpdatePayload,
): Promise<OrganizationRole> {
  return request<OrganizationRole>(`/organization/roles/${roleId}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function createOrganizationRole(
  payload: OrganizationRoleCreatePayload,
): Promise<OrganizationRole> {
  return request<OrganizationRole>('/organization/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateOrganizationRole(
  roleId: string,
  payload: OrganizationRoleUpdatePayload,
): Promise<OrganizationRole> {
  return request<OrganizationRole>(`/organization/roles/${roleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteOrganizationRole(roleId: string): Promise<OrganizationRole> {
  return request<OrganizationRole>(`/organization/roles/${roleId}`, {
    method: 'DELETE',
  })
}

export function getCompanyInfo(): Promise<CompanyInfo> {
  return request<CompanyInfo>('/organization/company')
}

export function updateCompanyInfo(payload: CompanyInfoUpdatePayload): Promise<CompanyInfo> {
  return request<CompanyInfo>('/organization/company', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getI18nConfig(): Promise<I18nConfig> {
  return request<I18nConfig>('/system/i18n')
}
