import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import {
  approveExportQuotation,
  confirmExportQuotationContract,
  createExportQuotation,
  exportExportQuotation,
  rejectExportQuotation,
  submitExportQuotation,
  updateExportQuotation,
  withdrawExportQuotation,
  type CurrentUser,
  type Customer,
  type ExportQuotation,
  type ExportQuotationContract,
} from '@/api'
import { exportQuotationPath } from '@/app/routes'
import { showError } from '@/shared/errors'
import { canApproveAssignedRecord, todayInputValue } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import {
  customerDisplayName,
  exportQuotationApprovePayload,
  exportQuotationContractPayload,
  exportQuotationPayload,
  exportQuotationRejectPayload,
  exportQuotationToForm,
  initialExportQuotationApproveForm,
  initialExportQuotationContractForm,
  initialExportQuotationForm,
  initialExportQuotationRejectForm,
  type ExportQuotationApproveFormState,
  type ExportQuotationContractFormState,
  type ExportQuotationFormState,
  type ExportQuotationRejectFormState,
} from '../exportQuotationHelpers'

const APPROVE_PERMISSION = 'sales:quotation:approve'

type Params = {
  currentUser: CurrentUser
  selectedQuotation: ExportQuotation | null
  customers: Customer[]
  onNavigate: (path: string) => void
  setSelectedQuotationId: (id: string) => void
  applyCreatedQuotation: (quotation: ExportQuotation) => Promise<void>
  applySavedQuotation: (quotation: ExportQuotation) => Promise<void>
  applySubmittedQuotation: (quotation: ExportQuotation) => Promise<void>
  applyApprovedQuotation: (quotation: ExportQuotation) => Promise<void>
  reloadQuotations: (id: string) => Promise<void>
}

