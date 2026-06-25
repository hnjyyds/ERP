import { Alert, Button, Input, Modal, Table, Tag , Select} from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search , FileText} from 'lucide-react'
import type { FormEvent, MouseEvent , ReactNode} from 'react'
import { useEffect, useMemo, useState } from 'react'
import { approveExportQuotation, confirmExportQuotationContract, createExportQuotation, exportExportQuotation, getExportQuotationHistory, getExportQuotationPurchaseReferences, getExportQuotationSampleDeliveries, listExportQuotations, submitExportQuotation, updateExportQuotation, type ExportQuotation, type ExportQuotationApprovePayload, type ExportQuotationConfirmContractPayload, type ExportQuotationContract, type ExportQuotationCreatePayload, type ExportQuotationLine, type ExportQuotationPurchaseReference, type Customer, type Product , AssignableUser, SampleDelivery, Supplier, listCustomers} from '../../../api'
import { exportQuotationPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { downloadCsv } from '../../../shared/print'
import { exportQuotationStatusOptions, freightMethodOptions , sampleDeliveryStatusOptions} from '../../../shared/formOptions'
import { formatDate, formatMoney, formatPercent, nullableText, todayInputValue, type RoutedDetailPageProps , emptyToNull} from '../appHelpers'

function sampleDeliveryStatusLabel(value: string): string {
  return sampleDeliveryStatusOptions.find((item) => item.value === value)?.label ?? value
}


type ExportQuotationFormState = {
  code: string
  quote_date: string
  customer_id: string
  customer_name: string
  sales_user_id: string
  sales_user_name: string
  currency: string
  trade_term: string
  valid_until: string
  description: string
  product_id: string
  product_code: string
  product_name: string
  specification: string
  model: string
  quantity: string
  unit: string
  unit_price: string
  freight_method: string
  freight_amount: string
  purchase_reference_supplier_name: string
  purchase_reference_price: string
  line_remark: string
}

type ExportQuotationApproveFormState = {
  reviewer_name: string
  approved_at: string
}

type ExportQuotationContractFormState = {
  confirmed_at: string
  contract_no: string
}


function initialExportQuotationForm(): ExportQuotationFormState {
  return {
    code: `QT-${Date.now().toString().slice(-6)}`,
    quote_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    sales_user_id: '',
    sales_user_name: '演示业务主管',
    currency: 'USD',
    trade_term: 'FOB Ningbo',
    valid_until: todayInputValue(),
    description: '',
    product_id: '',
    product_code: '',
    product_name: '',
    specification: '',
    model: '',
    quantity: '1',
    unit: 'pcs',
    unit_price: '1.00',
    freight_method: 'sea',
    freight_amount: '0.00',
    purchase_reference_supplier_name: '',
    purchase_reference_price: '',
    line_remark: '',
  }
}

function initialExportQuotationApproveForm(): ExportQuotationApproveFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: todayInputValue(),
  }
}

function initialExportQuotationContractForm(): ExportQuotationContractFormState {
  return {
    confirmed_at: todayInputValue(),
    contract_no: `EC-${Date.now().toString().slice(-6)}`,
  }
}

function exportQuotationToForm(quotation: ExportQuotation): ExportQuotationFormState {
  const line = quotation.lines[0]
  return {
    code: quotation.code,
    quote_date: quotation.quote_date,
    customer_id: quotation.customer_id ?? '',
    customer_name: quotation.customer_name,
    sales_user_id: quotation.sales_user_id ?? '',
    sales_user_name: quotation.sales_user_name ?? '',
    currency: quotation.currency,
    trade_term: quotation.trade_term,
    valid_until: quotation.valid_until ?? '',
    description: quotation.description ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    specification: line?.specification ?? '',
    model: line?.model ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
    unit_price: line?.unit_price ?? '1.00',
    freight_method: line?.freight_method ?? 'sea',
    freight_amount: line?.freight_amount ?? '0.00',
    purchase_reference_supplier_name: line?.purchase_reference_supplier_name ?? '',
    purchase_reference_price: line?.purchase_reference_price ?? '',
    line_remark: line?.remark ?? '',
  }
}

