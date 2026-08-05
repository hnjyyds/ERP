import { Alert, Button, Input, Modal, Select, Table, Tag } from 'antd'
import {
  ArrowLeft,
  CheckCheck,
  LayoutDashboard,
  Paperclip,
  Plus,
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
import {
  qualityIssueSeverityOptions,
  qualityIssueStatusOptions,
  qualityResultOptions,
  qualityTaskStatusOptions,
} from '../../../shared/formOptions'
import { ApiError, showError, showWarningDialog } from '../../../shared/errors'
import { FormSelect, Metric, PanelTitle, RemoteSelect } from '../../../shared/ui'
import { moduleDetailPath, qualityInspectionPath } from '../../routes'
import { emptyToNull, formatDate, nullableText, type RoutedDetailPageProps } from '../appHelpers'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }
type QualityInspectionAssigneeFilter = 'all' | 'mine'

type QualityTaskFormState = {
  code: string
  purchase_contract_id: string
  scheduled_at: string
  inspector_id: string
  inspector_name: string
  task_note: string
  attachment_group_id: string
}

type QualityTaskValidationField = 'code' | 'purchase_contract_id' | 'scheduled_at' | 'inspector_id'

type QualityTaskFormErrors = Partial<Record<QualityTaskValidationField, string>>

const validationOrder: QualityTaskValidationField[] = [
  'code',
  'purchase_contract_id',
  'scheduled_at',
  'inspector_id',
]

const fieldLabels: Record<QualityTaskValidationField, string> = {
  code: 'QC 任务单号',
  purchase_contract_id: '采购合同',
  scheduled_at: '排期时间',
  inspector_id: '负责人',
}

const fieldIds: Record<QualityTaskValidationField, string> = {
  code: 'quality-code',
  purchase_contract_id: 'quality-contract-id',
  scheduled_at: 'quality-scheduled-at',
  inspector_id: 'quality-inspector-id',
}

