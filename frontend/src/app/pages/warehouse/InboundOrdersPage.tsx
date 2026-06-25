import { Alert, Button, Descriptions, Input, Modal, Skeleton, Table, Tag } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, Warehouse , CheckCircle2, PackagePlus, Send} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { approveInboundOrder, generateInboundOrderFromPlan, listInboundOrders, submitInboundOrder, type InboundOrder, type InboundOrderApprovePayload, type InboundOrderGeneratePayload , InboundPlan, InventoryBalance, InventoryLedger, listInboundPlans, listInventoryBalances, listInventoryLedgers} from '../../../api'
import { warehouseInboundOrderPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { inboundOrderStatusOptions, inboundOrderModeOptions , inboundPlanStatusOptions} from '../../../shared/formOptions'
import { formatDate, formatMoney, formatQuantity, nullableText, todayInputValue, OperationFlowRail, type RoutedDetailPageProps , trimDecimal} from '../appHelpers'

function inboundPlanStatusLabel(value: string): string {
  return inboundPlanStatusOptions.find((item) => item.value === value)?.label ?? value
}


type InboundOrderFormState = {
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

type InboundOrderApprovalFormState = {
  reviewer_name: string
  approved_at: string
}


function initialInboundOrderForm(): InboundOrderFormState {
  return {
    plan_id: '',
    code: `IO-${Date.now().toString().slice(-6)}`,
    inbound_mode: 'formal',
    inbound_at: '2026-08-30',
    warehouse_id: 'wh-ningbo',
    warehouse_name: '宁波总仓',
    location_id: 'loc-a-01',
    location_name: 'A-01',
    operator_name: '仓库主管',
  }
}

function initialInboundOrderApprovalForm(): InboundOrderApprovalFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: '2026-08-30',
  }
}

function inboundOrderFormForPlan(
  plan: InboundPlan,
  current: InboundOrderFormState,
): InboundOrderFormState {
  return {
    ...current,
    plan_id: plan.id,
    inbound_at: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? 'wh-ningbo',
    warehouse_name: plan.warehouse_name ?? '宁波总仓',
    location_id: plan.location_id ?? 'loc-a-01',
    location_name: plan.location_name ?? 'A-01',
    operator_name: plan.operator_name ?? '仓库主管',
  }
}

function inboundOrderToForm(order: InboundOrder): InboundOrderFormState {
  return {
    plan_id: order.plan_id,
    code: order.code,
    inbound_mode: order.inbound_mode,
    inbound_at: order.inbound_at,
    warehouse_id: order.warehouse_id,
    warehouse_name: order.warehouse_name,
    location_id: order.location_id,
    location_name: order.location_name,
    operator_name: order.operator_name,
  }
}

