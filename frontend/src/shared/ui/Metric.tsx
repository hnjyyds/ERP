import type { ReactNode } from 'react'

type MetricIntent = 'normal' | 'warning' | 'danger'

type MetricProps = {
  icon?: ReactNode
  label: string
  value: number | string
  intent?: MetricIntent
  onClick?: () => void
}

export function Metric({ icon, label, value, intent = 'normal', onClick }: MetricProps) {
  const className = `metric-cell ${intent}${onClick ? ' clickable' : ''}`
  const content = (
    <>
      {icon ? <span className="metric-icon">{icon}</span> : null}
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
    </>
  )

  if (onClick) {
    return (
      <button className={className} type="button" onClick={onClick}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}
