import { Alert } from 'antd'
import type { MouseEvent } from 'react'
import { useState } from 'react'

import type { CurrentUser, QualityInspection } from '@/api'
import { Metric } from '@/shared/ui'
import { t } from '@/app/appI18n'
import { moduleDetailPath, qualityInspectionPath } from '@/app/routes'
import type { RoutedDetailPageProps } from '@/app/pages/appHelpers'

import { useQualityInspectionsList } from './hooks/useQualityInspectionsList'
import { useQualityTaskModal } from './hooks/useQualityTaskModal'
import { useIssueResolution } from './hooks/useIssueResolution'
import { useReinspection } from './hooks/useReinspection'
import { QualityInspectionListPanel } from './views/QualityInspectionListPanel'
import { QualityInspectionDetailPanel } from './views/QualityInspectionDetailPanel'
import { QualityTaskModal } from './views/QualityTaskModal'
import { IssueResolutionModal } from './views/IssueResolutionModal'
import { ReinspectionModal } from './views/ReinspectionModal'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function QualityInspectionsPage({ currentUser, detailId, onNavigate }: Props) {
  const [message, setMessage] = useState('')
  const list = useQualityInspectionsList({ currentUser, detailId, onNavigate, setMessage })
  const taskModal = useQualityTaskModal({
    currentUser,
    setMessage,
    onCreated: (task) => list.loadQualityInspections(task.id),
  })
  const issueResolution = useIssueResolution({
    inspection: list.selectedInspection,
    onUpdated: list.replaceInspection,
    onIssueResolved: list.decrementOpenIssueCount,
    setMessage,
  })
  const reinspection = useReinspection({
    inspection: list.selectedInspection,
    eligibility: list.eligibility,
    currentUser,
    onNavigate,
    onCreated: list.prependInspection,
    setMessage,
  })

  function openDetail(event: MouseEvent<HTMLElement>, inspection: QualityInspection) {
    event.stopPropagation()
    list.setSelectedInspectionId(inspection.id)
    onNavigate(moduleDetailPath(qualityInspectionPath, inspection.id))
  }

  const { summary } = list

  return (
    <section className="quality-inspection-page">
      <div className="summary-strip" aria-label={t('quality.inspection.pageAria')}>
        <Metric
          label={t('quality.inspection.metric.myAction')}
          value={summary.my_action_count}
          intent={summary.my_action_count ? 'warning' : 'normal'}
        />
        <Metric
          label={t('quality.inspection.metric.pending')}
          value={summary.pending_count}
          intent={summary.pending_count ? 'warning' : 'normal'}
        />
        <Metric
          label={t('quality.inspection.metric.inProgress')}
          value={summary.in_progress_count}
          intent={summary.in_progress_count ? 'warning' : 'normal'}
        />
        <Metric
          label={t('quality.inspection.metric.overdue')}
          value={summary.overdue_count}
          intent={summary.overdue_count ? 'danger' : 'normal'}
        />
        <Metric
          label={t('quality.inspection.metric.openIssues')}
          value={summary.open_issue_count}
          intent={summary.open_issue_count ? 'danger' : 'normal'}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid quality-inspection-grid">
        {!detailId ? (
          <QualityInspectionListPanel
            model={list}
            onCreate={taskModal.startNewTask}
            onOpenDetail={openDetail}
          />
        ) : null}

        <QualityTaskModal model={taskModal} />

        {detailId ? (
          <QualityInspectionDetailPanel
            inspection={list.selectedInspection}
            eligibility={list.eligibility}
            onBack={() => onNavigate(qualityInspectionPath)}
            onReinspection={reinspection.openReinspection}
            onResolveIssue={issueResolution.openIssueResolution}
          />
        ) : null}
      </section>

      <IssueResolutionModal model={issueResolution} />
      <ReinspectionModal model={reinspection} />
    </section>
  )
}
