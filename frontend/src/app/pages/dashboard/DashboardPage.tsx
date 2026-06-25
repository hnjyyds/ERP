import { Alert, Button, Input, Modal, Skeleton, Table, Tag } from 'antd'
import { AtSign, Bell, CalendarClock, CheckCircle2, ClipboardCheck, FileText, LayoutDashboard, Plus, Search, Trash2 } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { Component, useEffect, useMemo, useState } from 'react'
import type { ErrorInfo } from 'react'
import { createAnnouncement, createScheduleEvent, createTodos, deleteScheduleEvent, getDashboard, listAssignableUsers, markNotificationRead, type AssignableUser, type Announcement, type AnnouncementCreatePayload, type AppLanguage, type AppTimeZone, type CurrentUser, type Dashboard, type I18nConfig, type MenuItem, type NotificationItem, type ScheduleCreatePayload, type ScheduleEvent, type TodoCreatePayload, type TodoTask } from '../../../api'
import { dashboardAnnouncementsPath, dashboardNotificationsPath, dashboardSchedulesPath, dashboardTodosPath, followupPath, reportingPath, dashboardPath } from '../../routes'
import { Metric, PanelTitle, UserAvatar, defaultAvatarPreset } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { t } from '../../App'
import { formatDate, formatDateTime, formatTime, parseApiDate, getRuntimeSettings, statusTag, severityTag, canCreateAnnouncement, type AppSettings } from '../appHelpers'

type DashboardScheduleFormState = {
  title: string
  description: string
  starts_at: string
  ends_at: string
}

type DashboardAnnouncementFormState = {
  title: string
  content: string
}

type DashboardTodoFormState = {
  title: string
  content: string
  assignee_user_ids: string[]
}

function timeZoneOffsetMinutes(timeZone: AppTimeZone) {
  return timeZone === 'Asia/Shanghai' ? 8 * 60 : 0
}

function dateTimeLocalValue(date: Date, settings: AppSettings = getRuntimeSettings()) {
  const zoned = new Date(date.getTime() + timeZoneOffsetMinutes(settings.timeZone) * 60_000)
  return zoned.toISOString().slice(0, 16)
}

function parseDateTimeLocal(value: string, settings: AppSettings = getRuntimeSettings()) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  const utcMs =
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) -
    timeZoneOffsetMinutes(settings.timeZone) * 60_000
  return new Date(utcMs)
}

function dateTimeLocalToIso(value: string, settings: AppSettings = getRuntimeSettings()) {
  return parseDateTimeLocal(value, settings)?.toISOString() ?? ''
}

function normalizeApiDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)) return value
  return `${value}Z`
}


