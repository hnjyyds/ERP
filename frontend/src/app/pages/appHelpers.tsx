import { Tag } from 'antd'
import { LockKeyhole as _LockKeyhole } from 'lucide-react'
import type { ReactNode as _ReactNode } from 'react'
import type { AppLanguage, AppTimeZone, CurrentUser, MenuItem } from '../../api'
import { translate, type TranslationKey } from '../../locales'
import { partnerTypeOptions } from '../../shared/formOptions'
import {
  customerPath,
  detailRootPath,
  documentPartyPath,
  exportContractPath,
  exportQuotationPath,
  financePath,
  financeReceiptsPath as _financeReceiptsPath,
  financePaymentsPath as _financePaymentsPath,
  financeSettlementPath as _financeSettlementPath,
  followupPath,
  isFinancePath,
  organizationUsersPath,
  mcpSettingsPath,
  parseFinanceView,
  partnerPath,
  productPath,
  purchaseContractPath,
  purchaseInquiryPath,
  purchaseInvoiceNoticePath,
  qualityInspectionPath,
  myQualityTasksPath,
  reportingPath,
  sampleDeliveryPath,
  sampleRecordPath,
  sampleRequestPath,
  shipmentPath,
  supplierPath,
  warehouseInboundOrderPath,
  warehouseInboundPlanPath,
  warehouseOutboundOrderPath,
  warehouseOutboundPlanPath,
  type FinanceModule,
} from '../routes'

export const superAdminPermission = 'system:super_admin'

const workflowPageTitleKeyByPath: Record<string, TranslationKey> = {
  [mcpSettingsPath]: 'nav.page.mcpSettings',
  [exportContractPath]: 'nav.page.exportContracts',
  [purchaseContractPath]: 'nav.page.purchaseContracts',
  [qualityInspectionPath]: 'nav.page.qualityInspections',
  [myQualityTasksPath]: 'nav.page.myQualityTasks',
  [followupPath]: 'nav.page.followup',
  [supplierPath]: 'nav.page.suppliers',
  [productPath]: 'nav.page.products',
  [customerPath]: 'nav.page.customers',
  [warehouseInboundOrderPath]: 'nav.page.warehouseInboundOrders',
  [financePath]: 'nav.page.finance',
  [reportingPath]: 'nav.page.reporting',
}

const financePageTitleKeys: Record<FinanceModule, TranslationKey> = {
  home: 'nav.page.finance',
  overview: 'nav.page.financeOverview',
  receipts: 'nav.page.financeReceipts',
  payments: 'nav.page.financePayments',
  fees: 'nav.page.financeFees',
  tax: 'nav.page.financeTax',
  misc: 'nav.page.financeMisc',
  settlement: 'nav.page.financeSettlement',
  reimbursements: 'nav.page.financeReimbursements',
  portData: 'nav.page.financePortData',
  reports: 'nav.page.financeReports',
}

export function canCreateAnnouncement(user: CurrentUser) {
  return user.permissions.includes(superAdminPermission)
}

export function canApproveAssignedRecord(
  currentUser: CurrentUser,
  reviewerId: string | null | undefined,
  approvalPermission: string,
) {
  if (currentUser.permissions.includes(superAdminPermission)) return true
  if (reviewerId) return reviewerId === currentUser.id
  return currentUser.permissions.includes(approvalPermission)
}

// ── Settings (shared mutable state) ──────────────────────────────────
export type AppSettings = {
  language: AppLanguage
  timeZone: AppTimeZone
}

let runtimeSettings: AppSettings = { language: 'zh-CN', timeZone: 'Asia/Shanghai' }

export function getRuntimeSettings() {
  return runtimeSettings
}

export function setRuntimeSettings(settings: AppSettings) {
  runtimeSettings = settings
}

// ── Date / time helpers ──────────────────────────────────────────────
export function timeZoneOffsetMinutes(timeZone: AppTimeZone) {
  return timeZone === 'Asia/Shanghai' ? 8 * 60 : 0
}

export function dateTimeLocalValue(date: Date, settings: AppSettings = runtimeSettings) {
  const zoned = new Date(date.getTime() + timeZoneOffsetMinutes(settings.timeZone) * 60_000)
  return zoned.toISOString().slice(0, 16)
}

export function parseDateTimeLocal(value: string, settings: AppSettings = runtimeSettings) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  const utcMs =
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) -
    timeZoneOffsetMinutes(settings.timeZone) * 60_000
  return new Date(utcMs)
}

export function dateTimeLocalToIso(value: string, settings: AppSettings = runtimeSettings) {
  return parseDateTimeLocal(value, settings)?.toISOString() ?? ''
}

export function normalizeApiDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)) return value
  return `${value}Z`
}

export function parseApiDate(value: string | null) {
  if (!value) return null
  const date = new Date(normalizeApiDateValue(value))
  return Number.isNaN(date.getTime()) ? null : date
}

