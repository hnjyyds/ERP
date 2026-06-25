import { Alert, Button, Input, Modal, Skeleton, Table, Tag } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, Warehouse , PackagePlus, Save, Send} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { generateOutboundPlanFromShipment, listOutboundPlans, scheduleOutboundPlan, type OutboundPlan, type OutboundPlanGeneratePayload, type OutboundPlanSchedulePayload , ShipmentPlan, listShipments} from '../../../api'
import { warehouseOutboundPlanPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { outboundPlanStatusOptions, outboundPlanTypeOptions, outboundPlanSourceTypeOptions } from '../../../shared/formOptions'
import { formatDate, formatMoney, formatQuantity, nullableText, todayInputValue, type RoutedDetailPageProps , emptyToNull, trimDecimal} from '../appHelpers'

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


function initialOutboundPlanGenerateForm(): OutboundPlanGenerateFormState {
  return {
    shipment_plan_id: '',
    outbound_type: 'finished_goods_outbound',
    planned_date: '',
  }
}

function initialOutboundPlanScheduleForm(): OutboundPlanScheduleFormState {
  return {
    planned_date: '2026-09-27',
    warehouse_id: 'wh-ningbo',
    warehouse_name: '宁波总仓',
    location_id: 'loc-fg-b02',
    location_name: '成品区 B-02',
    operator_name: '仓库主管',
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
    warehouse_id: plan.warehouse_id ?? 'wh-ningbo',
    warehouse_name: plan.warehouse_name ?? '宁波总仓',
    location_id: plan.location_id ?? 'loc-fg-b02',
    location_name: plan.location_name ?? '成品区 B-02',
    operator_name: plan.operator_name ?? '仓库主管',
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
  return outboundPlanStatusOptions.find((item) => item.value === value)?.label ?? value
}

function outboundPlanTypeLabel(value: string): string {
  return outboundPlanTypeOptions.find((item) => item.value === value)?.label ?? value
}

function outboundPlanSourceTypeLabel(value: string): string {
  return outboundPlanSourceTypeOptions.find((item) => item.value === value)?.label ?? value
}

function outboundPlanLineStatusLabel(value: string): string {
  if (value === 'pending') return '待出库'
  if (value === 'partial') return '部分出库'
  if (value === 'completed') return '已出库'
  if (value === 'cancelled') return '已取消'
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
  const [generateForm, setGenerateForm] = useState<OutboundPlanGenerateFormState>(() =>
    initialOutboundPlanGenerateForm(),
  )
  const [scheduleForm, setScheduleForm] = useState<OutboundPlanScheduleFormState>(() =>
    initialOutboundPlanScheduleForm(),
  )
  const [outboundPlanModalOpen, setOutboundPlanModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedPlan = useMemo(
    () => {
      if (detailId) return plans.find((item) => item.id === detailId) ?? null
      return plans.find((item) => item.id === selectedPlanId) ?? plans[0] ?? null
    },
    [detailId, plans, selectedPlanId],
  )

  useEffect(() => {
    void loadOutboundPlans()
  }, [])

  useEffect(() => {
    if (!selectedPlan) return
    setGenerateForm((current) => ({
      ...current,
      shipment_plan_id: selectedPlan.source_type === 'shipment_plan' ? selectedPlan.source_id : current.shipment_plan_id,
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
    setError('')
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
        setGenerateForm((current) => outboundPlanGenerateFormForShipment(shipmentOptions[0], current))
      }
    } catch (caught) {
      showError(caught, '出库计划加载失败')
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
      shipment ? outboundPlanGenerateFormForShipment(shipment, current) : { ...current, shipment_plan_id: shipmentId },
    )
  }

  function upsertOutboundPlan(plan: OutboundPlan) {
    setPlans((current) => {
      const exists = current.some((item) => item.id === plan.id)
      return exists ? current.map((item) => (item.id === plan.id ? plan : item)) : [plan, ...current]
    })
    setSelectedPlanId(plan.id)
  }

  function openOutboundPlanDetail(plan: OutboundPlan) {
    setSelectedPlanId(plan.id)
    onNavigate(moduleDetailPath(warehouseOutboundPlanPath, plan.id))
  }

  function stopAndOpenOutboundPlanDetail(event: MouseEvent<HTMLElement>, plan: OutboundPlan) {
    event.stopPropagation()
    openOutboundPlanDetail(plan)
  }

  async function generateOutboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const plan = await generateOutboundPlanFromShipment(outboundPlanGeneratePayload(generateForm))
      setSearch(plan.source_code)
      setStatusFilter('')
      setTypeFilter(plan.outbound_type)
      setSourceFilter(plan.source_type)
      setCustomerFilter(plan.customer_id ?? '')
      setSourceIdFilter(plan.source_id)
      upsertOutboundPlan(plan)
      setOutboundPlanModalOpen(false)
      await loadOutboundPlans(plan.id, plan)
      setMessage(`已生成出库计划 ${plan.code}`)
    } catch (caught) {
      showError(caught, '出库计划生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function scheduleSelectedOutboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlan) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const plan = await scheduleOutboundPlan(selectedPlan.id, outboundPlanSchedulePayload(scheduleForm))
      upsertOutboundPlan(plan)
      setOutboundPlanModalOpen(false)
      await loadOutboundPlans(plan.id, plan)
      setMessage(`已安排 ${plan.warehouse_name ?? ''} / ${plan.location_name ?? ''}`)
    } catch (caught) {
      showError(caught, '库位安排保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const plannedCount = plans.filter((item) => item.status === 'planned').length
  const scheduledCount = plans.filter((item) => item.status === 'scheduled').length
  const totalQuantity = plans.reduce((sum, item) => sum + outboundPlanTotalQuantity(item), 0)
  const shipmentSourceCount = plans.filter((item) => item.source_type === 'shipment_plan').length

  return (
    <section className="outbound-plan-page">
<div className="summary-strip" aria-label="出库计划概览">
        <Metric label="出库计划" value={plans.length} />
        <Metric label="待安排" value={plannedCount} intent={plannedCount > 0 ? 'warning' : 'normal'} />
        <Metric label="已排库位" value={scheduledCount} />
        <Metric label="待出库数量" value={totalQuantity.toFixed(2)} />
        <Metric label="发货来源" value={shipmentSourceCount} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid outbound-plan-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="出库计划" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadOutboundPlans()
              }}
            >
              <label>
                计划搜索
                <Input
                  value={search}
                  placeholder="计划号 / 来源单 / 商品"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor="outbound-status-filter">
                出库状态
                <FormSelect
                  id="outbound-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {outboundPlanStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-type-filter">
                出库类型
                <FormSelect
                  id="outbound-type-filter"
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
              <label htmlFor="outbound-source-filter">
                来源类型
                <FormSelect
                  id="outbound-source-filter"
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value)}
                >
                  <option value="">全部来源</option>
                  {outboundPlanSourceTypeOptions.map((item) => (
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
              <Button htmlType="button" icon={<Plus size={16} />} onClick={() => setOutboundPlanModalOpen(true)}>
                生成/排库位
              </Button>
            </form>
          </div>

          <Table<OutboundPlan>
            columns={[
              {
                title: '计划号',
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
              { title: '状态', dataIndex: 'status', render: outboundPlanStatusLabel },
              { title: '类型', dataIndex: 'outbound_type', render: outboundPlanTypeLabel },
              { title: '来源单', dataIndex: 'source_code' },
              { title: '客户', dataIndex: 'customer_name', render: nullableText },
              { title: '计划出库日', dataIndex: 'planned_date', render: formatDate },
              {
                title: '数量',
                dataIndex: 'lines',
                render: (_, plan) => outboundPlanTotalQuantity(plan).toFixed(2),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: OutboundPlan) => (
                  <Button size="small" onClick={(event) => stopAndOpenOutboundPlanDetail(event, record)}>
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
          open={outboundPlanModalOpen}
          title="出库计划生成和排库位"
          width={980}
          onCancel={() => setOutboundPlanModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<Warehouse size={18} />} title="计划生成和排库位" />
          <form className="record-form" onSubmit={generateOutboundPlan}>
            <div className="form-divider">从发货计划生成</div>
            <label htmlFor="outbound-plan-shipment-id">
              发货计划
              <FormSelect
                id="outbound-plan-shipment-id"
                required
                value={generateForm.shipment_plan_id}
                onChange={(event) => handleOutboundShipmentChange(event.target.value)}
              >
                <option value="">选择已审批发货计划</option>
                {shipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.code} / {shipment.customer_name ?? '未设置客户'} / {formatDate(shipment.planned_ship_date)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <div className="form-pair two">
              <label htmlFor="outbound-plan-type">
                出库类型
                <FormSelect
                  id="outbound-plan-type"
                  value={generateForm.outbound_type}
                  onChange={(event) =>
                    setGenerateForm({ ...generateForm, outbound_type: event.target.value })
                  }
                >
                  {outboundPlanTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-plan-date">
                计划出库日
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
              loading={submitting}
            >
              生成出库计划
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={scheduleSelectedOutboundPlan}>
            <div className="form-divider">库位预安排</div>
            <label htmlFor="outbound-schedule-date">
              计划出库日
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
                仓库 ID
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
                仓库
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
                库位 ID
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
                库位
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
              经办人
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
              loading={submitting}
              type="primary"
            >
              保存库位安排
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="待出库清单" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(warehouseOutboundPlanPath)}>
              返回列表
            </Button>
          </div>
          {selectedPlan ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>来源单据</dt>
                  <dd>{outboundPlanSourceTypeLabel(selectedPlan.source_type)} / {selectedPlan.source_code}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedPlan.customer_name ?? '未设置客户'}</dd>
                </div>
                <div>
                  <dt>出库类型</dt>
                  <dd>{outboundPlanTypeLabel(selectedPlan.outbound_type)}</dd>
                </div>
                <div>
                  <dt>计划状态</dt>
                  <dd>{outboundPlanStatusLabel(selectedPlan.status)}</dd>
                </div>
                <div>
                  <dt>计划出库日</dt>
                  <dd>{formatDate(selectedPlan.planned_date)}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>
                    {selectedPlan.warehouse_name ?? '未安排'} / {selectedPlan.location_name ?? '未安排'}
                  </dd>
                </div>
              </dl>

              <div className="accessory-heading">
                <strong>待出库商品</strong>
                <span>{selectedPlan.lines.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格</th>
                    <th>计划数量</th>
                    <th>已出库</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_code ?? '-'} {line.product_name}</td>
                      <td>{line.specification ?? line.model ?? '未设置'}</td>
                      <td>{trimDecimal(line.planned_quantity)} {line.unit}</td>
                      <td>{trimDecimal(line.outbound_quantity)} {line.unit}</td>
                      <td>{outboundPlanLineStatusLabel(line.status)}</td>
                    </tr>
                  ))}
                  {selectedPlan.lines.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        暂无待出库明细
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Send size={28} />
              <strong>暂无出库计划</strong>
              <span>请返回列表选择出库计划查看待出库清单</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


