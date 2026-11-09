import { Badge, Popover } from 'antd'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { markAllNotificationsRead, markNotificationRead, type NotificationItem } from '@/api'
import { dashboardNotificationsPath } from '@/app/routes'
import { t } from '@/app/appI18n'
import { showError } from '@/shared/errors'

const PREVIEW_SIZE = 5

type Props = {
  notifications: NotificationItem[]
  unreadCount: number
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
  onRefresh: () => Promise<void>
}

export function NotificationBell({
  notifications,
  unreadCount,
  canNavigatePath,
  onNavigate,
  onRefresh,
}: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const preview = notifications.slice(0, PREVIEW_SIZE)

  async function openNotification(notification: NotificationItem) {
    setBusy(true)
    try {
      if (!notification.is_read) {
        await markNotificationRead(notification.id)
      }
      const target = notification.target_path
      onNavigate(target && canNavigatePath(target) ? target : dashboardNotificationsPath)
      setOpen(false)
      await onRefresh()
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function readAll() {
    setBusy(true)
    try {
      await markAllNotificationsRead()
      await onRefresh()
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusy(false)
    }
  }

  const content = (
    <div className="topbar-notification-panel">
      <div className="topbar-notification-head">
        <strong>{t('dashboard.notificationPanel')}</strong>
        <button disabled={busy || unreadCount === 0} type="button" onClick={() => void readAll()}>
          {t('dashboard.markAllRead')}
        </button>
      </div>
      {preview.length ? (
        <ul className="topbar-notification-list">
          {preview.map((notification) => (
            <li key={notification.id}>
              <button
                className="topbar-notification-item"
                disabled={busy}
                type="button"
                onClick={() => void openNotification(notification)}
              >
                <strong>
                  {notification.is_read ? null : <i className="topbar-notification-dot" />}
                  {notification.title}
                </strong>
                <span>{notification.message}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="topbar-notification-empty">{t('dashboard.noNotifications')}</div>
      )}
      <button
        className="topbar-notification-all"
        type="button"
        onClick={() => {
          setOpen(false)
          onNavigate(dashboardNotificationsPath)
        }}
      >
        {t('dashboard.viewAllNotifications')}
      </button>
    </div>
  )

  return (
    <Popover
      content={content}
      open={open}
      placement="bottomRight"
      trigger="click"
      onOpenChange={(next) => {
        setOpen(next)
        if (next) void onRefresh()
      }}
    >
      <button
        aria-label={t('dashboard.notificationPanel')}
        className="topbar-settings-button topbar-bell-button"
        title={t('dashboard.notificationPanel')}
        type="button"
      >
        <Badge count={unreadCount} offset={[-2, 2]} size="small">
          <Bell size={22} strokeWidth={2} />
        </Badge>
      </button>
    </Popover>
  )
}
