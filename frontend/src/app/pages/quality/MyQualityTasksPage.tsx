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
import { useEffect, useState } from 'react'

import {
  cancelQualityInspection,
  listPurchaseContracts,
  listQualityInspections,
  rescheduleQualityInspection,
  updateQualityInspection,
  uploadImage,
  type CurrentUser,
  type QualityInspection,
  type QualityInspectionPayload,
  type QualityInspectionStatus,
} from '../../../api'
import {
  qualityIssueSeverityOptions,
  qualityResultOptions,
  qualityTaskStatusOptions,
} from '../../../shared/formOptions'
import { showError, showWarningDialog } from '../../../shared/errors'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'

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
  return qualityTaskStatusOptions.find((option) => option.value === value)?.label ?? value
}

function statusColor(value: QualityInspectionStatus): string {
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
      issue_type: '包装破损',
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
    code: task.code,
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
  if (!form.inspected_at) errors.inspected_at = '请选择实际查验日期'
  if (!qualityResultOptions.some((option) => option.value === form.result)) {
    errors.result = '请选择查验结果'
  }
  if (form.lines.length === 0) errors.lines = '采购合同没有可查验的商品明细'
  form.lines.forEach((line, index) => {
    const prefix = `line-${index}`
    if (!line.product_name.trim()) errors[`${prefix}-product_name`] = '请输入商品名称'
    const inspectedQuantity = Number(line.inspected_quantity)
    if (
      !line.inspected_quantity.trim() ||
      !Number.isFinite(inspectedQuantity) ||
      inspectedQuantity <= 0
    ) {
      errors[`${prefix}-inspected_quantity`] = '请输入大于 0 的有效数量'
    }
    const failedQuantity = Number(line.failed_quantity)
    if (
      !Number.isFinite(failedQuantity) ||
      failedQuantity < 0 ||
      failedQuantity > inspectedQuantity
    ) {
      errors[`${prefix}-failed_quantity`] = '不良数量须在 0 和查验数量之间'
    }
    if (!line.unit.trim()) errors[`${prefix}-unit`] = '请输入单位'
    if (!qualityResultOptions.some((option) => option.value === line.result)) {
      errors[`${prefix}-result`] = '请选择明细结果'
    }
    if (form.result === 'passed' && (failedQuantity > 0 || line.result !== 'passed')) {
      errors[`${prefix}-result`] = '整单通过时，全部明细必须通过且不良数量为 0'
    }
  })
  if (form.result !== 'passed' && !form.issue.description.trim()) {
    errors.issue_description = '未通过时必须填写异常描述'
  }
  if (form.result === 'passed' && form.issue.description.trim()) {
    errors.issue_description = '整单通过时不能登记未关闭异常'
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
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
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

  async function loadTasks() {
    setLoading(true)
    try {
      const result = await listQualityInspections({
        inspector_user_id: currentUser.id,
        q: search.trim() || undefined,
        status: statusFilter || undefined,
      })
      setTasks(result.items)
    } catch (caught) {
      showError(caught, '我的 QC 任务加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function startTask(task: QualityInspection) {
    setSubmittingId(task.id)
    setMessage('')
    try {
      const updated = await updateQualityInspection(task.id, basePayload(task, 'in_progress'))
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)))
      setMessage(`${task.code} 已开始查验`)
    } catch (caught) {
      showError(caught, 'QC 任务状态更新失败')
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
      showError(caught, '采购合同明细加载失败，请手工填写查验明细')
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
      showWarningDialog('查验凭证目前仅支持图片')
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
      showError(caught, '查验凭证上传失败')
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
      showWarningDialog(`请修正 ${Object.keys(errors).length} 项查验信息`)
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
      setMessage(`${updated.code} 已完成查验，结果：${resultLabel(updated.result)}`)
    } catch (caught) {
      showError(caught, 'QC 查验结果保存失败')
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
      showWarningDialog(actionMode === 'cancel' ? '请填写取消原因' : '请填写调整排期原因')
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
        actionMode === 'cancel' ? `${updated.code} 已取消` : `${updated.code} 的排期已调整`,
      )
      setActionTask(null)
      setActionMode(null)
    } catch (caught) {
      showError(caught, actionMode === 'cancel' ? 'QC 任务取消失败' : 'QC 排期调整失败')
    } finally {
      setSubmittingId(null)
    }
  }

  const pendingCount = tasks.filter((task) => task.status === 'pending').length
  const inProgressCount = tasks.filter((task) => task.status === 'in_progress').length
  const completedCount = tasks.filter((task) => task.status === 'completed').length
  const overdueCount = tasks.filter(
    (task) => task.status === 'pending' && new Date(task.scheduled_at).getTime() < Date.now(),
  ).length

  return (
    <section className="quality-inspection-page">
      <div className="summary-strip" aria-label="我的 QC 任务概览">
        <Metric label="我的任务" value={tasks.length} />
        <Metric label="待查验" value={pendingCount} intent={pendingCount ? 'warning' : 'normal'} />
        <Metric
          label="查验中"
          value={inProgressCount}
          intent={inProgressCount ? 'warning' : 'normal'}
        />
        <Metric label="已完成" value={completedCount} />
        <Metric label="已逾期" value={overdueCount} intent={overdueCount ? 'danger' : 'normal'} />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="workspace-panel list-panel product-list-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<ClipboardCheck size={18} />} title="我的 QC 任务" />
        </div>
        <form
          className="inline-filters"
          onSubmit={(event) => {
            event.preventDefault()
            void loadTasks()
          }}
        >
          <label>
            任务搜索
            <Input
              placeholder="QC 单号 / 合同 / 供应商"
              value={search}
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
            <span>&nbsp;</span>
            <Button htmlType="submit" icon={<Search size={16} />}>
              查询
            </Button>
          </label>
        </form>

        <Table<QualityInspection>
          columns={[
            { title: 'QC 任务单号', dataIndex: 'code' },
            { title: '采购合同', dataIndex: 'purchase_contract_no' },
            { title: '供应商', dataIndex: 'supplier_name' },
            {
              title: '排期时间',
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
              title: '状态',
              dataIndex: 'status',
              render: (value: QualityInspectionStatus) => (
                <Tag color={statusColor(value)}>{statusLabel(value)}</Tag>
              ),
            },
            {
              title: '结果',
              dataIndex: 'result',
              render: (value: string | null) => (
                <Tag color={resultColor(value)}>{resultLabel(value)}</Tag>
              ),
            },
            {
              title: '操作',
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
                      开始查验
                    </Button>
                  ) : null}
                  {task.status === 'in_progress' ? (
                    <Button
                      icon={<CheckCircle2 size={15} />}
                      size="small"
                      type="primary"
                      onClick={() => void openCompletion(task)}
                    >
                      登记结果
                    </Button>
                  ) : null}
                  {task.status === 'pending' || task.status === 'in_progress' ? (
                    <Button
                      icon={<CalendarClock size={15} />}
                      size="small"
                      onClick={() => openTaskAction(task, 'reschedule')}
                    >
                      调整排期
                    </Button>
                  ) : null}
                  {task.status === 'pending' || task.status === 'in_progress' ? (
                    <Button
                      danger
                      icon={<XCircle size={15} />}
                      size="small"
                      onClick={() => openTaskAction(task, 'cancel')}
                    >
                      取消
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
          dataSource={tasks}
          loading={loading}
          pagination={false}
          rowKey="id"
          size="small"
        />
      </section>

      <Modal
        centered
        footer={null}
        open={Boolean(completionTask && completionForm)}
        title={completionTask ? `完成 QC 查验 · ${completionTask.code}` : '完成 QC 查验'}
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
              title={`排期：${formatScheduledAt(completionTask.scheduled_at)}`}
              description={`${completionTask.purchase_contract_no} / ${completionTask.supplier_name}`}
              type="info"
            />
            <form className="record-form" noValidate onSubmit={submitCompletion}>
              <div className="form-divider">查验结论</div>
              <div className="form-pair two">
                <label htmlFor="quality-task-inspected-at">
                  <RequiredLabel>实际查验日期</RequiredLabel>
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
                  <RequiredLabel>查验结果</RequiredLabel>
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
                        {option.label}
                      </option>
                    ))}
                  </FormSelect>
                  <CompletionError field="result" errors={completionErrors} />
                </label>
              </div>

              <div className="form-divider">查验明细</div>
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
                        <strong>{line.product_code || `明细 ${index + 1}`}</strong>
                        <span>合同明细 {index + 1}</span>
                      </div>
                      <label htmlFor={`${prefix}-product-name`}>
                        <RequiredLabel>商品名称</RequiredLabel>
                        <Input id={`${prefix}-product-name`} readOnly value={line.product_name} />
                      </label>
                      <div className="form-pair three">
                        <label htmlFor={`${prefix}-inspected-quantity`}>
                          <RequiredLabel>查验数量</RequiredLabel>
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
                          不良数量
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
                          <RequiredLabel>单位</RequiredLabel>
                          <Input id={`${prefix}-unit`} readOnly value={line.unit} />
                        </label>
                      </div>
                      <div className="form-pair two">
                        <label htmlFor={`${prefix}-result`}>
                          <RequiredLabel>明细结果</RequiredLabel>
                          <FormSelect
                            id={`${prefix}-result`}
                            value={line.result}
                            onChange={(event) =>
                              updateCompletionLine(index, 'result', event.target.value)
                            }
                          >
                            {qualityResultOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </FormSelect>
                          <CompletionError field={`${prefix}-result`} errors={completionErrors} />
                        </label>
                        <label htmlFor={`${prefix}-remark`}>
                          明细备注
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

              <div className="form-divider">异常问题</div>
              {completionForm.result === 'passed' ? (
                <Alert showIcon title="整单通过时不能登记异常" type="info" />
              ) : null}
              <div className="form-pair two">
                <label htmlFor="quality-task-issue-line">
                  关联商品
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
                  问题类型
                  <Input
                    id="quality-task-issue-type"
                    value={completionForm.issue.issue_type}
                    onChange={(event) => updateIssueField('issue_type', event.target.value)}
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label htmlFor="quality-task-severity">
                  严重度
                  <FormSelect
                    id="quality-task-severity"
                    value={completionForm.issue.severity}
                    onChange={(event) => updateIssueField('severity', event.target.value)}
                  >
                    {qualityIssueSeverityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
              </div>
              <label htmlFor="quality-task-description">
                {completionForm.result === 'passed' ? (
                  '问题描述'
                ) : (
                  <RequiredLabel>问题描述</RequiredLabel>
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
                整改措施
                <Input
                  disabled={completionForm.result === 'passed'}
                  id="quality-task-corrective-action"
                  value={completionForm.issue.corrective_action}
                  onChange={(event) => updateIssueField('corrective_action', event.target.value)}
                />
              </label>

              <div className="form-divider">现场凭证</div>
              <label className="quality-file-upload" htmlFor="quality-task-evidence">
                查验图片
                <input
                  accept="image/*"
                  aria-label="上传查验图片"
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
                {uploadingEvidence ? <span>正在上传凭证...</span> : null}
              </div>

              <Button htmlType="submit" loading={submittingId === completionTask.id} type="primary">
                完成 QC 查验
              </Button>
            </form>
          </div>
        ) : null}
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(actionTask && actionMode)}
        title={actionMode === 'cancel' ? '取消 QC 任务' : '调整 QC 排期'}
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
                <RequiredLabel>新排期时间</RequiredLabel>
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
              <RequiredLabel>{actionMode === 'cancel' ? '取消原因' : '调整原因'}</RequiredLabel>
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
              {actionMode === 'cancel' ? '确认取消' : '保存排期'}
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
    reader.onerror = () => reject(reader.error ?? new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
