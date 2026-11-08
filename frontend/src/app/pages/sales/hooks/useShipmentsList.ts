import type { MouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  listShipments,
  listShipmentReminders,
  type ShipmentPlan,
  type ShipmentPlanListSummary,
  type ShipmentReminder,
} from '@/api'
import { moduleDetailPath, shipmentPath } from '@/app/routes'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { useTablePagination } from '@/shared/useTablePagination'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'

type Filters = { q: string; status: string; customer: string; contract: string }

type Params = {
  detailId: string | null
  onNavigate: (path: string) => void
}

function filtersFromParams(params: URLSearchParams): Filters {
  return {
    q: params.get('q') ?? '',
    status: params.get('status') ?? '',
    customer: params.get('customer') ?? '',
    contract: params.get('contract') ?? '',
  }
}

export function useShipmentsList({ detailId, onNavigate }: Params) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const initialFilters = filtersFromParams(urlQuery.params)
  const [shipments, setShipments] = useState<ShipmentPlan[]>([])
  const [summary, setSummary] = useState<ShipmentPlanListSummary>({
    submitted_count: 0,
    approved_count: 0,
    receivable_amount: '0',
    profit_amount: '0',
    currency: null,
  })
  const [reminders, setReminders] = useState<ShipmentReminder[]>([])
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
  const [search, setSearch] = useState(initialFilters.q)
  const [statusFilter, setStatusFilter] = useState(initialFilters.status)
  const [customerFilter, setCustomerFilter] = useState(initialFilters.customer)
  const [contractFilter, setContractFilter] = useState(initialFilters.contract)
  const [loading, setLoading] = useState(false)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )

  const selectedShipment = useMemo(() => {
    if (detailId) return shipments.find((item) => item.id === detailId) ?? null
    return shipments.find((item) => item.id === selectedShipmentId) ?? shipments[0] ?? null
  }, [detailId, shipments, selectedShipmentId])

  useEffect(() => {
    void loadShipments()
    void loadReminders()
  }, [])

  // 浏览器前进/后退只改变查询串时，App 的 activePath 不变，需要页面自己重新读取。
  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextFilters = filtersFromParams(urlQuery.params)
    setSearch(nextFilters.q)
    setStatusFilter(nextFilters.status)
    setCustomerFilter(nextFilters.customer)
    setContractFilter(nextFilters.contract)
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadShipments(undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    if (detailId && shipments.length > 0 && !shipments.some((item) => item.id === detailId)) {
      onNavigate(shipmentPath)
    }
  }, [detailId, onNavigate, shipments])

  async function loadShipments(
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
    const resolvedContract = filtersOverride?.contract ?? contractFilter
    setLoading(true)
    try {
      const result = await listShipments({
        q: resolvedQ.trim() || undefined,
        approval_status: resolvedStatus || undefined,
        customer_id: resolvedCustomer.trim() || undefined,
        contract_id: resolvedContract.trim() || undefined,
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
        await loadShipments(preferredId, prevPage, resolvedPageSize, filtersOverride)
        return
      }
      setShipments(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedShipmentId) ? selectedShipmentId : null) ??
        result.items[0]?.id ??
        null
      setSelectedShipmentId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('sales.shipment.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadReminders() {
    try {
      const result = await listShipmentReminders()
      setReminders(result.items)
    } catch (caught) {
      showError(caught, t('sales.shipment.list.remindersLoadFailed'))
    }
  }

  function upsertShipment(shipment: ShipmentPlan) {
    setShipments((current) => {
      const exists = current.some((item) => item.id === shipment.id)
      return exists
        ? current.map((item) => (item.id === shipment.id ? shipment : item))
        : [shipment, ...current]
    })
    setSelectedShipmentId(shipment.id)
  }

  function openShipmentDetail(shipment: ShipmentPlan) {
    setSelectedShipmentId(shipment.id)
    onNavigate(moduleDetailPath(shipmentPath, shipment.id))
  }

  function stopAndOpenShipmentDetail(event: MouseEvent<HTMLElement>, shipment: ShipmentPlan) {
    event.stopPropagation()
    openShipmentDetail(shipment)
  }

  function submitFilters() {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: search.trim(),
      status: statusFilter,
      customer: customerFilter,
      contract: contractFilter,
      page: null,
    })
    void loadShipments(undefined, 1)
  }

  function changeListPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadShipments(undefined, next.page, next.pageSize)
  }

  return {
    shipments,
    summary,
    reminders,
    selectedShipment,
    selectedShipmentId,
    setSelectedShipmentId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    customerFilter,
    setCustomerFilter,
    contractFilter,
    setContractFilter,
    loading,
    total,
    pagination,
    loadShipments,
    loadReminders,
    upsertShipment,
    openShipmentDetail,
    stopAndOpenShipmentDetail,
    submitFilters,
    changeListPage,
  }
}
