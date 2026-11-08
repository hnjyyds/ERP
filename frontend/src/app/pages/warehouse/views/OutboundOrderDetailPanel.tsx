import { Button, Input } from 'antd'
import { ArrowLeft, LayoutDashboard, Package, Search } from 'lucide-react'
import type { FormEvent } from 'react'

import { PanelTitle } from '@/shared/ui'
import { formatDate, trimDecimal } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type { OutboundOrder } from '@/api'

import {
  inventoryDirectionLabel,
  outboundOrderModeLabel,
  outboundOrderStatusLabel,
  outboundPlanSourceTypeLabel,
  stockStatusLabel,
} from '../outboundOrderHelpers'
import type { useOutboundInventory } from '../hooks/useOutboundInventory'

type Props = {
  order: OutboundOrder | null
  inventory: ReturnType<typeof useOutboundInventory>
  onRefreshInventory: (event: FormEvent<HTMLFormElement>) => void
  onBack: () => void
  onOpenCancel: () => void
}

export function OutboundOrderDetailPanel({
  order,
  inventory,
  onRefreshInventory,
  onBack,
  onOpenCancel,
}: Props) {
  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle
          icon={<LayoutDashboard size={18} />}
          title={t('warehouse.outboundOrder.detail.title')}
        />
        <div className="toolbar-actions">
          {order && ['draft', 'submitted'].includes(order.status) ? (
            <Button danger onClick={onOpenCancel}>
              {t('warehouse.outboundOrder.action.cancel')}
            </Button>
          ) : null}
          <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
            {t('warehouse.outboundOrder.action.backToList')}
          </Button>
        </div>
      </div>
      {order ? (
        <>
          <dl className="detail-list">
            <div>
              <dt>{t('warehouse.outboundOrder.field.sourceDocument')}</dt>
              <dd>
                {outboundPlanSourceTypeLabel(order.source_type)} / {order.source_code}
              </dd>
            </div>
            <div>
              <dt>{t('warehouse.outboundOrder.field.customer')}</dt>
              <dd>{order.customer_name ?? t('warehouse.outboundOrder.detail.customerNotSet')}</dd>
            </div>
            <div>
              <dt>{t('warehouse.outboundOrder.field.outboundMode')}</dt>
              <dd>{outboundOrderModeLabel(order.outbound_mode)}</dd>
            </div>
            <div>
              <dt>{t('warehouse.outboundOrder.field.status')}</dt>
              <dd>{outboundOrderStatusLabel(order.status)}</dd>
            </div>
            <div>
              <dt>{t('warehouse.outboundOrder.field.outboundAt')}</dt>
              <dd>{formatDate(order.outbound_at)}</dd>
            </div>
            <div>
              <dt>{t('warehouse.outboundOrder.field.location')}</dt>
              <dd>
                {order.warehouse_name} / {order.location_name}
              </dd>
            </div>
            {order.status === 'cancelled' ? (
              <>
                <div>
                  <dt>{t('warehouse.outboundOrder.detail.cancelledAt')}</dt>
                  <dd>{order.cancelled_at ? formatDate(order.cancelled_at) : '-'}</dd>
                </div>
                <div>
                  <dt>{t('warehouse.outboundOrder.detail.cancelledBy')}</dt>
                  <dd>{order.cancelled_by_name ?? '-'}</dd>
                </div>
                <div>
                  <dt>{t('warehouse.outboundOrder.detail.cancelReason')}</dt>
                  <dd>{order.cancel_reason ?? '-'}</dd>
                </div>
              </>
            ) : null}
          </dl>

          <div className="accessory-heading">
            <strong>{t('warehouse.outboundOrder.detail.linesTitle')}</strong>
            <span>{t('warehouse.outboundOrder.detail.lineCount', { count: order.lines.length })}</span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('warehouse.outboundOrder.field.product')}</th>
                <th>{t('warehouse.outboundOrder.field.specification')}</th>
                <th>{t('warehouse.outboundOrder.field.quantity')}</th>
                <th>{t('warehouse.outboundOrder.field.stockStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    {line.product_code ?? '-'} {line.product_name}
                  </td>
                  <td>{line.specification ?? line.model ?? t('warehouse.outboundOrder.detail.notSet')}</td>
                  <td>
                    {trimDecimal(line.quantity)} {line.unit}
                  </td>
                  <td>{stockStatusLabel(line.stock_status)}</td>
                </tr>
              ))}
              {order.lines.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={4}>
                    {t('warehouse.outboundOrder.detail.noLines')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <form
            className="inline-filters inline-search inventory-search-form"
            onSubmit={onRefreshInventory}
          >
            <label>
              {t('warehouse.outboundOrder.detail.inventorySearchLabel')}
              <Input
                value={inventory.inventorySearch}
                placeholder={t('warehouse.outboundOrder.detail.inventorySearchPlaceholder')}
                onChange={(event) => inventory.setInventorySearch(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>
              {t('warehouse.outboundOrder.action.searchInventory')}
            </Button>
          </form>

          <div className="accessory-heading">
            <strong>{t('warehouse.outboundOrder.detail.balancesTitle')}</strong>
            <span>
              {t('warehouse.outboundOrder.detail.balanceCount', {
                count: inventory.inventoryBalances.length,
              })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('warehouse.outboundOrder.field.product')}</th>
                <th>{t('warehouse.outboundOrder.field.location')}</th>
                <th>{t('warehouse.outboundOrder.field.available')}</th>
                <th>{t('warehouse.outboundOrder.field.pendingInspection')}</th>
                <th>{t('warehouse.outboundOrder.field.locked')}</th>
              </tr>
            </thead>
            <tbody>
              {inventory.inventoryBalances.map((balance) => (
                <tr key={balance.id}>
                  <td>
                    {balance.product_code ?? '-'} {balance.product_name}
                  </td>
                  <td>
                    {balance.warehouse_name} / {balance.location_name}
                  </td>
                  <td>
                    {trimDecimal(balance.available_quantity)} {balance.unit}
                  </td>
                  <td>
                    {trimDecimal(balance.pending_inspection_quantity)} {balance.unit}
                  </td>
                  <td>
                    {trimDecimal(balance.locked_quantity)} {balance.unit}
                  </td>
                </tr>
              ))}
              {inventory.inventoryBalances.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={5}>
                    {t('warehouse.outboundOrder.detail.noBalances')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="accessory-heading">
            <strong>{t('warehouse.outboundOrder.detail.ledgersTitle')}</strong>
            <span>
              {t('warehouse.outboundOrder.detail.ledgerCount', {
                count: inventory.inventoryLedgers.length,
              })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('warehouse.outboundOrder.field.date')}</th>
                <th>{t('warehouse.outboundOrder.field.direction')}</th>
                <th>{t('warehouse.outboundOrder.field.product')}</th>
                <th>{t('warehouse.outboundOrder.field.quantity')}</th>
                <th>{t('warehouse.outboundOrder.field.source')}</th>
              </tr>
            </thead>
            <tbody>
              {inventory.inventoryLedgers.map((ledger) => (
                <tr key={ledger.id}>
                  <td>{formatDate(ledger.occurred_at)}</td>
                  <td>
                    {inventoryDirectionLabel(ledger.direction)} /{' '}
                    {stockStatusLabel(ledger.stock_status)}
                  </td>
                  <td>
                    {ledger.product_code ?? '-'} {ledger.product_name}
                  </td>
                  <td>
                    {trimDecimal(ledger.quantity)} {ledger.unit}
                  </td>
                  <td>{ledger.source_code}</td>
                </tr>
              ))}
              {inventory.inventoryLedgers.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={5}>
                    {t('warehouse.outboundOrder.detail.noLedgers')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <Package size={28} />
          <strong>{t('warehouse.outboundOrder.detail.emptyTitle')}</strong>
          <span>{t('warehouse.outboundOrder.detail.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
