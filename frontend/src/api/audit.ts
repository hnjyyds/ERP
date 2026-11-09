import { request } from './core'

export interface AuditLogItem {
  id: string
  actor_user_id: string
  actor_name: string
  action: string
  resource_type: string
  resource_id: string | null
  resource_no: string | null
  summary: string
  payload: string | null
  created_at: string
}

export interface AuditLogList {
  items: AuditLogItem[]
  total: number
}

export interface AuditLogQuery {
  created_from?: string
  created_to?: string
  actor?: string
  resource_type?: string
  action?: string
  keyword?: string
  limit?: number
  offset?: number
}

export interface AuditLogExport {
  filename: string
  content_type: string
  content: string
}

function auditQueryString(query: AuditLogQuery): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const suffix = params.toString()
  return suffix ? `?${suffix}` : ''
}

export function listAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogList> {
  return request<AuditLogList>(`/audit-logs${auditQueryString(query)}`)
}

export function exportAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogExport> {
  return request<AuditLogExport>(`/audit-logs/export${auditQueryString(query)}`)
}
