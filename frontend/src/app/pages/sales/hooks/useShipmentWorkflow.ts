import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'

import {
  approveShipment,
  generateShipmentFromContracts,
  listExportContracts,
  rejectShipment,
  resyncShipmentFromContracts,
  submitShipment,
  withdrawShipment,
  type CurrentUser,
  type ShipmentPlan,
} from '@/api'
import { canApproveAssignedRecord, formatDate, formatMoney, todayInputValue } from '@/app/pages/appHelpers'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { useFormModal } from '@/shared/useFormModal'

import {
  initialShipmentApproveForm,
  initialShipmentForm,
  initialShipmentRejectForm,
  shipmentApprovePayload,
  shipmentGeneratePayload,
  shipmentRejectPayload,
  type ShipmentApproveFormState,
  type ShipmentFormState,
  type ShipmentRejectFormState,
} from '../shipmentHelpers'

const SHIPMENT_APPROVE_PERMISSION = 'sales:shipment:approve'

type Params = {
  currentUser: CurrentUser
  selectedShipment: ShipmentPlan | null
  upsertShipment: (shipment: ShipmentPlan) => void
  reloadShipments: (id?: string) => Promise<void>
  reloadReminders: () => Promise<void>
}

export function useShipmentWorkflow({
  currentUser,
  selectedShipment,
  upsertShipment,
  reloadShipments,
  reloadReminders,
}: Params) {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const {
    open: formOpen,
    form,
    setForm,
    submitting: submittingGenerate,
    openWith: openShipmentForm,
    close: closeShipmentForm,
    runSubmit: runShipmentSubmit,
  } = useFormModal<ShipmentFormState>(initialShipmentForm)
  const [reviewerId, setReviewerId] = useState('')
  const [approveForm, setApproveForm] = useState<ShipmentApproveFormState>(() =>
    initialShipmentApproveForm(),
  )
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectForm, setRejectForm] = useState<ShipmentRejectFormState>(() =>
    initialShipmentRejectForm(),
  )
  const [rejectSubmitting, setRejectSubmitting] = useState(false)
  const [resyncSubmitting, setResyncSubmitting] = useState(false)

  const fetchExportContractOptions = useCallback(async (query: string) => {
    const result = await listExportContracts({
      q: query.trim() || undefined,
      approval_status: 'approved',
    })
    return result.items.slice(0, 20).map((contract) => ({
      value: contract.id,
      label: `${contract.code} / ${contract.customer_name}`,
      description: t('sales.shipment.form.contractOptionDescription', {
        date: formatDate(contract.planned_ship_date),
        amount: formatMoney(contract.statistics.total_amount, contract.currency),
      }),
    }))
  }, [])

  useEffect(() => {
    setApproveForm({
      reviewer_name: selectedShipment?.reviewer_name ?? '',
      approved_at: selectedShipment?.approved_at ?? todayInputValue(),
    })
    setReviewerId(selectedShipment?.reviewer_id ?? '')
  }, [selectedShipment?.id, selectedShipment?.approval_status])

  const canApproveSelected = Boolean(
    selectedShipment &&
      canApproveAssignedRecord(
        currentUser,
        selectedShipment.reviewer_id,
        SHIPMENT_APPROVE_PERMISSION,
      ),
  )

  const canWithdrawSelected = Boolean(
    selectedShipment &&
      selectedShipment.approval_status === 'submitted' &&
      (selectedShipment.owner_user_id === currentUser.id ||
        currentUser.permissions.includes('system:super_admin')),
  )

  const canRejectSelected = Boolean(
    selectedShipment && selectedShipment.approval_status === 'submitted' && canApproveSelected,
  )

  const canResyncSelected = Boolean(
    selectedShipment &&
      (selectedShipment.approval_status === 'rejected' ||
        (selectedShipment.approval_status === 'draft' && selectedShipment.rejection_reason)),
  )

  function openRejectModal() {
    setRejectForm(initialShipmentRejectForm())
    setRejectOpen(true)
  }

  function closeRejectModal() {
    setRejectOpen(false)
    setRejectForm(initialShipmentRejectForm())
  }

  async function rejectSelectedShipment() {
    if (!selectedShipment) return
    if (!canApproveAssignedRecord(currentUser, selectedShipment.reviewer_id, SHIPMENT_APPROVE_PERMISSION)) {
      showError(
        new Error(
          t('sales.shipment.action.approverMismatch', {
            name: selectedShipment.reviewer_name ?? t('sales.shipment.action.defaultReviewer'),
          }),
        ),
      )
      return
    }
    if (!rejectForm.rejection_reason.trim()) {
      showError(new Error(t('sales.shipment.validation.rejectionReasonRequired')))
      return
    }
    setRejectSubmitting(true)
    setMessage('')
    try {
      const rejected = await rejectShipment(
        selectedShipment.id,
        shipmentRejectPayload(rejectForm),
      )
      setMessage(t('sales.shipment.message.rejected', { code: rejected.code }))
      setRejectOpen(false)
      upsertShipment(rejected)
      await Promise.all([reloadShipments(rejected.id), reloadReminders()])
    } catch (caught) {
      showError(caught, t('sales.shipment.message.rejectFailed'))
    } finally {
      setRejectSubmitting(false)
    }
  }

  async function resyncSelectedShipment() {
    if (!selectedShipment) return
    setResyncSubmitting(true)
    setMessage('')
    try {
      const resynced = await resyncShipmentFromContracts(selectedShipment.id)
      setMessage(t('sales.shipment.message.resynced', { code: resynced.code }))
      upsertShipment(resynced)
      await Promise.all([reloadShipments(resynced.id), reloadReminders()])
    } catch (caught) {
      showError(caught, t('sales.shipment.message.resyncFailed'))
    } finally {
      setResyncSubmitting(false)
    }
  }

  async function submitGeneratedShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const saved = await runShipmentSubmit(
      async () => {
        const created = await generateShipmentFromContracts(shipmentGeneratePayload(form))
        setMessage(t('sales.shipment.message.generated', { code: created.code }))
        upsertShipment(created)
        await Promise.all([reloadShipments(created.id), reloadReminders()])
      },
      (caught) => showError(caught, t('sales.shipment.message.generateFailed')),
    )
    if (saved) closeShipmentForm()
  }

  async function submitShipmentForApproval() {
    if (!selectedShipment) return
    if (!reviewerId) {
      showError(new Error(t('sales.shipment.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const submitted = await submitShipment(selectedShipment.id, { reviewer_id: reviewerId })
      setMessage(t('sales.shipment.message.submitted', { code: submitted.code }))
      upsertShipment(submitted)
      await Promise.all([reloadShipments(submitted.id), reloadReminders()])
    } catch (caught) {
      showError(caught, t('sales.shipment.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function withdrawSelectedShipment() {
    if (!selectedShipment) return
    setSubmitting(true)
    setMessage('')
    try {
      const withdrawn = await withdrawShipment(selectedShipment.id)
      setMessage(t('sales.shipment.message.withdrawn', { code: withdrawn.code }))
      upsertShipment(withdrawn)
      await Promise.all([reloadShipments(withdrawn.id), reloadReminders()])
    } catch (caught) {
      showError(caught, t('sales.shipment.message.withdrawFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedShipment) return
    if (
      !canApproveAssignedRecord(
        currentUser,
        selectedShipment.reviewer_id,
        SHIPMENT_APPROVE_PERMISSION,
      )
    ) {
      showError(
        new Error(
          t('sales.shipment.action.approverMismatch', {
            name: selectedShipment.reviewer_name ?? t('sales.shipment.action.defaultReviewer'),
          }),
        ),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const approved = await approveShipment(
        selectedShipment.id,
        shipmentApprovePayload(approveForm),
      )
      setMessage(t('sales.shipment.message.approved', { code: approved.code }))
      upsertShipment(approved)
      await Promise.all([reloadShipments(approved.id), reloadReminders()])
    } catch (caught) {
      showError(caught, t('sales.shipment.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openGenerateForm() {
    openShipmentForm()
  }

  return {
    generateFormOpen: formOpen,
    generateForm: form,
    setGenerateForm: setForm,
    submittingGenerate,
    submitting,
    message,
    reviewerId,
    setReviewerId,
    approveForm,
    setApproveForm,
    canApproveSelected,
    canWithdrawSelected,
    canRejectSelected,
    canResyncSelected,
    rejectOpen,
    rejectForm,
    setRejectForm,
    rejectSubmitting,
    resyncSubmitting,
    fetchExportContractOptions,
    submitGeneratedShipment,
    submitShipmentForApproval,
    withdrawSelectedShipment,
    approveSelectedShipment,
    openRejectModal,
    closeRejectModal,
    rejectSelectedShipment,
    resyncSelectedShipment,
    openGenerateForm,
    closeGenerateForm: closeShipmentForm,
  }
}
