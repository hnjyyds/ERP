import { Modal, Select } from 'antd'
import { ShieldCheck } from 'lucide-react'

import { t } from '@/app/appI18n'
import { UserAvatarPicker } from '@/shared/ui'

import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationUserModal({ model }: Props) {
  return (
    <Modal
      centered
      footer={null}
      open={Boolean(model.userModalMode)}
      title={
        model.userModalMode === 'create'
          ? t('organization.user.modal.createTitle')
          : t('organization.user.modal.editTitle')
      }
      width={760}
      onCancel={() => model.setUserModalMode(null)}
    >
      <form className="dashboard-form modal-dashboard-form organization-form" onSubmit={model.submitUserForm}>
        <UserAvatarPicker
          label={model.form.display_name || model.form.username || t('organization.user.avatarFallback')}
          value={{
            avatar_type: model.form.avatar_type,
            avatar_value: model.form.avatar_value,
          }}
          onChange={(avatar) => model.setForm({ ...model.form, ...avatar })}
        />
        <div className="dashboard-form-row">
          <label>
            <span>{t('organization.user.field.username')}</span>
            <input
              aria-label={t('organization.user.field.username')}
              disabled={model.userModalMode === 'edit'}
              placeholder={t('organization.user.placeholder.username')}
              value={model.form.username}
              onChange={(event) => model.setForm({ ...model.form, username: event.target.value })}
            />
          </label>
          <label>
            <span>{t('organization.user.field.displayName')}</span>
            <input
              aria-label={t('organization.user.field.displayName')}
              value={model.form.display_name}
              onChange={(event) => model.setForm({ ...model.form, display_name: event.target.value })}
            />
          </label>
        </div>
        <label>
          <span>{t('organization.user.field.department')}</span>
          <Select
            disabled={!model.departments.length}
            options={model.departments.map((department) => ({
              value: department.id,
              label: department.name,
            }))}
            placeholder={t('organization.user.placeholder.department')}
            value={model.form.department_id || undefined}
            onChange={(value) => model.setForm({ ...model.form, department_id: value })}
          />
        </label>
        <div className="organization-role-picker">
          <span>{t('organization.user.field.role')}</span>
          <div>
            {model.roles.map((role) => {
              const checked = model.form.role_ids.includes(role.id)
              return (
                <button
                  aria-pressed={checked}
                  className={checked ? 'selected' : ''}
                  key={role.id}
                  type="button"
                  onClick={() => model.toggleRole(role.id)}
                >
                  <ShieldCheck size={15} />
                  {role.name}
                </button>
              )
            })}
          </div>
        </div>
        <label className="organization-toggle">
          <input
            aria-label={t('organization.user.field.accountActive')}
            checked={model.form.is_active}
            type="checkbox"
            onChange={(event) => model.setForm({ ...model.form, is_active: event.target.checked })}
          />
          <span>{t('organization.user.field.accountActive')}</span>
        </label>
        {model.userModalMode === 'create' ? (
          <div className="organization-password-note">{t('organization.user.hint.initialPassword')}</div>
        ) : null}
        <div className="modal-actions">
          <button className="secondary-inline" type="button" onClick={() => model.setUserModalMode(null)}>
            {t('common.cancel')}
          </button>
          <button className="inline-submit" disabled={model.busyAction === model.userModalMode} type="submit">
            {model.userModalMode === 'create'
              ? t('organization.user.action.createSubmit')
              : t('organization.user.action.saveSubmit')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
