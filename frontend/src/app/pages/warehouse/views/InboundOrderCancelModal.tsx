import type { FormEvent } from 'react'
import { Input } from 'antd'

import { FormModal } from '@/shared/ui'
import { t } from '@/app/appI18n'

type Props = {
  open: boolean
  submitting: boolean
  reason: string
  reasonError: string
  onReasonChange: (value: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function InboundOrderCancelModal({
  open,
  submitting,
  reason,
  reasonError,
  onReasonChange,
  onClose,
  onSubmit,
}: Props) {
  return (
    <FormModal
      open={open}
      submitDanger
      submitLabel={t('warehouse.inboundOrder.action.cancel')}
      submitting={submitting}
      title={t('warehouse.inboundOrder.action.cancel')}
      onCancel={onClose}
      onSubmit={onSubmit}
    >
      <p className="form-hint">{t('warehouse.inboundOrder.detail.cancelReason')}</p>
      <Input.TextArea
        aria-describedby={reasonError ? 'inbound-cancel-reason-error' : undefined}
        aria-invalid={Boolean(reasonError)}
        rows={3}
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
      />
      {reasonError ? (
        <div className="form-field-error" id="inbound-cancel-reason-error">
          {reasonError}
        </div>
      ) : null}
    </FormModal>
  )
}
