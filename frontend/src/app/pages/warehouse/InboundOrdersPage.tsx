import { Alert } from 'antd'

import type { CurrentUser } from '@/api'
import { Metric } from '@/shared/ui'
import type { RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { warehouseInboundOrderPath } from '@/app/routes'
import { t } from '@/app/appI18n'

import { useInboundInventory } from './hooks/useInboundInventory'
import { useInboundOrderWorkflow } from './hooks/useInboundOrderWorkflow'
import { useInboundOrdersList } from './hooks/useInboundOrdersList'
import { InboundOrderCancelModal } from './views/InboundOrderCancelModal'
import { InboundOrderDetailPanel } from './views/InboundOrderDetailPanel'
import { InboundOrderListPanel } from './views/InboundOrderListPanel'
import { InboundOrderWorkflowModal } from './views/InboundOrderWorkflowModal'

type InboundOrdersPageProps = RoutedDetailPageProps & {
  currentUser: CurrentUser
}

export function InboundOrdersPage({ currentUser, detailId, onNavigate }: InboundOrdersPageProps) {
  const inventory = useInboundInventory()
  const list = useInboundOrdersList({
    detailId,
    onNavigate,
    inventorySearch: inventory.inventorySearch,
    setInventorySearch: inventory.setInventorySearch,
    setInventorySummary: inventory.setInventorySummary,
    loadInventorySnapshotForOrder: inventory.loadInventorySnapshotForOrder,
  })
  const workflow = useInboundOrderWorkflow({
    currentUser,
    selectedOrder: list.selectedOrder,
    inboundPlans: list.inboundPlans,
    onGenerated: list.applyGeneratedOrder,
    onSubmitted: list.applySubmittedOrder,
    onApproved: list.applyApprovedOrder,
    onSaved: list.applySavedOrder,
  })

  const draftCount = list.statusSummary.draft_count
  const submittedCount = list.statusSummary.submitted_count
  const approvedCount = list.statusSummary.approved_count
  const availableQuantity = Number(inventory.inventorySummary.available_quantity || 0)
  const pendingQuantity = Number(inventory.inventorySummary.pending_inspection_quantity || 0)

  return (
    <section className="inbound-order-page">
      <div className="summary-strip" aria-label={t('warehouse.inboundOrder.metric.overviewAria')}>
        <Metric label={t('warehouse.inboundOrder.metric.orderCount')} value={list.total} />
        <Metric label={t('warehouse.inboundOrder.metric.draftCount')} value={draftCount} />
        <Metric
          label={t('warehouse.inboundOrder.metric.submittedCount')}
          value={submittedCount}
          intent={submittedCount > 0 ? 'warning' : 'normal'}
        />
        <Metric label={t('warehouse.inboundOrder.metric.approvedCount')} value={approvedCount} />
        <Metric
          label={t('warehouse.inboundOrder.metric.availableQuantity')}
          value={availableQuantity.toFixed(2)}
        />
        <Metric
          label={t('warehouse.inboundOrder.metric.pendingQuantity')}
          value={pendingQuantity.toFixed(2)}
        />
      </div>

      {workflow.message ? (
        <Alert className="workspace-alert" title={workflow.message} type="success" showIcon />
      ) : null}

      <section className="business-grid inbound-order-grid">
        {!detailId ? (
          <InboundOrderListPanel model={list} onOpenModal={workflow.openInboundOrderModal} />
        ) : null}

        <InboundOrderWorkflowModal
          workflow={workflow}
          inboundPlans={list.inboundPlans}
          selectedOrder={list.selectedOrder}
          currentUser={currentUser}
        />

        {detailId ? (
          <InboundOrderDetailPanel
            order={list.selectedOrder}
            inventory={inventory}
            onRefreshInventory={(event) =>
              inventory.refreshInventorySnapshot(event, list.selectedOrder, list.search)
            }
            onBack={() => onNavigate(warehouseInboundOrderPath)}
            onOpenCancel={workflow.openCancelModal}
          />
        ) : null}
      </section>

      <InboundOrderCancelModal
        open={workflow.cancelModalOpen}
        submitting={workflow.submitting}
        reason={workflow.cancelReason}
        reasonError={workflow.cancelReasonError}
        onReasonChange={workflow.changeCancelReason}
        onClose={workflow.closeCancelModal}
        onSubmit={(event) => void workflow.cancelSelectedInboundOrder(event)}
      />
    </section>
  )
}
