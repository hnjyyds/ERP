import { downloadBase64File } from '../../../shared/print'
import { Alert, Button, Descriptions, Input, Modal, Table, Tag , Select} from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search , FileSpreadsheet, FileStack} from 'lucide-react'
import type { FormEvent, MouseEvent , ReactNode} from 'react'
import { useEffect, useMemo, useState } from 'react'
import { approvePurchaseContract, createPurchaseContract, generatePurchaseContractFromExportContracts, generatePurchaseContractTemplate, listPurchaseContractReminders, listPurchaseContracts, submitPurchaseContract, updatePurchaseContract, type PurchaseContract, type PurchaseContractApprovePayload, type PurchaseContractCreatePayload, type PurchaseContractGeneratePayload, type PurchaseContractLine, type PurchaseContractReminder, type PurchaseContractSourceLink, type Supplier , AssignableUser, Product, listAssignableUsers, listProducts, listSuppliers} from '../../../api'
import { purchaseContractPath, moduleDetailPath } from '../../routes'
import { FormSelect, Metric, PanelTitle } from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { purchaseContractStatusOptions, purchaseContractSourceTypeOptions } from '../../../shared/formOptions'
import { formatDate, formatMoney, nullableText, todayInputValue, type RoutedDetailPageProps , emptyToNull} from '../appHelpers'

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
    supplier_name: '远景辅料供应商',
    buyer_user_id: 'u-001',
    buyer_user_name: '演示业务主管',
    qc_user_id: '',
    qc_user_name: '',
    currency: 'USD',
    delivery_date: todayInputValue(),
    unit_price: '0.12',
    payment_terms: '30% advance, 70% before delivery',
    remarks: '按已审批出口合同商品配件自动生成采购合同。',
  }
}

function initialPurchaseContractApproveForm(): PurchaseContractApproveFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: todayInputValue(),
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
): PurchaseContractApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function purchaseContractStatusLabel(value: string): string {
  return purchaseContractStatusOptions.find((item) => item.value === value)?.label ?? value
}

function purchaseContractSourceTypeLabel(value: string): string {
  return purchaseContractSourceTypeOptions.find((item) => item.value === value)?.label ?? value
}

function purchaseReminderTypeLabel(value: string): string {
  if (value === 'payment') return '付款提醒'
  if (value === 'delivery') return '交货提醒'
  return value
}

function purchaseReminderStatusLabel(value: string): string {
  if (value === 'open') return '待处理'
  if (value === 'closed') return '已完成'
  return value
}


