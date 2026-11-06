import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, FileText } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  addPurchaseInquiryQuotation,
  createPurchaseInquiry,
  listPurchaseInquiries,
  listPurchaseInquiryReferences,
  listPurchaseInquirySupplierSamples,
  sendPurchaseInquiryTemplate,
  updatePurchaseInquiry,
  type PurchaseInquiry,
  type PurchaseInquiryCreatePayload,
  type PurchaseInquiryLine as _PurchaseInquiryLine,
  type PurchaseInquiryReference,
  type PurchaseInquiryTemplate as _PurchaseInquiryTemplate,
  type PurchaseInquiryTemplatePayload,
  type SupplierQuotation,
  type SupplierQuotationPayload,
  SupplierSampleEvidence,
} from '../../../api'
import { purchaseInquiryPath, moduleDetailPath } from '../../routes'
import { t } from '../../appI18n'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { purchaseInquiryStatusOptions } from '../../../shared/formOptions'
import {
  formatDate,
  formatMoney,
  nullableText as _nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '../appHelpers'

function sampleRecordStatusLabel(value: string): string {
  if (value === 'registered') return t('purchase.inquiry.detail.sampleStatusRegistered')
  if (value === 'submitted') return t('purchase.inquiry.detail.sampleStatusSubmitted')
  if (value === 'confirmed') return t('purchase.inquiry.detail.sampleStatusConfirmed')
  if (value === 'archived') return t('purchase.inquiry.detail.sampleStatusArchived')
  return value
}

type PurchaseInquiryFormState = {
  code: string
  inquiry_date: string
  buyer_user_id: string
  buyer_user_name: string
  remarks: string
  product_id: string
  product_code: string
  product_name: string
  specification: string
  model: string
  quantity: string
  unit: string
}

type PurchaseQuotationFormState = {
  supplier_id: string
  supplier_name: string
  quoted_at: string
  unit_price: string
  currency: string
  lead_time_days: string
  min_order_quantity: string
  sample_available: boolean
  remark: string
}

type PurchaseInquiryTemplateFormState = {
  template_name: string
  recipient_emails: string
}

function initialPurchaseInquiryForm(): PurchaseInquiryFormState {
  return {
    code: `PI-${Date.now().toString().slice(-6)}`,
    inquiry_date: todayInputValue(),
    buyer_user_id: 'u-001',
    buyer_user_name: '',
    remarks: '',
    product_id: '',
    product_code: '',
    product_name: '',
    specification: '',
    model: '',
    quantity: '1000',
    unit: 'pcs',
  }
}

function initialPurchaseQuotationForm(): PurchaseQuotationFormState {
  return {
    supplier_id: '',
    supplier_name: '',
    quoted_at: todayInputValue(),
    unit_price: '0.78',
    currency: 'USD',
    lead_time_days: '18',
    min_order_quantity: '800',
    sample_available: true,
    remark: '',
  }
}

function initialPurchaseInquiryTemplateForm(): PurchaseInquiryTemplateFormState {
  return {
    template_name: '',
    recipient_emails: 'supplier@example.com',
  }
}

function purchaseInquiryToForm(inquiry: PurchaseInquiry): PurchaseInquiryFormState {
  const line = inquiry.lines[0]
  return {
    code: inquiry.code,
    inquiry_date: inquiry.inquiry_date,
    buyer_user_id: inquiry.buyer_user_id ?? '',
    buyer_user_name: inquiry.buyer_user_name ?? '',
    remarks: inquiry.remarks ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    specification: line?.specification ?? '',
    model: line?.model ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
  }
}

function purchaseInquiryPayload(form: PurchaseInquiryFormState): PurchaseInquiryCreatePayload {
  return {
    code: form.code.trim(),
    inquiry_date: form.inquiry_date,
    buyer_user_id: emptyToNull(form.buyer_user_id),
    buyer_user_name: emptyToNull(form.buyer_user_name),
    remarks: emptyToNull(form.remarks),
    lines: [
      {
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        specification: emptyToNull(form.specification),
        model: emptyToNull(form.model),
        quantity: form.quantity,
        unit: form.unit.trim(),
      },
    ],
  }
}

function purchaseQuotationPayload(
  form: PurchaseQuotationFormState,
  inquiryLineId: string,
): SupplierQuotationPayload {
  const leadTime = Number(form.lead_time_days)
  return {
    inquiry_line_id: inquiryLineId,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    quoted_at: form.quoted_at,
    unit_price: form.unit_price,
    currency: form.currency.trim(),
    lead_time_days: Number.isNaN(leadTime) ? null : leadTime,
    min_order_quantity: emptyToNull(form.min_order_quantity),
    sample_available: form.sample_available,
    remark: emptyToNull(form.remark),
  }
}

function purchaseInquiryTemplatePayload(
  form: PurchaseInquiryTemplateFormState,
): PurchaseInquiryTemplatePayload {
  return {
    template_name: form.template_name.trim(),
    recipient_emails: form.recipient_emails
      .split(/[,\n;，；]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  }
}

function purchaseInquiryStatusLabel(value: string): string {
  const option = purchaseInquiryStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function lowestSupplierQuotation(quotations: SupplierQuotation[]): SupplierQuotation | null {
  if (quotations.length === 0) return null
  return quotations.reduce((lowest, item) =>
    Number(item.unit_price) < Number(lowest.unit_price) ? item : lowest,
  )
}

export function PurchaseInquiriesPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [inquiries, setInquiries] = useState<PurchaseInquiry[]>([])
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)
  const [editingInquiryId, setEditingInquiryId] = useState<string | null>(null)
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false)
  const [inquiryActionModal, setInquiryActionModal] = useState<'template' | 'quotation' | null>(
    null,
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [supplierSamples, setSupplierSamples] = useState<SupplierSampleEvidence[]>([])
  const [references, setReferences] = useState<PurchaseInquiryReference[]>([])
  const [templatePreview, setTemplatePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<PurchaseInquiryFormState>(() => initialPurchaseInquiryForm())
  const [quotationForm, setQuotationForm] = useState<PurchaseQuotationFormState>(() =>
    initialPurchaseQuotationForm(),
  )
  const [templateForm, setTemplateForm] = useState<PurchaseInquiryTemplateFormState>(() =>
    initialPurchaseInquiryTemplateForm(),
  )

  const selectedInquiry = useMemo(() => {
    if (detailId) return inquiries.find((item) => item.id === detailId) ?? null
    return inquiries.find((item) => item.id === selectedInquiryId) ?? inquiries[0] ?? null
  }, [detailId, inquiries, selectedInquiryId])

  useEffect(() => {
    void loadInquiries()
  }, [])

  useEffect(() => {
    if (!detailId) {
      setSupplierSamples([])
      setReferences([])
      return
    }
    syncPurchaseInquiryActionForms(selectedInquiry)
    void loadPurchaseInquiryAuxiliary(selectedInquiry)
  }, [detailId, selectedInquiry?.id, selectedInquiry?.status, selectedInquiry?.quotations.length])

  useEffect(() => {
    if (detailId && inquiries.length > 0 && !inquiries.some((item) => item.id === detailId)) {
      onNavigate(purchaseInquiryPath)
    }
  }, [detailId, inquiries, onNavigate])

  async function loadInquiries(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listPurchaseInquiries({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        product_id: productFilter.trim() || undefined,
        supplier_id: supplierFilter.trim() || undefined,
      })
      setInquiries(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedInquiryId) ? selectedInquiryId : null) ??
        result.items[0]?.id ??
        null
      setSelectedInquiryId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('purchase.inquiry.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadPurchaseInquiryAuxiliary(inquiry: PurchaseInquiry | null) {
    const line = inquiry?.lines[0]
    if (!inquiry || !line) {
      setSupplierSamples([])
      setReferences([])
      return
    }
    const supplierId = inquiry.quotations[0]?.supplier_id ?? undefined
    try {
      const [referenceResult, sampleResult] = await Promise.all([
        listPurchaseInquiryReferences({
          product_id: line.product_id ?? undefined,
        }),
        listPurchaseInquirySupplierSamples({
          product_id: line.product_id ?? undefined,
          supplier_id: supplierId,
        }),
      ])
      setReferences(referenceResult.items)
      setSupplierSamples(sampleResult.items)
    } catch (caught) {
      showError(caught, t('purchase.inquiry.detail.referenceLoadFailed'))
    }
  }

  function syncPurchaseInquiryActionForms(inquiry: PurchaseInquiry | null) {
    const firstQuote = inquiry?.quotations[0]
    setTemplateForm({
      template_name: inquiry?.template_name ?? '',
      recipient_emails: firstQuote?.supplier_id
        ? `${firstQuote.supplier_id}@example.com`
        : 'supplier@example.com',
    })
    setQuotationForm((current) => ({
      ...current,
      currency: firstQuote?.currency ?? current.currency,
      quoted_at: inquiry?.inquiry_date ?? current.quoted_at,
    }))
  }

  function upsertInquiry(inquiry: PurchaseInquiry) {
    setInquiries((current) => {
      const exists = current.some((item) => item.id === inquiry.id)
      return exists
        ? current.map((item) => (item.id === inquiry.id ? inquiry : item))
        : [inquiry, ...current]
    })
    setSelectedInquiryId(inquiry.id)
  }

  function openInquiryDetail(inquiry: PurchaseInquiry) {
    setSelectedInquiryId(inquiry.id)
    onNavigate(moduleDetailPath(purchaseInquiryPath, inquiry.id))
  }

  function stopAndOpenInquiryDetail(event: MouseEvent<HTMLElement>, inquiry: PurchaseInquiry) {
    event.stopPropagation()
    openInquiryDetail(inquiry)
  }

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const payload = purchaseInquiryPayload(form)
      const saved = editingInquiryId
        ? await updatePurchaseInquiry(editingInquiryId, payload)
        : await createPurchaseInquiry(payload)
      setMessage(
        editingInquiryId
          ? t('purchase.inquiry.message.saved', { code: saved.code })
          : t('purchase.inquiry.message.created', { code: saved.code }),
      )
      setEditingInquiryId(null)
      setForm(initialPurchaseInquiryForm())
      setInquiryModalOpen(false)
      upsertInquiry(saved)
      await loadInquiries(saved.id)
    } catch (caught) {
      showError(caught, t('purchase.inquiry.message.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function sendTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedInquiry) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const template = await sendPurchaseInquiryTemplate(
        selectedInquiry.id,
        purchaseInquiryTemplatePayload(templateForm),
      )
      setTemplatePreview(template.content)
      setMessage(t('purchase.inquiry.message.templateGenerated', { filename: template.filename }))
      setInquiryActionModal(null)
      await loadInquiries(selectedInquiry.id)
    } catch (caught) {
      showError(caught, t('purchase.inquiry.message.templateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function addSupplierQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedInquiry?.lines[0]) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updated = await addPurchaseInquiryQuotation(
        selectedInquiry.id,
        purchaseQuotationPayload(quotationForm, selectedInquiry.lines[0].id),
      )
      setMessage(
        t('purchase.inquiry.message.quotationAdded', { supplier: quotationForm.supplier_name }),
      )
      setInquiryActionModal(null)
      upsertInquiry(updated)
      await Promise.all([loadInquiries(updated.id), loadPurchaseInquiryAuxiliary(updated)])
    } catch (caught) {
      showError(caught, t('purchase.inquiry.message.quotationAddFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openCreateInquiry() {
    setEditingInquiryId(null)
    setForm(initialPurchaseInquiryForm())
    setMessage('')
    setError('')
    setInquiryModalOpen(true)
  }

  function loadSelectedInquiryForEdit() {
    if (!selectedInquiry) return
    setEditingInquiryId(selectedInquiry.id)
    setForm(purchaseInquiryToForm(selectedInquiry))
    setMessage(t('purchase.inquiry.message.editing', { code: selectedInquiry.code }))
    setInquiryModalOpen(true)
  }

  function cancelInquiryEdit() {
    setEditingInquiryId(null)
    setForm(initialPurchaseInquiryForm())
    setInquiryModalOpen(false)
  }

  const quotedCount = inquiries.filter((item) => item.status === 'quoted').length
  const sentCount = inquiries.filter((item) => item.status === 'sent').length
  const quotationCount = inquiries.reduce((sum, item) => sum + item.quotations.length, 0)

  return (
    <section className="purchase-inquiry-page">
      <div className="summary-strip" aria-label={t('purchase.inquiry.metric.overviewAria')}>
        <Metric label={t('purchase.inquiry.metric.inquiryCount')} value={inquiries.length} />
        <Metric label={t('purchase.inquiry.metric.sentCount')} value={sentCount} />
        <Metric label={t('purchase.inquiry.metric.quotedCount')} value={quotedCount} />
        <Metric label={t('purchase.inquiry.metric.quotationCount')} value={quotationCount} />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid purchase-inquiry-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Search size={18} />} title={t('purchase.inquiry.list.title')} />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadInquiries()
                }}
              >
                <label>
                  {t('purchase.inquiry.list.searchLabel')}
                  <Input
                    value={search}
                    placeholder={t('purchase.inquiry.list.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('purchase.inquiry.list.statusFilter')}
                  <FormSelect
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('purchase.inquiry.list.allStatuses')}</option>
                    {purchaseInquiryStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('purchase.inquiry.list.productFilter')}
                  <Input
                    value={productFilter}
                    placeholder={t('purchase.inquiry.list.productFilterPlaceholder')}
                    onChange={(event) => setProductFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('purchase.inquiry.list.supplierFilter')}
                  <Input
                    value={supplierFilter}
                    placeholder={t('purchase.inquiry.list.supplierFilterPlaceholder')}
                    onChange={(event) => setSupplierFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('purchase.inquiry.list.query')}
                </Button>
                <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateInquiry}>
                  {t('purchase.inquiry.list.create')}
                </Button>
              </form>
            </div>

            <Table<PurchaseInquiry>
              columns={[
                {
                  title: t('purchase.inquiry.field.code'),
                  dataIndex: 'code',
                  render: (value: string, record: PurchaseInquiry) => (
                    <button
                      className="row-button"
                      type="button"
                      onClick={(event) => stopAndOpenInquiryDetail(event, record)}
                    >
                      {value}
                    </button>
                  ),
                },
                {
                  title: t('purchase.inquiry.field.status'),
                  dataIndex: 'status',
                  render: purchaseInquiryStatusLabel,
                },
                {
                  title: t('purchase.inquiry.field.product'),
                  dataIndex: 'lines',
                  render: (_, inquiry) =>
                    `${inquiry.lines[0]?.product_code ?? t('purchase.inquiry.detail.notFilled')} / ${inquiry.lines[0]?.product_name ?? t('purchase.inquiry.detail.notFilled')}`,
                },
                {
                  title: t('purchase.inquiry.field.inquiryDay'),
                  dataIndex: 'inquiry_date',
                  render: formatDate,
                },
                {
                  title: t('purchase.inquiry.field.quoteCount'),
                  dataIndex: 'quotations',
                  render: (_, inquiry) => inquiry.quotations.length,
                },
                {
                  title: t('purchase.inquiry.field.lowestPrice'),
                  dataIndex: 'quotations',
                  render: (_, inquiry) => {
                    const lowest = lowestSupplierQuotation(inquiry.quotations)
                    return lowest
                      ? formatMoney(lowest.unit_price, lowest.currency)
                      : t('purchase.inquiry.detail.notQuoted')
                  },
                },
                {
                  title: t('purchase.inquiry.field.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: PurchaseInquiry) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenInquiryDetail(event, record)}
                    >
                      {t('purchase.inquiry.action.viewDetail')}
                    </Button>
                  ),
                },
              ]}
              dataSource={inquiries}
              loading={loading}
              pagination={false}
              rowClassName={(record) => (record.id === selectedInquiry?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedInquiryId(record.id),
              })}
            />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={inquiryModalOpen}
          title={
            editingInquiryId
              ? t('purchase.inquiry.form.editTitle')
              : t('purchase.inquiry.form.createTitle')
          }
          width={980}
          onCancel={cancelInquiryEdit}
        >
          <div className="workflow-modal-content entity-modal-form">
            <form className="record-form" onSubmit={submitInquiry}>
              <div className="form-pair two">
                <label>
                  {t('purchase.inquiry.field.code')}
                  <Input
                    value={form.code}
                    onChange={(event) => setForm({ ...form, code: event.target.value })}
                  />
                </label>
                <label>
                  {t('purchase.inquiry.field.inquiryDate')}
                  <Input
                    type="date"
                    value={form.inquiry_date}
                    onChange={(event) => setForm({ ...form, inquiry_date: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('purchase.inquiry.field.buyerId')}
                  <Input
                    value={form.buyer_user_id}
                    onChange={(event) => setForm({ ...form, buyer_user_id: event.target.value })}
                  />
                </label>
                <label>
                  {t('purchase.inquiry.field.buyer')}
                  <Input
                    value={form.buyer_user_name}
                    onChange={(event) => setForm({ ...form, buyer_user_name: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-divider">{t('purchase.inquiry.form.productSection')}</div>
              <div className="form-pair two">
                <label>
                  {t('purchase.inquiry.field.productId')}
                  <Input
                    value={form.product_id}
                    onChange={(event) => setForm({ ...form, product_id: event.target.value })}
                  />
                </label>
                <label>
                  {t('purchase.inquiry.field.productCode')}
                  <Input
                    value={form.product_code}
                    onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                  />
                </label>
              </div>
              <label>
                {t('purchase.inquiry.field.productName')}
                <Input
                  value={form.product_name}
                  onChange={(event) => setForm({ ...form, product_name: event.target.value })}
                />
              </label>
              <div className="form-pair two">
                <label>
                  {t('purchase.inquiry.field.specification')}
                  <Input
                    value={form.specification}
                    onChange={(event) => setForm({ ...form, specification: event.target.value })}
                  />
                </label>
                <label>
                  {t('purchase.inquiry.field.model')}
                  <Input
                    value={form.model}
                    onChange={(event) => setForm({ ...form, model: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('purchase.inquiry.field.quantity')}
                  <Input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={form.quantity}
                    onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                  />
                </label>
                <label>
                  {t('purchase.inquiry.field.unit')}
                  <Input
                    value={form.unit}
                    onChange={(event) => setForm({ ...form, unit: event.target.value })}
                  />
                </label>
              </div>
              <label>
                {t('purchase.inquiry.field.remarks')}
                <Input.TextArea
                  rows={2}
                  value={form.remarks}
                  onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                />
              </label>
              <Button htmlType="submit" loading={submitting} type="primary">
                {editingInquiryId
                  ? t('purchase.inquiry.form.save')
                  : t('purchase.inquiry.form.create')}
              </Button>
              {editingInquiryId ? (
                <Button onClick={cancelInquiryEdit}>{t('purchase.inquiry.form.cancelEdit')}</Button>
              ) : null}
            </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('purchase.inquiry.detail.title')}
              />
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => onNavigate(purchaseInquiryPath)}
              >
                {t('purchase.inquiry.action.backToList')}
              </Button>
            </div>
            {selectedInquiry ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('purchase.inquiry.field.statusInquiryDate')}</dt>
                    <dd>
                      {purchaseInquiryStatusLabel(selectedInquiry.status)} /{' '}
                      {formatDate(selectedInquiry.inquiry_date)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('purchase.inquiry.field.buyer')}</dt>
                    <dd>
                      {selectedInquiry.buyer_user_name ?? t('purchase.inquiry.detail.unassigned')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('purchase.inquiry.field.template')}</dt>
                    <dd>{selectedInquiry.template_name ?? t('purchase.inquiry.detail.notSent')}</dd>
                  </div>
                  <div>
                    <dt>{t('purchase.inquiry.field.templateSentAt')}</dt>
                    <dd>{formatDate(selectedInquiry.template_sent_at)}</dd>
                  </div>
                </dl>

                <div className="transaction-box">
                  <strong>{t('purchase.inquiry.field.remarks')}</strong>
                  <p>{selectedInquiry.remarks ?? t('purchase.inquiry.detail.remarksEmpty')}</p>
                </div>

                <div className="delivery-action-row">
                  <Button
                    disabled={selectedInquiry.status !== 'draft'}
                    onClick={loadSelectedInquiryForEdit}
                  >
                    {t('purchase.inquiry.action.editInquiry')}
                  </Button>
                  <Button htmlType="button" onClick={() => setInquiryActionModal('template')}>
                    {t('purchase.inquiry.action.sendTemplate')}
                  </Button>
                  <Button
                    disabled={!selectedInquiry.lines[0]}
                    htmlType="button"
                    type="primary"
                    onClick={() => setInquiryActionModal('quotation')}
                  >
                    {t('purchase.inquiry.action.addQuotation')}
                  </Button>
                </div>

                <Modal
                  centered
                  footer={null}
                  open={inquiryActionModal === 'template'}
                  title={t('purchase.inquiry.action.sendTemplate')}
                  width={720}
                  onCancel={() => setInquiryActionModal(null)}
                >
                  <div className="workflow-modal-content entity-modal-form">
                    <form className="record-form accessory-form" onSubmit={sendTemplate}>
                      <div className="form-divider">
                        {t('purchase.inquiry.form.templateSection')}
                      </div>
                      <label>
                        {t('purchase.inquiry.field.templateName')}
                        <Input
                          value={templateForm.template_name}
                          onChange={(event) =>
                            setTemplateForm({ ...templateForm, template_name: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        {t('purchase.inquiry.field.recipientEmails')}
                        <Input
                          value={templateForm.recipient_emails}
                          onChange={(event) =>
                            setTemplateForm({
                              ...templateForm,
                              recipient_emails: event.target.value,
                            })
                          }
                        />
                      </label>
                      <Button htmlType="submit" loading={submitting}>
                        {t('purchase.inquiry.action.sendTemplate')}
                      </Button>
                    </form>
                  </div>
                </Modal>

                <Modal
                  centered
                  footer={null}
                  open={inquiryActionModal === 'quotation'}
                  title={t('purchase.inquiry.action.addQuotation')}
                  width={880}
                  onCancel={() => setInquiryActionModal(null)}
                >
                  <div className="workflow-modal-content entity-modal-form">
                    <form className="record-form accessory-form" onSubmit={addSupplierQuotation}>
                      <div className="form-divider">
                        {t('purchase.inquiry.form.quotationSection')}
                      </div>
                      <div className="form-pair two">
                        <label>
                          {t('purchase.inquiry.field.supplierId')}
                          <Input
                            value={quotationForm.supplier_id}
                            onChange={(event) =>
                              setQuotationForm({
                                ...quotationForm,
                                supplier_id: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          {t('purchase.inquiry.field.supplierName')}
                          <Input
                            value={quotationForm.supplier_name}
                            onChange={(event) =>
                              setQuotationForm({
                                ...quotationForm,
                                supplier_name: event.target.value,
                              })
                            }
                          />
                        </label>
                      </div>
                      <div className="form-pair three">
                        <label>
                          {t('purchase.inquiry.field.quotedAt')}
                          <Input
                            type="date"
                            value={quotationForm.quoted_at}
                            onChange={(event) =>
                              setQuotationForm({ ...quotationForm, quoted_at: event.target.value })
                            }
                          />
                        </label>
                        <label>
                          {t('purchase.inquiry.field.unitPrice')}
                          <Input
                            type="number"
                            min="0.0001"
                            step="0.0001"
                            value={quotationForm.unit_price}
                            onChange={(event) =>
                              setQuotationForm({ ...quotationForm, unit_price: event.target.value })
                            }
                          />
                        </label>
                        <label>
                          {t('purchase.inquiry.field.currency')}
                          <Input
                            value={quotationForm.currency}
                            onChange={(event) =>
                              setQuotationForm({ ...quotationForm, currency: event.target.value })
                            }
                          />
                        </label>
                      </div>
                      <div className="form-pair two">
                        <label>
                          {t('purchase.inquiry.field.leadTimeDays')}
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={quotationForm.lead_time_days}
                            onChange={(event) =>
                              setQuotationForm({
                                ...quotationForm,
                                lead_time_days: event.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          {t('purchase.inquiry.field.minOrderQuantity')}
                          <Input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={quotationForm.min_order_quantity}
                            onChange={(event) =>
                              setQuotationForm({
                                ...quotationForm,
                                min_order_quantity: event.target.value,
                              })
                            }
                          />
                        </label>
                      </div>
                      <label className="checkbox-label">
                        <input
                          aria-label={t('purchase.inquiry.field.sampleAvailable')}
                          checked={quotationForm.sample_available}
                          type="checkbox"
                          onChange={(event) =>
                            setQuotationForm({
                              ...quotationForm,
                              sample_available: event.target.checked,
                            })
                          }
                        />
                        {t('purchase.inquiry.field.sampleAvailable')}
                      </label>
                      <label>
                        {t('purchase.inquiry.field.quotationRemark')}
                        <Input
                          value={quotationForm.remark}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, remark: event.target.value })
                          }
                        />
                      </label>
                      <Button htmlType="submit" loading={submitting} type="primary">
                        {t('purchase.inquiry.action.addQuotation')}
                      </Button>
                    </form>
                  </div>
                </Modal>

                {templatePreview ? (
                  <div className="transaction-box export-preview">
                    <strong>{t('purchase.inquiry.detail.templatePreviewTitle')}</strong>
                    <pre>{templatePreview}</pre>
                  </div>
                ) : null}

                <div className="accessory-heading">
                  <strong>{t('purchase.inquiry.detail.linesTitle')}</strong>
                  <span>
                    {t('purchase.inquiry.detail.lineCount', {
                      count: selectedInquiry.lines.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.inquiry.field.product')}</th>
                      <th>{t('purchase.inquiry.field.specificationModel')}</th>
                      <th>{t('purchase.inquiry.field.lineQuantity')}</th>
                      <th>{t('purchase.inquiry.field.unit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInquiry.lines.map((line) => (
                      <tr key={line.id}>
                        <td>
                          {line.product_code ?? t('purchase.inquiry.detail.notFilled')} /{' '}
                          {line.product_name}
                        </td>
                        <td>
                          {line.specification ?? t('purchase.inquiry.detail.notFilled')} /{' '}
                          {line.model ?? t('purchase.inquiry.detail.notFilled')}
                        </td>
                        <td>{line.quantity}</td>
                        <td>{line.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('purchase.inquiry.detail.quotationCompareTitle')}</strong>
                  <span>
                    {t('purchase.inquiry.detail.quotationCount', {
                      count: selectedInquiry.quotations.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.inquiry.field.supplier')}</th>
                      <th>{t('purchase.inquiry.field.product')}</th>
                      <th>{t('purchase.inquiry.field.unitPrice')}</th>
                      <th>{t('purchase.inquiry.field.leadTime')}</th>
                      <th>{t('purchase.inquiry.field.minOrderQuantity')}</th>
                      <th>{t('purchase.inquiry.field.sample')}</th>
                      <th>{t('purchase.inquiry.field.remark')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInquiry.quotations.map((quote) => (
                      <tr key={quote.id}>
                        <td>{quote.supplier_name}</td>
                        <td>
                          {quote.product_code ?? t('purchase.inquiry.detail.notFilled')} /{' '}
                          {quote.product_name}
                        </td>
                        <td>{formatMoney(quote.unit_price, quote.currency)}</td>
                        <td>
                          {quote.lead_time_days != null
                            ? t('purchase.inquiry.detail.days', {
                                count: quote.lead_time_days,
                                days: quote.lead_time_days,
                              })
                            : t('purchase.inquiry.detail.notFilled')}
                        </td>
                        <td>
                          {quote.min_order_quantity ?? t('purchase.inquiry.detail.notFilled')}
                        </td>
                        <td>
                          {quote.has_sample
                            ? t('purchase.inquiry.detail.sampleAvailableYes')
                            : t('purchase.inquiry.detail.sampleNotProvided')}
                        </td>
                        <td>{quote.remark ?? t('purchase.inquiry.detail.notFilled')}</td>
                      </tr>
                    ))}
                    {selectedInquiry.quotations.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={7}>
                          {t('purchase.inquiry.detail.noQuotations')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('purchase.inquiry.detail.samplesTitle')}</strong>
                  <span>
                    {t('purchase.inquiry.detail.sampleCount', {
                      count: supplierSamples.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.inquiry.field.sampleCode')}</th>
                      <th>{t('purchase.inquiry.field.supplier')}</th>
                      <th>{t('purchase.inquiry.field.product')}</th>
                      <th>{t('purchase.inquiry.field.receivedAt')}</th>
                      <th>{t('purchase.inquiry.field.lineQuantity')}</th>
                      <th>{t('purchase.inquiry.field.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierSamples.map((sample) => (
                      <tr key={sample.sample_record_id}>
                        <td>{sample.sample_code}</td>
                        <td>{sample.supplier_name ?? t('purchase.inquiry.detail.notFilled')}</td>
                        <td>
                          {sample.product_code ?? t('purchase.inquiry.detail.notFilled')} /{' '}
                          {sample.product_name}
                        </td>
                        <td>{formatDate(sample.received_at)}</td>
                        <td>
                          {sample.quantity} {sample.unit}
                        </td>
                        <td>{sampleRecordStatusLabel(sample.status)}</td>
                      </tr>
                    ))}
                    {supplierSamples.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={6}>
                          {t('purchase.inquiry.detail.noSamples')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('purchase.inquiry.detail.referencesTitle')}</strong>
                  <span>
                    {t('purchase.inquiry.detail.referenceCount', {
                      count: references.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.inquiry.field.inquiryNo')}</th>
                      <th>{t('purchase.inquiry.field.product')}</th>
                      <th>{t('purchase.inquiry.field.supplier')}</th>
                      <th>{t('purchase.inquiry.field.referencePrice')}</th>
                      <th>{t('purchase.inquiry.field.quotedDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {references.map((reference) => (
                      <tr key={`${reference.source_inquiry_no}-${reference.supplier_name}`}>
                        <td>{reference.source_inquiry_no}</td>
                        <td>
                          {reference.product_code ?? t('purchase.inquiry.detail.notFilled')} /{' '}
                          {reference.product_name}
                        </td>
                        <td>{reference.supplier_name}</td>
                        <td>{formatMoney(reference.reference_price, reference.currency)}</td>
                        <td>{formatDate(reference.quote_date)}</td>
                      </tr>
                    ))}
                    {references.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={5}>
                          {t('purchase.inquiry.detail.noReferences')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <FileText size={28} />
                <strong>{t('purchase.inquiry.detail.emptyTitle')}</strong>
                <span>{t('purchase.inquiry.detail.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
