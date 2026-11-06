import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  createVerificationDocument,
  listVerificationDocuments,
  listVerificationUsage,
  registerVerification,
  registerVerificationCustomsReceipt,
  registerTaxRefund,
  type VerificationDocument,
  type VerificationUsageItem,
} from '../../../../api'
import { showError } from '../../../../shared/errors'
import {
  VerificationDocumentFormState,
  CustomsReceiptFormState,
  VerificationRegisterFormState,
  TaxRefundFormState,
  initialVerificationDocumentForm,
  initialCustomsReceiptForm,
  initialVerificationRegisterForm,
  initialTaxRefundForm,
  verificationDocumentPayload,
  customsReceiptPayload,
  verificationRegisterPayload,
  taxRefundPayload,
} from '../financeHelpers'

import type { FinanceModuleEnv } from '../financePageTypes'

export function useTaxModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, setMessage, setError, loadOverview } = env

  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([])

  const [verificationUsage, setVerificationUsage] = useState<VerificationUsageItem[]>([])

  const [selectedVerificationDocumentId, setSelectedVerificationDocumentId] = useState<
    string | null
  >(null)

  const [verificationSearch, setVerificationSearch] = useState('')

  const [verificationStatusFilter, setVerificationStatusFilter] = useState('')

  const [verificationReminderFilter, setVerificationReminderFilter] = useState('')

  const [verificationOwnerFilter, setVerificationOwnerFilter] = useState('')

  const [verificationShipmentFilter, setVerificationShipmentFilter] = useState('')

  const [verificationUsageSearch, setVerificationUsageSearch] = useState('')

  const [verificationUsageStatusFilter, setVerificationUsageStatusFilter] = useState('')

  const [verificationUsageReminderFilter, setVerificationUsageReminderFilter] = useState('')

  const [verificationUsageShipmentFilter, setVerificationUsageShipmentFilter] = useState('')

  const [verificationDocumentForm, setVerificationDocumentForm] =
    useState<VerificationDocumentFormState>(() => initialVerificationDocumentForm())

  const [customsReceiptForm, setCustomsReceiptForm] = useState<CustomsReceiptFormState>(() =>
    initialCustomsReceiptForm(),
  )

  const [verificationRegisterForm, setVerificationRegisterForm] =
    useState<VerificationRegisterFormState>(() => initialVerificationRegisterForm())

  const [taxRefundForm, setTaxRefundForm] = useState<TaxRefundFormState>(() =>
    initialTaxRefundForm(),
  )

  const [loadingVerificationDocuments, setLoadingVerificationDocuments] = useState(false)

  const [loadingVerificationUsage, setLoadingVerificationUsage] = useState(false)

  const [taxDocumentModalOpen, setTaxDocumentModalOpen] = useState(false)

  const [submittingVerificationDocument, setSubmittingVerificationDocument] = useState(false)

  const [submittingCustomsReceipt, setSubmittingCustomsReceipt] = useState(false)

  const [submittingVerificationRegister, setSubmittingVerificationRegister] = useState(false)

  const [submittingTaxRefund, setSubmittingTaxRefund] = useState(false)

  const selectedVerificationDocument = useMemo(
    () =>
      verificationDocuments.find((item) => item.id === selectedVerificationDocumentId) ??
      verificationDocuments[0] ??
      null,
    [verificationDocuments, selectedVerificationDocumentId],
  )

  useEffect(() => {
    if (!selectedVerificationDocument) return
    setTaxRefundForm((current) => ({
      ...current,
      amount: selectedVerificationDocument.unrefunded_amount,
      currency: selectedVerificationDocument.currency,
    }))
  }, [
    selectedVerificationDocument?.id,
    selectedVerificationDocument?.unrefunded_amount,
    selectedVerificationDocument?.currency,
  ])

  async function loadVerificationDocuments(preferredId?: string) {
    setLoadingVerificationDocuments(true)
    setError('')
    try {
      const result = await listVerificationDocuments({
        q: verificationSearch.trim() || undefined,
        status: verificationStatusFilter || undefined,
        owner_user_id: verificationOwnerFilter.trim() || undefined,
        shipment_no: verificationShipmentFilter.trim() || undefined,
        reminder_status: verificationReminderFilter || undefined,
      })
      setVerificationDocuments(result.items)
      const nextDocumentId =
        preferredId ??
        (activeModule === 'tax' && result.items.some((item) => item.id === detailId)
          ? detailId
          : null) ??
        (result.items.some((item) => item.id === selectedVerificationDocumentId)
          ? selectedVerificationDocumentId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedVerificationDocumentId(nextDocumentId)
    } catch (caught) {
      showError(caught, '核销单加载失败')
    } finally {
      setLoadingVerificationDocuments(false)
    }
  }

  async function loadVerificationUsage() {
    setLoadingVerificationUsage(true)
    setError('')
    try {
      const result = await listVerificationUsage({
        q: verificationUsageSearch.trim() || undefined,
        status: verificationUsageStatusFilter || undefined,
        shipment_no: verificationUsageShipmentFilter.trim() || undefined,
        reminder_status: verificationUsageReminderFilter || undefined,
      })
      setVerificationUsage(result.items)
    } catch (caught) {
      showError(caught, '核销单使用情况加载失败')
    } finally {
      setLoadingVerificationUsage(false)
    }
  }

  async function submitVerificationDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingVerificationDocument(true)
    setMessage('')
    setError('')
    try {
      const created = await createVerificationDocument(
        verificationDocumentPayload(verificationDocumentForm),
      )
      setMessage(`已领用核销单 ${created.document_no}`)
      setVerificationDocumentForm(initialVerificationDocumentForm())
      await loadVerificationDocuments(created.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, '核销单领用失败')
    } finally {
      setSubmittingVerificationDocument(false)
    }
  }

  async function submitCustomsReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingCustomsReceipt(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerVerificationCustomsReceipt(
        selectedVerificationDocument.id,
        customsReceiptPayload(customsReceiptForm),
      )
      setMessage(`已登记报关回单 ${updated.customs_receipt_no ?? updated.document_no}`)
      setCustomsReceiptForm(initialCustomsReceiptForm())
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, '报关回单登记失败')
    } finally {
      setSubmittingCustomsReceipt(false)
    }
  }

  async function submitVerificationRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingVerificationRegister(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerVerification(
        selectedVerificationDocument.id,
        verificationRegisterPayload(verificationRegisterForm),
      )
      setMessage(`已核销 ${updated.document_no}`)
      setVerificationRegisterForm(initialVerificationRegisterForm())
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, '核销登记失败')
    } finally {
      setSubmittingVerificationRegister(false)
    }
  }

  async function submitTaxRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingTaxRefund(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerTaxRefund(
        selectedVerificationDocument.id,
        taxRefundPayload(taxRefundForm),
      )
      setMessage(`已登记退税 ${updated.document_no}`)
      setTaxRefundForm(initialTaxRefundForm(updated.currency, updated.unrefunded_amount))
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
      await loadOverview()
    } catch (caught) {
      showError(caught, '退税登记失败')
    } finally {
      setSubmittingTaxRefund(false)
    }
  }

  const selectedVerificationCanRegisterCustoms =
    selectedVerificationDocument?.status === 'issued' ||
    selectedVerificationDocument?.status === 'customs_receipt_registered'

  const selectedVerificationCanVerify =
    selectedVerificationDocument?.status === 'customs_receipt_registered' ||
    selectedVerificationDocument?.status === 'verified'

  const selectedVerificationCanRefund =
    selectedVerificationDocument?.status === 'verified' ||
    (selectedVerificationDocument?.status === 'refunded' &&
      Number(selectedVerificationDocument.unrefunded_amount) > 0)

  return {
    customsReceiptForm,
    loadVerificationDocuments,
    loadVerificationUsage,
    loadingVerificationDocuments,
    loadingVerificationUsage,
    selectedVerificationCanRefund,
    selectedVerificationCanRegisterCustoms,
    selectedVerificationCanVerify,
    selectedVerificationDocument,
    setCustomsReceiptForm,
    setSelectedVerificationDocumentId,
    setTaxDocumentModalOpen,
    setTaxRefundForm,
    setVerificationDocumentForm,
    setVerificationOwnerFilter,
    setVerificationRegisterForm,
    setVerificationReminderFilter,
    setVerificationSearch,
    setVerificationShipmentFilter,
    setVerificationStatusFilter,
    setVerificationUsageReminderFilter,
    setVerificationUsageSearch,
    setVerificationUsageShipmentFilter,
    setVerificationUsageStatusFilter,
    submitCustomsReceipt,
    submitTaxRefund,
    submitVerificationDocument,
    submitVerificationRegister,
    submittingCustomsReceipt,
    submittingTaxRefund,
    submittingVerificationDocument,
    submittingVerificationRegister,
    taxDocumentModalOpen,
    taxRefundForm,
    verificationDocumentForm,
    verificationDocuments,
    verificationOwnerFilter,
    verificationRegisterForm,
    verificationReminderFilter,
    verificationSearch,
    verificationShipmentFilter,
    verificationStatusFilter,
    verificationUsage,
    verificationUsageReminderFilter,
    verificationUsageSearch,
    verificationUsageShipmentFilter,
    verificationUsageStatusFilter,
  }
}

export type TaxModel = ReturnType<typeof useTaxModule>
