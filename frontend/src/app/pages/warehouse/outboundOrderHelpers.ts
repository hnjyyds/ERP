import type {
  OutboundOrder,
  OutboundOrderApprovePayload,
  OutboundOrderGeneratePayload,
  OutboundPlan,
} from '@/api'
import {
  outboundOrderModeOptions,
  outboundOrderStatusOptions,
  outboundPlanSourceTypeOptions,
  outboundPlanStatusOptions,
  outboundPlanTypeOptions,
} from '@/shared/formOptions'
import { t } from '@/app/appI18n'
import { todayInputValue } from '@/app/pages/appHelpers'

export function outboundPlanStatusLabel(value: string): string {
  const option = outboundPlanStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function outboundPlanTypeLabel(value: string): string {
  const option = outboundPlanTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function outboundPlanSourceTypeLabel(value: string): string {
  const option = outboundPlanSourceTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function stockStatusLabel(value: string): string {
  if (value === 'available') return t('warehouse.outboundOrder.detail.stockStatusAvailable')
  if (value === 'pending_inspection')
    return t('warehouse.outboundOrder.detail.stockStatusPendingInspection')
  return value
}

export function inventoryDirectionLabel(value: string): string {
  if (value === 'in') return t('warehouse.outboundOrder.detail.directionIn')
  if (value === 'out') return t('warehouse.outboundOrder.detail.directionOut')
  return value
}

export function outboundOrderModeLabel(value: string): string {
  const option = outboundOrderModeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function outboundOrderStatusLabel(value: string): string {
  const option = outboundOrderStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function outboundOrderTotalQuantity(order: OutboundOrder): number {
  return order.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
}

export type OutboundOrderFormState = {
  plan_id: string
  outbound_mode: string
  outbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  exception_reason: string
}

export type OutboundOrderApprovalFormState = {
  reviewer_name: string
  approved_at: string
  allow_negative: boolean
}

export function initialOutboundOrderForm(): OutboundOrderFormState {
  return {
    plan_id: '',
    outbound_mode: 'formal',
    outbound_at: todayInputValue(),
    warehouse_id: 'wh-ningbo',
    warehouse_name: '',
    location_id: 'loc-fg-01',
    location_name: '',
    operator_name: '',
    exception_reason: '',
  }
}

export function initialOutboundOrderApprovalForm(): OutboundOrderApprovalFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
    allow_negative: false,
  }
}

export function outboundOrderFormForPlan(
  plan: OutboundPlan,
  current: OutboundOrderFormState,
): OutboundOrderFormState {
  return {
    ...current,
    plan_id: plan.id,
    outbound_at: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? 'wh-ningbo',
    warehouse_name: plan.warehouse_name ?? '',
    location_id: plan.location_id ?? 'loc-fg-01',
    location_name: plan.location_name ?? '',
    operator_name: plan.operator_name ?? '',
  }
}

export function outboundOrderToForm(order: OutboundOrder): OutboundOrderFormState {
  return {
    plan_id: order.plan_id,
    outbound_mode: order.outbound_mode,
    outbound_at: order.outbound_at,
    warehouse_id: order.warehouse_id,
    warehouse_name: order.warehouse_name,
    location_id: order.location_id,
    location_name: order.location_name,
    operator_name: order.operator_name,
    exception_reason: order.exception_reason ?? '',
  }
}

export function outboundOrderPayload(form: OutboundOrderFormState): OutboundOrderGeneratePayload {
  return {
    plan_id: form.plan_id.trim(),
    outbound_mode: form.outbound_mode,
    outbound_at: form.outbound_at,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    operator_name: form.operator_name.trim(),
    exception_reason: form.exception_reason.trim() || null,
    lines: [],
  }
}

export function outboundOrderApprovePayload(
  form: OutboundOrderApprovalFormState,
): OutboundOrderApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
    allow_negative: form.allow_negative,
  }
}
