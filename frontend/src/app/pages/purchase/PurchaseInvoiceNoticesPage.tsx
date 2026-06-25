import { Alert, Button, Input, Modal, Table, Tag } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search , Receipt} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { generatePurchaseInvoiceNoticesFromDeclaration, listPurchaseInvoiceNoticeReminders, listPurchaseInvoiceNotices, receivePurchaseInvoiceNoticeTaxInvoice, sendPurchaseInvoiceNotice, type PurchaseInvoiceNotice, type PurchaseInvoiceNoticeGeneratePayload, type PurchaseInvoiceNoticeLinePayload, type PurchaseInvoiceNoticeReceivePayload, type PurchaseInvoiceNoticeReminder, type PurchaseInvoiceNoticeSendPayload } from '../../../api'
import { purchaseInvoiceNoticePath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { purchaseInvoiceNoticeStatusOptions } from '../../../shared/formOptions'
import { formatDate, formatMoney, nullableText, todayInputValue, OperationFlowRail, type RoutedDetailPageProps , emptyToNull} from '../appHelpers'

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
    customs_declaration_id: `customs-${Date.now().toString().slice(-6)}`,
    customs_declaration_no: `CD-${Date.now().toString().slice(-6)}`,
    declaration_date: '2026-09-03',
    notice_date: '2026-09-04',
    currency: 'CNY',
    remarks: '根据报关单证按供应商生成开票通知。',
    supplier_id_a: 'supplier-pack-a',
    supplier_name_a: '华东包装制品厂',
    purchase_contract_id_a: 'pc-pack-a',
    purchase_contract_no_a: 'PC-2026-PACK-A',
    product_id_a: 'product-bag',
    product_code_a: 'BAG-40',
    product_name_a: 'Eco Shopping Bag',
    customs_name_a: '环保购物袋',
    invoice_name_a: '无纺布购物袋',
    quantity_a: '1000',
    unit_a: 'pcs',
    amount_a: '5200.00',
    remark_a: '按报关品名和数量开具增值税发票',
    supplier_id_b: 'supplier-label-a',
    supplier_name_b: '苏州标签印务厂',
    purchase_contract_id_b: 'pc-label-a',
    purchase_contract_no_b: 'PC-2026-LABEL-A',
    product_id_b: 'product-label',
    product_code_b: 'LABEL-01',
    product_name_b: 'Hang Tag',
    customs_name_b: '纸制吊牌',
    invoice_name_b: '纸质吊牌',
    quantity_b: '450',
    unit_b: 'pcs',
    amount_b: '360.00',
    remark_b: '吊牌随货开票',
  }
}

function initialPurchaseInvoiceNoticeSendForm(): PurchaseInvoiceNoticeSendFormState {
  return {
    sender_name: '演示业务主管',
    sent_at: '2026-09-05',
  }
}

