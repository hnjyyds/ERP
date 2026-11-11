import { Bell, CalendarClock, ClipboardCheck, FileText, Plus } from 'lucide-react'
import { Tag } from 'antd'
import type { Announcement, NotificationItem, ScheduleEvent, TodoTask } from '@/api'
import {
  dashboardAnnouncementsPath,
  dashboardNotificationsPath,
  dashboardSchedulesPath,
  dashboardTodosPath,
} from '@/app/routes'
import { EmptyState, PanelTitle } from '@/shared/ui'
import { t } from '@/app/appI18n'
import { formatDateTime, severityTag } from '@/app/pages/appHelpers'
import {
  todoDueState,
  todoDueStateLabel,
  todoSourceLabel,
  todoTargetPath,
} from '../dashboardHelpers'
import { DashboardScheduleTimeline } from './DashboardScheduleTimeline'

export function DashboardTodoPreviewPanel({
  isSuperAdmin,
  previewTodos,
  overdueTodoCount,
  dueTodayTodoCount,
  canNavigatePath,
  onNavigate,
  onOpenTodoModal,
}: {
  isSuperAdmin: boolean
  previewTodos: TodoTask[]
  overdueTodoCount: number
  dueTodayTodoCount: number
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
  onOpenTodoModal: () => void
}) {
  return (
    <section className="workspace-panel dashboard-panel dashboard-panel-primary">
      <div className="dashboard-panel-heading">
        <PanelTitle icon={<ClipboardCheck size={18} />} title={t('dashboard.todayPriority')} />
        <div className="dashboard-panel-actions">
          <span className="dashboard-priority-scope">
            {t(isSuperAdmin ? 'dashboard.globalTodos' : 'dashboard.myTodos')}
          </span>
          <div className="dashboard-priority-summary" aria-label={t('dashboard.priorityOverview')}>
            {overdueTodoCount ? (
              <span className="is-overdue">
                {t('dashboard.overdueCount', { count: overdueTodoCount })}
              </span>
            ) : null}
            {dueTodayTodoCount ? (
              <span className="is-today">
                {t('dashboard.dueTodayCount', { count: dueTodayTodoCount })}
              </span>
            ) : null}
            {!overdueTodoCount && !dueTodayTodoCount ? (
              <span>{t('dashboard.noUrgentTodos')}</span>
            ) : null}
          </div>
          <button
            aria-label={t('dashboard.addTodo')}
            className="panel-icon-button"
            title={t('dashboard.addTodo')}
            type="button"
            onClick={onOpenTodoModal}
          >
            <Plus size={17} />
          </button>
          <button
            className="panel-action-button panel-link-button"
            type="button"
            onClick={() => onNavigate(dashboardTodosPath)}
          >
            {t('common.viewAll')}
          </button>
        </div>
      </div>
      <div className="dashboard-task-list">
        {previewTodos.length ? (
          previewTodos.map((todo) => {
            const targetPath = todoTargetPath(todo)
            const dueState = todoDueState(todo.due_at)

            return (
              <article className={`dashboard-task is-${dueState}`} key={todo.id}>
                <div className="dashboard-task-icon" aria-hidden="true">
                  <ClipboardCheck size={17} />
                </div>
                <div className="dashboard-task-body">
                  <div className="dashboard-task-title">
                    <strong>{todo.title}</strong>
                    <span className={`dashboard-task-due is-${dueState}`}>
                      {todoDueStateLabel(dueState)}
                    </span>
                  </div>
                  {todo.content ? <p className="dashboard-task-content">{todo.content}</p> : null}
                  <div className="dashboard-task-meta">
                    <span>
                      {t('dashboard.sourcePrefix')}
                      <span>{todoSourceLabel(todo.source_type)}</span>
                    </span>
                    {isSuperAdmin && todo.owner_user_name ? (
                      <span>
                        {t('dashboard.ownerPrefix')}
                        {todo.owner_user_name}
                      </span>
                    ) : null}
                    <span>
                      {t('dashboard.deadlinePrefix')}
                      {todo.due_at ? formatDateTime(todo.due_at) : t('dashboard.noDeadline')}
                    </span>
                  </div>
                </div>
                {canNavigatePath(targetPath) ? (
                  <button
                    className="table-action"
                    type="button"
                    onClick={() => onNavigate(targetPath)}
                  >
                    {t('dashboard.goHandle')}
                  </button>
                ) : null}
              </article>
            )
          })
        ) : (
          <EmptyState
            action={
              <button
                className="panel-action-button panel-link-button"
                type="button"
                onClick={onOpenTodoModal}
              >
                <Plus size={15} />
                {t('dashboard.addTodo')}
              </button>
            }
            icon={<ClipboardCheck size={28} />}
            title={t('dashboard.noTodos')}
          />
        )}
      </div>
    </section>
  )
}

