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
import { useFormModal } from '@/shared/useFormModal'
import { canApproveAssignedRecord } from '@/app/pages/appHelpers'
import {
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

type FeeInvoiceFilters = {
  q: string
  status: string
  type: string
  partner: string
  shipment: string
}

type FeePayableFilters = {
  q: string
  status: string
  type: string
  partner: string
  shipment: string
}

function feeInvoiceFiltersFromParams(params: URLSearchParams): FeeInvoiceFilters {
  return {
    q: params.get('fee_invoices_q') ?? '',
    status: params.get('fee_invoices_status') ?? '',
    type: params.get('fee_invoices_type') ?? '',
    partner: params.get('fee_invoices_partner') ?? '',
    shipment: params.get('fee_invoices_shipment') ?? '',
  }
}

function feePayableFiltersFromParams(params: URLSearchParams): FeePayableFilters {
  return {
    q: params.get('fee_payables_q') ?? '',
    status: params.get('fee_payables_status') ?? '',
    type: params.get('fee_payables_type') ?? '',
    partner: params.get('fee_payables_partner') ?? '',
    shipment: params.get('fee_payables_shipment') ?? '',
  }
}

function feeInvoiceSignature(params: URLSearchParams): string {
  return JSON.stringify([
    parsePageParam(params, 'fee_invoices_page'),
    feeInvoiceFiltersFromParams(params),
  ])
}

function feePayableSignature(params: URLSearchParams): string {
  return JSON.stringify([
    parsePageParam(params, 'fee_payables_page'),
    feePayableFiltersFromParams(params),
  ])
}

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

  const [feeInvoiceFilters, setFeeInvoiceFilters] = useState(() =>
    feeInvoiceFiltersFromParams(urlQuery.params),
  )

  const appliedFeeInvoiceSignatureRef = useRef(feeInvoiceSignature(urlQuery.params))

  const feePaymentRequestsUrlPage = urlQuery.params.get('fee_requests_page') ?? ''

  const appliedFeePaymentRequestsPageRef = useRef(feePaymentRequestsUrlPage)

  const [feePayableFilters, setFeePayableFilters] = useState(() =>
    feePayableFiltersFromParams(urlQuery.params),
  )

  const appliedFeePayableSignatureRef = useRef(feePayableSignature(urlQuery.params))

  const [selectedPartnerFeeInvoiceId, setSelectedPartnerFeeInvoiceId] = useState<string | null>(
    null,
  )

  const [selectedFeePaymentRequestId, setSelectedFeePaymentRequestId] = useState<string | null>(
    null,
  )

  const [feePaymentRequestSearch, _setFeePaymentRequestSearch] = useState('')

  const [feePaymentRequestStatusFilter, _setFeePaymentRequestStatusFilter] = useState('')

  const [feePaymentRequestTypeFilter, _setFeePaymentRequestTypeFilter] = useState('')

  const feeInvoiceModal = useFormModal(initialPartnerFeeInvoiceForm)

  const [feePaymentRequestForm, setFeePaymentRequestForm] = useState<FeePaymentRequestFormState>(
    () => initialFeePaymentRequestForm(),
  )

  const [feePaymentApprovalForm, setFeePaymentApprovalForm] = useState<FeePaymentApprovalFormState>(
    () => initialFeePaymentApprovalForm('', currentUser.display_name),
  )

  const [loadingPartnerFeeInvoices, setLoadingPartnerFeeInvoices] = useState(false)

  const [loadingFeePaymentRequests, setLoadingFeePaymentRequests] = useState(false)

  const [loadingFeePayables, setLoadingFeePayables] = useState(false)

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
    filtersOverride?: FeeInvoiceFilters,
  ) {
    setLoadingPartnerFeeInvoices(true)
    setError('')
    try {
      const filters = filtersOverride ?? feeInvoiceFilters
      const page = pageOverride ?? partnerFeeInvoicesPager.page
      const pageSize = pageSizeOverride ?? partnerFeeInvoicesPager.pageSize
      const result = await listPartnerFeeInvoices({
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
        fee_type: filters.type || undefined,
        partner_id: filters.partner.trim() || undefined,
        shipment_no: filters.shipment.trim() || undefined,
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
        partner_id: feeInvoiceFilters.partner.trim() || undefined,
        shipment_no: feeInvoiceFilters.shipment.trim() || undefined,
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

  async function loadFeePayables(
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: FeePayableFilters,
  ) {
    setLoadingFeePayables(true)
    setError('')
    try {
      const filters = filtersOverride ?? feePayableFilters
      const page = pageOverride ?? feePayablesPager.page
      const pageSize = pageSizeOverride ?? feePayablesPager.pageSize
      const result = await listFeePayables({
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
        fee_type: filters.type || undefined,
        partner_id: filters.partner.trim() || undefined,
        shipment_no: filters.shipment.trim() || undefined,
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
    if (!feeInvoiceModal.form.invoice_no.trim()) {
      setPartnerFeeInvoiceNoError(t('finance.fee.validation.invoiceNoRequired'))
      return
    }
    setPartnerFeeInvoiceNoError('')
    setMessage('')
    setError('')
    const saved = await feeInvoiceModal.runSubmit(
      async () => {
        const created = await createPartnerFeeInvoice(
          partnerFeeInvoicePayload(feeInvoiceModal.form),
        )
        setMessage(t('finance.fee.message.invoiceCreated', { code: created.invoice_no }))
        await loadPartnerFeeInvoices(created.id)
        await loadFeePayables()
      },
      (caught) => showError(caught, t('finance.fee.message.invoiceCreateFailed')),
    )
    if (saved) feeInvoiceModal.close()
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
    const nextSearch = urlQuery.update({
      fee_invoices_page: next.page === 1 ? null : next.page,
      fee_invoices_q: feeInvoiceFilters.q,
      fee_invoices_status: feeInvoiceFilters.status,
      fee_invoices_type: feeInvoiceFilters.type,
      fee_invoices_partner: feeInvoiceFilters.partner,
      fee_invoices_shipment: feeInvoiceFilters.shipment,
    })
    appliedFeeInvoiceSignatureRef.current = feeInvoiceSignature(new URLSearchParams(nextSearch))
    await loadPartnerFeeInvoices(undefined, next.page, next.pageSize, feeInvoiceFilters)
  }

  async function changeFeePaymentRequestsPage(nextPage: number, nextPageSize: number) {
    const next = feePaymentRequestsPager.changePage(nextPage, nextPageSize)
    appliedFeePaymentRequestsPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ fee_requests_page: next.page === 1 ? null : next.page })
    await loadFeePaymentRequests(undefined, next.page, next.pageSize)
  }

  async function changeFeePayablesPage(nextPage: number, nextPageSize: number) {
    const next = feePayablesPager.changePage(nextPage, nextPageSize)
    const nextSearch = urlQuery.update({
      fee_payables_page: next.page === 1 ? null : next.page,
      fee_payables_q: feePayableFilters.q,
      fee_payables_status: feePayableFilters.status,
      fee_payables_type: feePayableFilters.type,
      fee_payables_partner: feePayableFilters.partner,
      fee_payables_shipment: feePayableFilters.shipment,
    })
    appliedFeePayableSignatureRef.current = feePayableSignature(new URLSearchParams(nextSearch))
    await loadFeePayables(next.page, next.pageSize, feePayableFilters)
  }

  useEffect(() => {
    const signature = feeInvoiceSignature(urlQuery.params)
    if (appliedFeeInvoiceSignatureRef.current === signature) return
    appliedFeeInvoiceSignatureRef.current = signature
    const filters = feeInvoiceFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'fee_invoices_page')
    setFeeInvoiceFilters(filters)
    partnerFeeInvoicesPager.setPage(nextPage)
    void loadPartnerFeeInvoices(undefined, nextPage, partnerFeeInvoicesPager.pageSize, filters)
  }, [urlQuery.search])

  useEffect(() => {
    if (appliedFeePaymentRequestsPageRef.current === feePaymentRequestsUrlPage) return
    appliedFeePaymentRequestsPageRef.current = feePaymentRequestsUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'fee_requests_page')
    feePaymentRequestsPager.setPage(nextPage)
    void loadFeePaymentRequests(undefined, nextPage, feePaymentRequestsPager.pageSize)
  }, [feePaymentRequestsUrlPage])

  useEffect(() => {
    const signature = feePayableSignature(urlQuery.params)
    if (appliedFeePayableSignatureRef.current === signature) return
    appliedFeePayableSignatureRef.current = signature
    const filters = feePayableFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'fee_payables_page')
    setFeePayableFilters(filters)
    feePayablesPager.setPage(nextPage)
    void loadFeePayables(nextPage, feePayablesPager.pageSize, filters)
  }, [urlQuery.search])

  const selectedFeePaymentRequestCanApprove =
    selectedFeePaymentRequest?.status === 'submitted' &&
    canApproveAssignedRecord(currentUser, selectedFeePaymentRequest.reviewer_id, 'finance:view') &&
    selectedFeePaymentRequest.requester_user_id !== currentUser.id

  return {
    changeFeePayablesPage,
    changeFeePaymentRequestsPage,
    changePartnerFeeInvoicesPage,
    feeInvoiceModalOpen: feeInvoiceModal.open,
    feeInvoicePartnerFilter: feeInvoiceFilters.partner,
    feeInvoiceSearch: feeInvoiceFilters.q,
    feeInvoiceShipmentFilter: feeInvoiceFilters.shipment,
    feeInvoiceStatusFilter: feeInvoiceFilters.status,
    feeInvoiceTypeFilter: feeInvoiceFilters.type,
    feePayablePartnerFilter: feePayableFilters.partner,
    feePayableSearch: feePayableFilters.q,
    feePayableShipmentFilter: feePayableFilters.shipment,
    feePayableStatusFilter: feePayableFilters.status,
    feePayableTotalAmount,
    feePayableTypeFilter: feePayableFilters.type,
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
    partnerFeeInvoiceForm: feeInvoiceModal.form,
    partnerFeeInvoiceNoError,
    partnerFeeInvoices,
    partnerFeeInvoicesPagination: partnerFeeInvoicesPager.pagination,
    partnerFeeInvoicesTotal: partnerFeeInvoicesPager.total,
    selectedFeePaymentRequest,
    selectedFeePaymentRequestCanApprove,
    selectedPartnerFeeInvoice,
    setFeeInvoiceModalOpen: (open: boolean) =>
      open ? feeInvoiceModal.openWith() : feeInvoiceModal.close(),
    setFeeInvoicePartnerFilter: (value: string) =>
      setFeeInvoiceFilters((current) => ({ ...current, partner: value })),
    setFeeInvoiceSearch: (value: string) =>
      setFeeInvoiceFilters((current) => ({ ...current, q: value })),
    setFeeInvoiceShipmentFilter: (value: string) =>
      setFeeInvoiceFilters((current) => ({ ...current, shipment: value })),
    setFeeInvoiceStatusFilter: (value: string) =>
      setFeeInvoiceFilters((current) => ({ ...current, status: value })),
    setFeeInvoiceTypeFilter: (value: string) =>
      setFeeInvoiceFilters((current) => ({ ...current, type: value })),
    setFeePayablePartnerFilter: (value: string) =>
      setFeePayableFilters((current) => ({ ...current, partner: value })),
    setFeePayableSearch: (value: string) =>
      setFeePayableFilters((current) => ({ ...current, q: value })),
    setFeePayableShipmentFilter: (value: string) =>
      setFeePayableFilters((current) => ({ ...current, shipment: value })),
    setFeePayableStatusFilter: (value: string) =>
      setFeePayableFilters((current) => ({ ...current, status: value })),
    setFeePayableTypeFilter: (value: string) =>
      setFeePayableFilters((current) => ({ ...current, type: value })),
    setFeePaymentApprovalForm,
    setFeePaymentRequestForm,
    setPartnerFeeInvoiceForm: feeInvoiceModal.setForm,
    setPartnerFeeInvoiceNoError,
    setSelectedFeePaymentRequestId,
    setSelectedPartnerFeeInvoiceId,
    submitFeePaymentApproval,
    submitFeePaymentRequest,
    submitPartnerFeeInvoice,
    submittingFeePaymentApproval,
    submittingFeePaymentRequest,
    submittingPartnerFeeInvoice: feeInvoiceModal.submitting,
  }
}

export type FeesModel = ReturnType<typeof useFeesModule>
