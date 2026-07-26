import { Alert, Button, Input, Modal, Popconfirm, Table, Tag } from 'antd'
import { CheckCircle2, ClipboardCheck, Play, Search, XCircle } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'

import {
  listPurchaseContracts,
  listQualityInspections,
  updateQualityInspection,
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

type CompletionFormState = {
  inspected_at: string
  result: string
  purchase_contract_line_id: string
  product_id: string
  product_code: string
  product_name: string
  inspected_quantity: string
  failed_quantity: string
  unit: string
  line_result: string
  line_remark: string
  issue_type: string
  severity: string
  description: string
  corrective_action: string
}

type CompletionField =
  | 'inspected_at'
  | 'result'
  | 'product_name'
  | 'inspected_quantity'
  | 'failed_quantity'
  | 'unit'
  | 'line_result'

type CompletionErrors = Partial<Record<CompletionField, string>>

const completionFields: CompletionField[] = [
  'inspected_at',
  'result',
  'product_name',
  'inspected_quantity',
  'failed_quantity',
  'unit',
  'line_result',
]

const completionLabels: Record<CompletionField, string> = {
  inspected_at: '实际查验日期',
  result: '查验结果',
  product_name: '商品名称',
  inspected_quantity: '查验数量',
  failed_quantity: '不良数量',
  unit: '单位',
  line_result: '明细结果',
}

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
  const line = task.lines[0]
  return {
    inspected_at: task.inspected_at ?? today(),
    result: task.result ?? 'passed',
    purchase_contract_line_id: line?.purchase_contract_line_id ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    inspected_quantity: line?.inspected_quantity ?? '',
    failed_quantity: line?.failed_quantity ?? '0',
    unit: line?.unit ?? 'pcs',
    line_result: line?.result ?? 'passed',
    line_remark: line?.remark ?? '',
    issue_type: '包装破损',
    severity: 'major',
    description: '',
    corrective_action: '',
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
  }
}

function completionPayload(
  task: QualityInspection,
  form: CompletionFormState,
): QualityInspectionPayload {
  const issues = form.description.trim()
    ? [
        {
          issue_type: form.issue_type.trim(),
          severity: form.severity,
          description: form.description.trim(),
          corrective_action: form.corrective_action.trim() || null,
          status: 'open',
          attachment_group_id: null,
        },
      ]
    : []
  return {
    ...basePayload(task, 'completed'),
    inspected_at: form.inspected_at,
    result: form.result,
    lines: [
      {
        purchase_contract_line_id: form.purchase_contract_line_id.trim() || null,
        product_id: form.product_id.trim() || null,
        product_code: form.product_code.trim() || null,
        product_name: form.product_name.trim(),
        inspected_quantity: form.inspected_quantity,
        failed_quantity: form.failed_quantity || '0',
        unit: form.unit.trim(),
        result: form.line_result,
        remark: form.line_remark.trim() || null,
      },
    ],
    issues,
  }
}

