import { Skeleton, Tabs } from 'antd'

import type { CurrentUser } from '@/api'
import { t } from '@/app/appI18n'

import { OrganizationCompanySection } from './components/OrganizationCompanySection'
import { useOrganizationManagement } from './hooks/useOrganizationManagement'
import { OrganizationCompanyModal } from './views/OrganizationCompanyModal'
import { OrganizationDepartmentModal } from './views/OrganizationDepartmentModal'
import { OrganizationDepartmentsPanel } from './views/OrganizationDepartmentsPanel'
import { OrganizationPasswordModal } from './views/OrganizationPasswordModal'
import { OrganizationPermissionModal } from './views/OrganizationPermissionModal'
import { OrganizationRoleModal } from './views/OrganizationRoleModal'
import { OrganizationRolesPanel } from './views/OrganizationRolesPanel'
import { OrganizationSummary } from './views/OrganizationSummary'
import { OrganizationToolbar } from './views/OrganizationToolbar'
import { OrganizationUserModal } from './views/OrganizationUserModal'
import { OrganizationUsersPanel } from './views/OrganizationUsersPanel'

type OrganizationUsersPageProps = {
  currentUser: CurrentUser
}

export function OrganizationUsersPage({ currentUser }: OrganizationUsersPageProps) {
  const model = useOrganizationManagement({ currentUser })

  if (model.loading && model.users.length === 0) {
    return <Skeleton active paragraph={{ rows: 10 }} />
  }

  return (
    <section className="organization-page">
      {model.actionError ? <div className="dashboard-feedback error">{model.actionError}</div> : null}
      {model.actionMessage ? <div className="dashboard-feedback success">{model.actionMessage}</div> : null}

      <OrganizationSummary model={model} />
      <OrganizationToolbar model={model} />

      <OrganizationCompanySection
        companyInfo={model.companyInfo}
        companyLoaded={model.companyLoaded}
        companyUpdatedAt={model.companyUpdatedAt}
        onEdit={model.openCompanyModal}
      />

      <Tabs
        className="organization-tabs"
        defaultActiveKey="users"
        items={[
          {
            key: 'users',
            label: t('organization.tabs.users'),
            children: (
              <div className="organization-tab-body">
                <OrganizationUsersPanel model={model} />
              </div>
            ),
          },
          {
            key: 'structure',
            label: t('organization.tabs.structure'),
            children: (
              <div className="organization-tab-body">
                <div className="organization-structure">
                  <OrganizationDepartmentsPanel model={model} />
                  <OrganizationRolesPanel model={model} />
                </div>
              </div>
            ),
          },
        ]}
      />

      <OrganizationCompanyModal model={model} />
      <OrganizationPermissionModal model={model} />
      <OrganizationUserModal model={model} />
      <OrganizationDepartmentModal model={model} />
      <OrganizationRoleModal model={model} />
      <OrganizationPasswordModal model={model} />
    </section>
  )
}
