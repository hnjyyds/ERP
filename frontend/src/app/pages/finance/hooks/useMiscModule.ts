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

  const miscFeeItemsUrlPage = urlQuery.params.get('misc_items_page') ?? ''

  const appliedMiscFeeItemsPageRef = useRef(miscFeeItemsUrlPage)

  const miscFeeAllocationsUrlPage = urlQuery.params.get('misc_allocations_page') ?? ''

  const appliedMiscFeeAllocationsPageRef = useRef(miscFeeAllocationsUrlPage)

  const [miscFeeItems, setMiscFeeItems] = useState<MiscFeeItem[]>([])

  const [miscFeeAllocations, setMiscFeeAllocations] = useState<MiscFeeAllocation[]>([])

  const [miscFeeAllocationSummary, setMiscFeeAllocationSummary] = useState<MiscFeeAllocation[]>([])

  const [selectedMiscFeeItemId, setSelectedMiscFeeItemId] = useState<string | null>(null)

  const [miscFeeItemSearch, setMiscFeeItemSearch] = useState('')

  const [miscFeeItemCategoryFilter, setMiscFeeItemCategoryFilter] = useState('')

  const [miscFeeItemStatusFilter, setMiscFeeItemStatusFilter] = useState('')

  const [miscFeeItemCodeError, setMiscFeeItemCodeError] = useState('')

  const [miscFeeAllocationSearch, setMiscFeeAllocationSearch] = useState('')

  const [miscFeeAllocationCategoryFilter, setMiscFeeAllocationCategoryFilter] = useState('')

  const [miscFeeAllocationShipmentFilter, setMiscFeeAllocationShipmentFilter] = useState('')

  const [miscFeeAllocationSalesFilter, setMiscFeeAllocationSalesFilter] = useState('')

  const [miscFeeSummaryShipmentFilter, setMiscFeeSummaryShipmentFilter] = useState('')

  const [miscFeeSummaryCategoryFilter, setMiscFeeSummaryCategoryFilter] = useState('')

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
  ) {
    setLoadingMiscFeeItems(true)
    setError('')
    try {
      const page = pageOverride ?? miscFeeItemsPager.page
      const pageSize = pageSizeOverride ?? miscFeeItemsPager.pageSize
      const result = await listMiscFeeItems({
        q: miscFeeItemSearch.trim() || undefined,
        category: miscFeeItemCategoryFilter || undefined,
        status: miscFeeItemStatusFilter || undefined,
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

  async function loadMiscFeeAllocations(pageOverride?: number, pageSizeOverride?: number) {
    setLoadingMiscFeeAllocations(true)
    setError('')
    try {
      const page = pageOverride ?? miscFeeAllocationsPager.page
      const pageSize = pageSizeOverride ?? miscFeeAllocationsPager.pageSize
      const result = await listMiscFeeAllocations({
        q: miscFeeAllocationSearch.trim() || undefined,
        category: miscFeeAllocationCategoryFilter || undefined,
        shipment_no: miscFeeAllocationShipmentFilter.trim() || undefined,
        sales_user_id: miscFeeAllocationSalesFilter.trim() || undefined,
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

  async function loadMiscFeeAllocationSummary() {
    setLoadingMiscFeeSummary(true)
    setError('')
    try {
      const result = await listMiscFeeAllocationSummary({
        shipment_no: miscFeeSummaryShipmentFilter.trim() || undefined,
        category: miscFeeSummaryCategoryFilter || undefined,
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
    appliedMiscFeeItemsPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ misc_items_page: next.page === 1 ? null : next.page })
    await loadMiscFeeItems(undefined, next.page, next.pageSize)
  }

  async function changeMiscFeeAllocationsPage(nextPage: number, nextPageSize: number) {
    const next = miscFeeAllocationsPager.changePage(nextPage, nextPageSize)
    appliedMiscFeeAllocationsPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ misc_allocations_page: next.page === 1 ? null : next.page })
    await loadMiscFeeAllocations(next.page, next.pageSize)
  }

  useEffect(() => {
    if (appliedMiscFeeItemsPageRef.current === miscFeeItemsUrlPage) return
    appliedMiscFeeItemsPageRef.current = miscFeeItemsUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'misc_items_page')
    miscFeeItemsPager.setPage(nextPage)
    void loadMiscFeeItems(undefined, nextPage, miscFeeItemsPager.pageSize)
  }, [miscFeeItemsUrlPage])

  useEffect(() => {
    if (appliedMiscFeeAllocationsPageRef.current === miscFeeAllocationsUrlPage) return
    appliedMiscFeeAllocationsPageRef.current = miscFeeAllocationsUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'misc_allocations_page')
    miscFeeAllocationsPager.setPage(nextPage)
    void loadMiscFeeAllocations(nextPage, miscFeeAllocationsPager.pageSize)
  }, [miscFeeAllocationsUrlPage])

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
    miscFeeAllocationCategoryFilter,
    miscFeeAllocationForm,
    miscFeeAllocationSalesFilter,
    miscFeeAllocationSearch,
    miscFeeAllocationShipmentFilter,
    miscFeeAllocations,
    miscFeeAllocationsPagination: miscFeeAllocationsPager.pagination,
    miscFeeAllocationsTotal: miscFeeAllocationsPager.total,
    miscFeeItemCategoryFilter,
    miscFeeItemCodeError,
    miscFeeItemForm,
    miscFeeItemSearch,
    miscFeeItemStatusFilter,
    miscFeeItems,
    miscFeeItemsPagination: miscFeeItemsPager.pagination,
    miscFeeItemsTotal: miscFeeItemsPager.total,
    miscItemModalOpen,
    selectedMiscFeeItem,
    setMiscFeeAllocationCategoryFilter,
    setMiscFeeAllocationForm,
    setMiscFeeAllocationSalesFilter,
    setMiscFeeAllocationSearch,
    setMiscFeeAllocationShipmentFilter,
    setMiscFeeItemCategoryFilter,
    setMiscFeeItemCodeError,
    setMiscFeeItemForm,
    setMiscFeeItemSearch,
    setMiscFeeItemStatusFilter,
    setMiscFeeSummaryCategoryFilter,
    setMiscFeeSummaryShipmentFilter,
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