function validateCompletion(form: CompletionFormState): CompletionErrors {
  const errors: CompletionErrors = {}
  if (!form.inspected_at) errors.inspected_at = '请选择实际查验日期'
  if (!qualityResultOptions.some((option) => option.value === form.result)) {
    errors.result = '请选择查验结果'
  }
  if (!form.product_name.trim()) errors.product_name = '请输入商品名称'
  const inspectedQuantity = Number(form.inspected_quantity)
  if (!form.inspected_quantity.trim()) {
    errors.inspected_quantity = '请输入查验数量'
  } else if (!Number.isFinite(inspectedQuantity) || inspectedQuantity <= 0) {
    errors.inspected_quantity = '请输入大于 0 的有效数量'
  }
  const failedQuantity = Number(form.failed_quantity)
  if (form.failed_quantity && (!Number.isFinite(failedQuantity) || failedQuantity < 0)) {
    errors.failed_quantity = '请输入大于或等于 0 的有效数量'
  } else if (
    Number.isFinite(inspectedQuantity) &&
    inspectedQuantity > 0 &&
    failedQuantity > inspectedQuantity
  ) {
    errors.failed_quantity = '不良数量不能大于查验数量'
  }
  if (!form.unit.trim()) errors.unit = '请输入单位'
  if (!qualityResultOptions.some((option) => option.value === form.line_result)) {
    errors.line_result = '请选择明细结果'
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

function CompletionError({ field, errors }: { field: CompletionField; errors: CompletionErrors }) {
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

  async function changeStatus(task: QualityInspection, status: QualityInspectionStatus) {
    setSubmittingId(task.id)
    setMessage('')
    try {
      const updated = await updateQualityInspection(task.id, basePayload(task, status))
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)))
      setMessage(status === 'in_progress' ? `${task.code} 已开始查验` : `${task.code} 已取消`)
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
      const line = contract?.lines[0]
      if (!line) return
      setCompletionForm((current) =>
        current
          ? {
              ...current,
              purchase_contract_line_id: line.id,
              product_id: line.product_id ?? '',
              product_code: line.product_code ?? '',
              product_name: line.product_name,
              inspected_quantity: line.quantity,
              unit: line.unit,
            }
          : current,
      )
    } catch (caught) {
      showError(caught, '采购合同明细加载失败，请手工填写查验明细')
    }
  }

  function updateCompletionField<Field extends keyof CompletionFormState>(
    field: Field,
    value: CompletionFormState[Field],
  ) {
    setCompletionForm((current) => (current ? { ...current, [field]: value } : current))
    if (!completionFields.includes(field as CompletionField)) return
    setCompletionErrors((current) => {
      if (!current[field as CompletionField]) return current
      const next = { ...current }
      delete next[field as CompletionField]
      return next
    })
  }

  async function submitCompletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!completionTask || !completionForm) return
    const errors = validateCompletion(completionForm)
    if (completionFields.some((field) => errors[field])) {
      setCompletionErrors(errors)
      const names = completionFields
        .filter((field) => errors[field])
        .map((field) => completionLabels[field])
      showWarningDialog(`请完善 ${names.length} 项信息：${names.slice(0, 3).join('、')}`)
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
              width: 240,
              render: (_: unknown, task) => (
                <div className="table-actions">
                  {task.status === 'pending' ? (
                    <Button
                      icon={<Play size={15} />}
                      loading={submittingId === task.id}
                      size="small"
                      type="primary"
                      onClick={() => void changeStatus(task, 'in_progress')}
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
                    <Popconfirm
                      cancelText="返回"
                      okText="确认取消"
                      title="确认取消这个 QC 任务？"
                      onConfirm={() => void changeStatus(task, 'cancelled')}
                    >
                      <Button danger icon={<XCircle size={15} />} size="small">
                        取消
                      </Button>
                    </Popconfirm>
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
                      updateCompletionField('line_result', event.target.value)
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
              <div className="form-pair two">
                <label htmlFor="quality-task-line-id">
                  采购合同明细 ID
                  <Input
                    id="quality-task-line-id"
                    value={completionForm.purchase_contract_line_id}
                    onChange={(event) =>
                      updateCompletionField('purchase_contract_line_id', event.target.value)
                    }
                  />
                </label>
                <label htmlFor="quality-task-product-code">
                  商品编码
                  <Input
                    id="quality-task-product-code"
                    value={completionForm.product_code}
                    onChange={(event) => updateCompletionField('product_code', event.target.value)}
                  />
                </label>
              </div>
              <label htmlFor="quality-task-product-name">
                <RequiredLabel>商品名称</RequiredLabel>
                <Input
                  aria-invalid={Boolean(completionErrors.product_name)}
                  id="quality-task-product-name"
                  required
                  status={completionErrors.product_name ? 'error' : undefined}
                  value={completionForm.product_name}
                  onChange={(event) => updateCompletionField('product_name', event.target.value)}
                />
                <CompletionError field="product_name" errors={completionErrors} />
              </label>
              <div className="form-pair three">
                <label htmlFor="quality-task-inspected-quantity">
                  <RequiredLabel>查验数量</RequiredLabel>
                  <Input
                    aria-invalid={Boolean(completionErrors.inspected_quantity)}
                    id="quality-task-inspected-quantity"
                    min="0.0001"
                    required
                    status={completionErrors.inspected_quantity ? 'error' : undefined}
                    step="0.0001"
                    type="number"
                    value={completionForm.inspected_quantity}
                    onChange={(event) =>
                      updateCompletionField('inspected_quantity', event.target.value)
                    }
                  />
                  <CompletionError field="inspected_quantity" errors={completionErrors} />
                </label>
                <label htmlFor="quality-task-failed-quantity">
                  不良数量
                  <Input
                    aria-invalid={Boolean(completionErrors.failed_quantity)}
                    id="quality-task-failed-quantity"
                    min="0"
                    status={completionErrors.failed_quantity ? 'error' : undefined}
                    step="0.0001"
                    type="number"
                    value={completionForm.failed_quantity}
                    onChange={(event) =>
                      updateCompletionField('failed_quantity', event.target.value)
                    }
                  />
                  <CompletionError field="failed_quantity" errors={completionErrors} />
                </label>
                <label htmlFor="quality-task-unit">
                  <RequiredLabel>单位</RequiredLabel>
                  <Input
                    aria-invalid={Boolean(completionErrors.unit)}
                    id="quality-task-unit"
                    required
                    status={completionErrors.unit ? 'error' : undefined}
                    value={completionForm.unit}
                    onChange={(event) => updateCompletionField('unit', event.target.value)}
                  />
                  <CompletionError field="unit" errors={completionErrors} />
                </label>
              </div>
              <div className="form-pair two">
                <label htmlFor="quality-task-line-result">
                  <RequiredLabel>明细结果</RequiredLabel>
                  <FormSelect
                    aria-invalid={Boolean(completionErrors.line_result)}
                    id="quality-task-line-result"
                    required
                    status={completionErrors.line_result ? 'error' : undefined}
                    value={completionForm.line_result}
                    onChange={(event) => updateCompletionField('line_result', event.target.value)}
                  >
                    {qualityResultOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </FormSelect>
                  <CompletionError field="line_result" errors={completionErrors} />
                </label>
                <label htmlFor="quality-task-line-remark">
                  明细备注
                  <Input
                    id="quality-task-line-remark"
                    value={completionForm.line_remark}
                    onChange={(event) => updateCompletionField('line_remark', event.target.value)}
                  />
                </label>
              </div>

              <div className="form-divider">异常问题（可选）</div>
              <div className="form-pair two">
                <label htmlFor="quality-task-issue-type">
                  问题类型
                  <Input
                    id="quality-task-issue-type"
                    value={completionForm.issue_type}
                    onChange={(event) => updateCompletionField('issue_type', event.target.value)}
                  />
                </label>
                <label htmlFor="quality-task-severity">
                  严重度
                  <FormSelect
                    id="quality-task-severity"
                    value={completionForm.severity}
                    onChange={(event) => updateCompletionField('severity', event.target.value)}
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
                问题描述
                <Input.TextArea
                  id="quality-task-description"
                  rows={2}
                  value={completionForm.description}
                  onChange={(event) => updateCompletionField('description', event.target.value)}
                />
              </label>
              <label htmlFor="quality-task-corrective-action">
                整改措施
                <Input
                  id="quality-task-corrective-action"
                  value={completionForm.corrective_action}
                  onChange={(event) =>
                    updateCompletionField('corrective_action', event.target.value)
                  }
                />
              </label>

              <Button htmlType="submit" loading={submittingId === completionTask.id} type="primary">
                完成 QC 查验
              </Button>
            </form>
          </div>
        ) : null}
      </Modal>
    </section>
  )
}
