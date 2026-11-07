import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  approvePaymentRequest,
  createPaymentRequest,
  createSupplierInvoice,
  listPayables,
  listPaymentRequests,
  listSupplierInvoices,
  type PayableItem,
  type SupplierInvoice,
  type SupplierPaymentRequest,
} from '../../../../api'
import { showError } from '../../../../shared/errors'
import { canApproveAssignedRecord } from '../../appHelpers'
import {
  SupplierInvoiceFormState,
  PaymentRequestFormState,
  PaymentApprovalFormState,
  initialSupplierInvoiceForm,
  initialPaymentRequestForm,
  initialPaymentApprovalForm,
  supplierInvoicePayload,
  paymentRequestPayload,
  paymentApprovalPayload,
} from '../financeHelpers'
import { t } from '../../../appI18n'

import type { FinanceModuleEnv } from '../financePageTypes'

export function usePaymentsModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, currentUser, setMessage, setError } = env

  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([])

  const [paymentRequests, setPaymentRequests] = useState<SupplierPaymentRequest[]>([])

  const [payables, setPayables] = useState<PayableItem[]>([])

  const [selectedSupplierInvoiceId, setSelectedSupplierInvoiceId] = useState<string | null>(null)

  const [selectedPaymentRequestId, setSelectedPaymentRequestId] = useState<string | null>(null)

  const [invoiceSearch, setInvoiceSearch] = useState('')

  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('')

  const [invoiceSupplierFilter, setInvoiceSupplierFilter] = useState('')

  const [invoiceContractFilter, setInvoiceContractFilter] = useState('')

  const [paymentRequestSearch, _setPaymentRequestSearch] = useState('')

  const [paymentRequestStatusFilter, _setPaymentRequestStatusFilter] = useState('')

  const [paymentRequestTypeFilter, _setPaymentRequestTypeFilter] = useState('')

  const [payableSearch, setPayableSearch] = useState('')

  const [payableStatusFilter, setPayableStatusFilter] = useState('')

  const [payableSupplierFilter, setPayableSupplierFilter] = useState('')

  const [payableContractFilter, setPayableContractFilter] = useState('')

  const [supplierInvoiceForm, setSupplierInvoiceForm] = useState<SupplierInvoiceFormState>(() =>
    initialSupplierInvoiceForm(),
  )

  const [paymentRequestForm, setPaymentRequestForm] = useState<PaymentRequestFormState>(() =>
    initialPaymentRequestForm(),
  )

  const [paymentApprovalForm, setPaymentApprovalForm] = useState<PaymentApprovalFormState>(() =>
    initialPaymentApprovalForm('', currentUser.display_name),
  )

  const [loadingSupplierInvoices, setLoadingSupplierInvoices] = useState(false)

  const [loadingPaymentRequests, setLoadingPaymentRequests] = useState(false)

  const [loadingPayables, setLoadingPayables] = useState(false)

  const [submittingSupplierInvoice, setSubmittingSupplierInvoice] = useState(false)

  const [supplierInvoiceNoError, setSupplierInvoiceNoError] = useState('')

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)

  const [submittingPaymentRequest, setSubmittingPaymentRequest] = useState(false)

  const [submittingPaymentApproval, setSubmittingPaymentApproval] = useState(false)

  const selectedSupplierInvoice = useMemo(
    () =>
      supplierInvoices.find((item) => item.id === selectedSupplierInvoiceId) ??
      supplierInvoices[0] ??
      null,
    [supplierInvoices, selectedSupplierInvoiceId],
  )

  const selectedPaymentRequest = useMemo(
    () =>
      paymentRequests.find((item) => item.id === selectedPaymentRequestId) ??
      paymentRequests[0] ??
      null,
    [paymentRequests, selectedPaymentRequestId],
  )

  useEffect(() => {
    if (!selectedSupplierInvoice) return
    const requestForInvoice =
      selectedPaymentRequest?.supplier_invoice_id === selectedSupplierInvoice.id
        ? selectedPaymentRequest
        : null
    setPaymentRequestForm((current) => ({
      ...current,
      supplier_invoice_id: selectedSupplierInvoice.id,
      requested_amount: selectedSupplierInvoice.unpaid_amount,
      currency: selectedSupplierInvoice.currency,
    }))
    setPaymentApprovalForm((current) => ({
      ...current,
      approved_amount: requestForInvoice?.requested_amount ?? selectedSupplierInvoice.unpaid_amount,
    }))
  }, [
    selectedSupplierInvoice?.id,
    selectedSupplierInvoice?.unpaid_amount,
    selectedSupplierInvoice?.currency,
    selectedPaymentRequest?.id,
    selectedPaymentRequest?.supplier_invoice_id,
    selectedPaymentRequest?.requested_amount,
  ])

  async function loadSupplierInvoices(preferredId?: string) {
    setLoadingSupplierInvoices(true)
    setError('')
    try {
      const result = await listSupplierInvoices({
        q: invoiceSearch.trim() || undefined,
        status: invoiceStatusFilter || undefined,
        supplier_id: invoiceSupplierFilter.trim() || undefined,
        purchase_contract_no: invoiceContractFilter.trim() || undefined,
      })
      setSupplierInvoices(result.items)
      const nextInvoiceId =
        preferredId ??
        (activeModule === 'payments' && result.items.some((item) => item.id === detailId)
          ? detailId
          : null) ??
        (result.items.some((item) => item.id === selectedSupplierInvoiceId)
          ? selectedSupplierInvoiceId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedSupplierInvoiceId(nextInvoiceId)
    } catch (caught) {
      showError(caught, t('finance.payment.message.loadSupplierInvoicesFailed'))
    } finally {
      setLoadingSupplierInvoices(false)
    }
  }

  async function loadPaymentRequests(preferredId?: string) {
    setLoadingPaymentRequests(true)
    setError('')
    try {
      const result = await listPaymentRequests({
        q: paymentRequestSearch.trim() || undefined,
        status: paymentRequestStatusFilter || undefined,
        payment_type: paymentRequestTypeFilter || undefined,
        supplier_id: invoiceSupplierFilter.trim() || undefined,
      })
      setPaymentRequests(result.items)
      const nextRequestId =
        preferredId ??
        (result.items.some((item) => item.id === selectedPaymentRequestId)
          ? selectedPaymentRequestId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedPaymentRequestId(nextRequestId)
    } catch (caught) {
      showError(caught, t('finance.payment.message.loadPaymentRequestsFailed'))
    } finally {
      setLoadingPaymentRequests(false)
    }
  }

  async function loadPayables() {
    setLoadingPayables(true)
    setError('')
    try {
      const result = await listPayables({
        q: payableSearch.trim() || undefined,
        status: payableStatusFilter || undefined,
        supplier_id: payableSupplierFilter.trim() || undefined,
        purchase_contract_no: payableContractFilter.trim() || undefined,
      })
      setPayables(result.items)
    } catch (caught) {
      showError(caught, t('finance.payment.message.loadPayablesFailed'))
    } finally {
      setLoadingPayables(false)
    }
  }

  async function submitSupplierInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supplierInvoiceForm.invoice_no.trim()) {
      setSupplierInvoiceNoError(t('finance.payment.validation.invoiceNoRequired'))
      return
    }
    setSupplierInvoiceNoError('')
    setSubmittingSupplierInvoice(true)
    setMessage('')
    setError('')
    try {
      const created = await createSupplierInvoice(supplierInvoicePayload(supplierInvoiceForm))
      setMessage(t('finance.payment.message.supplierInvoiceCreated', { code: created.invoice_no }))
      setSupplierInvoiceForm(initialSupplierInvoiceForm())
      setInvoiceModalOpen(false)
      await loadSupplierInvoices(created.id)
      await loadPayables()
    } catch (caught) {
      showError(caught, t('finance.payment.message.supplierInvoiceCreateFailed'))
    } finally {
      setSubmittingSupplierInvoice(false)
    }
  }

  async function submitPaymentRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!paymentRequestForm.reviewer_id) {
      showError(new Error(t('finance.payment.validation.reviewerRequired')))
      return
    }
    setSubmittingPaymentRequest(true)
    setMessage('')
    setError('')
    try {
      const created = await createPaymentRequest(paymentRequestPayload(paymentRequestForm))
      setMessage(t('finance.payment.message.paymentRequestCreated', { code: created.request_no }))
      setPaymentRequestForm(initialPaymentRequestForm(selectedSupplierInvoice ?? undefined))
      await loadPaymentRequests(created.id)
    } catch (caught) {
      showError(caught, t('finance.payment.message.paymentRequestCreateFailed'))
    } finally {
      setSubmittingPaymentRequest(false)
    }
  }

  async function submitPaymentApproval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPaymentRequest) return
    if (
      !canApproveAssignedRecord(currentUser, selectedPaymentRequest.reviewer_id, 'finance:view') ||
      selectedPaymentRequest.requester_user_id === currentUser.id
    ) {
      showError(
        new Error(
          t('finance.payment.validation.approverMismatch', {
            reviewer:
              selectedPaymentRequest.reviewer_name ??
              t('finance.payment.message.designatedReviewer'),
          }),
        ),
      )
      return
    }
    setSubmittingPaymentApproval(true)
    setMessage('')
    setError('')
    try {
      const approved = await approvePaymentRequest(
        selectedPaymentRequest.id,
        paymentApprovalPayload(paymentApprovalForm),
      )
      setMessage(t('finance.payment.message.paymentRequestApproved', { code: approved.request_no }))
      setPaymentApprovalForm(initialPaymentApprovalForm('', currentUser.display_name))
      await loadPaymentRequests(approved.id)
      await loadSupplierInvoices(selectedSupplierInvoice?.id)
      await loadPayables()
    } catch (caught) {
      showError(caught, t('finance.payment.message.paymentApprovalFailed'))
    } finally {
      setSubmittingPaymentApproval(false)
    }
  }

  const selectedPaymentRequestCanApprove =
    selectedPaymentRequest?.status === 'submitted' &&
    canApproveAssignedRecord(currentUser, selectedPaymentRequest.reviewer_id, 'finance:view') &&
    selectedPaymentRequest.requester_user_id !== currentUser.id

  return {
    invoiceContractFilter,
    invoiceModalOpen,
    invoiceSearch,
    invoiceStatusFilter,
    invoiceSupplierFilter,
    loadPayables,
    loadPaymentRequests,
    loadSupplierInvoices,
    loadingPayables,
    loadingPaymentRequests,
    loadingSupplierInvoices,
    payableContractFilter,
    payableSearch,
    payableStatusFilter,
    payableSupplierFilter,
    payables,
    paymentApprovalForm,
    paymentRequestForm,
    paymentRequests,
    selectedPaymentRequest,
    selectedPaymentRequestCanApprove,
    selectedSupplierInvoice,
    setInvoiceContractFilter,
    setInvoiceModalOpen,
    setInvoiceSearch,
    setInvoiceStatusFilter,
    setInvoiceSupplierFilter,
    setPayableContractFilter,
    setPayableSearch,
    setPayableStatusFilter,
    setPayableSupplierFilter,
    setPaymentApprovalForm,
    setPaymentRequestForm,
    setSelectedPaymentRequestId,
    setSelectedSupplierInvoiceId,
    setSupplierInvoiceForm,
    setSupplierInvoiceNoError,
    submitPaymentApproval,
    submitPaymentRequest,
    submitSupplierInvoice,
    submittingPaymentApproval,
    submittingPaymentRequest,
    submittingSupplierInvoice,
    supplierInvoiceForm,
    supplierInvoiceNoError,
    supplierInvoices,
  }
}

export type PaymentsModel = ReturnType<typeof usePaymentsModule>
