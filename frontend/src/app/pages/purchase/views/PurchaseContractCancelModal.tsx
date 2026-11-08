import { Alert, Input } from 'antd'

import { FormModal } from '@/shared/ui'
import { t } from '@/app/appI18n'

import type { PurchaseContractCancelModel } from '../hooks/usePurchaseContractCancel'

type Props = { model: PurchaseContractCancelModel }

export function PurchaseContractCancelModal({ model }: Props) {
  return (
    <FormModal
      centered
      open={model.cancelModalOpen}
      submitDanger
      submitLabel={t('purchase.contract.cancel.confirm')}
      submitting={model.submitting}
      title={t('purchase.contract.cancel.title')}
      onCancel={model.closeCancelModal}
      onSubmit={model.submitCancellation}
    >
      <Alert message={t('purchase.contract.cancel.hint')} showIcon type="warning" />
      <label htmlFor="purchase-contract-cancel-reason">
        {t('purchase.contract.cancel.reason')}
        <Input.TextArea
          aria-describedby={
            model.cancelReasonError ? 'purchase-contract-cancel-error' : undefined
          }
          aria-invalid={Boolean(model.cancelReasonError)}
          id="purchase-contract-cancel-reason"
          placeholder={t('purchase.contract.cancel.reasonPlaceholder')}
          rows={4}
          value={model.cancelReason}
          onChange={(event) => model.changeCancelReason(event.currentTarget.value)}
        />
      </label>
      {model.cancelReasonError ? (
        <span className="form-field-error" id="purchase-contract-cancel-error">
          {model.cancelReasonError}
        </span>
      ) : null}
    </FormModal>
  )
}
