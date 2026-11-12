import type { MouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  listInboundOrders,
  listInboundPlans,
  listInventoryBalances,
  listPurchaseContracts,
  type InboundOrder,
  type InboundPlan,
} from '@/api'
import { moduleDetailPath, warehouseInboundOrderPath } from '@/app/routes'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { useTablePagination } from '@/shared/useTablePagination'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'

import { emptyInboundOrderStatusSummary } from '../inboundOrderHelpers'

type Params = {
  detailId: string | null
  onNavigate: (path: string) => void
  inventorySearch: string
  setInventorySearch: (value: string) => void
  setInventorySummary: (summary: {
    available_quantity: string
    pending_inspection_quantity: string
  }) => void
  loadInventorySnapshotForOrder: (
    order: InboundOrder | null,
    inventoryQuery?: string,
    fallbackSearch?: string,
  ) => Promise<void>
}

export function useInboundOrdersList({
  detailId,
  onNavigate,
  inventorySearch,
  setInventorySearch,
  setInventorySummary,
  loadInventorySnapshotForOrder,
}: Params) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const [orders, setOrders] = useState<InboundOrder[]>([])
  const [inboundPlans, setInboundPlans] = useState<InboundPlan[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => urlQuery.params.get('status') ?? '')
  const [modeFilter, setModeFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusSummary, setStatusSummary] = useState(emptyInboundOrderStatusSummary)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )

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
        description: t('warehouse.inboundOrder.list.supplierOptionDescription', { code: item.code }),
      })
    })
    return [...suppliers.values()].slice(0, 20)
  }, [])

  const fetchContractOptions = useCallback(
    async (query: string) => {
      const result = await listPurchaseContracts({
        q: query.trim() || undefined,
        approval_status: 'approved',
        supplier_id: supplierFilter || undefined,
      })
      return result.items.slice(0, 20).map((item) => ({
        value: item.id,
        label: item.code,
        description: t('warehouse.inboundOrder.list.contractOptionDescription', {
          supplier: item.supplier_name,
          orderDate: item.contract_date,
          deliveryDate: item.delivery_date,
        }),
      }))
    },
    [supplierFilter],
  )

  const selectedOrder = useMemo(() => {
    if (detailId) return orders.find((item) => item.id === detailId) ?? null
    return orders.find((item) => item.id === selectedOrderId) ?? orders[0] ?? null
  }, [detailId, orders, selectedOrderId])

  useEffect(() => {
    void loadInboundOrders()
  }, [])

  // 浏览器前进/后退只改变查询串时，App 的 activePath 不变，需要页面自己重新读取。
  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextSearch = urlQuery.params.get('q') ?? ''
    const nextStatus = urlQuery.params.get('status') ?? ''
    const nextPage = parsePageParam(urlQuery.params)
    setSearch(nextSearch)
    setStatusFilter(nextStatus)
    setPage(nextPage)
    void loadInboundOrders(undefined, undefined, undefined, {
      q: nextSearch,
      status: nextStatus,
      page: nextPage,
    })
  }, [urlQuery.search])

  useEffect(() => {
    if (detailId && orders.length > 0 && !orders.some((item) => item.id === detailId)) {
      onNavigate(warehouseInboundOrderPath)
    }
  }, [detailId, onNavigate, orders])

  async function loadInboundOrders(
    preferredOrderId?: string,
    preferredOrder?: InboundOrder,
    inventoryQuery?: string,
    queryOverride?: {
      q?: string
      status?: string
      page?: number
      pageSize?: number
      inboundMode?: string
      supplier?: string
      contract?: string
    },
  ) {
    const resolvedQuery = queryOverride?.q ?? search
    const resolvedStatus = queryOverride?.status ?? statusFilter
    const resolvedMode = queryOverride?.inboundMode ?? modeFilter
    const resolvedSupplier = queryOverride?.supplier ?? supplierFilter
    const resolvedContract = queryOverride?.contract ?? contractFilter
    const resolvedPage = queryOverride?.page ?? page
    const resolvedPageSize = queryOverride?.pageSize ?? pageSize
    const summaryInventoryQuery = inventorySearch.trim() || resolvedQuery.trim() || undefined
    setLoading(true)
    try {
      const [orderResult, planOptions, balanceSummary] = await Promise.all([
        listInboundOrders({
          q: preferredOrder?.code ?? (resolvedQuery.trim() || undefined),
          status: resolvedStatus || undefined,
          inbound_mode: resolvedMode || undefined,
          supplier_id: resolvedSupplier.trim() || undefined,
          purchase_contract_id: resolvedContract.trim() || undefined,
          limit: resolvedPageSize,
          offset: (resolvedPage - 1) * resolvedPageSize,
        }),
        loadInboundOrderPlanOptions(),
        listInventoryBalances({ q: summaryInventoryQuery, limit: 1 }),
      ])
      setTotal(orderResult.total)
      setStatusSummary(orderResult.summary)
      setInventorySummary(balanceSummary.summary)
      const nextOrders = preferredOrder
        ? [preferredOrder, ...orderResult.items.filter((item) => item.id !== preferredOrder.id)]
        : orderResult.items
      const nextSelectedId =
        preferredOrderId ??
        (nextOrders.some((item) => item.id === selectedOrderId) ? selectedOrderId : null) ??
        nextOrders[0]?.id ??
        null
      const nextOrder = nextOrders.find((item) => item.id === nextSelectedId) ?? null
      setOrders(nextOrders)
      setInboundPlans(planOptions)
      setSelectedOrderId(nextSelectedId)
      await loadInventorySnapshotForOrder(nextOrder, inventoryQuery, search)
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadInboundOrderPlanOptions(): Promise<InboundPlan[]> {
    const [allPlans, scheduledPlans, plannedPlans] = await Promise.all([
      listInboundPlans({}),
      listInboundPlans({ status: 'scheduled' }),
      listInboundPlans({ status: 'planned' }),
    ])
    const planById = new Map<string, InboundPlan>()
    for (const plan of [...scheduledPlans.items, ...plannedPlans.items, ...allPlans.items]) {
      planById.set(plan.id, plan)
    }
    return [...planById.values()]
  }

  function upsertInboundOrder(order: InboundOrder) {
    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id)
      return exists ? current.map((item) => (item.id === order.id ? order : item)) : [order, ...current]
    })
    setSelectedOrderId(order.id)
  }

  function openInboundOrderDetail(order: InboundOrder) {
    setSelectedOrderId(order.id)
    onNavigate(moduleDetailPath(warehouseInboundOrderPath, order.id))
  }

  function stopAndOpenInboundOrderDetail(event: MouseEvent<HTMLElement>, order: InboundOrder) {
    event.stopPropagation()
    openInboundOrderDetail(order)
  }

  function submitFilters() {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: search,
      status: statusFilter,
      page: null,
    })
    void loadInboundOrders(undefined, undefined, undefined, {
      q: search,
      status: statusFilter,
      page: 1,
    })
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setModeFilter('')
    setSupplierFilter('')
    setContractFilter('')
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({ q: null, status: null, page: null })
    void loadInboundOrders(undefined, undefined, undefined, {
      q: '',
      status: '',
      page: 1,
      inboundMode: '',
      supplier: '',
      contract: '',
    })
  }

  function changeListPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadInboundOrders(undefined, undefined, undefined, {
      page: next.page,
      pageSize: next.pageSize,
    })
  }

  async function applyGeneratedOrder(order: InboundOrder, inventoryQuery: string) {
    setSearch(order.code)
    setStatusFilter('')
    setContractFilter(order.purchase_contract_id)
    setInventorySearch(inventoryQuery)
    upsertInboundOrder(order)
    await loadInboundOrders(order.id, order, inventoryQuery)
  }

  async function applyApprovedOrder(order: InboundOrder, inventoryQuery: string) {
    setStatusFilter('approved')
    setInventorySearch(inventoryQuery)
    upsertInboundOrder(order)
    await loadInboundOrders(order.id, order, inventoryQuery)
  }

  async function applySubmittedOrder(order: InboundOrder, inventoryQuery: string) {
    upsertInboundOrder(order)
    await loadInboundOrders(order.id, order, inventoryQuery)
  }

  async function applySavedOrder(order: InboundOrder) {
    upsertInboundOrder(order)
    await loadInboundOrders(order.id, order)
  }

  return {
    urlQuery,
    orders,
    inboundPlans,
    selectedOrder,
    selectedOrderId,
    setSelectedOrderId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    modeFilter,
    setModeFilter,
    supplierFilter,
    setSupplierFilter,
    contractFilter,
    setContractFilter,
    loading,
    statusSummary,
    total,
    pagination,
    fetchSupplierOptions,
    fetchContractOptions,
    openInboundOrderDetail,
    stopAndOpenInboundOrderDetail,
    submitFilters,
    clearFilters,
    changeListPage,
    loadInboundOrders,
    applyGeneratedOrder,
    applyApprovedOrder,
    applySubmittedOrder,
    applySavedOrder,
  }
}
