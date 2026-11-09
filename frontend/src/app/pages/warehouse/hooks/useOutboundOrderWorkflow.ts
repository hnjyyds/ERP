import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import {
  approveOutboundOrder,
  cancelOutboundOrder,
  generateOutboundOrderFromPlan,
  submitOutboundOrder,
  type CurrentUser,
  type OutboundOrder,
  type OutboundPlan,
} from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { canApproveAssignedRecord } from '@/app/pages/appHelpers'

import {
  initialOutboundOrderApprovalForm,
  initialOutboundOrderForm,
  outboundOrderApprovePayload,
  outboundOrderFormForPlan,
  outboundOrderPayload,
  outboundOrderToForm,
  type OutboundOrderApprovalFormState,
  type OutboundOrderFormState,
} from '../outboundOrderHelpers'

const APPROVE_PERMISSION = 'warehouse:outbound_order:approve'

type Params = {
  currentUser: CurrentUser
  selectedOrder: OutboundOrder | null
  outboundPlans: OutboundPlan[]
  onGenerated: (order: OutboundOrder, inventoryQuery: string) => Promise<void>
  onSubmitted: (order: OutboundOrder, inventoryQuery: string) => Promise<void>
  onApproved: (order: OutboundOrder, inventoryQuery: string) => Promise<void>
  onSaved: (order: OutboundOrder) => Promise<void>
}

