import { Alert, Button, Checkbox, Descriptions as _Descriptions, Drawer, Input, Modal, Table, Tag as _Tag , Select} from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search , FileStack} from 'lucide-react'
import type { FormEvent, MouseEvent , ReactNode} from 'react'
import { useEffect, useMemo, useState } from 'react'
import { addExportContractAdvancePayment, approveExportContract, createExportContract, exportExportContract, listExportContracts, registerExportContractSignature, submitExportContract, updateExportContract, type AssignableUser, type CurrentUser, type ExportContract, type ExportContractAdvancePayment, type ExportContractAdvancePaymentPayload, type ExportContractApprovePayload, type ExportContractCreatePayload, type ExportContractLine, type ExportContractSignature, type ExportContractSignaturePayload, type Customer, type Product , ExportContractPurchaseStatus, ExportContractShipmentStatus, ExportQuotation, listAssignableUsers, listCustomers, listProducts, getExportQuotationHistory} from '../../../api'
import { exportContractPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError, showWarningDialog } from '../../../shared/errors'
import { downloadCsv as _downloadCsv, openExportContractPrint } from '../../../shared/print'
import { exportContractStatusOptions } from '../../../shared/formOptions'
import { canApproveAssignedRecord, formatDate, formatMoney, formatPercent as _formatPercent, nullableText, todayInputValue, type RoutedDetailPageProps , emptyToNull} from '../appHelpers'
import { t } from '../../appI18n'
import { ApprovalAssigneeSelect } from '../../components/ApprovalAssigneeSelect'

function customerDisplayName(customer: Customer): string {
  return customer.cn_name || customer.en_name || customer.code
}

function customerOptionLabel(customer: Customer): string {
  return [customer.code, customerDisplayName(customer), customer.country].filter(Boolean).join(' / ')
}

function renderCustomerOptions(customers: Customer[]): ReactNode {
  return customers.map((customer) => {
    const displayName = customerDisplayName(customer)
    const description = [customer.code, customer.country].filter(Boolean).join(' · ')
    return (
      <Select.Option key={customer.id} value={customer.id} label={displayName}>
        <div className="remote-select-option">
          <span className="remote-select-option-title">{displayName}</span>
          <span className="remote-select-option-desc">{description}</span>
        </div>
      </Select.Option>
    )
  })
}

function assignableUserOptionLabel(user: AssignableUser): string {
  return [user.display_name, user.username, user.department_name].filter(Boolean).join(' / ')
}

function renderAssignableUserOptions(users: AssignableUser[]): ReactNode {
  return users.map((user) => (
    <Select.Option key={user.id} value={user.id} label={user.display_name}>
      <div className="remote-select-option">
        <span className="remote-select-option-title">{user.display_name}</span>
        <span className="remote-select-option-desc">
          {[user.username, user.department_name].filter(Boolean).join(' · ')}
        </span>
      </div>
    </Select.Option>
  ))
}

function contractProgressStatusLabel(value: string): string {
  if (value === 'completed') return t('sales.contract.progress.completed')
  if (value === 'partial') return t('sales.contract.progress.partial')
  if (value === 'pending') return t('sales.contract.progress.pending')
  return value
}


type ExportContractLineFormState = {
  key: string
  product_id: string
  product_code: string
  product_name: string
  barcode: string
  specification: string
  model: string
  quantity: string
  unit: string
  unit_price: string
  purchased_quantity: string
  shipped_quantity: string
  image_url: string
  line_remark: string
}

type ExportContractFormState = {
  code: string
  contract_date: string
  customer_id: string
  customer_name: string
  sales_user_id: string
  sales_user_name: string
  currency: string
  trade_term: string
  planned_ship_date: string
  payment_terms: string
  source_quotation_id: string
  source_quotation_no: string
  remarks: string
  lines: ExportContractLineFormState[]
}

type ExportContractApproveFormState = {
  reviewer_name: string
  approved_at: string
}

type ExportContractSignatureFormState = {
  signed_by: string
  signed_at: string
  signature_method: string
  file_no: string
  remark: string
}

type ExportContractAdvancePaymentFormState = {
  payment_no: string
  received_at: string
  amount: string
  currency: string
  payer_name: string
  remark: string
}


