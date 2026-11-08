import { Building2, Pencil } from 'lucide-react'
import { Skeleton } from 'antd'

import type { CompanyInfo } from '@/api'
import { t } from '@/app/appI18n'
import { formatOrganizationDateTime } from '@/app/pages/organization/organizationHelpers'

type OrganizationCompanySectionProps = {
  companyInfo: CompanyInfo | null
  companyLoaded: boolean
  companyUpdatedAt: string | null
  onEdit: () => void
}

export function OrganizationCompanySection({
  companyInfo,
  companyLoaded,
  companyUpdatedAt,
  onEdit,
}: OrganizationCompanySectionProps) {
  return (
    <section className="organization-company" aria-label={t('organization.company.pageAria')}>
      <header className="organization-departments-head">
        <div>
          <Building2 size={18} />
          <div>
            <h2>{t('organization.company.title')}</h2>
            <p>
              {t('organization.company.description')}
              {companyUpdatedAt
                ? t('organization.company.updatedAt', {
                    value: formatOrganizationDateTime(companyUpdatedAt),
                  })
                : ''}
            </p>
          </div>
        </div>
        <button
          className="secondary-inline"
          disabled={!companyLoaded}
          type="button"
          onClick={onEdit}
        >
          <Pencil size={15} />
          {t('organization.company.action.edit')}
        </button>
      </header>
      {companyLoaded ? (
        <div className="organization-company-summary">
          <div className="organization-company-identity">
            <span>{t('organization.company.field.currentLetterhead')}</span>
            <strong>{companyInfo?.name || t('organization.company.placeholder.nameEmpty')}</strong>
            <small>
              {companyInfo?.name_en ||
                companyInfo?.letterhead ||
                t('organization.company.placeholder.subtitleEmpty')}
            </small>
          </div>
          <div className="organization-company-facts">
            <div>
              <span>{t('organization.company.field.phone')}</span>
              <strong>{companyInfo?.phone || '-'}</strong>
            </div>
            <div>
              <span>{t('organization.company.field.email')}</span>
              <strong>{companyInfo?.email || '-'}</strong>
            </div>
            <div>
              <span>{t('organization.company.field.bankName')}</span>
              <strong>{companyInfo?.bank_name || '-'}</strong>
            </div>
            <div>
              <span>{t('organization.company.field.bankAccount')}</span>
              <strong>{companyInfo?.bank_account || '-'}</strong>
            </div>
          </div>
        </div>
      ) : (
        <Skeleton active paragraph={{ rows: 2 }} />
      )}
    </section>
  )
}
