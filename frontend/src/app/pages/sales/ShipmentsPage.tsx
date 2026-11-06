import { Alert, Button, Input, Modal, Skeleton as _Skeleton, Table, Tag as _Tag } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, Ship } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approveShipment,
  generateShipmentFromContracts,
  listExportContracts,
  listShipmentReminders,
  listShipments,
  submitShipment,
  type CurrentUser,
  type ShipmentPlan,
  type ShipmentApprovePayload,
  type ShipmentPlanGeneratePayload,
  type ShipmentReminder,
  type ShipmentStatisticItem as _ShipmentStatisticItem,
  ExportContractPurchaseStatus,
  ExportContractShipmentStatus,
  ShipmentLine,
} from '../../../api'
import { shipmentPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle, RemoteSelect } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { shipmentStatusOptions, freightMethodOptions } from '../../../shared/formOptions'
import {
  canApproveAssignedRecord,
  formatDate,
  formatMoney,
  nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '../appHelpers'
import { ApprovalAssigneeSelect } from '../../components/ApprovalAssigneeSelect'
import { t } from '../../appI18n'

function freightMethodLabel(value: string): string {
  const option = freightMethodOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function contractProgressStatusLabel(value: string): string {
  if (value === 'completed') return t('sales.contract.progress.completed')
  if (value === 'partial') return t('sales.contract.progress.partial')
  if (value === 'pending') return t('sales.contract.progress.pending')
  return value
}

type ShipmentFormState = {
  code: string
  shipment_date: string
  planned_ship_date: string
  shipping_method: string
  contract_id_a: string
  contract_quantity_a: string
  contract_id_b: string
  contract_quantity_b: string
  port_of_loading: string
  port_of_destination: string
  vessel_name: string
  container_no: string
  booking_no: string
  document_owner_name: string
  estimated_payable_amount: string
  remarks: string
}

type ShipmentApproveFormState = {
  reviewer_name: string
  approved_at: string
}

function initialShipmentForm(): ShipmentFormState {
  return {
    code: `SP-${Date.now().toString().slice(-6)}`,
    shipment_date: todayInputValue(),
    planned_ship_date: todayInputValue(),
    shipping_method: 'sea',
    contract_id_a: '',
    contract_quantity_a: '',
    contract_id_b: '',
    contract_quantity_b: '',
    port_of_loading: 'Ningbo',
    port_of_destination: '',
    vessel_name: '',
    container_no: '',
    booking_no: '',
    document_owner_name: '',
    estimated_payable_amount: '0.00',
    remarks: '',
  }
}

function initialShipmentApproveForm(): ShipmentApproveFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
  }
}

function shipmentGeneratePayload(form: ShipmentFormState): ShipmentPlanGeneratePayload {
  const selections = [
    {
      contract_id: form.contract_id_a.trim(),
      quantity: emptyToNull(form.contract_quantity_a),
    },
  ]
  if (form.contract_id_b.trim()) {
    selections.push({
      contract_id: form.contract_id_b.trim(),
      quantity: emptyToNull(form.contract_quantity_b),
    })
  }

  return {
    code: form.code.trim(),
    shipment_date: form.shipment_date,
    planned_ship_date: form.planned_ship_date,
    shipping_method: form.shipping_method,
    port_of_loading: form.port_of_loading.trim(),
    port_of_destination: form.port_of_destination.trim(),
    vessel_name: emptyToNull(form.vessel_name),
    container_no: emptyToNull(form.container_no),
    booking_no: emptyToNull(form.booking_no),
    document_owner_name: emptyToNull(form.document_owner_name),
    estimated_payable_amount: form.estimated_payable_amount || '0',
    remarks: emptyToNull(form.remarks),
    selections,
  }
}

