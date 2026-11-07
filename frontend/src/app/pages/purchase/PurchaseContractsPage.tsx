import { downloadBase64File } from '../../../shared/print'
import {
  Alert,
  Button,
  Descriptions as _Descriptions,
  Input,
  Modal,
  Table,
  Tag as _Tag,
} from 'antd'
import { ArrowLeft, LayoutDashboard, Plus, Search, FileSpreadsheet, FileStack } from 'lucide-react'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  approvePurchaseContract,
  cancelPurchaseContract,
  createPurchaseContract,
  generatePurchaseContractFromExportContracts,
  generatePurchaseContractTemplate,
  listPurchaseContractReminders,
  listPurchaseContracts,
  reissuePurchaseContract,
  submitPurchaseContract,
  updatePurchaseContract,
  type CurrentUser,
  type PurchaseContract,
  type PurchaseContractApprovePayload,
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
import { FormModal, FormSelect, Metric, PanelTitle } from '../../../shared/ui'
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
} from '../appHelpers'
import { ApprovalAssigneeSelect } from '../../components/ApprovalAssigneeSelect'
import { t } from '../../appI18n'
import { PurchaseContractFormModal } from './components/PurchaseContractFormModal'
import {
  initialPurchaseContractApproveForm,
  initialPurchaseContractForm,
  initialPurchaseContractGenerateForm,
  mergePurchaseLineRemark,
  purchaseContractApprovePayload,
  purchaseContractGeneratePayload,
  purchaseContractPayload,
  purchaseContractSourceTypeLabel,
  purchaseContractStatusLabel,
  purchaseContractToForm,
  purchaseReminderStatusLabel,
  purchaseReminderTypeLabel,
  type PurchaseContractApproveFormState,
  type PurchaseContractFormState,
  type PurchaseContractGenerateFormState,
} from './purchaseContractHelpers'

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
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')
  const [reissueModalOpen, setReissueModalOpen] = useState(false)
  const [reissueReason, setReissueReason] = useState('')
  const [reissueReasonError, setReissueReasonError] = useState('')
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

  function openCancelModal() {
    setCancelReason('')
    setCancelReasonError('')
    setCancelModalOpen(true)
  }

  async function submitContractCancellation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContract) return
    if (!cancelReason.trim()) {
      setCancelReasonError(t('purchase.contract.cancel.reasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const cancelled = await cancelPurchaseContract(selectedContract.id, {
        reason: cancelReason.trim(),
      })
      setCancelModalOpen(false)
      setMessage(t('purchase.contract.cancel.success', { code: cancelled.code }))
      upsertContract(cancelled)
      await Promise.all([loadContracts(cancelled.id, cancelled), loadContractReminders()])
    } catch (caught) {
      showError(caught, t('purchase.contract.message.saveFailed'))
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
      setReissueReasonError(t('purchase.contract.cancel.reissueReasonRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const reissued = await reissuePurchaseContract(selectedContract.id, {
        reason: reissueReason.trim(),
      })
      setReissueModalOpen(false)
      setMessage(t('purchase.contract.cancel.reissueSuccess', { code: reissued.code }))
      upsertContract(reissued)
      await Promise.all([loadContracts(reissued.id, reissued), loadContractReminders()])
      onNavigate(moduleDetailPath(purchaseContractPath, reissued.id))
    } catch (caught) {
      showError(caught, t('purchase.contract.message.saveFailed'))
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

        <PurchaseContractFormModal
          open={contractModalOpen}
          mode={contractModalMode}
          editingContractId={editingContractId}
          form={form}
          generateForm={generateForm}
          setForm={setForm}
          setGenerateForm={setGenerateForm}
          suppliers={suppliers}
          assignableUsers={assignableUsers}
          products={products}
          loadingSuppliers={loadingSuppliers}
          loadingAssignableUsers={loadingAssignableUsers}
          loadingProducts={loadingProducts}
          submitting={submitting}
          onClose={cancelContractEdit}
          onSubmitManual={submitContractForm}
          onSubmitGenerate={generateContractFromSources}
          applySupplierToPurchaseContractForm={applySupplierToPurchaseContractForm}
          applyQcUserToPurchaseContractForm={applyQcUserToPurchaseContractForm}
          applyQcUserToPurchaseContractGenerateForm={applyQcUserToPurchaseContractGenerateForm}
          applyProductToPurchaseContractForm={applyProductToPurchaseContractForm}
        />

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
                {selectedContract.approval_status === 'cancelled' ? (
                  <Alert
                    description={
                      selectedContract.cancel_reason ?? t('purchase.contract.detail.notFilled')
                    }
                    showIcon
                    title={t('purchase.contract.detail.cancelledBanner', {
                      date: selectedContract.cancelled_at
                        ? formatDate(selectedContract.cancelled_at)
                        : t('purchase.contract.detail.notFilled'),
                      name:
                        selectedContract.cancelled_by_name ??
                        t('purchase.contract.detail.notFilled'),
                    })}
                    type="warning"
                  />
                ) : null}
                {selectedContract.reissued_from_code ? (
                  <Alert
                    description={
                      selectedContract.reissue_reason ?? t('purchase.contract.detail.notFilled')
                    }
                    showIcon
                    title={t('purchase.contract.detail.reissuedFromBanner', {
                      code: selectedContract.reissued_from_code,
                    })}
                    type="info"
                  />
                ) : null}
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
                  {['draft', 'approved', 'rejected'].includes(
                    selectedContract.approval_status,
                  ) ? (
                    <Button danger onClick={openCancelModal}>
                      {t('purchase.contract.action.cancel')}
                    </Button>
                  ) : null}
                  {selectedContract.approval_status === 'cancelled' ? (
                    <Button type="primary" onClick={openReissueModal}>
                      {t('purchase.contract.action.reissue')}
                    </Button>
                  ) : null}
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

                <FormModal
                  centered
                  open={cancelModalOpen}
                  submitDanger
                  submitLabel={t('purchase.contract.cancel.confirm')}
                  submitting={submitting}
                  title={t('purchase.contract.cancel.title')}
                  onCancel={() => setCancelModalOpen(false)}
                  onSubmit={submitContractCancellation}
                >
                  <Alert message={t('purchase.contract.cancel.hint')} showIcon type="warning" />
                  <label htmlFor="purchase-contract-cancel-reason">
                    {t('purchase.contract.cancel.reason')}
                    <Input.TextArea
                      aria-describedby={
                        cancelReasonError ? 'purchase-contract-cancel-error' : undefined
                      }
                      aria-invalid={Boolean(cancelReasonError)}
                      id="purchase-contract-cancel-reason"
                      placeholder={t('purchase.contract.cancel.reasonPlaceholder')}
                      rows={4}
                      value={cancelReason}
                      onChange={(event) => {
                        setCancelReason(event.currentTarget.value)
                        setCancelReasonError('')
                      }}
                    />
                  </label>
                  {cancelReasonError ? (
                    <span className="form-field-error" id="purchase-contract-cancel-error">
                      {cancelReasonError}
                    </span>
                  ) : null}
                </FormModal>

                <FormModal
                  centered
                  open={reissueModalOpen}
                  submitLabel={t('purchase.contract.cancel.reissueConfirm')}
                  submitType="primary"
                  submitting={submitting}
                  title={t('purchase.contract.cancel.reissueTitle')}
                  onCancel={() => setReissueModalOpen(false)}
                  onSubmit={submitContractReissue}
                >
                  <Alert message={t('purchase.contract.cancel.reissueHint')} showIcon type="info" />
                  <label htmlFor="purchase-contract-reissue-reason">
                    {t('purchase.contract.cancel.reissueReason')}
                    <Input.TextArea
                      aria-describedby={
                        reissueReasonError ? 'purchase-contract-reissue-error' : undefined
                      }
                      aria-invalid={Boolean(reissueReasonError)}
                      id="purchase-contract-reissue-reason"
                      placeholder={t('purchase.contract.cancel.reissuePlaceholder')}
                      rows={4}
                      value={reissueReason}
                      onChange={(event) => {
                        setReissueReason(event.currentTarget.value)
                        setReissueReasonError('')
                      }}
                    />
                  </label>
                  {reissueReasonError ? (
                    <span className="form-field-error" id="purchase-contract-reissue-error">
                      {reissueReasonError}
                    </span>
                  ) : null}
                </FormModal>

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
