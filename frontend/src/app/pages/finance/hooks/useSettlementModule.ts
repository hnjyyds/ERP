import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  addManualProfitCost,
  createFinancialSettlement,
  listFinancialSettlements,
  listProfitCalculations,
  type FinancialSettlement,
} from '../../../../api'
import { showError } from '../../../../shared/errors'
import { t } from '../../../appI18n'
import {
  FinancialSettlementFormState,
  ManualProfitCostFormState,
  initialFinancialSettlementForm,
  initialManualProfitCostForm,
  financialSettlementPayload,
  manualProfitCostPayload,
} from '../financeHelpers'

import type { FinanceModuleEnv } from '../financePageTypes'

export function useSettlementModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, setMessage, setError, loadOverview } = env

  const [financialSettlements, setFinancialSettlements] = useState<FinancialSettlement[]>([])

  const [profitCalculations, setProfitCalculations] = useState<FinancialSettlement[]>([])

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

  async function loadFinancialSettlements(preferredId?: string) {
    setLoadingFinancialSettlements(true)
    setError('')
    try {
      const result = await listFinancialSettlements({
        q: settlementSearch.trim() || undefined,
        status: 'locked',
        shipment_no: settlementShipmentFilter.trim() || undefined,
      })
      setFinancialSettlements(result.items)
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

  async function loadProfitCalculations() {
    setLoadingProfitCalculations(true)
    setError('')
    try {
      const result = await listProfitCalculations({
        q: profitCalculationSearch.trim() || undefined,
        shipment_no: profitCalculationShipmentFilter.trim() || undefined,
      })
      setProfitCalculations(result.items)
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

  const totalSettlementSalesIncome = financialSettlements.reduce(
    (sum, item) => sum + Number(item.sales_income || 0),
    0,
  )

  const totalSettlementGrossProfit = financialSettlements.reduce(
    (sum, item) => sum + Number(item.gross_profit || 0),
    0,
  )

  const totalProfitCalculationGrossProfit = profitCalculations.reduce(
    (sum, item) => sum + Number(item.gross_profit || 0),
    0,
  )

  return {
    financialSettlements,
    loadFinancialSettlements,
    loadProfitCalculations,
    loadingFinancialSettlements,
    loadingProfitCalculations,
    manualProfitCostForm,
    profitCalculationSearch,
    profitCalculationShipmentFilter,
    profitCalculations,
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
