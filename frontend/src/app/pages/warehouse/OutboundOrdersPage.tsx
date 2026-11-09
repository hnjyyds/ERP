import { Alert } from 'antd'

import type { CurrentUser } from '@/api'
import { Metric } from '@/shared/ui'
import type { RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { warehouseOutboundOrderPath } from '@/app/routes'
import { t } from '@/app/appI18n'

import { useOutboundInventory } from './hooks/useOutboundInventory'
import { useOutboundOrderWorkflow } from './hooks/useOutboundOrderWorkflow'
import { useOutboundOrdersList } from './hooks/useOutboundOrdersList'
import { OutboundOrderCancelModal } from './views/OutboundOrderCancelModal'
import { OutboundOrderDetailPanel } from './views/OutboundOrderDetailPanel'
import { OutboundOrderListPanel } from './views/OutboundOrderListPanel'
import { OutboundOrderWorkflowModal } from './views/OutboundOrderWorkflowModal'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function OutboundOrdersPage({ currentUser, detailId, onNavigate }: Props) {
  const inventory = useOutboundInventory()
  const list = useOutboundOrdersList({
    detailId,
    onNavigate,
    setInventorySearch: inventory.setInventorySearch,
    loadInventorySnapshotForOrder: inventory.loadInventorySnapshotForOrder,
  })
  const workflow = useOutboundOrderWorkflow({
    currentUser,
    selectedOrder: list.selectedOrder,
    outboundPlans: list.outboundPlans,
    onGenerated: list.applyGeneratedOrder,
    onSubmitted: list.applySubmittedOrder,
    onApproved: list.applyApprovedOrder,
    onSaved: list.applyCancelledOrder,
  })

  const draftCount = list.summary.draft_count
  const submittedCount = list.summary.submitted_count
  const approvedCount = list.summary.approved_count
  const outboundQuantity = Number(list.summary.outbound_quantity || 0)
  const availableQuantity = Number(inventory.inventorySummary.available_quantity || 0)

  return (
    <section className="outbound-order-page">
      <div className="summary-strip" aria-label={t('warehouse.outboundOrder.metric.overviewAria')}>
        <Metric label={t('warehouse.outboundOrder.metric.orderCount')} value={list.total} />
        <Metric label={t('warehouse.outboundOrder.metric.draftCount')} value={draftCount} />
        <Metric
          label={t('warehouse.outboundOrder.metric.submittedCount')}
          value={submittedCount}
          intent={submittedCount > 0 ? 'warning' : 'normal'}
        />
        <Metric label={t('warehouse.outboundOrder.metric.approvedCount')} value={approvedCount} />
        <Metric
          label={t('warehouse.outboundOrder.metric.outboundQuantity')}
          value={outboundQuantity.toFixed(2)}
        />
        <Metric
          label={t('warehouse.outboundOrder.metric.availableQuantity')}
          value={availableQuantity.toFixed(2)}
        />
      </div>

      {workflow.message ? (
        <Alert className="workspace-alert" title={workflow.message} type="success" showIcon />
      ) : null}

      <section className="business-grid outbound-order-grid">
        {!detailId ? (
          <OutboundOrderListPanel model={list} onOpenModal={workflow.openOutboundOrderModal} />
        ) : null}

        <OutboundOrderWorkflowModal
          workflow={workflow}
          outboundPlans={list.outboundPlans}
          selectedOrder={list.selectedOrder}
          currentUser={currentUser}
        />

        {detailId ? (
          <OutboundOrderDetailPanel
            order={list.selectedOrder}
            inventory={inventory}
            onRefreshInventory={(event) =>
              void inventory.refreshInventorySnapshot(event, list.selectedOrder)
            }
            onBack={() => onNavigate(warehouseOutboundOrderPath)}
            onOpenCancel={workflow.openCancelModal}
          />
        ) : null}
      </section>

      <OutboundOrderCancelModal
        open={workflow.cancelModalOpen}
        submitting={workflow.cancelSubmitting}
        reason={workflow.cancelReason}
        reasonError={workflow.cancelReasonError}
        onReasonChange={workflow.changeCancelReason}
        onClose={workflow.closeCancelModal}
        onSubmit={(event) => void workflow.cancelSelectedOutboundOrder(event)}
      />
    </section>
  )
}
