import { Input, Segmented, Select, Skeleton, Table } from 'antd'
import { ArrowRight, ClipboardCheck, Search } from 'lucide-react'
import { useState } from 'react'
import type { CurrentUser, Dashboard, TodoTask } from '@/api'
import { PanelTitle } from '@/shared/ui'
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
}: {
  currentUser: CurrentUser
  dashboard: Dashboard | null
  loading: boolean
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
}) {
  const [scope, setScope] = useState<TodoScope>('assigned')
  const [searchValue, setSearchValue] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [dueFilter, setDueFilter] = useState<TodoDueState>('all')

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
      if (dueFilter !== 'all' && todoDueState(todo.due_at) !== dueFilter) return false
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
              render: (value: string | null) => {
                const state = todoDueState(value)
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
              width: 96,
              render: (_value, todo) => {
                const targetPath = todoTargetPath(todo)
                return canNavigatePath(targetPath) ? (
                  <button
                    className="dashboard-todo-action"
                    type="button"
                    onClick={() => onNavigate(targetPath)}
                  >
                    <span>{t('dashboard.goHandle')}</span>
                    <ArrowRight aria-hidden="true" size={15} />
                  </button>
                ) : null
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
          scroll={{ x: 826 }}
          size="middle"
        />
      </section>
    </section>
  )
}
