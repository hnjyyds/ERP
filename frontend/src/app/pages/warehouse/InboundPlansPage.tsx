import { Alert, Button, Input, Modal, Skeleton as _Skeleton, Table, Tag as _Tag } from 'antd'
import {
  ArrowLeft,
  LayoutDashboard,
  Plus,
  Search,
  Warehouse,
  PackagePlus,
  Save,
} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  generateInboundPlanFromPurchaseContract,
  listInboundPlans,
  listPurchaseContracts,
  scheduleInboundPlan,
  type InboundPlan,
  type InboundPlanGeneratePayload,
  type InboundPlanSchedulePayload,
} from '../../../api'
import { warehouseInboundPlanPath, moduleDetailPath } from '../../routes'
import { FormSelect, ListPageShell, Metric, PanelTitle, RemoteSelect } from '../../../shared/ui'
import { useFormModal } from '../../../shared/useFormModal'
import { showError } from '../../../shared/errors'
import { inboundPlanStatusOptions, inboundPlanTypeOptions } from '../../../shared/formOptions'
import {
  daysFromTodayInputValue,
  formatDate,
  formatMoney as _formatMoney,
  formatQuantity as _formatQuantity,
  nullableText as _nullableText,
  todayInputValue as _todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '../appHelpers'
import { t } from '../../appI18n'

type InboundPlanGenerateFormState = {
  purchase_contract_id: string
  inbound_type: string
  planned_date: string
}

type InboundPlanScheduleFormState = {
  planned_date: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

type _InboundOrderFormState = {
  plan_id: string
  code: string
  inbound_mode: string
  inbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

type _InboundOrderApprovalFormState = {
  reviewer_name: string
  approved_at: string
}

function initialInboundPlanGenerateForm(): InboundPlanGenerateFormState {
  return {
    purchase_contract_id: '',
    inbound_type: 'purchase_inbound',
    planned_date: '',
  }
}

function initialInboundPlanScheduleForm(): InboundPlanScheduleFormState {
  return {
    planned_date: daysFromTodayInputValue(7),
    warehouse_id: '',
    warehouse_name: '',
    location_id: '',
    location_name: '',
    operator_name: '',
  }
}

function inboundPlanToScheduleForm(plan: InboundPlan): InboundPlanScheduleFormState {
  return {
    planned_date: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? '',
    warehouse_name: plan.warehouse_name ?? '',
    location_id: plan.location_id ?? '',
    location_name: plan.location_name ?? '',
    operator_name: plan.operator_name ?? '',
  }
}

function inboundPlanGeneratePayload(
  form: InboundPlanGenerateFormState,
): InboundPlanGeneratePayload {
  return {
    purchase_contract_id: form.purchase_contract_id.trim(),
    inbound_type: form.inbound_type,
    planned_date: emptyToNull(form.planned_date),
  }
}

function inboundPlanSchedulePayload(
  form: InboundPlanScheduleFormState,
): InboundPlanSchedulePayload {
  return {
    planned_date: form.planned_date,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    operator_name: form.operator_name.trim(),
  }
}

function inboundPlanTypeLabel(value: string): string {
  const option = inboundPlanTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function inboundPlanStatusLabel(value: string): string {
  const option = inboundPlanStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function inboundPlanLineStatusLabel(value: string): string {
  if (value === 'pending') return t('warehouse.inboundPlan.detail.lineStatusPending')
  if (value === 'partial') return t('warehouse.inboundPlan.detail.lineStatusPartial')
  if (value === 'completed') return t('warehouse.inboundPlan.detail.lineStatusCompleted')
  if (value === 'cancelled') return t('warehouse.inboundPlan.detail.lineStatusCancelled')
  return value
}

function inboundPlanTotalQuantity(plan: InboundPlan): number {
  return plan.lines.reduce((sum, line) => sum + Number(line.planned_quantity || 0), 0)
}

function trimDecimal(value: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  return Number.isInteger(numeric) ? String(numeric) : String(numeric)
}

export function InboundPlansPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [plans, setPlans] = useState<InboundPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const {
    open: inboundPlanModalOpen,
    form: generateForm,
    setForm: setGenerateForm,
    submitting: generating,
    openWith: openGenerateForm,
    close: closeGenerateForm,
    runSubmit: runGenerateSubmit,
  } = useFormModal(initialInboundPlanGenerateForm)
  const {
    form: scheduleForm,
    setForm: setScheduleForm,
    submitting: scheduling,
    openWith: openScheduleForm,
    close: closeScheduleForm,
    runSubmit: runScheduleSubmit,
  } = useFormModal(initialInboundPlanScheduleForm)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchPurchaseContractOptions = useCallback(async (query: string) => {
    const result = await listPurchaseContracts({
      q: query.trim() || undefined,
      approval_status: 'approved',
    })
    return result.items.slice(0, 20).map((contract) => ({
      value: contract.id,
      label: `${contract.code} / ${contract.supplier_name}`,
      description: t('warehouse.inboundPlan.form.contractOptionDescription', {
        signed: formatDate(contract.contract_date),
        delivery: formatDate(contract.delivery_date),
      }),
    }))
  }, [])

  const selectedPlan = useMemo(() => {
    if (detailId) return plans.find((item) => item.id === detailId) ?? null
    return plans.find((item) => item.id === selectedPlanId) ?? plans[0] ?? null
  }, [detailId, plans, selectedPlanId])

  useEffect(() => {
    void loadInboundPlans()
  }, [])

  useEffect(() => {
    if (!selectedPlan) return
    setGenerateForm((current) => ({
      ...current,
      purchase_contract_id: selectedPlan.purchase_contract_id,
      inbound_type: selectedPlan.inbound_type,
      planned_date: selectedPlan.planned_date,
    }))
    setScheduleForm(inboundPlanToScheduleForm(selectedPlan))
  }, [selectedPlan?.id])

  useEffect(() => {
    if (detailId && plans.length > 0 && !plans.some((item) => item.id === detailId)) {
      onNavigate(warehouseInboundPlanPath)
    }
  }, [detailId, onNavigate, plans])

  function openInboundPlanDetail(plan: InboundPlan) {
    setSelectedPlanId(plan.id)
    onNavigate(moduleDetailPath(warehouseInboundPlanPath, plan.id))
  }

  function openInboundPlanModal() {
    openGenerateForm(
      selectedPlan
        ? {
            ...initialInboundPlanGenerateForm(),
            purchase_contract_id: selectedPlan.purchase_contract_id,
            inbound_type: selectedPlan.inbound_type,
            planned_date: selectedPlan.planned_date,
          }
        : initialInboundPlanGenerateForm(),
    )
    openScheduleForm(
      selectedPlan ? inboundPlanToScheduleForm(selectedPlan) : initialInboundPlanScheduleForm(),
    )
  }

  function closeInboundPlanModal() {
    closeGenerateForm()
    closeScheduleForm()
  }

  function stopAndOpenInboundPlanDetail(event: MouseEvent<HTMLElement>, plan: InboundPlan) {
    event.stopPropagation()
    openInboundPlanDetail(plan)
  }

  async function loadInboundPlans(preferredPlanId?: string) {
    setLoading(true)
    try {
      const result = await listInboundPlans({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        inbound_type: typeFilter || undefined,
        supplier_id: supplierFilter.trim() || undefined,
        purchase_contract_id: contractFilter.trim() || undefined,
      })
      setPlans(result.items)
      const nextId =
        preferredPlanId ??
        (result.items.some((item) => item.id === selectedPlanId) ? selectedPlanId : null) ??
        result.items[0]?.id ??
        null
      setSelectedPlanId(nextId)
    } catch (caught) {
      showError(caught, t('warehouse.inboundPlan.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function generateInboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    await runGenerateSubmit(
      async () => {
        const plan = await generateInboundPlanFromPurchaseContract(
          inboundPlanGeneratePayload(generateForm),
        )
        setSearch(plan.purchase_contract_no)
        setContractFilter(plan.purchase_contract_id)
        setSelectedPlanId(plan.id)
        closeInboundPlanModal()
        await loadInboundPlans(plan.id)
        setMessage(t('warehouse.inboundPlan.message.generated', { code: plan.code }))
      },
      (caught) => showError(caught, t('warehouse.inboundPlan.message.generateFailed')),
    )
  }

  async function scheduleSelectedInboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlan) return
    setMessage('')
    await runScheduleSubmit(
      async () => {
        const plan = await scheduleInboundPlan(
          selectedPlan.id,
          inboundPlanSchedulePayload(scheduleForm),
        )
        setSelectedPlanId(plan.id)
        closeInboundPlanModal()
        await loadInboundPlans(plan.id)
        setMessage(
          t('warehouse.inboundPlan.message.scheduled', {
            warehouse: plan.warehouse_name ?? '',
            location: plan.location_name ?? '',
          }),
        )
      },
      (caught) => showError(caught, t('warehouse.inboundPlan.message.scheduleFailed')),
    )
  }

  const scheduledCount = plans.filter((item) => item.status === 'scheduled').length
  const plannedCount = plans.filter((item) => item.status === 'planned').length
  const totalQuantity = plans.reduce((sum, item) => sum + inboundPlanTotalQuantity(item), 0)
  const typeCount = new Set(plans.map((item) => item.inbound_type)).size

  return (
    <section className="inbound-plan-page">
      <div className="summary-strip" aria-label={t('warehouse.inboundPlan.metric.overviewAria')}>
        <Metric label={t('warehouse.inboundPlan.metric.planCount')} value={plans.length} />
        <Metric
          label={t('warehouse.inboundPlan.metric.plannedCount')}
          value={plannedCount}
          intent={plannedCount > 0 ? 'warning' : 'normal'}
        />
        <Metric label={t('warehouse.inboundPlan.metric.scheduledCount')} value={scheduledCount} />
        <Metric
          label={t('warehouse.inboundPlan.metric.pendingQuantity')}
          value={totalQuantity.toFixed(2)}
        />
        <Metric label={t('warehouse.inboundPlan.metric.typeCount')} value={typeCount} />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid inbound-plan-grid">
        {!detailId ? (
          <ListPageShell
            className="product-list-panel"
            icon={<Search size={18} />}
            title={t('warehouse.inboundPlan.list.title')}
            toolbar={<form
              className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadInboundPlans()
                }}
              >
                <label>
                  {t('warehouse.inboundPlan.list.searchLabel')}
                  <Input
                    value={search}
                    placeholder={t('warehouse.inboundPlan.list.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label htmlFor="inbound-status-filter">
                  {t('warehouse.inboundPlan.list.statusFilter')}
                  <FormSelect
                    id="inbound-status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('warehouse.inboundPlan.list.allStatuses')}</option>
                    {inboundPlanStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label htmlFor="inbound-type-filter">
                  {t('warehouse.inboundPlan.list.typeFilter')}
                  <FormSelect
                    id="inbound-type-filter"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="">{t('warehouse.inboundPlan.list.allTypes')}</option>
                    {inboundPlanTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('warehouse.inboundPlan.list.supplierFilter')}
                  <Input
                    value={supplierFilter}
                    placeholder={t('warehouse.inboundPlan.list.supplierFilterPlaceholder')}
                    onChange={(event) => setSupplierFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('warehouse.inboundPlan.list.contractFilter')}
                  <Input
                    value={contractFilter}
                    placeholder={t('warehouse.inboundPlan.list.contractFilterPlaceholder')}
                    onChange={(event) => setContractFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('warehouse.inboundPlan.list.query')}
                </Button>
                <Button
                  htmlType="button"
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={openInboundPlanModal}
                >
                  {t('warehouse.inboundPlan.list.generateSchedule')}
                </Button>
              </form>}
            >

            <Table<InboundPlan>
              columns={[
                {
                  title: t('warehouse.inboundPlan.field.code'),
                  dataIndex: 'code',
                  render: (value: string, record: InboundPlan) => (
                    <button
                      className="row-button"
                      type="button"
                      onClick={(event) => stopAndOpenInboundPlanDetail(event, record)}
                    >
                      {value}
                    </button>
                  ),
                },
                {
                  title: t('warehouse.inboundPlan.field.status'),
                  dataIndex: 'status',
                  render: inboundPlanStatusLabel,
                },
                {
                  title: t('warehouse.inboundPlan.field.type'),
                  dataIndex: 'inbound_type',
                  render: inboundPlanTypeLabel,
                },
                {
                  title: t('warehouse.inboundPlan.field.purchaseContract'),
                  dataIndex: 'purchase_contract_no',
                },
                { title: t('warehouse.inboundPlan.field.supplier'), dataIndex: 'supplier_name' },
                {
                  title: t('warehouse.inboundPlan.field.plannedDate'),
                  dataIndex: 'planned_date',
                  render: formatDate,
                },
                {
                  title: t('warehouse.inboundPlan.field.quantity'),
                  dataIndex: 'lines',
                  render: (_, plan) => inboundPlanTotalQuantity(plan).toFixed(2),
                },
                {
                  title: t('warehouse.inboundPlan.field.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: InboundPlan) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenInboundPlanDetail(event, record)}
                    >
                      {t('warehouse.inboundPlan.action.viewDetail')}
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
          open={inboundPlanModalOpen}
          title={t('warehouse.inboundPlan.form.modalTitle')}
          width={980}
          onCancel={closeInboundPlanModal}
        >
          <div className="workflow-modal-content entity-modal-form">
            <PanelTitle
              icon={<Warehouse size={18} />}
              title={t('warehouse.inboundPlan.form.sectionTitle')}
            />
            <form className="record-form" onSubmit={generateInboundPlan}>
              <div className="form-divider">{t('warehouse.inboundPlan.form.fromContract')}</div>
              <label htmlFor="inbound-plan-contract-id">
                {t('warehouse.inboundPlan.field.purchaseContract')}
                <RemoteSelect
                  ariaLabel={t('warehouse.inboundPlan.field.purchaseContract')}
                  fetchOptions={fetchPurchaseContractOptions}
                  id="inbound-plan-contract-id"
                  placeholder={t('warehouse.inboundPlan.form.contractSearchPlaceholder')}
                  required
                  value={generateForm.purchase_contract_id || null}
                  onChange={(value) =>
                    setGenerateForm({ ...generateForm, purchase_contract_id: value })
                  }
                />
              </label>
              <div className="form-pair two">
                <label htmlFor="inbound-plan-type">
                  {t('warehouse.inboundPlan.field.inboundType')}
                  <FormSelect
                    id="inbound-plan-type"
                    value={generateForm.inbound_type}
                    onChange={(event) =>
                      setGenerateForm({ ...generateForm, inbound_type: event.target.value })
                    }
                  >
                    {inboundPlanTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label htmlFor="inbound-plan-date">
                  {t('warehouse.inboundPlan.field.plannedDate')}
                  <Input
                    id="inbound-plan-date"
                    type="date"
                    value={generateForm.planned_date}
                    onChange={(event) =>
                      setGenerateForm({ ...generateForm, planned_date: event.target.value })
                    }
                  />
                </label>
              </div>
              <Button htmlType="submit" icon={<PackagePlus size={16} />} loading={generating}>
                {t('warehouse.inboundPlan.action.generate')}
              </Button>
            </form>

            <form
              className="record-form accessory-form generation-form"
              onSubmit={scheduleSelectedInboundPlan}
            >
              <div className="form-divider">{t('warehouse.inboundPlan.form.scheduleSection')}</div>
              <label htmlFor="inbound-schedule-date">
                {t('warehouse.inboundPlan.field.plannedDate')}
                <Input
                  id="inbound-schedule-date"
                  required
                  type="date"
                  value={scheduleForm.planned_date}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, planned_date: event.target.value })
                  }
                />
              </label>
              <div className="form-pair two">
                <label htmlFor="inbound-warehouse-id">
                  {t('warehouse.inboundPlan.field.warehouseId')}
                  <Input
                    id="inbound-warehouse-id"
                    required
                    value={scheduleForm.warehouse_id}
                    onChange={(event) =>
                      setScheduleForm({ ...scheduleForm, warehouse_id: event.target.value })
                    }
                  />
                </label>
                <label htmlFor="inbound-warehouse-name">
                  {t('warehouse.inboundPlan.field.warehouse')}
                  <Input
                    id="inbound-warehouse-name"
                    required
                    value={scheduleForm.warehouse_name}
                    onChange={(event) =>
                      setScheduleForm({ ...scheduleForm, warehouse_name: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label htmlFor="inbound-location-id">
                  {t('warehouse.inboundPlan.field.locationId')}
                  <Input
                    id="inbound-location-id"
                    required
                    value={scheduleForm.location_id}
                    onChange={(event) =>
                      setScheduleForm({ ...scheduleForm, location_id: event.target.value })
                    }
                  />
                </label>
                <label htmlFor="inbound-location-name">
                  {t('warehouse.inboundPlan.field.location')}
                  <Input
                    id="inbound-location-name"
                    required
                    value={scheduleForm.location_name}
                    onChange={(event) =>
                      setScheduleForm({ ...scheduleForm, location_name: event.target.value })
                    }
                  />
                </label>
              </div>
              <label htmlFor="inbound-operator-name">
                {t('warehouse.inboundPlan.field.operator')}
                <Input
                  id="inbound-operator-name"
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
                {t('warehouse.inboundPlan.action.saveSchedule')}
              </Button>
            </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('warehouse.inboundPlan.detail.title')}
              />
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => onNavigate(warehouseInboundPlanPath)}
              >
                {t('warehouse.inboundPlan.action.backToList')}
              </Button>
            </div>
            {selectedPlan ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('warehouse.inboundPlan.field.purchaseContract')}</dt>
                    <dd>{selectedPlan.purchase_contract_no}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.inboundPlan.field.supplier')}</dt>
                    <dd>{selectedPlan.supplier_name}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.inboundPlan.field.inboundType')}</dt>
                    <dd>{inboundPlanTypeLabel(selectedPlan.inbound_type)}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.inboundPlan.field.planStatus')}</dt>
                    <dd>{inboundPlanStatusLabel(selectedPlan.status)}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.inboundPlan.field.plannedDate')}</dt>
                    <dd>{formatDate(selectedPlan.planned_date)}</dd>
                  </div>
                  <div>
                    <dt>{t('warehouse.inboundPlan.field.location')}</dt>
                    <dd>
                      {selectedPlan.warehouse_name ?? t('warehouse.inboundPlan.detail.unassigned')}{' '}
                      / {selectedPlan.location_name ?? t('warehouse.inboundPlan.detail.unassigned')}
                    </dd>
                  </div>
                </dl>

                <div className="accessory-heading">
                  <strong>{t('warehouse.inboundPlan.detail.linesTitle')}</strong>
                  <span>
                    {t('warehouse.inboundPlan.detail.lineCount', {
                      count: selectedPlan.lines.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('warehouse.inboundPlan.field.product')}</th>
                      <th>{t('warehouse.inboundPlan.field.specification')}</th>
                      <th>{t('warehouse.inboundPlan.field.plannedQuantity')}</th>
                      <th>{t('warehouse.inboundPlan.field.receivedQuantity')}</th>
                      <th>{t('warehouse.inboundPlan.field.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlan.lines.map((line) => (
                      <tr key={line.id}>
                        <td>{`${line.product_code ?? '-'} ${line.product_name}`}</td>
                        <td>{line.specification ?? line.model ?? t('common.notSet')}</td>
                        <td>{`${trimDecimal(line.planned_quantity)} ${line.unit}`}</td>
                        <td>{`${trimDecimal(line.received_quantity)} ${line.unit}`}</td>
                        <td>{inboundPlanLineStatusLabel(line.status)}</td>
                      </tr>
                    ))}
                    {selectedPlan.lines.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={5}>
                          {t('warehouse.inboundPlan.detail.noLines')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <PackagePlus size={28} />
                <strong>{t('warehouse.inboundPlan.detail.emptyTitle')}</strong>
                <span>{t('warehouse.inboundPlan.detail.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
