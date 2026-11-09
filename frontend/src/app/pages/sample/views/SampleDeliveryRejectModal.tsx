import { Input, Modal } from 'antd'

import { t } from '@/app/appI18n'

import type { SampleDeliveryRejectFormState } from '../sampleDeliveryHelpers'

type Props = {
  open: boolean
  submitting: boolean
  form: SampleDeliveryRejectFormState
  onFormChange: (form: SampleDeliveryRejectFormState) => void
  onCancel: () => void
  onConfirm: () => void
}

export function SampleDeliveryRejectModal({
  open,
  submitting,
  form,
  onFormChange,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      destroyOnHidden
      cancelText={t('sample.delivery.reject.cancel')}
      confirmLoading={submitting}
      okButtonProps={{ disabled: !form.rejection_reason.trim() }}
      okText={t('sample.delivery.reject.confirm')}
      open={open}
      title={t('sample.delivery.reject.title')}
      onCancel={onCancel}
      onOk={onConfirm}
    >
      <div className="record-form">
        <label>
          {t('sample.delivery.reject.rejectedAt')}
          <Input
            type="date"
            value={form.rejected_at}
            onChange={(event) =>
              onFormChange({ ...form, rejected_at: event.target.value })
            }
          />
        </label>
        <label>
          {t('sample.delivery.reject.reason')}
          <Input.TextArea
            maxLength={2000}
            placeholder={t('sample.delivery.reject.reasonPlaceholder')}
            rows={4}
            showCount
            value={form.rejection_reason}
            onChange={(event) =>
              onFormChange({ ...form, rejection_reason: event.target.value })
            }
          />
        </label>
      </div>
    </Modal>
  )
}
