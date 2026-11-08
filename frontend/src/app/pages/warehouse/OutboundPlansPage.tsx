import { Alert, Button, Input, Modal, Skeleton as _Skeleton, Table, Tag as _Tag } from 'antd'
import {
  ArrowLeft,
  LayoutDashboard,
  Plus,
  Search,
  Warehouse,
  PackagePlus,
  Save,
  Send,
} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  generateOutboundPlanFromShipment,
  listOutboundPlans,
  scheduleOutboundPlan,
  type OutboundPlan,
  type OutboundPlanGeneratePayload,
  type OutboundPlanSchedulePayload,
  ShipmentPlan,
  listShipments,
} from '../../../api'
import { warehouseOutboundPlanPath, moduleDetailPath } from '../../routes'
import { FormSelect, ListPageShell, Metric, PanelTitle } from '../../../shared/ui'
import { useFormModal } from '../../../shared/useFormModal'
import { showError } from '../../../shared/errors'
import {
  outboundPlanStatusOptions,
  outboundPlanTypeOptions,
  outboundPlanSourceTypeOptions,
} from '../../../shared/formOptions'
import {
  daysFromTodayInputValue,
  formatDate,
  formatMoney as _formatMoney,
  formatQuantity as _formatQuantity,
  nullableText,
  todayInputValue as _todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
  trimDecimal,
} from '../appHelpers'
import { t } from '../../appI18n'

type OutboundPlanGenerateFormState = {
  shipment_plan_id: string
  outbound_type: string
  planned_date: string
}