export function DashboardSchedulePreviewPanel({
  previewSchedules,
  currentTimeMs,
  onSelect,
  onOpenScheduleModal,
  onNavigate,
}: {
  previewSchedules: ScheduleEvent[]
  currentTimeMs: number
  onSelect: (event: ScheduleEvent) => void
  onOpenScheduleModal: () => void
  onNavigate: (path: string) => void
}) {
  return (
    <section className="workspace-panel dashboard-panel dashboard-panel-schedule">
      <div className="dashboard-panel-heading">
        <PanelTitle icon={<CalendarClock size={18} />} title={t('dashboard.mySchedule')} />
        <div className="dashboard-panel-actions">
          <button
            className="panel-action-button panel-link-button"
            type="button"
            onClick={onOpenScheduleModal}
          >
            <Plus size={15} />
            {t('dashboard.addSchedule')}
          </button>
          <button
            className="panel-action-button panel-link-button"
            type="button"
            onClick={() => onNavigate(dashboardSchedulesPath)}
          >
            {t('common.viewAll')}
          </button>
        </div>
      </div>
      {previewSchedules.length ? (
        <DashboardScheduleTimeline
          currentTimeMs={currentTimeMs}
          events={previewSchedules}
          onSelect={onSelect}
        />
      ) : (
        <EmptyState icon={<CalendarClock size={28} />} title={t('dashboard.noSchedules')} />
      )}
    </section>
  )
}

export function DashboardNotificationsPreviewPanel({
  previewNotifications,
  busyAction,
  onRead,
  onNavigate,
}: {
  previewNotifications: NotificationItem[]
  busyAction: string | null
  onRead: (notification: NotificationItem) => Promise<void>
  onNavigate: (path: string) => void
}) {
  return (
    <section className="workspace-panel dashboard-panel dashboard-panel-reminders">
      <div className="dashboard-panel-heading">
        <PanelTitle icon={<Bell size={18} />} title={t('dashboard.messages')} />
        <button
          className="panel-action-button panel-link-button"
          type="button"
          onClick={() => onNavigate(dashboardNotificationsPath)}
        >
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
                    onClick={() => void onRead(notification)}
                  >
                    {t('dashboard.handle')}
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <EmptyState icon={<Bell size={28} />} title={t('dashboard.noNotifications')} />
        )}
      </div>
    </section>
  )
}

export function DashboardAnnouncementsPreviewPanel({
  previewAnnouncements,
  canPublishAnnouncement,
  onPublish,
  onNavigate,
}: {
  previewAnnouncements: Announcement[]
  canPublishAnnouncement: boolean
  onPublish: () => void
  onNavigate: (path: string) => void
}) {
  return (
    <section className="workspace-panel dashboard-panel dashboard-announcements-panel">
      <div className="dashboard-panel-heading">
        <PanelTitle icon={<FileText size={18} />} title={t('dashboard.companyAnnouncements')} />
        <div className="dashboard-panel-actions">
          {canPublishAnnouncement ? (
            <button
              className="panel-action-button panel-link-button"
              type="button"
              onClick={onPublish}
            >
              <Plus size={15} />
              {t('dashboard.publishAnnouncement')}
            </button>
          ) : null}
          <button
            className="panel-action-button panel-link-button"
            type="button"
            onClick={() => onNavigate(dashboardAnnouncementsPath)}
          >
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
          <EmptyState icon={<FileText size={28} />} title={t('dashboard.noAnnouncements')} />
        )}
      </div>
    </section>
  )
}
