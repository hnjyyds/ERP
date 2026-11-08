import { Alert, Button, Input, Modal, Table, Tag } from 'antd'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Paperclip,
  Play,
  Search,
  XCircle,
} from 'lucide-react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import {
  cancelQualityInspection,
  listPurchaseContracts,
  listQualityInspections,
  rescheduleQualityInspection,
  updateQualityInspection,
  uploadImage,
  type CurrentUser,
  type QualityInspection,
  type QualityInspectionListSummary,
  type QualityInspectionPayload,
  type QualityInspectionStatus,
} from '@/api'
import type { LocalizedOption } from '@/shared/formOptions'
import { showError, showWarningDialog } from '@/shared/errors'
import { FormSelect, ListPageShell, Metric } from '@/shared/ui'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { t } from '@/app/appI18n'

type Props = { currentUser: CurrentUser }

type CompletionLineState = {
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

type CompletionIssueState = {
  purchase_contract_line_id: string
  issue_type: string
  severity: string
  description: string
  corrective_action: string
}

type CompletionFormState = {
  inspected_at: string
  result: string
  lines: CompletionLineState[]
  issue: CompletionIssueState
  attachments: Array<{ filename: string; url: string; category: 'inspection' }>
}

type CompletionErrors = Record<string, string>

type TaskListFilters = {
  q?: string
  status?: string
}

const emptySummary: QualityInspectionListSummary = {
  pending_count: 0,
  in_progress_count: 0,
  completed_count: 0,
  cancelled_count: 0,
  overdue_count: 0,
  open_issue_count: 0,
  my_action_count: 0,
}

function filtersFromUrl(params: URLSearchParams): TaskListFilters {
  return {
    q: params.get('q')?.trim() || undefined,
    status: params.get('status') || undefined,
  }
}

const qualityTaskStatusOptions: LocalizedOption[] = [
  { value: 'pending', labelKey: 'quality.task.status.pending' },
  { value: 'in_progress', labelKey: 'quality.task.status.inProgress' },
  { value: 'completed', labelKey: 'quality.task.status.completed' },
  { value: 'cancelled', labelKey: 'quality.task.status.cancelled' },
]

const qualityResultOptions: LocalizedOption[] = [
  { value: 'passed', labelKey: 'quality.task.result.passed' },
  { value: 'failed', labelKey: 'quality.task.result.failed' },
  { value: 'partial_passed', labelKey: 'quality.task.result.partialPassed' },
  { value: 'recheck_required', labelKey: 'quality.task.result.recheckRequired' },
]

const qualityIssueSeverityOptions: LocalizedOption[] = [
  { value: 'minor', labelKey: 'quality.task.severity.minor' },
  { value: 'major', labelKey: 'quality.task.severity.major' },
  { value: 'critical', labelKey: 'quality.task.severity.critical' },
]

function today(): string {
  const value = new Date()
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function formatScheduledAt(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${parsed.getFullYear()}/${pad(parsed.getMonth() + 1)}/${pad(parsed.getDate())} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`
}

function statusLabel(value: QualityInspectionStatus): string {
  const option = qualityTaskStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function statusColor(value: QualityInspectionStatus): string {
  if (value === 'pending') return 'warning'
  if (value === 'in_progress') return 'processing'
  if (value === 'completed') return 'success'
  return 'default'
}

function resultLabel(value: string | null): string {
  if (!value) return t('quality.task.result.undetermined')
  const option = qualityResultOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function resultColor(value: string | null): string {
  if (value === 'passed') return 'success'
  if (value === 'failed') return 'error'
  if (value === 'partial_passed') return 'warning'
  if (value === 'recheck_required') return 'processing'
  return 'default'
}

function initialCompletionForm(task: QualityInspection): CompletionFormState {
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

function basePayload(
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

function completionPayload(
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

function validateCompletion(form: CompletionFormState): CompletionErrors {
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

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <span className="form-field-label">
      {children}
      <span aria-hidden="true" className="form-required-mark">
        *
      </span>
    </span>
  )
}

function CompletionError({ field, errors }: { field: string; errors: CompletionErrors }) {
  const message = errors[field]
  if (!message) return null
  return (
    <span className="form-field-error" id={`quality-task-${field}-error`}>
      {message}
    </span>
  )
}

export function MyQualityTasksPage({ currentUser }: Props) {
  const [tasks, setTasks] = useState<QualityInspection[]>([])
  const [summary, setSummary] = useState<QualityInspectionListSummary>(emptySummary)
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )
  const [statusFilter, setStatusFilter] = useState(() => urlQuery.params.get('status') ?? '')
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [loading, setLoading] = useState(false)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [completionTask, setCompletionTask] = useState<QualityInspection | null>(null)
  const [completionForm, setCompletionForm] = useState<CompletionFormState | null>(null)
  const [completionErrors, setCompletionErrors] = useState<CompletionErrors>({})
  const [actionTask, setActionTask] = useState<QualityInspection | null>(null)
  const [actionMode, setActionMode] = useState<'reschedule' | 'cancel' | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [actionSchedule, setActionSchedule] = useState('')
  const [uploadingEvidence, setUploadingEvidence] = useState(false)

  useEffect(() => {
    void loadTasks()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    setSearch(urlQuery.params.get('q') ?? '')
    setStatusFilter(urlQuery.params.get('status') ?? '')
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadTasks(nextPage, pageSize, filtersFromUrl(urlQuery.params))
  }, [urlQuery.search])

  async function loadTasks(
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: TaskListFilters,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    const filters = filtersOverride ?? currentFilters()
    setLoading(true)
    try {
      const result = await listQualityInspections({
        inspector_user_id: currentUser.id,
        ...filters,
        limit: resolvedPageSize,
        offset: (resolvedPage - 1) * resolvedPageSize,
      })
      setTotal(result.total)
      setSummary(result.summary)
      if (result.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadTasks(prevPage, resolvedPageSize, filtersOverride)
        return
      }
      setTasks(result.items)
    } catch (caught) {
      showError(caught, t('quality.task.message.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function currentFilters(): TaskListFilters {
    return {
      q: search.trim() || undefined,
      status: statusFilter || undefined,
    }
  }

  async function startTask(task: QualityInspection) {
    setSubmittingId(task.id)
    setMessage('')
    try {
      await updateQualityInspection(task.id, basePayload(task, 'in_progress'))
      setMessage(t('quality.task.message.started', { code: task.code }))
      await loadTasks()
    } catch (caught) {
      showError(caught, t('quality.task.message.statusUpdateFailed'))
    } finally {
      setSubmittingId(null)
    }
  }

  async function openCompletion(task: QualityInspection) {
    setCompletionTask(task)
    setCompletionForm(initialCompletionForm(task))
    setCompletionErrors({})
    try {
      const result = await listPurchaseContracts({ q: task.purchase_contract_no })
      const contract = result.items.find((item) => item.id === task.purchase_contract_id)
      if (!contract?.lines.length) return
      setCompletionForm((current) =>
        current
          ? {
              ...current,
              lines: contract.lines.map((line) => ({
                purchase_contract_line_id: line.id,
                product_id: line.product_id ?? '',
                product_code: line.product_code ?? '',
                product_name: line.product_name,
                inspected_quantity: line.quantity,
                failed_quantity: '0',
                unit: line.unit,
                result: current.result,
                remark: '',
              })),
              issue: {
                ...current.issue,
                purchase_contract_line_id: contract.lines[0].id,
              },
            }
          : current,
      )
    } catch (caught) {
      showError(caught, t('quality.task.message.contractLinesLoadFailed'))
    }
  }

  function updateCompletionField(field: 'inspected_at' | 'result', value: string) {
    setCompletionForm((current) => (current ? { ...current, [field]: value } : current))
    setCompletionErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function updateCompletionLine(index: number, field: keyof CompletionLineState, value: string) {
    setCompletionForm((current) => {
      if (!current) return current
      const lines = current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      )
      return { ...current, lines }
    })
    setCompletionErrors((current) => {
      const key = `line-${index}-${field}`
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function updateIssueField(field: keyof CompletionIssueState, value: string) {
    setCompletionForm((current) =>
      current ? { ...current, issue: { ...current.issue, [field]: value } } : current,
    )
    if (field !== 'description') return
    setCompletionErrors((current) => {
      if (!current.issue_description) return current
      const next = { ...current }
      delete next.issue_description
      return next
    })
  }

  async function handleEvidenceUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showWarningDialog(t('quality.task.message.evidenceImageOnly'))
      return
    }
    setUploadingEvidence(true)
    try {
      const uploaded = await uploadImage(file.name, await readFileAsDataUrl(file))
      setCompletionForm((current) =>
        current
          ? {
              ...current,
              attachments: [
                ...current.attachments,
                { filename: uploaded.filename, url: uploaded.url, category: 'inspection' },
              ],
            }
          : current,
      )
    } catch (caught) {
      showError(caught, t('quality.task.message.evidenceUploadFailed'))
    } finally {
      setUploadingEvidence(false)
    }
  }

  async function submitCompletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!completionTask || !completionForm) return
    const errors = validateCompletion(completionForm)
    if (Object.keys(errors).length > 0) {
      setCompletionErrors(errors)
      showWarningDialog(
        t('quality.task.message.validationSummary', { count: Object.keys(errors).length }),
      )
      return
    }
    setSubmittingId(completionTask.id)
    try {
      const updated = await updateQualityInspection(
        completionTask.id,
        completionPayload(completionTask, completionForm),
      )
      setTasks((current) => current.map((item) => (item.id === completionTask.id ? updated : item)))
      setCompletionTask(null)
      setCompletionForm(null)
      await loadTasks()
      setMessage(
        t('quality.task.message.completed', {
          code: updated.code,
          result: resultLabel(updated.result),
        }),
      )
    } catch (caught) {
      showError(caught, t('quality.task.message.completionSaveFailed'))
    } finally {
      setSubmittingId(null)
    }
  }

  function openTaskAction(task: QualityInspection, mode: 'reschedule' | 'cancel') {
    setActionTask(task)
    setActionMode(mode)
    setActionReason('')
    setActionSchedule(task.scheduled_at.slice(0, 16))
  }

  async function submitTaskAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actionTask || !actionMode || !actionReason.trim()) {
      showWarningDialog(
        actionMode === 'cancel'
          ? t('quality.task.message.cancelReasonRequired')
          : t('quality.task.message.rescheduleReasonRequired'),
      )
      return
    }
    setSubmittingId(actionTask.id)
    try {
      const updated =
        actionMode === 'cancel'
          ? await cancelQualityInspection(actionTask.id, actionReason.trim())
          : await rescheduleQualityInspection(actionTask.id, {
              scheduled_at: actionSchedule,
              reason: actionReason.trim(),
            })
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setMessage(
        actionMode === 'cancel'
          ? t('quality.task.message.cancelled', { code: updated.code })
          : t('quality.task.message.rescheduled', { code: updated.code }),
      )
      setActionTask(null)
      setActionMode(null)
      await loadTasks()
    } catch (caught) {
      showError(
        caught,
        actionMode === 'cancel'
          ? t('quality.task.message.cancelFailed')
          : t('quality.task.message.rescheduleFailed'),
      )
    } finally {
      setSubmittingId(null)
    }
  }

  const pendingCount = summary.pending_count
  const inProgressCount = summary.in_progress_count
  const completedCount = summary.completed_count
  const overdueCount = summary.overdue_count

  return (
    <section className="quality-inspection-page">
      <div className="summary-strip" aria-label={t('quality.task.pageAria')}>
        <Metric label={t('quality.task.metric.tasks')} value={total} />
        <Metric
          label={t('quality.task.metric.pending')}
          value={pendingCount}
          intent={pendingCount ? 'warning' : 'normal'}
        />
        <Metric
          label={t('quality.task.metric.inProgress')}
          value={inProgressCount}
          intent={inProgressCount ? 'warning' : 'normal'}
        />
        <Metric label={t('quality.task.metric.completed')} value={completedCount} />
        <Metric
          label={t('quality.task.metric.overdue')}
          value={overdueCount}
          intent={overdueCount ? 'danger' : 'normal'}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <ListPageShell
        className="product-list-panel"
        icon={<ClipboardCheck size={18} />}
        title={t('quality.task.panel.listTitle')}
      >
        <form
          className="inline-filters"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            appliedUrlSearchRef.current = urlQuery.update({
              q: search.trim(),
              status: statusFilter,
              page: null,
            })
            void loadTasks(1, pageSize)
          }}
        >
          <label>
            {t('quality.task.filter.search')}
            <Input
              placeholder={t('quality.task.filter.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            {t('quality.task.filter.status')}
            <FormSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">{t('quality.task.filter.allStatuses')}</option>
              {qualityTaskStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label>
            <span>&nbsp;</span>
            <Button htmlType="submit" icon={<Search size={16} />}>
              {t('quality.task.action.query')}
            </Button>
          </label>
        </form>

        <Table<QualityInspection>
          columns={[
            { title: t('quality.task.table.code'), dataIndex: 'code' },
            { title: t('quality.task.table.contract'), dataIndex: 'purchase_contract_no' },
            { title: t('quality.task.table.supplier'), dataIndex: 'supplier_name' },
            {
              title: t('quality.task.table.scheduledAt'),
              dataIndex: 'scheduled_at',
              render: (value: string, task) => (
                <span
                  className={
                    task.status === 'pending' && new Date(value).getTime() < Date.now()
                      ? 'task-schedule-overdue'
                      : undefined
                  }
                >
                  {formatScheduledAt(value)}
                </span>
              ),
            },
            {
              title: t('quality.task.table.status'),
              dataIndex: 'status',
              render: (value: QualityInspectionStatus) => (
                <Tag color={statusColor(value)}>{statusLabel(value)}</Tag>
              ),
            },
            {
              title: t('quality.task.table.result'),
              dataIndex: 'result',
              render: (value: string | null) => (
                <Tag color={resultColor(value)}>{resultLabel(value)}</Tag>
              ),
            },
            {
              title: t('quality.task.table.operation'),
              key: 'actions',
              width: 340,
              render: (_: unknown, task) => (
                <div className="table-actions">
                  {task.status === 'pending' ? (
                    <Button
                      icon={<Play size={15} />}
                      loading={submittingId === task.id}
                      size="small"
                      type="primary"
                      onClick={() => void startTask(task)}
                    >
                      {t('quality.task.action.start')}
                    </Button>
                  ) : null}
                  {task.status === 'in_progress' ? (
                    <Button
                      icon={<CheckCircle2 size={15} />}
                      size="small"
                      type="primary"
                      onClick={() => void openCompletion(task)}
                    >
                      {t('quality.task.action.registerResult')}
                    </Button>
                  ) : null}
                  {task.status === 'pending' || task.status === 'in_progress' ? (
                    <Button
                      icon={<CalendarClock size={15} />}
                      size="small"
                      onClick={() => openTaskAction(task, 'reschedule')}
                    >
                      {t('quality.task.action.reschedule')}
                    </Button>
                  ) : null}
                  {task.status === 'pending' || task.status === 'in_progress' ? (
                    <Button
                      danger
                      icon={<XCircle size={15} />}
                      size="small"
                      onClick={() => openTaskAction(task, 'cancel')}
                    >
                      {t('quality.task.action.cancel')}
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
          dataSource={tasks}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (nextPage, nextPageSize) => {
              const next = changePage(nextPage, nextPageSize)
              appliedUrlSearchRef.current = urlQuery.update({
                page: next.page === 1 ? null : next.page,
              })
              void loadTasks(next.page, next.pageSize)
            },
          }}
          rowKey="id"
          size="small"
        />
      </ListPageShell>

      <Modal
        centered
        footer={null}
        open={Boolean(completionTask && completionForm)}
        title={
          completionTask
            ? t('quality.task.modal.completionTitleWithCode', { code: completionTask.code })
            : t('quality.task.modal.completionTitle')
        }
        width={920}
        onCancel={() => {
          setCompletionTask(null)
          setCompletionForm(null)
          setCompletionErrors({})
        }}
      >
        {completionTask && completionForm ? (
          <div className="workflow-modal-content entity-modal-form">
            <Alert
              showIcon
              title={t('quality.task.modal.scheduleSummary', {
                schedule: formatScheduledAt(completionTask.scheduled_at),
              })}
              description={`${completionTask.purchase_contract_no} / ${completionTask.supplier_name}`}
              type="info"
            />
            <form className="record-form" noValidate onSubmit={submitCompletion}>
              <div className="form-divider">{t('quality.task.modal.resultSection')}</div>
              <div className="form-pair two">
                <label htmlFor="quality-task-inspected-at">
                  <RequiredLabel>{t('quality.task.field.inspectedAt')}</RequiredLabel>
                  <Input
                    aria-invalid={Boolean(completionErrors.inspected_at)}
                    id="quality-task-inspected-at"
                    required
                    status={completionErrors.inspected_at ? 'error' : undefined}
                    type="date"
                    value={completionForm.inspected_at}
                    onChange={(event) => updateCompletionField('inspected_at', event.target.value)}
                  />
                  <CompletionError field="inspected_at" errors={completionErrors} />
                </label>
                <label htmlFor="quality-task-result">
                  <RequiredLabel>{t('quality.task.field.result')}</RequiredLabel>
                  <FormSelect
                    aria-invalid={Boolean(completionErrors.result)}
                    id="quality-task-result"
                    required
                    status={completionErrors.result ? 'error' : undefined}
                    value={completionForm.result}
                    onChange={(event) => {
                      updateCompletionField('result', event.target.value)
                      setCompletionForm((current) =>
                        current
                          ? {
                              ...current,
                              lines: current.lines.map((line) => ({
                                ...line,
                                result: event.target.value,
                                failed_quantity:
                                  event.target.value === 'passed' ? '0' : line.failed_quantity,
                              })),
                            }
                          : current,
                      )
                    }}
                  >
                    {qualityResultOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                  <CompletionError field="result" errors={completionErrors} />
                </label>
              </div>

              <div className="form-divider">{t('quality.task.modal.linesSection')}</div>
              {completionErrors.lines ? (
                <Alert showIcon title={completionErrors.lines} type="error" />
              ) : null}
              <div className="quality-line-editor-list">
                {completionForm.lines.map((line, index) => {
                  const prefix = `line-${index}`
                  return (
                    <section
                      className="quality-line-editor"
                      key={line.purchase_contract_line_id || index}
                    >
                      <div className="accessory-heading">
                        <strong>
                          {line.product_code ||
                            t('quality.task.modal.lineFallback', { index: index + 1 })}
                        </strong>
                        <span>{t('quality.task.modal.contractLine', { index: index + 1 })}</span>
                      </div>
                      <label htmlFor={`${prefix}-product-name`}>
                        <RequiredLabel>{t('quality.task.field.productName')}</RequiredLabel>
                        <Input id={`${prefix}-product-name`} readOnly value={line.product_name} />
                      </label>
                      <div className="form-pair three">
                        <label htmlFor={`${prefix}-inspected-quantity`}>
                          <RequiredLabel>{t('quality.task.field.inspectedQuantity')}</RequiredLabel>
                          <Input
                            id={`${prefix}-inspected-quantity`}
                            min="0.0001"
                            step="0.0001"
                            type="number"
                            value={line.inspected_quantity}
                            onChange={(event) =>
                              updateCompletionLine(index, 'inspected_quantity', event.target.value)
                            }
                          />
                          <CompletionError
                            field={`${prefix}-inspected_quantity`}
                            errors={completionErrors}
                          />
                        </label>
                        <label htmlFor={`${prefix}-failed-quantity`}>
                          {t('quality.task.field.failedQuantity')}
                          <Input
                            id={`${prefix}-failed-quantity`}
                            min="0"
                            step="0.0001"
                            type="number"
                            value={line.failed_quantity}
                            onChange={(event) =>
                              updateCompletionLine(index, 'failed_quantity', event.target.value)
                            }
                          />
                          <CompletionError
                            field={`${prefix}-failed_quantity`}
                            errors={completionErrors}
                          />
                        </label>
                        <label htmlFor={`${prefix}-unit`}>
                          <RequiredLabel>{t('quality.task.field.unit')}</RequiredLabel>
                          <Input id={`${prefix}-unit`} readOnly value={line.unit} />
                        </label>
                      </div>
                      <div className="form-pair two">
                        <label htmlFor={`${prefix}-result`}>
                          <RequiredLabel>{t('quality.task.field.lineResult')}</RequiredLabel>
                          <FormSelect
                            id={`${prefix}-result`}
                            value={line.result}
                            onChange={(event) =>
                              updateCompletionLine(index, 'result', event.target.value)
                            }
                          >
                            {qualityResultOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {t(option.labelKey)}
                              </option>
                            ))}
                          </FormSelect>
                          <CompletionError field={`${prefix}-result`} errors={completionErrors} />
                        </label>
                        <label htmlFor={`${prefix}-remark`}>
                          {t('quality.task.field.lineRemark')}
                          <Input
                            id={`${prefix}-remark`}
                            value={line.remark}
                            onChange={(event) =>
                              updateCompletionLine(index, 'remark', event.target.value)
                            }
                          />
                        </label>
                      </div>
                    </section>
                  )
                })}
              </div>

              <div className="form-divider">{t('quality.task.modal.issuesSection')}</div>
              {completionForm.result === 'passed' ? (
                <Alert showIcon title={t('quality.task.modal.passedNoIssue')} type="info" />
              ) : null}
              <div className="form-pair two">
                <label htmlFor="quality-task-issue-line">
                  {t('quality.task.field.issueLine')}
                  <FormSelect
                    id="quality-task-issue-line"
                    value={completionForm.issue.purchase_contract_line_id}
                    onChange={(event) =>
                      updateIssueField('purchase_contract_line_id', event.target.value)
                    }
                  >
                    {completionForm.lines.map((line) => (
                      <option
                        key={line.purchase_contract_line_id}
                        value={line.purchase_contract_line_id}
                      >
                        {line.product_code || line.product_name}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label htmlFor="quality-task-issue-type">
                  {t('quality.task.field.issueType')}
                  <Input
                    id="quality-task-issue-type"
                    value={completionForm.issue.issue_type}
                    onChange={(event) => updateIssueField('issue_type', event.target.value)}
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label htmlFor="quality-task-severity">
                  {t('quality.task.field.severity')}
                  <FormSelect
                    id="quality-task-severity"
                    value={completionForm.issue.severity}
                    onChange={(event) => updateIssueField('severity', event.target.value)}
                  >
                    {qualityIssueSeverityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
              </div>
              <label htmlFor="quality-task-description">
                {completionForm.result === 'passed' ? (
                  t('quality.task.field.issueDescription')
                ) : (
                  <RequiredLabel>{t('quality.task.field.issueDescription')}</RequiredLabel>
                )}
                <Input.TextArea
                  disabled={completionForm.result === 'passed'}
                  id="quality-task-description"
                  rows={2}
                  status={completionErrors.issue_description ? 'error' : undefined}
                  value={completionForm.issue.description}
                  onChange={(event) => updateIssueField('description', event.target.value)}
                />
                <CompletionError field="issue_description" errors={completionErrors} />
              </label>
              <label htmlFor="quality-task-corrective-action">
                {t('quality.task.field.correctiveAction')}
                <Input
                  disabled={completionForm.result === 'passed'}
                  id="quality-task-corrective-action"
                  value={completionForm.issue.corrective_action}
                  onChange={(event) => updateIssueField('corrective_action', event.target.value)}
                />
              </label>

              <div className="form-divider">{t('quality.task.modal.evidenceSection')}</div>
              <label className="quality-file-upload" htmlFor="quality-task-evidence">
                {t('quality.task.field.evidence')}
                <input
                  accept="image/*"
                  aria-label={t('quality.task.field.uploadEvidenceAria')}
                  id="quality-task-evidence"
                  type="file"
                  onChange={(event) => void handleEvidenceUpload(event)}
                />
              </label>
              <div className="quality-attachment-list">
                {completionForm.attachments.map((attachment) => (
                  <a href={attachment.url} key={attachment.url} rel="noreferrer" target="_blank">
                    <Paperclip size={14} />
                    {attachment.filename}
                  </a>
                ))}
                {uploadingEvidence ? (
                  <span>{t('quality.task.modal.uploadingEvidence')}</span>
                ) : null}
              </div>

              <Button htmlType="submit" loading={submittingId === completionTask.id} type="primary">
                {t('quality.task.action.submitCompletion')}
              </Button>
            </form>
          </div>
        ) : null}
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(actionTask && actionMode)}
        title={
          actionMode === 'cancel'
            ? t('quality.task.modal.cancelTitle')
            : t('quality.task.modal.rescheduleTitle')
        }
        width={560}
        onCancel={() => {
          setActionTask(null)
          setActionMode(null)
        }}
      >
        {actionTask && actionMode ? (
          <form className="record-form" onSubmit={submitTaskAction}>
            <Alert
              showIcon
              title={`${actionTask.code} / ${actionTask.purchase_contract_no}`}
              type={actionMode === 'cancel' ? 'warning' : 'info'}
            />
            {actionMode === 'reschedule' ? (
              <label htmlFor="quality-action-schedule">
                <RequiredLabel>{t('quality.task.field.newSchedule')}</RequiredLabel>
                <Input
                  id="quality-action-schedule"
                  required
                  type="datetime-local"
                  value={actionSchedule}
                  onChange={(event) => setActionSchedule(event.target.value)}
                />
              </label>
            ) : null}
            <label htmlFor="quality-action-reason">
              <RequiredLabel>
                {actionMode === 'cancel'
                  ? t('quality.task.field.cancelReason')
                  : t('quality.task.field.rescheduleReason')}
              </RequiredLabel>
              <Input.TextArea
                id="quality-action-reason"
                required
                rows={3}
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
              />
            </label>
            <Button
              danger={actionMode === 'cancel'}
              htmlType="submit"
              loading={submittingId === actionTask.id}
              type="primary"
            >
              {actionMode === 'cancel'
                ? t('quality.task.action.confirmCancel')
                : t('quality.task.action.saveSchedule')}
            </Button>
          </form>
        ) : null}
      </Modal>
    </section>
  )
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error(t('quality.task.message.fileReadFailed')))
    reader.readAsDataURL(file)
  })
}
