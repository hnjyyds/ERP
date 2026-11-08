import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

import {
  listExportContracts,
  type ExportContract,
  type ExportContractListSummary,
} from '@/api'
import { showError } from '@/shared/errors'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { t } from '@/app/appI18n'
import { exportContractPath, moduleDetailPath } from '@/app/routes'

import {
  emptyExportContractSummary,
  exportContractFiltersFromParams,
  type ExportContractListFilters,
} from '../exportContractHelpers'

type Options = {
  detailId: string | null
  onNavigate: (path: string) => void
}

/** 出口合同列表：URL 筛选、服务端分页、选中项与列表回写。 */
export function useExportContractsList({ detailId, onNavigate }: Options) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const [contracts, setContracts] = useState<ExportContract[]>([])
  const [summary, setSummary] = useState<ExportContractListSummary>(emptyExportContractSummary)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const initialFilters = exportContractFiltersFromParams(urlQuery.params)
  const [search, setSearch] = useState(initialFilters.q)
  const [statusFilter, setStatusFilter] = useState(initialFilters.status)
  const [customerFilter, setCustomerFilter] = useState(initialFilters.customer)
  const [loading, setLoading] = useState(false)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )

  const selectedContract = useMemo(() => {
    if (detailId) return contracts.find((item) => item.id === detailId) ?? null
    return contracts.find((item) => item.id === selectedContractId) ?? contracts[0] ?? null
  }, [contracts, detailId, selectedContractId])

  useEffect(() => {
    void loadContracts()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextFilters = exportContractFiltersFromParams(urlQuery.params)
    setSearch(nextFilters.q)
    setStatusFilter(nextFilters.status)
    setCustomerFilter(nextFilters.customer)
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadContracts(undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    if (detailId && contracts.length > 0 && !contracts.some((item) => item.id === detailId)) {
      onNavigate(exportContractPath)
    }
  }, [contracts, detailId, onNavigate])

  async function loadContracts(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: ExportContractListFilters,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    const resolvedQ = filtersOverride?.q ?? search
    const resolvedStatus = filtersOverride?.status ?? statusFilter
    const resolvedCustomer = filtersOverride?.customer ?? customerFilter
    setLoading(true)
    try {
      const result = await listExportContracts({
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
        await loadContracts(preferredId, prevPage, resolvedPageSize, filtersOverride)
        return
      }
      setContracts(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedContractId) ? selectedContractId : null) ??
        result.items[0]?.id ??
        null
      setSelectedContractId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('sales.contract.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function upsertContract(contract: ExportContract) {
    setContracts((current) => {
      const exists = current.some((item) => item.id === contract.id)
      return exists
        ? current.map((item) => (item.id === contract.id ? contract : item))
        : [contract, ...current]
    })
    setSelectedContractId(contract.id)
  }

  /** 表单/审批/签署等操作成功后：回写列表项并重新拉取列表。 */
  async function applySavedContract(saved: ExportContract) {
    upsertContract(saved)
    await loadContracts(saved.id)
  }

  function submitFilters() {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: search.trim(),
      status: statusFilter,
      customer: customerFilter,
      page: null,
    })
    void loadContracts(undefined, 1)
  }

  function changeContractsPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadContracts(undefined, next.page, next.pageSize)
  }

  function openContractDetail(contract: ExportContract) {
    setSelectedContractId(contract.id)
    onNavigate(moduleDetailPath(exportContractPath, contract.id))
  }

  function stopAndOpenContractDetail(
    event: MouseEvent<HTMLElement>,
    contract: ExportContract,
  ) {
    event.stopPropagation()
    openContractDetail(contract)
  }

  return {
    contracts,
    summary,
    selectedContract,
    selectedContractId,
    setSelectedContractId,
    loading,
    total,
    pagination,
    search,
    statusFilter,
    customerFilter,
    setSearch,
    setStatusFilter,
    setCustomerFilter,
    applySavedContract,
    submitFilters,
    changeContractsPage,
    stopAndOpenContractDetail,
  }
}

export type ExportContractsListModel = ReturnType<typeof useExportContractsList>
