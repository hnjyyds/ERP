import { Modal, Skeleton } from 'antd'
import { AtSign, Bell, CalendarClock, CheckCircle2, ClipboardCheck, FileText, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import {
  createAnnouncement,
  createScheduleEvent,
  createTodos,
  deleteScheduleEvent,
  listAssignableUsers,
  markNotificationRead,
  type AssignableUser,
  type AnnouncementCreatePayload,
  type CurrentUser,
  type Dashboard,
  type NotificationItem,
  type ScheduleCreatePayload,
  type ScheduleEvent,
  type TodoCreatePayload,
} from '@/api'
import {
  dashboardAnnouncementsPath,
  dashboardNotificationsPath,
  dashboardSchedulesPath,
  dashboardTodosPath,
} from '@/app/routes'
import { Metric, UserAvatar, defaultAvatarPreset } from '@/shared/ui'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { canCreateAnnouncement, formatDateTime } from '@/app/pages/appHelpers'
import {
  dateTimeLocalToIso,
  initialDashboardAnnouncementForm,
  initialDashboardScheduleForm,
  initialDashboardTodoForm,
  parseDateTimeLocal,
  sortTodosByUrgency,
  todoDueState,
  type DashboardAnnouncementFormState,
  type DashboardScheduleFormState,
  type DashboardTodoFormState,
} from './dashboardHelpers'
import {
  DashboardAnnouncementsPreviewPanel,
  DashboardNotificationsPreviewPanel,
  DashboardSchedulePreviewPanel,
  DashboardTodoPreviewPanel,
} from './views/DashboardOverviewPanels'

export function DashboardPage({
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
  const isSuperAdmin = currentUser.permissions.includes('system:super_admin')
  const [scheduleForm, setScheduleForm] = useState<DashboardScheduleFormState>(() =>
    initialDashboardScheduleForm(),
  )
  const [announcementForm, setAnnouncementForm] = useState<DashboardAnnouncementFormState>(() =>
    initialDashboardAnnouncementForm(),
  )
  const [todoForm, setTodoForm] = useState<DashboardTodoFormState>(() =>
    initialDashboardTodoForm(currentUser),
  )
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false)
  const [createModal, setCreateModal] = useState<'todo' | 'schedule' | 'announcement' | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEvent | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTimeMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (createModal !== 'todo' || assignableUsers.length) return
    let isRequestCancelled = false

    listAssignableUsers()
      .then((result) => {
        if (!isRequestCancelled) setAssignableUsers(result.users)
      })
      .catch((caught) => {
        if (!isRequestCancelled) {
          showError(caught, t('dashboard.operationFailed'))
        }
      })

    return () => {
      isRequestCancelled = true
    }
  }, [assignableUsers.length, createModal])

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 10 }} />
  }

  const summary = dashboard?.summary
  const allTodos = dashboard?.todos ?? []
  const previewTodos = sortTodosByUrgency(allTodos).slice(0, 3)
  const overdueTodoCount = allTodos.filter((todo) => todoDueState(todo.due_at) === 'overdue').length
  const dueTodayTodoCount = allTodos.filter((todo) => todoDueState(todo.due_at) === 'today').length
  const previewNotifications = dashboard?.notifications.slice(0, 1) ?? []
  const previewSchedules = dashboard?.schedule_events.slice(0, 3) ?? []
  const previewAnnouncements = dashboard?.announcements.slice(0, 1) ?? []
  const canPublishAnnouncement = canCreateAnnouncement(currentUser)
  const selectedTodoAssignees = todoForm.assignee_user_ids
    .map(
      (userId) =>
        assignableUsers.find((user) => user.id === userId) ??
        (userId === currentUser.id
          ? {
              id: currentUser.id,
              username: currentUser.username,
              display_name: currentUser.display_name,
              department_name: currentUser.department_name,
              avatar_type: currentUser.avatar_type,
              avatar_value: currentUser.avatar_value || defaultAvatarPreset,
            }
          : null),
    )
    .filter((user): user is AssignableUser => Boolean(user))

  function showAnnouncementDenied() {
    Modal.warning({
      centered: true,
      content: t('dashboard.announcementDenied'),
      okText: t('common.close'),
      title: t('dashboard.announcementDeniedTitle'),
    })
  }

  function openScheduleModal() {
    setScheduleForm(initialDashboardScheduleForm())
    setCreateModal('schedule')
  }

  function openAnnouncementModal() {
    if (!canPublishAnnouncement) {
      showAnnouncementDenied()
      return
    }
    setCreateModal('announcement')
  }

  function openTodoModal() {
    setTodoForm(initialDashboardTodoForm(currentUser))
    setAssigneePickerOpen(false)
    setCreateModal('todo')
  }

  function toggleTodoAssignee(userId: string) {
    setTodoForm((current) => {
      const exists = current.assignee_user_ids.includes(userId)
      return {
        ...current,
        assignee_user_ids: exists
          ? current.assignee_user_ids.filter((id) => id !== userId)
          : [...current.assignee_user_ids, userId],
      }
    })
  }

  async function runDashboardAction(action: string, handler: () => Promise<void>, success: string) {
    setBusyAction(action)
    setActionError('')
    setActionMessage('')
    try {
      await handler()
      setActionMessage(success)
      await onRefresh()
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  async function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduleForm.title.trim() || !scheduleForm.starts_at || !scheduleForm.ends_at) {
      setActionError(t('dashboard.scheduleRequired'))
      return
    }
    const startsAt = parseDateTimeLocal(scheduleForm.starts_at)
    const endsAt = parseDateTimeLocal(scheduleForm.ends_at)
    if (
      !startsAt ||
      !endsAt ||
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime()) ||
      endsAt <= startsAt
    ) {
      setActionError(t('dashboard.scheduleTimeInvalid'))
      return
    }
    const payload: ScheduleCreatePayload = {
      title: scheduleForm.title.trim(),
      description: scheduleForm.description.trim() || undefined,
      starts_at: dateTimeLocalToIso(scheduleForm.starts_at),
      ends_at: dateTimeLocalToIso(scheduleForm.ends_at),
    }
    await runDashboardAction(
      'schedule',
      async () => {
        await createScheduleEvent(payload)
        setScheduleForm(initialDashboardScheduleForm())
        setCreateModal(null)
      },
      t('dashboard.scheduleCreated'),
    )
  }

  async function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canPublishAnnouncement) {
      setCreateModal(null)
      showAnnouncementDenied()
      return
    }
    const payload: AnnouncementCreatePayload = {
      title: announcementForm.title.trim(),
      content: announcementForm.content.trim(),
    }
    if (!payload.title || !payload.content) {
      setActionError(t('dashboard.announcementRequired'))
      return
    }
    await runDashboardAction(
      'announcement',
      async () => {
        await createAnnouncement(payload)
        setAnnouncementForm(initialDashboardAnnouncementForm())
        setCreateModal(null)
      },
      t('dashboard.announcementCreated'),
    )
  }

  async function submitTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload: TodoCreatePayload = {
      title: todoForm.title.trim(),
      content: todoForm.content.trim(),
      assignee_user_ids: todoForm.assignee_user_ids,
    }
    if (!payload.title || !payload.content) {
      setActionError(t('dashboard.todoRequired'))
      return
    }
    if (!payload.assignee_user_ids.length) {
      setActionError(t('dashboard.assigneeRequired'))
      return
    }
    await runDashboardAction(
      'todo',
      async () => {
        await createTodos(payload)
        setTodoForm(initialDashboardTodoForm(currentUser))
        setAssigneePickerOpen(false)
        setCreateModal(null)
      },
      t('dashboard.todoCreated'),
    )
  }

  async function readNotification(notification: NotificationItem) {
    await runDashboardAction(
      `notification-${notification.id}`,
      async () => {
        await markNotificationRead(notification.id)
      },
      t('dashboard.notificationHandled'),
    )
  }

  function confirmRemoveSchedule(schedule: ScheduleEvent) {
    Modal.confirm({
      centered: true,
      content: t('dashboard.deleteScheduleConfirm'),
      okButtonProps: { danger: true },
      okText: t('dashboard.deleteSchedule'),
      cancelText: t('common.cancel'),
      title: t('dashboard.deleteScheduleTitle'),
      onOk: () =>
        runDashboardAction(
          `schedule-delete-${schedule.id}`,
          async () => {
            await deleteScheduleEvent(schedule.id)
            setSelectedSchedule(null)
          },
          t('dashboard.scheduleDeleted'),
        ),
    })
  }

  return (
    <section className="dashboard-grid dashboard-workbench">
      <div className="metric-strip" aria-label={t('dashboard.aria')}>
        <Metric
          icon={<ClipboardCheck size={17} />}
          label={t('dashboard.todo')}
          value={summary?.todo_count ?? 0}
          intent="warning"
          onClick={() => onNavigate(dashboardTodosPath)}
        />
        <Metric
          icon={<CalendarClock size={17} />}
          label={t('dashboard.todaySchedule')}
          value={summary?.today_schedule_count ?? 0}
          onClick={() => onNavigate(dashboardSchedulesPath)}
        />
        <Metric
          icon={<Bell size={17} />}
          label={t('dashboard.unreadNotifications')}
          value={summary?.unread_notification_count ?? 0}
          intent="danger"
          onClick={() => onNavigate(dashboardNotificationsPath)}
        />
        <Metric
          icon={<FileText size={17} />}
          label={t('dashboard.announcement')}
          value={summary?.announcement_count ?? 0}
          onClick={() => onNavigate(dashboardAnnouncementsPath)}
        />
      </div>

      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}

      <div className="dashboard-toolbar" aria-label={t('dashboard.aria')}>
        <button type="button" onClick={openScheduleModal}>
          <CalendarClock size={15} />
          <span>{t('dashboard.addSchedule')}</span>
        </button>
        <button type="button" onClick={openAnnouncementModal}>
          <FileText size={15} />
          <span>{t('dashboard.publishAnnouncement')}</span>
        </button>
      </div>

      <div className="dashboard-board">
        <DashboardTodoPreviewPanel
          canNavigatePath={canNavigatePath}
          dueTodayTodoCount={dueTodayTodoCount}
          isSuperAdmin={isSuperAdmin}
          overdueTodoCount={overdueTodoCount}
          previewTodos={previewTodos}
          onNavigate={onNavigate}
          onOpenTodoModal={openTodoModal}
        />

        <DashboardSchedulePreviewPanel
          currentTimeMs={currentTimeMs}
          previewSchedules={previewSchedules}
          onNavigate={onNavigate}
          onOpenScheduleModal={openScheduleModal}
          onSelect={(event) => setSelectedSchedule(event)}
        />

        <DashboardNotificationsPreviewPanel
          busyAction={busyAction}
          previewNotifications={previewNotifications}
          onNavigate={onNavigate}
          onRead={readNotification}
        />

        <DashboardAnnouncementsPreviewPanel
          canPublishAnnouncement={canPublishAnnouncement}
          previewAnnouncements={previewAnnouncements}
          onNavigate={onNavigate}
          onPublish={openAnnouncementModal}
        />
      </div>

      <Modal
        centered
        footer={null}
        open={Boolean(selectedSchedule)}
        title={t('dashboard.scheduleDetail')}
        width={560}
        onCancel={() => setSelectedSchedule(null)}
      >
        {selectedSchedule ? (
          <section className="dashboard-detail">
            <header className="dashboard-detail-heading">
              <strong>{selectedSchedule.title}</strong>
              <span>
                {t('dashboard.timeRange', {
                  start: formatDateTime(selectedSchedule.starts_at),
                  end: formatDateTime(selectedSchedule.ends_at),
                })}
              </span>
            </header>
            <dl className="dashboard-detail-list">
              <div>
                <dt>{t('dashboard.start')}</dt>
                <dd>{formatDateTime(selectedSchedule.starts_at)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.end')}</dt>
                <dd>{formatDateTime(selectedSchedule.ends_at)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.createdAt')}</dt>
                <dd>{formatDateTime(selectedSchedule.created_at)}</dd>
              </div>
            </dl>
            <div className="dashboard-detail-note">
              <span>{t('dashboard.note')}</span>
              <p>{selectedSchedule.description?.trim() || t('dashboard.noNote')}</p>
            </div>
            <div className="modal-actions split">
              <button
                className="danger-inline"
                disabled={busyAction === `schedule-delete-${selectedSchedule.id}`}
                type="button"
                onClick={() => confirmRemoveSchedule(selectedSchedule)}
              >
                <Trash2 size={15} />
                {t('dashboard.deleteSchedule')}
              </button>
              <button
                className="secondary-inline"
                type="button"
                onClick={() => setSelectedSchedule(null)}
              >
                {t('common.close')}
              </button>
            </div>
          </section>
        ) : null}
      </Modal>

      <Modal
        centered
        footer={null}
        open={createModal === 'todo'}
        title={t('dashboard.addTodo')}
        width={780}
        onCancel={() => {
          setAssigneePickerOpen(false)
          setCreateModal(null)
        }}
      >
        <form className="dashboard-form modal-dashboard-form todo-compose-form" onSubmit={submitTodo}>
          <section className="todo-composer" aria-label={t('dashboard.addTodo')}>
            <input
              aria-label={t('dashboard.title')}
              className="todo-composer-title"
              placeholder={t('dashboard.title')}
              value={todoForm.title}
              onChange={(event) => setTodoForm({ ...todoForm, title: event.target.value })}
            />
            <textarea
              aria-label={t('dashboard.content')}
              className="todo-composer-body"
              placeholder={t('dashboard.content')}
              rows={8}
              value={todoForm.content}
              onChange={(event) => setTodoForm({ ...todoForm, content: event.target.value })}
            />
            <div className="todo-composer-footer">
              <div className="todo-composer-assignees" aria-label={t('dashboard.assignees')}>
                {selectedTodoAssignees.length ? (
                  <span className="dashboard-assignee-tags">
                    {selectedTodoAssignees.map((user) => (
                      <span className="dashboard-assignee-tag" key={user.id}>
                        {user.display_name}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span>{t('dashboard.selectAssignees')}</span>
                )}
              </div>
              <button
                aria-expanded={assigneePickerOpen}
                aria-label={t('dashboard.assignees')}
                className="todo-assignee-button"
                type="button"
                onClick={() => setAssigneePickerOpen((open) => !open)}
              >
                <AtSign size={18} />
              </button>
            </div>
            {assigneePickerOpen ? (
              <div className="todo-assignee-menu">
                {assignableUsers.length ? (
                  assignableUsers.map((user) => {
                    const selected = todoForm.assignee_user_ids.includes(user.id)

                    return (
                      <button
                        aria-pressed={selected}
                        className={`dashboard-assignee-option${selected ? ' selected' : ''}`}
                        key={user.id}
                        type="button"
                        onClick={() => toggleTodoAssignee(user.id)}
                      >
                        <UserAvatar
                          avatarType={user.avatar_type}
                          avatarValue={user.avatar_value}
                          className="dashboard-assignee-avatar"
                          label={user.display_name}
                          size="sm"
                        />
                        <span>
                          <strong>{user.display_name}</strong>
                          <small>
                            {user.username} · {user.department_name}
                          </small>
                        </span>
                        {selected ? <CheckCircle2 size={16} /> : null}
                      </button>
                    )
                  })
                ) : (
                  <div className="dashboard-empty">{t('dashboard.selectAssignees')}</div>
                )}
              </div>
            ) : null}
          </section>
          <div className="modal-actions">
            <button
              className="secondary-inline"
              type="button"
              onClick={() => {
                setAssigneePickerOpen(false)
                setCreateModal(null)
              }}
            >
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction === 'todo'} type="submit">
              {t('dashboard.addTodo')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={createModal === 'schedule'}
        title={t('dashboard.addSchedule')}
        width={620}
        onCancel={() => setCreateModal(null)}
      >
        <form className="dashboard-form modal-dashboard-form" onSubmit={submitSchedule}>
          <label>
            <span>{t('dashboard.title')}</span>
            <input
              aria-label={t('dashboard.title')}
              value={scheduleForm.title}
              onChange={(event) => setScheduleForm({ ...scheduleForm, title: event.target.value })}
            />
          </label>
          <div className="dashboard-form-row">
            <label>
              <span>{t('dashboard.start')}</span>
              <input
                aria-label={t('dashboard.start')}
                type="datetime-local"
                value={scheduleForm.starts_at}
                onChange={(event) =>
                  setScheduleForm({ ...scheduleForm, starts_at: event.target.value })
                }
              />
            </label>
            <label>
              <span>{t('dashboard.end')}</span>
              <input
                aria-label={t('dashboard.end')}
                type="datetime-local"
                value={scheduleForm.ends_at}
                onChange={(event) =>
                  setScheduleForm({ ...scheduleForm, ends_at: event.target.value })
                }
              />
            </label>
          </div>
          <label>
            <span>{t('dashboard.note')}</span>
            <textarea
              aria-label={t('dashboard.note')}
              rows={3}
              value={scheduleForm.description}
              onChange={(event) =>
                setScheduleForm({ ...scheduleForm, description: event.target.value })
              }
            />
          </label>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setCreateModal(null)}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction === 'schedule'} type="submit">
              {t('dashboard.addSchedule')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={createModal === 'announcement'}
        title={t('dashboard.publishAnnouncement')}
        width={620}
        onCancel={() => setCreateModal(null)}
      >
        <form className="dashboard-form modal-dashboard-form" onSubmit={submitAnnouncement}>
          <label>
            <span>{t('dashboard.title')}</span>
            <input
              aria-label={t('dashboard.title')}
              value={announcementForm.title}
              onChange={(event) =>
                setAnnouncementForm({ ...announcementForm, title: event.target.value })
              }
            />
          </label>
          <label>
            <span>{t('dashboard.content')}</span>
            <textarea
              aria-label={t('dashboard.content')}
              rows={4}
              value={announcementForm.content}
              onChange={(event) =>
                setAnnouncementForm({ ...announcementForm, content: event.target.value })
              }
            />
          </label>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setCreateModal(null)}>
              {t('common.cancel')}
            </button>
            <button
              className="inline-submit"
              disabled={busyAction === 'announcement'}
              type="submit"
            >
              {t('dashboard.publishAnnouncement')}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
