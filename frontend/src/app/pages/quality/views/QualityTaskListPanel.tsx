import { Button, Input, Table, Tag } from 'antd'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Play,
  Search,
  XCircle,
} from 'lucide-react'

import type { QualityInspection, QualityInspectionStatus } from '@/api'
import { FormSelect, ListPageShell } from '@/shared/ui'
import { t } from '@/app/appI18n'

import {
  formatScheduledAt,
  qualityTaskStatusOptions,
  resultColor,
  resultLabel,
  statusColor,
  statusLabel,
} from '../qualityTaskHelpers'
import type { useQualityTaskWorkflow } from '../hooks/useQualityTaskWorkflow'
import type { useQualityTasksList } from '../hooks/useQualityTasksList'

type Props = {
  model: ReturnType<typeof useQualityTasksList>
  workflow: ReturnType<typeof useQualityTaskWorkflow>
}

export function QualityTaskListPanel({ model, workflow }: Props) {
  return (
    <ListPageShell
      className="product-list-panel"
      icon={<ClipboardCheck size={18} />}
      title={t('quality.task.panel.listTitle')}
    >
      <form
        className="inline-filters"
        onSubmit={(event) => {
          event.preventDefault()
          model.submitFilters()
        }}
      >
        <label>
          {t('quality.task.filter.search')}
          <Input
            placeholder={t('quality.task.filter.searchPlaceholder')}
            value={model.search}
            onChange={(event) => model.setSearch(event.target.value)}
          />
        </label>
        <label>
          {t('quality.task.filter.status')}
          <FormSelect
            value={model.statusFilter}
            onChange={(event) => model.setStatusFilter(event.target.value)}
          >
            <option value="">{t('quality.task.filter.allStatuses')}</option>
            {qualityTaskStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </FormSelect>
        </label>
        <label>
          <span>&nbsp;</span>
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('quality.task.action.query')}
          </Button>
        </label>
      </form>

      <Table<QualityInspection>
        columns={[
          { title: t('quality.task.table.code'), dataIndex: 'code' },
          { title: t('quality.task.table.contract'), dataIndex: 'purchase_contract_no' },
          { title: t('quality.task.table.supplier'), dataIndex: 'supplier_name' },
          {
            title: t('quality.task.table.scheduledAt'),
            dataIndex: 'scheduled_at',
            render: (value: string, task) => (
              <span
                className={
                  task.status === 'pending' && new Date(value).getTime() < Date.now()
                    ? 'task-schedule-overdue'
                    : undefined
                }
              >
                {formatScheduledAt(value)}
              </span>
            ),
          },
          {
            title: t('quality.task.table.status'),
            dataIndex: 'status',
            render: (value: QualityInspectionStatus) => (
              <Tag color={statusColor(value)}>{statusLabel(value)}</Tag>
            ),
          },
          {
            title: t('quality.task.table.result'),
            dataIndex: 'result',
            render: (value: string | null) => (
              <Tag color={resultColor(value)}>{resultLabel(value)}</Tag>
            ),
          },
          {
            title: t('quality.task.table.operation'),
            key: 'actions',
            width: 340,
            render: (_: unknown, task) => (
              <div className="table-actions">
                {task.status === 'pending' ? (
                  <Button
                    icon={<Play size={15} />}
                    loading={workflow.submittingId === task.id}
                    size="small"
                    type="primary"
                    onClick={() => void workflow.startTask(task)}
                  >
                    {t('quality.task.action.start')}
                  </Button>
                ) : null}
                {task.status === 'in_progress' ? (
                  <Button
                    icon={<CheckCircle2 size={15} />}
                    size="small"
                    type="primary"
                    onClick={() => void workflow.openCompletion(task)}
                  >
                    {t('quality.task.action.registerResult')}
                  </Button>
                ) : null}
                {task.status === 'pending' || task.status === 'in_progress' ? (
                  <Button
                    icon={<CalendarClock size={15} />}
                    size="small"
                    onClick={() => workflow.openTaskAction(task, 'reschedule')}
                  >
                    {t('quality.task.action.reschedule')}
                  </Button>
                ) : null}
                {task.status === 'pending' || task.status === 'in_progress' ? (
                  <Button
                    danger
                    icon={<XCircle size={15} />}
                    size="small"
                    onClick={() => workflow.openTaskAction(task, 'cancel')}
                  >
                    {t('quality.task.action.cancel')}
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        dataSource={model.tasks}
        loading={model.loading}
        pagination={{
          ...model.pagination,
          onChange: (nextPage, nextPageSize) => model.changeListPage(nextPage, nextPageSize),
        }}
        rowKey="id"
        size="small"
      />
    </ListPageShell>
  )
}
