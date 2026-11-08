import type { MouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  listOutboundOrders,
  listOutboundPlans,
  type OutboundOrder,
  type OutboundOrderListSummary,
  type OutboundPlan,
} from '@/api'
import { moduleDetailPath, warehouseOutboundOrderPath } from '@/app/routes'
import { t } from '@/app/appI18n'
import { showError } from '@/shared/errors'
import { useTablePagination } from '@/shared/useTablePagination'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'

type Filters = {
  q: string
  status: string
  mode: string
  type: string
  customer: string
  sourceId: string
}

type Params = {
  detailId: string | null
  onNavigate: (path: string) => void
  setInventorySearch: (value: string) => void
  loadInventorySnapshotForOrder: (
    order: OutboundOrder | null,
    inventoryQuery?: string,
  ) => Promise<void>
}

function filtersFromParams(params: URLSearchParams): Filters {
  return {
    q: params.get('q') ?? '',
    status: params.get('status') ?? '',
    mode: params.get('mode') ?? '',
    type: params.get('type') ?? '',
    customer: params.get('customer') ?? '',
    sourceId: params.get('source_id') ?? '',
  }
}

export function useOutboundOrdersList({
  detailId,
  onNavigate,
  setInventorySearch,
  loadInventorySnapshotForOrder,
}: Params) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const initialFilters = filtersFromParams(urlQuery.params)
  const [orders, setOrders] = useState<OutboundOrder[]>([])
  const [summary, setSummary] = useState<OutboundOrderListSummary>({
    draft_count: 0,
    submitted_count: 0,
    approved_count: 0,
    outbound_quantity: '0',
  })
  const [outboundPlans, setOutboundPlans] = useState<OutboundPlan[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState(initialFilters.q)
  const [statusFilter, setStatusFilter] = useState(initialFilters.status)
  const [modeFilter, setModeFilter] = useState(initialFilters.mode)
  const [typeFilter, setTypeFilter] = useState(initialFilters.type)
  const [customerFilter, setCustomerFilter] = useState(initialFilters.customer)
  const [sourceIdFilter, setSourceIdFilter] = useState(initialFilters.sourceId)
  const [loading, setLoading] = useState(false)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )

  const selectedOrder = useMemo(() => {
    if (detailId) return orders.find((item) => item.id === detailId) ?? null
    return orders.find((item) => item.id === selectedOrderId) ?? orders[0] ?? null
  }, [detailId, orders, selectedOrderId])

  useEffect(() => {
    void loadOutboundOrders()
  }, [])

  // 浏览器前进/后退只改变查询串时，App 的 activePath 不变，需要页面自己重新读取。
  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextFilters = filtersFromParams(urlQuery.params)
    setSearch(nextFilters.q)
    setStatusFilter(nextFilters.status)
    setModeFilter(nextFilters.mode)
    setTypeFilter(nextFilters.type)
    setCustomerFilter(nextFilters.customer)
    setSourceIdFilter(nextFilters.sourceId)
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadOutboundOrders(undefined, undefined, undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    if (detailId && orders.length > 0 && !orders.some((item) => item.id === detailId)) {
      onNavigate(warehouseOutboundOrderPath)
    }
  }, [detailId, onNavigate, orders])

  const fetchOutboundPlans = useCallback(async (): Promise<OutboundPlan[]> => {
    const [allPlans, scheduledPlans, plannedPlans] = await Promise.all([
      listOutboundPlans({}),
      listOutboundPlans({ status: 'scheduled' }),
      listOutboundPlans({ status: 'planned' }),
    ])
    const planById = new Map<string, OutboundPlan>()
    for (const plan of [...scheduledPlans.items, ...plannedPlans.items, ...allPlans.items]) {
      planById.set(plan.id, plan)
    }
    return [...planById.values()]
  }, [])

  async function loadOutboundOrders(
    preferredOrderId?: string,
    preferredOrder?: OutboundOrder,
    inventoryQuery?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: Filters,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    const resolvedQ = filtersOverride?.q ?? search
    const resolvedStatus = filtersOverride?.status ?? statusFilter
    const resolvedMode = filtersOverride?.mode ?? modeFilter
    const resolvedType = filtersOverride?.type ?? typeFilter
    const resolvedCustomer = filtersOverride?.customer ?? customerFilter
    const resolvedSourceId = filtersOverride?.sourceId ?? sourceIdFilter
    setLoading(true)
    try {
      const [orderResult, planOptions] = await Promise.all([
        listOutboundOrders({
          q: preferredOrder?.code ?? (resolvedQ.trim() || undefined),
          status: resolvedStatus || undefined,
          outbound_mode: resolvedMode || undefined,
          outbound_type: resolvedType || undefined,
          customer_id: resolvedCustomer.trim() || undefined,
          source_id: resolvedSourceId.trim() || undefined,
          limit: resolvedPageSize,
          offset: (resolvedPage - 1) * resolvedPageSize,
        }),
        fetchOutboundPlans(),
      ])
      setTotal(orderResult.total)
      setSummary(orderResult.summary)
      if (orderResult.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadOutboundOrders(
          preferredOrderId,
          preferredOrder,
          inventoryQuery,
          prevPage,
          resolvedPageSize,
          filtersOverride,
        )
        return
      }
      const nextOrders = preferredOrder
        ? [preferredOrder, ...orderResult.items.filter((item) => item.id !== preferredOrder.id)]
        : orderResult.items
      const nextOrderId =
        preferredOrderId ??
        (nextOrders.some((item) => item.id === selectedOrderId) ? selectedOrderId : null) ??
        nextOrders[0]?.id ??
        null
      const nextOrder = nextOrders.find((item) => item.id === nextOrderId) ?? null
      setOrders(nextOrders)
      setOutboundPlans(planOptions)
      setSelectedOrderId(nextOrderId)
      await loadInventorySnapshotForOrder(nextOrder, inventoryQuery)
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function upsertOutboundOrder(order: OutboundOrder) {
    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id)
      return exists
        ? current.map((item) => (item.id === order.id ? order : item))
        : [order, ...current]
    })
    setSelectedOrderId(order.id)
  }

  function openOutboundOrderDetail(order: OutboundOrder) {
    setSelectedOrderId(order.id)
    onNavigate(moduleDetailPath(warehouseOutboundOrderPath, order.id))
  }

  function stopAndOpenOutboundOrderDetail(event: MouseEvent<HTMLElement>, order: OutboundOrder) {
    event.stopPropagation()
    openOutboundOrderDetail(order)
  }

  function currentFilters(): Filters {
    return {
      q: search,
      status: statusFilter,
      mode: modeFilter,
      type: typeFilter,
      customer: customerFilter,
      sourceId: sourceIdFilter,
    }
  }

  function writeFiltersToUrl(filters: Filters) {
    return urlQuery.update({
      q: filters.q || null,
      status: filters.status || null,
      mode: filters.mode || null,
      type: filters.type || null,
      customer: filters.customer || null,
      source_id: filters.sourceId || null,
      page: null,
    })
  }

  function submitFilters() {
    const filters = currentFilters()
    setPage(1)
    appliedUrlSearchRef.current = writeFiltersToUrl(filters)
    void loadOutboundOrders(undefined, undefined, undefined, 1, pageSize, filters)
  }

  function changeListPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadOutboundOrders(undefined, undefined, undefined, next.page, next.pageSize)
  }

  async function applyGeneratedOrder(order: OutboundOrder, inventoryQuery: string) {
    const nextFilters: Filters = {
      q: order.code,
      status: '',
      mode: modeFilter,
      type: order.outbound_type,
      customer: order.customer_id ?? '',
      sourceId: order.source_id,
    }
    setSearch(nextFilters.q)
    setStatusFilter(nextFilters.status)
    setTypeFilter(nextFilters.type)
    setCustomerFilter(nextFilters.customer)
    setSourceIdFilter(nextFilters.sourceId)
    setInventorySearch(inventoryQuery)
    setPage(1)
    appliedUrlSearchRef.current = writeFiltersToUrl(nextFilters)
    upsertOutboundOrder(order)
    await loadOutboundOrders(order.id, order, inventoryQuery, 1, pageSize, nextFilters)
  }

  async function applySubmittedOrder(order: OutboundOrder, inventoryQuery: string) {
    upsertOutboundOrder(order)
    await loadOutboundOrders(order.id, order, inventoryQuery)
  }

  async function applyApprovedOrder(order: OutboundOrder, inventoryQuery: string) {
    const nextFilters: Filters = {
      q: search,
      status: 'approved',
      mode: modeFilter,
      type: typeFilter,
      customer: customerFilter,
      sourceId: sourceIdFilter,
    }
    setStatusFilter(nextFilters.status)
    setInventorySearch(inventoryQuery)
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      status: nextFilters.status,
      page: null,
    })
    upsertOutboundOrder(order)
    await loadOutboundOrders(order.id, order, inventoryQuery, 1, pageSize, nextFilters)
  }

  async function applyCancelledOrder(order: OutboundOrder) {
    upsertOutboundOrder(order)
    await loadOutboundOrders(order.id, order)
  }

  return {
    urlQuery,
    orders,
    outboundPlans,
    summary,
    selectedOrder,
    selectedOrderId,
    setSelectedOrderId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    modeFilter,
    setModeFilter,
    typeFilter,
    setTypeFilter,
    customerFilter,
    setCustomerFilter,
    sourceIdFilter,
    setSourceIdFilter,
    loading,
    total,
    pagination,
    submitFilters,
    changeListPage,
    loadOutboundOrders,
    openOutboundOrderDetail,
    stopAndOpenOutboundOrderDetail,
    applyGeneratedOrder,
    applySubmittedOrder,
    applyApprovedOrder,
    applyCancelledOrder,
  }
}
