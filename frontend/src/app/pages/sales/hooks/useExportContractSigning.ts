import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import {
  addExportContractAdvancePayment,
  registerExportContractSignature,
  type ExportContract,
} from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { todayInputValue } from '@/app/pages/appHelpers'

import {
  exportContractAdvancePaymentPayload,
  exportContractSignaturePayload,
  initialExportContractAdvancePaymentForm,
  initialExportContractSignatureForm,
  type ExportContractAdvancePaymentFormState,
  type ExportContractSignatureFormState,
} from '../exportContractHelpers'

type Options = {
  detailId: string | null
  contract: ExportContract | null
  setMessage: (message: string) => void
  onSaved: (contract: ExportContract) => Promise<void>
}

/** 出口合同客户签署与预收款登记。 */
export function useExportContractSigning({
  detailId,
  contract,
  setMessage,
  onSaved,
}: Options) {
  const [signatureForm, setSignatureForm] = useState<ExportContractSignatureFormState>(() =>
    initialExportContractSignatureForm(),
  )
  const [advancePaymentForm, setAdvancePaymentForm] =
    useState<ExportContractAdvancePaymentFormState>(() => initialExportContractAdvancePaymentForm())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!detailId) return
    setSignatureForm({
      signed_by: contract?.signatures[0]?.signed_by ?? '',
      signed_at: contract?.customer_signed_at ?? contract?.contract_date ?? todayInputValue(),
      signature_method: contract?.signatures[0]?.signature_method ?? 'email_scan',
      file_no: contract?.signatures[0]?.file_no ?? '',
      remark: contract?.signatures[0]?.remark ?? '',
    })
    setAdvancePaymentForm({
      payment_no: contract
        ? `AR-${contract.code}-${contract.advance_payments.length + 1}`
        : '',
      received_at: todayInputValue(),
      amount: '',
      currency: contract?.currency ?? 'USD',
      payer_name: contract?.customer_name ?? '',
      remark: '',
    })
  }, [detailId, contract?.id, contract?.approval_status, contract?.signature_status])

  async function registerSignature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!contract) return
    setSubmitting(true)
    setMessage('')
    try {
      const signed = await registerExportContractSignature(
        contract.id,
        exportContractSignaturePayload(signatureForm),
      )
      setMessage(t('sales.contract.message.signatureRegistered', { code: signed.code }))
      await onSaved(signed)
    } catch (caught) {
      showError(caught, t('sales.contract.message.signatureFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function addAdvancePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!contract) return
    setSubmitting(true)
    setMessage('')
    try {
      const payment = await addExportContractAdvancePayment(
        contract.id,
        exportContractAdvancePaymentPayload(advancePaymentForm),
      )
      setMessage(t('sales.contract.message.advancePaymentAdded', { no: payment.payment_no }))
      setAdvancePaymentForm({
        ...initialExportContractAdvancePaymentForm(),
        currency: contract.currency,
        payer_name: contract.customer_name,
      })
      await onSaved(contract)
    } catch (caught) {
      showError(caught, t('sales.contract.message.advancePaymentFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    signatureForm,
    setSignatureForm,
    advancePaymentForm,
    setAdvancePaymentForm,
    submitting,
    registerSignature,
    addAdvancePayment,
  }
}

export type ExportContractSigningModel = ReturnType<typeof useExportContractSigning>
