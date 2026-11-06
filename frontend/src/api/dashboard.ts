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
  assignment_type: 'assigned' | 'self'
}

export interface NotificationItem {
  id: string
  owner_user_id: string
  title: string
  message: string
  severity: string
  is_read: boolean
  created_at: string
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

export function deleteScheduleEvent(scheduleId: string): Promise<ScheduleEvent> {
  return request<ScheduleEvent>(`/schedules/${scheduleId}`, {
    method: 'DELETE',
  })
}
