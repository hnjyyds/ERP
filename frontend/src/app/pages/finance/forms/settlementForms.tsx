// 结算、利润与报表：表单状态、payload 映射、状态标签

import { Tag } from 'antd'
import type { ReactNode } from 'react'
import type {
  FinancialSettlementCreatePayload,
  ManualProfitCostCreatePayload,
} from '@/api'
import { translate } from '@/locales'
import { emptyToNull, getRuntimeSettings, todayInputValue } from '@/app/pages/appHelpers'
import {
  profitCostTypeOptions,
  reportingDocumentTypeOptions,
  reportingStatusOptions,
  settlementStatusOptions,
} from '@/shared/formOptions'

import { optionLabel } from './labels'

export type FinancialSettlementFormState = {
  settlement_no: string
  shipment_plan_id: string
  shipment_no: string
  settlement_date: string
  remark: string
}

export type ManualProfitCostFormState = {
  cost_no: string
  cost_type: string
  cost_date: string
  amount: string
  currency: string
  source_no: string
  reason: string
  remark: string
}

export function initialFinancialSettlementForm(): FinancialSettlementFormState {
  return {
    settlement_no: '',
    shipment_plan_id: '',
    shipment_no: '',
    settlement_date: todayInputValue(),
    remark: '',
  }
}

export function initialManualProfitCostForm(
  currency = 'USD',
  settlementDate = todayInputValue(),
): ManualProfitCostFormState {
  return {
    cost_no: '',
    cost_type: 'other_cost',
    cost_date: settlementDate,
    amount: '',
    currency,
    source_no: '',
    reason: '',
    remark: '',
  }
}

export function financialSettlementPayload(
  form: FinancialSettlementFormState,
): FinancialSettlementCreatePayload {
  return {
    shipment_plan_id: form.shipment_plan_id.trim(),
    shipment_no: emptyToNull(form.shipment_no),
    settlement_date: form.settlement_date,
    remark: emptyToNull(form.remark),
  }
}

export function manualProfitCostPayload(
  form: ManualProfitCostFormState,
): ManualProfitCostCreatePayload {
  return {
    cost_type: form.cost_type,
    cost_date: form.cost_date,
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    source_no: emptyToNull(form.source_no),
    reason: form.reason.trim(),
    remark: emptyToNull(form.remark),
  }
}

export function settlementStatusLabel(value: string): string {
  return optionLabel(settlementStatusOptions, value)
}

export function settlementStatusTag(value: string): ReactNode {
  const color = value === 'locked' ? 'success' : 'default'
  return <Tag color={color}>{settlementStatusLabel(value)}</Tag>
}

export function approvalDocumentTypeLabel(value: string): string {
  return optionLabel(reportingDocumentTypeOptions, value)
}

export function approvalDocumentTypeTag(value: string): ReactNode {
  const color = value === 'export_contract' ? 'processing' : 'purple'
  return <Tag color={color}>{approvalDocumentTypeLabel(value)}</Tag>
}

export function approvalStatusTag(value: string): ReactNode {
  const color = value === 'approved' ? 'success' : value === 'submitted' ? 'warning' : 'default'
  const label = optionLabel(reportingStatusOptions, value)
  return <Tag color={color}>{label}</Tag>
}

export function sourcePathTag(value: string): ReactNode {
  return <Tag color="default">{value}</Tag>
}

export function profitCostTypeLabel(value: string): string {
  return optionLabel(profitCostTypeOptions, value)
}

export function profitCostDirectionTag(value: string): ReactNode {
  const label = translate(
    getRuntimeSettings().language,
    value === 'income' ? 'finance.report.direction.income' : 'finance.report.direction.cost',
  )
  const color = value === 'income' ? 'success' : 'warning'
  return <Tag color={color}>{label}</Tag>
}
