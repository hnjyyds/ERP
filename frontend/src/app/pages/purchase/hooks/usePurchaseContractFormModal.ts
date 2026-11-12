import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  createPurchaseContract,
  generatePurchaseContractFromExportContracts,
  updatePurchaseContract,
  type PurchaseContract,
} from '@/api'
import { showError, showWarningDialog } from '@/shared/errors'
import { t } from '@/app/appI18n'

import {
  initialPurchaseContractForm,
  initialPurchaseContractGenerateForm,
  productToPurchaseLine,
  purchaseContractGeneratePayload,
  purchaseContractPayload,
  purchaseContractToForm,
  type PurchaseContractFormState,
  type PurchaseContractGenerateFormState,
  type PurchaseContractLineFormState,
} from '../purchaseContractHelpers'
import type { usePurchaseContractOptions } from './usePurchaseContractOptions'

type Options = {
  contract: PurchaseContract | null
  options: ReturnType<typeof usePurchaseContractOptions>
  setMessage: (message: string) => void
  onSaved: (contract: PurchaseContract) => Promise<void>
}

/** 新增/编辑/从出口合同生成的采购合同表单弹窗。 */
export function usePurchaseContractFormModal({ contract, options, setMessage, onSaved }: Options) {
  const [form, setForm] = useState<PurchaseContractFormState>(() => initialPurchaseContractForm())
  const [generateForm, setGenerateForm] = useState<PurchaseContractGenerateFormState>(() =>
    initialPurchaseContractGenerateForm(),
  )
  const [editingContractId, setEditingContractId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<'manual' | 'generate'>('manual')
  const [submitting, setSubmitting] = useState(false)
  const [productDrawerOpen, setProductDrawerOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([])

  useEffect(() => {
    if (!contract) return
    setGenerateForm((current) => ({
      ...current,
      supplier_id: contract.supplier_id ?? current.supplier_id,
      supplier_name: contract.supplier_name,
      currency: contract.currency,
    }))
    setForm((current) => ({
      ...current,
      supplier_id: contract.supplier_id ?? current.supplier_id,
      supplier_name: contract.supplier_name,
      currency: contract.currency,
    }))
  }, [contract?.id, contract?.approval_status])

  useEffect(() => {
    if (!productDrawerOpen) return
    const timer = window.setTimeout(() => {
      void options.loadProducts(productSearch)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [productDrawerOpen, productSearch, options.loadProducts])

  const selectedProductIds = useMemo(
    () => new Set(form.lines.map((line) => line.product_id).filter(Boolean)),
    [form.lines],
  )

  function applyQcUser(userId: string | undefined) {
    const user = userId ? options.assignableUsers.find((item) => item.id === userId) : null
    setForm((current) => ({
      ...current,
      qc_user_id: user?.id ?? '',
      qc_user_name: user?.display_name ?? '',
    }))
  }

  function applyBuyer(userId: string | undefined) {
    const user = userId ? options.assignableUsers.find((item) => item.id === userId) : null
    setForm((current) => ({
      ...current,
      buyer_user_id: user?.id ?? '',
      buyer_user_name: user?.display_name ?? '',
    }))
  }

  function applyQcUserToGenerateForm(userId: string | undefined) {
    const user = userId ? options.assignableUsers.find((item) => item.id === userId) : null
    setGenerateForm((current) => ({
      ...current,
      qc_user_id: user?.id ?? '',
      qc_user_name: user?.display_name ?? '',
    }))
  }

  function applyBuyerToGenerateForm(userId: string | undefined) {
    const user = userId ? options.assignableUsers.find((item) => item.id === userId) : null
    setGenerateForm((current) => ({
      ...current,
      buyer_user_id: user?.id ?? '',
      buyer_user_name: user?.display_name ?? '',
    }))
  }

  function applySupplier(supplierId: string | undefined, target: 'manual' | 'generate' = 'manual') {
    const supplier = supplierId
      ? options.suppliers.find((item) => item.id === supplierId)
      : undefined
    if (supplier) options.pinSupplier(supplier)
    if (target === 'manual') {
      setForm((current) => ({
        ...current,
        supplier_id: supplier?.id ?? '',
        supplier_name: supplier?.cn_name ?? '',
      }))
      return
    }
    setGenerateForm((current) => ({
      ...current,
      supplier_id: supplier?.id ?? '',
      supplier_name: supplier?.cn_name ?? '',
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
    const picked = options.products.filter(
      (product) =>
        pendingProductIds.includes(product.id) && !selectedProductIds.has(product.id),
    )
    picked.forEach(options.pinProduct)
    const additions = picked.map(productToPurchaseLine)
    setForm((current) => ({ ...current, lines: [...current.lines, ...additions] }))
    closeProductDrawer()
  }

  function updateContractLine(
    lineKey: string,
    field: keyof PurchaseContractLineFormState,
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

  async function submitContractForm(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!form.supplier_name.trim()) {
      showWarningDialog(t('purchase.contract.validation.supplierRequired'))
      return
    }
    if (!form.payment_terms.trim()) {
      showWarningDialog(t('purchase.contract.validation.paymentTermsRequired'))
      return
    }
    if (form.lines.length === 0) {
      showWarningDialog(t('purchase.contract.validation.lineRequired'))
      return
    }
    const invalidLine = form.lines.find(
      (line) =>
        !line.product_name.trim() ||
        !line.unit.trim() ||
        !Number.isFinite(Number(line.quantity)) ||
        Number(line.quantity) <= 0 ||
        !Number.isFinite(Number(line.unit_price)) ||
        Number(line.unit_price) < 0,
    )
    if (invalidLine) {
      showWarningDialog(
        t('purchase.contract.validation.lineIncomplete', {
          name: invalidLine.product_name || invalidLine.product_code,
        }),
      )
      return
    }
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
      setMode('manual')
      setForm(initialPurchaseContractForm())
      closeProductDrawer()
      setModalOpen(false)
      await onSaved(saved)
    } catch (caught) {
      showError(caught, t('purchase.contract.message.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function generateContractFromSources(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const sources = [generateForm.source_contract_id_a, generateForm.source_contract_id_b]
      .map((item) => item.trim())
      .filter(Boolean)
    if (sources.length === 0) {
      showWarningDialog(t('purchase.contract.validation.exportContractRequired'))
      return
    }
    if (!generateForm.supplier_name.trim()) {
      showWarningDialog(t('purchase.contract.validation.supplierRequired'))
      return
    }
    if (!generateForm.payment_terms.trim()) {
      showWarningDialog(t('purchase.contract.validation.paymentTermsRequired'))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const generated = await generatePurchaseContractFromExportContracts(
        purchaseContractGeneratePayload(generateForm),
      )
      setMessage(t('purchase.contract.message.generated', { code: generated.code }))
      setMode('manual')
      setGenerateForm(initialPurchaseContractGenerateForm())
      setModalOpen(false)
      await onSaved(generated)
    } catch (caught) {
      showError(caught, t('purchase.contract.message.generateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openCreate() {
    setEditingContractId(null)
    setMode('manual')
    setForm(initialPurchaseContractForm())
    closeProductDrawer()
    setMessage('')
    setModalOpen(true)
  }

  function openGenerate() {
    setEditingContractId(null)
    setMode('generate')
    setGenerateForm(initialPurchaseContractGenerateForm())
    void options.loadExportContracts()
    setMessage('')
    setModalOpen(true)
  }

  function openEdit() {
    if (!contract) return
    setEditingContractId(contract.id)
    setMode('manual')
    setForm(purchaseContractToForm(contract))
    setMessage(t('purchase.contract.message.editing', { code: contract.code }))
    setModalOpen(true)
  }

  function close() {
    setEditingContractId(null)
    setMode('manual')
    setForm(initialPurchaseContractForm())
    closeProductDrawer()
    setModalOpen(false)
  }

  return {
    modalOpen,
    mode,
    editingContractId,
    form,
    generateForm,
    setForm,
    setGenerateForm,
    submitting,
    productDrawerOpen,
    productSearch,
    setProductSearch,
    pendingProductIds,
    selectedProductIds,
    openCreate,
    openGenerate,
    openEdit,
    close,
    submitContractForm,
    generateContractFromSources,
    applySupplier,
    applyBuyer,
    applyBuyerToGenerateForm,
    applyQcUser,
    applyQcUserToGenerateForm,
    openProductDrawer,
    closeProductDrawer,
    togglePendingProduct,
    addPendingProducts,
    updateContractLine,
    removeContractLine,
  }
}

export type PurchaseContractFormModalModel = ReturnType<typeof usePurchaseContractFormModal>
