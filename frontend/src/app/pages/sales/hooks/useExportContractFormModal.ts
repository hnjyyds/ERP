import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  createExportContract,
  updateExportContract,
  type CurrentUser,
  type ExportContract,
} from '@/api'
import { showError, showWarningDialog } from '@/shared/errors'
import { t } from '@/app/appI18n'

import {
  customerDisplayName,
  exportContractPayload,
  exportContractToForm,
  initialExportContractForm,
  productToContractLine,
  type ExportContractFormState,
  type ExportContractLineFormState,
} from '../exportContractHelpers'
import type { ExportContractOptionsModel } from './useExportContractOptions'

type Options = {
  currentUser: CurrentUser
  options: ExportContractOptionsModel
  setMessage: (message: string) => void
  onSaved: (contract: ExportContract) => Promise<void>
  clearExportPreview: () => void
}

/** 出口合同新增/编辑弹窗与商品选择抽屉。 */
export function useExportContractFormModal({
  currentUser,
  options,
  setMessage,
  onSaved,
  clearExportPreview,
}: Options) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContractId, setEditingContractId] = useState<string | null>(null)
  const [form, setForm] = useState<ExportContractFormState>(() =>
    initialExportContractForm(currentUser),
  )
  const [productDrawerOpen, setProductDrawerOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!modalOpen || options.assignableUsersLoaded) return
    void options.ensureAssignableUsers()
  }, [modalOpen, options.assignableUsersLoaded, options.ensureAssignableUsers])

  const selectedProductIds = useMemo(
    () => new Set(form.lines.map((line) => line.product_id).filter(Boolean)),
    [form.lines],
  )

  const filteredProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLocaleLowerCase()
    if (!normalizedSearch) return options.products
    return options.products.filter((product) =>
      [product.code, product.cn_name, product.en_name, product.specification, product.model]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(normalizedSearch)),
    )
  }, [productSearch, options.products])

  function applySalesUserToContractForm(userId?: string) {
    const user = userId ? options.assignableUsers.find((item) => item.id === userId) : null
    setForm((current) => ({
      ...current,
      sales_user_id: user?.id ?? '',
      sales_user_name: user?.display_name ?? '',
    }))
  }

  function applyCustomerToContractForm(customerId?: string) {
    const customer = options.customers.find((item) => item.id === customerId)
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
    const additions = options.products
      .filter(
        (product) =>
          pendingProductIds.includes(product.id) && !selectedProductIds.has(product.id),
      )
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
      lines: current.lines.map((line) =>
        line.key === lineKey ? { ...line, [field]: value } : line,
      ),
    }))
  }

  function removeContractLine(lineKey: string) {
    setForm((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.key !== lineKey),
    }))
  }

  function loadContractIntoForm(contract: ExportContract) {
    setEditingContractId(contract.id)
    setForm(exportContractToForm(contract))
    setModalOpen(true)
  }

  function openCreateContractModal() {
    setEditingContractId(null)
    setForm(initialExportContractForm(currentUser))
    closeProductDrawer()
    setModalOpen(true)
  }

  function closeCreateContractModal() {
    closeProductDrawer()
    setModalOpen(false)
    setEditingContractId(null)
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
    clearExportPreview()
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
      setModalOpen(false)
      closeProductDrawer()
      await onSaved(saved)
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

  return {
    modalOpen,
    editingContractId,
    form,
    setForm,
    submitting,
    productDrawerOpen,
    productSearch,
    setProductSearch,
    pendingProductIds,
    selectedProductIds,
    filteredProducts,
    openCreateContractModal,
    closeCreateContractModal,
    loadContractIntoForm,
    submitContract,
    openProductDrawer,
    closeProductDrawer,
    togglePendingProduct,
    addPendingProducts,
    updateContractLine,
    removeContractLine,
    applyCustomerToContractForm,
    applySalesUserToContractForm,
  }
}

export type ExportContractFormModalModel = ReturnType<typeof useExportContractFormModal>
