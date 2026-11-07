import { downloadBase64File } from '../../../shared/print'
import {
  Alert,
  Button,
  Descriptions as _Descriptions,
  Input,
  Modal,
  Table,
  Tag as _Tag,
  Select,
} from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, FileSpreadsheet, FileStack } from 'lucide-react'
import type { FormEvent, MouseEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  approvePurchaseContract,
  createPurchaseContract,
  generatePurchaseContractFromExportContracts,
  generatePurchaseContractTemplate,
  listPurchaseContractReminders,
  listPurchaseContracts,
  submitPurchaseContract,
  updatePurchaseContract,
  type CurrentUser,
  type PurchaseContract,
  type PurchaseContractApprovePayload,
  type PurchaseContractCreatePayload,
  type PurchaseContractGeneratePayload,
  type PurchaseContractLine as _PurchaseContractLine,
  type PurchaseContractReminder,
  type PurchaseContractSourceLink as _PurchaseContractSourceLink,
  type Supplier,
  AssignableUser,
  Product,
  listAssignableUsers,
  listProducts,
  listSuppliers,
} from '../../../api'
import { purchaseContractPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError, showWarningDialog } from '../../../shared/errors'
import {
  purchaseContractStatusOptions,
  purchaseContractSourceTypeOptions,
} from '../../../shared/formOptions'
import {
  canApproveAssignedRecord,
  formatDate,
  formatMoney,
  nullableText as _nullableText,
  todayInputValue,
  type RoutedDetailPageProps,
  emptyToNull,
} from '../appHelpers'
import { ApprovalAssigneeSelect } from '../../components/ApprovalAssigneeSelect'
import { t } from '../../appI18n'

function supplierOptionLabel(supplier: Supplier): string {
  return [supplier.code, supplier.cn_name, supplier.en_name].filter(Boolean).join(' / ')
}

function assignableUserOptionLabel(user: AssignableUser): string {
  return [user.display_name, user.username, user.department_name].filter(Boolean).join(' / ')
}

function productOptionLabel(product: Product): string {
  return [product.code, product.cn_name, product.en_name].filter(Boolean).join(' / ')
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

function mergePurchaseLineRemark(current: string, addition: string): string {
  if (!current.trim()) return addition
  if (current.includes(addition)) return current
  return `${current}; ${addition}`
}

type PurchaseContractFormState = {
  code: string
  contract_date: string
  supplier_id: string
  supplier_name: string
  buyer_user_id: string
  buyer_user_name: string
  qc_user_id: string
  qc_user_name: string
  currency: string
  delivery_date: string
  payment_terms: string
  source_type: PurchaseContractCreatePayload['source_type']
  remarks: string
  product_id: string
  product_code: string
  product_name: string
  specification: string
  model: string
  quantity: string
  unit: string
  unit_price: string
  source_export_contract_id: string
  source_export_contract_no: string
  source_export_contract_line_id: string
  line_remark: string
}

type PurchaseContractGenerateFormState = {
  code: string
  contract_date: string
  source_contract_id_a: string
  source_contract_id_b: string
  supplier_id: string
  supplier_name: string
  buyer_user_id: string
  buyer_user_name: string
  qc_user_id: string
  qc_user_name: string
  currency: string
  delivery_date: string
  unit_price: string
  payment_terms: string
  remarks: string
}

type PurchaseContractApproveFormState = {
  reviewer_name: string
  approved_at: string
  rejection_reason: string
}

function initialPurchaseContractForm(): PurchaseContractFormState {
  return {
    code: `PC-${Date.now().toString().slice(-6)}`,
    contract_date: todayInputValue(),
    supplier_id: '',
    supplier_name: '',
    buyer_user_id: '',
    buyer_user_name: '',
    qc_user_id: '',
    qc_user_name: '',
    currency: 'RMB',
    delivery_date: todayInputValue(),
    payment_terms: '',
    source_type: 'manual',
    remarks: '',
    product_id: '',
    product_code: '',
    product_name: '',
    specification: '',
    model: '',
    quantity: '1',
    unit: 'pcs',
    unit_price: '0',
    source_export_contract_id: '',
    source_export_contract_no: '',
    source_export_contract_line_id: '',
    line_remark: '',
  }
}

function initialPurchaseContractGenerateForm(): PurchaseContractGenerateFormState {
  return {
    code: `PC-${Date.now().toString().slice(-6)}`,
    contract_date: todayInputValue(),
    source_contract_id_a: '',
    source_contract_id_b: '',
    supplier_id: 'supplier-accessory-a',
    supplier_name: '',
    buyer_user_id: 'u-001',
    buyer_user_name: '',
    qc_user_id: '',
    qc_user_name: '',
    currency: 'USD',
    delivery_date: todayInputValue(),
    unit_price: '0.12',
    payment_terms: '30% advance, 70% before delivery',
    remarks: '',
  }
}

function initialPurchaseContractApproveForm(): PurchaseContractApproveFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
    rejection_reason: '',
  }
}

function purchaseContractToForm(contract: PurchaseContract): PurchaseContractFormState {
  const line = contract.lines[0]
  return {
    code: contract.code,
    contract_date: contract.contract_date,
    supplier_id: contract.supplier_id ?? '',
    supplier_name: contract.supplier_name,
    buyer_user_id: contract.buyer_user_id ?? '',
    buyer_user_name: contract.buyer_user_name ?? '',
    qc_user_id: contract.qc_user_id ?? '',
    qc_user_name: contract.qc_user_name ?? '',
    currency: contract.currency,
    delivery_date: contract.delivery_date,
    payment_terms: contract.payment_terms,
    source_type: contract.source_type as PurchaseContractCreatePayload['source_type'],
    remarks: contract.remarks ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    specification: line?.specification ?? '',
    model: line?.model ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
    unit_price: line?.unit_price ?? '0',
    source_export_contract_id: line?.source_export_contract_id ?? '',
    source_export_contract_no: line?.source_export_contract_no ?? '',
    source_export_contract_line_id: line?.source_export_contract_line_id ?? '',
    line_remark: line?.remark ?? '',
  }
}