export function PurchaseContractsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
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
  const [error, setError] = useState('')
  const [form, setForm] = useState<PurchaseContractFormState>(() => initialPurchaseContractForm())
  const [generateForm, setGenerateForm] = useState<PurchaseContractGenerateFormState>(() =>
    initialPurchaseContractGenerateForm(),
  )
  const [approveForm, setApproveForm] = useState<PurchaseContractApproveFormState>(() =>
    initialPurchaseContractApproveForm(),
  )

  const selectedContract = useMemo(
    () => {
      if (detailId) return contracts.find((item) => item.id === detailId) ?? null
      return contracts.find((item) => item.id === selectedContractId) ?? contracts[0] ?? null
    },
    [contracts, detailId, selectedContractId],
  )

  useEffect(() => {
    void loadContracts()
    void loadContractReminders()
    void loadProductsForContract()
    void loadSuppliersForContract()
    void loadAssignableUsersForContract()
  }, [])

  useEffect(() => {
    setApproveForm({
      reviewer_name: selectedContract?.reviewer_name ?? '演示业务主管',
      approved_at: selectedContract?.approved_at ?? selectedContract?.contract_date ?? todayInputValue(),
    })
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
    setError('')
    try {
      const result = await listPurchaseContracts({
        q: search.trim() || undefined,
        approval_status: statusFilter || undefined,
        supplier_id: supplierFilter.trim() || undefined,
        source_type: sourceFilter || undefined,
      })
      const items = preferredContract
        ? [
            preferredContract,
            ...result.items.filter((item) => item.id !== preferredContract.id),
          ]
        : result.items
      setContracts(items)
      const nextSelectedId =
        preferredId ??
        (items.some((item) => item.id === selectedContractId) ? selectedContractId : null) ??
        items[0]?.id ??
        null
      setSelectedContractId(nextSelectedId)
    } catch (caught) {
      showError(caught, '采购合同加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadContractReminders() {
    try {
      const result = await listPurchaseContractReminders()
      setReminders(result.items)
    } catch (caught) {
      showError(caught, '采购提醒加载失败')
    }
  }

  async function loadProductsForContract() {
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

  async function loadSuppliersForContract() {
    setLoadingSuppliers(true)
    try {
      const result = await listSuppliers()
      setSuppliers(result.items)
    } catch (caught) {
      showError(caught, '工厂资料加载失败')
    } finally {
      setLoadingSuppliers(false)
    }
  }

  async function loadAssignableUsersForContract() {
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers()
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, '人员列表加载失败')
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

  function stopAndOpenPurchaseContractDetail(event: MouseEvent<HTMLElement>, contract: PurchaseContract) {
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
        ? mergePurchaseLineRemark(current.line_remark, `包装: ${product.package_info}`)
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
    setError('')
    try {
      const payload = purchaseContractPayload(form)
      const saved = editingContractId
        ? await updatePurchaseContract(editingContractId, payload)
        : await createPurchaseContract(payload)
      setMessage(editingContractId ? `已保存采购合同 ${saved.code}` : `已新增采购合同 ${saved.code}`)
      setEditingContractId(null)
      setContractModalMode('manual')
      setForm(initialPurchaseContractForm())
      setContractModalOpen(false)
      upsertContract(saved)
      await Promise.all([loadContracts(saved.id, saved), loadContractReminders()])
      upsertContract(saved)
    } catch (caught) {
      showError(caught, '采购合同保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function generateContractFromSources(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const generated = await generatePurchaseContractFromExportContracts(
        purchaseContractGeneratePayload(generateForm),
      )
      setMessage(`已从出口合同生成采购合同 ${generated.code}`)
      setContractModalMode('manual')
      setGenerateForm(initialPurchaseContractGenerateForm())
      setContractModalOpen(false)
      upsertContract(generated)
      await Promise.all([loadContracts(generated.id, generated), loadContractReminders()])
    } catch (caught) {
      showError(caught, '采购合同生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSelectedContract() {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitPurchaseContract(selectedContract.id)
      setMessage(`已提交采购合同 ${submitted.code}`)
      upsertContract(submitted)
      await Promise.all([loadContracts(submitted.id, submitted), loadContractReminders()])
    } catch (caught) {
      showError(caught, '采购合同提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const approved = await approvePurchaseContract(
        selectedContract.id,
        purchaseContractApprovePayload(approveForm),
      )
      setMessage(`已审批采购合同 ${approved.code}`)
      setContractApprovalModalOpen(false)
      upsertContract(approved)
      await Promise.all([loadContracts(approved.id, approved), loadContractReminders()])
    } catch (caught) {
      showError(caught, '采购合同审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function generateSelectedContractTemplate() {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const document_ = await generatePurchaseContractTemplate(selectedContract.id)
      downloadBase64File(document_.filename, document_.content_base64, document_.content_type)
      setMessage(`已用合同模板生成 ${document_.filename}`)
    } catch (caught) {
      showError(caught, '采购合同模板生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  function openCreateContract() {
    setEditingContractId(null)
    setContractModalMode('manual')
    setForm(initialPurchaseContractForm())
    setMessage('')
    setError('')
    setContractModalOpen(true)
  }

  function openGenerateContract() {
    setEditingContractId(null)
    setContractModalMode('generate')
    setGenerateForm(initialPurchaseContractGenerateForm())
    setMessage('')
    setError('')
    setContractModalOpen(true)
  }

  function loadSelectedContractForEdit() {
    if (!selectedContract) return
    setEditingContractId(selectedContract.id)
    setContractModalMode('manual')
    setForm(purchaseContractToForm(selectedContract))
    setMessage(`正在编辑采购合同 ${selectedContract.code}`)
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
<div className="summary-strip" aria-label="采购合同概览">
        <Metric label="采购合同" value={contracts.length} />
        <Metric label="待审批" value={contracts.filter((item) => item.approval_status === 'submitted').length} />
        <Metric label="已审批" value={contracts.filter((item) => item.approval_status === 'approved').length} />
        <Metric label="合同金额" value={formatMoney(totalAmount.toFixed(2), currency)} />
        <Metric label="待办提醒" value={openReminders} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid purchase-contract-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="采购合同列表234" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadContracts()
              }}
            >
              <label>
                合同搜索
                <Input
                  value={search}
                  placeholder="合同号 / 供应商 / 商品 / 备注"
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
                {purchaseContractStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
              <label>
                来源类型
              <FormSelect
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <option value="">全部来源</option>
                {purchaseContractSourceTypeOptions.map((item) => (
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
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateContract}>
                新增采购合同
              </Button>
              <Button htmlType="button" icon={<FileStack size={16} />} onClick={openGenerateContract}>
                从出口合同生成
              </Button>
            </form>
          </div>

          <Table<PurchaseContract>
            columns={[
              {
                title: '采购合同',
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
              { title: '状态', dataIndex: 'approval_status', render: purchaseContractStatusLabel },
              { title: '来源', dataIndex: 'source_type', render: purchaseContractSourceTypeLabel },
              { title: '供应商', dataIndex: 'supplier_name' },
              {
                title: 'QC 负责人',
                dataIndex: 'qc_user_name',
                render: (value: string | null) => value ?? '未指定',
              },
              { title: '交货日', dataIndex: 'delivery_date', render: formatDate },
              {
                title: '金额',
                dataIndex: 'statistics',
                render: (_, contract) => formatMoney(contract.statistics.total_amount, contract.currency),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: PurchaseContract) => (
                  <Button size="small" onClick={(event) => stopAndOpenPurchaseContractDetail(event, record)}>
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
          open={contractModalOpen}
          title={
            editingContractId
              ? '编辑采购合同'
              : contractModalMode === 'generate'
                ? '从出口合同生成采购合同'
                : '新增采购合同'
          }
          width={1040}
          onCancel={cancelContractEdit}
        >
          <div className="workflow-modal-content entity-modal-form">
          {contractModalMode === 'manual' ? (
            <>
          <PanelTitle icon={<LayoutDashboard size={18} />} title={editingContractId ? '编辑采购合同' : '库存/手工采购合同'} />
          <form className="record-form" onSubmit={submitContractForm}>
            <div className="form-pair two">
              <label>
                合同号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                合同日期
                <Input
                  type="date"
                  value={form.contract_date}
                  onChange={(event) => setForm({ ...form, contract_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                选择工厂
                <Select
                  allowClear
                  showSearch
                  loading={loadingSuppliers}
                  value={form.supplier_id || undefined}
                  placeholder={suppliers.length > 0 ? '从工厂资料选择' : '请先在工厂资料录入'}
                  optionFilterProp="label"
                  notFoundContent={loadingSuppliers ? '加载工厂资料中' : '暂无工厂资料'}
                  onChange={applySupplierToPurchaseContractForm}
                >
                  {renderSupplierOptions(suppliers)}
                </Select>
              </label>
              <label>
                工厂标识
                <Input value={form.supplier_id} readOnly placeholder="选择工厂后自动带出" />
              </label>
              <label>
                工厂名称
                <Input
                  value={form.supplier_name}
                  onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                采购员
                <Input
                  value={form.buyer_user_name}
                  onChange={(event) => setForm({ ...form, buyer_user_name: event.target.value })}
                />
              </label>
              <label>
                采购员标识
                <Input
                  value={form.buyer_user_id}
                  onChange={(event) => setForm({ ...form, buyer_user_id: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                QC 负责人
                <Select
                  allowClear
                  showSearch
                  loading={loadingAssignableUsers}
                  value={form.qc_user_id || undefined}
                  placeholder={assignableUsers.length > 0 ? '从系统用户选择' : '暂无可选用户'}
                  optionFilterProp="label"
                  notFoundContent={loadingAssignableUsers ? '加载人员中' : '暂无可选用户'}
                  onChange={applyQcUserToPurchaseContractForm}
                >
                  {renderAssignableUserOptions(assignableUsers)}
                </Select>
              </label>
            </div>
            <div className="form-pair three">
              <label>
                币种
                <Input
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                />
              </label>
              <label>
                交货日期
                <Input
                  type="date"
                  value={form.delivery_date}
                  onChange={(event) => setForm({ ...form, delivery_date: event.target.value })}
                />
              </label>
              <label>
                来源
              <FormSelect
                value={form.source_type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    source_type: event.target.value as PurchaseContractCreatePayload['source_type'],
                  })
                }
              >
                {purchaseContractSourceTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
            </div>
            <label>
              付款条款
              <Input
                value={form.payment_terms}
                onChange={(event) => setForm({ ...form, payment_terms: event.target.value })}
              />
            </label>

            <div className="form-divider">合同商品明细</div>
            <div className="form-pair two">
              <label>
                选择商品
                <Select
                  allowClear
                  showSearch
                  loading={loadingProducts}
                  value={form.product_id || undefined}
                  placeholder={products.length > 0 ? '从商品资料选择' : '请先在商品资料录入'}
                  optionFilterProp="label"
                  notFoundContent={loadingProducts ? '加载商品资料中' : '暂无商品资料'}
                  onChange={applyProductToPurchaseContractForm}
                >
                  {renderProductOptions(products)}
                </Select>
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
            <label>
              商品标识
              <Input value={form.product_id} readOnly placeholder="选择商品后自动带出" />
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
                单价
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
                来源出口合同 ID
                <Input
                  value={form.source_export_contract_id}
                  onChange={(event) =>
                    setForm({ ...form, source_export_contract_id: event.target.value })
                  }
                />
              </label>
              <label>
                来源合同号
                <Input
                  value={form.source_export_contract_no}
                  onChange={(event) =>
                    setForm({ ...form, source_export_contract_no: event.target.value })
                  }
                />
              </label>
              <label>
                来源明细 ID
                <Input
                  value={form.source_export_contract_line_id}
                  onChange={(event) =>
                    setForm({ ...form, source_export_contract_line_id: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              行备注
              <Input
                value={form.line_remark}
                onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
              />
            </label>
            <label>
              合同备注
              <Input.TextArea
                rows={2}
                value={form.remarks}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              {editingContractId ? '保存采购合同' : '新增采购合同'}
            </Button>
            {editingContractId ? (
              <Button onClick={cancelContractEdit}>
                取消编辑
              </Button>
            ) : null}
          </form>
            </>
          ) : (
            <>
          <PanelTitle icon={<FileStack size={18} />} title="从已审批出口合同生成" />

          <form className="record-form accessory-form generation-form" onSubmit={generateContractFromSources}>
            <div className="form-divider">从已审批出口合同生成</div>
            <div className="form-pair two">
              <label>
                采购合同号
                <Input
                  value={generateForm.code}
                  onChange={(event) => setGenerateForm({ ...generateForm, code: event.target.value })}
                />
              </label>
              <label>
                合同日期
                <Input
                  type="date"
                  value={generateForm.contract_date}
                  onChange={(event) => setGenerateForm({ ...generateForm, contract_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                出口合同 ID A
                <Input
                  value={generateForm.source_contract_id_a}
                  onChange={(event) =>
                    setGenerateForm({ ...generateForm, source_contract_id_a: event.target.value })
                  }
                />
              </label>
              <label>
                出口合同 ID B
                <Input
                  value={generateForm.source_contract_id_b}
                  onChange={(event) =>
                    setGenerateForm({ ...generateForm, source_contract_id_b: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                供应商标识
                <Input
                  value={generateForm.supplier_id}
                  onChange={(event) => setGenerateForm({ ...generateForm, supplier_id: event.target.value })}
                />
              </label>
              <label>
                供应商
                <Input
                  value={generateForm.supplier_name}
                  onChange={(event) => setGenerateForm({ ...generateForm, supplier_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                币种
                <Input
                  value={generateForm.currency}
                  onChange={(event) => setGenerateForm({ ...generateForm, currency: event.target.value })}
                />
              </label>
              <label>
                交货日期
                <Input
                  type="date"
                  value={generateForm.delivery_date}
                  onChange={(event) => setGenerateForm({ ...generateForm, delivery_date: event.target.value })}
                />
              </label>
              <label>
                配件单价
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={generateForm.unit_price}
                  onChange={(event) => setGenerateForm({ ...generateForm, unit_price: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                QC 负责人
                <Select
                  allowClear
                  showSearch
                  loading={loadingAssignableUsers}
                  value={generateForm.qc_user_id || undefined}
                  placeholder={assignableUsers.length > 0 ? '从系统用户选择' : '暂无可选用户'}
                  optionFilterProp="label"
                  notFoundContent={loadingAssignableUsers ? '加载人员中' : '暂无可选用户'}
                  onChange={applyQcUserToPurchaseContractGenerateForm}
                >
                  {renderAssignableUserOptions(assignableUsers)}
                </Select>
              </label>
            </div>
            <label>
              付款条款
              <Input
                value={generateForm.payment_terms}
                onChange={(event) => setGenerateForm({ ...generateForm, payment_terms: event.target.value })}
              />
            </label>
            <label>
              生成备注
              <Input
                value={generateForm.remarks}
                onChange={(event) => setGenerateForm({ ...generateForm, remarks: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              生成采购合同
            </Button>
          </form>
            </>
          )}
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="采购合同明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(purchaseContractPath)}>
              返回列表
            </Button>
          </div>
          {selectedContract ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/合同日</dt>
                  <dd>{purchaseContractStatusLabel(selectedContract.approval_status)} / {formatDate(selectedContract.contract_date)}</dd>
                </div>
                <div>
                  <dt>来源</dt>
                  <dd>{purchaseContractSourceTypeLabel(selectedContract.source_type)}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedContract.supplier_name}</dd>
                </div>
                <div>
                  <dt>采购员</dt>
                  <dd>{selectedContract.buyer_user_name ?? '未指定'}</dd>
                </div>
                <div>
                  <dt>QC 负责人</dt>
                  <dd>{selectedContract.qc_user_name ?? '未指定'}</dd>
                </div>
                <div>
                  <dt>交货日期</dt>
                  <dd>{formatDate(selectedContract.delivery_date)}</dd>
                </div>
                <div>
                  <dt>合同金额</dt>
                  <dd>{formatMoney(selectedContract.statistics.total_amount, selectedContract.currency)}</dd>
                </div>
                <div>
                  <dt>未付金额</dt>
                  <dd>{formatMoney(selectedContract.statistics.unpaid_amount, selectedContract.currency)}</dd>
                </div>
                <div>
                  <dt>审批人</dt>
                  <dd>{selectedContract.reviewer_name ?? '未审批'}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>付款条款</strong>
                <p>{selectedContract.payment_terms}</p>
              </div>
              <div className="transaction-box">
                <strong>合同备注</strong>
                <p>{selectedContract.remarks ?? '未填写'}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedContract.approval_status !== 'draft'}
                  onClick={loadSelectedContractForEdit}
                >
                  编辑合同
                </Button>
                <Button
                  disabled={selectedContract.approval_status !== 'draft'}
                  loading={submitting}
                  onClick={() => void submitSelectedContract()}
                >
                  提交采购合同
                </Button>
                <Button
                  disabled={selectedContract.approval_status !== 'submitted'}
                  onClick={() => setContractApprovalModalOpen(true)}
                >
                  审批采购合同
                </Button>
                <Button
                  icon={<FileSpreadsheet size={16} />}
                  loading={submitting}
                  onClick={() => void generateSelectedContractTemplate()}
                >
                  用合同模板生成
                </Button>
              </div>

              <Modal
                centered
                footer={null}
                open={contractApprovalModalOpen}
                title="审批采购合同"
                width={720}
                onCancel={() => setContractApprovalModalOpen(false)}
              >
                <div className="workflow-modal-content entity-modal-form">
                  <form className="record-form accessory-form approval-form" onSubmit={approveSelectedContract}>
                    <div className="form-divider">采购合同审批</div>
                    <div className="form-pair two">
                      <label>
                        审批人
                        <Input
                          value={approveForm.reviewer_name}
                          onChange={(event) =>
                            setApproveForm({ ...approveForm, reviewer_name: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        审批日期
                        <Input
                          type="date"
                          value={approveForm.approved_at}
                          onChange={(event) =>
                            setApproveForm({ ...approveForm, approved_at: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <Button
                      disabled={selectedContract.approval_status !== 'submitted'}
                      htmlType="submit"
                      loading={submitting}
                      type="primary"
                    >
                      审批采购合同
                    </Button>
                  </form>
                </div>
              </Modal>

              <div className="accessory-heading">
                <strong>合同商品明细</strong>
                <span>{selectedContract.lines.length} 行</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格/型号</th>
                    <th>数量</th>
                    <th>单价</th>
                    <th>金额</th>
                    <th>未收</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContract.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_code ?? '未填'} / {line.product_name}</td>
                      <td>{line.specification ?? '未填'} / {line.model ?? '未填'}</td>
                      <td>{line.quantity} {line.unit}</td>
                      <td>{formatMoney(line.unit_price, selectedContract.currency)}</td>
                      <td>{formatMoney(line.amount, selectedContract.currency)}</td>
                      <td>{line.unreceived_quantity} {line.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>来源出口合同</strong>
                <span>{selectedContract.source_links.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>出口合同</th>
                    <th>客户</th>
                    <th>商品</th>
                    <th>需求数量</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContract.source_links.map((source) => (
                    <tr key={source.id}>
                      <td>{source.export_contract_no}</td>
                      <td>{source.customer_name}</td>
                      <td>{source.product_code ?? '未填'}</td>
                      <td>{source.demand_quantity} {source.unit}</td>
                    </tr>
                  ))}
                  {selectedContract.source_links.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={4}>库存采购或手工采购，无来源出口合同</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>付款和交货提醒</strong>
                <span>{selectedContract.reminders.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>金额</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContract.reminders.map((reminder) => (
                    <tr key={reminder.id}>
                      <td>{purchaseReminderTypeLabel(reminder.reminder_type)}</td>
                      <td>{reminder.title}</td>
                      <td>{formatDate(reminder.due_date)}</td>
                      <td>{reminder.amount ? formatMoney(reminder.amount, reminder.currency) : '无金额'}</td>
                      <td>{purchaseReminderStatusLabel(reminder.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>进度概览</strong>
                <span>{selectedContract.statistics.unreceived_quantity} 未收</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>总数量</th>
                    <th>已收</th>
                    <th>未收</th>
                    <th>已付</th>
                    <th>未付</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{selectedContract.statistics.total_quantity}</td>
                    <td>{selectedContract.statistics.received_quantity}</td>
                    <td>{selectedContract.statistics.unreceived_quantity}</td>
                    <td>{formatMoney(selectedContract.statistics.paid_amount, selectedContract.currency)}</td>
                    <td>{formatMoney(selectedContract.statistics.unpaid_amount, selectedContract.currency)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>全局采购提醒</strong>
                <span>{reminders.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map((reminder) => (
                    <tr key={reminder.id}>
                      <td>{purchaseReminderTypeLabel(reminder.reminder_type)}</td>
                      <td>{reminder.title}</td>
                      <td>{formatDate(reminder.due_date)}</td>
                      <td>{reminder.amount ? formatMoney(reminder.amount, reminder.currency) : '无金额'}</td>
                    </tr>
                  ))}
                  {reminders.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={4}>暂无采购提醒</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FileStack size={28} />
              <strong>暂无采购合同</strong>
              <span>请返回列表选择采购合同查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}


