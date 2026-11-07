import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, Images, LayoutDashboard, Plus, Search } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createSampleRecord,
  addSampleRecordImage,
  addSampleRecordStockEvent,
  listSampleRecords,
  importSampleRecords,
  exportSampleRecords,
  type SampleRecord,
  type SampleRecordCreatePayload,
  type SampleRecordImage,
  type SampleRecordImagePayload,
  type SampleRecordStockEvent,
  type SampleRecordStockEventPayload,
  SampleRequest,
  SampleRequestToRecordPayload,
} from '../../../api'
import { sampleRecordPath, moduleDetailPath } from '../../routes'
import { t } from '../../appI18n'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { downloadCsv } from '../../../shared/print'
import {
  sampleRecordTypeOptions,
  sampleRecordStatusOptions,
  sampleSourceTypeOptions,
  sampleStockEventTypeOptions,
} from '../../../shared/formOptions'
import {
  formatDate,
  nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '../appHelpers'

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

function _sampleRecordFormFromRequest(
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

function _sampleRequestToRecordPayload(form: SampleRecordFormState): SampleRequestToRecordPayload {
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

function applySampleStockEvent(
  record: SampleRecord,
  stockEvent: SampleRecordStockEvent,
): SampleRecord {
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
  const option = sampleRecordTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function sampleRecordStatusLabel(value: string): string {
  const option = sampleRecordStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function sampleStockEventTypeLabel(value: string): string {
  const option = sampleStockEventTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
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
  const [form, setForm] = useState<SampleRecordFormState>(() => initialSampleRecordForm())
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [imageForm, setImageForm] = useState<SampleRecordImageFormState>(() =>
    initialSampleRecordImageForm(),
  )
  const [stockForm, setStockForm] = useState<SampleRecordStockFormState>(() =>
    initialSampleRecordStockForm(),
  )

  const selectedRecord = useMemo(() => {
    if (detailId) return records.find((item) => item.id === detailId) ?? null
    return records.find((item) => item.id === selectedRecordId) ?? records[0] ?? null
  }, [detailId, records, selectedRecordId])

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
      showError(caught, t('sample.record.message.loadFailed'))
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
    try {
      const created = await createSampleRecord(sampleRecordPayload(form))
      setMessage(t('sample.record.message.created', { code: created.code }))
      setForm(initialSampleRecordForm())
      setRecordModalOpen(false)
      await loadRecords(created.id)
      setRecords((current) =>
        current.some((record) => record.id === created.id) ? current : [created, ...current],
      )
      setSelectedRecordId(created.id)
    } catch (caught) {
      showError(caught, t('sample.record.message.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRecord) return
    setSubmitting(true)
    setMessage('')
    try {
      const image = await addSampleRecordImage(
        selectedRecord.id,
        sampleRecordImagePayload(imageForm),
      )
      setRecords((current) =>
        current.map((record) =>
          record.id === selectedRecord.id
            ? { ...record, images: [...record.images, image] }
            : record,
        ),
      )
      setMessage(t('sample.record.message.imageAdded', { filename: image.filename }))
      setImageForm(initialSampleRecordImageForm())
    } catch (caught) {
      showError(caught, t('sample.record.message.imageAddFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitStockEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRecord) return
    setSubmitting(true)
    setMessage('')
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
      setMessage(
        t('sample.record.message.stockEventRegistered', {
          quantity: stockEvent.quantity,
          unit: stockEvent.unit,
        }),
      )
      setStockForm(initialSampleRecordStockForm())
    } catch (caught) {
      showError(caught, t('sample.record.message.stockEventFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitRecordImport() {
    setSubmitting(true)
    setMessage('')
    try {
      const result = await importSampleRecords({ records: [sampleRecordPayload(form)] })
      setMessage(t('sample.record.message.imported', { count: result.created_count }))
      setForm(initialSampleRecordForm())
      setRecordModalOpen(false)
      await loadRecords(result.records[0]?.id)
    } catch (caught) {
      showError(caught, t('sample.record.message.importFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadRecordExport() {
    setSubmitting(true)
    setMessage('')
    try {
      const exported = await exportSampleRecords({
        q: search.trim() || undefined,
        sample_type: typeFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
        purchase_contract_id: purchaseContractFilter.trim() || undefined,
      })
      downloadCsv(exported.filename, exported.content)
      setMessage(t('sample.record.message.exported', { count: exported.total }))
    } catch (caught) {
      showError(caught, t('sample.record.message.exportFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sample-record-page">
      <div className="summary-strip" aria-label={t('sample.record.pageAria')}>
        <Metric label={t('sample.record.metric.sampleCount')} value={records.length} />
        <Metric
          label={t('sample.record.metric.confirmSampleCount')}
          value={records.filter((item) => item.sample_type === 'confirm_sample').length}
        />
        <Metric label={t('sample.record.metric.imageCount')} value={selectedRecord?.images.length ?? 0} />
        <Metric
          label={t('sample.record.metric.retainedCount')}
          value={Number(selectedRecord?.stock_summary.retained_quantity ?? 0)}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid sample-record-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Search size={18} />} title={t('sample.record.panel.listTitle')} />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadRecords()
                }}
              >
                <label className="inline-filter-search">
                  {t('sample.record.filter.search')}
                  <Input
                    value={search}
                    placeholder={t('sample.record.filter.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label className="inline-filter-compact">
                  {t('sample.record.filter.type')}
                  <FormSelect
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="">{t('sample.record.filter.allTypes')}</option>
                    {sampleRecordTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label className="inline-filter-compact">
                  {t('sample.record.filter.customer')}
                  <Input
                    value={customerFilter}
                    placeholder={t('sample.record.filter.customerPlaceholder')}
                    onChange={(event) => setCustomerFilter(event.target.value)}
                  />
                </label>
                <label className="inline-filter-compact">
                  {t('sample.record.filter.purchaseContract')}
                  <Input
                    value={purchaseContractFilter}
                    placeholder={t('sample.record.filter.purchaseContractPlaceholder')}
                    onChange={(event) => setPurchaseContractFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('sample.record.action.query')}
                </Button>
                <Button loading={submitting} onClick={() => void downloadRecordExport()}>
                  {t('sample.record.action.export')}
                </Button>
                <Button
                  htmlType="button"
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={openCreateRecord}
                >
                  {t('sample.record.action.create')}
                </Button>
              </form>
            </div>

            <Table<SampleRecord>
              columns={[
                {
                  title: t('sample.record.table.code'),
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
                { title: t('sample.record.table.type'), dataIndex: 'sample_type', render: sampleRecordTypeLabel },
                { title: t('sample.record.table.product'), dataIndex: 'product_name' },
                { title: t('sample.record.table.customerSku'), dataIndex: 'customer_sku', render: nullableText },
                { title: t('sample.record.table.supplierSku'), dataIndex: 'supplier_sku', render: nullableText },
                { title: t('sample.record.table.quantity'), dataIndex: 'quantity', width: 80 },
                {
                  title: t('sample.record.table.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: SampleRecord) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenRecordDetail(event, record)}
                    >
                      {t('sample.record.action.viewDetail')}
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
          title={t('sample.record.modal.createTitle')}
          width={1040}
          onCancel={() => setRecordModalOpen(false)}
        >
          <form className="record-form entity-modal-form sample-modal-form" onSubmit={submitRecord}>
            <label>
              {t('sample.record.field.code')}
              <Input
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <label htmlFor="sample-record-type">
              {t('sample.record.field.sampleType')}
              <FormSelect
                id="sample-record-type"
                value={form.sample_type}
                onChange={(event) => setForm({ ...form, sample_type: event.target.value })}
              >
                {sampleRecordTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label htmlFor="sample-record-status">
              {t('sample.record.field.status')}
              <FormSelect
                id="sample-record-status"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {sampleRecordStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('sample.record.field.receivedQuantity')}
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.receivedAt')}
              <Input
                type="date"
                value={form.received_at}
                onChange={(event) => setForm({ ...form, received_at: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.submittedAt')}
              <Input
                type="date"
                value={form.submitted_at}
                onChange={(event) => setForm({ ...form, submitted_at: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.productCode')}
              <Input
                value={form.product_code}
                onChange={(event) => setForm({ ...form, product_code: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.productName')}
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.customerSku')}
              <Input
                value={form.customer_sku}
                onChange={(event) => setForm({ ...form, customer_sku: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.supplierSku')}
              <Input
                value={form.supplier_sku}
                onChange={(event) => setForm({ ...form, supplier_sku: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.customerName')}
              <Input
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.supplierName')}
              <Input
                value={form.supplier_name}
                onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.purchaseContractNo')}
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
              {t('sample.record.field.unit')}
              <Input
                value={form.unit}
                onChange={(event) => setForm({ ...form, unit: event.target.value })}
              />
            </label>
            <label htmlFor="sample-record-source-type">
              {t('sample.record.field.sourceType')}
              <FormSelect
                id="sample-record-source-type"
                value={form.source_type}
                onChange={(event) => setForm({ ...form, source_type: event.target.value })}
              >
                {sampleSourceTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('sample.record.field.sourceCode')}
              <Input
                value={form.source_code}
                onChange={(event) => setForm({ ...form, source_code: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.description')}
              <Input.TextArea
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <div className="form-divider">{t('sample.record.modal.imageSection')}</div>
            <label>
              {t('sample.record.field.imageFileId')}
              <Input
                value={form.image_file_id}
                onChange={(event) => setForm({ ...form, image_file_id: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.imageFilename')}
              <Input
                value={form.image_filename}
                onChange={(event) => setForm({ ...form, image_filename: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.imageUrl')}
              <Input
                value={form.image_url}
                onChange={(event) => setForm({ ...form, image_url: event.target.value })}
              />
            </label>
            <label>
              {t('sample.record.field.imageCaption')}
              <Input
                value={form.image_caption}
                onChange={(event) => setForm({ ...form, image_caption: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button
                className="secondary-inline"
                type="button"
                onClick={() => setRecordModalOpen(false)}
              >
                {t('sample.record.action.cancel')}
              </button>
              <button
                className="secondary-inline"
                disabled={submitting}
                type="button"
                onClick={() => void submitRecordImport()}
              >
                {t('sample.record.action.importFromForm')}
              </button>
              <button className="inline-submit" disabled={submitting} type="submit">
                {t('sample.record.action.create')}
              </button>
            </div>
          </form>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<LayoutDashboard size={18} />} title={t('sample.record.panel.detailTitle')} />
              <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(sampleRecordPath)}>
                {t('sample.record.action.backToList')}
              </Button>
            </div>
            {selectedRecord ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('sample.record.field.code')}</dt>
                    <dd>{selectedRecord.code}</dd>
                  </div>
                  <div>
                    <dt>{t('sample.record.field.typeStatus')}</dt>
                    <dd>
                      {sampleRecordTypeLabel(selectedRecord.sample_type)} /{' '}
                      {sampleRecordStatusLabel(selectedRecord.status)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.record.field.product')}</dt>
                    <dd>
                      {selectedRecord.product_code ?? '-'} / {selectedRecord.product_name}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.record.field.customerSupplier')}</dt>
                    <dd>
                      {selectedRecord.customer_name ?? '-'} / {selectedRecord.supplier_name ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.record.field.customerSku')}</dt>
                    <dd>{selectedRecord.customer_sku ?? '-'}</dd>
                  </div>
                  <div>
                    <dt>{t('sample.record.field.supplierSku')}</dt>
                    <dd>{selectedRecord.supplier_sku ?? '-'}</dd>
                  </div>
                  <div>
                    <dt>{t('sample.record.field.purchaseContract')}</dt>
                    <dd>{selectedRecord.purchase_contract_no ?? '-'}</dd>
                  </div>
                  <div>
                    <dt>{t('sample.record.field.receivedSubmitted')}</dt>
                    <dd>
                      {formatDate(selectedRecord.received_at)} /{' '}
                      {formatDate(selectedRecord.submitted_at)}
                    </dd>
                  </div>
                </dl>

                <Table
                  className="compact-section"
                  columns={[
                    { title: t('sample.record.table.receivedQuantity'), dataIndex: 'received_quantity' },
                    { title: t('sample.record.table.deliveredQuantity'), dataIndex: 'delivered_quantity' },
                    { title: t('sample.record.table.retainedQuantity'), dataIndex: 'retained_quantity' },
                    { title: t('sample.record.table.unit'), dataIndex: 'unit' },
                  ]}
                  dataSource={[selectedRecord.stock_summary]}
                  pagination={false}
                  rowKey="sample_record_id"
                  size="small"
                />

                <Table<SampleRecordImage>
                  className="compact-section"
                  columns={[
                    { title: t('sample.record.table.imageFile'), dataIndex: 'filename' },
                    { title: t('sample.record.table.fileId'), dataIndex: 'file_id' },
                    { title: t('sample.record.table.imageUrl'), dataIndex: 'url' },
                    { title: t('sample.record.table.note'), dataIndex: 'caption', render: nullableText },
                    {
                      title: t('sample.record.table.primary'),
                      dataIndex: 'is_primary',
                      width: 72,
                      render: (value: boolean) =>
                        value ? t('sample.record.table.yes') : t('sample.record.table.no'),
                    },
                  ]}
                  dataSource={selectedRecord.images}
                  locale={{ emptyText: t('sample.record.panel.noImages') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />

                <Table
                  className="compact-section"
                  columns={[
                    { title: t('sample.record.table.followupNode'), dataIndex: 'node_label' },
                    { title: t('sample.record.table.actualDate'), dataIndex: 'actual_date', render: formatDate },
                    { title: t('sample.record.table.purchaseContract'), dataIndex: 'purchase_contract_no', render: nullableText },
                    { title: t('sample.record.table.event'), dataIndex: 'event_type' },
                  ]}
                  dataSource={selectedRecord.followup_events}
                  locale={{ emptyText: t('sample.record.panel.noFollowupEvents') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />

                <div className="sample-record-actions compact-section">
                  <form className="record-form" onSubmit={submitImage}>
                    <div className="form-divider">{t('sample.record.panel.appendImage')}</div>
                    <label>
                      {t('sample.record.field.imageFileId')}
                      <Input
                        value={imageForm.file_id}
                        onChange={(event) =>
                          setImageForm({ ...imageForm, file_id: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.record.field.imageFilename')}
                      <Input
                        value={imageForm.filename}
                        onChange={(event) =>
                          setImageForm({ ...imageForm, filename: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.record.field.imageUrl')}
                      <Input
                        value={imageForm.url}
                        onChange={(event) =>
                          setImageForm({ ...imageForm, url: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.record.field.imageCaption')}
                      <Input
                        value={imageForm.caption}
                        onChange={(event) =>
                          setImageForm({ ...imageForm, caption: event.target.value })
                        }
                      />
                    </label>
                    <Button htmlType="submit" loading={submitting}>
                      {t('sample.record.action.addImage')}
                    </Button>
                  </form>

                  <form className="record-form" onSubmit={submitStockEvent}>
                    <div className="form-divider">{t('sample.record.panel.stockEvent')}</div>
                    <label>
                      {t('sample.record.field.eventType')}
                      <FormSelect
                        value={stockForm.event_type}
                        onChange={(event) =>
                          setStockForm({ ...stockForm, event_type: event.target.value })
                        }
                      >
                        {sampleStockEventTypeOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {t(item.labelKey)}
                          </option>
                        ))}
                      </FormSelect>
                    </label>
                    <label>
                      {t('sample.record.field.quantity')}
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={stockForm.quantity}
                        onChange={(event) =>
                          setStockForm({ ...stockForm, quantity: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.record.field.date')}
                      <Input
                        type="date"
                        value={stockForm.occurred_at}
                        onChange={(event) =>
                          setStockForm({ ...stockForm, occurred_at: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.record.field.unit')}
                      <Input
                        value={stockForm.unit}
                        onChange={(event) =>
                          setStockForm({ ...stockForm, unit: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.record.field.deliveryNo')}
                      <Input
                        value={stockForm.delivery_no}
                        onChange={(event) =>
                          setStockForm({ ...stockForm, delivery_no: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.record.field.recipient')}
                      <Input
                        value={stockForm.recipient}
                        onChange={(event) =>
                          setStockForm({ ...stockForm, recipient: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.record.field.eventNote')}
                      <Input.TextArea
                        rows={2}
                        value={stockForm.note}
                        onChange={(event) =>
                          setStockForm({ ...stockForm, note: event.target.value })
                        }
                      />
                    </label>
                    <Button htmlType="submit" loading={submitting}>
                      {t('sample.record.action.registerStock')}
                    </Button>
                  </form>
                </div>

                <Table<SampleRecordStockEvent>
                  className="compact-section"
                  columns={[
                    {
                      title: t('sample.record.table.eventType'),
                      dataIndex: 'event_type',
                      render: sampleStockEventTypeLabel,
                    },
                    { title: t('sample.record.table.quantity'), dataIndex: 'quantity' },
                    { title: t('sample.record.table.unit'), dataIndex: 'unit' },
                    { title: t('sample.record.table.date'), dataIndex: 'occurred_at', render: formatDate },
                    { title: t('sample.record.table.deliveryNo'), dataIndex: 'delivery_no', render: nullableText },
                    { title: t('sample.record.table.recipient'), dataIndex: 'recipient', render: nullableText },
                    { title: t('sample.record.table.note'), dataIndex: 'note', render: nullableText },
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
                <strong>{t('sample.record.panel.emptyTitle')}</strong>
                <span>{t('sample.record.panel.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
