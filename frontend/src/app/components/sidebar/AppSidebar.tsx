import { ChevronDown, ChevronRight, LayoutDashboard, LockKeyhole } from 'lucide-react'
import type { MenuItem } from '../../../api'
import { lockedWorkflowPaths } from '../../pages/appHelpers'
import { t } from '../../App'
import type { SidebarGroup, SidebarItem } from '../../App'

type Props = {
  activePath: string
  dashboardMenu?: MenuItem | null
  sidebarMenuGroups: SidebarGroup[]
  onNavigate: (path: string) => void
}

function isActive(menuPath: string, activePath: string) {
  return activePath === menuPath || activePath.startsWith(menuPath + '/')
}

export function AppSidebar({ activePath, dashboardMenu, sidebarMenuGroups, onNavigate }: Props) {
  const isDashboardActive = activePath === '/'

  return (
    <aside className="react-sidebar">
      <div className="brand" aria-label={`${t('app.brandName')} ${t('app.productName')}`}>
        <div className="brand-wordmark" aria-label="D-DUTCH">D-DUTCH</div>
        <div>
          <strong>{t('app.brandName')}</strong>
          <span>{t('app.productName')}</span>
        </div>
      </div>

      <nav className="react-nav" aria-label="主导航">
        {dashboardMenu ? (
          <a
            aria-current={isDashboardActive ? 'page' : undefined}
            className={isDashboardActive ? 'nav-link nav-dashboard active' : 'nav-link nav-dashboard'}
            href={dashboardMenu.path}
            onClick={(e) => { e.preventDefault(); onNavigate(dashboardMenu.path) }}
          >
            <LayoutDashboard className="nav-link-icon" size={17} strokeWidth={2} />
            <span>{dashboardMenu.label}</span>
          </a>
        ) : null}

        <div className="nav-groups" aria-label={t('page.businessModule')}>
          {sidebarMenuGroups.map((group) => {
            const GroupIcon = group.icon
            const isGroupActive = group.items.some((item) => !lockedWorkflowPaths.has(item.path) && isActive(item.path, activePath))
            return (
              <details className="nav-group" key={group.id} open={isGroupActive || undefined}>
                <summary className="nav-group-summary">
                  <GroupIcon size={16} strokeWidth={2} />
                  <span>{group.label}</span>
                  <ChevronDown className="nav-group-chevron" size={15} />
                </summary>
                <div className="nav-group-items">
                  {group.items.map((item) => {
                    const isLocked = lockedWorkflowPaths.has(item.path)
                    const hasChildren = item.children && item.children.length > 0
                    const active = !isLocked && isActive(item.path, activePath)
                    const childActive = hasChildren && item.children!.some((child) => isActive(child.path, activePath))
                    const Icon = item.icon ? item.icon as unknown as React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }> : LayoutDashboard

                    if (isLocked) {
                      return (
                        <button key={item.id} aria-disabled="true" className="nav-link nav-link-locked" title={`${item.label} 暂不进入主流程`} type="button" disabled>
                          <Icon className="nav-link-icon" size={16} strokeWidth={2} />
                          <span>{item.label}</span>
                          <LockKeyhole className="nav-lock-icon" size={13} strokeWidth={2.2} />
                        </button>
                      )
                    }

                    if (hasChildren) {
                      return (
                        <details className="nav-submenu" key={item.id} open={childActive || undefined}>
                          <summary
                            className="nav-link nav-link-parent"
                            onClick={(e) => {
                              const details = (e.currentTarget as HTMLElement).parentElement as HTMLDetailsElement
                              // If currently closed, native toggle will open it; navigate to parent
                              // If currently open, native toggle will close it; only navigate if not closing
                              if (details.open) {
                                // about to close — just let it close, no navigation
                                return
                              }
                              // about to open — also navigate to parent (总览)
                              e.preventDefault()
                              details.open = true
                              onNavigate(item.path)
                            }}
                          >
                            <Icon className="nav-link-icon" size={16} strokeWidth={2} />
                            <span>{item.label}</span>
                            <ChevronRight className="nav-submenu-chevron" size={14} />
                          </summary>
                          <div className="nav-submenu-items">
                            {item.children!.map((child) => {
                              const isChildActive = isActive(child.path, activePath)
                              return (
                                <a
                                  key={child.path}
                                  className={isChildActive ? 'nav-link nav-child active' : 'nav-link nav-child'}
                                  href={child.path}
                                  onClick={(e) => { e.preventDefault(); onNavigate(child.path) }}
                                >
                                  <span>{child.label}</span>
                                </a>
                              )
                            })}
                          </div>
                        </details>
                      )
                    }

                    return (
                      <a key={item.id} aria-current={active ? 'page' : undefined} className={active ? 'nav-link active' : 'nav-link'} href={item.path} onClick={(e) => { e.preventDefault(); onNavigate(item.path) }}>
                        <Icon className="nav-link-icon" size={16} strokeWidth={2} />
                        <span>{item.label}</span>
                      </a>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
