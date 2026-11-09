import { Alert } from 'antd'
import { Settings } from 'lucide-react'
import type { MenuItem, NotificationItem } from '@/api'
import { pageTitle } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { NotificationBell } from './NotificationBell'

type Props = {
  activePath: string
  activeMenu: MenuItem | null
  error: string
  notifications: NotificationItem[]
  unreadCount: number
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
  onRefreshDashboard: () => Promise<void>
  onOpenSettings: () => void
}

export function AppTopbar({
  activePath,
  activeMenu,
  error,
  notifications,
  unreadCount,
  canNavigatePath,
  onNavigate,
  onRefreshDashboard,
  onOpenSettings,
}: Props) {
  return (
    <>
      <header className="react-topbar">
        <div>
          <p className="eyebrow">{t('page.businessModule')}</p>
          <h1>{pageTitle(activePath, activeMenu)}</h1>
        </div>
        <div className="react-topbar-actions">
          <NotificationBell
            canNavigatePath={canNavigatePath}
            notifications={notifications}
            unreadCount={unreadCount}
            onNavigate={onNavigate}
            onRefresh={onRefreshDashboard}
          />
          <button aria-label={t('settings.open')} className="topbar-settings-button" title={t('settings.open')} type="button" onClick={onOpenSettings}>
            <Settings size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}
    </>
  )
}
