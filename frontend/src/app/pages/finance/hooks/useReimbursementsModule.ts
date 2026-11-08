import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  createReimbursement,
  approveReimbursement,
  payReimbursement,
  listReimbursements,
  type Reimbursement,
  type ReimbursementCreatePayload,
} from '@/api'
import { showError } from '@/shared/errors'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { useFormModal } from '@/shared/useFormModal'
import { canApproveAssignedRecord } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import type { FinanceModuleEnv } from '@/app/pages/finance/financePageTypes'

type ReimbursementFilters = { q: string; status: string; category: string }

function reimbursementFiltersFromParams(params: URLSearchParams): ReimbursementFilters {
  return {
    q: params.get('reimbursements_q') ?? '',
    status: params.get('reimbursements_status') ?? '',
    category: params.get('reimbursements_category') ?? '',
  }
}

function reimbursementSignature(params: URLSearchParams): string {
  return JSON.stringify([
    parsePageParam(params, 'reimbursements_page'),
    reimbursementFiltersFromParams(params),
  ])
}

function initialReimbursementForm() {
  return {
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
  }
}

export function useReimbursementsModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, currentUser, setMessage, setError } = env

  // ---- 报销管理 / 口岸数据 / 财务报表 ----
  const urlQuery = useUrlQuery()

  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])

  const reimbursementsPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'reimbursements_page'),
  )

  const [reimbursementFilters, setReimbursementFilters] = useState(() =>
    reimbursementFiltersFromParams(urlQuery.params),
  )

  const appliedReimbursementSignatureRef = useRef(reimbursementSignature(urlQuery.params))

  const [reimbursementsTotalAmount, setReimbursementsTotalAmount] = useState('0.00')

  const [selectedReimbursementId, setSelectedReimbursementId] = useState<string | null>(null)

  const [loadingReimbursements, setLoadingReimbursements] = useState(false)

  const [submittingReimbursementAction, setSubmittingReimbursementAction] = useState(false)

  const reimbursementModal = useFormModal(initialReimbursementForm)

  const [reimbursementPayMethod, setReimbursementPayMethod] = useState('bank_transfer')

  async function loadReimbursements(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: ReimbursementFilters,
  ) {
    setLoadingReimbursements(true)
    setError('')
    try {
      const filters = filtersOverride ?? reimbursementFilters
      const page = pageOverride ?? reimbursementsPager.page
      const pageSize = pageSizeOverride ?? reimbursementsPager.pageSize
      const result = await listReimbursements({
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
        category: filters.category || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setReimbursements(result.items)
      reimbursementsPager.setTotal(result.total)
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
    setMessage('')
    setError('')
    const form = reimbursementModal.form
    const saved = await reimbursementModal.runSubmit(
      async () => {
        const payload: ReimbursementCreatePayload = {
          reimbursement_no: form.reimbursement_no.trim(),
          applicant_user_id: form.applicant_user_id.trim(),
          applicant_user_name: form.applicant_user_name.trim(),
          department: form.department.trim(),
          category: form.category,
          currency: form.currency.trim(),
          amount: form.amount.trim(),
          reviewer_id: form.reviewer_id,
          reason: form.reason.trim() || undefined,
          remark: form.remark.trim() || undefined,
        }
        const created = await createReimbursement(payload)
        setMessage(
          t('finance.reimbursement.message.createSuccess', { code: created.reimbursement_no }),
        )
        await loadReimbursements(created.id)
      },
      (caught) => showError(caught, t('finance.reimbursement.message.createFailed')),
    )
    if (saved) reimbursementModal.close()
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

  async function changeReimbursementsPage(nextPage: number, nextPageSize: number) {
    const next = reimbursementsPager.changePage(nextPage, nextPageSize)
    const nextSearch = urlQuery.update({
      reimbursements_page: next.page === 1 ? null : next.page,
      reimbursements_q: reimbursementFilters.q,
      reimbursements_status: reimbursementFilters.status,
      reimbursements_category: reimbursementFilters.category,
    })
    appliedReimbursementSignatureRef.current = reimbursementSignature(
      new URLSearchParams(nextSearch),
    )
    await loadReimbursements(undefined, next.page, next.pageSize, reimbursementFilters)
  }

  useEffect(() => {
    const signature = reimbursementSignature(urlQuery.params)
    if (appliedReimbursementSignatureRef.current === signature) return
    appliedReimbursementSignatureRef.current = signature
    const filters = reimbursementFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'reimbursements_page')
    setReimbursementFilters(filters)
    reimbursementsPager.setPage(nextPage)
    void loadReimbursements(undefined, nextPage, reimbursementsPager.pageSize, filters)
  }, [urlQuery.search])

  return {
    changeReimbursementsPage,
    handleReimbursementApprove,
    handleReimbursementPay,
    loadReimbursements,
    loadingReimbursements,
    reimbursementCategoryFilter: reimbursementFilters.category,
    reimbursementForm: reimbursementModal.form,
    reimbursementModalOpen: reimbursementModal.open,
    reimbursementPayMethod,
    reimbursementSearch: reimbursementFilters.q,
    reimbursementStatusFilter: reimbursementFilters.status,
    reimbursements,
    reimbursementsPagination: reimbursementsPager.pagination,
    reimbursementsTotal: reimbursementsPager.total,
    reimbursementsTotalAmount,
    selectedReimbursementId,
    setReimbursementCategoryFilter: (value: string) =>
      setReimbursementFilters((current) => ({ ...current, category: value })),
    setReimbursementForm: reimbursementModal.setForm,
    setReimbursementModalOpen: (open: boolean) =>
      open ? reimbursementModal.openWith() : reimbursementModal.close(),
    setReimbursementPayMethod,
    setReimbursementSearch: (value: string) =>
      setReimbursementFilters((current) => ({ ...current, q: value })),
    setReimbursementStatusFilter: (value: string) =>
      setReimbursementFilters((current) => ({ ...current, status: value })),
    setSelectedReimbursementId,
    submitReimbursement,
    submittingReimbursement: reimbursementModal.submitting,
    submittingReimbursementAction,
  }
}

export type ReimbursementsModel = ReturnType<typeof useReimbursementsModule>
