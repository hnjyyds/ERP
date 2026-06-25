import { Alert, Button, Descriptions, Input, Modal, Skeleton, Table, Tag } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, Warehouse , CheckCircle2, Package, PackagePlus, Send} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { approveOutboundOrder, generateOutboundOrderFromPlan, listOutboundOrders, submitOutboundOrder, type OutboundOrder, type OutboundOrderApprovePayload, type OutboundOrderGeneratePayload , InventoryBalance, InventoryLedger, OutboundPlan, listOutboundPlans, listInventoryBalances, listInventoryLedgers} from '../../../api'
import { warehouseOutboundOrderPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { outboundOrderStatusOptions, outboundOrderModeOptions , outboundPlanTypeOptions, outboundPlanStatusOptions, outboundPlanSourceTypeOptions} from '../../../shared/formOptions'
import { formatDate, formatMoney, formatQuantity, nullableText, todayInputValue, OperationFlowRail, type RoutedDetailPageProps , emptyToNull, trimDecimal} from '../appHelpers'

function outboundPlanStatusLabel(value: string): string {
  return outboundPlanStatusOptions.find((item) => item.value === value)?.label ?? value
}

function outboundPlanTypeLabel(value: string): string {
  return outboundPlanTypeOptions.find((item) => item.value === value)?.label ?? value
}

function outboundPlanSourceTypeLabel(value: string): string {
  return outboundPlanSourceTypeOptions.find((item) => item.value === value)?.label ?? value
}

function stockStatusLabel(value: string): string {
  if (value === 'available') return '可用'
  if (value === 'pending_inspection') return '待检'
  return value
}

function inventoryDirectionLabel(value: string): string {
  if (value === 'in') return '入库'
  if (value === 'out') return '出库'
  return value
}


type OutboundOrderFormState = {
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

type OutboundOrderApprovalFormState = {
  reviewer_name: string
  approved_at: string
  allow_negative: boolean
}


function initialOutboundOrderForm(): OutboundOrderFormState {
  return {
    plan_id: '',
    code: `OO-${Date.now().toString().slice(-6)}`,
    outbound_mode: 'formal',
    outbound_at: '2026-10-30',
    warehouse_id: 'wh-ningbo',
    warehouse_name: '宁波总仓',
    location_id: 'loc-fg-01',
    location_name: '成品区 A-01',
    operator_name: '仓库主管',
    exception_reason: '',
  }
}

function initialOutboundOrderApprovalForm(): OutboundOrderApprovalFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: '2026-10-30',
    allow_negative: false,
  }
}

function outboundOrderFormForPlan(
  plan: OutboundPlan,
  current: OutboundOrderFormState,
): OutboundOrderFormState {
  return {
    ...current,
    plan_id: plan.id,
    outbound_at: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? 'wh-ningbo',
    warehouse_name: plan.warehouse_name ?? '宁波总仓',
    location_id: plan.location_id ?? 'loc-fg-01',
    location_name: plan.location_name ?? '成品区 A-01',
    operator_name: plan.operator_name ?? '仓库主管',
  }
}

function outboundOrderToForm(order: OutboundOrder): OutboundOrderFormState {
  return {
    plan_id: order.plan_id,
    code: order.code,
    outbound_mode: order.outbound_mode,
    outbound_at: order.outbound_at,
    warehouse_id: order.warehouse_id,
    warehouse_name: order.warehouse_name,
    location_id: order.location_id,
    location_name: order.location_name,
    operator_name: order.operator_name,
    exception_reason: order.exception_reason ?? '',
  }
}

function outboundOrderPayload(form: OutboundOrderFormState): OutboundOrderGeneratePayload {
  return {
    plan_id: form.plan_id.trim(),
    code: form.code.trim(),
    outbound_mode: form.outbound_mode,
    outbound_at: form.outbound_at,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    operator_name: form.operator_name.trim(),
    exception_reason: emptyToNull(form.exception_reason),
    lines: [],
  }
}

function outboundOrderApprovePayload(
  form: OutboundOrderApprovalFormState,
): OutboundOrderApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
    allow_negative: form.allow_negative,
  }
}

function outboundOrderModeLabel(value: string): string {
  return outboundOrderModeOptions.find((item) => item.value === value)?.label ?? value
}

