import type {
  AssignableUser,
  InboundOrder,
  InboundOrderApprovePayload,
  InboundOrderGeneratePayload,
  InboundPlan,
} from '@/api'
import { inboundOrderModeOptions, inboundOrderStatusOptions, inboundPlanStatusOptions } from '@/shared/formOptions'
import { t } from '@/app/appI18n'
import { todayInputValue } from '@/app/pages/appHelpers'

export function inboundPlanStatusLabel(value: string): string {
  const option = inboundPlanStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function inboundPlanOptionSearchText(plan: InboundPlan): string {
  return [plan.purchase_contract_no, plan.supplier_name, plan.code, inboundPlanStatusLabel(plan.status)]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase()
}

export type InboundOrderFormState = {
  plan_id: string
  inbound_mode: string
  inbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

export const inboundWarehouseOptions = [
  {
    value: 'wh-factory',
    label: '工厂',
    labelKey: 'warehouse.inboundOrder.warehouseOption.factory',
  },
  {
    value: 'wh-company',
    label: '公司仓库',
    labelKey: 'warehouse.inboundOrder.warehouseOption.company',
  },
] as const

export function inboundWarehouseOption(warehouseId?: string | null, warehouseName?: string | null) {
  return warehouseId === 'wh-factory' || warehouseName?.includes('工厂')
    ? inboundWarehouseOptions[0]
    : inboundWarehouseOptions[1]
}

export type InboundOrderApprovalFormState = {
  reviewer_id: string
  reviewer_name: string
  approved_at: string
}

export const emptyInboundOrderStatusSummary = {
  draft_count: 0,
  submitted_count: 0,
  approved_count: 0,
}

export function initialInventorySummary() {
  return {
    available_quantity: '0',
    pending_inspection_quantity: '0',
  }
}

export function initialInboundOrderForm(): InboundOrderFormState {
  return {
    plan_id: '',
    inbound_mode: 'formal',
    inbound_at: todayInputValue(),
    warehouse_id: 'wh-company',
    warehouse_name: '公司仓库',
    location_id: '',
    location_name: '',
    operator_name: '',
  }
}

export function locationIdFromName(locationName: string): string {
  const trimmed = locationName.trim()
  return trimmed ? `loc-${trimmed}`.slice(0, 36) : ''
}

/** 库位名称变化时同步生成内部标识，用户不需要填写库位 ID。 */
export function applyLocationName(
  form: InboundOrderFormState,
  locationName: string,
): InboundOrderFormState {
  return {
    ...form,
    location_name: locationName,
    location_id: locationIdFromName(locationName),
  }
}

export function initialInboundOrderApprovalForm(): InboundOrderApprovalFormState {
  return {
    reviewer_id: '',
    reviewer_name: '',
    approved_at: todayInputValue(),
  }
}

export function assignableUserOptionLabel(user: AssignableUser): string {
  return [user.display_name, user.username, user.department_name].filter(Boolean).join(' / ')
}

export function inboundOrderFormForPlan(
  plan: InboundPlan,
  current: InboundOrderFormState,
): InboundOrderFormState {
  const warehouse = inboundWarehouseOption(plan.warehouse_id, plan.warehouse_name)
  return {
    ...current,
    plan_id: plan.id,
    inbound_at: plan.planned_date,
    warehouse_id: warehouse.value,
    warehouse_name: warehouse.label,
    location_id: plan.location_id ?? locationIdFromName(plan.location_name ?? ''),
    location_name: plan.location_name ?? '',
    operator_name: plan.operator_name ?? '',
  }
}

export function inboundOrderToForm(order: InboundOrder): InboundOrderFormState {
  const warehouse = inboundWarehouseOption(order.warehouse_id, order.warehouse_name)
  return {
    plan_id: order.plan_id,
    inbound_mode: order.inbound_mode,
    inbound_at: order.inbound_at,
    warehouse_id: warehouse.value,
    warehouse_name: warehouse.label,
    location_id: order.location_id,
    location_name: order.location_name,
    operator_name: order.operator_name,
  }
}

export function inboundOrderPayload(form: InboundOrderFormState): InboundOrderGeneratePayload {
  return {
    plan_id: form.plan_id.trim(),
    inbound_mode: form.inbound_mode,
    inbound_at: form.inbound_at,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    // 库位 ID 由名称派生，表单不向用户暴露。
    operator_name: form.operator_name.trim(),
    lines: [],
  }
}

export function inboundOrderApprovePayload(
  form: InboundOrderApprovalFormState,
): InboundOrderApprovePayload {
  return {
    approved_at: form.approved_at,
  }
}

export function inboundOrderModeLabel(value: string): string {
  const option = inboundOrderModeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function inboundOrderStatusLabel(value: string): string {
  const option = inboundOrderStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function stockStatusLabel(value: string): string {
  if (value === 'available') return t('warehouse.inboundOrder.detail.stockStatusAvailable')
  if (value === 'pending_inspection')
    return t('warehouse.inboundOrder.detail.stockStatusPendingInspection')
  return value
}

export function inventoryDirectionLabel(value: string): string {
  if (value === 'in') return t('warehouse.inboundOrder.detail.directionIn')
  if (value === 'out') return t('warehouse.inboundOrder.detail.directionOut')
  return value
}
