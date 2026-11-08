import type { FormEvent } from 'react'
import { useState } from 'react'
import {
  createReimbursement,
  approveReimbursement,
  payReimbursement,
  listReimbursements,
  type Reimbursement,
  type ReimbursementCreatePayload,
} from '@/api'
import { showError } from '@/shared/errors'
import { canApproveAssignedRecord } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import type { FinanceModuleEnv } from '@/app/pages/finance/financePageTypes'

export function useReimbursementsModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, currentUser, setMessage, setError } = env

  // ---- 报销管理 / 口岸数据 / 财务报表 ----
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])

  const [reimbursementsTotalAmount, setReimbursementsTotalAmount] = useState('0.00')

  const [selectedReimbursementId, setSelectedReimbursementId] = useState<string | null>(null)

  const [reimbursementSearch, setReimbursementSearch] = useState('')

  const [reimbursementStatusFilter, setReimbursementStatusFilter] = useState('')

  const [reimbursementCategoryFilter, setReimbursementCategoryFilter] = useState('')

  const [loadingReimbursements, setLoadingReimbursements] = useState(false)

  const [submittingReimbursement, setSubmittingReimbursement] = useState(false)

  const [submittingReimbursementAction, setSubmittingReimbursementAction] = useState(false)

  const [reimbursementForm, setReimbursementForm] = useState({
    reimbursement_no: '',
    applicant_user_id: '',
    applicant_user_name: '',
    department: '',
    category: 'travel',
    currency: 'CNY',
    amount: '',
    reviewer_id: '',
    reason: '',
    remark: '',
  })

  const [reimbursementPayMethod, setReimbursementPayMethod] = useState('bank_transfer')

  const [reimbursementModalOpen, setReimbursementModalOpen] = useState(false)

  async function loadReimbursements(preferredId?: string) {
    setLoadingReimbursements(true)
    setError('')
    try {
      const result = await listReimbursements({
        q: reimbursementSearch.trim() || undefined,
        status: reimbursementStatusFilter || undefined,
        category: reimbursementCategoryFilter || undefined,
      })
      setReimbursements(result.items)
      setReimbursementsTotalAmount(result.total_amount)
      const nextId =
        preferredId ??
        (activeModule === 'reimbursements' && result.items.some((item) => item.id === detailId)
          ? detailId
          : null) ??
        (result.items.some((item) => item.id === selectedReimbursementId)
          ? selectedReimbursementId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedReimbursementId(nextId)
    } catch (caught) {
      showError(caught, t('finance.reimbursement.message.loadFailed'))
    } finally {
      setLoadingReimbursements(false)
    }
  }

  async function submitReimbursement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingReimbursement(true)
    setMessage('')
    setError('')
    try {
      const payload: ReimbursementCreatePayload = {
        reimbursement_no: reimbursementForm.reimbursement_no.trim(),
        applicant_user_id: reimbursementForm.applicant_user_id.trim(),
        applicant_user_name: reimbursementForm.applicant_user_name.trim(),
        department: reimbursementForm.department.trim(),
        category: reimbursementForm.category,
        currency: reimbursementForm.currency.trim(),
        amount: reimbursementForm.amount.trim(),
        reviewer_id: reimbursementForm.reviewer_id,
        reason: reimbursementForm.reason.trim() || undefined,
        remark: reimbursementForm.remark.trim() || undefined,
      }
      const created = await createReimbursement(payload)
      setMessage(
        t('finance.reimbursement.message.createSuccess', { code: created.reimbursement_no }),
      )
      setReimbursementModalOpen(false)
      setReimbursementForm({
        reimbursement_no: '',
        applicant_user_id: '',
        applicant_user_name: '',
        department: '',
        category: 'travel',
        currency: 'CNY',
        amount: '',
        reviewer_id: '',
        reason: '',
        remark: '',
      })
      await loadReimbursements(created.id)
    } catch (caught) {
      showError(caught, t('finance.reimbursement.message.createFailed'))
    } finally {
      setSubmittingReimbursement(false)
    }
  }

  async function handleReimbursementApprove(approved: boolean) {
    if (!selectedReimbursementId) return
    const reimbursement = reimbursements.find((item) => item.id === selectedReimbursementId)
    if (
      !reimbursement ||
      !canApproveAssignedRecord(currentUser, reimbursement.reviewer_id, 'finance:view')
    ) {
      showError(
        new Error(
          t('finance.reimbursement.message.invalidApprover', {
            name:
              reimbursement?.reviewer_name ?? t('finance.reimbursement.field.assignedApprover'),
          }),
        ),
      )
      return
    }
    setSubmittingReimbursementAction(true)
    setMessage('')
    setError('')
    try {
      const updated = await approveReimbursement(selectedReimbursementId, { approved })
      setMessage(
        approved
          ? t('finance.reimbursement.message.approved', { code: updated.reimbursement_no })
          : t('finance.reimbursement.message.rejected', { code: updated.reimbursement_no }),
      )
      await loadReimbursements(updated.id)
    } catch (caught) {
      showError(caught, t('finance.reimbursement.message.approveFailed'))
    } finally {
      setSubmittingReimbursementAction(false)
    }
  }

  async function handleReimbursementPay() {
    if (!selectedReimbursementId) return
    setSubmittingReimbursementAction(true)
    setMessage('')
    setError('')
    try {
      const updated = await payReimbursement(selectedReimbursementId, {
        payment_method: reimbursementPayMethod,
      })
      setMessage(t('finance.reimbursement.message.paid', { code: updated.reimbursement_no }))
      await loadReimbursements(updated.id)
    } catch (caught) {
      showError(caught, t('finance.reimbursement.message.payFailed'))
    } finally {
      setSubmittingReimbursementAction(false)
    }
  }

  return {
    handleReimbursementApprove,
    handleReimbursementPay,
    loadReimbursements,
    loadingReimbursements,
    reimbursementCategoryFilter,
    reimbursementForm,
    reimbursementModalOpen,
    reimbursementPayMethod,
    reimbursementSearch,
    reimbursementStatusFilter,
    reimbursements,
    reimbursementsTotalAmount,
    selectedReimbursementId,
    setReimbursementCategoryFilter,
    setReimbursementForm,
    setReimbursementModalOpen,
    setReimbursementPayMethod,
    setReimbursementSearch,
    setReimbursementStatusFilter,
    setSelectedReimbursementId,
    submitReimbursement,
    submittingReimbursement,
    submittingReimbursementAction,
  }
}

export type ReimbursementsModel = ReturnType<typeof useReimbursementsModule>