function purchaseContractPayload(form: PurchaseContractFormState): PurchaseContractCreatePayload {
  return {
    code: form.code.trim(),
    contract_date: form.contract_date,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    buyer_user_id: emptyToNull(form.buyer_user_id),
    buyer_user_name: emptyToNull(form.buyer_user_name),
    qc_user_id: emptyToNull(form.qc_user_id),
    qc_user_name: emptyToNull(form.qc_user_name),
    currency: form.currency.trim(),
    delivery_date: form.delivery_date,
    payment_terms: form.payment_terms.trim(),
    source_type: form.source_type,
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
        unit_price: form.unit_price,
        source_export_contract_id: emptyToNull(form.source_export_contract_id),
        source_export_contract_no: emptyToNull(form.source_export_contract_no),
        source_export_contract_line_id: emptyToNull(form.source_export_contract_line_id),
        remark: emptyToNull(form.line_remark),
      },
    ],
  }
}

function purchaseContractGeneratePayload(
  form: PurchaseContractGenerateFormState,
): PurchaseContractGeneratePayload {
  const sources = [form.source_contract_id_a, form.source_contract_id_b]
    .map((item) => item.trim())
    .filter(Boolean)
    .map((export_contract_id) => ({ export_contract_id }))

  return {
    code: form.code.trim(),
    contract_date: form.contract_date,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    buyer_user_id: emptyToNull(form.buyer_user_id),
    buyer_user_name: emptyToNull(form.buyer_user_name),
    qc_user_id: emptyToNull(form.qc_user_id),
    qc_user_name: emptyToNull(form.qc_user_name),
    currency: form.currency.trim(),
    delivery_date: form.delivery_date,
    payment_terms: form.payment_terms.trim(),
    unit_price: form.unit_price,
    remarks: emptyToNull(form.remarks),
    sources,
  }
}

function purchaseContractApprovePayload(
  form: PurchaseContractApproveFormState,
  decision: PurchaseContractApprovePayload['decision'],
): PurchaseContractApprovePayload {
  return {
    decision,
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
    rejection_reason: decision === 'rejected' ? form.rejection_reason.trim() : null,
  }
}

