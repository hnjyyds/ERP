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
import { useFormModal } from '@/shared/useFormModal'
import { canApproveAssignedRecord } from '@/app/pages/appHelpers'
import {
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

type InvoiceFilters = { q: string; status: string; supplier: string; contract: string }

type PayableFilters = { q: string; status: string; supplier: string; contract: string }

function invoiceFiltersFromParams(params: URLSearchParams): InvoiceFilters {
  return {
    q: params.get('supplier_invoices_q') ?? '',
    status: params.get('supplier_invoices_status') ?? '',
    supplier: params.get('supplier_invoices_supplier') ?? '',
    contract: params.get('supplier_invoices_contract') ?? '',
  }
}

function payableFiltersFromParams(params: URLSearchParams): PayableFilters {
  return {
    q: params.get('payables_q') ?? '',
    status: params.get('payables_status') ?? '',
    supplier: params.get('payables_supplier') ?? '',
    contract: params.get('payables_contract') ?? '',
  }
}

function invoiceSignature(params: URLSearchParams): string {
  return JSON.stringify([
    parsePageParam(params, 'supplier_invoices_page'),
    invoiceFiltersFromParams(params),
  ])
}

function payableSignature(params: URLSearchParams): string {
  return JSON.stringify([parsePageParam(params, 'payables_page'), payableFiltersFromParams(params)])
}

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

  const [invoiceFilters, setInvoiceFilters] = useState(() => invoiceFiltersFromParams(urlQuery.params))

  const appliedInvoiceSignatureRef = useRef(invoiceSignature(urlQuery.params))

  const paymentRequestsUrlPage = urlQuery.params.get('payment_requests_page') ?? ''

  const appliedPaymentRequestsPageRef = useRef(paymentRequestsUrlPage)

  const [payableFilters, setPayableFilters] = useState(() => payableFiltersFromParams(urlQuery.params))

  const appliedPayableSignatureRef = useRef(payableSignature(urlQuery.params))

  const [selectedSupplierInvoiceId, setSelectedSupplierInvoiceId] = useState<string | null>(null)

  const [selectedPaymentRequestId, setSelectedPaymentRequestId] = useState<string | null>(null)

  const invoiceModal = useFormModal(initialSupplierInvoiceForm)

  const [paymentRequestForm, setPaymentRequestForm] = useState<PaymentRequestFormState>(() =>
    initialPaymentRequestForm(),
  )

  const [paymentApprovalForm, setPaymentApprovalForm] = useState<PaymentApprovalFormState>(() =>
    initialPaymentApprovalForm('', currentUser.display_name),
  )

  const [loadingSupplierInvoices, setLoadingSupplierInvoices] = useState(false)

  const [loadingPaymentRequests, setLoadingPaymentRequests] = useState(false)

  const [loadingPayables, setLoadingPayables] = useState(false)

  const [supplierInvoiceNoError, setSupplierInvoiceNoError] = useState('')

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
    filtersOverride?: InvoiceFilters,
  ) {
    setLoadingSupplierInvoices(true)
    setError('')
    try {
      const filters = filtersOverride ?? invoiceFilters
      const page = pageOverride ?? supplierInvoicesPager.page
      const pageSize = pageSizeOverride ?? supplierInvoicesPager.pageSize
      const result = await listSupplierInvoices({
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
        supplier_id: filters.supplier.trim() || undefined,
        purchase_contract_no: filters.contract.trim() || undefined,
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
        supplier_id: invoiceFilters.supplier.trim() || undefined,
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

  async function loadPayables(
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: PayableFilters,
  ) {
    setLoadingPayables(true)
    setError('')
    try {
      const filters = filtersOverride ?? payableFilters
      const page = pageOverride ?? payablesPager.page
      const pageSize = pageSizeOverride ?? payablesPager.pageSize
      const result = await listPayables({
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
        supplier_id: filters.supplier.trim() || undefined,
        purchase_contract_no: filters.contract.trim() || undefined,
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
    if (!invoiceModal.form.invoice_no.trim()) {
      setSupplierInvoiceNoError(t('finance.payment.validation.invoiceNoRequired'))
      return
    }
    setSupplierInvoiceNoError('')
    setMessage('')
    setError('')
    const saved = await invoiceModal.runSubmit(
      async () => {
        const created = await createSupplierInvoice(supplierInvoicePayload(invoiceModal.form))
        setMessage(
          t('finance.payment.message.supplierInvoiceCreated', { code: created.invoice_no }),
        )
        await loadSupplierInvoices(created.id)
        await loadPayables()
      },
      (caught) => showError(caught, t('finance.payment.message.supplierInvoiceCreateFailed')),
    )
    if (saved) invoiceModal.close()
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
    const nextSearch = urlQuery.update({
      supplier_invoices_page: next.page === 1 ? null : next.page,
      supplier_invoices_q: invoiceFilters.q,
      supplier_invoices_status: invoiceFilters.status,
      supplier_invoices_supplier: invoiceFilters.supplier,
      supplier_invoices_contract: invoiceFilters.contract,
    })
    appliedInvoiceSignatureRef.current = invoiceSignature(new URLSearchParams(nextSearch))
    await loadSupplierInvoices(undefined, next.page, next.pageSize, invoiceFilters)
  }

  async function changePaymentRequestsPage(nextPage: number, nextPageSize: number) {
    const next = paymentRequestsPager.changePage(nextPage, nextPageSize)
    appliedPaymentRequestsPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ payment_requests_page: next.page === 1 ? null : next.page })
    await loadPaymentRequests(undefined, next.page, next.pageSize)
  }

  async function changePayablesPage(nextPage: number, nextPageSize: number) {
    const next = payablesPager.changePage(nextPage, nextPageSize)
    const nextSearch = urlQuery.update({
      payables_page: next.page === 1 ? null : next.page,
      payables_q: payableFilters.q,
      payables_status: payableFilters.status,
      payables_supplier: payableFilters.supplier,
      payables_contract: payableFilters.contract,
    })
    appliedPayableSignatureRef.current = payableSignature(new URLSearchParams(nextSearch))
    await loadPayables(next.page, next.pageSize, payableFilters)
  }

  useEffect(() => {
    const signature = invoiceSignature(urlQuery.params)
    if (appliedInvoiceSignatureRef.current === signature) return
    appliedInvoiceSignatureRef.current = signature
    const filters = invoiceFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'supplier_invoices_page')
    setInvoiceFilters(filters)
    supplierInvoicesPager.setPage(nextPage)
    void loadSupplierInvoices(undefined, nextPage, supplierInvoicesPager.pageSize, filters)
  }, [urlQuery.search])

  useEffect(() => {
    if (appliedPaymentRequestsPageRef.current === paymentRequestsUrlPage) return
    appliedPaymentRequestsPageRef.current = paymentRequestsUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'payment_requests_page')
    paymentRequestsPager.setPage(nextPage)
    void loadPaymentRequests(undefined, nextPage, paymentRequestsPager.pageSize)
  }, [paymentRequestsUrlPage])

  useEffect(() => {
    const signature = payableSignature(urlQuery.params)
    if (appliedPayableSignatureRef.current === signature) return
    appliedPayableSignatureRef.current = signature
    const filters = payableFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'payables_page')
    setPayableFilters(filters)
    payablesPager.setPage(nextPage)
    void loadPayables(nextPage, payablesPager.pageSize, filters)
  }, [urlQuery.search])

  const selectedPaymentRequestCanApprove =
    selectedPaymentRequest?.status === 'submitted' &&
    canApproveAssignedRecord(currentUser, selectedPaymentRequest.reviewer_id, 'finance:view') &&
    selectedPaymentRequest.requester_user_id !== currentUser.id

  return {
    changePayablesPage,
    changePaymentRequestsPage,
    changeSupplierInvoicesPage,
    invoiceContractFilter: invoiceFilters.contract,
    invoiceModalOpen: invoiceModal.open,
    invoiceSearch: invoiceFilters.q,
    invoiceStatusFilter: invoiceFilters.status,
    invoiceSupplierFilter: invoiceFilters.supplier,
    loadPayables,
    loadPaymentRequests,
    loadSupplierInvoices,
    loadingPayables,
    loadingPaymentRequests,
    loadingSupplierInvoices,
    payableContractFilter: payableFilters.contract,
    payableSearch: payableFilters.q,
    payableStatusFilter: payableFilters.status,
    payableSupplierFilter: payableFilters.supplier,
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
    setInvoiceContractFilter: (value: string) =>
      setInvoiceFilters((current) => ({ ...current, contract: value })),
    setInvoiceModalOpen: (open: boolean) => (open ? invoiceModal.openWith() : invoiceModal.close()),
    setInvoiceSearch: (value: string) =>
      setInvoiceFilters((current) => ({ ...current, q: value })),
    setInvoiceStatusFilter: (value: string) =>
      setInvoiceFilters((current) => ({ ...current, status: value })),
    setInvoiceSupplierFilter: (value: string) =>
      setInvoiceFilters((current) => ({ ...current, supplier: value })),
    setPayableContractFilter: (value: string) =>
      setPayableFilters((current) => ({ ...current, contract: value })),
    setPayableSearch: (value: string) =>
      setPayableFilters((current) => ({ ...current, q: value })),
    setPayableStatusFilter: (value: string) =>
      setPayableFilters((current) => ({ ...current, status: value })),
    setPayableSupplierFilter: (value: string) =>
      setPayableFilters((current) => ({ ...current, supplier: value })),
    setPaymentApprovalForm,
    setPaymentRequestForm,
    setSelectedPaymentRequestId,
    setSelectedSupplierInvoiceId,
    setSupplierInvoiceForm: invoiceModal.setForm,
    setSupplierInvoiceNoError,
    submitPaymentApproval,
    submitPaymentRequest,
    submitSupplierInvoice,
    submittingPaymentApproval,
    submittingPaymentRequest,
    submittingSupplierInvoice: invoiceModal.submitting,
    supplierInvoiceForm: invoiceModal.form,
    supplierInvoiceNoError,
    supplierInvoices,
    supplierInvoicesPagination: supplierInvoicesPager.pagination,
    supplierInvoicesTotal: supplierInvoicesPager.total,
  }
}

export type PaymentsModel = ReturnType<typeof usePaymentsModule>
