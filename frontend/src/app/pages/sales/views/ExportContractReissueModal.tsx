import { Alert, Input } from 'antd'

import { FormModal } from '@/shared/ui'
import { t } from '@/app/appI18n'

import type { ExportContractCancelModel } from '../hooks/useExportContractCancel'

type Props = { model: ExportContractCancelModel }

export function ExportContractReissueModal({ model }: Props) {
  return (
    <FormModal
      destroyOnHidden
      open={model.reissueModalOpen}
      submitLabel={t('sales.contract.cancel.reissueConfirm')}
      submitType="primary"
      submitting={model.submitting}
      title={t('sales.contract.cancel.reissueTitle')}
      onCancel={model.closeReissueModal}
      onSubmit={model.submitReissue}
    >
      <Alert message={t('sales.contract.cancel.reissueHint')} showIcon type="info" />
      <label htmlFor="export-contract-reissue-reason">
        {t('sales.contract.cancel.reissueReason')}
        <Input.TextArea
          aria-describedby={
            model.reissueReasonError ? 'export-contract-reissue-error' : undefined
          }
          aria-invalid={Boolean(model.reissueReasonError)}
          id="export-contract-reissue-reason"
          placeholder={t('sales.contract.cancel.reissuePlaceholder')}
          rows={4}
          value={model.reissueReason}
          onChange={(event) => model.changeReissueReason(event.target.value)}
        />
      </label>
      {model.reissueReasonError ? (
        <span className="form-field-error" id="export-contract-reissue-error">
          {model.reissueReasonError}
        </span>
      ) : null}
    </FormModal>
  )
}
