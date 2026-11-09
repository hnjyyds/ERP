import type { AppTimeZone, CurrentUser, TodoTask } from '@/api'
import {
  dashboardPath,
  exportContractPath,
  exportQuotationPath,
  financeDetailPath,
  followupPath,
  moduleDetailPath,
  moduleNestedDetailPath,
  myQualityTasksPath,
  purchaseContractPath,
  reportingPath,
  sampleDeliveryPath,
  shipmentPath,
  warehouseInboundOrderPath,
  warehouseOutboundOrderPath,
} from '@/app/routes'
import { t } from '@/app/appI18n'
import { getRuntimeSettings, parseApiDate, type AppSettings } from '@/app/pages/appHelpers'

export type DashboardScheduleFormState = {
  title: string
  description: string
  starts_at: string
  ends_at: string
}

export type DashboardAnnouncementFormState = {
  title: string
  content: string
}

export type DashboardTodoFormState = {
  title: string
  content: string
  assignee_user_ids: string[]
}

function timeZoneOffsetMinutes(timeZone: AppTimeZone) {
  return timeZone === 'Asia/Shanghai' ? 8 * 60 : 0
}

function dateTimeLocalValue(date: Date, settings: AppSettings = getRuntimeSettings()) {
  const zoned = new Date(date.getTime() + timeZoneOffsetMinutes(settings.timeZone) * 60_000)
  return zoned.toISOString().slice(0, 16)
}

export function parseDateTimeLocal(value: string, settings: AppSettings = getRuntimeSettings()) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  const utcMs =
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) -
    timeZoneOffsetMinutes(settings.timeZone) * 60_000
  return new Date(utcMs)
}

export function dateTimeLocalToIso(value: string, settings: AppSettings = getRuntimeSettings()) {
  return parseDateTimeLocal(value, settings)?.toISOString() ?? ''
}

export function initialDashboardScheduleForm(): DashboardScheduleFormState {
  const startsAt = new Date()
  startsAt.setMinutes(0, 0, 0)
  startsAt.setHours(startsAt.getHours() + 1)
  const endsAt = new Date(startsAt)
  endsAt.setHours(endsAt.getHours() + 1)
  return {
    title: '',
    description: '',
    starts_at: dateTimeLocalValue(startsAt),
    ends_at: dateTimeLocalValue(endsAt),
  }
}

export function initialDashboardAnnouncementForm(): DashboardAnnouncementFormState {
  return { title: '', content: '' }
}

export function initialDashboardTodoForm(currentUser?: CurrentUser): DashboardTodoFormState {
  return {
    title: '',
    content: '',
    assignee_user_ids: currentUser ? [currentUser.id] : [],
  }
}

export function todoTargetPath(todo: TodoTask) {
  if (todo.source_type === 'followup') return followupPath
  if (todo.source_type === 'followup_plan' && todo.source_id) {
    return moduleNestedDetailPath(followupPath, todo.source_id, todo.id)
  }
  if (todo.source_type === 'approval') return reportingPath
  if (todo.source_type === 'quality_inspection') return myQualityTasksPath
  if (todo.source_type === 'warehouse_inbound_approval' && todo.source_id) {
    return moduleDetailPath(warehouseInboundOrderPath, todo.source_id)
  }
  const modulePaths: Record<string, string> = {
    sample_delivery_approval: sampleDeliveryPath,
    sales_quotation_approval: exportQuotationPath,
    sales_contract_approval: exportContractPath,
    purchase_contract_approval: purchaseContractPath,
    sales_shipment_approval: shipmentPath,
    warehouse_outbound_approval: warehouseOutboundOrderPath,
  }
  if (todo.source_id && modulePaths[todo.source_type]) {
    return moduleDetailPath(modulePaths[todo.source_type], todo.source_id)
  }
  const financeModules = {
    finance_payment_approval: 'payments',
    finance_fee_payment_approval: 'fees',
    finance_reimbursement_approval: 'reimbursements',
  } as const
  const financeModule = financeModules[todo.source_type as keyof typeof financeModules]
  if (todo.source_id && financeModule) {
    const requestId =
      todo.source_type === 'finance_payment_approval' ||
      todo.source_type === 'finance_fee_payment_approval'
        ? todo.id
        : undefined
    return financeDetailPath(financeModule, todo.source_id, requestId)
  }
  return dashboardPath
}

