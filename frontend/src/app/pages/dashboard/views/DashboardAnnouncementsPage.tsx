import { Skeleton } from 'antd'
import { Search } from 'lucide-react'
import type { Dashboard } from '@/api'
import { PanelTitle } from '@/shared/ui'
import { t } from '@/app/appI18n'
import { formatDate } from '@/app/pages/appHelpers'

export function DashboardAnnouncementsPage({
  dashboard,
  loading,
}: {
  dashboard: Dashboard | null
  loading: boolean
}) {
  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const announcements = dashboard?.announcements ?? []

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<Search size={18} />} title={t('dashboard.companyAnnouncements')} />
          <span className="dashboard-section-count">{announcements.length}</span>
        </div>
        {announcements.length ? (
          <div className="dashboard-announcement-list">
            {announcements.map((announcement) => (
              <article className="dashboard-announcement-card" key={announcement.id}>
                <time dateTime={announcement.published_at}>
                  {formatDate(announcement.published_at)}
                </time>
                <div>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.content}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">{t('dashboard.noAnnouncements')}</div>
        )}
      </section>
    </section>
  )
}
