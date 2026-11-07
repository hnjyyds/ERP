import { request } from './core'

export interface QualityInspectionLine {
  id: string
  inspection_id: string
  purchase_contract_line_id: string | null
  product_id: string | null
  product_code: string | null
  product_name: string
  inspected_quantity: string
  failed_quantity: string
  unit: string
  result: string
  remark: string | null
}

export interface QualityIssue {
  id: string
  inspection_id: string
  line_id: string | null
  issue_type: string
  severity: string
  description: string
  corrective_action: string | null
  status: string
  attachment_group_id: string | null
  resolution_note?: string | null
  resolved_at?: string | null
  resolved_by_id?: string | null
  resolved_by_name?: string | null
  attachments?: QualityAttachment[]
}

export interface QualityAttachment {
  id: string
  inspection_id: string
  issue_id: string | null
  category: 'inspection' | 'resolution'
  filename: string
  url: string
  uploaded_by_id: string
  uploaded_by_name: string
  created_at: string
}

export interface QualityInspectionEvent {
  id: string
  inspection_id: string
  event_type: string
  from_status: string | null
  to_status: string | null
  notes: string | null
  actor_user_id: string
  actor_user_name: string
  created_at: string
}

export interface QualityAttachmentPayload {
  filename: string
  url: string
  category: 'inspection' | 'resolution'
}

export type QualityInspectionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface QualityInspection {
  id: string
  code: string
  purchase_contract_id: string
  purchase_contract_no: string
  supplier_id: string | null
  supplier_name: string
  status: QualityInspectionStatus
  scheduled_at: string
  inspected_at: string | null
  result: string | null
  inspector_id: string | null
  inspector_name: string
  qc_user_id: string | null
  qc_user_name: string | null
  issue_summary: string | null
  attachment_group_id: string | null
  parent_inspection_id?: string | null
  reinspection_no?: number
  cancel_reason?: string | null
  owner_user_id: string
  lines: QualityInspectionLine[]
  issues: QualityIssue[]
  attachments?: QualityAttachment[]
  events?: QualityInspectionEvent[]
}

export interface QualityInspectionList {
  items: QualityInspection[]
  total: number
}

export interface QualityInspectionLinePayload {
  purchase_contract_line_id?: string | null
  product_id?: string | null
  product_code?: string | null
  product_name: string
  inspected_quantity: string
  failed_quantity?: string
  unit: string
  result: string
  remark?: string | null
}

export interface QualityIssuePayload {
  purchase_contract_line_id?: string | null
  issue_type: string
  severity: string
  description: string
  corrective_action?: string | null
  status: 'open'
  attachment_group_id?: string | null
}

export interface QualityInspectionPayload {
  purchase_contract_id: string
  status: QualityInspectionStatus
  scheduled_at: string
  inspected_at: string | null
  result: string | null
  inspector_id: string
  inspector_name: string
  issue_summary?: string | null
  attachment_group_id?: string | null
  lines: QualityInspectionLinePayload[]
  issues: QualityIssuePayload[]
  attachments?: QualityAttachmentPayload[]
}

export interface QualityInspectionInboundEligibility {
  purchase_contract_id: string
  eligible: boolean
  latest_inspection_id: string | null
  latest_status?: QualityInspectionStatus | null
  latest_result: string | null
  inspected_at: string | null
  reason: string
}

export function listQualityInspections(filters: {
  q?: string
  status?: string
  result?: string
  supplier_id?: string
  purchase_contract_id?: string
  assignee_user_id?: string
  inspector_user_id?: string
} = {}): Promise<QualityInspectionList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.result) params.set('result', filters.result)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_id) {
    params.set('purchase_contract_id', filters.purchase_contract_id)
  }
  if (filters.assignee_user_id) params.set('assignee_user_id', filters.assignee_user_id)
  if (filters.inspector_user_id) params.set('inspector_user_id', filters.inspector_user_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<QualityInspectionList>(`/quality/inspections${suffix}`)
}

export function createQualityInspection(
  payload: QualityInspectionPayload,
): Promise<QualityInspection> {
  return request<QualityInspection>('/quality/inspections', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateQualityInspection(
  inspectionId: string,
  payload: QualityInspectionPayload,
): Promise<QualityInspection> {
  return request<QualityInspection>(`/quality/inspections/${inspectionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function rescheduleQualityInspection(
  inspectionId: string,
  payload: { scheduled_at: string; reason: string },
): Promise<QualityInspection> {
  return request<QualityInspection>(`/quality/inspections/${inspectionId}/schedule`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function cancelQualityInspection(
  inspectionId: string,
  reason: string,
): Promise<QualityInspection> {
  return request<QualityInspection>(`/quality/inspections/${inspectionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function resolveQualityIssue(
  inspectionId: string,
  issueId: string,
  payload: { resolution_note: string; attachments: QualityAttachmentPayload[] },
): Promise<QualityInspection> {
  return request<QualityInspection>(
    `/quality/inspections/${inspectionId}/issues/${issueId}/resolve`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function createQualityReinspection(
  inspectionId: string,
  payload: { scheduled_at: string; inspector_id: string; reason: string },
): Promise<QualityInspection> {
  return request<QualityInspection>(`/quality/inspections/${inspectionId}/reinspection`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getQualityInboundEligibility(
  purchaseContractId: string,
): Promise<QualityInspectionInboundEligibility> {
  const params = new URLSearchParams({ purchase_contract_id: purchaseContractId })
  return request<QualityInspectionInboundEligibility>(
    `/quality/inspections/inbound-eligibility?${params.toString()}`,
  )
}