export function todoSourceLabel(value: string) {
  const labels: Record<string, string> = {
    approval: t('todo.approval'),
    followup: t('todo.followup'),
    followup_plan: t('todo.followup'),
    manual: t('todo.manual'),
    quality_inspection: t('dashboard.source.qualityInspection'),
    system: t('todo.system'),
    warehouse_inbound_approval: t('dashboard.source.warehouseInboundApproval'),
    sample_delivery_approval: t('dashboard.source.sampleDeliveryApproval'),
    sales_quotation_approval: t('dashboard.source.salesQuotationApproval'),
    sales_contract_approval: t('dashboard.source.salesContractApproval'),
    purchase_contract_approval: t('dashboard.source.purchaseContractApproval'),
    sales_shipment_approval: t('dashboard.source.salesShipmentApproval'),
    warehouse_outbound_approval: t('dashboard.source.warehouseOutboundApproval'),
    finance_payment_approval: t('dashboard.source.financePaymentApproval'),
    finance_fee_payment_approval: t('dashboard.source.financeFeePaymentApproval'),
    finance_reimbursement_approval: t('dashboard.source.financeReimbursementApproval'),
  }
  return labels[value] ?? value
}

export type TodoScope = 'assigned' | 'self'
export type TodoDueState = 'all' | 'overdue' | 'today' | 'upcoming' | 'none'

function dateKey(date: Date, settings: AppSettings = getRuntimeSettings()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: settings.timeZone,
    year: 'numeric',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${map.year}-${map.month}-${map.day}`
}

export function todoDueState(value: string | null): Exclude<TodoDueState, 'all'> {
  const dueDate = parseApiDate(value)
  if (!dueDate) return 'none'
  const dueDateKey = dateKey(dueDate)
  const todayKey = dateKey(new Date())
  if (dueDateKey < todayKey) return 'overdue'
  if (dueDateKey === todayKey) return 'today'
  return 'upcoming'
}

export function todoDueStateLabel(state: Exclude<TodoDueState, 'all'>) {
  const labels = {
    none: t('dashboard.noDeadline'),
    overdue: t('dashboard.overdue'),
    today: t('dashboard.dueToday'),
    upcoming: t('dashboard.upcoming'),
  }
  return labels[state]
}

export function todoDueSortValue(todo: TodoTask) {
  const state = todoDueState(todo.due_at)
  const rank = { overdue: 0, today: 1, upcoming: 2, none: 3 }[state]
  return [rank, parseApiDate(todo.due_at)?.getTime() ?? Number.MAX_SAFE_INTEGER] as const
}

export function sortTodosByUrgency(todos: TodoTask[]) {
  return todos
    .map((todo, index) => ({ index, todo, sortValue: todoDueSortValue(todo) }))
    .sort((left, right) => {
      const rankDiff = left.sortValue[0] - right.sortValue[0]
      if (rankDiff) return rankDiff
      const dueDiff = left.sortValue[1] - right.sortValue[1]
      return dueDiff || left.index - right.index
    })
    .map(({ todo }) => todo)
}

type CountdownSegment = {
  value: string
  unit: string
}

function formatCountdownSegments(diffMs: number): CountdownSegment[] {
  const totalSeconds = Math.max(0, Math.ceil(diffMs / 1000))
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => value.toString().padStart(2, '0')

  if (days > 0) {
    return [
      { value: days.toString(), unit: t('dashboard.daysShort') },
      { value: pad(hours), unit: t('dashboard.hoursShort') },
      { value: pad(minutes), unit: t('dashboard.minutesShort') },
      { value: pad(seconds), unit: t('dashboard.secondsShort') },
    ]
  }

  if (hours > 0) {
    return [
      { value: hours.toString(), unit: t('dashboard.hoursShort') },
      { value: pad(minutes), unit: t('dashboard.minutesShort') },
      { value: pad(seconds), unit: t('dashboard.secondsShort') },
    ]
  }

  return [
    { value: minutes.toString(), unit: t('dashboard.minutesShort') },
    { value: pad(seconds), unit: t('dashboard.secondsShort') },
  ]
}

export function scheduleCountdownLabel(
  startsAt: string | null,
  endsAt: string | null,
  nowMs: number,
) {
  const startMs = parseApiDate(startsAt)?.getTime() ?? Number.NaN
  const endMs = parseApiDate(endsAt)?.getTime() ?? Number.NaN

  if (Number.isNaN(startMs)) return { label: t('dashboard.pendingConfirm'), tone: 'muted' }
  if (nowMs < startMs) {
    return {
      segments: formatCountdownSegments(startMs - nowMs),
      tone: startMs - nowMs <= 24 * 60 * 60 * 1000 ? 'soon' : 'upcoming',
    }
  }
  if (!Number.isNaN(endMs) && nowMs <= endMs) return { label: t('dashboard.inProgress'), tone: 'active' }
  return { label: t('dashboard.ended'), tone: 'done' }
}
