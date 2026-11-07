import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createMiscFeeAllocation,
  createMiscFeeItem,
  listMiscFeeAllocationSummary,
  listMiscFeeAllocations,
  listMiscFeeItems,
  type MiscFeeAllocation,
  type MiscFeeItem,
} from '../../../../api'
import { showError } from '../../../../shared/errors'
import { t } from '../../../appI18n'
import {
  MiscFeeItemFormState,
  MiscFeeAllocationFormState,
  initialMiscFeeItemForm,
  initialMiscFeeAllocationForm,
  miscFeeItemPayload,
  miscFeeAllocationPayload,
} from '../financeHelpers'

import type { FinanceModuleEnv } from '../financePageTypes'

export function useMiscModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, setMessage, setError, loadOverview } = env

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

  async function loadMiscFeeItems(preferredId?: string) {
    setLoadingMiscFeeItems(true)
    setError('')
    try {
      const result = await listMiscFeeItems({
        q: miscFeeItemSearch.trim() || undefined,
        category: miscFeeItemCategoryFilter || undefined,
        status: miscFeeItemStatusFilter || undefined,
      })
      setMiscFeeItems(result.items)
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

  async function loadMiscFeeAllocations() {
    setLoadingMiscFeeAllocations(true)
    setError('')
    try {
      const result = await listMiscFeeAllocations({
        q: miscFeeAllocationSearch.trim() || undefined,
        category: miscFeeAllocationCategoryFilter || undefined,
        shipment_no: miscFeeAllocationShipmentFilter.trim() || undefined,
        sales_user_id: miscFeeAllocationSalesFilter.trim() || undefined,
      })
      setMiscFeeAllocations(result.items)
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
    miscFeeItemCategoryFilter,
    miscFeeItemCodeError,
    miscFeeItemForm,
    miscFeeItemSearch,
    miscFeeItemStatusFilter,
    miscFeeItems,
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
