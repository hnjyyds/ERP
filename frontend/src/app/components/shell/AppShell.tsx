import type { ComponentProps } from 'react'

import type { AuthSession, Dashboard, MenuItem } from '../../../api'
import { dashboardPath } from '../../routes'
import { AppRouter } from '../router/AppRouter'
import { SettingsModal } from '../settings/SettingsModal'
import { AppSidebar } from '../sidebar/AppSidebar'
import { AppTopbar } from '../topbar/AppTopbar'
import type { SidebarGroup } from '../sidebar/sidebarNavigation'

type Props = {
  activePath: string
  session: AuthSession
  dashboard: Dashboard | null
  loadingDashboard: boolean
  activeMenu: MenuItem | null
  error: string
  sidebarMenuGroups: SidebarGroup[]
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
  onRefreshDashboard: () => Promise<void>
  onOpenSettings: () => void
  settings: ComponentProps<typeof SettingsModal>
}

export function AppShell({
  activePath,
  session,
  dashboard,
  loadingDashboard,
  activeMenu,
  error,
  sidebarMenuGroups,
  canNavigatePath,
  onNavigate,
  onRefreshDashboard,
  onOpenSettings,
  settings,
}: Props) {
  return (
    <>
      <main
        className={activePath === dashboardPath ? 'react-shell react-shell-home' : 'react-shell'}
      >
        <AppSidebar
          activePath={activePath}
          dashboardMenu={session.menus.find((m) => m.path === dashboardPath) ?? null}
          sidebarMenuGroups={sidebarMenuGroups}
          onNavigate={onNavigate}
        />
        <section className="react-workspace">
          <AppTopbar
            activePath={activePath}
            activeMenu={activeMenu}
            error={error}
            onOpenSettings={onOpenSettings}
          />
          <AppRouter
            activePath={activePath}
            session={session}
            dashboard={dashboard}
            loadingDashboard={loadingDashboard}
            activeMenu={activeMenu}
            onNavigate={onNavigate}
            onRefreshDashboard={onRefreshDashboard}
            canNavigatePath={canNavigatePath}
          />
        </section>
      </main>

      <SettingsModal {...settings} />
    </>
  )
}
