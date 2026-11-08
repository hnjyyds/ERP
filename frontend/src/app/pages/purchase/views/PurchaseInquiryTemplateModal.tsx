import { Button, Input, Modal } from 'antd'

import { t } from '@/app/appI18n'

import type { usePurchaseInquiryWorkflow } from '../hooks/usePurchaseInquiryWorkflow'

type Props = {
  workflow: ReturnType<typeof usePurchaseInquiryWorkflow>
}

export function PurchaseInquiryTemplateModal({ workflow }: Props) {
  const form = workflow.templateForm
  const setForm = workflow.setTemplateForm

  return (
    <Modal
      centered
      footer={null}
      open={workflow.actionModal === 'template'}
      title={t('purchase.inquiry.action.sendTemplate')}
      width={720}
      onCancel={() => workflow.setActionModal(null)}
    >
      <div className="workflow-modal-content entity-modal-form">
        <form className="record-form accessory-form" onSubmit={workflow.sendTemplate}>
          <div className="form-divider">{t('purchase.inquiry.form.templateSection')}</div>
          <label>
            {t('purchase.inquiry.field.templateName')}
            <Input
              value={form.template_name}
              onChange={(event) => setForm({ ...form, template_name: event.target.value })}
            />
          </label>
          <label>
            {t('purchase.inquiry.field.recipientEmails')}
            <Input
              value={form.recipient_emails}
              onChange={(event) => setForm({ ...form, recipient_emails: event.target.value })}
            />
          </label>
          <Button htmlType="submit" loading={workflow.submitting}>
            {t('purchase.inquiry.action.sendTemplate')}
          </Button>
        </form>
      </div>
    </Modal>
  )
}
