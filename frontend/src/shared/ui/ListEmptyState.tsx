import { Button } from 'antd'
import type { ReactNode } from 'react'

import { t } from '@/app/appI18n'

import { EmptyState } from './EmptyState'

type Props = {
  /** 当前是否带搜索或筛选条件。 */
  filtered: boolean
  emptyTitle: string
  emptyDescription?: string
  createLabel?: string
  onCreate?: () => void
  onClearFilters?: () => void
  icon?: ReactNode
}

/** 表格空状态：区分“尚未建档”和“筛选无结果”，并给出下一步动作。 */
export function ListEmptyState({
  filtered,
  emptyTitle,
  emptyDescription,
  createLabel,
  onCreate,
  onClearFilters,
  icon,
}: Props) {
  if (filtered) {
    return (
      <EmptyState
        description={t('common.empty.noMatchDescription')}
        icon={icon}
        size="page"
        title={t('common.empty.noMatchTitle')}
        action={
          onClearFilters ? (
            <Button onClick={onClearFilters}>{t('common.empty.clearFilters')}</Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <EmptyState
      description={emptyDescription ?? t('common.empty.noDataDescription')}
      icon={icon}
      size="page"
      title={emptyTitle}
      action={
        onCreate && createLabel ? (
          <Button type="primary" onClick={onCreate}>
            {t('common.empty.startCreate', { action: createLabel })}
          </Button>
        ) : undefined
      }
    />
  )
}
