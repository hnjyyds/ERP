import { Input, Modal } from 'antd'

import { t } from '@/app/appI18n'

import type { ShipmentRejectFormState } from '../shipmentHelpers'

type Props = {
  open: boolean
  submitting: boolean
  form: ShipmentRejectFormState
  onFormChange: (form: ShipmentRejectFormState) => void
  onCancel: () => void
  onConfirm: () => void
}

export function ShipmentRejectModal({
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
      cancelText={t('sales.shipment.reject.cancel')}
      confirmLoading={submitting}
      okButtonProps={{ disabled: !form.rejection_reason.trim() }}
      okText={t('sales.shipment.reject.confirm')}
      open={open}
      title={t('sales.shipment.reject.title')}
      onCancel={onCancel}
      onOk={onConfirm}
    >
      <div className="record-form">
        <label>
          {t('sales.shipment.reject.rejectedAt')}
          <Input
            type="date"
            value={form.rejected_at}
            onChange={(event) => onFormChange({ ...form, rejected_at: event.target.value })}
          />
        </label>
        <label>
          {t('sales.shipment.reject.reason')}
          <Input.TextArea
            maxLength={2000}
            placeholder={t('sales.shipment.reject.reasonPlaceholder')}
            rows={4}
            showCount
            value={form.rejection_reason}
            onChange={(event) => onFormChange({ ...form, rejection_reason: event.target.value })}
          />
        </label>
      </div>
    </Modal>
  )
}