export function useOutboundOrderWorkflow({
  currentUser,
  selectedOrder,
  outboundPlans,
  onGenerated,
  onSubmitted,
  onApproved,
  onSaved,
}: Params) {
  const [form, setForm] = useState<OutboundOrderFormState>(() => initialOutboundOrderForm())
  const [reviewerId, setReviewerId] = useState('')
  const [approvalForm, setApprovalForm] = useState<OutboundOrderApprovalFormState>(() =>
    initialOutboundOrderApprovalForm(),
  )
  const [outboundOrderModalOpen, setOutboundOrderModalOpen] = useState(false)
  const [generateSubmitting, setGenerateSubmitting] = useState(false)
  const [submitSubmitting, setSubmitSubmitting] = useState(false)
  const [approveSubmitting, setApproveSubmitting] = useState(false)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')

  const canApproveSelectedOrder = Boolean(
    selectedOrder && canApproveAssignedRecord(currentUser, selectedOrder.reviewer_id, APPROVE_PERMISSION),
  )

  useEffect(() => {
    if (!selectedOrder) return
    setForm(outboundOrderToForm(selectedOrder))
    setApprovalForm((current) => ({
      ...current,
      reviewer_name: selectedOrder.reviewer_name ?? '',
      approved_at: selectedOrder.approved_at ?? selectedOrder.outbound_at,
    }))
    setReviewerId(selectedOrder.reviewer_id ?? '')
  }, [selectedOrder?.id, selectedOrder?.status])

  useEffect(() => {
    if (selectedOrder) return
    const firstPlan = outboundPlans[0]
    if (!firstPlan) return
    setForm((current) => outboundOrderFormForPlan(firstPlan, current))
  }, [outboundPlans, selectedOrder])

  function handleOutboundOrderPlanChange(planId: string) {
    const plan = outboundPlans.find((item) => item.id === planId)
    setForm((current) =>
      plan ? outboundOrderFormForPlan(plan, current) : { ...current, plan_id: planId },
    )
  }

  function openOutboundOrderModal() {
    setForm(
      selectedOrder
        ? outboundOrderToForm(selectedOrder)
        : outboundPlans[0]
          ? outboundOrderFormForPlan(outboundPlans[0], initialOutboundOrderForm())
          : initialOutboundOrderForm(),
    )
    setApprovalForm(
      selectedOrder
        ? {
            reviewer_name: selectedOrder.reviewer_name ?? '',
            approved_at: selectedOrder.approved_at ?? selectedOrder.outbound_at,
            allow_negative: false,
          }
        : initialOutboundOrderApprovalForm(),
    )
    setReviewerId(selectedOrder?.reviewer_id ?? '')
    setOutboundOrderModalOpen(true)
  }

  function closeOutboundOrderModal() {
    setOutboundOrderModalOpen(false)
  }

  async function generateOutboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGenerateSubmitting(true)
    setMessage('')
    try {
      const order = await generateOutboundOrderFromPlan(outboundOrderPayload(form))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setOutboundOrderModalOpen(false)
      await onGenerated(order, inventoryQuery)
      setMessage(t('warehouse.outboundOrder.message.generated', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.message.generateFailed'))
    } finally {
      setGenerateSubmitting(false)
    }
  }

  async function submitSelectedOutboundOrder() {
    if (!selectedOrder) return
    if (!reviewerId) {
      showError(new Error(t('warehouse.outboundOrder.validation.reviewerRequired')))
      return
    }
    setSubmitSubmitting(true)
    setMessage('')
    try {
      const order = await submitOutboundOrder(selectedOrder.id, { reviewer_id: reviewerId })
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      await onSubmitted(order, inventoryQuery)
      setMessage(t('warehouse.outboundOrder.message.submitted', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.message.submitFailed'))
    } finally {
      setSubmitSubmitting(false)
    }
  }

  function openCancelModal() {
    setCancelReason('')
    setCancelReasonError('')
    setCancelModalOpen(true)
  }

  function closeCancelModal() {
    setCancelModalOpen(false)
  }

  function changeCancelReason(value: string) {
    setCancelReason(value)
    if (cancelReasonError) setCancelReasonError('')
  }

  async function cancelSelectedOutboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    const reason = cancelReason.trim()
    if (!reason) {
      setCancelReasonError(t('warehouse.outboundOrder.validation.cancelReasonRequired'))
      return
    }
    setCancelSubmitting(true)
    setMessage('')
    try {
      const order = await cancelOutboundOrder(selectedOrder.id, { reason })
      setCancelModalOpen(false)
      await onSaved(order)
      setMessage(t('warehouse.outboundOrder.message.cancelled', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.message.cancelFailed'))
    } finally {
      setCancelSubmitting(false)
    }
  }

  async function approveSelectedOutboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    if (selectedOrder.status !== 'submitted') return
    if (!canApproveSelectedOrder) {
      showError(
        new Error(
          t('warehouse.outboundOrder.validation.reviewerMismatch', {
            name:
              selectedOrder.reviewer_name ??
              t('warehouse.outboundOrder.detail.reviewerFallback'),
          }),
        ),
      )
      return
    }
    setApproveSubmitting(true)
    setMessage('')
    try {
      const order = await approveOutboundOrder(
        selectedOrder.id,
        outboundOrderApprovePayload(approvalForm),
      )
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setOutboundOrderModalOpen(false)
      await onApproved(order, inventoryQuery)
      setMessage(
        order.outbound_mode === 'formal'
          ? t('warehouse.outboundOrder.message.approvedFormal', { code: order.code })
          : t('warehouse.outboundOrder.message.approvedException', { code: order.code }),
      )
    } catch (caught) {
      showError(caught, t('warehouse.outboundOrder.message.approveFailed'))
    } finally {
      setApproveSubmitting(false)
    }
  }

  return {
    form,
    setForm,
    reviewerId,
    setReviewerId,
    approvalForm,
    setApprovalForm,
    outboundOrderModalOpen,
    generateSubmitting,
    submitSubmitting,
    approveSubmitting,
    cancelSubmitting,
    message,
    cancelModalOpen,
    cancelReason,
    cancelReasonError,
    canApproveSelectedOrder,
    openOutboundOrderModal,
    closeOutboundOrderModal,
    handleOutboundOrderPlanChange,
    generateOutboundOrder,
    submitSelectedOutboundOrder,
    openCancelModal,
    closeCancelModal,
    changeCancelReason,
    cancelSelectedOutboundOrder,
    approveSelectedOutboundOrder,
  }
}
