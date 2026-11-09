import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import {
  approveInboundOrder,
  cancelInboundOrder,
  generateInboundOrderFromPlan,
  listAssignableUsers,
  submitInboundOrder,
  type AssignableUser,
  type CurrentUser,
  type InboundOrder,
  type InboundPlan,
} from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'

import {
  inboundOrderApprovePayload,
  inboundOrderFormForPlan,
  inboundOrderPayload,
  inboundOrderToForm,
  inboundWarehouseOption,
  initialInboundOrderApprovalForm,
  initialInboundOrderForm,
  type InboundOrderApprovalFormState,
  type InboundOrderFormState,
} from '../inboundOrderHelpers'

type Params = {
  currentUser: CurrentUser
  selectedOrder: InboundOrder | null
  inboundPlans: InboundPlan[]
  onGenerated: (order: InboundOrder, inventoryQuery: string) => Promise<void>
  onSubmitted: (order: InboundOrder, inventoryQuery: string) => Promise<void>
  onApproved: (order: InboundOrder, inventoryQuery: string) => Promise<void>
  onSaved: (order: InboundOrder) => Promise<void>
}

export function useInboundOrderWorkflow({
  currentUser,
  selectedOrder,
  inboundPlans,
  onGenerated,
  onSubmitted,
  onApproved,
  onSaved,
}: Params) {
  const [form, setForm] = useState<InboundOrderFormState>(() => initialInboundOrderForm())
  const [approvalForm, setApprovalForm] = useState<InboundOrderApprovalFormState>(() =>
    initialInboundOrderApprovalForm(),
  )
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [inboundOrderModalOpen, setInboundOrderModalOpen] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)
  const [assignableUsersLoaded, setAssignableUsersLoaded] = useState(false)
  const [generateSubmitting, setGenerateSubmitting] = useState(false)
  const [submitSubmitting, setSubmitSubmitting] = useState(false)
  const [approveSubmitting, setApproveSubmitting] = useState(false)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState('')

  const selectedInboundPlan = useMemo(
    () => inboundPlans.find((item) => item.id === form.plan_id) ?? null,
    [form.plan_id, inboundPlans],
  )
  const canGenerateFromSelectedPlan = Boolean(
    selectedInboundPlan && !['closed', 'cancelled'].includes(selectedInboundPlan.status),
  )

  async function loadAssignableUsersForApproval() {
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers('warehouse:inbound_order:approve')
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.reviewerLoadFailed'))
    } finally {
      setAssignableUsersLoaded(true)
      setLoadingAssignableUsers(false)
    }
  }

  useEffect(() => {
    if (!inboundOrderModalOpen || assignableUsersLoaded || loadingAssignableUsers) return
    void loadAssignableUsersForApproval()
  }, [inboundOrderModalOpen, assignableUsersLoaded, loadingAssignableUsers])

  useEffect(() => {
    if (!selectedOrder) return
    setForm(inboundOrderToForm(selectedOrder))
    setApprovalForm({
      reviewer_id: selectedOrder.reviewer_id ?? '',
      reviewer_name: selectedOrder.reviewer_name ?? '',
      approved_at: selectedOrder.approved_at ?? selectedOrder.inbound_at,
    })
  }, [selectedOrder?.id, selectedOrder?.status])

  useEffect(() => {
    if (selectedOrder) return
    const firstPlan = inboundPlans[0]
    if (!firstPlan) return
    setForm((current) => inboundOrderFormForPlan(firstPlan, current))
  }, [inboundPlans, selectedOrder])

  function applyReviewer(userId: string) {
    const user = assignableUsers.find((item) => item.id === userId)
    setApprovalForm((current) => ({
      ...current,
      reviewer_id: user?.id ?? '',
      reviewer_name: user?.display_name ?? '',
    }))
  }

  function handleInboundOrderPlanChange(planId: string) {
    const plan = inboundPlans.find((item) => item.id === planId)
    setForm((current) => (plan ? inboundOrderFormForPlan(plan, current) : { ...current, plan_id: planId }))
  }

  function handleInboundWarehouseChange(warehouseId: string) {
    const warehouse = inboundWarehouseOption(warehouseId)
    setForm((current) => ({
      ...current,
      warehouse_id: warehouse.value,
      warehouse_name: warehouse.label,
    }))
  }

  function openInboundOrderModal() {
    setForm(
      selectedOrder
        ? inboundOrderToForm(selectedOrder)
        : inboundPlans[0]
          ? inboundOrderFormForPlan(inboundPlans[0], initialInboundOrderForm())
          : initialInboundOrderForm(),
    )
    setApprovalForm(
      selectedOrder
        ? {
            reviewer_id: selectedOrder.reviewer_id ?? '',
            reviewer_name: selectedOrder.reviewer_name ?? '',
            approved_at: selectedOrder.approved_at ?? selectedOrder.inbound_at,
          }
        : initialInboundOrderApprovalForm(),
    )
    setInboundOrderModalOpen(true)
  }

  function closeInboundOrderModal() {
    setInboundOrderModalOpen(false)
  }

  async function generateInboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGenerateSubmitting(true)
    setMessage('')
    try {
      const order = await generateInboundOrderFromPlan(inboundOrderPayload(form))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setInboundOrderModalOpen(false)
      await onGenerated(order, inventoryQuery)
      setMessage(t('warehouse.inboundOrder.message.generated', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.generateFailed'))
    } finally {
      setGenerateSubmitting(false)
    }
  }

  async function submitSelectedInboundOrder() {
    if (!selectedOrder) return
    if (!approvalForm.reviewer_id) {
      showError(new Error(t('warehouse.inboundOrder.validation.reviewerRequired')))
      return
    }
    setSubmitSubmitting(true)
    setMessage('')
    try {
      const order = await submitInboundOrder(selectedOrder.id, {
        reviewer_id: approvalForm.reviewer_id,
      })
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      await onSubmitted(order, inventoryQuery)
      setMessage(t('warehouse.inboundOrder.message.submitted', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.submitFailed'))
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

  async function cancelSelectedInboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    const reason = cancelReason.trim()
    if (!reason) {
      setCancelReasonError(t('warehouse.inboundOrder.validation.cancelReasonRequired'))
      return
    }
    setCancelSubmitting(true)
    setMessage('')
    try {
      const order = await cancelInboundOrder(selectedOrder.id, { reason })
      setCancelModalOpen(false)
      await onSaved(order)
      setMessage(t('warehouse.inboundOrder.message.cancelled', { code: order.code }))
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.cancelFailed'))
    } finally {
      setCancelSubmitting(false)
    }
  }

  async function approveSelectedInboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    if (selectedOrder.status !== 'submitted') return
    if (selectedOrder.reviewer_id !== currentUser.id) {
      showError(
        new Error(
          t('warehouse.inboundOrder.validation.reviewerMismatch', {
            name: selectedOrder.reviewer_name ?? t('warehouse.inboundOrder.detail.reviewerFallback'),
          }),
        ),
      )
      return
    }
    setApproveSubmitting(true)
    setMessage('')
    try {
      const order = await approveInboundOrder(selectedOrder.id, inboundOrderApprovePayload(approvalForm))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setInboundOrderModalOpen(false)
      await onApproved(order, inventoryQuery)
      setMessage(
        order.inbound_mode === 'formal'
          ? t('warehouse.inboundOrder.message.approvedFormal', { code: order.code })
          : t('warehouse.inboundOrder.message.approvedInspection', { code: order.code }),
      )
    } catch (caught) {
      showError(caught, t('warehouse.inboundOrder.message.approveFailed'))
    } finally {
      setApproveSubmitting(false)
    }
  }

  return {
    form,
    setForm,
    approvalForm,
    setApprovalForm,
    assignableUsers,
    loadingAssignableUsers,
    inboundOrderModalOpen,
    generateSubmitting,
    submitSubmitting,
    approveSubmitting,
    cancelSubmitting,
    message,
    cancelModalOpen,
    cancelReason,
    cancelReasonError,
    canGenerateFromSelectedPlan,
    openInboundOrderModal,
    closeInboundOrderModal,
    handleInboundOrderPlanChange,
    handleInboundWarehouseChange,
    applyReviewer,
    generateInboundOrder,
    submitSelectedInboundOrder,
    openCancelModal,
    closeCancelModal,
    changeCancelReason,
    cancelSelectedInboundOrder,
    approveSelectedInboundOrder,
  }
}
