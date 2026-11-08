import { Input } from 'antd'
import type { FormEvent } from 'react'

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

export function OutboundOrderCancelModal({
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
      submitLabel={t('warehouse.outboundOrder.action.cancel')}
      submitting={submitting}
      title={t('warehouse.outboundOrder.action.cancel')}
      onCancel={onClose}
      onSubmit={onSubmit}
    >
      <p className="form-hint">{t('warehouse.outboundOrder.detail.cancelReason')}</p>
      <Input.TextArea
        aria-describedby={reasonError ? 'outbound-cancel-reason-error' : undefined}
        aria-invalid={Boolean(reasonError)}
        rows={3}
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
      />
      {reasonError ? (
        <div className="form-field-error" id="outbound-cancel-reason-error">
          {reasonError}
        </div>
      ) : null}
    </FormModal>
  )
}
