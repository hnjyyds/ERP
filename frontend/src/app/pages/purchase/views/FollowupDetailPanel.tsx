import { Button, Input } from 'antd'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  RefreshCw,
  Search,
} from 'lucide-react'

import { PanelTitle } from '@/shared/ui'
import { formatDate } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type { PurchaseFollowNode } from '@/api'

import {
  followupNodeActionLabel,
  followupNodeBusinessPath,
  followupNodeLabel,
  followupNodeStatusLabel,
  followupPlanStatusLabel,
  followupSourceTypeLabel,
  isSampleSubmissionNode,
} from '../followupHelpers'
import type { useFollowupActions } from '../hooks/useFollowupActions'
import type { useFollowupWorkspace } from '../hooks/useFollowupWorkspace'

type Props = {
  actions: ReturnType<typeof useFollowupActions>
  model: ReturnType<typeof useFollowupWorkspace>
  onBack: () => void
  onNavigate: (path: string) => void
  onOpenNodeCompletion: (node: PurchaseFollowNode) => void
  targetNodeId: string | null
}

export function FollowupDetailPanel({
  actions,
  model,
  onBack,
  onNavigate,
  onOpenNodeCompletion,
  targetNodeId,
}: Props) {
  const { selectedPlan } = model
  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle
          icon={<LayoutDashboard size={18} />}
          title={t('purchase.followup.detail.title')}
        />
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('purchase.followup.action.backToList')}
        </Button>
      </div>
      {selectedPlan ? (
        <>
          <dl className="detail-list">
            <div>
              <dt>{t('purchase.followup.detail.overallStatus')}</dt>
              <dd>{followupPlanStatusLabel(selectedPlan.overall_status)}</dd>
            </div>
            <div>
              <dt>{t('purchase.followup.field.supplier')}</dt>
              <dd>{selectedPlan.supplier_name}</dd>
            </div>
            <div>
              <dt>{t('purchase.followup.field.baseDate')}</dt>
              <dd>{formatDate(selectedPlan.base_date)}</dd>
            </div>
            <div>
              <dt>{t('purchase.followup.field.purchaseContractId')}</dt>
              <dd>{selectedPlan.purchase_contract_id}</dd>
            </div>
          </dl>

          <div className="delivery-action-row">
            <Button
              icon={<RefreshCw size={16} />}
              loading={actions.submitting}
              onClick={() => void actions.syncSelectedFollowupSampleEvents()}
            >
              {t('purchase.followup.action.syncSampleEvents')}
            </Button>
            <Button
              icon={<Search size={16} />}
              loading={actions.submitting}
              onClick={() => void actions.scanFollowupOverdueNodes()}
            >
              {t('purchase.followup.action.scanOverdue')}
            </Button>
          </div>

          <div className="accessory-heading">
            <strong>{t('purchase.followup.detail.nodesTitle')}</strong>
            <span>
              {targetNodeId && selectedPlan.nodes.some((node) => node.id === targetNodeId)
                ? t('purchase.followup.detail.located', {
                    name: (() => {
                      const targetNode = selectedPlan.nodes.find(
                        (node) => node.id === targetNodeId,
                      )
                      return targetNode
                        ? followupNodeLabel(targetNode.node_code, targetNode.node_name)
                        : ''
                    })(),
                  })
                : t('purchase.followup.detail.nodeCount', {
                    count: selectedPlan.nodes.length,
                  })}
            </span>
          </div>
          <table className="data-table compact-table followup-node-table">
            <thead>
              <tr>
                <th>{t('purchase.followup.field.node')}</th>
                <th>{t('purchase.followup.field.planned')}</th>
                <th>{t('purchase.followup.field.remind')}</th>
                <th>{t('purchase.followup.field.actual')}</th>
                <th>{t('purchase.followup.field.status')}</th>
                <th>{t('purchase.followup.field.source')}</th>
                <th>{t('purchase.followup.field.action')}</th>
              </tr>
            </thead>
            <tbody>
              {selectedPlan.nodes.map((node) => {
                const targetPath = followupNodeBusinessPath(selectedPlan, node)
                const canCompleteHere = node.status !== 'completed' && isSampleSubmissionNode(node)
                const isTargetNode = node.id === targetNodeId

                return (
                  <tr
                    aria-current={isTargetNode ? 'step' : undefined}
                    className={isTargetNode ? 'followup-node-target' : undefined}
                    id={`followup-node-${node.id}`}
                    key={node.id}
                  >
                    <td>
                      <strong>{followupNodeLabel(node.node_code, node.node_name)}</strong>
                      {isTargetNode ? (
                        <span className="followup-node-focus-label">
                          {t('purchase.followup.detail.currentTodo')}
                        </span>
                      ) : null}
                    </td>
                    <td>{formatDate(node.planned_date)}</td>
                    <td>{formatDate(node.remind_date)}</td>
                    <td>
                      {node.actual_date
                        ? formatDate(node.actual_date)
                        : t('purchase.followup.detail.pendingWriteBack')}
                    </td>
                    <td>{followupNodeStatusLabel(node.status)}</td>
                    <td>
                      <span>{followupSourceTypeLabel(node.source_record_type)}</span>
                      {node.source_summary ? (
                        <small className="followup-source-summary" title={node.source_summary}>
                          {node.source_summary}
                        </small>
                      ) : null}
                    </td>
                    <td className="followup-node-action-cell">
                      {canCompleteHere ? (
                        <Button
                          icon={<CheckCircle2 size={15} />}
                          size="small"
                          type={isTargetNode ? 'primary' : 'default'}
                          onClick={() => onOpenNodeCompletion(node)}
                        >
                          {followupNodeActionLabel(node)}
                        </Button>
                      ) : targetPath ? (
                        <Button
                          icon={<ArrowRight size={15} />}
                          size="small"
                          onClick={() => onNavigate(targetPath)}
                        >
                          {followupNodeActionLabel(node)}
                        </Button>
                      ) : node.status === 'completed' ? (
                        <span className="followup-node-completed">
                          <CheckCircle2 size={15} />
                          {t('purchase.followup.status.completed')}
                        </span>
                      ) : (
                        <span className="followup-node-waiting">
                          {t('purchase.followup.detail.waitingPrevious')}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="accessory-heading">
            <strong>{t('purchase.followup.detail.overdueTitle')}</strong>
            <span>
              {t('purchase.followup.detail.overdueCount', { count: model.overdueNodes.length })}
            </span>
          </div>
          <form className="inline-filters inline-search" onSubmit={actions.scanFollowupOverdueNodes}>
            <label>
              {t('purchase.followup.detail.asOf')}
              <Input
                type="date"
                value={model.overdueAsOf}
                onChange={(event) => model.setOverdueAsOf(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />} loading={actions.submitting}>
              {t('purchase.followup.list.query')}
            </Button>
          </form>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('purchase.followup.field.purchaseContract')}</th>
                <th>{t('purchase.followup.field.supplier')}</th>
                <th>{t('purchase.followup.field.node')}</th>
                <th>{t('purchase.followup.field.planned')}</th>
                <th>{t('purchase.followup.field.overdueDays')}</th>
              </tr>
            </thead>
            <tbody>
              {model.overdueNodes.map((node) => (
                <tr key={node.id}>
                  <td>{node.purchase_contract_no}</td>
                  <td>{node.supplier_name}</td>
                  <td>{followupNodeLabel(node.node_code, node.node_name)}</td>
                  <td>{formatDate(node.planned_date)}</td>
                  <td>
                    {t('purchase.followup.detail.overdueDaysValue', {
                      count: node.overdue_days,
                    })}
                  </td>
                </tr>
              ))}
              {model.overdueNodes.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={5}>
                    {t('purchase.followup.detail.noOverdue')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <ClipboardCheck size={28} />
          <strong>{t('purchase.followup.detail.emptyTitle')}</strong>
          <span>{t('purchase.followup.detail.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
