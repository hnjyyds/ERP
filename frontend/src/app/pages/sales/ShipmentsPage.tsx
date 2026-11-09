import { Alert } from 'antd'

import type { CurrentUser } from '@/api'
import type { RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { shipmentPath } from '@/app/routes'
import { Metric } from '@/shared/ui'
import { formatMoney } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import { useShipmentsList } from './hooks/useShipmentsList'
import { useShipmentWorkflow } from './hooks/useShipmentWorkflow'
import { ShipmentDetailPanel } from './views/ShipmentDetailPanel'
import { ShipmentGenerateModal } from './views/ShipmentGenerateModal'
import { ShipmentListPanel } from './views/ShipmentListPanel'
import { ShipmentRejectModal } from './views/ShipmentRejectModal'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function ShipmentsPage({ currentUser, detailId, onNavigate }: Props) {
  const list = useShipmentsList({ detailId, onNavigate })
  const workflow = useShipmentWorkflow({
    currentUser,
    selectedShipment: list.selectedShipment,
    upsertShipment: list.upsertShipment,
    reloadShipments: list.loadShipments,
    reloadReminders: list.loadReminders,
  })
  const currency = list.summary.currency ?? 'USD'

  return (
    <section className="shipment-page">
      <div className="summary-strip" aria-label={t('sales.shipment.metric.overviewAria')}>
        <Metric label={t('sales.shipment.metric.shipmentCount')} value={list.total} />
        <Metric
          label={t('sales.shipment.metric.pendingApproval')}
          value={list.summary.submitted_count}
        />
        <Metric
          label={t('sales.shipment.metric.approvedCount')}
          value={list.summary.approved_count}
        />
        <Metric
          label={t('sales.shipment.metric.receivableAmount')}
          value={formatMoney(Number(list.summary.receivable_amount).toFixed(2), currency)}
        />
        <Metric
          label={t('sales.shipment.metric.expectedProfit')}
          value={formatMoney(Number(list.summary.profit_amount).toFixed(2), currency)}
        />
      </div>

      {workflow.message ? (
        <Alert className="workspace-alert" title={workflow.message} type="success" showIcon />
      ) : null}

      <section className="business-grid shipment-grid">
        {!detailId ? (
          <ShipmentListPanel model={list} onGenerate={workflow.openGenerateForm} />
        ) : null}

        {!detailId ? <ShipmentGenerateModal workflow={workflow} /> : null}

        <ShipmentRejectModal
          form={workflow.rejectForm}
          open={workflow.rejectOpen}
          submitting={workflow.rejectSubmitting}
          onCancel={workflow.closeRejectModal}
          onConfirm={() => void workflow.rejectSelectedShipment()}
          onFormChange={workflow.setRejectForm}
        />

        {detailId ? (
          <ShipmentDetailPanel
            currentUser={currentUser}
            shipment={list.selectedShipment}
            reminders={list.reminders}
            workflow={workflow}
            onBack={() => onNavigate(shipmentPath)}
          />
        ) : null}
      </section>
    </section>
  )
}
