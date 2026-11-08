import { Modal, Select } from 'antd'
import { Save } from 'lucide-react'

import { t } from '@/app/appI18n'

import { OrganizationPermissionMatrix } from '../components/OrganizationPermissionMatrix'
import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationPermissionModal({ model }: Props) {
  const selectedRole = model.selectedRole
  return (
    <Modal
      centered
      footer={null}
      open={model.permissionModalOpen}
      title={t('organization.permission.modal.title')}
      width={960}
      onCancel={() => model.setPermissionModalOpen(false)}
    >
      <section className="organization-permissions in-modal" aria-label={t('organization.permission.pageAria')}>
        <div className="organization-permissions-head">
          <div>
            <span>{t('organization.permission.title')}</span>
            <p>{t('organization.permission.description')}</p>
          </div>
          <div className="organization-permission-actions">
            <label className="organization-permission-role-select">
              <span>{t('organization.permission.configRole')}</span>
              <Select
                disabled={!model.roles.length}
                options={model.roles.map((role) => ({ label: role.name, value: role.id }))}
                value={selectedRole?.id}
                onChange={model.selectRoleIdForPermissions}
              />
            </label>
            <button
              className="inline-submit"
              disabled={!selectedRole || model.busyAction === `permissions-${selectedRole.id}`}
              type="button"
              onClick={() => void model.submitRolePermissions()}
            >
              <Save size={15} />
              {t('organization.permission.action.save')}
            </button>
          </div>
        </div>

        <OrganizationPermissionMatrix
          groups={model.permissionGroups}
          selectedIds={model.permissionFormIds}
          showCategory
          showGroupSelectAll
          onToggleGroup={model.setGroupPermissions}
          onTogglePermission={model.togglePermission}
          onToggleSection={model.setSectionPermissions}
        />
      </section>
    </Modal>
  )
}