function purchaseContractStatusLabel(value: string): string {
  const option = purchaseContractStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function purchaseContractSourceTypeLabel(value: string): string {
  const option = purchaseContractSourceTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function purchaseReminderTypeLabel(value: string): string {
  if (value === 'payment') return t('purchase.contract.detail.reminderTypePayment')
  if (value === 'delivery') return t('purchase.contract.detail.reminderTypeDelivery')
  return value
}

function purchaseReminderStatusLabel(value: string): string {
  if (value === 'open') return t('purchase.contract.detail.reminderStatusOpen')
  if (value === 'closed') return t('purchase.contract.detail.reminderStatusClosed')
  return value
}

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function PurchaseContractsPage({ currentUser, detailId, onNavigate }: Props) {
  const [contracts, setContracts] = useState<PurchaseContract[]>([])
  const [reminders, setReminders] = useState<PurchaseContractReminder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [editingContractId, setEditingContractId] = useState<string | null>(null)
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [contractModalMode, setContractModalMode] = useState<'manual' | 'generate'>('manual')
  const [contractApprovalModalOpen, setContractApprovalModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<PurchaseContractFormState>(() => initialPurchaseContractForm())
  const [reviewerId, setReviewerId] = useState('')
  const [generateForm, setGenerateForm] = useState<PurchaseContractGenerateFormState>(() =>
    initialPurchaseContractGenerateForm(),
  )
  const [approveForm, setApproveForm] = useState<PurchaseContractApproveFormState>(() =>
    initialPurchaseContractApproveForm(),
  )

  const selectedContract = useMemo(() => {
    if (detailId) return contracts.find((item) => item.id === detailId) ?? null
    return contracts.find((item) => item.id === selectedContractId) ?? contracts[0] ?? null
  }, [contracts, detailId, selectedContractId])

  useEffect(() => {
    void loadContracts()
    void loadContractReminders()
    void loadProductsForContract()
    void loadSuppliersForContract()
    void loadAssignableUsersForContract()
  }, [])

  useEffect(() => {
    setApproveForm({
      reviewer_name: selectedContract?.reviewer_name ?? '',
      approved_at:
        selectedContract?.approved_at ?? selectedContract?.contract_date ?? todayInputValue(),
      rejection_reason: selectedContract?.rejection_reason ?? '',
    })
    setReviewerId(selectedContract?.reviewer_id ?? '')
    if (selectedContract) {
      setGenerateForm((current) => ({
        ...current,
        supplier_id: selectedContract.supplier_id ?? current.supplier_id,
        supplier_name: selectedContract.supplier_name,
        currency: selectedContract.currency,
      }))
      setForm((current) => ({
        ...current,
        supplier_id: selectedContract.supplier_id ?? current.supplier_id,
        supplier_name: selectedContract.supplier_name,
        currency: selectedContract.currency,
      }))
    }
  }, [selectedContract?.id, selectedContract?.approval_status])

  useEffect(() => {
    if (detailId && contracts.length > 0 && !contracts.some((item) => item.id === detailId)) {
      onNavigate(purchaseContractPath)
    }
  }, [contracts, detailId, onNavigate])

  async function loadContracts(preferredId?: string, preferredContract?: PurchaseContract) {
    setLoading(true)
    try {
      const result = await listPurchaseContracts({
        q: search.trim() || undefined,
        approval_status: statusFilter || undefined,
        supplier_id: supplierFilter.trim() || undefined,
        source_type: sourceFilter || undefined,
      })
      const items = preferredContract
        ? [preferredContract, ...result.items.filter((item) => item.id !== preferredContract.id)]
        : result.items
      setContracts(items)
      const nextSelectedId =
        preferredId ??
        (items.some((item) => item.id === selectedContractId) ? selectedContractId : null) ??
        items[0]?.id ??
        null
      setSelectedContractId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadContractReminders() {
    try {
      const result = await listPurchaseContractReminders()
      setReminders(result.items)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.reminderLoadFailed'))
    }
  }

  async function loadProductsForContract() {
    setLoadingProducts(true)
    try {
      const result = await listProducts()
      setProducts(result.items)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.productLoadFailed'))
    } finally {
      setLoadingProducts(false)
    }
  }

  async function loadSuppliersForContract() {
    setLoadingSuppliers(true)
    try {
      const result = await listSuppliers()
      setSuppliers(result.items)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.supplierLoadFailed'))
    } finally {
      setLoadingSuppliers(false)
    }
  }

  async function loadAssignableUsersForContract() {
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers('quality:inspection:edit')
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.userLoadFailed'))
    } finally {
      setLoadingAssignableUsers(false)
    }
  }

  function applyQcUserToPurchaseContractForm(userId: string | undefined) {
    const user = userId ? assignableUsers.find((item) => item.id === userId) : null
    setForm((current) => ({
      ...current,
      qc_user_id: user?.id ?? '',
      qc_user_name: user?.display_name ?? '',
    }))
  }

  function applyQcUserToPurchaseContractGenerateForm(userId: string | undefined) {
    const user = userId ? assignableUsers.find((item) => item.id === userId) : null
    setGenerateForm((current) => ({
      ...current,
      qc_user_id: user?.id ?? '',
      qc_user_name: user?.display_name ?? '',
    }))
  }

  function upsertContract(contract: PurchaseContract) {
    setContracts((current) => {
      const exists = current.some((item) => item.id === contract.id)
      return exists
        ? current.map((item) => (item.id === contract.id ? contract : item))
        : [contract, ...current]
    })
    setSelectedContractId(contract.id)
  }

  function openPurchaseContractDetail(contract: PurchaseContract) {
    setSelectedContractId(contract.id)
    onNavigate(moduleDetailPath(purchaseContractPath, contract.id))
  }

  function stopAndOpenPurchaseContractDetail(
    event: MouseEvent<HTMLElement>,
    contract: PurchaseContract,
  ) {
    event.stopPropagation()
    openPurchaseContractDetail(contract)
  }

  function applyProductToPurchaseContractForm(productId: string | undefined) {
    if (!productId) {
      setForm((current) => ({
        ...current,
        product_id: '',
      }))
      return
    }
    const product = products.find((item) => item.id === productId)
    if (!product) return
    setForm((current) => ({
      ...current,
      product_id: product.id,
      product_code: product.code,
      product_name: product.cn_name,
      specification: product.specification ?? '',
      model: product.model ?? '',
      unit: product.unit,
      line_remark: product.package_info
        ? mergePurchaseLineRemark(
            current.line_remark,
            t('purchase.contract.message.packageRemark', { info: product.package_info }),
          )
        : current.line_remark,
    }))
  }

  function applySupplierToPurchaseContractForm(supplierId: string | undefined) {
    if (!supplierId) {
      setForm((current) => ({
        ...current,
        supplier_id: '',
      }))
      return
    }
    const supplier = suppliers.find((item) => item.id === supplierId)
    if (!supplier) return
    setForm((current) => ({
      ...current,
      supplier_id: supplier.id,
      supplier_name: supplier.cn_name,
    }))
  }

  async function submitContractForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const payload = purchaseContractPayload(form)
      const saved = editingContractId
        ? await updatePurchaseContract(editingContractId, payload)
        : await createPurchaseContract(payload)
      setMessage(
        editingContractId
          ? t('purchase.contract.message.saved', { code: saved.code })
          : t('purchase.contract.message.created', { code: saved.code }),
      )
      setEditingContractId(null)
      setContractModalMode('manual')
      setForm(initialPurchaseContractForm())
      setContractModalOpen(false)
      upsertContract(saved)
      await Promise.all([loadContracts(saved.id, saved), loadContractReminders()])
      upsertContract(saved)
    } catch (caught) {
      showError(caught, t('purchase.contract.message.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function generateContractFromSources(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    const sources = [generateForm.source_contract_id_a, generateForm.source_contract_id_b]
      .map((item) => item.trim())
      .filter(Boolean)
    if (sources.length === 0) {
      showWarningDialog(t('purchase.contract.validation.exportContractRequired'))
      setSubmitting(false)
      return
    }
    try {
      const generated = await generatePurchaseContractFromExportContracts(
        purchaseContractGeneratePayload(generateForm),
      )
      setMessage(t('purchase.contract.message.generated', { code: generated.code }))
      setContractModalMode('manual')
      setGenerateForm(initialPurchaseContractGenerateForm())
      setContractModalOpen(false)
      upsertContract(generated)
      await Promise.all([loadContracts(generated.id, generated), loadContractReminders()])
    } catch (caught) {
      showError(caught, t('purchase.contract.message.generateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSelectedContract() {
    if (!selectedContract) return
    if (!reviewerId) {
      showError(new Error(t('purchase.contract.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const submitted = await submitPurchaseContract(selectedContract.id, {
        reviewer_id: reviewerId,
      })
      setMessage(t('purchase.contract.message.submitted', { code: submitted.code }))
      upsertContract(submitted)
      await Promise.all([loadContracts(submitted.id, submitted), loadContractReminders()])
    } catch (caught) {
      showError(caught, t('purchase.contract.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function reviewSelectedContract(decision: PurchaseContractApprovePayload['decision']) {
    if (!selectedContract) return
    if (
      !canApproveAssignedRecord(
        currentUser,
        selectedContract.reviewer_id,
        'purchase:contract:approve',
      )
    ) {
      showError(
        new Error(
          t('purchase.contract.action.approverMismatch', {
            name: selectedContract.reviewer_name ?? t('purchase.contract.action.defaultReviewer'),
          }),
        ),
      )
      return
    }
    if (decision === 'rejected' && !approveForm.rejection_reason.trim()) {
      showWarningDialog(t('purchase.contract.validation.rejectionReasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const reviewed = await approvePurchaseContract(
        selectedContract.id,
        purchaseContractApprovePayload(approveForm, decision),
      )
      setMessage(
        decision === 'approved'
          ? t('purchase.contract.message.approved', { code: reviewed.code })
          : t('purchase.contract.message.rejected', { code: reviewed.code }),
      )
      setContractApprovalModalOpen(false)
      upsertContract(reviewed)
      await Promise.all([loadContracts(reviewed.id, reviewed), loadContractReminders()])
    } catch (caught) {
      showError(caught, t('purchase.contract.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function confirmRejectSelectedContract() {
    if (!approveForm.rejection_reason.trim()) {
      showWarningDialog(t('purchase.contract.validation.rejectionReasonRequired'))
      return
    }
    Modal.confirm({
      centered: true,
      title: t('purchase.contract.action.confirmRejectTitle'),
      content: t('purchase.contract.action.confirmRejectContent'),
      okText: t('purchase.contract.action.confirmReject'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: () => reviewSelectedContract('rejected'),
    })
  }

  async function generateSelectedContractTemplate() {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    try {
      const document_ = await generatePurchaseContractTemplate(selectedContract.id)
      downloadBase64File(document_.filename, document_.content_base64, document_.content_type)
      setMessage(t('purchase.contract.message.templateGenerated', { filename: document_.filename }))
    } catch (caught) {
      showError(caught, t('purchase.contract.message.templateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openCreateContract() {
    setEditingContractId(null)
    setContractModalMode('manual')
    setForm(initialPurchaseContractForm())
    setMessage('')
    setContractModalOpen(true)
  }

  function openGenerateContract() {
    setEditingContractId(null)
    setContractModalMode('generate')
    setGenerateForm(initialPurchaseContractGenerateForm())
    setMessage('')
    setContractModalOpen(true)
  }

  function loadSelectedContractForEdit() {
    if (!selectedContract) return
    setEditingContractId(selectedContract.id)
    setContractModalMode('manual')
    setForm(purchaseContractToForm(selectedContract))
    setMessage(t('purchase.contract.message.editing', { code: selectedContract.code }))
    setContractModalOpen(true)
  }

  function cancelContractEdit() {
    setEditingContractId(null)
    setContractModalMode('manual')
    setForm(initialPurchaseContractForm())
    setContractModalOpen(false)
  }

  const totalAmount = contracts.reduce((sum, item) => sum + Number(item.statistics.total_amount), 0)
  const openReminders = reminders.filter((item) => item.status === 'open').length
  const currency = contracts[0]?.currency ?? 'USD'

  return (
    <section className="purchase-contract-page">
      <div className="summary-strip" aria-label={t('purchase.contract.metric.overviewAria')}>
        <Metric label={t('purchase.contract.metric.contractCount')} value={contracts.length} />
        <Metric
          label={t('purchase.contract.metric.pendingApproval')}
          value={contracts.filter((item) => item.approval_status === 'submitted').length}
        />
        <Metric
          label={t('purchase.contract.metric.approvedCount')}
          value={contracts.filter((item) => item.approval_status === 'approved').length}
        />
        <Metric
          label={t('purchase.contract.metric.contractAmount')}
          value={formatMoney(totalAmount.toFixed(2), currency)}
        />
        <Metric label={t('purchase.contract.metric.openReminders')} value={openReminders} />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid purchase-contract-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Search size={18} />} title={t('purchase.contract.list.title')} />
              <form
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadContracts()
                }}
              >
                <label>
                  {t('purchase.contract.list.searchLabel')}
                  <Input
                    value={search}
                    placeholder={t('purchase.contract.list.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('purchase.contract.list.statusFilter')}
                  <FormSelect
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">{t('purchase.contract.list.allStatuses')}</option>
                    {purchaseContractStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('purchase.contract.list.sourceFilter')}
                  <FormSelect
                    value={sourceFilter}
                    onChange={(event) => setSourceFilter(event.target.value)}
                  >
                    <option value="">{t('purchase.contract.list.allSources')}</option>
                    {purchaseContractSourceTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('purchase.contract.list.supplierFilter')}
                  <Input
                    value={supplierFilter}
                    placeholder={t('purchase.contract.list.supplierFilterPlaceholder')}
                    onChange={(event) => setSupplierFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('purchase.contract.list.query')}
                </Button>
                <Button
                  htmlType="button"
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={openCreateContract}
                >
                  {t('purchase.contract.list.create')}
                </Button>
                <Button
                  htmlType="button"
                  icon={<FileStack size={16} />}
                  onClick={openGenerateContract}
                >
                  {t('purchase.contract.list.generate')}
                </Button>
              </form>
            </div>

            <Table<PurchaseContract>
              columns={[
                {
                  title: t('purchase.contract.field.contract'),
                  dataIndex: 'code',
                  render: (value: string, record: PurchaseContract) => (
                    <button
                      className="row-button"
                      type="button"
                      onClick={(event) => stopAndOpenPurchaseContractDetail(event, record)}
                    >
                      {value}
                    </button>
                  ),
                },
                {
                  title: t('purchase.contract.field.status'),
                  dataIndex: 'approval_status',
                  render: purchaseContractStatusLabel,
                },
                {
                  title: t('purchase.contract.field.source'),
                  dataIndex: 'source_type',
                  render: purchaseContractSourceTypeLabel,
                },
                { title: t('purchase.contract.field.supplier'), dataIndex: 'supplier_name' },
                {
                  title: t('purchase.contract.field.qcUser'),
                  dataIndex: 'qc_user_name',
                  render: (value: string | null) => value ?? t('common.notSet'),
                },
                {
                  title: t('purchase.contract.field.deliveryDay'),
                  dataIndex: 'delivery_date',
                  render: formatDate,
                },
                {
                  title: t('purchase.contract.field.amount'),
                  dataIndex: 'statistics',
                  render: (_, contract) =>
                    formatMoney(contract.statistics.total_amount, contract.currency),
                },
                {
                  title: t('purchase.contract.field.entry'),
                  key: 'detail',
                  width: 110,
                  render: (_: unknown, record: PurchaseContract) => (
                    <Button
                      size="small"
                      onClick={(event) => stopAndOpenPurchaseContractDetail(event, record)}
                    >
                      {t('purchase.contract.action.viewDetail')}
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
          open={contractModalOpen}
          title={
            editingContractId
              ? t('purchase.contract.form.editTitle')
              : contractModalMode === 'generate'
                ? t('purchase.contract.form.generateTitle')
                : t('purchase.contract.form.createTitle')
          }
          width={1040}
          onCancel={cancelContractEdit}
        >
          <div className="workflow-modal-content entity-modal-form">
            {contractModalMode === 'manual' ? (
              <>
                <PanelTitle
                  icon={<LayoutDashboard size={18} />}
                  title={
                    editingContractId
                      ? t('purchase.contract.form.editTitle')
                      : t('purchase.contract.form.manualTitle')
                  }
                />
                <form className="record-form" onSubmit={submitContractForm}>
                  <div className="form-pair two">
                    <label>
                      {t('purchase.contract.field.code')}
                      <Input
                        value={form.code}
                        onChange={(event) => setForm({ ...form, code: event.target.value })}
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.contractDate')}
                      <Input
                        type="date"
                        value={form.contract_date}
                        onInput={(event) =>
                          setForm({ ...form, contract_date: event.currentTarget.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair three">
                    <label>
                      {t('purchase.contract.form.selectSupplier')}
                      <Select
                        showSearch
                        loading={loadingSuppliers}
                        value={form.supplier_id || undefined}
                        placeholder={
                          suppliers.length > 0
                            ? t('purchase.contract.form.supplierSelectPlaceholder')
                            : t('purchase.contract.form.supplierMissing')
                        }
                        optionFilterProp="label"
                        notFoundContent={
                          loadingSuppliers
                            ? t('purchase.contract.form.loadingSuppliers')
                            : t('purchase.contract.form.noSuppliers')
                        }
                        onChange={applySupplierToPurchaseContractForm}
                      >
                        {renderSupplierOptions(suppliers)}
                      </Select>
                    </label>
                    <label>
                      {t('purchase.contract.field.factoryId')}
                      <Input
                        value={form.supplier_id}
                        readOnly
                        placeholder={t('purchase.contract.form.supplierIdPlaceholder')}
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.factoryName')}
                      <Input
                        value={form.supplier_name}
                        onChange={(event) =>
                          setForm({ ...form, supplier_name: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      {t('purchase.contract.field.buyer')}
                      <Input
                        value={form.buyer_user_name}
                        onChange={(event) =>
                          setForm({ ...form, buyer_user_name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.buyerId')}
                      <Input
                        value={form.buyer_user_id}
                        onChange={(event) =>
                          setForm({ ...form, buyer_user_id: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      {t('purchase.contract.field.qcUser')}
                      <Select
                        showSearch
                        loading={loadingAssignableUsers}
                        value={form.qc_user_id || undefined}
                        placeholder={
                          assignableUsers.length > 0
                            ? t('purchase.contract.form.userSelectPlaceholder')
                            : t('purchase.contract.form.noUsers')
                        }
                        optionFilterProp="label"
                        notFoundContent={
                          loadingAssignableUsers
                            ? t('purchase.contract.form.loadingUsers')
                            : t('purchase.contract.form.noUsers')
                        }
                        onChange={applyQcUserToPurchaseContractForm}
                      >
                        {renderAssignableUserOptions(assignableUsers)}
                      </Select>
                    </label>
                  </div>
                  <div className="form-pair three">
                    <label>
                      {t('purchase.contract.field.currency')}
                      <Input
                        value={form.currency}
                        onChange={(event) => setForm({ ...form, currency: event.target.value })}
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.deliveryDate')}
                      <Input
                        type="date"
                        value={form.delivery_date}
                        onInput={(event) =>
                          setForm({ ...form, delivery_date: event.currentTarget.value })
                        }
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.source')}
                      <FormSelect
                        value={form.source_type}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            source_type: event.target
                              .value as PurchaseContractCreatePayload['source_type'],
                          })
                        }
                      >
                        {purchaseContractSourceTypeOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {t(item.labelKey)}
                          </option>
                        ))}
                      </FormSelect>
                    </label>
                  </div>
                  <label>
                    {t('purchase.contract.field.paymentTerms')}
                    <Input
                      value={form.payment_terms}
                      onChange={(event) => setForm({ ...form, payment_terms: event.target.value })}
                    />
                  </label>

                  <div className="form-divider">{t('purchase.contract.form.linesTitle')}</div>
                  <div className="form-pair two">
                    <label>
                      {t('purchase.contract.form.selectProduct')}
                      <Select
                        showSearch
                        loading={loadingProducts}
                        value={form.product_id || undefined}
                        placeholder={
                          products.length > 0
                            ? t('purchase.contract.form.productSelectPlaceholder')
                            : t('purchase.contract.form.productMissing')
                        }
                        optionFilterProp="label"
                        notFoundContent={
                          loadingProducts
                            ? t('purchase.contract.form.loadingProducts')
                            : t('purchase.contract.form.noProducts')
                        }
                        onChange={applyProductToPurchaseContractForm}
                      >
                        {renderProductOptions(products)}
                      </Select>
                    </label>
                    <label>
                      {t('purchase.contract.field.productCode')}
                      <Input
                        value={form.product_code}
                        onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    {t('purchase.contract.field.productName')}
                    <Input
                      value={form.product_name}
                      onChange={(event) => setForm({ ...form, product_name: event.target.value })}
                    />
                  </label>
                  <label>
                    {t('purchase.contract.field.productId')}
                    <Input
                      value={form.product_id}
                      readOnly
                      placeholder={t('purchase.contract.form.productIdPlaceholder')}
                    />
                  </label>
                  <div className="form-pair two">
                    <label>
                      {t('purchase.contract.field.specification')}
                      <Input
                        value={form.specification}
                        onChange={(event) =>
                          setForm({ ...form, specification: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.model')}
                      <Input
                        value={form.model}
                        onChange={(event) => setForm({ ...form, model: event.target.value })}
                      />
                    </label>
                  </div>
                  <div className="form-pair three">
                    <label>
                      {t('purchase.contract.field.quantity')}
                      <Input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={form.quantity}
                        onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.unit')}
                      <Input
                        value={form.unit}
                        onChange={(event) => setForm({ ...form, unit: event.target.value })}
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.unitPrice')}
                      <Input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={form.unit_price}
                        onChange={(event) => setForm({ ...form, unit_price: event.target.value })}
                      />
                    </label>
                  </div>
                  <div className="form-pair three">
                    <label>
                      {t('purchase.contract.field.sourceExportContractId')}
                      <Input
                        value={form.source_export_contract_id}
                        onChange={(event) =>
                          setForm({ ...form, source_export_contract_id: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.sourceContractNo')}
                      <Input
                        value={form.source_export_contract_no}
                        onChange={(event) =>
                          setForm({ ...form, source_export_contract_no: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.sourceLineId')}
                      <Input
                        value={form.source_export_contract_line_id}
                        onChange={(event) =>
                          setForm({ ...form, source_export_contract_line_id: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    {t('purchase.contract.field.lineRemark')}
                    <Input
                      value={form.line_remark}
                      onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
                    />
                  </label>
                  <label>
                    {t('purchase.contract.field.remarks')}
                    <Input.TextArea
                      rows={2}
                      value={form.remarks}
                      onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting} type="primary">
                    {editingContractId
                      ? t('purchase.contract.form.save')
                      : t('purchase.contract.form.createTitle')}
                  </Button>
                  {editingContractId ? (
                    <Button onClick={cancelContractEdit}>
                      {t('purchase.contract.form.cancelEdit')}
                    </Button>
                  ) : null}
                </form>
              </>
            ) : (
              <>
                <PanelTitle
                  icon={<FileStack size={18} />}
                  title={t('purchase.contract.form.generateFromApprovedTitle')}
                />

                <form
                  className="record-form accessory-form generation-form"
                  onSubmit={generateContractFromSources}
                >
                  <div className="form-divider">
                    {t('purchase.contract.form.generateFromApprovedTitle')}
                  </div>
                  <div className="form-pair two">
                    <label>
                      {t('purchase.contract.field.purchaseContractCode')}
                      <Input
                        value={generateForm.code}
                        onChange={(event) =>
                          setGenerateForm({ ...generateForm, code: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.contractDate')}
                      <Input
                        type="date"
                        value={generateForm.contract_date}
                        onInput={(event) =>
                          setGenerateForm({
                            ...generateForm,
                            contract_date: event.currentTarget.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      {t('purchase.contract.field.exportContractIdA')}
                      <Input
                        value={generateForm.source_contract_id_a}
                        onChange={(event) =>
                          setGenerateForm({
                            ...generateForm,
                            source_contract_id_a: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.exportContractIdB')}
                      <Input
                        value={generateForm.source_contract_id_b}
                        onChange={(event) =>
                          setGenerateForm({
                            ...generateForm,
                            source_contract_id_b: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      {t('purchase.contract.field.supplierId')}
                      <Input
                        value={generateForm.supplier_id}
                        onChange={(event) =>
                          setGenerateForm({ ...generateForm, supplier_id: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.supplier')}
                      <Input
                        value={generateForm.supplier_name}
                        onChange={(event) =>
                          setGenerateForm({ ...generateForm, supplier_name: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair three">
                    <label>
                      {t('purchase.contract.field.currency')}
                      <Input
                        value={generateForm.currency}
                        onChange={(event) =>
                          setGenerateForm({ ...generateForm, currency: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.deliveryDate')}
                      <Input
                        type="date"
                        value={generateForm.delivery_date}
                        onInput={(event) =>
                          setGenerateForm({
                            ...generateForm,
                            delivery_date: event.currentTarget.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      {t('purchase.contract.field.accessoryUnitPrice')}
                      <Input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={generateForm.unit_price}
                        onChange={(event) =>
                          setGenerateForm({ ...generateForm, unit_price: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      {t('purchase.contract.field.qcUser')}
                      <Select
                        showSearch
                        loading={loadingAssignableUsers}
                        value={generateForm.qc_user_id || undefined}
                        placeholder={
                          assignableUsers.length > 0
                            ? t('purchase.contract.form.userSelectPlaceholder')
                            : t('purchase.contract.form.noUsers')
                        }
                        optionFilterProp="label"
                        notFoundContent={
                          loadingAssignableUsers
                            ? t('purchase.contract.form.loadingUsers')
                            : t('purchase.contract.form.noUsers')
                        }
                        onChange={applyQcUserToPurchaseContractGenerateForm}
                      >
                        {renderAssignableUserOptions(assignableUsers)}
                      </Select>
                    </label>
                  </div>
                  <label>
                    {t('purchase.contract.field.paymentTerms')}
                    <Input
                      value={generateForm.payment_terms}
                      onChange={(event) =>
                        setGenerateForm({ ...generateForm, payment_terms: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t('purchase.contract.field.generateRemarks')}
                    <Input
                      value={generateForm.remarks}
                      onChange={(event) =>
                        setGenerateForm({ ...generateForm, remarks: event.target.value })
                      }
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting} type="primary">
                    {t('purchase.contract.form.generateAction')}
                  </Button>
                </form>
              </>
            )}
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('purchase.contract.detail.title')}
              />
              {selectedContract ? (
                <span className="panel-kicker contract-code-label">{selectedContract.code}</span>
              ) : null}
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={() => onNavigate(purchaseContractPath)}
              >
                {t('purchase.contract.action.backToList')}
              </Button>
            </div>
            {selectedContract ? (
              <>
                <div className="contract-summary-intro">
                  <strong>{t('purchase.contract.detail.summaryTitle')}</strong>
                  <span>{t('purchase.contract.detail.summaryDescription')}</span>
                </div>

                <div className="contract-summary-sections">
                  <section className="contract-summary-section">
                    <div className="contract-summary-section-heading">
                      <div>
                        <h3>{t('purchase.contract.detail.overviewTitle')}</h3>
                        <p>{t('purchase.contract.detail.overviewDescription')}</p>
                      </div>
                    </div>
                    <dl className="contract-summary-grid">
                      <div>
                        <dt>{t('purchase.contract.field.contractStatus')}</dt>
                        <dd>
                          <span
                            className="contract-status-chip"
                            data-status={selectedContract.approval_status}
                          >
                            {purchaseContractStatusLabel(selectedContract.approval_status)}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>{t('purchase.contract.field.contractDate')}</dt>
                        <dd>{formatDate(selectedContract.contract_date)}</dd>
                      </div>
                      <div>
                        <dt>{t('purchase.contract.field.contractSource')}</dt>
                        <dd>{purchaseContractSourceTypeLabel(selectedContract.source_type)}</dd>
                      </div>
                      <div>
                        <dt>{t('purchase.contract.field.supplier')}</dt>
                        <dd>{selectedContract.supplier_name}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="contract-summary-section">
                    <div className="contract-summary-section-heading">
                      <div>
                        <h3>{t('purchase.contract.detail.fulfillmentTitle')}</h3>
                        <p>{t('purchase.contract.detail.fulfillmentDescription')}</p>
                      </div>
                    </div>
                    <dl className="contract-summary-grid">
                      <div>
                        <dt>{t('purchase.contract.field.buyerOwner')}</dt>
                        <dd>{selectedContract.buyer_user_name ?? t('common.notSet')}</dd>
                      </div>
                      <div>
                        <dt>{t('purchase.contract.field.qcUser')}</dt>
                        <dd>{selectedContract.qc_user_name ?? t('common.notSet')}</dd>
                      </div>
                      <div>
                        <dt>{t('purchase.contract.field.expectedDeliveryDate')}</dt>
                        <dd>{formatDate(selectedContract.delivery_date)}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="contract-summary-section">
                    <div className="contract-summary-section-heading">
                      <div>
                        <h3>{t('purchase.contract.detail.amountApprovalTitle')}</h3>
                        <p>{t('purchase.contract.detail.amountApprovalDescription')}</p>
                      </div>
                    </div>
                    <dl className="contract-summary-grid">
                      <div>
                        <dt>{t('purchase.contract.field.contractAmount')}</dt>
                        <dd>
                          {formatMoney(
                            selectedContract.statistics.total_amount,
                            selectedContract.currency,
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('purchase.contract.field.unpaidAmount')}</dt>
                        <dd>
                          {formatMoney(
                            selectedContract.statistics.unpaid_amount,
                            selectedContract.currency,
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('purchase.contract.field.approver')}</dt>
                        <dd>
                          {selectedContract.reviewer_name ??
                            t('purchase.contract.detail.notApproved')}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </div>

                <div className="transaction-box">
                  <strong>{t('purchase.contract.field.paymentTerms')}</strong>
                  <p>{selectedContract.payment_terms || t('common.notSet')}</p>
                </div>
                <div className="transaction-box">
                  <strong>{t('purchase.contract.field.remarks')}</strong>
                  <p>{selectedContract.remarks ?? t('purchase.contract.detail.remarksEmpty')}</p>
                </div>

                {selectedContract.approval_status === 'rejected' ? (
                  <Alert
                    className="purchase-contract-rejection-alert"
                    description={
                      selectedContract.rejection_reason ??
                      t('purchase.contract.detail.rejectionReasonEmpty')
                    }
                    showIcon
                    title={t('purchase.contract.detail.rejectedTitle', {
                      date: formatDate(selectedContract.rejected_at),
                    })}
                    type="error"
                  />
                ) : null}

                <div className="delivery-action-row">
                  <Button
                    disabled={!['draft', 'rejected'].includes(selectedContract.approval_status)}
                    onClick={loadSelectedContractForEdit}
                  >
                    {t('purchase.contract.action.editContract')}
                  </Button>
                  {selectedContract.approval_status === 'draft' ? (
                    <ApprovalAssigneeSelect
                      currentUserId={currentUser.id}
                      onChange={setReviewerId}
                      requiredPermission="purchase:contract:approve"
                      value={reviewerId}
                    />
                  ) : null}
                  <Button
                    disabled={selectedContract.approval_status !== 'draft' || !reviewerId}
                    loading={submitting}
                    onClick={() => void submitSelectedContract()}
                  >
                    {t('purchase.contract.action.submitContract')}
                  </Button>
                  <Button
                    disabled={
                      selectedContract.approval_status !== 'submitted' ||
                      !canApproveAssignedRecord(
                        currentUser,
                        selectedContract.reviewer_id,
                        'purchase:contract:approve',
                      )
                    }
                    onClick={() => setContractApprovalModalOpen(true)}
                  >
                    {t('purchase.contract.action.approveContract')}
                  </Button>
                  <Button
                    icon={<FileSpreadsheet size={16} />}
                    loading={submitting}
                    onClick={() => void generateSelectedContractTemplate()}
                  >
                    {t('purchase.contract.action.generateTemplate')}
                  </Button>
                </div>
                {selectedContract.approval_status === 'submitted' &&
                !canApproveAssignedRecord(
                  currentUser,
                  selectedContract.reviewer_id,
                  'purchase:contract:approve',
                ) ? (
                  <Alert
                    message={t('purchase.contract.action.waitingApproval', {
                      name:
                        selectedContract.reviewer_name ??
                        t('purchase.contract.action.defaultReviewer'),
                    })}
                    showIcon
                    type="info"
                  />
                ) : null}

                <Modal
                  centered
                  footer={null}
                  open={contractApprovalModalOpen}
                  title={t('purchase.contract.action.approveContract')}
                  width={720}
                  onCancel={() => setContractApprovalModalOpen(false)}
                >
                  <div className="workflow-modal-content entity-modal-form">
                    <div className="record-form accessory-form approval-form">
                      <div className="form-divider">
                        {t('purchase.contract.detail.approvalTitle')}
                      </div>
                      <div className="form-pair two">
                        <label>
                          {t('purchase.contract.field.approver')}
                          <Input disabled value={selectedContract.reviewer_name ?? ''} />
                        </label>
                        <label>
                          {t('purchase.contract.field.approvedAt')}
                          <Input
                            type="date"
                            value={approveForm.approved_at}
                            onInput={(event) =>
                              setApproveForm({
                                ...approveForm,
                                approved_at: event.currentTarget.value,
                              })
                            }
                          />
                        </label>
                      </div>
                      <label className="approval-rejection-reason">
                        <span>
                          {t('purchase.contract.field.rejectionReason')} <i aria-hidden="true">*</i>
                        </span>
                        <Input.TextArea
                          aria-label={t('purchase.contract.field.rejectionReason')}
                          maxLength={2000}
                          placeholder={t('purchase.contract.validation.rejectionReasonPlaceholder')}
                          required
                          rows={3}
                          value={approveForm.rejection_reason}
                          onChange={(event) =>
                            setApproveForm({
                              ...approveForm,
                              rejection_reason: event.currentTarget.value,
                            })
                          }
                        />
                      </label>
                      <div className="approval-action-row">
                        <Button
                          danger
                          disabled={
                            selectedContract.approval_status !== 'submitted' ||
                            !canApproveAssignedRecord(
                              currentUser,
                              selectedContract.reviewer_id,
                              'purchase:contract:approve',
                            )
                          }
                          loading={submitting}
                          onClick={confirmRejectSelectedContract}
                        >
                          {t('purchase.contract.action.rejectContract')}
                        </Button>
                        <Button
                          disabled={
                            selectedContract.approval_status !== 'submitted' ||
                            !canApproveAssignedRecord(
                              currentUser,
                              selectedContract.reviewer_id,
                              'purchase:contract:approve',
                            )
                          }
                          loading={submitting}
                          type="primary"
                          onClick={() => void reviewSelectedContract('approved')}
                        >
                          {t('purchase.contract.action.approve')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Modal>

                <div className="accessory-heading">
                  <strong>{t('purchase.contract.detail.linesTitle')}</strong>
                  <span>
                    {t('purchase.contract.detail.lineCount', {
                      count: selectedContract.lines.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.contract.field.product')}</th>
                      <th>{t('purchase.contract.field.specificationModel')}</th>
                      <th>{t('purchase.contract.field.quantity')}</th>
                      <th>{t('purchase.contract.field.unitPrice')}</th>
                      <th>{t('purchase.contract.field.amount')}</th>
                      <th>{t('purchase.contract.field.unreceived')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedContract.lines.map((line) => (
                      <tr key={line.id}>
                        <td>
                          {line.product_code ?? t('purchase.contract.detail.notFilled')} /{' '}
                          {line.product_name}
                        </td>
                        <td>
                          {line.specification ?? t('purchase.contract.detail.notFilled')} /{' '}
                          {line.model ?? t('purchase.contract.detail.notFilled')}
                        </td>
                        <td>
                          {line.quantity} {line.unit}
                        </td>
                        <td>{formatMoney(line.unit_price, selectedContract.currency)}</td>
                        <td>{formatMoney(line.amount, selectedContract.currency)}</td>
                        <td>
                          {line.unreceived_quantity} {line.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('purchase.contract.detail.sourceContractsTitle')}</strong>
                  <span>
                    {t('purchase.contract.detail.sourceCount', {
                      count: selectedContract.source_links.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.contract.field.exportContract')}</th>
                      <th>{t('purchase.contract.field.customer')}</th>
                      <th>{t('purchase.contract.field.product')}</th>
                      <th>{t('purchase.contract.field.demandQuantity')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedContract.source_links.map((source) => (
                      <tr key={source.id}>
                        <td>{source.export_contract_no}</td>
                        <td>{source.customer_name}</td>
                        <td>{source.product_code ?? t('purchase.contract.detail.notFilled')}</td>
                        <td>
                          {source.demand_quantity} {source.unit}
                        </td>
                      </tr>
                    ))}
                    {selectedContract.source_links.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={4}>
                          {t('purchase.contract.detail.noSourceLinks')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('purchase.contract.detail.remindersTitle')}</strong>
                  <span>
                    {t('purchase.contract.detail.reminderCount', {
                      count: selectedContract.reminders.length,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.contract.field.reminderType')}</th>
                      <th>{t('purchase.contract.field.reminderTitle')}</th>
                      <th>{t('purchase.contract.field.dueDate')}</th>
                      <th>{t('purchase.contract.field.amount')}</th>
                      <th>{t('purchase.contract.field.reminderStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedContract.reminders.map((reminder) => (
                      <tr key={reminder.id}>
                        <td>{purchaseReminderTypeLabel(reminder.reminder_type)}</td>
                        <td>{reminder.title}</td>
                        <td>{formatDate(reminder.due_date)}</td>
                        <td>
                          {reminder.amount
                            ? formatMoney(reminder.amount, reminder.currency)
                            : t('purchase.contract.detail.noAmount')}
                        </td>
                        <td>{purchaseReminderStatusLabel(reminder.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('purchase.contract.detail.progressTitle')}</strong>
                  <span>
                    {t('purchase.contract.detail.unreceivedCount', {
                      count: selectedContract.statistics.unreceived_quantity,
                    })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.contract.field.totalQuantity')}</th>
                      <th>{t('purchase.contract.field.received')}</th>
                      <th>{t('purchase.contract.field.unreceived')}</th>
                      <th>{t('purchase.contract.field.paid')}</th>
                      <th>{t('purchase.contract.field.unpaid')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{selectedContract.statistics.total_quantity}</td>
                      <td>{selectedContract.statistics.received_quantity}</td>
                      <td>{selectedContract.statistics.unreceived_quantity}</td>
                      <td>
                        {formatMoney(
                          selectedContract.statistics.paid_amount,
                          selectedContract.currency,
                        )}
                      </td>
                      <td>
                        {formatMoney(
                          selectedContract.statistics.unpaid_amount,
                          selectedContract.currency,
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="accessory-heading">
                  <strong>{t('purchase.contract.detail.globalRemindersTitle')}</strong>
                  <span>
                    {t('purchase.contract.detail.reminderCount', { count: reminders.length })}
                  </span>
                </div>
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>{t('purchase.contract.field.reminderType')}</th>
                      <th>{t('purchase.contract.field.reminderTitle')}</th>
                      <th>{t('purchase.contract.field.dueDate')}</th>
                      <th>{t('purchase.contract.field.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map((reminder) => (
                      <tr key={reminder.id}>
                        <td>{purchaseReminderTypeLabel(reminder.reminder_type)}</td>
                        <td>{reminder.title}</td>
                        <td>{formatDate(reminder.due_date)}</td>
                        <td>
                          {reminder.amount
                            ? formatMoney(reminder.amount, reminder.currency)
                            : t('purchase.contract.detail.noAmount')}
                        </td>
                      </tr>
                    ))}
                    {reminders.length === 0 ? (
                      <tr>
                        <td className="empty-cell" colSpan={4}>
                          {t('purchase.contract.detail.noReminders')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="module-state panel-empty-state">
                <FileStack size={28} />
                <strong>{t('purchase.contract.detail.emptyTitle')}</strong>
                <span>{t('purchase.contract.detail.emptyDescription')}</span>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </section>
  )
}
