import { useEffect, useState } from 'react'
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
  mergePurchaseLineRemark,
  purchaseContractGeneratePayload,
  purchaseContractPayload,
  purchaseContractToForm,
  type PurchaseContractFormState,
  type PurchaseContractGenerateFormState,
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

  function applyQcUser(userId: string | undefined) {
    const user = userId ? options.assignableUsers.find((item) => item.id === userId) : null
    setForm((current) => ({
      ...current,
      qc_user_id: user?.id ?? '',
      qc_user_name: user?.display_name ?? '',
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

  function applyProduct(productId: string | undefined) {
    if (!productId) {
      setForm((current) => ({ ...current, product_id: '' }))
      return
    }
    const product = options.products.find((item) => item.id === productId)
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

  function applySupplier(supplierId: string | undefined) {
    if (!supplierId) {
      setForm((current) => ({ ...current, supplier_id: '' }))
      return
    }
    const supplier = options.suppliers.find((item) => item.id === supplierId)
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
      setMode('manual')
      setForm(initialPurchaseContractForm())
      setModalOpen(false)
      await onSaved(saved)
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
    setMessage('')
    setModalOpen(true)
  }

  function openGenerate() {
    setEditingContractId(null)
    setMode('generate')
    setGenerateForm(initialPurchaseContractGenerateForm())
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
    openCreate,
    openGenerate,
    openEdit,
    close,
    submitContractForm,
    generateContractFromSources,
    applySupplier,
    applyProduct,
    applyQcUser,
    applyQcUserToGenerateForm,
  }
}

export type PurchaseContractFormModalModel = ReturnType<typeof usePurchaseContractFormModal>
