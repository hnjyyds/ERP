import { useEffect, useState } from 'react'
import {
  BarChart3,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Factory,
  FilePenLine,
  FileStack,
  FileText,
  FlaskConical,
  Handshake,
  Images,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Package,
  Search,
  Send,
  Settings,
  Users,
  Wallet,
  Warehouse,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { MenuItem } from '../../../api'
import { lockedWorkflowPaths } from '../../pages/appHelpers'
import { t } from '../../appI18n'
import type { SidebarGroup, SidebarItem as _SidebarItem } from './sidebarNavigation'

type Props = {
  activePath: string
  dashboardMenu?: MenuItem | null
  sidebarMenuGroups: SidebarGroup[]
  onNavigate: (path: string) => void
}

function isActive(menuPath: string, activePath: string) {
  return activePath === menuPath || activePath.startsWith(menuPath + '/')
}

const menuIcons: Record<string, LucideIcon> = {
  'bar-chart-3': BarChart3,
  'calendar-clock': CalendarClock,
  'check-circle': CheckCircle,
  'clipboard-check': ClipboardCheck,
  factory: Factory,
  'file-pen-line': FilePenLine,
  'file-stack': FileStack,
  'file-text': FileText,
  'flask-conical': FlaskConical,
  handshake: Handshake,
  images: Images,
  package: Package,
  search: Search,
  send: Send,
  settings: Settings,
  users: Users,
  wallet: Wallet,
  warehouse: Warehouse,
}

function getLockedState(groupId: string) {
  if (groupId === 'legacyPurchase') {
    return {
      label: '暂缓',
      description: '该功能已列入暂缓模块，当前暂不开放',
    }
  }
  return {
    label: '非主流程',
    description: '该功能当前不纳入主业务流程',
  }
}

export function AppSidebar({ activePath, dashboardMenu, sidebarMenuGroups, onNavigate }: Props) {
  const isDashboardActive = activePath === '/'
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileOpen])

  function navigate(path: string) {
    setMobileOpen(false)
    onNavigate(path)
  }

  return (
    <aside className={mobileOpen ? 'react-sidebar is-mobile-open' : 'react-sidebar'}>
      <div className="sidebar-header">
        <div className="brand" aria-label={`${t('app.brandName')} ${t('app.productName')}`}>
          <div className="brand-wordmark" aria-label="D-DUTCH">D-DUTCH</div>
          <div>
            <strong>{t('app.brandName')}</strong>
            <span>{t('app.productName')}</span>
          </div>
        </div>
        <button
          aria-controls="app-primary-navigation"
          aria-expanded={mobileOpen}
          aria-label="业务导航"
          className="mobile-nav-toggle"
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
          <span>{mobileOpen ? '收起' : '导航'}</span>
        </button>
      </div>

      <nav id="app-primary-navigation" className="react-nav" aria-label="主导航">
        {dashboardMenu ? (
          <a
            aria-current={isDashboardActive ? 'page' : undefined}
            className={isDashboardActive ? 'nav-link nav-dashboard active' : 'nav-link nav-dashboard'}
            href={dashboardMenu.path}
            onClick={(e) => { e.preventDefault(); navigate(dashboardMenu.path) }}
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
                    const Icon = menuIcons[item.icon] ?? LayoutDashboard

                    if (isLocked) {
                      const lockedState = getLockedState(group.id)
                      return (
                        <span
                          key={item.id}
                          aria-disabled="true"
                          aria-label={`${item.label}，${lockedState.description}`}
                          className="nav-link nav-link-locked"
                          role="link"
                          tabIndex={0}
                          title={lockedState.description}
                        >
                          <Icon className="nav-link-icon" size={16} strokeWidth={2} />
                          <span className="nav-link-label">{item.label}</span>
                          <span className="nav-state-label">{lockedState.label}</span>
                          <LockKeyhole aria-hidden="true" className="nav-lock-icon" size={13} strokeWidth={2.2} />
                        </span>
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
                              navigate(item.path)
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
                                  onClick={(e) => { e.preventDefault(); navigate(child.path) }}
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
                      <a key={item.id} aria-current={active ? 'page' : undefined} className={active ? 'nav-link active' : 'nav-link'} href={item.path} onClick={(e) => { e.preventDefault(); navigate(item.path) }}>
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
