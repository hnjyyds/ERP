import { Alert, Button, Input, Modal, Skeleton, Table, Tag } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, Ship } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { approveShipment, generateShipmentFromContracts, listShipmentReminders, listShipments, submitShipment, type ShipmentPlan, type ShipmentApprovePayload, type ShipmentPlanGeneratePayload, type ShipmentReminder, type ShipmentStatisticItem , ExportContractPurchaseStatus, ExportContractShipmentStatus, ShipmentLine} from '../../../api'
import { shipmentPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { shipmentStatusOptions, freightMethodOptions } from '../../../shared/formOptions'
import { formatDate, formatMoney, nullableText, todayInputValue, type RoutedDetailPageProps , emptyToNull} from '../appHelpers'

function freightMethodLabel(value: string): string {
  return freightMethodOptions.find((item) => item.value === value)?.label ?? value
}

function contractProgressStatusLabel(value: string): string {
  if (value === 'completed') return '已完成'
  if (value === 'partial') return '部分完成'
  if (value === 'pending') return '未开始'
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
    document_owner_name: '单证部',
    estimated_payable_amount: '0.00',
    remarks: '',
  }
}

function initialShipmentApproveForm(): ShipmentApproveFormState {
  return {
    reviewer_name: '演示业务主管',
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
  return shipmentStatusOptions.find((item) => item.value === value)?.label ?? value
}

function reminderStatusLabel(value: string): string {
  if (value === 'pending') return '待提醒'
  if (value === 'done') return '已处理'
  if (value === 'overdue') return '已逾期'
  return value
}

function formatPercent(value?: string | null): string {
  if (!value) return '0.00%'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return `${value}%`
  return `${numeric.toFixed(2)}%`
}


export function ShipmentsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
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
  const [approveForm, setApproveForm] = useState<ShipmentApproveFormState>(() =>
    initialShipmentApproveForm(),
  )

  const selectedShipment = useMemo(
    () => {
      if (detailId) return shipments.find((item) => item.id === detailId) ?? null
      return shipments.find((item) => item.id === selectedShipmentId) ?? shipments[0] ?? null
    },
    [detailId, shipments, selectedShipmentId],
  )

  useEffect(() => {
    void loadShipments()
    void loadReminders()
  }, [])

  useEffect(() => {
    setApproveForm({
      reviewer_name: selectedShipment?.reviewer_name ?? '演示业务主管',
      approved_at: selectedShipment?.approved_at ?? todayInputValue(),
    })
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
      showError(caught, '出货明细加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadReminders() {
    try {
      const result = await listShipmentReminders()
      setReminders(result.items)
    } catch (caught) {
      showError(caught, '出货提醒加载失败')
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
      setMessage(`已生成出货明细 ${created.code}`)
      setForm(initialShipmentForm())
      upsertShipment(created)
      await Promise.all([loadShipments(created.id), loadReminders()])
    } catch (caught) {
      showError(caught, '出货明细生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitShipmentForApproval() {
    if (!selectedShipment) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitShipment(selectedShipment.id)
      setMessage(`已提交出货明细 ${submitted.code}`)
      upsertShipment(submitted)
      await Promise.all([loadShipments(submitted.id), loadReminders()])
    } catch (caught) {
      showError(caught, '出货明细提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedShipment) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveShipment(
        selectedShipment.id,
        shipmentApprovePayload(approveForm),
      )
      setMessage(`已审批出货明细 ${approved.code}`)
      upsertShipment(approved)
      await Promise.all([loadShipments(approved.id), loadReminders()])
    } catch (caught) {
      showError(caught, '出货明细审批失败')
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
  const selectedShipmentRows = selectedShipment?.contract_progresses.flatMap((progress) =>
    progress.shipment_statuses.map((status) => ({
      ...status,
      contract_id: progress.contract_id,
      contract_no: progress.contract_no,
    })),
  ) ?? []
  const selectedPurchaseRows = selectedShipment?.contract_progresses.flatMap((progress) =>
    progress.purchase_statuses.map((status) => ({
      ...status,
      contract_id: progress.contract_id,
      contract_no: progress.contract_no,
    })),
  ) ?? []

  return (
    <section className="shipment-page">
<div className="summary-strip" aria-label="出货明细概览">
        <Metric label="出货单" value={shipments.length} />
        <Metric label="待审批" value={shipments.filter((item) => item.approval_status === 'submitted').length} />
        <Metric label="已审批" value={shipments.filter((item) => item.approval_status === 'approved').length} />
        <Metric label="应收金额" value={formatMoney(totalReceivable.toFixed(2), currency)} />
        <Metric label="预计利润" value={formatMoney(totalProfit.toFixed(2), currency)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid shipment-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="出货计划列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadShipments()
              }}
            >
              <label>
                出货搜索
                <Input
                  value={search}
                  placeholder="出货单 / 客户 / 合同 / 港口"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                审批状态
              <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {shipmentStatusOptions.map((item) => (
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
                合同标识
                <Input
                  value={contractFilter}
                  placeholder="contract-id"
                  onChange={(event) => setContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>

          <Table<ShipmentPlan>
            columns={[
              {
                title: '出货单号',
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
              { title: '状态', dataIndex: 'approval_status', render: shipmentStatusLabel },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '出货日期', dataIndex: 'shipment_date', render: formatDate },
              { title: '计划出运日', dataIndex: 'planned_ship_date', render: formatDate },
              {
                title: '应收',
                dataIndex: 'finance_overview',
                render: (_, shipment) =>
                  formatMoney(shipment.finance_overview.receivable_amount, shipment.finance_overview.currency),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: ShipmentPlan) => (
                  <Button size="small" onClick={(event) => stopAndOpenShipmentDetail(event, record)}>
                    查看详情
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
          <section className="workspace-panel form-panel product-form-panel">
          <PanelTitle icon={<LayoutDashboard size={18} />} title="从出口合同生成出货明细" />
          <form className="record-form" onSubmit={submitGeneratedShipment}>
            <div className="form-pair two">
              <label>
                出货单号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                出货日期
                <Input
                  type="date"
                  value={form.shipment_date}
                  onChange={(event) => setForm({ ...form, shipment_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                计划出运日
                <Input
                  type="date"
                  value={form.planned_ship_date}
                  onChange={(event) => setForm({ ...form, planned_ship_date: event.target.value })}
                />
              </label>
              <label>
                运输方式
              <FormSelect
                value={form.shipping_method}
                onChange={(event) => setForm({ ...form, shipping_method: event.target.value })}
              >
                {freightMethodOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
            </div>
            <div className="form-divider">出口合同选择</div>
            <div className="form-pair two">
              <label>
                合同标识 A
                <Input
                  value={form.contract_id_a}
                  onChange={(event) => setForm({ ...form, contract_id_a: event.target.value })}
                />
              </label>
              <label>
                合同 A 出货数量
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.contract_quantity_a}
                  onChange={(event) => setForm({ ...form, contract_quantity_a: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                合同标识 B
                <Input
                  value={form.contract_id_b}
                  onChange={(event) => setForm({ ...form, contract_id_b: event.target.value })}
                />
              </label>
              <label>
                合同 B 出货数量
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.contract_quantity_b}
                  onChange={(event) => setForm({ ...form, contract_quantity_b: event.target.value })}
                />
              </label>
            </div>
            <div className="form-divider">物流单证</div>
            <div className="form-pair two">
              <label>
                起运港
                <Input
                  value={form.port_of_loading}
                  onChange={(event) => setForm({ ...form, port_of_loading: event.target.value })}
                />
              </label>
              <label>
                目的港
                <Input
                  value={form.port_of_destination}
                  onChange={(event) => setForm({ ...form, port_of_destination: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                船名航次
                <Input
                  value={form.vessel_name}
                  onChange={(event) => setForm({ ...form, vessel_name: event.target.value })}
                />
              </label>
              <label>
                箱号
                <Input
                  value={form.container_no}
                  onChange={(event) => setForm({ ...form, container_no: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                订舱号
                <Input
                  value={form.booking_no}
                  onChange={(event) => setForm({ ...form, booking_no: event.target.value })}
                />
              </label>
              <label>
                单证负责人
                <Input
                  value={form.document_owner_name}
                  onChange={(event) => setForm({ ...form, document_owner_name: event.target.value })}
                />
              </label>
            </div>
            <label>
              预计付款成本
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
              出货备注
              <Input
                value={form.remarks}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              生成出货明细
            </Button>
          </form>
          </section>
        ) : null}

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="出货明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(shipmentPath)}>
              返回列表
            </Button>
          </div>
          {selectedShipment ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/日期</dt>
                  <dd>{shipmentStatusLabel(selectedShipment.approval_status)} / {formatDate(selectedShipment.shipment_date)}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedShipment.customer_name}</dd>
                </div>
                <div>
                  <dt>运输方式</dt>
                  <dd>{freightMethodLabel(selectedShipment.shipping_method)}</dd>
                </div>
                <div>
                  <dt>出运港口</dt>
                  <dd>{`${selectedShipment.port_of_loading} -> ${selectedShipment.port_of_destination}`}</dd>
                </div>
                <div>
                  <dt>船名/箱号</dt>
                  <dd>{selectedShipment.vessel_name ?? '未填'} / {selectedShipment.container_no ?? '未填'}</dd>
                </div>
                <div>
                  <dt>订舱号</dt>
                  <dd>{selectedShipment.booking_no ?? '未填'}</dd>
                </div>
                <div>
                  <dt>单证负责人</dt>
                  <dd>{selectedShipment.document_owner_name ?? '未填'}</dd>
                </div>
                <div>
                  <dt>审批人</dt>
                  <dd>{selectedShipment.reviewer_name ?? '未审批'}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>收付款和利润概览</strong>
                <div className="finance-overview-grid">
                  <Metric
                    label="应收金额"
                    value={formatMoney(
                      selectedShipment.finance_overview.receivable_amount,
                      selectedShipment.finance_overview.currency,
                    )}
                  />
                  <Metric
                    label="预计付款"
                    value={formatMoney(
                      selectedShipment.finance_overview.payable_amount,
                      selectedShipment.finance_overview.currency,
                    )}
                  />
                  <Metric
                    label="预计利润"
                    value={formatMoney(
                      selectedShipment.finance_overview.profit_amount,
                      selectedShipment.finance_overview.currency,
                    )}
                  />
                  <Metric
                    label="利润率"
                    value={formatPercent(selectedShipment.finance_overview.profit_rate)}
                  />
                </div>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedShipment.approval_status !== 'draft'}
                  loading={submitting}
                  onClick={() => void submitShipmentForApproval()}
                >
                  提交审批
                </Button>
              </div>

              <form className="record-form accessory-form approval-form" onSubmit={approveSelectedShipment}>
                <div className="form-divider">出货审批</div>
                <div className="form-pair two">
                  <label>
                    审批人
                    <Input
                      value={approveForm.reviewer_name}
                      onChange={(event) =>
                        setApproveForm({ ...approveForm, reviewer_name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    审批日期
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
                  disabled={selectedShipment.approval_status !== 'submitted'}
                  htmlType="submit"
                  loading={submitting}
                  type="primary"
                >
                  审批通过
                </Button>
              </form>

              <div className="transaction-box">
                <strong>出货提醒</strong>
                <p>{selectedShipment.reminder.message}</p>
              </div>
              <Table<ShipmentReminder>
                className="compact-section"
                columns={[
                  { title: '提醒日期', dataIndex: 'reminder_date', render: formatDate },
                  { title: '出货单', dataIndex: 'shipment_no' },
                  { title: '状态', dataIndex: 'status', render: reminderStatusLabel },
                  { title: '提醒内容', dataIndex: 'message' },
                ]}
                dataSource={[selectedShipment.reminder]}
                locale={{ emptyText: '暂无当前出货提醒' }}
                pagination={false}
                rowKey={(item) => `${item.shipment_id}-${item.reminder_date}`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>出货商品明细</strong>
                <span>{selectedShipment.lines.length} 条</span>
              </div>
              <Table<ShipmentLine>
                columns={[
                  { title: '合同号', dataIndex: 'contract_no' },
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '规格', dataIndex: 'specification', render: nullableText },
                  { title: '型号', dataIndex: 'model', render: nullableText },
                  { title: '出货数量', dataIndex: 'quantity', render: (_, line) => `${line.quantity} ${line.unit}` },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (_, line) => formatMoney(line.amount, selectedShipment.currency),
                  },
                  { title: '计划出运日', dataIndex: 'planned_ship_date', render: formatDate },
                ]}
                dataSource={selectedShipment.lines}
                locale={{ emptyText: '暂无出货商品明细' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>出口合同出货情况</strong>
                <span>{selectedShipmentRows.length} 条</span>
              </div>
              <Table<(ExportContractShipmentStatus & { contract_id: string; contract_no: string })>
                columns={[
                  { title: '合同号', dataIndex: 'contract_no' },
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '合同数量', dataIndex: 'total_quantity' },
                  { title: '已出货', dataIndex: 'shipped_quantity' },
                  { title: '未出货', dataIndex: 'unshipped_quantity' },
                  {
                    title: '未出货金额',
                    dataIndex: 'unshipped_amount',
                    render: (_, item) => formatMoney(item.unshipped_amount, selectedShipment.currency),
                  },
                  { title: '状态', dataIndex: 'status', render: contractProgressStatusLabel },
                ]}
                dataSource={selectedShipmentRows}
                locale={{ emptyText: '暂无出口合同出货情况' }}
                pagination={false}
                rowKey={(item) => `${item.contract_id}-${item.product_id ?? item.product_code ?? item.product_name}-shipment`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>出口合同采购情况</strong>
                <span>{selectedPurchaseRows.length} 条</span>
              </div>
              <Table<(ExportContractPurchaseStatus & { contract_id: string; contract_no: string })>
                columns={[
                  { title: '合同号', dataIndex: 'contract_no' },
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '合同数量', dataIndex: 'total_quantity' },
                  { title: '已采购', dataIndex: 'purchased_quantity' },
                  { title: '未采购', dataIndex: 'unpurchased_quantity' },
                  { title: '状态', dataIndex: 'status', render: contractProgressStatusLabel },
                ]}
                dataSource={selectedPurchaseRows}
                locale={{ emptyText: '暂无出口合同采购情况' }}
                pagination={false}
                rowKey={(item) => `${item.contract_id}-${item.product_id ?? item.product_code ?? item.product_name}-purchase`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>出货提醒列表</strong>
                <span>{reminders.length} 条</span>
              </div>
              <Table<ShipmentReminder>
                columns={[
                  { title: '提醒日期', dataIndex: 'reminder_date', render: formatDate },
                  { title: '出货单', dataIndex: 'shipment_no' },
                  { title: '状态', dataIndex: 'status', render: reminderStatusLabel },
                  { title: '提醒内容', dataIndex: 'message' },
                ]}
                dataSource={reminders}
                locale={{ emptyText: '暂无出货提醒' }}
                pagination={false}
                rowKey={(item) => `${item.shipment_id}-${item.reminder_date}`}
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Ship size={28} />
              <strong>暂无出货明细</strong>
              <span>请返回列表选择出货记录查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


