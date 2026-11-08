import { Plus, Search } from 'lucide-react'

import { t } from '@/app/appI18n'

import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationToolbar({ model }: Props) {
  return (
    <div className="organization-toolbar">
      <label className="organization-search">
        <Search size={17} />
        <input
          aria-label={t('organization.filter.search')}
          placeholder={t('organization.filter.search')}
          value={model.query}
          onChange={(event) => model.setQuery(event.target.value)}
        />
      </label>
      <div className="organization-toolbar-actions">
        {!model.departments.length ? <span>{t('organization.user.hint.createDepartmentFirst')}</span> : null}
        <button
          className="inline-submit"
          disabled={!model.departments.length}
          type="button"
          onClick={model.openCreateModal}
        >
          <Plus size={15} />
          {t('organization.user.action.create')}
        </button>
      </div>
    </div>
  )
}
