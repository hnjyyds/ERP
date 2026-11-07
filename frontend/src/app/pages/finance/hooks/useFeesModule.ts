import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  approveFeePaymentRequest,
  createFeePaymentRequest,
  createPartnerFeeInvoice,
  listFeePayables,
  listFeePaymentRequests,
  listPartnerFeeInvoices,
  type FeePayableItem,
  type FeePaymentRequest,
  type PartnerFeeInvoice,
} from '../../../../api'
import { showError } from '../../../../shared/errors'
import { canApproveAssignedRecord } from '../../appHelpers'
import {
  PartnerFeeInvoiceFormState,
  FeePaymentRequestFormState,
  FeePaymentApprovalFormState,
  initialPartnerFeeInvoiceForm,
  initialFeePaymentRequestForm,
  initialFeePaymentApprovalForm,
  partnerFeeInvoicePayload,
  feePaymentRequestPayload,
  feePaymentApprovalPayload,
} from '../financeHelpers'
import { t } from '../../../appI18n'

import type { FinanceModuleEnv } from '../financePageTypes'

export function useFeesModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, currentUser, setMessage, setError } = env

  const [partnerFeeInvoices, setPartnerFeeInvoices] = useState<PartnerFeeInvoice[]>([])

  const [feePaymentRequests, setFeePaymentRequests] = useState<FeePaymentRequest[]>([])

  const [feePayables, setFeePayables] = useState<FeePayableItem[]>([])

  const [selectedPartnerFeeInvoiceId, setSelectedPartnerFeeInvoiceId] = useState<string | null>(
    null,
  )

  const [selectedFeePaymentRequestId, setSelectedFeePaymentRequestId] = useState<string | null>(
    null,
  )

  const [feeInvoiceSearch, setFeeInvoiceSearch] = useState('')

  const [feeInvoiceStatusFilter, setFeeInvoiceStatusFilter] = useState('')

  const [feeInvoiceTypeFilter, setFeeInvoiceTypeFilter] = useState('')

  const [feeInvoicePartnerFilter, setFeeInvoicePartnerFilter] = useState('')

  const [feeInvoiceShipmentFilter, setFeeInvoiceShipmentFilter] = useState('')

  const [feePaymentRequestSearch, _setFeePaymentRequestSearch] = useState('')

  const [feePaymentRequestStatusFilter, _setFeePaymentRequestStatusFilter] = useState('')

  const [feePaymentRequestTypeFilter, _setFeePaymentRequestTypeFilter] = useState('')

  const [feePayableSearch, setFeePayableSearch] = useState('')

  const [feePayableStatusFilter, setFeePayableStatusFilter] = useState('')

  const [feePayableTypeFilter, setFeePayableTypeFilter] = useState('')

  const [feePayablePartnerFilter, setFeePayablePartnerFilter] = useState('')

  const [feePayableShipmentFilter, setFeePayableShipmentFilter] = useState('')

  const [partnerFeeInvoiceForm, setPartnerFeeInvoiceForm] = useState<PartnerFeeInvoiceFormState>(
    () => initialPartnerFeeInvoiceForm(),
  )

  const [feePaymentRequestForm, setFeePaymentRequestForm] = useState<FeePaymentRequestFormState>(
    () => initialFeePaymentRequestForm(),
  )

  const [feePaymentApprovalForm, setFeePaymentApprovalForm] = useState<FeePaymentApprovalFormState>(
    () => initialFeePaymentApprovalForm('', currentUser.display_name),
  )

  const [loadingPartnerFeeInvoices, setLoadingPartnerFeeInvoices] = useState(false)

  const [loadingFeePaymentRequests, setLoadingFeePaymentRequests] = useState(false)

  const [loadingFeePayables, setLoadingFeePayables] = useState(false)

  const [feeInvoiceModalOpen, setFeeInvoiceModalOpen] = useState(false)

  const [submittingPartnerFeeInvoice, setSubmittingPartnerFeeInvoice] = useState(false)

  const [partnerFeeInvoiceNoError, setPartnerFeeInvoiceNoError] = useState('')

  const [submittingFeePaymentRequest, setSubmittingFeePaymentRequest] = useState(false)

  const [submittingFeePaymentApproval, setSubmittingFeePaymentApproval] = useState(false)

  const selectedPartnerFeeInvoice = useMemo(
    () =>
      partnerFeeInvoices.find((item) => item.id === selectedPartnerFeeInvoiceId) ??
      partnerFeeInvoices[0] ??
      null,
    [partnerFeeInvoices, selectedPartnerFeeInvoiceId],
  )

  const selectedFeePaymentRequest = useMemo(
    () =>
      feePaymentRequests.find((item) => item.id === selectedFeePaymentRequestId) ??
      feePaymentRequests[0] ??
      null,
    [feePaymentRequests, selectedFeePaymentRequestId],
  )

  useEffect(() => {
    if (!selectedPartnerFeeInvoice) return
    const requestForInvoice =
      selectedFeePaymentRequest?.partner_fee_invoice_id === selectedPartnerFeeInvoice.id
        ? selectedFeePaymentRequest
        : null
    setFeePaymentRequestForm((current) => ({
      ...current,
      partner_fee_invoice_id: selectedPartnerFeeInvoice.id,
      requested_amount: selectedPartnerFeeInvoice.unpaid_amount,
      currency: selectedPartnerFeeInvoice.currency,
    }))
    setFeePaymentApprovalForm((current) => ({
      ...current,
      approved_amount:
        requestForInvoice?.requested_amount ?? selectedPartnerFeeInvoice.unpaid_amount,
    }))
  }, [
    selectedPartnerFeeInvoice?.id,
    selectedPartnerFeeInvoice?.unpaid_amount,
    selectedPartnerFeeInvoice?.currency,
    selectedFeePaymentRequest?.id,
    selectedFeePaymentRequest?.partner_fee_invoice_id,
    selectedFeePaymentRequest?.requested_amount,
  ])

  async function loadPartnerFeeInvoices(preferredId?: string) {
    setLoadingPartnerFeeInvoices(true)
    setError('')
    try {
      const result = await listPartnerFeeInvoices({
        q: feeInvoiceSearch.trim() || undefined,
        status: feeInvoiceStatusFilter || undefined,
        fee_type: feeInvoiceTypeFilter || undefined,
        partner_id: feeInvoicePartnerFilter.trim() || undefined,
        shipment_no: feeInvoiceShipmentFilter.trim() || undefined,
      })
      setPartnerFeeInvoices(result.items)
      const nextInvoiceId =
        preferredId ??
        (activeModule === 'fees' && result.items.some((item) => item.id === detailId)
          ? detailId
          : null) ??
        (result.items.some((item) => item.id === selectedPartnerFeeInvoiceId)
          ? selectedPartnerFeeInvoiceId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedPartnerFeeInvoiceId(nextInvoiceId)
    } catch (caught) {
      showError(caught, t('finance.fee.message.loadInvoicesFailed'))
    } finally {
      setLoadingPartnerFeeInvoices(false)
    }
  }

  async function loadFeePaymentRequests(preferredId?: string) {
    setLoadingFeePaymentRequests(true)
    setError('')
    try {
      const result = await listFeePaymentRequests({
        q: feePaymentRequestSearch.trim() || undefined,
        status: feePaymentRequestStatusFilter || undefined,
        fee_type: feePaymentRequestTypeFilter || undefined,
        partner_id: feeInvoicePartnerFilter.trim() || undefined,
        shipment_no: feeInvoiceShipmentFilter.trim() || undefined,
      })
      setFeePaymentRequests(result.items)
      const nextRequestId =
        preferredId ??
        (result.items.some((item) => item.id === selectedFeePaymentRequestId)
          ? selectedFeePaymentRequestId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedFeePaymentRequestId(nextRequestId)
    } catch (caught) {
      showError(caught, t('finance.fee.message.loadPaymentRequestsFailed'))
    } finally {
      setLoadingFeePaymentRequests(false)
    }
  }

  async function loadFeePayables() {
    setLoadingFeePayables(true)
    setError('')
    try {
      const result = await listFeePayables({
        q: feePayableSearch.trim() || undefined,
        status: feePayableStatusFilter || undefined,
        fee_type: feePayableTypeFilter || undefined,
        partner_id: feePayablePartnerFilter.trim() || undefined,
        shipment_no: feePayableShipmentFilter.trim() || undefined,
      })
      setFeePayables(result.items)
    } catch (caught) {
      showError(caught, t('finance.fee.message.loadPayablesFailed'))
    } finally {
      setLoadingFeePayables(false)
    }
  }

  async function submitPartnerFeeInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!partnerFeeInvoiceForm.invoice_no.trim()) {
      setPartnerFeeInvoiceNoError(t('finance.fee.validation.invoiceNoRequired'))
      return
    }
    setPartnerFeeInvoiceNoError('')
    setSubmittingPartnerFeeInvoice(true)
    setMessage('')
    setError('')
    try {
      const created = await createPartnerFeeInvoice(partnerFeeInvoicePayload(partnerFeeInvoiceForm))
      setMessage(t('finance.fee.message.invoiceCreated', { code: created.invoice_no }))
      setPartnerFeeInvoiceForm(initialPartnerFeeInvoiceForm())
      setFeeInvoiceModalOpen(false)
      await loadPartnerFeeInvoices(created.id)
      await loadFeePayables()
    } catch (caught) {
      showError(caught, t('finance.fee.message.invoiceCreateFailed'))
    } finally {
      setSubmittingPartnerFeeInvoice(false)
    }
  }

  async function submitFeePaymentRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!feePaymentRequestForm.reviewer_id) {
      showError(new Error(t('finance.fee.validation.reviewerRequired')))
      return
    }
    setSubmittingFeePaymentRequest(true)
    setMessage('')
    setError('')
    try {
      const created = await createFeePaymentRequest(feePaymentRequestPayload(feePaymentRequestForm))
      setMessage(t('finance.fee.message.paymentRequestCreated', { code: created.request_no }))
      setFeePaymentRequestForm(initialFeePaymentRequestForm(selectedPartnerFeeInvoice ?? undefined))
      await loadFeePaymentRequests(created.id)
    } catch (caught) {
      showError(caught, t('finance.fee.message.paymentRequestCreateFailed'))
    } finally {
      setSubmittingFeePaymentRequest(false)
    }
  }

  async function submitFeePaymentApproval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedFeePaymentRequest) return
    if (
      !canApproveAssignedRecord(
        currentUser,
        selectedFeePaymentRequest.reviewer_id,
        'finance:view',
      ) ||
      selectedFeePaymentRequest.requester_user_id === currentUser.id
    ) {
      showError(
        new Error(
          t('finance.fee.validation.approverMismatch', {
            reviewer:
              selectedFeePaymentRequest.reviewer_name ??
              t('finance.fee.message.designatedReviewer'),
          }),
        ),
      )
      return
    }
    setSubmittingFeePaymentApproval(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveFeePaymentRequest(
        selectedFeePaymentRequest.id,
        feePaymentApprovalPayload(feePaymentApprovalForm),
      )
      setMessage(t('finance.fee.message.paymentRequestApproved', { code: approved.request_no }))
      setFeePaymentApprovalForm(initialFeePaymentApprovalForm('', currentUser.display_name))
      await loadFeePaymentRequests(approved.id)
      await loadPartnerFeeInvoices(selectedPartnerFeeInvoice?.id)
      await loadFeePayables()
    } catch (caught) {
      showError(caught, t('finance.fee.message.paymentApprovalFailed'))
    } finally {
      setSubmittingFeePaymentApproval(false)
    }
  }

  const selectedFeePaymentRequestCanApprove =
    selectedFeePaymentRequest?.status === 'submitted' &&
    canApproveAssignedRecord(currentUser, selectedFeePaymentRequest.reviewer_id, 'finance:view') &&
    selectedFeePaymentRequest.requester_user_id !== currentUser.id

  return {
    feeInvoiceModalOpen,
    feeInvoicePartnerFilter,
    feeInvoiceSearch,
    feeInvoiceShipmentFilter,
    feeInvoiceStatusFilter,
    feeInvoiceTypeFilter,
    feePayablePartnerFilter,
    feePayableSearch,
    feePayableShipmentFilter,
    feePayableStatusFilter,
    feePayableTypeFilter,
    feePayables,
    feePaymentApprovalForm,
    feePaymentRequestForm,
    feePaymentRequests,
    loadFeePayables,
    loadFeePaymentRequests,
    loadPartnerFeeInvoices,
    loadingFeePayables,
    loadingFeePaymentRequests,
    loadingPartnerFeeInvoices,
    partnerFeeInvoiceForm,
    partnerFeeInvoiceNoError,
    partnerFeeInvoices,
    selectedFeePaymentRequest,
    selectedFeePaymentRequestCanApprove,
    selectedPartnerFeeInvoice,
    setFeeInvoiceModalOpen,
    setFeeInvoicePartnerFilter,
    setFeeInvoiceSearch,
    setFeeInvoiceShipmentFilter,
    setFeeInvoiceStatusFilter,
    setFeeInvoiceTypeFilter,
    setFeePayablePartnerFilter,
    setFeePayableSearch,
    setFeePayableShipmentFilter,
    setFeePayableStatusFilter,
    setFeePayableTypeFilter,
    setFeePaymentApprovalForm,
    setFeePaymentRequestForm,
    setPartnerFeeInvoiceForm,
    setPartnerFeeInvoiceNoError,
    setSelectedFeePaymentRequestId,
    setSelectedPartnerFeeInvoiceId,
    submitFeePaymentApproval,
    submitFeePaymentRequest,
    submitPartnerFeeInvoice,
    submittingFeePaymentApproval,
    submittingFeePaymentRequest,
    submittingPartnerFeeInvoice,
  }
}

export type FeesModel = ReturnType<typeof useFeesModule>
