import { Alert, Button, Descriptions, Input, Modal, Table, Tag } from 'antd'
import { ArrowLeft, CheckCircle2, LayoutDashboard, Plus, Search , ClipboardCheck, RefreshCw, Settings} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createFollowupTemplate, generateFollowupPlanFromPurchaseContract, listFollowupOverdueNodes, listFollowupPlans, listFollowupTemplates, syncFollowupSampleEvents, syncFollowupSourceEvent, updateFollowupTemplate, type FollowProcessTemplate, type FollowProcessTemplateNodePayload, type FollowProcessTemplatePayload, type FollowSourceEventPayload, type PurchaseFollowOverdueNode, type PurchaseFollowPlan, type PurchaseFollowPlanGeneratePayload } from '../../../api'
import { followupPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { followupStatusOptions, followupNodeOptions, followupSourceTypeOptions } from '../../../shared/formOptions'
import { formatDate, nullableText, todayInputValue, type RoutedDetailPageProps , emptyToNull} from '../appHelpers'

function followupSourceTypeLabel(value: string | null): string {
  if (!value) return '未回写'
  return followupSourceTypeOptions.find((item) => item.value === value)?.label ?? value
}

function FollowupTemplateNodeFields({
  daysKey,
  label,
  remindKey,
  remindLabel,
  setTemplateForm,
  templateForm,
}: {
  daysKey: keyof FollowupTemplateFormState
  label: string
  remindKey: keyof FollowupTemplateFormState
  remindLabel: string
  setTemplateForm: (form: FollowupTemplateFormState) => void
  templateForm: FollowupTemplateFormState
}) {
  return (
    <div className="form-row">
      <label>
        {label}
        <Input
          type="number"
          min="0"
          value={templateForm[daysKey] as string}
          onChange={(event) => setTemplateForm({ ...templateForm, [daysKey]: event.target.value })}
        />
      </label>
      <label>
        {remindLabel}
        <Input
          type="number"
          min="0"
          value={templateForm[remindKey] as string}
          onChange={(event) => setTemplateForm({ ...templateForm, [remindKey]: event.target.value })}
        />
      </label>
    </div>
  )
}


type FollowupTemplateFormState = {
  name: string
  enabled: boolean
  is_default: boolean
  contract_days: string
  contract_remind: string
  confirm_days: string
  confirm_remind: string
  bulk_days: string
  bulk_remind: string
  qc_days: string
  qc_remind: string
  inbound_days: string
  inbound_remind: string
  outbound_days: string
  outbound_remind: string
}

type FollowupPlanFormState = {
  purchase_contract_id: string
  as_of: string
}

type FollowupSourceEventFormState = {
  purchase_contract_id: string
  node_code: string
  source_record_type: string
  source_record_id: string
  actual_date: string
  source_summary: string
}

function initialFollowupTemplateForm(): FollowupTemplateFormState {
  return {
    name: '标准采购跟单流程',
    enabled: true,
    is_default: true,
    contract_days: '0',
    contract_remind: '0',
    confirm_days: '3',
    confirm_remind: '1',
    bulk_days: '7',
    bulk_remind: '2',
    qc_days: '14',
    qc_remind: '2',
    inbound_days: '20',
    inbound_remind: '3',
    outbound_days: '25',
    outbound_remind: '3',
  }
}

function initialFollowupPlanForm(): FollowupPlanFormState {
  return {
    purchase_contract_id: '',
    as_of: '2026-08-05',
  }
}

function initialFollowupSourceEventForm(): FollowupSourceEventFormState {
  return {
    purchase_contract_id: '',
    node_code: 'quality_inspection',
    source_record_type: 'quality_inspection',
    source_record_id: 'qc-demo-001',
    actual_date: '2026-08-19',
    source_summary: 'QC 查验通过',
  }
}

function followupTemplateToForm(template: FollowProcessTemplate | null): FollowupTemplateFormState {
  const form = initialFollowupTemplateForm()
  if (!template) return form
  const nodeByCode = new Map(template.nodes.map((node) => [node.node_code, node]))
  const contractNode = nodeByCode.get('contract_confirmed')
  const confirmNode = nodeByCode.get('confirm_sample_submitted')
  const bulkNode = nodeByCode.get('bulk_sample_submitted')
  const qcNode = nodeByCode.get('quality_inspection')
  const inboundNode = nodeByCode.get('inbound_completed')
  const outboundNode = nodeByCode.get('outbound_completed')

  return {
    name: template.name,
    enabled: template.enabled,
    is_default: template.is_default,
    contract_days: String(contractNode?.standard_days ?? form.contract_days),
    contract_remind: String(contractNode?.remind_before_days ?? form.contract_remind),
    confirm_days: String(confirmNode?.standard_days ?? form.confirm_days),
    confirm_remind: String(confirmNode?.remind_before_days ?? form.confirm_remind),
    bulk_days: String(bulkNode?.standard_days ?? form.bulk_days),
    bulk_remind: String(bulkNode?.remind_before_days ?? form.bulk_remind),
    qc_days: String(qcNode?.standard_days ?? form.qc_days),
    qc_remind: String(qcNode?.remind_before_days ?? form.qc_remind),
    inbound_days: String(inboundNode?.standard_days ?? form.inbound_days),
    inbound_remind: String(inboundNode?.remind_before_days ?? form.inbound_remind),
    outbound_days: String(outboundNode?.standard_days ?? form.outbound_days),
    outbound_remind: String(outboundNode?.remind_before_days ?? form.outbound_remind),
  }
}

function followupSourceEventFormForPlan(
  plan: PurchaseFollowPlan,
  current: FollowupSourceEventFormState,
): FollowupSourceEventFormState {
  const firstPending = plan.nodes.find((node) => node.status !== 'completed')
  if (!firstPending) {
    return {
      ...current,
      purchase_contract_id: plan.purchase_contract_id,
    }
  }
  return {
    purchase_contract_id: plan.purchase_contract_id,
    node_code: firstPending.node_code,
    source_record_type: followupSourceTypeForNode(firstPending.node_code),
    source_record_id: `${firstPending.node_code}-source`,
    actual_date: firstPending.planned_date,
    source_summary: `${firstPending.node_name}完成`,
  }
}

function followupTemplatePayload(form: FollowupTemplateFormState): FollowProcessTemplatePayload {
  return {
    name: form.name.trim(),
    enabled: form.enabled,
    is_default: form.is_default,
    nodes: [
      followupNodePayload('contract_confirmed', '合同下单确立', 10, 'purchase_contract', form.contract_days, form.contract_remind),
      followupNodePayload('confirm_sample_submitted', '确认样提交', 20, 'sample_confirm', form.confirm_days, form.confirm_remind),
      followupNodePayload('bulk_sample_submitted', '大货样提交', 30, 'sample_bulk', form.bulk_days, form.bulk_remind),
      followupNodePayload('quality_inspection', 'QC 查验', 40, 'qc', form.qc_days, form.qc_remind),
      followupNodePayload('inbound_completed', '入库', 50, 'inbound', form.inbound_days, form.inbound_remind),
      followupNodePayload('outbound_completed', '出库', 60, 'outbound', form.outbound_days, form.outbound_remind),
    ],
  }
}

function followupNodePayload(
  node_code: string,
  node_name: string,
  sequence_no: number,
  actual_date_source: string,
  standardDays: string,
  remindBeforeDays: string,
): FollowProcessTemplateNodePayload {
  return {
    node_code,
    node_name,
    sequence_no,
    standard_days: Number(standardDays),
    remind_before_days: Number(remindBeforeDays),
    actual_date_source,
  }
}

function followupPlanGeneratePayload(
  form: FollowupPlanFormState,
): PurchaseFollowPlanGeneratePayload {
  return {
    purchase_contract_id: form.purchase_contract_id.trim(),
    as_of: emptyToNull(form.as_of),
  }
}

function followupSourceEventPayload(form: FollowupSourceEventFormState): FollowSourceEventPayload {
  return {
    purchase_contract_id: form.purchase_contract_id.trim(),
    node_code: form.node_code,
    source_record_type: form.source_record_type,
    source_record_id: form.source_record_id.trim(),
    actual_date: form.actual_date,
    source_summary: form.source_summary.trim(),
  }
}

function followupPlanStatusLabel(value: string): string {
  return followupStatusOptions.find((item) => item.value === value)?.label ?? value
}

function followupNodeStatusLabel(value: string): string {
  if (value === 'pending') return '待完成'
  if (value === 'in_progress') return '进行中'
  if (value === 'completed') return '已完成'
  if (value === 'overdue') return '已逾期'
  return value
}

function followupNodeLabel(value: string): string {
  if (value === 'contract_confirmed') return '合同下单确立'
  return followupNodeOptions.find((item) => item.value === value)?.label ?? value
}

function followupSourceTypeForNode(nodeCode: string): string {
  if (nodeCode === 'confirm_sample_submitted' || nodeCode === 'bulk_sample_submitted') {
    return 'sample_followup_event'
  }
  return 'quality_inspection'
}

export function FollowupPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [templates, setTemplates] = useState<FollowProcessTemplate[]>([])
  const [plans, setPlans] = useState<PurchaseFollowPlan[]>([])
  const [overdueNodes, setOverdueNodes] = useState<PurchaseFollowOverdueNode[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [overdueAsOf, setOverdueAsOf] = useState('2026-09-05')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [followupModalOpen, setFollowupModalOpen] = useState(false)
  const [templateForm, setTemplateForm] = useState<FollowupTemplateFormState>(() =>
    initialFollowupTemplateForm(),
  )
  const [planForm, setPlanForm] = useState<FollowupPlanFormState>(() =>
    initialFollowupPlanForm(),
  )
  const [sourceEventForm, setSourceEventForm] = useState<FollowupSourceEventFormState>(() =>
    initialFollowupSourceEventForm(),
  )

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? templates[0] ?? null,
    [templates, selectedTemplateId],
  )
  const selectedPlan = useMemo(
    () => {
      if (detailId) return plans.find((item) => item.id === detailId) ?? null
      return plans.find((item) => item.id === selectedPlanId) ?? plans[0] ?? null
    },
    [detailId, plans, selectedPlanId],
  )

  useEffect(() => {
    void loadFollowupWorkspace()
  }, [])

  useEffect(() => {
    setTemplateForm(followupTemplateToForm(selectedTemplate))
  }, [selectedTemplate?.id])

  useEffect(() => {
    if (!selectedPlan) return
    setPlanForm({
      purchase_contract_id: selectedPlan.purchase_contract_id,
      as_of: selectedPlan.base_date,
    })
    setSourceEventForm((current) => followupSourceEventFormForPlan(selectedPlan, current))
  }, [selectedPlan?.id, selectedPlan?.overall_status])

  useEffect(() => {
    if (detailId && plans.length > 0 && !plans.some((item) => item.id === detailId)) {
      onNavigate(followupPath)
    }
  }, [detailId, onNavigate, plans])

  function openFollowupDetail(plan: PurchaseFollowPlan) {
    setSelectedPlanId(plan.id)
    onNavigate(moduleDetailPath(followupPath, plan.id))
  }

  function stopAndOpenFollowupDetail(event: MouseEvent<HTMLElement>, plan: PurchaseFollowPlan) {
    event.stopPropagation()
    openFollowupDetail(plan)
  }

  async function loadFollowupWorkspace(preferredPlanId?: string, preferredTemplateId?: string) {
    setLoading(true)
    setError('')
    try {
      const [templateResult, planResult, overdueResult] = await Promise.all([
        listFollowupTemplates(),
        listFollowupPlans({
          q: search.trim() || undefined,
          overall_status: statusFilter || undefined,
          supplier_id: supplierFilter.trim() || undefined,
          purchase_contract_id: contractFilter.trim() || undefined,
        }),
        listFollowupOverdueNodes(overdueAsOf),
      ])
      setTemplates(templateResult.items)
      setPlans(planResult.items)
      setOverdueNodes(overdueResult.items)

      const nextTemplateId =
        preferredTemplateId ??
        (templateResult.items.some((item) => item.id === selectedTemplateId) ? selectedTemplateId : null) ??
        templateResult.items[0]?.id ??
        null
      const nextPlanId =
        preferredPlanId ??
        (planResult.items.some((item) => item.id === selectedPlanId) ? selectedPlanId : null) ??
        planResult.items[0]?.id ??
        null
      setSelectedTemplateId(nextTemplateId)
      setSelectedPlanId(nextPlanId)
    } catch (caught) {
      showError(caught, '采购跟单加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function saveFollowupTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const payload = followupTemplatePayload(templateForm)
      const template = selectedTemplate
        ? await updateFollowupTemplate(selectedTemplate.id, payload)
        : await createFollowupTemplate(payload)
      setMessage(`已保存跟单模板 ${template.name}`)
      setFollowupModalOpen(false)
      await loadFollowupWorkspace(selectedPlan?.id, template.id)
    } catch (caught) {
      showError(caught, '跟单模板保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function generateFollowupPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const plan = await generateFollowupPlanFromPurchaseContract(followupPlanGeneratePayload(planForm))
      setContractFilter(plan.purchase_contract_id)
      setSelectedPlanId(plan.id)
      setFollowupModalOpen(false)
      await loadFollowupWorkspace(plan.id)
      setMessage(`已生成跟单计划 ${plan.purchase_contract_no}`)
    } catch (caught) {
      showError(caught, '跟单计划生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function syncSelectedFollowupSampleEvents() {
    if (!selectedPlan) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const synced = await syncFollowupSampleEvents({
        purchase_contract_id: selectedPlan.purchase_contract_id,
        as_of: selectedPlan.base_date,
      })
      await loadFollowupWorkspace(synced.id)
      setMessage(`已同步样品跟单事件 ${synced.purchase_contract_no}`)
    } catch (caught) {
      showError(caught, '样品事件同步失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function syncFollowupSourceEventFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const nodeLabel = followupNodeLabel(sourceEventForm.node_code)
      const plan = await syncFollowupSourceEvent(followupSourceEventPayload(sourceEventForm))
      setFollowupModalOpen(false)
      await loadFollowupWorkspace(plan.id)
      setMessage(`已回写节点 ${nodeLabel}`)
    } catch (caught) {
      showError(caught, '来源事件回写失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function scanFollowupOverdueNodes(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const overdue = await listFollowupOverdueNodes(overdueAsOf)
      setOverdueNodes(overdue.items)
      setMessage(`已扫描 ${overdue.total} 个逾期节点`)
    } catch (caught) {
      showError(caught, '逾期节点扫描失败')
    } finally {
      setSubmitting(false)
    }
  }

  const completedPlans = plans.filter((item) => item.overall_status === 'completed').length
  const overduePlans = plans.filter((item) => item.overall_status === 'overdue').length
  const totalNodes = plans.reduce((sum, item) => sum + item.nodes.length, 0)
  const completedNodes = plans.reduce(
    (sum, item) => sum + item.nodes.filter((node) => node.status === 'completed').length,
    0,
  )

  return (
    <section className="followup-page">
<div className="summary-strip" aria-label="采购跟单概览">
        <Metric label="跟单计划" value={plans.length} />
        <Metric label="已完成计划" value={completedPlans} />
        <Metric label="逾期计划" value={overduePlans} intent={overduePlans > 0 ? 'warning' : 'normal'} />
        <Metric label="完成节点" value={`${completedNodes}/${totalNodes}`} />
        <Metric label="逾期节点" value={overdueNodes.length} intent={overdueNodes.length > 0 ? 'danger' : 'normal'} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid followup-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="采购跟单计划" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadFollowupWorkspace()
              }}
            >
              <label>
                计划搜索
                <Input
                  value={search}
                  placeholder="采购合同 / 供应商"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                整体状态
              <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {followupStatusOptions.map((item) => (
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
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Settings size={16} />} onClick={() => setFollowupModalOpen(true)}>
                配置/生成
              </Button>
            </form>
          </div>

          <Table<PurchaseFollowPlan>
            columns={[
              {
                title: '采购合同',
                dataIndex: 'purchase_contract_no',
                render: (value: string, record: PurchaseFollowPlan) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenFollowupDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'overall_status', render: followupPlanStatusLabel },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '基准日', dataIndex: 'base_date', render: formatDate },
              {
                title: '节点',
                dataIndex: 'nodes',
                render: (_, plan) => `${plan.nodes.filter((node) => node.status === 'completed').length}/${plan.nodes.length}`,
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: PurchaseFollowPlan) => (
                  <Button size="small" onClick={(event) => stopAndOpenFollowupDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={plans}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedPlan?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedPlanId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={followupModalOpen}
          title="跟单模板和计划生成"
          width={1040}
          onCancel={() => setFollowupModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<LayoutDashboard size={18} />} title="跟单流程模板" />
          <form className="record-form" onSubmit={saveFollowupTemplate}>
            <div className="form-pair two">
              <label htmlFor="followup-template-name">
                模板名称
                <Input
                  id="followup-template-name"
                  required
                  value={templateForm.name}
                  onChange={(event) => setTemplateForm({ ...templateForm, name: event.target.value })}
                />
              </label>
              <label>
                默认模板
              <FormSelect
                value={String(templateForm.is_default)}
                onChange={(event) =>
                  setTemplateForm({ ...templateForm, is_default: event.target.value === 'true' })
                }
              >
                <option value="true">是</option>
                <option value="false">否</option>
              </FormSelect>
              </label>
            </div>
            <label className="checkbox-label" htmlFor="followup-template-enabled">
              <input
                checked={templateForm.enabled}
                id="followup-template-enabled"
                type="checkbox"
                onChange={(event) =>
                  setTemplateForm({ ...templateForm, enabled: event.target.checked })
                }
              />
              启用模板
            </label>

            <div className="form-divider">节点标准天数 / 提前提醒天数</div>
            <FollowupTemplateNodeFields
              daysKey="contract_days"
              label="合同下单确立"
              remindKey="contract_remind"
              remindLabel="合同提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <FollowupTemplateNodeFields
              daysKey="confirm_days"
              label="确认样提交"
              remindKey="confirm_remind"
              remindLabel="确认样提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <FollowupTemplateNodeFields
              daysKey="bulk_days"
              label="大货样提交"
              remindKey="bulk_remind"
              remindLabel="大货样提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <FollowupTemplateNodeFields
              daysKey="qc_days"
              label="QC 查验"
              remindKey="qc_remind"
              remindLabel="QC 提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <FollowupTemplateNodeFields
              daysKey="inbound_days"
              label="入库"
              remindKey="inbound_remind"
              remindLabel="入库提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <FollowupTemplateNodeFields
              daysKey="outbound_days"
              label="出库"
              remindKey="outbound_remind"
              remindLabel="出库提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <Button htmlType="submit" loading={submitting} type="primary">
              保存跟单模板
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={generateFollowupPlan}>
            <div className="form-divider">采购合同生成跟单计划</div>
            <label htmlFor="followup-contract-id">
              采购合同 ID
              <Input
                id="followup-contract-id"
                required
                value={planForm.purchase_contract_id}
                onChange={(event) =>
                  setPlanForm({ ...planForm, purchase_contract_id: event.target.value })
                }
              />
            </label>
            <label htmlFor="followup-base-date">
              基准日期
              <Input
                id="followup-base-date"
                type="date"
                value={planForm.as_of}
                onChange={(event) => setPlanForm({ ...planForm, as_of: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting}>
              生成跟单计划
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={syncFollowupSourceEventFromForm}>
            <div className="form-divider">业务来源回写</div>
            <label htmlFor="followup-source-contract-id">
              采购合同 ID
              <Input
                id="followup-source-contract-id"
                required
                value={sourceEventForm.purchase_contract_id}
                onChange={(event) =>
                  setSourceEventForm({ ...sourceEventForm, purchase_contract_id: event.target.value })
                }
              />
            </label>
            <div className="form-pair two">
              <label>
                节点
              <FormSelect
                value={sourceEventForm.node_code}
                onChange={(event) =>
                  setSourceEventForm({
                    ...sourceEventForm,
                    node_code: event.target.value,
                    source_record_type: followupSourceTypeForNode(event.target.value),
                  })
                }
              >
                {followupNodeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
              <label>
                来源类型
              <FormSelect
                value={sourceEventForm.source_record_type}
                onChange={(event) =>
                  setSourceEventForm({ ...sourceEventForm, source_record_type: event.target.value })
                }
              >
                {followupSourceTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="followup-source-id">
                来源记录 ID
                <Input
                  id="followup-source-id"
                  required
                  value={sourceEventForm.source_record_id}
                  onChange={(event) =>
                    setSourceEventForm({ ...sourceEventForm, source_record_id: event.target.value })
                  }
                />
              </label>
              <label htmlFor="followup-actual-date">
                实际日期
                <Input
                  id="followup-actual-date"
                  required
                  type="date"
                  value={sourceEventForm.actual_date}
                  onChange={(event) =>
                    setSourceEventForm({ ...sourceEventForm, actual_date: event.target.value })
                  }
                />
              </label>
            </div>
            <label htmlFor="followup-source-summary">
              来源摘要
              <Input
                id="followup-source-summary"
                required
                value={sourceEventForm.source_summary}
                onChange={(event) =>
                  setSourceEventForm({ ...sourceEventForm, source_summary: event.target.value })
                }
              />
            </label>
            <Button htmlType="submit" loading={submitting}>
              回写实际日期
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="节点进度查询" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(followupPath)}>
              返回列表
            </Button>
          </div>
          {selectedPlan ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>整体状态</dt>
                  <dd>{followupPlanStatusLabel(selectedPlan.overall_status)}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedPlan.supplier_name}</dd>
                </div>
                <div>
                  <dt>基准日期</dt>
                  <dd>{formatDate(selectedPlan.base_date)}</dd>
                </div>
                <div>
                  <dt>采购合同 ID</dt>
                  <dd>{selectedPlan.purchase_contract_id}</dd>
                </div>
              </dl>

              <div className="delivery-action-row">
                <Button
                  icon={<RefreshCw size={16} />}
                  loading={submitting}
                  onClick={() => void syncSelectedFollowupSampleEvents()}
                >
                  同步样品事件
                </Button>
                <Button
                  icon={<Search size={16} />}
                  loading={submitting}
                  onClick={() => void scanFollowupOverdueNodes()}
                >
                  扫描逾期节点
                </Button>
              </div>

              <div className="accessory-heading">
                <strong>采购合同节点进度</strong>
                <span>{selectedPlan.nodes.length} 个节点</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>节点</th>
                    <th>预计</th>
                    <th>提醒</th>
                    <th>实际</th>
                    <th>状态</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.nodes.map((node) => (
                    <tr key={node.id}>
                      <td>{node.node_name}</td>
                      <td>{formatDate(node.planned_date)}</td>
                      <td>{formatDate(node.remind_date)}</td>
                      <td>{node.actual_date ? formatDate(node.actual_date) : '待回写'}</td>
                      <td>{followupNodeStatusLabel(node.status)}</td>
                      <td>{followupSourceTypeLabel(node.source_record_type)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>逾期节点预警</strong>
                <span>{overdueNodes.length} 条</span>
              </div>
              <form className="inline-filters inline-search" onSubmit={scanFollowupOverdueNodes}>
                <label>
                  扫描日期
                  <Input
                    type="date"
                    value={overdueAsOf}
                    onChange={(event) => setOverdueAsOf(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />} loading={submitting}>
                  扫描
                </Button>
              </form>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>采购合同</th>
                    <th>供应商</th>
                    <th>节点</th>
                    <th>预计</th>
                    <th>逾期</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueNodes.map((node) => (
                    <tr key={node.id}>
                      <td>{node.purchase_contract_no}</td>
                      <td>{node.supplier_name}</td>
                      <td>{node.node_name}</td>
                      <td>{formatDate(node.planned_date)}</td>
                      <td>{node.overdue_days} 天</td>
                    </tr>
                  ))}
                  {overdueNodes.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>暂无逾期节点</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <ClipboardCheck size={28} />
              <strong>暂无采购跟单计划</strong>
              <span>请返回列表选择跟单计划查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

