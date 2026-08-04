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
  roles: ['admin'],
  permissions: ['system:super_admin'],
  is_active: true,
}

const emptyDashboard = {
  summary: {
    announcement_count: 0,
    todo_count: 0,
    unread_notification_count: 0,
    today_schedule_count: 0,
    shortcut_count: 0,
  },
  todos: [],
  notifications: [],
  schedule_events: [],
  announcements: [],
  shortcuts: [],
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

  it('navigates an assigned QC task to my quality tasks', async () => {
    const onNavigate = vi.fn()
    const qualityDashboard = {
      ...emptyDashboard,
      summary: { ...emptyDashboard.summary, todo_count: 1 },
      todos: [
        {
          id: 'qc-task-1',
          owner_user_id: 'user-1',
          owner_user_name: 'Admin',
          creator_user_id: 'creator-1',
          creator_user_name: null,
          title: 'QC 查验 QC-001',
          content: 'PC-001 / 首期供应商',
          source_type: 'quality_inspection',
          source_id: 'qc-task-1',
          due_at: '2026-08-20T09:30:00',
          status: 'pending',
          assignment_type: 'assigned' as const,
        },
      ],
    }

    render(
      <DashboardPage
        {...defaultProps}
        dashboard={qualityDashboard}
        onNavigate={onNavigate}
      />,
    )

    expect(screen.getByText('QC 查验')).toBeInTheDocument()
    await userEvent.click(screen.getByText('dashboard.goHandle'))
    expect(onNavigate).toHaveBeenCalledWith('/quality/tasks')
  })

  it('navigates an assigned follow-up node to its plan', async () => {
    const onNavigate = vi.fn()
    const followupDashboard = {
      ...emptyDashboard,
      summary: { ...emptyDashboard.summary, todo_count: 1 },
      todos: [
        {
          id: 'followup-node-1',
          owner_user_id: 'user-1',
          owner_user_name: null,
          creator_user_id: null,
          creator_user_name: null,
          title: '采购跟单 PC-001 · 确认样提交',
          content: '首期供应商',
          source_type: 'followup_plan',
          source_id: 'followup-plan-1',
          due_at: '2026-08-07T09:00:00',
          status: 'pending',
          assignment_type: 'assigned' as const,
        },
      ],
    }

    render(
      <DashboardPage
        {...defaultProps}
        dashboard={followupDashboard}
        onNavigate={onNavigate}
      />,
    )

    await userEvent.click(screen.getByText('dashboard.goHandle'))
    expect(onNavigate).toHaveBeenCalledWith('/purchase/followup/followup-plan-1')
  })

  it('navigates an inbound approval task to the assigned order', async () => {
    const onNavigate = vi.fn()
    const inboundDashboard = {
      ...emptyDashboard,
      summary: { ...emptyDashboard.summary, todo_count: 1 },
      todos: [
        {
          id: 'inbound-order-1',
          owner_user_id: 'user-1',
          owner_user_name: 'Admin',
          creator_user_id: 'creator-1',
          creator_user_name: null,
          title: '入库审批 IO-001',
          content: 'PC-001 / 首期供应商 / 宁波总仓',
          source_type: 'warehouse_inbound_approval',
          source_id: 'inbound-order-1',
          due_at: '2026-08-20T09:30:00',
          status: 'pending',
          assignment_type: 'assigned' as const,
        },
      ],
    }

    render(
      <DashboardPage
        {...defaultProps}
        dashboard={inboundDashboard}
        onNavigate={onNavigate}
      />,
    )

    expect(screen.getByText('入库审批')).toBeInTheDocument()
    await userEvent.click(screen.getByText('dashboard.goHandle'))
    expect(onNavigate).toHaveBeenCalledWith('/warehouse/inbound-orders/inbound-order-1')
  })

  it('navigates a payment approval task to its supplier invoice detail', async () => {
    const onNavigate = vi.fn()
    const financeDashboard = {
      ...emptyDashboard,
      summary: { ...emptyDashboard.summary, todo_count: 1 },
      todos: [
        {
          id: 'payment-request-1',
          owner_user_id: 'user-1',
          owner_user_name: 'Admin',
          creator_user_id: 'finance-user-1',
          creator_user_name: null,
          title: '付款审批 PR-001',
          content: '首期供应商 / SI-001',
          source_type: 'finance_payment_approval',
          source_id: 'supplier-invoice-1',
          due_at: null,
          status: 'pending',
          assignment_type: 'assigned' as const,
        },
      ],
    }

    render(
      <DashboardPage
        {...defaultProps}
        dashboard={financeDashboard}
        onNavigate={onNavigate}
      />,
    )

    await userEvent.click(screen.getByText('dashboard.goHandle'))
    expect(onNavigate).toHaveBeenCalledWith(
      '/finance/payments/supplier-invoice-1/payment-request-1',
    )
  })
})