export function dateParts(value: string | null, settings: AppSettings = runtimeSettings) {
  const date = parseApiDate(value)
  if (!date) return null
  const parts = new Intl.DateTimeFormat(settings.language, {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone: settings.timeZone,
    year: 'numeric',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    time: `${map.hour}:${map.minute}`,
  }
}

// ── Format / display helpers ─────────────────────────────────────────
export function formatDate(value: string | null) {
  return dateParts(value)?.date ?? '-'
}

export function formatDateTime(value: string | null) {
  const parts = dateParts(value)
  return parts ? `${parts.date} ${parts.time}` : '-'
}

export function formatTime(value: string | null) {
  return dateParts(value)?.time ?? '-'
}

export function formatMoney(value?: string | null, currency?: string | null): string {
  if (!value) return translate(getRuntimeSettings().language, 'common.notSet')
  const numeric = Number(value)
  const amount = Number.isFinite(numeric)
    ? numeric.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: value.includes('.') ? 2 : 0,
      })
    : value
  return `${currency ?? 'USD'} ${amount}`
}

export function formatFinanceAmount(value?: string | null, currency?: string | null): string {
  if (!value) return '-'
  const numeric = Number(value)
  const amount = Number.isFinite(numeric)
    ? numeric.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: value.includes('.') ? 2 : 0,
      })
    : value
  if (!currency || currency === '-' || currency === '多币种') return amount
  return `${currency} ${amount}`
}

export function nullableText(value: string | null): string {
  return value ?? '-'
}

export function dateInputValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export function todayInputValue(): string {
  return dateInputValue(new Date())
}

export function daysFromTodayInputValue(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return dateInputValue(date)
}

export function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

export function trimDecimal(value: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  return Number.isInteger(numeric) ? String(numeric) : String(numeric)
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function formatPercent(value?: string | null): string {
  if (!value) return '-'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  return `${(numeric * 100).toFixed(1)}%`
}

export function partnerTypeLabel(value: string): string {
  const option = partnerTypeOptions.find((item) => item.value === value)
  return option ? translate(getRuntimeSettings().language, option.labelKey) : value
}

// ── Page title / tag helpers (used by App shell) ─────────────────────
export function workflowPageTitle(
  path: string,
  fallback: string,
  settings: AppSettings = runtimeSettings,
): string {
  const key = workflowPageTitleKeyByPath[path]
  return key ? translate(settings.language, key) : fallback
}

export function pageTitle(
  path: string,
  menu: MenuItem | null,
  settings: AppSettings = runtimeSettings,
): string {
  if (isFinancePath(path)) {
    const { module } = parseFinanceView(path)
    return translate(settings.language, financePageTitleKeys[module])
  }
  if (path === reportingPath) {
    return translate(settings.language, 'nav.page.reporting')
  }
  const rootPath = detailRootPath(path)
  const rootKey = workflowPageTitleKeyByPath[rootPath]
  if (rootKey) {
    return translate(settings.language, rootKey)
  }
  return menu?.label ?? translate(settings.language, 'nav.page.businessModule')
}

export function statusTag(value: string) {
  const color =
    value === 'done' || value === 'completed' ? 'green' : value === 'overdue' ? 'red' : 'gold'
  const labelKeys: Record<string, TranslationKey> = {
    completed: 'common.workflowStatus.completed',
    done: 'common.workflowStatus.completed',
    pending: 'common.workflowStatus.pending',
    in_progress: 'common.workflowStatus.inProgress',
    overdue: 'common.workflowStatus.overdue',
  }
  const key = labelKeys[value]
  const label = key ? translate(getRuntimeSettings().language, key) : value
  return <Tag color={color}>{label}</Tag>
}

export function severityTag(value: string) {
  const color =
    value === 'high' || value === 'urgent' ? 'red' : value === 'warning' ? 'gold' : 'blue'
  const labelKeys: Record<string, TranslationKey> = {
    high: 'common.severity.high',
    urgent: 'common.severity.urgent',
    warning: 'common.severity.warning',
    info: 'common.severity.info',
  }
  const key = labelKeys[value]
  return <Tag color={color}>{key ? translate(getRuntimeSettings().language, key) : value}</Tag>
}

// ── Navigation types ─────────────────────────────────────────────────
export type NavigateToModule = (path: string) => void

export type ModuleNavigationProps = {
  onNavigate: NavigateToModule
}

export type RoutedDetailPageProps = ModuleNavigationProps & {
  detailId: string | null
}

export const lockedWorkflowPaths = new Set([
  organizationUsersPath,
  partnerPath,
  documentPartyPath,
  sampleRequestPath,
  sampleRecordPath,
  sampleDeliveryPath,
  exportQuotationPath,
  shipmentPath,
  purchaseInquiryPath,
  purchaseInvoiceNoticePath,
  warehouseInboundPlanPath,
  warehouseOutboundPlanPath,
  warehouseOutboundOrderPath,
])
