import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createMiscFeeAllocation,
  createMiscFeeItem,
  listMiscFeeAllocationSummary,
  listMiscFeeAllocations,
  listMiscFeeItems,
  type MiscFeeAllocation,
  type MiscFeeItem,
} from '@/api'
import { showError } from '@/shared/errors'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { t } from '@/app/appI18n'
import {
  MiscFeeItemFormState,
  MiscFeeAllocationFormState,
  initialMiscFeeItemForm,
  initialMiscFeeAllocationForm,
  miscFeeItemPayload,
  miscFeeAllocationPayload,
} from '@/app/pages/finance/financeHelpers'

import type { FinanceModuleEnv } from '@/app/pages/finance/financePageTypes'

type MiscItemFilters = { q: string; category: string; status: string }

type MiscAllocationFilters = { q: string; category: string; shipment: string; sales: string }

function miscItemFiltersFromParams(params: URLSearchParams): MiscItemFilters {
  return {
    q: params.get('misc_items_q') ?? '',
    category: params.get('misc_items_category') ?? '',
    status: params.get('misc_items_status') ?? '',
  }
}

function miscAllocationFiltersFromParams(params: URLSearchParams): MiscAllocationFilters {
  return {
    q: params.get('misc_allocations_q') ?? '',
    category: params.get('misc_allocations_category') ?? '',
    shipment: params.get('misc_allocations_shipment') ?? '',
    sales: params.get('misc_allocations_sales') ?? '',
  }
}

function miscItemSignature(params: URLSearchParams): string {
  return JSON.stringify([
    parsePageParam(params, 'misc_items_page'),
    miscItemFiltersFromParams(params),
  ])
}

function miscAllocationSignature(params: URLSearchParams): string {
  return JSON.stringify([
    parsePageParam(params, 'misc_allocations_page'),
    miscAllocationFiltersFromParams(params),
  ])
}

