import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
} from '@/api'
import { showError } from '@/shared/errors'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { canApproveAssignedRecord } from '@/app/pages/appHelpers'
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
} from '@/app/pages/finance/financeHelpers'
import { t } from '@/app/appI18n'

import type { FinanceModuleEnv } from '@/app/pages/finance/financePageTypes'

export function usePaymentsModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, currentUser, setMessage, setError } = env

  const urlQuery = useUrlQuery()

  const supplierInvoicesPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'supplier_invoices_page'),
  )

  const paymentRequestsPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'payment_requests_page'),
  )

  const payablesPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'payables_page'),
  )

  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([])

  const [paymentRequests, setPaymentRequests] = useState<SupplierPaymentRequest[]>([])

  const [payables, setPayables] = useState<PayableItem[]>([])

  const [payableTotalAmount, setPayableTotalAmount] = useState('0.00')

  const supplierInvoicesUrlPage = urlQuery.params.get('supplier_invoices_page') ?? ''

  const appliedSupplierInvoicesPageRef = useRef(supplierInvoicesUrlPage)

  const paymentRequestsUrlPage = urlQuery.params.get('payment_requests_page') ?? ''

  const appliedPaymentRequestsPageRef = useRef(paymentRequestsUrlPage)

  const payablesUrlPage = urlQuery.params.get('payables_page') ?? ''

  const appliedPayablesPageRef = useRef(payablesUrlPage)

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

  async function loadSupplierInvoices(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
  ) {
    setLoadingSupplierInvoices(true)
    setError('')
    try {
      const page = pageOverride ?? supplierInvoicesPager.page
      const pageSize = pageSizeOverride ?? supplierInvoicesPager.pageSize
      const result = await listSupplierInvoices({
        q: invoiceSearch.trim() || undefined,
        status: invoiceStatusFilter || undefined,
        supplier_id: invoiceSupplierFilter.trim() || undefined,
        purchase_contract_no: invoiceContractFilter.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setSupplierInvoices(result.items)
      supplierInvoicesPager.setTotal(result.total)
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

  async function loadPaymentRequests(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
  ) {
    setLoadingPaymentRequests(true)
    setError('')
    try {
      const page = pageOverride ?? paymentRequestsPager.page
      const pageSize = pageSizeOverride ?? paymentRequestsPager.pageSize
      const result = await listPaymentRequests({
        q: paymentRequestSearch.trim() || undefined,
        status: paymentRequestStatusFilter || undefined,
        payment_type: paymentRequestTypeFilter || undefined,
        supplier_id: invoiceSupplierFilter.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setPaymentRequests(result.items)
      paymentRequestsPager.setTotal(result.total)
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

  async function loadPayables(pageOverride?: number, pageSizeOverride?: number) {
    setLoadingPayables(true)
    setError('')
    try {
      const page = pageOverride ?? payablesPager.page
      const pageSize = pageSizeOverride ?? payablesPager.pageSize
      const result = await listPayables({
        q: payableSearch.trim() || undefined,
        status: payableStatusFilter || undefined,
        supplier_id: payableSupplierFilter.trim() || undefined,
        purchase_contract_no: payableContractFilter.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setPayables(result.items)
      payablesPager.setTotal(result.total)
      setPayableTotalAmount(result.total_payable_amount)
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

  async function changeSupplierInvoicesPage(nextPage: number, nextPageSize: number) {
    const next = supplierInvoicesPager.changePage(nextPage, nextPageSize)
    appliedSupplierInvoicesPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ supplier_invoices_page: next.page === 1 ? null : next.page })
    await loadSupplierInvoices(undefined, next.page, next.pageSize)
  }

  async function changePaymentRequestsPage(nextPage: number, nextPageSize: number) {
    const next = paymentRequestsPager.changePage(nextPage, nextPageSize)
    appliedPaymentRequestsPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ payment_requests_page: next.page === 1 ? null : next.page })
    await loadPaymentRequests(undefined, next.page, next.pageSize)
  }

  async function changePayablesPage(nextPage: number, nextPageSize: number) {
    const next = payablesPager.changePage(nextPage, nextPageSize)
    appliedPayablesPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ payables_page: next.page === 1 ? null : next.page })
    await loadPayables(next.page, next.pageSize)
  }

  useEffect(() => {
    if (appliedSupplierInvoicesPageRef.current === supplierInvoicesUrlPage) return
    appliedSupplierInvoicesPageRef.current = supplierInvoicesUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'supplier_invoices_page')
    supplierInvoicesPager.setPage(nextPage)
    void loadSupplierInvoices(undefined, nextPage, supplierInvoicesPager.pageSize)
  }, [supplierInvoicesUrlPage])

  useEffect(() => {
    if (appliedPaymentRequestsPageRef.current === paymentRequestsUrlPage) return
    appliedPaymentRequestsPageRef.current = paymentRequestsUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'payment_requests_page')
    paymentRequestsPager.setPage(nextPage)
    void loadPaymentRequests(undefined, nextPage, paymentRequestsPager.pageSize)
  }, [paymentRequestsUrlPage])

  useEffect(() => {
    if (appliedPayablesPageRef.current === payablesUrlPage) return
    appliedPayablesPageRef.current = payablesUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'payables_page')
    payablesPager.setPage(nextPage)
    void loadPayables(nextPage, payablesPager.pageSize)
  }, [payablesUrlPage])

  const selectedPaymentRequestCanApprove =
    selectedPaymentRequest?.status === 'submitted' &&
    canApproveAssignedRecord(currentUser, selectedPaymentRequest.reviewer_id, 'finance:view') &&
    selectedPaymentRequest.requester_user_id !== currentUser.id

  return {
    changePayablesPage,
    changePaymentRequestsPage,
    changeSupplierInvoicesPage,
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
    payableTotalAmount,
    payables,
    payablesPagination: payablesPager.pagination,
    payablesTotal: payablesPager.total,
    paymentApprovalForm,
    paymentRequestForm,
    paymentRequests,
    paymentRequestsPagination: paymentRequestsPager.pagination,
    paymentRequestsTotal: paymentRequestsPager.total,
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
    supplierInvoicesPagination: supplierInvoicesPager.pagination,
    supplierInvoicesTotal: supplierInvoicesPager.total,
  }
}

export type PaymentsModel = ReturnType<typeof usePaymentsModule>
