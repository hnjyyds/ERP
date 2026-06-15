import { Modal, Select, Skeleton } from 'antd'
import {
  CheckCircle2,
  Copy,
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
  createOrganizationUser,
  deleteOrganizationUser,
  getOrganizationOptions,
  listOrganizationUsers,
  resetOrganizationUserPassword,
  updateOrganizationRolePermissions,
  updateOrganizationUser,
  type CurrentUser,
  type OrganizationDepartment,
  type OrganizationOptions,
  type OrganizationPermission,
  type OrganizationPasswordResetResult,
  type OrganizationRole,
  type OrganizationRolePermissionUpdatePayload,
  type OrganizationUser,
  type OrganizationUserCreatePayload,
  type OrganizationUserCreateResult,
  type OrganizationUserUpdatePayload,
  type UserAvatarType,
} from '../../../api'
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

type PasswordRevealState = {
  title: string
  username: string
  password: string
}

const permissionGroupLabels: Record<string, string> = {
  system: '系统管理',
  organization: '组织管理',
  dashboard: '工作桌面',
  schedule: '日程公告',
  announcement: '日程公告',
  masterdata: '基础资料',
  sample: '样品业务',
  sales: '销售出口',
  purchase: '采购业务',
  followup: '采购业务',
  quality: '质检仓库',
  warehouse: '质检仓库',
  finance: '财务报表',
  reporting: '财务报表',
}

function groupOrganizationPermissions(permissions: OrganizationPermission[]) {
  const groups = new Map<string, OrganizationPermission[]>()
  permissions.forEach((permission) => {
    const namespace = permission.code.split(':')[0] ?? 'other'
    const label = permissionGroupLabels[namespace] ?? '其他权限'
    groups.set(label, [...(groups.get(label) ?? []), permission])
  })
  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }))
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
  return {
    id: safeOrganizationText(permission?.id, code || name),
    code,
    name,
  }
}

function normalizeOrganizationRole(role: Partial<OrganizationRole> | null | undefined): OrganizationRole {
  const code = safeOrganizationText(role?.code)
  const name = safeOrganizationText(role?.name, code || '未命名角色')
  return {
    id: safeOrganizationText(role?.id, code || name),
    name,
    code,
    permissions: Array.isArray(role?.permissions)
      ? role.permissions.map((permission) => normalizeOrganizationPermission(permission))
      : [],
  }
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
    department_id: safeOrganizationText(user?.department_id),
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
  const [permissionFormIds, setPermissionFormIds] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState<OrganizationUserFormState>(() => ({
    username: '',
    display_name: '',
    department_id: '',
    role_ids: [],
    is_active: true,
    avatar_type: 'preset',
    avatar_value: defaultAvatarPreset,
  }))
  const [passwordReveal, setPasswordReveal] = useState<PasswordRevealState | null>(null)

  useEffect(() => {
    if (!canManageOrganization) {
      setLoading(false)
      setActionError('缺少组织管理权限')
      return
    }
    void loadOrganization()
  }, [canManageOrganization])

  const activeUsers = users.filter((user) => user.is_active)
  const inactiveUsers = users.filter((user) => !user.is_active)
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null
  const permissionGroups = groupOrganizationPermissions(permissions)
  const filteredUsers = users.filter((user) => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return true
    return [user.username, user.display_name, user.department_name, user.roles.map((role) => role.name).join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })

  async function loadOrganization(nextSelectedId?: string, nextRoleId?: string) {
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
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : '组织管理数据加载失败')
    } finally {
      setLoading(false)
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
    resetCreateForm()
    setUserModalMode('create')
  }

  function openEditModal(user: OrganizationUser) {
    setForm({
      username: user.username,
      display_name: user.display_name,
      department_id: user.department_id,
      role_ids: user.roles.map((role) => role.id),
      is_active: user.is_active,
      avatar_type: user.avatar_type,
      avatar_value: user.avatar_value || defaultAvatarPreset,
    })
    setUserModalMode('edit')
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

  function togglePermission(permissionId: string) {
    setPermissionFormIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId],
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
      setActionError(caught instanceof Error ? caught.message : '权限保存失败')
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
    if (!form.username.trim() || !form.display_name.trim() || !form.department_id) {
      setActionError('请填写用户名、姓名和部门')
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
      setActionError(caught instanceof Error ? caught.message : '操作失败')
    } finally {
      setBusyAction(null)
    }
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
          setActionError(caught instanceof Error ? caught.message : '删除失败')
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
          setActionError(caught instanceof Error ? caught.message : '重置失败')
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
        <button className="inline-submit" type="button" onClick={openCreateModal}>
          <Plus size={15} />
          新增用户
        </button>
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
                  <strong>{selectedUser.password_set ? '已设置，不显示明文' : '未设置'}</strong>
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

      <section className="organization-permissions" aria-label="角色权限配置">
        <div className="organization-permissions-head">
          <div>
            <span>权限配置</span>
            <h2>角色权限</h2>
            <p>权限通过角色分配给用户；超级管理员权限决定是否能进入组织管理和发布公司公告。</p>
          </div>
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

        <div className="organization-permission-layout">
          <div className="organization-role-list" aria-label="角色列表">
            {roles.map((role) => (
              <button
                aria-pressed={selectedRole?.id === role.id}
                className={selectedRole?.id === role.id ? 'active' : ''}
                key={role.id}
                type="button"
                onClick={() => selectRoleForPermissions(role)}
              >
                <span>{role.name}</span>
                <small>{role.permissions.length} 项权限</small>
              </button>
            ))}
          </div>

          <div className="organization-permission-groups">
            {permissionGroups.map((group) => (
              <section key={group.label}>
                <h3>{group.label}</h3>
                <div>
                  {group.items.map((permission) => {
                    const checked = permissionFormIds.includes(permission.id)
                    return (
                      <button
                        aria-pressed={checked}
                        className={checked ? 'selected' : ''}
                        key={permission.id}
                        type="button"
                        onClick={() => togglePermission(permission.id)}
                      >
                        <CheckCircle2 size={15} />
                        <span>{permission.name}</span>
                        <small>{permission.code}</small>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

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
              options={departments.map((department) => ({
                value: department.id,
                label: department.name,
              }))}
              value={form.department_id}
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