export function useMiscModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, setMessage, setError, loadOverview } = env

  const urlQuery = useUrlQuery()

  const miscFeeItemsPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'misc_items_page'),
  )

  const miscFeeAllocationsPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'misc_allocations_page'),
  )

  const [miscItemFilters, setMiscItemFilters] = useState(() =>
    miscItemFiltersFromParams(urlQuery.params),
  )

  const appliedMiscItemsSignatureRef = useRef(miscItemSignature(urlQuery.params))

  const [miscAllocationFilters, setMiscAllocationFilters] = useState(() =>
    miscAllocationFiltersFromParams(urlQuery.params),
  )

  const appliedMiscAllocationsSignatureRef = useRef(miscAllocationSignature(urlQuery.params))

  const [miscFeeItems, setMiscFeeItems] = useState<MiscFeeItem[]>([])

  const [miscFeeAllocations, setMiscFeeAllocations] = useState<MiscFeeAllocation[]>([])

  const [miscFeeAllocationSummary, setMiscFeeAllocationSummary] = useState<MiscFeeAllocation[]>([])

  const [selectedMiscFeeItemId, setSelectedMiscFeeItemId] = useState<string | null>(null)

  const [miscFeeItemCodeError, setMiscFeeItemCodeError] = useState('')

  const [miscFeeItemForm, setMiscFeeItemForm] = useState<MiscFeeItemFormState>(() =>
    initialMiscFeeItemForm(),
  )

  const [miscFeeAllocationForm, setMiscFeeAllocationForm] = useState<MiscFeeAllocationFormState>(
    () => initialMiscFeeAllocationForm(),
  )

  const [loadingMiscFeeItems, setLoadingMiscFeeItems] = useState(false)

  const [loadingMiscFeeAllocations, setLoadingMiscFeeAllocations] = useState(false)

  const [loadingMiscFeeSummary, setLoadingMiscFeeSummary] = useState(false)

  const [miscItemModalOpen, setMiscItemModalOpen] = useState(false)

  const [submittingMiscFeeItem, setSubmittingMiscFeeItem] = useState(false)

  const [submittingMiscFeeAllocation, setSubmittingMiscFeeAllocation] = useState(false)

  const selectedMiscFeeItem = useMemo(
    () => miscFeeItems.find((item) => item.id === selectedMiscFeeItemId) ?? miscFeeItems[0] ?? null,
    [miscFeeItems, selectedMiscFeeItemId],
  )

  useEffect(() => {
    if (!selectedMiscFeeItem) return
    setMiscFeeAllocationForm((current) => ({
      ...current,
      item_id: selectedMiscFeeItem.id,
      allocation_method: selectedMiscFeeItem.default_allocation_method,
    }))
  }, [selectedMiscFeeItem?.id, selectedMiscFeeItem?.default_allocation_method])

  async function loadMiscFeeItems(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: MiscItemFilters,
  ) {
    setLoadingMiscFeeItems(true)
    setError('')
    try {
      const filters = filtersOverride ?? miscItemFilters
      const page = pageOverride ?? miscFeeItemsPager.page
      const pageSize = pageSizeOverride ?? miscFeeItemsPager.pageSize
      const result = await listMiscFeeItems({
        q: filters.q.trim() || undefined,
        category: filters.category || undefined,
        status: filters.status || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setMiscFeeItems(result.items)
      miscFeeItemsPager.setTotal(result.total)
      const nextItemId =
        preferredId ??
        (activeModule === 'misc' && result.items.some((item) => item.id === detailId)
          ? detailId
          : null) ??
        (result.items.some((item) => item.id === selectedMiscFeeItemId)
          ? selectedMiscFeeItemId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedMiscFeeItemId(nextItemId)
    } catch (caught) {
      showError(caught, t('finance.misc.message.loadItemsFailed'))
    } finally {
      setLoadingMiscFeeItems(false)
    }
  }

  async function loadMiscFeeAllocations(
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: MiscAllocationFilters,
  ) {
    setLoadingMiscFeeAllocations(true)
    setError('')
    try {
      const filters = filtersOverride ?? miscAllocationFilters
      const page = pageOverride ?? miscFeeAllocationsPager.page
      const pageSize = pageSizeOverride ?? miscFeeAllocationsPager.pageSize
      const result = await listMiscFeeAllocations({
        q: filters.q.trim() || undefined,
        category: filters.category || undefined,
        shipment_no: filters.shipment.trim() || undefined,
        sales_user_id: filters.sales.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setMiscFeeAllocations(result.items)
      miscFeeAllocationsPager.setTotal(result.total)
    } catch (caught) {
      showError(caught, t('finance.misc.message.loadAllocationsFailed'))
    } finally {
      setLoadingMiscFeeAllocations(false)
    }
  }

  async function loadMiscFeeAllocationSummary(filtersOverride?: MiscAllocationFilters) {
    setLoadingMiscFeeSummary(true)
    setError('')
    try {
      const filters = filtersOverride ?? miscAllocationFilters
      const result = await listMiscFeeAllocationSummary({
        shipment_no: filters.shipment.trim() || undefined,
        category: filters.category || undefined,
      })
      setMiscFeeAllocationSummary(result.items)
    } catch (caught) {
      showError(caught, t('finance.misc.message.loadSummaryFailed'))
    } finally {
      setLoadingMiscFeeSummary(false)
    }
  }

  async function changeMiscFeeItemsPage(nextPage: number, nextPageSize: number) {
    const next = miscFeeItemsPager.changePage(nextPage, nextPageSize)
    const nextSearch = urlQuery.update({
      misc_items_page: next.page === 1 ? null : next.page,
      misc_items_q: miscItemFilters.q,
      misc_items_category: miscItemFilters.category,
      misc_items_status: miscItemFilters.status,
    })
    appliedMiscItemsSignatureRef.current = miscItemSignature(new URLSearchParams(nextSearch))
    await loadMiscFeeItems(undefined, next.page, next.pageSize, miscItemFilters)
  }

  async function changeMiscFeeAllocationsPage(nextPage: number, nextPageSize: number) {
    const next = miscFeeAllocationsPager.changePage(nextPage, nextPageSize)
    const nextSearch = urlQuery.update({
      misc_allocations_page: next.page === 1 ? null : next.page,
      misc_allocations_q: miscAllocationFilters.q,
      misc_allocations_category: miscAllocationFilters.category,
      misc_allocations_shipment: miscAllocationFilters.shipment,
      misc_allocations_sales: miscAllocationFilters.sales,
    })
    appliedMiscAllocationsSignatureRef.current = miscAllocationSignature(
      new URLSearchParams(nextSearch),
    )
    await loadMiscFeeAllocations(next.page, next.pageSize, miscAllocationFilters)
    await loadMiscFeeAllocationSummary(miscAllocationFilters)
  }

  useEffect(() => {
    const signature = miscItemSignature(urlQuery.params)
    if (appliedMiscItemsSignatureRef.current === signature) return
    appliedMiscItemsSignatureRef.current = signature
    const filters = miscItemFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'misc_items_page')
    setMiscItemFilters(filters)
    miscFeeItemsPager.setPage(nextPage)
    void loadMiscFeeItems(undefined, nextPage, miscFeeItemsPager.pageSize, filters)
  }, [urlQuery.search])

  useEffect(() => {
    const signature = miscAllocationSignature(urlQuery.params)
    if (appliedMiscAllocationsSignatureRef.current === signature) return
    appliedMiscAllocationsSignatureRef.current = signature
    const filters = miscAllocationFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'misc_allocations_page')
    setMiscAllocationFilters(filters)
    miscFeeAllocationsPager.setPage(nextPage)
    void loadMiscFeeAllocations(nextPage, miscFeeAllocationsPager.pageSize, filters)
    void loadMiscFeeAllocationSummary(filters)
  }, [urlQuery.search])

  async function submitMiscFeeItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!miscFeeItemForm.code.trim()) {
      setMiscFeeItemCodeError(t('finance.misc.validation.codeRequired'))
      return
    }
    setMiscFeeItemCodeError('')
    setSubmittingMiscFeeItem(true)
    setMessage('')
    setError('')
    try {
      const created = await createMiscFeeItem(miscFeeItemPayload(miscFeeItemForm))
      setMessage(t('finance.misc.message.itemCreated', { name: created.name }))
      setMiscFeeItemForm(initialMiscFeeItemForm())
      await loadMiscFeeItems(created.id)
    } catch (caught) {
      showError(caught, t('finance.misc.message.itemCreateFailed'))
    } finally {
      setSubmittingMiscFeeItem(false)
    }
  }

  async function submitMiscFeeAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingMiscFeeAllocation(true)
    setMessage('')
    setError('')
    try {
      const created = await createMiscFeeAllocation(
        miscFeeAllocationPayload(miscFeeAllocationForm, selectedMiscFeeItem),
      )
      setMessage(t('finance.misc.message.allocationCreated', { code: created.allocation_no }))
      setMiscFeeAllocationForm(initialMiscFeeAllocationForm(selectedMiscFeeItem ?? undefined))
      await loadMiscFeeAllocations()
      await loadMiscFeeAllocationSummary()
      await loadOverview()
    } catch (caught) {
      showError(caught, t('finance.misc.message.allocationCreateFailed'))
    } finally {
      setSubmittingMiscFeeAllocation(false)
    }
  }

  const totalMiscFeeAmount = miscFeeAllocationSummary.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  )

  return {
    changeMiscFeeAllocationsPage,
    changeMiscFeeItemsPage,
    loadMiscFeeAllocationSummary,
    loadMiscFeeAllocations,
    loadMiscFeeItems,
    loadingMiscFeeAllocations,
    loadingMiscFeeItems,
    loadingMiscFeeSummary,
    miscFeeAllocationCategoryFilter: miscAllocationFilters.category,
    miscFeeAllocationForm,
    miscFeeAllocationSalesFilter: miscAllocationFilters.sales,
    miscFeeAllocationSearch: miscAllocationFilters.q,
    miscFeeAllocationShipmentFilter: miscAllocationFilters.shipment,
    miscFeeAllocations,
    miscFeeAllocationsPagination: miscFeeAllocationsPager.pagination,
    miscFeeAllocationsTotal: miscFeeAllocationsPager.total,
    miscFeeItemCategoryFilter: miscItemFilters.category,
    miscFeeItemCodeError,
    miscFeeItemForm,
    miscFeeItemSearch: miscItemFilters.q,
    miscFeeItemStatusFilter: miscItemFilters.status,
    miscFeeItems,
    miscFeeItemsPagination: miscFeeItemsPager.pagination,
    miscFeeItemsTotal: miscFeeItemsPager.total,
    miscItemModalOpen,
    selectedMiscFeeItem,
    setMiscFeeAllocationCategoryFilter: (value: string) =>
      setMiscAllocationFilters((current) => ({ ...current, category: value })),
    setMiscFeeAllocationForm,
    setMiscFeeAllocationSalesFilter: (value: string) =>
      setMiscAllocationFilters((current) => ({ ...current, sales: value })),
    setMiscFeeAllocationSearch: (value: string) =>
      setMiscAllocationFilters((current) => ({ ...current, q: value })),
    setMiscFeeAllocationShipmentFilter: (value: string) =>
      setMiscAllocationFilters((current) => ({ ...current, shipment: value })),
    setMiscFeeItemCategoryFilter: (value: string) =>
      setMiscItemFilters((current) => ({ ...current, category: value })),
    setMiscFeeItemCodeError,
    setMiscFeeItemForm,
    setMiscFeeItemSearch: (value: string) =>
      setMiscItemFilters((current) => ({ ...current, q: value })),
    setMiscFeeItemStatusFilter: (value: string) =>
      setMiscItemFilters((current) => ({ ...current, status: value })),
    setMiscFeeSummaryCategoryFilter: (value: string) =>
      setMiscAllocationFilters((current) => ({ ...current, category: value })),
    setMiscFeeSummaryShipmentFilter: (value: string) =>
      setMiscAllocationFilters((current) => ({ ...current, shipment: value })),
    setMiscItemModalOpen,
    setSelectedMiscFeeItemId,
    submitMiscFeeAllocation,
    submitMiscFeeItem,
    submittingMiscFeeAllocation,
    submittingMiscFeeItem,
    totalMiscFeeAmount,
  }
}

export type MiscModel = ReturnType<typeof useMiscModule>
