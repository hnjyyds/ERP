import type { MouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  listPurchaseInquiries,
  listPurchaseInquiryReferences,
  listPurchaseInquirySupplierSamples,
  type PurchaseInquiry,
  type PurchaseInquiryListSummary,
  type PurchaseInquiryReference,
  type SupplierSampleEvidence,
} from '@/api'
import { moduleDetailPath, purchaseInquiryPath } from '@/app/routes'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { useTablePagination } from '@/shared/useTablePagination'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'

type Filters = { q: string; status: string; product: string; supplier: string }

type Params = {
  detailId: string | null
  onNavigate: (path: string) => void
}

function filtersFromParams(params: URLSearchParams): Filters {
  return {
    q: params.get('q') ?? '',
    status: params.get('status') ?? '',
    product: params.get('product') ?? '',
    supplier: params.get('supplier') ?? '',
  }
}

export function usePurchaseInquiriesList({ detailId, onNavigate }: Params) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const initialFilters = filtersFromParams(urlQuery.params)
  const [inquiries, setInquiries] = useState<PurchaseInquiry[]>([])
  const [summary, setSummary] = useState<PurchaseInquiryListSummary>({
    sent_count: 0,
    quoted_count: 0,
    quotation_count: 0,
  })
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)
  const [search, setSearch] = useState(initialFilters.q)
  const [statusFilter, setStatusFilter] = useState(initialFilters.status)
  const [productFilter, setProductFilter] = useState(initialFilters.product)
  const [supplierFilter, setSupplierFilter] = useState(initialFilters.supplier)
  const [supplierSamples, setSupplierSamples] = useState<SupplierSampleEvidence[]>([])
  const [references, setReferences] = useState<PurchaseInquiryReference[]>([])
  const [loading, setLoading] = useState(false)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )

  const selectedInquiry = useMemo(() => {
    if (detailId) return inquiries.find((item) => item.id === detailId) ?? null
    return inquiries.find((item) => item.id === selectedInquiryId) ?? inquiries[0] ?? null
  }, [detailId, inquiries, selectedInquiryId])

  useEffect(() => {
    void loadInquiries()
  }, [])

  // 浏览器前进/后退只改变查询串时，App 的 activePath 不变，需要页面自己重新读取。
  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextFilters = filtersFromParams(urlQuery.params)
    setSearch(nextFilters.q)
    setStatusFilter(nextFilters.status)
    setProductFilter(nextFilters.product)
    setSupplierFilter(nextFilters.supplier)
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadInquiries(undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    if (!detailId) {
      setSupplierSamples([])
      setReferences([])
      return
    }
    void loadPurchaseInquiryAuxiliary(selectedInquiry)
  }, [detailId, selectedInquiry?.id, selectedInquiry?.status, selectedInquiry?.quotations.length])

  useEffect(() => {
    if (detailId && inquiries.length > 0 && !inquiries.some((item) => item.id === detailId)) {
      onNavigate(purchaseInquiryPath)
    }
  }, [detailId, inquiries, onNavigate])

  async function loadInquiries(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: Filters,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    setLoading(true)
    try {
      const result = await listPurchaseInquiries({
        q: (filtersOverride?.q ?? search).trim() || undefined,
        status: (filtersOverride?.status ?? statusFilter) || undefined,
        product_id: (filtersOverride?.product ?? productFilter).trim() || undefined,
        supplier_id: (filtersOverride?.supplier ?? supplierFilter).trim() || undefined,
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
        await loadInquiries(preferredId, prevPage, resolvedPageSize, filtersOverride)
        return
      }
      setInquiries(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedInquiryId) ? selectedInquiryId : null) ??
        result.items[0]?.id ??
        null
      setSelectedInquiryId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('purchase.inquiry.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadPurchaseInquiryAuxiliary(inquiry: PurchaseInquiry | null) {
    const line = inquiry?.lines[0]
    if (!inquiry || !line) {
      setSupplierSamples([])
      setReferences([])
      return
    }
    const supplierId = inquiry.quotations[0]?.supplier_id ?? undefined
    try {
      const [referenceResult, sampleResult] = await Promise.all([
        listPurchaseInquiryReferences({
          product_id: line.product_id ?? undefined,
        }),
        listPurchaseInquirySupplierSamples({
          product_id: line.product_id ?? undefined,
          supplier_id: supplierId,
        }),
      ])
      setReferences(referenceResult.items)
      setSupplierSamples(sampleResult.items)
    } catch (caught) {
      showError(caught, t('purchase.inquiry.detail.referenceLoadFailed'))
    }
  }

  function upsertInquiry(inquiry: PurchaseInquiry) {
    setInquiries((current) => {
      const exists = current.some((item) => item.id === inquiry.id)
      return exists
        ? current.map((item) => (item.id === inquiry.id ? inquiry : item))
        : [inquiry, ...current]
    })
    setSelectedInquiryId(inquiry.id)
  }

  function openInquiryDetail(inquiry: PurchaseInquiry) {
    setSelectedInquiryId(inquiry.id)
    onNavigate(moduleDetailPath(purchaseInquiryPath, inquiry.id))
  }

  function stopAndOpenInquiryDetail(event: MouseEvent<HTMLElement>, inquiry: PurchaseInquiry) {
    event.stopPropagation()
    openInquiryDetail(inquiry)
  }

  function submitFilters() {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: search,
      status: statusFilter,
      product: productFilter,
      supplier: supplierFilter,
      page: null,
    })
    void loadInquiries(undefined, 1)
  }

  function changeListPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadInquiries(undefined, next.page, next.pageSize)
  }

  return {
    inquiries,
    summary,
    selectedInquiry,
    selectedInquiryId,
    setSelectedInquiryId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    productFilter,
    setProductFilter,
    supplierFilter,
    setSupplierFilter,
    supplierSamples,
    references,
    loading,
    total,
    pagination,
    loadInquiries,
    loadPurchaseInquiryAuxiliary,
    upsertInquiry,
    openInquiryDetail,
    stopAndOpenInquiryDetail,
    submitFilters,
    changeListPage,
  }
}
