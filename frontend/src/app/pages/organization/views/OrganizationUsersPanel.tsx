import { KeyRound, Save, ShieldCheck, Trash2 } from 'lucide-react'

import { t } from '@/app/appI18n'
import { UserAvatar } from '@/shared/ui'

import { formatOrganizationDateTime } from '../organizationHelpers'
import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationUsersPanel({ model }: Props) {
  const selectedUser = model.selectedUser
  return (
    <div className="organization-layout">
      <section className="organization-list" aria-label={t('organization.user.listAria')}>
        {model.filteredUsers.length ? (
          model.filteredUsers.map((user) => (
            <button
              aria-pressed={selectedUser?.id === user.id}
              className={selectedUser?.id === user.id ? 'organization-user-row active' : 'organization-user-row'}
              key={user.id}
              type="button"
              onClick={() => model.setSelectedUserId(user.id)}
            >
              <UserAvatar avatarType={user.avatar_type} avatarValue={user.avatar_value} label={user.display_name} />
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
                className={selectedUser.is_active ? 'organization-status active' : 'organization-status inactive'}
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
              <button className="secondary-inline" type="button" onClick={() => model.openEditModal(selectedUser)}>
                <Save size={15} />
                {t('organization.user.action.editProfile')}
              </button>
              <button
                className="secondary-inline"
                disabled={!model.roles.length}
                type="button"
                onClick={() => model.setPermissionModalOpen(true)}
              >
                <ShieldCheck size={15} />
                {t('organization.user.action.editPermissions')}
              </button>
              <button
                className="secondary-inline"
                disabled={model.busyAction === `reset-${selectedUser.id}`}
                type="button"
                onClick={() => model.confirmResetPassword(selectedUser)}
              >
                <KeyRound size={15} />
                {t('organization.user.action.resetPassword')}
              </button>
              <button
                className="danger-inline"
                disabled={selectedUser.id === model.currentUserId || model.busyAction === `delete-${selectedUser.id}`}
                type="button"
                onClick={() => model.confirmDeactivate(selectedUser)}
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
  )
}
