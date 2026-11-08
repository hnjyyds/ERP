import { Modal, Select } from 'antd'

import { t } from '@/app/appI18n'

import { OrganizationPermissionMatrix } from '../components/OrganizationPermissionMatrix'
import { dataScopeLabels, dataScopeOrder } from '../organizationHelpers'
import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationRoleModal({ model }: Props) {
  return (
    <Modal
      centered
      footer={null}
      open={Boolean(model.roleModalMode)}
      title={
        model.roleModalMode === 'create' ? t('organization.role.modal.createTitle') : t('organization.role.modal.editTitle')
      }
      width={model.roleModalMode === 'create' ? 960 : 520}
      onCancel={() => model.setRoleModalMode(null)}
    >
      <form className="dashboard-form modal-dashboard-form organization-form" onSubmit={model.submitRoleForm}>
        <div className="dashboard-form-row">
          <label>
            <span>{t('organization.role.field.name')}</span>
            <input
              aria-label={t('organization.role.field.name')}
              placeholder={t('organization.role.placeholder.name')}
              value={model.roleForm.name}
              onChange={(event) => model.setRoleForm({ ...model.roleForm, name: event.target.value })}
            />
          </label>
          <label>
            <span>{t('organization.role.field.code')}</span>
            <input
              aria-label={t('organization.role.field.code')}
              placeholder={t('organization.role.placeholder.code')}
              value={model.roleForm.code}
              onChange={(event) => model.setRoleForm({ ...model.roleForm, code: event.target.value })}
            />
          </label>
        </div>
        <div className="dashboard-form-row">
          <label className="organization-data-scope-field">
            <span>{t('organization.role.field.dataScope')}</span>
            <Select
              options={dataScopeOrder.map((scope) => ({
                label: t(dataScopeLabels[scope]),
                value: scope,
              }))}
              value={model.roleForm.data_scope}
              onChange={(value) =>
                model.setRoleForm({
                  ...model.roleForm,
                  data_scope: value ?? 'self',
                })
              }
            />
            <small className="organization-data-scope-hint">{t('organization.role.hint.dataScope')}</small>
          </label>
        </div>
        {model.roleModalMode === 'create' ? (
          <div className="organization-permission-layout">
            <OrganizationPermissionMatrix
              groups={model.permissionGroups}
              selectedIds={model.roleForm.permission_ids}
              onTogglePermission={model.toggleRoleFormPermission}
              onToggleSection={model.setRoleFormSectionPermissions}
            />
          </div>
        ) : (
          <div className="organization-password-note">{t('organization.role.hint.editPermissions')}</div>
        )}
        <div className="modal-actions">
          <button className="secondary-inline" type="button" onClick={() => model.setRoleModalMode(null)}>
            {t('common.cancel')}
          </button>
          <button className="inline-submit" disabled={model.busyAction?.startsWith('role')} type="submit">
            {model.roleModalMode === 'create'
              ? t('organization.role.action.createSubmit')
              : t('organization.role.action.saveSubmit')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
