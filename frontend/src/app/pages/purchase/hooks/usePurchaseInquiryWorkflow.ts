import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import {
  addPurchaseInquiryQuotation,
  createPurchaseInquiry,
  sendPurchaseInquiryTemplate,
  updatePurchaseInquiry,
  type PurchaseInquiry,
} from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { useFormModal } from '@/shared/useFormModal'

import {
  initialPurchaseInquiryForm,
  initialPurchaseInquiryTemplateForm,
  initialPurchaseQuotationForm,
  purchaseInquiryPayload,
  purchaseInquiryTemplatePayload,
  purchaseInquiryToForm,
  purchaseQuotationPayload,
  type PurchaseInquiryFormState,
  type PurchaseInquiryTemplateFormState,
  type PurchaseQuotationFormState,
} from '../purchaseInquiryHelpers'

type Params = {
  detailId: string | null
  selectedInquiry: PurchaseInquiry | null
  upsertInquiry: (inquiry: PurchaseInquiry) => void
  reloadInquiries: (id?: string) => Promise<void>
  reloadAuxiliary: (inquiry: PurchaseInquiry | null) => Promise<void>
}

export function usePurchaseInquiryWorkflow({
  detailId,
  selectedInquiry,
  upsertInquiry,
  reloadInquiries,
  reloadAuxiliary,
}: Params) {
  const {
    open: inquiryModalOpen,
    form: inquiryForm,
    setForm: setInquiryForm,
    submitting: submittingInquiry,
    openWith: openInquiryModal,
    close: closeInquiryModal,
    runSubmit: runInquirySubmit,
  } = useFormModal<PurchaseInquiryFormState>(initialPurchaseInquiryForm)
  const [editingInquiryId, setEditingInquiryId] = useState<string | null>(null)
  const [actionModal, setActionModal] = useState<'template' | 'quotation' | null>(null)
  const [quotationForm, setQuotationForm] = useState<PurchaseQuotationFormState>(() =>
    initialPurchaseQuotationForm(),
  )
  const [templateForm, setTemplateForm] = useState<PurchaseInquiryTemplateFormState>(() =>
    initialPurchaseInquiryTemplateForm(),
  )
  const [templatePreview, setTemplatePreview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!detailId) return
    const firstQuote = selectedInquiry?.quotations[0]
    setTemplateForm({
      template_name: selectedInquiry?.template_name ?? '',
      recipient_emails: firstQuote?.supplier_id
        ? `${firstQuote.supplier_id}@example.com`
        : 'supplier@example.com',
    })
    setQuotationForm((current) => ({
      ...current,
      currency: firstQuote?.currency ?? current.currency,
      quoted_at: selectedInquiry?.inquiry_date ?? current.quoted_at,
    }))
  }, [detailId, selectedInquiry?.id, selectedInquiry?.status, selectedInquiry?.quotations.length])

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const saved = await runInquirySubmit(
      async () => {
        const payload = purchaseInquiryPayload(inquiryForm)
        const inquiry = editingInquiryId
          ? await updatePurchaseInquiry(editingInquiryId, payload)
          : await createPurchaseInquiry(payload)
        setMessage(
          editingInquiryId
            ? t('purchase.inquiry.message.saved', { code: inquiry.code })
            : t('purchase.inquiry.message.created', { code: inquiry.code }),
        )
        setEditingInquiryId(null)
        upsertInquiry(inquiry)
        await reloadInquiries(inquiry.id)
      },
      (caught) => showError(caught, t('purchase.inquiry.message.saveFailed')),
    )
    if (saved) closeInquiryModal()
  }

  async function sendTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedInquiry) return
    setSubmitting(true)
    setMessage('')
    try {
      const template = await sendPurchaseInquiryTemplate(
        selectedInquiry.id,
        purchaseInquiryTemplatePayload(templateForm),
      )
      setTemplatePreview(template.content)
      setMessage(t('purchase.inquiry.message.templateGenerated', { filename: template.filename }))
      setActionModal(null)
      await reloadInquiries(selectedInquiry.id)
    } catch (caught) {
      showError(caught, t('purchase.inquiry.message.templateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function addSupplierQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedInquiry?.lines[0]) return
    setSubmitting(true)
    setMessage('')
    try {
      const updated = await addPurchaseInquiryQuotation(
        selectedInquiry.id,
        purchaseQuotationPayload(quotationForm, selectedInquiry.lines[0].id),
      )
      setMessage(
        t('purchase.inquiry.message.quotationAdded', { supplier: quotationForm.supplier_name }),
      )
      setActionModal(null)
      upsertInquiry(updated)
      await Promise.all([reloadInquiries(updated.id), reloadAuxiliary(updated)])
    } catch (caught) {
      showError(caught, t('purchase.inquiry.message.quotationAddFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openCreateInquiry() {
    setEditingInquiryId(null)
    setMessage('')
    openInquiryModal()
  }

  function loadSelectedInquiryForEdit() {
    if (!selectedInquiry) return
    setEditingInquiryId(selectedInquiry.id)
    setMessage(t('purchase.inquiry.message.editing', { code: selectedInquiry.code }))
    openInquiryModal(purchaseInquiryToForm(selectedInquiry))
  }

  function cancelInquiryEdit() {
    setEditingInquiryId(null)
    closeInquiryModal()
  }

  return {
    inquiryModalOpen,
    inquiryForm,
    setInquiryForm,
    submittingInquiry,
    editingInquiryId,
    actionModal,
    setActionModal,
    quotationForm,
    setQuotationForm,
    templateForm,
    setTemplateForm,
    templatePreview,
    submitting,
    message,
    submitInquiry,
    sendTemplate,
    addSupplierQuotation,
    openCreateInquiry,
    loadSelectedInquiryForEdit,
    cancelInquiryEdit,
  }
}
