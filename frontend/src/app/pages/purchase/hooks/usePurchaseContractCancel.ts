import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  cancelPurchaseContract,
  reissuePurchaseContract,
  type PurchaseContract,
} from '@/api'
import { showError } from '@/shared/errors'
import { moduleDetailPath, purchaseContractPath } from '@/app/routes'
import { t } from '@/app/appI18n'

type Options = {
  contract: PurchaseContract | null
  onNavigate: (path: string) => void
  setMessage: (message: string) => void
  onSaved: (contract: PurchaseContract) => Promise<void>
}

/** 作废与作废重开弹窗。 */
export function usePurchaseContractCancel({
  contract,
  onNavigate,
  setMessage,
  onSaved,
}: Options) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')
  const [reissueModalOpen, setReissueModalOpen] = useState(false)
  const [reissueReason, setReissueReason] = useState('')
  const [reissueReasonError, setReissueReasonError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function openCancelModal() {
    setCancelReason('')
    setCancelReasonError('')
    setCancelModalOpen(true)
  }

  function closeCancelModal() {
    setCancelModalOpen(false)
  }

  function changeCancelReason(value: string) {
    setCancelReason(value)
    setCancelReasonError('')
  }

  async function submitCancellation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!contract) return
    if (!cancelReason.trim()) {
      setCancelReasonError(t('purchase.contract.cancel.reasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const cancelled = await cancelPurchaseContract(contract.id, {
        reason: cancelReason.trim(),
      })
      setCancelModalOpen(false)
      setMessage(t('purchase.contract.cancel.success', { code: cancelled.code }))
      await onSaved(cancelled)
    } catch (caught) {
      showError(caught, t('purchase.contract.message.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openReissueModal() {
    setReissueReason('')
    setReissueReasonError('')
    setReissueModalOpen(true)
  }

  function closeReissueModal() {
    setReissueModalOpen(false)
  }

  function changeReissueReason(value: string) {
    setReissueReason(value)
    setReissueReasonError('')
  }

  async function submitReissue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!contract) return
    if (!reissueReason.trim()) {
      setReissueReasonError(t('purchase.contract.cancel.reissueReasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const reissued = await reissuePurchaseContract(contract.id, {
        reason: reissueReason.trim(),
      })
      setReissueModalOpen(false)
      setMessage(t('purchase.contract.cancel.reissueSuccess', { code: reissued.code }))
      await onSaved(reissued)
      onNavigate(moduleDetailPath(purchaseContractPath, reissued.id))
    } catch (caught) {
      showError(caught, t('purchase.contract.message.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    cancelModalOpen,
    cancelReason,
    cancelReasonError,
    submitting,
    openCancelModal,
    closeCancelModal,
    changeCancelReason,
    submitCancellation,
    reissueModalOpen,
    reissueReason,
    reissueReasonError,
    openReissueModal,
    closeReissueModal,
    changeReissueReason,
    submitReissue,
  }
}

export type PurchaseContractCancelModel = ReturnType<typeof usePurchaseContractCancel>
