import { Modal } from 'antd'
import { Save } from 'lucide-react'

import { t } from '@/app/appI18n'

import { COMPANY_FIELD_LABELS } from '../organizationHelpers'
import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationCompanyModal({ model }: Props) {
  return (
    <Modal
      centered
      className="organization-company-modal"
      footer={null}
      open={model.companyModalOpen}
      title={t('organization.company.modal.editTitle')}
      width={900}
      onCancel={model.closeCompanyModal}
    >
      <form
        className="dashboard-form modal-dashboard-form organization-form organization-company-modal-form"
        onSubmit={model.handleSaveCompanyInfo}
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
                value={model.companyForm[field.key]}
                onChange={(event) =>
                  model.setCompanyForm({ ...model.companyForm, [field.key]: event.target.value })
                }
              />
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="secondary-inline" type="button" onClick={model.closeCompanyModal}>
            {t('common.cancel')}
          </button>
          <button className="inline-submit" disabled={model.busyAction === 'company-save'} type="submit">
            <Save size={15} />
            {t('organization.company.action.save')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
