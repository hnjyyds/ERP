import type { FormEvent } from 'react'
import { Button, Input } from 'antd'
import { ArrowLeft, LayoutDashboard, Search, Warehouse } from 'lucide-react'

import { PanelTitle } from '@/shared/ui'
import { formatDate, trimDecimal } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type { InboundOrder } from '@/api'

import {
  inboundOrderModeLabel,
  inboundOrderStatusLabel,
  inventoryDirectionLabel,
  stockStatusLabel,
} from '../inboundOrderHelpers'
import type { useInboundInventory } from '../hooks/useInboundInventory'

type Props = {
  order: InboundOrder | null
  inventory: ReturnType<typeof useInboundInventory>
  onRefreshInventory: (event: FormEvent<HTMLFormElement>) => void
  onBack: () => void
  onOpenCancel: () => void
}

export function InboundOrderDetailPanel({
  order,
  inventory,
  onRefreshInventory,
  onBack,
  onOpenCancel,
}: Props) {
  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle icon={<LayoutDashboard size={18} />} title={t('warehouse.inboundOrder.detail.title')} />
        <div className="toolbar-actions">
          {order && ['draft', 'submitted'].includes(order.status) ? (
            <Button danger onClick={onOpenCancel}>
              {t('warehouse.inboundOrder.action.cancel')}
            </Button>
          ) : null}
          <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
            {t('warehouse.inboundOrder.action.backToList')}
          </Button>
        </div>
      </div>
      {order ? (
        <>
          <dl className="detail-list">
            <div>
              <dt>{t('warehouse.inboundOrder.field.purchaseContract')}</dt>
              <dd>{order.purchase_contract_no}</dd>
            </div>
            <div>
              <dt>{t('warehouse.inboundOrder.field.supplier')}</dt>
              <dd>{order.supplier_name}</dd>
            </div>
            <div>
              <dt>{t('warehouse.inboundOrder.field.inboundMode')}</dt>
              <dd>{inboundOrderModeLabel(order.inbound_mode)}</dd>
            </div>
            <div>
              <dt>{t('warehouse.inboundOrder.list.statusFilter')}</dt>
              <dd>{inboundOrderStatusLabel(order.status)}</dd>
            </div>
            <div>
              <dt>{t('warehouse.inboundOrder.field.inboundAt')}</dt>
              <dd>{formatDate(order.inbound_at)}</dd>
            </div>
            <div>
              <dt>{t('warehouse.inboundOrder.field.location')}</dt>
              <dd>{order.warehouse_name} / {order.location_name}</dd>
            </div>
            {order.status === 'cancelled' ? (
              <>
                <div>
                  <dt>{t('warehouse.inboundOrder.detail.cancelledAt')}</dt>
                  <dd>{order.cancelled_at ? formatDate(order.cancelled_at) : '-'}</dd>
                </div>
                <div>
                  <dt>{t('warehouse.inboundOrder.detail.cancelledBy')}</dt>
                  <dd>{order.cancelled_by_name ?? '-'}</dd>
                </div>
                <div>
                  <dt>{t('warehouse.inboundOrder.detail.cancelReason')}</dt>
                  <dd>{order.cancel_reason ?? '-'}</dd>
                </div>
              </>
            ) : null}
          </dl>

          <div className="accessory-heading">
            <strong>{t('warehouse.inboundOrder.detail.linesTitle')}</strong>
            <span>
              {t('warehouse.inboundOrder.detail.lineCount', {
                count: order.lines.length,
              })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('warehouse.inboundOrder.field.product')}</th>
                <th>{t('warehouse.inboundOrder.field.specification')}</th>
                <th>{t('warehouse.inboundOrder.field.quantity')}</th>
                <th>{t('warehouse.inboundOrder.field.stockStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.product_code ?? '-'} {line.product_name}</td>
                  <td>{line.specification ?? line.model ?? t('common.notSet')}</td>
                  <td>{trimDecimal(line.quantity)} {line.unit}</td>
                  <td>{stockStatusLabel(line.stock_status)}</td>
                </tr>
              ))}
              {order.lines.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={4}>
                    {t('warehouse.inboundOrder.detail.noLines')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <form className="inline-filters inline-search inventory-search-form" onSubmit={onRefreshInventory}>
            <label>
              {t('warehouse.inboundOrder.detail.inventorySearchLabel')}
              <Input
                value={inventory.inventorySearch}
                placeholder={t('warehouse.inboundOrder.detail.inventorySearchPlaceholder')}
                onChange={(event) => inventory.setInventorySearch(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>
              {t('warehouse.inboundOrder.action.searchInventory')}
            </Button>
          </form>

          <div className="accessory-heading">
            <strong>{t('warehouse.inboundOrder.detail.balancesTitle')}</strong>
            <span>
              {t('warehouse.inboundOrder.detail.balanceCount', {
                count: inventory.inventoryBalances.length,
              })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('warehouse.inboundOrder.field.product')}</th>
                <th>{t('warehouse.inboundOrder.field.location')}</th>
                <th>{t('warehouse.inboundOrder.field.available')}</th>
                <th>{t('warehouse.inboundOrder.field.pendingInspection')}</th>
                <th>{t('warehouse.inboundOrder.field.locked')}</th>
              </tr>
            </thead>
            <tbody>
              {inventory.inventoryBalances.map((balance) => (
                <tr key={balance.id}>
                  <td>{balance.product_code ?? '-'} {balance.product_name}</td>
                  <td>{balance.warehouse_name} / {balance.location_name}</td>
                  <td>{trimDecimal(balance.available_quantity)} {balance.unit}</td>
                  <td>{trimDecimal(balance.pending_inspection_quantity)} {balance.unit}</td>
                  <td>{trimDecimal(balance.locked_quantity)} {balance.unit}</td>
                </tr>
              ))}
              {inventory.inventoryBalances.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={5}>
                    {t('warehouse.inboundOrder.detail.noBalances')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="accessory-heading">
            <strong>{t('warehouse.inboundOrder.detail.ledgersTitle')}</strong>
            <span>
              {t('warehouse.inboundOrder.detail.ledgerCount', {
                count: inventory.inventoryLedgers.length,
              })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('warehouse.inboundOrder.field.date')}</th>
                <th>{t('warehouse.inboundOrder.field.direction')}</th>
                <th>{t('warehouse.inboundOrder.field.product')}</th>
                <th>{t('warehouse.inboundOrder.field.quantity')}</th>
                <th>{t('warehouse.inboundOrder.field.source')}</th>
              </tr>
            </thead>
            <tbody>
              {inventory.inventoryLedgers.map((ledger) => (
                <tr key={ledger.id}>
                  <td>{formatDate(ledger.occurred_at)}</td>
                  <td>{inventoryDirectionLabel(ledger.direction)} / {stockStatusLabel(ledger.stock_status)}</td>
                  <td>{ledger.product_code ?? '-'} {ledger.product_name}</td>
                  <td>{trimDecimal(ledger.quantity)} {ledger.unit}</td>
                  <td>{ledger.source_code}</td>
                </tr>
              ))}
              {inventory.inventoryLedgers.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={5}>
                    {t('warehouse.inboundOrder.detail.noLedgers')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <Warehouse size={28} />
          <strong>{t('warehouse.inboundOrder.detail.emptyTitle')}</strong>
          <span>{t('warehouse.inboundOrder.detail.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
