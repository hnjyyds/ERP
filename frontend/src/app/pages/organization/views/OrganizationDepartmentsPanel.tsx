import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'

import { t } from '@/app/appI18n'

import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationDepartmentsPanel({ model }: Props) {
  return (
    <section className="organization-departments" aria-label={t('organization.department.pageAria')}>
      <header className="organization-departments-head">
        <div>
          <Building2 size={18} />
          <div>
            <h2>{t('organization.department.title')}</h2>
            <p>{t('organization.department.description')}</p>
          </div>
        </div>
        <button className="secondary-inline" type="button" onClick={model.openCreateDepartmentModal}>
          <Plus size={15} />
          {t('organization.department.action.create')}
        </button>
      </header>
      {model.departments.length ? (
        <div className="organization-department-grid">
          {model.departments.map((department) => {
            const parent = model.departments.find((item) => item.id === department.parent_id)
            const relatedUsers = model.users.filter((user) => user.department_id === department.id).length
            return (
              <article className="organization-department-card" key={department.id}>
                <button
                  className="organization-department-main"
                  type="button"
                  onClick={() => model.openEditDepartmentModal(department)}
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
                  onClick={() => model.openEditDepartmentModal(department)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  aria-label={t('organization.department.action.deleteAria', { name: department.name })}
                  className="danger-inline icon-only"
                  disabled={model.busyAction === `department-delete-${department.id}`}
                  type="button"
                  onClick={() => model.confirmDeleteDepartment(department)}
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
  )
}
