import { Alert, Input } from 'antd'

import { FormModal } from '@/shared/ui'
import { t } from '@/app/appI18n'

import type { PurchaseContractCancelModel } from '../hooks/usePurchaseContractCancel'

type Props = { model: PurchaseContractCancelModel }

export function PurchaseContractReissueModal({ model }: Props) {
  return (
    <FormModal
      centered
      open={model.reissueModalOpen}
      submitLabel={t('purchase.contract.cancel.reissueConfirm')}
      submitType="primary"
      submitting={model.submitting}
      title={t('purchase.contract.cancel.reissueTitle')}
      onCancel={model.closeReissueModal}
      onSubmit={model.submitReissue}
    >
      <Alert message={t('purchase.contract.cancel.reissueHint')} showIcon type="info" />
      <label htmlFor="purchase-contract-reissue-reason">
        {t('purchase.contract.cancel.reissueReason')}
        <Input.TextArea
          aria-describedby={
            model.reissueReasonError ? 'purchase-contract-reissue-error' : undefined
          }
          aria-invalid={Boolean(model.reissueReasonError)}
          id="purchase-contract-reissue-reason"
          placeholder={t('purchase.contract.cancel.reissuePlaceholder')}
          rows={4}
          value={model.reissueReason}
          onChange={(event) => model.changeReissueReason(event.currentTarget.value)}
        />
      </label>
      {model.reissueReasonError ? (
        <span className="form-field-error" id="purchase-contract-reissue-error">
          {model.reissueReasonError}
        </span>
      ) : null}
    </FormModal>
  )
}