function initialExportContractForm(currentUser?: CurrentUser): ExportContractFormState {
  return {
    code: `EC-${Date.now().toString().slice(-6)}`,
    contract_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    sales_user_id: currentUser?.id ?? '',
    sales_user_name: currentUser?.display_name ?? '',
    currency: 'USD',
    trade_term: 'FOB Ningbo',
    planned_ship_date: todayInputValue(),
    payment_terms: '30% T/T in advance, balance before shipment',
    source_quotation_id: '',
    source_quotation_no: '',
    remarks: '',
    lines: [],
  }
}

function initialExportContractApproveForm(): ExportContractApproveFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
  }
}

function initialExportContractSignatureForm(): ExportContractSignatureFormState {
  return {
    signed_by: '',
    signed_at: todayInputValue(),
    signature_method: 'email_scan',
    file_no: '',
    remark: '',
  }
}

function initialExportContractAdvancePaymentForm(): ExportContractAdvancePaymentFormState {
  return {
    payment_no: `AR-${Date.now().toString().slice(-6)}`,
    received_at: todayInputValue(),
    amount: '',
    currency: 'USD',
    payer_name: '',
    remark: '',
  }
}

function exportContractToForm(contract: ExportContract): ExportContractFormState {
  return {
    code: contract.code,
    contract_date: contract.contract_date,
    customer_id: contract.customer_id ?? '',
    customer_name: contract.customer_name,
    sales_user_id: contract.sales_user_id ?? '',
    sales_user_name: contract.sales_user_name ?? '',
    currency: contract.currency,
    trade_term: contract.trade_term,
    planned_ship_date: contract.planned_ship_date,
    payment_terms: contract.payment_terms,
    source_quotation_id: contract.source_quotation_id ?? '',
    source_quotation_no: contract.source_quotation_no ?? '',
    remarks: contract.remarks ?? '',
    lines: contract.lines.map((line, index) => ({
      key: line.id || `${line.product_id ?? 'line'}-${index}`,
      product_id: line.product_id ?? '',
      product_code: line.product_code ?? '',
      product_name: line.product_name,
      barcode: line.barcode ?? '',
      specification: line.specification ?? '',
      model: line.model ?? '',
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unit_price,
      purchased_quantity: line.purchased_quantity,
      shipped_quantity: line.shipped_quantity,
      image_url: line.image_url ?? '',
      line_remark: line.remark ?? '',
    })),
  }
}

function exportContractPayload(form: ExportContractFormState): ExportContractCreatePayload {
  return {
    code: form.code.trim(),
    contract_date: form.contract_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    currency: form.currency.trim(),
    trade_term: form.trade_term.trim(),
    planned_ship_date: form.planned_ship_date,
    payment_terms: form.payment_terms.trim(),
    source_quotation_id: emptyToNull(form.source_quotation_id),
    source_quotation_no: emptyToNull(form.source_quotation_no),
    remarks: emptyToNull(form.remarks),
    lines: form.lines.map((line) => ({
      product_id: emptyToNull(line.product_id),
      product_code: emptyToNull(line.product_code),
      product_name: line.product_name.trim(),
      barcode: emptyToNull(line.barcode),
      specification: emptyToNull(line.specification),
      model: emptyToNull(line.model),
      quantity: line.quantity,
      unit: line.unit.trim(),
      unit_price: line.unit_price,
      purchased_quantity: line.purchased_quantity || '0',
      shipped_quantity: line.shipped_quantity || '0',
      image_url: emptyToNull(line.image_url),
      remark: emptyToNull(line.line_remark),
    })),
  }
}

function productToContractLine(product: Product): ExportContractLineFormState {
  return {
    key: product.id,
    product_id: product.id,
    product_code: product.code,
    product_name: product.cn_name || product.en_name || product.code,
    barcode: '',
    specification: product.specification ?? '',
    model: product.model ?? '',
    quantity: '1',
    unit: product.unit || 'pcs',
    unit_price: '1.00',
    purchased_quantity: '0',
    shipped_quantity: '0',
    image_url: product.image_url ?? '',
    line_remark: product.package_info ? `包装: ${product.package_info}` : '',
  }
}

