import { useEffect, useState } from 'react'

import { getExportQuotationHistory, type ExportContract, type ExportQuotation } from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'

type Options = {
  detailId: string | null
  contract: ExportContract | null
}

/** 详情页的客户历史报价。 */
export function useExportContractHistory({ detailId, contract }: Options) {
  const [history, setHistory] = useState<ExportQuotation[]>([])

  async function loadSelectedContractHistory(current: ExportContract | null) {
    const line = current?.lines[0]
    if (!current) {
      setHistory([])
      return
    }
    try {
      const result = await getExportQuotationHistory({
        customer_id: current.customer_id ?? undefined,
        product_id: line?.product_id ?? undefined,
      })
      setHistory(result.items)
    } catch (caught) {
      showError(caught, t('sales.contract.detail.historyLoadFailed'))
    }
  }

  useEffect(() => {
    if (!detailId) {
      setHistory([])
      return
    }
    void loadSelectedContractHistory(contract)
  }, [detailId, contract?.id, contract?.approval_status, contract?.signature_status])

  return { history }
}

export type ExportContractHistoryModel = ReturnType<typeof useExportContractHistory>
