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
  if (value === 'completed') return '已完成'
  if (value === 'partial') return '部分完成'
  if (value === 'pending') return '未开始'
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
    reviewer_name: '演示业务主管',
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
  return exportContractStatusOptions.find((item) => item.value === value)?.label ?? value
}

function signatureStatusLabel(value: string): string {
  if (value === 'signed') return '已回签'
  if (value === 'not_signed') return '未回签'
  if (value === 'pending') return '待回签'
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
      showError(caught, '出口合同加载失败')
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
      showError(caught, '客户资料加载失败')
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
      showError(caught, '商品资料加载失败')
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
      showError(caught, '业务员列表加载失败')
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
      showError(caught, '历史询报价参考加载失败')
    }
  }

  function syncExportContractActionForms(contract: ExportContract | null) {
    setApproveForm({
      reviewer_name: contract?.reviewer_name ?? '演示业务主管',
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
      showWarningDialog('请至少添加一个商品，确保后续采购和 QC 流程可以正确关联')
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
      showWarningDialog(`请完善商品“${invalidLine.product_name || invalidLine.product_code}”的数量、单位和销售单价`)
      return
    }
    const invalidBarcodeLine = form.lines.find(
      (line) => line.barcode && !/^\d{1,64}$/.test(line.barcode),
    )
    if (invalidBarcodeLine) {
      showWarningDialog(`商品“${invalidBarcodeLine.product_name}”的条形码只能填写 1 至 64 位数字`)
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
      setMessage(editingContractId ? `已保存出口合同 ${saved.code}` : `已新增出口合同 ${saved.code}`)
      setEditingContractId(null)
      setForm(initialExportContractForm(currentUser))
      setCreateModalOpen(false)
      closeProductDrawer()
      upsertContract(saved)
      await loadContracts(saved.id)
    } catch (caught) {
      showError(caught, editingContractId ? '出口合同草稿保存失败' : '出口合同新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitContractForApproval() {
    if (!selectedContract) return
    if (!reviewerId) {
      showError(new Error('请选择审批人'))
      return
    }
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitExportContract(selectedContract.id, { reviewer_id: reviewerId })
      setMessage(`已提交出口合同 ${submitted.code}`)
      upsertContract(submitted)
      await loadContracts(submitted.id)
    } catch (caught) {
      showError(caught, '出口合同提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveContract() {
    if (!selectedContract) return
    if (!canApproveAssignedRecord(currentUser, selectedContract.reviewer_id, 'sales:contract:approve')) {
      showError(new Error(`该出口合同应由 ${selectedContract.reviewer_name ?? '指定审批人'} 审批`))
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
      setMessage(`已审批出口合同 ${approved.code}`)
      upsertContract(approved)
      await loadContracts(approved.id)
    } catch (caught) {
      showError(caught, '出口合同审批失败')
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
      setMessage(`已登记合同回签 ${signed.code}`)
      upsertContract(signed)
      await loadContracts(signed.id)
    } catch (caught) {
      showError(caught, '合同回签登记失败')
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
      setMessage(`已关联预收款 ${payment.payment_no}`)
      setAdvancePaymentForm({
        ...initialExportContractAdvancePaymentForm(),
        currency: selectedContract.currency,
        payer_name: selectedContract.customer_name,
      })
      await loadContracts(selectedContract.id)
    } catch (caught) {
      showError(caught, '预收款关联失败')
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
      setMessage(`已生成合同导出预览 ${result.filename}`)
    } catch (caught) {
      showError(caught, '出口合同导出失败')
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
<div className="summary-strip" aria-label="出口合同概览">
        <Metric label="合同数" value={contracts.length} />
        <Metric label="待审批" value={contracts.filter((item) => item.approval_status === 'submitted').length} />
        <Metric label="已审批" value={contracts.filter((item) => item.approval_status === 'approved').length} />
        <Metric label="合同金额" value={formatMoney(totalAmount.toFixed(2), currency)} />
        <Metric label="预收款" value={formatMoney(totalAdvance.toFixed(2), currency)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid export-contract-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="合同列表" />
          </div>
          <form
            className="inline-filters single-line-filter-toolbar"
            onSubmit={(event) => {
              event.preventDefault()
              void loadContracts()
            }}
          >
            <label>
              合同搜索
              <Input
                value={search}
                placeholder="合同号 / 客户 / 产品 / 条款"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              审批状态
              <FormSelect
                id="export-contract-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {exportContractStatusOptions.map((item) => (
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
                optionLabelProp="label"
                filterOption={(input, option) => {
                  const customer = customers.find((item) => item.id === option?.value)
                  return customer
                    ? customerOptionLabel(customer).toLocaleLowerCase().includes(input.toLocaleLowerCase())
                    : false
                }}
                notFoundContent={loadingCustomers ? '加载客户资料中' : '暂无客户资料'}
                placement="bottomRight"
                popupMatchSelectWidth={360}
                onChange={(value) => setCustomerFilter(value ?? '')}
              >
                {renderCustomerOptions(customers)}
              </Select>
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>
              查询
            </Button>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreateContractModal}>
              新增合同
            </Button>
          </form>

          <Table<ExportContract>
            columns={[
              {
                title: '合同号',
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
              { title: '状态', dataIndex: 'approval_status', render: exportContractStatusLabel },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '计划出运日', dataIndex: 'planned_ship_date', render: formatDate },
              {
                title: '金额',
                dataIndex: 'statistics',
                render: (_, contract) => formatMoney(contract.statistics.total_amount, contract.currency),
              },
              { title: '回签', dataIndex: 'signature_status', render: signatureStatusLabel },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: ExportContract) => (
                  <Button size="small" onClick={(event) => stopAndOpenContractDetail(event, record)}>
                    查看详情
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
          title={editingContractId ? '编辑出口合同' : '新增出口合同'}
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
                合同号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                合同日期
                <Input
                  type="date"
                  value={form.contract_date}
                  onInput={(event) => setForm({ ...form, contract_date: event.currentTarget.value })}
                />
              </label>
              <label>
                业务员
                <Select
                  allowClear
                  aria-label="业务员"
                  showSearch
                  loading={loadingAssignableUsers}
                  value={form.sales_user_id || undefined}
                  placeholder={loadingAssignableUsers ? '正在加载业务员' : '请选择业务员'}
                  optionLabelProp="label"
                  filterOption={(input, option) => {
                    const user = assignableUsers.find((item) => item.id === option?.value)
                    return user
                      ? assignableUserOptionLabel(user)
                          .toLocaleLowerCase()
                          .includes(input.toLocaleLowerCase())
                      : false
                  }}
                  notFoundContent={loadingAssignableUsers ? '加载人员中' : '暂无可选业务员'}
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
                      {form.sales_user_name || form.sales_user_id} / 当前记录
                    </Select.Option>
                  ) : null}
                  {renderAssignableUserOptions(assignableUsers)}
                </Select>
              </label>
            </div>
            <div className="form-row">
              <label>
                选择客户
                <Select
                  allowClear
                  showSearch
                  loading={loadingCustomers}
                  value={form.customer_id || undefined}
                  placeholder={customers.length > 0 ? '从客户资料选择' : '请先在客户资料录入'}
                  optionLabelProp="label"
                  filterOption={(input, option) => {
                    const customer = customers.find((item) => item.id === option?.value)
                    return customer
                      ? customerOptionLabel(customer).toLocaleLowerCase().includes(input.toLocaleLowerCase())
                      : false
                  }}
                  notFoundContent={loadingCustomers ? '加载客户资料中' : '暂无客户资料'}
                  onChange={applyCustomerToContractForm}
                >
                  {renderCustomerOptions(customers)}
                </Select>
              </label>
              <label>
                客户名称
                <Input value={form.customer_name} readOnly placeholder="选择客户后自动带出" />
              </label>
              <label>
                币种
                <Input
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                贸易条款
                <Input
                  value={form.trade_term}
                  onChange={(event) => setForm({ ...form, trade_term: event.target.value })}
                />
              </label>
              <label>
                付款条款
                <Input
                  value={form.payment_terms}
                  onChange={(event) => setForm({ ...form, payment_terms: event.target.value })}
                />
              </label>
              <label>
                计划出运日
                <Input
                  type="date"
                  value={form.planned_ship_date}
                  onInput={(event) => setForm({ ...form, planned_ship_date: event.currentTarget.value })}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                合同备注
                <Input
                  value={form.remarks}
                  onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                />
              </label>
            </div>
            <div className="contract-line-toolbar">
              <div>
                <div className="form-divider">合同商品明细</div>
                <p>已添加 {form.lines.length} 个商品，可分别填写条形码并调整规格、数量和销售单价。</p>
              </div>
              <Button icon={<Plus size={16} />} loading={loadingProducts} onClick={openProductDrawer}>
                添加商品
              </Button>
            </div>
            <Table<ExportContractLineFormState>
              className="contract-lines-table"
              dataSource={form.lines}
              locale={{ emptyText: '暂未添加商品，请点击“添加商品”批量选择' }}
              pagination={false}
              rowKey="key"
              scroll={{ x: 1200 }}
              size="small"
              columns={[
                {
                  title: '商品',
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
                  title: '条形码',
                  key: 'barcode',
                  width: 220,
                  render: (_, line) => (
                    <Input
                      aria-label={`${line.product_name}条形码`}
                      className="barcode-input"
                      inputMode="numeric"
                      maxLength={64}
                      placeholder="仅输入数字"
                      value={line.barcode}
                      onChange={(event) =>
                        updateContractLine(line.key, 'barcode', event.target.value.replace(/\D/g, ''))
                      }
                    />
                  ),
                },
                {
                  title: '规格 / 型号',
                  key: 'specification',
                  width: 210,
                  render: (_, line) => (
                    <div className="contract-line-stacked-fields">
                      <Input
                        aria-label={`${line.product_name}规格`}
                        placeholder="规格"
                        value={line.specification}
                        onChange={(event) => updateContractLine(line.key, 'specification', event.target.value)}
                      />
                      <Input
                        aria-label={`${line.product_name}型号`}
                        placeholder="型号"
                        value={line.model}
                        onChange={(event) => updateContractLine(line.key, 'model', event.target.value)}
                      />
                    </div>
                  ),
                },
                {
                  title: '数量',
                  key: 'quantity',
                  width: 130,
                  render: (_, line) => (
                    <Input
                      aria-label={`${line.product_name}数量`}
                      min="0.0001"
                      step="0.0001"
                      type="number"
                      value={line.quantity}
                      onChange={(event) => updateContractLine(line.key, 'quantity', event.target.value)}
                    />
                  ),
                },
                {
                  title: '单位',
                  key: 'unit',
                  width: 105,
                  render: (_, line) => (
                    <Input
                      aria-label={`${line.product_name}单位`}
                      value={line.unit}
                      onChange={(event) => updateContractLine(line.key, 'unit', event.target.value)}
                    />
                  ),
                },
                {
                  title: '销售单价',
                  key: 'unit_price',
                  width: 140,
                  render: (_, line) => (
                    <Input
                      aria-label={`${line.product_name}销售单价`}
                      min="0.0001"
                      step="0.0001"
                      type="number"
                      value={line.unit_price}
                      onChange={(event) => updateContractLine(line.key, 'unit_price', event.target.value)}
                    />
                  ),
                },
                {
                  title: '金额',
                  key: 'amount',
                  width: 140,
                  render: (_, line) =>
                    formatMoney((Number(line.quantity || 0) * Number(line.unit_price || 0)).toFixed(2), form.currency),
                },
                {
                  title: '操作',
                  key: 'actions',
                  width: 80,
                  render: (_, line) => (
                    <Button danger size="small" onClick={() => removeContractLine(line.key)}>
                      移除
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
                取消
              </Button>
              <Button className="inline-submit" htmlType="submit" type="primary" loading={submitting}>
                {editingContractId ? '保存合同' : '新增出口合同'}
              </Button>
            </div>
          </form>
        </Modal>

        <Drawer
          destroyOnHidden
          footer={(
            <div className="product-picker-actions">
              <span>已选择 {pendingProductIds.length} 项</span>
              <div>
                <Button onClick={closeProductDrawer}>取消</Button>
                <Button
                  disabled={pendingProductIds.length === 0}
                  type="primary"
                  onClick={addPendingProducts}
                >
                  添加 {pendingProductIds.length} 项
                </Button>
              </div>
            </div>
          )}
          open={productDrawerOpen}
          size="large"
          title="选择合同商品"
          zIndex={1100}
          onClose={closeProductDrawer}
        >
          <Input
            allowClear
            aria-label="搜索商品"
            className="product-picker-search"
            placeholder="搜索商品编号、名称、规格或型号"
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
                    aria-label={`${displayName}（${product.code}）`}
                    checked={pendingProductIds.includes(product.id)}
                    disabled={alreadyAdded}
                    onChange={(event) => togglePendingProduct(product.id, event.target.checked)}
                  >
                    <span className="product-picker-item-main">
                      <strong>{displayName}</strong>
                      <span>{product.code} · {[product.specification, product.model].filter(Boolean).join(' · ') || '暂无规格型号'}</span>
                    </span>
                  </Checkbox>
                  {alreadyAdded ? <span className="product-picker-added-label">已添加</span> : null}
                </div>
              )
            }) : (
              <div className="product-picker-empty">没有匹配的商品</div>
            )}
          </div>
        </Drawer>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="合同明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(exportContractPath)}>
              返回列表
            </Button>
          </div>
          {selectedContract ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/回签</dt>
                  <dd>{exportContractStatusLabel(selectedContract.approval_status)} / {signatureStatusLabel(selectedContract.signature_status)}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedContract.customer_name}</dd>
                </div>
                <div>
                  <dt>业务员</dt>
                  <dd>{selectedContract.sales_user_name ?? '未填'}</dd>
                </div>
                <div>
                  <dt>贸易条款</dt>
                  <dd>{selectedContract.trade_term}</dd>
                </div>
                <div>
                  <dt>付款条款</dt>
                  <dd>{selectedContract.payment_terms}</dd>
                </div>
                <div>
                  <dt>合同金额</dt>
                  <dd>{formatMoney(selectedContract.statistics.total_amount, selectedContract.currency)}</dd>
                </div>
                <div>
                  <dt>已采购/已出货</dt>
                  <dd>
                    {selectedContract.statistics.purchased_quantity} / {selectedContract.statistics.shipped_quantity}
                  </dd>
                </div>
                <div>
                  <dt>来源报价</dt>
                  <dd>{selectedContract.source_quotation_no ?? '未关联'}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>合同备注</strong>
                <p>{selectedContract.remarks ?? '未填写合同备注'}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedContract.approval_status !== 'draft'}
                  onClick={() => loadContractIntoForm(selectedContract)}
                >
                  载入编辑
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
                  提交审批
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
                  审批通过
                </Button>
                <Button loading={submitting} onClick={() => void exportContract('pdf')}>
                  导出 PDF
                </Button>
                <Button onClick={() => void openExportContractPrint(selectedContract.id)}>
                  打印单据
                </Button>
              </div>
              {selectedContract.approval_status === 'submitted' && !canApproveAssignedRecord(currentUser, selectedContract.reviewer_id, 'sales:contract:approve') ? (
                <Alert
                  message={`等待 ${selectedContract.reviewer_name ?? '指定审批人'} 审批`}
                  showIcon
                  type="info"
                />
              ) : null}

              {exportPreview ? (
                <div className="transaction-box export-preview">
                  <strong>合同导出预览</strong>
                  <pre>{exportPreview}</pre>
                </div>
              ) : null}

              <div className="contract-detail-split">
                <form className="record-form accessory-form" onSubmit={registerSignature}>
                  <div className="form-divider">客户回签</div>
                  <div className="form-pair two">
                    <label>
                      回签人
                      <Input
                        value={signatureForm.signed_by}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, signed_by: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      回签日期
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
                      回签方式
                      <Input
                        value={signatureForm.signature_method}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, signature_method: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      回签文件号
                      <Input
                        value={signatureForm.file_no}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, file_no: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    回签备注
                    <Input
                      value={signatureForm.remark}
                      onChange={(event) => setSignatureForm({ ...signatureForm, remark: event.target.value })}
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    登记回签
                  </Button>
                </form>

                <form className="record-form accessory-form" onSubmit={addAdvancePayment}>
                  <div className="form-divider">预收款</div>
                  <div className="form-pair two">
                    <label>
                      水单号
                      <Input
                        value={advancePaymentForm.payment_no}
                        onChange={(event) =>
                          setAdvancePaymentForm({ ...advancePaymentForm, payment_no: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      收款日期
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
                      金额
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
                      付款方
                      <Input
                        value={advancePaymentForm.payer_name}
                        onChange={(event) =>
                          setAdvancePaymentForm({ ...advancePaymentForm, payer_name: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    收款备注
                    <Input
                      value={advancePaymentForm.remark}
                      onChange={(event) =>
                        setAdvancePaymentForm({ ...advancePaymentForm, remark: event.target.value })
                      }
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    关联预收款
                  </Button>
                </form>
              </div>

              <Table<ExportContractLine>
                className="compact-section"
                columns={[
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '条形码', dataIndex: 'barcode', render: nullableText },
                  { title: '规格', dataIndex: 'specification', render: nullableText },
                  { title: '型号', dataIndex: 'model', render: nullableText },
                  { title: '数量', dataIndex: 'quantity', render: (_, line) => `${line.quantity} ${line.unit}` },
                  {
                    title: '销售单价',
                    dataIndex: 'unit_price',
                    render: (_, line) => formatMoney(line.unit_price, selectedContract.currency),
                  },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (_, line) => formatMoney(line.amount, selectedContract.currency),
                  },
                  { title: '已采购', dataIndex: 'purchased_quantity' },
                  { title: '已出货', dataIndex: 'shipped_quantity' },
                ]}
                dataSource={selectedContract.lines}
                locale={{ emptyText: '暂无合同商品明细' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="contract-media-row">
                <div className="product-photo compact-photo">
                  {selectedContract.lines[0]?.image_url ? (
                    <img src={selectedContract.lines[0].image_url} alt="" />
                  ) : (
                    <span>暂无商品图片</span>
                  )}
                </div>
                <dl className="detail-list compact-detail-list">
                  <div>
                    <dt>未采购数量</dt>
                    <dd>{selectedContract.statistics.unpurchased_quantity}</dd>
                  </div>
                  <div>
                    <dt>未出货金额</dt>
                    <dd>{formatMoney(selectedContract.statistics.unshipped_amount, selectedContract.currency)}</dd>
                  </div>
                  <div>
                    <dt>预收款合计</dt>
                    <dd>{formatMoney(selectedContract.statistics.advance_payment_amount, selectedContract.currency)}</dd>
                  </div>
                  <div>
                    <dt>客户回签日</dt>
                    <dd>{formatDate(selectedContract.customer_signed_at)}</dd>
                  </div>
                </dl>
              </div>

              <div className="accessory-heading">
                <strong>历史询报价参考</strong>
                <span>{history.length} 条</span>
              </div>
              <Table<ExportQuotation>
                columns={[
                  { title: '报价单', dataIndex: 'code' },
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '日期', dataIndex: 'quote_date', render: formatDate },
                  {
                    title: '金额',
                    dataIndex: 'total_amount',
                    render: (_, quotation) => formatMoney(quotation.total_amount, quotation.currency),
                  },
                ]}
                dataSource={history}
                locale={{ emptyText: '暂无历史询报价参考' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>合同采购情况</strong>
                <span>{selectedContract.purchase_statuses.length} 条</span>
              </div>
              <Table<ExportContractPurchaseStatus>
                columns={[
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '合同数量', dataIndex: 'total_quantity' },
                  { title: '已采购', dataIndex: 'purchased_quantity' },
                  { title: '未采购', dataIndex: 'unpurchased_quantity' },
                  { title: '状态', dataIndex: 'status', render: contractProgressStatusLabel },
                ]}
                dataSource={selectedContract.purchase_statuses}
                locale={{ emptyText: '暂无采购履约情况' }}
                pagination={false}
                rowKey={(item) => `${item.product_id ?? item.product_code ?? item.product_name}-purchase`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>合同出货情况</strong>
                <span>{selectedContract.shipment_statuses.length} 条</span>
              </div>
              <Table<ExportContractShipmentStatus>
                columns={[
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '计划出运日', dataIndex: 'planned_ship_date', render: formatDate },
                  { title: '合同数量', dataIndex: 'total_quantity' },
                  { title: '已出货', dataIndex: 'shipped_quantity' },
                  { title: '未出货', dataIndex: 'unshipped_quantity' },
                  {
                    title: '未出货金额',
                    dataIndex: 'unshipped_amount',
                    render: (_, item) => formatMoney(item.unshipped_amount, selectedContract.currency),
                  },
                  { title: '状态', dataIndex: 'status', render: contractProgressStatusLabel },
                ]}
                dataSource={selectedContract.shipment_statuses}
                locale={{ emptyText: '暂无出货履约情况' }}
                pagination={false}
                rowKey={(item) => `${item.product_id ?? item.product_code ?? item.product_name}-shipment`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>回签记录</strong>
                <span>{selectedContract.signatures.length} 条</span>
              </div>
              <Table<ExportContractSignature>
                columns={[
                  { title: '回签人', dataIndex: 'signed_by' },
                  { title: '回签日期', dataIndex: 'signed_at', render: formatDate },
                  { title: '方式', dataIndex: 'signature_method' },
                  { title: '文件号', dataIndex: 'file_no', render: nullableText },
                  { title: '备注', dataIndex: 'remark', render: nullableText },
                ]}
                dataSource={selectedContract.signatures}
                locale={{ emptyText: '暂无回签记录' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>预收款记录</strong>
                <span>{selectedContract.advance_payments.length} 条</span>
              </div>
              <Table<ExportContractAdvancePayment>
                columns={[
                  { title: '水单号', dataIndex: 'payment_no' },
                  { title: '收款日期', dataIndex: 'received_at', render: formatDate },
                  { title: '付款方', dataIndex: 'payer_name' },
                  { title: '金额', dataIndex: 'amount', render: (_, payment) => formatMoney(payment.amount, payment.currency) },
                  { title: '备注', dataIndex: 'remark', render: nullableText },
                ]}
                dataSource={selectedContract.advance_payments}
                locale={{ emptyText: '暂无预收款记录' }}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FileStack size={28} />
              <strong>暂无出口合同</strong>
              <span>请返回列表选择合同查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