function exportContractApprovePayload(
  form: ExportContractApproveFormState,
): ExportContractApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function exportContractSignaturePayload(
  form: ExportContractSignatureFormState,
): ExportContractSignaturePayload {
  return {
    signed_by: form.signed_by.trim(),
    signed_at: form.signed_at,
    signature_method: form.signature_method.trim(),
    file_no: emptyToNull(form.file_no),
    remark: emptyToNull(form.remark),
  }
}

function exportContractAdvancePaymentPayload(
  form: ExportContractAdvancePaymentFormState,
): ExportContractAdvancePaymentPayload {
  return {
    payment_no: form.payment_no.trim(),
    received_at: form.received_at,
    amount: form.amount,
    currency: form.currency.trim(),
    payer_name: form.payer_name.trim(),
    remark: emptyToNull(form.remark),
  }
}

function exportContractStatusLabel(value: string): string {
  const option = exportContractStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function signatureStatusLabel(value: string): string {
  if (value === 'signed') return t('sales.contract.signatureStatus.signed')
  if (value === 'not_signed') return t('sales.contract.signatureStatus.notSigned')
  if (value === 'pending') return t('sales.contract.signatureStatus.pending')
  return value
}


type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function ExportContractsPage({ currentUser, detailId, onNavigate }: Props) {
  const [contracts, setContracts] = useState<ExportContract[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [history, setHistory] = useState<ExportQuotation[]>([])
  const [exportPreview, setExportPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)
  const [assignableUsersLoaded, setAssignableUsersLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
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

  async function loadContracts(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listExportContracts({
        q: search.trim() || undefined,
        approval_status: statusFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
      })
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
      payment_no: `AR-${Date.now().toString().slice(-6)}`,
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
    setError('')
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
    setError('')
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
    setError('')
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
    setError('')
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
    setError('')
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

  async function exportContract(format: 'pdf' | 'excel') {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
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

  const totalAmount = contracts.reduce((sum, item) => sum + Number(item.statistics.total_amount), 0)
  const totalAdvance = contracts.reduce(
    (sum, item) => sum + Number(item.statistics.advance_payment_amount),
    0,
  )
  const currency = contracts[0]?.currency ?? 'USD'

  return (
    <section className="export-contract-page">
<div className="summary-strip" aria-label={t('sales.contract.metric.overviewAria')}>
        <Metric label={t('sales.contract.metric.contractCount')} value={contracts.length} />
        <Metric label={t('sales.contract.metric.pendingApproval')} value={contracts.filter((item) => item.approval_status === 'submitted').length} />
        <Metric label={t('sales.contract.metric.approvedCount')} value={contracts.filter((item) => item.approval_status === 'approved').length} />
        <Metric label={t('sales.contract.metric.contractAmount')} value={formatMoney(totalAmount.toFixed(2), currency)} />
        <Metric label={t('sales.contract.metric.advancePayment')} value={formatMoney(totalAdvance.toFixed(2), currency)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid export-contract-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title={t('sales.contract.list.title')} />
          </div>
          <form
            className="inline-filters single-line-filter-toolbar"
            onSubmit={(event) => {
              event.preventDefault()
              void loadContracts()
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
            pagination={false}
            rowClassName={(record) => (record.id === selectedContract?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedContractId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={createModalOpen}
          title={editingContractId ? t('sales.contract.form.editTitle') : t('sales.contract.form.createTitle')}
          width={1160}
          onCancel={() => {
            closeProductDrawer()
            setCreateModalOpen(false)
            setEditingContractId(null)
          }}
        >
          <form className="record-form entity-modal-form contract-modal-form" onSubmit={submitContract}>
            <div className="form-row">
              <label>
                {t('sales.contract.field.code')}
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                {t('sales.contract.field.contractDate')}
                <Input
                  type="date"
                  value={form.contract_date}
                  onInput={(event) => setForm({ ...form, contract_date: event.currentTarget.value })}
                />
              </label>
              <label>
                {t('sales.contract.field.salesperson')}
                <Select
                  allowClear
                  aria-label={t('sales.contract.field.salesperson')}
                  showSearch
                  loading={loadingAssignableUsers}
                  value={form.sales_user_id || undefined}
                  placeholder={loadingAssignableUsers ? t('sales.contract.form.salespersonLoading') : t('sales.contract.form.salespersonPlaceholder')}
                  optionLabelProp="label"
                  filterOption={(input, option) => {
                    const user = assignableUsers.find((item) => item.id === option?.value)
                    return user
                      ? assignableUserOptionLabel(user)
                          .toLocaleLowerCase()
                          .includes(input.toLocaleLowerCase())
                      : false
                  }}
                  notFoundContent={loadingAssignableUsers ? t('sales.contract.form.loadingUsers') : t('sales.contract.form.noSalespersons')}
                  onChange={applySalesUserToContractForm}
                >
                  {form.sales_user_id &&
                  !assignableUsers.some((user) => user.id === form.sales_user_id) ? (
                    <Select.Option
                      key={form.sales_user_id}
                      value={form.sales_user_id}
                      label={form.sales_user_name || form.sales_user_id}
                      disabled
                    >
                      {t('sales.contract.form.currentRecord', {
                        name: form.sales_user_name || form.sales_user_id,
                      })}
                    </Select.Option>
                  ) : null}
                  {renderAssignableUserOptions(assignableUsers)}
                </Select>
              </label>
            </div>
            <div className="form-row">
              <label>
                {t('sales.contract.form.selectCustomer')}
                <Select
                  allowClear
                  showSearch
                  loading={loadingCustomers}
                  value={form.customer_id || undefined}
                  placeholder={customers.length > 0 ? t('sales.contract.form.customerSelectPlaceholder') : t('sales.contract.form.customerMissing')}
                  optionLabelProp="label"
                  filterOption={(input, option) => {
                    const customer = customers.find((item) => item.id === option?.value)
                    return customer
                      ? customerOptionLabel(customer).toLocaleLowerCase().includes(input.toLocaleLowerCase())
                      : false
                  }}
                  notFoundContent={loadingCustomers ? t('sales.contract.list.loadingCustomers') : t('sales.contract.list.noCustomers')}
                  onChange={applyCustomerToContractForm}
                >
                  {renderCustomerOptions(customers)}
                </Select>
              </label>
              <label>
                {t('sales.contract.field.customerName')}
                <Input value={form.customer_name} readOnly placeholder={t('sales.contract.form.customerNamePlaceholder')} />
              </label>
              <label>
                {t('sales.contract.field.currency')}
                <Input
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                {t('sales.contract.field.tradeTerm')}
                <Input
                  value={form.trade_term}
                  onChange={(event) => setForm({ ...form, trade_term: event.target.value })}
                />
              </label>
              <label>
                {t('sales.contract.field.paymentTerms')}
                <Input
                  value={form.payment_terms}
                  onChange={(event) => setForm({ ...form, payment_terms: event.target.value })}
                />
              </label>
              <label>
                {t('sales.contract.field.plannedShipDate')}
                <Input
                  type="date"
                  value={form.planned_ship_date}
                  onInput={(event) => setForm({ ...form, planned_ship_date: event.currentTarget.value })}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                {t('sales.contract.field.remarks')}
                <Input
                  value={form.remarks}
                  onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                />
              </label>
            </div>
            <div className="contract-line-toolbar">
              <div>
                <div className="form-divider">{t('sales.contract.form.linesTitle')}</div>
                <p>{t('sales.contract.form.linesHint', { count: form.lines.length })}</p>
              </div>
              <Button icon={<Plus size={16} />} loading={loadingProducts} onClick={openProductDrawer}>
                {t('sales.contract.form.addProducts')}
              </Button>
            </div>
            <Table<ExportContractLineFormState>
              className="contract-lines-table"
              dataSource={form.lines}
              locale={{ emptyText: t('sales.contract.form.linesEmpty') }}
              pagination={false}
              rowKey="key"
              scroll={{ x: 1200 }}
              size="small"
              columns={[
                {
                  title: t('sales.contract.field.product'),
                  key: 'product',
                  width: 210,
                  render: (_, line) => (
                    <div className="contract-line-product">
                      <strong>{line.product_name}</strong>
                      <span>{line.product_code}</span>
                    </div>
                  ),
                },
                {
                  title: t('sales.contract.field.barcode'),
                  key: 'barcode',
                  width: 220,
                  render: (_, line) => (
                    <Input
                      aria-label={t('sales.contract.form.barcodeAria', { name: line.product_name })}
                      className="barcode-input"
                      inputMode="numeric"
                      maxLength={64}
                      placeholder={t('sales.contract.form.barcodePlaceholder')}
                      value={line.barcode}
                      onChange={(event) =>
                        updateContractLine(line.key, 'barcode', event.target.value.replace(/\D/g, ''))
                      }
                    />
                  ),
                },
                {
                  title: t('sales.contract.form.specificationModel'),
                  key: 'specification',
                  width: 210,
                  render: (_, line) => (
                    <div className="contract-line-stacked-fields">
                      <Input
                        aria-label={t('sales.contract.form.specificationAria', { name: line.product_name })}
                        placeholder={t('sales.contract.field.specification')}
                        value={line.specification}
                        onChange={(event) => updateContractLine(line.key, 'specification', event.target.value)}
                      />
                      <Input
                        aria-label={t('sales.contract.form.modelAria', { name: line.product_name })}
                        placeholder={t('sales.contract.field.model')}
                        value={line.model}
                        onChange={(event) => updateContractLine(line.key, 'model', event.target.value)}
                      />
                    </div>
                  ),
                },
                {
                  title: t('sales.contract.field.quantity'),
                  key: 'quantity',
                  width: 130,
                  render: (_, line) => (
                    <Input
                      aria-label={t('sales.contract.form.quantityAria', { name: line.product_name })}
                      min="0.0001"
                      step="0.0001"
                      type="number"
                      value={line.quantity}
                      onChange={(event) => updateContractLine(line.key, 'quantity', event.target.value)}
                    />
                  ),
                },
                {
                  title: t('sales.contract.field.unit'),
                  key: 'unit',
                  width: 105,
                  render: (_, line) => (
                    <Input
                      aria-label={t('sales.contract.form.unitAria', { name: line.product_name })}
                      value={line.unit}
                      onChange={(event) => updateContractLine(line.key, 'unit', event.target.value)}
                    />
                  ),
                },
                {
                  title: t('sales.contract.field.unitPrice'),
                  key: 'unit_price',
                  width: 140,
                  render: (_, line) => (
                    <Input
                      aria-label={t('sales.contract.form.unitPriceAria', { name: line.product_name })}
                      min="0.0001"
                      step="0.0001"
                      type="number"
                      value={line.unit_price}
                      onChange={(event) => updateContractLine(line.key, 'unit_price', event.target.value)}
                    />
                  ),
                },
                {
                  title: t('sales.contract.field.amount'),
                  key: 'amount',
                  width: 140,
                  render: (_, line) =>
                    formatMoney((Number(line.quantity || 0) * Number(line.unit_price || 0)).toFixed(2), form.currency),
                },
                {
                  title: t('sales.contract.field.actions'),
                  key: 'actions',
                  width: 80,
                  render: (_, line) => (
                    <Button danger size="small" onClick={() => removeContractLine(line.key)}>
                      {t('sales.contract.action.remove')}
                    </Button>
                  ),
                },
              ]}
            />
            <div className="modal-actions">
              <Button onClick={() => {
                closeProductDrawer()
                setCreateModalOpen(false)
                setEditingContractId(null)
              }}>
                {t('common.cancel')}
              </Button>
              <Button className="inline-submit" htmlType="submit" type="primary" loading={submitting}>
                {editingContractId ? t('sales.contract.form.save') : t('sales.contract.form.createTitle')}
              </Button>
            </div>
          </form>
        </Modal>

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
                  <dd>{selectedContract.payment_terms}</dd>
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
                      <Input
                        value={advancePaymentForm.payment_no}
                        onChange={(event) =>
                          setAdvancePaymentForm({ ...advancePaymentForm, payment_no: event.target.value })
                        }
                      />
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
      </section>
    </section>
  )
}
