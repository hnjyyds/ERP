import {
  Alert,
  Button,
  Descriptions as _Descriptions,
  Input,
  Modal,
  Segmented,
  Table,
  Tag as _Tag,
} from 'antd'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Plus as _Plus,
  Search,
  ClipboardCheck,
  RefreshCw,
  Settings,
} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createFollowupTemplate,
  generateFollowupPlanFromPurchaseContract,
  listFollowupOverdueNodes,
  listFollowupPlans,
  listFollowupTemplates,
  syncFollowupSampleEvents,
  syncFollowupSourceEvent,
  updateFollowupTemplate,
  type FollowProcessTemplate,
  type FollowProcessTemplateNodePayload,
  type FollowProcessTemplatePayload,
  type FollowSourceEventPayload,
  type PurchaseFollowOverdueNode,
  type PurchaseFollowNode,
  type PurchaseFollowPlan,
  type PurchaseFollowPlanGeneratePayload,
} from '@/api'
import {
  followupPath,
  moduleDetailPath,
  purchaseContractPath,
  qualityInspectionPath,
  warehouseInboundOrderPath,
  warehouseOutboundOrderPath,
} from '@/app/routes'
import { FormSelect, ListPageShell, Metric, PanelTitle } from '@/shared/ui'
import { showError } from '@/shared/errors'
import {
  followupStatusOptions,
  followupNodeOptions,
  followupSourceTypeOptions,
  followupNodeLabelKeys,
} from '@/shared/formOptions'
import {
  formatDate,
  nullableText as _nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

function followupNodeLabel(value: string, fallback = value): string {
  const key = followupNodeLabelKeys[value]
  return key ? t(key) : fallback
}

function followupSourceTypeLabel(value: string | null): string {
  if (!value) return t('purchase.followup.detail.notWritten')
  if (value === 'purchase_contract') return t('purchase.followup.field.purchaseContract')
  const option = followupSourceTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
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
    <div className="form-pair two">
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
          onChange={(event) =>
            setTemplateForm({ ...templateForm, [remindKey]: event.target.value })
          }
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
    name: '',
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
    as_of: todayInputValue(),
  }
}

function initialFollowupSourceEventForm(): FollowupSourceEventFormState {
  return {
    purchase_contract_id: '',
    node_code: 'quality_inspection',
    source_record_type: 'quality_inspection',
    source_record_id: '',
    actual_date: todayInputValue(),
    source_summary: '',
  }
}

function initialNodeCompletionForm(): FollowupSourceEventFormState {
  return {
    purchase_contract_id: '',
    node_code: '',
    source_record_type: 'sample_followup_event',
    source_record_id: '',
    actual_date: todayInputValue(),
    source_summary: '',
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
    source_summary: t('purchase.followup.message.summaryCompleted', {
      name: followupNodeLabel(firstPending.node_code, firstPending.node_name),
    }),
  }
}