type OutboundPlanScheduleFormState = {
  planned_date: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

type _OutboundOrderFormState = {
  plan_id: string
  code: string
  outbound_mode: string
  outbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  exception_reason: string
}

type _OutboundOrderApprovalFormState = {
  reviewer_name: string
  approved_at: string
  allow_negative: boolean
}

function initialOutboundPlanGenerateForm(): OutboundPlanGenerateFormState {
  return {
    shipment_plan_id: '',
    outbound_type: 'finished_goods_outbound',
    planned_date: '',
  }
}

function initialOutboundPlanScheduleForm(): OutboundPlanScheduleFormState {
  return {
    planned_date: daysFromTodayInputValue(7),
    warehouse_id: '',
    warehouse_name: '',
    location_id: '',
    location_name: '',
    operator_name: '',
  }
}

function outboundPlanGenerateFormForShipment(
  shipment: ShipmentPlan,
  current: OutboundPlanGenerateFormState,
): OutboundPlanGenerateFormState {
  return {
    ...current,
    shipment_plan_id: shipment.id,
    planned_date: shipment.planned_ship_date,
  }
}

function outboundPlanToScheduleForm(plan: OutboundPlan): OutboundPlanScheduleFormState {
  return {
    planned_date: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? '',
    warehouse_name: plan.warehouse_name ?? '',
    location_id: plan.location_id ?? '',
    location_name: plan.location_name ?? '',
    operator_name: plan.operator_name ?? '',
  }
}

function outboundPlanGeneratePayload(
  form: OutboundPlanGenerateFormState,
): OutboundPlanGeneratePayload {
  return {
    shipment_plan_id: form.shipment_plan_id.trim(),
    outbound_type: form.outbound_type,
    planned_date: emptyToNull(form.planned_date),
  }
}

function outboundPlanSchedulePayload(
  form: OutboundPlanScheduleFormState,
): OutboundPlanSchedulePayload {
  return {
    planned_date: form.planned_date,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    operator_name: form.operator_name.trim(),
  }
}

function outboundPlanStatusLabel(value: string): string {
  const option = outboundPlanStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function outboundPlanTypeLabel(value: string): string {
  const option = outboundPlanTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function outboundPlanSourceTypeLabel(value: string): string {
  const option = outboundPlanSourceTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function outboundPlanLineStatusLabel(value: string): string {
  if (value === 'pending') return t('warehouse.outboundPlan.detail.lineStatusPending')
  if (value === 'partial') return t('warehouse.outboundPlan.detail.lineStatusPartial')
  if (value === 'completed') return t('warehouse.outboundPlan.detail.lineStatusCompleted')
  if (value === 'cancelled') return t('warehouse.outboundPlan.detail.lineStatusCancelled')
  return value
}

function outboundPlanTotalQuantity(plan: OutboundPlan): number {
  return plan.lines.reduce((sum, line) => sum + Number(line.planned_quantity || 0), 0)
}

export function OutboundPlansPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [plans, setPlans] = useState<OutboundPlan[]>([])
  const [shipments, setShipments] = useState<ShipmentPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [sourceIdFilter, setSourceIdFilter] = useState('')
  const {
    open: outboundPlanModalOpen,
    form: generateForm,
    setForm: setGenerateForm,
    submitting: generating,
    openWith: openGenerateForm,
    close: closeGenerateForm,
    runSubmit: runGenerateSubmit,
  } = useFormModal(initialOutboundPlanGenerateForm)
  const {
    form: scheduleForm,
    setForm: setScheduleForm,
    submitting: scheduling,
    openWith: openScheduleForm,
    close: closeScheduleForm,
    runSubmit: runScheduleSubmit,
  } = useFormModal(initialOutboundPlanScheduleForm)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const selectedPlan = useMemo(() => {
    if (detailId) return plans.find((item) => item.id === detailId) ?? null
    return plans.find((item) => item.id === selectedPlanId) ?? plans[0] ?? null
  }, [detailId, plans, selectedPlanId])

  useEffect(() => {
    void loadOutboundPlans()
  }, [])

  useEffect(() => {
    if (!selectedPlan) return
    setGenerateForm((current) => ({
      ...current,
      shipment_plan_id:
        selectedPlan.source_type === 'shipment_plan'
          ? selectedPlan.source_id
          : current.shipment_plan_id,
      outbound_type: selectedPlan.outbound_type,
      planned_date: selectedPlan.planned_date,
    }))
    setScheduleForm(outboundPlanToScheduleForm(selectedPlan))
  }, [selectedPlan?.id])

  useEffect(() => {
    if (detailId && plans.length > 0 && !plans.some((item) => item.id === detailId)) {
      onNavigate(warehouseOutboundPlanPath)
    }
  }, [detailId, onNavigate, plans])

  async function loadOutboundPlans(preferredPlanId?: string, preferredPlan?: OutboundPlan) {
    setLoading(true)
    try {
      const [planResult, shipmentOptions] = await Promise.all([
        listOutboundPlans({
          q: preferredPlan?.code ?? (search.trim() || undefined),
          status: statusFilter || undefined,
          outbound_type: typeFilter || undefined,
          source_type: sourceFilter || undefined,
          customer_id: customerFilter.trim() || undefined,
          source_id: sourceIdFilter.trim() || undefined,
        }),
        loadOutboundShipmentOptions(),
      ])
      const nextPlans = preferredPlan
        ? [preferredPlan, ...planResult.items.filter((item) => item.id !== preferredPlan.id)]
        : planResult.items
      const nextPlanId =
        preferredPlanId ??
        (nextPlans.some((item) => item.id === selectedPlanId) ? selectedPlanId : null) ??
        nextPlans[0]?.id ??
        null
      setPlans(nextPlans)
      setShipments(shipmentOptions)
      setSelectedPlanId(nextPlanId)
      if (!nextPlanId && shipmentOptions[0]) {
        setGenerateForm((current) =>
          outboundPlanGenerateFormForShipment(shipmentOptions[0], current),
        )
      }
    } catch (caught) {
      showError(caught, t('warehouse.outboundPlan.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadOutboundShipmentOptions(): Promise<ShipmentPlan[]> {
    const [approvedShipments, recentShipments] = await Promise.all([
      listShipments({ approval_status: 'approved' }),
      listShipments({}),
    ])
    const shipmentById = new Map<string, ShipmentPlan>()
    for (const shipment of [...approvedShipments.items, ...recentShipments.items]) {
      if (shipment.approval_status === 'approved') shipmentById.set(shipment.id, shipment)
    }
    return [...shipmentById.values()]
  }

  function handleOutboundShipmentChange(shipmentId: string) {
    const shipment = shipments.find((item) => item.id === shipmentId)
    setGenerateForm((current) =>
      shipment
        ? outboundPlanGenerateFormForShipment(shipment, current)
        : { ...current, shipment_plan_id: shipmentId },
    )
  }

  function upsertOutboundPlan(plan: OutboundPlan) {
    setPlans((current) => {
      const exists = current.some((item) => item.id === plan.id)
      return exists
        ? current.map((item) => (item.id === plan.id ? plan : item))
        : [plan, ...current]
    })
    setSelectedPlanId(plan.id)
  }

  function openOutboundPlanDetail(plan: OutboundPlan) {
    setSelectedPlanId(plan.id)
    onNavigate(moduleDetailPath(warehouseOutboundPlanPath, plan.id))
  }

  function openOutboundPlanModal() {
    openGenerateForm({
      shipment_plan_id:
        selectedPlan && selectedPlan.source_type === 'shipment_plan' ? selectedPlan.source_id : '',
      outbound_type: selectedPlan?.outbound_type ?? 'finished_goods_outbound',
      planned_date: selectedPlan?.planned_date ?? '',
    })
    openScheduleForm(
      selectedPlan ? outboundPlanToScheduleForm(selectedPlan) : initialOutboundPlanScheduleForm(),
    )
  }

  function closeOutboundPlanModal() {
    closeGenerateForm()
    closeScheduleForm()
  }

  function stopAndOpenOutboundPlanDetail(event: MouseEvent<HTMLElement>, plan: OutboundPlan) {
    event.stopPropagation()
    openOutboundPlanDetail(plan)
  }

  async function generateOutboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    await runGenerateSubmit(
      async () => {
        const plan = await generateOutboundPlanFromShipment(outboundPlanGeneratePayload(generateForm))
        setSearch(plan.source_code)
        setStatusFilter('')
        setTypeFilter(plan.outbound_type)
        setSourceFilter(plan.source_type)
        setCustomerFilter(plan.customer_id ?? '')
        setSourceIdFilter(plan.source_id)
        upsertOutboundPlan(plan)
        closeOutboundPlanModal()
        await loadOutboundPlans(plan.id, plan)
        setMessage(t('warehouse.outboundPlan.message.generated', { code: plan.code }))
      },
      (caught) => showError(caught, t('warehouse.outboundPlan.message.generateFailed')),
    )
  }

  async function scheduleSelectedOutboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlan) return
    setMessage('')
    await runScheduleSubmit(
      async () => {
        const plan = await scheduleOutboundPlan(
          selectedPlan.id,
          outboundPlanSchedulePayload(scheduleForm),
        )
        upsertOutboundPlan(plan)
        closeOutboundPlanModal()
        await loadOutboundPlans(plan.id, plan)
        setMessage(
          t('warehouse.outboundPlan.message.scheduled', {
            warehouse: plan.warehouse_name ?? '',
            location: plan.location_name ?? '',
          }),
        )
      },
      (caught) => showError(caught, t('warehouse.outboundPlan.message.scheduleFailed')),
    )
  }

  const plannedCount = plans.filter((item) => item.status === 'planned').length
  const scheduledCount = plans.filter((item) => item.status === 'scheduled').length
  const totalQuantity = plans.reduce((sum, item) => sum + outboundPlanTotalQuantity(item), 0)
  const shipmentSourceCount = plans.filter((item) => item.source_type === 'shipment_plan').length

  return (
    <section className="outbound-plan-page">
      <div className="summary-strip" aria-label={t('warehouse.outboundPlan.metric.overviewAria')}>
        <Metric label={t('warehouse.outboundPlan.metric.planCount')} value={plans.length} />
        <Metric
          label={t('warehouse.outboundPlan.metric.plannedCount')}
          value={plannedCount}
          intent={plannedCount > 0 ? 'warning' : 'normal'}
        />
        <Metric label={t('warehouse.outboundPlan.metric.scheduledCount')} value={scheduledCount} />
        <Metric
          label={t('warehouse.outboundPlan.metric.pendingQuantity')}
          value={totalQuantity.toFixed(2)}
        />
        <Metric
          label={t('warehouse.outboundPlan.metric.shipmentSourceCount')}
          value={shipmentSourceCount}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid outbound-plan-grid">
        {!detailId ? (
          <ListPageShell
            className="product-list-panel"
            icon={<Search size={18} />}
            title={t('warehouse.outboundPlan.list.title')}
            toolbar={<form
              className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadOutboundPlans()
                }}
              >
                <label>
                  {t('warehouse.outboundPlan.list.searchLabel')}
                  <Input
                    value={search}
                    placeholder={t('warehouse.outboundPlan.list.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label htmlFor="outbound-status-filter">
                  {t('warehouse.outboundPlan.list.statusFilter')}
                  <FormSelect
                    id="outbound-status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('warehouse.outboundPlan.list.allStatuses')}</option>
                    {outboundPlanStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label htmlFor="outbound-type-filter">
                  {t('warehouse.outboundPlan.list.typeFilter')}
                  <FormSelect
                    id="outbound-type-filter"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="">{t('warehouse.outboundPlan.list.allTypes')}</option>
                    {outboundPlanTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label htmlFor="outbound-source-filter">
                  {t('warehouse.outboundPlan.list.sourceTypeFilter')}
                  <FormSelect
                    id="outbound-source-filter"
                    value={sourceFilter}
                    onChange={(event) => setSourceFilter(event.target.value)}
                  >
                    <option value="">{t('warehouse.outboundPlan.list.allSourceTypes')}</option>
                    {outboundPlanSourceTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('warehouse.outboundPlan.list.customerFilter')}
                  <Input
                    value={customerFilter}
                    placeholder={t('warehouse.outboundPlan.list.customerFilterPlaceholder')}
                    onChange={(event) => setCustomerFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('warehouse.outboundPlan.list.sourceIdFilter')}
                  <Input
                    value={sourceIdFilter}
                    placeholder={t('warehouse.outboundPlan.list.sourceIdFilterPlaceholder')}
                    onChange={(event) => setSourceIdFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('warehouse.outboundPlan.list.query')}
                </Button>
                <Button
                  htmlType="button"
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={openOutboundPlanModal}
                >
                  {t('warehouse.outboundPlan.list.generateSchedule')}
                </Button>
              </form>}
            >

            <Table<OutboundPlan>
              columns={[
                {
                  title: t('warehouse.outboundPlan.field.code'),
                  dataIndex: 'code',
                  render: (value: string, record: OutboundPlan) => (
                    <button
                      className="row-button"
                      type="button"
                      onClick={(event) => stopAndOpenOutboundPlanDetail(event, record)}
                    >
                      {value}
                    </button>
                  ),
                },
                {
                  title: t('warehouse.outboundPlan.field.status'),
                  dataIndex: 'status',
                  render: outboundPlanStatusLabel,
                },
                {
                  title: t('warehouse.outboundPlan.field.type'),
                  dataIndex: 'outbound_type',
                  render: outboundPlanTypeLabel,
                },
                { title: t('warehouse.outboundPlan.field.sourceCode'), dataIndex: 'source_code' },
                {
                  title: t('warehouse.outboundPlan.field.customer'),
                  dataIndex: 'customer_name',
                  render: nullableText,
                },
                {
                  title: t('warehouse.outboundPlan.field.plannedDate'),
                  dataIndex: 'planned_date',
                  render: formatDate,
                },
                {
                  title: t('warehouse.outboundPlan.field.quantity'),
                  dataIndex: 'lines',
                  render: (_, plan) => outboundPlanTotalQuantity(plan).toFixed(2),
                },
                {
                  title: t('warehouse.outboundPlan.field.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: OutboundPlan) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenOutboundPlanDetail(event, record)}
                    >
                      {t('warehouse.outboundPlan.action.viewDetail')}
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
          open={outboundPlanModalOpen}
          title={t('warehouse.outboundPlan.form.modalTitle')}
          width={980}
          onCancel={closeOutboundPlanModal}
        >
          <div className="workflow-modal-content entity-modal-form">
            <PanelTitle
              icon={<Warehouse size={18} />}
              title={t('warehouse.outboundPlan.form.sectionTitle')}
            />
            <form className="record-form" onSubmit={generateOutboundPlan}>
              <div className="form-divider">{t('warehouse.outboundPlan.form.fromShipment')}</div>
              <label htmlFor="outbound-plan-shipment-id">
                {t('warehouse.outboundPlan.field.shipmentPlan')}
                <FormSelect
                  id="outbound-plan-shipment-id"
                  required
                  value={generateForm.shipment_plan_id}
                  onChange={(event) => handleOutboundShipmentChange(event.target.value)}
                >
                  <option value="">
                    {t('warehouse.outboundPlan.form.selectApprovedShipment')}
                  </option>
                  {shipments.map((shipment) => (
                    <option key={shipment.id} value={shipment.id}>
                      {shipment.code} /{' '}
                      {shipment.customer_name ?? t('warehouse.outboundPlan.detail.customerNotSet')}{' '}
                      / {formatDate(shipment.planned_ship_date)}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <div className="form-pair two">
                <label htmlFor="outbound-plan-type">
                  {t('warehouse.outboundPlan.field.outboundType')}
                  <FormSelect
                    id="outbound-plan-type"
                    value={generateForm.outbound_type}
                    onChange={(event) =>
                      setGenerateForm({ ...generateForm, outbound_type: event.target.value })
                    }
                  >
                    {outboundPlanTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label htmlFor="outbound-plan-date">
                  {t('warehouse.outboundPlan.field.plannedDate')}
                  <Input
                    id="outbound-plan-date"
                    type="date"
                    value={generateForm.planned_date}
                    onChange={(event) =>
                      setGenerateForm({ ...generateForm, planned_date: event.target.value })
                    }
                  />
                </label>
              </div>
              <Button
                disabled={!generateForm.shipment_plan_id}
                htmlType="submit"
                icon={<PackagePlus size={16} />}
                loading={generating}
              >
                {t('warehouse.outboundPlan.action.generate')}
              </Button>
            </form>

            <form
              className="record-form accessory-form generation-form"
              onSubmit={scheduleSelectedOutboundPlan}
            >
              <div className="form-divider">{t('warehouse.outboundPlan.form.scheduleSection')}</div>
              <label htmlFor="outbound-schedule-date">
                {t('warehouse.outboundPlan.field.plannedDate')}
                <Input
                  id="outbound-schedule-date"
                  required
                  type="date"
                  value={scheduleForm.planned_date}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, planned_date: event.target.value })
                  }
                />
              </label>
              <div className="form-pair two">
                <label htmlFor="outbound-warehouse-id">
                  {t('warehouse.outboundPlan.field.warehouseId')}
                  <Input
                    id="outbound-warehouse-id"
                    required
                    value={scheduleForm.warehouse_id}
                    onChange={(event) =>
                      setScheduleForm({ ...scheduleForm, warehouse_id: event.target.value })
                    }
                  />
                </label>
                <label htmlFor="outbound-warehouse-name">
                  {t('warehouse.outboundPlan.field.warehouse')}
                  <Input
                    id="outbound-warehouse-name"
                    required
                    value={scheduleForm.warehouse_name}
                    onChange={(event) =>
                      setScheduleForm({ ...scheduleForm, warehouse_name: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label htmlFor="outbound-location-id">
                  {t('warehouse.outboundPlan.field.locationId')}
                  <Input
                    id="outbound-location-id"
                    required
                    value={scheduleForm.location_id}
                    onChange={(event) =>
                      setScheduleForm({ ...scheduleForm, location_id: event.target.value })
                    }
                  />
                </label>
                <label htmlFor="outbound-location-name">
                  {t('warehouse.outboundPlan.field.location')}
                  <Input
                    id="outbound-location-name"
                    required
                    value={scheduleForm.location_name}
                    onChange={(event) =>
                      setScheduleForm({ ...scheduleForm, location_name: event.target.value })
                    }
                  />
                </label>
              </div>
              <label htmlFor="outbound-operator-name">
                {t('warehouse.outboundPlan.field.operator')}
                <Input
                  id="outbound-operator-name"
                  required
                  value={scheduleForm.operator_name}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, operator_name: event.target.value })
                  }
                />
              </label>
              <Button
                disabled={!selectedPlan}
                htmlType="submit"
                icon={<Save size={16} />}
                loading={scheduling}
                type="primary"
              >
                {t('warehouse.outboundPlan.action.saveSchedule')}
              </Button>
            </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('warehouse.outboundPlan.detail.title')}
              />
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => onNavigate(warehouseOutboundPlanPath)}
              >
                {t('warehouse.outboundPlan.action.backToList')}
              </Button>
            </div>
            {selectedPlan ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('warehouse.outboundPlan.field.sourceDocument')}</dt>
                    <dd>
                      {outboundPlanSourceTypeLabel(selectedPlan.source_type)} /{' '}
                      {selectedPlan.source_code}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.outboundPlan.field.customer')}</dt>
                    <dd>
                      {selectedPlan.customer_name ??
                        t('warehouse.outboundPlan.detail.customerNotSet')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.outboundPlan.field.outboundType')}</dt>
                    <dd>{outboundPlanTypeLabel(selectedPlan.outbound_type)}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.outboundPlan.field.planStatus')}</dt>
                    <dd>{outboundPlanStatusLabel(selectedPlan.status)}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.outboundPlan.field.plannedDate')}</dt>
                    <dd>{formatDate(selectedPlan.planned_date)}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.outboundPlan.field.location')}</dt>
                    <dd>
                      {selectedPlan.warehouse_name ?? t('warehouse.outboundPlan.detail.unassigned')}{' '}
                      /{' '}
                      {selectedPlan.location_name ?? t('warehouse.outboundPlan.detail.unassigned')}
                    </dd>
                  </div>
                </dl>

                <div className="accessory-heading">
                  <strong>{t('warehouse.outboundPlan.detail.linesTitle')}</strong>
                  <span>
                    {t('warehouse.outboundPlan.detail.lineCount', {
                      count: selectedPlan.lines.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('warehouse.outboundPlan.field.product')}</th>
                      <th>{t('warehouse.outboundPlan.field.specification')}</th>
                      <th>{t('warehouse.outboundPlan.field.plannedQuantity')}</th>
                      <th>{t('warehouse.outboundPlan.field.outboundQuantity')}</th>
                      <th>{t('warehouse.outboundPlan.field.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlan.lines.map((line) => (
                      <tr key={line.id}>
                        <td>
                          {line.product_code ?? '-'} {line.product_name}
                        </td>
                        <td>{line.specification ?? line.model ?? t('common.notSet')}</td>
                        <td>
                          {trimDecimal(line.planned_quantity)} {line.unit}
                        </td>
                        <td>
                          {trimDecimal(line.outbound_quantity)} {line.unit}
                        </td>
                        <td>{outboundPlanLineStatusLabel(line.status)}</td>
                      </tr>
                    ))}
                    {selectedPlan.lines.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={5}>
                          {t('warehouse.outboundPlan.detail.noLines')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <Send size={28} />
                <strong>{t('warehouse.outboundPlan.detail.emptyTitle')}</strong>
                <span>{t('warehouse.outboundPlan.detail.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
