import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { NotificationItem } from '@/api'

vi.mock('@/app/appI18n', () => ({
  t: (key: string) => key,
}))

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    markAllNotificationsRead: vi.fn(),
    markNotificationRead: vi.fn(),
  }
})

import { markAllNotificationsRead, markNotificationRead } from '@/api'
import { NotificationBell } from '@/app/components/topbar/NotificationBell'

function notification(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'n-1',
    owner_user_id: 'user-1',
    title: '审批通知',
    message: '演示业务主管 提交了报价 QT-1，请及时审批',
    severity: 'info',
    source_type: 'export_quotation',
    source_id: 'quotation-1',
    event: 'approval.submitted',
    target_path: '/sales/quotations?q=QT-1',
    is_read: false,
    read_at: null,
    created_at: '2026-11-09T08:00:00Z',
    ...overrides,
  }
}

const onNavigate = vi.fn()
const onRefresh = vi.fn().mockResolvedValue(undefined)

function renderBell(items: NotificationItem[], canNavigatePath = () => true) {
  render(
    <NotificationBell
      canNavigatePath={canNavigatePath}
      notifications={items}
      unreadCount={items.filter((item) => !item.is_read).length}
      onNavigate={onNavigate}
      onRefresh={onRefresh}
    />,
  )
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the document and marks the notification read', async () => {
    const user = userEvent.setup()
    renderBell([notification()])

    await user.click(screen.getByRole('button', { name: 'dashboard.notificationPanel' }))
    await user.click(screen.getByText('审批通知'))

    expect(markNotificationRead).toHaveBeenCalledWith('n-1')
    expect(onNavigate).toHaveBeenCalledWith('/sales/quotations?q=QT-1')
  })

  it('falls back to the notification page when the target is not allowed', async () => {
    const user = userEvent.setup()
    renderBell([notification()], () => false)

    await user.click(screen.getByRole('button', { name: 'dashboard.notificationPanel' }))
    await user.click(screen.getByText('审批通知'))

    expect(onNavigate).toHaveBeenCalledWith('/workspace/notifications')
  })

  it('marks all notifications as read', async () => {
    const user = userEvent.setup()
    renderBell([notification()])

    await user.click(screen.getByRole('button', { name: 'dashboard.notificationPanel' }))
    await user.click(screen.getByRole('button', { name: 'dashboard.markAllRead' }))

    expect(markAllNotificationsRead).toHaveBeenCalledTimes(1)
  })
})