function exportQuotationPayload(form: ExportQuotationFormState): ExportQuotationCreatePayload {
  return {
    code: form.code.trim(),
    quote_date: form.quote_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    currency: form.currency.trim(),
    trade_term: form.trade_term.trim(),
    valid_until: emptyToNull(form.valid_until),
    description: emptyToNull(form.description),
    lines: [
      {
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        specification: emptyToNull(form.specification),
        model: emptyToNull(form.model),
        quantity: form.quantity,
        unit: form.unit.trim(),
        unit_price: form.unit_price,
        freight_method: form.freight_method,
        freight_amount: form.freight_amount,
        purchase_reference_supplier_name: emptyToNull(form.purchase_reference_supplier_name),
        purchase_reference_price: emptyToNull(form.purchase_reference_price),
        remark: emptyToNull(form.line_remark),
      },
    ],
  }
}

function exportQuotationApprovePayload(
  form: ExportQuotationApproveFormState,
): ExportQuotationApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function exportQuotationContractPayload(
  form: ExportQuotationContractFormState,
): ExportQuotationConfirmContractPayload {
  return {
    confirmed_at: form.confirmed_at,
    contract_no: form.contract_no.trim(),
  }
}

function exportQuotationStatusLabel(value: string): string {
  return exportQuotationStatusOptions.find((item) => item.value === value)?.label ?? value
}

function freightMethodLabel(value: string): string {
  return freightMethodOptions.find((item) => item.value === value)?.label ?? value
}

function customerDisplayName(customer: Customer): string {
  return customer.cn_name || customer.en_name || customer.code
}

function customerOptionLabel(customer: Customer): string {
  return [customer.code, customerDisplayName(customer), customer.country].filter(Boolean).join(' / ')
}

