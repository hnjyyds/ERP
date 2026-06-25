import { emptyToNull, formatDate, formatQuantity, nullableText, todayInputValue, type RoutedDetailPageProps } from '../appHelpers'
type RoutedDetailPageWithCurrentUserProps = RoutedDetailPageProps & { currentUser: any }
import { Alert, Button, Input, Modal, Skeleton, Table, Tag } from 'antd'
import { followupSourceTypeOptions } from '../../../shared/formOptions'
import { ArrowLeft, LayoutDashboard, Plus, Search, ShieldCheck , FilePenLine} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createQualityInspection, getQualityInboundEligibility, listQualityInspections, updateQualityInspection, type QualityInspection, type QualityInspectionInboundEligibility, type QualityInspectionPayload } from '../../../api'
import { qualityInspectionPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { qualityResultOptions, qualityIssueSeverityOptions, qualityIssueStatusOptions } from '../../../shared/formOptions'

type QualityInspectionAssigneeFilter = 'all' | 'mine'


type QualityInspectionFormState = {
  code: string
  purchase_contract_id: string
  inspected_at: string
  result: string
  inspector_id: string
  inspector_name: string
  issue_summary: string
  attachment_group_id: string
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
  issue_status: string
  issue_attachment_group_id: string
}

function sourceTypeFromNodeCode(nodeCode: string) {
  if (nodeCode === 'inbound_completed') return 'inventory_inbound'
  if (nodeCode === 'outbound_completed') return 'inventory_outbound'
  return 'quality_inspection'
}

function followupSourceTypeLabel(value: string | null): string {
  if (!value) return '未回写'
  return followupSourceTypeOptions.find((item) => item.value === value)?.label ?? value
}

function initialQualityInspectionForm(): QualityInspectionFormState {
  return {
    code: `QC-${Date.now().toString().slice(-6)}`,
    purchase_contract_id: '',
    inspected_at: '2026-08-19',
    result: 'passed',
    inspector_id: 'u-qc-001',
    inspector_name: 'QC 张工',
    issue_summary: '',
    attachment_group_id: 'attach-qc-demo',
    purchase_contract_line_id: '',
    product_id: 'product-bag',
    product_code: 'BAG-40',
    product_name: 'Eco Shopping Bag',
    inspected_quantity: '120',
    failed_quantity: '0',
    unit: 'pcs',
    line_result: 'passed',
    line_remark: '首检通过',
    issue_type: '包装破损',
    severity: 'major',
    description: '',
    corrective_action: '',
    issue_status: 'open',
    issue_attachment_group_id: '',
  }
}

function qualityInspectionToForm(inspection: QualityInspection): QualityInspectionFormState {
  const line = inspection.lines[0]
  const issue = inspection.issues[0]
  return {
    code: inspection.code,
    purchase_contract_id: inspection.purchase_contract_id,
    inspected_at: inspection.inspected_at,
    result: inspection.result,
    inspector_id: inspection.inspector_id ?? '',
    inspector_name: inspection.inspector_name,
    issue_summary: inspection.issue_summary ?? '',
    attachment_group_id: inspection.attachment_group_id ?? '',
    purchase_contract_line_id: line?.purchase_contract_line_id ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    inspected_quantity: line?.inspected_quantity ?? '0',
    failed_quantity: line?.failed_quantity ?? '0',
    unit: line?.unit ?? 'pcs',
    line_result: line?.result ?? inspection.result,
    line_remark: line?.remark ?? '',
    issue_type: issue?.issue_type ?? '包装破损',
    severity: issue?.severity ?? 'major',
    description: issue?.description ?? '',
    corrective_action: issue?.corrective_action ?? '',
    issue_status: issue?.status ?? 'open',
    issue_attachment_group_id: issue?.attachment_group_id ?? '',
  }
}

function qualityInspectionPayload(form: QualityInspectionFormState): QualityInspectionPayload {
  const issues = form.description.trim()
    ? [
        {
          issue_type: form.issue_type.trim(),
          severity: form.severity,
          description: form.description.trim(),
          corrective_action: emptyToNull(form.corrective_action),
          status: form.issue_status,
          attachment_group_id: emptyToNull(form.issue_attachment_group_id),
        },
      ]
    : []

  return {
    code: form.code.trim(),
    purchase_contract_id: form.purchase_contract_id.trim(),
    inspected_at: form.inspected_at,
    result: form.result,
    inspector_id: emptyToNull(form.inspector_id),
    inspector_name: form.inspector_name.trim(),
    issue_summary: emptyToNull(form.issue_summary),
    attachment_group_id: emptyToNull(form.attachment_group_id),
    lines: [
      {
        purchase_contract_line_id: emptyToNull(form.purchase_contract_line_id),
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        inspected_quantity: form.inspected_quantity,
        failed_quantity: form.failed_quantity || '0',
        unit: form.unit.trim(),
        result: form.line_result,
        remark: emptyToNull(form.line_remark),
      },
    ],
    issues,
  }
}

function qualityResultLabel(value: string | null): string {
  if (!value) return '未判定'
  return qualityResultOptions.find((item) => item.value === value)?.label ?? value
}

function qualityResultTagColor(value: string): string {
  if (value === 'passed') return 'success'
  if (value === 'failed') return 'error'
  if (value === 'partial_passed') return 'warning'
  if (value === 'recheck_required') return 'processing'
  return 'default'
}

function qualityIssueSeverityLabel(value: string): string {
  return qualityIssueSeverityOptions.find((item) => item.value === value)?.label ?? value
}

function qualityIssueStatusLabel(value: string): string {
  return qualityIssueStatusOptions.find((item) => item.value === value)?.label ?? value
}

function qualityInboundReason(inspection: QualityInspection): string {
  if (inspection.result === 'passed') return 'QC 已通过'
  if (inspection.result === 'failed') return 'QC 未通过，禁止入库'
  if (inspection.result === 'partial_passed') return 'QC 部分通过，需按合格数量入库'
  if (inspection.result === 'recheck_required') return 'QC 待复检，暂缓入库'
  return '等待 QC 判定'
}

export function QualityInspectionsPage({
  currentUser,
  detailId,
  onNavigate,
}: RoutedDetailPageWithCurrentUserProps) {
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null)
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState<QualityInspectionAssigneeFilter>('all')
  const [eligibility, setEligibility] = useState<QualityInspectionInboundEligibility | null>(null)
  const [form, setForm] = useState<QualityInspectionFormState>(() => initialQualityInspectionForm())
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedInspection = useMemo(
    () => {
      if (detailId) return inspections.find((item) => item.id === detailId) ?? null
      return inspections.find((item) => item.id === selectedInspectionId) ?? inspections[0] ?? null
    },
    [detailId, inspections, selectedInspectionId],
  )

  useEffect(() => {
    void loadQualityInspections()
  }, [])

  useEffect(() => {
    if (detailId && selectedInspection) {
      void refreshQualityInboundEligibility(selectedInspection.purchase_contract_id)
      return
    }
    setEligibility(null)
  }, [detailId, selectedInspection?.id])

  useEffect(() => {
    if (detailId && inspections.length > 0 && !inspections.some((item) => item.id === detailId)) {
      onNavigate(qualityInspectionPath)
    }
  }, [detailId, inspections, onNavigate])

  async function loadQualityInspections(preferredInspectionId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listQualityInspections({
        q: search.trim() || undefined,
        result: resultFilter || undefined,
        supplier_id: supplierFilter.trim() || undefined,
        purchase_contract_id: contractFilter.trim() || undefined,
        assignee_user_id: assigneeFilter === 'mine' ? currentUser.id : undefined,
      })
      setInspections(result.items)
      const nextId =
        preferredInspectionId ??
        (result.items.some((item) => item.id === selectedInspectionId)
          ? selectedInspectionId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedInspectionId(nextId)
    } catch (caught) {
      showError(caught, 'QC 查验加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function refreshQualityInboundEligibility(purchaseContractId: string) {
    if (!purchaseContractId.trim()) {
      setEligibility(null)
      return
    }
    try {
      const result = await getQualityInboundEligibility(purchaseContractId)
      setEligibility(result)
    } catch (caught) {
      setEligibility(null)
      showError(caught, '入库判定加载失败')
    }
  }

  function startNewInspection() {
    setEditingInspectionId(null)
    setForm(initialQualityInspectionForm())
    setMessage('')
    setError('')
    setInspectionModalOpen(true)
  }

  function selectInspection(inspection: QualityInspection) {
    setSelectedInspectionId(inspection.id)
  }

  function openInspectionDetail(inspection: QualityInspection) {
    setSelectedInspectionId(inspection.id)
    onNavigate(moduleDetailPath(qualityInspectionPath, inspection.id))
  }

  function stopAndOpenInspectionDetail(event: MouseEvent<HTMLElement>, inspection: QualityInspection) {
    event.stopPropagation()
    openInspectionDetail(inspection)
  }

  function editSelectedInspection() {
    if (!selectedInspection) return
    setEditingInspectionId(selectedInspection.id)
    setForm(qualityInspectionToForm(selectedInspection))
    setInspectionModalOpen(true)
  }

  async function saveQualityInspection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const payload = qualityInspectionPayload(form)
      const inspection = editingInspectionId
        ? await updateQualityInspection(editingInspectionId, payload)
        : await createQualityInspection(payload)
      setSelectedInspectionId(inspection.id)
      setEditingInspectionId(null)
      setForm(qualityInspectionToForm(inspection))
      setInspectionModalOpen(false)
      setMessage(`已登记 ${inspection.code}，QC 节点已回写采购跟单`)
      await loadQualityInspections(inspection.id)
      await refreshQualityInboundEligibility(inspection.purchase_contract_id)
    } catch (caught) {
      showError(caught, 'QC 查验保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const passedCount = inspections.filter((item) => item.result === 'passed').length
  const failedCount = inspections.filter((item) => item.result === 'failed').length
  const recheckCount = inspections.filter((item) =>
    ['partial_passed', 'recheck_required'].includes(item.result),
  ).length
  const issueCount = inspections.reduce((sum, item) => sum + item.issues.length, 0)

  return (
    <section className="quality-inspection-page">
<div className="summary-strip" aria-label="QC 查验概览">
        <Metric label="QC 单数" value={inspections.length} />
        <Metric label="已通过" value={passedCount} />
        <Metric label="不通过" value={failedCount} intent={failedCount > 0 ? 'danger' : 'normal'} />
        <Metric label="待复检" value={recheckCount} intent={recheckCount > 0 ? 'warning' : 'normal'} />
        <Metric label="异常问题" value={issueCount} intent={issueCount > 0 ? 'warning' : 'normal'} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid quality-inspection-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="QC 查验列表" />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadQualityInspections()
            }}
          >
            <label>
              查验搜索
              <Input
                value={search}
                placeholder="QC 单号 / 合同 / 供应商"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              查验结果
              <FormSelect
                value={resultFilter}
                onChange={(event) => setResultFilter(event.target.value)}
              >
                <option value="">全部结果</option>
                {qualityResultOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
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
              QC 范围
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
              <Button type="primary" icon={<Plus size={16} />} onClick={startNewInspection}>
                新增 QC 单
              </Button>
            </label>
          </form>

          <Table<QualityInspection>
            columns={[
              {
                title: 'QC 单号',
                dataIndex: 'code',
                render: (value: string, record: QualityInspection) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenInspectionDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              {
                title: '结果',
                dataIndex: 'result',
                render: (value: string) => (
                  <Tag color={qualityResultTagColor(value)}>{qualityResultLabel(value)}</Tag>
                ),
              },
              { title: '采购合同', dataIndex: 'purchase_contract_no' },
              { title: '供应商', dataIndex: 'supplier_name' },
              {
                title: 'QC 负责人',
                dataIndex: 'qc_user_name',
                render: (value: string | null) => value ?? '未指定',
              },
              { title: '查验日', dataIndex: 'inspected_at', render: formatDate },
              {
                title: '异常',
                dataIndex: 'issues',
                render: (_, inspection) => `${inspection.issues.length} 条`,
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: QualityInspection) => (
                  <Button size="small" onClick={(event) => stopAndOpenInspectionDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={inspections}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedInspection?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => selectInspection(record),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={inspectionModalOpen}
          title={editingInspectionId ? '编辑 QC 查验' : '新增 QC 查验'}
          width={1040}
          onCancel={() => {
            setEditingInspectionId(null)
            setInspectionModalOpen(false)
          }}
        >
          <div className="workflow-modal-content entity-modal-form">
          <div className="panel-heading quality-form-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="QC 查验登记" />
          </div>

          <form className="record-form" onSubmit={saveQualityInspection}>
            <div className="form-divider">查验主信息</div>
            <div className="form-pair two">
              <label htmlFor="quality-code">
                QC 单号
                <Input
                  id="quality-code"
                  required
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                />
              </label>
              <label htmlFor="quality-contract-id">
                采购合同 ID
                <Input
                  id="quality-contract-id"
                  required
                  value={form.purchase_contract_id}
                  onChange={(event) =>
                    setForm({ ...form, purchase_contract_id: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="quality-inspected-at">
                查验日期
                <Input
                  id="quality-inspected-at"
                  required
                  type="date"
                  value={form.inspected_at}
                  onChange={(event) => setForm({ ...form, inspected_at: event.target.value })}
                />
              </label>
              <label htmlFor="quality-result">
                查验结果
                <FormSelect
                  id="quality-result"
                  value={form.result}
                  onChange={(event) => setForm({ ...form, result: event.target.value })}
                >
                  {qualityResultOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="quality-inspector-name">
                查验人
                <Input
                  id="quality-inspector-name"
                  required
                  value={form.inspector_name}
                  onChange={(event) => setForm({ ...form, inspector_name: event.target.value })}
                />
              </label>
              <label htmlFor="quality-attachment-group">
                附件组
                <Input
                  id="quality-attachment-group"
                  value={form.attachment_group_id}
                  onChange={(event) =>
                    setForm({ ...form, attachment_group_id: event.target.value })
                  }
                />
              </label>
            </div>
            <label htmlFor="quality-issue-summary">
              查验摘要
              <Input
                id="quality-issue-summary"
                value={form.issue_summary}
                onChange={(event) => setForm({ ...form, issue_summary: event.target.value })}
              />
            </label>

            <div className="form-divider">查验明细</div>
            <label htmlFor="quality-line-id">
              采购合同明细 ID
              <Input
                id="quality-line-id"
                value={form.purchase_contract_line_id}
                onChange={(event) =>
                  setForm({ ...form, purchase_contract_line_id: event.target.value })
                }
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="quality-product-code">
                商品编码
                <Input
                  id="quality-product-code"
                  value={form.product_code}
                  onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                />
              </label>
              <label htmlFor="quality-product-name">
                商品名称
                <Input
                  id="quality-product-name"
                  required
                  value={form.product_name}
                  onChange={(event) => setForm({ ...form, product_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label htmlFor="quality-inspected-quantity">
                查验数量
                <Input
                  id="quality-inspected-quantity"
                  min="0"
                  required
                  step="0.0001"
                  type="number"
                  value={form.inspected_quantity}
                  onChange={(event) =>
                    setForm({ ...form, inspected_quantity: event.target.value })
                  }
                />
              </label>
              <label htmlFor="quality-failed-quantity">
                不良数量
                <Input
                  id="quality-failed-quantity"
                  min="0"
                  step="0.0001"
                  type="number"
                  value={form.failed_quantity}
                  onChange={(event) => setForm({ ...form, failed_quantity: event.target.value })}
                />
              </label>
              <label htmlFor="quality-unit">
                单位
                <Input
                  id="quality-unit"
                  required
                  value={form.unit}
                  onChange={(event) => setForm({ ...form, unit: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="quality-line-result">
                明细结果
                <FormSelect
                  id="quality-line-result"
                  value={form.line_result}
                  onChange={(event) => setForm({ ...form, line_result: event.target.value })}
                >
                  {qualityResultOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="quality-line-remark">
                明细备注
                <Input
                  id="quality-line-remark"
                  value={form.line_remark}
                  onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
                />
              </label>
            </div>

            <div className="form-divider">异常问题（可选）</div>
            <div className="form-pair three">
              <label htmlFor="quality-issue-type">
                问题类型
                <Input
                  id="quality-issue-type"
                  value={form.issue_type}
                  onChange={(event) => setForm({ ...form, issue_type: event.target.value })}
                />
              </label>
              <label htmlFor="quality-severity">
                严重度
                <FormSelect
                  id="quality-severity"
                  value={form.severity}
                  onChange={(event) => setForm({ ...form, severity: event.target.value })}
                >
                  {qualityIssueSeverityOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="quality-issue-status">
                处理状态
                <FormSelect
                  id="quality-issue-status"
                  value={form.issue_status}
                  onChange={(event) => setForm({ ...form, issue_status: event.target.value })}
                >
                  {qualityIssueStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <label htmlFor="quality-description">
              问题描述
              <Input.TextArea
                id="quality-description"
                rows={2}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <label htmlFor="quality-corrective-action">
              整改措施
              <Input
                id="quality-corrective-action"
                value={form.corrective_action}
                onChange={(event) =>
                  setForm({ ...form, corrective_action: event.target.value })
                }
              />
            </label>

            <Button htmlType="submit" loading={submitting} type="primary">
              {editingInspectionId ? '保存 QC 查验' : '新增 QC 查验'}
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="QC 查验明细和入库判定" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(qualityInspectionPath)}>
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
                <strong>{eligibility?.reason ?? qualityInboundReason(selectedInspection)}</strong>
                <span>
                  最新查验：{formatDate(eligibility?.inspected_at ?? selectedInspection.inspected_at)}
                  {' / '}
                  {qualityResultLabel(eligibility?.latest_result ?? selectedInspection.result)}
                </span>
              </div>

              <dl className="detail-list">
                <div>
                  <dt>QC 单号</dt>
                  <dd>{selectedInspection.code}</dd>
                </div>
                <div>
                  <dt>查验结果</dt>
                  <dd>{qualityResultLabel(selectedInspection.result)}</dd>
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
                  <dt>查验日期</dt>
                  <dd>{formatDate(selectedInspection.inspected_at)}</dd>
                </div>
                <div>
                  <dt>查验人</dt>
                  <dd>{selectedInspection.inspector_name}</dd>
                </div>
                <div>
                  <dt>QC 负责人</dt>
                  <dd>{selectedInspection.qc_user_name ?? '未指定'}</dd>
                </div>
                <div>
                  <dt>附件组</dt>
                  <dd>{nullableText(selectedInspection.attachment_group_id)}</dd>
                </div>
                <div>
                  <dt>摘要</dt>
                  <dd>{nullableText(selectedInspection.issue_summary)}</dd>
                </div>
              </dl>

              <div className="delivery-action-row">
                <Button icon={<FilePenLine size={16} />} onClick={editSelectedInspection}>
                  编辑 QC 单
                </Button>
              </div>

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
                      <td>{qualityResultLabel(line.result)}</td>
                      <td>{nullableText(line.remark)}</td>
                    </tr>
                  ))}
                  {selectedInspection.lines.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={6}>
                        暂无查验明细
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
                  </tr>
                </thead>
                <tbody>
                  {selectedInspection.issues.map((issue) => (
                    <tr key={issue.id}>
                      <td>{issue.issue_type}</td>
                      <td>{qualityIssueSeverityLabel(issue.severity)}</td>
                      <td>{issue.description}</td>
                      <td>{nullableText(issue.corrective_action)}</td>
                      <td>{qualityIssueStatusLabel(issue.status)}</td>
                    </tr>
                  ))}
                  {selectedInspection.issues.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        暂无异常问题
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <ShieldCheck size={28} />
              <strong>暂无 QC 查验单</strong>
              <span>请返回列表选择 QC 单查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
