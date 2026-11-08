import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'

import { t } from '@/app/appI18n'

import { dataScopeLabels } from '../organizationHelpers'
import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationRolesPanel({ model }: Props) {
  return (
    <section className="organization-departments" aria-label={t('organization.role.pageAria')}>
      <header className="organization-departments-head">
        <div>
          <KeyRound size={18} />
          <div>
            <h2>{t('organization.role.title')}</h2>
            <p>{t('organization.role.description')}</p>
          </div>
        </div>
        <button className="secondary-inline" type="button" onClick={model.openCreateRoleModal}>
          <Plus size={15} />
          {t('organization.role.action.create')}
        </button>
      </header>
      {model.roles.length ? (
        <div className="organization-department-grid">
          {model.roles.map((role) => {
            const relatedUsers = model.users.filter((user) => user.roles.some((item) => item.id === role.id)).length
            const isSuperAdmin = role.code === 'super_admin'
            return (
              <article className="organization-department-card" key={role.id}>
                <button
                  className="organization-department-main"
                  type="button"
                  onClick={() => model.openEditRoleModal(role)}
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
                  onClick={() => model.openEditRoleModal(role)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  aria-label={t('organization.role.action.deleteAria', { name: role.name })}
                  className="danger-inline icon-only"
                  disabled={isSuperAdmin || relatedUsers > 0 || model.busyAction === `role-delete-${role.id}`}
                  title={
                    isSuperAdmin
                      ? t('organization.role.tooltip.superAdminLocked')
                      : relatedUsers > 0
                        ? t('organization.role.tooltip.assignedLocked')
                        : undefined
                  }
                  type="button"
                  onClick={() => model.confirmDeleteRole(role)}
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
  )
}
