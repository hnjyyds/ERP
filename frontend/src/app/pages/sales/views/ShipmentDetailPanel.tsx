import { Alert, Button, Input } from 'antd'
import { ArrowLeft, LayoutDashboard, Ship } from 'lucide-react'

import type { CurrentUser, ShipmentPlan, ShipmentReminder } from '@/api'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import { formatDate, formatMoney } from '@/app/pages/appHelpers'
import { Metric, PanelTitle } from '@/shared/ui'
import { t } from '@/app/appI18n'

import { freightMethodLabel, formatPercent, shipmentStatusLabel } from '../shipmentHelpers'
import type { useShipmentWorkflow } from '../hooks/useShipmentWorkflow'
import { ShipmentDetailTables } from './ShipmentDetailTables'

type Props = {
  currentUser: CurrentUser
  shipment: ShipmentPlan | null
  reminders: ShipmentReminder[]
  workflow: ReturnType<typeof useShipmentWorkflow>
  onBack: () => void
}

export function ShipmentDetailPanel({ currentUser, shipment, reminders, workflow, onBack }: Props) {
  const approveForm = workflow.approveForm
  const setApproveForm = workflow.setApproveForm

  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle icon={<LayoutDashboard size={18} />} title={t('sales.shipment.detail.title')} />
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('sales.shipment.action.backToList')}
        </Button>
      </div>
      {shipment ? (
        <>
          <dl className="detail-list">
            <div>
              <dt>{t('sales.shipment.detail.statusDate')}</dt>
              <dd>
                {shipmentStatusLabel(shipment.approval_status)} / {formatDate(shipment.shipment_date)}
              </dd>
            </div>
            <div>
              <dt>{t('sales.shipment.field.customer')}</dt>
              <dd>{shipment.customer_name}</dd>
            </div>
            <div>
              <dt>{t('sales.shipment.field.freightMethod')}</dt>
              <dd>{freightMethodLabel(shipment.shipping_method)}</dd>
            </div>
            <div>
              <dt>{t('sales.shipment.detail.ports')}</dt>
              <dd>{`${shipment.port_of_loading} -> ${shipment.port_of_destination}`}</dd>
            </div>
            <div>
              <dt>{t('sales.shipment.detail.vesselContainer')}</dt>
              <dd>
                {shipment.vessel_name ?? t('sales.shipment.detail.notFilled')} /{' '}
                {shipment.container_no ?? t('sales.shipment.detail.notFilled')}
              </dd>
            </div>
            <div>
              <dt>{t('sales.shipment.field.bookingNo')}</dt>
              <dd>{shipment.booking_no ?? t('sales.shipment.detail.notFilled')}</dd>
            </div>
            <div>
              <dt>{t('sales.shipment.field.documentOwner')}</dt>
              <dd>{shipment.document_owner_name ?? t('sales.shipment.detail.notFilled')}</dd>
            </div>
            <div>
              <dt>{t('sales.shipment.field.reviewer')}</dt>
              <dd>{shipment.reviewer_name ?? t('sales.shipment.detail.notApproved')}</dd>
            </div>
          </dl>

          <div className="transaction-box">
            <strong>{t('sales.shipment.detail.financeOverview')}</strong>
            <div className="finance-overview-grid">
              <Metric
                label={t('sales.shipment.metric.receivableAmount')}
                value={formatMoney(
                  shipment.finance_overview.receivable_amount,
                  shipment.finance_overview.currency,
                )}
              />
              <Metric
                label={t('sales.shipment.metric.expectedPayable')}
                value={formatMoney(
                  shipment.finance_overview.payable_amount,
                  shipment.finance_overview.currency,
                )}
              />
              <Metric
                label={t('sales.shipment.metric.expectedProfit')}
                value={formatMoney(
                  shipment.finance_overview.profit_amount,
                  shipment.finance_overview.currency,
                )}
              />
              <Metric
                label={t('sales.shipment.metric.profitRate')}
                value={formatPercent(shipment.finance_overview.profit_rate)}
              />
            </div>
          </div>

          <div className="delivery-action-row">
            {shipment.approval_status === 'draft' ? (
              <ApprovalAssigneeSelect
                currentUserId={currentUser.id}
                onChange={workflow.setReviewerId}
                requiredPermission="sales:shipment:approve"
                value={workflow.reviewerId}
              />
            ) : null}
            <Button
              disabled={shipment.approval_status !== 'draft' || !workflow.reviewerId}
              loading={workflow.submitting}
              onClick={() => void workflow.submitShipmentForApproval()}
            >
              {t('sales.shipment.action.submitForApproval')}
            </Button>
            {shipment.approval_status === 'submitted' ? (
              <>
                <Button
                  disabled={!workflow.canWithdrawSelected}
                  loading={workflow.submitting}
                  onClick={() => void workflow.withdrawSelectedShipment()}
                >
                  {t('sales.shipment.action.withdraw')}
                </Button>
                <Button
                  danger
                  disabled={!workflow.canRejectSelected}
                  onClick={workflow.openRejectModal}
                >
                  {t('sales.shipment.action.reject')}
                </Button>
              </>
            ) : null}
            {workflow.canResyncSelected ? (
              <Button
                loading={workflow.resyncSubmitting}
                onClick={() => void workflow.resyncSelectedShipment()}
              >
                {t('sales.shipment.action.resyncFromContracts')}
              </Button>
            ) : null}
          </div>

          {shipment.rejection_reason ? (
            <Alert
              description={shipment.rejection_reason}
              showIcon
              title={t('sales.shipment.detail.rejectionTitle', {
                date: formatDate(shipment.rejected_at),
              })}
              type="warning"
            />
          ) : null}
          {workflow.canResyncSelected ? (
            <p className="form-hint">{t('sales.shipment.detail.resyncHint')}</p>
          ) : null}

          <form
            className="record-form accessory-form approval-form"
            onSubmit={workflow.approveSelectedShipment}
          >
            <div className="form-divider">{t('sales.shipment.detail.approvalSection')}</div>
            <div className="form-pair two">
              <label>
                {t('sales.shipment.field.reviewer')}
                <Input disabled value={shipment.reviewer_name ?? ''} />
              </label>
              <label>
                {t('sales.shipment.field.approvedAt')}
                <Input
                  type="date"
                  value={approveForm.approved_at}
                  onChange={(event) =>
                    setApproveForm({ ...approveForm, approved_at: event.target.value })
                  }
                />
              </label>
            </div>
            <Button
              disabled={shipment.approval_status !== 'submitted' || !workflow.canApproveSelected}
              htmlType="submit"
              loading={workflow.submitting}
              type="primary"
            >
              {t('sales.shipment.action.approve')}
            </Button>
            {shipment.approval_status === 'submitted' && !workflow.canApproveSelected ? (
              <Alert
                message={t('sales.shipment.action.waitingApproval', {
                  name: shipment.reviewer_name ?? t('sales.shipment.action.defaultReviewer'),
                })}
                showIcon
                type="info"
              />
            ) : null}
          </form>

          <div className="transaction-box">
            <strong>{t('sales.shipment.detail.reminderTitle')}</strong>
            <p>{shipment.reminder.message}</p>
          </div>

          <ShipmentDetailTables shipment={shipment} reminders={reminders} />
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <Ship size={28} />
          <strong>{t('sales.shipment.detail.emptyTitle')}</strong>
          <span>{t('sales.shipment.detail.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
