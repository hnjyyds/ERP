import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the t function from appI18n
vi.mock('../../appI18n', () => ({
  t: (key: string) => key,
}))

import { DashboardPage, DashboardTodosPage } from '../dashboard/DashboardPage'

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

  it('labels super-admin business tasks as global on dashboard and full list', () => {
    render(<DashboardPage {...defaultProps} />)
    expect(screen.getByText('dashboard.globalTodos')).toBeInTheDocument()
    expect(screen.queryByText('dashboard.myTodos')).not.toBeInTheDocument()

    render(
      <DashboardTodosPage
        currentUser={mockCurrentUser}
        dashboard={emptyDashboard}
        loading={false}
        canNavigatePath={() => true}
        onNavigate={vi.fn()}
      />,
    )
    expect(screen.getAllByText('dashboard.globalTodos')).toHaveLength(2)
  })

  it('keeps personal todo labels for regular users', () => {
    const regularUser = { ...mockCurrentUser, permissions: ['dashboard:view'] }
    render(<DashboardPage {...defaultProps} currentUser={regularUser} />)
    expect(screen.getByText('dashboard.myTodos')).toBeInTheDocument()

    render(
      <DashboardTodosPage
        currentUser={regularUser}
        dashboard={emptyDashboard}
        loading={false}
        canNavigatePath={() => true}
        onNavigate={vi.fn()}
      />,
    )
    expect(screen.getAllByText('dashboard.myTodos')).toHaveLength(2)
  })

  it('filters the todo list by task title or business context', async () => {
    const dashboard = {
      ...emptyDashboard,
      todos: [
        {
          id: 'purchase-followup-1',
          owner_user_id: 'user-1',
          owner_user_name: 'Admin',
          creator_user_id: 'creator-1',
          creator_user_name: '采购主管',
          title: '采购跟单 PC-001',
          content: '贝斯特针织',
          source_type: 'followup_plan',
          source_id: 'followup-plan-1',
          due_at: '2026-08-07T09:00:00',
          status: 'pending',
          assignment_type: 'assigned' as const,
        },
        {
          id: 'quality-task-1',
          owner_user_id: 'user-1',
          owner_user_name: 'Admin',
          creator_user_id: 'creator-2',
          creator_user_name: 'QC 主管',
          title: 'QC 查验 QC-001',
          content: '新裴辅料供应商',
          source_type: 'quality_inspection',
          source_id: 'quality-task-1',
          due_at: '2026-08-08T09:00:00',
          status: 'pending',
          assignment_type: 'assigned' as const,
        },
      ],
    }

    render(
      <DashboardTodosPage
        currentUser={mockCurrentUser}
        dashboard={dashboard}
        loading={false}
        canNavigatePath={() => true}
        onNavigate={vi.fn()}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText('dashboard.todoSearchPlaceholder'), '贝斯特')
    expect(screen.getByText('采购跟单 PC-001')).toBeInTheDocument()
    expect(screen.queryByText('QC 查验 QC-001')).not.toBeInTheDocument()
  })

  it('uses a scope switch instead of showing assigned and self-created tasks side by side', async () => {
    const dashboard = {
      ...emptyDashboard,
      todos: [
        {
          id: 'assigned-task-1',
          owner_user_id: 'user-1',
          owner_user_name: 'Admin',
          creator_user_id: 'creator-1',
          creator_user_name: '采购主管',
          title: '系统分配任务',
          content: '业务上下文',
          source_type: 'followup_plan',
          source_id: 'followup-plan-1',
          due_at: '2026-08-07T09:00:00',
          status: 'pending',
          assignment_type: 'assigned' as const,
        },
        {
          id: 'self-task-1',
          owner_user_id: 'user-1',
          owner_user_name: 'Admin',
          creator_user_id: 'user-1',
          creator_user_name: 'Admin',
          title: '我创建的任务',
          content: '个人提醒',
          source_type: 'manual',
          source_id: null,
          due_at: null,
          status: 'pending',
          assignment_type: 'self' as const,
        },
      ],
    }

    render(
      <DashboardTodosPage
        currentUser={mockCurrentUser}
        dashboard={dashboard}
        loading={false}
        canNavigatePath={() => true}
        onNavigate={vi.fn()}
      />,
    )

    expect(screen.getByText('系统分配任务')).toBeInTheDocument()
    expect(screen.queryByText('我创建的任务')).not.toBeInTheDocument()
    await userEvent.click(screen.getByText(/todo\.selfCreated/))
    expect(screen.queryByText('系统分配任务')).not.toBeInTheDocument()
    expect(screen.getByText('我创建的任务')).toBeInTheDocument()
  })

  it('makes overdue tasks explicit in the list', () => {
    const dashboard = {
      ...emptyDashboard,
      todos: [
        {
          id: 'overdue-task-1',
          owner_user_id: 'user-1',
          owner_user_name: 'Admin',
          creator_user_id: 'creator-1',
          creator_user_name: '采购主管',
          title: '已逾期采购跟单',
          content: '供应商待确认',
          source_type: 'followup_plan',
          source_id: 'followup-plan-1',
          due_at: '2020-01-01T09:00:00',
          status: 'pending',
          assignment_type: 'assigned' as const,
        },
      ],
    }

    render(
      <DashboardTodosPage
        currentUser={mockCurrentUser}
        dashboard={dashboard}
        loading={false}
        canNavigatePath={() => true}
        onNavigate={vi.fn()}
      />,
    )

    expect(screen.getByText('dashboard.overdue')).toBeInTheDocument()
  })

  it('prioritizes overdue and due-today work over later tasks on the workbench', () => {
    const dashboard = {
      ...emptyDashboard,
      todos: [
        {
          id: 'future-task-1', owner_user_id: 'user-1', owner_user_name: 'Admin', creator_user_id: null,
          creator_user_name: null, title: '未来任务一', content: '未来业务', source_type: 'manual', source_id: null,
          due_at: '2099-01-01T09:00:00', status: 'pending', assignment_type: 'assigned' as const,
        },
        {
          id: 'future-task-2', owner_user_id: 'user-1', owner_user_name: 'Admin', creator_user_id: null,
          creator_user_name: null, title: '未来任务二', content: '未来业务', source_type: 'manual', source_id: null,
          due_at: '2099-01-02T09:00:00', status: 'pending', assignment_type: 'assigned' as const,
        },
        {
          id: 'overdue-task', owner_user_id: 'owner-2', owner_user_name: '采购员张敏', creator_user_id: null,
          creator_user_name: null, title: '逾期采购确认', content: '供应商交期待确认', source_type: 'followup_plan', source_id: 'plan-1',
          due_at: '2020-01-01T09:00:00', status: 'pending', assignment_type: 'assigned' as const,
        },
        {
          id: 'future-task-3', owner_user_id: 'user-1', owner_user_name: 'Admin', creator_user_id: null,
          creator_user_name: null, title: '未来任务三', content: '未来业务', source_type: 'manual', source_id: null,
          due_at: '2099-01-03T09:00:00', status: 'pending', assignment_type: 'assigned' as const,
        },
      ],
    }

    render(<DashboardPage {...defaultProps} dashboard={dashboard} />)

    expect(screen.getByText('今日优先处理')).toBeInTheDocument()
    expect(screen.getByText('逾期采购确认')).toBeInTheDocument()
    expect(screen.getByText('逾期 1')).toBeInTheDocument()
    expect(screen.getByText('todo.followup')).toBeInTheDocument()
    expect(screen.getByText('负责人：采购员张敏')).toBeInTheDocument()
    expect(screen.queryByText('未来任务三')).not.toBeInTheDocument()
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

  it('offers a direct next step from each workbench empty state', () => {
    render(<DashboardPage {...defaultProps} />)

    const emptyTodo = screen.getByText('dashboard.noTodos').closest('.dashboard-empty')
    const emptySchedule = screen.getByText('dashboard.noSchedules').closest('.dashboard-empty')
    const emptyMessages = screen.getByText('dashboard.noNotifications').closest('.dashboard-empty')
    const emptyAnnouncements = screen.getByText('dashboard.noAnnouncements').closest('.dashboard-empty')

    expect(within(emptyTodo as HTMLElement).getByText('dashboard.addTodo')).toBeInTheDocument()
    expect(within(emptySchedule as HTMLElement).getByText('dashboard.addSchedule')).toBeInTheDocument()
    expect(within(emptyMessages as HTMLElement).getByText('common.viewAll')).toBeInTheDocument()
    expect(within(emptyAnnouncements as HTMLElement).getByText('dashboard.publishAnnouncement')).toBeInTheDocument()
  })

  it('orders workbench content by action priority and uses a document icon for announcements', () => {
    const { container } = render(<DashboardPage {...defaultProps} />)
    const sectionTitles = [
      screen.getByText('今日优先处理'),
      screen.getByText('dashboard.mySchedule'),
      screen.getByText('dashboard.messages'),
      screen.getByText('dashboard.companyAnnouncements'),
    ]

    sectionTitles.slice(0, -1).forEach((title, index) => {
      expect(title.compareDocumentPosition(sectionTitles[index + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
    const announcementHeading = screen.getByText('dashboard.companyAnnouncements').closest('.dashboard-panel-heading')
    expect(announcementHeading?.querySelector('.lucide-file-text')).toBeTruthy()
    expect(container.querySelector('.dashboard-announcements-panel .lucide-search')).toBeFalsy()
  })

  it('renders toolbar buttons', () => {
    render(<DashboardPage {...defaultProps} />)

    expect(screen.getAllByText('dashboard.addSchedule').length).toBeGreaterThan(0)
    expect(screen.getAllByText('dashboard.publishAnnouncement').length).toBeGreaterThan(0)
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
    expect(onNavigate).toHaveBeenCalledWith(
      '/purchase/followup/followup-plan-1/followup-node-1',
    )
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
