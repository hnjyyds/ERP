import { Button } from 'antd'
import type { ReactNode } from 'react'

import { t } from '@/app/appI18n'

import { EmptyState } from './EmptyState'

type Props = {
  /** 当前是否带搜索或筛选条件。 */
  filtered: boolean
  /** 列表请求失败时使用独立错误态，而不是复用“尚未首次录入”。 */
  error?: boolean
  onRetry?: () => void
  emptyTitle: string
  emptyDescription?: string
  createLabel?: string
  onCreate?: () => void
  onClearFilters?: () => void
  icon?: ReactNode
}

/** 表格空状态：区分“加载失败”、“筛选无结果”和“尚未建档”，并给出下一步动作。 */
export function ListEmptyState({
  filtered,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  createLabel,
  onCreate,
  onClearFilters,
  icon,
}: Props) {
  if (error) {
    return (
      <EmptyState
        description={t('common.empty.loadFailedDescription')}
        icon={icon}
        size="page"
        title={t('common.empty.loadFailedTitle')}
        action={
          onRetry ? (
            <Button onClick={onRetry}>{t('common.empty.retry')}</Button>
          ) : undefined
        }
      />
    )
  }

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
