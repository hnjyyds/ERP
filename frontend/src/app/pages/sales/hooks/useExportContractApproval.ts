import { useEffect, useState } from 'react'

import {
  approveExportContract,
  submitExportContract,
  type CurrentUser,
  type ExportContract,
} from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { canApproveAssignedRecord, todayInputValue } from '@/app/pages/appHelpers'

import {
  exportContractApprovePayload,
  initialExportContractApproveForm,
  type ExportContractApproveFormState,
} from '../exportContractHelpers'

type Options = {
  currentUser: CurrentUser
  detailId: string | null
  contract: ExportContract | null
  setMessage: (message: string) => void
  onSaved: (contract: ExportContract) => Promise<void>
}

/** 出口合同提交审批与审批操作。 */
export function useExportContractApproval({
  currentUser,
  detailId,
  contract,
  setMessage,
  onSaved,
}: Options) {
  const [reviewerId, setReviewerId] = useState('')
  const [approveForm, setApproveForm] = useState<ExportContractApproveFormState>(() =>
    initialExportContractApproveForm(),
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!detailId) return
    setApproveForm({
      reviewer_name: contract?.reviewer_name ?? '',
      approved_at: contract?.approved_at ?? todayInputValue(),
    })
    setReviewerId(contract?.reviewer_id ?? '')
  }, [detailId, contract?.id, contract?.approval_status])

  async function submitContractForApproval() {
    if (!contract) return
    if (!reviewerId) {
      showError(new Error(t('sales.contract.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const submitted = await submitExportContract(contract.id, { reviewer_id: reviewerId })
      setMessage(t('sales.contract.message.submitted', { code: submitted.code }))
      await onSaved(submitted)
    } catch (caught) {
      showError(caught, t('sales.contract.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function approveContract() {
    if (!contract) return
    if (!canApproveAssignedRecord(currentUser, contract.reviewer_id, 'sales:contract:approve')) {
      showError(
        new Error(
          t('sales.contract.action.approverMismatch', {
            name: contract.reviewer_name ?? t('sales.contract.action.defaultReviewer'),
          }),
        ),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const approved = await approveExportContract(
        contract.id,
        exportContractApprovePayload(approveForm),
      )
      setMessage(t('sales.contract.message.approved', { code: approved.code }))
      await onSaved(approved)
    } catch (caught) {
      showError(caught, t('sales.contract.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    reviewerId,
    setReviewerId,
    approveForm,
    setApproveForm,
    submitting,
    submitContractForApproval,
    approveContract,
  }
}

export type ExportContractApprovalModel = ReturnType<typeof useExportContractApproval>
