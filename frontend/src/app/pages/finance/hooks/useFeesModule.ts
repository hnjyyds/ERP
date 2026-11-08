import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
} from '@/api'
import { showError } from '@/shared/errors'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { canApproveAssignedRecord } from '@/app/pages/appHelpers'
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
} from '@/app/pages/finance/financeHelpers'
import { t } from '@/app/appI18n'

import type { FinanceModuleEnv } from '@/app/pages/finance/financePageTypes'

export function useFeesModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, currentUser, setMessage, setError } = env

  const urlQuery = useUrlQuery()

  const partnerFeeInvoicesPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'fee_invoices_page'),
  )

  const feePaymentRequestsPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'fee_requests_page'),
  )

  const feePayablesPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'fee_payables_page'),
  )

  const [partnerFeeInvoices, setPartnerFeeInvoices] = useState<PartnerFeeInvoice[]>([])

  const [feePaymentRequests, setFeePaymentRequests] = useState<FeePaymentRequest[]>([])

  const [feePayables, setFeePayables] = useState<FeePayableItem[]>([])

  const [feePayableTotalAmount, setFeePayableTotalAmount] = useState('0.00')

  const partnerFeeInvoicesUrlPage = urlQuery.params.get('fee_invoices_page') ?? ''

  const appliedPartnerFeeInvoicesPageRef = useRef(partnerFeeInvoicesUrlPage)

  const feePaymentRequestsUrlPage = urlQuery.params.get('fee_requests_page') ?? ''

  const appliedFeePaymentRequestsPageRef = useRef(feePaymentRequestsUrlPage)

  const feePayablesUrlPage = urlQuery.params.get('fee_payables_page') ?? ''

  const appliedFeePayablesPageRef = useRef(feePayablesUrlPage)

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

  async function loadPartnerFeeInvoices(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
  ) {
    setLoadingPartnerFeeInvoices(true)
    setError('')
    try {
      const page = pageOverride ?? partnerFeeInvoicesPager.page
      const pageSize = pageSizeOverride ?? partnerFeeInvoicesPager.pageSize
      const result = await listPartnerFeeInvoices({
        q: feeInvoiceSearch.trim() || undefined,
        status: feeInvoiceStatusFilter || undefined,
        fee_type: feeInvoiceTypeFilter || undefined,
        partner_id: feeInvoicePartnerFilter.trim() || undefined,
        shipment_no: feeInvoiceShipmentFilter.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setPartnerFeeInvoices(result.items)
      partnerFeeInvoicesPager.setTotal(result.total)
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

  async function loadFeePaymentRequests(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
  ) {
    setLoadingFeePaymentRequests(true)
    setError('')
    try {
      const page = pageOverride ?? feePaymentRequestsPager.page
      const pageSize = pageSizeOverride ?? feePaymentRequestsPager.pageSize
      const result = await listFeePaymentRequests({
        q: feePaymentRequestSearch.trim() || undefined,
        status: feePaymentRequestStatusFilter || undefined,
        fee_type: feePaymentRequestTypeFilter || undefined,
        partner_id: feeInvoicePartnerFilter.trim() || undefined,
        shipment_no: feeInvoiceShipmentFilter.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setFeePaymentRequests(result.items)
      feePaymentRequestsPager.setTotal(result.total)
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

  async function loadFeePayables(pageOverride?: number, pageSizeOverride?: number) {
    setLoadingFeePayables(true)
    setError('')
    try {
      const page = pageOverride ?? feePayablesPager.page
      const pageSize = pageSizeOverride ?? feePayablesPager.pageSize
      const result = await listFeePayables({
        q: feePayableSearch.trim() || undefined,
        status: feePayableStatusFilter || undefined,
        fee_type: feePayableTypeFilter || undefined,
        partner_id: feePayablePartnerFilter.trim() || undefined,
        shipment_no: feePayableShipmentFilter.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setFeePayables(result.items)
      feePayablesPager.setTotal(result.total)
      setFeePayableTotalAmount(result.total_payable_amount)
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

  async function changePartnerFeeInvoicesPage(nextPage: number, nextPageSize: number) {
    const next = partnerFeeInvoicesPager.changePage(nextPage, nextPageSize)
    appliedPartnerFeeInvoicesPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ fee_invoices_page: next.page === 1 ? null : next.page })
    await loadPartnerFeeInvoices(undefined, next.page, next.pageSize)
  }

  async function changeFeePaymentRequestsPage(nextPage: number, nextPageSize: number) {
    const next = feePaymentRequestsPager.changePage(nextPage, nextPageSize)
    appliedFeePaymentRequestsPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ fee_requests_page: next.page === 1 ? null : next.page })
    await loadFeePaymentRequests(undefined, next.page, next.pageSize)
  }

  async function changeFeePayablesPage(nextPage: number, nextPageSize: number) {
    const next = feePayablesPager.changePage(nextPage, nextPageSize)
    appliedFeePayablesPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ fee_payables_page: next.page === 1 ? null : next.page })
    await loadFeePayables(next.page, next.pageSize)
  }

  useEffect(() => {
    if (appliedPartnerFeeInvoicesPageRef.current === partnerFeeInvoicesUrlPage) return
    appliedPartnerFeeInvoicesPageRef.current = partnerFeeInvoicesUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'fee_invoices_page')
    partnerFeeInvoicesPager.setPage(nextPage)
    void loadPartnerFeeInvoices(undefined, nextPage, partnerFeeInvoicesPager.pageSize)
  }, [partnerFeeInvoicesUrlPage])

  useEffect(() => {
    if (appliedFeePaymentRequestsPageRef.current === feePaymentRequestsUrlPage) return
    appliedFeePaymentRequestsPageRef.current = feePaymentRequestsUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'fee_requests_page')
    feePaymentRequestsPager.setPage(nextPage)
    void loadFeePaymentRequests(undefined, nextPage, feePaymentRequestsPager.pageSize)
  }, [feePaymentRequestsUrlPage])

  useEffect(() => {
    if (appliedFeePayablesPageRef.current === feePayablesUrlPage) return
    appliedFeePayablesPageRef.current = feePayablesUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'fee_payables_page')
    feePayablesPager.setPage(nextPage)
    void loadFeePayables(nextPage, feePayablesPager.pageSize)
  }, [feePayablesUrlPage])

  const selectedFeePaymentRequestCanApprove =
    selectedFeePaymentRequest?.status === 'submitted' &&
    canApproveAssignedRecord(currentUser, selectedFeePaymentRequest.reviewer_id, 'finance:view') &&
    selectedFeePaymentRequest.requester_user_id !== currentUser.id

  return {
    changeFeePayablesPage,
    changeFeePaymentRequestsPage,
    changePartnerFeeInvoicesPage,
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
    feePayableTotalAmount,
    feePayableTypeFilter,
    feePayables,
    feePayablesPagination: feePayablesPager.pagination,
    feePayablesTotal: feePayablesPager.total,
    feePaymentApprovalForm,
    feePaymentRequestForm,
    feePaymentRequests,
    feePaymentRequestsPagination: feePaymentRequestsPager.pagination,
    feePaymentRequestsTotal: feePaymentRequestsPager.total,
    loadFeePayables,
    loadFeePaymentRequests,
    loadPartnerFeeInvoices,
    loadingFeePayables,
    loadingFeePaymentRequests,
    loadingPartnerFeeInvoices,
    partnerFeeInvoiceForm,
    partnerFeeInvoiceNoError,
    partnerFeeInvoices,
    partnerFeeInvoicesPagination: partnerFeeInvoicesPager.pagination,
    partnerFeeInvoicesTotal: partnerFeeInvoicesPager.total,
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
