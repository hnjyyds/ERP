import { Skeleton, Tag } from 'antd'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { markNotificationRead, type Dashboard, type NotificationItem } from '@/api'
import { PanelTitle } from '@/shared/ui'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { severityTag } from '@/app/pages/appHelpers'

export function DashboardNotificationsPage({
  dashboard,
  loading,
  onRefresh,
}: {
  dashboard: Dashboard | null
  loading: boolean
  onRefresh: () => Promise<void>
}) {
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const notifications = dashboard?.notifications ?? []

  async function readNotification(notification: NotificationItem) {
    setBusyAction(`notification-${notification.id}`)
    setActionMessage('')
    setActionError('')
    try {
      await markNotificationRead(notification.id)
      setActionMessage(t('dashboard.notificationHandled'))
      await onRefresh()
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<Bell size={18} />} title={t('dashboard.messages')} />
          <span className="dashboard-section-count">{notifications.length}</span>
        </div>
        {notifications.length ? (
          <div className="dashboard-reminder-list">
            {notifications.map((notification) => (
              <article className="dashboard-reminder" key={notification.id}>
                <div>
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                </div>
                <div className="dashboard-reminder-actions">
                  {severityTag(notification.severity)}
                  {notification.is_read ? (
                    <Tag color="green">{t('dashboard.read')}</Tag>
                  ) : (
                    <button
                      className="table-action"
                      disabled={busyAction === `notification-${notification.id}`}
                      type="button"
                      onClick={() => void readNotification(notification)}
                    >
                      {t('dashboard.handle')}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">{t('dashboard.noNotifications')}</div>
        )}
      </section>
    </section>
  )
}
