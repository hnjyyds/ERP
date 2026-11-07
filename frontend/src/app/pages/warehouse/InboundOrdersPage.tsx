import { Alert, Button, Descriptions as _Descriptions, Input, Modal, Select, Skeleton as _Skeleton, Table, Tag as _Tag } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, Warehouse , CheckCircle2, PackagePlus, Send} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { approveInboundOrder, cancelInboundOrder, generateInboundOrderFromPlan, listAssignableUsers, listInboundOrders, listPurchaseContracts, submitInboundOrder, type AssignableUser, type CurrentUser, type InboundOrder, type InboundOrderApprovePayload, type InboundOrderGeneratePayload , InboundPlan, InventoryBalance, InventoryLedger, listInboundPlans, listInventoryBalances, listInventoryLedgers} from '../../../api'
import { warehouseInboundOrderPath, moduleDetailPath } from '../../routes'
import { FormModal, FormSelect, Metric, PanelTitle, RemoteSelect } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { inboundOrderStatusOptions, inboundOrderModeOptions , inboundPlanStatusOptions} from '../../../shared/formOptions'
import { formatDate, formatMoney as _formatMoney, formatQuantity as _formatQuantity, nullableText as _nullableText, todayInputValue, type RoutedDetailPageProps , trimDecimal} from '../appHelpers'
import { t } from '../../appI18n'

