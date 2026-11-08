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

type SettlementFilters = { q: string; shipment: string }

type ProfitFilters = { q: string; shipment: string }

function settlementFiltersFromParams(params: URLSearchParams): SettlementFilters {
  return {
    q: params.get('settlements_q') ?? '',
    shipment: params.get('settlements_shipment') ?? '',
  }
}

function profitFiltersFromParams(params: URLSearchParams): ProfitFilters {
  return {
    q: params.get('profits_q') ?? '',
    shipment: params.get('profits_shipment') ?? '',
  }
}

function settlementSignature(params: URLSearchParams): string {
  return JSON.stringify([
    parsePageParam(params, 'settlements_page'),
    settlementFiltersFromParams(params),
  ])
}

function profitSignature(params: URLSearchParams): string {
  return JSON.stringify([parsePageParam(params, 'profits_page'), profitFiltersFromParams(params)])
}

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

  const [settlementFilters, setSettlementFilters] = useState(() =>
    settlementFiltersFromParams(urlQuery.params),
  )

  const appliedSettlementSignatureRef = useRef(settlementSignature(urlQuery.params))

  const [profitFilters, setProfitFilters] = useState(() => profitFiltersFromParams(urlQuery.params))

  const appliedProfitSignatureRef = useRef(profitSignature(urlQuery.params))

  const [selectedFinancialSettlementId, setSelectedFinancialSettlementId] = useState<string | null>(
    null,
  )

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
    filtersOverride?: SettlementFilters,
  ) {
    setLoadingFinancialSettlements(true)
    setError('')
    try {
      const filters = filtersOverride ?? settlementFilters
      const page = pageOverride ?? settlementsPager.page
      const pageSize = pageSizeOverride ?? settlementsPager.pageSize
      const result = await listFinancialSettlements({
        q: filters.q.trim() || undefined,
        status: 'locked',
        shipment_no: filters.shipment.trim() || undefined,
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

  async function loadProfitCalculations(
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: ProfitFilters,
  ) {
    setLoadingProfitCalculations(true)
    setError('')
    try {
      const filters = filtersOverride ?? profitFilters
      const page = pageOverride ?? profitsPager.page
      const pageSize = pageSizeOverride ?? profitsPager.pageSize
      const result = await listProfitCalculations({
        q: filters.q.trim() || undefined,
        shipment_no: filters.shipment.trim() || undefined,
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
    const nextSearch = urlQuery.update({
      settlements_page: next.page === 1 ? null : next.page,
      settlements_q: settlementFilters.q,
      settlements_shipment: settlementFilters.shipment,
    })
    appliedSettlementSignatureRef.current = settlementSignature(new URLSearchParams(nextSearch))
    await loadFinancialSettlements(undefined, next.page, next.pageSize, settlementFilters)
  }

  async function changeProfitCalculationsPage(nextPage: number, nextPageSize: number) {
    const next = profitsPager.changePage(nextPage, nextPageSize)
    const nextSearch = urlQuery.update({
      profits_page: next.page === 1 ? null : next.page,
      profits_q: profitFilters.q,
      profits_shipment: profitFilters.shipment,
    })
    appliedProfitSignatureRef.current = profitSignature(new URLSearchParams(nextSearch))
    await loadProfitCalculations(next.page, next.pageSize, profitFilters)
  }

  useEffect(() => {
    const signature = settlementSignature(urlQuery.params)
    if (appliedSettlementSignatureRef.current === signature) return
    appliedSettlementSignatureRef.current = signature
    const filters = settlementFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'settlements_page')
    setSettlementFilters(filters)
    settlementsPager.setPage(nextPage)
    void loadFinancialSettlements(undefined, nextPage, settlementsPager.pageSize, filters)
  }, [urlQuery.search])

  useEffect(() => {
    const signature = profitSignature(urlQuery.params)
    if (appliedProfitSignatureRef.current === signature) return
    appliedProfitSignatureRef.current = signature
    const filters = profitFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'profits_page')
    setProfitFilters(filters)
    profitsPager.setPage(nextPage)
    void loadProfitCalculations(nextPage, profitsPager.pageSize, filters)
  }, [urlQuery.search])

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
    profitCalculationSearch: profitFilters.q,
    profitCalculationShipmentFilter: profitFilters.shipment,
    profitCalculations,
    profitCalculationsPagination: profitsPager.pagination,
    profitCalculationsTotal: profitsPager.total,
    selectedFinancialSettlement,
    setManualProfitCostForm,
    setProfitCalculationSearch: (value: string) =>
      setProfitFilters((current) => ({ ...current, q: value })),
    setProfitCalculationShipmentFilter: (value: string) =>
      setProfitFilters((current) => ({ ...current, shipment: value })),
    setSelectedFinancialSettlementId,
    setSettlementForm,
    setSettlementModalOpen,
    setSettlementSearch: (value: string) =>
      setSettlementFilters((current) => ({ ...current, q: value })),
    setSettlementShipmentFilter: (value: string) =>
      setSettlementFilters((current) => ({ ...current, shipment: value })),
    settlementForm,
    settlementModalOpen,
    settlementSearch: settlementFilters.q,
    settlementShipmentFilter: settlementFilters.shipment,
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
