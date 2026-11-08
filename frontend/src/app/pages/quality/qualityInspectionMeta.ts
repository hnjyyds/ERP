import type {
  AssignableUser,
  CurrentUser,
  QualityInspection,
  QualityInspectionListSummary,
  QualityInspectionPayload,
  QualityInspectionStatus,
} from '@/api'
import type { LocalizedOption } from '@/shared/formOptions'
import { ApiError } from '@/shared/errors'
import { t, type TranslationKey } from '@/app/appI18n'
import { emptyToNull } from '@/app/pages/appHelpers'

export type QualityInspectionAssigneeFilter = 'all' | 'mine'

export type QualityInspectionListFilters = {
  search: string
  status: string
  result: string
  supplier: string
  contract: string
  assignee: QualityInspectionAssigneeFilter
}

export function filtersFromUrl(params: URLSearchParams): QualityInspectionListFilters {
  const assignee = params.get('assignee')
  return {
    search: params.get('q') ?? '',
    status: params.get('status') ?? '',
    result: params.get('result') ?? '',
    supplier: params.get('supplier') ?? '',
    contract: params.get('contract') ?? '',
    assignee: assignee === 'mine' ? 'mine' : 'all',
  }
}

export const emptySummary: QualityInspectionListSummary = {
  pending_count: 0,
  in_progress_count: 0,
  completed_count: 0,
  cancelled_count: 0,
  overdue_count: 0,
  open_issue_count: 0,
  my_action_count: 0,
}

export type QualityTaskFormState = {
  code: string
  purchase_contract_id: string
  scheduled_at: string
  inspector_id: string
  inspector_name: string
  task_note: string
  attachment_group_id: string
}

export type QualityTaskValidationField = 'purchase_contract_id' | 'scheduled_at' | 'inspector_id'

export type QualityTaskFormErrors = Partial<Record<QualityTaskValidationField, string>>

export const validationOrder: QualityTaskValidationField[] = [
  'purchase_contract_id',
  'scheduled_at',
  'inspector_id',
]

export const qualityTaskStatusOptions: LocalizedOption[] = [
  { value: 'pending', labelKey: 'quality.inspection.status.pending' },
  { value: 'in_progress', labelKey: 'quality.inspection.status.inProgress' },
  { value: 'completed', labelKey: 'quality.inspection.status.completed' },
  { value: 'cancelled', labelKey: 'quality.inspection.status.cancelled' },
]

export const qualityResultOptions: LocalizedOption[] = [
  { value: 'passed', labelKey: 'quality.inspection.result.passed' },
  { value: 'failed', labelKey: 'quality.inspection.result.failed' },
  { value: 'partial_passed', labelKey: 'quality.inspection.result.partialPassed' },
  { value: 'recheck_required', labelKey: 'quality.inspection.result.recheckRequired' },
]

export const qualityIssueSeverityOptions: LocalizedOption[] = [
  { value: 'minor', labelKey: 'quality.inspection.severity.minor' },
  { value: 'major', labelKey: 'quality.inspection.severity.major' },
  { value: 'critical', labelKey: 'quality.inspection.severity.critical' },
]

export const qualityIssueStatusOptions: LocalizedOption[] = [
  { value: 'open', labelKey: 'quality.inspection.issueStatus.open' },
  { value: 'processing', labelKey: 'quality.inspection.issueStatus.processing' },
  { value: 'resolved', labelKey: 'quality.inspection.issueStatus.resolved' },
  { value: 'closed', labelKey: 'quality.inspection.issueStatus.resolved' },
]

export const fieldLabels: Record<QualityTaskValidationField, TranslationKey> = {
  purchase_contract_id: 'quality.inspection.field.contract',
  scheduled_at: 'quality.inspection.field.scheduledAt',
  inspector_id: 'quality.inspection.field.inspector',
}

export const fieldIds: Record<QualityTaskValidationField, string> = {
  purchase_contract_id: 'quality-contract-id',
  scheduled_at: 'quality-scheduled-at',
  inspector_id: 'quality-inspector-id',
}

const backendFieldMap: Record<string, QualityTaskValidationField> = {
  purchase_contract_id: 'purchase_contract_id',
  scheduled_at: 'scheduled_at',
  inspector_id: 'inspector_id',
  inspector_name: 'inspector_id',
}

function localDateTimeInput(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(
    value.getHours(),
  )}:${pad(value.getMinutes())}`
}

export function defaultScheduledAt(): string {
  const value = new Date()
  value.setDate(value.getDate() + 1)
  value.setHours(9, 0, 0, 0)
  return localDateTimeInput(value)
}

export function formatScheduledAt(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${parsed.getFullYear()}/${pad(parsed.getMonth() + 1)}/${pad(parsed.getDate())} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`
}

export function initialTaskForm(currentUser: CurrentUser): QualityTaskFormState {
  return {
    code: '',
    purchase_contract_id: '',
    scheduled_at: defaultScheduledAt(),
    inspector_id: currentUser.id,
    inspector_name: currentUser.display_name,
    task_note: '',
    attachment_group_id: '',
  }
}

