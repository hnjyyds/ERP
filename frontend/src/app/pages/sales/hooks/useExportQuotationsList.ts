import type { MouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  getExportQuotationHistory,
  getExportQuotationPurchaseReferences,
  getExportQuotationSampleDeliveries,
  listCustomers,
  listExportQuotations,
  type Customer,
  type ExportQuotation,
  type ExportQuotationListSummary,
  type ExportQuotationPurchaseReference,
  type SampleDelivery,
} from '@/api'
import { exportQuotationPath, moduleDetailPath } from '@/app/routes'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { useTablePagination } from '@/shared/useTablePagination'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'

type Filters = { q: string; status: string; customer: string }

type Params = {
  detailId: string | null
  onNavigate: (path: string) => void
}

function filtersFromParams(params: URLSearchParams): Filters {
  return {
    q: params.get('q') ?? '',
    status: params.get('status') ?? '',
    customer: params.get('customer') ?? '',
  }
}

export function useExportQuotationsList({ detailId, onNavigate }: Params) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const initialFilters = filtersFromParams(urlQuery.params)
  const [quotations, setQuotations] = useState<ExportQuotation[]>([])
  const [summary, setSummary] = useState<ExportQuotationListSummary>({
    submitted_count: 0,
    approved_count: 0,
    total_amount: '0',
    currency: null,
  })
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)
  const [search, setSearch] = useState(initialFilters.q)
  const [statusFilter, setStatusFilter] = useState(initialFilters.status)
  const [customerFilter, setCustomerFilter] = useState(initialFilters.customer)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [history, setHistory] = useState<ExportQuotation[]>([])
  const [purchaseReferences, setPurchaseReferences] = useState<ExportQuotationPurchaseReference[]>([])
  const [sampleDeliveries, setSampleDeliveries] = useState<SampleDelivery[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )

  const selectedQuotation = useMemo(() => {
    if (detailId) return quotations.find((item) => item.id === detailId) ?? null
    return quotations.find((item) => item.id === selectedQuotationId) ?? quotations[0] ?? null
  }, [detailId, quotations, selectedQuotationId])

  useEffect(() => {
    void loadQuotations()
    void loadQuotationCustomerOptions()
  }, [])

  // 浏览器前进/后退只改变查询串时，App 的 activePath 不变，需要页面自己重新读取。
  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextFilters = filtersFromParams(urlQuery.params)
    setSearch(nextFilters.q)
    setStatusFilter(nextFilters.status)
    setCustomerFilter(nextFilters.customer)
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadQuotations(undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    if (!detailId) {
      setHistory([])
      setPurchaseReferences([])
      setSampleDeliveries([])
      return
    }
    void loadSelectedQuotationReferences(selectedQuotation)
  }, [detailId, selectedQuotation?.id, selectedQuotation?.approval_status])

  useEffect(() => {
    if (detailId && quotations.length > 0 && !quotations.some((item) => item.id === detailId)) {
      onNavigate(exportQuotationPath)
    }
  }, [detailId, onNavigate, quotations])

  async function loadQuotations(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: Filters,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    const resolvedQ = filtersOverride?.q ?? search
    const resolvedStatus = filtersOverride?.status ?? statusFilter
    const resolvedCustomer = filtersOverride?.customer ?? customerFilter
    setLoading(true)
    try {
      const result = await listExportQuotations({
        q: resolvedQ.trim() || undefined,
        approval_status: resolvedStatus || undefined,
        customer_id: resolvedCustomer.trim() || undefined,
        limit: resolvedPageSize,
        offset: (resolvedPage - 1) * resolvedPageSize,
      })
      setTotal(result.total)
      setSummary(result.summary)
      if (result.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadQuotations(preferredId, prevPage, resolvedPageSize, filtersOverride)
        return
      }
      setQuotations(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedQuotationId)
          ? selectedQuotationId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedQuotationId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('sales.quotation.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadQuotationCustomerOptions() {
    setLoadingCustomers(true)
    try {
      const result = await listCustomers()
      setCustomers(result.items)
    } catch (caught) {
      showError(caught, t('sales.quotation.list.customerLoadFailed'))
    } finally {
      setLoadingCustomers(false)
    }
  }

  async function loadSelectedQuotationReferences(quotation: ExportQuotation | null) {
    const line = quotation?.lines[0]
    if (!quotation) {
      setHistory([])
      setPurchaseReferences([])
      setSampleDeliveries([])
      return
    }
    try {
      const [historyResult, referenceResult, deliveryResult] = await Promise.all([
        getExportQuotationHistory({
          customer_id: quotation.customer_id ?? undefined,
          product_id: line?.product_id ?? undefined,
        }),
        getExportQuotationPurchaseReferences({
          product_id: line?.product_id ?? undefined,
        }),
        getExportQuotationSampleDeliveries(quotation.id),
      ])
      setHistory(historyResult.items)
      setPurchaseReferences(referenceResult.items)
      setSampleDeliveries(deliveryResult.items)
    } catch (caught) {
      showError(caught, t('sales.quotation.list.referenceLoadFailed'))
    }
  }

  function upsertQuotation(quotation: ExportQuotation) {
    setQuotations((current) => {
      const exists = current.some((item) => item.id === quotation.id)
      return exists
        ? current.map((item) => (item.id === quotation.id ? quotation : item))
        : [quotation, ...current]
    })
    setSelectedQuotationId(quotation.id)
  }

  function openQuotationDetail(quotation: ExportQuotation) {
    setSelectedQuotationId(quotation.id)
    onNavigate(moduleDetailPath(exportQuotationPath, quotation.id))
  }

  function stopAndOpenQuotationDetail(event: MouseEvent<HTMLElement>, quotation: ExportQuotation) {
    event.stopPropagation()
    openQuotationDetail(quotation)
  }

  function submitFilters() {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: search.trim(),
      status: statusFilter,
      customer: customerFilter,
      page: null,
    })
    void loadQuotations(undefined, 1)
  }

  function changeListPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadQuotations(undefined, next.page, next.pageSize)
  }

  async function applyCreatedQuotation(created: ExportQuotation) {
    upsertQuotation(created)
    await loadQuotations(created.id)
    setQuotations((current) =>
      current.some((quotation) => quotation.id === created.id) ? current : [created, ...current],
    )
    setSelectedQuotationId(created.id)
  }

  async function applySavedQuotation(updated: ExportQuotation) {
    upsertQuotation(updated)
    await loadQuotations(updated.id)
  }

  async function applySubmittedQuotation(submitted: ExportQuotation) {
    upsertQuotation(submitted)
    await loadQuotations(submitted.id)
  }

  async function applyApprovedQuotation(approved: ExportQuotation) {
    upsertQuotation(approved)
    await loadQuotations(approved.id)
  }

  return {
    urlQuery,
    quotations,
    summary,
    selectedQuotation,
    selectedQuotationId,
    setSelectedQuotationId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    customerFilter,
    setCustomerFilter,
    customers,
    loadingCustomers,
    history,
    purchaseReferences,
    sampleDeliveries,
    loading,
    total,
    pagination,
    submitFilters,
    changeListPage,
    loadQuotations,
    upsertQuotation,
    openQuotationDetail,
    stopAndOpenQuotationDetail,
    applyCreatedQuotation,
    applySavedQuotation,
    applySubmittedQuotation,
    applyApprovedQuotation,
  }
}
