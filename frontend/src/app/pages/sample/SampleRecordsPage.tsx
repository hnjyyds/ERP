import { Alert, Button, Input, Table } from 'antd'
import { ArrowLeft, Images, LayoutDashboard, Plus, Search } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createSampleRecord,
  addSampleRecordImage,
  addSampleRecordStockEvent,
  listSampleRecords,
  importSampleRecords,
  exportSampleRecords,
  type SampleRecord,
  type SampleRecordImage,
  type SampleRecordImagePayload,
  type SampleRecordListSummary,
  type SampleRecordStockEvent,
  type SampleRecordStockEventPayload,
} from '@/api'
import { sampleRecordPath, moduleDetailPath } from '@/app/routes'
import { t } from '@/app/appI18n'
import { FormSelect, ListPageShell, Metric, PanelTitle } from '@/shared/ui'
import { useTablePagination } from '@/shared/useTablePagination'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { showError } from '@/shared/errors'
import { downloadCsv } from '@/shared/print'
import {
  sampleRecordTypeOptions,
  sampleRecordStatusOptions,
  sampleSourceTypeOptions,
  sampleStockEventTypeOptions,
} from '@/shared/formOptions'
import {
  formatDate,
  nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '@/app/pages/appHelpers'
import {
  initialSampleRecordForm,
  sampleRecordPayload,
  type SampleRecordFormState,
} from './sampleRecordFormHelpers'
import { SampleRecordFormModal } from './views/SampleRecordFormModal'

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

function sampleSourceTypeLabel(value: string): string {
  const option = sampleSourceTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function sampleStockEventTypeLabel(value: string): string {
  const option = sampleStockEventTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function SampleRecordsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const urlQuery = useUrlQuery()
  const initialParams = useRef(urlQuery.params)
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const [records, setRecords] = useState<SampleRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [search, setSearch] = useState(initialParams.current.get('q') ?? '')
  const [typeFilter, setTypeFilter] = useState(initialParams.current.get('sample_type') ?? '')
  const [customerFilter, setCustomerFilter] = useState(
    initialParams.current.get('customer_id') ?? '',
  )
  const [purchaseContractFilter, setPurchaseContractFilter] = useState(
    initialParams.current.get('purchase_contract_id') ?? '',
  )
  const [summary, setSummary] = useState<SampleRecordListSummary | null>(null)
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
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } =
    useTablePagination(50, parsePageParam(initialParams.current))

  const selectedRecord = useMemo(() => {
    if (detailId) return records.find((item) => item.id === detailId) ?? null
    return records.find((item) => item.id === selectedRecordId) ?? records[0] ?? null
  }, [detailId, records, selectedRecordId])

  useEffect(() => {
    void loadRecords()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const params = urlQuery.params
    const nextSearch = params.get('q') ?? ''
    const nextType = params.get('sample_type') ?? ''
    const nextCustomer = params.get('customer_id') ?? ''
    const nextContract = params.get('purchase_contract_id') ?? ''
    const nextPage = parsePageParam(params)
    setSearch(nextSearch)
    setTypeFilter(nextType)
    setCustomerFilter(nextCustomer)
    setPurchaseContractFilter(nextContract)
    setPage(nextPage)
    void loadRecords(undefined, {
      pageOverride: nextPage,
      filters: {
        q: nextSearch.trim() || undefined,
        sample_type: nextType || undefined,
        customer_id: nextCustomer.trim() || undefined,
        purchase_contract_id: nextContract.trim() || undefined,
      },
    })
  }, [urlQuery.search])

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

  async function loadRecords(preferredId?: string, options?: {
    pageOverride?: number
    pageSizeOverride?: number
    filters?: {
      q?: string
      sample_type?: string
      customer_id?: string
      purchase_contract_id?: string
    }
  }) {
    const nextPage = options?.pageOverride ?? page
    const nextPageSize = options?.pageSizeOverride ?? pageSize
    const filters = options?.filters ?? {
      q: search.trim() || undefined,
      sample_type: typeFilter || undefined,
      customer_id: customerFilter.trim() || undefined,
      purchase_contract_id: purchaseContractFilter.trim() || undefined,
    }
    setLoading(true)
    try {
      const result = await listSampleRecords({
        ...filters,
        limit: nextPageSize,
        offset: (nextPage - 1) * nextPageSize,
      })
      setRecords(result.items)
      setTotal(result.total)
      setSummary(result.summary ?? null)
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
      setPage(1)
      appliedUrlSearchRef.current = urlQuery.update({ page: null })
      await loadRecords(created.id, { pageOverride: 1 })
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
        <Metric
          label={t('sample.record.metric.sampleCount')}
          value={summary?.total ?? total}
        />
        <Metric
          label={t('sample.record.metric.confirmSampleCount')}
          value={summary?.confirm_sample_count ?? 0}
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
          <ListPageShell
            className="product-list-panel"
            icon={<Search size={18} />}
            title={t('sample.record.panel.listTitle')}
            toolbar={<form
              className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  setPage(1)
                  appliedUrlSearchRef.current = urlQuery.update({
                    q: search.trim(),
                    sample_type: typeFilter,
                    customer_id: customerFilter.trim(),
                    purchase_contract_id: purchaseContractFilter.trim(),
                    page: null,
                  })
                  void loadRecords(undefined, { pageOverride: 1 })
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
            </form>}

          >
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
                {
                  title: t('sample.record.table.sourceType'),
                  dataIndex: 'source_type',
                  render: sampleSourceTypeLabel,
                },
                {
                  title: t('sample.record.table.sourceCode'),
                  dataIndex: 'source_code',
                  render: nullableText,
                },
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
              pagination={{
                ...pagination,
                total,
                onChange: (nextPage, nextPageSize) => {
                  const next = changePage(nextPage, nextPageSize)
                  appliedUrlSearchRef.current = urlQuery.update({
                    page: next.page === 1 ? null : next.page,
                  })
                  void loadRecords(undefined, {
                    pageOverride: next.page,
                    pageSizeOverride: next.pageSize,
                  })
                },
              }}
              rowClassName={(record) => (record.id === selectedRecord?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedRecordId(record.id),
              })}
            />
          </ListPageShell>
        ) : null}

        <SampleRecordFormModal
          open={recordModalOpen}
          form={form}
          submitting={submitting}
          onFormChange={setForm}
          onClose={() => setRecordModalOpen(false)}
          onSubmit={submitRecord}
          onImport={() => void submitRecordImport()}
        />

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
                    <dt>{t('sample.record.field.sourceType')}</dt>
                    <dd>
                      {selectedRecord.source_type
                        ? sampleSourceTypeLabel(selectedRecord.source_type)
                        : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.record.field.sourceCode')}</dt>
                    <dd>{selectedRecord.source_code ?? '-'}</dd>
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
