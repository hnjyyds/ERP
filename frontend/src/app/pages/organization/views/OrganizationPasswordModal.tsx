import { Modal } from 'antd'
import { Copy } from 'lucide-react'

import { t } from '@/app/appI18n'

import type { useOrganizationManagement } from '../hooks/useOrganizationManagement'

type Props = { model: ReturnType<typeof useOrganizationManagement> }

export function OrganizationPasswordModal({ model }: Props) {
  const passwordReveal = model.passwordReveal
  return (
    <Modal
      centered
      footer={null}
      open={Boolean(passwordReveal)}
      title={passwordReveal?.title ?? t('organization.user.field.password')}
      width={520}
      onCancel={() => model.setPasswordReveal(null)}
    >
      {passwordReveal ? (
        <section className="organization-password-reveal">
          <p>
            {t('organization.user.message.passwordOnce', {
              username: passwordReveal.username,
              title: passwordReveal.title,
            })}
          </p>
          <div>
            <code>{passwordReveal.password}</code>
            <button className="inline-submit" type="button" onClick={() => void model.copyPassword(passwordReveal.password)}>
              <Copy size={15} />
              {t('organization.action.copy')}
            </button>
          </div>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => model.setPasswordReveal(null)}>
              {t('common.close')}
            </button>
          </div>
        </section>
      ) : null}
    </Modal>
  )
}
