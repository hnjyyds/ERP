import React, { Suspense } from 'react'
import { Skeleton } from 'antd'
import type { AuthSession, Dashboard, MenuItem } from '@/api'
import { PageErrorBoundary } from '@/app/components/PageErrorBoundary'
import { resolvePageRenderer } from '@/app/components/router/pageRegistry'

const AccessDeniedPage = React.lazy(() =>
  import('@/app/pages/reporting/ReportingPage').then((m) => ({ default: m.AccessDeniedPage })),
)

type Props = {
  activePath: string
  session: AuthSession
  dashboard: Dashboard | null
  loadingDashboard: boolean
  activeMenu: MenuItem | null
  onNavigate: (path: string) => void
  onRefreshDashboard: () => Promise<void>
  canNavigatePath: (path: string) => boolean
}

export function AppRouter({
  activePath,
  session,
  dashboard,
  loadingDashboard,
  activeMenu: _activeMenu,
  onNavigate,
  onRefreshDashboard,
  canNavigatePath,
}: Props) {
  const canAccessActivePath = canNavigatePath(activePath)
  const renderPage = canAccessActivePath ? resolvePageRenderer(activePath) : null

  return (
    <PageErrorBoundary pageKey={activePath}>
      <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
        {renderPage ? (
          renderPage({
            activePath,
            session,
            dashboard,
            loadingDashboard,
            onNavigate,
            onRefreshDashboard,
            canNavigatePath,
          })
        ) : (
          <AccessDeniedPage />
        )}
      </Suspense>
    </PageErrorBoundary>
  )
}
