import { Alert } from 'antd'

import type { CurrentUser } from '@/api'
import { Metric } from '@/shared/ui'
import { t } from '@/app/appI18n'

import { useQualityTasksList } from './hooks/useQualityTasksList'
import { useQualityTaskWorkflow } from './hooks/useQualityTaskWorkflow'
import { QualityTaskActionModal } from './views/QualityTaskActionModal'
import { QualityTaskCompletionModal } from './views/QualityTaskCompletionModal'
import { QualityTaskListPanel } from './views/QualityTaskListPanel'

type Props = { currentUser: CurrentUser }

export function MyQualityTasksPage({ currentUser }: Props) {
  const list = useQualityTasksList({ currentUser })
  const workflow = useQualityTaskWorkflow({
    reloadTasks: list.loadTasks,
    upsertTask: list.upsertTask,
  })
  const { pending_count, in_progress_count, completed_count, overdue_count } = list.summary

  return (
    <section className="quality-inspection-page">
      <div className="summary-strip" aria-label={t('quality.task.pageAria')}>
        <Metric label={t('quality.task.metric.tasks')} value={list.total} />
        <Metric
          label={t('quality.task.metric.pending')}
          value={pending_count}
          intent={pending_count ? 'warning' : 'normal'}
        />
        <Metric
          label={t('quality.task.metric.inProgress')}
          value={in_progress_count}
          intent={in_progress_count ? 'warning' : 'normal'}
        />
        <Metric label={t('quality.task.metric.completed')} value={completed_count} />
        <Metric
          label={t('quality.task.metric.overdue')}
          value={overdue_count}
          intent={overdue_count ? 'danger' : 'normal'}
        />
      </div>

      {workflow.message ? (
        <Alert className="workspace-alert" title={workflow.message} type="success" showIcon />
      ) : null}

      <QualityTaskListPanel model={list} workflow={workflow} />
      <QualityTaskCompletionModal workflow={workflow} />
      <QualityTaskActionModal workflow={workflow} />
    </section>
  )
}
