import { Alert, Button, Input, Modal, Table, Tag as _Tag, Select } from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, FileText } from 'lucide-react'
import type { FormEvent, MouseEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  approveExportQuotation,
  confirmExportQuotationContract,
  createExportQuotation,
  exportExportQuotation,
  getExportQuotationHistory,
  getExportQuotationPurchaseReferences,
  getExportQuotationSampleDeliveries,
  listExportQuotations,
  submitExportQuotation,
  updateExportQuotation,
  type CurrentUser,
  type ExportQuotation,
  type ExportQuotationApprovePayload,
  type ExportQuotationConfirmContractPayload,
  type ExportQuotationContract,
  type ExportQuotationCreatePayload,
  type ExportQuotationLine,
  type ExportQuotationListSummary,
  type ExportQuotationPurchaseReference,
  type Customer,
  type Product,
  AssignableUser,
  SampleDelivery,
  Supplier,
  listCustomers,
} from '@/api'
import { exportQuotationPath, moduleDetailPath } from '@/app/routes'
import { FormSelect, ListPageShell, Metric, PanelTitle } from '@/shared/ui'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { showError } from '@/shared/errors'
import { downloadCsv as _downloadCsv } from '@/shared/print'
import {
  exportQuotationStatusOptions,
  freightMethodOptions,
  sampleDeliveryStatusOptions,
} from '@/shared/formOptions'
import {
  canApproveAssignedRecord,
  formatDate,
  formatMoney,
  formatPercent as _formatPercent,
  nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'

function sampleDeliveryStatusLabel(value: string): string {
  const option = sampleDeliveryStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
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
}

function initialExportQuotationForm(): ExportQuotationFormState {
  return {
    code: '',
    quote_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    sales_user_id: '',
    sales_user_name: '',
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
    reviewer_name: '',
    approved_at: todayInputValue(),
  }
}

function initialExportQuotationContractForm(): ExportQuotationContractFormState {
  return {
    confirmed_at: todayInputValue(),
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
  }
}

function exportQuotationStatusLabel(value: string): string {
  const option = exportQuotationStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function freightMethodLabel(value: string): string {
  const option = freightMethodOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function customerDisplayName(customer: Customer): string {
  return customer.cn_name || customer.en_name || customer.code
}

function customerOptionLabel(customer: Customer): string {
  return [customer.code, customerDisplayName(customer), customer.country]
    .filter(Boolean)
    .join(' / ')
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

function _renderProductOptions(products: Product[]): ReactNode {
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

function _renderSupplierOptions(suppliers: Supplier[]): ReactNode {
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

function _renderAssignableUserOptions(users: AssignableUser[]): ReactNode {
  return users.map((user) => {
    const label = assignableUserOptionLabel(user)
    return (
      <Select.Option key={user.id} value={user.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

function _mergePurchaseLineRemark(current: string, addition: string): string {
  if (!current.trim()) return addition
  if (current.includes(addition)) return current
  return `${current}; ${addition}`
}

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function ExportQuotationsPage({ currentUser, detailId, onNavigate }: Props) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const [quotations, setQuotations] = useState<ExportQuotation[]>([])
  const [summary, setSummary] = useState<ExportQuotationListSummary>({
    submitted_count: 0,
    approved_count: 0,
    total_amount: '0',
    currency: null,
  })
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => urlQuery.params.get('status') ?? '')
  const [customerFilter, setCustomerFilter] = useState(() => urlQuery.params.get('customer') ?? '')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [history, setHistory] = useState<ExportQuotation[]>([])
  const [purchaseReferences, setPurchaseReferences] = useState<ExportQuotationPurchaseReference[]>(
    [],
  )
  const [sampleDeliveries, setSampleDeliveries] = useState<SampleDelivery[]>([])
  const [exportPreview, setExportPreview] = useState('')
  const [generatedContract, setGeneratedContract] = useState<ExportQuotationContract | null>(null)
  const [loading, setLoading] = useState(false)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<ExportQuotationFormState>(() => initialExportQuotationForm())
  const [formOpen, setFormOpen] = useState(false)
  const [reviewerId, setReviewerId] = useState('')
  const [approveForm, setApproveForm] = useState<ExportQuotationApproveFormState>(() =>
    initialExportQuotationApproveForm(),
  )
  const [contractForm, setContractForm] = useState<ExportQuotationContractFormState>(() =>
    initialExportQuotationContractForm(),
  )

  const selectedQuotation = useMemo(() => {
    if (detailId) return quotations.find((item) => item.id === detailId) ?? null
    return quotations.find((item) => item.id === selectedQuotationId) ?? quotations[0] ?? null
  }, [detailId, quotations, selectedQuotationId])

  useEffect(() => {
    void loadQuotations()
    void loadQuotationCustomerOptions()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    setSearch(urlQuery.params.get('q') ?? '')
    setStatusFilter(urlQuery.params.get('status') ?? '')
    setCustomerFilter(urlQuery.params.get('customer') ?? '')
    const nextPage = parsePageParam(urlQuery.params)
    const nextFilters = {
      q: urlQuery.params.get('q') ?? '',
      status: urlQuery.params.get('status') ?? '',
      customer: urlQuery.params.get('customer') ?? '',
    }
    setPage(nextPage)
    void loadQuotations(undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    if (!detailId) {
      setHistory([])
      setPurchaseReferences([])
      setSampleDeliveries([])
      return
    }
    syncExportQuotationActionForms(selectedQuotation)
    setReviewerId(selectedQuotation?.reviewer_id ?? '')
    void loadSelectedQuotationReferences(selectedQuotation)
  }, [detailId, selectedQuotation?.id, selectedQuotation?.approval_status])

  useEffect(() => {
    if (detailId && quotations.length > 0 && !quotations.some((item) => item.id === detailId)) {
      onNavigate(exportQuotationPath)
    }
  }, [detailId, onNavigate, quotations])

  async function loadQuotations(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: { q: string; status: string; customer: string },
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    const resolvedQ = filtersOverride?.q ?? search
    const resolvedStatus = filtersOverride?.status ?? statusFilter
    const resolvedCustomer = filtersOverride?.customer ?? customerFilter
    setLoading(true)
    try {
      const result = await listExportQuotations({
        q: resolvedQ.trim() || undefined,
        approval_status: resolvedStatus || undefined,
        customer_id: resolvedCustomer.trim() || undefined,
        limit: resolvedPageSize,
        offset: (resolvedPage - 1) * resolvedPageSize,
      })
      setTotal(result.total)
      setSummary(result.summary)
      if (result.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadQuotations(preferredId, prevPage, resolvedPageSize, filtersOverride)
        return
      }
      setQuotations(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedQuotationId)
          ? selectedQuotationId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedQuotationId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('sales.quotation.list.loadFailed'))
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
      showError(caught, t('sales.quotation.list.customerLoadFailed'))
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
      showError(caught, t('sales.quotation.list.referenceLoadFailed'))
    }
  }

  function syncExportQuotationActionForms(quotation: ExportQuotation | null) {
    setApproveForm({
      reviewer_name: '',
      approved_at: quotation?.quote_date ?? todayInputValue(),
    })
    setContractForm({
      confirmed_at: quotation?.approved_at ?? todayInputValue(),
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
    setFormOpen(true)
    onNavigate(exportQuotationPath)
  }

  function openNewQuotationForm() {
    setForm(initialExportQuotationForm())
    setFormOpen(true)
  }

  async function submitQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setExportPreview('')
    try {
      const created = await createExportQuotation(exportQuotationPayload(form))
      setMessage(t('sales.quotation.message.created', { code: created.code }))
      setForm(initialExportQuotationForm())
      upsertQuotation(created)
      await loadQuotations(created.id)
      setQuotations((current) =>
        current.some((quotation) => quotation.id === created.id) ? current : [created, ...current],
      )
      setSelectedQuotationId(created.id)
      setFormOpen(false)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function saveQuotationDraft() {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    try {
      const updated = await updateExportQuotation(
        selectedQuotation.id,
        exportQuotationPayload(form),
      )
      setMessage(t('sales.quotation.message.saved', { code: updated.code }))
      upsertQuotation(updated)
      await loadQuotations(updated.id)
      setFormOpen(false)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitQuotationForApproval() {
    if (!selectedQuotation) return
    if (!reviewerId) {
      showError(new Error(t('sales.quotation.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const submitted = await submitExportQuotation(selectedQuotation.id, {
        reviewer_id: reviewerId,
      })
      setMessage(t('sales.quotation.message.submitted', { code: submitted.code }))
      upsertQuotation(submitted)
      await loadQuotations(submitted.id)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function approveQuotation() {
    if (!selectedQuotation) return
    if (
      !canApproveAssignedRecord(
        currentUser,
        selectedQuotation.reviewer_id,
        'sales:quotation:approve',
      )
    ) {
      showError(
        new Error(
          t('sales.quotation.action.approverMismatch', {
            name:
              selectedQuotation.reviewer_name ??
              t('sales.quotation.action.defaultReviewer'),
          }),
        ),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const approved = await approveExportQuotation(
        selectedQuotation.id,
        exportQuotationApprovePayload(approveForm),
      )
      setMessage(t('sales.quotation.message.approved', { code: approved.code }))
      upsertQuotation(approved)
      await loadQuotations(approved.id)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function exportQuotation(format: 'pdf' | 'excel') {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    try {
      const result = await exportExportQuotation(selectedQuotation.id, format)
      setExportPreview(result.content.split('\n').slice(0, 10).join('\n'))
      setMessage(t('sales.quotation.message.exportPreview', { filename: result.filename }))
    } catch (caught) {
      showError(caught, t('sales.quotation.message.exportFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    try {
      const contract = await confirmExportQuotationContract(
        selectedQuotation.id,
        exportQuotationContractPayload(contractForm),
      )
      setGeneratedContract(contract)
      setMessage(t('sales.quotation.message.contractGenerated', { contractNo: contract.contract_no }))
      await loadQuotations(selectedQuotation.id)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.contractGenerateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = Number(summary.total_amount)
  const currency = summary.currency ?? 'USD'

  return (
    <section className="export-quotation-page">
      <div className="summary-strip" aria-label={t('sales.quotation.metric.overviewAria')}>
        <Metric label={t('sales.quotation.metric.quotationCount')} value={total} />
        <Metric
          label={t('sales.quotation.metric.pendingApproval')}
          value={summary.submitted_count}
        />
        <Metric
          label={t('sales.quotation.metric.approvedCount')}
          value={summary.approved_count}
        />
        <Metric
          label={t('sales.quotation.metric.quotationAmount')}
          value={formatMoney(totalAmount.toFixed(2), currency)}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid export-quotation-grid">
        {!detailId ? (
          <ListPageShell
            className="product-list-panel"
            icon={<Search size={18} />}
            title={t('sales.quotation.list.title')}
            toolbar={<form
              className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  setPage(1)
                  appliedUrlSearchRef.current = urlQuery.update({
                    q: search.trim(),
                    status: statusFilter,
                    customer: customerFilter,
                    page: null,
                  })
                  void loadQuotations(undefined, 1)
                }}
              >
                <label>
                  {t('sales.quotation.list.searchLabel')}
                  <Input
                    value={search}
                    placeholder={t('sales.quotation.list.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('sales.quotation.list.statusFilter')}
                  <FormSelect
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('sales.quotation.list.allStatuses')}</option>
                    {exportQuotationStatusOptions
                      .filter((item) => item.value !== 'rejected')
                      .map((item) => (
                        <option key={item.value} value={item.value}>
                          {t(item.labelKey)}
                        </option>
                      ))}
                  </FormSelect>
                </label>
                <label>
                  {t('sales.quotation.list.customerFilter')}
                  <Select
                    allowClear
                    showSearch
                    loading={loadingCustomers}
                    value={customerFilter || undefined}
                    placeholder={t('sales.quotation.list.customerFilterPlaceholder')}
                    optionFilterProp="label"
                    notFoundContent={
                      loadingCustomers
                        ? t('sales.quotation.list.loadingCustomers')
                        : t('sales.quotation.list.noCustomers')
                    }
                    onChange={(value) => setCustomerFilter(value ?? '')}
                  >
                    {renderCustomerOptions(customers)}
                  </Select>
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('sales.quotation.list.query')}
                </Button>
                <Button icon={<Plus size={16} />} type="primary" onClick={openNewQuotationForm}>
                  {t('sales.quotation.list.create')}
                </Button>
            </form>}

          >
            <Table<ExportQuotation>
              columns={[
                {
                  title: t('sales.quotation.field.code'),
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
                {
                  title: t('sales.quotation.field.status'),
                  dataIndex: 'approval_status',
                  render: exportQuotationStatusLabel,
                },
                { title: t('sales.quotation.field.customer'), dataIndex: 'customer_name' },
                { title: t('sales.quotation.field.tradeTerm'), dataIndex: 'trade_term' },
                {
                  title: t('sales.quotation.field.amount'),
                  dataIndex: 'total_amount',
                  render: (_, quotation) => formatMoney(quotation.total_amount, quotation.currency),
                },
                {
                  title: t('sales.quotation.field.contract'),
                  dataIndex: 'generated_contract_no',
                  render: nullableText,
                },
                {
                  title: t('sales.quotation.field.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: ExportQuotation) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenQuotationDetail(event, record)}
                    >
                      {t('sales.quotation.action.viewDetail')}
                    </Button>
                  ),
                },
              ]}
              dataSource={quotations}
              loading={loading}
              pagination={{
                ...pagination,
                onChange: (nextPage, nextPageSize) => {
                  const next = changePage(nextPage, nextPageSize)
                  appliedUrlSearchRef.current = urlQuery.update({
                    page: next.page === 1 ? null : next.page,
                  })
                  void loadQuotations(undefined, next.page, next.pageSize)
                },
              }}
              rowClassName={(record) => (record.id === selectedQuotation?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedQuotationId(record.id),
              })}
            />
          </ListPageShell>
        ) : null}

        {!detailId ? (
          <Modal
            destroyOnHidden
            footer={null}
            open={formOpen}
            title={t('sales.quotation.form.title')}
            width={920}
            onCancel={() => setFormOpen(false)}
          >
            <form className="record-form modal-record-form" onSubmit={submitQuotation}>
              <div className="form-pair two">
                <label>
                  {t('sales.quotation.field.code')}
                  <Input
                    readOnly
                    value={form.code}
                    placeholder={t('sales.quotation.form.codeAutoGenerated')}
                  />
                </label>
                <label>
                  {t('sales.quotation.field.quoteDate')}
                  <Input
                    type="date"
                    value={form.quote_date}
                    onChange={(event) => setForm({ ...form, quote_date: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('sales.quotation.form.selectCustomer')}
                  <Select
                    allowClear
                    showSearch
                    loading={loadingCustomers}
                    value={form.customer_id || undefined}
                    placeholder={
                      customers.length > 0
                        ? t('sales.quotation.form.customerSelectPlaceholder')
                        : t('sales.quotation.form.customerMissing')
                    }
                    optionFilterProp="label"
                    notFoundContent={
                      loadingCustomers
                        ? t('sales.quotation.list.loadingCustomers')
                        : t('sales.quotation.list.noCustomers')
                    }
                    onChange={applyCustomerToQuotationForm}
                  >
                    {renderCustomerOptions(customers)}
                  </Select>
                </label>
                <label>
                  {t('sales.quotation.field.customerId')}
                  <Input
                    value={form.customer_id}
                    readOnly
                    placeholder={t('sales.quotation.form.customerNamePlaceholder')}
                  />
                </label>
              </div>
              <label>
                {t('sales.quotation.field.customerName')}
                <Input
                  value={form.customer_name}
                  readOnly
                  placeholder={t('sales.quotation.form.customerNamePlaceholder')}
                />
              </label>
              <div className="form-pair two">
                <label>
                  {t('sales.quotation.field.salesperson')}
                  <Input
                    value={form.sales_user_name}
                    onChange={(event) => setForm({ ...form, sales_user_name: event.target.value })}
                  />
                </label>
                <label>
                  {t('sales.quotation.field.currency')}
                  <Input
                    value={form.currency}
                    onChange={(event) => setForm({ ...form, currency: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('sales.quotation.field.tradeTerm')}
                  <Input
                    value={form.trade_term}
                    onChange={(event) => setForm({ ...form, trade_term: event.target.value })}
                  />
                </label>
                <label>
                  {t('sales.quotation.field.validUntil')}
                  <Input
                    type="date"
                    value={form.valid_until}
                    onChange={(event) => setForm({ ...form, valid_until: event.target.value })}
                  />
                </label>
              </div>
              <label>
                {t('sales.quotation.field.description')}
                <Input.TextArea
                  rows={2}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </label>
              <div className="form-divider">{t('sales.quotation.form.linesTitle')}</div>
              <div className="form-pair two">
                <label>
                  {t('sales.quotation.field.productId')}
                  <Input
                    value={form.product_id}
                    onChange={(event) => setForm({ ...form, product_id: event.target.value })}
                  />
                </label>
                <label>
                  {t('sales.quotation.field.productCode')}
                  <Input
                    value={form.product_code}
                    onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                  />
                </label>
              </div>
              <label>
                {t('sales.quotation.field.productName')}
                <Input
                  value={form.product_name}
                  onChange={(event) => setForm({ ...form, product_name: event.target.value })}
                />
              </label>
              <div className="form-pair two">
                <label>
                  {t('sales.quotation.field.specification')}
                  <Input
                    value={form.specification}
                    onChange={(event) => setForm({ ...form, specification: event.target.value })}
                  />
                </label>
                <label>
                  {t('sales.quotation.field.model')}
                  <Input
                    value={form.model}
                    onChange={(event) => setForm({ ...form, model: event.target.value })}
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  {t('sales.quotation.field.quantity')}
                  <Input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={form.quantity}
                    onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                  />
                </label>
                <label>
                  {t('sales.quotation.field.unit')}
                  <Input
                    value={form.unit}
                    onChange={(event) => setForm({ ...form, unit: event.target.value })}
                  />
                </label>
                <label>
                  {t('sales.quotation.field.unitPrice')}
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
                  {t('sales.quotation.field.freightMethod')}
                  <FormSelect
                    value={form.freight_method}
                    onChange={(event) => setForm({ ...form, freight_method: event.target.value })}
                  >
                    {freightMethodOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('sales.quotation.field.freightAmount')}
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
                  {t('sales.quotation.field.purchaseReferenceSupplier')}
                  <Input
                    value={form.purchase_reference_supplier_name}
                    onChange={(event) =>
                      setForm({ ...form, purchase_reference_supplier_name: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t('sales.quotation.field.purchaseReferencePrice')}
                  <Input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={form.purchase_reference_price}
                    onChange={(event) =>
                      setForm({ ...form, purchase_reference_price: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                {t('sales.quotation.field.lineRemark')}
                <Input
                  value={form.line_remark}
                  onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
                />
              </label>
              <div className="modal-actions">
                <Button onClick={() => setFormOpen(false)}>{t('common.cancel')}</Button>
                <Button
                  disabled={!selectedQuotation || selectedQuotation.approval_status !== 'draft'}
                  loading={submitting}
                  onClick={() => void saveQuotationDraft()}
                >
                  {t('sales.quotation.action.saveDraft')}
                </Button>
                <Button htmlType="submit" loading={submitting} type="primary">
                  {t('sales.quotation.action.create')}
                </Button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('sales.quotation.detail.title')}
              />
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => onNavigate(exportQuotationPath)}
              >
                {t('sales.quotation.action.backToList')}
              </Button>
            </div>
            {selectedQuotation ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('sales.quotation.detail.statusDate')}</dt>
                    <dd>
                      {exportQuotationStatusLabel(selectedQuotation.approval_status)} /{' '}
                      {formatDate(selectedQuotation.quote_date)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sales.quotation.field.customer')}</dt>
                    <dd>{selectedQuotation.customer_name}</dd>
                  </div>
                  <div>
                    <dt>{t('sales.quotation.field.salesperson')}</dt>
                    <dd>{selectedQuotation.sales_user_name ?? t('sales.quotation.detail.notFilled')}</dd>
                  </div>
                  <div>
                    <dt>{t('sales.quotation.field.tradeTerm')}</dt>
                    <dd>{selectedQuotation.trade_term}</dd>
                  </div>
                  <div>
                    <dt>{t('sales.quotation.metric.quotationAmount')}</dt>
                    <dd>
                      {formatMoney(selectedQuotation.total_amount, selectedQuotation.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sales.quotation.field.reviewer')}</dt>
                    <dd>{selectedQuotation.reviewer_name ?? t('sales.quotation.detail.notApproved')}</dd>
                  </div>
                  <div>
                    <dt>{t('sales.quotation.field.contractNo')}</dt>
                    <dd>
                      {selectedQuotation.generated_contract_no ??
                        generatedContract?.contract_no ??
                        t('sales.quotation.detail.notGenerated')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('sales.quotation.field.validUntil')}</dt>
                    <dd>{formatDate(selectedQuotation.valid_until)}</dd>
                  </div>
                </dl>

                <div className="transaction-box">
                  <strong>{t('sales.quotation.field.description')}</strong>
                  <p>{selectedQuotation.description ?? t('sales.quotation.detail.noDescription')}</p>
                </div>

                <div className="delivery-action-row">
                  <Button
                    disabled={selectedQuotation.approval_status !== 'draft'}
                    onClick={() => loadQuotationIntoForm(selectedQuotation)}
                  >
                    {t('sales.quotation.action.loadForEdit')}
                  </Button>
                  {selectedQuotation.approval_status === 'draft' ? (
                    <ApprovalAssigneeSelect
                      currentUserId={currentUser.id}
                      onChange={setReviewerId}
                      requiredPermission="sales:quotation:approve"
                      value={reviewerId}
                    />
                  ) : null}
                  <Button
                    disabled={selectedQuotation.approval_status !== 'draft' || !reviewerId}
                    loading={submitting}
                    onClick={() => void submitQuotationForApproval()}
                  >
                    {t('sales.quotation.action.submitForApproval')}
                  </Button>
                  <Button
                    disabled={
                      selectedQuotation.approval_status !== 'submitted' ||
                      !canApproveAssignedRecord(
                        currentUser,
                        selectedQuotation.reviewer_id,
                        'sales:quotation:approve',
                      )
                    }
                    loading={submitting}
                    type="primary"
                    onClick={() => void approveQuotation()}
                  >
                    {t('sales.quotation.action.approve')}
                  </Button>
                  <Button loading={submitting} onClick={() => void exportQuotation('pdf')}>
                    {t('sales.quotation.action.exportPdf')}
                  </Button>
                </div>
                {selectedQuotation.approval_status === 'submitted' &&
                !canApproveAssignedRecord(
                  currentUser,
                  selectedQuotation.reviewer_id,
                  'sales:quotation:approve',
                ) ? (
                  <Alert
                    message={t('sales.quotation.action.waitingApproval', {
                      name:
                        selectedQuotation.reviewer_name ??
                        t('sales.quotation.action.defaultReviewer'),
                    })}
                    showIcon
                    type="info"
                  />
                ) : null}

                <form className="record-form accessory-form" onSubmit={confirmContract}>
                  <div className="form-divider">{t('sales.quotation.detail.generateContractTitle')}</div>
                  <div className="form-pair two">
                    <label>
                      {t('sales.quotation.field.confirmedAt')}
                      <Input
                        type="date"
                        value={contractForm.confirmed_at}
                        onChange={(event) =>
                          setContractForm({ ...contractForm, confirmed_at: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sales.quotation.field.contractNo')}
                      <Input
                        readOnly
                        value=""
                        placeholder={t('sales.quotation.form.codeAutoGenerated')}
                      />
                    </label>
                  </div>
                  <Button
                    htmlType="submit"
                    loading={submitting}
                    disabled={
                      !['approved', 'contract_generated'].includes(
                        selectedQuotation.approval_status,
                      )
                    }
                  >
                    {t('sales.quotation.action.generateContract')}
                  </Button>
                </form>

                {generatedContract ? (
                  <div className="transaction-box">
                    <strong>{t('sales.quotation.detail.generatedContract')}</strong>
                    <p>
                      {generatedContract.contract_no} /{' '}
                      {formatMoney(generatedContract.total_amount, generatedContract.currency)}
                    </p>
                  </div>
                ) : null}

                {exportPreview ? (
                  <div className="transaction-box export-preview">
                    <strong>{t('sales.quotation.detail.exportPreview')}</strong>
                    <pre>{exportPreview}</pre>
                  </div>
                ) : null}

                <Table<ExportQuotationLine>
                  className="compact-section"
                  columns={[
                    {
                      title: t('sales.quotation.field.productCode'),
                      dataIndex: 'product_code',
                      render: nullableText,
                    },
                    { title: t('sales.quotation.field.productName'), dataIndex: 'product_name' },
                    {
                      title: t('sales.quotation.field.specification'),
                      dataIndex: 'specification',
                      render: nullableText,
                    },
                    {
                      title: t('sales.quotation.field.model'),
                      dataIndex: 'model',
                      render: nullableText,
                    },
                    {
                      title: t('sales.quotation.field.quantity'),
                      dataIndex: 'quantity',
                      render: (_, line) => `${line.quantity} ${line.unit}`,
                    },
                    { title: t('sales.quotation.field.unitPrice'), dataIndex: 'unit_price' },
                    { title: t('sales.quotation.field.amount'), dataIndex: 'amount' },
                    {
                      title: t('sales.quotation.field.freightMethod'),
                      dataIndex: 'freight_method',
                      render: freightMethodLabel,
                    },
                    { title: t('sales.quotation.field.freightAmount'), dataIndex: 'freight_amount' },
                  ]}
                  dataSource={selectedQuotation.lines}
                  locale={{ emptyText: t('sales.quotation.detail.noLines') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />

                <div className="accessory-heading">
                  <strong>{t('sales.quotation.detail.historyTitle')}</strong>
                  <span>{t('sales.quotation.detail.recordCount', { count: history.length })}</span>
                </div>
                <Table<ExportQuotation>
                  columns={[
                    { title: t('sales.quotation.field.quotation'), dataIndex: 'code' },
                    { title: t('sales.quotation.field.customer'), dataIndex: 'customer_name' },
                    {
                      title: t('sales.quotation.field.date'),
                      dataIndex: 'quote_date',
                      render: formatDate,
                    },
                    {
                      title: t('sales.quotation.field.status'),
                      dataIndex: 'approval_status',
                      render: exportQuotationStatusLabel,
                    },
                    {
                      title: t('sales.quotation.field.amount'),
                      dataIndex: 'total_amount',
                      render: (_, quotation) =>
                        formatMoney(quotation.total_amount, quotation.currency),
                    },
                  ]}
                  dataSource={history}
                  locale={{ emptyText: t('sales.quotation.detail.noHistory') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />

                <div className="accessory-heading">
                  <strong>{t('sales.quotation.detail.purchaseTitle')}</strong>
                  <span>
                    {t('sales.quotation.detail.recordCount', { count: purchaseReferences.length })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('sales.quotation.field.supplier')}</th>
                      <th>{t('sales.quotation.field.referencePrice')}</th>
                      <th>{t('sales.quotation.field.date')}</th>
                      <th>{t('sales.quotation.field.sourceNo')}</th>
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
                        <td className="empty-cell" colSpan={4}>
                          {t('sales.quotation.detail.noPurchase')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('sales.quotation.detail.sampleTitle')}</strong>
                  <span>
                    {t('sales.quotation.detail.recordCount', { count: sampleDeliveries.length })}
                  </span>
                </div>
                <Table<SampleDelivery>
                  columns={[
                    { title: t('sales.quotation.field.sampleDeliveryNo'), dataIndex: 'code' },
                    { title: t('sales.quotation.field.customer'), dataIndex: 'customer_name' },
                    {
                      title: t('sales.quotation.field.date'),
                      dataIndex: 'delivery_date',
                      render: formatDate,
                    },
                    {
                      title: t('sales.quotation.field.status'),
                      dataIndex: 'status',
                      render: sampleDeliveryStatusLabel,
                    },
                    {
                      title: t('sales.quotation.field.express'),
                      dataIndex: 'express_company',
                      render: (_, delivery) =>
                        `${delivery.express_company} / ${delivery.tracking_no ?? t('sales.quotation.detail.notFilled')}`,
                    },
                  ]}
                  dataSource={sampleDeliveries}
                  locale={{ emptyText: t('sales.quotation.detail.noSamples') }}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <FileText size={28} />
                <strong>{t('sales.quotation.detail.emptyTitle')}</strong>
                <span>{t('sales.quotation.detail.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
