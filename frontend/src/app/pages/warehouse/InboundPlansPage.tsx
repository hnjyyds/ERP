import { Alert, Button, Input, Modal, Skeleton, Table, Tag } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, Warehouse , PackagePlus, Save} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { generateInboundPlanFromPurchaseContract, listInboundPlans, scheduleInboundPlan, type InboundPlan, type InboundPlanGeneratePayload, type InboundPlanSchedulePayload } from '../../../api'
import { warehouseInboundPlanPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { inboundPlanStatusOptions, inboundPlanTypeOptions } from '../../../shared/formOptions'
import { formatDate, formatMoney, formatQuantity, nullableText, todayInputValue, OperationFlowRail, type RoutedDetailPageProps , emptyToNull} from '../appHelpers'

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


function initialInboundPlanGenerateForm(): InboundPlanGenerateFormState {
  return {
    purchase_contract_id: '',
    inbound_type: 'purchase_inbound',
    planned_date: '',
  }
}

function initialInboundPlanScheduleForm(): InboundPlanScheduleFormState {
  return {
    planned_date: '2026-08-28',
    warehouse_id: 'wh-ningbo',
    warehouse_name: '宁波总仓',
    location_id: 'loc-a-01',
    location_name: 'A-01',
    operator_name: '仓库主管',
  }
}

function inboundPlanToScheduleForm(plan: InboundPlan): InboundPlanScheduleFormState {
  return {
    planned_date: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? 'wh-ningbo',
    warehouse_name: plan.warehouse_name ?? '宁波总仓',
    location_id: plan.location_id ?? 'loc-a-01',
    location_name: plan.location_name ?? 'A-01',
    operator_name: plan.operator_name ?? '仓库主管',
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
  return inboundPlanTypeOptions.find((item) => item.value === value)?.label ?? value
}

function inboundPlanStatusLabel(value: string): string {
  return inboundPlanStatusOptions.find((item) => item.value === value)?.label ?? value
}

function inboundPlanLineStatusLabel(value: string): string {
  if (value === 'pending') return '待入库'
  if (value === 'partial') return '部分入库'
  if (value === 'completed') return '已入库'
  if (value === 'cancelled') return '已取消'
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
  const [generateForm, setGenerateForm] = useState<InboundPlanGenerateFormState>(() =>
    initialInboundPlanGenerateForm(),
  )
  const [scheduleForm, setScheduleForm] = useState<InboundPlanScheduleFormState>(() =>
    initialInboundPlanScheduleForm(),
  )
  const [inboundPlanModalOpen, setInboundPlanModalOpen] = useState(false)
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

  function stopAndOpenInboundPlanDetail(event: MouseEvent<HTMLElement>, plan: InboundPlan) {
    event.stopPropagation()
    openInboundPlanDetail(plan)
  }

  async function loadInboundPlans(preferredPlanId?: string) {
    setLoading(true)
    setError('')
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
      showError(caught, '入库计划加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function generateInboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const plan = await generateInboundPlanFromPurchaseContract(inboundPlanGeneratePayload(generateForm))
      setSearch(plan.purchase_contract_no)
      setContractFilter(plan.purchase_contract_id)
      setSelectedPlanId(plan.id)
      setInboundPlanModalOpen(false)
      await loadInboundPlans(plan.id)
      setMessage(`已生成入库计划 ${plan.code}`)
    } catch (caught) {
      showError(caught, '入库计划生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function scheduleSelectedInboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlan) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const plan = await scheduleInboundPlan(selectedPlan.id, inboundPlanSchedulePayload(scheduleForm))
      setSelectedPlanId(plan.id)
      setInboundPlanModalOpen(false)
      await loadInboundPlans(plan.id)
      setMessage(`已安排 ${plan.warehouse_name ?? ''} / ${plan.location_name ?? ''}`)
    } catch (caught) {
      showError(caught, '库位安排保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const scheduledCount = plans.filter((item) => item.status === 'scheduled').length
  const plannedCount = plans.filter((item) => item.status === 'planned').length
  const totalQuantity = plans.reduce((sum, item) => sum + inboundPlanTotalQuantity(item), 0)
  const typeCount = new Set(plans.map((item) => item.inbound_type)).size

  return (
    <section className="inbound-plan-page">
      <OperationFlowRail activePath={warehouseInboundPlanPath} kind="warehouse" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="入库计划概览">
        <Metric label="入库计划" value={plans.length} />
        <Metric label="待安排" value={plannedCount} intent={plannedCount > 0 ? 'warning' : 'normal'} />
        <Metric label="已排库位" value={scheduledCount} />
        <Metric label="待入库数量" value={totalQuantity.toFixed(2)} />
        <Metric label="入库类型" value={typeCount} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid inbound-plan-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="待入库计划" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadInboundPlans()
              }}
            >
              <label>
                计划搜索
                <Input
                  value={search}
                  placeholder="计划号 / 采购合同 / 商品"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor="inbound-status-filter">
                入库状态
                <FormSelect
                  id="inbound-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {inboundPlanStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="inbound-type-filter">
                入库类型
                <FormSelect
                  id="inbound-type-filter"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="">全部类型</option>
                  {inboundPlanTypeOptions.map((item) => (
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
              <Button htmlType="button" icon={<Plus size={16} />} onClick={() => setInboundPlanModalOpen(true)}>
                生成/排库位
              </Button>
            </form>
          </div>

          <Table<InboundPlan>
            columns={[
              {
                title: '计划号',
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
              { title: '状态', dataIndex: 'status', render: inboundPlanStatusLabel },
              { title: '类型', dataIndex: 'inbound_type', render: inboundPlanTypeLabel },
              { title: '采购合同', dataIndex: 'purchase_contract_no' },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '计划入库日', dataIndex: 'planned_date', render: formatDate },
              {
                title: '数量',
                dataIndex: 'lines',
                render: (_, plan) => inboundPlanTotalQuantity(plan).toFixed(2),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: InboundPlan) => (
                  <Button size="small" onClick={(event) => stopAndOpenInboundPlanDetail(event, record)}>
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
          open={inboundPlanModalOpen}
          title="入库计划生成和排库位"
          width={980}
          onCancel={() => setInboundPlanModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<Warehouse size={18} />} title="计划生成和排库位" />
          <form className="record-form" onSubmit={generateInboundPlan}>
            <div className="form-divider">从采购合同生成</div>
            <label htmlFor="inbound-plan-contract-id">
              采购合同 ID
              <Input
                id="inbound-plan-contract-id"
                required
                value={generateForm.purchase_contract_id}
                onChange={(event) =>
                  setGenerateForm({ ...generateForm, purchase_contract_id: event.target.value })
                }
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="inbound-plan-type">
                入库类型
                <FormSelect
                  id="inbound-plan-type"
                  value={generateForm.inbound_type}
                  onChange={(event) =>
                    setGenerateForm({ ...generateForm, inbound_type: event.target.value })
                  }
                >
                  {inboundPlanTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="inbound-plan-date">
                计划入库日
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
            <Button htmlType="submit" icon={<PackagePlus size={16} />} loading={submitting}>
              生成入库计划
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={scheduleSelectedInboundPlan}>
            <div className="form-divider">库位预安排</div>
            <label htmlFor="inbound-schedule-date">
              计划入库日
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
                仓库 ID
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
                仓库
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
                库位 ID
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
                库位
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
              经办人
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
            <PanelTitle icon={<LayoutDashboard size={18} />} title="计划明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(warehouseInboundPlanPath)}>
              返回列表
            </Button>
          </div>
          {selectedPlan ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>采购合同</dt>
                  <dd>{selectedPlan.purchase_contract_no}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedPlan.supplier_name}</dd>
                </div>
                <div>
                  <dt>入库类型</dt>
                  <dd>{inboundPlanTypeLabel(selectedPlan.inbound_type)}</dd>
                </div>
                <div>
                  <dt>计划状态</dt>
                  <dd>{inboundPlanStatusLabel(selectedPlan.status)}</dd>
                </div>
                <div>
                  <dt>计划入库日</dt>
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
                <strong>待入库商品</strong>
                <span>{selectedPlan.lines.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格</th>
                    <th>计划数量</th>
                    <th>已入库</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{`${line.product_code ?? '-'} ${line.product_name}`}</td>
                      <td>{line.specification ?? line.model ?? '未设置'}</td>
                      <td>{`${trimDecimal(line.planned_quantity)} ${line.unit}`}</td>
                      <td>{`${trimDecimal(line.received_quantity)} ${line.unit}`}</td>
                      <td>{inboundPlanLineStatusLabel(line.status)}</td>
                    </tr>
                  ))}
                  {selectedPlan.lines.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        暂无计划明细
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <PackagePlus size={28} />
              <strong>暂无入库计划</strong>
              <span>请返回列表选择入库计划查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


