import { Typography } from 'antd'
import type { ReactNode } from 'react'

type PanelTitleProps = {
  icon: ReactNode
  title: string
}

export function PanelTitle({ icon, title }: PanelTitleProps) {
  return (
    <div className="panel-title">
      {icon}
      <Typography.Title level={2}>{title}</Typography.Title>
    </div>
  )
}
