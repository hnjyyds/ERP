import { Alert, Button, Input, Modal, Table } from 'antd'
import {
  ArrowLeft,
  FlaskConical,
  Images as _Images,
  LayoutDashboard,
  Plus,
  Search,
} from 'lucide-react'
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
  type SampleRequestCreatePayload,
  type SampleRequestLinePayload,
  type SampleRequestToRecordPayload,
  type SampleFee,
  type SampleFeePayload,
  type SampleProgress,
  type SampleProgressPayload,
  type SampleRecord as _SampleRecord,
  type SampleRecordCreatePayload as _SampleRecordCreatePayload,
  SampleRecordImagePayload,
} from '../../../api'
import { sampleRequestPath, moduleDetailPath } from '../../routes'
import { t } from '../../appI18n'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { openSampleRequestPrint } from '../../../shared/print'
import {
  sampleStatusOptions,
  sampleDestinationOptions,
  sampleProgressStageOptions,
  sampleFeeTypeOptions,
  samplePayeeTypeOptions,
  sampleRecordTypeOptions,
  sampleSourceTypeOptions as _sampleSourceTypeOptions,
} from '../../../shared/formOptions'
import {
  formatDate,
  nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '../appHelpers'
import { ApprovalAssigneeSelect } from '../../components/ApprovalAssigneeSelect'

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
    code: '',
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
    source_note: t('sample.request.message.recordSourceNote', { code: request.code }),
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
    code: '',
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
    code: '',
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
  const option = sampleStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function sampleDestinationLabel(value: string): string {
  const option = sampleDestinationOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function sampleProgressStageLabel(value: string): string {
  const option = sampleProgressStageOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function sampleFeeTypeLabel(value: string): string {
  const option = sampleFeeTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function samplePaymentStatusLabel(value: string): string {
  if (value === 'requested') return t('sample.request.paymentStatus.requested')
  if (value === 'paid') return t('sample.request.paymentStatus.paid')
  return t('sample.request.paymentStatus.notRequested')
}

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
  const [form, setForm] = useState<SampleRequestFormState>(() => initialSampleRequestForm())
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [progressForm, setProgressForm] = useState<SampleProgressFormState>(() =>
    initialSampleProgressForm(),
  )
  const [feeForm, setFeeForm] = useState<SampleFeeFormState>(() => initialSampleFeeForm())
  const [paymentReviewerId, setPaymentReviewerId] = useState('')
  const [recordForm, setRecordForm] = useState<SampleRecordFormState>(() =>
    initialSampleRecordForm(),
  )

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

  async function loadRequests(preferredId?: string) {
    setLoading(true)
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
      showError(caught, t('sample.request.message.loadFailed'))
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
    try {
      const created = await createSampleRequest(sampleRequestPayload(form))
      setMessage(t('sample.request.message.created', { code: created.code }))
      setForm(initialSampleRequestForm())
      setRequestModalOpen(false)
      await loadRequests(created.id)
    } catch (caught) {
      showError(caught, t('sample.request.message.createFailed'))
    } finally {
      setSubmitting(false)
    }
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
        <Metric label={t('sample.request.metric.requestCount')} value={requests.length} />
        <Metric
          label={t('sample.request.metric.inProgressCount')}
          value={requests.filter((item) => item.status === 'in_progress').length}
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
          <section className="workspace-panel list-panel product-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<Search size={18} />}
                title={t('sample.request.panel.listTitle')}
              />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadRequests()
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
              </form>
            </div>

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
          title={t('sample.request.modal.createTitle')}
          width={980}
          onCancel={() => setRequestModalOpen(false)}
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
                {sampleStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
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
              {t('sample.request.field.customerId')}
              <Input
                value={form.customer_id}
                onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.customerName')}
              <Input
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.productCode')}
              <Input
                value={form.product_code}
                onChange={(event) => setForm({ ...form, product_code: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.productName')}
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.supplierName')}
              <Input
                value={form.supplier_name}
                onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
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
              <button
                className="secondary-inline"
                type="button"
                onClick={() => setRequestModalOpen(false)}
              >
                {t('sample.request.action.cancel')}
              </button>
              <button className="inline-submit" disabled={submitting} type="submit">
                {t('sample.request.action.create')}
              </button>
            </div>
          </form>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('sample.request.panel.detailTitle')}
              />
              <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(sampleRequestPath)}>
                {t('sample.request.action.backToList')}
              </Button>
            </div>
            {selectedRequest ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('sample.request.field.code')}</dt>
                    <dd>{selectedRequest.code}</dd>
                  </div>
                  <div>
                    <dt>{t('sample.request.field.customerProduct')}</dt>
                    <dd>
                      {selectedRequest.customer_name} / {selectedRequest.product_name ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.request.field.destinationStatus')}</dt>
                    <dd>
                      {sampleDestinationLabel(selectedRequest.destination)} /{' '}
                      {sampleStatusLabel(selectedRequest.status)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sample.request.field.supplier')}</dt>
                    <dd>{selectedRequest.supplier_name ?? t('sample.request.panel.notSet')}</dd>
                  </div>
                  <div>
                    <dt>{t('sample.request.field.requestDate')}</dt>
                    <dd>{formatDate(selectedRequest.request_date)}</dd>
                  </div>
                  <div>
                    <dt>{t('sample.request.field.dueDateShort')}</dt>
                    <dd>{formatDate(selectedRequest.due_date)}</dd>
                  </div>
                  <div>
                    <dt>{t('sample.request.field.customerRequirement')}</dt>
                    <dd>{selectedRequest.requirements}</dd>
                  </div>
                </dl>

                <div className="delivery-action-row">
                  <Button onClick={() => void openSampleRequestPrint(selectedRequest.id)}>
                    {t('sample.request.action.print')}
                  </Button>
                  <Button
                    disabled={selectedRequest.status !== 'completed'}
                    onClick={() => loadRequestIntoRecordForm(selectedRequest)}
                  >
                    {t('sample.request.action.loadAsSample')}
                  </Button>
                </div>

                <section className="compact-section">
                  <PanelTitle
                    icon={<Search size={18} />}
                    title={t('sample.request.panel.lineTitle')}
                  />
                  <Table
                    columns={[
                      {
                        title: t('sample.request.table.productCode'),
                        dataIndex: 'product_code',
                        render: nullableText,
                      },
                      { title: t('sample.request.table.productName'), dataIndex: 'product_name' },
                      {
                        title: t('sample.request.table.specification'),
                        dataIndex: 'specification',
                        render: nullableText,
                      },
                      { title: t('sample.request.table.quantity'), dataIndex: 'quantity', width: 90 },
                      { title: t('sample.request.table.unit'), dataIndex: 'unit', width: 80 },
                      {
                        title: t('sample.request.table.requirement'),
                        dataIndex: 'requirement',
                        render: nullableText,
                      },
                    ]}
                    dataSource={selectedRequest.lines}
                    pagination={false}
                    rowKey="id"
                    size="small"
                  />
                </section>

                <form className="record-form compact-section" onSubmit={submitProgress}>
                  <div className="form-divider">{t('sample.request.panel.progressTitle')}</div>
                  <label>
                    {t('sample.request.field.progressStage')}
                    <FormSelect
                      value={progressForm.stage}
                      onChange={(event) =>
                        setProgressForm({ ...progressForm, stage: event.target.value })
                      }
                    >
                      {sampleProgressStageOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {t(item.labelKey)}
                        </option>
                      ))}
                    </FormSelect>
                  </label>
                  <label>
                    {t('sample.request.field.progressStatus')}
                    <FormSelect
                      value={progressForm.status}
                      onChange={(event) =>
                        setProgressForm({ ...progressForm, status: event.target.value })
                      }
                    >
                      {sampleStatusOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {t(item.labelKey)}
                        </option>
                      ))}
                    </FormSelect>
                  </label>
                  <label>
                    {t('sample.request.field.progressDate')}
                    <Input
                      type="date"
                      value={progressForm.occurred_at}
                      onChange={(event) =>
                        setProgressForm({ ...progressForm, occurred_at: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t('sample.request.field.progressHandler')}
                    <Input
                      value={progressForm.handler_name}
                      onChange={(event) =>
                        setProgressForm({ ...progressForm, handler_name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t('sample.request.field.progressNote')}
                    <Input.TextArea
                      rows={2}
                      value={progressForm.note}
                      onChange={(event) =>
                        setProgressForm({ ...progressForm, note: event.target.value })
                      }
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting} type="primary">
                    {t('sample.request.action.updateProgress')}
                  </Button>
                </form>

                <Table<SampleProgress>
                  className="compact-section"
                  columns={[
                    {
                      title: t('sample.request.table.stage'),
                      dataIndex: 'stage',
                      render: sampleProgressStageLabel,
                    },
                    {
                      title: t('sample.request.table.status'),
                      dataIndex: 'status',
                      render: sampleStatusLabel,
                    },
                    {
                      title: t('sample.request.table.date'),
                      dataIndex: 'occurred_at',
                      render: formatDate,
                    },
                    {
                      title: t('sample.request.table.handler'),
                      dataIndex: 'handler_name',
                      render: nullableText,
                    },
                    {
                      title: t('sample.request.table.note'),
                      dataIndex: 'note',
                      render: nullableText,
                    },
                  ]}
                  dataSource={selectedRequest.progress_events}
                  locale={{ emptyText: t('sample.request.panel.noProgress') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />

                <form className="record-form compact-section" onSubmit={submitFee}>
                  <div className="form-divider">{t('sample.request.panel.feeTitle')}</div>
                  <label>
                    {t('sample.request.field.feeType')}
                    <FormSelect
                      value={feeForm.fee_type}
                      onChange={(event) => setFeeForm({ ...feeForm, fee_type: event.target.value })}
                    >
                      {sampleFeeTypeOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {t(item.labelKey)}
                        </option>
                      ))}
                    </FormSelect>
                  </label>
                  <label>
                    {t('sample.request.field.feeAmount')}
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={feeForm.amount}
                      onChange={(event) => setFeeForm({ ...feeForm, amount: event.target.value })}
                    />
                  </label>
                  <label>
                    {t('sample.request.field.feeCurrency')}
                    <Input
                      value={feeForm.currency}
                      onChange={(event) => setFeeForm({ ...feeForm, currency: event.target.value })}
                    />
                  </label>
                  <label>
                    {t('sample.request.field.payeeType')}
                    <FormSelect
                      value={feeForm.payee_type}
                      onChange={(event) =>
                        setFeeForm({ ...feeForm, payee_type: event.target.value })
                      }
                    >
                      {samplePayeeTypeOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {t(item.labelKey)}
                        </option>
                      ))}
                    </FormSelect>
                  </label>
                  <label>
                    {t('sample.request.field.payeeName')}
                    <Input
                      value={feeForm.payee_name}
                      onChange={(event) =>
                        setFeeForm({ ...feeForm, payee_name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t('sample.request.field.feeRemark')}
                    <Input.TextArea
                      rows={2}
                      value={feeForm.remark}
                      onChange={(event) => setFeeForm({ ...feeForm, remark: event.target.value })}
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    {t('sample.request.action.registerFee')}
                  </Button>
                </form>

                {selectedRequest.fees.some((fee) => !fee.payment_request_no) ? (
                  <ApprovalAssigneeSelect
                    currentUserId={currentUser.id}
                    label={t('sample.request.field.paymentReviewer')}
                    onChange={setPaymentReviewerId}
                    requiredPermission="finance:view"
                    value={paymentReviewerId}
                  />
                ) : null}

                <Table<SampleFee>
                  className="compact-section"
                  columns={[
                    {
                      title: t('sample.request.table.feeType'),
                      dataIndex: 'fee_type',
                      render: sampleFeeTypeLabel,
                    },
                    {
                      title: t('sample.request.table.amount'),
                      dataIndex: 'amount',
                      render: (_, record) => `${record.currency} ${record.amount}`,
                    },
                    { title: t('sample.request.table.payee'), dataIndex: 'payee_name' },
                    {
                      title: t('sample.request.table.paymentStatus'),
                      dataIndex: 'payment_status',
                      render: samplePaymentStatusLabel,
                    },
                    {
                      title: t('sample.request.table.paymentRequest'),
                      dataIndex: 'payment_request_no',
                      render: nullableText,
                    },
                    {
                      title: t('sample.request.table.operation'),
                      dataIndex: 'id',
                      width: 120,
                      render: (_, record) => (
                        <Button
                          disabled={Boolean(record.payment_request_no) || !paymentReviewerId}
                          loading={submitting}
                          size="small"
                          onClick={() => void submitPaymentRequest(record)}
                        >
                          {t('sample.request.action.requestPayment')}
                        </Button>
                      ),
                    },
                  ]}
                  dataSource={selectedRequest.fees}
                  locale={{ emptyText: t('sample.request.panel.noFees') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />

                <form className="record-form compact-section" onSubmit={submitRecordFromRequest}>
                  <div className="form-divider">{t('sample.request.panel.recordTitle')}</div>
                  <div className="form-pair three">
                    <label>
                      {t('sample.request.field.sampleCode')}
                      <Input
                        readOnly
                        value={recordForm.code}
                        placeholder={t('sample.record.form.codeAutoGenerated')}
                      />
                    </label>
                    <label>
                      {t('sample.request.field.sampleType')}
                      <FormSelect
                        value={recordForm.sample_type}
                        onChange={(event) =>
                          setRecordForm({ ...recordForm, sample_type: event.target.value })
                        }
                      >
                        {sampleRecordTypeOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {t(item.labelKey)}
                          </option>
                        ))}
                      </FormSelect>
                    </label>
                    <label>
                      {t('sample.request.field.receivedQuantity')}
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={recordForm.quantity}
                        onChange={(event) =>
                          setRecordForm({ ...recordForm, quantity: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair three">
                    <label>
                      {t('sample.request.field.receivedAt')}
                      <Input
                        type="date"
                        value={recordForm.received_at}
                        onChange={(event) =>
                          setRecordForm({ ...recordForm, received_at: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.request.field.submittedAt')}
                      <Input
                        type="date"
                        value={recordForm.submitted_at}
                        onChange={(event) =>
                          setRecordForm({ ...recordForm, submitted_at: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.request.field.unit')}
                      <Input
                        value={recordForm.unit}
                        onChange={(event) =>
                          setRecordForm({ ...recordForm, unit: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      {t('sample.request.field.customerSku')}
                      <Input
                        value={recordForm.customer_sku}
                        onChange={(event) =>
                          setRecordForm({ ...recordForm, customer_sku: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.request.field.supplierSku')}
                      <Input
                        value={recordForm.supplier_sku}
                        onChange={(event) =>
                          setRecordForm({ ...recordForm, supplier_sku: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      {t('sample.request.field.purchaseContractId')}
                      <Input
                        value={recordForm.purchase_contract_id}
                        onChange={(event) =>
                          setRecordForm({ ...recordForm, purchase_contract_id: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sample.request.field.purchaseContractNo')}
                      <Input
                        value={recordForm.purchase_contract_no}
                        onChange={(event) =>
                          setRecordForm({ ...recordForm, purchase_contract_no: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    {t('sample.request.field.description')}
                    <Input.TextArea
                      rows={2}
                      value={recordForm.description}
                      onChange={(event) =>
                        setRecordForm({ ...recordForm, description: event.target.value })
                      }
                    />
                  </label>
                  <Button
                    disabled={selectedRequest.status !== 'completed'}
                    htmlType="submit"
                    loading={submitting}
                    type="primary"
                  >
                    {t('sample.request.action.convertToRecord')}
                  </Button>
                </form>
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <FlaskConical size={28} />
                <strong>{t('sample.request.panel.emptyTitle')}</strong>
                <span>{t('sample.request.panel.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
