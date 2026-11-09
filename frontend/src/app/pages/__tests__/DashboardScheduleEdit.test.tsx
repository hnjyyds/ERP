import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Dashboard, ScheduleEvent } from '@/api'

vi.mock('@/app/appI18n', () => ({
  t: (key: string) => key,
}))

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    deleteScheduleEvent: vi.fn(),
    updateScheduleEvent: vi.fn(),
  }
})

import { updateScheduleEvent } from '@/api'
import { DashboardSchedulesPage } from '@/app/pages/dashboard/views/DashboardSchedulesPage'

const schedule: ScheduleEvent = {
  id: 'schedule-1',
  owner_user_id: 'u-001',
  title: '周会',
  description: '原备注',
  starts_at: '2026-06-20T02:00:00Z',
  ends_at: '2026-06-20T03:00:00Z',
  created_at: '2026-06-19T02:00:00Z',
}

const dashboard: Dashboard = {
  announcements: [],
  todos: [],
  notifications: [],
  schedule_events: [schedule],
  shortcuts: [],
  summary: {
    announcement_count: 0,
    todo_count: 0,
    unread_notification_count: 0,
    today_schedule_count: 1,
    shortcut_count: 0,
  },
}

const onRefresh = vi.fn().mockResolvedValue(undefined)

function renderPage() {
  return render(<DashboardSchedulesPage dashboard={dashboard} loading={false} onRefresh={onRefresh} />)
}

async function openEditModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '周会' }))
  await user.click(screen.getByRole('button', { name: 'dashboard.editSchedule' }))
  const dialogs = screen.getAllByRole('dialog')
  return within(dialogs[dialogs.length - 1])
}

describe('DashboardSchedulesPage edit', () => {
  beforeEach(() => {
    vi.mocked(updateScheduleEvent).mockReset()
    vi.mocked(updateScheduleEvent).mockResolvedValue({ ...schedule, title: '新周会' })
    onRefresh.mockClear()
  })

  it('opens the create form pre-filled and submits a PATCH payload', async () => {
    const user = userEvent.setup()
    renderPage()

    const dialog = await openEditModal(user)
    const titleInput = dialog.getByLabelText('dashboard.title')
    expect(titleInput).toHaveValue('周会')
    await user.clear(titleInput)
    await user.type(titleInput, '新周会')
    await user.click(dialog.getByRole('button', { name: 'dashboard.saveSchedule' }))

    expect(updateScheduleEvent).toHaveBeenCalledTimes(1)
    const [scheduleId, payload] = vi.mocked(updateScheduleEvent).mock.calls[0]
    expect(scheduleId).toBe('schedule-1')
    expect(payload.title).toBe('新周会')
    expect(payload.description).toBe('原备注')
    expect(payload.starts_at).toMatch(/\d{4}-\d{2}-\d{2}T/)
    expect(onRefresh).toHaveBeenCalled()
  })

  it('blocks an end time earlier than the start time before calling the API', async () => {
    const user = userEvent.setup()
    renderPage()

    const dialog = await openEditModal(user)
    await user.clear(dialog.getByLabelText('dashboard.start'))
    await user.type(dialog.getByLabelText('dashboard.start'), '2026-06-20T10:00')
    await user.clear(dialog.getByLabelText('dashboard.end'))
    await user.type(dialog.getByLabelText('dashboard.end'), '2026-06-20T09:00')
    await user.click(dialog.getByRole('button', { name: 'dashboard.saveSchedule' }))

    expect(updateScheduleEvent).not.toHaveBeenCalled()
    expect(screen.getByText('dashboard.scheduleTimeInvalid')).toBeInTheDocument()
  })
})
