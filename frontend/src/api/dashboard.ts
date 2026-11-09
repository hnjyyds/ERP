import { request } from './core'

export interface Announcement {
  id: string
  title: string
  content: string
  published_at: string
}

export interface TodoTask {
  id: string
  owner_user_id: string
  owner_user_name: string | null
  creator_user_id: string | null
  creator_user_name: string | null
  title: string
  content: string
  source_type: string
  source_id: string | null
  due_at: string | null
  status: string
  is_overdue: boolean
  assignment_type: 'assigned' | 'self'
}

export interface NotificationItem {
  id: string
  owner_user_id: string
  title: string
  message: string
  severity: string
  source_type: string | null
  source_id: string | null
  event: string | null
  target_path: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface NotificationList {
  items: NotificationItem[]
  total: number
  unread_count: number
}

export interface NotificationReadAllResult {
  updated: number
}

export interface ScheduleEvent {
  id: string
  owner_user_id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  created_at: string
}

export interface DashboardShortcut {
  id: string
  owner_user_id: string
  label: string
  target_path: string
  icon: string
  sort_order: number
}

export interface DashboardSummary {
  announcement_count: number
  todo_count: number
  unread_notification_count: number
  today_schedule_count: number
  shortcut_count: number
}

export interface Dashboard {
  announcements: Announcement[]
  todos: TodoTask[]
  notifications: NotificationItem[]
  schedule_events: ScheduleEvent[]
  shortcuts: DashboardShortcut[]
  summary: DashboardSummary
}

export interface ScheduleCreatePayload {
  title: string
  description?: string
  starts_at: string
  ends_at: string
}

export interface AnnouncementCreatePayload {
  title: string
  content: string
}

export interface TodoCreatePayload {
  title: string
  content: string
  assignee_user_ids: string[]
  due_at?: string | null
}

export interface TodoUpdatePayload {
  status?: 'completed' | 'cancelled'
  owner_user_id?: string
  due_at?: string | null
}

export interface TodoCreateResult {
  items: TodoTask[]
}

export interface ShortcutCreatePayload {
  label: string
  target_path: string
  icon?: string
  sort_order?: number
}

export function getDashboard(): Promise<Dashboard> {
  return request<Dashboard>('/dashboard')
}

export function createAnnouncement(payload: AnnouncementCreatePayload): Promise<Announcement> {
  return request<Announcement>('/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createTodos(payload: TodoCreatePayload): Promise<TodoCreateResult> {
  return request<TodoCreateResult>('/todos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTodoTask(todoId: string, payload: TodoUpdatePayload): Promise<TodoTask> {
  return request<TodoTask>(`/todos/${todoId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function listNotifications(params?: {
  unreadOnly?: boolean
  page?: number
  pageSize?: number
}): Promise<NotificationList> {
  const search = new URLSearchParams()
  if (params?.unreadOnly) search.set('unread_only', 'true')
  if (params?.page) search.set('page', String(params.page))
  if (params?.pageSize) search.set('page_size', String(params.pageSize))
  const query = search.toString()
  return request<NotificationList>(`/notifications${query ? `?${query}` : ''}`)
}

export function markAllNotificationsRead(): Promise<NotificationReadAllResult> {
  return request<NotificationReadAllResult>('/notifications/read-all', { method: 'POST' })
}

export function deleteNotification(notificationId: string): Promise<NotificationItem> {
  return request<NotificationItem>(`/notifications/${notificationId}`, { method: 'DELETE' })
}

export function markNotificationRead(notificationId: string): Promise<NotificationItem> {
  return request<NotificationItem>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  })
}

export function createDashboardShortcut(payload: ShortcutCreatePayload): Promise<DashboardShortcut> {
  return request<DashboardShortcut>('/shortcuts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteDashboardShortcut(shortcutId: string): Promise<DashboardShortcut> {
  return request<DashboardShortcut>(`/shortcuts/${shortcutId}`, {
    method: 'DELETE',
  })
}

export function createScheduleEvent(payload: ScheduleCreatePayload): Promise<ScheduleEvent> {
  return request<ScheduleEvent>('/schedules', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type ScheduleUpdatePayload = Partial<ScheduleCreatePayload>

export function updateScheduleEvent(
  scheduleId: string,
  payload: ScheduleUpdatePayload,
): Promise<ScheduleEvent> {
  return request<ScheduleEvent>(`/schedules/${scheduleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteScheduleEvent(scheduleId: string): Promise<ScheduleEvent> {
  return request<ScheduleEvent>(`/schedules/${scheduleId}`, {
    method: 'DELETE',
  })
}
