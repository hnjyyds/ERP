import { Alert, Button, Input, Modal, Select, Table, Tag } from 'antd'
import {
  ArrowLeft,
  CheckCheck,
  LayoutDashboard,
  Paperclip,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import type { ChangeEvent, FormEvent, MouseEvent, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  createQualityInspection,
  createQualityReinspection,
  getQualityInboundEligibility,
  listAssignableUsers,
  listPurchaseContracts,
  listQualityInspections,
  resolveQualityIssue,
  uploadImage,
  type AssignableUser,
  type CurrentUser,
  type QualityInspection,
  type QualityInspectionInboundEligibility,
  type QualityInspectionPayload,
  type QualityInspectionStatus,
} from '../../../api'
import type { LocalizedOption } from '../../../shared/formOptions'
import { ApiError, showError, showWarningDialog } from '../../../shared/errors'
import { FormSelect, Metric, PanelTitle, RemoteSelect } from '../../../shared/ui'
import { t, type TranslationKey } from '../../appI18n'
import { moduleDetailPath, qualityInspectionPath } from '../../routes'
import { emptyToNull, formatDate, nullableText, type RoutedDetailPageProps } from '../appHelpers'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }
type QualityInspectionAssigneeFilter = 'all' | 'mine'
type QualityInspectionListFilters = {
  search: string
  status: string
  result: string
  supplier: string
  contract: string
  assignee: QualityInspectionAssigneeFilter
}

type QualityTaskFormState = {
  code: string
  purchase_contract_id: string
  scheduled_at: string
  inspector_id: string
  inspector_name: string
  task_note: string
  attachment_group_id: string
}

type QualityTaskValidationField = 'purchase_contract_id' | 'scheduled_at' | 'inspector_id'

type QualityTaskFormErrors = Partial<Record<QualityTaskValidationField, string>>

const validationOrder: QualityTaskValidationField[] = [
  'purchase_contract_id',
  'scheduled_at',
  'inspector_id',
]

const qualityTaskStatusOptions: LocalizedOption[] = [
  { value: 'pending', labelKey: 'quality.inspection.status.pending' },
  { value: 'in_progress', labelKey: 'quality.inspection.status.inProgress' },
  { value: 'completed', labelKey: 'quality.inspection.status.completed' },
  { value: 'cancelled', labelKey: 'quality.inspection.status.cancelled' },
]

const qualityResultOptions: LocalizedOption[] = [
  { value: 'passed', labelKey: 'quality.inspection.result.passed' },
  { value: 'failed', labelKey: 'quality.inspection.result.failed' },
  { value: 'partial_passed', labelKey: 'quality.inspection.result.partialPassed' },
  { value: 'recheck_required', labelKey: 'quality.inspection.result.recheckRequired' },
]

const qualityIssueSeverityOptions: LocalizedOption[] = [
  { value: 'minor', labelKey: 'quality.inspection.severity.minor' },
  { value: 'major', labelKey: 'quality.inspection.severity.major' },
  { value: 'critical', labelKey: 'quality.inspection.severity.critical' },
]

const qualityIssueStatusOptions: LocalizedOption[] = [
  { value: 'open', labelKey: 'quality.inspection.issueStatus.open' },
  { value: 'processing', labelKey: 'quality.inspection.issueStatus.processing' },
  { value: 'resolved', labelKey: 'quality.inspection.issueStatus.resolved' },
  { value: 'closed', labelKey: 'quality.inspection.issueStatus.resolved' },
]

const fieldLabels: Record<QualityTaskValidationField, TranslationKey> = {
  purchase_contract_id: 'quality.inspection.field.contract',
  scheduled_at: 'quality.inspection.field.scheduledAt',
  inspector_id: 'quality.inspection.field.inspector',
}