function renderCustomerOptions(customers: Customer[]): ReactNode {
  return customers.map((customer) => {
    const label = customerOptionLabel(customer)
    return (
      <Select.Option key={customer.id} value={customer.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

function productOptionLabel(product: Product): string {
  return [product.code, product.cn_name, product.en_name].filter(Boolean).join(' / ')
}

function renderProductOptions(products: Product[]): ReactNode {
  return products.map((product) => {
    const label = productOptionLabel(product)
    return (
      <Select.Option key={product.id} value={product.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

function supplierOptionLabel(supplier: Supplier): string {
  return [supplier.code, supplier.cn_name, supplier.en_name].filter(Boolean).join(' / ')
}

function renderSupplierOptions(suppliers: Supplier[]): ReactNode {
  return suppliers.map((supplier) => {
    const label = supplierOptionLabel(supplier)
    return (
      <Select.Option key={supplier.id} value={supplier.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

function assignableUserOptionLabel(user: AssignableUser): string {
  return [user.display_name, user.username, user.department_name].filter(Boolean).join(' / ')
}

function renderAssignableUserOptions(users: AssignableUser[]): ReactNode {
  return users.map((user) => {
    const label = assignableUserOptionLabel(user)
    return (
      <Select.Option key={user.id} value={user.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

function mergePurchaseLineRemark(current: string, addition: string): string {
  if (!current.trim()) return addition
  if (current.includes(addition)) return current
  return `${current}; ${addition}`
}


export function ExportQuotationsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [quotations, setQuotations] = useState<ExportQuotation[]>([])
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [history, setHistory] = useState<ExportQuotation[]>([])
  const [purchaseReferences, setPurchaseReferences] = useState<ExportQuotationPurchaseReference[]>([])
  const [sampleDeliveries, setSampleDeliveries] = useState<SampleDelivery[]>([])
  const [exportPreview, setExportPreview] = useState('')
  const [generatedContract, setGeneratedContract] = useState<ExportQuotationContract | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<ExportQuotationFormState>(() => initialExportQuotationForm())
  const [approveForm, setApproveForm] = useState<ExportQuotationApproveFormState>(() =>
    initialExportQuotationApproveForm(),
  )
  const [contractForm, setContractForm] = useState<ExportQuotationContractFormState>(() =>
    initialExportQuotationContractForm(),
  )

  const selectedQuotation = useMemo(
    () => {
      if (detailId) return quotations.find((item) => item.id === detailId) ?? null
      return quotations.find((item) => item.id === selectedQuotationId) ?? quotations[0] ?? null
    },
    [detailId, quotations, selectedQuotationId],
  )

  useEffect(() => {
    void loadQuotations()
    void loadQuotationCustomerOptions()
  }, [])

  useEffect(() => {
    if (!detailId) {
      setHistory([])
      setPurchaseReferences([])
      setSampleDeliveries([])
      return
    }
    syncExportQuotationActionForms(selectedQuotation)
    void loadSelectedQuotationReferences(selectedQuotation)
  }, [detailId, selectedQuotation?.id, selectedQuotation?.approval_status])

  useEffect(() => {
    if (detailId && quotations.length > 0 && !quotations.some((item) => item.id === detailId)) {
      onNavigate(exportQuotationPath)
    }
  }, [detailId, onNavigate, quotations])

  async function loadQuotations(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listExportQuotations({
        q: search.trim() || undefined,
        approval_status: statusFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
      })
      setQuotations(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedQuotationId) ? selectedQuotationId : null) ??
        result.items[0]?.id ??
        null
      setSelectedQuotationId(nextSelectedId)
    } catch (caught) {
      showError(caught, '出口报价加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadQuotationCustomerOptions() {
    setLoadingCustomers(true)
    try {
      const result = await listCustomers()
      setCustomers(result.items)
    } catch (caught) {
      showError(caught, '客户资料加载失败')
    } finally {
      setLoadingCustomers(false)
    }
  }

  function applyCustomerToQuotationForm(customerId?: string) {
    const customer = customers.find((item) => item.id === customerId)
    setForm((current) => ({
      ...current,
      customer_id: customer?.id ?? '',
      customer_name: customer ? customerDisplayName(customer) : '',
    }))
  }

  async function loadSelectedQuotationReferences(quotation: ExportQuotation | null) {
    const line = quotation?.lines[0]
    if (!quotation) {
      setHistory([])
      setPurchaseReferences([])
      setSampleDeliveries([])
      return
    }
    try {
      const [historyResult, referenceResult, deliveryResult] = await Promise.all([
        getExportQuotationHistory({
          customer_id: quotation.customer_id ?? undefined,
          product_id: line?.product_id ?? undefined,
        }),
        getExportQuotationPurchaseReferences({
          product_id: line?.product_id ?? undefined,
        }),
        getExportQuotationSampleDeliveries(quotation.id),
      ])
      setHistory(historyResult.items)
      setPurchaseReferences(referenceResult.items)
      setSampleDeliveries(deliveryResult.items)
    } catch (caught) {
      showError(caught, '报价参考资料加载失败')
    }
  }

  function syncExportQuotationActionForms(quotation: ExportQuotation | null) {
    setApproveForm({
      reviewer_name: '演示业务主管',
      approved_at: quotation?.quote_date ?? todayInputValue(),
    })
    setContractForm({
      confirmed_at: quotation?.approved_at ?? todayInputValue(),
      contract_no: quotation?.generated_contract_no ?? `EC-${quotation?.code ?? Date.now().toString().slice(-6)}`,
    })
  }

  function upsertQuotation(quotation: ExportQuotation) {
    setQuotations((current) => {
      const exists = current.some((item) => item.id === quotation.id)
      return exists
        ? current.map((item) => (item.id === quotation.id ? quotation : item))
        : [quotation, ...current]
    })
    setSelectedQuotationId(quotation.id)
  }

  function openQuotationDetail(quotation: ExportQuotation) {
    setSelectedQuotationId(quotation.id)
    onNavigate(moduleDetailPath(exportQuotationPath, quotation.id))
  }

  function stopAndOpenQuotationDetail(event: MouseEvent<HTMLElement>, quotation: ExportQuotation) {
    event.stopPropagation()
    openQuotationDetail(quotation)
  }

  function loadQuotationIntoForm(quotation: ExportQuotation) {
    setSelectedQuotationId(quotation.id)
    setForm(exportQuotationToForm(quotation))
    onNavigate(exportQuotationPath)
  }

  async function submitQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    setExportPreview('')
    try {
      const created = await createExportQuotation(exportQuotationPayload(form))
      setMessage(`已新增出口报价 ${created.code}`)
      setForm(initialExportQuotationForm())
      upsertQuotation(created)
      await loadQuotations(created.id)
      setQuotations((current) =>
        current.some((quotation) => quotation.id === created.id) ? current : [created, ...current],
      )
      setSelectedQuotationId(created.id)
    } catch (caught) {
      showError(caught, '出口报价新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function saveQuotationDraft() {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updated = await updateExportQuotation(selectedQuotation.id, exportQuotationPayload(form))
      setMessage(`已保存出口报价 ${updated.code}`)
      upsertQuotation(updated)
      await loadQuotations(updated.id)
    } catch (caught) {
      showError(caught, '出口报价草稿保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitQuotationForApproval() {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitExportQuotation(selectedQuotation.id)
      setMessage(`已提交出口报价 ${submitted.code}`)
      upsertQuotation(submitted)
      await loadQuotations(submitted.id)
    } catch (caught) {
      showError(caught, '出口报价提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveQuotation() {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveExportQuotation(
        selectedQuotation.id,
        exportQuotationApprovePayload(approveForm),
      )
      setMessage(`已审批出口报价 ${approved.code}`)
      upsertQuotation(approved)
      await loadQuotations(approved.id)
    } catch (caught) {
      showError(caught, '出口报价审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function exportQuotation(format: 'pdf' | 'excel') {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const result = await exportExportQuotation(selectedQuotation.id, format)
      setExportPreview(result.content.split('\n').slice(0, 10).join('\n'))
      setMessage(`已生成导出预览 ${result.filename}`)
    } catch (caught) {
      showError(caught, '出口报价导出失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const contract = await confirmExportQuotationContract(
        selectedQuotation.id,
        exportQuotationContractPayload(contractForm),
      )
      setGeneratedContract(contract)
      setMessage(`已生成出口合同 ${contract.contract_no}`)
      await loadQuotations(selectedQuotation.id)
    } catch (caught) {
      showError(caught, '出口合同生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = quotations.reduce((sum, item) => sum + Number(item.total_amount), 0)
  const currency = quotations[0]?.currency ?? 'USD'

  return (
    <section className="export-quotation-page">
<div className="summary-strip" aria-label="出口报价概览">
        <Metric label="报价单" value={quotations.length} />
        <Metric label="待审批" value={quotations.filter((item) => item.approval_status === 'submitted').length} />
        <Metric
          label="已审批"
          value={quotations.filter((item) => ['approved', 'contract_generated'].includes(item.approval_status)).length}
        />
        <Metric label="报价金额" value={formatMoney(totalAmount.toFixed(2), currency)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid export-quotation-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="报价单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadQuotations()
              }}
            >
              <label>
                报价搜索
                <Input
                  value={search}
                  placeholder="单号 / 客户 / 产品 / 条款"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                审批状态
              <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {exportQuotationStatusOptions
                  .filter((item) => item.value !== 'rejected')
                  .map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
              </FormSelect>
              </label>
              <label>
                客户筛选
                <Select
                  allowClear
                  showSearch
                  loading={loadingCustomers}
                  value={customerFilter || undefined}
                  placeholder="从客户资料筛选"
                  optionFilterProp="label"
                  notFoundContent={loadingCustomers ? '加载客户资料中' : '暂无客户资料'}
                  onChange={(value) => setCustomerFilter(value ?? '')}
                >
                  {renderCustomerOptions(customers)}
                </Select>
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>

          <Table<ExportQuotation>
            columns={[
              {
                title: '报价单号',
                dataIndex: 'code',
                render: (value: string, record: ExportQuotation) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenQuotationDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'approval_status', render: exportQuotationStatusLabel },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '贸易条款', dataIndex: 'trade_term' },
              {
                title: '金额',
                dataIndex: 'total_amount',
                render: (_, quotation) => formatMoney(quotation.total_amount, quotation.currency),
              },
              { title: '合同', dataIndex: 'generated_contract_no', render: nullableText },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: ExportQuotation) => (
                  <Button size="small" onClick={(event) => stopAndOpenQuotationDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={quotations}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedQuotation?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedQuotationId(record.id),
            })}
          />
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel form-panel product-form-panel">
          <PanelTitle icon={<LayoutDashboard size={18} />} title="新增出口报价" />
          <form className="record-form" onSubmit={submitQuotation}>
            <div className="form-pair two">
              <label>
                报价单号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                报价日期
                <Input
                  type="date"
                  value={form.quote_date}
                  onChange={(event) => setForm({ ...form, quote_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                选择客户
                <Select
                  allowClear
                  showSearch
                  loading={loadingCustomers}
                  value={form.customer_id || undefined}
                  placeholder={customers.length > 0 ? '从客户资料选择' : '请先在客户资料录入'}
                  optionFilterProp="label"
                  notFoundContent={loadingCustomers ? '加载客户资料中' : '暂无客户资料'}
                  onChange={applyCustomerToQuotationForm}
                >
                  {renderCustomerOptions(customers)}
                </Select>
              </label>
              <label>
                客户标识
                <Input value={form.customer_id} readOnly placeholder="选择客户后自动带出" />
              </label>
            </div>
            <label>
              客户名称
              <Input value={form.customer_name} readOnly placeholder="选择客户后自动带出" />
            </label>
            <div className="form-pair two">
              <label>
                业务员
                <Input
                  value={form.sales_user_name}
                  onChange={(event) => setForm({ ...form, sales_user_name: event.target.value })}
                />
              </label>
              <label>
                币种
                <Input
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                贸易条款
                <Input
                  value={form.trade_term}
                  onChange={(event) => setForm({ ...form, trade_term: event.target.value })}
                />
              </label>
              <label>
                有效期
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(event) => setForm({ ...form, valid_until: event.target.value })}
                />
              </label>
            </div>
            <label>
              报价描述
              <Input.TextArea
                rows={2}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <div className="form-divider">报价商品明细</div>
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
            <div className="form-pair three">
              <label>
                数量
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
              <label>
                销售单价
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.unit_price}
                  onChange={(event) => setForm({ ...form, unit_price: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                货运方式
                <FormSelect
                value={form.freight_method}
                onChange={(event) => setForm({ ...form, freight_method: event.target.value })}
              >
                {freightMethodOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
              <label>
                运费
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.freight_amount}
                  onChange={(event) => setForm({ ...form, freight_amount: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                采购参考供应商
                <Input
                  value={form.purchase_reference_supplier_name}
                  onChange={(event) =>
                    setForm({ ...form, purchase_reference_supplier_name: event.target.value })
                  }
                />
              </label>
              <label>
                采购参考价
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={form.purchase_reference_price}
                  onChange={(event) => setForm({ ...form, purchase_reference_price: event.target.value })}
                />
              </label>
            </div>
            <label>
              明细备注
              <Input
                value={form.line_remark}
                onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              新增出口报价
            </Button>
            <Button
              disabled={!selectedQuotation || selectedQuotation.approval_status !== 'draft'}
              loading={submitting}
              onClick={() => void saveQuotationDraft()}
            >
              保存草稿编辑
            </Button>
          </form>
          </section>
        ) : null}

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="报价单明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(exportQuotationPath)}>
              返回列表
            </Button>
          </div>
          {selectedQuotation ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/日期</dt>
                  <dd>{exportQuotationStatusLabel(selectedQuotation.approval_status)} / {formatDate(selectedQuotation.quote_date)}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedQuotation.customer_name}</dd>
                </div>
                <div>
                  <dt>业务员</dt>
                  <dd>{selectedQuotation.sales_user_name ?? '未填'}</dd>
                </div>
                <div>
                  <dt>贸易条款</dt>
                  <dd>{selectedQuotation.trade_term}</dd>
                </div>
                <div>
                  <dt>报价金额</dt>
                  <dd>{formatMoney(selectedQuotation.total_amount, selectedQuotation.currency)}</dd>
                </div>
                <div>
                  <dt>审核人</dt>
                  <dd>{selectedQuotation.reviewer_name ?? '未审批'}</dd>
                </div>
                <div>
                  <dt>合同号</dt>
                  <dd>{selectedQuotation.generated_contract_no ?? generatedContract?.contract_no ?? '未生成'}</dd>
                </div>
                <div>
                  <dt>有效期</dt>
                  <dd>{formatDate(selectedQuotation.valid_until)}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>报价描述</strong>
                <p>{selectedQuotation.description ?? '未填写报价描述'}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedQuotation.approval_status !== 'draft'}
                  onClick={() => loadQuotationIntoForm(selectedQuotation)}
                >
                  载入编辑
                </Button>
                <Button
                  disabled={selectedQuotation.approval_status !== 'draft'}
                  loading={submitting}
                  onClick={() => void submitQuotationForApproval()}
                >
                  提交审批
                </Button>
                <Button
                  disabled={selectedQuotation.approval_status !== 'submitted'}
                  loading={submitting}
                  type="primary"
                  onClick={() => void approveQuotation()}
                >
                  审批通过
                </Button>
                <Button loading={submitting} onClick={() => void exportQuotation('pdf')}>
                  导出 PDF
                </Button>
              </div>

              <form className="record-form accessory-form" onSubmit={confirmContract}>
                <div className="form-divider">报价确认生成出口合同</div>
                <div className="form-pair two">
                  <label>
                    确认日期
                    <Input
                      type="date"
                      value={contractForm.confirmed_at}
                      onChange={(event) =>
                        setContractForm({ ...contractForm, confirmed_at: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    合同号
                    <Input
                      value={contractForm.contract_no}
                      onChange={(event) => setContractForm({ ...contractForm, contract_no: event.target.value })}
                    />
                  </label>
                </div>
                <Button
                  htmlType="submit"
                  loading={submitting}
                  disabled={!['approved', 'contract_generated'].includes(selectedQuotation.approval_status)}
                >
                  生成出口合同
                </Button>
              </form>

              {generatedContract ? (
                <div className="transaction-box">
                  <strong>已生成出口合同</strong>
                  <p>{generatedContract.contract_no} / {formatMoney(generatedContract.total_amount, generatedContract.currency)}</p>
                </div>
              ) : null}

              {exportPreview ? (
                <div className="transaction-box export-preview">
                  <strong>导出预览</strong>
                  <pre>{exportPreview}</pre>
                </div>
              ) : null}

              <Table<ExportQuotationLine>
                className="compact-section"
                columns={[
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '规格', dataIndex: 'specification', render: nullableText },
                  { title: '型号', dataIndex: 'model', render: nullableText },
                  { title: '数量', dataIndex: 'quantity', render: (_, line) => `${line.quantity} ${line.unit}` },
                  { title: '销售单价', dataIndex: 'unit_price' },
                  { title: '金额', dataIndex: 'amount' },
                  { title: '货运方式', dataIndex: 'freight_method', render: freightMethodLabel },
                  { title: '运费', dataIndex: 'freight_amount' },
                ]}
                dataSource={selectedQuotation.lines}
                locale={{ emptyText: '暂无报价商品明细' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>历史报价</strong>
                <span>{history.length} 条</span>
              </div>
              <Table<ExportQuotation>
                columns={[
                  { title: '报价单', dataIndex: 'code' },
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '日期', dataIndex: 'quote_date', render: formatDate },
                  { title: '状态', dataIndex: 'approval_status', render: exportQuotationStatusLabel },
                  {
                    title: '金额',
                    dataIndex: 'total_amount',
                    render: (_, quotation) => formatMoney(quotation.total_amount, quotation.currency),
                  },
                ]}
                dataSource={history}
                locale={{ emptyText: '暂无历史报价' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>采购询价参考</strong>
                <span>{purchaseReferences.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>供应商</th>
                    <th>参考价</th>
                    <th>日期</th>
                    <th>来源单号</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseReferences.map((item) => (
                    <tr key={`${item.source_quotation_no}-${item.supplier_name}`}>
                      <td>{item.supplier_name}</td>
                      <td>{formatMoney(item.reference_price, item.currency)}</td>
                      <td>{formatDate(item.quote_date)}</td>
                      <td>{item.source_quotation_no}</td>
                    </tr>
                  ))}
                  {purchaseReferences.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={4}>暂无采购询价参考</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>寄样关联</strong>
                <span>{sampleDeliveries.length} 条</span>
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
                dataSource={sampleDeliveries}
                locale={{ emptyText: '暂无寄样关联' }}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FileText size={28} />
              <strong>暂无出口报价</strong>
              <span>请返回列表选择报价单查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


