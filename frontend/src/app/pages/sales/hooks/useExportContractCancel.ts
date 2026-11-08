import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  cancelExportContract,
  reissueExportContract,
  type ExportContract,
} from '@/api'
import { showError } from '@/shared/errors'
import { exportContractPath, moduleDetailPath } from '@/app/routes'
import { t } from '@/app/appI18n'

type Options = {
  contract: ExportContract | null
  onNavigate: (path: string) => void
  setMessage: (message: string) => void
  onSaved: (contract: ExportContract) => Promise<void>
}

/** 出口合同作废与作废重开弹窗。 */
export function useExportContractCancel({
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
      setCancelReasonError(t('sales.contract.cancel.reasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const cancelled = await cancelExportContract(contract.id, {
        reason: cancelReason.trim(),
      })
      setCancelModalOpen(false)
      setMessage(t('sales.contract.cancel.success', { code: cancelled.code }))
      await onSaved(cancelled)
    } catch (caught) {
      showError(caught, t('sales.contract.message.saveFailed'))
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
      setReissueReasonError(t('sales.contract.cancel.reissueReasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const reissued = await reissueExportContract(contract.id, {
        reason: reissueReason.trim(),
      })
      setReissueModalOpen(false)
      setMessage(t('sales.contract.cancel.reissueSuccess', { code: reissued.code }))
      await onSaved(reissued)
      onNavigate(moduleDetailPath(exportContractPath, reissued.id))
    } catch (caught) {
      showError(caught, t('sales.contract.message.createFailed'))
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

export type ExportContractCancelModel = ReturnType<typeof useExportContractCancel>