function initialPurchaseInvoiceNoticeReceiveForm(): PurchaseInvoiceNoticeReceiveFormState {
  return {
    tax_invoice_no: 'VAT-2026-001',
    received_at: '2026-09-09',
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
  return purchaseInvoiceNoticeStatusOptions.find((item) => item.value === value)?.label ?? value
}

function purchaseInvoiceReminderStatusLabel(value: string): string {
  if (value === 'open') return '待催收'
  if (value === 'done') return '已完成'
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
  const [error, setError] = useState('')
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [invoiceActionModal, setInvoiceActionModal] = useState<'send' | 'receive' | null>(null)
  const [form, setForm] = useState<PurchaseInvoiceNoticeFormState>(() =>
    initialPurchaseInvoiceNoticeForm(),
  )
  const [sendForm, setSendForm] = useState<PurchaseInvoiceNoticeSendFormState>(() =>
    initialPurchaseInvoiceNoticeSendForm(),
  )
  const [receiveForm, setReceiveForm] = useState<PurchaseInvoiceNoticeReceiveFormState>(() =>
    initialPurchaseInvoiceNoticeReceiveForm(),
  )

  const selectedNotice = useMemo(
    () => {
      if (detailId) return notices.find((item) => item.id === detailId) ?? null
      return notices.find((item) => item.id === selectedNoticeId) ?? notices[0] ?? null
    },
    [detailId, notices, selectedNoticeId],
  )

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
      received_at: selectedNotice?.tax_invoice_received_at ?? selectedNotice?.sent_at ?? current.received_at,
    }))
  }, [selectedNotice?.id, selectedNotice?.status])

  useEffect(() => {
    if (detailId && notices.length > 0 && !notices.some((item) => item.id === detailId)) {
      onNavigate(purchaseInvoiceNoticePath)
    }
  }, [detailId, notices, onNavigate])

  async function loadNotices(preferredId?: string, overrideCustomsFilter?: string) {
    setLoading(true)
    setError('')
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
        (noticeResult.items.some((item) => item.id === selectedNoticeId) ? selectedNoticeId : null) ??
        noticeResult.items[0]?.id ??
        null
      setSelectedNoticeId(nextSelectedId)
    } catch (caught) {
      showError(caught, '开票通知加载失败')
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

  function stopAndOpenInvoiceNoticeDetail(event: MouseEvent<HTMLElement>, notice: PurchaseInvoiceNotice) {
    event.stopPropagation()
    openInvoiceNoticeDetail(notice)
  }

  async function generateFromCustoms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const customsId = form.customs_declaration_id.trim()
      const result = await generatePurchaseInvoiceNoticesFromDeclaration(
        purchaseInvoiceNoticeGeneratePayload(form),
      )
      const firstNotice = result.items[0] ?? null
      setSearch('')
      setStatusFilter('')
      setSupplierFilter('')
      setCustomsFilter(customsId)
      setMessage(`已生成 ${result.total} 条供应商开票通知`)
      setForm(initialPurchaseInvoiceNoticeForm())
      setInvoiceModalOpen(false)
      if (firstNotice) upsertNotice(firstNotice)
      await loadNotices(firstNotice?.id, customsId)
    } catch (caught) {
      showError(caught, '开票通知生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function sendSelectedNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedNotice) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const sent = await sendPurchaseInvoiceNotice(
        selectedNotice.id,
        purchaseInvoiceNoticeSendPayload(sendForm),
      )
      setMessage(`已发送开票通知 ${sent.code}，系统已生成税票催收提醒`)
      setInvoiceActionModal(null)
      upsertNotice(sent)
      await loadNotices(sent.id)
    } catch (caught) {
      showError(caught, '开票通知发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function receiveSelectedNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedNotice) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const received = await receivePurchaseInvoiceNoticeTaxInvoice(
        selectedNotice.id,
        purchaseInvoiceNoticeReceivePayload(receiveForm),
      )
      setMessage(`已登记税票 ${received.tax_invoice_no ?? ''}`)
      setInvoiceActionModal(null)
      upsertNotice(received)
      await loadNotices(received.id)
    } catch (caught) {
      showError(caught, '税票登记失败')
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
      <OperationFlowRail activePath={purchaseInvoiceNoticePath} kind="purchase" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="开票通知概览">
        <Metric label="开票通知" value={notices.length} />
        <Metric label="已发送" value={sentCount} />
        <Metric label="已收票" value={receivedCount} />
        <Metric label="通知金额" value={formatMoney(totalAmount.toFixed(2), currency)} />
        <Metric label="待催收" value={openReminders} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid purchase-invoice-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="开票通知列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadNotices()
              }}
            >
              <label>
                通知搜索
                <Input
                  value={search}
                  placeholder="通知号 / 供应商 / 品名"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                通知状态
                <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {purchaseInvoiceNoticeStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
              <label>
                供应商标识
                <Input
                  value={supplierFilter}
                  placeholder="supplier-id"
                  onChange={(event) => setSupplierFilter(event.target.value)}
                />
              </label>
              <label>
                报关单证 ID
                <Input
                  value={customsFilter}
                  placeholder="customs-id"
                  onChange={(event) => setCustomsFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button
                htmlType="button"
                icon={<Plus size={16} />}
                onClick={() => {
                  setForm(initialPurchaseInvoiceNoticeForm())
                  setInvoiceModalOpen(true)
                }}
              >
                生成开票通知
              </Button>
            </form>
          </div>

          <Table<PurchaseInvoiceNotice>
            columns={[
              {
                title: '开票通知',
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
              { title: '状态', dataIndex: 'status', render: purchaseInvoiceNoticeStatusLabel },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '报关单', dataIndex: 'customs_declaration_no' },
              {
                title: '金额',
                dataIndex: 'total_amount',
                render: (_, notice) => formatMoney(notice.total_amount, notice.currency),
              },
              {
                title: '提醒',
                dataIndex: 'reminders',
                render: (_, notice) => `${notice.reminders.filter((item) => item.status === 'open').length} 个`,
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: PurchaseInvoiceNotice) => (
                  <Button size="small" onClick={(event) => stopAndOpenInvoiceNoticeDetail(event, record)}>
                    查看详情
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
          title="从报关单证生成开票通知"
          width={1040}
          onCancel={() => setInvoiceModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<LayoutDashboard size={18} />} title="从报关单证生成" />
          <form className="record-form" onSubmit={generateFromCustoms}>
            <div className="form-pair two">
              <label htmlFor="purchase-invoice-customs-id">
                报关单证 ID
                <Input
                  id="purchase-invoice-customs-id"
                  value={form.customs_declaration_id}
                  onChange={(event) => setForm({ ...form, customs_declaration_id: event.target.value })}
                />
              </label>
              <label htmlFor="purchase-invoice-customs-no">
                报关单号
                <Input
                  id="purchase-invoice-customs-no"
                  required
                  value={form.customs_declaration_no}
                  onChange={(event) => setForm({ ...form, customs_declaration_no: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label htmlFor="purchase-invoice-declaration-date">
                报关日期
                <Input
                  id="purchase-invoice-declaration-date"
                  required
                  type="date"
                  value={form.declaration_date}
                  onChange={(event) => setForm({ ...form, declaration_date: event.target.value })}
                />
              </label>
              <label htmlFor="purchase-invoice-notice-date">
                通知日期
                <Input
                  id="purchase-invoice-notice-date"
                  required
                  type="date"
                  value={form.notice_date}
                  onChange={(event) => setForm({ ...form, notice_date: event.target.value })}
                />
              </label>
              <label htmlFor="purchase-invoice-currency">
                币种
                <Input
                  id="purchase-invoice-currency"
                  required
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                />
              </label>
            </div>
            <label htmlFor="purchase-invoice-remarks">
              生成备注
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
              title="供应商 A 开票要求"
            />
            <PurchaseInvoiceLineFields
              form={form}
              lineKey="b"
              setForm={setForm}
              title="供应商 B 开票要求"
            />

            <Button htmlType="submit" loading={submitting} type="primary">
              生成开票通知
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="开票通知明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(purchaseInvoiceNoticePath)}>
              返回列表
            </Button>
          </div>
          {selectedNotice ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/通知日</dt>
                  <dd>{purchaseInvoiceNoticeStatusLabel(selectedNotice.status)} / {formatDate(selectedNotice.notice_date)}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedNotice.supplier_name}</dd>
                </div>
                <div>
                  <dt>报关单号</dt>
                  <dd>{selectedNotice.customs_declaration_no}</dd>
                </div>
                <div>
                  <dt>报关日期</dt>
                  <dd>{formatDate(selectedNotice.declaration_date)}</dd>
                </div>
                <div>
                  <dt>开票数量</dt>
                  <dd>{selectedNotice.total_quantity}</dd>
                </div>
                <div>
                  <dt>通知金额</dt>
                  <dd>{formatMoney(selectedNotice.total_amount, selectedNotice.currency)}</dd>
                </div>
                <div>
                  <dt>发送人</dt>
                  <dd>{selectedNotice.sender_name ?? '未发送'}</dd>
                </div>
                <div>
                  <dt>税票号</dt>
                  <dd>{selectedNotice.tax_invoice_no ?? '未收票'}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>开票通知备注</strong>
                <p>{selectedNotice.remarks ?? '未填写'}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedNotice.status !== 'draft'}
                  type="primary"
                  onClick={() => setInvoiceActionModal('send')}
                >
                  发送开票通知
                </Button>
                <Button
                  disabled={selectedNotice.status === 'received'}
                  onClick={() => setInvoiceActionModal('receive')}
                >
                  登记税票
                </Button>
              </div>

              <Modal
                centered
                footer={null}
                open={invoiceActionModal === 'send'}
                title="发送开票通知"
                width={720}
                onCancel={() => setInvoiceActionModal(null)}
              >
                <div className="workflow-modal-content entity-modal-form">
                  <form className="record-form accessory-form generation-form" onSubmit={sendSelectedNotice}>
                    <div className="form-divider">发送开票通知</div>
                    <div className="form-pair two">
                      <label htmlFor="purchase-invoice-sender">
                        发送人
                        <Input
                          id="purchase-invoice-sender"
                          required
                          value={sendForm.sender_name}
                          onChange={(event) => setSendForm({ ...sendForm, sender_name: event.target.value })}
                        />
                      </label>
                      <label htmlFor="purchase-invoice-sent-at">
                        发送日期
                        <Input
                          id="purchase-invoice-sent-at"
                          required
                          type="date"
                          value={sendForm.sent_at}
                          onChange={(event) => setSendForm({ ...sendForm, sent_at: event.target.value })}
                        />
                      </label>
                    </div>
                    <Button
                      disabled={selectedNotice.status !== 'draft'}
                      htmlType="submit"
                      loading={submitting}
                      type="primary"
                    >
                      发送开票通知
                    </Button>
                  </form>
                </div>
              </Modal>

              <Modal
                centered
                footer={null}
                open={invoiceActionModal === 'receive'}
                title="登记供应商税票"
                width={720}
                onCancel={() => setInvoiceActionModal(null)}
              >
                <div className="workflow-modal-content entity-modal-form">
                  <form className="record-form accessory-form generation-form" onSubmit={receiveSelectedNotice}>
                    <div className="form-divider">登记供应商税票</div>
                    <div className="form-pair two">
                      <label htmlFor="purchase-invoice-tax-no">
                        税票号
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
                        收票日期
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
                      登记税票
                    </Button>
                  </form>
                </div>
              </Modal>

              <div className="accessory-heading">
                <strong>开票品名和数量</strong>
                <span>{selectedNotice.lines.length} 行</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>采购合同</th>
                    <th>报关品名</th>
                    <th>开票品名</th>
                    <th>数量</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedNotice.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.purchase_contract_no ?? '未关联'}</td>
                      <td>{line.customs_name}</td>
                      <td>{line.invoice_name}</td>
                      <td>{line.quantity} {line.unit}</td>
                      <td>{formatMoney(line.amount, line.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>税票催收提醒</strong>
                <span>{selectedNotice.reminders.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>状态</th>
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
                      <td className="empty-cell" colSpan={3}>发送后自动生成税票催收提醒</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>全局税票催收</strong>
                <span>{reminders.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>状态</th>
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
                      <td className="empty-cell" colSpan={3}>暂无税票催收提醒</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Receipt size={28} />
              <strong>暂无开票通知</strong>
              <span>请返回列表选择开票通知查看详情</span>
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
          供应商标识
          <Input
            id={`purchase-invoice-supplier-id-${suffix}`}
            value={values.supplier_id}
            onChange={(event) => update('supplier_id', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-supplier-name-${suffix}`}>
          供应商
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
          采购合同号
          <Input
            id={`purchase-invoice-contract-no-${suffix}`}
            value={values.purchase_contract_no}
            onChange={(event) => update('purchase_contract_no', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-product-code-${suffix}`}>
          商品编号
          <Input
            id={`purchase-invoice-product-code-${suffix}`}
            value={values.product_code}
            onChange={(event) => update('product_code', event.target.value)}
          />
        </label>
      </div>
      <div className="visually-hidden">
        <label htmlFor={`purchase-invoice-contract-id-${suffix}`}>
          采购合同 ID
          <Input
            id={`purchase-invoice-contract-id-${suffix}`}
            value={values.purchase_contract_id}
            onChange={(event) => update('purchase_contract_id', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-product-id-${suffix}`}>
          商品 ID
          <Input
            id={`purchase-invoice-product-id-${suffix}`}
            value={values.product_id}
            onChange={(event) => update('product_id', event.target.value)}
          />
        </label>
      </div>
      <div className="form-pair three">
        <label htmlFor={`purchase-invoice-product-name-${suffix}`}>
          商品名称
          <Input
            id={`purchase-invoice-product-name-${suffix}`}
            required={required}
            value={values.product_name}
            onChange={(event) => update('product_name', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-customs-name-${suffix}`}>
          报关品名
          <Input
            id={`purchase-invoice-customs-name-${suffix}`}
            required={required}
            value={values.customs_name}
            onChange={(event) => update('customs_name', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-name-${suffix}`}>
          开票品名
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
          开票数量
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
          单位
          <Input
            id={`purchase-invoice-unit-${suffix}`}
            required={required}
            value={values.unit}
            onChange={(event) => update('unit', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-amount-${suffix}`}>
          金额
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
        行备注
        <Input
          id={`purchase-invoice-remark-${suffix}`}
          value={values.remark}
          onChange={(event) => update('remark', event.target.value)}
        />
      </label>
    </>
  )
}


