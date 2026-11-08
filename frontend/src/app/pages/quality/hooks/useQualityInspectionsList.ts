import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  getQualityInboundEligibility,
  listPurchaseContracts,
  listQualityInspections,
  type CurrentUser,
  type QualityInspection,
  type QualityInspectionInboundEligibility,
  type QualityInspectionListSummary,
} from '@/api'
import { showError } from '@/shared/errors'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { t } from '@/app/appI18n'
import { qualityInspectionPath } from '@/app/routes'

import {
  emptySummary,
  filtersFromUrl,
  type QualityInspectionAssigneeFilter,
  type QualityInspectionListFilters,
} from '../qualityInspectionMeta'

type Options = {
  currentUser: CurrentUser
  detailId: string | null
  onNavigate: (path: string) => void
  setMessage: (message: string) => void
}

export function useQualityInspectionsList({
  currentUser,
  detailId,
  onNavigate,
  setMessage,
}: Options) {
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [summary, setSummary] = useState<QualityInspectionListSummary>(emptySummary)
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const { page, pageSize, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null)
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => urlQuery.params.get('status') ?? '')
  const [resultFilter, setResultFilter] = useState(() => urlQuery.params.get('result') ?? '')
  const [supplierFilter, setSupplierFilter] = useState(
    () => urlQuery.params.get('supplier') ?? '',
  )
  const [contractFilter, setContractFilter] = useState(
    () => urlQuery.params.get('contract') ?? '',
  )
  const [assigneeFilter, setAssigneeFilter] = useState<QualityInspectionAssigneeFilter>(
    () => (urlQuery.params.get('assignee') === 'mine' ? 'mine' : 'all'),
  )
  const [eligibility, setEligibility] = useState<QualityInspectionInboundEligibility | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSupplierOptions = useCallback(async (query: string) => {
    const result = await listPurchaseContracts({
      q: query.trim() || undefined,
      approval_status: 'approved',
    })
    const suppliers = new Map<string, { value: string; label: string; description: string }>()
    result.items.forEach((item) => {
      if (!item.supplier_id || suppliers.has(item.supplier_id)) return
      suppliers.set(item.supplier_id, {
        value: item.supplier_id,
        label: item.supplier_name,
        description: t('quality.inspection.option.relatedContract', { code: item.code }),
      })
    })
    return [...suppliers.values()].slice(0, 20)
  }, [])

  const fetchFilterContractOptions = useCallback(
    async (query: string) => {
      const result = await listPurchaseContracts({
        q: query.trim() || undefined,
        approval_status: 'approved',
        supplier_id: supplierFilter || undefined,
      })
      return result.items.slice(0, 20).map((item) => ({
        value: item.id,
        label: `${item.code} / ${item.supplier_name}`,
        description: t('quality.inspection.option.contractSchedule', {
          contractDate: item.contract_date,
          deliveryDate: item.delivery_date,
        }),
      }))
    },
    [supplierFilter],
  )

  const selectedInspection = useMemo(() => {
    if (detailId) return inspections.find((item) => item.id === detailId) ?? null
    return inspections.find((item) => item.id === selectedInspectionId) ?? inspections[0] ?? null
  }, [detailId, inspections, selectedInspectionId])

  useEffect(() => {
    void loadQualityInspections()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextFilters = filtersFromUrl(urlQuery.params)
    setSearch(nextFilters.search)
    setStatusFilter(nextFilters.status)
    setResultFilter(nextFilters.result)
    setSupplierFilter(nextFilters.supplier)
    setContractFilter(nextFilters.contract)
    setAssigneeFilter(nextFilters.assignee)
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadQualityInspections(undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    if (!detailId || !selectedInspection) {
      setEligibility(null)
      return
    }
    void refreshEligibility(selectedInspection.purchase_contract_id)
  }, [detailId, selectedInspection?.id])

  useEffect(() => {
    if (detailId && inspections.length > 0 && !selectedInspection) {
      onNavigate(qualityInspectionPath)
    }
  }, [detailId, inspections, onNavigate, selectedInspection])

  async function loadQualityInspections(
    preferredInspectionId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filters?: QualityInspectionListFilters,
  ) {
    const activeFilters = filters ?? {
      search,
      status: statusFilter,
      result: resultFilter,
      supplier: supplierFilter,
      contract: contractFilter,
      assignee: assigneeFilter,
    }
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    setLoading(true)
    try {
      const result = await listQualityInspections({
        q: activeFilters.search.trim() || undefined,
        status: activeFilters.status || undefined,
        result: activeFilters.result || undefined,
        supplier_id: activeFilters.supplier.trim() || undefined,
        purchase_contract_id: activeFilters.contract.trim() || undefined,
        inspector_user_id: activeFilters.assignee === 'mine' ? currentUser.id : undefined,
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
        await loadQualityInspections(
          preferredInspectionId,
          prevPage,
          resolvedPageSize,
          filters,
        )
        return
      }
      setInspections(result.items)
      setSelectedInspectionId((current) => {
        if (preferredInspectionId) return preferredInspectionId
        if (current && result.items.some((item) => item.id === current)) return current
        return result.items[0]?.id ?? null
      })
    } catch (caught) {
      showError(caught, t('quality.inspection.message.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function resetFilters() {
    const resetFiltersValue: QualityInspectionListFilters = {
      search: '',
      status: '',
      result: '',
      supplier: '',
      contract: '',
      assignee: 'all',
    }
    setSearch(resetFiltersValue.search)
    setStatusFilter(resetFiltersValue.status)
    setResultFilter(resetFiltersValue.result)
    setSupplierFilter(resetFiltersValue.supplier)
    setContractFilter(resetFiltersValue.contract)
    setAssigneeFilter(resetFiltersValue.assignee)
    setMessage('')
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: null,
      status: null,
      result: null,
      supplier: null,
      contract: null,
      assignee: null,
      page: null,
    })
    void loadQualityInspections(undefined, 1, pageSize, resetFiltersValue)
  }

  function submitFilters() {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: search.trim(),
      status: statusFilter,
      result: resultFilter,
      supplier: supplierFilter,
      contract: contractFilter,
      assignee: assigneeFilter === 'mine' ? 'mine' : '',
      page: null,
    })
    void loadQualityInspections(undefined, 1, pageSize)
  }

  function changeInspectionsPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadQualityInspections(undefined, next.page, next.pageSize)
  }

  async function refreshEligibility(purchaseContractId: string) {
    try {
      setEligibility(await getQualityInboundEligibility(purchaseContractId))
    } catch (caught) {
      setEligibility(null)
      showError(caught, t('quality.inspection.message.eligibilityLoadFailed'))
    }
  }

  function replaceInspection(updated: QualityInspection) {
    setInspections((current) =>
      current.map((inspection) => (inspection.id === updated.id ? updated : inspection)),
    )
  }

  function prependInspection(inspection: QualityInspection) {
    setInspections((current) => [inspection, ...current])
  }

  function decrementOpenIssueCount() {
    setSummary((current) => ({
      ...current,
      open_issue_count: Math.max(0, current.open_issue_count - 1),
    }))
  }

  return {
    inspections,
    summary,
    loading,
    pagination,
    search,
    statusFilter,
    resultFilter,
    supplierFilter,
    contractFilter,
    assigneeFilter,
    setSearch,
    setStatusFilter,
    setResultFilter,
    setSupplierFilter,
    setContractFilter,
    setAssigneeFilter,
    selectedInspection,
    setSelectedInspectionId,
    eligibility,
    fetchSupplierOptions,
    fetchFilterContractOptions,
    loadQualityInspections,
    submitFilters,
    resetFilters,
    changeInspectionsPage,
    replaceInspection,
    prependInspection,
    decrementOpenIssueCount,
  }
}
