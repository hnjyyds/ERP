import type { FormEvent } from 'react'
import { useState } from 'react'

import {
  listInventoryBalances,
  listInventoryLedgers,
  type InventoryBalance,
  type InventoryBalanceSummary,
  type InventoryLedger,
  type OutboundOrder,
} from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'

export function useOutboundInventory() {
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([])
  const [inventoryLedgers, setInventoryLedgers] = useState<InventoryLedger[]>([])
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventorySummary, setInventorySummary] = useState<InventoryBalanceSummary>({
    available_quantity: '0',
    pending_inspection_quantity: '0',
  })

  async function loadInventorySnapshotForOrder(
    order: OutboundOrder | null,
    inventoryQuery?: string,
  ) {
    const query =
      inventoryQuery ??
      (inventorySearch.trim() ||
        order?.lines[0]?.product_code ||
        order?.lines[0]?.product_name ||
        undefined)
    const [balances, ledgers] = await Promise.all([
      listInventoryBalances({ q: query, limit: 50 }),
      listInventoryLedgers({
        q: query,
        source_id: order?.id,
      }),
    ])
    setInventoryBalances(balances.items)
    setInventorySummary(balances.summary)
    setInventoryLedgers(ledgers.items)
  }

  async function refreshInventorySnapshot(
    event: FormEvent<HTMLFormElement> | undefined,
    order: OutboundOrder | null,
  ) {
    event?.preventDefault()
    try {
      await loadInventorySnapshotForOrder(order)
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.message.inventoryLoadFailed'))
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
