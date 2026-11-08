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
  type CurrentUser,
  type OrganizationDataScope,
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
import { Metric, UserAvatar, UserAvatarPicker, defaultAvatarPreset } from '@/shared/ui'
import { t } from '@/app/appI18n'
import { OrganizationCompanySection } from './components/OrganizationCompanySection'
import { OrganizationPermissionMatrix } from './components/OrganizationPermissionMatrix'
import {
  COMPANY_FIELD_LABELS,
  companyFormToPayload,
  companyInfoToForm,
  dataScopeLabels,
  dataScopeOrder,
  emptyCompanyForm,
  formatOrganizationDateTime,
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
} from './organizationHelpers'
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

      <OrganizationCompanySection
        companyInfo={companyInfo}
        companyLoaded={companyLoaded}
        companyUpdatedAt={companyUpdatedAt}
        onEdit={openCompanyModal}
      />

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

        <OrganizationPermissionMatrix
          groups={permissionGroups}
          selectedIds={permissionFormIds}
          showCategory
          showGroupSelectAll
          onToggleGroup={setGroupPermissions}
          onTogglePermission={togglePermission}
          onToggleSection={setSectionPermissions}
        />
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
              <OrganizationPermissionMatrix
                groups={permissionGroups}
                selectedIds={roleForm.permission_ids}
                onTogglePermission={toggleRoleFormPermission}
                onToggleSection={setRoleFormSectionPermissions}
              />
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
