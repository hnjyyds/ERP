import {
  followupNodeLabelKeys,
  followupSourceTypeOptions,
  followupStatusOptions,
} from '@/shared/formOptions'
import {
  moduleDetailPath,
  purchaseContractPath,
  qualityInspectionPath,
  warehouseInboundOrderPath,
  warehouseOutboundOrderPath,
} from '@/app/routes'
import { emptyToNull, todayInputValue } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type {
  FollowProcessTemplate,
  FollowProcessTemplateNodePayload,
  FollowProcessTemplatePayload,
  FollowSourceEventPayload,
  PurchaseFollowNode,
  PurchaseFollowPlan,
  PurchaseFollowPlanGeneratePayload,
} from '@/api'

export function followupNodeLabel(value: string, fallback = value): string {
  const key = followupNodeLabelKeys[value]
  return key ? t(key) : fallback
}

export function followupSourceTypeLabel(value: string | null): string {
  if (!value) return t('purchase.followup.detail.notWritten')
  if (value === 'purchase_contract') return t('purchase.followup.field.purchaseContract')
  const option = followupSourceTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export type FollowupTemplateFormState = {
  name: string
  enabled: boolean
  is_default: boolean
  contract_days: string
  contract_remind: string
  confirm_days: string
  confirm_remind: string
  bulk_days: string
  bulk_remind: string
  qc_days: string
  qc_remind: string
  inbound_days: string
  inbound_remind: string
  outbound_days: string
  outbound_remind: string
}

export type FollowupPlanFormState = {
  purchase_contract_id: string
  as_of: string
}

export type FollowupSourceEventFormState = {
  purchase_contract_id: string
  node_code: string
  source_record_type: string
  source_record_id: string
  actual_date: string
  source_summary: string
}

export function initialFollowupTemplateForm(): FollowupTemplateFormState {
  return {
    name: '',
    enabled: true,
    is_default: true,
    contract_days: '0',
    contract_remind: '0',
    confirm_days: '3',
    confirm_remind: '1',
    bulk_days: '7',
    bulk_remind: '2',
    qc_days: '14',
    qc_remind: '2',
    inbound_days: '20',
    inbound_remind: '3',
    outbound_days: '25',
    outbound_remind: '3',
  }
}

export function initialFollowupPlanForm(): FollowupPlanFormState {
  return {
    purchase_contract_id: '',
    as_of: todayInputValue(),
  }
}

export function initialFollowupSourceEventForm(): FollowupSourceEventFormState {
  return {
    purchase_contract_id: '',
    node_code: 'quality_inspection',
    source_record_type: 'quality_inspection',
    source_record_id: '',
    actual_date: todayInputValue(),
    source_summary: '',
  }
}

export function initialNodeCompletionForm(): FollowupSourceEventFormState {
  return {
    purchase_contract_id: '',
    node_code: '',
    source_record_type: 'sample_followup_event',
    source_record_id: '',
    actual_date: todayInputValue(),
    source_summary: '',
  }
}

export function followupTemplateToForm(
  template: FollowProcessTemplate | null,
): FollowupTemplateFormState {
  const form = initialFollowupTemplateForm()
  if (!template) return form
  const nodeByCode = new Map(template.nodes.map((node) => [node.node_code, node]))
  const contractNode = nodeByCode.get('contract_confirmed')
  const confirmNode = nodeByCode.get('confirm_sample_submitted')
  const bulkNode = nodeByCode.get('bulk_sample_submitted')
  const qcNode = nodeByCode.get('quality_inspection')
  const inboundNode = nodeByCode.get('inbound_completed')
  const outboundNode = nodeByCode.get('outbound_completed')

  return {
    name: template.name,
    enabled: template.enabled,
    is_default: template.is_default,
    contract_days: String(contractNode?.standard_days ?? form.contract_days),
    contract_remind: String(contractNode?.remind_before_days ?? form.contract_remind),
    confirm_days: String(confirmNode?.standard_days ?? form.confirm_days),
    confirm_remind: String(confirmNode?.remind_before_days ?? form.confirm_remind),
    bulk_days: String(bulkNode?.standard_days ?? form.bulk_days),
    bulk_remind: String(bulkNode?.remind_before_days ?? form.bulk_remind),
    qc_days: String(qcNode?.standard_days ?? form.qc_days),
    qc_remind: String(qcNode?.remind_before_days ?? form.qc_remind),
    inbound_days: String(inboundNode?.standard_days ?? form.inbound_days),
    inbound_remind: String(inboundNode?.remind_before_days ?? form.inbound_remind),
    outbound_days: String(outboundNode?.standard_days ?? form.outbound_days),
    outbound_remind: String(outboundNode?.remind_before_days ?? form.outbound_remind),
  }
}

export function followupSourceEventFormForPlan(
  plan: PurchaseFollowPlan,
  current: FollowupSourceEventFormState,
): FollowupSourceEventFormState {
  const firstPending = plan.nodes.find((node) => node.status !== 'completed')
  if (!firstPending) {
    return {
      ...current,
      purchase_contract_id: plan.purchase_contract_id,
    }
  }
  return {
    purchase_contract_id: plan.purchase_contract_id,
    node_code: firstPending.node_code,
    source_record_type: followupSourceTypeForNode(firstPending.node_code),
    source_record_id: `${firstPending.node_code}-source`,
    actual_date: firstPending.planned_date,
    source_summary: t('purchase.followup.message.summaryCompleted', {
      name: followupNodeLabel(firstPending.node_code, firstPending.node_name),
    }),
  }
}

export function followupTemplatePayload(
  form: FollowupTemplateFormState,
): FollowProcessTemplatePayload {
  return {
    name: form.name.trim(),
    enabled: form.enabled,
    is_default: form.is_default,
    nodes: [
      followupNodePayload(
        'contract_confirmed',
        followupNodeLabel('contract_confirmed'),
        10,
        'purchase_contract',
        form.contract_days,
        form.contract_remind,
      ),
      followupNodePayload(
        'confirm_sample_submitted',
        followupNodeLabel('confirm_sample_submitted'),
        20,
        'sample_confirm',
        form.confirm_days,
        form.confirm_remind,
      ),
      followupNodePayload(
        'bulk_sample_submitted',
        followupNodeLabel('bulk_sample_submitted'),
        30,
        'sample_bulk',
        form.bulk_days,
        form.bulk_remind,
      ),
      followupNodePayload(
        'quality_inspection',
        followupNodeLabel('quality_inspection'),
        40,
        'qc',
        form.qc_days,
        form.qc_remind,
      ),
      followupNodePayload(
        'inbound_completed',
        followupNodeLabel('inbound_completed'),
        50,
        'inbound',
        form.inbound_days,
        form.inbound_remind,
      ),
      followupNodePayload(
        'outbound_completed',
        followupNodeLabel('outbound_completed'),
        60,
        'outbound',
        form.outbound_days,
        form.outbound_remind,
      ),
    ],
  }
}

function followupNodePayload(
  node_code: string,
  node_name: string,
  sequence_no: number,
  actual_date_source: string,
  standardDays: string,
  remindBeforeDays: string,
): FollowProcessTemplateNodePayload {
  return {
    node_code,
    node_name,
    sequence_no,
    standard_days: Number(standardDays),
    remind_before_days: Number(remindBeforeDays),
    actual_date_source,
  }
}

export function followupPlanGeneratePayload(
  form: FollowupPlanFormState,
): PurchaseFollowPlanGeneratePayload {
  return {
    purchase_contract_id: form.purchase_contract_id.trim(),
    as_of: emptyToNull(form.as_of),
  }
}

export function followupSourceEventPayload(
  form: FollowupSourceEventFormState,
): FollowSourceEventPayload {
  return {
    purchase_contract_id: form.purchase_contract_id.trim(),
    node_code: form.node_code,
    source_record_type: form.source_record_type,
    source_record_id: form.source_record_id.trim(),
    actual_date: form.actual_date,
    source_summary: form.source_summary.trim(),
  }
}

export function followupPlanStatusLabel(value: string): string {
  const option = followupStatusOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

export function followupNodeStatusLabel(value: string): string {
  if (value === 'pending') return t('purchase.followup.detail.nodeStatusPending')
  if (value === 'in_progress') return t('purchase.followup.status.inProgress')
  if (value === 'completed') return t('purchase.followup.status.completed')
  if (value === 'overdue') return t('purchase.followup.status.overdue')
  return value
}

export function followupSourceTypeForNode(nodeCode: string): string {
  if (nodeCode === 'confirm_sample_submitted' || nodeCode === 'bulk_sample_submitted') {
    return 'sample_followup_event'
  }
  return 'quality_inspection'
}

export function isSampleSubmissionNode(node: PurchaseFollowNode): boolean {
  return (
    node.node_code === 'confirm_sample_submitted' ||
    node.node_code === 'bulk_sample_submitted'
  )
}

export function followupNodeBusinessPath(
  plan: PurchaseFollowPlan,
  node: PurchaseFollowNode,
): string | null {
  if (node.status === 'completed' && node.source_record_id) {
    const completedSourcePaths: Record<string, string> = {
      purchase_contract: purchaseContractPath,
      quality_inspection: qualityInspectionPath,
      inventory_inbound: warehouseInboundOrderPath,
      inventory_outbound: warehouseOutboundOrderPath,
    }
    const rootPath = completedSourcePaths[node.source_record_type ?? '']
    return rootPath ? moduleDetailPath(rootPath, node.source_record_id) : null
  }

  if (node.node_code === 'contract_confirmed') {
    return moduleDetailPath(purchaseContractPath, plan.purchase_contract_id)
  }
  if (node.node_code === 'quality_inspection') return qualityInspectionPath
  if (node.node_code === 'inbound_completed') return warehouseInboundOrderPath
  if (node.node_code === 'outbound_completed') return warehouseOutboundOrderPath
  return null
}

export function followupNodeActionLabel(node: PurchaseFollowNode): string {
  if (node.status === 'completed') return t('purchase.followup.action.viewSource')
  if (isSampleSubmissionNode(node)) return t('purchase.followup.action.registerSubmit')
  if (node.node_code === 'contract_confirmed') return t('purchase.followup.action.viewContract')
  if (node.node_code === 'quality_inspection') return t('purchase.followup.action.enterQc')
  if (node.node_code === 'inbound_completed') return t('purchase.followup.action.enterInbound')
  if (node.node_code === 'outbound_completed') return t('purchase.followup.action.enterOutbound')
  return t('purchase.followup.action.handle')
}
