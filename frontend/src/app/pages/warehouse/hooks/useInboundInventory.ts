import type { FormEvent } from 'react'
import { useState } from 'react'

import {
  listInventoryBalances,
  listInventoryLedgers,
  type InboundOrder,
  type InventoryBalance,
  type InventoryLedger,
} from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'

import { initialInventorySummary } from '../inboundOrderHelpers'

export function useInboundInventory() {
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([])
  const [inventoryLedgers, setInventoryLedgers] = useState<InventoryLedger[]>([])
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventorySummary, setInventorySummary] = useState(initialInventorySummary)

  async function loadInventorySnapshotForOrder(
    order: InboundOrder | null,
    inventoryQuery?: string,
    fallbackSearch?: string,
  ) {
    const query =
      inventoryQuery ??
      (inventorySearch.trim() ||
        (fallbackSearch ?? '').trim() ||
        order?.lines[0]?.product_code ||
        order?.lines[0]?.product_name ||
        undefined)
    const [balances, ledgers] = await Promise.all([
      listInventoryBalances({ q: query }),
      listInventoryLedgers({
        q: query,
        source_id: order?.id,
      }),
    ])
    setInventoryBalances(balances.items)
    setInventoryLedgers(ledgers.items)
  }

  async function refreshInventorySnapshot(
    event: FormEvent<HTMLFormElement> | undefined,
    order: InboundOrder | null,
    fallbackSearch?: string,
  ) {
    event?.preventDefault()
    try {
      await loadInventorySnapshotForOrder(order, undefined, fallbackSearch)
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.inventoryLoadFailed'))
    }
  }

  return {
    inventoryBalances,
    inventoryLedgers,
    inventorySearch,
    setInventorySearch,
    inventorySummary,
    setInventorySummary,
    loadInventorySnapshotForOrder,
    refreshInventorySnapshot,
  }
}
