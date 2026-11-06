import { useState } from 'react'
import { getFinanceOverview, type FinanceOverview } from '../../../../api'
import { showError } from '../../../../shared/errors'
import { t } from '../../../appI18n'

import type { FinanceModuleEnv } from '../financePageTypes'

export function useFinanceOverviewModule(env: Pick<FinanceModuleEnv, 'setError'>) {
  const { setError } = env

  const [overview, setOverview] = useState<FinanceOverview | null>(null)

  const [loading, setLoading] = useState(false)

  async function loadOverview() {
    setLoading(true)
    setError('')
    try {
      setOverview(await getFinanceOverview())
    } catch (caught) {
      showError(caught, t('finance.overview.message.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const summary = overview?.summary

  const currencyLabel = summary?.currency_label ?? '-'

  const profitAmount = Number(summary?.profit_amount ?? 0)

  return {
    currencyLabel,
    loadOverview,
    loading,
    overview,
    profitAmount,
    summary,
  }
}

export type FinanceOverviewModel = ReturnType<typeof useFinanceOverviewModule>