export function useExportQuotationWorkflow({
  currentUser,
  selectedQuotation,
  customers,
  onNavigate,
  setSelectedQuotationId,
  applyCreatedQuotation,
  applySavedQuotation,
  applySubmittedQuotation,
  applyApprovedQuotation,
  reloadQuotations,
}: Params) {
  const [form, setForm] = useState<ExportQuotationFormState>(() => initialExportQuotationForm())
  const [formOpen, setFormOpen] = useState(false)
  const [reviewerId, setReviewerId] = useState('')
  const [approveForm, setApproveForm] = useState<ExportQuotationApproveFormState>(() =>
    initialExportQuotationApproveForm(),
  )
  const [contractForm, setContractForm] = useState<ExportQuotationContractFormState>(() =>
    initialExportQuotationContractForm(),
  )
  const [rejectForm, setRejectForm] = useState<ExportQuotationRejectFormState>(() =>
    initialExportQuotationRejectForm(),
  )
  const [rejectOpen, setRejectOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [exportPreview, setExportPreview] = useState('')
  const [generatedContract, setGeneratedContract] = useState<ExportQuotationContract | null>(null)

  const canApproveSelectedQuotation = Boolean(
    selectedQuotation &&
      canApproveAssignedRecord(currentUser, selectedQuotation.reviewer_id, APPROVE_PERMISSION),
  )
  const canWithdrawSelectedQuotation = Boolean(
    selectedQuotation &&
      selectedQuotation.approval_status === 'submitted' &&
      (selectedQuotation.owner_user_id === currentUser.id ||
        currentUser.permissions.includes('system:super_admin')),
  )

  useEffect(() => {
    setApproveForm({
      reviewer_name: '',
      approved_at: selectedQuotation?.quote_date ?? todayInputValue(),
    })
    setContractForm({
      confirmed_at: selectedQuotation?.approved_at ?? todayInputValue(),
    })
    setRejectForm(initialExportQuotationRejectForm(selectedQuotation?.quote_date))
    setRejectOpen(false)
    setReviewerId(selectedQuotation?.reviewer_id ?? '')
  }, [selectedQuotation?.id, selectedQuotation?.approval_status])

  function applyCustomerToQuotationForm(customerId?: string) {
    const customer = customers.find((item) => item.id === customerId)
    setForm((current) => ({
      ...current,
      customer_id: customer?.id ?? '',
      customer_name: customer ? customerDisplayName(customer) : '',
    }))
  }

  function loadQuotationIntoForm(quotation: ExportQuotation) {
    setSelectedQuotationId(quotation.id)
    setForm(exportQuotationToForm(quotation))
    setFormOpen(true)
    onNavigate(exportQuotationPath)
  }

  function openNewQuotationForm() {
    setForm(initialExportQuotationForm())
    setFormOpen(true)
  }

  function closeQuotationForm() {
    setFormOpen(false)
  }

  async function submitQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setExportPreview('')
    try {
      const created = await createExportQuotation(exportQuotationPayload(form))
      setMessage(t('sales.quotation.message.created', { code: created.code }))
      setForm(initialExportQuotationForm())
      await applyCreatedQuotation(created)
      setFormOpen(false)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function saveQuotationDraft() {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    try {
      const updated = await updateExportQuotation(
        selectedQuotation.id,
        exportQuotationPayload(form),
      )
      setMessage(t('sales.quotation.message.saved', { code: updated.code }))
      await applySavedQuotation(updated)
      setFormOpen(false)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitQuotationForApproval() {
    if (!selectedQuotation) return
    if (!reviewerId) {
      showError(new Error(t('sales.quotation.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const submitted = await submitExportQuotation(selectedQuotation.id, {
        reviewer_id: reviewerId,
      })
      setMessage(t('sales.quotation.message.submitted', { code: submitted.code }))
      await applySubmittedQuotation(submitted)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function approveQuotation() {
    if (!selectedQuotation) return
    if (!canApproveSelectedQuotation) {
      showError(
        new Error(
          t('sales.quotation.action.approverMismatch', {
            name:
              selectedQuotation.reviewer_name ?? t('sales.quotation.action.defaultReviewer'),
          }),
        ),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const approved = await approveExportQuotation(
        selectedQuotation.id,
        exportQuotationApprovePayload(approveForm),
      )
      setMessage(t('sales.quotation.message.approved', { code: approved.code }))
      await applyApprovedQuotation(approved)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function rejectQuotation() {
    if (!selectedQuotation) return
    if (!canApproveSelectedQuotation) {
      showError(
        new Error(
          t('sales.quotation.action.approverMismatch', {
            name:
              selectedQuotation.reviewer_name ?? t('sales.quotation.action.defaultReviewer'),
          }),
        ),
      )
      return
    }
    if (!rejectForm.rejection_reason.trim()) {
      showError(new Error(t('sales.quotation.validation.rejectReasonRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const rejected = await rejectExportQuotation(
        selectedQuotation.id,
        exportQuotationRejectPayload(rejectForm),
      )
      setMessage(t('sales.quotation.message.rejected', { code: rejected.code }))
      setRejectOpen(false)
      await applySavedQuotation(rejected)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.rejectFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function withdrawQuotation() {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    try {
      const withdrawn = await withdrawExportQuotation(selectedQuotation.id)
      setMessage(t('sales.quotation.message.withdrawn', { code: withdrawn.code }))
      await applySavedQuotation(withdrawn)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.withdrawFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openRejectModal() {
    setRejectForm(initialExportQuotationRejectForm(selectedQuotation?.quote_date))
    setRejectOpen(true)
  }

  function closeRejectModal() {
    setRejectOpen(false)
  }

  async function exportQuotation(format: 'pdf' | 'excel') {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    try {
      const result = await exportExportQuotation(selectedQuotation.id, format)
      setExportPreview(result.content.split('\n').slice(0, 10).join('\n'))
      setMessage(t('sales.quotation.message.exportPreview', { filename: result.filename }))
    } catch (caught) {
      showError(caught, t('sales.quotation.message.exportFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    try {
      const contract = await confirmExportQuotationContract(
        selectedQuotation.id,
        exportQuotationContractPayload(contractForm),
      )
      setGeneratedContract(contract)
      setMessage(
        t('sales.quotation.message.contractGenerated', { contractNo: contract.contract_no }),
      )
      await reloadQuotations(selectedQuotation.id)
    } catch (caught) {
      showError(caught, t('sales.quotation.message.contractGenerateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    form,
    setForm,
    formOpen,
    reviewerId,
    setReviewerId,
    approveForm,
    setApproveForm,
    contractForm,
    setContractForm,
    rejectForm,
    setRejectForm,
    rejectOpen,
    submitting,
    message,
    exportPreview,
    generatedContract,
    canApproveSelectedQuotation,
    canWithdrawSelectedQuotation,
    applyCustomerToQuotationForm,
    loadQuotationIntoForm,
    openNewQuotationForm,
    closeQuotationForm,
    submitQuotation,
    saveQuotationDraft,
    submitQuotationForApproval,
    approveQuotation,
    rejectQuotation,
    withdrawQuotation,
    openRejectModal,
    closeRejectModal,
    exportQuotation,
    confirmContract,
  }
}