export function validateTaskForm(form: QualityTaskFormState): QualityTaskFormErrors {
  const errors: QualityTaskFormErrors = {}
  if (!form.purchase_contract_id.trim()) {
    errors.purchase_contract_id = t('quality.inspection.validation.contractRequired')
  }
  if (!form.scheduled_at) errors.scheduled_at = t('quality.inspection.validation.scheduledAtRequired')
  if (!form.inspector_id.trim() || !form.inspector_name.trim()) {
    errors.inspector_id = t('quality.inspection.validation.inspectorRequired')
  }
  return errors
}

export function validationErrorsFromApi(error: unknown): QualityTaskFormErrors {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return {}
  return error.details.reduce<QualityTaskFormErrors>((errors, detail) => {
    const field = backendFieldMap[detail.field]
    if (field && !errors[field]) errors[field] = detail.message
    return errors
  }, {})
}

export function taskPayload(form: QualityTaskFormState): QualityInspectionPayload {
  return {
    purchase_contract_id: form.purchase_contract_id.trim(),
    status: 'pending',
    scheduled_at: form.scheduled_at,
    inspected_at: null,
    result: null,
    inspector_id: form.inspector_id.trim(),
    inspector_name: form.inspector_name.trim(),
    issue_summary: emptyToNull(form.task_note),
    attachment_group_id: emptyToNull(form.attachment_group_id),
    lines: [],
    issues: [],
  }
}

export function assignableUserOptionLabel(user: AssignableUser): string {
  return [user.display_name, user.username, user.department_name].filter(Boolean).join(' / ')
}

export function taskStatusLabel(value: QualityInspectionStatus): string {
  const option = qualityTaskStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function taskStatusColor(value: QualityInspectionStatus): string {
  if (value === 'pending') return 'warning'
  if (value === 'in_progress') return 'processing'
  if (value === 'completed') return 'success'
  return 'default'
}

export function resultLabel(value: string | null): string {
  if (!value) return t('quality.inspection.result.undetermined')
  const option = qualityResultOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function resultColor(value: string | null): string {
  if (value === 'passed') return 'success'
  if (value === 'failed') return 'error'
  if (value === 'partial_passed') return 'warning'
  if (value === 'recheck_required') return 'processing'
  return 'default'
}

export function issueSeverityLabel(value: string): string {
  const option = qualityIssueSeverityOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function issueStatusLabel(value: string): string {
  const option = qualityIssueStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function qualityEventLabel(value: string): string {
  const labels: Record<string, TranslationKey> = {
    created: 'quality.inspection.event.created',
    started: 'quality.inspection.event.started',
    completed: 'quality.inspection.event.completed',
    updated: 'quality.inspection.event.updated',
    rescheduled: 'quality.inspection.event.rescheduled',
    cancelled: 'quality.inspection.event.cancelled',
    issue_resolved: 'quality.inspection.event.issueResolved',
    reinspection_created: 'quality.inspection.event.reinspectionCreated',
  }
  const labelKey = labels[value]
  return labelKey ? t(labelKey) : value
}

export function inboundReason(inspection: QualityInspection): string {
  if (inspection.status !== 'completed') return t('quality.inspection.inbound.notCompleted')
  if (inspection.result === 'passed') return t('quality.inspection.inbound.passed')
  if (inspection.result === 'failed') return t('quality.inspection.inbound.failed')
  if (inspection.result === 'partial_passed') return t('quality.inspection.inbound.partialPassed')
  if (inspection.result === 'recheck_required') return t('quality.inspection.inbound.recheckRequired')
  return t('quality.inspection.inbound.waiting')
}

export function isInspectionOverdue(inspection: QualityInspection, now = Date.now()): boolean {
  if (inspection.status === 'completed' || inspection.status === 'cancelled') return false
  const scheduledAt = new Date(inspection.scheduled_at).getTime()
  return !Number.isNaN(scheduledAt) && scheduledAt < now
}

export function hasOpenIssue(inspection: QualityInspection): boolean {
  return inspection.issues.some((issue) => issue.status !== 'resolved')
}

export function nextAction(inspection: QualityInspection): { label: string; color?: string } {
  if (isInspectionOverdue(inspection)) {
    return { label: t('quality.inspection.nextAction.overdue'), color: 'error' }
  }
  if (hasOpenIssue(inspection)) {
    return { label: t('quality.inspection.nextAction.closeIssue'), color: 'error' }
  }
  if (inspection.result === 'recheck_required') {
    return { label: t('quality.inspection.nextAction.reinspectAfterFix'), color: 'processing' }
  }
  if (inspection.result === 'failed') {
    return { label: t('quality.inspection.nextAction.followUp'), color: 'warning' }
  }
  if (inspection.status === 'pending') {
    return { label: t('quality.inspection.nextAction.start'), color: 'warning' }
  }
  if (inspection.status === 'in_progress') {
    return { label: t('quality.inspection.nextAction.complete'), color: 'processing' }
  }
  if (inspection.status === 'completed') {
    return { label: t('quality.inspection.nextAction.viewResult'), color: 'success' }
  }
  return { label: t('quality.inspection.nextAction.viewRecord') }
}

export function taskPriority(inspection: QualityInspection): number {
  if (isInspectionOverdue(inspection)) return 0
  if (hasOpenIssue(inspection)) return 1
  if (inspection.result === 'recheck_required' || inspection.result === 'failed') return 2
  if (inspection.status === 'pending') return 3
  if (inspection.status === 'in_progress') return 4
  return 5
}
