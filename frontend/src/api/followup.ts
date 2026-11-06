import { request } from './core'

export interface FollowProcessTemplateNode {
  id: string
  template_id: string
  node_code: string
  node_name: string
  sequence_no: number
  standard_days: number
  remind_before_days: number
  actual_date_source: string
}

export interface FollowProcessTemplate {
  id: string
  name: string
  enabled: boolean
  is_default: boolean
  owner_user_id: string
  nodes: FollowProcessTemplateNode[]
}

export interface FollowProcessTemplateList {
  items: FollowProcessTemplate[]
  total: number
}

export interface FollowProcessTemplateNodePayload {
  node_code: string
  node_name: string
  sequence_no: number
  standard_days: number
  remind_before_days: number
  actual_date_source: string
}

export interface FollowProcessTemplatePayload {
  name: string
  enabled: boolean
  is_default: boolean
  nodes: FollowProcessTemplateNodePayload[]
}

export interface PurchaseFollowNode {
  id: string
  follow_plan_id: string
  node_code: string
  node_name: string
  sequence_no: number
  planned_date: string
  remind_date: string
  actual_date: string | null
  status: string
  source_record_type: string | null
  source_record_id: string | null
  source_summary: string | null
  overdue_days: number
}

export interface PurchaseFollowPlan {
  id: string
  purchase_contract_id: string
  purchase_contract_no: string
  supplier_id: string | null
  supplier_name: string
  template_id: string
  base_date: string
  overall_status: string
  owner_user_id: string
  nodes: PurchaseFollowNode[]
}

export interface PurchaseFollowPlanList {
  items: PurchaseFollowPlan[]
  total: number
}

export interface PurchaseFollowOverdueNode {
  id: string
  follow_plan_id: string
  purchase_contract_id: string
  purchase_contract_no: string
  supplier_name: string
  node_code: string
  node_name: string
  planned_date: string
  remind_date: string
  overdue_days: number
  source_record_type: string | null
  source_record_id: string | null
}

export interface PurchaseFollowOverdueNodeList {
  items: PurchaseFollowOverdueNode[]
  total: number
}

export interface PurchaseFollowPlanGeneratePayload {
  purchase_contract_id: string
  as_of?: string | null
}

export interface FollowSourceEventPayload {
  purchase_contract_id: string
  node_code: string
  source_record_type: string
  source_record_id: string
  actual_date: string
  source_summary: string
}

export function listFollowupTemplates(): Promise<FollowProcessTemplateList> {
  return request<FollowProcessTemplateList>('/followup/templates')
}

export function createFollowupTemplate(
  payload: FollowProcessTemplatePayload,
): Promise<FollowProcessTemplate> {
  return request<FollowProcessTemplate>('/followup/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateFollowupTemplate(
  templateId: string,
  payload: FollowProcessTemplatePayload,
): Promise<FollowProcessTemplate> {
  return request<FollowProcessTemplate>(`/followup/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function listFollowupPlans(filters: {
  q?: string
  overall_status?: string
  supplier_id?: string
  purchase_contract_id?: string
} = {}): Promise<PurchaseFollowPlanList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.overall_status) params.set('overall_status', filters.overall_status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_id) params.set('purchase_contract_id', filters.purchase_contract_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PurchaseFollowPlanList>(`/followup/plans${suffix}`)
}

export function generateFollowupPlanFromPurchaseContract(
  payload: PurchaseFollowPlanGeneratePayload,
): Promise<PurchaseFollowPlan> {
  return request<PurchaseFollowPlan>('/followup/plans/from-purchase-contract', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function syncFollowupSampleEvents(
  payload: PurchaseFollowPlanGeneratePayload,
): Promise<PurchaseFollowPlan> {
  return request<PurchaseFollowPlan>('/followup/sample-events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function syncFollowupSourceEvent(
  payload: FollowSourceEventPayload,
): Promise<PurchaseFollowPlan> {
  return request<PurchaseFollowPlan>('/followup/source-events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listFollowupOverdueNodes(asOf: string): Promise<PurchaseFollowOverdueNodeList> {
  return request<PurchaseFollowOverdueNodeList>(`/followup/overdue-nodes?as_of=${asOf}`)
}
