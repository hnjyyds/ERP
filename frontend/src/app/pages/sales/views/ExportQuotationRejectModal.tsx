import { Input, Modal } from 'antd'

import { t } from '@/app/appI18n'

import type { useExportQuotationWorkflow } from '../hooks/useExportQuotationWorkflow'

type Props = {
  workflow: ReturnType<typeof useExportQuotationWorkflow>
}

export function ExportQuotationRejectModal({ workflow }: Props) {
  const { rejectForm, setRejectForm } = workflow

  return (
    <Modal
      destroyOnHidden
      cancelText={t('sales.quotation.reject.cancel')}
      confirmLoading={workflow.submitting}
      okButtonProps={{ disabled: !rejectForm.rejection_reason.trim() }}
      okText={t('sales.quotation.reject.confirm')}
      open={workflow.rejectOpen}
      title={t('sales.quotation.reject.title')}
      onCancel={workflow.closeRejectModal}
      onOk={() => void workflow.rejectQuotation()}
    >
      <div className="record-form">
        <label>
          {t('sales.quotation.reject.rejectedAt')}
          <Input
            type="date"
            value={rejectForm.rejected_at}
            onChange={(event) =>
              setRejectForm((current) => ({ ...current, rejected_at: event.target.value }))
            }
          />
        </label>
        <label>
          {t('sales.quotation.reject.reason')}
          <Input.TextArea
            maxLength={2000}
            placeholder={t('sales.quotation.reject.reasonPlaceholder')}
            rows={4}
            showCount
            value={rejectForm.rejection_reason}
            onChange={(event) =>
              setRejectForm((current) => ({ ...current, rejection_reason: event.target.value }))
            }
          />
        </label>
      </div>
    </Modal>
  )
}