const fieldIds: Record<QualityTaskValidationField, string> = {
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

function defaultScheduledAt(): string {
  const value = new Date()
  value.setDate(value.getDate() + 1)
  value.setHours(9, 0, 0, 0)
  return localDateTimeInput(value)
}

function formatScheduledAt(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${parsed.getFullYear()}/${pad(parsed.getMonth() + 1)}/${pad(parsed.getDate())} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`
}

function initialTaskForm(currentUser: CurrentUser): QualityTaskFormState {
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

function validateTaskForm(form: QualityTaskFormState): QualityTaskFormErrors {
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

function validationErrorsFromApi(error: unknown): QualityTaskFormErrors {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return {}
  return error.details.reduce<QualityTaskFormErrors>((errors, detail) => {
    const field = backendFieldMap[detail.field]
    if (field && !errors[field]) errors[field] = detail.message
    return errors
  }, {})
}

function RequiredFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="form-field-label">
      {children}
      <span aria-hidden="true" className="form-required-mark">
        *
      </span>
    </span>
  )
}

function FieldError({ field, message }: { field: QualityTaskValidationField; message?: string }) {
  if (!message) return null
  return (
    <span className="form-field-error" id={`${fieldIds[field]}-error`}>
      {message}
    </span>
  )
}

function taskPayload(form: QualityTaskFormState): QualityInspectionPayload {
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

function assignableUserOptionLabel(user: AssignableUser): string {
  return [user.display_name, user.username, user.department_name].filter(Boolean).join(' / ')
}

function taskStatusLabel(value: QualityInspectionStatus): string {
  const option = qualityTaskStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function taskStatusColor(value: QualityInspectionStatus): string {
  if (value === 'pending') return 'warning'
  if (value === 'in_progress') return 'processing'
  if (value === 'completed') return 'success'
  return 'default'
}

function resultLabel(value: string | null): string {
  if (!value) return t('quality.inspection.result.undetermined')
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

function issueSeverityLabel(value: string): string {
  const option = qualityIssueSeverityOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function issueStatusLabel(value: string): string {
  const option = qualityIssueStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function qualityEventLabel(value: string): string {
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

function inboundReason(inspection: QualityInspection): string {
  if (inspection.status !== 'completed') return t('quality.inspection.inbound.notCompleted')
  if (inspection.result === 'passed') return t('quality.inspection.inbound.passed')
  if (inspection.result === 'failed') return t('quality.inspection.inbound.failed')
  if (inspection.result === 'partial_passed') return t('quality.inspection.inbound.partialPassed')
  if (inspection.result === 'recheck_required') return t('quality.inspection.inbound.recheckRequired')
  return t('quality.inspection.inbound.waiting')
}

function isInspectionOverdue(inspection: QualityInspection, now = Date.now()): boolean {
  if (inspection.status === 'completed' || inspection.status === 'cancelled') return false
  const scheduledAt = new Date(inspection.scheduled_at).getTime()
  return !Number.isNaN(scheduledAt) && scheduledAt < now
}

function hasOpenIssue(inspection: QualityInspection): boolean {
  return inspection.issues.some((issue) => issue.status !== 'resolved')
}

function nextAction(inspection: QualityInspection): { label: string; color?: string } {
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

function taskPriority(inspection: QualityInspection): number {
  if (isInspectionOverdue(inspection)) return 0
  if (hasOpenIssue(inspection)) return 1
  if (inspection.result === 'recheck_required' || inspection.result === 'failed') return 2
  if (inspection.status === 'pending') return 3
  if (inspection.status === 'in_progress') return 4
  return 5
}

export function QualityInspectionsPage({ currentUser, detailId, onNavigate }: Props) {
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState<QualityInspectionAssigneeFilter>('all')
  const [eligibility, setEligibility] = useState<QualityInspectionInboundEligibility | null>(null)
  const [form, setForm] = useState<QualityTaskFormState>(() => initialTaskForm(currentUser))
  const [fieldErrors, setFieldErrors] = useState<QualityTaskFormErrors>({})
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [assignableUsersLoaded, setAssignableUsersLoaded] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [resolutionAttachments, setResolutionAttachments] = useState<
    Array<{ filename: string; url: string; category: 'resolution' }>
  >([])
  const [reinspectionOpen, setReinspectionOpen] = useState(false)
  const [reinspectionCode, setReinspectionCode] = useState('')
  const [reinspectionSchedule, setReinspectionSchedule] = useState(defaultScheduledAt())
  const [reinspectionReason, setReinspectionReason] = useState(() =>
    t('quality.inspection.modal.defaultReinspectionReason'),
  )
  const [uploadingEvidence, setUploadingEvidence] = useState(false)

  const fetchContractOptions = useCallback(async (query: string) => {
    const result = await listPurchaseContracts({
      q: query.trim() || undefined,
      approval_status: 'approved',
    })
    return result.items.slice(0, 20).map((item) => ({
      value: item.id,
      label: `${item.code} / ${item.supplier_name}`,
      description: t('quality.inspection.option.contractSchedule', {
        contractDate: item.contract_date,
        deliveryDate: item.delivery_date,
      }),
    }))
  }, [])

  const fetchSupplierOptions = useCallback(async (query: string) => {
    const result = await listPurchaseContracts({
      q: query.trim() || undefined,
      approval_status: 'approved',
    })
    const suppliers = new Map<string, { value: string; label: string; description: string }>()
    result.items.forEach((item) => {
      if (!item.supplier_id || suppliers.has(item.supplier_id)) return
      suppliers.set(item.supplier_id, {
        value: item.supplier_id,
        label: item.supplier_name,
        description: t('quality.inspection.option.relatedContract', { code: item.code }),
      })
    })
    return [...suppliers.values()].slice(0, 20)
  }, [])

  const fetchFilterContractOptions = useCallback(
    async (query: string) => {
      const result = await listPurchaseContracts({
        q: query.trim() || undefined,
        approval_status: 'approved',
        supplier_id: supplierFilter || undefined,
      })
      return result.items.slice(0, 20).map((item) => ({
        value: item.id,
        label: `${item.code} / ${item.supplier_name}`,
        description: t('quality.inspection.option.contractSchedule', {
        contractDate: item.contract_date,
        deliveryDate: item.delivery_date,
      }),
      }))
    },
    [supplierFilter],
  )

  const selectedInspection = useMemo(() => {
    if (detailId) return inspections.find((item) => item.id === detailId) ?? null
    return inspections.find((item) => item.id === selectedInspectionId) ?? inspections[0] ?? null
  }, [detailId, inspections, selectedInspectionId])

  useEffect(() => {
    void loadQualityInspections()
  }, [])

  useEffect(() => {
    if (!taskModalOpen || assignableUsersLoaded || loadingAssignableUsers) return
    void loadAssignableUsersForTask()
  }, [taskModalOpen, assignableUsersLoaded, loadingAssignableUsers])

  useEffect(() => {
    if (!detailId || !selectedInspection) {
      setEligibility(null)
      return
    }
    void refreshEligibility(selectedInspection.purchase_contract_id)
  }, [detailId, selectedInspection?.id])

  useEffect(() => {
    if (detailId && inspections.length > 0 && !selectedInspection) {
      onNavigate(qualityInspectionPath)
    }
  }, [detailId, inspections, onNavigate, selectedInspection])

  async function loadQualityInspections(
    preferredInspectionId?: string,
    filters?: QualityInspectionListFilters,
  ) {
    const activeFilters = filters ?? {
      search,
      status: statusFilter,
      result: resultFilter,
      supplier: supplierFilter,
      contract: contractFilter,
      assignee: assigneeFilter,
    }
    setLoading(true)
    try {
      const result = await listQualityInspections({
        q: activeFilters.search.trim() || undefined,
        status: activeFilters.status || undefined,
        result: activeFilters.result || undefined,
        supplier_id: activeFilters.supplier.trim() || undefined,
        purchase_contract_id: activeFilters.contract.trim() || undefined,
        inspector_user_id: activeFilters.assignee === 'mine' ? currentUser.id : undefined,
      })
      setInspections(result.items)
      setSelectedInspectionId((current) => {
        if (preferredInspectionId) return preferredInspectionId
        if (current && result.items.some((item) => item.id === current)) return current
        return result.items[0]?.id ?? null
      })
    } catch (caught) {
      showError(caught, t('quality.inspection.message.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function resetQualityInspectionFilters() {
    const resetFilters: QualityInspectionListFilters = {
      search: '',
      status: '',
      result: '',
      supplier: '',
      contract: '',
      assignee: 'all',
    }
    setSearch(resetFilters.search)
    setStatusFilter(resetFilters.status)
    setResultFilter(resetFilters.result)
    setSupplierFilter(resetFilters.supplier)
    setContractFilter(resetFilters.contract)
    setAssigneeFilter(resetFilters.assignee)
    setMessage('')
    void loadQualityInspections(undefined, resetFilters)
  }

  async function loadAssignableUsersForTask() {
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers('quality:inspection:edit')
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, t('quality.inspection.message.assigneesLoadFailed'))
    } finally {
      setAssignableUsersLoaded(true)
      setLoadingAssignableUsers(false)
    }
  }

  async function refreshEligibility(purchaseContractId: string) {
    try {
      setEligibility(await getQualityInboundEligibility(purchaseContractId))
    } catch (caught) {
      setEligibility(null)
      showError(caught, t('quality.inspection.message.eligibilityLoadFailed'))
    }
  }

  function startNewTask() {
    setForm(initialTaskForm(currentUser))
    setFieldErrors({})
    setMessage('')
    if (assignableUsers.length === 0) setAssignableUsersLoaded(false)
    setTaskModalOpen(true)
  }

  function updateFormField<Field extends keyof QualityTaskFormState>(
    field: Field,
    value: QualityTaskFormState[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    if (!validationOrder.includes(field as QualityTaskValidationField)) return
    setFieldErrors((current) => {
      if (!current[field as QualityTaskValidationField]) return current
      const next = { ...current }
      delete next[field as QualityTaskValidationField]
      return next
    })
  }

  function applyInspector(userId: string) {
    const user = assignableUsers.find((item) => item.id === userId)
    setForm((current) => ({
      ...current,
      inspector_id: user?.id ?? '',
      inspector_name: user?.display_name ?? '',
    }))
    setFieldErrors((current) => {
      if (!current.inspector_id) return current
      const next = { ...current }
      delete next.inspector_id
      return next
    })
  }

  function focusField(field: QualityTaskValidationField, keepSummaryVisible = false) {
    window.setTimeout(() => {
      const element = document.getElementById(fieldIds[field])
      if (!(element instanceof HTMLElement)) return
      element.focus({ preventScroll: true })
      const scrollContainer = element.closest('.workflow-modal-content')
      if (keepSummaryVisible && scrollContainer instanceof HTMLElement) {
        scrollContainer.scrollTop = 0
        return
      }
      element.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
    }, 0)
  }

  function applyValidationErrors(errors: QualityTaskFormErrors) {
    const entries = validationOrder.filter((field) => errors[field])
    if (entries.length === 0) return
    setFieldErrors(errors)
    const names = entries.map((field) => t(fieldLabels[field]))
    showWarningDialog(
      t('quality.inspection.message.validationSummary', {
        count: names.length,
        names: names
          .slice(0, 3)
          .join(t('quality.inspection.validation.separator')),
      }),
    )
    focusField(entries[0], true)
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateTaskForm(form)
    if (validationOrder.some((field) => errors[field])) {
      applyValidationErrors(errors)
      return
    }
    setSubmitting(true)
    try {
      const task = await createQualityInspection(taskPayload(form))
      setTaskModalOpen(false)
      setMessage(t('quality.inspection.message.created', { code: task.code }))
      await loadQualityInspections(task.id)
    } catch (caught) {
      const backendErrors = validationErrorsFromApi(caught)
      if (validationOrder.some((field) => backendErrors[field])) {
        applyValidationErrors(backendErrors)
      } else {
        showError(caught, t('quality.inspection.message.createFailed'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  function openDetail(event: MouseEvent<HTMLElement>, inspection: QualityInspection) {
    event.stopPropagation()
    setSelectedInspectionId(inspection.id)
    onNavigate(moduleDetailPath(qualityInspectionPath, inspection.id))
  }

  function replaceInspection(updated: QualityInspection) {
    setInspections((current) =>
      current.map((inspection) => (inspection.id === updated.id ? updated : inspection)),
    )
  }

  function openIssueResolution(issueId: string) {
    setResolvingIssueId(issueId)
    setResolutionNote('')
    setResolutionAttachments([])
  }

  async function uploadResolutionEvidence(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showWarningDialog(t('quality.inspection.message.evidenceImageOnly'))
      return
    }
    setUploadingEvidence(true)
    try {
      const uploaded = await uploadImage(file.name, await readFileAsDataUrl(file))
      setResolutionAttachments((current) => [
        ...current,
        { filename: uploaded.filename, url: uploaded.url, category: 'resolution' },
      ])
    } catch (caught) {
      showError(caught, t('quality.inspection.message.evidenceUploadFailed'))
    } finally {
      setUploadingEvidence(false)
    }
  }

  async function submitIssueResolution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedInspection || !resolvingIssueId || !resolutionNote.trim()) {
      showWarningDialog(t('quality.inspection.message.resolutionNoteRequired'))
      return
    }
    setSubmitting(true)
    try {
      const updated = await resolveQualityIssue(selectedInspection.id, resolvingIssueId, {
        resolution_note: resolutionNote.trim(),
        attachments: resolutionAttachments,
      })
      replaceInspection(updated)
      setResolvingIssueId(null)
      setMessage(t('quality.inspection.message.issueResolved'))
    } catch (caught) {
      showError(caught, t('quality.inspection.message.issueResolveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openReinspection() {
    if (!selectedInspection || eligibility?.latest_inspection_id !== selectedInspection.id) {
      showWarningDialog(t('quality.inspection.message.reinspectionLatestOnly'))
      return
    }
    setReinspectionCode('')
    setReinspectionSchedule(defaultScheduledAt())
    setReinspectionReason(t('quality.inspection.modal.defaultReinspectionReason'))
    setReinspectionOpen(true)
  }

  async function submitReinspection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedInspection || !reinspectionReason.trim()) {
      showWarningDialog(t('quality.inspection.message.reinspectionRequired'))
      return
    }
    setSubmitting(true)
    try {
      const reinspection = await createQualityReinspection(selectedInspection.id, {
        scheduled_at: reinspectionSchedule,
        inspector_id: selectedInspection.inspector_id ?? currentUser.id,
        reason: reinspectionReason.trim(),
      })
      setInspections((current) => [reinspection, ...current])
      setReinspectionOpen(false)
      setMessage(t('quality.inspection.message.reinspectionCreated', { code: reinspection.code }))
      onNavigate(moduleDetailPath(qualityInspectionPath, reinspection.id))
    } catch (caught) {
      showError(caught, t('quality.inspection.message.reinspectionCreateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = inspections.filter((item) => item.status === 'pending').length
  const inProgressCount = inspections.filter((item) => item.status === 'in_progress').length
  const myActionCount = inspections.filter(
    (item) =>
      item.inspector_id === currentUser.id &&
      (item.status === 'pending' || item.status === 'in_progress'),
  ).length
  const overdueCount = inspections.filter((item) => isInspectionOverdue(item)).length
  const openIssueCount = inspections.reduce(
    (count, item) => count + item.issues.filter((issue) => issue.status !== 'resolved').length,
    0,
  )
  const prioritizedInspections = inspections
    .map((inspection, index) => ({ inspection, index }))
    .sort(
      (left, right) =>
        taskPriority(left.inspection) - taskPriority(right.inspection) || left.index - right.index,
    )
    .map(({ inspection }) => inspection)
  const validationEntries = validationOrder.flatMap((field) => {
    const error = fieldErrors[field]
    return error ? [{ field, message: error }] : []
  })

  return (
    <section className="quality-inspection-page">
      <div className="summary-strip" aria-label={t('quality.inspection.pageAria')}>
        <Metric
          label={t('quality.inspection.metric.myAction')}
          value={myActionCount}
          intent={myActionCount ? 'warning' : 'normal'}
        />
        <Metric
          label={t('quality.inspection.metric.pending')}
          value={pendingCount}
          intent={pendingCount ? 'warning' : 'normal'}
        />
        <Metric
          label={t('quality.inspection.metric.inProgress')}
          value={inProgressCount}
          intent={inProgressCount ? 'warning' : 'normal'}
        />
        <Metric
          label={t('quality.inspection.metric.overdue')}
          value={overdueCount}
          intent={overdueCount ? 'danger' : 'normal'}
        />
        <Metric
          label={t('quality.inspection.metric.openIssues')}
          value={openIssueCount}
          intent={openIssueCount ? 'danger' : 'normal'}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid quality-inspection-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<Search size={18} />}
                title={t('quality.inspection.panel.listTitle')}
              />
            </div>
            <form
              className="inline-filters single-line-filter-toolbar"
              onSubmit={(event) => {
                event.preventDefault()
                void loadQualityInspections()
              }}
            >
              <label>
                {t('quality.inspection.filter.search')}
                <Input
                  value={search}
                  placeholder={t('quality.inspection.filter.searchPlaceholder')}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                {t('quality.inspection.filter.status')}
                <FormSelect
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">{t('quality.inspection.filter.allStatuses')}</option>
                  {qualityTaskStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                {t('quality.inspection.filter.result')}
                <FormSelect
                  value={resultFilter}
                  onChange={(event) => setResultFilter(event.target.value)}
                >
                  <option value="">{t('quality.inspection.filter.allResults')}</option>
                  {qualityResultOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label className="entity-search-filter">
                {t('quality.inspection.filter.supplier')}
                <RemoteSelect
                  ariaLabel={t('quality.inspection.filter.supplierAria')}
                  fetchOptions={fetchSupplierOptions}
                  placeholder={t('quality.inspection.filter.supplierPlaceholder')}
                  value={supplierFilter || null}
                  onChange={(value) => {
                    setSupplierFilter(value)
                    setContractFilter('')
                  }}
                />
              </label>
              <label className="entity-search-filter">
                {t('quality.inspection.filter.contract')}
                <RemoteSelect
                  ariaLabel={t('quality.inspection.filter.contractAria')}
                  fetchOptions={fetchFilterContractOptions}
                  placeholder={t('quality.inspection.filter.contractPlaceholder')}
                  value={contractFilter || null}
                  onChange={setContractFilter}
                />
              </label>
              <label>
                {t('quality.inspection.filter.assignee')}
                <FormSelect
                  value={assigneeFilter}
                  onChange={(event) =>
                    setAssigneeFilter(event.target.value as QualityInspectionAssigneeFilter)
                  }
                >
                  <option value="all">{t('quality.inspection.filter.allAssignees')}</option>
                  <option value="mine">{t('quality.inspection.filter.mine')}</option>
                </FormSelect>
              </label>
              <div className="filter-actions">
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('quality.inspection.action.query')}
                </Button>
                <Button
                  aria-label={t('quality.inspection.action.resetFilters')}
                  htmlType="button"
                  icon={<RotateCcw size={16} />}
                  title={t('quality.inspection.action.resetFilters')}
                  onClick={resetQualityInspectionFilters}
                />
                <Button
                  aria-label={t('quality.inspection.action.refreshList')}
                  htmlType="button"
                  icon={<RefreshCw size={16} />}
                  loading={loading}
                  title={t('quality.inspection.action.refreshList')}
                  onClick={() => void loadQualityInspections()}
                />
                <Button type="primary" icon={<Plus size={16} />} onClick={startNewTask}>
                  {t('quality.inspection.action.create')}
                </Button>
              </div>
            </form>

            <Table<QualityInspection>
              columns={[
                {
                  title: t('quality.inspection.table.code'),
                  dataIndex: 'code',
                  render: (value: string, record) => (
                    <button
                      className="row-button"
                      type="button"
                      onClick={(event) => openDetail(event, record)}
                    >
                      {value}
                    </button>
                  ),
                },
                {
                  title: t('quality.inspection.table.status'),
                  dataIndex: 'status',
                  render: (value: QualityInspectionStatus) => (
                    <Tag color={taskStatusColor(value)}>{taskStatusLabel(value)}</Tag>
                  ),
                },
                {
                  title: t('quality.inspection.table.result'),
                  dataIndex: 'result',
                  render: (value: string | null) => (
                    <Tag color={resultColor(value)}>{resultLabel(value)}</Tag>
                  ),
                },
                { title: t('quality.inspection.table.contract'), dataIndex: 'purchase_contract_no' },
                { title: t('quality.inspection.table.supplier'), dataIndex: 'supplier_name' },
                { title: t('quality.inspection.table.inspector'), dataIndex: 'inspector_name' },
                {
                  title: t('quality.inspection.table.scheduledAt'),
                  dataIndex: 'scheduled_at',
                  render: formatScheduledAt,
                },
                {
                  title: t('quality.inspection.table.nextAction'),
                  key: 'next-action',
                  render: (_: unknown, record) => {
                    const action = nextAction(record)
                    return <Tag color={action.color}>{action.label}</Tag>
                  },
                },
                {
                  title: t('quality.inspection.table.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record) => (
                    <Button size="small" onClick={(event) => openDetail(event, record)}>
                      {t('quality.inspection.action.viewDetail')}
                    </Button>
                  ),
                },
              ]}
              dataSource={prioritizedInspections}
              loading={loading}
              pagination={false}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedInspectionId(record.id),
              })}
            />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={taskModalOpen}
          title={t('quality.inspection.modal.createTitle')}
          width={860}
          onCancel={() => {
            setFieldErrors({})
            setTaskModalOpen(false)
          }}
        >
          <div className="workflow-modal-content entity-modal-form">
            <div className="panel-heading quality-form-heading">
              <PanelTitle
                icon={<ShieldCheck size={18} />}
                title={t('quality.inspection.modal.formHeading')}
              />
            </div>
            <Alert
              showIcon
              title={t('quality.inspection.modal.noticeTitle')}
              description={t('quality.inspection.modal.noticeDescription')}
              type="info"
            />
            <form className="record-form" noValidate onSubmit={createTask}>
              {validationEntries.length > 0 ? (
                <Alert
                  className="quality-form-validation-summary"
                  description={
                    <ul className="quality-form-validation-list">
                      {validationEntries.map(({ field, message: errorMessage }) => (
                        <li key={field}>
                          <button type="button" onClick={() => focusField(field)}>
                            {t('quality.inspection.validation.item', {
                              field: t(fieldLabels[field]),
                              message: errorMessage,
                            })}
                          </button>
                        </li>
                      ))}
                    </ul>
                  }
                  showIcon
                  title={t('quality.inspection.validation.summaryTitle', {
                    count: validationEntries.length,
                  })}
                  type="error"
                />
              ) : null}

              <div className="form-divider">{t('quality.inspection.modal.taskSection')}</div>
              <div className="form-pair two">
                <label htmlFor="quality-code">
                  <span>{t('quality.inspection.field.code')}</span>
                  <Input
                    id="quality-code"
                    readOnly
                    value={form.code}
                    placeholder={t('quality.inspection.form.codeAutoGenerated')}
                  />
                </label>
                <label htmlFor="quality-contract-id">
                  <RequiredFieldLabel>{t('quality.inspection.field.contract')}</RequiredFieldLabel>
                  <RemoteSelect
                    ariaDescribedBy={
                      fieldErrors.purchase_contract_id ? 'quality-contract-id-error' : undefined
                    }
                    ariaInvalid={Boolean(fieldErrors.purchase_contract_id)}
                    ariaLabel={t('quality.inspection.field.contract')}
                    fetchOptions={fetchContractOptions}
                    id="quality-contract-id"
                    placeholder={t('quality.inspection.modal.contractPlaceholder')}
                    required
                    status={fieldErrors.purchase_contract_id ? 'error' : undefined}
                    value={form.purchase_contract_id || null}
                    onChange={(value) => updateFormField('purchase_contract_id', value)}
                  />
                  <FieldError
                    field="purchase_contract_id"
                    message={fieldErrors.purchase_contract_id}
                  />
                </label>
              </div>

              <div className="form-pair two">
                <label htmlFor="quality-scheduled-at">
                  <RequiredFieldLabel>{t('quality.inspection.field.scheduledAt')}</RequiredFieldLabel>
                  <Input
                    aria-describedby={
                      fieldErrors.scheduled_at ? 'quality-scheduled-at-error' : undefined
                    }
                    aria-invalid={Boolean(fieldErrors.scheduled_at)}
                    id="quality-scheduled-at"
                    required
                    status={fieldErrors.scheduled_at ? 'error' : undefined}
                    type="datetime-local"
                    value={form.scheduled_at}
                    onInput={(event) => updateFormField('scheduled_at', event.currentTarget.value)}
                  />
                  <FieldError field="scheduled_at" message={fieldErrors.scheduled_at} />
                </label>
                <label htmlFor="quality-inspector-id">
                  <RequiredFieldLabel>{t('quality.inspection.field.inspector')}</RequiredFieldLabel>
                  <Select
                    aria-describedby={
                      fieldErrors.inspector_id ? 'quality-inspector-id-error' : undefined
                    }
                    aria-invalid={Boolean(fieldErrors.inspector_id)}
                    aria-label={t('quality.inspection.field.inspector')}
                    aria-required="true"
                    id="quality-inspector-id"
                    loading={loadingAssignableUsers}
                    notFoundContent={
                      loadingAssignableUsers
                        ? t('quality.inspection.modal.inspectorLoading')
                        : t('quality.inspection.modal.inspectorEmpty')
                    }
                    optionFilterProp="label"
                    placeholder={
                      loadingAssignableUsers
                        ? t('quality.inspection.modal.inspectorPlaceholderLoading')
                        : t('quality.inspection.modal.inspectorPlaceholder')
                    }
                    showSearch
                    status={fieldErrors.inspector_id ? 'error' : undefined}
                    value={form.inspector_id || undefined}
                    onChange={applyInspector}
                  >
                    {form.inspector_id &&
                    !assignableUsers.some((user) => user.id === form.inspector_id) ? (
                      <Select.Option
                        key={form.inspector_id}
                        disabled
                        label={`${form.inspector_name} / ${t('quality.inspection.field.currentUser')}`}
                        value={form.inspector_id}
                      >
                        {form.inspector_name} / {t('quality.inspection.field.currentUser')}
                      </Select.Option>
                    ) : null}
                    {assignableUsers.map((user) => {
                      const label = assignableUserOptionLabel(user)
                      return (
                        <Select.Option key={user.id} label={label} value={user.id}>
                          {label}
                        </Select.Option>
                      )
                    })}
                  </Select>
                  <FieldError field="inspector_id" message={fieldErrors.inspector_id} />
                </label>
              </div>

              <label htmlFor="quality-task-note">
                {t('quality.inspection.field.taskNote')}
                <Input.TextArea
                  id="quality-task-note"
                  placeholder={t('quality.inspection.modal.taskNotePlaceholder')}
                  rows={3}
                  value={form.task_note}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, task_note: event.target.value }))
                  }
                />
              </label>
              <label htmlFor="quality-attachment-group">
                {t('quality.inspection.field.attachmentGroup')}
                <Input
                  id="quality-attachment-group"
                  value={form.attachment_group_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      attachment_group_id: event.target.value,
                    }))
                  }
                />
              </label>

              <Button htmlType="submit" loading={submitting} type="primary">
                {t('quality.inspection.modal.submitCreate')}
              </Button>
            </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('quality.inspection.panel.detailTitle')}
              />
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => onNavigate(qualityInspectionPath)}
              >
                {t('quality.inspection.action.backToList')}
              </Button>
            </div>
            {selectedInspection ? (
              <>
                <div
                  className={`quality-eligibility ${
                    eligibility?.eligible ? 'eligible' : 'blocked'
                  }`}
                >
                  <strong>{eligibility?.reason ?? inboundReason(selectedInspection)}</strong>
                  <span>
                    {t('quality.inspection.panel.taskSummary', {
                      status: taskStatusLabel(selectedInspection.status),
                      result: resultLabel(selectedInspection.result),
                    })}
                  </span>
                </div>
                {selectedInspection.status === 'completed' &&
                selectedInspection.result !== 'passed' ? (
                  eligibility === null ? null : (
                    <div className="detail-action-bar">
                      {eligibility.latest_inspection_id === selectedInspection.id ? (
                        <>
                          <Button
                            disabled={selectedInspection.issues.some(
                              (issue) => issue.status !== 'resolved',
                            )}
                            icon={<RotateCcw size={16} />}
                            title={
                              selectedInspection.issues.some((issue) => issue.status !== 'resolved')
                                ? t('quality.inspection.action.closeIssuesFirst')
                                : t('quality.inspection.action.createReinspectionHint')
                            }
                            type="primary"
                            onClick={openReinspection}
                          >
                            {t('quality.inspection.action.reinspection')}
                          </Button>
                          {selectedInspection.issues.some(
                            (issue) => issue.status !== 'resolved',
                          ) ? (
                            <span>{t('quality.inspection.panel.reinspectionBlocked')}</span>
                          ) : null}
                        </>
                      ) : (
                        <span>{t('quality.inspection.panel.reinspectionNotLatest')}</span>
                      )}
                    </div>
                  )
                ) : null}

                <dl className="detail-list">
                  <div>
                    <dt>{t('quality.inspection.field.code')}</dt>
                    <dd>{selectedInspection.code}</dd>
                  </div>
                  <div>
                    <dt>{t('quality.inspection.field.status')}</dt>
                    <dd>{taskStatusLabel(selectedInspection.status)}</dd>
                  </div>
                  <div>
                    <dt>{t('quality.inspection.field.scheduledAt')}</dt>
                    <dd>{formatScheduledAt(selectedInspection.scheduled_at)}</dd>
                  </div>
                  <div>
                    <dt>{t('quality.inspection.field.inspector')}</dt>
                    <dd>{selectedInspection.inspector_name}</dd>
                  </div>
                  <div>
                    <dt>{t('quality.inspection.field.contract')}</dt>
                    <dd>{selectedInspection.purchase_contract_no}</dd>
                  </div>
                  <div>
                    <dt>{t('quality.inspection.field.supplier')}</dt>
                    <dd>{selectedInspection.supplier_name}</dd>
                  </div>
                  <div>
                    <dt>{t('quality.inspection.field.actualInspectedAt')}</dt>
                    <dd>
                      {selectedInspection.inspected_at
                        ? formatDate(selectedInspection.inspected_at)
                        : t('quality.inspection.panel.notStarted')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('quality.inspection.field.result')}</dt>
                    <dd>{resultLabel(selectedInspection.result)}</dd>
                  </div>
                  <div>
                    <dt>{t('quality.inspection.field.taskNote')}</dt>
                    <dd>{nullableText(selectedInspection.issue_summary)}</dd>
                  </div>
                  <div>
                    <dt>{t('quality.inspection.field.attachmentGroup')}</dt>
                    <dd>{nullableText(selectedInspection.attachment_group_id)}</dd>
                  </div>
                  {selectedInspection.parent_inspection_id ? (
                    <div>
                      <dt>{t('quality.inspection.field.reinspectionSource')}</dt>
                      <dd>
                        {t('quality.inspection.panel.reinspectionAttempt', {
                          no: selectedInspection.reinspection_no ?? 1,
                        })}
                      </dd>
                    </div>
                  ) : null}
                  {selectedInspection.cancel_reason ? (
                    <div>
                      <dt>{t('quality.inspection.field.cancelReason')}</dt>
                      <dd>{selectedInspection.cancel_reason}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="accessory-heading">
                  <strong>{t('quality.inspection.panel.linesTitle')}</strong>
                  <span>
                    {t('quality.inspection.panel.linesCount', {
                      count: selectedInspection.lines.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('quality.inspection.table.product')}</th>
                      <th>{t('quality.inspection.table.inspectedQuantity')}</th>
                      <th>{t('quality.inspection.table.failedQuantity')}</th>
                      <th>{t('quality.inspection.table.unit')}</th>
                      <th>{t('quality.inspection.table.lineResult')}</th>
                      <th>{t('quality.inspection.table.remark')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInspection.lines.map((line) => (
                      <tr key={line.id}>
                        <td>{line.product_name}</td>
                        <td>{line.inspected_quantity}</td>
                        <td>{line.failed_quantity}</td>
                        <td>{line.unit}</td>
                        <td>{resultLabel(line.result)}</td>
                        <td>{nullableText(line.remark)}</td>
                      </tr>
                    ))}
                    {selectedInspection.lines.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={6}>
                          {t('quality.inspection.panel.linesEmpty')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('quality.inspection.panel.issuesTitle')}</strong>
                  <span>
                    {t('quality.inspection.panel.issuesCount', {
                      count: selectedInspection.issues.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('quality.inspection.table.issueType')}</th>
                      <th>{t('quality.inspection.table.severity')}</th>
                      <th>{t('quality.inspection.table.description')}</th>
                      <th>{t('quality.inspection.table.rectification')}</th>
                      <th>{t('quality.inspection.table.issueStatus')}</th>
                      <th>{t('quality.inspection.table.resolutionNote')}</th>
                      <th>{t('quality.inspection.table.operation')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInspection.issues.map((issue) => (
                      <tr key={issue.id}>
                        <td>{issue.issue_type}</td>
                        <td>{issueSeverityLabel(issue.severity)}</td>
                        <td>{issue.description}</td>
                        <td>{nullableText(issue.corrective_action)}</td>
                        <td>{issueStatusLabel(issue.status)}</td>
                        <td>{nullableText(issue.resolution_note ?? null)}</td>
                        <td>
                          {issue.status === 'open' ? (
                            <Button
                              icon={<CheckCheck size={14} />}
                              size="small"
                              onClick={() => openIssueResolution(issue.id)}
                            >
                              {t('quality.inspection.action.closeIssue')}
                            </Button>
                          ) : (
                            <span>
                              {issue.resolved_by_name ??
                                t('quality.inspection.panel.issueClosed')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {selectedInspection.issues.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={7}>
                          {t('quality.inspection.panel.issuesEmpty')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('quality.inspection.panel.attachmentsTitle')}</strong>
                  <span>
                    {t('quality.inspection.panel.attachmentsCount', {
                      count: selectedInspection.attachments?.length ?? 0,
                    })}
                  </span>
                </div>
                <div className="quality-attachment-list">
                  {(selectedInspection.attachments ?? []).map((attachment) => (
                    <a href={attachment.url} key={attachment.id} rel="noreferrer" target="_blank">
                      <Paperclip size={14} />
                      {attachment.filename}
                      <Tag>
                        {attachment.category === 'resolution'
                          ? t('quality.inspection.panel.attachmentResolution')
                          : t('quality.inspection.panel.attachmentInspection')}
                      </Tag>
                    </a>
                  ))}
                  {(selectedInspection.attachments?.length ?? 0) === 0 ? (
                    <span>{t('quality.inspection.panel.attachmentsEmpty')}</span>
                  ) : null}
                </div>

                <div className="accessory-heading">
                  <strong>{t('quality.inspection.panel.eventsTitle')}</strong>
                  <span>
                    {t('quality.inspection.panel.eventsCount', {
                      count: selectedInspection.events?.length ?? 0,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('quality.inspection.field.performedAt')}</th>
                      <th>{t('quality.inspection.table.action')}</th>
                      <th>{t('quality.inspection.field.actor')}</th>
                      <th>{t('quality.inspection.field.notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInspection.events ?? []).map((event) => (
                      <tr key={event.id}>
                        <td>{formatScheduledAt(event.created_at)}</td>
                        <td>{qualityEventLabel(event.event_type)}</td>
                        <td>{event.actor_user_name}</td>
                        <td>{event.notes || t('common.notSet')}</td>
                      </tr>
                    ))}
                    {(selectedInspection.events?.length ?? 0) === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={4}>
                          {t('quality.inspection.panel.eventsEmpty')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <ShieldCheck size={28} />
                <strong>{t('quality.inspection.panel.emptyTitle')}</strong>
                <span>{t('quality.inspection.panel.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>

      <Modal
        centered
        footer={null}
        open={Boolean(resolvingIssueId)}
        title={t('quality.inspection.modal.resolveTitle')}
        width={620}
        onCancel={() => setResolvingIssueId(null)}
      >
        <form className="record-form" onSubmit={submitIssueResolution}>
          <Alert showIcon title={t('quality.inspection.modal.resolveNotice')} type="warning" />
          <label htmlFor="quality-resolution-note">
            <RequiredFieldLabel>{t('quality.inspection.field.resolutionNote')}</RequiredFieldLabel>
            <Input.TextArea
              id="quality-resolution-note"
              required
              rows={4}
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
            />
          </label>
          <label className="quality-file-upload" htmlFor="quality-resolution-evidence">
            {t('quality.inspection.modal.evidenceLabel')}
            <input
              accept="image/*"
              aria-label={t('quality.inspection.modal.evidenceAria')}
              id="quality-resolution-evidence"
              type="file"
              onChange={(event) => void uploadResolutionEvidence(event)}
            />
          </label>
          <div className="quality-attachment-list">
            {resolutionAttachments.map((attachment) => (
              <a href={attachment.url} key={attachment.url} rel="noreferrer" target="_blank">
                <Paperclip size={14} />
                {attachment.filename}
              </a>
            ))}
            {uploadingEvidence ? (
              <span>{t('quality.inspection.modal.uploadingEvidence')}</span>
            ) : null}
          </div>
          <Button htmlType="submit" loading={submitting} type="primary">
            {t('quality.inspection.modal.submitResolve')}
          </Button>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={reinspectionOpen}
        title={t('quality.inspection.modal.reinspectionTitle')}
        width={620}
        onCancel={() => setReinspectionOpen(false)}
      >
        <form className="record-form" onSubmit={submitReinspection}>
          <Alert showIcon title={t('quality.inspection.modal.reinspectionNotice')} type="info" />
          <label htmlFor="quality-reinspection-code">
            <span>{t('quality.inspection.field.reinspectionCode')}</span>
            <Input
              id="quality-reinspection-code"
              readOnly
              value={reinspectionCode}
              placeholder={t('quality.inspection.form.codeAutoGenerated')}
            />
          </label>
          <label htmlFor="quality-reinspection-schedule">
            <RequiredFieldLabel>{t('quality.inspection.field.reinspectionSchedule')}</RequiredFieldLabel>
            <Input
              id="quality-reinspection-schedule"
              required
              type="datetime-local"
              value={reinspectionSchedule}
              onChange={(event) => setReinspectionSchedule(event.target.value)}
            />
          </label>
          <label htmlFor="quality-reinspection-reason">
            <RequiredFieldLabel>{t('quality.inspection.field.reinspectionReason')}</RequiredFieldLabel>
            <Input.TextArea
              id="quality-reinspection-reason"
              required
              rows={3}
              value={reinspectionReason}
              onChange={(event) => setReinspectionReason(event.target.value)}
            />
          </label>
          <Button htmlType="submit" loading={submitting} type="primary">
            {t('quality.inspection.modal.submitReinspection')}
          </Button>
        </form>
      </Modal>
    </section>
  )
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error(t('quality.inspection.message.fileReadFailed')))
    reader.readAsDataURL(file)
  })
}
