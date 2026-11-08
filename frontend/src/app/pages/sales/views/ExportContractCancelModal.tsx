import { Alert, Input } from 'antd'

import { FormModal } from '@/shared/ui'
import { t } from '@/app/appI18n'

import type { ExportContractCancelModel } from '../hooks/useExportContractCancel'

type Props = { model: ExportContractCancelModel }

export function ExportContractCancelModal({ model }: Props) {
  return (
    <FormModal
      destroyOnHidden
      open={model.cancelModalOpen}
      submitDanger
      submitLabel={t('sales.contract.cancel.confirm')}
      submitting={model.submitting}
      title={t('sales.contract.cancel.title')}
      onCancel={model.closeCancelModal}
      onSubmit={model.submitCancellation}
    >
      <Alert message={t('sales.contract.cancel.hint')} showIcon type="warning" />
      <label htmlFor="export-contract-cancel-reason">
        {t('sales.contract.cancel.reason')}
        <Input.TextArea
          aria-describedby={
            model.cancelReasonError ? 'export-contract-cancel-error' : undefined
          }
          aria-invalid={Boolean(model.cancelReasonError)}
          id="export-contract-cancel-reason"
          placeholder={t('sales.contract.cancel.reasonPlaceholder')}
          rows={4}
          value={model.cancelReason}
          onChange={(event) => model.changeCancelReason(event.target.value)}
        />
      </label>
      {model.cancelReasonError ? (
        <span className="form-field-error" id="export-contract-cancel-error">
          {model.cancelReasonError}
        </span>
      ) : null}
    </FormModal>
  )
}