function inboundPlanStatusLabel(value: string): string {
  const option = inboundPlanStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function inboundPlanOptionSearchText(plan: InboundPlan): string {
  return [plan.purchase_contract_no, plan.supplier_name, plan.code, inboundPlanStatusLabel(plan.status)]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
}


type InboundOrderFormState = {
  plan_id: string
  inbound_mode: string
  inbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

const inboundWarehouseOptions = [
  {
    value: 'wh-factory',
    label: '工厂',
    labelKey: 'warehouse.inboundOrder.warehouseOption.factory',
  },
  {
    value: 'wh-company',
    label: '公司仓库',
    labelKey: 'warehouse.inboundOrder.warehouseOption.company',
  },
] as const

function inboundWarehouseOption(warehouseId?: string | null, warehouseName?: string | null) {
  return warehouseId === 'wh-factory' || warehouseName?.includes('工厂')
    ? inboundWarehouseOptions[0]
    : inboundWarehouseOptions[1]
}

type InboundOrderApprovalFormState = {
  reviewer_id: string
  reviewer_name: string
  approved_at: string
}


function initialInboundOrderForm(): InboundOrderFormState {
  return {
    plan_id: '',
    inbound_mode: 'formal',
    inbound_at: todayInputValue(),
    warehouse_id: 'wh-company',
    warehouse_name: '公司仓库',
    location_id: 'loc-a-01',
    location_name: '',
    operator_name: '',
  }
}

function initialInboundOrderApprovalForm(): InboundOrderApprovalFormState {
  return {
    reviewer_id: '',
    reviewer_name: '',
    approved_at: todayInputValue(),
  }
}

function assignableUserOptionLabel(user: AssignableUser): string {
  return [user.display_name, user.username, user.department_name].filter(Boolean).join(' / ')
}

function inboundOrderFormForPlan(
  plan: InboundPlan,
  current: InboundOrderFormState,
): InboundOrderFormState {
  const warehouse = inboundWarehouseOption(plan.warehouse_id, plan.warehouse_name)
  return {
    ...current,
    plan_id: plan.id,
    inbound_at: plan.planned_date,
    warehouse_id: warehouse.value,
    warehouse_name: warehouse.label,
    location_id: plan.location_id ?? 'loc-a-01',
    location_name: plan.location_name ?? '',
    operator_name: plan.operator_name ?? '',
  }
}

function inboundOrderToForm(order: InboundOrder): InboundOrderFormState {
  const warehouse = inboundWarehouseOption(order.warehouse_id, order.warehouse_name)
  return {
    plan_id: order.plan_id,
    inbound_mode: order.inbound_mode,
    inbound_at: order.inbound_at,
    warehouse_id: warehouse.value,
    warehouse_name: warehouse.label,
    location_id: order.location_id,
    location_name: order.location_name,
    operator_name: order.operator_name,
  }
}

function inboundOrderPayload(form: InboundOrderFormState): InboundOrderGeneratePayload {
  return {
    plan_id: form.plan_id.trim(),
    inbound_mode: form.inbound_mode,
    inbound_at: form.inbound_at,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    operator_name: form.operator_name.trim(),
    lines: [],
  }
}

function inboundOrderApprovePayload(
  form: InboundOrderApprovalFormState,
): InboundOrderApprovePayload {
  return {
    approved_at: form.approved_at,
  }
}

function inboundOrderModeLabel(value: string): string {
  const option = inboundOrderModeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function inboundOrderStatusLabel(value: string): string {
  const option = inboundOrderStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function stockStatusLabel(value: string): string {
  if (value === 'available') return t('warehouse.inboundOrder.detail.stockStatusAvailable')
  if (value === 'pending_inspection')
    return t('warehouse.inboundOrder.detail.stockStatusPendingInspection')
  return value
}

function inventoryDirectionLabel(value: string): string {
  if (value === 'in') return t('warehouse.inboundOrder.detail.directionIn')
  if (value === 'out') return t('warehouse.inboundOrder.detail.directionOut')
  return value
}


type InboundOrdersPageProps = RoutedDetailPageProps & {
  currentUser: CurrentUser
}

export function InboundOrdersPage({ currentUser, detailId, onNavigate }: InboundOrdersPageProps) {
  const [orders, setOrders] = useState<InboundOrder[]>([])
  const [inboundPlans, setInboundPlans] = useState<InboundPlan[]>([])
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([])
  const [inventoryLedgers, setInventoryLedgers] = useState<InventoryLedger[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [inventorySearch, setInventorySearch] = useState('')
  const [form, setForm] = useState<InboundOrderFormState>(() => initialInboundOrderForm())
  const [approvalForm, setApprovalForm] = useState<InboundOrderApprovalFormState>(() =>
    initialInboundOrderApprovalForm(),
  )
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [inboundOrderModalOpen, setInboundOrderModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)
  const [assignableUsersLoaded, setAssignableUsersLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')

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
        description: t('warehouse.inboundOrder.list.supplierOptionDescription', { code: item.code }),
      })
    })
    return [...suppliers.values()].slice(0, 20)
  }, [])

  const fetchContractOptions = useCallback(
    async (query: string) => {
      const result = await listPurchaseContracts({
        q: query.trim() || undefined,
        approval_status: 'approved',
        supplier_id: supplierFilter || undefined,
      })
      return result.items.slice(0, 20).map((item) => ({
        value: item.id,
        label: item.code,
        description: t('warehouse.inboundOrder.list.contractOptionDescription', {
          supplier: item.supplier_name,
          orderDate: item.contract_date,
          deliveryDate: item.delivery_date,
        }),
      }))
    },
    [supplierFilter],
  )

  const selectedOrder = useMemo(
    () => {
      if (detailId) return orders.find((item) => item.id === detailId) ?? null
      return orders.find((item) => item.id === selectedOrderId) ?? orders[0] ?? null
    },
    [detailId, orders, selectedOrderId],
  )
  const selectedInboundPlan = useMemo(
    () => inboundPlans.find((item) => item.id === form.plan_id) ?? null,
    [form.plan_id, inboundPlans],
  )
  const canGenerateFromSelectedPlan = Boolean(
    selectedInboundPlan && !['closed', 'cancelled'].includes(selectedInboundPlan.status),
  )

  useEffect(() => {
    void loadInboundOrders()
  }, [])

  useEffect(() => {
    if (!inboundOrderModalOpen || assignableUsersLoaded || loadingAssignableUsers) return
    void loadAssignableUsersForApproval()
  }, [inboundOrderModalOpen, assignableUsersLoaded, loadingAssignableUsers])

  useEffect(() => {
    if (!selectedOrder) return
    setForm(inboundOrderToForm(selectedOrder))
    setApprovalForm({
      reviewer_id: selectedOrder.reviewer_id ?? '',
      reviewer_name: selectedOrder.reviewer_name ?? '',
      approved_at: selectedOrder.approved_at ?? selectedOrder.inbound_at,
    })
  }, [selectedOrder?.id, selectedOrder?.status])

  useEffect(() => {
    if (detailId && orders.length > 0 && !orders.some((item) => item.id === detailId)) {
      onNavigate(warehouseInboundOrderPath)
    }
  }, [detailId, onNavigate, orders])

  async function loadInboundOrders(
    preferredOrderId?: string,
    preferredOrder?: InboundOrder,
    inventoryQuery?: string,
  ) {
    setLoading(true)
    try {
      const [orderResult, planOptions] = await Promise.all([
        listInboundOrders({
          q: preferredOrder?.code ?? (search.trim() || undefined),
          status: statusFilter || undefined,
          inbound_mode: modeFilter || undefined,
          supplier_id: supplierFilter.trim() || undefined,
          purchase_contract_id: contractFilter.trim() || undefined,
        }),
        loadInboundOrderPlanOptions(),
      ])
      const nextOrders = preferredOrder
        ? [preferredOrder, ...orderResult.items.filter((item) => item.id !== preferredOrder.id)]
        : orderResult.items
      const nextSelectedId =
        preferredOrderId ??
        (nextOrders.some((item) => item.id === selectedOrderId) ? selectedOrderId : null) ??
        nextOrders[0]?.id ??
        null
      const nextOrder = nextOrders.find((item) => item.id === nextSelectedId) ?? null
      setOrders(nextOrders)
      setInboundPlans(planOptions)
      setSelectedOrderId(nextSelectedId)
      if (!nextOrder && planOptions[0]) {
        setForm((current) => inboundOrderFormForPlan(planOptions[0], current))
      }
      await loadInventorySnapshotForOrder(nextOrder, inventoryQuery)
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadInboundOrderPlanOptions(): Promise<InboundPlan[]> {
    const [allPlans, scheduledPlans, plannedPlans] = await Promise.all([
      listInboundPlans({}),
      listInboundPlans({ status: 'scheduled' }),
      listInboundPlans({ status: 'planned' }),
    ])
    const planById = new Map<string, InboundPlan>()
    for (const plan of [...scheduledPlans.items, ...plannedPlans.items, ...allPlans.items]) {
      planById.set(plan.id, plan)
    }
    return [...planById.values()]
  }

  async function loadAssignableUsersForApproval() {
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers('warehouse:inbound_order:approve')
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.reviewerLoadFailed'))
    } finally {
      setAssignableUsersLoaded(true)
      setLoadingAssignableUsers(false)
    }
  }

  function applyReviewer(userId: string) {
    const user = assignableUsers.find((item) => item.id === userId)
    setApprovalForm((current) => ({
      ...current,
      reviewer_id: user?.id ?? '',
      reviewer_name: user?.display_name ?? '',
    }))
  }

  async function loadInventorySnapshotForOrder(
    order: InboundOrder | null = selectedOrder,
    inventoryQuery?: string,
  ) {
    const query =
      inventoryQuery ??
      (inventorySearch.trim() ||
        search.trim() ||
        order?.lines[0]?.product_code ||
        order?.lines[0]?.product_name ||
        undefined)
    const [balances, ledgers] = await Promise.all([
      listInventoryBalances({ q: query }),
      listInventoryLedgers({
        q: query,
        source_id: order?.id,
      }),
    ])
    setInventoryBalances(balances.items)
    setInventoryLedgers(ledgers.items)
  }

  async function refreshInventorySnapshot(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    try {
      await loadInventorySnapshotForOrder(selectedOrder)
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.inventoryLoadFailed'))
    }
  }

  function handleInboundOrderPlanChange(planId: string) {
    const plan = inboundPlans.find((item) => item.id === planId)
    setForm((current) => (plan ? inboundOrderFormForPlan(plan, current) : { ...current, plan_id: planId }))
  }

  function handleInboundWarehouseChange(warehouseId: string) {
    const warehouse = inboundWarehouseOption(warehouseId)
    setForm((current) => ({
      ...current,
      warehouse_id: warehouse.value,
      warehouse_name: warehouse.label,
    }))
  }

  function upsertInboundOrder(order: InboundOrder) {
    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id)
      return exists ? current.map((item) => (item.id === order.id ? order : item)) : [order, ...current]
    })
    setSelectedOrderId(order.id)
  }

  function openInboundOrderDetail(order: InboundOrder) {
    setSelectedOrderId(order.id)
    onNavigate(moduleDetailPath(warehouseInboundOrderPath, order.id))
  }

  function openInboundOrderModal() {
    setForm(
      selectedOrder
        ? inboundOrderToForm(selectedOrder)
        : inboundPlans[0]
          ? inboundOrderFormForPlan(inboundPlans[0], initialInboundOrderForm())
          : initialInboundOrderForm(),
    )
    setApprovalForm(
      selectedOrder
        ? {
            reviewer_id: selectedOrder.reviewer_id ?? '',
            reviewer_name: selectedOrder.reviewer_name ?? '',
            approved_at: selectedOrder.approved_at ?? selectedOrder.inbound_at,
          }
        : initialInboundOrderApprovalForm(),
    )
    setInboundOrderModalOpen(true)
  }

  function stopAndOpenInboundOrderDetail(event: MouseEvent<HTMLElement>, order: InboundOrder) {
    event.stopPropagation()
    openInboundOrderDetail(order)
  }

  async function generateInboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const order = await generateInboundOrderFromPlan(inboundOrderPayload(form))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setSearch(order.code)
      setStatusFilter('')
      setContractFilter(order.purchase_contract_id)
      setInventorySearch(inventoryQuery)
      upsertInboundOrder(order)
      setInboundOrderModalOpen(false)
      await loadInboundOrders(order.id, order, inventoryQuery)
      setMessage(t('warehouse.inboundOrder.message.generated', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.generateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSelectedInboundOrder() {
    if (!selectedOrder) return
    if (!approvalForm.reviewer_id) {
      showError(new Error(t('warehouse.inboundOrder.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const order = await submitInboundOrder(selectedOrder.id, {
        reviewer_id: approvalForm.reviewer_id,
      })
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      upsertInboundOrder(order)
      await loadInboundOrders(order.id, order, inventoryQuery)
      setMessage(t('warehouse.inboundOrder.message.submitted', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openCancelModal() {
    setCancelReason('')
    setCancelReasonError('')
    setCancelModalOpen(true)
  }

  async function cancelSelectedInboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    const reason = cancelReason.trim()
    if (!reason) {
      setCancelReasonError(t('warehouse.inboundOrder.validation.cancelReasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const order = await cancelInboundOrder(selectedOrder.id, { reason })
      upsertInboundOrder(order)
      setCancelModalOpen(false)
      await loadInboundOrders(order.id, order)
      setMessage(t('warehouse.inboundOrder.message.cancelled', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.cancelFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedInboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    if (selectedOrder.status !== 'submitted') return
    if (selectedOrder.reviewer_id !== currentUser.id) {
      showError(
        new Error(
          t('warehouse.inboundOrder.validation.reviewerMismatch', {
            name: selectedOrder.reviewer_name ?? t('warehouse.inboundOrder.detail.reviewerFallback'),
          }),
        ),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const order = await approveInboundOrder(selectedOrder.id, inboundOrderApprovePayload(approvalForm))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setStatusFilter('approved')
      setInventorySearch(inventoryQuery)
      upsertInboundOrder(order)
      setInboundOrderModalOpen(false)
      await loadInboundOrders(order.id, order, inventoryQuery)
      setMessage(
        order.inbound_mode === 'formal'
          ? t('warehouse.inboundOrder.message.approvedFormal', { code: order.code })
          : t('warehouse.inboundOrder.message.approvedInspection', { code: order.code }),
      )
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const draftCount = orders.filter((item) => item.status === 'draft').length
  const submittedCount = orders.filter((item) => item.status === 'submitted').length
  const approvedCount = orders.filter((item) => item.status === 'approved').length
  const availableQuantity = inventoryBalances.reduce(
    (sum, item) => sum + Number(item.available_quantity || 0),
    0,
  )
  const pendingQuantity = inventoryBalances.reduce(
    (sum, item) => sum + Number(item.pending_inspection_quantity || 0),
    0,
  )

  return (
    <section className="inbound-order-page">
<div className="summary-strip" aria-label={t('warehouse.inboundOrder.metric.overviewAria')}>
        <Metric label={t('warehouse.inboundOrder.metric.orderCount')} value={orders.length} />
        <Metric label={t('warehouse.inboundOrder.metric.draftCount')} value={draftCount} />
        <Metric label={t('warehouse.inboundOrder.metric.submittedCount')} value={submittedCount} intent={submittedCount > 0 ? 'warning' : 'normal'} />
        <Metric label={t('warehouse.inboundOrder.metric.approvedCount')} value={approvedCount} />
        <Metric label={t('warehouse.inboundOrder.metric.availableQuantity')} value={availableQuantity.toFixed(2)} />
        <Metric label={t('warehouse.inboundOrder.metric.pendingQuantity')} value={pendingQuantity.toFixed(2)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}

      <section className="business-grid inbound-order-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title={t('warehouse.inboundOrder.list.title')} />
            <form
              className="inline-filters single-line-filter-toolbar"
              onSubmit={(event) => {
                event.preventDefault()
                void loadInboundOrders()
              }}
            >
              <label>
                {t('warehouse.inboundOrder.list.searchLabel')}
                <Input
                  value={search}
                  placeholder={t('warehouse.inboundOrder.list.searchPlaceholder')}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor="inbound-order-status-filter">
                {t('warehouse.inboundOrder.list.statusFilter')}
                <FormSelect
                  id="inbound-order-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">{t('warehouse.inboundOrder.list.allStatuses')}</option>
                  {inboundOrderStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="inbound-order-mode-filter">
                {t('warehouse.inboundOrder.list.modeFilter')}
                <FormSelect
                  id="inbound-order-mode-filter"
                  value={modeFilter}
                  onChange={(event) => setModeFilter(event.target.value)}
                >
                  <option value="">{t('warehouse.inboundOrder.list.allModes')}</option>
                  {inboundOrderModeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label className="entity-search-filter">
                {t('warehouse.inboundOrder.list.supplierFilter')}
                <RemoteSelect
                  ariaLabel={t('warehouse.inboundOrder.list.supplierFilterAria')}
                  fetchOptions={fetchSupplierOptions}
                  placeholder={t('warehouse.inboundOrder.list.supplierFilterPlaceholder')}
                  value={supplierFilter || null}
                  onChange={(value) => {
                    setSupplierFilter(value)
                    setContractFilter('')
                  }}
                />
              </label>
              <label className="entity-search-filter">
                {t('warehouse.inboundOrder.list.contractFilter')}
                <RemoteSelect
                  ariaLabel={t('warehouse.inboundOrder.list.contractFilterAria')}
                  fetchOptions={fetchContractOptions}
                  placeholder={t('warehouse.inboundOrder.list.contractFilterPlaceholder')}
                  value={contractFilter || null}
                  onChange={setContractFilter}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                {t('warehouse.inboundOrder.list.query')}
              </Button>
              <Button htmlType="button" type="primary" icon={<Plus size={16} />} onClick={openInboundOrderModal}>
                {t('warehouse.inboundOrder.list.generateOrApprove')}
              </Button>
            </form>
          </div>

          <Table<InboundOrder>
            columns={[
              {
                title: t('warehouse.inboundOrder.field.code'),
                dataIndex: 'code',
                render: (value: string, record: InboundOrder) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenInboundOrderDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              {
                title: t('warehouse.inboundOrder.field.status'),
                dataIndex: 'status',
                render: inboundOrderStatusLabel,
              },
              {
                title: t('warehouse.inboundOrder.field.mode'),
                dataIndex: 'inbound_mode',
                render: inboundOrderModeLabel,
              },
              {
                title: t('warehouse.inboundOrder.field.purchaseContract'),
                dataIndex: 'purchase_contract_no',
              },
              { title: t('warehouse.inboundOrder.field.supplier'), dataIndex: 'supplier_name' },
              {
                title: t('warehouse.inboundOrder.field.inboundDate'),
                dataIndex: 'inbound_at',
                render: formatDate,
              },
              {
                title: t('warehouse.inboundOrder.field.location'),
                dataIndex: 'location_name',
                render: (_, order) => `${order.warehouse_name} / ${order.location_name}`,
              },
              {
                title: t('warehouse.inboundOrder.field.entry'),
                key: 'detail',
                width: 110,
                render: (_: unknown, record: InboundOrder) => (
                  <Button size="small" onClick={(event) => stopAndOpenInboundOrderDetail(event, record)}>
                    {t('warehouse.inboundOrder.action.viewDetail')}
                  </Button>
                ),
              },
            ]}
            dataSource={orders}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedOrder?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedOrderId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={inboundOrderModalOpen}
          title={t('warehouse.inboundOrder.form.modalTitle')}
          width={980}
          onCancel={() => setInboundOrderModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<Warehouse size={18} />} title={t('warehouse.inboundOrder.form.sectionTitle')} />
          <form className="record-form" onSubmit={generateInboundOrder}>
            <div className="form-divider">{t('warehouse.inboundOrder.form.fromPlan')}</div>
            <label htmlFor="inbound-order-plan-id">
              {t('warehouse.inboundOrder.field.purchaseOrderNo')}
              <Select
                allowClear
                aria-label={t('warehouse.inboundOrder.field.purchaseOrderNo')}
                id="inbound-order-plan-id"
                showSearch
                value={form.plan_id || undefined}
                placeholder={t('warehouse.inboundOrder.form.planSearchPlaceholder')}
                optionLabelProp="label"
                filterOption={(input, option) => {
                  const plan = inboundPlans.find((item) => item.id === option?.value)
                  if (plan) return inboundPlanOptionSearchText(plan).includes(input.toLocaleLowerCase())
                  return selectedOrder?.purchase_contract_no
                    .toLocaleLowerCase()
                    .includes(input.toLocaleLowerCase()) ?? false
                }}
                notFoundContent={t('warehouse.inboundOrder.form.noAvailablePurchaseOrders')}
                onChange={(value) => handleInboundOrderPlanChange(value ?? '')}
              >
                {form.plan_id &&
                !inboundPlans.some((plan) => plan.id === form.plan_id) &&
                selectedOrder?.plan_id === form.plan_id ? (
                  <Select.Option
                    key={form.plan_id}
                    value={form.plan_id}
                    label={selectedOrder.purchase_contract_no}
                    disabled
                  >
                    <div className="remote-select-option">
                      <span className="remote-select-option-title">
                        {selectedOrder.purchase_contract_no}
                      </span>
                      <span className="remote-select-option-desc">{t('warehouse.inboundOrder.form.currentOrderLink')}</span>
                    </div>
                  </Select.Option>
                ) : null}
                {inboundPlans.map((plan) => (
                  <Select.Option
                    key={plan.id}
                    value={plan.id}
                    label={plan.purchase_contract_no}
                    disabled={['closed', 'cancelled'].includes(plan.status)}
                  >
                    <div className="remote-select-option">
                      <span className="remote-select-option-title">{plan.purchase_contract_no}</span>
                      <span className="remote-select-option-desc">
                        {t('warehouse.inboundOrder.form.planOptionDescription', {
                          supplier: plan.supplier_name,
                          code: plan.code,
                          status: inboundPlanStatusLabel(plan.status),
                        })}
                      </span>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </label>
            <label htmlFor="inbound-order-code">
              {t('warehouse.inboundOrder.field.code')}
              <Input
                id="inbound-order-code"
                readOnly
                value=""
                placeholder={t('warehouse.inboundOrder.form.codeAutoGenerated')}
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="inbound-order-mode">
                {t('warehouse.inboundOrder.field.inboundMode')}
                <FormSelect
                  id="inbound-order-mode"
                  value={form.inbound_mode}
                  onChange={(event) => setForm({ ...form, inbound_mode: event.target.value })}
                >
                  {inboundOrderModeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="inbound-order-date">
                {t('warehouse.inboundOrder.field.inboundAt')}
                <Input
                  id="inbound-order-date"
                  required
                  type="date"
                  value={form.inbound_at}
                  onChange={(event) => setForm({ ...form, inbound_at: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="inbound-order-warehouse-id">
                {t('warehouse.inboundOrder.field.warehouseId')}
                <Input
                  id="inbound-order-warehouse-id"
                  readOnly
                  required
                  value={form.warehouse_id}
                />
              </label>
              <label htmlFor="inbound-order-warehouse-name">
                {t('warehouse.inboundOrder.field.warehouse')}
                <FormSelect
                  id="inbound-order-warehouse-name"
                  required
                  value={form.warehouse_id}
                  onChange={(event) => handleInboundWarehouseChange(event.target.value)}
                >
                  {inboundWarehouseOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="inbound-order-location-id">
                {t('warehouse.inboundOrder.field.locationId')}
                <Input
                  id="inbound-order-location-id"
                  required
                  value={form.location_id}
                  onChange={(event) => setForm({ ...form, location_id: event.target.value })}
                />
              </label>
              <label htmlFor="inbound-order-location-name">
                {t('warehouse.inboundOrder.field.location')}
                <Input
                  id="inbound-order-location-name"
                  required
                  value={form.location_name}
                  onChange={(event) => setForm({ ...form, location_name: event.target.value })}
                />
              </label>
            </div>
            <label htmlFor="inbound-order-operator">
              {t('warehouse.inboundOrder.field.operator')}
              <Input
                id="inbound-order-operator"
                required
                value={form.operator_name}
                onChange={(event) => setForm({ ...form, operator_name: event.target.value })}
              />
            </label>
            <Button
              disabled={!canGenerateFromSelectedPlan}
              htmlType="submit"
              icon={<PackagePlus size={16} />}
              loading={submitting}
            >
              {t('warehouse.inboundOrder.action.generate')}
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={approveSelectedInboundOrder}>
            <div className="form-divider">{t('warehouse.inboundOrder.form.submitSection')}</div>
            <Button
              disabled={!selectedOrder || selectedOrder.status !== 'draft'}
              htmlType="button"
              icon={<Send size={16} />}
              loading={submitting}
              onClick={() => void submitSelectedInboundOrder()}
            >
              {t('warehouse.inboundOrder.action.submit')}
            </Button>
            <div className="form-pair two">
              <label htmlFor="inbound-order-reviewer">
                {t('warehouse.inboundOrder.field.reviewer')}
                <Select
                  id="inbound-order-reviewer"
                  aria-label={t('warehouse.inboundOrder.field.reviewer')}
                  showSearch
                  loading={loadingAssignableUsers}
                  disabled={selectedOrder?.status !== 'draft'}
                  value={approvalForm.reviewer_id || undefined}
                  placeholder={
                    loadingAssignableUsers
                      ? t('warehouse.inboundOrder.form.reviewerLoading')
                      : approvalForm.reviewer_name
                        ? t('warehouse.inboundOrder.form.reviewerHistorical', {
                            name: approvalForm.reviewer_name,
                          })
                        : t('warehouse.inboundOrder.form.reviewerPlaceholder')
                  }
                  optionFilterProp="label"
                  notFoundContent={
                    loadingAssignableUsers
                      ? t('warehouse.inboundOrder.form.reviewerLoadingOptions')
                      : t('warehouse.inboundOrder.form.reviewerEmpty')
                  }
                  onChange={applyReviewer}
                >
                  {approvalForm.reviewer_id &&
                  !assignableUsers.some((user) => user.id === approvalForm.reviewer_id) ? (
                    <Select.Option
                      key={approvalForm.reviewer_id}
                      value={approvalForm.reviewer_id}
                      label={t('warehouse.inboundOrder.form.reviewerHistoricalLabel', {
                        name: approvalForm.reviewer_name,
                      })}
                      disabled
                    >
                      {t('warehouse.inboundOrder.form.reviewerHistoricalLabel', {
                        name: approvalForm.reviewer_name,
                      })}
                    </Select.Option>
                  ) : null}
                  {assignableUsers.map((user) => {
                    const label = assignableUserOptionLabel(user)
                    return (
                      <Select.Option key={user.id} value={user.id} label={label}>
                        {label}
                      </Select.Option>
                    )
                  })}
                </Select>
              </label>
              <label htmlFor="inbound-order-approved-at">
                {t('warehouse.inboundOrder.field.approvedAt')}
                <Input
                  id="inbound-order-approved-at"
                  required
                  type="date"
                  value={approvalForm.approved_at}
                  onChange={(event) =>
                    setApprovalForm({ ...approvalForm, approved_at: event.target.value })
                  }
                />
              </label>
            </div>
            <Button
              disabled={
                !selectedOrder ||
                selectedOrder.status !== 'submitted' ||
                selectedOrder.reviewer_id !== currentUser.id
              }
              htmlType="submit"
              icon={<CheckCircle2 size={16} />}
              loading={submitting}
              type="primary"
            >
              {t('warehouse.inboundOrder.action.approve')}
            </Button>
            {selectedOrder?.status === 'submitted' &&
            selectedOrder.reviewer_id !== currentUser.id ? (
              <Alert
                showIcon
                type="info"
                message={t('warehouse.inboundOrder.message.waitingApproval', {
                  name:
                    selectedOrder.reviewer_name ??
                    t('warehouse.inboundOrder.detail.reviewerFallback'),
                })}
              />
            ) : null}
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title={t('warehouse.inboundOrder.detail.title')} />
            <div className="toolbar-actions">
              {selectedOrder && ['draft', 'submitted'].includes(selectedOrder.status) ? (
                <Button danger onClick={openCancelModal}>
                  {t('warehouse.inboundOrder.action.cancel')}
                </Button>
              ) : null}
              <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(warehouseInboundOrderPath)}>
                {t('warehouse.inboundOrder.action.backToList')}
              </Button>
            </div>
          </div>
          {selectedOrder ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>{t('warehouse.inboundOrder.field.purchaseContract')}</dt>
                  <dd>{selectedOrder.purchase_contract_no}</dd>
                </div>
                <div>
                  <dt>{t('warehouse.inboundOrder.field.supplier')}</dt>
                  <dd>{selectedOrder.supplier_name}</dd>
                </div>
                <div>
                  <dt>{t('warehouse.inboundOrder.field.inboundMode')}</dt>
                  <dd>{inboundOrderModeLabel(selectedOrder.inbound_mode)}</dd>
                </div>
                <div>
                  <dt>{t('warehouse.inboundOrder.list.statusFilter')}</dt>
                  <dd>{inboundOrderStatusLabel(selectedOrder.status)}</dd>
                </div>
                <div>
                  <dt>{t('warehouse.inboundOrder.field.inboundAt')}</dt>
                  <dd>{formatDate(selectedOrder.inbound_at)}</dd>
                </div>
                <div>
                  <dt>{t('warehouse.inboundOrder.field.location')}</dt>
                  <dd>{selectedOrder.warehouse_name} / {selectedOrder.location_name}</dd>
                </div>
                {selectedOrder.status === 'cancelled' ? (
                  <>
                    <div>
                      <dt>{t('warehouse.inboundOrder.detail.cancelledAt')}</dt>
                      <dd>{selectedOrder.cancelled_at ? formatDate(selectedOrder.cancelled_at) : '-'}</dd>
                    </div>
                    <div>
                      <dt>{t('warehouse.inboundOrder.detail.cancelledBy')}</dt>
                      <dd>{selectedOrder.cancelled_by_name ?? '-'}</dd>
                    </div>
                    <div>
                      <dt>{t('warehouse.inboundOrder.detail.cancelReason')}</dt>
                      <dd>{selectedOrder.cancel_reason ?? '-'}</dd>
                    </div>
                  </>
                ) : null}
              </dl>

              <div className="accessory-heading">
                <strong>{t('warehouse.inboundOrder.detail.linesTitle')}</strong>
                <span>
                  {t('warehouse.inboundOrder.detail.lineCount', {
                    count: selectedOrder.lines.length,
                  })}
                </span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>{t('warehouse.inboundOrder.field.product')}</th>
                    <th>{t('warehouse.inboundOrder.field.specification')}</th>
                    <th>{t('warehouse.inboundOrder.field.quantity')}</th>
                    <th>{t('warehouse.inboundOrder.field.stockStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_code ?? '-'} {line.product_name}</td>
                      <td>{line.specification ?? line.model ?? t('common.notSet')}</td>
                      <td>{trimDecimal(line.quantity)} {line.unit}</td>
                      <td>{stockStatusLabel(line.stock_status)}</td>
                    </tr>
                  ))}
                  {selectedOrder.lines.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={4}>
                        {t('warehouse.inboundOrder.detail.noLines')}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <form className="inline-filters inline-search inventory-search-form" onSubmit={refreshInventorySnapshot}>
                <label>
                  {t('warehouse.inboundOrder.detail.inventorySearchLabel')}
                  <Input
                    value={inventorySearch}
                    placeholder={t('warehouse.inboundOrder.detail.inventorySearchPlaceholder')}
                    onChange={(event) => setInventorySearch(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('warehouse.inboundOrder.action.searchInventory')}
                </Button>
              </form>

              <div className="accessory-heading">
                <strong>{t('warehouse.inboundOrder.detail.balancesTitle')}</strong>
                <span>
                  {t('warehouse.inboundOrder.detail.balanceCount', {
                    count: inventoryBalances.length,
                  })}
                </span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>{t('warehouse.inboundOrder.field.product')}</th>
                    <th>{t('warehouse.inboundOrder.field.location')}</th>
                    <th>{t('warehouse.inboundOrder.field.available')}</th>
                    <th>{t('warehouse.inboundOrder.field.pendingInspection')}</th>
                    <th>{t('warehouse.inboundOrder.field.locked')}</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryBalances.map((balance) => (
                    <tr key={balance.id}>
                      <td>{balance.product_code ?? '-'} {balance.product_name}</td>
                      <td>{balance.warehouse_name} / {balance.location_name}</td>
                      <td>{trimDecimal(balance.available_quantity)} {balance.unit}</td>
                      <td>{trimDecimal(balance.pending_inspection_quantity)} {balance.unit}</td>
                      <td>{trimDecimal(balance.locked_quantity)} {balance.unit}</td>
                    </tr>
                  ))}
                  {inventoryBalances.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        {t('warehouse.inboundOrder.detail.noBalances')}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>{t('warehouse.inboundOrder.detail.ledgersTitle')}</strong>
                <span>
                  {t('warehouse.inboundOrder.detail.ledgerCount', {
                    count: inventoryLedgers.length,
                  })}
                </span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>{t('warehouse.inboundOrder.field.date')}</th>
                    <th>{t('warehouse.inboundOrder.field.direction')}</th>
                    <th>{t('warehouse.inboundOrder.field.product')}</th>
                    <th>{t('warehouse.inboundOrder.field.quantity')}</th>
                    <th>{t('warehouse.inboundOrder.field.source')}</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLedgers.map((ledger) => (
                    <tr key={ledger.id}>
                      <td>{formatDate(ledger.occurred_at)}</td>
                      <td>{inventoryDirectionLabel(ledger.direction)} / {stockStatusLabel(ledger.stock_status)}</td>
                      <td>{ledger.product_code ?? '-'} {ledger.product_name}</td>
                      <td>{trimDecimal(ledger.quantity)} {ledger.unit}</td>
                      <td>{ledger.source_code}</td>
                    </tr>
                  ))}
                  {inventoryLedgers.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        {t('warehouse.inboundOrder.detail.noLedgers')}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Warehouse size={28} />
              <strong>{t('warehouse.inboundOrder.detail.emptyTitle')}</strong>
              <span>{t('warehouse.inboundOrder.detail.emptyDescription')}</span>
            </div>
          )}
          </section>
        ) : null}
      </section>

      <FormModal
        open={cancelModalOpen}
        submitDanger
        submitLabel={t('warehouse.inboundOrder.action.cancel')}
        submitting={submitting}
        title={t('warehouse.inboundOrder.action.cancel')}
        onCancel={() => setCancelModalOpen(false)}
        onSubmit={(event) => void cancelSelectedInboundOrder(event)}
      >
        <p className="form-hint">{t('warehouse.inboundOrder.detail.cancelReason')}</p>
        <Input.TextArea
          aria-describedby={cancelReasonError ? 'inbound-cancel-reason-error' : undefined}
          aria-invalid={Boolean(cancelReasonError)}
          rows={3}
          value={cancelReason}
          onChange={(event) => {
            setCancelReason(event.target.value)
            if (cancelReasonError) setCancelReasonError('')
          }}
        />
        {cancelReasonError ? (
          <div className="form-field-error" id="inbound-cancel-reason-error">
            {cancelReasonError}
          </div>
        ) : null}
      </FormModal>
    </section>
  )
}
