import { Modal, Select } from 'antd'

import { t } from '@/app/appI18n'

import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationDepartmentModal({ model }: Props) {
  const selectedDepartment = model.selectedDepartment
  return (
    <Modal
      centered
      footer={null}
      open={Boolean(model.departmentModalMode)}
      title={
        model.departmentModalMode === 'create'
          ? t('organization.department.modal.createTitle')
          : t('organization.department.modal.editTitle')
      }
      width={520}
      onCancel={() => model.setDepartmentModalMode(null)}
    >
      <form className="dashboard-form modal-dashboard-form organization-form" onSubmit={model.submitDepartmentForm}>
        <label>
          <span>{t('organization.department.field.name')}</span>
          <input
            aria-label={t('organization.department.field.name')}
            placeholder={t('organization.department.placeholder.name')}
            value={model.departmentForm.name}
            onChange={(event) => model.setDepartmentForm({ ...model.departmentForm, name: event.target.value })}
          />
        </label>
        <label>
          <span>{t('organization.department.field.parent')}</span>
          <Select
            allowClear
            options={model.departments
              .filter((department) => department.id !== selectedDepartment?.id)
              .map((department) => ({
                value: department.id,
                label: department.name,
              }))}
            placeholder={t('organization.department.placeholder.parent')}
            value={model.departmentForm.parent_id || undefined}
            onChange={(value) => model.setDepartmentForm({ ...model.departmentForm, parent_id: value ?? null })}
          />
        </label>
        <label>
          <span>{t('organization.department.field.sort')}</span>
          <input
            aria-label={t('organization.department.field.sortAria')}
            min={0}
            type="number"
            value={model.departmentForm.sort_order}
            onChange={(event) =>
              model.setDepartmentForm({ ...model.departmentForm, sort_order: event.target.value })
            }
          />
        </label>
        <div className="modal-actions">
          <button className="secondary-inline" type="button" onClick={() => model.setDepartmentModalMode(null)}>
            {t('common.cancel')}
          </button>
          <button className="inline-submit" disabled={model.busyAction?.startsWith('department')} type="submit">
            {model.departmentModalMode === 'create'
              ? t('organization.department.action.createSubmit')
              : t('organization.department.action.saveSubmit')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
