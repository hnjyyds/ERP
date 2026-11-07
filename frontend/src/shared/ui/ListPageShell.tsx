import type { ReactNode } from 'react'

import { PanelTitle } from './PanelTitle'

type ListPageShellProps = {
  icon: ReactNode
  title: string
  children: ReactNode
  /** 搜索、筛选、导入导出等列表工具栏。 */
  toolbar?: ReactNode
  /** 追加到 workspace-panel list-panel 上的页面级类名。 */
  className?: string
}

/** 列表页统一外壳：面板标题 + 工具栏 + 表格内容。 */
export function ListPageShell({ icon, title, children, toolbar, className }: ListPageShellProps) {
  return (
    <section className={['workspace-panel', 'list-panel', className].filter(Boolean).join(' ')}>
      <div className="panel-heading toolbar-heading">
        <PanelTitle icon={icon} title={title} />
        {toolbar}
      </div>
      {children}
    </section>
  )
}
