import { Input, Modal, Segmented, Select, Skeleton, Table } from 'antd'
import { ArrowRight, ClipboardCheck, Search } from 'lucide-react'
import { useState } from 'react'
import {
  listAssignableUsers,
  updateTodoTask,
  type AssignableUser,
  type CurrentUser,
  type Dashboard,
  type TodoTask,
} from '@/api'
import { PanelTitle } from '@/shared/ui'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { formatDate } from '@/app/pages/appHelpers'
import {
  todoDueSortValue,
  todoDueState,
  todoDueStateLabel,
  todoSourceLabel,
  todoTargetPath,
  type TodoDueState,
  type TodoScope,
} from '../dashboardHelpers'

export function DashboardTodosPage({
  currentUser,
  dashboard,
  loading,
  canNavigatePath,
  onNavigate,
  onRefresh,
}: {
  currentUser: CurrentUser
  dashboard: Dashboard | null
  loading: boolean
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
  onRefresh: () => Promise<void>
}) {
  const [scope, setScope] = useState<TodoScope>('assigned')
  const [searchValue, setSearchValue] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [dueFilter, setDueFilter] = useState<TodoDueState>('all')
  const [reassignTodo, setReassignTodo] = useState<TodoTask | null>(null)
  const [reassignTarget, setReassignTarget] = useState('')
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const todos = dashboard?.todos ?? []
  const isSuperAdmin = currentUser.permissions.includes('system:super_admin')
  const assignedTodos = todos.filter((todo) => todo.assignment_type === 'assigned')
  const selfCreatedTodos = todos.filter((todo) => todo.assignment_type === 'self')
  const scopedTodos = scope === 'assigned' ? assignedTodos : selfCreatedTodos
  const normalizedSearch = searchValue.trim().toLocaleLowerCase()
  const filteredTodos = scopedTodos
    .filter((todo) => {
      if (sourceFilter !== 'all' && todo.source_type !== sourceFilter) return false
      if (dueFilter !== 'all' && todoDueState(todo.due_at, todo.is_overdue) !== dueFilter) {
        return false
      }
      if (!normalizedSearch) return true
      return [
        todo.title,
        todo.content,
        todo.owner_user_name,
        todo.creator_user_name,
        todoSourceLabel(todo.source_type),
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch))
    })
    .sort((left, right) => {
      const [leftRank, leftTime] = todoDueSortValue(left)
      const [rightRank, rightTime] = todoDueSortValue(right)
      return leftRank - rightRank || leftTime - rightTime || left.title.localeCompare(right.title)
    })
  const sourceOptions = Array.from(new Set(todos.map((todo) => todo.source_type)))
    .sort((left, right) => todoSourceLabel(left).localeCompare(todoSourceLabel(right)))
    .map((value) => ({ label: todoSourceLabel(value), value }))
  const hasActiveFilters = Boolean(normalizedSearch || sourceFilter !== 'all' || dueFilter !== 'all')

  function clearFilters() {
    setSearchValue('')
    setSourceFilter('all')
    setDueFilter('all')
  }

  function canComplete(todo: TodoTask) {
    return (
      todo.source_type === 'manual' &&
      todo.status === 'pending' &&
      (isSuperAdmin || todo.owner_user_id === currentUser.id)
    )
  }

  function canManage(todo: TodoTask) {
    return (
      todo.source_type === 'manual' &&
      todo.status === 'pending' &&
      (isSuperAdmin || todo.creator_user_id === currentUser.id)
    )
  }

  async function runTodoAction(
    todo: TodoTask,
    actionKey: string,
    action: () => Promise<unknown>,
    successKey: Parameters<typeof t>[0],
  ) {
    setBusyAction(`${actionKey}-${todo.id}`)
    setFeedback('')
    try {
      await action()
      setFeedback(t(successKey))
      await onRefresh()
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  function confirmComplete(todo: TodoTask) {
    Modal.confirm({
      centered: true,
      title: t('dashboard.completeTodoConfirm'),
      content: t('dashboard.completeTodoIrreversible'),
      okText: t('dashboard.completeTodo'),
      cancelText: t('common.cancel'),
      onOk: () =>
        runTodoAction(
          todo,
          'complete',
          () => updateTodoTask(todo.id, { status: 'completed' }),
          'dashboard.todoCompleted',
        ),
    })
  }

  function confirmCancel(todo: TodoTask) {
    Modal.confirm({
      centered: true,
      title: t('dashboard.cancelTodoConfirm'),
      okText: t('dashboard.cancelTodoConfirmOk'),
      cancelText: t('common.cancel'),
      onOk: () =>
        runTodoAction(
          todo,
          'cancel',
          () => updateTodoTask(todo.id, { status: 'cancelled' }),
          'dashboard.todoCancelled',
        ),
    })
  }

  async function openReassign(todo: TodoTask) {
    setReassignTodo(todo)
    setReassignTarget('')
    if (assignableUsers.length) return
    try {
      const result = await listAssignableUsers()
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    }
  }

  async function submitReassign() {
    if (!reassignTodo || !reassignTarget) return
    await runTodoAction(
      reassignTodo,
      'reassign',
      () => updateTodoTask(reassignTodo.id, { owner_user_id: reassignTarget }),
      'dashboard.todoReassigned',
    )
    setReassignTodo(null)
  }

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle
            icon={<ClipboardCheck size={18} />}
            title={t(isSuperAdmin ? 'dashboard.globalTodos' : 'dashboard.myTodos')}
          />
        </div>
        <div className="dashboard-todo-toolbar">
          <Segmented<TodoScope>
            aria-label={t('dashboard.todoScope')}
            className="dashboard-todo-scope"
            options={[
              {
                label: `${t(isSuperAdmin ? 'todo.globalBusiness' : 'todo.assignedToMe')} ${assignedTodos.length}`,
                value: 'assigned',
              },
              { label: `${t('todo.selfCreated')} ${selfCreatedTodos.length}`, value: 'self' },
            ]}
            value={scope}
            onChange={setScope}
          />
          <div className="dashboard-todo-filters">
            <Input
              allowClear
              aria-label={t('dashboard.todoSearchPlaceholder')}
              placeholder={t('dashboard.todoSearchPlaceholder')}
              prefix={<Search aria-hidden="true" size={16} />}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <Select
              aria-label={t('dashboard.todoTypeFilter')}
              options={[{ label: t('dashboard.allTaskTypes'), value: 'all' }, ...sourceOptions]}
              value={sourceFilter}
              onChange={setSourceFilter}
            />
            <Select<TodoDueState>
              aria-label={t('dashboard.todoDueFilter')}
              options={[
                { label: t('dashboard.allDueStates'), value: 'all' },
                { label: t('dashboard.overdue'), value: 'overdue' },
                { label: t('dashboard.dueToday'), value: 'today' },
                { label: t('dashboard.upcoming'), value: 'upcoming' },
                { label: t('dashboard.noDeadline'), value: 'none' },
              ]}
              value={dueFilter}
              onChange={setDueFilter}
            />
          </div>
        </div>
        <div aria-live="polite" className="dashboard-todo-result-count">
          {t('dashboard.currentResults')} <strong>{filteredTodos.length}</strong>
        </div>
        <Table<TodoTask>
          className="dashboard-todo-table"
          columns={[
            {
              dataIndex: 'title',
              key: 'task',
              title: t('dashboard.taskColumn'),
              width: 350,
              render: (_value, todo) => (
                <div className="dashboard-todo-main">
                  <strong title={todo.title}>{todo.title}</strong>
                  <span title={todo.content || undefined}>
                    {todo.content || t('dashboard.noBusinessContext')}
                  </span>
                </div>
              ),
            },
            {
              dataIndex: 'source_type',
              key: 'type',
              title: t('dashboard.typeColumn'),
              width: 100,
              render: (value: string) => (
                <span className="dashboard-todo-type">{todoSourceLabel(value)}</span>
              ),
            },
            {
              dataIndex: 'owner_user_name',
              key: 'owner',
              title: t('dashboard.ownerColumn'),
              width: 110,
              render: (value: string | null) => value || t('dashboard.unassigned'),
            },
            {
              dataIndex: 'due_at',
              key: 'due',
              title: t('dashboard.dueColumn'),
              width: 170,
              render: (value: string | null, todo) => {
                const state = todoDueState(value, todo.is_overdue)
                return (
                  <div className="dashboard-todo-due">
                    <time>{value ? formatDate(value) : t('common.notSet')}</time>
                    <span className={`dashboard-due-status is-${state}`}>
                      {todoDueStateLabel(state)}
                    </span>
                  </div>
                )
              },
            },
            {
              align: 'right',
              fixed: 'right',
              key: 'action',
              title: t('dashboard.actionColumn'),
              width: 220,
              render: (_value, todo) => {
                const targetPath = todoTargetPath(todo)
                return (
                  <div className="dashboard-todo-actions">
                    {canNavigatePath(targetPath) ? (
                      <button
                        className="dashboard-todo-action"
                        type="button"
                        onClick={() => onNavigate(targetPath)}
                      >
                        <span>{t('dashboard.goHandle')}</span>
                        <ArrowRight aria-hidden="true" size={15} />
                      </button>
                    ) : null}
                    {todo.source_type === 'manual' ? (
                      <>
                        {canComplete(todo) ? (
                          <button
                            className="dashboard-todo-action"
                            disabled={busyAction === `complete-${todo.id}`}
                            type="button"
                            onClick={() => confirmComplete(todo)}
                          >
                            {t('dashboard.completeTodo')}
                          </button>
                        ) : null}
                        {canManage(todo) ? (
                          <button
                            className="dashboard-todo-action"
                            type="button"
                            onClick={() => void openReassign(todo)}
                          >
                            {t('dashboard.reassignTodo')}
                          </button>
                        ) : null}
                        {canManage(todo) ? (
                          <button
                            className="dashboard-todo-action"
                            disabled={busyAction === `cancel-${todo.id}`}
                            type="button"
                            onClick={() => confirmCancel(todo)}
                          >
                            {t('dashboard.cancelTodo')}
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <span className="dashboard-todo-auto-close">
                        {t('dashboard.todoAutoClose')}
                      </span>
                    )}
                  </div>
                )
              },
            },
          ]}
          dataSource={filteredTodos}
          locale={{
            emptyText: (
              <div className="dashboard-table-empty">
                <ClipboardCheck aria-hidden="true" size={24} />
                <strong>
                  {hasActiveFilters ? t('dashboard.noMatchingTodos') : t('dashboard.noTodos')}
                </strong>
                {hasActiveFilters ? (
                  <button type="button" onClick={clearFilters}>
                    {t('dashboard.clearFilters')}
                  </button>
                ) : null}
              </div>
            ),
          }}
          pagination={{ hideOnSinglePage: true, pageSize: 10, showSizeChanger: false }}
          rowKey="id"
          scroll={{ x: 1050 }}
          size="middle"
        />
        {feedback ? <div className="dashboard-feedback success">{feedback}</div> : null}
      </section>

      <Modal
        centered
        footer={null}
        open={Boolean(reassignTodo)}
        title={t('dashboard.reassignTodo')}
        width={480}
        onCancel={() => setReassignTodo(null)}
      >
        <div className="dashboard-form modal-dashboard-form">
          <label>
            <span>{t('dashboard.reassignTarget')}</span>
            <Select
              showSearch
              aria-label={t('dashboard.reassignTarget')}
              optionFilterProp="label"
              options={assignableUsers
                .filter((user) => user.id !== reassignTodo?.owner_user_id)
                .map((user) => ({
                  label: `${user.display_name} · ${user.department_name}`,
                  value: user.id,
                }))}
              value={reassignTarget || undefined}
              onChange={setReassignTarget}
            />
          </label>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setReassignTodo(null)}>
              {t('common.cancel')}
            </button>
            <button
              className="inline-submit"
              disabled={!reassignTarget || busyAction === `reassign-${reassignTodo?.id}`}
              type="button"
              onClick={() => void submitReassign()}
            >
              {t('dashboard.reassignTodo')}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
