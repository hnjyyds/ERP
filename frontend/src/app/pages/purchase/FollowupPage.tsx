import { Alert } from 'antd'
import type { MouseEvent } from 'react'

import { Metric } from '@/shared/ui'
import { followupPath } from '@/app/routes'
import type { RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type { PurchaseFollowPlan } from '@/api'

import { useFollowupActions } from './hooks/useFollowupActions'
import { useFollowupWorkspace } from './hooks/useFollowupWorkspace'
import { FollowupConfigModal } from './views/FollowupConfigModal'
import { FollowupDetailPanel } from './views/FollowupDetailPanel'
import { FollowupListPanel } from './views/FollowupListPanel'
import { FollowupNodeCompletionModal } from './views/FollowupNodeCompletionModal'

export function FollowupPage({
  detailId,
  targetNodeId = null,
  onNavigate,
}: RoutedDetailPageProps & { targetNodeId?: string | null }) {
  const model = useFollowupWorkspace({ detailId, onNavigate, targetNodeId })
  const actions = useFollowupActions({
    applyGeneratedPlan: model.applyGeneratedPlan,
    applySavedTemplate: model.applySavedTemplate,
    overdueAsOf: model.overdueAsOf,
    reload: model.loadFollowupWorkspace,
    selectedPlan: model.selectedPlan,
    selectedTemplate: model.selectedTemplate,
    setOverdueAsOf: model.setOverdueAsOf,
    setOverdueNodes: model.setOverdueNodes,
  })

  function stopAndOpenFollowupDetail(
    event: MouseEvent<HTMLElement>,
    plan: PurchaseFollowPlan,
  ) {
    event.stopPropagation()
    model.openFollowupDetail(plan)
  }

  const { summary, overdueNodes, total } = model
  const completedPlans = summary.completed_plan_count
  const overduePlans = summary.overdue_plan_count
  const totalNodes = summary.total_node_count
  const completedNodes = summary.completed_node_count

  return (
    <section className="followup-page">
      <div className="summary-strip" aria-label={t('purchase.followup.metric.overviewAria')}>
        <Metric label={t('purchase.followup.metric.planCount')} value={total} />
        <Metric label={t('purchase.followup.metric.completedPlans')} value={completedPlans} />
        <Metric
          label={t('purchase.followup.metric.overduePlans')}
          value={overduePlans}
          intent={overduePlans > 0 ? 'warning' : 'normal'}
        />
        <Metric
          label={t('purchase.followup.metric.completedNodes')}
          value={`${completedNodes}/${totalNodes}`}
        />
        <Metric
          label={t('purchase.followup.metric.overdueNodes')}
          value={overdueNodes.length}
          intent={overdueNodes.length > 0 ? 'danger' : 'normal'}
        />
      </div>

      {actions.message ? (
        <Alert className="workspace-alert" title={actions.message} type="success" showIcon />
      ) : null}

      <section className="business-grid followup-grid">
        {!detailId ? (
          <FollowupListPanel
            model={model}
            onConfigure={() => actions.setFollowupModalOpen(true)}
            onSelectPlan={(plan) => model.setSelectedPlanId(plan.id)}
            onStopAndOpenDetail={stopAndOpenFollowupDetail}
          />
        ) : null}

        <FollowupConfigModal model={actions} />

        <FollowupNodeCompletionModal model={actions} plan={model.selectedPlan} />

        {detailId ? (
          <FollowupDetailPanel
            actions={actions}
            model={model}
            onBack={() => onNavigate(followupPath)}
            onNavigate={onNavigate}
            onOpenNodeCompletion={actions.openNodeCompletion}
            targetNodeId={targetNodeId}
          />
        ) : null}
      </section>
    </section>
  )
}
