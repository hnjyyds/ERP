import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addManualProfitCost,
  createFinancialSettlement,
  listFinancialSettlements,
  listProfitCalculations,
  type FinancialSettlement,
} from '@/api'
import { showError } from '@/shared/errors'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { t } from '@/app/appI18n'
import {
  FinancialSettlementFormState,
  ManualProfitCostFormState,
  initialFinancialSettlementForm,
  initialManualProfitCostForm,
  financialSettlementPayload,
  manualProfitCostPayload,
} from '@/app/pages/finance/financeHelpers'

import type { FinanceModuleEnv } from '@/app/pages/finance/financePageTypes'

export function useSettlementModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, setMessage, setError, loadOverview } = env

  const urlQuery = useUrlQuery()

  const [financialSettlements, setFinancialSettlements] = useState<FinancialSettlement[]>([])

  const [profitCalculations, setProfitCalculations] = useState<FinancialSettlement[]>([])

  const settlementsPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'settlements_page'),
  )

  const profitsPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'profits_page'),
  )

  const [totalSettlementSalesIncome, setTotalSettlementSalesIncome] = useState('0.00')

  const [totalSettlementGrossProfit, setTotalSettlementGrossProfit] = useState('0.00')

  const [totalProfitCalculationGrossProfit, setTotalProfitCalculationGrossProfit] =
    useState('0.00')

  const settlementsUrlPage = urlQuery.params.get('settlements_page') ?? ''

  const appliedSettlementsPageRef = useRef(settlementsUrlPage)

  const profitsUrlPage = urlQuery.params.get('profits_page') ?? ''

  const appliedProfitsPageRef = useRef(profitsUrlPage)

  const [selectedFinancialSettlementId, setSelectedFinancialSettlementId] = useState<string | null>(
    null,
  )

  const [settlementSearch, setSettlementSearch] = useState('')

  const [settlementShipmentFilter, setSettlementShipmentFilter] = useState('')

  const [profitCalculationSearch, setProfitCalculationSearch] = useState('')

  const [profitCalculationShipmentFilter, setProfitCalculationShipmentFilter] = useState('')

  const [settlementForm, setSettlementForm] = useState<FinancialSettlementFormState>(() =>
    initialFinancialSettlementForm(),
  )

  const [manualProfitCostForm, setManualProfitCostForm] = useState<ManualProfitCostFormState>(() =>
    initialManualProfitCostForm(),
  )

  const [loadingFinancialSettlements, setLoadingFinancialSettlements] = useState(false)

  const [loadingProfitCalculations, setLoadingProfitCalculations] = useState(false)

  const [settlementModalOpen, setSettlementModalOpen] = useState(false)

  const [submittingSettlement, setSubmittingSettlement] = useState(false)

  const [submittingManualProfitCost, setSubmittingManualProfitCost] = useState(false)

  const selectedFinancialSettlement = useMemo(
    () =>
      financialSettlements.find((item) => item.id === selectedFinancialSettlementId) ??
      financialSettlements[0] ??
      null,
    [financialSettlements, selectedFinancialSettlementId],
  )

  useEffect(() => {
    if (!selectedFinancialSettlement) return
    setManualProfitCostForm((current) => ({
      ...current,
      currency: selectedFinancialSettlement.currency,
      cost_date: selectedFinancialSettlement.settlement_date,
    }))
  }, [
    selectedFinancialSettlement?.id,
    selectedFinancialSettlement?.currency,
    selectedFinancialSettlement?.settlement_date,
  ])

  async function loadFinancialSettlements(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
  ) {
    setLoadingFinancialSettlements(true)
    setError('')
    try {
      const page = pageOverride ?? settlementsPager.page
      const pageSize = pageSizeOverride ?? settlementsPager.pageSize
      const result = await listFinancialSettlements({
        q: settlementSearch.trim() || undefined,
        status: 'locked',
        shipment_no: settlementShipmentFilter.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setFinancialSettlements(result.items)
      settlementsPager.setTotal(result.total)
      setTotalSettlementSalesIncome(result.total_sales_income)
      setTotalSettlementGrossProfit(result.total_gross_profit)
      const nextSettlementId =
        preferredId ??
        (activeModule === 'settlement' && result.items.some((item) => item.id === detailId)
          ? detailId
          : null) ??
        (result.items.some((item) => item.id === selectedFinancialSettlementId)
          ? selectedFinancialSettlementId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedFinancialSettlementId(nextSettlementId)
    } catch (caught) {
      showError(caught, t('finance.settlement.message.loadSettlementsFailed'))
    } finally {
      setLoadingFinancialSettlements(false)
    }
  }

  async function loadProfitCalculations(pageOverride?: number, pageSizeOverride?: number) {
    setLoadingProfitCalculations(true)
    setError('')
    try {
      const page = pageOverride ?? profitsPager.page
      const pageSize = pageSizeOverride ?? profitsPager.pageSize
      const result = await listProfitCalculations({
        q: profitCalculationSearch.trim() || undefined,
        shipment_no: profitCalculationShipmentFilter.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setProfitCalculations(result.items)
      profitsPager.setTotal(result.total)
      setTotalProfitCalculationGrossProfit(result.total_gross_profit)
    } catch (caught) {
      showError(caught, t('finance.settlement.message.loadProfitFailed'))
    } finally {
      setLoadingProfitCalculations(false)
    }
  }

  async function submitFinancialSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingSettlement(true)
    setMessage('')
    setError('')
    try {
      const created = await createFinancialSettlement(financialSettlementPayload(settlementForm))
      setMessage(t('finance.settlement.message.settlementLocked', { code: created.settlement_no }))
      setSettlementForm(initialFinancialSettlementForm())
      await loadFinancialSettlements(created.id)
      await loadProfitCalculations()
      await loadOverview()
    } catch (caught) {
      showError(caught, t('finance.settlement.message.settlementLockFailed'))
    } finally {
      setSubmittingSettlement(false)
    }
  }

  async function submitManualProfitCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedFinancialSettlement) return
    setSubmittingManualProfitCost(true)
    setMessage('')
    setError('')
    try {
      const updated = await addManualProfitCost(
        selectedFinancialSettlement.id,
        manualProfitCostPayload(manualProfitCostForm),
      )
      const manualCostNo =
        updated.cost_items.filter((item) => item.source_type === 'manual_cost').at(-1)?.cost_no ??
        updated.settlement_no
      setMessage(t('finance.settlement.message.manualCostLinked', { code: manualCostNo }))
      setManualProfitCostForm(
        initialManualProfitCostForm(updated.currency, updated.settlement_date),
      )
      await loadFinancialSettlements(updated.id)
      await loadProfitCalculations()
    } catch (caught) {
      showError(caught, t('finance.settlement.message.manualCostLinkFailed'))
    } finally {
      setSubmittingManualProfitCost(false)
    }
  }

  async function changeFinancialSettlementsPage(nextPage: number, nextPageSize: number) {
    const next = settlementsPager.changePage(nextPage, nextPageSize)
    appliedSettlementsPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ settlements_page: next.page === 1 ? null : next.page })
    await loadFinancialSettlements(undefined, next.page, next.pageSize)
  }

  async function changeProfitCalculationsPage(nextPage: number, nextPageSize: number) {
    const next = profitsPager.changePage(nextPage, nextPageSize)
    appliedProfitsPageRef.current = next.page === 1 ? '' : String(next.page)
    urlQuery.update({ profits_page: next.page === 1 ? null : next.page })
    await loadProfitCalculations(next.page, next.pageSize)
  }

  useEffect(() => {
    if (appliedSettlementsPageRef.current === settlementsUrlPage) return
    appliedSettlementsPageRef.current = settlementsUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'settlements_page')
    settlementsPager.setPage(nextPage)
    void loadFinancialSettlements(undefined, nextPage, settlementsPager.pageSize)
  }, [settlementsUrlPage])

  useEffect(() => {
    if (appliedProfitsPageRef.current === profitsUrlPage) return
    appliedProfitsPageRef.current = profitsUrlPage
    const nextPage = parsePageParam(urlQuery.params, 'profits_page')
    profitsPager.setPage(nextPage)
    void loadProfitCalculations(nextPage, profitsPager.pageSize)
  }, [profitsUrlPage])

  return {
    changeFinancialSettlementsPage,
    changeProfitCalculationsPage,
    financialSettlements,
    financialSettlementsPagination: settlementsPager.pagination,
    financialSettlementsTotal: settlementsPager.total,
    loadFinancialSettlements,
    loadProfitCalculations,
    loadingFinancialSettlements,
    loadingProfitCalculations,
    manualProfitCostForm,
    profitCalculationSearch,
    profitCalculationShipmentFilter,
    profitCalculations,
    profitCalculationsPagination: profitsPager.pagination,
    profitCalculationsTotal: profitsPager.total,
    selectedFinancialSettlement,
    setManualProfitCostForm,
    setProfitCalculationSearch,
    setProfitCalculationShipmentFilter,
    setSelectedFinancialSettlementId,
    setSettlementForm,
    setSettlementModalOpen,
    setSettlementSearch,
    setSettlementShipmentFilter,
    settlementForm,
    settlementModalOpen,
    settlementSearch,
    settlementShipmentFilter,
    submitFinancialSettlement,
    submitManualProfitCost,
    submittingManualProfitCost,
    submittingSettlement,
    totalProfitCalculationGrossProfit,
    totalSettlementGrossProfit,
    totalSettlementSalesIncome,
  }
}

export type SettlementModel = ReturnType<typeof useSettlementModule>
