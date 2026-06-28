import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the t function from App
vi.mock('../../App', () => ({
  t: (key: string) => key,
}))

import { DashboardPage } from '../dashboard/DashboardPage'

const mockCurrentUser = {
  id: 'user-1',
  username: 'admin',
  display_name: 'Admin',
  department_name: 'IT',
  avatar_type: 'preset' as const,
  avatar_value: 'default',
  permissions: ['system:super_admin'],
  is_active: true,
}

const emptyDashboard = {
  summary: {
    announcement_count: 0,
    todo_count: 0,
    unread_notification_count: 0,
    today_schedule_count: 0,
  },
  todos: [],
  notifications: [],
  schedule_events: [],
  announcements: [],
}

const defaultProps = {
  currentUser: mockCurrentUser,
  dashboard: emptyDashboard,
  loading: false,
  canNavigatePath: () => true,
  onNavigate: vi.fn(),
  onRefresh: vi.fn().mockResolvedValue(undefined),
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<DashboardPage {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('shows skeleton when loading with no dashboard data', () => {
    const { container } = render(
      <DashboardPage {...defaultProps} loading={true} dashboard={null} />,
    )
    expect(container.querySelector('.ant-skeleton')).toBeTruthy()
  })

  it('renders metric strip with correct labels', () => {
    render(<DashboardPage {...defaultProps} />)

    expect(screen.getByText('dashboard.announcement')).toBeInTheDocument()
    expect(screen.getByText('dashboard.todo')).toBeInTheDocument()
    expect(screen.getByText('dashboard.unreadNotifications')).toBeInTheDocument()
    expect(screen.getByText('dashboard.todaySchedule')).toBeInTheDocument()
  })

  it('renders empty state messages when no data', () => {
    render(<DashboardPage {...defaultProps} />)

    expect(screen.getByText('dashboard.noTodos')).toBeInTheDocument()
    expect(screen.getByText('dashboard.noNotifications')).toBeInTheDocument()
    expect(screen.getByText('dashboard.noSchedules')).toBeInTheDocument()
    expect(screen.getByText('dashboard.noAnnouncements')).toBeInTheDocument()
  })

  it('renders toolbar buttons', () => {
    render(<DashboardPage {...defaultProps} />)

    expect(screen.getByText('dashboard.addSchedule')).toBeInTheDocument()
    expect(screen.getByText('dashboard.publishAnnouncement')).toBeInTheDocument()
  })

  it('navigates when clicking metric cards', async () => {
    const onNavigate = vi.fn()
    render(<DashboardPage {...defaultProps} onNavigate={onNavigate} />)

    const todoMetric = screen.getByText('dashboard.todo')
    await userEvent.click(todoMetric)
    expect(onNavigate).toHaveBeenCalled()
  })
})