function shipmentApprovePayload(form: ShipmentApproveFormState): ShipmentApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function shipmentStatusLabel(value: string): string {
  const option = shipmentStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function reminderStatusLabel(value: string): string {
  if (value === 'pending') return t('sales.shipment.detail.reminderPending')
  if (value === 'done') return t('sales.shipment.detail.reminderDone')
  if (value === 'overdue') return t('sales.shipment.detail.reminderOverdue')
  return value
}

function formatPercent(value?: string | null): string {
  if (!value) return '0.00%'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return `${value}%`
  return `${numeric.toFixed(2)}%`
}

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function ShipmentsPage({ currentUser, detailId, onNavigate }: Props) {
  const [shipments, setShipments] = useState<ShipmentPlan[]>([])
  const [reminders, setReminders] = useState<ShipmentReminder[]>([])
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<ShipmentFormState>(() => initialShipmentForm())
  const [formOpen, setFormOpen] = useState(false)
  const [reviewerId, setReviewerId] = useState('')
  const [approveForm, setApproveForm] = useState<ShipmentApproveFormState>(() =>
    initialShipmentApproveForm(),
  )

  const fetchExportContractOptions = useCallback(async (query: string) => {
    const result = await listExportContracts({
      q: query.trim() || undefined,
      approval_status: 'approved',
    })
    return result.items.slice(0, 20).map((contract) => ({
      value: contract.id,
      label: `${contract.code} / ${contract.customer_name}`,
      description: t('sales.shipment.form.contractOptionDescription', {
        date: formatDate(contract.planned_ship_date),
        amount: formatMoney(contract.statistics.total_amount, contract.currency),
      }),
    }))
  }, [])

  const selectedShipment = useMemo(() => {
    if (detailId) return shipments.find((item) => item.id === detailId) ?? null
    return shipments.find((item) => item.id === selectedShipmentId) ?? shipments[0] ?? null
  }, [detailId, shipments, selectedShipmentId])

  useEffect(() => {
    void loadShipments()
    void loadReminders()
  }, [])

  useEffect(() => {
    setApproveForm({
      reviewer_name: selectedShipment?.reviewer_name ?? '',
      approved_at: selectedShipment?.approved_at ?? todayInputValue(),
    })
    setReviewerId(selectedShipment?.reviewer_id ?? '')
  }, [selectedShipment?.id, selectedShipment?.approval_status])

  useEffect(() => {
    if (detailId && shipments.length > 0 && !shipments.some((item) => item.id === detailId)) {
      onNavigate(shipmentPath)
    }
  }, [detailId, onNavigate, shipments])

  async function loadShipments(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listShipments({
        q: search.trim() || undefined,
        approval_status: statusFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
        contract_id: contractFilter.trim() || undefined,
      })
      setShipments(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedShipmentId) ? selectedShipmentId : null) ??
        result.items[0]?.id ??
        null
      setSelectedShipmentId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('sales.shipment.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadReminders() {
    try {
      const result = await listShipmentReminders()
      setReminders(result.items)
    } catch (caught) {
      showError(caught, t('sales.shipment.list.remindersLoadFailed'))
    }
  }

  function upsertShipment(shipment: ShipmentPlan) {
    setShipments((current) => {
      const exists = current.some((item) => item.id === shipment.id)
      return exists
        ? current.map((item) => (item.id === shipment.id ? shipment : item))
        : [shipment, ...current]
    })
    setSelectedShipmentId(shipment.id)
  }

  function openShipmentDetail(shipment: ShipmentPlan) {
    setSelectedShipmentId(shipment.id)
    onNavigate(moduleDetailPath(shipmentPath, shipment.id))
  }

  function stopAndOpenShipmentDetail(event: MouseEvent<HTMLElement>, shipment: ShipmentPlan) {
    event.stopPropagation()
    openShipmentDetail(shipment)
  }

  async function submitGeneratedShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const created = await generateShipmentFromContracts(shipmentGeneratePayload(form))
      setMessage(t('sales.shipment.message.generated', { code: created.code }))
      setForm(initialShipmentForm())
      upsertShipment(created)
      await Promise.all([loadShipments(created.id), loadReminders()])
      setFormOpen(false)
    } catch (caught) {
      showError(caught, t('sales.shipment.message.generateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitShipmentForApproval() {
    if (!selectedShipment) return
    if (!reviewerId) {
      showError(new Error(t('sales.shipment.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitShipment(selectedShipment.id, { reviewer_id: reviewerId })
      setMessage(t('sales.shipment.message.submitted', { code: submitted.code }))
      upsertShipment(submitted)
      await Promise.all([loadShipments(submitted.id), loadReminders()])
    } catch (caught) {
      showError(caught, t('sales.shipment.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedShipment) return
    if (
      !canApproveAssignedRecord(currentUser, selectedShipment.reviewer_id, 'sales:shipment:approve')
    ) {
      showError(
        new Error(
          t('sales.shipment.action.approverMismatch', {
            name: selectedShipment.reviewer_name ?? t('sales.shipment.action.defaultReviewer'),
          }),
        ),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveShipment(
        selectedShipment.id,
        shipmentApprovePayload(approveForm),
      )
      setMessage(t('sales.shipment.message.approved', { code: approved.code }))
      upsertShipment(approved)
      await Promise.all([loadShipments(approved.id), loadReminders()])
    } catch (caught) {
      showError(caught, t('sales.shipment.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const totalReceivable = shipments.reduce(
    (sum, item) => sum + Number(item.finance_overview.receivable_amount),
    0,
  )
  const totalProfit = shipments.reduce(
    (sum, item) => sum + Number(item.finance_overview.profit_amount),
    0,
  )
  const currency = shipments[0]?.currency ?? 'USD'
  const selectedShipmentRows =
    selectedShipment?.contract_progresses.flatMap((progress) =>
      progress.shipment_statuses.map((status) => ({
        ...status,
        contract_id: progress.contract_id,
        contract_no: progress.contract_no,
      })),
    ) ?? []
  const selectedPurchaseRows =
    selectedShipment?.contract_progresses.flatMap((progress) =>
      progress.purchase_statuses.map((status) => ({
        ...status,
        contract_id: progress.contract_id,
        contract_no: progress.contract_no,
      })),
    ) ?? []

  return (
    <section className="shipment-page">
      <div className="summary-strip" aria-label={t('sales.shipment.metric.overviewAria')}>
        <Metric label={t('sales.shipment.metric.shipmentCount')} value={shipments.length} />
        <Metric
          label={t('sales.shipment.metric.pendingApproval')}
          value={shipments.filter((item) => item.approval_status === 'submitted').length}
        />
        <Metric
          label={t('sales.shipment.metric.approvedCount')}
          value={shipments.filter((item) => item.approval_status === 'approved').length}
        />
        <Metric
          label={t('sales.shipment.metric.receivableAmount')}
          value={formatMoney(totalReceivable.toFixed(2), currency)}
        />
        <Metric
          label={t('sales.shipment.metric.expectedProfit')}
          value={formatMoney(totalProfit.toFixed(2), currency)}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid shipment-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Search size={18} />} title={t('sales.shipment.list.title')} />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadShipments()
                }}
              >
                <label>
                  {t('sales.shipment.list.searchLabel')}
                  <Input
                    value={search}
                    placeholder={t('sales.shipment.list.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('sales.shipment.list.statusFilter')}
                  <FormSelect
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('sales.shipment.list.allStatuses')}</option>
                    {shipmentStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('sales.shipment.list.customerFilter')}
                  <Input
                    value={customerFilter}
                    placeholder={t('sales.shipment.list.customerFilterPlaceholder')}
                    onChange={(event) => setCustomerFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('sales.shipment.list.contractFilter')}
                  <Input
                    value={contractFilter}
                    placeholder={t('sales.shipment.list.contractFilterPlaceholder')}
                    onChange={(event) => setContractFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('sales.shipment.list.query')}
                </Button>
                <Button
                  icon={<Plus size={16} />}
                  type="primary"
                  onClick={() => {
                    setForm(initialShipmentForm())
                    setFormOpen(true)
                  }}
                >
                  {t('sales.shipment.action.generate')}
                </Button>
              </form>
            </div>

            <Table<ShipmentPlan>
              columns={[
                {
                  title: t('sales.shipment.field.code'),
                  dataIndex: 'code',
                  render: (value: string, record: ShipmentPlan) => (
                    <button
                      className="row-button"
                      type="button"
                      onClick={(event) => stopAndOpenShipmentDetail(event, record)}
                    >
                      {value}
                    </button>
                  ),
                },
                {
                  title: t('sales.shipment.field.status'),
                  dataIndex: 'approval_status',
                  render: shipmentStatusLabel,
                },
                { title: t('sales.shipment.field.customer'), dataIndex: 'customer_name' },
                { title: t('sales.shipment.field.shipmentDate'), dataIndex: 'shipment_date', render: formatDate },
                { title: t('sales.shipment.field.plannedShipDate'), dataIndex: 'planned_ship_date', render: formatDate },
                {
                  title: t('sales.shipment.field.receivable'),
                  dataIndex: 'finance_overview',
                  render: (_, shipment) =>
                    formatMoney(
                      shipment.finance_overview.receivable_amount,
                      shipment.finance_overview.currency,
                    ),
                },
                {
                  title: t('sales.shipment.field.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: ShipmentPlan) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenShipmentDetail(event, record)}
                    >
                      {t('sales.shipment.action.viewDetail')}
                    </Button>
                  ),
                },
              ]}
              dataSource={shipments}
              loading={loading}
              pagination={false}
              rowClassName={(record) => (record.id === selectedShipment?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedShipmentId(record.id),
              })}
            />
          </section>
        ) : null}

        {!detailId ? (
          <Modal
            destroyOnHidden
            footer={null}
            open={formOpen}
            title={t('sales.shipment.form.generateTitle')}
            width={880}
            onCancel={() => setFormOpen(false)}
          >
            <form className="record-form modal-record-form" onSubmit={submitGeneratedShipment}>
              <div className="form-pair two">
                <label>
                  {t('sales.shipment.field.code')}
                  <Input
                    value={form.code}
                    onChange={(event) => setForm({ ...form, code: event.target.value })}
                  />
                </label>
                <label>
                  {t('sales.shipment.field.shipmentDate')}
                  <Input
                    type="date"
                    value={form.shipment_date}
                    onChange={(event) => setForm({ ...form, shipment_date: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('sales.shipment.field.plannedShipDate')}
                  <Input
                    type="date"
                    value={form.planned_ship_date}
                    onChange={(event) =>
                      setForm({ ...form, planned_ship_date: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t('sales.shipment.field.freightMethod')}
                  <FormSelect
                    value={form.shipping_method}
                    onChange={(event) => setForm({ ...form, shipping_method: event.target.value })}
                  >
                    {freightMethodOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
              </div>
              <div className="form-divider">{t('sales.shipment.form.contractSection')}</div>
              <div className="form-pair two">
                <label htmlFor="shipment-contract-a">
                  {t('sales.shipment.form.contractA')}
                  <RemoteSelect
                    ariaLabel={t('sales.shipment.form.contractA')}
                    fetchOptions={fetchExportContractOptions}
                    id="shipment-contract-a"
                    placeholder={t('sales.shipment.form.contractSearchPlaceholder')}
                    required
                    value={form.contract_id_a || null}
                    onChange={(value) => setForm({ ...form, contract_id_a: value })}
                  />
                </label>
                <label>
                  {t('sales.shipment.form.contractQuantityA')}
                  <Input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={form.contract_quantity_a}
                    onChange={(event) =>
                      setForm({ ...form, contract_quantity_a: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label htmlFor="shipment-contract-b">
                  {t('sales.shipment.form.contractB')}
                  <RemoteSelect
                    ariaLabel={t('sales.shipment.form.contractB')}
                    fetchOptions={fetchExportContractOptions}
                    id="shipment-contract-b"
                    placeholder={t('sales.shipment.form.contractBPlaceholder')}
                    value={form.contract_id_b || null}
                    onChange={(value) => setForm({ ...form, contract_id_b: value })}
                  />
                </label>
                <label>
                  {t('sales.shipment.form.contractQuantityB')}
                  <Input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={form.contract_quantity_b}
                    onChange={(event) =>
                      setForm({ ...form, contract_quantity_b: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-divider">{t('sales.shipment.form.logisticsSection')}</div>
              <div className="form-pair two">
                <label>
                  {t('sales.shipment.field.portOfLoading')}
                  <Input
                    value={form.port_of_loading}
                    onChange={(event) => setForm({ ...form, port_of_loading: event.target.value })}
                  />
                </label>
                <label>
                  {t('sales.shipment.field.portOfDestination')}
                  <Input
                    value={form.port_of_destination}
                    onChange={(event) =>
                      setForm({ ...form, port_of_destination: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('sales.shipment.field.vesselName')}
                  <Input
                    value={form.vessel_name}
                    onChange={(event) => setForm({ ...form, vessel_name: event.target.value })}
                  />
                </label>
                <label>
                  {t('sales.shipment.field.containerNo')}
                  <Input
                    value={form.container_no}
                    onChange={(event) => setForm({ ...form, container_no: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('sales.shipment.field.bookingNo')}
                  <Input
                    value={form.booking_no}
                    onChange={(event) => setForm({ ...form, booking_no: event.target.value })}
                  />
                </label>
                <label>
                  {t('sales.shipment.field.documentOwner')}
                  <Input
                    value={form.document_owner_name}
                    onChange={(event) =>
                      setForm({ ...form, document_owner_name: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                {t('sales.shipment.field.estimatedPayableAmount')}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estimated_payable_amount}
                  onChange={(event) =>
                    setForm({ ...form, estimated_payable_amount: event.target.value })
                  }
                />
              </label>
              <label>
                {t('sales.shipment.field.remarks')}
                <Input
                  value={form.remarks}
                  onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                />
              </label>
              <div className="modal-actions">
                <Button onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
                <Button htmlType="submit" loading={submitting} type="primary">
                  {t('sales.shipment.action.generate')}
                </Button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('sales.shipment.detail.title')}
              />
              <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(shipmentPath)}>
                {t('sales.shipment.action.backToList')}
              </Button>
            </div>
            {selectedShipment ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('sales.shipment.detail.statusDate')}</dt>
                    <dd>
                      {shipmentStatusLabel(selectedShipment.approval_status)} /{' '}
                      {formatDate(selectedShipment.shipment_date)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sales.shipment.field.customer')}</dt>
                    <dd>{selectedShipment.customer_name}</dd>
                  </div>
                  <div>
                    <dt>{t('sales.shipment.field.freightMethod')}</dt>
                    <dd>{freightMethodLabel(selectedShipment.shipping_method)}</dd>
                  </div>
                  <div>
                    <dt>{t('sales.shipment.detail.ports')}</dt>
                    <dd>{`${selectedShipment.port_of_loading} -> ${selectedShipment.port_of_destination}`}</dd>
                  </div>
                  <div>
                    <dt>{t('sales.shipment.detail.vesselContainer')}</dt>
                    <dd>
                      {selectedShipment.vessel_name ?? t('sales.shipment.detail.notFilled')} /{' '}
                      {selectedShipment.container_no ?? t('sales.shipment.detail.notFilled')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sales.shipment.field.bookingNo')}</dt>
                    <dd>
                      {selectedShipment.booking_no ?? t('sales.shipment.detail.notFilled')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sales.shipment.field.documentOwner')}</dt>
                    <dd>
                      {selectedShipment.document_owner_name ?? t('sales.shipment.detail.notFilled')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sales.shipment.field.reviewer')}</dt>
                    <dd>{selectedShipment.reviewer_name ?? t('sales.shipment.detail.notApproved')}</dd>
                  </div>
                </dl>

                <div className="transaction-box">
                  <strong>{t('sales.shipment.detail.financeOverview')}</strong>
                  <div className="finance-overview-grid">
                    <Metric
                      label={t('sales.shipment.metric.receivableAmount')}
                      value={formatMoney(
                        selectedShipment.finance_overview.receivable_amount,
                        selectedShipment.finance_overview.currency,
                      )}
                    />
                    <Metric
                      label={t('sales.shipment.metric.expectedPayable')}
                      value={formatMoney(
                        selectedShipment.finance_overview.payable_amount,
                        selectedShipment.finance_overview.currency,
                      )}
                    />
                    <Metric
                      label={t('sales.shipment.metric.expectedProfit')}
                      value={formatMoney(
                        selectedShipment.finance_overview.profit_amount,
                        selectedShipment.finance_overview.currency,
                      )}
                    />
                    <Metric
                      label={t('sales.shipment.metric.profitRate')}
                      value={formatPercent(selectedShipment.finance_overview.profit_rate)}
                    />
                  </div>
                </div>

                <div className="delivery-action-row">
                  {selectedShipment.approval_status === 'draft' ? (
                    <ApprovalAssigneeSelect
                      currentUserId={currentUser.id}
                      onChange={setReviewerId}
                      requiredPermission="sales:shipment:approve"
                      value={reviewerId}
                    />
                  ) : null}
                  <Button
                    disabled={selectedShipment.approval_status !== 'draft' || !reviewerId}
                    loading={submitting}
                    onClick={() => void submitShipmentForApproval()}
                  >
                    {t('sales.shipment.action.submitForApproval')}
                  </Button>
                </div>

                <form
                  className="record-form accessory-form approval-form"
                  onSubmit={approveSelectedShipment}
                >
                  <div className="form-divider">{t('sales.shipment.detail.approvalSection')}</div>
                  <div className="form-pair two">
                    <label>
                      {t('sales.shipment.field.reviewer')}
                      <Input disabled value={selectedShipment.reviewer_name ?? ''} />
                    </label>
                    <label>
                      {t('sales.shipment.field.approvedAt')}
                      <Input
                        type="date"
                        value={approveForm.approved_at}
                        onChange={(event) =>
                          setApproveForm({ ...approveForm, approved_at: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <Button
                    disabled={
                      selectedShipment.approval_status !== 'submitted' ||
                      !canApproveAssignedRecord(
                        currentUser,
                        selectedShipment.reviewer_id,
                        'sales:shipment:approve',
                      )
                    }
                    htmlType="submit"
                    loading={submitting}
                    type="primary"
                  >
                    {t('sales.shipment.action.approve')}
                  </Button>
                  {selectedShipment.approval_status === 'submitted' &&
                  !canApproveAssignedRecord(
                    currentUser,
                    selectedShipment.reviewer_id,
                    'sales:shipment:approve',
                  ) ? (
                    <Alert
                      message={t('sales.shipment.action.waitingApproval', {
                        name: selectedShipment.reviewer_name ?? t('sales.shipment.action.defaultReviewer'),
                      })}
                      showIcon
                      type="info"
                    />
                  ) : null}
                </form>

                <div className="transaction-box">
                  <strong>{t('sales.shipment.detail.reminderTitle')}</strong>
                  <p>{selectedShipment.reminder.message}</p>
                </div>
                <Table<ShipmentReminder>
                  className="compact-section"
                  columns={[
                    {
                      title: t('sales.shipment.field.reminderDate'),
                      dataIndex: 'reminder_date',
                      render: formatDate,
                    },
                    { title: t('sales.shipment.field.shipmentNo'), dataIndex: 'shipment_no' },
                    {
                      title: t('sales.shipment.field.status'),
                      dataIndex: 'status',
                      render: reminderStatusLabel,
                    },
                    { title: t('sales.shipment.field.reminderMessage'), dataIndex: 'message' },
                  ]}
                  dataSource={[selectedShipment.reminder]}
                  locale={{ emptyText: t('sales.shipment.detail.noCurrentReminder') }}
                  pagination={false}
                  rowKey={(item) => `${item.shipment_id}-${item.reminder_date}`}
                  size="small"
                />

                <div className="accessory-heading">
                  <strong>{t('sales.shipment.detail.linesTitle')}</strong>
                  <span>
                    {t('sales.shipment.detail.recordCount', {
                      count: selectedShipment.lines.length,
                    })}
                  </span>
                </div>
                <Table<ShipmentLine>
                  columns={[
                    { title: t('sales.shipment.field.contractNo'), dataIndex: 'contract_no' },
                    {
                      title: t('sales.shipment.field.productCode'),
                      dataIndex: 'product_code',
                      render: nullableText,
                    },
                    { title: t('sales.shipment.field.productName'), dataIndex: 'product_name' },
                    {
                      title: t('sales.shipment.field.specification'),
                      dataIndex: 'specification',
                      render: nullableText,
                    },
                    {
                      title: t('sales.shipment.field.model'),
                      dataIndex: 'model',
                      render: nullableText,
                    },
                    {
                      title: t('sales.shipment.field.shipmentQuantity'),
                      dataIndex: 'quantity',
                      render: (_, line) => `${line.quantity} ${line.unit}`,
                    },
                    {
                      title: t('sales.shipment.field.amount'),
                      dataIndex: 'amount',
                      render: (_, line) => formatMoney(line.amount, selectedShipment.currency),
                    },
                    {
                      title: t('sales.shipment.field.plannedShipDate'),
                      dataIndex: 'planned_ship_date',
                      render: formatDate,
                    },
                  ]}
                  dataSource={selectedShipment.lines}
                  locale={{ emptyText: t('sales.shipment.detail.noLines') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />

                <div className="accessory-heading">
                  <strong>{t('sales.shipment.detail.contractShipmentTitle')}</strong>
                  <span>
                    {t('sales.shipment.detail.recordCount', {
                      count: selectedShipmentRows.length,
                    })}
                  </span>
                </div>
                <Table<ExportContractShipmentStatus & { contract_id: string; contract_no: string }>
                  columns={[
                    { title: t('sales.shipment.field.contractNo'), dataIndex: 'contract_no' },
                    {
                      title: t('sales.shipment.field.productCode'),
                      dataIndex: 'product_code',
                      render: nullableText,
                    },
                    { title: t('sales.shipment.field.productName'), dataIndex: 'product_name' },
                    { title: t('sales.shipment.field.contractQuantity'), dataIndex: 'total_quantity' },
                    { title: t('sales.shipment.field.shippedQuantity'), dataIndex: 'shipped_quantity' },
                    { title: t('sales.shipment.field.unshippedQuantity'), dataIndex: 'unshipped_quantity' },
                    {
                      title: t('sales.shipment.field.unshippedAmount'),
                      dataIndex: 'unshipped_amount',
                      render: (_, item) =>
                        formatMoney(item.unshipped_amount, selectedShipment.currency),
                    },
                    {
                      title: t('sales.shipment.field.status'),
                      dataIndex: 'status',
                      render: contractProgressStatusLabel,
                    },
                  ]}
                  dataSource={selectedShipmentRows}
                  locale={{ emptyText: t('sales.shipment.detail.noContractShipments') }}
                  pagination={false}
                  rowKey={(item) =>
                    `${item.contract_id}-${item.product_id ?? item.product_code ?? item.product_name}-shipment`
                  }
                  size="small"
                />

                <div className="accessory-heading">
                  <strong>{t('sales.shipment.detail.contractPurchaseTitle')}</strong>
                  <span>
                    {t('sales.shipment.detail.recordCount', {
                      count: selectedPurchaseRows.length,
                    })}
                  </span>
                </div>
                <Table<ExportContractPurchaseStatus & { contract_id: string; contract_no: string }>
                  columns={[
                    { title: t('sales.shipment.field.contractNo'), dataIndex: 'contract_no' },
                    {
                      title: t('sales.shipment.field.productCode'),
                      dataIndex: 'product_code',
                      render: nullableText,
                    },
                    { title: t('sales.shipment.field.productName'), dataIndex: 'product_name' },
                    { title: t('sales.shipment.field.contractQuantity'), dataIndex: 'total_quantity' },
                    { title: t('sales.shipment.field.purchasedQuantity'), dataIndex: 'purchased_quantity' },
                    { title: t('sales.shipment.field.unpurchasedQuantity'), dataIndex: 'unpurchased_quantity' },
                    {
                      title: t('sales.shipment.field.status'),
                      dataIndex: 'status',
                      render: contractProgressStatusLabel,
                    },
                  ]}
                  dataSource={selectedPurchaseRows}
                  locale={{ emptyText: t('sales.shipment.detail.noContractPurchases') }}
                  pagination={false}
                  rowKey={(item) =>
                    `${item.contract_id}-${item.product_id ?? item.product_code ?? item.product_name}-purchase`
                  }
                  size="small"
                />

                <div className="accessory-heading">
                  <strong>{t('sales.shipment.detail.reminderListTitle')}</strong>
                  <span>
                    {t('sales.shipment.detail.recordCount', { count: reminders.length })}
                  </span>
                </div>
                <Table<ShipmentReminder>
                  columns={[
                    {
                      title: t('sales.shipment.field.reminderDate'),
                      dataIndex: 'reminder_date',
                      render: formatDate,
                    },
                    { title: t('sales.shipment.field.shipmentNo'), dataIndex: 'shipment_no' },
                    {
                      title: t('sales.shipment.field.status'),
                      dataIndex: 'status',
                      render: reminderStatusLabel,
                    },
                    { title: t('sales.shipment.field.reminderMessage'), dataIndex: 'message' },
                  ]}
                  dataSource={reminders}
                  locale={{ emptyText: t('sales.shipment.detail.noReminders') }}
                  pagination={false}
                  rowKey={(item) => `${item.shipment_id}-${item.reminder_date}`}
                  size="small"
                />
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <Ship size={28} />
                <strong>{t('sales.shipment.detail.emptyTitle')}</strong>
                <span>{t('sales.shipment.detail.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
