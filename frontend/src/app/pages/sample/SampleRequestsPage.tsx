import { Alert, Button, Input, Modal, Table } from 'antd'
import { Plus, Search } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createSampleRequest,
  addSampleProgress,
  addSampleFee,
  requestSampleFeePayment,
  createSampleRecordFromRequest,
  listSampleRequests,
  type CurrentUser,
  type SampleRequest,
  type SampleFee,
} from '@/api'
import { sampleRequestPath, moduleDetailPath } from '@/app/routes'
import { t } from '@/app/appI18n'
import { FormSelect, ListPageShell, Metric, RemoteSelect } from '@/shared/ui'
import { showError } from '@/shared/errors'
import { useFormModal } from '@/shared/useFormModal'
import { useTablePagination } from '@/shared/useTablePagination'
import { sampleStatusOptions, sampleDestinationOptions } from '@/shared/formOptions'
import { formatDate, nullableText, type RoutedDetailPageProps } from '@/app/pages/appHelpers'
import {
  initialSampleRecordForm,
  initialSampleRequestForm,
  initialSampleProgressForm,
  initialSampleFeeForm,
  sampleRecordFormFromRequest,
  sampleRequestPayload,
  sampleRequestToRecordPayload,
  sampleProgressPayload,
  sampleFeePayload,
  sampleStatusLabel,
  sampleDestinationLabel,
  sampleProgressStageLabel,
  type SampleRecordFormState,
  type SampleProgressFormState,
  type SampleFeeFormState,
} from '@/app/pages/sample/sampleRequestHelpers'
import { SampleRequestDetailPanel } from '@/app/pages/sample/views/SampleRequestDetailPanel'
import { useSampleFormOptions } from '@/app/pages/sample/hooks/useSampleFormOptions'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function SampleRequestsPage({ currentUser, detailId, onNavigate }: Props) {
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
  const {
    open: requestModalOpen,
    form,
    setForm,
    submitting: requestSubmitting,
    openWith: openRequestModal,
    close: closeRequestModal,
    runSubmit: runRequestSubmit,
  } = useFormModal(initialSampleRequestForm)
  const [progressForm, setProgressForm] = useState<SampleProgressFormState>(() =>
    initialSampleProgressForm(),
  )
  const [feeForm, setFeeForm] = useState<SampleFeeFormState>(() => initialSampleFeeForm())
  const [paymentReviewerId, setPaymentReviewerId] = useState('')
  const [recordForm, setRecordForm] = useState<SampleRecordFormState>(() =>
    initialSampleRecordForm(),
  )
  const [summary, setSummary] = useState({ in_progress_count: 0 })
  const { fetchCustomers, fetchProducts, fetchSuppliers, fetchQuotations, getCustomer, getProduct, getSupplier, getQuotation } =
    useSampleFormOptions()
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination()

  const selectedRequest = useMemo(() => {
    if (detailId) return requests.find((item) => item.id === detailId) ?? null
    return requests.find((item) => item.id === selectedRequestId) ?? requests[0] ?? null
  }, [detailId, requests, selectedRequestId])

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

  async function loadRequests(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    setLoading(true)
    try {
      const result = await listSampleRequests({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
        limit: resolvedPageSize,
        offset: (resolvedPage - 1) * resolvedPageSize,
      })
      setTotal(result.total)
      setSummary(result.summary)
      if (result.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        await loadRequests(preferredId, prevPage, resolvedPageSize)
        return
      }
      setRequests(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedRequestId) ? selectedRequestId : null) ??
        result.items[0]?.id ??
        null
      setSelectedRequestId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('sample.request.message.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function openCreateRequest() {
    openRequestModal()
  }

  function applyQuotationToForm(quotationId: string) {
    if (!quotationId) {
      setForm({ ...form, quotation_id: '', quotation_no: '' })
      return
    }
    const quotation = getQuotation(quotationId)
    if (!quotation) {
      setForm({ ...form, quotation_id: quotationId })
      return
    }
    const firstLine = quotation.lines[0]
    setForm({
      ...form,
      quotation_id: quotation.id,
      quotation_no: quotation.code,
      customer_id: quotation.customer_id ?? '',
      customer_name: quotation.customer_name,
      product_id: firstLine?.product_id ?? '',
      product_code: firstLine?.product_code ?? '',
      product_name: firstLine?.product_name ?? '',
    })
  }

  function applyCustomerToForm(customerId: string) {
    if (!customerId) {
      setForm({ ...form, customer_id: '', customer_name: '' })
      return
    }
    const customer = getCustomer(customerId)
    setForm({
      ...form,
      customer_id: customerId,
      customer_name: customer?.cn_name || customer?.en_name || customer?.code || form.customer_name,
    })
  }

  function applyProductToForm(productId: string) {
    if (!productId) {
      setForm({ ...form, product_id: '', product_code: '', product_name: '' })
      return
    }
    const product = getProduct(productId)
    setForm({
      ...form,
      product_id: productId,
      product_code: product?.code ?? '',
      product_name: product?.cn_name || product?.en_name || form.product_name,
    })
  }

  function applySupplierToForm(supplierId: string) {
    if (!supplierId) {
      setForm({ ...form, supplier_id: '', supplier_name: '' })
      return
    }
    const supplier = getSupplier(supplierId)
    setForm({
      ...form,
      supplier_id: supplierId,
      supplier_name:
        supplier?.cn_name || supplier?.en_name || supplier?.code || form.supplier_name,
    })
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    await runRequestSubmit(
      async () => {
        const created = await createSampleRequest(sampleRequestPayload(form))
        setMessage(t('sample.request.message.created', { code: created.code }))
        closeRequestModal()
        setPage(1)
        await loadRequests(created.id, 1)
      },
      (caught) => showError(caught, t('sample.request.message.createFailed')),
    )
  }

  async function submitProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    try {
      const progress = await addSampleProgress(
        selectedRequest.id,
        sampleProgressPayload(progressForm),
      )
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
      setMessage(
        t('sample.request.message.progressUpdated', {
          stage: sampleProgressStageLabel(progress.stage),
        }),
      )
      setProgressForm(initialSampleProgressForm())
    } catch (caught) {
      showError(caught, t('sample.request.message.progressUpdateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitFee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    try {
      const fee = await addSampleFee(selectedRequest.id, sampleFeePayload(feeForm))
      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id ? { ...item, fees: [...item.fees, fee] } : item,
        ),
      )
      setMessage(
        t('sample.request.message.feeRegistered', { currency: fee.currency, amount: fee.amount }),
      )
      setFeeForm(initialSampleFeeForm())
    } catch (caught) {
      showError(caught, t('sample.request.message.feeRegisterFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitPaymentRequest(fee: SampleFee) {
    if (!selectedRequest) return
    if (!paymentReviewerId) {
      showError(new Error(t('sample.request.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const updatedFee = await requestSampleFeePayment(selectedRequest.id, fee.id, {
        reviewer_id: paymentReviewerId,
      })
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
      setMessage(t('sample.request.message.paymentRequested'))
    } catch (caught) {
      showError(caught, t('sample.request.message.paymentRequestFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function loadRequestIntoRecordForm(request: SampleRequest) {
    setRecordForm(sampleRecordFormFromRequest(request, recordForm))
    setMessage(t('sample.request.message.recordLoaded', { code: request.code }))
  }

  async function submitRecordFromRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    try {
      const record = await createSampleRecordFromRequest(
        selectedRequest.id,
        sampleRequestToRecordPayload(recordForm),
      )
      setMessage(t('sample.request.message.recordCreated', { code: record.code }))
      setRecordForm(initialSampleRecordForm())
    } catch (caught) {
      showError(caught, t('sample.request.message.recordCreateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sample-request-page">
      <div className="summary-strip" aria-label={t('sample.request.pageAria')}>
        <Metric label={t('sample.request.metric.requestCount')} value={total} />
        <Metric
          label={t('sample.request.metric.inProgressCount')}
          value={summary.in_progress_count}
        />
        <Metric
          label={t('sample.request.metric.progressCount')}
          value={selectedRequest?.progress_events.length ?? 0}
        />
        <Metric
          label={t('sample.request.metric.feeCount')}
          value={selectedRequest?.fees.length ?? 0}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid sample-request-grid">
        {!detailId ? (
          <ListPageShell
            className="product-list-panel"
            icon={<Search size={18} />}
            title={t('sample.request.panel.listTitle')}
            toolbar={
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  setPage(1)
                  void loadRequests(undefined, 1)
                }}
              >
                <label className="inline-filter-search">
                  {t('sample.request.filter.search')}
                  <Input
                    value={search}
                    placeholder={t('sample.request.filter.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label className="inline-filter-compact">
                  {t('sample.request.filter.status')}
                  <FormSelect
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('sample.request.filter.allStatuses')}</option>
                    {sampleStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label className="inline-filter-compact">
                  {t('sample.request.filter.customer')}
                  <Input
                    value={customerFilter}
                    placeholder={t('sample.request.filter.customerPlaceholder')}
                    onChange={(event) => setCustomerFilter(event.target.value)}
                  />
                </label>
                <label className="inline-filter-compact">
                  {t('sample.request.filter.dateFrom')}
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(event) => setDateFromFilter(event.target.value)}
                  />
                </label>
                <label className="inline-filter-compact">
                  {t('sample.request.filter.dateTo')}
                  <Input
                    type="date"
                    value={dateToFilter}
                    onChange={(event) => setDateToFilter(event.target.value)}
                  />
                </label>
                <div className="filter-actions">
                  <Button htmlType="submit" icon={<Search size={16} />}>
                    {t('sample.request.action.query')}
                  </Button>
                  <Button
                    htmlType="button"
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={openCreateRequest}
                  >
                    {t('sample.request.action.create')}
                  </Button>
                </div>
              </form>
            }
          >
            <Table<SampleRequest>
              columns={[
                {
                  title: t('sample.request.table.code'),
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
                {
                  title: t('sample.request.table.quotation'),
                  dataIndex: 'quotation_no',
                  render: nullableText,
                },
                { title: t('sample.request.table.customer'), dataIndex: 'customer_name' },
                {
                  title: t('sample.request.table.product'),
                  dataIndex: 'product_name',
                  render: nullableText,
                },
                {
                  title: t('sample.request.table.destination'),
                  dataIndex: 'destination',
                  render: sampleDestinationLabel,
                },
                {
                  title: t('sample.request.table.status'),
                  dataIndex: 'status',
                  render: sampleStatusLabel,
                },
                {
                  title: t('sample.request.table.dueDate'),
                  dataIndex: 'due_date',
                  render: formatDate,
                },
                {
                  title: t('sample.request.table.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: SampleRequest) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenRequestDetail(event, record)}
                    >
                      {t('sample.request.action.viewDetail')}
                    </Button>
                  ),
                },
              ]}
              dataSource={requests}
              loading={loading}
              pagination={{
                ...pagination,
                onChange: (nextPage, nextPageSize) => {
                  const next = changePage(nextPage, nextPageSize)
                  void loadRequests(undefined, next.page, next.pageSize)
                },
              }}
              rowClassName={(record) => (record.id === selectedRequest?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedRequestId(record.id),
              })}
            />
          </ListPageShell>
        ) : null}

        <Modal
          centered
          footer={null}
          open={requestModalOpen}
          title={t('sample.request.modal.createTitle')}
          width={980}
          onCancel={closeRequestModal}
        >
          <form
            className="record-form entity-modal-form sample-modal-form"
            onSubmit={submitRequest}
          >
            <label>
              {t('sample.request.field.code')}
              <Input
                readOnly
                value={form.code}
                placeholder={t('sample.request.form.codeAutoGenerated')}
              />
            </label>
            <label htmlFor="sample-request-status">
              {t('sample.request.field.status')}
              <FormSelect
                id="sample-request-status"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {sampleStatusOptions
                  .filter((item) => item.value !== 'completed' && item.value !== 'cancelled')
                  .map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
              </FormSelect>
            </label>
            <label>
              {t('sample.request.field.quotation')}
              <RemoteSelect
                allowClear
                ariaLabel={t('sample.request.field.quotation')}
                fetchOptions={fetchQuotations}
                placeholder={t('common.remoteSelect.placeholder')}
                value={form.quotation_id}
                initialOption={
                  form.quotation_id && form.quotation_no
                    ? { value: form.quotation_id, label: form.quotation_no }
                    : undefined
                }
                onChange={applyQuotationToForm}
              />
            </label>
            <label>
              {t('sample.request.field.requestDate')}
              <Input
                type="date"
                value={form.request_date}
                onChange={(event) => setForm({ ...form, request_date: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.dueDate')}
              <Input
                type="date"
                value={form.due_date}
                onChange={(event) => setForm({ ...form, due_date: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.customer')}
              <RemoteSelect
                allowClear
                ariaLabel={t('sample.request.field.customer')}
                fetchOptions={fetchCustomers}
                placeholder={t('common.remoteSelect.placeholder')}
                value={form.customer_id}
                initialOption={
                  form.customer_id && form.customer_name
                    ? { value: form.customer_id, label: form.customer_name }
                    : undefined
                }
                onChange={applyCustomerToForm}
              />
            </label>
            <label>
              {t('sample.request.field.product')}
              <RemoteSelect
                allowClear
                ariaLabel={t('sample.request.field.product')}
                fetchOptions={fetchProducts}
                placeholder={t('common.remoteSelect.placeholder')}
                value={form.product_id}
                initialOption={
                  form.product_id
                    ? {
                        value: form.product_id,
                        label: [form.product_code, form.product_name].filter(Boolean).join(' / '),
                      }
                    : undefined
                }
                onChange={applyProductToForm}
              />
            </label>
            <label>
              {t('sample.request.field.supplier')}
              <RemoteSelect
                allowClear
                ariaLabel={t('sample.request.field.supplier')}
                fetchOptions={fetchSuppliers}
                placeholder={t('common.remoteSelect.placeholder')}
                value={form.supplier_id}
                initialOption={
                  form.supplier_id && form.supplier_name
                    ? { value: form.supplier_id, label: form.supplier_name }
                    : undefined
                }
                onChange={applySupplierToForm}
              />
            </label>
            <label htmlFor="sample-request-destination">
              {t('sample.request.field.destination')}
              <FormSelect
                id="sample-request-destination"
                value={form.destination}
                onChange={(event) => setForm({ ...form, destination: event.target.value })}
              >
                {sampleDestinationOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('sample.request.field.requirements')}
              <Input.TextArea
                rows={3}
                value={form.requirements}
                onChange={(event) => setForm({ ...form, requirements: event.target.value })}
              />
            </label>
            <div className="form-divider">{t('sample.request.modal.lineSection')}</div>
            <label>
              {t('sample.request.field.lineProductCode')}
              <Input
                value={form.line_product_code}
                onChange={(event) =>
                  setForm({
                    ...form,
                    line_product_code: event.target.value,
                    line_product_id: event.target.value,
                  })
                }
              />
            </label>
            <label>
              {t('sample.request.field.lineProductName')}
              <Input
                value={form.line_product_name}
                onChange={(event) => setForm({ ...form, line_product_name: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.lineSpecification')}
              <Input
                value={form.line_specification}
                onChange={(event) => setForm({ ...form, line_specification: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.lineQuantity')}
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.line_quantity}
                onChange={(event) => setForm({ ...form, line_quantity: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.lineUnit')}
              <Input
                value={form.line_unit}
                onChange={(event) => setForm({ ...form, line_unit: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.lineRequirement')}
              <Input.TextArea
                rows={2}
                value={form.line_requirement}
                onChange={(event) => setForm({ ...form, line_requirement: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button className="secondary-inline" type="button" onClick={closeRequestModal}>
                {t('sample.request.action.cancel')}
              </button>
              <button className="inline-submit" disabled={requestSubmitting} type="submit">
                {t('sample.request.action.create')}
              </button>
            </div>
          </form>
        </Modal>

        {detailId ? (
          <SampleRequestDetailPanel
            selectedRequest={selectedRequest}
            currentUser={currentUser}
            onBack={() => onNavigate(sampleRequestPath)}
            submitting={submitting}
            progressForm={progressForm}
            setProgressForm={setProgressForm}
            submitProgress={submitProgress}
            feeForm={feeForm}
            setFeeForm={setFeeForm}
            submitFee={submitFee}
            paymentReviewerId={paymentReviewerId}
            setPaymentReviewerId={setPaymentReviewerId}
            submitPaymentRequest={submitPaymentRequest}
            recordForm={recordForm}
            setRecordForm={setRecordForm}
            loadRequestIntoRecordForm={loadRequestIntoRecordForm}
            submitRecordFromRequest={submitRecordFromRequest}
          />
        ) : null}
      </section>
    </section>
  )
}