const backendFieldMap: Record<string, QualityTaskValidationField> = {
  code: 'code',
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
    code: `QC-${Date.now().toString().slice(-6)}`,
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
  if (!form.code.trim()) errors.code = '请输入 QC 任务单号'
  if (!form.purchase_contract_id.trim()) {
    errors.purchase_contract_id = '请选择采购合同'
  }
  if (!form.scheduled_at) errors.scheduled_at = '请选择排期时间'
  if (!form.inspector_id.trim() || !form.inspector_name.trim()) {
    errors.inspector_id = '请选择负责人'
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
    code: form.code.trim(),
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
  return qualityTaskStatusOptions.find((option) => option.value === value)?.label ?? value
}

function taskStatusColor(value: QualityInspectionStatus): string {
  if (value === 'pending') return 'warning'
  if (value === 'in_progress') return 'processing'
  if (value === 'completed') return 'success'
  return 'default'
}

function resultLabel(value: string | null): string {
  if (!value) return '未判定'
  return qualityResultOptions.find((option) => option.value === value)?.label ?? value
}

function resultColor(value: string | null): string {
  if (value === 'passed') return 'success'
  if (value === 'failed') return 'error'
  if (value === 'partial_passed') return 'warning'
  if (value === 'recheck_required') return 'processing'
  return 'default'
}

function issueSeverityLabel(value: string): string {
  return qualityIssueSeverityOptions.find((option) => option.value === value)?.label ?? value
}

function issueStatusLabel(value: string): string {
  return qualityIssueStatusOptions.find((option) => option.value === value)?.label ?? value
}

function qualityEventLabel(value: string): string {
  const labels: Record<string, string> = {
    created: '创建任务',
    started: '开始查验',
    completed: '完成查验',
    updated: '更新任务',
    rescheduled: '调整排期',
    cancelled: '取消任务',
    issue_resolved: '关闭异常',
    reinspection_created: '发起复检',
  }
  return labels[value] ?? value
}

function inboundReason(inspection: QualityInspection): string {
  if (inspection.status !== 'completed') return 'QC 任务尚未完成，暂不能入库'
  if (inspection.result === 'passed') return 'QC 已通过'
  if (inspection.result === 'failed') return 'QC 未通过，禁止入库'
  if (inspection.result === 'partial_passed') return 'QC 部分通过，需按合格数量入库'
  if (inspection.result === 'recheck_required') return 'QC 需要复检，暂缓入库'
  return '等待 QC 判定'
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
  const [reinspectionReason, setReinspectionReason] = useState('')
  const [uploadingEvidence, setUploadingEvidence] = useState(false)

  const fetchContractOptions = useCallback(async (query: string) => {
    const result = await listPurchaseContracts({
      q: query.trim() || undefined,
      approval_status: 'approved',
    })
    return result.items.slice(0, 20).map((item) => ({
      value: item.id,
      label: `${item.code} / ${item.supplier_name}`,
      description: `下单 ${item.contract_date}  交货 ${item.delivery_date}`,
    }))
  }, [])

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

  async function loadQualityInspections(preferredInspectionId?: string) {
    setLoading(true)
    try {
      const result = await listQualityInspections({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        result: resultFilter || undefined,
        supplier_id: supplierFilter.trim() || undefined,
        purchase_contract_id: contractFilter.trim() || undefined,
        inspector_user_id: assigneeFilter === 'mine' ? currentUser.id : undefined,
      })
      setInspections(result.items)
      setSelectedInspectionId((current) => {
        if (preferredInspectionId) return preferredInspectionId
        if (current && result.items.some((item) => item.id === current)) return current
        return result.items[0]?.id ?? null
      })
    } catch (caught) {
      showError(caught, 'QC 任务加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadAssignableUsersForTask() {
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers('quality:inspection:edit')
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, '负责人列表加载失败')
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
      showError(caught, '入库判定加载失败')
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
    const names = entries.map((field) => fieldLabels[field])
    showWarningDialog(`请完善 ${names.length} 项信息：${names.slice(0, 3).join('、')}`)
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
      setMessage(`已创建 ${task.code}，任务已进入负责人待查验列表`)
      await loadQualityInspections(task.id)
    } catch (caught) {
      const backendErrors = validationErrorsFromApi(caught)
      if (validationOrder.some((field) => backendErrors[field])) {
        applyValidationErrors(backendErrors)
      } else {
        showError(caught, 'QC 任务创建失败')
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
      showWarningDialog('整改凭证目前仅支持图片')
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
      showError(caught, '整改凭证上传失败')
    } finally {
      setUploadingEvidence(false)
    }
  }

  async function submitIssueResolution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedInspection || !resolvingIssueId || !resolutionNote.trim()) {
      showWarningDialog('请填写异常关闭说明')
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
      setMessage('QC 异常已关闭，可以在全部异常关闭后发起复检')
    } catch (caught) {
      showError(caught, 'QC 异常关闭失败')
    } finally {
      setSubmitting(false)
    }
  }

  function openReinspection() {
    if (
      !selectedInspection ||
      eligibility?.latest_inspection_id !== selectedInspection.id
    ) {
      showWarningDialog('仅合同最新的未通过 QC 任务可以发起复检')
      return
    }
    setReinspectionCode(`QC-R-${Date.now().toString().slice(-6)}`)
    setReinspectionSchedule(defaultScheduledAt())
    setReinspectionReason('整改完成后复检')
    setReinspectionOpen(true)
  }

  async function submitReinspection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedInspection || !reinspectionCode.trim() || !reinspectionReason.trim()) {
      showWarningDialog('请完整填写复检编号、排期和原因')
      return
    }
    setSubmitting(true)
    try {
      const reinspection = await createQualityReinspection(selectedInspection.id, {
        code: reinspectionCode.trim(),
        scheduled_at: reinspectionSchedule,
        inspector_id: selectedInspection.inspector_id ?? currentUser.id,
        reason: reinspectionReason.trim(),
      })
      setInspections((current) => [reinspection, ...current])
      setReinspectionOpen(false)
      setMessage(`${reinspection.code} 已创建并进入负责人待查验列表`)
      onNavigate(moduleDetailPath(qualityInspectionPath, reinspection.id))
    } catch (caught) {
      showError(caught, '复检任务创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount = inspections.filter((item) => item.status === 'pending').length
  const inProgressCount = inspections.filter((item) => item.status === 'in_progress').length
  const completedCount = inspections.filter((item) => item.status === 'completed').length
  const cancelledCount = inspections.filter((item) => item.status === 'cancelled').length
  const validationEntries = validationOrder.flatMap((field) => {
    const error = fieldErrors[field]
    return error ? [{ field, message: error }] : []
  })

  return (
    <section className="quality-inspection-page">
      <div className="summary-strip" aria-label="QC 任务概览">
        <Metric label="QC 任务" value={inspections.length} />
        <Metric label="待查验" value={pendingCount} intent={pendingCount ? 'warning' : 'normal'} />
        <Metric
          label="查验中"
          value={inProgressCount}
          intent={inProgressCount ? 'warning' : 'normal'}
        />
        <Metric label="已完成" value={completedCount} />
        <Metric label="已取消" value={cancelledCount} />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid quality-inspection-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Search size={18} />} title="QC 任务列表" />
            </div>
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadQualityInspections()
              }}
            >
              <label>
                任务搜索
                <Input
                  value={search}
                  placeholder="QC 单号 / 合同 / 供应商"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                任务状态
                <FormSelect
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {qualityTaskStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                查验结果
                <FormSelect
                  value={resultFilter}
                  onChange={(event) => setResultFilter(event.target.value)}
                >
                  <option value="">全部结果</option>
                  {qualityResultOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                供应商标识
                <Input
                  value={supplierFilter}
                  placeholder="supplier-id"
                  onChange={(event) => setSupplierFilter(event.target.value)}
                />
              </label>
              <label>
                采购合同 ID
                <Input
                  value={contractFilter}
                  placeholder="purchase-contract-id"
                  onChange={(event) => setContractFilter(event.target.value)}
                />
              </label>
              <label>
                负责人范围
                <FormSelect
                  value={assigneeFilter}
                  onChange={(event) =>
                    setAssigneeFilter(event.target.value as QualityInspectionAssigneeFilter)
                  }
                >
                  <option value="all">看全部</option>
                  <option value="mine">只看我的</option>
                </FormSelect>
              </label>
              <label>
                <span>&nbsp;</span>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
              </label>
              <label>
                <span>&nbsp;</span>
                <Button type="primary" icon={<Plus size={16} />} onClick={startNewTask}>
                  新增 QC 单
                </Button>
              </label>
            </form>

            <Table<QualityInspection>
              columns={[
                {
                  title: 'QC 任务单号',
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
                  title: '任务状态',
                  dataIndex: 'status',
                  render: (value: QualityInspectionStatus) => (
                    <Tag color={taskStatusColor(value)}>{taskStatusLabel(value)}</Tag>
                  ),
                },
                {
                  title: '查验结果',
                  dataIndex: 'result',
                  render: (value: string | null) => (
                    <Tag color={resultColor(value)}>{resultLabel(value)}</Tag>
                  ),
                },
                { title: '采购合同', dataIndex: 'purchase_contract_no' },
                { title: '供应商', dataIndex: 'supplier_name' },
                { title: '负责人', dataIndex: 'inspector_name' },
                {
                  title: '排期时间',
                  dataIndex: 'scheduled_at',
                  render: formatScheduledAt,
                },
                {
                  title: '入口',
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record) => (
                    <Button size="small" onClick={(event) => openDetail(event, record)}>
                      查看详情
                    </Button>
                  ),
                },
              ]}
              dataSource={inspections}
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
          title="新增 QC 任务"
          width={860}
          onCancel={() => {
            setFieldErrors({})
            setTaskModalOpen(false)
          }}
        >
          <div className="workflow-modal-content entity-modal-form">
            <div className="panel-heading quality-form-heading">
              <PanelTitle icon={<ShieldCheck size={18} />} title="建立 QC 任务" />
            </div>
            <Alert
              showIcon
              title="这里只建立任务，不填写查验结果"
              description="负责人将在“我的 QC 任务”中开始查验并登记结果。"
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
                            {fieldLabels[field]}：{errorMessage}
                          </button>
                        </li>
                      ))}
                    </ul>
                  }
                  showIcon
                  title={`请完善以下 ${validationEntries.length} 项信息`}
                  type="error"
                />
              ) : null}

              <div className="form-divider">任务信息</div>
              <div className="form-pair two">
                <label htmlFor="quality-code">
                  <RequiredFieldLabel>QC 任务单号</RequiredFieldLabel>
                  <Input
                    aria-describedby={fieldErrors.code ? 'quality-code-error' : undefined}
                    aria-invalid={Boolean(fieldErrors.code)}
                    id="quality-code"
                    required
                    status={fieldErrors.code ? 'error' : undefined}
                    value={form.code}
                    onChange={(event) => updateFormField('code', event.target.value)}
                  />
                  <FieldError field="code" message={fieldErrors.code} />
                </label>
                <label htmlFor="quality-contract-id">
                  <RequiredFieldLabel>采购合同</RequiredFieldLabel>
                  <RemoteSelect
                    ariaDescribedBy={
                      fieldErrors.purchase_contract_id ? 'quality-contract-id-error' : undefined
                    }
                    ariaInvalid={Boolean(fieldErrors.purchase_contract_id)}
                    ariaLabel="采购合同"
                    fetchOptions={fetchContractOptions}
                    id="quality-contract-id"
                    placeholder="输入合同号或供应商搜索"
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
                  <RequiredFieldLabel>排期时间</RequiredFieldLabel>
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
                  <RequiredFieldLabel>负责人</RequiredFieldLabel>
                  <Select
                    aria-describedby={
                      fieldErrors.inspector_id ? 'quality-inspector-id-error' : undefined
                    }
                    aria-invalid={Boolean(fieldErrors.inspector_id)}
                    aria-label="负责人"
                    aria-required="true"
                    id="quality-inspector-id"
                    loading={loadingAssignableUsers}
                    notFoundContent={loadingAssignableUsers ? '加载人员中' : '暂无可选员工'}
                    optionFilterProp="label"
                    placeholder={loadingAssignableUsers ? '正在加载员工' : '请选择系统员工'}
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
                        label={`${form.inspector_name} / 当前用户`}
                        value={form.inspector_id}
                      >
                        {form.inspector_name} / 当前用户
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
                任务说明
                <Input.TextArea
                  id="quality-task-note"
                  placeholder="例如：验货地址、重点检查项、供应商联系人"
                  rows={3}
                  value={form.task_note}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, task_note: event.target.value }))
                  }
                />
              </label>
              <label htmlFor="quality-attachment-group">
                附件组
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
                创建 QC 任务
              </Button>
            </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<LayoutDashboard size={18} />} title="QC 任务详情" />
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => onNavigate(qualityInspectionPath)}
              >
                返回列表
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
                    任务状态：{taskStatusLabel(selectedInspection.status)}
                    {' / '}
                    查验结果：{resultLabel(selectedInspection.result)}
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
                              selectedInspection.issues.some(
                                (issue) => issue.status !== 'resolved',
                              )
                                ? '请先关闭全部异常'
                                : '创建新的复检任务'
                            }
                            type="primary"
                            onClick={openReinspection}
                          >
                            发起复检
                          </Button>
                          {selectedInspection.issues.some(
                            (issue) => issue.status !== 'resolved',
                          ) ? (
                            <span>关闭全部异常后才能发起复检</span>
                          ) : null}
                        </>
                      ) : (
                        <span>该任务不是合同最新 QC，不能重复发起复检</span>
                      )}
                    </div>
                  )
                ) : null}

                <dl className="detail-list">
                  <div>
                    <dt>QC 任务单号</dt>
                    <dd>{selectedInspection.code}</dd>
                  </div>
                  <div>
                    <dt>任务状态</dt>
                    <dd>{taskStatusLabel(selectedInspection.status)}</dd>
                  </div>
                  <div>
                    <dt>排期时间</dt>
                    <dd>{formatScheduledAt(selectedInspection.scheduled_at)}</dd>
                  </div>
                  <div>
                    <dt>负责人</dt>
                    <dd>{selectedInspection.inspector_name}</dd>
                  </div>
                  <div>
                    <dt>采购合同</dt>
                    <dd>{selectedInspection.purchase_contract_no}</dd>
                  </div>
                  <div>
                    <dt>供应商</dt>
                    <dd>{selectedInspection.supplier_name}</dd>
                  </div>
                  <div>
                    <dt>实际查验日期</dt>
                    <dd>
                      {selectedInspection.inspected_at
                        ? formatDate(selectedInspection.inspected_at)
                        : '未开始'}
                    </dd>
                  </div>
                  <div>
                    <dt>查验结果</dt>
                    <dd>{resultLabel(selectedInspection.result)}</dd>
                  </div>
                  <div>
                    <dt>任务说明</dt>
                    <dd>{nullableText(selectedInspection.issue_summary)}</dd>
                  </div>
                  <div>
                    <dt>附件组</dt>
                    <dd>{nullableText(selectedInspection.attachment_group_id)}</dd>
                  </div>
                  {selectedInspection.parent_inspection_id ? (
                    <div>
                      <dt>复检来源</dt>
                      <dd>第 {selectedInspection.reinspection_no ?? 1} 次复检</dd>
                    </div>
                  ) : null}
                  {selectedInspection.cancel_reason ? (
                    <div>
                      <dt>取消原因</dt>
                      <dd>{selectedInspection.cancel_reason}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="accessory-heading">
                  <strong>商品查验明细</strong>
                  <span>{selectedInspection.lines.length} 行</span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>商品</th>
                      <th>查验数量</th>
                      <th>不良数量</th>
                      <th>单位</th>
                      <th>结果</th>
                      <th>备注</th>
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
                          任务尚未完成，暂无查验明细
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>异常问题</strong>
                  <span>{selectedInspection.issues.length} 条</span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>类型</th>
                      <th>严重度</th>
                      <th>描述</th>
                      <th>整改</th>
                      <th>状态</th>
                      <th>关闭说明</th>
                      <th>操作</th>
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
                              关闭异常
                            </Button>
                          ) : (
                            <span>{issue.resolved_by_name ?? '已关闭'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {selectedInspection.issues.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={7}>
                          暂无异常问题
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>凭证附件</strong>
                  <span>{selectedInspection.attachments?.length ?? 0} 个</span>
                </div>
                <div className="quality-attachment-list">
                  {(selectedInspection.attachments ?? []).map((attachment) => (
                    <a href={attachment.url} key={attachment.id} rel="noreferrer" target="_blank">
                      <Paperclip size={14} />
                      {attachment.filename}
                      <Tag>{attachment.category === 'resolution' ? '整改' : '查验'}</Tag>
                    </a>
                  ))}
                  {(selectedInspection.attachments?.length ?? 0) === 0 ? (
                    <span>暂无凭证附件</span>
                  ) : null}
                </div>

                <div className="accessory-heading">
                  <strong>任务审计记录</strong>
                  <span>{selectedInspection.events?.length ?? 0} 条</span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>动作</th>
                      <th>操作人</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInspection.events ?? []).map((event) => (
                      <tr key={event.id}>
                        <td>{formatScheduledAt(event.created_at)}</td>
                        <td>{qualityEventLabel(event.event_type)}</td>
                        <td>{event.actor_user_name}</td>
                        <td>{nullableText(event.notes)}</td>
                      </tr>
                    ))}
                    {(selectedInspection.events?.length ?? 0) === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={4}>
                          暂无审计记录
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <ShieldCheck size={28} />
                <strong>暂无 QC 任务</strong>
                <span>请返回列表选择任务查看详情</span>
              </div>
            )}
          </section>
        ) : null}
      </section>

      <Modal
        centered
        footer={null}
        open={Boolean(resolvingIssueId)}
        title="关闭 QC 异常"
        width={620}
        onCancel={() => setResolvingIssueId(null)}
      >
        <form className="record-form" onSubmit={submitIssueResolution}>
          <Alert showIcon title="请确认整改已经完成，并填写可追溯的关闭说明" type="warning" />
          <label htmlFor="quality-resolution-note">
            <RequiredFieldLabel>关闭说明</RequiredFieldLabel>
            <Input.TextArea
              id="quality-resolution-note"
              required
              rows={4}
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
            />
          </label>
          <label className="quality-file-upload" htmlFor="quality-resolution-evidence">
            整改图片
            <input
              accept="image/*"
              aria-label="上传整改图片"
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
            {uploadingEvidence ? <span>正在上传整改凭证...</span> : null}
          </div>
          <Button htmlType="submit" loading={submitting} type="primary">
            确认关闭异常
          </Button>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={reinspectionOpen}
        title="发起 QC 复检"
        width={620}
        onCancel={() => setReinspectionOpen(false)}
      >
        <form className="record-form" onSubmit={submitReinspection}>
          <Alert showIcon title="复检会生成一个新的待执行 QC 任务" type="info" />
          <label htmlFor="quality-reinspection-code">
            <RequiredFieldLabel>复检任务单号</RequiredFieldLabel>
            <Input
              id="quality-reinspection-code"
              required
              value={reinspectionCode}
              onChange={(event) => setReinspectionCode(event.target.value)}
            />
          </label>
          <label htmlFor="quality-reinspection-schedule">
            <RequiredFieldLabel>复检排期</RequiredFieldLabel>
            <Input
              id="quality-reinspection-schedule"
              required
              type="datetime-local"
              value={reinspectionSchedule}
              onChange={(event) => setReinspectionSchedule(event.target.value)}
            />
          </label>
          <label htmlFor="quality-reinspection-reason">
            <RequiredFieldLabel>复检原因</RequiredFieldLabel>
            <Input.TextArea
              id="quality-reinspection-reason"
              required
              rows={3}
              value={reinspectionReason}
              onChange={(event) => setReinspectionReason(event.target.value)}
            />
          </label>
          <Button htmlType="submit" loading={submitting} type="primary">
            创建复检任务
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
    reader.onerror = () => reject(reader.error ?? new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
