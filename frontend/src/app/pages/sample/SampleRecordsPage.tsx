import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, Images, LayoutDashboard, Plus, Search } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { createSampleRecord, addSampleRecordImage, addSampleRecordStockEvent, listSampleRecords, importSampleRecords, exportSampleRecords, type SampleRecord, type SampleRecordCreatePayload, type SampleRecordImage, type SampleRecordImagePayload, type SampleRecordStockEvent, type SampleRecordStockEventPayload , SampleRequest, SampleRequestToRecordPayload} from '../../../api'
import { sampleRecordPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { downloadCsv } from '../../../shared/print'
import { sampleRecordTypeOptions, sampleRecordStatusOptions, sampleSourceTypeOptions, sampleStockEventTypeOptions } from '../../../shared/formOptions'
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

type SampleRecordImageFormState = {
  file_id: string
  filename: string
  url: string
  caption: string
}

type SampleRecordStockFormState = {
  event_type: string
  quantity: string
  occurred_at: string
  unit: string
  delivery_no: string
  recipient: string
  note: string
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

function sampleRecordFormFromRequest(
  request: SampleRequest,
  current: SampleRecordFormState,
): SampleRecordFormState {
  const line = request.lines[0]
  return {
    ...current,
    code: `SM-${request.code}`,
    sample_type: 'confirm_sample',
    status: 'registered',
    quantity: line?.quantity ?? current.quantity,
    received_at: todayInputValue(),
    submitted_at: todayInputValue(),
    product_id: line?.product_id ?? request.product_id ?? current.product_id,
    product_code: line?.product_code ?? request.product_code ?? current.product_code,
    product_name: line?.product_name ?? request.product_name ?? current.product_name,
    customer_id: request.customer_id ?? current.customer_id,
    customer_name: request.customer_name,
    supplier_id: request.supplier_id ?? current.supplier_id,
    supplier_name: request.supplier_name ?? current.supplier_name,
    unit: line?.unit ?? current.unit,
    source_type: 'sample_request',
    source_id: request.id,
    source_code: request.code,
    source_note: request.requirements,
    description: line?.requirement ?? request.requirements,
  }
}

function initialSampleRecordImageForm(): SampleRecordImageFormState {
  return {
    file_id: '',
    filename: '',
    url: '',
    caption: '',
  }
}

function initialSampleRecordStockForm(): SampleRecordStockFormState {
  return {
    event_type: 'delivered',
    quantity: '1',
    occurred_at: todayInputValue(),
    unit: 'pcs',
    delivery_no: '',
    recipient: '',
    note: '',
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

function sampleRecordPayload(form: SampleRecordFormState): SampleRecordCreatePayload {
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
    product_id: emptyToNull(form.product_id),
    product_code: emptyToNull(form.product_code),
    product_name: form.product_name.trim(),
    customer_id: emptyToNull(form.customer_id),
    customer_name: emptyToNull(form.customer_name),
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: emptyToNull(form.supplier_name),
    customer_sku: emptyToNull(form.customer_sku),
    supplier_sku: emptyToNull(form.supplier_sku),
    purchase_contract_id: emptyToNull(form.purchase_contract_id),
    purchase_contract_no: emptyToNull(form.purchase_contract_no),
    source_type: emptyToNull(form.source_type),
    source_id: emptyToNull(form.source_id),
    source_code: emptyToNull(form.source_code),
    source_note: emptyToNull(form.source_note),
    received_at: form.received_at,
    submitted_at: emptyToNull(form.submitted_at),
    quantity: form.quantity,
    unit: form.unit.trim(),
    description: emptyToNull(form.description),
    images,
  }
}

function sampleRecordImagePayload(form: SampleRecordImageFormState): SampleRecordImagePayload {
  return {
    file_id: form.file_id.trim(),
    filename: form.filename.trim(),
    url: form.url.trim(),
    caption: emptyToNull(form.caption),
    is_primary: false,
  }
}

function sampleRecordStockPayload(form: SampleRecordStockFormState): SampleRecordStockEventPayload {
  return {
    event_type: form.event_type,
    quantity: form.quantity,
    unit: form.unit.trim(),
    occurred_at: form.occurred_at,
    delivery_no: emptyToNull(form.delivery_no),
    recipient: emptyToNull(form.recipient),
    note: emptyToNull(form.note),
  }
}

function applySampleStockEvent(record: SampleRecord, stockEvent: SampleRecordStockEvent): SampleRecord {
  const received = Number(record.stock_summary.received_quantity)
  const delivered = Number(record.stock_summary.delivered_quantity)
  const quantity = Number(stockEvent.quantity)
  const nextReceived = stockEvent.event_type === 'received' ? received + quantity : received
  const nextDelivered = stockEvent.event_type === 'delivered' ? delivered + quantity : delivered
  const nextRetained = Math.max(nextReceived - nextDelivered, 0)

  return {
    ...record,
    stock_events: [...record.stock_events, stockEvent],
    stock_summary: {
      ...record.stock_summary,
      received_quantity: formatQuantity(nextReceived),
      delivered_quantity: formatQuantity(nextDelivered),
      retained_quantity: formatQuantity(nextRetained),
      unit: stockEvent.unit,
    },
  }
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

function sampleRecordTypeLabel(value: string): string {
  return sampleRecordTypeOptions.find((item) => item.value === value)?.label ?? value
}

function sampleRecordStatusLabel(value: string): string {
  return sampleRecordStatusOptions.find((item) => item.value === value)?.label ?? value
}

function sampleStockEventTypeLabel(value: string): string {
  return sampleStockEventTypeOptions.find((item) => item.value === value)?.label ?? value
}


export function SampleRecordsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [records, setRecords] = useState<SampleRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [purchaseContractFilter, setPurchaseContractFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<SampleRecordFormState>(() => initialSampleRecordForm())
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [imageForm, setImageForm] = useState<SampleRecordImageFormState>(() =>
    initialSampleRecordImageForm(),
  )
  const [stockForm, setStockForm] = useState<SampleRecordStockFormState>(() =>
    initialSampleRecordStockForm(),
  )

  const selectedRecord = useMemo(
    () => {
      if (detailId) return records.find((item) => item.id === detailId) ?? null
      return records.find((item) => item.id === selectedRecordId) ?? records[0] ?? null
    },
    [detailId, records, selectedRecordId],
  )

  useEffect(() => {
    void loadRecords()
  }, [])

  useEffect(() => {
    if (detailId && records.length > 0 && !records.some((item) => item.id === detailId)) {
      onNavigate(sampleRecordPath)
    }
  }, [detailId, onNavigate, records])

  function openRecordDetail(record: SampleRecord) {
    setSelectedRecordId(record.id)
    onNavigate(moduleDetailPath(sampleRecordPath, record.id))
  }

  function stopAndOpenRecordDetail(event: MouseEvent<HTMLElement>, record: SampleRecord) {
    event.stopPropagation()
    openRecordDetail(record)
  }

  async function loadRecords(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listSampleRecords({
        q: search.trim() || undefined,
        sample_type: typeFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
        purchase_contract_id: purchaseContractFilter.trim() || undefined,
      })
      setRecords(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedRecordId) ? selectedRecordId : null) ??
        result.items[0]?.id ??
        null
      setSelectedRecordId(nextSelectedId)
    } catch (caught) {
      showError(caught, '样品台账加载失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreateRecord() {
    setForm(initialSampleRecordForm())
    setRecordModalOpen(true)
  }

  async function submitRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const created = await createSampleRecord(sampleRecordPayload(form))
      setMessage(`已新增样品 ${created.code}`)
      setForm(initialSampleRecordForm())
      setRecordModalOpen(false)
      await loadRecords(created.id)
      setRecords((current) =>
        current.some((record) => record.id === created.id) ? current : [created, ...current],
      )
      setSelectedRecordId(created.id)
    } catch (caught) {
      showError(caught, '样品新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRecord) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const image = await addSampleRecordImage(selectedRecord.id, sampleRecordImagePayload(imageForm))
      setRecords((current) =>
        current.map((record) =>
          record.id === selectedRecord.id ? { ...record, images: [...record.images, image] } : record,
        ),
      )
      setMessage(`已追加样品图片 ${image.filename}`)
      setImageForm(initialSampleRecordImageForm())
    } catch (caught) {
      showError(caught, '样品图片追加失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitStockEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRecord) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const stockEvent = await addSampleRecordStockEvent(
        selectedRecord.id,
        sampleRecordStockPayload(stockForm),
      )
      setRecords((current) =>
        current.map((record) =>
          record.id === selectedRecord.id ? applySampleStockEvent(record, stockEvent) : record,
        ),
      )
      setMessage(`已登记样品数量 ${stockEvent.quantity} ${stockEvent.unit}`)
      setStockForm(initialSampleRecordStockForm())
    } catch (caught) {
      showError(caught, '样品数量登记失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitRecordImport() {
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const result = await importSampleRecords({ records: [sampleRecordPayload(form)] })
      setMessage(`已导入 ${result.created_count} 条样品`)
      setForm(initialSampleRecordForm())
      setRecordModalOpen(false)
      await loadRecords(result.records[0]?.id)
    } catch (caught) {
      showError(caught, '样品导入失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadRecordExport() {
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const exported = await exportSampleRecords({
        q: search.trim() || undefined,
        sample_type: typeFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
        purchase_contract_id: purchaseContractFilter.trim() || undefined,
      })
      downloadCsv(exported.filename, exported.content)
      setMessage(`已导出 ${exported.total} 条样品台账`)
    } catch (caught) {
      showError(caught, '样品导出失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sample-record-page">
      <div className="summary-strip" aria-label="样品登记概览">
        <Metric label="样品" value={records.length} />
        <Metric label="确认样" value={records.filter((item) => item.sample_type === 'confirm_sample').length} />
        <Metric label="图片" value={selectedRecord?.images.length ?? 0} />
        <Metric label="留样" value={Number(selectedRecord?.stock_summary.retained_quantity ?? 0)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid sample-record-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="样品列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadRecords()
              }}
            >
              <label className="inline-filter-search">
                样品搜索
                <Input
                  value={search}
                  placeholder="编号 / 产品 / 客户 / 供应商"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                样品分类筛选
                <FormSelect value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option value="">全部分类</option>
                  {sampleRecordTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label className="inline-filter-compact">
                样品客户筛选
                <Input
                  value={customerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                采购合同筛选
                <Input
                  value={purchaseContractFilter}
                  placeholder="purchase-contract-id"
                  onChange={(event) => setPurchaseContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button loading={submitting} onClick={() => void downloadRecordExport()}>
                导出台账
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateRecord}>
                新增样品
              </Button>
            </form>
          </div>

          <Table<SampleRecord>
            columns={[
              {
                title: '样品编号',
                dataIndex: 'code',
                render: (value: string, record: SampleRecord) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenRecordDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '分类', dataIndex: 'sample_type', render: sampleRecordTypeLabel },
              { title: '产品', dataIndex: 'product_name' },
              { title: '客户货号', dataIndex: 'customer_sku', render: nullableText },
              { title: '供应商货号', dataIndex: 'supplier_sku', render: nullableText },
              { title: '数量', dataIndex: 'quantity', width: 80 },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: SampleRecord) => (
                  <Button size="small" onClick={(event) => stopAndOpenRecordDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={records}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedRecord?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedRecordId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={recordModalOpen}
          title="新增样品"
          width={1040}
          onCancel={() => setRecordModalOpen(false)}
        >
          <form className="record-form entity-modal-form sample-modal-form" onSubmit={submitRecord}>
            <label>
              样品编号
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            </label>
            <label htmlFor="sample-record-type">
              样品分类
              <FormSelect
                id="sample-record-type"
                value={form.sample_type}
                onChange={(event) => setForm({ ...form, sample_type: event.target.value })}
              >
                {sampleRecordTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label htmlFor="sample-record-status">
              样品状态
              <FormSelect
                id="sample-record-status"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {sampleRecordStatusOptions.map((item) => (
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
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
              />
            </label>
            <label>
              收样日期
              <Input
                type="date"
                value={form.received_at}
                onChange={(event) => setForm({ ...form, received_at: event.target.value })}
              />
            </label>
            <label>
              提交日期
              <Input
                type="date"
                value={form.submitted_at}
                onChange={(event) => setForm({ ...form, submitted_at: event.target.value })}
              />
            </label>
            <label>
              产品编号
              <Input
                value={form.product_code}
                onChange={(event) => setForm({ ...form, product_code: event.target.value })}
              />
            </label>
            <label>
              产品名称
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <label>
              客户货号
              <Input
                value={form.customer_sku}
                onChange={(event) => setForm({ ...form, customer_sku: event.target.value })}
              />
            </label>
            <label>
              供应商货号
              <Input
                value={form.supplier_sku}
                onChange={(event) => setForm({ ...form, supplier_sku: event.target.value })}
              />
            </label>
            <label>
              客户名称
              <Input
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </label>
            <label>
              供应商名称
              <Input
                value={form.supplier_name}
                onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
              />
            </label>
            <label>
              采购合同号
              <Input
                value={form.purchase_contract_no}
                onChange={(event) =>
                  setForm({
                    ...form,
                    purchase_contract_no: event.target.value,
                    purchase_contract_id: event.target.value,
                  })
                }
              />
            </label>
            <label>
              单位
              <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
            </label>
            <label htmlFor="sample-record-source-type">
              样品来源
              <FormSelect
                id="sample-record-source-type"
                value={form.source_type}
                onChange={(event) => setForm({ ...form, source_type: event.target.value })}
              >
                {sampleSourceTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              来源单号
              <Input
                value={form.source_code}
                onChange={(event) => setForm({ ...form, source_code: event.target.value })}
              />
            </label>
            <label>
              样品说明
              <Input.TextArea
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <div className="form-divider">样品图片</div>
            <label>
              图片文件标识
              <Input
                value={form.image_file_id}
                onChange={(event) => setForm({ ...form, image_file_id: event.target.value })}
              />
            </label>
            <label>
              图片文件名
              <Input
                value={form.image_filename}
                onChange={(event) => setForm({ ...form, image_filename: event.target.value })}
              />
            </label>
            <label>
              图片地址
              <Input
                value={form.image_url}
                onChange={(event) => setForm({ ...form, image_url: event.target.value })}
              />
            </label>
            <label>
              图片说明
              <Input
                value={form.image_caption}
                onChange={(event) => setForm({ ...form, image_caption: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button className="secondary-inline" type="button" onClick={() => setRecordModalOpen(false)}>
                取消
              </button>
              <button className="secondary-inline" disabled={submitting} type="button" onClick={() => void submitRecordImport()}>
                按当前表单导入
              </button>
              <button className="inline-submit" disabled={submitting} type="submit">
                新增样品
              </button>
            </div>
          </form>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="样品明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(sampleRecordPath)}>
              返回列表
            </Button>
          </div>
          {selectedRecord ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>样品编号</dt>
                  <dd>{selectedRecord.code}</dd>
                </div>
                <div>
                  <dt>分类/状态</dt>
                  <dd>{sampleRecordTypeLabel(selectedRecord.sample_type)} / {sampleRecordStatusLabel(selectedRecord.status)}</dd>
                </div>
                <div>
                  <dt>产品</dt>
                  <dd>{selectedRecord.product_code ?? '-'} / {selectedRecord.product_name}</dd>
                </div>
                <div>
                  <dt>客户/供应商</dt>
                  <dd>{selectedRecord.customer_name ?? '-'} / {selectedRecord.supplier_name ?? '-'}</dd>
                </div>
                <div>
                  <dt>客户货号</dt>
                  <dd>{selectedRecord.customer_sku ?? '-'}</dd>
                </div>
                <div>
                  <dt>供应商货号</dt>
                  <dd>{selectedRecord.supplier_sku ?? '-'}</dd>
                </div>
                <div>
                  <dt>采购合同</dt>
                  <dd>{selectedRecord.purchase_contract_no ?? '-'}</dd>
                </div>
                <div>
                  <dt>收样/提交</dt>
                  <dd>{formatDate(selectedRecord.received_at)} / {formatDate(selectedRecord.submitted_at)}</dd>
                </div>
              </dl>

              <Table
                className="compact-section"
                columns={[
                  { title: '收样数', dataIndex: 'received_quantity' },
                  { title: '寄样数', dataIndex: 'delivered_quantity' },
                  { title: '公司留样', dataIndex: 'retained_quantity' },
                  { title: '单位', dataIndex: 'unit' },
                ]}
                dataSource={[selectedRecord.stock_summary]}
                pagination={false}
                rowKey="sample_record_id"
                size="small"
              />

              <Table<SampleRecordImage>
                className="compact-section"
                columns={[
                  { title: '图片文件', dataIndex: 'filename' },
                  { title: '文件标识', dataIndex: 'file_id' },
                  { title: '图片地址', dataIndex: 'url' },
                  { title: '说明', dataIndex: 'caption', render: nullableText },
                  {
                    title: '主图',
                    dataIndex: 'is_primary',
                    width: 72,
                    render: (value: boolean) => (value ? '是' : '否'),
                  },
                ]}
                dataSource={selectedRecord.images}
                locale={{ emptyText: '暂无样品图片' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <Table
                className="compact-section"
                columns={[
                  { title: '跟单节点', dataIndex: 'node_label' },
                  { title: '实际日期', dataIndex: 'actual_date', render: formatDate },
                  { title: '采购合同', dataIndex: 'purchase_contract_no', render: nullableText },
                  { title: '事件', dataIndex: 'event_type' },
                ]}
                dataSource={selectedRecord.followup_events}
                locale={{ emptyText: '暂无跟单节点事件' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="sample-record-actions compact-section">
                <form className="record-form" onSubmit={submitImage}>
                  <div className="form-divider">追加图片</div>
                  <label>
                    图片文件标识
                    <Input
                      value={imageForm.file_id}
                      onChange={(event) => setImageForm({ ...imageForm, file_id: event.target.value })}
                    />
                  </label>
                  <label>
                    图片文件名
                    <Input
                      value={imageForm.filename}
                      onChange={(event) => setImageForm({ ...imageForm, filename: event.target.value })}
                    />
                  </label>
                  <label>
                    图片地址
                    <Input
                      value={imageForm.url}
                      onChange={(event) => setImageForm({ ...imageForm, url: event.target.value })}
                    />
                  </label>
                  <label>
                    图片说明
                    <Input
                      value={imageForm.caption}
                      onChange={(event) => setImageForm({ ...imageForm, caption: event.target.value })}
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    追加样品图片
                  </Button>
                </form>

                <form className="record-form" onSubmit={submitStockEvent}>
                  <div className="form-divider">数量事件</div>
                  <label>
                    事件类型
                  <FormSelect
                    value={stockForm.event_type}
                    onChange={(event) => setStockForm({ ...stockForm, event_type: event.target.value })}
                  >
                    {sampleStockEventTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                  </label>
                  <label>
                    数量
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={stockForm.quantity}
                      onChange={(event) => setStockForm({ ...stockForm, quantity: event.target.value })}
                    />
                  </label>
                  <label>
                    日期
                    <Input
                      type="date"
                      value={stockForm.occurred_at}
                      onChange={(event) => setStockForm({ ...stockForm, occurred_at: event.target.value })}
                    />
                  </label>
                  <label>
                    单位
                    <Input
                      value={stockForm.unit}
                      onChange={(event) => setStockForm({ ...stockForm, unit: event.target.value })}
                    />
                  </label>
                  <label>
                    寄样单号
                    <Input
                      value={stockForm.delivery_no}
                      onChange={(event) => setStockForm({ ...stockForm, delivery_no: event.target.value })}
                    />
                  </label>
                  <label>
                    接收方
                    <Input
                      value={stockForm.recipient}
                      onChange={(event) => setStockForm({ ...stockForm, recipient: event.target.value })}
                    />
                  </label>
                  <label>
                    事件备注
                    <Input.TextArea
                      rows={2}
                      value={stockForm.note}
                      onChange={(event) => setStockForm({ ...stockForm, note: event.target.value })}
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    登记样品数量
                  </Button>
                </form>
              </div>

              <Table<SampleRecordStockEvent>
                className="compact-section"
                columns={[
                  { title: '事件类型', dataIndex: 'event_type', render: sampleStockEventTypeLabel },
                  { title: '数量', dataIndex: 'quantity' },
                  { title: '单位', dataIndex: 'unit' },
                  { title: '日期', dataIndex: 'occurred_at', render: formatDate },
                  { title: '寄样单号', dataIndex: 'delivery_no', render: nullableText },
                  { title: '接收方', dataIndex: 'recipient', render: nullableText },
                  { title: '备注', dataIndex: 'note', render: nullableText },
                ]}
                dataSource={selectedRecord.stock_events}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Images size={28} />
              <strong>暂无样品记录</strong>
              <span>请返回列表选择样品查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


