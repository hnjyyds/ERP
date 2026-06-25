import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, FlaskConical, Images, LayoutDashboard, Plus, Search } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createSampleRequest, addSampleProgress, addSampleFee, requestSampleFeePayment, createSampleRecordFromRequest, listSampleRequests, type SampleRequest, type SampleRequestCreatePayload, type SampleRequestLinePayload, type SampleRequestToRecordPayload, type SampleFee, type SampleFeePayload, type SampleProgress, type SampleProgressPayload, type SampleRecord, type SampleRecordCreatePayload , SampleRecordImagePayload} from '../../../api'
import { sampleRequestPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { openSampleRequestPrint } from '../../../shared/print'
import { sampleStatusOptions, sampleDestinationOptions, sampleProgressStageOptions, sampleFeeTypeOptions, samplePayeeTypeOptions, sampleRecordTypeOptions, sampleSourceTypeOptions } from '../../../shared/formOptions'
import { formatDate, nullableText, todayInputValue, type RoutedDetailPageProps , emptyToNull} from '../appHelpers'

type SampleRecordFormState = {
  code: string
  sample_type: string
  status: string
  quantity: string
  received_at: string
  submitted_at: string
  product_id: string
  product_code: string
  product_name: string
  customer_id: string
  customer_name: string
  supplier_id: string
  supplier_name: string
  customer_sku: string
  supplier_sku: string
  purchase_contract_id: string
  purchase_contract_no: string
  unit: string
  source_type: string
  source_id: string
  source_code: string
  source_note: string
  description: string
  image_file_id: string
  image_filename: string
  image_url: string
  image_caption: string
}


function sampleRecordFormFromRequest(
  request: SampleRequest,
  current: SampleRecordFormState,
): SampleRecordFormState {
  const line = request.lines[0]
  return {
    ...current,
    code: `SM-${Date.now().toString().slice(-6)}`,
    sample_type: 'confirm_sample',
    product_id: line?.product_id ?? current.product_id,
    product_code: line?.product_code ?? current.product_code,
    product_name: line?.product_name ?? current.product_name,
    customer_id: request.customer_id ?? current.customer_id,
    customer_name: request.customer_name ?? current.customer_name,
    supplier_id: request.supplier_id ?? current.supplier_id,
    supplier_name: request.supplier_name ?? current.supplier_name,
    source_type: 'sample_request',
    source_id: request.id,
    source_code: request.code,
    source_note: `来自样品申请 ${request.code}`,
  }
}

function sampleRequestToRecordPayload(form: SampleRecordFormState): SampleRequestToRecordPayload {
  const images: SampleRecordImagePayload[] = []
  if (form.image_file_id.trim() && form.image_filename.trim() && form.image_url.trim()) {
    images.push({
      file_id: form.image_file_id.trim(),
      filename: form.image_filename.trim(),
      url: form.image_url.trim(),
      caption: emptyToNull(form.image_caption),
      is_primary: true,
    })
  }

  return {
    code: form.code.trim(),
    sample_type: form.sample_type,
    status: form.status,
    received_at: form.received_at,
    submitted_at: emptyToNull(form.submitted_at),
    quantity: form.quantity,
    unit: form.unit.trim(),
    customer_sku: emptyToNull(form.customer_sku),
    supplier_sku: emptyToNull(form.supplier_sku),
    purchase_contract_id: emptyToNull(form.purchase_contract_id),
    purchase_contract_no: emptyToNull(form.purchase_contract_no),
    description: emptyToNull(form.description),
    images,
  }
}


type SampleRequestFormState = {
  code: string
  status: string
  request_date: string
  due_date: string
  customer_id: string
  customer_name: string
  product_id: string
  product_code: string
  product_name: string
  supplier_id: string
  supplier_name: string
  sales_user_id: string
  sales_user_name: string
  destination: string
  requirements: string
  line_product_id: string
  line_product_code: string
  line_product_name: string
  line_specification: string
  line_quantity: string
  line_unit: string
  line_requirement: string
}

type SampleProgressFormState = {
  stage: string
  status: string
  occurred_at: string
  handler_name: string
  note: string
}

type SampleFeeFormState = {
  fee_type: string
  amount: string
  currency: string
  payee_type: string
  payee_name: string
  remark: string
}


function initialSampleRecordForm(): SampleRecordFormState {
  return {
    code: `SM-${Date.now().toString().slice(-6)}`,
    sample_type: 'confirm_sample',
    status: 'registered',
    quantity: '1',
    received_at: todayInputValue(),
    submitted_at: todayInputValue(),
    product_id: '',
    product_code: '',
    product_name: '',
    customer_id: '',
    customer_name: '',
    supplier_id: '',
    supplier_name: '',
    customer_sku: '',
    supplier_sku: '',
    purchase_contract_id: '',
    purchase_contract_no: '',
    unit: 'pcs',
    source_type: 'sample_request',
    source_id: '',
    source_code: '',
    source_note: '',
    description: '',
    image_file_id: '',
    image_filename: '',
    image_url: '',
    image_caption: '',
  }
}

function initialSampleRequestForm(): SampleRequestFormState {
  return {
    code: `SR-${Date.now().toString().slice(-6)}`,
    status: 'draft',
    request_date: todayInputValue(),
    due_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    product_id: '',
    product_code: '',
    product_name: '',
    supplier_id: '',
    supplier_name: '',
    sales_user_id: '',
    sales_user_name: '',
    destination: 'in_house',
    requirements: '',
    line_product_id: '',
    line_product_code: '',
    line_product_name: '',
    line_specification: '',
    line_quantity: '1',
    line_unit: 'pcs',
    line_requirement: '',
  }
}
function initialSampleProgressForm(): SampleProgressFormState {
  return {
    stage: 'sent_to_factory',
    status: 'in_progress',
    occurred_at: todayInputValue(),
    handler_name: '',
    note: '',
  }
}

function initialSampleFeeForm(): SampleFeeFormState {
  return {
    fee_type: 'sample_making',
    amount: '0',
    currency: 'USD',
    payee_type: 'supplier',
    payee_name: '',
    remark: '',
  }
}

function sampleRequestPayload(form: SampleRequestFormState): SampleRequestCreatePayload {
  const lines: SampleRequestLinePayload[] = []
  if (form.line_product_name.trim()) {
    lines.push({
      product_id: emptyToNull(form.line_product_id),
      product_code: emptyToNull(form.line_product_code),
      product_name: form.line_product_name.trim(),
      specification: emptyToNull(form.line_specification),
      quantity: form.line_quantity,
      unit: form.line_unit.trim(),
      requirement: emptyToNull(form.line_requirement),
    })
  }

  return {
    code: form.code.trim(),
    request_date: form.request_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    product_id: emptyToNull(form.product_id),
    product_code: emptyToNull(form.product_code),
    product_name: emptyToNull(form.product_name),
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: emptyToNull(form.supplier_name),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    destination: form.destination,
    requirements: form.requirements.trim(),
    due_date: emptyToNull(form.due_date),
    status: form.status,
    lines,
  }
}

function sampleProgressPayload(form: SampleProgressFormState): SampleProgressPayload {
  return {
    stage: form.stage,
    status: form.status,
    occurred_at: form.occurred_at,
    handler_name: emptyToNull(form.handler_name),
    note: emptyToNull(form.note),
  }
}

function sampleFeePayload(form: SampleFeeFormState): SampleFeePayload {
  return {
    fee_type: form.fee_type,
    amount: form.amount,
    currency: form.currency.trim(),
    payee_type: form.payee_type,
    payee_name: form.payee_name.trim(),
    remark: emptyToNull(form.remark),
  }
}

function sampleStatusLabel(value: string): string {
  return sampleStatusOptions.find((item) => item.value === value)?.label ?? value
}

function sampleDestinationLabel(value: string): string {
  return sampleDestinationOptions.find((item) => item.value === value)?.label ?? value
}

function sampleProgressStageLabel(value: string): string {
  return sampleProgressStageOptions.find((item) => item.value === value)?.label ?? value
}

function sampleFeeTypeLabel(value: string): string {
  return sampleFeeTypeOptions.find((item) => item.value === value)?.label ?? value
}

function samplePaymentStatusLabel(value: string): string {
  if (value === 'requested') return '已申请'
  if (value === 'paid') return '已付款'
  return '未申请'
}


export function SampleRequestsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [requests, setRequests] = useState<SampleRequest[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<SampleRequestFormState>(() => initialSampleRequestForm())
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [progressForm, setProgressForm] = useState<SampleProgressFormState>(() =>
    initialSampleProgressForm(),
  )
  const [feeForm, setFeeForm] = useState<SampleFeeFormState>(() => initialSampleFeeForm())
  const [recordForm, setRecordForm] = useState<SampleRecordFormState>(() =>
    initialSampleRecordForm(),
  )

  const selectedRequest = useMemo(
    () => {
      if (detailId) return requests.find((item) => item.id === detailId) ?? null
      return requests.find((item) => item.id === selectedRequestId) ?? requests[0] ?? null
    },
    [detailId, requests, selectedRequestId],
  )

  useEffect(() => {
    void loadRequests()
  }, [])

  useEffect(() => {
    if (detailId && requests.length > 0 && !requests.some((item) => item.id === detailId)) {
      onNavigate(sampleRequestPath)
    }
  }, [detailId, onNavigate, requests])

  function openRequestDetail(request: SampleRequest) {
    setSelectedRequestId(request.id)
    onNavigate(moduleDetailPath(sampleRequestPath, request.id))
  }

  function stopAndOpenRequestDetail(event: MouseEvent<HTMLElement>, request: SampleRequest) {
    event.stopPropagation()
    openRequestDetail(request)
  }

  async function loadRequests(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listSampleRequests({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
      })
      setRequests(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedRequestId) ? selectedRequestId : null) ??
        result.items[0]?.id ??
        null
      setSelectedRequestId(nextSelectedId)
    } catch (caught) {
      showError(caught, '打样单加载失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreateRequest() {
    setForm(initialSampleRequestForm())
    setRequestModalOpen(true)
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const created = await createSampleRequest(sampleRequestPayload(form))
      setMessage(`已新增打样单 ${created.code}`)
      setForm(initialSampleRequestForm())
      setRequestModalOpen(false)
      await loadRequests(created.id)
    } catch (caught) {
      showError(caught, '打样单新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const progress = await addSampleProgress(selectedRequest.id, sampleProgressPayload(progressForm))
      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? {
                ...item,
                status: progress.status,
                progress_events: [...item.progress_events, progress],
              }
            : item,
        ),
      )
      setMessage(`已更新打样进度 ${sampleProgressStageLabel(progress.stage)}`)
      setProgressForm(initialSampleProgressForm())
    } catch (caught) {
      showError(caught, '打样进度更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitFee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const fee = await addSampleFee(selectedRequest.id, sampleFeePayload(feeForm))
      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id ? { ...item, fees: [...item.fees, fee] } : item,
        ),
      )
      setMessage(`已登记打样费用 ${fee.currency} ${fee.amount}`)
      setFeeForm(initialSampleFeeForm())
    } catch (caught) {
      showError(caught, '打样费用登记失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitPaymentRequest(fee: SampleFee) {
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updatedFee = await requestSampleFeePayment(selectedRequest.id, fee.id)
      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? {
                ...item,
                fees: item.fees.map((currentFee) =>
                  currentFee.id === updatedFee.id ? updatedFee : currentFee,
                ),
              }
            : item,
        ),
      )
      setMessage('已发起打样费用付款申请')
    } catch (caught) {
      showError(caught, '打样费用付款发起失败')
    } finally {
      setSubmitting(false)
    }
  }

  function loadRequestIntoRecordForm(request: SampleRequest) {
    setRecordForm(sampleRecordFormFromRequest(request, recordForm))
    setMessage(`已载入 ${request.code}，可转为样品登记`)
  }

  async function submitRecordFromRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const record = await createSampleRecordFromRequest(
        selectedRequest.id,
        sampleRequestToRecordPayload(recordForm),
      )
      setMessage(`已转为样品 ${record.code}`)
      setRecordForm(initialSampleRecordForm())
    } catch (caught) {
      showError(caught, '打样转样品失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sample-request-page">
      <div className="summary-strip" aria-label="打样管理概览">
        <Metric label="打样单" value={requests.length} />
        <Metric label="进行中" value={requests.filter((item) => item.status === 'in_progress').length} />
        <Metric label="进度记录" value={selectedRequest?.progress_events.length ?? 0} />
        <Metric label="费用记录" value={selectedRequest?.fees.length ?? 0} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid sample-request-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="打样单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadRequests()
              }}
            >
              <label className="inline-filter-search">
                打样搜索
                <Input
                  value={search}
                  placeholder="编号 / 客户 / 产品 / 供应商"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                打样状态筛选
                <FormSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">全部状态</option>
                  {sampleStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label className="inline-filter-compact">
                打样客户筛选
                <Input
                  value={customerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                打样起始日期
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(event) => setDateFromFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                打样截止日期
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(event) => setDateToFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateRequest}>
                新增打样单
              </Button>
            </form>
          </div>

          <Table<SampleRequest>
            columns={[
              {
                title: '打样单号',
                dataIndex: 'code',
                render: (value: string, record: SampleRequest) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenRequestDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '产品', dataIndex: 'product_name', render: nullableText },
              {
                title: '去向',
                dataIndex: 'destination',
                render: sampleDestinationLabel,
              },
              {
                title: '状态',
                dataIndex: 'status',
                render: sampleStatusLabel,
              },
              { title: '要求完成', dataIndex: 'due_date', render: formatDate },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: SampleRequest) => (
                  <Button size="small" onClick={(event) => stopAndOpenRequestDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={requests}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedRequest?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedRequestId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={requestModalOpen}
          title="新增打样单"
          width={980}
          onCancel={() => setRequestModalOpen(false)}
        >
          <form className="record-form entity-modal-form sample-modal-form" onSubmit={submitRequest}>
            <label>
              打样单号
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            </label>
            <label htmlFor="sample-request-status">
              打样状态
              <FormSelect
                id="sample-request-status"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {sampleStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              打样日期
              <Input
                type="date"
                value={form.request_date}
                onChange={(event) => setForm({ ...form, request_date: event.target.value })}
              />
            </label>
            <label>
              要求完成日期
              <Input
                type="date"
                value={form.due_date}
                onChange={(event) => setForm({ ...form, due_date: event.target.value })}
              />
            </label>
            <label>
              打样客户标识
              <Input
                value={form.customer_id}
                onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
              />
            </label>
            <label>
              打样客户名称
              <Input
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </label>
            <label>
              打样产品编号
              <Input
                value={form.product_code}
                onChange={(event) => setForm({ ...form, product_code: event.target.value })}
              />
            </label>
            <label>
              打样产品名称
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <label>
              打样供应商名称
              <Input
                value={form.supplier_name}
                onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
              />
            </label>
            <label htmlFor="sample-request-destination">
              打样去向
              <FormSelect
                id="sample-request-destination"
                value={form.destination}
                onChange={(event) => setForm({ ...form, destination: event.target.value })}
              >
                {sampleDestinationOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              客户打样要求
              <Input.TextArea
                rows={3}
                value={form.requirements}
                onChange={(event) => setForm({ ...form, requirements: event.target.value })}
              />
            </label>
            <div className="form-divider">内部打样单明细</div>
            <label>
              明细产品编号
              <Input
                value={form.line_product_code}
                onChange={(event) =>
                  setForm({ ...form, line_product_code: event.target.value, line_product_id: event.target.value })
                }
              />
            </label>
            <label>
              明细产品名称
              <Input
                value={form.line_product_name}
                onChange={(event) => setForm({ ...form, line_product_name: event.target.value })}
              />
            </label>
            <label>
              明细规格
              <Input
                value={form.line_specification}
                onChange={(event) => setForm({ ...form, line_specification: event.target.value })}
              />
            </label>
            <label>
              明细数量
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.line_quantity}
                onChange={(event) => setForm({ ...form, line_quantity: event.target.value })}
              />
            </label>
            <label>
              明细单位
              <Input
                value={form.line_unit}
                onChange={(event) => setForm({ ...form, line_unit: event.target.value })}
              />
            </label>
            <label>
              明细要求
              <Input.TextArea
                rows={2}
                value={form.line_requirement}
                onChange={(event) => setForm({ ...form, line_requirement: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button className="secondary-inline" type="button" onClick={() => setRequestModalOpen(false)}>
                取消
              </button>
              <button className="inline-submit" disabled={submitting} type="submit">
                新增打样单
              </button>
            </div>
          </form>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="打样单明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(sampleRequestPath)}>
              返回列表
            </Button>
          </div>
          {selectedRequest ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>打样单号</dt>
                  <dd>{selectedRequest.code}</dd>
                </div>
                <div>
                  <dt>客户/产品</dt>
                  <dd>{selectedRequest.customer_name} / {selectedRequest.product_name ?? '-'}</dd>
                </div>
                <div>
                  <dt>去向/状态</dt>
                  <dd>{sampleDestinationLabel(selectedRequest.destination)} / {sampleStatusLabel(selectedRequest.status)}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedRequest.supplier_name ?? '未设置'}</dd>
                </div>
                <div>
                  <dt>打样日期</dt>
                  <dd>{formatDate(selectedRequest.request_date)}</dd>
                </div>
                <div>
                  <dt>要求完成</dt>
                  <dd>{formatDate(selectedRequest.due_date)}</dd>
                </div>
                <div>
                  <dt>客户要求</dt>
                  <dd>{selectedRequest.requirements}</dd>
                </div>
              </dl>

              <div className="delivery-action-row">
                <Button onClick={() => void openSampleRequestPrint(selectedRequest.id)}>
                  打印内部打样单
                </Button>
                <Button
                  disabled={selectedRequest.status !== 'completed'}
                  onClick={() => loadRequestIntoRecordForm(selectedRequest)}
                >
                  载入为样品
                </Button>
              </div>

              <section className="compact-section">
                <PanelTitle icon={<Search size={18} />} title="内部打样单明细" />
                <Table
                  columns={[
                    { title: '产品编号', dataIndex: 'product_code', render: nullableText },
                    { title: '产品名称', dataIndex: 'product_name' },
                    { title: '规格', dataIndex: 'specification', render: nullableText },
                    { title: '数量', dataIndex: 'quantity', width: 90 },
                    { title: '单位', dataIndex: 'unit', width: 80 },
                    { title: '要求', dataIndex: 'requirement', render: nullableText },
                  ]}
                  dataSource={selectedRequest.lines}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />
              </section>

              <form className="record-form compact-section" onSubmit={submitProgress}>
                <div className="form-divider">打样进度</div>
                <label>
                  进度阶段
                <FormSelect
                  value={progressForm.stage}
                  onChange={(event) => setProgressForm({ ...progressForm, stage: event.target.value })}
                >
                  {sampleProgressStageOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
                </label>
                <label>
                  进度状态
                <FormSelect
                  value={progressForm.status}
                  onChange={(event) => setProgressForm({ ...progressForm, status: event.target.value })}
                >
                  {sampleStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
                </label>
                <label>
                  进度日期
                  <Input
                    type="date"
                    value={progressForm.occurred_at}
                    onChange={(event) => setProgressForm({ ...progressForm, occurred_at: event.target.value })}
                  />
                </label>
                <label>
                  进度经办人
                  <Input
                    value={progressForm.handler_name}
                    onChange={(event) => setProgressForm({ ...progressForm, handler_name: event.target.value })}
                  />
                </label>
                <label>
                  进度说明
                  <Input.TextArea
                    rows={2}
                    value={progressForm.note}
                    onChange={(event) => setProgressForm({ ...progressForm, note: event.target.value })}
                  />
                </label>
                <Button htmlType="submit" loading={submitting} type="primary">
                  更新打样进度
                </Button>
              </form>

              <Table<SampleProgress>
                className="compact-section"
                columns={[
                  { title: '阶段', dataIndex: 'stage', render: sampleProgressStageLabel },
                  { title: '状态', dataIndex: 'status', render: sampleStatusLabel },
                  { title: '日期', dataIndex: 'occurred_at', render: formatDate },
                  { title: '经办人', dataIndex: 'handler_name', render: nullableText },
                  { title: '说明', dataIndex: 'note', render: nullableText },
                ]}
                dataSource={selectedRequest.progress_events}
                locale={{ emptyText: '暂无进度记录' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <form className="record-form compact-section" onSubmit={submitFee}>
                <div className="form-divider">打样费用</div>
                <label>
                  打样费用类型
                <FormSelect
                  value={feeForm.fee_type}
                  onChange={(event) => setFeeForm({ ...feeForm, fee_type: event.target.value })}
                >
                  {sampleFeeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
                </label>
                <label>
                  打样费用金额
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={feeForm.amount}
                    onChange={(event) => setFeeForm({ ...feeForm, amount: event.target.value })}
                  />
                </label>
                <label>
                  打样费用币种
                  <Input
                    value={feeForm.currency}
                    onChange={(event) => setFeeForm({ ...feeForm, currency: event.target.value })}
                  />
                </label>
                <label>
                  收款方类型
                <FormSelect
                  value={feeForm.payee_type}
                  onChange={(event) => setFeeForm({ ...feeForm, payee_type: event.target.value })}
                >
                  {samplePayeeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
                </label>
                <label>
                  收款方名称
                  <Input
                    value={feeForm.payee_name}
                    onChange={(event) => setFeeForm({ ...feeForm, payee_name: event.target.value })}
                  />
                </label>
                <label>
                  打样费用备注
                  <Input.TextArea
                    rows={2}
                    value={feeForm.remark}
                    onChange={(event) => setFeeForm({ ...feeForm, remark: event.target.value })}
                  />
                </label>
                <Button htmlType="submit" loading={submitting}>
                  登记打样费用
                </Button>
              </form>

              <Table<SampleFee>
                className="compact-section"
                columns={[
                  { title: '费用类型', dataIndex: 'fee_type', render: sampleFeeTypeLabel },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (_, record) => `${record.currency} ${record.amount}`,
                  },
                  { title: '收款方', dataIndex: 'payee_name' },
                  { title: '付款状态', dataIndex: 'payment_status', render: samplePaymentStatusLabel },
                  { title: '付款申请', dataIndex: 'payment_request_no', render: nullableText },
                  {
                    title: '操作',
                    dataIndex: 'id',
                    width: 120,
                    render: (_, record) => (
                      <Button
                        disabled={Boolean(record.payment_request_no)}
                        loading={submitting}
                        size="small"
                        onClick={() => void submitPaymentRequest(record)}
                      >
                        发起付款
                      </Button>
                    ),
                  },
                ]}
                dataSource={selectedRequest.fees}
                locale={{ emptyText: '暂无打样费用' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <form className="record-form compact-section" onSubmit={submitRecordFromRequest}>
                <div className="form-divider">打样完成转样品登记</div>
                <div className="form-pair three">
                    <label>
                    样品编号
                    <Input
                      value={recordForm.code}
                      onChange={(event) => setRecordForm({ ...recordForm, code: event.target.value })}
                    />
                  </label>
                  <label>
                    样品分类
                  <FormSelect
                    value={recordForm.sample_type}
                    onChange={(event) => setRecordForm({ ...recordForm, sample_type: event.target.value })}
                  >
                    {sampleRecordTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                  </label>
                  <label>
                    收样数量
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={recordForm.quantity}
                      onChange={(event) => setRecordForm({ ...recordForm, quantity: event.target.value })}
                    />
                  </label>
                </div>
                <div className="form-pair three">
                  <label>
                    收样日期
                    <Input
                      type="date"
                      value={recordForm.received_at}
                      onChange={(event) => setRecordForm({ ...recordForm, received_at: event.target.value })}
                    />
                  </label>
                  <label>
                    提交日期
                    <Input
                      type="date"
                      value={recordForm.submitted_at}
                      onChange={(event) => setRecordForm({ ...recordForm, submitted_at: event.target.value })}
                    />
                  </label>
                  <label>
                    单位
                    <Input
                      value={recordForm.unit}
                      onChange={(event) => setRecordForm({ ...recordForm, unit: event.target.value })}
                    />
                  </label>
                </div>
                <div className="form-pair two">
                  <label>
                    客户货号
                    <Input
                      value={recordForm.customer_sku}
                      onChange={(event) => setRecordForm({ ...recordForm, customer_sku: event.target.value })}
                    />
                  </label>
                  <label>
                    供应商货号
                    <Input
                      value={recordForm.supplier_sku}
                      onChange={(event) => setRecordForm({ ...recordForm, supplier_sku: event.target.value })}
                    />
                  </label>
                </div>
                <div className="form-pair two">
                  <label>
                    采购合同标识
                    <Input
                      value={recordForm.purchase_contract_id}
                      onChange={(event) =>
                        setRecordForm({ ...recordForm, purchase_contract_id: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    采购合同号
                    <Input
                      value={recordForm.purchase_contract_no}
                      onChange={(event) =>
                        setRecordForm({ ...recordForm, purchase_contract_no: event.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  样品说明
                  <Input.TextArea
                    rows={2}
                    value={recordForm.description}
                    onChange={(event) => setRecordForm({ ...recordForm, description: event.target.value })}
                  />
                </label>
                <Button
                  disabled={selectedRequest.status !== 'completed'}
                  htmlType="submit"
                  loading={submitting}
                  type="primary"
                >
                  转为样品登记
                </Button>
              </form>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FlaskConical size={28} />
              <strong>暂无打样单</strong>
              <span>请返回列表选择打样单查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


