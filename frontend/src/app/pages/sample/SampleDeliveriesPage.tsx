import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, Send } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  approveSampleDelivery,
  createSampleDelivery,
  exportSampleDeliveries,
  getSampleDeliveryFeeStatistics,
  getSampleDeliveryQuoteHistory,
  getSampleDeliverySampleHistory,
  getSampleDeliveryStatistics,
  listSampleDeliveries,
  submitSampleDelivery,
  updateSampleDelivery,
  updateSampleDeliveryTracking,
  type CurrentUser,
  type SampleDelivery,
  type SampleDeliveryApprovePayload,
  type SampleDeliveryCreatePayload,
  type SampleDeliveryFeeStatistic,
  type SampleDeliveryFeeStatistics,
  type SampleDeliveryStatistics,
  type SampleDeliveryTrackingPayload,
  SampleDeliveryCustomerStatistic,
  SampleDeliveryExpressStatistic,
  SampleDeliveryFee,
  SampleDeliveryLine,
  SampleDeliveryStatusStatistic,
} from '../../../api'
import { sampleDeliveryPath, moduleDetailPath } from '../../routes'
import { t } from '../../appI18n'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { downloadCsv } from '../../../shared/print'
import {
  sampleDeliveryStatusOptions,
  sampleDeliveryFeeTypeOptions,
  sampleDeliveryPayerTypeOptions,
  sampleDeliveryTrackingStatusOptions,
  sampleRecordTypeOptions,
  sampleRecordStatusOptions,
} from '../../../shared/formOptions'
import {
  canApproveAssignedRecord,
  formatDate,
  formatMoney,
  nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '../appHelpers'
import { ApprovalAssigneeSelect } from '../../components/ApprovalAssigneeSelect'

function sampleDeliveryFeeTypeLabel(value: string): string {
  const option = sampleDeliveryFeeTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function sampleRecordTypeLabel(value: string): string {
  const option = sampleRecordTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function _sampleRecordStatusLabel(value: string): string {
  const option = sampleRecordStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function sampleDeliveryStatusLabel(value: string): string {
  const option = sampleDeliveryStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

type SampleDeliveryFormState = {
  code: string
  delivery_date: string
  customer_id: string
  customer_name: string
  supplier_id: string
  supplier_name: string
  factory_id: string
  factory_name: string
  recipient_name: string
  recipient_company: string
  recipient_address: string
  express_company: string
  tracking_no: string
  quote_id: string
  quote_no: string
  remark: string
  sample_record_id: string
  sample_code: string
  sample_type: string
  product_id: string
  product_code: string
  product_name: string
  quantity: string
  unit: string
  line_remark: string
  fee_type: string
  fee_amount: string
  fee_currency: string
  fee_payer_type: string
  fee_remark: string
}

type SampleDeliveryApproveFormState = {
  reviewer_name: string
  approved_at: string
}

type SampleDeliveryTrackingFormState = {
  express_company: string
  tracking_no: string
  status: string
}

function initialSampleDeliveryFeeStatistics(): SampleDeliveryFeeStatistics {
  return {
    items: [],
    total_amount: '0.00',
    currency: 'USD',
  }
}

function initialSampleDeliveryStatistics(): SampleDeliveryStatistics {
  return {
    total_deliveries: 0,
    total_quantity: '0.00',
    by_status: [],
    by_customer: [],
    by_express: [],
  }
}

function initialSampleDeliveryForm(): SampleDeliveryFormState {
  return {
    code: `SD-${Date.now().toString().slice(-6)}`,
    delivery_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    supplier_id: '',
    supplier_name: '',
    factory_id: '',
    factory_name: '',
    recipient_name: '',
    recipient_company: '',
    recipient_address: '',
    express_company: 'DHL',
    tracking_no: '',
    quote_id: '',
    quote_no: '',
    remark: '',
    sample_record_id: '',
    sample_code: '',
    sample_type: 'confirm_sample',
    product_id: '',
    product_code: '',
    product_name: '',
    quantity: '1',
    unit: 'pcs',
    line_remark: '',
    fee_type: 'express',
    fee_amount: '0.00',
    fee_currency: 'USD',
    fee_payer_type: 'company',
    fee_remark: '',
  }
}

function initialSampleDeliveryApproveForm(): SampleDeliveryApproveFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
  }
}

function initialSampleDeliveryTrackingForm(): SampleDeliveryTrackingFormState {
  return {
    express_company: 'DHL',
    tracking_no: '',
    status: 'shipped',
  }
}

function sampleDeliveryToForm(delivery: SampleDelivery): SampleDeliveryFormState {
  const line = delivery.lines[0]
  const fee = delivery.fees[0]
  return {
    code: delivery.code,
    delivery_date: delivery.delivery_date,
    customer_id: delivery.customer_id ?? '',
    customer_name: delivery.customer_name,
    supplier_id: delivery.supplier_id ?? '',
    supplier_name: delivery.supplier_name ?? '',
    factory_id: delivery.factory_id ?? '',
    factory_name: delivery.factory_name ?? '',
    recipient_name: delivery.recipient_name,
    recipient_company: delivery.recipient_company ?? '',
    recipient_address: delivery.recipient_address,
    express_company: delivery.express_company,
    tracking_no: delivery.tracking_no ?? '',
    quote_id: delivery.quote_id ?? '',
    quote_no: delivery.quote_no ?? '',
    remark: delivery.remark ?? '',
    sample_record_id: line?.sample_record_id ?? '',
    sample_code: line?.sample_code ?? '',
    sample_type: line?.sample_type ?? 'confirm_sample',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
    line_remark: line?.remark ?? '',
    fee_type: fee?.fee_type ?? 'express',
    fee_amount: fee?.amount ?? '0.00',
    fee_currency: fee?.currency ?? 'USD',
    fee_payer_type: fee?.payer_type ?? 'company',
    fee_remark: fee?.remark ?? '',
  }
}

function sampleDeliveryPayload(form: SampleDeliveryFormState): SampleDeliveryCreatePayload {
  return {
    code: form.code.trim(),
    delivery_date: form.delivery_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: emptyToNull(form.supplier_name),
    factory_id: emptyToNull(form.factory_id),
    factory_name: emptyToNull(form.factory_name),
    recipient_name: form.recipient_name.trim(),
    recipient_company: emptyToNull(form.recipient_company),
    recipient_address: form.recipient_address.trim(),
    express_company: form.express_company.trim(),
    tracking_no: emptyToNull(form.tracking_no),
    quote_id: emptyToNull(form.quote_id),
    quote_no: emptyToNull(form.quote_no),
    remark: emptyToNull(form.remark),
    lines: [
      {
        sample_record_id: form.sample_record_id.trim(),
        sample_code: emptyToNull(form.sample_code),
        sample_type: form.sample_type,
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        quantity: form.quantity,
        unit: form.unit.trim(),
        remark: emptyToNull(form.line_remark),
      },
    ],
    fees: [
      {
        fee_type: form.fee_type,
        amount: form.fee_amount,
        currency: form.fee_currency.trim(),
        payer_type: form.fee_payer_type,
        remark: emptyToNull(form.fee_remark),
      },
    ],
  }
}

function sampleDeliveryApprovePayload(
  form: SampleDeliveryApproveFormState,
): SampleDeliveryApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function sampleDeliveryTrackingPayload(
  form: SampleDeliveryTrackingFormState,
): SampleDeliveryTrackingPayload {
  return {
    express_company: form.express_company.trim(),
    tracking_no: form.tracking_no.trim(),
    status: form.status,
  }
}

function sampleDeliveryPayerTypeLabel(value: string): string {
  const option = sampleDeliveryPayerTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function SampleDeliveriesPage({ currentUser, detailId, onNavigate }: Props) {
  const [deliveries, setDeliveries] = useState<SampleDelivery[]>([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [expressFilter, setExpressFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [feeStatistics, setFeeStatistics] = useState<SampleDeliveryFeeStatistics>(() =>
    initialSampleDeliveryFeeStatistics(),
  )
  const [deliveryStatistics, setDeliveryStatistics] = useState<SampleDeliveryStatistics>(() =>
    initialSampleDeliveryStatistics(),
  )
  const [sampleHistory, setSampleHistory] = useState<SampleDelivery[]>([])
  const [quoteHistory, setQuoteHistory] = useState<SampleDelivery[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<SampleDeliveryFormState>(() => initialSampleDeliveryForm())
  const [deliveryModalMode, setDeliveryModalMode] = useState<'create' | 'edit' | null>(null)
  const [reviewerId, setReviewerId] = useState('')
  const [approveForm, setApproveForm] = useState<SampleDeliveryApproveFormState>(() =>
    initialSampleDeliveryApproveForm(),
  )
  const [trackingForm, setTrackingForm] = useState<SampleDeliveryTrackingFormState>(() =>
    initialSampleDeliveryTrackingForm(),
  )

  const selectedDelivery = useMemo(() => {
    if (detailId) return deliveries.find((item) => item.id === detailId) ?? null
    return deliveries.find((item) => item.id === selectedDeliveryId) ?? deliveries[0] ?? null
  }, [deliveries, detailId, selectedDeliveryId])

  useEffect(() => {
    void loadDeliveries()
  }, [])

  useEffect(() => {
    if (detailId && deliveries.length > 0 && !deliveries.some((item) => item.id === detailId)) {
      onNavigate(sampleDeliveryPath)
    }
  }, [deliveries, detailId, onNavigate])

  useEffect(() => {
    syncDeliveryActionForms(selectedDelivery)
    setReviewerId(selectedDelivery?.reviewer_id ?? '')
    void loadSelectedDeliveryHistories(selectedDelivery)
  }, [selectedDelivery?.id, selectedDelivery?.status, selectedDelivery?.tracking_no])

  async function loadDeliveries(preferredId?: string) {
    setLoading(true)
    try {
      const reportFilters = {
        customer_id: customerFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
        express_company: expressFilter.trim() || undefined,
      }
      const [result, feeStats, deliveryStats] = await Promise.all([
        listSampleDeliveries({
          q: search.trim() || undefined,
          status: statusFilter || undefined,
          customer_id: customerFilter.trim() || undefined,
          express_company: expressFilter.trim() || undefined,
          date_from: dateFromFilter || undefined,
          date_to: dateToFilter || undefined,
        }),
        getSampleDeliveryFeeStatistics(reportFilters),
        getSampleDeliveryStatistics(reportFilters),
      ])
      setDeliveries(result.items)
      setFeeStatistics(feeStats)
      setDeliveryStatistics(deliveryStats)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedDeliveryId) ? selectedDeliveryId : null) ??
        result.items[0]?.id ??
        null
      setSelectedDeliveryId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadSelectedDeliveryHistories(delivery: SampleDelivery | null) {
    const line = delivery?.lines[0]
    if (!delivery || !line) {
      setSampleHistory([])
      setQuoteHistory([])
      return
    }
    try {
      const [sampleResult, quoteResult] = await Promise.all([
        getSampleDeliverySampleHistory(line.sample_record_id),
        getSampleDeliveryQuoteHistory({
          customer_id: delivery.customer_id ?? undefined,
          product_id: line.product_id ?? undefined,
        }),
      ])
      setSampleHistory(sampleResult.items)
      setQuoteHistory(quoteResult.items)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.historyLoadFailed'))
    }
  }

  function syncDeliveryActionForms(delivery: SampleDelivery | null) {
    setApproveForm({
      reviewer_name: '',
      approved_at: delivery?.delivery_date ?? todayInputValue(),
    })
    setTrackingForm({
      express_company: delivery?.express_company ?? 'DHL',
      tracking_no: delivery?.tracking_no ?? '',
      status: delivery?.status === 'approved' ? 'shipped' : 'submitted',
    })
  }

  function upsertDelivery(delivery: SampleDelivery) {
    setDeliveries((current) => {
      const exists = current.some((item) => item.id === delivery.id)
      return exists
        ? current.map((item) => (item.id === delivery.id ? delivery : item))
        : [delivery, ...current]
    })
    setSelectedDeliveryId(delivery.id)
  }

  function openDeliveryDetail(delivery: SampleDelivery) {
    setSelectedDeliveryId(delivery.id)
    onNavigate(moduleDetailPath(sampleDeliveryPath, delivery.id))
  }

  function stopAndOpenDeliveryDetail(event: MouseEvent<HTMLElement>, delivery: SampleDelivery) {
    event.stopPropagation()
    openDeliveryDetail(delivery)
  }

  function openCreateDelivery() {
    setForm(initialSampleDeliveryForm())
    setDeliveryModalMode('create')
  }

  function openEditDelivery(delivery: SampleDelivery) {
    setForm(sampleDeliveryToForm(delivery))
    setDeliveryModalMode('edit')
  }

  async function submitDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const created = await createSampleDelivery(sampleDeliveryPayload(form))
      setMessage(t('sample.delivery.message.created', { code: created.code }))
      setForm(initialSampleDeliveryForm())
      setDeliveryModalMode(null)
      upsertDelivery(created)
      await loadDeliveries(created.id)
      setDeliveries((current) =>
        current.some((delivery) => delivery.id === created.id) ? current : [created, ...current],
      )
      setSelectedDeliveryId(created.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function saveDeliveryDraft() {
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    try {
      const updated = await updateSampleDelivery(selectedDelivery.id, sampleDeliveryPayload(form))
      setMessage(t('sample.delivery.message.draftSaved', { code: updated.code }))
      setDeliveryModalMode(null)
      upsertDelivery(updated)
      await loadDeliveries(updated.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.draftSaveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitDeliveryForReview() {
    if (!selectedDelivery) return
    if (!reviewerId) {
      showError(new Error(t('sample.delivery.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const submitted = await submitSampleDelivery(selectedDelivery.id, { reviewer_id: reviewerId })
      setMessage(t('sample.delivery.message.submitted', { code: submitted.code }))
      upsertDelivery(submitted)
      await loadDeliveries(submitted.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function approveDelivery() {
    if (!selectedDelivery) return
    if (
      !canApproveAssignedRecord(
        currentUser,
        selectedDelivery.reviewer_id,
        'sample:delivery:approve',
      )
    ) {
      showError(
        new Error(
          t('sample.delivery.message.notReviewer', {
            reviewer:
              selectedDelivery.reviewer_name ?? t('sample.delivery.panel.designatedReviewer'),
          }),
        ),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const approved = await approveSampleDelivery(
        selectedDelivery.id,
        sampleDeliveryApprovePayload(approveForm),
      )
      setMessage(t('sample.delivery.message.approved', { code: approved.code }))
      upsertDelivery(approved)
      await loadDeliveries(approved.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitTracking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    try {
      const tracked = await updateSampleDeliveryTracking(
        selectedDelivery.id,
        sampleDeliveryTrackingPayload(trackingForm),
      )
      setMessage(
        t('sample.delivery.message.trackingUpdated', {
          trackingNo: tracked.tracking_no ?? '',
        }).trim(),
      )
      upsertDelivery(tracked)
      await loadDeliveries(tracked.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.trackingUpdateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadDeliveryExport() {
    setSubmitting(true)
    setMessage('')
    try {
      const exported = await exportSampleDeliveries({
        customer_id: customerFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
        express_company: expressFilter.trim() || undefined,
      })
      downloadCsv(exported.filename, exported.content)
      setMessage(t('sample.delivery.message.exported', { count: exported.total }))
    } catch (caught) {
      showError(caught, t('sample.delivery.message.exportFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sample-delivery-page">
      <div className="summary-strip" aria-label={t('sample.delivery.pageAria')}>
        <Metric label={t('sample.delivery.metric.deliveryCount')} value={deliveries.length} />
        <Metric
          label={t('sample.delivery.metric.pendingCount')}
          value={deliveries.filter((item) => item.status === 'submitted').length}
        />
        <Metric
          label={t('sample.delivery.metric.approvedCount')}
          value={deliveries.filter((item) => ['approved', 'shipped'].includes(item.status)).length}
        />
        <Metric
          label={t('sample.delivery.metric.totalQuantity')}
          value={deliveryStatistics.total_quantity}
        />
        <Metric
          label={t('sample.delivery.metric.feeTotal')}
          value={formatMoney(feeStatistics.total_amount, feeStatistics.currency)}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid sample-delivery-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<Search size={18} />}
                title={t('sample.delivery.panel.listTitle')}
              />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadDeliveries()
                }}
              >
                <label className="inline-filter-search">
                  {t('sample.delivery.filter.search')}
                  <Input
                    value={search}
                    placeholder={t('sample.delivery.filter.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label className="inline-filter-compact" htmlFor="sample-delivery-status-filter">
                  {t('sample.delivery.filter.status')}
                  <FormSelect
                    id="sample-delivery-status-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('sample.delivery.filter.allStatuses')}</option>
                    {sampleDeliveryStatusOptions
                      .filter((item) => item.value !== 'rejected')
                      .map((item) => (
                        <option key={item.value} value={item.value}>
                          {t(item.labelKey)}
                        </option>
                      ))}
                  </FormSelect>
                </label>
                <label className="inline-filter-compact">
                  {t('sample.delivery.field.customerId')}
                  <Input
                    value={customerFilter}
                    placeholder={t('sample.delivery.filter.customerPlaceholder')}
                    onChange={(event) => setCustomerFilter(event.target.value)}
                  />
                </label>
                <label className="inline-filter-compact">
                  {t('sample.delivery.field.expressCompany')}
                  <Input
                    value={expressFilter}
                    placeholder={t('sample.delivery.filter.expressPlaceholder')}
                    onChange={(event) => setExpressFilter(event.target.value)}
                  />
                </label>
                <label className="inline-filter-compact">
                  {t('sample.delivery.filter.dateFrom')}
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(event) => setDateFromFilter(event.target.value)}
                  />
                </label>
                <label className="inline-filter-compact">
                  {t('sample.delivery.filter.dateTo')}
                  <Input
                    type="date"
                    value={dateToFilter}
                    onChange={(event) => setDateToFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('sample.delivery.action.query')}
                </Button>
                <Button loading={submitting} onClick={() => void downloadDeliveryExport()}>
                  {t('sample.delivery.action.export')}
                </Button>
                <Button
                  htmlType="button"
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={openCreateDelivery}
                >
                  {t('sample.delivery.action.create')}
                </Button>
              </form>
            </div>

            <Table<SampleDelivery>
              columns={[
                {
                  title: t('sample.delivery.table.code'),
                  dataIndex: 'code',
                  render: (value: string, record: SampleDelivery) => (
                    <button
                      className="row-button"
                      type="button"
                      onClick={(event) => stopAndOpenDeliveryDetail(event, record)}
                    >
                      {value}
                    </button>
                  ),
                },
                { title: t('sample.delivery.table.status'), dataIndex: 'status', render: sampleDeliveryStatusLabel },
                { title: t('sample.delivery.table.customer'), dataIndex: 'customer_name' },
                {
                  title: t('sample.delivery.table.express'),
                  dataIndex: 'express_company',
                  render: (_, record) =>
                    `${record.express_company} / ${record.tracking_no ?? t('sample.delivery.panel.notFilled')}`,
                },
                { title: t('sample.delivery.table.quote'), dataIndex: 'quote_no', render: nullableText },
                {
                  title: t('sample.delivery.table.fee'),
                  dataIndex: 'fee_total',
                  render: (_, record) =>
                    formatMoney(record.fee_total, record.fees[0]?.currency ?? 'USD'),
                },
                {
                  title: t('sample.delivery.table.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: SampleDelivery) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenDeliveryDetail(event, record)}
                    >
                      {t('sample.delivery.action.viewDetail')}
                    </Button>
                  ),
                },
              ]}
              dataSource={deliveries}
              loading={loading}
              pagination={false}
              rowClassName={(record) => (record.id === selectedDelivery?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedDeliveryId(record.id),
              })}
            />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={Boolean(deliveryModalMode)}
          title={
            deliveryModalMode === 'edit'
              ? t('sample.delivery.modal.editTitle')
              : t('sample.delivery.modal.createTitle')
          }
          width={1040}
          onCancel={() => setDeliveryModalMode(null)}
        >
          <form
            className="record-form entity-modal-form sample-modal-form"
            onSubmit={
              deliveryModalMode === 'edit'
                ? (event) => {
                    event.preventDefault()
                    void saveDeliveryDraft()
                  }
                : submitDelivery
            }
          >
            <div className="form-pair two">
              <label>
                {t('sample.delivery.field.code')}
                <Input
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                />
              </label>
              <label>
                {t('sample.delivery.field.deliveryDate')}
                <Input
                  type="date"
                  value={form.delivery_date}
                  onChange={(event) => setForm({ ...form, delivery_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                {t('sample.delivery.field.customerId')}
                <Input
                  value={form.customer_id}
                  onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
                />
              </label>
              <label>
                {t('sample.delivery.field.customerName')}
                <Input
                  value={form.customer_name}
                  onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                {t('sample.delivery.field.supplier')}
                <Input
                  value={form.supplier_name}
                  onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
                />
              </label>
              <label>
                {t('sample.delivery.field.factory')}
                <Input
                  value={form.factory_name}
                  onChange={(event) => setForm({ ...form, factory_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                {t('sample.delivery.field.recipientName')}
                <Input
                  value={form.recipient_name}
                  onChange={(event) => setForm({ ...form, recipient_name: event.target.value })}
                />
              </label>
              <label>
                {t('sample.delivery.field.recipientCompany')}
                <Input
                  value={form.recipient_company}
                  onChange={(event) => setForm({ ...form, recipient_company: event.target.value })}
                />
              </label>
            </div>
            <label>
              {t('sample.delivery.field.recipientAddress')}
              <Input
                value={form.recipient_address}
                onChange={(event) => setForm({ ...form, recipient_address: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                {t('sample.delivery.field.expressCompany')}
                <Input
                  value={form.express_company}
                  onChange={(event) => setForm({ ...form, express_company: event.target.value })}
                />
              </label>
              <label>
                {t('sample.delivery.field.trackingNo')}
                <Input
                  value={form.tracking_no}
                  onChange={(event) => setForm({ ...form, tracking_no: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                {t('sample.delivery.field.quoteNo')}
                <Input
                  value={form.quote_no}
                  onChange={(event) => setForm({ ...form, quote_no: event.target.value })}
                />
              </label>
              <label>
                {t('sample.delivery.field.quoteId')}
                <Input
                  value={form.quote_id}
                  onChange={(event) => setForm({ ...form, quote_id: event.target.value })}
                />
              </label>
            </div>
            <div className="form-divider">{t('sample.delivery.modal.lineSection')}</div>
            <div className="form-pair two">
              <label>
                {t('sample.delivery.field.sampleId')}
                <Input
                  value={form.sample_record_id}
                  onChange={(event) => setForm({ ...form, sample_record_id: event.target.value })}
                />
              </label>
              <label>
                {t('sample.delivery.field.sampleCode')}
                <Input
                  value={form.sample_code}
                  onChange={(event) => setForm({ ...form, sample_code: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="sample-delivery-sample-type">
                {t('sample.delivery.field.sampleType')}
                <FormSelect
                  id="sample-delivery-sample-type"
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
              <label>
                {t('sample.delivery.field.productCode')}
                <Input
                  value={form.product_code}
                  onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                />
              </label>
            </div>
            <label>
              {t('sample.delivery.field.productName')}
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                {t('sample.delivery.field.quantity')}
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                />
              </label>
              <label>
                {t('sample.delivery.field.unit')}
                <Input
                  value={form.unit}
                  onChange={(event) => setForm({ ...form, unit: event.target.value })}
                />
              </label>
            </div>
            <label>
              {t('sample.delivery.field.lineRemark')}
              <Input
                value={form.line_remark}
                onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
              />
            </label>
            <div className="form-divider">{t('sample.delivery.modal.feeSection')}</div>
            <div className="form-pair two">
              <label htmlFor="sample-delivery-fee-type">
                {t('sample.delivery.field.feeType')}
                <FormSelect
                  id="sample-delivery-fee-type"
                  value={form.fee_type}
                  onChange={(event) => setForm({ ...form, fee_type: event.target.value })}
                >
                  {sampleDeliveryFeeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                {t('sample.delivery.field.amount')}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fee_amount}
                  onChange={(event) => setForm({ ...form, fee_amount: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                {t('sample.delivery.field.currency')}
                <Input
                  value={form.fee_currency}
                  onChange={(event) => setForm({ ...form, fee_currency: event.target.value })}
                />
              </label>
              <label htmlFor="sample-delivery-fee-payer">
                {t('sample.delivery.field.payerType')}
                <FormSelect
                  id="sample-delivery-fee-payer"
                  value={form.fee_payer_type}
                  onChange={(event) => setForm({ ...form, fee_payer_type: event.target.value })}
                >
                  {sampleDeliveryPayerTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <label>
              {t('sample.delivery.field.feeRemark')}
              <Input
                value={form.fee_remark}
                onChange={(event) => setForm({ ...form, fee_remark: event.target.value })}
              />
            </label>
            <label htmlFor="sample-delivery-remark">
              {t('sample.delivery.field.remark')}
              <Input.TextArea
                id="sample-delivery-remark"
                rows={2}
                value={form.remark}
                onChange={(event) => setForm({ ...form, remark: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button
                className="secondary-inline"
                type="button"
                onClick={() => setDeliveryModalMode(null)}
              >
                {t('sample.delivery.action.cancel')}
              </button>
              {deliveryModalMode === 'edit' ? (
                <button
                  className="inline-submit"
                  disabled={submitting}
                  type="button"
                  onClick={() => void saveDeliveryDraft()}
                >
                  {t('sample.delivery.action.saveDraft')}
                </button>
              ) : (
                <button className="inline-submit" disabled={submitting} type="submit">
                  {t('sample.delivery.action.create')}
                </button>
              )}
            </div>
          </form>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('sample.delivery.panel.detailTitle')}
              />
              <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(sampleDeliveryPath)}>
                {t('sample.delivery.action.backToList')}
              </Button>
            </div>
            {selectedDelivery ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('sample.delivery.field.statusDate')}</dt>
                    <dd>
                      {sampleDeliveryStatusLabel(selectedDelivery.status)} /{' '}
                      {formatDate(selectedDelivery.delivery_date)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.delivery.field.customer')}</dt>
                    <dd>{selectedDelivery.customer_name}</dd>
                  </div>
                  <div>
                    <dt>{t('sample.delivery.field.supplierFactory')}</dt>
                    <dd>
                      {selectedDelivery.supplier_name ?? t('sample.delivery.panel.notFilled')} /{' '}
                      {selectedDelivery.factory_name ?? t('sample.delivery.panel.notFilled')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.delivery.field.recipient')}</dt>
                    <dd>
                      {selectedDelivery.recipient_name} /{' '}
                      {selectedDelivery.recipient_company ?? t('sample.delivery.panel.notFilled')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.delivery.field.express')}</dt>
                    <dd>
                      {selectedDelivery.express_company} /{' '}
                      {selectedDelivery.tracking_no ?? t('sample.delivery.panel.notFilled')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.delivery.field.quote')}</dt>
                    <dd>{selectedDelivery.quote_no ?? t('sample.delivery.panel.notLinked')}</dd>
                  </div>
                  <div>
                    <dt>{t('sample.delivery.field.feeTotal')}</dt>
                    <dd>
                      {formatMoney(
                        selectedDelivery.fee_total,
                        selectedDelivery.fees[0]?.currency ?? 'USD',
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.delivery.field.reviewer')}</dt>
                    <dd>{selectedDelivery.reviewer_name ?? t('sample.delivery.panel.notReviewed')}</dd>
                  </div>
                </dl>

                <div className="transaction-box">
                  <strong>{t('sample.delivery.field.remark')}</strong>
                  <p>{selectedDelivery.remark ?? selectedDelivery.recipient_address}</p>
                </div>

                <div className="delivery-action-row">
                  <Button
                    disabled={selectedDelivery.status !== 'draft'}
                    onClick={() => openEditDelivery(selectedDelivery)}
                  >
                    {t('sample.delivery.action.editDraft')}
                  </Button>
                  {selectedDelivery.status === 'draft' ? (
                    <ApprovalAssigneeSelect
                      currentUserId={currentUser.id}
                      onChange={setReviewerId}
                      requiredPermission="sample:delivery:approve"
                      value={reviewerId}
                    />
                  ) : null}
                  <Button
                    disabled={selectedDelivery.status !== 'draft' || !reviewerId}
                    loading={submitting}
                    onClick={() => void submitDeliveryForReview()}
                  >
                    {t('sample.delivery.action.submitReview')}
                  </Button>
                  <Button
                    disabled={
                      selectedDelivery.status !== 'submitted' ||
                      !canApproveAssignedRecord(
                        currentUser,
                        selectedDelivery.reviewer_id,
                        'sample:delivery:approve',
                      )
                    }
                    loading={submitting}
                    type="primary"
                    onClick={() => void approveDelivery()}
                  >
                    {t('sample.delivery.action.approve')}
                  </Button>
                </div>
                {selectedDelivery.status === 'submitted' &&
                !canApproveAssignedRecord(
                  currentUser,
                  selectedDelivery.reviewer_id,
                  'sample:delivery:approve',
                ) ? (
                  <Alert
                    message={t('sample.delivery.message.awaitingReview', {
                      reviewer:
                        selectedDelivery.reviewer_name ??
                        t('sample.delivery.panel.designatedReviewer'),
                    })}
                    showIcon
                    type="info"
                  />
                ) : null}

                <form className="record-form accessory-form" onSubmit={submitTracking}>
                  <div className="form-divider">{t('sample.delivery.panel.trackingSection')}</div>
                  <div className="form-pair three">
                    <label>
                      {t('sample.delivery.field.expressCompany')}
                      <Input
                        value={trackingForm.express_company}
                        onChange={(event) =>
                          setTrackingForm({ ...trackingForm, express_company: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.delivery.field.trackingNo')}
                      <Input
                        value={trackingForm.tracking_no}
                        onChange={(event) =>
                          setTrackingForm({ ...trackingForm, tracking_no: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.delivery.field.trackingStatus')}
                      <FormSelect
                        value={trackingForm.status}
                        onChange={(event) =>
                          setTrackingForm({ ...trackingForm, status: event.target.value })
                        }
                      >
                        {sampleDeliveryTrackingStatusOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {t(item.labelKey)}
                          </option>
                        ))}
                      </FormSelect>
                    </label>
                  </div>
                  <Button htmlType="submit" loading={submitting}>
                    {t('sample.delivery.action.updateTracking')}
                  </Button>
                </form>

                <Table<SampleDeliveryLine>
                  className="compact-section"
                  columns={[
                    {
                      title: t('sample.delivery.table.sampleCode'),
                      dataIndex: 'sample_code',
                      render: nullableText,
                    },
                    {
                      title: t('sample.delivery.table.product'),
                      dataIndex: 'product_name',
                      render: (_, line) =>
                        `${line.product_code ?? t('sample.delivery.panel.notFilled')} / ${line.product_name}`,
                    },
                    {
                      title: t('sample.delivery.table.quantity'),
                      dataIndex: 'quantity',
                      render: (_, line) => `${line.quantity} ${line.unit}`,
                    },
                    { title: t('sample.delivery.table.type'), dataIndex: 'sample_type', render: sampleRecordTypeLabel },
                    { title: t('sample.delivery.table.note'), dataIndex: 'remark', render: nullableText },
                  ]}
                  dataSource={selectedDelivery.lines}
                  locale={{ emptyText: t('sample.delivery.panel.noLines') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />

                <Table<SampleDeliveryFee>
                  className="compact-section"
                  columns={[
                    {
                      title: t('sample.delivery.table.feeType'),
                      dataIndex: 'fee_type',
                      render: sampleDeliveryFeeTypeLabel,
                    },
                    {
                      title: t('sample.delivery.table.amount'),
                      dataIndex: 'amount',
                      render: (_, fee) => formatMoney(fee.amount, fee.currency),
                    },
                    {
                      title: t('sample.delivery.table.payerType'),
                      dataIndex: 'payer_type',
                      render: sampleDeliveryPayerTypeLabel,
                    },
                    { title: t('sample.delivery.table.note'), dataIndex: 'remark', render: nullableText },
                  ]}
                  dataSource={selectedDelivery.fees}
                  locale={{ emptyText: t('sample.delivery.panel.noFees') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />

                <div className="accessory-heading">
                  <strong>{t('sample.delivery.panel.feeStatistics')}</strong>
                  <span>{formatMoney(feeStatistics.total_amount, feeStatistics.currency)}</span>
                </div>
                <Table<SampleDeliveryFeeStatistic>
                  columns={[
                    { title: t('sample.delivery.table.customer'), dataIndex: 'customer_name' },
                    { title: t('sample.delivery.table.expressCompany'), dataIndex: 'express_company' },
                    { title: t('sample.delivery.table.deliveryCount'), dataIndex: 'delivery_count' },
                    {
                      title: t('sample.delivery.table.feeTotal'),
                      dataIndex: 'total_amount',
                      render: (_, item) => formatMoney(item.total_amount, item.currency),
                    },
                  ]}
                  dataSource={feeStatistics.items}
                  locale={{ emptyText: t('sample.delivery.panel.noApprovedFees') }}
                  pagination={false}
                  rowKey={(item) =>
                    `${item.customer_id ?? 'none'}-${item.express_company}-${item.currency}`
                  }
                  size="small"
                />

                <div className="accessory-heading">
                  <strong>{t('sample.delivery.panel.deliveryStatistics')}</strong>
                  <span>
                    {t('sample.delivery.panel.deliveryCount', {
                      count: deliveryStatistics.total_deliveries,
                    })}{' '}
                    /{' '}
                    {t('sample.delivery.panel.itemCount', {
                      count: deliveryStatistics.total_quantity,
                    })}
                  </span>
                </div>
                <Table<SampleDeliveryStatusStatistic>
                  columns={[
                    { title: t('sample.delivery.table.status'), dataIndex: 'status', render: sampleDeliveryStatusLabel },
                    { title: t('sample.delivery.table.deliveryCount'), dataIndex: 'delivery_count' },
                    { title: t('sample.delivery.table.totalQuantity'), dataIndex: 'total_quantity' },
                  ]}
                  dataSource={deliveryStatistics.by_status}
                  locale={{ emptyText: t('sample.delivery.panel.noStatusStatistics') }}
                  pagination={false}
                  rowKey="status"
                  size="small"
                />
                <Table<SampleDeliveryCustomerStatistic>
                  className="compact-section"
                  columns={[
                    { title: t('sample.delivery.table.customer'), dataIndex: 'customer_name' },
                    { title: t('sample.delivery.table.deliveryCount'), dataIndex: 'delivery_count' },
                    { title: t('sample.delivery.table.totalQuantity'), dataIndex: 'total_quantity' },
                  ]}
                  dataSource={deliveryStatistics.by_customer}
                  locale={{ emptyText: t('sample.delivery.panel.noCustomerStatistics') }}
                  pagination={false}
                  rowKey={(item) => item.customer_id ?? item.customer_name}
                  size="small"
                />
                <Table<SampleDeliveryExpressStatistic>
                  className="compact-section"
                  columns={[
                    { title: t('sample.delivery.table.expressCompany'), dataIndex: 'express_company' },
                    { title: t('sample.delivery.table.deliveryCount'), dataIndex: 'delivery_count' },
                    { title: t('sample.delivery.table.totalQuantity'), dataIndex: 'total_quantity' },
                  ]}
                  dataSource={deliveryStatistics.by_express}
                  locale={{ emptyText: t('sample.delivery.panel.noExpressStatistics') }}
                  pagination={false}
                  rowKey="express_company"
                  size="small"
                />

                <div className="accessory-heading">
                  <strong>{t('sample.delivery.panel.sampleHistory')}</strong>
                  <span>
                    {t('sample.delivery.panel.recordCount', { count: sampleHistory.length })}
                  </span>
                </div>
                <Table<SampleDelivery>
                  columns={[
                    { title: t('sample.delivery.table.deliveryCode'), dataIndex: 'code' },
                    { title: t('sample.delivery.table.customer'), dataIndex: 'customer_name' },
                    { title: t('sample.delivery.table.date'), dataIndex: 'delivery_date', render: formatDate },
                    { title: t('sample.delivery.table.status'), dataIndex: 'status', render: sampleDeliveryStatusLabel },
                    {
                      title: t('sample.delivery.table.express'),
                      dataIndex: 'express_company',
                      render: (_, delivery) =>
                        `${delivery.express_company} / ${delivery.tracking_no ?? t('sample.delivery.panel.notFilled')}`,
                    },
                  ]}
                  dataSource={sampleHistory}
                  locale={{ emptyText: t('sample.delivery.panel.noSampleHistory') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />

                <div className="accessory-heading">
                  <strong>{t('sample.delivery.panel.quoteHistory')}</strong>
                  <span>
                    {t('sample.delivery.panel.recordCount', { count: quoteHistory.length })}
                  </span>
                </div>
                <Table<SampleDelivery>
                  columns={[
                    { title: t('sample.delivery.table.quote'), dataIndex: 'quote_no', render: nullableText },
                    { title: t('sample.delivery.table.deliveryCode'), dataIndex: 'code' },
                    { title: t('sample.delivery.table.customer'), dataIndex: 'customer_name' },
                    {
                      title: t('sample.delivery.table.product'),
                      dataIndex: 'lines',
                      render: (_, delivery) =>
                        delivery.lines[0]?.product_name ?? t('sample.delivery.panel.notFilled'),
                    },
                    { title: t('sample.delivery.table.approvedAt'), dataIndex: 'approved_at', render: formatDate },
                  ]}
                  dataSource={quoteHistory}
                  locale={{ emptyText: t('sample.delivery.panel.noQuoteHistory') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <Send size={28} />
                <strong>{t('sample.delivery.panel.emptyTitle')}</strong>
                <span>{t('sample.delivery.panel.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
