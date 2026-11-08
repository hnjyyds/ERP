import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'

import {
  approveShipment,
  generateShipmentFromContracts,
  listExportContracts,
  submitShipment,
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
  shipmentApprovePayload,
  shipmentGeneratePayload,
  type ShipmentApproveFormState,
  type ShipmentFormState,
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
    fetchExportContractOptions,
    submitGeneratedShipment,
    submitShipmentForApproval,
    approveSelectedShipment,
    openGenerateForm,
    closeGenerateForm: closeShipmentForm,
  }
}
