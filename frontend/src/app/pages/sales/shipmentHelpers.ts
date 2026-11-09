import type {
  ShipmentApprovePayload,
  ShipmentPlanGeneratePayload,
  ShipmentRejectPayload,
} from '@/api'
import { emptyToNull, todayInputValue } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { freightMethodOptions, shipmentStatusOptions } from '@/shared/formOptions'

export type ShipmentFormState = {
  code: string
  shipment_date: string
  planned_ship_date: string
  shipping_method: string
  contract_id_a: string
  contract_quantity_a: string
  contract_id_b: string
  contract_quantity_b: string
  port_of_loading: string
  port_of_destination: string
  vessel_name: string
  container_no: string
  booking_no: string
  document_owner_name: string
  estimated_payable_amount: string
  remarks: string
}

export type ShipmentApproveFormState = {
  reviewer_name: string
  approved_at: string
}

export type ShipmentRejectFormState = {
  rejected_at: string
  rejection_reason: string
}

export function initialShipmentForm(): ShipmentFormState {
  return {
    code: '',
    shipment_date: todayInputValue(),
    planned_ship_date: todayInputValue(),
    shipping_method: 'sea',
    contract_id_a: '',
    contract_quantity_a: '',
    contract_id_b: '',
    contract_quantity_b: '',
    port_of_loading: 'Ningbo',
    port_of_destination: '',
    vessel_name: '',
    container_no: '',
    booking_no: '',
    document_owner_name: '',
    estimated_payable_amount: '0.00',
    remarks: '',
  }
}

export function initialShipmentApproveForm(): ShipmentApproveFormState {
  return {
    reviewer_name: '',
    approved_at: todayInputValue(),
  }
}

export function initialShipmentRejectForm(): ShipmentRejectFormState {
  return {
    rejected_at: todayInputValue(),
    rejection_reason: '',
  }
}

export function shipmentGeneratePayload(form: ShipmentFormState): ShipmentPlanGeneratePayload {
  const selections = [
    {
      contract_id: form.contract_id_a.trim(),
      quantity: emptyToNull(form.contract_quantity_a),
    },
  ]
  if (form.contract_id_b.trim()) {
    selections.push({
      contract_id: form.contract_id_b.trim(),
      quantity: emptyToNull(form.contract_quantity_b),
    })
  }

  return {
    shipment_date: form.shipment_date,
    planned_ship_date: form.planned_ship_date,
    shipping_method: form.shipping_method,
    port_of_loading: form.port_of_loading.trim(),
    port_of_destination: form.port_of_destination.trim(),
    vessel_name: emptyToNull(form.vessel_name),
    container_no: emptyToNull(form.container_no),
    booking_no: emptyToNull(form.booking_no),
    document_owner_name: emptyToNull(form.document_owner_name),
    estimated_payable_amount: form.estimated_payable_amount || '0',
    remarks: emptyToNull(form.remarks),
    selections,
  }
}

export function shipmentApprovePayload(form: ShipmentApproveFormState): ShipmentApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

export function shipmentRejectPayload(form: ShipmentRejectFormState): ShipmentRejectPayload {
  return {
    rejected_at: form.rejected_at,
    rejection_reason: form.rejection_reason.trim(),
  }
}

export function shipmentStatusLabel(value: string): string {
  const option = shipmentStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function freightMethodLabel(value: string): string {
  const option = freightMethodOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function contractProgressStatusLabel(value: string): string {
  if (value === 'completed') return t('sales.contract.progress.completed')
  if (value === 'partial') return t('sales.contract.progress.partial')
  if (value === 'pending') return t('sales.contract.progress.pending')
  return value
}

export function reminderStatusLabel(value: string): string {
  if (value === 'pending') return t('sales.shipment.detail.reminderPending')
  if (value === 'done') return t('sales.shipment.detail.reminderDone')
  if (value === 'overdue') return t('sales.shipment.detail.reminderOverdue')
  return value
}

export function formatPercent(value?: string | null): string {
  if (!value) return '0.00%'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return `${value}%`
  return `${numeric.toFixed(2)}%`
}
