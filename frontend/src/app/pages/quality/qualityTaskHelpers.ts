import type {
  QualityInspection,
  QualityInspectionListSummary,
  QualityInspectionPayload,
  QualityInspectionStatus,
} from '@/api'
import type { LocalizedOption } from '@/shared/formOptions'
import { t } from '@/app/appI18n'

export type CompletionLineState = {
  purchase_contract_line_id: string
  product_id: string
  product_code: string
  product_name: string
  inspected_quantity: string
  failed_quantity: string
  unit: string
  result: string
  remark: string
}

export type CompletionIssueState = {
  purchase_contract_line_id: string
  issue_type: string
  severity: string
  description: string
  corrective_action: string
}

export type CompletionFormState = {
  inspected_at: string
  result: string
  lines: CompletionLineState[]
  issue: CompletionIssueState
  attachments: Array<{ filename: string; url: string; category: 'inspection' }>
}

export type CompletionErrors = Record<string, string>

export type TaskListFilters = {
  q?: string
  status?: string
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

export function filtersFromUrl(params: URLSearchParams): TaskListFilters {
  return {
    q: params.get('q')?.trim() || undefined,
    status: params.get('status') || undefined,
  }
}

export const qualityTaskStatusOptions: LocalizedOption[] = [
  { value: 'pending', labelKey: 'quality.task.status.pending' },
  { value: 'in_progress', labelKey: 'quality.task.status.inProgress' },
  { value: 'completed', labelKey: 'quality.task.status.completed' },
  { value: 'cancelled', labelKey: 'quality.task.status.cancelled' },
]

export const qualityResultOptions: LocalizedOption[] = [
  { value: 'passed', labelKey: 'quality.task.result.passed' },
  { value: 'failed', labelKey: 'quality.task.result.failed' },
  { value: 'partial_passed', labelKey: 'quality.task.result.partialPassed' },
  { value: 'recheck_required', labelKey: 'quality.task.result.recheckRequired' },
]

export const qualityIssueSeverityOptions: LocalizedOption[] = [
  { value: 'minor', labelKey: 'quality.task.severity.minor' },
  { value: 'major', labelKey: 'quality.task.severity.major' },
  { value: 'critical', labelKey: 'quality.task.severity.critical' },
]

export function today(): string {
  const value = new Date()
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

export function formatScheduledAt(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${parsed.getFullYear()}/${pad(parsed.getMonth() + 1)}/${pad(parsed.getDate())} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`
}

export function statusLabel(value: QualityInspectionStatus): string {
  const option = qualityTaskStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function statusColor(value: QualityInspectionStatus): string {
  if (value === 'pending') return 'warning'
  if (value === 'in_progress') return 'processing'
  if (value === 'completed') return 'success'
  return 'default'
}

export function resultLabel(value: string | null): string {
  if (!value) return t('quality.task.result.undetermined')
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

export function initialCompletionForm(task: QualityInspection): CompletionFormState {
  return {
    inspected_at: task.inspected_at ?? today(),
    result: task.result ?? 'passed',
    lines: task.lines.map((line) => ({
      purchase_contract_line_id: line.purchase_contract_line_id ?? '',
      product_id: line.product_id ?? '',
      product_code: line.product_code ?? '',
      product_name: line.product_name,
      inspected_quantity: line.inspected_quantity,
      failed_quantity: line.failed_quantity,
      unit: line.unit,
      result: line.result,
      remark: line.remark ?? '',
    })),
    issue: {
      purchase_contract_line_id: task.lines[0]?.purchase_contract_line_id ?? '',
      issue_type: '',
      severity: 'major',
      description: '',
      corrective_action: '',
    },
    attachments: [],
  }
}

export function basePayload(
  task: QualityInspection,
  status: QualityInspectionStatus,
): QualityInspectionPayload {
  return {
    purchase_contract_id: task.purchase_contract_id,
    status,
    scheduled_at: task.scheduled_at,
    inspected_at: null,
    result: null,
    inspector_id: task.inspector_id ?? '',
    inspector_name: task.inspector_name,
    issue_summary: task.issue_summary,
    attachment_group_id: task.attachment_group_id,
    lines: [],
    issues: [],
    attachments: [],
  }
}

export function completionPayload(
  task: QualityInspection,
  form: CompletionFormState,
): QualityInspectionPayload {
  const issues = form.issue.description.trim()
    ? [
        {
          purchase_contract_line_id: form.issue.purchase_contract_line_id || null,
          issue_type: form.issue.issue_type.trim(),
          severity: form.issue.severity,
          description: form.issue.description.trim(),
          corrective_action: form.issue.corrective_action.trim() || null,
          status: 'open' as const,
          attachment_group_id: null,
        },
      ]
    : []
  return {
    ...basePayload(task, 'completed'),
    inspected_at: form.inspected_at,
    result: form.result,
    lines: form.lines.map((line) => ({
      purchase_contract_line_id: line.purchase_contract_line_id.trim() || null,
      product_id: line.product_id.trim() || null,
      product_code: line.product_code.trim() || null,
      product_name: line.product_name.trim(),
      inspected_quantity: line.inspected_quantity,
      failed_quantity: line.failed_quantity || '0',
      unit: line.unit.trim(),
      result: line.result,
      remark: line.remark.trim() || null,
    })),
    issues,
    attachments: form.attachments,
  }
}

export function validateCompletion(form: CompletionFormState): CompletionErrors {
  const errors: CompletionErrors = {}
  if (!form.inspected_at) errors.inspected_at = t('quality.task.validation.inspectedAtRequired')
  if (!qualityResultOptions.some((option) => option.value === form.result)) {
    errors.result = t('quality.task.validation.resultRequired')
  }
  if (form.lines.length === 0) errors.lines = t('quality.task.validation.linesRequired')
  form.lines.forEach((line, index) => {
    const prefix = `line-${index}`
    if (!line.product_name.trim()) {
      errors[`${prefix}-product_name`] = t('quality.task.validation.productNameRequired')
    }
    const inspectedQuantity = Number(line.inspected_quantity)
    if (
      !line.inspected_quantity.trim() ||
      !Number.isFinite(inspectedQuantity) ||
      inspectedQuantity <= 0
    ) {
      errors[`${prefix}-inspected_quantity`] = t('quality.task.validation.inspectedQuantityInvalid')
    }
    const failedQuantity = Number(line.failed_quantity)
    if (
      !Number.isFinite(failedQuantity) ||
      failedQuantity < 0 ||
      failedQuantity > inspectedQuantity
    ) {
      errors[`${prefix}-failed_quantity`] = t('quality.task.validation.failedQuantityInvalid')
    }
    if (!line.unit.trim()) errors[`${prefix}-unit`] = t('quality.task.validation.unitRequired')
    if (!qualityResultOptions.some((option) => option.value === line.result)) {
      errors[`${prefix}-result`] = t('quality.task.validation.lineResultRequired')
    }
    if (form.result === 'passed' && (failedQuantity > 0 || line.result !== 'passed')) {
      errors[`${prefix}-result`] = t('quality.task.validation.lineResultMustPass')
    }
  })
  if (form.result !== 'passed' && !form.issue.description.trim()) {
    errors.issue_description = t('quality.task.validation.issueDescriptionRequired')
  }
  if (form.result === 'passed' && form.issue.description.trim()) {
    errors.issue_description = t('quality.task.validation.issueDescriptionNotAllowed')
  }
  return errors
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () =>
      reject(reader.error ?? new Error(t('quality.task.message.fileReadFailed')))
    reader.readAsDataURL(file)
  })
}
