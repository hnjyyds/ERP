import { Tag } from 'antd'

import { translate, type TranslationKey } from '@/locales'

import { getRuntimeSettings } from './runtimeSettings'

export function statusTag(value: string) {
  const color =
    value === 'done' || value === 'completed' ? 'green' : value === 'overdue' ? 'red' : 'gold'
  const labelKeys: Record<string, TranslationKey> = {
    completed: 'common.workflowStatus.completed',
    done: 'common.workflowStatus.completed',
    pending: 'common.workflowStatus.pending',
    in_progress: 'common.workflowStatus.inProgress',
    overdue: 'common.workflowStatus.overdue',
  }
  const key = labelKeys[value]
  const label = key ? translate(getRuntimeSettings().language, key) : value
  return <Tag color={color}>{label}</Tag>
}

export function severityTag(value: string) {
  const color =
    value === 'high' || value === 'urgent'
      ? 'red'
      : value === 'warning'
        ? 'gold'
        : value === 'success'
          ? 'green'
          : 'blue'
  const labelKeys: Record<string, TranslationKey> = {
    high: 'common.severity.high',
    urgent: 'common.severity.urgent',
    warning: 'common.severity.warning',
    info: 'common.severity.info',
    success: 'common.severity.success',
  }
  const key = labelKeys[value] ?? 'common.severity.unknown'
  return <Tag color={color}>{translate(getRuntimeSettings().language, key)}</Tag>
}
