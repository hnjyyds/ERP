import { Alert, Button, Input, Modal, Table, Tag as _Tag } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, Receipt } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  generatePurchaseInvoiceNoticesFromDeclaration,
  listPurchaseInvoiceNoticeReminders,
  listPurchaseInvoiceNotices,
  receivePurchaseInvoiceNoticeTaxInvoice,
  sendPurchaseInvoiceNotice,
  type PurchaseInvoiceNotice,
  type PurchaseInvoiceNoticeGeneratePayload,
  type PurchaseInvoiceNoticeLinePayload,
  type PurchaseInvoiceNoticeReceivePayload,
  type PurchaseInvoiceNoticeReminder,
  type PurchaseInvoiceNoticeSendPayload,
} from '../../../api'
import { purchaseInvoiceNoticePath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { t } from '../../appI18n'
import { showError } from '../../../shared/errors'
import { useFormModal } from '../../../shared/useFormModal'
import { purchaseInvoiceNoticeStatusOptions } from '../../../shared/formOptions'
import {
  formatDate,
  formatMoney,
  nullableText as _nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '../appHelpers'

type PurchaseInvoiceNoticeFormState = {
  customs_declaration_id: string
  customs_declaration_no: string
  declaration_date: string
  notice_date: string
  currency: string
  remarks: string
  supplier_id_a: string
  supplier_name_a: string
  purchase_contract_id_a: string
  purchase_contract_no_a: string
  product_id_a: string
  product_code_a: string
  product_name_a: string
  customs_name_a: string
  invoice_name_a: string
  quantity_a: string
  unit_a: string
  amount_a: string
  remark_a: string
  supplier_id_b: string
  supplier_name_b: string
  purchase_contract_id_b: string
  purchase_contract_no_b: string
  product_id_b: string
  product_code_b: string
  product_name_b: string
  customs_name_b: string
  invoice_name_b: string
  quantity_b: string
  unit_b: string
  amount_b: string
  remark_b: string
}

type PurchaseInvoiceNoticeSendFormState = {
  sender_name: string
  sent_at: string
}

type PurchaseInvoiceNoticeReceiveFormState = {
  tax_invoice_no: string
  received_at: string
}

function initialPurchaseInvoiceNoticeForm(): PurchaseInvoiceNoticeFormState {
  return {
    customs_declaration_id: crypto.randomUUID(),
    customs_declaration_no: '',
    declaration_date: todayInputValue(),
    notice_date: todayInputValue(),
    currency: 'CNY',
    remarks: '',
    supplier_id_a: 'supplier-pack-a',
    supplier_name_a: '',
    purchase_contract_id_a: 'pc-pack-a',
    purchase_contract_no_a: 'PC-2026-PACK-A',
    product_id_a: 'product-bag',
    product_code_a: 'BAG-40',
    product_name_a: 'Eco Shopping Bag',
    customs_name_a: '',
    invoice_name_a: '',
    quantity_a: '1000',
    unit_a: 'pcs',
    amount_a: '5200.00',
    remark_a: '',
    supplier_id_b: 'supplier-label-a',
    supplier_name_b: '',
    purchase_contract_id_b: 'pc-label-a',
    purchase_contract_no_b: 'PC-2026-LABEL-A',
    product_id_b: 'product-label',
    product_code_b: 'LABEL-01',
    product_name_b: 'Hang Tag',
    customs_name_b: '',
    invoice_name_b: '',
    quantity_b: '450',
    unit_b: 'pcs',
    amount_b: '360.00',
    remark_b: '',
  }
}

function initialPurchaseInvoiceNoticeSendForm(): PurchaseInvoiceNoticeSendFormState {
  return {
    sender_name: '',
    sent_at: todayInputValue(),
  }
}

function initialPurchaseInvoiceNoticeReceiveForm(): PurchaseInvoiceNoticeReceiveFormState {
  return {
    tax_invoice_no: 'VAT-2026-001',
    received_at: todayInputValue(),
  }
}

function purchaseInvoiceNoticeGeneratePayload(
  form: PurchaseInvoiceNoticeFormState,
): PurchaseInvoiceNoticeGeneratePayload {
  return {
    customs_declaration_id: emptyToNull(form.customs_declaration_id),
    customs_declaration_no: form.customs_declaration_no.trim(),
    declaration_date: form.declaration_date,
    notice_date: form.notice_date,
    currency: form.currency.trim(),
    remarks: emptyToNull(form.remarks),
    lines: purchaseInvoiceNoticeLinePayloads(form),
  }
}

function purchaseInvoiceNoticeLinePayloads(
  form: PurchaseInvoiceNoticeFormState,
): PurchaseInvoiceNoticeLinePayload[] {
  const candidates: PurchaseInvoiceNoticeLinePayload[] = [
    {
      supplier_id: emptyToNull(form.supplier_id_a),
      supplier_name: form.supplier_name_a.trim(),
      purchase_contract_id: emptyToNull(form.purchase_contract_id_a),
      purchase_contract_no: emptyToNull(form.purchase_contract_no_a),
      product_id: emptyToNull(form.product_id_a),
      product_code: emptyToNull(form.product_code_a),
      product_name: form.product_name_a.trim(),
      customs_name: form.customs_name_a.trim(),
      invoice_name: form.invoice_name_a.trim(),
      quantity: form.quantity_a,
      unit: form.unit_a.trim(),
      amount: form.amount_a,
      remark: emptyToNull(form.remark_a),
    },
    {
      supplier_id: emptyToNull(form.supplier_id_b),
      supplier_name: form.supplier_name_b.trim(),
      purchase_contract_id: emptyToNull(form.purchase_contract_id_b),
      purchase_contract_no: emptyToNull(form.purchase_contract_no_b),
      product_id: emptyToNull(form.product_id_b),
      product_code: emptyToNull(form.product_code_b),
      product_name: form.product_name_b.trim(),
      customs_name: form.customs_name_b.trim(),
      invoice_name: form.invoice_name_b.trim(),
      quantity: form.quantity_b,
      unit: form.unit_b.trim(),
      amount: form.amount_b,
      remark: emptyToNull(form.remark_b),
    },
  ]

  return candidates.filter(
    (line) =>
      line.supplier_name &&
      line.product_name &&
      line.customs_name &&
      line.invoice_name &&
      line.quantity &&
      line.unit,
  )
}

function purchaseInvoiceNoticeSendPayload(
  form: PurchaseInvoiceNoticeSendFormState,
): PurchaseInvoiceNoticeSendPayload {
  return {
    sender_name: form.sender_name.trim(),
    sent_at: form.sent_at,
  }
}

function purchaseInvoiceNoticeReceivePayload(
  form: PurchaseInvoiceNoticeReceiveFormState,
): PurchaseInvoiceNoticeReceivePayload {
  return {
    tax_invoice_no: form.tax_invoice_no.trim(),
    received_at: form.received_at,
  }
}

function purchaseInvoiceNoticeStatusLabel(value: string): string {
  const option = purchaseInvoiceNoticeStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function purchaseInvoiceReminderStatusLabel(value: string): string {
  if (value === 'open') return t('purchase.invoiceNotice.detail.reminderStatusOpen')
  if (value === 'done') return t('purchase.invoiceNotice.detail.reminderStatusDone')
  return value
}

export function PurchaseInvoiceNoticesPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [notices, setNotices] = useState<PurchaseInvoiceNotice[]>([])
  const [reminders, setReminders] = useState<PurchaseInvoiceNoticeReminder[]>([])
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [customsFilter, setCustomsFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [customsDeclarationNoError, setCustomsDeclarationNoError] = useState('')
  const [invoiceActionModal, setInvoiceActionModal] = useState<'send' | 'receive' | null>(null)
  const {
    open: invoiceModalOpen,
    form,
    setForm,
    submitting: invoiceSubmitting,
    openWith: openInvoiceModal,
    close: closeInvoiceModal,
    runSubmit: runInvoiceSubmit,
  } = useFormModal(initialPurchaseInvoiceNoticeForm)
  const [sendForm, setSendForm] = useState<PurchaseInvoiceNoticeSendFormState>(() =>
    initialPurchaseInvoiceNoticeSendForm(),
  )
  const [receiveForm, setReceiveForm] = useState<PurchaseInvoiceNoticeReceiveFormState>(() =>
    initialPurchaseInvoiceNoticeReceiveForm(),
  )

  const selectedNotice = useMemo(() => {
    if (detailId) return notices.find((item) => item.id === detailId) ?? null
    return notices.find((item) => item.id === selectedNoticeId) ?? notices[0] ?? null
  }, [detailId, notices, selectedNoticeId])

  useEffect(() => {
    void loadNotices()
  }, [])

  useEffect(() => {
    setSendForm((current) => ({
      ...current,
      sent_at: selectedNotice?.sent_at ?? selectedNotice?.notice_date ?? current.sent_at,
    }))
    setReceiveForm((current) => ({
      ...current,
      received_at:
        selectedNotice?.tax_invoice_received_at ?? selectedNotice?.sent_at ?? current.received_at,
    }))
  }, [selectedNotice?.id, selectedNotice?.status])

  useEffect(() => {
    if (detailId && notices.length > 0 && !notices.some((item) => item.id === detailId)) {
      onNavigate(purchaseInvoiceNoticePath)
    }
  }, [detailId, notices, onNavigate])

  async function loadNotices(preferredId?: string, overrideCustomsFilter?: string) {
    setLoading(true)
    try {
      const [noticeResult, reminderResult] = await Promise.all([
        listPurchaseInvoiceNotices({
          q: search.trim() || undefined,
          status: statusFilter || undefined,
          supplier_id: supplierFilter.trim() || undefined,
          customs_declaration_id: (overrideCustomsFilter ?? customsFilter).trim() || undefined,
        }),
        listPurchaseInvoiceNoticeReminders(),
      ])
      setNotices(noticeResult.items)
      setReminders(reminderResult.items)
      const nextSelectedId =
        preferredId ??
        (noticeResult.items.some((item) => item.id === selectedNoticeId)
          ? selectedNoticeId
          : null) ??
        noticeResult.items[0]?.id ??
        null
      setSelectedNoticeId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('purchase.invoiceNotice.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function upsertNotice(notice: PurchaseInvoiceNotice) {
    setNotices((current) => {
      const exists = current.some((item) => item.id === notice.id)
      return exists
        ? current.map((item) => (item.id === notice.id ? notice : item))
        : [notice, ...current]
    })
    setSelectedNoticeId(notice.id)
  }

  function openInvoiceNoticeDetail(notice: PurchaseInvoiceNotice) {
    setSelectedNoticeId(notice.id)
    onNavigate(moduleDetailPath(purchaseInvoiceNoticePath, notice.id))
  }

  function stopAndOpenInvoiceNoticeDetail(
    event: MouseEvent<HTMLElement>,
    notice: PurchaseInvoiceNotice,
  ) {
    event.stopPropagation()
    openInvoiceNoticeDetail(notice)
  }

  async function generateFromCustoms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.customs_declaration_no.trim()) {
      setCustomsDeclarationNoError(
        t('purchase.invoiceNotice.validation.customsDeclarationNoRequired'),
      )
      return
    }
    setCustomsDeclarationNoError('')
    setMessage('')
    await runInvoiceSubmit(
      async () => {
        const customsId = form.customs_declaration_id.trim()
        const result = await generatePurchaseInvoiceNoticesFromDeclaration(
          purchaseInvoiceNoticeGeneratePayload(form),
        )
        const firstNotice = result.items[0] ?? null
        setSearch('')
        setStatusFilter('')
        setSupplierFilter('')
        setCustomsFilter(customsId)
        setMessage(t('purchase.invoiceNotice.message.generated', { count: result.total }))
        closeInvoiceModal()
        if (firstNotice) upsertNotice(firstNotice)
        await loadNotices(firstNotice?.id, customsId)
      },
      (caught) => showError(caught, t('purchase.invoiceNotice.message.generateFailed')),
    )
  }

  async function sendSelectedNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedNotice) return
    setSubmitting(true)
    setMessage('')
    try {
      const sent = await sendPurchaseInvoiceNotice(
        selectedNotice.id,
        purchaseInvoiceNoticeSendPayload(sendForm),
      )
      setMessage(t('purchase.invoiceNotice.message.sent', { code: sent.code }))
      setInvoiceActionModal(null)
      upsertNotice(sent)
      await loadNotices(sent.id)
    } catch (caught) {
      showError(caught, t('purchase.invoiceNotice.message.sendFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function receiveSelectedNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedNotice) return
    setSubmitting(true)
    setMessage('')
    try {
      const received = await receivePurchaseInvoiceNoticeTaxInvoice(
        selectedNotice.id,
        purchaseInvoiceNoticeReceivePayload(receiveForm),
      )
      setMessage(
        t('purchase.invoiceNotice.message.received', { no: received.tax_invoice_no ?? '' }),
      )
      setInvoiceActionModal(null)
      upsertNotice(received)
      await loadNotices(received.id)
    } catch (caught) {
      showError(caught, t('purchase.invoiceNotice.message.receiveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const sentCount = notices.filter((item) => item.status === 'sent').length
  const receivedCount = notices.filter((item) => item.status === 'received').length
  const openReminders = reminders.filter((item) => item.status === 'open').length
  const totalAmount = notices.reduce((sum, item) => sum + Number(item.total_amount), 0)
  const currency = notices[0]?.currency ?? 'CNY'

  return (
    <section className="purchase-invoice-page">
      <div className="summary-strip" aria-label={t('purchase.invoiceNotice.metric.overviewAria')}>
        <Metric label={t('purchase.invoiceNotice.metric.noticeCount')} value={notices.length} />
        <Metric label={t('purchase.invoiceNotice.metric.sentCount')} value={sentCount} />
        <Metric label={t('purchase.invoiceNotice.metric.receivedCount')} value={receivedCount} />
        <Metric
          label={t('purchase.invoiceNotice.metric.noticeAmount')}
          value={formatMoney(totalAmount.toFixed(2), currency)}
        />
        <Metric label={t('purchase.invoiceNotice.metric.openReminders')} value={openReminders} />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid purchase-invoice-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<Search size={18} />}
                title={t('purchase.invoiceNotice.list.title')}
              />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadNotices()
                }}
              >
                <label>
                  {t('purchase.invoiceNotice.list.searchLabel')}
                  <Input
                    value={search}
                    placeholder={t('purchase.invoiceNotice.list.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('purchase.invoiceNotice.list.statusFilter')}
                  <FormSelect
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('purchase.invoiceNotice.list.allStatuses')}</option>
                    {purchaseInvoiceNoticeStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('purchase.invoiceNotice.list.supplierFilter')}
                  <Input
                    value={supplierFilter}
                    placeholder={t('purchase.invoiceNotice.list.supplierFilterPlaceholder')}
                    onChange={(event) => setSupplierFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('purchase.invoiceNotice.list.customsFilter')}
                  <Input
                    value={customsFilter}
                    placeholder={t('purchase.invoiceNotice.list.customsFilterPlaceholder')}
                    onChange={(event) => setCustomsFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('purchase.invoiceNotice.list.query')}
                </Button>
                <Button
                  htmlType="button"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setForm(initialPurchaseInvoiceNoticeForm())
                    setCustomsDeclarationNoError('')
                    openInvoiceModal()
                  }}
                >
                  {t('purchase.invoiceNotice.list.generate')}
                </Button>
              </form>
            </div>

            <Table<PurchaseInvoiceNotice>
              columns={[
                {
                  title: t('purchase.invoiceNotice.field.noticeCode'),
                  dataIndex: 'code',
                  render: (value: string, record: PurchaseInvoiceNotice) => (
                    <button
                      className="row-button"
                      type="button"
                      onClick={(event) => stopAndOpenInvoiceNoticeDetail(event, record)}
                    >
                      {value}
                    </button>
                  ),
                },
                {
                  title: t('purchase.invoiceNotice.field.status'),
                  dataIndex: 'status',
                  render: purchaseInvoiceNoticeStatusLabel,
                },
                { title: t('purchase.invoiceNotice.field.supplier'), dataIndex: 'supplier_name' },
                {
                  title: t('purchase.invoiceNotice.field.customsDeclaration'),
                  dataIndex: 'customs_declaration_no',
                },
                {
                  title: t('purchase.invoiceNotice.field.amount'),
                  dataIndex: 'total_amount',
                  render: (_, notice) => formatMoney(notice.total_amount, notice.currency),
                },
                {
                  title: t('purchase.invoiceNotice.field.reminders'),
                  dataIndex: 'reminders',
                  render: (_, notice) =>
                    t('purchase.invoiceNotice.list.openReminderCount', {
                      count: notice.reminders.filter((item) => item.status === 'open').length,
                    }),
                },
                {
                  title: t('purchase.invoiceNotice.field.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: PurchaseInvoiceNotice) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenInvoiceNoticeDetail(event, record)}
                    >
                      {t('purchase.invoiceNotice.action.viewDetail')}
                    </Button>
                  ),
                },
              ]}
              dataSource={notices}
              loading={loading}
              pagination={false}
              rowClassName={(record) => (record.id === selectedNotice?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedNoticeId(record.id),
              })}
            />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={invoiceModalOpen}
          title={t('purchase.invoiceNotice.form.generateTitle')}
          width={1040}
          onCancel={closeInvoiceModal}
        >
          <div className="workflow-modal-content entity-modal-form">
            <PanelTitle
              icon={<LayoutDashboard size={18} />}
              title={t('purchase.invoiceNotice.form.generateFromCustoms')}
            />
            <form className="record-form" onSubmit={generateFromCustoms}>
              <div className="form-pair two">
                <label htmlFor="purchase-invoice-customs-id">
                  {t('purchase.invoiceNotice.field.customsDeclarationId')}
                  <Input
                    id="purchase-invoice-customs-id"
                    value={form.customs_declaration_id}
                    onChange={(event) =>
                      setForm({ ...form, customs_declaration_id: event.target.value })
                    }
                  />
                </label>
                <label htmlFor="purchase-invoice-customs-no">
                  {t('purchase.invoiceNotice.field.customsDeclarationNo')}
                  <Input
                    id="purchase-invoice-customs-no"
                    required
                    aria-invalid={Boolean(customsDeclarationNoError)}
                    aria-describedby="purchase-invoice-customs-no-error"
                    value={form.customs_declaration_no}
                    onChange={(event) => {
                      setCustomsDeclarationNoError('')
                      setForm({ ...form, customs_declaration_no: event.target.value })
                    }}
                  />
                  {customsDeclarationNoError ? (
                    <span className="form-field-error" id="purchase-invoice-customs-no-error">
                      {customsDeclarationNoError}
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="form-pair three">
                <label htmlFor="purchase-invoice-declaration-date">
                  {t('purchase.invoiceNotice.field.declarationDate')}
                  <Input
                    id="purchase-invoice-declaration-date"
                    required
                    type="date"
                    value={form.declaration_date}
                    onChange={(event) => setForm({ ...form, declaration_date: event.target.value })}
                  />
                </label>
                <label htmlFor="purchase-invoice-notice-date">
                  {t('purchase.invoiceNotice.field.noticeDate')}
                  <Input
                    id="purchase-invoice-notice-date"
                    required
                    type="date"
                    value={form.notice_date}
                    onChange={(event) => setForm({ ...form, notice_date: event.target.value })}
                  />
                </label>
                <label htmlFor="purchase-invoice-currency">
                  {t('purchase.invoiceNotice.field.currency')}
                  <Input
                    id="purchase-invoice-currency"
                    required
                    value={form.currency}
                    onChange={(event) => setForm({ ...form, currency: event.target.value })}
                  />
                </label>
              </div>
              <label htmlFor="purchase-invoice-remarks">
                {t('purchase.invoiceNotice.field.generateRemarks')}
                <Input
                  id="purchase-invoice-remarks"
                  value={form.remarks}
                  onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                />
              </label>

              <PurchaseInvoiceLineFields
                form={form}
                lineKey="a"
                required
                setForm={setForm}
                title={t('purchase.invoiceNotice.form.supplierSectionA')}
              />
              <PurchaseInvoiceLineFields
                form={form}
                lineKey="b"
                setForm={setForm}
                title={t('purchase.invoiceNotice.form.supplierSectionB')}
              />

              <Button htmlType="submit" loading={invoiceSubmitting} type="primary">
                {t('purchase.invoiceNotice.action.generate')}
              </Button>
            </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('purchase.invoiceNotice.detail.title')}
              />
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => onNavigate(purchaseInvoiceNoticePath)}
              >
                {t('purchase.invoiceNotice.action.backToList')}
              </Button>
            </div>
            {selectedNotice ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('purchase.invoiceNotice.field.statusNoticeDate')}</dt>
                    <dd>
                      {purchaseInvoiceNoticeStatusLabel(selectedNotice.status)} /{' '}
                      {formatDate(selectedNotice.notice_date)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('purchase.invoiceNotice.field.supplier')}</dt>
                    <dd>{selectedNotice.supplier_name}</dd>
                  </div>
                  <div>
                    <dt>{t('purchase.invoiceNotice.field.customsDeclarationNo')}</dt>
                    <dd>{selectedNotice.customs_declaration_no}</dd>
                  </div>
                  <div>
                    <dt>{t('purchase.invoiceNotice.field.declarationDate')}</dt>
                    <dd>{formatDate(selectedNotice.declaration_date)}</dd>
                  </div>
                  <div>
                    <dt>{t('purchase.invoiceNotice.field.invoiceQuantity')}</dt>
                    <dd>{selectedNotice.total_quantity}</dd>
                  </div>
                  <div>
                    <dt>{t('purchase.invoiceNotice.field.noticeAmount')}</dt>
                    <dd>{formatMoney(selectedNotice.total_amount, selectedNotice.currency)}</dd>
                  </div>
                  <div>
                    <dt>{t('purchase.invoiceNotice.field.sender')}</dt>
                    <dd>
                      {selectedNotice.sender_name ?? t('purchase.invoiceNotice.detail.notSent')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('purchase.invoiceNotice.field.taxInvoiceNo')}</dt>
                    <dd>
                      {selectedNotice.tax_invoice_no ??
                        t('purchase.invoiceNotice.detail.notReceived')}
                    </dd>
                  </div>
                </dl>

                <div className="transaction-box">
                  <strong>{t('purchase.invoiceNotice.detail.remarksTitle')}</strong>
                  <p>{selectedNotice.remarks ?? t('purchase.invoiceNotice.detail.remarksEmpty')}</p>
                </div>

                <div className="delivery-action-row">
                  <Button
                    disabled={selectedNotice.status !== 'draft'}
                    type="primary"
                    onClick={() => setInvoiceActionModal('send')}
                  >
                    {t('purchase.invoiceNotice.action.sendNotice')}
                  </Button>
                  <Button
                    disabled={selectedNotice.status === 'received'}
                    onClick={() => setInvoiceActionModal('receive')}
                  >
                    {t('purchase.invoiceNotice.action.receiveInvoice')}
                  </Button>
                </div>

                <Modal
                  centered
                  footer={null}
                  open={invoiceActionModal === 'send'}
                  title={t('purchase.invoiceNotice.form.sendTitle')}
                  width={720}
                  onCancel={() => setInvoiceActionModal(null)}
                >
                  <div className="workflow-modal-content entity-modal-form">
                    <form
                      className="record-form accessory-form generation-form"
                      onSubmit={sendSelectedNotice}
                    >
                      <div className="form-divider">
                        {t('purchase.invoiceNotice.form.sendTitle')}
                      </div>
                      <div className="form-pair two">
                        <label htmlFor="purchase-invoice-sender">
                          {t('purchase.invoiceNotice.field.sender')}
                          <Input
                            id="purchase-invoice-sender"
                            required
                            value={sendForm.sender_name}
                            onChange={(event) =>
                              setSendForm({ ...sendForm, sender_name: event.target.value })
                            }
                          />
                        </label>
                        <label htmlFor="purchase-invoice-sent-at">
                          {t('purchase.invoiceNotice.field.sentAt')}
                          <Input
                            id="purchase-invoice-sent-at"
                            required
                            type="date"
                            value={sendForm.sent_at}
                            onChange={(event) =>
                              setSendForm({ ...sendForm, sent_at: event.target.value })
                            }
                          />
                        </label>
                      </div>
                      <Button
                        disabled={selectedNotice.status !== 'draft'}
                        htmlType="submit"
                        loading={submitting}
                        type="primary"
                      >
                        {t('purchase.invoiceNotice.action.sendNotice')}
                      </Button>
                    </form>
                  </div>
                </Modal>

                <Modal
                  centered
                  footer={null}
                  open={invoiceActionModal === 'receive'}
                  title={t('purchase.invoiceNotice.form.receiveTitle')}
                  width={720}
                  onCancel={() => setInvoiceActionModal(null)}
                >
                  <div className="workflow-modal-content entity-modal-form">
                    <form
                      className="record-form accessory-form generation-form"
                      onSubmit={receiveSelectedNotice}
                    >
                      <div className="form-divider">
                        {t('purchase.invoiceNotice.form.receiveTitle')}
                      </div>
                      <div className="form-pair two">
                        <label htmlFor="purchase-invoice-tax-no">
                          {t('purchase.invoiceNotice.field.taxInvoiceNo')}
                          <Input
                            id="purchase-invoice-tax-no"
                            required
                            value={receiveForm.tax_invoice_no}
                            onChange={(event) =>
                              setReceiveForm({ ...receiveForm, tax_invoice_no: event.target.value })
                            }
                          />
                        </label>
                        <label htmlFor="purchase-invoice-received-at">
                          {t('purchase.invoiceNotice.field.receivedAt')}
                          <Input
                            id="purchase-invoice-received-at"
                            required
                            type="date"
                            value={receiveForm.received_at}
                            onChange={(event) =>
                              setReceiveForm({ ...receiveForm, received_at: event.target.value })
                            }
                          />
                        </label>
                      </div>
                      <Button
                        disabled={selectedNotice.status === 'received'}
                        htmlType="submit"
                        loading={submitting}
                      >
                        {t('purchase.invoiceNotice.action.receiveInvoice')}
                      </Button>
                    </form>
                  </div>
                </Modal>

                <div className="accessory-heading">
                  <strong>{t('purchase.invoiceNotice.detail.linesTitle')}</strong>
                  <span>
                    {t('purchase.invoiceNotice.detail.lineCount', {
                      count: selectedNotice.lines.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.invoiceNotice.field.purchaseContract')}</th>
                      <th>{t('purchase.invoiceNotice.field.customsName')}</th>
                      <th>{t('purchase.invoiceNotice.field.invoiceName')}</th>
                      <th>{t('purchase.invoiceNotice.field.quantity')}</th>
                      <th>{t('purchase.invoiceNotice.field.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedNotice.lines.map((line) => (
                      <tr key={line.id}>
                        <td>
                          {line.purchase_contract_no ??
                            t('purchase.invoiceNotice.detail.notLinked')}
                        </td>
                        <td>{line.customs_name}</td>
                        <td>{line.invoice_name}</td>
                        <td>
                          {line.quantity} {line.unit}
                        </td>
                        <td>{formatMoney(line.amount, line.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('purchase.invoiceNotice.detail.remindersTitle')}</strong>
                  <span>
                    {t('purchase.invoiceNotice.detail.reminderCount', {
                      count: selectedNotice.reminders.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.invoiceNotice.field.title')}</th>
                      <th>{t('purchase.invoiceNotice.field.dueDate')}</th>
                      <th>{t('purchase.invoiceNotice.field.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedNotice.reminders.map((reminder) => (
                      <tr key={reminder.id}>
                        <td>{reminder.title}</td>
                        <td>{formatDate(reminder.due_date)}</td>
                        <td>{purchaseInvoiceReminderStatusLabel(reminder.status)}</td>
                      </tr>
                    ))}
                    {selectedNotice.reminders.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={3}>
                          {t('purchase.invoiceNotice.detail.remindersEmpty')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('purchase.invoiceNotice.detail.globalRemindersTitle')}</strong>
                  <span>
                    {t('purchase.invoiceNotice.detail.reminderCount', { count: reminders.length })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.invoiceNotice.field.title')}</th>
                      <th>{t('purchase.invoiceNotice.field.dueDate')}</th>
                      <th>{t('purchase.invoiceNotice.field.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map((reminder) => (
                      <tr key={reminder.id}>
                        <td>{reminder.title}</td>
                        <td>{formatDate(reminder.due_date)}</td>
                        <td>{purchaseInvoiceReminderStatusLabel(reminder.status)}</td>
                      </tr>
                    ))}
                    {reminders.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={3}>
                          {t('purchase.invoiceNotice.detail.noReminders')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <Receipt size={28} />
                <strong>{t('purchase.invoiceNotice.detail.emptyTitle')}</strong>
                <span>{t('purchase.invoiceNotice.detail.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function PurchaseInvoiceLineFields({
  form,
  lineKey,
  required = false,
  setForm,
  title,
}: {
  form: PurchaseInvoiceNoticeFormState
  lineKey: 'a' | 'b'
  required?: boolean
  setForm: (form: PurchaseInvoiceNoticeFormState) => void
  title: string
}) {
  const suffix = lineKey
  const values = {
    supplier_id: form[`supplier_id_${suffix}`],
    supplier_name: form[`supplier_name_${suffix}`],
    purchase_contract_id: form[`purchase_contract_id_${suffix}`],
    purchase_contract_no: form[`purchase_contract_no_${suffix}`],
    product_id: form[`product_id_${suffix}`],
    product_code: form[`product_code_${suffix}`],
    product_name: form[`product_name_${suffix}`],
    customs_name: form[`customs_name_${suffix}`],
    invoice_name: form[`invoice_name_${suffix}`],
    quantity: form[`quantity_${suffix}`],
    unit: form[`unit_${suffix}`],
    amount: form[`amount_${suffix}`],
    remark: form[`remark_${suffix}`],
  }

  function update(field: keyof typeof values, value: string) {
    setForm({
      ...form,
      [`${field}_${suffix}`]: value,
    } as PurchaseInvoiceNoticeFormState)
  }

  return (
    <>
      <div className="form-divider">{title}</div>
      <div className="form-pair two">
        <label htmlFor={`purchase-invoice-supplier-id-${suffix}`}>
          {t('purchase.invoiceNotice.field.supplierId')}
          <Input
            id={`purchase-invoice-supplier-id-${suffix}`}
            value={values.supplier_id}
            onChange={(event) => update('supplier_id', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-supplier-name-${suffix}`}>
          {t('purchase.invoiceNotice.field.supplier')}
          <Input
            id={`purchase-invoice-supplier-name-${suffix}`}
            required={required}
            value={values.supplier_name}
            onChange={(event) => update('supplier_name', event.target.value)}
          />
        </label>
      </div>
      <div className="form-pair two">
        <label htmlFor={`purchase-invoice-contract-no-${suffix}`}>
          {t('purchase.invoiceNotice.field.purchaseContractNo')}
          <Input
            id={`purchase-invoice-contract-no-${suffix}`}
            value={values.purchase_contract_no}
            onChange={(event) => update('purchase_contract_no', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-product-code-${suffix}`}>
          {t('purchase.invoiceNotice.field.productCode')}
          <Input
            id={`purchase-invoice-product-code-${suffix}`}
            value={values.product_code}
            onChange={(event) => update('product_code', event.target.value)}
          />
        </label>
      </div>
      <div className="visually-hidden">
        <label htmlFor={`purchase-invoice-contract-id-${suffix}`}>
          {t('purchase.invoiceNotice.field.purchaseContractId')}
          <Input
            id={`purchase-invoice-contract-id-${suffix}`}
            value={values.purchase_contract_id}
            onChange={(event) => update('purchase_contract_id', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-product-id-${suffix}`}>
          {t('purchase.invoiceNotice.field.productId')}
          <Input
            id={`purchase-invoice-product-id-${suffix}`}
            value={values.product_id}
            onChange={(event) => update('product_id', event.target.value)}
          />
        </label>
      </div>
      <div className="form-pair three">
        <label htmlFor={`purchase-invoice-product-name-${suffix}`}>
          {t('purchase.invoiceNotice.field.productName')}
          <Input
            id={`purchase-invoice-product-name-${suffix}`}
            required={required}
            value={values.product_name}
            onChange={(event) => update('product_name', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-customs-name-${suffix}`}>
          {t('purchase.invoiceNotice.field.customsName')}
          <Input
            id={`purchase-invoice-customs-name-${suffix}`}
            required={required}
            value={values.customs_name}
            onChange={(event) => update('customs_name', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-name-${suffix}`}>
          {t('purchase.invoiceNotice.field.invoiceName')}
          <Input
            id={`purchase-invoice-name-${suffix}`}
            required={required}
            value={values.invoice_name}
            onChange={(event) => update('invoice_name', event.target.value)}
          />
        </label>
      </div>
      <div className="form-pair three">
        <label htmlFor={`purchase-invoice-quantity-${suffix}`}>
          {t('purchase.invoiceNotice.field.invoiceQuantity')}
          <Input
            id={`purchase-invoice-quantity-${suffix}`}
            min="0.0001"
            required={required}
            step="0.0001"
            type="number"
            value={values.quantity}
            onChange={(event) => update('quantity', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-unit-${suffix}`}>
          {t('purchase.invoiceNotice.field.unit')}
          <Input
            id={`purchase-invoice-unit-${suffix}`}
            required={required}
            value={values.unit}
            onChange={(event) => update('unit', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-amount-${suffix}`}>
          {t('purchase.invoiceNotice.field.amount')}
          <Input
            id={`purchase-invoice-amount-${suffix}`}
            min="0"
            step="0.01"
            type="number"
            value={values.amount}
            onChange={(event) => update('amount', event.target.value)}
          />
        </label>
      </div>
      <label htmlFor={`purchase-invoice-remark-${suffix}`}>
        {t('purchase.invoiceNotice.field.lineRemarks')}
        <Input
          id={`purchase-invoice-remark-${suffix}`}
          value={values.remark}
          onChange={(event) => update('remark', event.target.value)}
        />
      </label>
    </>
  )
}
