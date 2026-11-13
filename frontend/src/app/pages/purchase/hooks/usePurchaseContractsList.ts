import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

import {
  getPurchaseContract,
  listPurchaseContractReminders,
  listPurchaseContracts,
  type PurchaseContract,
  type PurchaseContractReminder,
  type PurchaseContractListSummary,
} from '@/api'
import { ApiError, showError } from '@/shared/errors'
import { useLatestRequest } from '@/shared/hooks/useLatestRequest'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { t } from '@/app/appI18n'
import { moduleDetailPath, purchaseContractPath } from '@/app/routes'

import {
  emptyPurchaseContractSummary,
  purchaseContractFiltersFromParams,
  type PurchaseContractListFilters,
} from '../purchaseContractHelpers'

type Options = {
  detailId: string | null
  onNavigate: (path: string) => void
}

/** 采购合同列表：URL 筛选、服务端分页、选中项与列表回写。 */
export function usePurchaseContractsList({ detailId, onNavigate }: Options) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const [contracts, setContracts] = useState<PurchaseContract[]>([])
  const [summary, setSummary] = useState<PurchaseContractListSummary>(
    emptyPurchaseContractSummary,
  )
  const [reminders, setReminders] = useState<PurchaseContractReminder[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [detailContract, setDetailContract] = useState<PurchaseContract | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const latestRequest = useLatestRequest()
  const initialFilters = purchaseContractFiltersFromParams(urlQuery.params)
  const [search, setSearch] = useState(initialFilters.q)
  const [statusFilter, setStatusFilter] = useState(initialFilters.status)
  const [supplierFilter, setSupplierFilter] = useState(initialFilters.supplier)
  const [sourceFilter, setSourceFilter] = useState(initialFilters.source)
  const [loading, setLoading] = useState(false)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )

  const selectedContract = useMemo(() => {
    if (detailId) {
      return contracts.find((item) => item.id === detailId) ?? detailContract ?? null
    }
    return contracts.find((item) => item.id === selectedContractId) ?? contracts[0] ?? null
  }, [contracts, detailContract, detailId, selectedContractId])

  useEffect(() => {
    void loadContracts()
    void loadContractReminders()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextFilters = purchaseContractFiltersFromParams(urlQuery.params)
    setSearch(nextFilters.q)
    setStatusFilter(nextFilters.status)
    setSourceFilter(nextFilters.source)
    setSupplierFilter(nextFilters.supplier)
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadContracts(undefined, undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  // 详情按 ID 独立请求：列表只作为首屏优化，不再用“当前页是否包含”判断记录是否存在。
  useEffect(() => {
    if (!detailId) {
      setDetailContract(null)
      setDetailLoading(false)
      return
    }
    if (contracts.some((item) => item.id === detailId)) {
      setDetailContract(null)
      setDetailLoading(false)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    void (async () => {
      try {
        const contract = await getPurchaseContract(detailId)
        if (!cancelled) setDetailContract(contract)
      } catch (caught) {
        if (cancelled) return
        if (caught instanceof ApiError && caught.status === 404) {
          onNavigate(purchaseContractPath)
        } else {
          showError(caught, t('purchase.contract.list.loadFailed'))
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contracts, detailId, onNavigate])

  async function loadContracts(
    preferredId?: string,
    preferredContract?: PurchaseContract,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: PurchaseContractListFilters,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    const resolvedQ = filtersOverride?.q ?? search
    const resolvedStatus = filtersOverride?.status ?? statusFilter
    const resolvedSupplier = filtersOverride?.supplier ?? supplierFilter
    const resolvedSource = filtersOverride?.source ?? sourceFilter
    setLoading(true)
    const requestId = latestRequest.begin()
    try {
      const result = await listPurchaseContracts({
        q: resolvedQ.trim() || undefined,
        approval_status: resolvedStatus || undefined,
        supplier_id: resolvedSupplier.trim() || undefined,
        source_type: resolvedSource || undefined,
        limit: resolvedPageSize,
        offset: (resolvedPage - 1) * resolvedPageSize,
      })
      if (!latestRequest.isLatest(requestId)) return
      setTotal(result.total)
      setSummary(result.summary)
      if (result.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadContracts(
          preferredId,
          preferredContract,
          prevPage,
          resolvedPageSize,
          filtersOverride,
        )
        return
      }
      const items = preferredContract
        ? [preferredContract, ...result.items.filter((item) => item.id !== preferredContract.id)]
        : result.items
      setContracts(items)
      const nextSelectedId =
        preferredId ??
        (items.some((item) => item.id === selectedContractId) ? selectedContractId : null) ??
        items[0]?.id ??
        null
      setSelectedContractId(nextSelectedId)
    } catch (caught) {
      if (!latestRequest.isLatest(requestId)) return
      showError(caught, t('purchase.contract.list.loadFailed'))
    } finally {
      if (latestRequest.isLatest(requestId)) setLoading(false)
    }
  }

  async function loadContractReminders() {
    try {
      const result = await listPurchaseContractReminders()
      setReminders(result.items)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.reminderLoadFailed'))
    }
  }

  function upsertContract(contract: PurchaseContract) {
    setContracts((current) => {
      const exists = current.some((item) => item.id === contract.id)
      return exists
        ? current.map((item) => (item.id === contract.id ? contract : item))
        : [contract, ...current]
    })
    setSelectedContractId(contract.id)
  }

  /** 表单/审批/作废操作成功后：回写列表项并重新拉取列表与提醒。 */
  async function applySavedContract(saved: PurchaseContract) {
    upsertContract(saved)
    await Promise.all([loadContracts(saved.id, saved), loadContractReminders()])
  }

  function submitFilters() {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: search,
      status: statusFilter,
      source: sourceFilter,
      supplier: supplierFilter,
      page: null,
    })
    void loadContracts(undefined, undefined, 1)
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setSupplierFilter('')
    setSourceFilter('')
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: null,
      status: null,
      supplier: null,
      source: null,
      page: null,
    })
    void loadContracts(undefined, undefined, 1, pageSize, {
      q: '',
      status: '',
      supplier: '',
      source: '',
    })
  }

  function changeContractsPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadContracts(undefined, undefined, next.page, next.pageSize)
  }

  function openContractDetail(contract: PurchaseContract) {
    setSelectedContractId(contract.id)
    onNavigate(moduleDetailPath(purchaseContractPath, contract.id))
  }

  function stopAndOpenContractDetail(
    event: MouseEvent<HTMLElement>,
    contract: PurchaseContract,
  ) {
    event.stopPropagation()
    openContractDetail(contract)
  }

  return {
    contracts,
    summary,
    reminders,
    selectedContract,
    selectedContractId,
    setSelectedContractId,
    detailLoading,
    loading,
    total,
    pagination,
    search,
    statusFilter,
    supplierFilter,
    sourceFilter,
    setSearch,
    setStatusFilter,
    setSupplierFilter,
    setSourceFilter,
    loadContracts,
    loadContractReminders,
    applySavedContract,
    submitFilters,
    clearFilters,
    changeContractsPage,
    stopAndOpenContractDetail,
  }
}

export type PurchaseContractsListModel = ReturnType<typeof usePurchaseContractsList>
