import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search , Send} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { approveSampleDelivery, createSampleDelivery, exportSampleDeliveries, getSampleDeliveryFeeStatistics, getSampleDeliveryQuoteHistory, getSampleDeliverySampleHistory, getSampleDeliveryStatistics, listSampleDeliveries, submitSampleDelivery, updateSampleDelivery, updateSampleDeliveryTracking, type SampleDelivery, type SampleDeliveryApprovePayload, type SampleDeliveryCreatePayload, type SampleDeliveryFeeStatistic, type SampleDeliveryFeeStatistics, type SampleDeliveryStatistics, type SampleDeliveryTrackingPayload , SampleDeliveryCustomerStatistic, SampleDeliveryExpressStatistic, SampleDeliveryFee, SampleDeliveryLine, SampleDeliveryStatusStatistic} from '../../../api'
import { sampleDeliveryPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { downloadCsv } from '../../../shared/print'
import { sampleDeliveryStatusOptions, sampleDeliveryFeeTypeOptions, sampleDeliveryPayerTypeOptions, sampleDeliveryTrackingStatusOptions, sampleRecordTypeOptions, sampleRecordStatusOptions } from '../../../shared/formOptions'
import { formatDate, formatMoney, nullableText, todayInputValue, type RoutedDetailPageProps , emptyToNull} from '../appHelpers'

function sampleDeliveryFeeTypeLabel(value: string): string {
  return sampleDeliveryFeeTypeOptions.find((item) => item.value === value)?.label ?? value
}

function sampleRecordTypeLabel(value: string): string {
  return sampleRecordTypeOptions.find((item) => item.value === value)?.label ?? value
}

function sampleRecordStatusLabel(value: string): string {
  return sampleRecordStatusOptions.find((item) => item.value === value)?.label ?? value
}

function sampleDeliveryStatusLabel(value: string): string {
  return sampleDeliveryStatusOptions.find((item) => item.value === value)?.label ?? value
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
    reviewer_name: '演示业务主管',
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
  return sampleDeliveryPayerTypeOptions.find((item) => item.value === value)?.label ?? value
}


export function SampleDeliveriesPage({ detailId, onNavigate }: RoutedDetailPageProps) {
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
  const [error, setError] = useState('')
  const [form, setForm] = useState<SampleDeliveryFormState>(() => initialSampleDeliveryForm())
  const [deliveryModalMode, setDeliveryModalMode] = useState<'create' | 'edit' | null>(null)
  const [approveForm, setApproveForm] = useState<SampleDeliveryApproveFormState>(() =>
    initialSampleDeliveryApproveForm(),
  )
  const [trackingForm, setTrackingForm] = useState<SampleDeliveryTrackingFormState>(() =>
    initialSampleDeliveryTrackingForm(),
  )

  const selectedDelivery = useMemo(
    () => {
      if (detailId) return deliveries.find((item) => item.id === detailId) ?? null
      return deliveries.find((item) => item.id === selectedDeliveryId) ?? deliveries[0] ?? null
    },
    [deliveries, detailId, selectedDeliveryId],
  )

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
    void loadSelectedDeliveryHistories(selectedDelivery)
  }, [selectedDelivery?.id, selectedDelivery?.status, selectedDelivery?.tracking_no])

  async function loadDeliveries(preferredId?: string) {
    setLoading(true)
    setError('')
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
      showError(caught, '寄样管理加载失败')
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
      showError(caught, '寄样历史加载失败')
    }
  }

  function syncDeliveryActionForms(delivery: SampleDelivery | null) {
    setApproveForm({
      reviewer_name: '演示业务主管',
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
    setError('')
    try {
      const created = await createSampleDelivery(sampleDeliveryPayload(form))
      setMessage(`已新增寄样单 ${created.code}`)
      setForm(initialSampleDeliveryForm())
      setDeliveryModalMode(null)
      upsertDelivery(created)
      await loadDeliveries(created.id)
      setDeliveries((current) =>
        current.some((delivery) => delivery.id === created.id) ? current : [created, ...current],
      )
      setSelectedDeliveryId(created.id)
    } catch (caught) {
      showError(caught, '寄样单新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function saveDeliveryDraft() {
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updated = await updateSampleDelivery(selectedDelivery.id, sampleDeliveryPayload(form))
      setMessage(`已保存寄样单 ${updated.code}`)
      setDeliveryModalMode(null)
      upsertDelivery(updated)
      await loadDeliveries(updated.id)
    } catch (caught) {
      showError(caught, '寄样单草稿保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitDeliveryForReview() {
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitSampleDelivery(selectedDelivery.id)
      setMessage(`已提交寄样单 ${submitted.code}`)
      upsertDelivery(submitted)
      await loadDeliveries(submitted.id)
    } catch (caught) {
      showError(caught, '寄样单提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveDelivery() {
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveSampleDelivery(
        selectedDelivery.id,
        sampleDeliveryApprovePayload(approveForm),
      )
      setMessage(`已审核寄样单 ${approved.code}`)
      upsertDelivery(approved)
      await loadDeliveries(approved.id)
    } catch (caught) {
      showError(caught, '寄样单审核失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitTracking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const tracked = await updateSampleDeliveryTracking(
        selectedDelivery.id,
        sampleDeliveryTrackingPayload(trackingForm),
      )
      setMessage(`已更新物流 ${tracked.tracking_no ?? ''}`.trim())
      upsertDelivery(tracked)
      await loadDeliveries(tracked.id)
    } catch (caught) {
      showError(caught, '物流跟踪更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadDeliveryExport() {
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const exported = await exportSampleDeliveries({
        customer_id: customerFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
        express_company: expressFilter.trim() || undefined,
      })
      downloadCsv(exported.filename, exported.content)
      setMessage(`已导出 ${exported.total} 条寄样记录`)
    } catch (caught) {
      showError(caught, '寄样导出失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sample-delivery-page">
      <div className="summary-strip" aria-label="寄样管理概览">
        <Metric label="寄样单" value={deliveries.length} />
        <Metric label="待审核" value={deliveries.filter((item) => item.status === 'submitted').length} />
        <Metric label="已审核" value={deliveries.filter((item) => ['approved', 'shipped'].includes(item.status)).length} />
        <Metric label="寄样数量" value={deliveryStatistics.total_quantity} />
        <Metric label="费用" value={formatMoney(feeStatistics.total_amount, feeStatistics.currency)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid sample-delivery-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="寄样单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadDeliveries()
              }}
            >
              <label className="inline-filter-search">
                寄样搜索
                <Input
                  value={search}
                  placeholder="单号 / 客户 / 样品 / 快递"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact" htmlFor="sample-delivery-status-filter">
                审核状态
                <FormSelect
                  id="sample-delivery-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {sampleDeliveryStatusOptions
                    .filter((item) => item.value !== 'rejected')
                    .map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                </FormSelect>
              </label>
              <label className="inline-filter-compact">
                客户标识
                <Input
                  value={customerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                快递公司
                <Input
                  value={expressFilter}
                  placeholder="DHL / FedEx"
                  onChange={(event) => setExpressFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                寄样起始日期
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(event) => setDateFromFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                寄样截止日期
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(event) => setDateToFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button loading={submitting} onClick={() => void downloadDeliveryExport()}>
                导出寄样
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateDelivery}>
                新增寄样单
              </Button>
            </form>
          </div>

          <Table<SampleDelivery>
            columns={[
              {
                title: '寄样单号',
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
              { title: '状态', dataIndex: 'status', render: sampleDeliveryStatusLabel },
              { title: '客户', dataIndex: 'customer_name' },
              {
                title: '快递',
                dataIndex: 'express_company',
                render: (_, record) => `${record.express_company} / ${record.tracking_no ?? '未填'}`,
              },
              { title: '报价单', dataIndex: 'quote_no', render: nullableText },
              {
                title: '费用',
                dataIndex: 'fee_total',
                render: (_, record) => formatMoney(record.fee_total, record.fees[0]?.currency ?? 'USD'),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: SampleDelivery) => (
                  <Button size="small" onClick={(event) => stopAndOpenDeliveryDetail(event, record)}>
                    查看详情
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
          title={deliveryModalMode === 'edit' ? '编辑寄样单草稿' : '新增寄样单'}
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
                寄样单号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                寄样日期
                <Input
                  type="date"
                  value={form.delivery_date}
                  onChange={(event) => setForm({ ...form, delivery_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                客户标识
                <Input
                  value={form.customer_id}
                  onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
                />
              </label>
              <label>
                客户名称
                <Input
                  value={form.customer_name}
                  onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                供应商
                <Input
                  value={form.supplier_name}
                  onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
                />
              </label>
              <label>
                工厂
                <Input
                  value={form.factory_name}
                  onChange={(event) => setForm({ ...form, factory_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                收件人
                <Input
                  value={form.recipient_name}
                  onChange={(event) => setForm({ ...form, recipient_name: event.target.value })}
                />
              </label>
              <label>
                收件公司
                <Input
                  value={form.recipient_company}
                  onChange={(event) => setForm({ ...form, recipient_company: event.target.value })}
                />
              </label>
            </div>
            <label>
              收件地址
              <Input
                value={form.recipient_address}
                onChange={(event) => setForm({ ...form, recipient_address: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                快递公司
                <Input
                  value={form.express_company}
                  onChange={(event) => setForm({ ...form, express_company: event.target.value })}
                />
              </label>
              <label>
                快递单号
                <Input
                  value={form.tracking_no}
                  onChange={(event) => setForm({ ...form, tracking_no: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                报价单号
                <Input
                  value={form.quote_no}
                  onChange={(event) => setForm({ ...form, quote_no: event.target.value })}
                />
              </label>
              <label>
                报价标识
                <Input
                  value={form.quote_id}
                  onChange={(event) => setForm({ ...form, quote_id: event.target.value })}
                />
              </label>
            </div>
            <div className="form-divider">寄样明细</div>
            <div className="form-pair two">
              <label>
                样品标识
                <Input
                  value={form.sample_record_id}
                  onChange={(event) => setForm({ ...form, sample_record_id: event.target.value })}
                />
              </label>
              <label>
                样品编号
                <Input
                  value={form.sample_code}
                  onChange={(event) => setForm({ ...form, sample_code: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="sample-delivery-sample-type">
                样品分类
                <FormSelect
                  id="sample-delivery-sample-type"
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
              <label>
                产品编号
                <Input
                  value={form.product_code}
                  onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                />
              </label>
            </div>
            <label>
              产品名称
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                寄样数量
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                />
              </label>
              <label>
                单位
                <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
              </label>
            </div>
            <label>
              明细备注
              <Input
                value={form.line_remark}
                onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
              />
            </label>
            <div className="form-divider">费用登记</div>
            <div className="form-pair two">
              <label htmlFor="sample-delivery-fee-type">
                费用类型
                <FormSelect
                  id="sample-delivery-fee-type"
                  value={form.fee_type}
                  onChange={(event) => setForm({ ...form, fee_type: event.target.value })}
                >
                  {sampleDeliveryFeeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                金额
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
                币种
                <Input
                  value={form.fee_currency}
                  onChange={(event) => setForm({ ...form, fee_currency: event.target.value })}
                />
              </label>
              <label htmlFor="sample-delivery-fee-payer">
                承担方
                <FormSelect
                  id="sample-delivery-fee-payer"
                  value={form.fee_payer_type}
                  onChange={(event) => setForm({ ...form, fee_payer_type: event.target.value })}
                >
                  {sampleDeliveryPayerTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <label>
              费用备注
              <Input
                value={form.fee_remark}
                onChange={(event) => setForm({ ...form, fee_remark: event.target.value })}
              />
            </label>
            <label htmlFor="sample-delivery-remark">
              寄样备注
              <Input.TextArea
                id="sample-delivery-remark"
                rows={2}
                value={form.remark}
                onChange={(event) => setForm({ ...form, remark: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button className="secondary-inline" type="button" onClick={() => setDeliveryModalMode(null)}>
                取消
              </button>
              {deliveryModalMode === 'edit' ? (
                <button className="inline-submit" disabled={submitting} type="button" onClick={() => void saveDeliveryDraft()}>
                  保存草稿编辑
                </button>
              ) : (
                <button className="inline-submit" disabled={submitting} type="submit">
                  新增寄样单
                </button>
              )}
            </div>
          </form>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="寄样明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(sampleDeliveryPath)}>
              返回列表
            </Button>
          </div>
          {selectedDelivery ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/日期</dt>
                  <dd>{sampleDeliveryStatusLabel(selectedDelivery.status)} / {formatDate(selectedDelivery.delivery_date)}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedDelivery.customer_name}</dd>
                </div>
                <div>
                  <dt>供应商/工厂</dt>
                  <dd>{selectedDelivery.supplier_name ?? '未填'} / {selectedDelivery.factory_name ?? '未填'}</dd>
                </div>
                <div>
                  <dt>收件方</dt>
                  <dd>{selectedDelivery.recipient_name} / {selectedDelivery.recipient_company ?? '未填'}</dd>
                </div>
                <div>
                  <dt>快递</dt>
                  <dd>{selectedDelivery.express_company} / {selectedDelivery.tracking_no ?? '未填'}</dd>
                </div>
                <div>
                  <dt>报价单</dt>
                  <dd>{selectedDelivery.quote_no ?? '未关联'}</dd>
                </div>
                <div>
                  <dt>费用合计</dt>
                  <dd>{formatMoney(selectedDelivery.fee_total, selectedDelivery.fees[0]?.currency ?? 'USD')}</dd>
                </div>
                <div>
                  <dt>审核人</dt>
                  <dd>{selectedDelivery.reviewer_name ?? '未审核'}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>寄样备注</strong>
                <p>{selectedDelivery.remark ?? selectedDelivery.recipient_address}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedDelivery.status !== 'draft'}
                  onClick={() => openEditDelivery(selectedDelivery)}
                >
                  编辑草稿
                </Button>
                <Button
                  disabled={selectedDelivery.status !== 'draft'}
                  loading={submitting}
                  onClick={() => void submitDeliveryForReview()}
                >
                  提交审核
                </Button>
                <Button
                  disabled={selectedDelivery.status !== 'submitted'}
                  loading={submitting}
                  type="primary"
                  onClick={() => void approveDelivery()}
                >
                  审核通过
                </Button>
              </div>

              <form className="record-form accessory-form" onSubmit={submitTracking}>
                <div className="form-divider">物流跟踪</div>
                <div className="form-pair three">
                  <label>
                    快递公司
                    <Input
                      value={trackingForm.express_company}
                      onChange={(event) =>
                        setTrackingForm({ ...trackingForm, express_company: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    快递单号
                    <Input
                      value={trackingForm.tracking_no}
                      onChange={(event) => setTrackingForm({ ...trackingForm, tracking_no: event.target.value })}
                    />
                  </label>
                  <label>
                    物流状态
                  <FormSelect
                    value={trackingForm.status}
                    onChange={(event) => setTrackingForm({ ...trackingForm, status: event.target.value })}
                  >
                    {sampleDeliveryTrackingStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                  </label>
                </div>
                <Button htmlType="submit" loading={submitting}>
                  更新物流
                </Button>
              </form>

              <Table<SampleDeliveryLine>
                className="compact-section"
                columns={[
                  { title: '样品编号', dataIndex: 'sample_code', render: nullableText },
                  {
                    title: '产品',
                    dataIndex: 'product_name',
                    render: (_, line) => `${line.product_code ?? '未填'} / ${line.product_name}`,
                  },
                  { title: '数量', dataIndex: 'quantity', render: (_, line) => `${line.quantity} ${line.unit}` },
                  { title: '分类', dataIndex: 'sample_type', render: sampleRecordTypeLabel },
                  { title: '备注', dataIndex: 'remark', render: nullableText },
                ]}
                dataSource={selectedDelivery.lines}
                locale={{ emptyText: '暂无寄样明细' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <Table<SampleDeliveryFee>
                className="compact-section"
                columns={[
                  { title: '费用类型', dataIndex: 'fee_type', render: sampleDeliveryFeeTypeLabel },
                  { title: '金额', dataIndex: 'amount', render: (_, fee) => formatMoney(fee.amount, fee.currency) },
                  { title: '承担方', dataIndex: 'payer_type', render: sampleDeliveryPayerTypeLabel },
                  { title: '备注', dataIndex: 'remark', render: nullableText },
                ]}
                dataSource={selectedDelivery.fees}
                locale={{ emptyText: '暂无费用明细' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>费用统计</strong>
                <span>{formatMoney(feeStatistics.total_amount, feeStatistics.currency)}</span>
              </div>
              <Table<SampleDeliveryFeeStatistic>
                columns={[
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '快递公司', dataIndex: 'express_company' },
                  { title: '寄样单数', dataIndex: 'delivery_count' },
                  {
                    title: '费用合计',
                    dataIndex: 'total_amount',
                    render: (_, item) => formatMoney(item.total_amount, item.currency),
                  },
                ]}
                dataSource={feeStatistics.items}
                locale={{ emptyText: '暂无已审核费用' }}
                pagination={false}
                rowKey={(item) => `${item.customer_id ?? 'none'}-${item.express_company}-${item.currency}`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>寄样统计</strong>
                <span>{deliveryStatistics.total_deliveries} 单 / {deliveryStatistics.total_quantity} 件</span>
              </div>
              <Table<SampleDeliveryStatusStatistic>
                columns={[
                  { title: '状态', dataIndex: 'status', render: sampleDeliveryStatusLabel },
                  { title: '寄样单数', dataIndex: 'delivery_count' },
                  { title: '寄样数量', dataIndex: 'total_quantity' },
                ]}
                dataSource={deliveryStatistics.by_status}
                locale={{ emptyText: '暂无状态统计' }}
                pagination={false}
                rowKey="status"
                size="small"
              />
              <Table<SampleDeliveryCustomerStatistic>
                className="compact-section"
                columns={[
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '寄样单数', dataIndex: 'delivery_count' },
                  { title: '寄样数量', dataIndex: 'total_quantity' },
                ]}
                dataSource={deliveryStatistics.by_customer}
                locale={{ emptyText: '暂无客户统计' }}
                pagination={false}
                rowKey={(item) => item.customer_id ?? item.customer_name}
                size="small"
              />
              <Table<SampleDeliveryExpressStatistic>
                className="compact-section"
                columns={[
                  { title: '快递公司', dataIndex: 'express_company' },
                  { title: '寄样单数', dataIndex: 'delivery_count' },
                  { title: '寄样数量', dataIndex: 'total_quantity' },
                ]}
                dataSource={deliveryStatistics.by_express}
                locale={{ emptyText: '暂无快递统计' }}
                pagination={false}
                rowKey="express_company"
                size="small"
              />

              <div className="accessory-heading">
                <strong>样品寄样历史</strong>
                <span>{sampleHistory.length} 条</span>
              </div>
              <Table<SampleDelivery>
                columns={[
                  { title: '寄样单', dataIndex: 'code' },
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '日期', dataIndex: 'delivery_date', render: formatDate },
                  { title: '状态', dataIndex: 'status', render: sampleDeliveryStatusLabel },
                  {
                    title: '快递',
                    dataIndex: 'express_company',
                    render: (_, delivery) => `${delivery.express_company} / ${delivery.tracking_no ?? '未填'}`,
                  },
                ]}
                dataSource={sampleHistory}
                locale={{ emptyText: '暂无该样品寄样历史' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>报价关联寄样</strong>
                <span>{quoteHistory.length} 条</span>
              </div>
              <Table<SampleDelivery>
                columns={[
                  { title: '报价单', dataIndex: 'quote_no', render: nullableText },
                  { title: '寄样单', dataIndex: 'code' },
                  { title: '客户', dataIndex: 'customer_name' },
                  {
                    title: '产品',
                    dataIndex: 'lines',
                    render: (_, delivery) => delivery.lines[0]?.product_name ?? '未填',
                  },
                  { title: '审核日期', dataIndex: 'approved_at', render: formatDate },
                ]}
                dataSource={quoteHistory}
                locale={{ emptyText: '暂无报价关联寄样记录' }}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Send size={28} />
              <strong>暂无寄样单</strong>
              <span>请返回列表选择寄样单查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