function dateParts(value: string | null, settings: AppSettings = getRuntimeSettings()) {
  const date = parseApiDate(value)
  if (!date) return null
  const parts = new Intl.DateTimeFormat(settings.language, {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone: settings.timeZone,
    year: 'numeric',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}`,
  }
}

function initialDashboardScheduleForm(): DashboardScheduleFormState {
  const startsAt = new Date()
  startsAt.setMinutes(0, 0, 0)
  startsAt.setHours(startsAt.getHours() + 1)
  const endsAt = new Date(startsAt)
  endsAt.setHours(endsAt.getHours() + 1)
  return {
    title: '',
    description: '',
    starts_at: dateTimeLocalValue(startsAt),
    ends_at: dateTimeLocalValue(endsAt),
  }
}

function initialDashboardAnnouncementForm(): DashboardAnnouncementFormState {
  return { title: '', content: '' }
}

function initialDashboardTodoForm(currentUser?: CurrentUser): DashboardTodoFormState {
  return {
    title: '',
    content: '',
    assignee_user_ids: currentUser ? [currentUser.id] : [],
  }
}

function todoTargetPath(todo: TodoTask) {
  if (todo.source_type === 'followup') return followupPath
  if (todo.source_type === 'approval') return reportingPath
  return dashboardPath
}

function todoSourceLabel(value: string) {
  const labels: Record<string, string> = {
    approval: t('todo.approval'),
    followup: t('todo.followup'),
    manual: t('todo.manual'),
    system: t('todo.system'),
  }
  return labels[value] ?? value
}


type CountdownSegment = {
  value: string
  unit: string
}

function formatCountdownSegments(diffMs: number): CountdownSegment[] {
  const totalSeconds = Math.max(0, Math.ceil(diffMs / 1000))
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => value.toString().padStart(2, '0')

  if (days > 0) {
    return [
      { value: days.toString(), unit: t('dashboard.daysShort') },
      { value: pad(hours), unit: t('dashboard.hoursShort') },
      { value: pad(minutes), unit: t('dashboard.minutesShort') },
      { value: pad(seconds), unit: t('dashboard.secondsShort') },
    ]
  }

  if (hours > 0) {
    return [
      { value: hours.toString(), unit: t('dashboard.hoursShort') },
      { value: pad(minutes), unit: t('dashboard.minutesShort') },
      { value: pad(seconds), unit: t('dashboard.secondsShort') },
    ]
  }

  return [
    { value: minutes.toString(), unit: t('dashboard.minutesShort') },
    { value: pad(seconds), unit: t('dashboard.secondsShort') },
  ]
}

function scheduleCountdownLabel(startsAt: string | null, endsAt: string | null, nowMs: number) {
  const startMs = parseApiDate(startsAt)?.getTime() ?? Number.NaN
  const endMs = parseApiDate(endsAt)?.getTime() ?? Number.NaN

  if (Number.isNaN(startMs)) return { label: t('dashboard.pendingConfirm'), tone: 'muted' }
  if (nowMs < startMs) {
    return {
      segments: formatCountdownSegments(startMs - nowMs),
      tone: startMs - nowMs <= 24 * 60 * 60 * 1000 ? 'soon' : 'upcoming',
    }
  }
  if (!Number.isNaN(endMs) && nowMs <= endMs) return { label: t('dashboard.inProgress'), tone: 'active' }
  return { label: t('dashboard.ended'), tone: 'done' }
}

export function DashboardScheduleTimeline({
  events,
  currentTimeMs,
  onSelect,
}: {
  events: ScheduleEvent[]
  currentTimeMs: number
  onSelect: (event: ScheduleEvent) => void
}) {
  return (
    <div className="dashboard-timeline">
      {events.map((event) => {
        const countdown = scheduleCountdownLabel(event.starts_at, event.ends_at, currentTimeMs)

        return (
          <button
            className="dashboard-timeline-item"
            key={event.id}
            type="button"
            onClick={() => onSelect(event)}
          >
            <span className="dashboard-timeline-time">
              <strong>{formatTime(event.starts_at)}</strong>
              <small>{formatDate(event.starts_at)}</small>
              <em className={`dashboard-timeline-countdown ${countdown.tone}`}>
                {countdown.segments ? (
                  <span className="dashboard-timeline-countdown-parts">
                    {countdown.segments.map((segment, index) => (
                      <span className="dashboard-timeline-countdown-piece" key={`${segment.unit}-${index}`}>
                        <span className="dashboard-timeline-countdown-value">{segment.value}</span>
                        <span className="dashboard-timeline-countdown-unit">{segment.unit}</span>
                        {index < countdown.segments.length - 1 ? (
                          <span className="dashboard-timeline-countdown-dot" aria-hidden="true" />
                        ) : null}
                      </span>
                    ))}
                  </span>
                ) : (
                  countdown.label
                )}
              </em>
            </span>
            <span className="dashboard-timeline-pin" aria-hidden="true" />
            <span className="dashboard-timeline-content">
              <span className="dashboard-timeline-title">{event.title}</span>
              <span className="dashboard-timeline-note">
                {event.description?.trim() || `${formatTime(event.starts_at)} 至 ${formatTime(event.ends_at)}`}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

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
  const previewTodos = dashboard?.todos.slice(0, 2) ?? []
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
    if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
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
          icon={<FileText size={17} />}
          label={t('dashboard.announcement')}
          value={summary?.announcement_count ?? 0}
          onClick={() => onNavigate(dashboardAnnouncementsPath)}
        />
        <Metric
          icon={<ClipboardCheck size={17} />}
          label={t('dashboard.todo')}
          value={summary?.todo_count ?? 0}
          intent="warning"
          onClick={() => onNavigate(dashboardTodosPath)}
        />
        <Metric
          icon={<Bell size={17} />}
          label={t('dashboard.unreadNotifications')}
          value={summary?.unread_notification_count ?? 0}
          intent="danger"
          onClick={() => onNavigate(dashboardNotificationsPath)}
        />
        <Metric
          icon={<CalendarClock size={17} />}
          label={t('dashboard.todaySchedule')}
          value={summary?.today_schedule_count ?? 0}
          onClick={() => onNavigate(dashboardSchedulesPath)}
        />
      </div>

      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}

      <div className="dashboard-toolbar" aria-label={t('dashboard.aria')}>
        <button
          type="button"
          onClick={() => {
            setScheduleForm(initialDashboardScheduleForm())
            setCreateModal('schedule')
          }}
        >
          <CalendarClock size={15} />
          <span>{t('dashboard.addSchedule')}</span>
        </button>
        <button type="button" onClick={openAnnouncementModal}>
          <FileText size={15} />
          <span>{t('dashboard.publishAnnouncement')}</span>
        </button>
      </div>

      <div className="dashboard-board">
        <section className="workspace-panel dashboard-panel dashboard-panel-primary">
          <div className="dashboard-panel-heading">
            <PanelTitle icon={<ClipboardCheck size={18} />} title={t('dashboard.myTodos')} />
            <div className="dashboard-panel-actions">
              <button
                aria-label={t('dashboard.addTodo')}
                className="panel-icon-button"
                title={t('dashboard.addTodo')}
                type="button"
                onClick={openTodoModal}
              >
                <Plus size={17} />
              </button>
              <button className="panel-action-button panel-link-button" type="button" onClick={() => onNavigate(dashboardTodosPath)}>
                {t('common.viewAll')}
              </button>
            </div>
          </div>
          <div className="dashboard-task-list">
            {previewTodos.length ? (
              previewTodos.map((todo) => {
                const targetPath = todoTargetPath(todo)

                return (
                  <article className="dashboard-task" key={todo.id}>
                    <div className="dashboard-task-icon" aria-hidden="true">
                      <ClipboardCheck size={17} />
                    </div>
                    <div className="dashboard-task-body">
                      <div className="dashboard-task-title">
                        <strong>{todo.title}</strong>
                        {statusTag(todo.status)}
                      </div>
                      {todo.content ? <p className="dashboard-task-content">{todo.content}</p> : null}
                      <div className="dashboard-task-meta">
                        <span>{todoSourceLabel(todo.source_type)}</span>
                        <span>{t('dashboard.deadline')} {formatDate(todo.due_at)}</span>
                      </div>
                    </div>
                    {canNavigatePath(targetPath) ? (
                      <button className="table-action" type="button" onClick={() => onNavigate(targetPath)}>
                        {t('dashboard.goHandle')}
                      </button>
                    ) : null}
                  </article>
                )
              })
            ) : (
              <div className="dashboard-empty">{t('dashboard.noTodos')}</div>
            )}
          </div>
        </section>

        <section className="workspace-panel dashboard-panel dashboard-panel-reminders">
          <div className="dashboard-panel-heading">
            <PanelTitle icon={<Bell size={18} />} title={t('dashboard.messages')} />
            <button className="panel-action-button panel-link-button" type="button" onClick={() => onNavigate(dashboardNotificationsPath)}>
              {t('common.viewAll')}
            </button>
          </div>
          <div className="dashboard-reminders">
            {previewNotifications.length ? (
              previewNotifications.map((notification) => (
                <div className="dashboard-reminder" key={notification.id}>
                  <div>
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                  </div>
                  <div className="dashboard-reminder-actions">
                    {severityTag(notification.severity)}
                    {notification.is_read ? (
                      <Tag color="green">{t('dashboard.read')}</Tag>
                    ) : (
                      <button
                        className="table-action"
                        disabled={busyAction === `notification-${notification.id}`}
                        type="button"
                        onClick={() => void readNotification(notification)}
                      >
                        {t('dashboard.handle')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-empty">{t('dashboard.noNotifications')}</div>
            )}
          </div>
        </section>

        <section className="workspace-panel dashboard-panel dashboard-panel-schedule">
          <div className="dashboard-panel-heading">
            <PanelTitle icon={<CalendarClock size={18} />} title={t('dashboard.mySchedule')} />
            <button className="panel-action-button panel-link-button" type="button" onClick={() => onNavigate(dashboardSchedulesPath)}>
              {t('common.viewAll')}
            </button>
          </div>
          {previewSchedules.length ? (
            <DashboardScheduleTimeline
              currentTimeMs={currentTimeMs}
              events={previewSchedules}
              onSelect={(event) => setSelectedSchedule(event)}
            />
          ) : (
            <div className="dashboard-empty">{t('dashboard.noSchedules')}</div>
          )}
        </section>

        <section className="workspace-panel dashboard-panel dashboard-announcements-panel">
          <div className="dashboard-panel-heading">
            <PanelTitle icon={<Search size={18} />} title={t('dashboard.companyAnnouncements')} />
            <div className="dashboard-panel-actions">
              <button className="panel-action-button panel-link-button" type="button" onClick={() => onNavigate(dashboardAnnouncementsPath)}>
                {t('common.viewAll')}
              </button>
            </div>
          </div>
          <div className="dashboard-announcements">
            {previewAnnouncements.length ? (
              previewAnnouncements.map((announcement) => (
                <article className="dashboard-announcement" key={announcement.id}>
                  <div>
                    <strong>{announcement.title}</strong>
                    <p>{announcement.content}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="dashboard-empty">{t('dashboard.noAnnouncements')}</div>
            )}
          </div>
        </section>
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
                {formatDateTime(selectedSchedule.starts_at)} 至 {formatDateTime(selectedSchedule.ends_at)}
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
              <button className="secondary-inline" type="button" onClick={() => setSelectedSchedule(null)}>
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
              value={scheduleForm.title}
              onChange={(event) => setScheduleForm({ ...scheduleForm, title: event.target.value })}
            />
          </label>
          <div className="dashboard-form-row">
            <label>
              <span>{t('dashboard.start')}</span>
              <input
                type="datetime-local"
                value={scheduleForm.starts_at}
                onChange={(event) => setScheduleForm({ ...scheduleForm, starts_at: event.target.value })}
              />
            </label>
            <label>
              <span>{t('dashboard.end')}</span>
              <input
                type="datetime-local"
                value={scheduleForm.ends_at}
                onChange={(event) => setScheduleForm({ ...scheduleForm, ends_at: event.target.value })}
              />
            </label>
          </div>
          <label>
            <span>{t('dashboard.note')}</span>
            <textarea
              rows={3}
              value={scheduleForm.description}
              onChange={(event) => setScheduleForm({ ...scheduleForm, description: event.target.value })}
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
              value={announcementForm.title}
              onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })}
            />
          </label>
          <label>
            <span>{t('dashboard.content')}</span>
            <textarea
              rows={4}
              value={announcementForm.content}
              onChange={(event) => setAnnouncementForm({ ...announcementForm, content: event.target.value })}
            />
          </label>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setCreateModal(null)}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction === 'announcement'} type="submit">
              {t('dashboard.publishAnnouncement')}
            </button>
          </div>
        </form>
      </Modal>

    </section>
  )
}

export function DashboardTodosPage({
  dashboard,
  loading,
  canNavigatePath,
  onNavigate,
}: {
  dashboard: Dashboard | null
  loading: boolean
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
}) {
  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const todos = dashboard?.todos ?? []
  const groupedTodos = [
    { id: 'assigned', label: t('todo.assignedToMe'), items: todos.filter((todo) => todo.assignment_type === 'assigned') },
    { id: 'self', label: t('todo.selfCreated'), items: todos.filter((todo) => todo.assignment_type === 'self') },
  ]

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<ClipboardCheck size={18} />} title={t('dashboard.myTodos')} />
          <span className="dashboard-section-count">{todos.length}</span>
        </div>
        {todos.length ? (
          <div className="dashboard-kanban">
            {groupedTodos.map((group) => (
              <section className="dashboard-kanban-column" key={group.id}>
                <header>
                  <strong>{group.label}</strong>
                  <span>{group.items.length}</span>
                </header>
                <div className="dashboard-kanban-items">
                  {group.items.length ? (
                    group.items.map((todo) => {
                      const targetPath = todoTargetPath(todo)

                      return (
                        <article className="dashboard-task-card" key={todo.id}>
                          <div>
                            <strong>{todo.title}</strong>
                            <p>{todo.content || todoSourceLabel(todo.source_type)}</p>
                            <span>
                              {todo.creator_user_name ?? todoSourceLabel(todo.source_type)}
                              {' / '}
                              {t('dashboard.deadline')} {formatDate(todo.due_at)}
                            </span>
                          </div>
                          {canNavigatePath(targetPath) ? (
                            <button className="table-action" type="button" onClick={() => onNavigate(targetPath)}>
                              {t('dashboard.goHandle')}
                            </button>
                          ) : null}
                        </article>
                      )
                    })
                  ) : (
                    <div className="dashboard-empty">{t('common.none')}</div>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">{t('dashboard.noTodos')}</div>
        )}
      </section>
    </section>
  )
}

export function DashboardSchedulesPage({
  dashboard,
  loading,
  onRefresh,
}: {
  dashboard: Dashboard | null
  loading: boolean
  onRefresh: () => Promise<void>
}) {
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEvent | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTimeMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const schedules = dashboard?.schedule_events ?? []

  function confirmRemoveSchedule(schedule: ScheduleEvent) {
    Modal.confirm({
      centered: true,
      content: t('dashboard.deleteScheduleConfirm'),
      okButtonProps: { danger: true },
      okText: t('dashboard.deleteSchedule'),
      cancelText: t('common.cancel'),
      title: t('dashboard.deleteScheduleTitle'),
      onOk: async () => {
        setBusyAction(`schedule-delete-${schedule.id}`)
        setActionMessage('')
        setActionError('')
        try {
          await deleteScheduleEvent(schedule.id)
          setSelectedSchedule(null)
          setActionMessage(t('dashboard.scheduleDeleted'))
          await onRefresh()
        } catch (caught) {
          showError(caught, t('dashboard.operationFailed'))
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<CalendarClock size={18} />} title={t('dashboard.mySchedule')} />
          <span className="dashboard-section-count">{schedules.length}</span>
        </div>
        {schedules.length ? (
          <DashboardScheduleTimeline
            currentTimeMs={currentTimeMs}
            events={schedules}
            onSelect={(event) => setSelectedSchedule(event)}
          />
        ) : (
          <div className="dashboard-empty">{t('dashboard.noSchedules')}</div>
        )}
      </section>

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
                {formatDateTime(selectedSchedule.starts_at)} 至 {formatDateTime(selectedSchedule.ends_at)}
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
              <button className="secondary-inline" type="button" onClick={() => setSelectedSchedule(null)}>
                {t('common.close')}
              </button>
            </div>
          </section>
        ) : null}
      </Modal>
    </section>
  )
}

export function DashboardNotificationsPage({
  dashboard,
  loading,
  onRefresh,
}: {
  dashboard: Dashboard | null
  loading: boolean
  onRefresh: () => Promise<void>
}) {
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const notifications = dashboard?.notifications ?? []

  async function readNotification(notification: NotificationItem) {
    setBusyAction(`notification-${notification.id}`)
    setActionMessage('')
    setActionError('')
    try {
      await markNotificationRead(notification.id)
      setActionMessage(t('dashboard.notificationHandled'))
      await onRefresh()
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<Bell size={18} />} title={t('dashboard.messages')} />
          <span className="dashboard-section-count">{notifications.length}</span>
        </div>
        {notifications.length ? (
          <div className="dashboard-reminder-list">
            {notifications.map((notification) => (
              <article className="dashboard-reminder" key={notification.id}>
                <div>
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                </div>
                <div className="dashboard-reminder-actions">
                  {severityTag(notification.severity)}
                  {notification.is_read ? (
                    <Tag color="green">{t('dashboard.read')}</Tag>
                  ) : (
                    <button
                      className="table-action"
                      disabled={busyAction === `notification-${notification.id}`}
                      type="button"
                      onClick={() => void readNotification(notification)}
                    >
                      {t('dashboard.handle')}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">{t('dashboard.noNotifications')}</div>
        )}
      </section>
    </section>
  )
}

export function DashboardAnnouncementsPage({
  dashboard,
  loading,
}: {
  dashboard: Dashboard | null
  loading: boolean
}) {
  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const announcements = dashboard?.announcements ?? []

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<Search size={18} />} title={t('dashboard.companyAnnouncements')} />
          <span className="dashboard-section-count">{announcements.length}</span>
        </div>
        {announcements.length ? (
          <div className="dashboard-announcement-list">
            {announcements.map((announcement) => (
              <article className="dashboard-announcement-card" key={announcement.id}>
                <time dateTime={announcement.published_at}>{formatDate(announcement.published_at)}</time>
                <div>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.content}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">{t('dashboard.noAnnouncements')}</div>
        )}
      </section>
    </section>
  )
}

