import { Alert, Button, Checkbox, Descriptions as _Descriptions, Drawer, Input, Table, Tag as _Tag , Select} from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search , FileStack} from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { addExportContractAdvancePayment, approveExportContract, cancelExportContract, createExportContract, exportExportContract, listExportContracts, registerExportContractSignature, reissueExportContract, submitExportContract, updateExportContract, type AssignableUser, type CurrentUser, type ExportContract, type ExportContractAdvancePayment, type ExportContractLine, type ExportContractSignature, type ExportContractListSummary, type Customer, type Product , ExportContractPurchaseStatus, ExportContractShipmentStatus, ExportQuotation, listAssignableUsers, listCustomers, listProducts, getExportQuotationHistory} from '@/api'
import { exportContractPath, moduleDetailPath } from '@/app/routes'
import { FormModal, FormSelect, ListPageShell, Metric, PanelTitle } from '@/shared/ui'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { showError, showWarningDialog } from '@/shared/errors'
import { downloadCsv as _downloadCsv, openExportContractPrint } from '@/shared/print'
import { exportContractStatusOptions } from '@/shared/formOptions'
import { canApproveAssignedRecord, formatDate, formatMoney, formatPercent as _formatPercent, nullableText, todayInputValue, type RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import { ExportContractFormModal } from './components/ExportContractFormModal'
import {
  contractProgressStatusLabel,
  customerDisplayName,
  customerOptionLabel,
  exportContractAdvancePaymentPayload,
  exportContractApprovePayload,
  exportContractPayload,
  exportContractSignaturePayload,
  exportContractStatusLabel,
  exportContractToForm,
  initialExportContractAdvancePaymentForm,
  initialExportContractApproveForm,
  initialExportContractForm,
  initialExportContractSignatureForm,
  productToContractLine,
  renderCustomerOptions,
  signatureStatusLabel,
  type ExportContractAdvancePaymentFormState,
  type ExportContractApproveFormState,
  type ExportContractFormState,
  type ExportContractLineFormState,
  type ExportContractSignatureFormState,
} from './exportContractHelpers'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function ExportContractsPage({ currentUser, detailId, onNavigate }: Props) {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const [contracts, setContracts] = useState<ExportContract[]>([])
  const [summary, setSummary] = useState<ExportContractListSummary>({
    submitted_count: 0,
    approved_count: 0,
    total_amount: '0',
    advance_payment_amount: '0',
    currency: null,
  })
  const [products, setProducts] = useState<Product[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => urlQuery.params.get('status') ?? '')
  const [customerFilter, setCustomerFilter] = useState(() => urlQuery.params.get('customer') ?? '')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [history, setHistory] = useState<ExportQuotation[]>([])
  const [exportPreview, setExportPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)
  const [assignableUsersLoaded, setAssignableUsersLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [productDrawerOpen, setProductDrawerOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([])
  const [editingContractId, setEditingContractId] = useState<string | null>(null)
  const [form, setForm] = useState<ExportContractFormState>(() => initialExportContractForm(currentUser))
  const [reviewerId, setReviewerId] = useState('')
  const [approveForm, setApproveForm] = useState<ExportContractApproveFormState>(() =>
    initialExportContractApproveForm(),
  )
  const [signatureForm, setSignatureForm] = useState<ExportContractSignatureFormState>(() =>
    initialExportContractSignatureForm(),
  )
  const [advancePaymentForm, setAdvancePaymentForm] =
    useState<ExportContractAdvancePaymentFormState>(() => initialExportContractAdvancePaymentForm())
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')
  const [reissueModalOpen, setReissueModalOpen] = useState(false)
  const [reissueReason, setReissueReason] = useState('')
  const [reissueReasonError, setReissueReasonError] = useState('')

  const selectedContract = useMemo(
    () => {
      if (detailId) return contracts.find((item) => item.id === detailId) ?? null
      return contracts.find((item) => item.id === selectedContractId) ?? contracts[0] ?? null
    },
    [contracts, detailId, selectedContractId],
  )

  const selectedProductIds = useMemo(
    () => new Set(form.lines.map((line) => line.product_id).filter(Boolean)),
    [form.lines],
  )

  const filteredProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLocaleLowerCase()
    if (!normalizedSearch) return products
    return products.filter((product) =>
      [product.code, product.cn_name, product.en_name, product.specification, product.model]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(normalizedSearch)),
    )
  }, [productSearch, products])

  useEffect(() => {
    void loadContracts()
    void loadCustomerOptions()
    void loadProductOptions()
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
    void loadContracts(undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    if (!createModalOpen || assignableUsersLoaded || loadingAssignableUsers) return
    void loadAssignableUsersForContract()
  }, [createModalOpen, assignableUsersLoaded, loadingAssignableUsers])

  useEffect(() => {
    if (!detailId) {
      setHistory([])
      return
    }
    syncExportContractActionForms(selectedContract)
    setReviewerId(selectedContract?.reviewer_id ?? '')
    void loadSelectedContractHistory(selectedContract)
  }, [detailId, selectedContract?.id, selectedContract?.approval_status, selectedContract?.signature_status])

  useEffect(() => {
    if (detailId && contracts.length > 0 && !contracts.some((item) => item.id === detailId)) {
      onNavigate(exportContractPath)
    }
  }, [contracts, detailId, onNavigate])

  async function loadContracts(
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
      const result = await listExportContracts({
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
        await loadContracts(preferredId, prevPage, resolvedPageSize, filtersOverride)
        return
      }
      setContracts(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedContractId) ? selectedContractId : null) ??
        result.items[0]?.id ??
        null
      setSelectedContractId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('sales.contract.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadCustomerOptions() {
    setLoadingCustomers(true)
    try {
      const result = await listCustomers()
      setCustomers(result.items)
    } catch (caught) {
      showError(caught, t('sales.contract.list.customerLoadFailed'))
    } finally {
      setLoadingCustomers(false)
    }
  }

  async function loadProductOptions() {
    setLoadingProducts(true)
    try {
      const result = await listProducts()
      setProducts(result.items)
    } catch (caught) {
      showError(caught, t('sales.contract.list.productLoadFailed'))
    } finally {
      setLoadingProducts(false)
    }
  }

  async function loadAssignableUsersForContract() {
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers('sales:contract:edit')
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, t('sales.contract.list.salesUserLoadFailed'))
    } finally {
      setAssignableUsersLoaded(true)
      setLoadingAssignableUsers(false)
    }
  }

  function applySalesUserToContractForm(userId?: string) {
    const user = userId ? assignableUsers.find((item) => item.id === userId) : null
    setForm((current) => ({
      ...current,
      sales_user_id: user?.id ?? '',
      sales_user_name: user?.display_name ?? '',
    }))
  }

  function applyCustomerToContractForm(customerId?: string) {
    const customer = customers.find((item) => item.id === customerId)
    setForm((current) => ({
      ...current,
      customer_id: customer?.id ?? '',
      customer_name: customer ? customerDisplayName(customer) : '',
    }))
  }

  function openProductDrawer() {
    setProductSearch('')
    setPendingProductIds([])
    setProductDrawerOpen(true)
  }

  function closeProductDrawer() {
    setProductDrawerOpen(false)
    setPendingProductIds([])
  }

  function togglePendingProduct(productId: string, checked: boolean) {
    setPendingProductIds((current) =>
      checked ? [...current, productId] : current.filter((id) => id !== productId),
    )
  }

  function addPendingProducts() {
    const additions = products
      .filter((product) => pendingProductIds.includes(product.id) && !selectedProductIds.has(product.id))
      .map(productToContractLine)
    setForm((current) => ({ ...current, lines: [...current.lines, ...additions] }))
    closeProductDrawer()
  }

  function updateContractLine(
    lineKey: string,
    field: keyof ExportContractLineFormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.key === lineKey ? { ...line, [field]: value } : line)),
    }))
  }

  function removeContractLine(lineKey: string) {
    setForm((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.key !== lineKey),
    }))
  }

  async function loadSelectedContractHistory(contract: ExportContract | null) {
    const line = contract?.lines[0]
    if (!contract) {
      setHistory([])
      return
    }
    try {
      const result = await getExportQuotationHistory({
        customer_id: contract.customer_id ?? undefined,
        product_id: line?.product_id ?? undefined,
      })
      setHistory(result.items)
    } catch (caught) {
      showError(caught, t('sales.contract.detail.historyLoadFailed'))
    }
  }

  function syncExportContractActionForms(contract: ExportContract | null) {
    setApproveForm({
      reviewer_name: contract?.reviewer_name ?? '',
      approved_at: contract?.approved_at ?? todayInputValue(),
    })
    setSignatureForm({
      signed_by: contract?.signatures[0]?.signed_by ?? '',
      signed_at: contract?.customer_signed_at ?? contract?.contract_date ?? todayInputValue(),
      signature_method: contract?.signatures[0]?.signature_method ?? 'email_scan',
      file_no: contract?.signatures[0]?.file_no ?? '',
      remark: contract?.signatures[0]?.remark ?? '',
    })
    setAdvancePaymentForm({
      payment_no: contract
        ? `AR-${contract.code}-${contract.advance_payments.length + 1}`
        : '',
      received_at: todayInputValue(),
      amount: '',
      currency: contract?.currency ?? 'USD',
      payer_name: contract?.customer_name ?? '',
      remark: '',
    })
  }

  function upsertContract(contract: ExportContract) {
    setContracts((current) => {
      const exists = current.some((item) => item.id === contract.id)
      return exists
        ? current.map((item) => (item.id === contract.id ? contract : item))
        : [contract, ...current]
    })
    setSelectedContractId(contract.id)
  }

  function openContractDetail(contract: ExportContract) {
    setSelectedContractId(contract.id)
    onNavigate(moduleDetailPath(exportContractPath, contract.id))
  }

  function stopAndOpenContractDetail(event: MouseEvent<HTMLElement>, contract: ExportContract) {
    event.stopPropagation()
    openContractDetail(contract)
  }

  function loadContractIntoForm(contract: ExportContract) {
    setSelectedContractId(contract.id)
    setEditingContractId(contract.id)
    setForm(exportContractToForm(contract))
    setCreateModalOpen(true)
  }

  function openCreateContractModal() {
    setEditingContractId(null)
    setForm(initialExportContractForm(currentUser))
    closeProductDrawer()
    setCreateModalOpen(true)
  }

  async function submitContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form.lines.length === 0) {
      showWarningDialog(t('sales.contract.validation.lineRequired'))
      return
    }
    const invalidLine = form.lines.find(
      (line) =>
        !line.product_name.trim() ||
        !line.unit.trim() ||
        !Number.isFinite(Number(line.quantity)) ||
        Number(line.quantity) <= 0 ||
        !Number.isFinite(Number(line.unit_price)) ||
        Number(line.unit_price) <= 0,
    )
    if (invalidLine) {
      showWarningDialog(
        t('sales.contract.validation.lineIncomplete', {
          name: invalidLine.product_name || invalidLine.product_code,
        }),
      )
      return
    }
    const invalidBarcodeLine = form.lines.find(
      (line) => line.barcode && !/^\d{1,64}$/.test(line.barcode),
    )
    if (invalidBarcodeLine) {
      showWarningDialog(
        t('sales.contract.validation.barcodeInvalid', { name: invalidBarcodeLine.product_name }),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    setExportPreview('')
    try {
      const saved = editingContractId
        ? await updateExportContract(editingContractId, exportContractPayload(form))
        : await createExportContract(exportContractPayload(form))
      setMessage(
        editingContractId
          ? t('sales.contract.message.saved', { code: saved.code })
          : t('sales.contract.message.created', { code: saved.code }),
      )
      setEditingContractId(null)
      setForm(initialExportContractForm(currentUser))
      setCreateModalOpen(false)
      closeProductDrawer()
      upsertContract(saved)
      await loadContracts(saved.id)
    } catch (caught) {
      showError(
        caught,
        editingContractId
          ? t('sales.contract.message.saveFailed')
          : t('sales.contract.message.createFailed'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function submitContractForApproval() {
    if (!selectedContract) return
    if (!reviewerId) {
      showError(new Error(t('sales.contract.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const submitted = await submitExportContract(selectedContract.id, { reviewer_id: reviewerId })
      setMessage(t('sales.contract.message.submitted', { code: submitted.code }))
      upsertContract(submitted)
      await loadContracts(submitted.id)
    } catch (caught) {
      showError(caught, t('sales.contract.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function approveContract() {
    if (!selectedContract) return
    if (!canApproveAssignedRecord(currentUser, selectedContract.reviewer_id, 'sales:contract:approve')) {
      showError(
        new Error(
          t('sales.contract.action.approverMismatch', {
            name: selectedContract.reviewer_name ?? t('sales.contract.action.defaultReviewer'),
          }),
        ),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const approved = await approveExportContract(
        selectedContract.id,
        exportContractApprovePayload(approveForm),
      )
      setMessage(t('sales.contract.message.approved', { code: approved.code }))
      upsertContract(approved)
      await loadContracts(approved.id)
    } catch (caught) {
      showError(caught, t('sales.contract.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function registerSignature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    try {
      const signed = await registerExportContractSignature(
        selectedContract.id,
        exportContractSignaturePayload(signatureForm),
      )
      setMessage(t('sales.contract.message.signatureRegistered', { code: signed.code }))
      upsertContract(signed)
      await loadContracts(signed.id)
    } catch (caught) {
      showError(caught, t('sales.contract.message.signatureFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function addAdvancePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    try {
      const payment = await addExportContractAdvancePayment(
        selectedContract.id,
        exportContractAdvancePaymentPayload(advancePaymentForm),
      )
      setContracts((current) =>
        current.map((contract) =>
          contract.id === selectedContract.id
            ? {
                ...contract,
                advance_payments: [payment, ...contract.advance_payments],
              }
            : contract,
        ),
      )
      setMessage(t('sales.contract.message.advancePaymentAdded', { no: payment.payment_no }))
      setAdvancePaymentForm({
        ...initialExportContractAdvancePaymentForm(),
        currency: selectedContract.currency,
        payer_name: selectedContract.customer_name,
      })
      await loadContracts(selectedContract.id)
    } catch (caught) {
      showError(caught, t('sales.contract.message.advancePaymentFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openCancelModal() {
    setCancelReason('')
    setCancelReasonError('')
    setCancelModalOpen(true)
  }

  async function submitContractCancellation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContract) return
    if (!cancelReason.trim()) {
      setCancelReasonError(t('sales.contract.cancel.reasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const cancelled = await cancelExportContract(selectedContract.id, {
        reason: cancelReason.trim(),
      })
      setCancelModalOpen(false)
      setMessage(t('sales.contract.cancel.success', { code: cancelled.code }))
      upsertContract(cancelled)
      await loadContracts(cancelled.id)
    } catch (caught) {
      showError(caught, t('sales.contract.message.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openReissueModal() {
    setReissueReason('')
    setReissueReasonError('')
    setReissueModalOpen(true)
  }

  async function submitContractReissue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContract) return
    if (!reissueReason.trim()) {
      setReissueReasonError(t('sales.contract.cancel.reissueReasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const reissued = await reissueExportContract(selectedContract.id, {
        reason: reissueReason.trim(),
      })
      setReissueModalOpen(false)
      setMessage(t('sales.contract.cancel.reissueSuccess', { code: reissued.code }))
      upsertContract(reissued)
      await loadContracts(reissued.id)
      onNavigate(moduleDetailPath(exportContractPath, reissued.id))
    } catch (caught) {
      showError(caught, t('sales.contract.message.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function exportContract(format: 'pdf' | 'excel') {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    try {
      const result = await exportExportContract(selectedContract.id, format)
      setExportPreview(result.content.split('\n').slice(0, 14).join('\n'))
      setMessage(t('sales.contract.message.exportPreview', { filename: result.filename }))
    } catch (caught) {
      showError(caught, t('sales.contract.message.exportFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = Number(summary.total_amount)
  const totalAdvance = Number(summary.advance_payment_amount)
  const currency = summary.currency ?? 'USD'

  return (
    <section className="export-contract-page">
<div className="summary-strip" aria-label={t('sales.contract.metric.overviewAria')}>
        <Metric label={t('sales.contract.metric.contractCount')} value={total} />
        <Metric label={t('sales.contract.metric.pendingApproval')} value={summary.submitted_count} />
        <Metric label={t('sales.contract.metric.approvedCount')} value={summary.approved_count} />
        <Metric label={t('sales.contract.metric.contractAmount')} value={formatMoney(totalAmount.toFixed(2), currency)} />
        <Metric label={t('sales.contract.metric.advancePayment')} value={formatMoney(totalAdvance.toFixed(2), currency)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}

      <section className="business-grid export-contract-grid">
        {!detailId ? (
          <ListPageShell
            className="product-list-panel"
            icon={<Search size={18} />}
            style={{ gridColumn: '1 / -1' }}
            title={t('sales.contract.list.title')}
          >
          <form
            className="inline-filters single-line-filter-toolbar"
            onSubmit={(event) => {
              event.preventDefault()
              setPage(1)
              appliedUrlSearchRef.current = urlQuery.update({
                q: search.trim(),
                status: statusFilter,
                customer: customerFilter,
                page: null,
              })
              void loadContracts(undefined, 1)
            }}
          >
            <label>
              {t('sales.contract.list.searchLabel')}
              <Input
                value={search}
                placeholder={t('sales.contract.list.searchPlaceholder')}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              {t('sales.contract.list.statusFilter')}
              <FormSelect
                id="export-contract-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">{t('sales.contract.list.allStatuses')}</option>
                {exportContractStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('sales.contract.list.customerFilter')}
              <Select
                allowClear
                showSearch
                loading={loadingCustomers}
                value={customerFilter || undefined}
                placeholder={t('sales.contract.list.customerFilterPlaceholder')}
                optionLabelProp="label"
                filterOption={(input, option) => {
                  const customer = customers.find((item) => item.id === option?.value)
                  return customer
                    ? customerOptionLabel(customer).toLocaleLowerCase().includes(input.toLocaleLowerCase())
                    : false
                }}
                notFoundContent={loadingCustomers ? t('sales.contract.list.loadingCustomers') : t('sales.contract.list.noCustomers')}
                placement="bottomRight"
                popupMatchSelectWidth={360}
                onChange={(value) => setCustomerFilter(value ?? '')}
              >
                {renderCustomerOptions(customers)}
              </Select>
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>
              {t('sales.contract.list.query')}
            </Button>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreateContractModal}>
              {t('sales.contract.list.create')}
            </Button>
          </form>

          <Table<ExportContract>
            columns={[
              {
                title: t('sales.contract.field.code'),
                dataIndex: 'code',
                render: (value: string, record: ExportContract) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenContractDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: t('sales.contract.field.status'), dataIndex: 'approval_status', render: exportContractStatusLabel },
              { title: t('sales.contract.field.customer'), dataIndex: 'customer_name' },
              { title: t('sales.contract.field.plannedShipDate'), dataIndex: 'planned_ship_date', render: formatDate },
              {
                title: t('sales.contract.field.amount'),
                dataIndex: 'statistics',
                render: (_, contract) => formatMoney(contract.statistics.total_amount, contract.currency),
              },
              { title: t('sales.contract.field.signature'), dataIndex: 'signature_status', render: signatureStatusLabel },
              {
                title: t('sales.contract.field.entry'),
                key: 'detail',
                width: 110,
                render: (_: unknown, record: ExportContract) => (
                  <Button size="small" onClick={(event) => stopAndOpenContractDetail(event, record)}>
                    {t('sales.contract.action.viewDetail')}
                  </Button>
                ),
              },
            ]}
            dataSource={contracts}
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (nextPage, nextPageSize) => {
                const next = changePage(nextPage, nextPageSize)
                appliedUrlSearchRef.current = urlQuery.update({
                  page: next.page === 1 ? null : next.page,
                })
                void loadContracts(undefined, next.page, next.pageSize)
              },
            }}
            rowClassName={(record) => (record.id === selectedContract?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedContractId(record.id),
            })}
          />
          </ListPageShell>
        ) : null}

        <ExportContractFormModal
          open={createModalOpen}
          editingContractId={editingContractId}
          form={form}
          setForm={setForm}
          customers={customers}
          assignableUsers={assignableUsers}
          loadingCustomers={loadingCustomers}
          loadingAssignableUsers={loadingAssignableUsers}
          loadingProducts={loadingProducts}
          submitting={submitting}
          onClose={() => {
            closeProductDrawer()
            setCreateModalOpen(false)
            setEditingContractId(null)
          }}
          onSubmit={submitContract}
          applyCustomerToContractForm={applyCustomerToContractForm}
          applySalesUserToContractForm={applySalesUserToContractForm}
          removeContractLine={removeContractLine}
          updateContractLine={updateContractLine}
          openProductDrawer={openProductDrawer}
        />

        <Drawer
          destroyOnHidden
          footer={(
            <div className="product-picker-actions">
              <span>{t('sales.contract.form.selectedCount', { count: pendingProductIds.length })}</span>
              <div>
                <Button onClick={closeProductDrawer}>{t('common.cancel')}</Button>
                <Button
                  disabled={pendingProductIds.length === 0}
                  type="primary"
                  onClick={addPendingProducts}
                >
                  {t('sales.contract.form.addSelected', { count: pendingProductIds.length })}
                </Button>
              </div>
            </div>
          )}
          open={productDrawerOpen}
          size="large"
          title={t('sales.contract.form.productDrawerTitle')}
          zIndex={1100}
          onClose={closeProductDrawer}
        >
          <Input
            allowClear
            aria-label={t('sales.contract.form.searchProductAria')}
            className="product-picker-search"
            placeholder={t('sales.contract.form.productSearchPlaceholder')}
            prefix={<Search size={16} />}
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
          <div className="product-picker-list" role="list">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => {
              const alreadyAdded = selectedProductIds.has(product.id)
              const displayName = product.cn_name || product.en_name || product.code
              return (
                <div className={`product-picker-item${alreadyAdded ? ' is-added' : ''}`} key={product.id} role="listitem">
                  <Checkbox
                    aria-label={`${displayName} (${product.code})`}
                    checked={pendingProductIds.includes(product.id)}
                    disabled={alreadyAdded}
                    onChange={(event) => togglePendingProduct(product.id, event.target.checked)}
                  >
                    <span className="product-picker-item-main">
                      <strong>{displayName}</strong>
                      <span>{product.code} · {[product.specification, product.model].filter(Boolean).join(' · ') || t('sales.contract.form.noSpecification')}</span>
                    </span>
                  </Checkbox>
                  {alreadyAdded ? <span className="product-picker-added-label">{t('sales.contract.form.added')}</span> : null}
                </div>
              )
            }) : (
              <div className="product-picker-empty">{t('sales.contract.form.noMatchingProducts')}</div>
            )}
          </div>
        </Drawer>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title={t('sales.contract.detail.title')} />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(exportContractPath)}>
              {t('sales.contract.action.backToList')}
            </Button>
          </div>
          {selectedContract ? (
            <>
              {selectedContract.approval_status === 'cancelled' ? (
                <Alert
                  showIcon
                  description={selectedContract.cancel_reason ?? t('sales.contract.detail.notFilled')}
                  message={t('sales.contract.detail.cancelledBanner', {
                    date: selectedContract.cancelled_at
                      ? formatDate(selectedContract.cancelled_at)
                      : t('sales.contract.detail.notFilled'),
                    name: selectedContract.cancelled_by_name ?? t('sales.contract.detail.notFilled'),
                  })}
                  type="warning"
                />
              ) : null}
              {selectedContract.reissued_from_code ? (
                <Alert
                  showIcon
                  description={selectedContract.reissue_reason ?? t('sales.contract.detail.notFilled')}
                  message={t('sales.contract.detail.reissuedFromBanner', {
                    code: selectedContract.reissued_from_code,
                  })}
                  type="info"
                />
              ) : null}

              <dl className="detail-list">
                <div>
                  <dt>{t('sales.contract.detail.statusSignature')}</dt>
                  <dd>{exportContractStatusLabel(selectedContract.approval_status)} / {signatureStatusLabel(selectedContract.signature_status)}</dd>
                </div>
                <div>
                  <dt>{t('sales.contract.field.customer')}</dt>
                  <dd>{selectedContract.customer_name}</dd>
                </div>
                <div>
                  <dt>{t('sales.contract.field.salesperson')}</dt>
                  <dd>{selectedContract.sales_user_name ?? t('sales.contract.detail.notFilled')}</dd>
                </div>
                <div>
                  <dt>{t('sales.contract.field.tradeTerm')}</dt>
                  <dd>{selectedContract.trade_term}</dd>
                </div>
                <div>
                  <dt>{t('sales.contract.field.paymentTerms')}</dt>
                  <dd>{selectedContract.payment_terms || t('common.notSet')}</dd>
                </div>
                <div>
                  <dt>{t('sales.contract.field.contractAmount')}</dt>
                  <dd>{formatMoney(selectedContract.statistics.total_amount, selectedContract.currency)}</dd>
                </div>
                <div>
                  <dt>{t('sales.contract.detail.purchasedShipped')}</dt>
                  <dd>
                    {selectedContract.statistics.purchased_quantity} / {selectedContract.statistics.shipped_quantity}
                  </dd>
                </div>
                <div>
                  <dt>{t('sales.contract.field.sourceQuotation')}</dt>
                  <dd>{selectedContract.source_quotation_no ?? t('sales.contract.detail.notLinked')}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>{t('sales.contract.field.remarks')}</strong>
                <p>{selectedContract.remarks ?? t('sales.contract.detail.noRemarks')}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedContract.approval_status !== 'draft'}
                  onClick={() => loadContractIntoForm(selectedContract)}
                >
                  {t('sales.contract.action.loadForEdit')}
                </Button>
                {selectedContract.approval_status === 'draft' ? (
                  <ApprovalAssigneeSelect
                    currentUserId={currentUser.id}
                    onChange={setReviewerId}
                    requiredPermission="sales:contract:approve"
                    value={reviewerId}
                  />
                ) : null}
                <Button
                  disabled={selectedContract.approval_status !== 'draft' || !reviewerId}
                  loading={submitting}
                  onClick={() => void submitContractForApproval()}
                >
                  {t('sales.contract.action.submitForApproval')}
                </Button>
                <Button
                  disabled={
                    selectedContract.approval_status !== 'submitted' ||
                    !canApproveAssignedRecord(currentUser, selectedContract.reviewer_id, 'sales:contract:approve')
                  }
                  loading={submitting}
                  type="primary"
                  onClick={() => void approveContract()}
                >
                  {t('sales.contract.action.approve')}
                </Button>
                <Button loading={submitting} onClick={() => void exportContract('pdf')}>
                  {t('sales.contract.action.exportPdf')}
                </Button>
                <Button onClick={() => void openExportContractPrint(selectedContract.id)}>
                  {t('sales.contract.action.print')}
                </Button>
                {['draft', 'approved', 'rejected'].includes(selectedContract.approval_status) ? (
                  <Button danger onClick={openCancelModal}>
                    {t('sales.contract.action.cancel')}
                  </Button>
                ) : null}
                {selectedContract.approval_status === 'cancelled' ? (
                  <Button type="primary" onClick={openReissueModal}>
                    {t('sales.contract.action.reissue')}
                  </Button>
                ) : null}
              </div>
              {selectedContract.approval_status === 'submitted' && !canApproveAssignedRecord(currentUser, selectedContract.reviewer_id, 'sales:contract:approve') ? (
                <Alert
                  message={t('sales.contract.action.waitingApproval', {
                    name: selectedContract.reviewer_name ?? t('sales.contract.action.defaultReviewer'),
                  })}
                  showIcon
                  type="info"
                />
              ) : null}

              {exportPreview ? (
                <div className="transaction-box export-preview">
                  <strong>{t('sales.contract.detail.exportPreview')}</strong>
                  <pre>{exportPreview}</pre>
                </div>
              ) : null}

              <div className="contract-detail-split">
                <form className="record-form accessory-form" onSubmit={registerSignature}>
                  <div className="form-divider">{t('sales.contract.detail.customerSignature')}</div>
                  <div className="form-pair two">
                    <label>
                      {t('sales.contract.field.signedBy')}
                      <Input
                        value={signatureForm.signed_by}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, signed_by: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sales.contract.field.signedAt')}
                      <Input
                        type="date"
                        value={signatureForm.signed_at}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, signed_at: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      {t('sales.contract.field.signatureMethod')}
                      <Input
                        value={signatureForm.signature_method}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, signature_method: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sales.contract.field.signatureFileNo')}
                      <Input
                        value={signatureForm.file_no}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, file_no: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    {t('sales.contract.field.signatureRemark')}
                    <Input
                      value={signatureForm.remark}
                      onChange={(event) => setSignatureForm({ ...signatureForm, remark: event.target.value })}
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    {t('sales.contract.action.registerSignature')}
                  </Button>
                </form>

                <form className="record-form accessory-form" onSubmit={addAdvancePayment}>
                  <div className="form-divider">{t('sales.contract.detail.advancePayment')}</div>
                  <div className="form-pair two">
                    <label>
                      {t('sales.contract.field.paymentNo')}
                      <Input readOnly value={advancePaymentForm.payment_no} />
                    </label>
                    <label>
                      {t('sales.contract.field.receivedAt')}
                      <Input
                        type="date"
                        value={advancePaymentForm.received_at}
                        onChange={(event) =>
                          setAdvancePaymentForm({ ...advancePaymentForm, received_at: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      {t('sales.contract.field.amount')}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={advancePaymentForm.amount}
                        onChange={(event) =>
                          setAdvancePaymentForm({ ...advancePaymentForm, amount: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('sales.contract.field.payer')}
                      <Input
                        value={advancePaymentForm.payer_name}
                        onChange={(event) =>
                          setAdvancePaymentForm({ ...advancePaymentForm, payer_name: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    {t('sales.contract.field.paymentRemark')}
                    <Input
                      value={advancePaymentForm.remark}
                      onChange={(event) =>
                        setAdvancePaymentForm({ ...advancePaymentForm, remark: event.target.value })
                      }
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    {t('sales.contract.action.linkAdvancePayment')}
                  </Button>
                </form>
              </div>

              <Table<ExportContractLine>
                className="compact-section"
                columns={[
                  { title: t('sales.contract.field.productCode'), dataIndex: 'product_code', render: nullableText },
                  { title: t('sales.contract.field.productName'), dataIndex: 'product_name' },
                  { title: t('sales.contract.field.barcode'), dataIndex: 'barcode', render: nullableText },
                  { title: t('sales.contract.field.specification'), dataIndex: 'specification', render: nullableText },
                  { title: t('sales.contract.field.model'), dataIndex: 'model', render: nullableText },
                  { title: t('sales.contract.field.quantity'), dataIndex: 'quantity', render: (_, line) => `${line.quantity} ${line.unit}` },
                  {
                    title: t('sales.contract.field.unitPrice'),
                    dataIndex: 'unit_price',
                    render: (_, line) => formatMoney(line.unit_price, selectedContract.currency),
                  },
                  {
                    title: t('sales.contract.field.amount'),
                    dataIndex: 'amount',
                    render: (_, line) => formatMoney(line.amount, selectedContract.currency),
                  },
                  { title: t('sales.contract.field.purchasedQuantity'), dataIndex: 'purchased_quantity' },
                  { title: t('sales.contract.field.shippedQuantity'), dataIndex: 'shipped_quantity' },
                ]}
                dataSource={selectedContract.lines}
                locale={{ emptyText: t('sales.contract.detail.noLines') }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="contract-media-row">
                <div className="product-photo compact-photo">
                  {selectedContract.lines[0]?.image_url ? (
                    <img src={selectedContract.lines[0].image_url} alt="" />
                  ) : (
                    <span>{t('sales.contract.detail.noImage')}</span>
                  )}
                </div>
                <dl className="detail-list compact-detail-list">
                  <div>
                    <dt>{t('sales.contract.field.unpurchasedQuantity')}</dt>
                    <dd>{selectedContract.statistics.unpurchased_quantity}</dd>
                  </div>
                  <div>
                    <dt>{t('sales.contract.field.unshippedAmount')}</dt>
                    <dd>{formatMoney(selectedContract.statistics.unshipped_amount, selectedContract.currency)}</dd>
                  </div>
                  <div>
                    <dt>{t('sales.contract.field.advancePaymentTotal')}</dt>
                    <dd>{formatMoney(selectedContract.statistics.advance_payment_amount, selectedContract.currency)}</dd>
                  </div>
                  <div>
                    <dt>{t('sales.contract.field.customerSignedAt')}</dt>
                    <dd>{formatDate(selectedContract.customer_signed_at)}</dd>
                  </div>
                </dl>
              </div>

              <div className="accessory-heading">
                <strong>{t('sales.contract.detail.historyTitle')}</strong>
                <span>{t('sales.contract.detail.recordCount', { count: history.length })}</span>
              </div>
              <Table<ExportQuotation>
                columns={[
                  { title: t('sales.contract.field.quotation'), dataIndex: 'code' },
                  { title: t('sales.contract.field.customer'), dataIndex: 'customer_name' },
                  { title: t('sales.contract.field.date'), dataIndex: 'quote_date', render: formatDate },
                  {
                    title: t('sales.contract.field.amount'),
                    dataIndex: 'total_amount',
                    render: (_, quotation) => formatMoney(quotation.total_amount, quotation.currency),
                  },
                ]}
                dataSource={history}
                locale={{ emptyText: t('sales.contract.detail.noHistory') }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>{t('sales.contract.detail.purchaseTitle')}</strong>
                <span>{t('sales.contract.detail.recordCount', { count: selectedContract.purchase_statuses.length })}</span>
              </div>
              <Table<ExportContractPurchaseStatus>
                columns={[
                  { title: t('sales.contract.field.productCode'), dataIndex: 'product_code', render: nullableText },
                  { title: t('sales.contract.field.productName'), dataIndex: 'product_name' },
                  { title: t('sales.contract.field.contractQuantity'), dataIndex: 'total_quantity' },
                  { title: t('sales.contract.field.purchasedQuantity'), dataIndex: 'purchased_quantity' },
                  { title: t('sales.contract.field.unpurchased'), dataIndex: 'unpurchased_quantity' },
                  { title: t('sales.contract.field.status'), dataIndex: 'status', render: contractProgressStatusLabel },
                ]}
                dataSource={selectedContract.purchase_statuses}
                locale={{ emptyText: t('sales.contract.detail.noPurchase') }}
                pagination={false}
                rowKey={(item) => `${item.product_id ?? item.product_code ?? item.product_name}-purchase`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>{t('sales.contract.detail.shipmentTitle')}</strong>
                <span>{t('sales.contract.detail.recordCount', { count: selectedContract.shipment_statuses.length })}</span>
              </div>
              <Table<ExportContractShipmentStatus>
                columns={[
                  { title: t('sales.contract.field.productCode'), dataIndex: 'product_code', render: nullableText },
                  { title: t('sales.contract.field.productName'), dataIndex: 'product_name' },
                  { title: t('sales.contract.field.plannedShipDate'), dataIndex: 'planned_ship_date', render: formatDate },
                  { title: t('sales.contract.field.contractQuantity'), dataIndex: 'total_quantity' },
                  { title: t('sales.contract.field.shippedQuantity'), dataIndex: 'shipped_quantity' },
                  { title: t('sales.contract.field.unshipped'), dataIndex: 'unshipped_quantity' },
                  {
                    title: t('sales.contract.field.unshippedAmount'),
                    dataIndex: 'unshipped_amount',
                    render: (_, item) => formatMoney(item.unshipped_amount, selectedContract.currency),
                  },
                  { title: t('sales.contract.field.status'), dataIndex: 'status', render: contractProgressStatusLabel },
                ]}
                dataSource={selectedContract.shipment_statuses}
                locale={{ emptyText: t('sales.contract.detail.noShipment') }}
                pagination={false}
                rowKey={(item) => `${item.product_id ?? item.product_code ?? item.product_name}-shipment`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>{t('sales.contract.detail.signatureTitle')}</strong>
                <span>{t('sales.contract.detail.recordCount', { count: selectedContract.signatures.length })}</span>
              </div>
              <Table<ExportContractSignature>
                columns={[
                  { title: t('sales.contract.field.signedBy'), dataIndex: 'signed_by' },
                  { title: t('sales.contract.field.signedAt'), dataIndex: 'signed_at', render: formatDate },
                  { title: t('sales.contract.field.method'), dataIndex: 'signature_method' },
                  { title: t('sales.contract.field.fileNo'), dataIndex: 'file_no', render: nullableText },
                  { title: t('sales.contract.field.remark'), dataIndex: 'remark', render: nullableText },
                ]}
                dataSource={selectedContract.signatures}
                locale={{ emptyText: t('sales.contract.detail.noSignatures') }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>{t('sales.contract.detail.advancePaymentTitle')}</strong>
                <span>{t('sales.contract.detail.recordCount', { count: selectedContract.advance_payments.length })}</span>
              </div>
              <Table<ExportContractAdvancePayment>
                columns={[
                  { title: t('sales.contract.field.paymentNo'), dataIndex: 'payment_no' },
                  { title: t('sales.contract.field.receivedAt'), dataIndex: 'received_at', render: formatDate },
                  { title: t('sales.contract.field.payer'), dataIndex: 'payer_name' },
                  { title: t('sales.contract.field.amount'), dataIndex: 'amount', render: (_, payment) => formatMoney(payment.amount, payment.currency) },
                  { title: t('sales.contract.field.remark'), dataIndex: 'remark', render: nullableText },
                ]}
                dataSource={selectedContract.advance_payments}
                locale={{ emptyText: t('sales.contract.detail.noAdvancePayments') }}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FileStack size={28} />
              <strong>{t('sales.contract.detail.emptyTitle')}</strong>
              <span>{t('sales.contract.detail.emptyDescription')}</span>
            </div>
          )}
          </section>
        ) : null}

        <FormModal
          destroyOnHidden
          open={cancelModalOpen}
          submitDanger
          submitLabel={t('sales.contract.cancel.confirm')}
          submitting={submitting}
          title={t('sales.contract.cancel.title')}
          onCancel={() => setCancelModalOpen(false)}
          onSubmit={submitContractCancellation}
        >
          <Alert message={t('sales.contract.cancel.hint')} showIcon type="warning" />
          <label htmlFor="export-contract-cancel-reason">
            {t('sales.contract.cancel.reason')}
            <Input.TextArea
              aria-describedby={cancelReasonError ? 'export-contract-cancel-error' : undefined}
              aria-invalid={Boolean(cancelReasonError)}
              id="export-contract-cancel-reason"
              placeholder={t('sales.contract.cancel.reasonPlaceholder')}
              rows={4}
              value={cancelReason}
              onChange={(event) => {
                setCancelReason(event.target.value)
                setCancelReasonError('')
              }}
            />
          </label>
          {cancelReasonError ? (
            <span className="form-field-error" id="export-contract-cancel-error">
              {cancelReasonError}
            </span>
          ) : null}
        </FormModal>

        <FormModal
          destroyOnHidden
          open={reissueModalOpen}
          submitLabel={t('sales.contract.cancel.reissueConfirm')}
          submitType="primary"
          submitting={submitting}
          title={t('sales.contract.cancel.reissueTitle')}
          onCancel={() => setReissueModalOpen(false)}
          onSubmit={submitContractReissue}
        >
          <Alert message={t('sales.contract.cancel.reissueHint')} showIcon type="info" />
          <label htmlFor="export-contract-reissue-reason">
            {t('sales.contract.cancel.reissueReason')}
            <Input.TextArea
              aria-describedby={reissueReasonError ? 'export-contract-reissue-error' : undefined}
              aria-invalid={Boolean(reissueReasonError)}
              id="export-contract-reissue-reason"
              placeholder={t('sales.contract.cancel.reissuePlaceholder')}
              rows={4}
              value={reissueReason}
              onChange={(event) => {
                setReissueReason(event.target.value)
                setReissueReasonError('')
              }}
            />
          </label>
          {reissueReasonError ? (
            <span className="form-field-error" id="export-contract-reissue-error">
              {reissueReasonError}
            </span>
          ) : null}
        </FormModal>
      </section>
    </section>
  )
}
