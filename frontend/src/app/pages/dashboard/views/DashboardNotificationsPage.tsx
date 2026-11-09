import { Skeleton, Tag } from 'antd'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  type Dashboard,
  type NotificationItem,
} from '@/api'
import { PanelTitle } from '@/shared/ui'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { severityTag } from '@/app/pages/appHelpers'

export function DashboardNotificationsPage({
  dashboard,
  loading,
  onRefresh,
  canNavigatePath,
  onNavigate,
}: {
  dashboard: Dashboard | null
  loading: boolean
  onRefresh: () => Promise<void>
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
}) {
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const notifications = dashboard?.notifications ?? []
  const unreadCount = dashboard?.summary.unread_notification_count ?? 0

  async function runAction(
    key: string,
    action: () => Promise<void>,
    message: string,
  ) {
    setBusyAction(key)
    setActionMessage('')
    setActionError('')
    try {
      await action()
      setActionMessage(message)
      await onRefresh()
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  async function openNotification(notification: NotificationItem) {
    if (!notification.is_read) {
      await markNotificationRead(notification.id)
    }
    if (notification.target_path && canNavigatePath(notification.target_path)) {
      onNavigate(notification.target_path)
    }
  }

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<Bell size={18} />} title={t('dashboard.messages')} />
          <div className="dashboard-reminder-actions">
            <span className="dashboard-section-count">{notifications.length}</span>
            <button
              className="table-action"
              disabled={busyAction === 'read-all' || unreadCount === 0}
              type="button"
              onClick={() =>
                void runAction(
                  'read-all',
                  async () => {
                    await markAllNotificationsRead()
                  },
                  t('dashboard.notificationHandled'),
                )
              }
            >
              {t('dashboard.markAllRead')}
            </button>
          </div>
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
                      onClick={() =>
                        void runAction(
                          `notification-${notification.id}`,
                          async () => {
                            await markNotificationRead(notification.id)
                          },
                          t('dashboard.notificationHandled'),
                        )
                      }
                    >
                      {t('dashboard.handle')}
                    </button>
                  )}
                  {notification.target_path ? (
                    <button
                      className="table-action"
                      disabled={busyAction === `open-${notification.id}`}
                      type="button"
                      onClick={() =>
                        void runAction(
                          `open-${notification.id}`,
                          async () => openNotification(notification),
                          '',
                        )
                      }
                    >
                      {t('dashboard.viewDocument')}
                    </button>
                  ) : null}
                  <button
                    className="table-action"
                    disabled={busyAction === `delete-${notification.id}`}
                    type="button"
                    onClick={() =>
                      void runAction(
                        `delete-${notification.id}`,
                        async () => {
                          await deleteNotification(notification.id)
                        },
                        t('dashboard.notificationDeleted'),
                      )
                    }
                  >
                    {t('dashboard.deleteNotification')}
                  </button>
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
