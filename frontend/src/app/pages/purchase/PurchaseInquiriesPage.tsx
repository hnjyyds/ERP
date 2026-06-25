import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search , FileText} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { addPurchaseInquiryQuotation, createPurchaseInquiry, listPurchaseInquiries, listPurchaseInquiryReferences, listPurchaseInquirySupplierSamples, sendPurchaseInquiryTemplate, updatePurchaseInquiry, type PurchaseInquiry, type PurchaseInquiryCreatePayload, type PurchaseInquiryLine, type PurchaseInquiryReference, type PurchaseInquiryTemplate, type PurchaseInquiryTemplatePayload, type SupplierQuotation, type SupplierQuotationPayload , SupplierSampleEvidence} from '../../../api'
import { purchaseInquiryPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { purchaseInquiryStatusOptions , sampleRecordStatusOptions} from '../../../shared/formOptions'
import { formatDate, formatMoney, nullableText, todayInputValue, type RoutedDetailPageProps , emptyToNull} from '../appHelpers'

function sampleRecordStatusLabel(value: string): string {
  return sampleRecordStatusOptions.find((item) => item.value === value)?.label ?? value
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
    buyer_user_name: '演示业务主管',
    remarks: '环保袋供应商询价',
    product_id: 'product-bag',
    product_code: 'BAG-40',
    product_name: 'Eco Shopping Bag',
    specification: '40x35cm',
    model: 'BAG-40',
    quantity: '1000',
    unit: 'pcs',
  }
}

function initialPurchaseQuotationForm(): PurchaseQuotationFormState {
  return {
    supplier_id: 'supplier-pack-a',
    supplier_name: '华东包装制品厂',
    quoted_at: todayInputValue(),
    unit_price: '0.78',
    currency: 'USD',
    lead_time_days: '18',
    min_order_quantity: '800',
    sample_available: true,
    remark: '含环保包装',
  }
}