function inboundOrderPayload(form: InboundOrderFormState): InboundOrderGeneratePayload {
  return {
    plan_id: form.plan_id.trim(),
    code: form.code.trim(),
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
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function inboundOrderModeLabel(value: string): string {
  return inboundOrderModeOptions.find((item) => item.value === value)?.label ?? value
}

function inboundOrderStatusLabel(value: string): string {
  return inboundOrderStatusOptions.find((item) => item.value === value)?.label ?? value
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


export function InboundOrdersPage({ detailId, onNavigate }: RoutedDetailPageProps) {
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
  const [inboundOrderModalOpen, setInboundOrderModalOpen] = useState(false)
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
    void loadInboundOrders()
  }, [])

  useEffect(() => {
    if (!selectedOrder) return
    setForm(inboundOrderToForm(selectedOrder))
    setApprovalForm({
      reviewer_name: selectedOrder.reviewer_name ?? '演示业务主管',
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
    setError('')
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
      showError(caught, '货物入库加载失败')
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
    setError('')
    try {
      await loadInventorySnapshotForOrder(selectedOrder)
    } catch (caught) {
      showError(caught, '库存快照加载失败')
    }
  }

  function handleInboundOrderPlanChange(planId: string) {
    const plan = inboundPlans.find((item) => item.id === planId)
    setForm((current) => (plan ? inboundOrderFormForPlan(plan, current) : { ...current, plan_id: planId }))
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

  function stopAndOpenInboundOrderDetail(event: MouseEvent<HTMLElement>, order: InboundOrder) {
    event.stopPropagation()
    openInboundOrderDetail(order)
  }

  async function generateInboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
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
      setMessage(`已生成入库单 ${order.code}`)
    } catch (caught) {
      showError(caught, '入库单生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSelectedInboundOrder() {
    if (!selectedOrder) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const order = await submitInboundOrder(selectedOrder.id)
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      upsertInboundOrder(order)
      await loadInboundOrders(order.id, order, inventoryQuery)
      setMessage(`${order.code} 已提交审批`)
    } catch (caught) {
      showError(caught, '入库单提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedInboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    if (selectedOrder.status !== 'submitted') return
    setSubmitting(true)
    setMessage('')
    setError('')
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
          ? `${order.code} 已正式入库，库存和采购跟单已回写`
          : `${order.code} 已登记待检库存`,
      )
    } catch (caught) {
      showError(caught, '入库审批失败')
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
      <OperationFlowRail activePath={warehouseInboundOrderPath} kind="warehouse" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="货物入库概览">
        <Metric label="入库单" value={orders.length} />
        <Metric label="草稿" value={draftCount} />
        <Metric label="待审批" value={submittedCount} intent={submittedCount > 0 ? 'warning' : 'normal'} />
        <Metric label="已审批" value={approvedCount} />
        <Metric label="可用库存" value={availableQuantity.toFixed(2)} />
        <Metric label="待检库存" value={pendingQuantity.toFixed(2)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid inbound-order-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="入库单" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadInboundOrders()
              }}
            >
              <label>
                入库搜索
                <Input
                  value={search}
                  placeholder="入库单 / 采购合同 / 商品"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor="inbound-order-status-filter">
                单据状态
                <FormSelect
                  id="inbound-order-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {inboundOrderStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="inbound-order-mode-filter">
                入库模式
                <FormSelect
                  id="inbound-order-mode-filter"
                  value={modeFilter}
                  onChange={(event) => setModeFilter(event.target.value)}
                >
                  <option value="">全部模式</option>
                  {inboundOrderModeOptions.map((item) => (
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
              <Button htmlType="button" icon={<Plus size={16} />} onClick={() => setInboundOrderModalOpen(true)}>
                生成/审批入库单
              </Button>
            </form>
          </div>

          <Table<InboundOrder>
            columns={[
              {
                title: '入库单',
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
              { title: '状态', dataIndex: 'status', render: inboundOrderStatusLabel },
              { title: '模式', dataIndex: 'inbound_mode', render: inboundOrderModeLabel },
              { title: '采购合同', dataIndex: 'purchase_contract_no' },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '入库日', dataIndex: 'inbound_at', render: formatDate },
              {
                title: '库位',
                dataIndex: 'location_name',
                render: (_, order) => `${order.warehouse_name} / ${order.location_name}`,
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: InboundOrder) => (
                  <Button size="small" onClick={(event) => stopAndOpenInboundOrderDetail(event, record)}>
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
          open={inboundOrderModalOpen}
          title="入库单生成和审批"
          width={980}
          onCancel={() => setInboundOrderModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<Warehouse size={18} />} title="入库登记" />
          <form className="record-form" onSubmit={generateInboundOrder}>
            <div className="form-divider">从入库计划生成</div>
            <label htmlFor="inbound-order-plan-id">
              入库计划
              <FormSelect
                id="inbound-order-plan-id"
                required
                value={form.plan_id}
                onChange={(event) => handleInboundOrderPlanChange(event.target.value)}
              >
                <option value="">选择入库计划</option>
                {inboundPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.code} / {plan.purchase_contract_no} / {inboundPlanStatusLabel(plan.status)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label htmlFor="inbound-order-code">
              入库单号
              <Input
                id="inbound-order-code"
                required
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="inbound-order-mode">
                入库模式
                <FormSelect
                  id="inbound-order-mode"
                  value={form.inbound_mode}
                  onChange={(event) => setForm({ ...form, inbound_mode: event.target.value })}
                >
                  {inboundOrderModeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="inbound-order-date">
                入库日期
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
                仓库 ID
                <Input
                  id="inbound-order-warehouse-id"
                  required
                  value={form.warehouse_id}
                  onChange={(event) => setForm({ ...form, warehouse_id: event.target.value })}
                />
              </label>
              <label htmlFor="inbound-order-warehouse-name">
                仓库
                <Input
                  id="inbound-order-warehouse-name"
                  required
                  value={form.warehouse_name}
                  onChange={(event) => setForm({ ...form, warehouse_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="inbound-order-location-id">
                库位 ID
                <Input
                  id="inbound-order-location-id"
                  required
                  value={form.location_id}
                  onChange={(event) => setForm({ ...form, location_id: event.target.value })}
                />
              </label>
              <label htmlFor="inbound-order-location-name">
                库位
                <Input
                  id="inbound-order-location-name"
                  required
                  value={form.location_name}
                  onChange={(event) => setForm({ ...form, location_name: event.target.value })}
                />
              </label>
            </div>
            <label htmlFor="inbound-order-operator">
              经办人
              <Input
                id="inbound-order-operator"
                required
                value={form.operator_name}
                onChange={(event) => setForm({ ...form, operator_name: event.target.value })}
              />
            </label>
            <Button
              disabled={!form.plan_id}
              htmlType="submit"
              icon={<PackagePlus size={16} />}
              loading={submitting}
            >
              生成入库单
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={approveSelectedInboundOrder}>
            <div className="form-divider">提交和审批</div>
            <Button
              disabled={!selectedOrder || selectedOrder.status !== 'draft'}
              htmlType="button"
              icon={<Send size={16} />}
              loading={submitting}
              onClick={() => void submitSelectedInboundOrder()}
            >
              提交审批
            </Button>
            <div className="form-pair two">
              <label htmlFor="inbound-order-reviewer">
                审批人
                <Input
                  id="inbound-order-reviewer"
                  required
                  value={approvalForm.reviewer_name}
                  onChange={(event) =>
                    setApprovalForm({ ...approvalForm, reviewer_name: event.target.value })
                  }
                />
              </label>
              <label htmlFor="inbound-order-approved-at">
                审批日期
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
              disabled={!selectedOrder || selectedOrder.status !== 'submitted'}
              htmlType="submit"
              icon={<CheckCircle2 size={16} />}
              loading={submitting}
              type="primary"
            >
              审批入库
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="明细和库存" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(warehouseInboundOrderPath)}>
              返回列表
            </Button>
          </div>
          {selectedOrder ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>采购合同</dt>
                  <dd>{selectedOrder.purchase_contract_no}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedOrder.supplier_name}</dd>
                </div>
                <div>
                  <dt>入库模式</dt>
                  <dd>{inboundOrderModeLabel(selectedOrder.inbound_mode)}</dd>
                </div>
                <div>
                  <dt>单据状态</dt>
                  <dd>{inboundOrderStatusLabel(selectedOrder.status)}</dd>
                </div>
                <div>
                  <dt>入库日期</dt>
                  <dd>{formatDate(selectedOrder.inbound_at)}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>{selectedOrder.warehouse_name} / {selectedOrder.location_name}</dd>
                </div>
              </dl>

              <div className="accessory-heading">
                <strong>入库明细</strong>
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
                        暂无入库明细
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <form className="inline-filters inline-search inventory-search-form" onSubmit={refreshInventorySnapshot}>
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
                <strong>库存流水</strong>
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
                        暂无库存流水
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Warehouse size={28} />
              <strong>暂无入库单</strong>
              <span>请返回列表选择入库单查看明细和库存</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


