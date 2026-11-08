import { Button, Input, Modal } from 'antd'

import type { CurrentUser, PurchaseContract } from '@/api'
import { canApproveAssignedRecord } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import type { PurchaseContractApprovalModel } from '../hooks/usePurchaseContractApproval'

type Props = {
  currentUser: CurrentUser
  contract: PurchaseContract
  model: PurchaseContractApprovalModel
}

export function PurchaseContractApprovalModal({ currentUser, contract, model }: Props) {
  const canReview =
    contract.approval_status === 'submitted' &&
    canApproveAssignedRecord(currentUser, contract.reviewer_id, 'purchase:contract:approve')

  return (
    <Modal
      centered
      footer={null}
      open={model.approvalModalOpen}
      title={t('purchase.contract.action.approveContract')}
      width={720}
      onCancel={model.closeApprovalModal}
    >
      <div className="workflow-modal-content entity-modal-form">
        <div className="record-form accessory-form approval-form">
          <div className="form-divider">{t('purchase.contract.detail.approvalTitle')}</div>
          <div className="form-pair two">
            <label>
              {t('purchase.contract.field.approver')}
              <Input disabled value={contract.reviewer_name ?? ''} />
            </label>
            <label>
              {t('purchase.contract.field.approvedAt')}
              <Input
                type="date"
                value={model.approveForm.approved_at}
                onInput={(event) =>
                  model.setApproveForm((current) => ({
                    ...current,
                    approved_at: event.currentTarget.value,
                  }))
                }
              />
            </label>
          </div>
          <label className="approval-rejection-reason">
            <span>
              {t('purchase.contract.field.rejectionReason')} <i aria-hidden="true">*</i>
            </span>
            <Input.TextArea
              aria-label={t('purchase.contract.field.rejectionReason')}
              maxLength={2000}
              placeholder={t('purchase.contract.validation.rejectionReasonPlaceholder')}
              required
              rows={3}
              value={model.approveForm.rejection_reason}
              onChange={(event) =>
                model.setApproveForm((current) => ({
                  ...current,
                  rejection_reason: event.currentTarget.value,
                }))
              }
            />
          </label>
          <div className="approval-action-row">
            <Button
              danger
              disabled={!canReview}
              loading={model.submitting}
              onClick={model.confirmRejectSelectedContract}
            >
              {t('purchase.contract.action.rejectContract')}
            </Button>
            <Button
              disabled={!canReview}
              loading={model.submitting}
              type="primary"
              onClick={() => void model.reviewSelectedContract('approved')}
            >
              {t('purchase.contract.action.approve')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
