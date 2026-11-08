import { Modal } from 'antd'
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
  type CurrentUser,
  type OrganizationDepartment,
  type OrganizationDepartmentCreatePayload,
  type OrganizationDepartmentUpdatePayload,
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
} from '@/api'
import { showError } from '@/shared/errors'
import { defaultAvatarPreset } from '@/shared/ui'
import { t } from '@/app/appI18n'

import {
  companyFormToPayload,
  companyInfoToForm,
  emptyCompanyForm,
  groupOrganizationPermissions,
  normalizeOrganizationOptions,
  normalizeOrganizationUserList,
  superAdminPermission,
  type CompanyInfoFormState,
  type OrganizationDepartmentFormState,
  type OrganizationPermissionGroup,
  type OrganizationPermissionSection,
  type OrganizationRoleFormState,
  type OrganizationUserFormState,
  type PasswordRevealState,
} from '../organizationHelpers'

type Params = { currentUser: CurrentUser }

export function useOrganizationManagement({ currentUser }: Params) {
  // 组织管理唯一的权限判定入口；视图层只消费 canManage，不再自行判断权限。
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

  return {
    canManage: canManageOrganization,
    currentUserId: currentUser.id,
    users,
    activeUsers,
    inactiveUsers,
    filteredUsers,
    departments,
    roles,
    permissions,
    permissionGroups,
    selectedUser,
    selectedRole,
    selectedDepartment,
    selectedUserId,
    setSelectedUserId,
    permissionFormIds,
    query,
    setQuery,
    loading,
    busyAction,
    actionMessage,
    actionError,
    companyInfo,
    companyLoaded,
    companyUpdatedAt,
    companyModalOpen,
    companyForm,
    setCompanyForm,
    openCompanyModal,
    closeCompanyModal,
    handleSaveCompanyInfo,
    userModalMode,
    setUserModalMode,
    form,
    setForm,
    openCreateModal,
    openEditModal,
    toggleRole,
    submitUserForm,
    departmentModalMode,
    setDepartmentModalMode,
    departmentForm,
    setDepartmentForm,
    openCreateDepartmentModal,
    openEditDepartmentModal,
    submitDepartmentForm,
    roleModalMode,
    setRoleModalMode,
    roleForm,
    setRoleForm,
    openCreateRoleModal,
    openEditRoleModal,
    toggleRoleFormPermission,
    setRoleFormSectionPermissions,
    submitRoleForm,
    permissionModalOpen,
    setPermissionModalOpen,
    selectRoleIdForPermissions,
    togglePermission,
    setGroupPermissions,
    setSectionPermissions,
    submitRolePermissions,
    passwordReveal,
    setPasswordReveal,
    copyPassword,
    confirmDeleteRole,
    confirmDeactivate,
    confirmDeleteDepartment,
    confirmResetPassword,
  }
}
