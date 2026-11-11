import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  /** page：表格 / 详情等整块区域；compact：工作台预览卡。 */
  size?: 'page' | 'compact'
  className?: string
}

/** 统一空状态：居中图标 + 一句说明 + 一个动作，无虚线框、无底色。 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'compact',
  className,
}: EmptyStateProps) {
  return (
    <div className={['ui-empty-state', `is-${size}`, className].filter(Boolean).join(' ')}>
      {icon ? (
        <span className="ui-empty-state-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="ui-empty-state-title">{title}</p>
      {description ? <p className="ui-empty-state-description">{description}</p> : null}
      {action ? <div className="ui-empty-state-action">{action}</div> : null}
    </div>
  )
}
