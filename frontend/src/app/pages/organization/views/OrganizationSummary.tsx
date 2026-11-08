import { KeyRound, LayoutDashboard, ShieldCheck, Trash2, UsersRound } from 'lucide-react'

import { t } from '@/app/appI18n'
import { Metric } from '@/shared/ui'

import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationSummary({ model }: Props) {
  return (
    <div className="organization-summary" aria-label={t('organization.pageAria')}>
      <Metric label={t('organization.metric.users')} value={model.users.length} icon={<UsersRound size={17} />} />
      <Metric
        label={t('organization.metric.active')}
        value={model.activeUsers.length}
        icon={<ShieldCheck size={17} />}
      />
      <Metric
        label={t('organization.metric.inactive')}
        value={model.inactiveUsers.length}
        icon={<Trash2 size={17} />}
        intent="warning"
      />
      <Metric
        label={t('organization.metric.departments')}
        value={model.departments.length}
        icon={<LayoutDashboard size={17} />}
      />
      <Metric label={t('organization.metric.roles')} value={model.roles.length} icon={<KeyRound size={17} />} />
    </div>
  )
}
