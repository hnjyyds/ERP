import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from 'antd'
import type { CurrentUser, Dashboard, TodoTask } from '@/api'

vi.mock('@/app/appI18n', () => ({
  t: (key: string) => key,
}))

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    listAssignableUsers: vi.fn(),
    updateTodoTask: vi.fn(),
  }
})

import { listAssignableUsers, updateTodoTask } from '@/api'
import { todoDueState } from '@/app/pages/dashboard/dashboardHelpers'
import { DashboardTodosPage } from '@/app/pages/dashboard/views/DashboardTodosPage'

const currentUser: CurrentUser = {
  id: 'user-1',
  username: 'owner',
  display_name: '负责人',
  department_name: '销售部',
  avatar_type: 'preset',
  avatar_value: '',
  permissions: ['dashboard:view'],
  roles: [],
}

function manualTodo(overrides: Partial<TodoTask> = {}): TodoTask {
  return {
    id: 'todo-1',
    owner_user_id: 'user-1',
    owner_user_name: '负责人',
    creator_user_id: 'user-1',
    creator_user_name: '负责人',
    title: '人工待办',
    content: '人工创建',
    source_type: 'manual',
    source_id: null,
    due_at: null,
    status: 'pending',
    is_overdue: false,
    assignment_type: 'self',
    ...overrides,
  }
}

function buildDashboard(todos: TodoTask[]): Dashboard {
  return {
    announcements: [],
    todos,
    notifications: [],
    schedule_events: [],
    shortcuts: [],
    summary: {
      announcement_count: 0,
      todo_count: todos.length,
      unread_notification_count: 0,
      today_schedule_count: 0,
      shortcut_count: 0,
    },
  }
}

function renderPage(todos: TodoTask[], user: CurrentUser = currentUser) {
  const onRefresh = vi.fn().mockResolvedValue(undefined)
  render(
    <DashboardTodosPage
      currentUser={user}
      dashboard={buildDashboard(todos)}
      loading={false}
      canNavigatePath={() => true}
      onNavigate={vi.fn()}
      onRefresh={onRefresh}
    />,
  )
  return { onRefresh }
}

describe('DashboardTodosPage actions', () => {
  beforeEach(() => {
    vi.mocked(updateTodoTask).mockReset()
    vi.mocked(updateTodoTask).mockResolvedValue(manualTodo({ status: 'completed' }))
    vi.mocked(listAssignableUsers).mockReset()
    vi.mocked(listAssignableUsers).mockResolvedValue({
      users: [
        {
          id: 'user-2',
          username: 'other',
          display_name: '李四',
          department_name: '采购部',
          avatar_type: 'preset',
          avatar_value: '',
        },
      ],
    })
  })

  afterEach(() => {
    Modal.destroyAll()
  })

  it('completes an owned manual todo after confirmation', async () => {
    const user = userEvent.setup()
    const { onRefresh } = renderPage([manualTodo({ assignment_type: 'assigned' })])

    await user.click(screen.getByRole('button', { name: 'dashboard.completeTodo' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'dashboard.completeTodo' }))

    expect(updateTodoTask).toHaveBeenCalledWith('todo-1', { status: 'completed' })
    expect(onRefresh).toHaveBeenCalled()
  })

  it('shows derived todos as auto-closing without a complete action', () => {
    renderPage([
      manualTodo({
        id: 'qc-1',
        source_type: 'quality_inspection',
        assignment_type: 'assigned',
      }),
    ])

    expect(screen.getByText('dashboard.todoAutoClose')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'dashboard.completeTodo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'dashboard.cancelTodo' })).not.toBeInTheDocument()
  })

  it('lets the creator reassign but not complete a todo owned by someone else', async () => {
    const user = userEvent.setup()
    renderPage([
      manualTodo({
        owner_user_id: 'user-3',
        owner_user_name: '王五',
        assignment_type: 'assigned',
      }),
    ])

    expect(screen.queryByRole('button', { name: 'dashboard.completeTodo' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'dashboard.reassignTodo' }))
    const dialogLabel = await screen.findByText('dashboard.reassignTarget')
    const dialog = dialogLabel.closest('[role="dialog"]') as HTMLElement
    await user.click(within(dialog).getByRole('combobox'))
    await user.click(await screen.findByText('李四 · 采购部'))
    await user.click(within(dialog).getByRole('button', { name: 'dashboard.reassignTodo' }))

    expect(listAssignableUsers).toHaveBeenCalled()
    expect(updateTodoTask).toHaveBeenCalledWith('todo-1', { owner_user_id: 'user-2' })
  })

  it('treats backend is_overdue as the single source of overdue truth', () => {
    expect(todoDueState('2099-01-01T09:00:00', true)).toBe('overdue')
    expect(todoDueState('2099-01-01T09:00:00', false)).toBe('upcoming')
  })
})