function outboundOrderStatusLabel(value: string): string {
  return outboundOrderStatusOptions.find((item) => item.value === value)?.label ?? value
}

function outboundOrderTotalQuantity(order: OutboundOrder): number {
  return order.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
}


export function OutboundOrdersPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [orders, setOrders] = useState<OutboundOrder[]>([])
  const [outboundPlans, setOutboundPlans] = useState<OutboundPlan[]>([])
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([])
  const [inventoryLedgers, setInventoryLedgers] = useState<InventoryLedger[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [sourceIdFilter, setSourceIdFilter] = useState('')
  const [inventorySearch, setInventorySearch] = useState('')
  const [form, setForm] = useState<OutboundOrderFormState>(() => initialOutboundOrderForm())
  const [approvalForm, setApprovalForm] = useState<OutboundOrderApprovalFormState>(() =>
    initialOutboundOrderApprovalForm(),
  )
  const [outboundOrderModalOpen, setOutboundOrderModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedOrder = useMemo(
    () => {
      if (detailId) return orders.find((item) => item.id === detailId) ?? null
      return orders.find((item) => item.id === selectedOrderId) ?? orders[0] ?? null
    },
    [detailId, orders, selectedOrderId],
  )

  useEffect(() => {
    void loadOutboundOrders()
  }, [])

  useEffect(() => {
    if (!selectedOrder) return
    setForm(outboundOrderToForm(selectedOrder))
    setApprovalForm((current) => ({
      ...current,
      reviewer_name: selectedOrder.reviewer_name ?? '演示业务主管',
      approved_at: selectedOrder.approved_at ?? selectedOrder.outbound_at,
    }))
  }, [selectedOrder?.id, selectedOrder?.status])

  useEffect(() => {
    if (detailId && orders.length > 0 && !orders.some((item) => item.id === detailId)) {
      onNavigate(warehouseOutboundOrderPath)
    }
  }, [detailId, onNavigate, orders])

  async function loadOutboundOrders(
    preferredOrderId?: string,
    preferredOrder?: OutboundOrder,
    inventoryQuery?: string,
  ) {
    setLoading(true)
    setError('')
    try {
      const [orderResult, planOptions] = await Promise.all([
        listOutboundOrders({
          q: preferredOrder?.code ?? (search.trim() || undefined),
          status: statusFilter || undefined,
          outbound_mode: modeFilter || undefined,
          outbound_type: typeFilter || undefined,
          customer_id: customerFilter.trim() || undefined,
          source_id: sourceIdFilter.trim() || undefined,
        }),
        loadOutboundOrderPlanOptions(),
      ])
      const nextOrders = preferredOrder
        ? [preferredOrder, ...orderResult.items.filter((item) => item.id !== preferredOrder.id)]
        : orderResult.items
      const nextOrderId =
        preferredOrderId ??
        (nextOrders.some((item) => item.id === selectedOrderId) ? selectedOrderId : null) ??
        nextOrders[0]?.id ??
        null
      const nextOrder = nextOrders.find((item) => item.id === nextOrderId) ?? null
      setOrders(nextOrders)
      setOutboundPlans(planOptions)
      setSelectedOrderId(nextOrderId)
      if (!nextOrder && planOptions[0]) {
        setForm((current) => outboundOrderFormForPlan(planOptions[0], current))
      }
      await loadOutboundInventorySnapshot(nextOrder, inventoryQuery)
    } catch (caught) {
      showError(caught, '货物出库加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadOutboundOrderPlanOptions(): Promise<OutboundPlan[]> {
    const [allPlans, scheduledPlans, plannedPlans] = await Promise.all([
      listOutboundPlans({}),
      listOutboundPlans({ status: 'scheduled' }),
      listOutboundPlans({ status: 'planned' }),
    ])
    const planById = new Map<string, OutboundPlan>()
    for (const plan of [...scheduledPlans.items, ...plannedPlans.items, ...allPlans.items]) {
      planById.set(plan.id, plan)
    }
    return [...planById.values()]
  }

  async function loadOutboundInventorySnapshot(
    order: OutboundOrder | null = selectedOrder,
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

  async function refreshOutboundInventorySnapshot(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setError('')
    try {
      await loadOutboundInventorySnapshot(selectedOrder)
    } catch (caught) {
      showError(caught, '库存快照加载失败')
    }
  }

  function handleOutboundOrderPlanChange(planId: string) {
    const plan = outboundPlans.find((item) => item.id === planId)
    setForm((current) => (plan ? outboundOrderFormForPlan(plan, current) : { ...current, plan_id: planId }))
  }

  function upsertOutboundOrder(order: OutboundOrder) {
    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id)
      return exists ? current.map((item) => (item.id === order.id ? order : item)) : [order, ...current]
    })
    setSelectedOrderId(order.id)
  }

  function openOutboundOrderDetail(order: OutboundOrder) {
    setSelectedOrderId(order.id)
    onNavigate(moduleDetailPath(warehouseOutboundOrderPath, order.id))
  }

  function stopAndOpenOutboundOrderDetail(event: MouseEvent<HTMLElement>, order: OutboundOrder) {
    event.stopPropagation()
    openOutboundOrderDetail(order)
  }

  async function generateOutboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const order = await generateOutboundOrderFromPlan(outboundOrderPayload(form))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setSearch(order.code)
      setStatusFilter('')
      setTypeFilter(order.outbound_type)
      setCustomerFilter(order.customer_id ?? '')
      setSourceIdFilter(order.source_id)
      setInventorySearch(inventoryQuery)
      upsertOutboundOrder(order)
      setOutboundOrderModalOpen(false)
      await loadOutboundOrders(order.id, order, inventoryQuery)
      setMessage(`已生成出库单 ${order.code}`)
    } catch (caught) {
      showError(caught, '出库单生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSelectedOutboundOrder() {
    if (!selectedOrder) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const order = await submitOutboundOrder(selectedOrder.id)
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      upsertOutboundOrder(order)
      await loadOutboundOrders(order.id, order, inventoryQuery)
      setMessage(`${order.code} 已提交审批`)
    } catch (caught) {
      showError(caught, '出库单提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedOutboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    if (selectedOrder.status !== 'submitted') return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const order = await approveOutboundOrder(selectedOrder.id, outboundOrderApprovePayload(approvalForm))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setStatusFilter('approved')
      setInventorySearch(inventoryQuery)
      upsertOutboundOrder(order)
      setOutboundOrderModalOpen(false)
      await loadOutboundOrders(order.id, order, inventoryQuery)
      setMessage(
        order.outbound_mode === 'formal'
          ? `${order.code} 已正式出库，库存和采购跟单已回写`
          : `${order.code} 已记录异常出库`,
      )
    } catch (caught) {
      showError(caught, '出库审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  const draftCount = orders.filter((item) => item.status === 'draft').length
  const submittedCount = orders.filter((item) => item.status === 'submitted').length
  const approvedCount = orders.filter((item) => item.status === 'approved').length
  const outboundQuantity = orders.reduce((sum, item) => sum + outboundOrderTotalQuantity(item), 0)
  const availableQuantity = inventoryBalances.reduce(
    (sum, item) => sum + Number(item.available_quantity || 0),
    0,
  )

  return (
    <section className="outbound-order-page">
      <OperationFlowRail activePath={warehouseOutboundOrderPath} kind="warehouse" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="货物出库概览">
        <Metric label="出库单" value={orders.length} />
        <Metric label="草稿" value={draftCount} />
        <Metric label="待审批" value={submittedCount} intent={submittedCount > 0 ? 'warning' : 'normal'} />
        <Metric label="已出库" value={approvedCount} />
        <Metric label="出库数量" value={outboundQuantity.toFixed(2)} />
        <Metric label="可用库存" value={availableQuantity.toFixed(2)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid outbound-order-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="出库单" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadOutboundOrders()
              }}
            >
              <label>
                出库搜索
                <Input
                  value={search}
                  placeholder="出库单 / 来源单 / 商品"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor="outbound-order-status-filter">
                单据状态
                <FormSelect
                  id="outbound-order-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {outboundOrderStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-order-mode-filter">
                出库模式
                <FormSelect
                  id="outbound-order-mode-filter"
                  value={modeFilter}
                  onChange={(event) => setModeFilter(event.target.value)}
                >
                  <option value="">全部模式</option>
                  {outboundOrderModeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-order-type-filter">
                出库类型
                <FormSelect
                  id="outbound-order-type-filter"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="">全部类型</option>
                  {outboundPlanTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                客户标识
                <Input
                  value={customerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                />
              </label>
              <label>
                来源单 ID
                <Input
                  value={sourceIdFilter}
                  placeholder="shipment-id"
                  onChange={(event) => setSourceIdFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={() => setOutboundOrderModalOpen(true)}>
                生成/审批出库单
              </Button>
            </form>
          </div>

          <Table<OutboundOrder>
            columns={[
              {
                title: '出库单',
                dataIndex: 'code',
                render: (value: string, record: OutboundOrder) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenOutboundOrderDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: outboundOrderStatusLabel },
              { title: '模式', dataIndex: 'outbound_mode', render: outboundOrderModeLabel },
              { title: '出库类型', dataIndex: 'outbound_type', render: outboundPlanTypeLabel },
              { title: '来源单', dataIndex: 'source_code' },
              { title: '客户', dataIndex: 'customer_name', render: nullableText },
              { title: '出库日', dataIndex: 'outbound_at', render: formatDate },
              {
                title: '数量',
                dataIndex: 'lines',
                render: (_, order) => outboundOrderTotalQuantity(order).toFixed(2),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: OutboundOrder) => (
                  <Button size="small" onClick={(event) => stopAndOpenOutboundOrderDetail(event, record)}>
                    查看详情
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
          open={outboundOrderModalOpen}
          title="出库单生成和审批"
          width={980}
          onCancel={() => setOutboundOrderModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<Warehouse size={18} />} title="出库登记" />
          <form className="record-form" onSubmit={generateOutboundOrder}>
            <div className="form-divider">从出库计划生成</div>
            <label htmlFor="outbound-order-plan-id">
              出库计划
              <FormSelect
                id="outbound-order-plan-id"
                required
                value={form.plan_id}
                onChange={(event) => handleOutboundOrderPlanChange(event.target.value)}
              >
                <option value="">选择出库计划</option>
                {outboundPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.code} / {plan.source_code} / {outboundPlanStatusLabel(plan.status)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label htmlFor="outbound-order-code">
              出库单号
              <Input
                id="outbound-order-code"
                required
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="outbound-order-mode">
                出库模式
                <FormSelect
                  id="outbound-order-mode"
                  value={form.outbound_mode}
                  onChange={(event) => setForm({ ...form, outbound_mode: event.target.value })}
                >
                  {outboundOrderModeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-order-date">
                出库日期
                <Input
                  id="outbound-order-date"
                  required
                  type="date"
                  value={form.outbound_at}
                  onChange={(event) => setForm({ ...form, outbound_at: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="outbound-order-warehouse-id">
                仓库 ID
                <Input
                  id="outbound-order-warehouse-id"
                  required
                  value={form.warehouse_id}
                  onChange={(event) => setForm({ ...form, warehouse_id: event.target.value })}
                />
              </label>
              <label htmlFor="outbound-order-warehouse-name">
                仓库
                <Input
                  id="outbound-order-warehouse-name"
                  required
                  value={form.warehouse_name}
                  onChange={(event) => setForm({ ...form, warehouse_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="outbound-order-location-id">
                库位 ID
                <Input
                  id="outbound-order-location-id"
                  required
                  value={form.location_id}
                  onChange={(event) => setForm({ ...form, location_id: event.target.value })}
                />
              </label>
              <label htmlFor="outbound-order-location-name">
                库位
                <Input
                  id="outbound-order-location-name"
                  required
                  value={form.location_name}
                  onChange={(event) => setForm({ ...form, location_name: event.target.value })}
                />
              </label>
            </div>
            <label htmlFor="outbound-order-operator">
              经办人
              <Input
                id="outbound-order-operator"
                required
                value={form.operator_name}
                onChange={(event) => setForm({ ...form, operator_name: event.target.value })}
              />
            </label>
            <label htmlFor="outbound-exception-reason">
              异常原因
              <Input.TextArea
                id="outbound-exception-reason"
                rows={3}
                value={form.exception_reason}
                onChange={(event) => setForm({ ...form, exception_reason: event.target.value })}
              />
            </label>
            <Button
              disabled={!form.plan_id}
              htmlType="submit"
              icon={<PackagePlus size={16} />}
              loading={submitting}
            >
              生成出库单
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={approveSelectedOutboundOrder}>
            <div className="form-divider">提交和审批</div>
            <Button
              disabled={!selectedOrder || selectedOrder.status !== 'draft'}
              htmlType="button"
              icon={<Send size={16} />}
              loading={submitting}
              onClick={() => void submitSelectedOutboundOrder()}
            >
              提交审批
            </Button>
            <div className="form-pair two">
              <label htmlFor="outbound-reviewer-name">
                审批人
                <Input
                  id="outbound-reviewer-name"
                  required
                  value={approvalForm.reviewer_name}
                  onChange={(event) =>
                    setApprovalForm({ ...approvalForm, reviewer_name: event.target.value })
                  }
                />
              </label>
              <label htmlFor="outbound-approved-at">
                审批日期
                <Input
                  id="outbound-approved-at"
                  required
                  type="date"
                  value={approvalForm.approved_at}
                  onChange={(event) =>
                    setApprovalForm({ ...approvalForm, approved_at: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="checkbox-line" htmlFor="outbound-allow-negative">
              <input
                id="outbound-allow-negative"
                type="checkbox"
                checked={approvalForm.allow_negative}
                onChange={(event) =>
                  setApprovalForm({ ...approvalForm, allow_negative: event.target.checked })
                }
              />
              授权负库存出库
            </label>
            <Button
              disabled={!selectedOrder || selectedOrder.status !== 'submitted'}
              htmlType="submit"
              icon={<CheckCircle2 size={16} />}
              loading={submitting}
              type="primary"
            >
              审批出库
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="出库明细和库存流水" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(warehouseOutboundOrderPath)}>
              返回列表
            </Button>
          </div>
          {selectedOrder ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>来源单据</dt>
                  <dd>{outboundPlanSourceTypeLabel(selectedOrder.source_type)} / {selectedOrder.source_code}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedOrder.customer_name ?? '未设置客户'}</dd>
                </div>
                <div>
                  <dt>出库模式</dt>
                  <dd>{outboundOrderModeLabel(selectedOrder.outbound_mode)}</dd>
                </div>
                <div>
                  <dt>单据状态</dt>
                  <dd>{outboundOrderStatusLabel(selectedOrder.status)}</dd>
                </div>
                <div>
                  <dt>出库日期</dt>
                  <dd>{formatDate(selectedOrder.outbound_at)}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>{selectedOrder.warehouse_name} / {selectedOrder.location_name}</dd>
                </div>
              </dl>

              <div className="accessory-heading">
                <strong>出库明细</strong>
                <span>{selectedOrder.lines.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格</th>
                    <th>数量</th>
                    <th>库存状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_code ?? '-'} {line.product_name}</td>
                      <td>{line.specification ?? line.model ?? '未设置'}</td>
                      <td>{trimDecimal(line.quantity)} {line.unit}</td>
                      <td>{stockStatusLabel(line.stock_status)}</td>
                    </tr>
                  ))}
                  {selectedOrder.lines.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={4}>
                        暂无出库明细
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <form className="inline-filters inline-search inventory-search-form" onSubmit={refreshOutboundInventorySnapshot}>
                <label>
                  库存搜索
                  <Input
                    value={inventorySearch}
                    placeholder="商品编码 / 商品名称 / 仓库"
                    onChange={(event) => setInventorySearch(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查库存
                </Button>
              </form>

              <div className="accessory-heading">
                <strong>库存余额</strong>
                <span>{inventoryBalances.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>库位</th>
                    <th>可用</th>
                    <th>待检</th>
                    <th>锁定</th>
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
                        暂无库存余额
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>出库流水</strong>
                <span>{inventoryLedgers.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>方向</th>
                    <th>商品</th>
                    <th>数量</th>
                    <th>来源</th>
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
                        暂无出库流水
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Package size={28} />
              <strong>暂无出库单</strong>
              <span>请返回列表选择出库单查看明细和库存流水</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


