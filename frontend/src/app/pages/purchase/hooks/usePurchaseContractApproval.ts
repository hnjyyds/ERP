import { Modal } from 'antd'
import { useEffect, useState } from 'react'

import {
  approvePurchaseContract,
  generatePurchaseContractTemplate,
  submitPurchaseContract,
  type CurrentUser,
  type PurchaseContract,
  type PurchaseContractApprovePayload,
} from '@/api'
import { showError, showWarningDialog } from '@/shared/errors'
import { downloadBase64File } from '@/shared/print'
import { t } from '@/app/appI18n'
import { canApproveAssignedRecord, todayInputValue } from '@/app/pages/appHelpers'

import {
  initialPurchaseContractApproveForm,
  purchaseContractApprovePayload,
  type PurchaseContractApproveFormState,
} from '../purchaseContractHelpers'

type Options = {
  currentUser: CurrentUser
  contract: PurchaseContract | null
  setMessage: (message: string) => void
  onSaved: (contract: PurchaseContract) => Promise<void>
}

/** 采购合同提交审批、审批弹窗、驳回与模板生成。 */
export function usePurchaseContractApproval({
  currentUser,
  contract,
  setMessage,
  onSaved,
}: Options) {
  const [approveForm, setApproveForm] = useState<PurchaseContractApproveFormState>(() =>
    initialPurchaseContractApproveForm(),
  )
  const [reviewerId, setReviewerId] = useState('')
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setApproveForm({
      reviewer_name: contract?.reviewer_name ?? '',
      approved_at: contract?.approved_at ?? contract?.contract_date ?? todayInputValue(),
      rejection_reason: contract?.rejection_reason ?? '',
    })
    setReviewerId(contract?.reviewer_id ?? '')
  }, [contract?.id, contract?.approval_status])

  async function submitSelectedContract() {
    if (!contract) return
    if (!reviewerId) {
      showError(new Error(t('purchase.contract.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const submitted = await submitPurchaseContract(contract.id, { reviewer_id: reviewerId })
      setMessage(t('purchase.contract.message.submitted', { code: submitted.code }))
      await onSaved(submitted)
    } catch (caught) {
      showError(caught, t('purchase.contract.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function reviewSelectedContract(decision: PurchaseContractApprovePayload['decision']) {
    if (!contract) return
    if (
      !canApproveAssignedRecord(currentUser, contract.reviewer_id, 'purchase:contract:approve')
    ) {
      showError(
        new Error(
          t('purchase.contract.action.approverMismatch', {
            name: contract.reviewer_name ?? t('purchase.contract.action.defaultReviewer'),
          }),
        ),
      )
      return
    }
    if (decision === 'rejected' && !approveForm.rejection_reason.trim()) {
      showWarningDialog(t('purchase.contract.validation.rejectionReasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const reviewed = await approvePurchaseContract(
        contract.id,
        purchaseContractApprovePayload(approveForm, decision),
      )
      setMessage(
        decision === 'approved'
          ? t('purchase.contract.message.approved', { code: reviewed.code })
          : t('purchase.contract.message.rejected', { code: reviewed.code }),
      )
      setApprovalModalOpen(false)
      await onSaved(reviewed)
    } catch (caught) {
      showError(caught, t('purchase.contract.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function confirmRejectSelectedContract() {
    if (!approveForm.rejection_reason.trim()) {
      showWarningDialog(t('purchase.contract.validation.rejectionReasonRequired'))
      return
    }
    Modal.confirm({
      centered: true,
      title: t('purchase.contract.action.confirmRejectTitle'),
      content: t('purchase.contract.action.confirmRejectContent'),
      okText: t('purchase.contract.action.confirmReject'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: () => reviewSelectedContract('rejected'),
    })
  }

  async function generateSelectedContractTemplate() {
    if (!contract) return
    setSubmitting(true)
    setMessage('')
    try {
      const document_ = await generatePurchaseContractTemplate(contract.id)
      downloadBase64File(document_.filename, document_.content_base64, document_.content_type)
      setMessage(
        t('purchase.contract.message.templateGenerated', { filename: document_.filename }),
      )
    } catch (caught) {
      showError(caught, t('purchase.contract.message.templateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    approveForm,
    setApproveForm,
    reviewerId,
    setReviewerId,
    approvalModalOpen,
    openApprovalModal: () => setApprovalModalOpen(true),
    closeApprovalModal: () => setApprovalModalOpen(false),
    submitting,
    submitSelectedContract,
    reviewSelectedContract,
    confirmRejectSelectedContract,
    generateSelectedContractTemplate,
  }
}

export type PurchaseContractApprovalModel = ReturnType<typeof usePurchaseContractApproval>