function followupTemplatePayload(form: FollowupTemplateFormState): FollowProcessTemplatePayload {
  return {
    name: form.name.trim(),
    enabled: form.enabled,
    is_default: form.is_default,
    nodes: [
      followupNodePayload(
        'contract_confirmed',
        followupNodeLabel('contract_confirmed'),
        10,
        'purchase_contract',
        form.contract_days,
        form.contract_remind,
      ),
      followupNodePayload(
        'confirm_sample_submitted',
        followupNodeLabel('confirm_sample_submitted'),
        20,
        'sample_confirm',
        form.confirm_days,
        form.confirm_remind,
      ),
      followupNodePayload(
        'bulk_sample_submitted',
        followupNodeLabel('bulk_sample_submitted'),
        30,
        'sample_bulk',
        form.bulk_days,
        form.bulk_remind,
      ),
      followupNodePayload(
        'quality_inspection',
        followupNodeLabel('quality_inspection'),
        40,
        'qc',
        form.qc_days,
        form.qc_remind,
      ),
      followupNodePayload(
        'inbound_completed',
        followupNodeLabel('inbound_completed'),
        50,
        'inbound',
        form.inbound_days,
        form.inbound_remind,
      ),
      followupNodePayload(
        'outbound_completed',
        followupNodeLabel('outbound_completed'),
        60,
        'outbound',
        form.outbound_days,
        form.outbound_remind,
      ),
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
  const option = followupStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function followupNodeStatusLabel(value: string): string {
  if (value === 'pending') return t('purchase.followup.detail.nodeStatusPending')
  if (value === 'in_progress') return t('purchase.followup.status.inProgress')
  if (value === 'completed') return t('purchase.followup.status.completed')
  if (value === 'overdue') return t('purchase.followup.status.overdue')
  return value
}

function followupSourceTypeForNode(nodeCode: string): string {
  if (nodeCode === 'confirm_sample_submitted' || nodeCode === 'bulk_sample_submitted') {
    return 'sample_followup_event'
  }
  return 'quality_inspection'
}

function isSampleSubmissionNode(node: PurchaseFollowNode): boolean {
  return (
    node.node_code === 'confirm_sample_submitted' ||
    node.node_code === 'bulk_sample_submitted'
  )
}

function followupNodeBusinessPath(
  plan: PurchaseFollowPlan,
  node: PurchaseFollowNode,
): string | null {
  if (node.status === 'completed' && node.source_record_id) {
    const completedSourcePaths: Record<string, string> = {
      purchase_contract: purchaseContractPath,
      quality_inspection: qualityInspectionPath,
      inventory_inbound: warehouseInboundOrderPath,
      inventory_outbound: warehouseOutboundOrderPath,
    }
    const rootPath = completedSourcePaths[node.source_record_type ?? '']
    return rootPath ? moduleDetailPath(rootPath, node.source_record_id) : null
  }

  if (node.node_code === 'contract_confirmed') {
    return moduleDetailPath(purchaseContractPath, plan.purchase_contract_id)
  }
  if (node.node_code === 'quality_inspection') return qualityInspectionPath
  if (node.node_code === 'inbound_completed') return warehouseInboundOrderPath
  if (node.node_code === 'outbound_completed') return warehouseOutboundOrderPath
  return null
}

function followupNodeActionLabel(node: PurchaseFollowNode): string {
  if (node.status === 'completed') return t('purchase.followup.action.viewSource')
  if (isSampleSubmissionNode(node)) return t('purchase.followup.action.registerSubmit')
  if (node.node_code === 'contract_confirmed') return t('purchase.followup.action.viewContract')
  if (node.node_code === 'quality_inspection') return t('purchase.followup.action.enterQc')
  if (node.node_code === 'inbound_completed') return t('purchase.followup.action.enterInbound')
  if (node.node_code === 'outbound_completed') return t('purchase.followup.action.enterOutbound')
  return t('purchase.followup.action.handle')
}

export function FollowupPage({
  detailId,
  targetNodeId = null,
  onNavigate,
}: RoutedDetailPageProps & { targetNodeId?: string | null }) {
  const [templates, setTemplates] = useState<FollowProcessTemplate[]>([])
  const [plans, setPlans] = useState<PurchaseFollowPlan[]>([])
  const [overdueNodes, setOverdueNodes] = useState<PurchaseFollowOverdueNode[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [overdueAsOf, setOverdueAsOf] = useState(() => todayInputValue())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [followupModalOpen, setFollowupModalOpen] = useState(false)
  const [nodeActionNode, setNodeActionNode] = useState<PurchaseFollowNode | null>(null)
  const [templateForm, setTemplateForm] = useState<FollowupTemplateFormState>(() =>
    initialFollowupTemplateForm(),
  )
  const [planForm, setPlanForm] = useState<FollowupPlanFormState>(() => initialFollowupPlanForm())
  const [sourceEventForm, setSourceEventForm] = useState<FollowupSourceEventFormState>(() =>
    initialFollowupSourceEventForm(),
  )
  const [nodeCompletionForm, setNodeCompletionForm] = useState<FollowupSourceEventFormState>(() =>
    initialNodeCompletionForm(),
  )

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? templates[0] ?? null,
    [templates, selectedTemplateId],
  )
  const selectedPlan = useMemo(() => {
    if (detailId) return plans.find((item) => item.id === detailId) ?? null
    return plans.find((item) => item.id === selectedPlanId) ?? plans[0] ?? null
  }, [detailId, plans, selectedPlanId])

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

  useEffect(() => {
    if (!targetNodeId || !selectedPlan?.nodes.some((node) => node.id === targetNodeId)) return
    document
      .getElementById(`followup-node-${targetNodeId}`)
      ?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  }, [selectedPlan, targetNodeId])

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
        (templateResult.items.some((item) => item.id === selectedTemplateId)
          ? selectedTemplateId
          : null) ??
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
      showError(caught, t('purchase.followup.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function saveFollowupTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const payload = followupTemplatePayload(templateForm)
      const template = selectedTemplate
        ? await updateFollowupTemplate(selectedTemplate.id, payload)
        : await createFollowupTemplate(payload)
      setMessage(t('purchase.followup.message.templateSaved', { name: template.name }))
      setFollowupModalOpen(false)
      await loadFollowupWorkspace(selectedPlan?.id, template.id)
    } catch (caught) {
      showError(caught, t('purchase.followup.message.templateSaveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function generateFollowupPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const plan = await generateFollowupPlanFromPurchaseContract(
        followupPlanGeneratePayload(planForm),
      )
      setContractFilter(plan.purchase_contract_id)
      setSelectedPlanId(plan.id)
      setFollowupModalOpen(false)
      await loadFollowupWorkspace(plan.id)
      setMessage(t('purchase.followup.message.planGenerated', { no: plan.purchase_contract_no }))
    } catch (caught) {
      showError(caught, t('purchase.followup.message.planGenerateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function syncSelectedFollowupSampleEvents() {
    if (!selectedPlan) return
    setSubmitting(true)
    setMessage('')
    try {
      const synced = await syncFollowupSampleEvents({
        purchase_contract_id: selectedPlan.purchase_contract_id,
        as_of: selectedPlan.base_date,
      })
      await loadFollowupWorkspace(synced.id)
      setMessage(
        t('purchase.followup.message.sampleSynced', { no: synced.purchase_contract_no }),
      )
    } catch (caught) {
      showError(caught, t('purchase.followup.message.sampleSyncFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function syncFollowupSourceEventFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const nodeLabel = followupNodeLabel(sourceEventForm.node_code)
      const plan = await syncFollowupSourceEvent(followupSourceEventPayload(sourceEventForm))
      setFollowupModalOpen(false)
      await loadFollowupWorkspace(plan.id)
      setMessage(t('purchase.followup.message.sourceSynced', { name: nodeLabel }))
    } catch (caught) {
      showError(caught, t('purchase.followup.message.sourceSyncFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openNodeCompletion(node: PurchaseFollowNode) {
    if (!selectedPlan) return
    setNodeCompletionForm({
      purchase_contract_id: selectedPlan.purchase_contract_id,
      node_code: node.node_code,
      source_record_type: followupSourceTypeForNode(node.node_code),
      source_record_id: '',
      actual_date: todayInputValue(),
      source_summary: '',
    })
    setNodeActionNode(node)
  }

  async function completeNodeFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!nodeActionNode || !selectedPlan) return
    setSubmitting(true)
    setMessage('')
    try {
      const plan = await syncFollowupSourceEvent(followupSourceEventPayload(nodeCompletionForm))
      const completedNodeName = followupNodeLabel(
        nodeActionNode.node_code,
        nodeActionNode.node_name,
      )
      setNodeActionNode(null)
      await loadFollowupWorkspace(plan.id)
      setMessage(t('purchase.followup.message.nodeCompleted', { name: completedNodeName }))
    } catch (caught) {
      showError(
        caught,
        t('purchase.followup.message.nodeCompleteFailed', {
          name: followupNodeLabel(nodeActionNode.node_code, nodeActionNode.node_name),
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function scanFollowupOverdueNodes(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const overdue = await listFollowupOverdueNodes(overdueAsOf)
      setOverdueNodes(overdue.items)
      setMessage(t('purchase.followup.message.overdueFound', { count: overdue.total }))
    } catch (caught) {
      showError(caught, t('purchase.followup.message.overdueScanFailed'))
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
      <div
        className="summary-strip"
        aria-label={t('purchase.followup.metric.overviewAria')}
      >
        <Metric label={t('purchase.followup.metric.planCount')} value={plans.length} />
        <Metric label={t('purchase.followup.metric.completedPlans')} value={completedPlans} />
        <Metric
          label={t('purchase.followup.metric.overduePlans')}
          value={overduePlans}
          intent={overduePlans > 0 ? 'warning' : 'normal'}
        />
        <Metric
          label={t('purchase.followup.metric.completedNodes')}
          value={`${completedNodes}/${totalNodes}`}
        />
        <Metric
          label={t('purchase.followup.metric.overdueNodes')}
          value={overdueNodes.length}
          intent={overdueNodes.length > 0 ? 'danger' : 'normal'}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid followup-grid">
        {!detailId ? (
          <ListPageShell
            className="product-list-panel"
            icon={<Search size={18} />}
            title={t('purchase.followup.list.title')}
            toolbar={<form
              className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadFollowupWorkspace()
                }}
              >
                <label>
                  {t('purchase.followup.list.searchLabel')}
                  <Input
                    value={search}
                    placeholder={t('purchase.followup.list.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('purchase.followup.list.statusFilter')}
                  <FormSelect
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('purchase.followup.list.allStatuses')}</option>
                    {followupStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('purchase.followup.list.supplierFilter')}
                  <Input
                    value={supplierFilter}
                    placeholder={t('purchase.followup.list.supplierFilterPlaceholder')}
                    onChange={(event) => setSupplierFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('purchase.followup.list.contractFilter')}
                  <Input
                    value={contractFilter}
                    placeholder={t('purchase.followup.list.contractFilterPlaceholder')}
                    onChange={(event) => setContractFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('purchase.followup.list.query')}
                </Button>
                <Button
                  htmlType="button"
                  icon={<Settings size={16} />}
                  onClick={() => setFollowupModalOpen(true)}
                >
                  {t('purchase.followup.list.configureGenerate')}
                </Button>
              </form>}
            >

            <Table<PurchaseFollowPlan>
              columns={[
                {
                  title: t('purchase.followup.field.purchaseContract'),
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
                {
                  title: t('purchase.followup.field.status'),
                  dataIndex: 'overall_status',
                  render: followupPlanStatusLabel,
                },
                { title: t('purchase.followup.field.supplier'), dataIndex: 'supplier_name' },
                {
                  title: t('purchase.followup.field.baseDay'),
                  dataIndex: 'base_date',
                  render: formatDate,
                },
                {
                  title: t('purchase.followup.field.nodes'),
                  dataIndex: 'nodes',
                  render: (_, plan) =>
                    `${plan.nodes.filter((node) => node.status === 'completed').length}/${plan.nodes.length}`,
                },
                {
                  title: t('purchase.followup.field.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: PurchaseFollowPlan) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenFollowupDetail(event, record)}
                    >
                      {t('purchase.followup.action.viewDetail')}
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
          </ListPageShell>
        ) : null}

        <Modal
          centered
          footer={null}
          open={followupModalOpen}
          title={t('purchase.followup.form.modalTitle')}
          width={1040}
          onCancel={() => setFollowupModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
            <PanelTitle
              icon={<LayoutDashboard size={18} />}
              title={t('purchase.followup.form.templateTitle')}
            />
            <form className="record-form" onSubmit={saveFollowupTemplate}>
              <div className="form-pair two">
                <label htmlFor="followup-template-name">
                  {t('purchase.followup.field.templateName')}
                  <Input
                    id="followup-template-name"
                    required
                    value={templateForm.name}
                    onChange={(event) =>
                      setTemplateForm({ ...templateForm, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t('purchase.followup.field.defaultTemplate')}
                  <Segmented
                    aria-label={t('purchase.followup.field.defaultTemplate')}
                    className="boolean-segmented"
                    options={[
                      { label: t('purchase.followup.form.yes'), value: 'true' },
                      { label: t('purchase.followup.form.no'), value: 'false' },
                    ]}
                    value={String(templateForm.is_default)}
                    onChange={(value) =>
                      setTemplateForm({ ...templateForm, is_default: value === 'true' })
                    }
                  />
                </label>
                <label className="checkbox-label" htmlFor="followup-template-enabled">
                  <input
                    aria-label={t('purchase.followup.form.enabled')}
                    checked={templateForm.enabled}
                    id="followup-template-enabled"
                    type="checkbox"
                    onChange={(event) =>
                      setTemplateForm({ ...templateForm, enabled: event.target.checked })
                    }
                  />
                  {t('purchase.followup.form.enabled')}
                </label>
              </div>

              <div className="form-divider">{t('purchase.followup.form.nodeDaysDivider')}</div>
              <FollowupTemplateNodeFields
                daysKey="contract_days"
                label={t('purchase.followup.node.contractConfirmed')}
                remindKey="contract_remind"
                remindLabel={t('purchase.followup.form.contractRemind')}
                setTemplateForm={setTemplateForm}
                templateForm={templateForm}
              />
              <FollowupTemplateNodeFields
                daysKey="confirm_days"
                label={t('purchase.followup.node.confirmSampleSubmitted')}
                remindKey="confirm_remind"
                remindLabel={t('purchase.followup.form.confirmRemind')}
                setTemplateForm={setTemplateForm}
                templateForm={templateForm}
              />
              <FollowupTemplateNodeFields
                daysKey="bulk_days"
                label={t('purchase.followup.node.bulkSampleSubmitted')}
                remindKey="bulk_remind"
                remindLabel={t('purchase.followup.form.bulkRemind')}
                setTemplateForm={setTemplateForm}
                templateForm={templateForm}
              />
              <FollowupTemplateNodeFields
                daysKey="qc_days"
                label={t('purchase.followup.node.qualityInspection')}
                remindKey="qc_remind"
                remindLabel={t('purchase.followup.form.qcRemind')}
                setTemplateForm={setTemplateForm}
                templateForm={templateForm}
              />
              <FollowupTemplateNodeFields
                daysKey="inbound_days"
                label={t('purchase.followup.node.inboundCompleted')}
                remindKey="inbound_remind"
                remindLabel={t('purchase.followup.form.inboundRemind')}
                setTemplateForm={setTemplateForm}
                templateForm={templateForm}
              />
              <FollowupTemplateNodeFields
                daysKey="outbound_days"
                label={t('purchase.followup.node.outboundCompleted')}
                remindKey="outbound_remind"
                remindLabel={t('purchase.followup.form.outboundRemind')}
                setTemplateForm={setTemplateForm}
                templateForm={templateForm}
              />
              <Button htmlType="submit" loading={submitting} type="primary">
                {t('purchase.followup.action.saveTemplate')}
              </Button>
            </form>

            <form
              className="record-form accessory-form generation-form"
              onSubmit={generateFollowupPlan}
            >
              <div className="form-divider">{t('purchase.followup.form.generateDivider')}</div>
              <label htmlFor="followup-contract-id">
                {t('purchase.followup.field.purchaseContractId')}
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
                {t('purchase.followup.field.baseDate')}
                <Input
                  id="followup-base-date"
                  type="date"
                  value={planForm.as_of}
                  onChange={(event) => setPlanForm({ ...planForm, as_of: event.target.value })}
                />
              </label>
              <Button htmlType="submit" loading={submitting}>
                {t('purchase.followup.action.generatePlan')}
              </Button>
            </form>

            <form
              className="record-form accessory-form generation-form"
              onSubmit={syncFollowupSourceEventFromForm}
            >
              <div className="form-divider">{t('purchase.followup.form.sourceDivider')}</div>
              <label htmlFor="followup-source-contract-id">
                {t('purchase.followup.field.purchaseContractId')}
                <Input
                  id="followup-source-contract-id"
                  required
                  value={sourceEventForm.purchase_contract_id}
                  onChange={(event) =>
                    setSourceEventForm({
                      ...sourceEventForm,
                      purchase_contract_id: event.target.value,
                    })
                  }
                />
              </label>
              <div className="form-pair two">
                <label>
                  {t('purchase.followup.field.node')}
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
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('purchase.followup.field.sourceType')}
                  <FormSelect
                    value={sourceEventForm.source_record_type}
                    onChange={(event) =>
                      setSourceEventForm({
                        ...sourceEventForm,
                        source_record_type: event.target.value,
                      })
                    }
                  >
                    {followupSourceTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
              </div>
              <div className="form-pair two">
                <label htmlFor="followup-source-id">
                  {t('purchase.followup.field.sourceRecordId')}
                  <Input
                    id="followup-source-id"
                    required
                    value={sourceEventForm.source_record_id}
                    onChange={(event) =>
                      setSourceEventForm({
                        ...sourceEventForm,
                        source_record_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label htmlFor="followup-actual-date">
                  {t('purchase.followup.field.actualDate')}
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
                {t('purchase.followup.field.sourceSummary')}
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
                {t('purchase.followup.action.syncSource')}
              </Button>
            </form>
          </div>
        </Modal>

        <Modal
          centered
          footer={null}
          open={Boolean(nodeActionNode)}
          title={
            nodeActionNode
              ? t('purchase.followup.form.registerTitle', {
                  name: followupNodeLabel(nodeActionNode.node_code, nodeActionNode.node_name),
                })
              : t('purchase.followup.form.registerFallbackTitle')
          }
          width={600}
          onCancel={() => setNodeActionNode(null)}
        >
          {nodeActionNode && selectedPlan ? (
            <form className="record-form followup-node-completion-form" onSubmit={completeNodeFromForm}>
              <Alert
                description={t('purchase.followup.form.registerHint', {
                  name: followupNodeLabel(nodeActionNode.node_code, nodeActionNode.node_name),
                })}
                title={`${selectedPlan.purchase_contract_no} · ${selectedPlan.supplier_name}`}
                type="info"
                showIcon
              />
              <div className="form-pair two">
                <label htmlFor="followup-node-actual-date">
                  {t('purchase.followup.field.actualCompletionDate')}
                  <Input
                    id="followup-node-actual-date"
                    required
                    type="date"
                    value={nodeCompletionForm.actual_date}
                    onChange={(event) =>
                      setNodeCompletionForm({
                        ...nodeCompletionForm,
                        actual_date: event.target.value,
                      })
                    }
                  />
                </label>
                <label htmlFor="followup-node-source-id">
                  {t('purchase.followup.field.businessRecordNo')}
                  <Input
                    id="followup-node-source-id"
                    maxLength={36}
                    placeholder={t('purchase.followup.form.businessRecordNoPlaceholder')}
                    required
                    value={nodeCompletionForm.source_record_id}
                    onChange={(event) =>
                      setNodeCompletionForm({
                        ...nodeCompletionForm,
                        source_record_id: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label htmlFor="followup-node-summary">
                {t('purchase.followup.field.handleNote')}
                <Input.TextArea
                  id="followup-node-summary"
                  maxLength={240}
                  placeholder={t('purchase.followup.form.handleNotePlaceholder')}
                  required
                  rows={3}
                  value={nodeCompletionForm.source_summary}
                  onChange={(event) =>
                    setNodeCompletionForm({
                      ...nodeCompletionForm,
                      source_summary: event.target.value,
                    })
                  }
                />
              </label>
              <div className="modal-actions split">
                <Button htmlType="button" onClick={() => setNodeActionNode(null)}>
                  {t('common.cancel')}
                </Button>
                <Button htmlType="submit" loading={submitting} type="primary">
                  {t('purchase.followup.action.saveAndCompleteNode')}
                </Button>
              </div>
            </form>
          ) : null}
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('purchase.followup.detail.title')}
              />
              <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(followupPath)}>
                {t('purchase.followup.action.backToList')}
              </Button>
            </div>
            {selectedPlan ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('purchase.followup.detail.overallStatus')}</dt>
                    <dd>{followupPlanStatusLabel(selectedPlan.overall_status)}</dd>
                  </div>
                  <div>
                    <dt>{t('purchase.followup.field.supplier')}</dt>
                    <dd>{selectedPlan.supplier_name}</dd>
                  </div>
                  <div>
                    <dt>{t('purchase.followup.field.baseDate')}</dt>
                    <dd>{formatDate(selectedPlan.base_date)}</dd>
                  </div>
                  <div>
                    <dt>{t('purchase.followup.field.purchaseContractId')}</dt>
                    <dd>{selectedPlan.purchase_contract_id}</dd>
                  </div>
                </dl>

                <div className="delivery-action-row">
                  <Button
                    icon={<RefreshCw size={16} />}
                    loading={submitting}
                    onClick={() => void syncSelectedFollowupSampleEvents()}
                  >
                    {t('purchase.followup.action.syncSampleEvents')}
                  </Button>
                  <Button
                    icon={<Search size={16} />}
                    loading={submitting}
                    onClick={() => void scanFollowupOverdueNodes()}
                  >
                    {t('purchase.followup.action.scanOverdue')}
                  </Button>
                </div>

                <div className="accessory-heading">
                  <strong>{t('purchase.followup.detail.nodesTitle')}</strong>
                  <span>
                    {targetNodeId && selectedPlan.nodes.some((node) => node.id === targetNodeId)
                      ? t('purchase.followup.detail.located', {
                          name: (() => {
                            const targetNode = selectedPlan.nodes.find(
                              (node) => node.id === targetNodeId,
                            )
                            return targetNode
                              ? followupNodeLabel(targetNode.node_code, targetNode.node_name)
                              : ''
                          })(),
                        })
                      : t('purchase.followup.detail.nodeCount', {
                          count: selectedPlan.nodes.length,
                        })}
                  </span>
                </div>
                <table className="data-table compact-table followup-node-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.followup.field.node')}</th>
                      <th>{t('purchase.followup.field.planned')}</th>
                      <th>{t('purchase.followup.field.remind')}</th>
                      <th>{t('purchase.followup.field.actual')}</th>
                      <th>{t('purchase.followup.field.status')}</th>
                      <th>{t('purchase.followup.field.source')}</th>
                      <th>{t('purchase.followup.field.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlan.nodes.map((node) => {
                      const targetPath = followupNodeBusinessPath(selectedPlan, node)
                      const canCompleteHere =
                        node.status !== 'completed' && isSampleSubmissionNode(node)
                      const isTargetNode = node.id === targetNodeId

                      return (
                        <tr
                          aria-current={isTargetNode ? 'step' : undefined}
                          className={isTargetNode ? 'followup-node-target' : undefined}
                          id={`followup-node-${node.id}`}
                          key={node.id}
                        >
                          <td>
                            <strong>{followupNodeLabel(node.node_code, node.node_name)}</strong>
                            {isTargetNode ? (
                              <span className="followup-node-focus-label">
                                {t('purchase.followup.detail.currentTodo')}
                              </span>
                            ) : null}
                          </td>
                          <td>{formatDate(node.planned_date)}</td>
                          <td>{formatDate(node.remind_date)}</td>
                          <td>
                            {node.actual_date
                              ? formatDate(node.actual_date)
                              : t('purchase.followup.detail.pendingWriteBack')}
                          </td>
                          <td>{followupNodeStatusLabel(node.status)}</td>
                          <td>
                            <span>{followupSourceTypeLabel(node.source_record_type)}</span>
                            {node.source_summary ? (
                              <small className="followup-source-summary" title={node.source_summary}>
                                {node.source_summary}
                              </small>
                            ) : null}
                          </td>
                          <td className="followup-node-action-cell">
                            {canCompleteHere ? (
                              <Button
                                icon={<CheckCircle2 size={15} />}
                                size="small"
                                type={isTargetNode ? 'primary' : 'default'}
                                onClick={() => openNodeCompletion(node)}
                              >
                                {followupNodeActionLabel(node)}
                              </Button>
                            ) : targetPath ? (
                              <Button
                                icon={<ArrowRight size={15} />}
                                size="small"
                                onClick={() => onNavigate(targetPath)}
                              >
                                {followupNodeActionLabel(node)}
                              </Button>
                            ) : node.status === 'completed' ? (
                              <span className="followup-node-completed">
                                <CheckCircle2 size={15} />
                                {t('purchase.followup.status.completed')}
                              </span>
                            ) : (
                              <span className="followup-node-waiting">
                                {t('purchase.followup.detail.waitingPrevious')}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('purchase.followup.detail.overdueTitle')}</strong>
                  <span>
                    {t('purchase.followup.detail.overdueCount', { count: overdueNodes.length })}
                  </span>
                </div>
                <form className="inline-filters inline-search" onSubmit={scanFollowupOverdueNodes}>
                  <label>
                    {t('purchase.followup.detail.asOf')}
                    <Input
                      type="date"
                      value={overdueAsOf}
                      onChange={(event) => setOverdueAsOf(event.target.value)}
                    />
                  </label>
                  <Button htmlType="submit" icon={<Search size={16} />} loading={submitting}>
                    {t('purchase.followup.list.query')}
                  </Button>
                </form>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.followup.field.purchaseContract')}</th>
                      <th>{t('purchase.followup.field.supplier')}</th>
                      <th>{t('purchase.followup.field.node')}</th>
                      <th>{t('purchase.followup.field.planned')}</th>
                      <th>{t('purchase.followup.field.overdueDays')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueNodes.map((node) => (
                      <tr key={node.id}>
                        <td>{node.purchase_contract_no}</td>
                        <td>{node.supplier_name}</td>
                        <td>{followupNodeLabel(node.node_code, node.node_name)}</td>
                        <td>{formatDate(node.planned_date)}</td>
                        <td>
                          {t('purchase.followup.detail.overdueDaysValue', {
                            count: node.overdue_days,
                          })}
                        </td>
                      </tr>
                    ))}
                    {overdueNodes.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={5}>
                          {t('purchase.followup.detail.noOverdue')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <ClipboardCheck size={28} />
                <strong>{t('purchase.followup.detail.emptyTitle')}</strong>
                <span>{t('purchase.followup.detail.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