function initialPurchaseInquiryTemplateForm(): PurchaseInquiryTemplateFormState {
  return {
    template_name: '标准采购询价模板',
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
  return purchaseInquiryStatusOptions.find((item) => item.value === value)?.label ?? value
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
  const [inquiryActionModal, setInquiryActionModal] = useState<'template' | 'quotation' | null>(null)
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

  const selectedInquiry = useMemo(
    () => {
      if (detailId) return inquiries.find((item) => item.id === detailId) ?? null
      return inquiries.find((item) => item.id === selectedInquiryId) ?? inquiries[0] ?? null
    },
    [detailId, inquiries, selectedInquiryId],
  )

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
      showError(caught, '采购询价加载失败')
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
      showError(caught, '采购询价参考资料加载失败')
    }
  }

  function syncPurchaseInquiryActionForms(inquiry: PurchaseInquiry | null) {
    const firstQuote = inquiry?.quotations[0]
    setTemplateForm({
      template_name: inquiry?.template_name ?? '标准采购询价模板',
      recipient_emails: firstQuote?.supplier_id ? `${firstQuote.supplier_id}@example.com` : 'supplier@example.com',
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
      setMessage(editingInquiryId ? `已保存采购询价 ${saved.code}` : `已新增采购询价 ${saved.code}`)
      setEditingInquiryId(null)
      setForm(initialPurchaseInquiryForm())
      setInquiryModalOpen(false)
      upsertInquiry(saved)
      await loadInquiries(saved.id)
    } catch (caught) {
      showError(caught, '采购询价保存失败')
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
      setMessage(`已生成询价模板 ${template.filename}`)
      setInquiryActionModal(null)
      await loadInquiries(selectedInquiry.id)
    } catch (caught) {
      showError(caught, '询价模板发送失败')
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
      setMessage(`已登记供应商报价 ${quotationForm.supplier_name}`)
      setInquiryActionModal(null)
      upsertInquiry(updated)
      await Promise.all([loadInquiries(updated.id), loadPurchaseInquiryAuxiliary(updated)])
    } catch (caught) {
      showError(caught, '供应商报价登记失败')
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
    setMessage(`正在编辑采购询价 ${selectedInquiry.code}`)
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
<div className="summary-strip" aria-label="采购询价概览">
        <Metric label="询价单" value={inquiries.length} />
        <Metric label="已发模板" value={sentCount} />
        <Metric label="已报价" value={quotedCount} />
        <Metric label="供应商报价" value={quotationCount} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid purchase-inquiry-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="采购询价列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadInquiries()
              }}
            >
              <label>
                询价搜索
                <Input
                  value={search}
                  placeholder="询价单号 / 商品 / 备注"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                询价状态
              <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {purchaseInquiryStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
              <label>
                商品标识
                <Input
                  value={productFilter}
                  placeholder="product-id"
                  onChange={(event) => setProductFilter(event.target.value)}
                />
              </label>
              <label>
                供应商标识
                <Input
                  value={supplierFilter}
                  placeholder="supplier-id"
                  onChange={(event) => setSupplierFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateInquiry}>
                新增采购询价
              </Button>
            </form>
          </div>

          <Table<PurchaseInquiry>
            columns={[
              {
                title: '询价单号',
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
              { title: '状态', dataIndex: 'status', render: purchaseInquiryStatusLabel },
              {
                title: '商品',
                dataIndex: 'lines',
                render: (_, inquiry) =>
                  `${inquiry.lines[0]?.product_code ?? '未填'} / ${inquiry.lines[0]?.product_name ?? '未填'}`,
              },
              { title: '询价日', dataIndex: 'inquiry_date', render: formatDate },
              { title: '报价数', dataIndex: 'quotations', render: (_, inquiry) => inquiry.quotations.length },
              {
                title: '最低价',
                dataIndex: 'quotations',
                render: (_, inquiry) => {
                  const lowest = lowestSupplierQuotation(inquiry.quotations)
                  return lowest ? formatMoney(lowest.unit_price, lowest.currency) : '未报价'
                },
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: PurchaseInquiry) => (
                  <Button size="small" onClick={(event) => stopAndOpenInquiryDetail(event, record)}>
                    查看详情
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
          title={editingInquiryId ? '编辑采购询价' : '新增采购询价'}
          width={980}
          onCancel={cancelInquiryEdit}
        >
          <div className="workflow-modal-content entity-modal-form">
          <form className="record-form" onSubmit={submitInquiry}>
            <div className="form-pair two">
              <label>
                询价单号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                询价日期
                <Input
                  type="date"
                  value={form.inquiry_date}
                  onChange={(event) => setForm({ ...form, inquiry_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                业务员标识
                <Input
                  value={form.buyer_user_id}
                  onChange={(event) => setForm({ ...form, buyer_user_id: event.target.value })}
                />
              </label>
              <label>
                业务员
                <Input
                  value={form.buyer_user_name}
                  onChange={(event) => setForm({ ...form, buyer_user_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-divider">询价商品</div>
            <div className="form-pair two">
              <label>
                商品标识
                <Input
                  value={form.product_id}
                  onChange={(event) => setForm({ ...form, product_id: event.target.value })}
                />
              </label>
              <label>
                商品编号
                <Input
                  value={form.product_code}
                  onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                />
              </label>
            </div>
            <label>
              商品名称
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                规格
                <Input
                  value={form.specification}
                  onChange={(event) => setForm({ ...form, specification: event.target.value })}
                />
              </label>
              <label>
                型号
                <Input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                询价数量
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
              询价备注
              <Input.TextArea
                rows={2}
                value={form.remarks}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              {editingInquiryId ? '保存草稿编辑' : '新增采购询价'}
            </Button>
            {editingInquiryId ? (
              <Button onClick={cancelInquiryEdit}>
                取消编辑
              </Button>
            ) : null}
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="询价明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(purchaseInquiryPath)}>
              返回列表
            </Button>
          </div>
          {selectedInquiry ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/询价日</dt>
                  <dd>{purchaseInquiryStatusLabel(selectedInquiry.status)} / {formatDate(selectedInquiry.inquiry_date)}</dd>
                </div>
                <div>
                  <dt>业务员</dt>
                  <dd>{selectedInquiry.buyer_user_name ?? '未指定'}</dd>
                </div>
                <div>
                  <dt>模板</dt>
                  <dd>{selectedInquiry.template_name ?? '未发送'}</dd>
                </div>
                <div>
                  <dt>模板发送日</dt>
                  <dd>{formatDate(selectedInquiry.template_sent_at)}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>询价备注</strong>
                <p>{selectedInquiry.remarks ?? '未填写'}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedInquiry.status !== 'draft'}
                  onClick={loadSelectedInquiryForEdit}
                >
                  编辑询价
                </Button>
                <Button htmlType="button" onClick={() => setInquiryActionModal('template')}>
                  发送询价模板
                </Button>
                <Button
                  disabled={!selectedInquiry.lines[0]}
                  htmlType="button"
                  type="primary"
                  onClick={() => setInquiryActionModal('quotation')}
                >
                  登记供应商报价
                </Button>
              </div>

              <Modal
                centered
                footer={null}
                open={inquiryActionModal === 'template'}
                title="发送询价模板"
                width={720}
                onCancel={() => setInquiryActionModal(null)}
              >
                <div className="workflow-modal-content entity-modal-form">
                  <form className="record-form accessory-form" onSubmit={sendTemplate}>
                    <div className="form-divider">询价模板发送</div>
                    <label>
                      模板名称
                      <Input
                        value={templateForm.template_name}
                        onChange={(event) =>
                          setTemplateForm({ ...templateForm, template_name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      收件邮箱
                      <Input
                        value={templateForm.recipient_emails}
                        onChange={(event) =>
                          setTemplateForm({ ...templateForm, recipient_emails: event.target.value })
                        }
                      />
                    </label>
                    <Button htmlType="submit" loading={submitting}>
                      发送询价模板
                    </Button>
                  </form>
                </div>
              </Modal>

              <Modal
                centered
                footer={null}
                open={inquiryActionModal === 'quotation'}
                title="登记供应商报价"
                width={880}
                onCancel={() => setInquiryActionModal(null)}
              >
                <div className="workflow-modal-content entity-modal-form">
                  <form className="record-form accessory-form" onSubmit={addSupplierQuotation}>
                    <div className="form-divider">供应商报价明细</div>
                    <div className="form-pair two">
                      <label>
                        供应商标识
                        <Input
                          value={quotationForm.supplier_id}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, supplier_id: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        供应商名称
                        <Input
                          value={quotationForm.supplier_name}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, supplier_name: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <div className="form-pair three">
                      <label>
                        报价日期
                        <Input
                          type="date"
                          value={quotationForm.quoted_at}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, quoted_at: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        单价
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
                        币种
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
                        交期天数
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={quotationForm.lead_time_days}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, lead_time_days: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        最小起订量
                        <Input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={quotationForm.min_order_quantity}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, min_order_quantity: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <label className="checkbox-label">
                      <input
                        checked={quotationForm.sample_available}
                        type="checkbox"
                        onChange={(event) =>
                          setQuotationForm({ ...quotationForm, sample_available: event.target.checked })
                        }
                      />
                      可提供样品
                    </label>
                  <label>
                      报价备注
                      <Input
                        value={quotationForm.remark}
                        onChange={(event) =>
                          setQuotationForm({ ...quotationForm, remark: event.target.value })
                        }
                      />
                    </label>
                    <Button htmlType="submit" loading={submitting} type="primary">
                      登记供应商报价
                    </Button>
                  </form>
                </div>
              </Modal>

              {templatePreview ? (
                <div className="transaction-box export-preview">
                  <strong>询价模板预览</strong>
                  <pre>{templatePreview}</pre>
                </div>
              ) : null}

              <div className="accessory-heading">
                <strong>询价商品明细</strong>
                <span>{selectedInquiry.lines.length} 行</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格/型号</th>
                    <th>数量</th>
                    <th>单位</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInquiry.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_code ?? '未填'} / {line.product_name}</td>
                      <td>{line.specification ?? '未填'} / {line.model ?? '未填'}</td>
                      <td>{line.quantity}</td>
                      <td>{line.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>供应商报价比较</strong>
                <span>{selectedInquiry.quotations.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>供应商</th>
                    <th>商品</th>
                    <th>单价</th>
                    <th>交期</th>
                    <th>起订量</th>
                    <th>样品</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInquiry.quotations.map((quote) => (
                    <tr key={quote.id}>
                      <td>{quote.supplier_name}</td>
                      <td>{quote.product_code ?? '未填'} / {quote.product_name}</td>
                      <td>{formatMoney(quote.unit_price, quote.currency)}</td>
                      <td>{quote.lead_time_days ?? '未填'} 天</td>
                      <td>{quote.min_order_quantity ?? '未填'}</td>
                      <td>{quote.has_sample ? '有样品' : '未提供'}</td>
                      <td>{quote.remark ?? '未填'}</td>
                    </tr>
                  ))}
                  {selectedInquiry.quotations.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={7}>暂无供应商报价</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>供应商样品关联</strong>
                <span>{supplierSamples.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>样品编号</th>
                    <th>供应商</th>
                    <th>商品</th>
                    <th>收样日期</th>
                    <th>数量</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierSamples.map((sample) => (
                    <tr key={sample.sample_record_id}>
                      <td>{sample.sample_code}</td>
                      <td>{sample.supplier_name ?? '未填'}</td>
                      <td>{sample.product_code ?? '未填'} / {sample.product_name}</td>
                      <td>{formatDate(sample.received_at)}</td>
                      <td>{sample.quantity} {sample.unit}</td>
                      <td>{sampleRecordStatusLabel(sample.status)}</td>
                    </tr>
                  ))}
                  {supplierSamples.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={6}>暂无供应商样品</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>采购参考价</strong>
                <span>{references.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>询价单</th>
                    <th>商品</th>
                    <th>供应商</th>
                    <th>参考价</th>
                    <th>报价日</th>
                  </tr>
                </thead>
                <tbody>
                  {references.map((reference) => (
                    <tr key={`${reference.source_inquiry_no}-${reference.supplier_name}`}>
                      <td>{reference.source_inquiry_no}</td>
                      <td>{reference.product_code ?? '未填'} / {reference.product_name}</td>
                      <td>{reference.supplier_name}</td>
                      <td>{formatMoney(reference.reference_price, reference.currency)}</td>
                      <td>{formatDate(reference.quote_date)}</td>
                    </tr>
                  ))}
                  {references.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>暂无采购参考价</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FileText size={28} />
              <strong>暂无采购询价</strong>
              <span>请返回列表选择询价单查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


