import { Tag } from 'antd'
import { LockKeyhole } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AppLanguage, AppTimeZone, CurrentUser, MenuItem } from '../../api'
import { partnerTypeOptions } from '../../shared/formOptions'
import {
  customerPath,
  detailRootPath,
  documentPartyPath,
  exportContractPath,
  exportQuotationPath,
  financePath,
  financeReceiptsPath,
  financePaymentsPath,
  financeSettlementPath,
  followupPath,
  isFinancePath,
  organizationUsersPath,
  parseFinanceView,
  partnerPath,
  productPath,
  purchaseContractPath,
  purchaseInquiryPath,
  purchaseInvoiceNoticePath,
  qualityInspectionPath,
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

export const workflowPageTitleByPath: Record<string, { 'zh-CN': string; 'en-US': string }> = {
  [exportContractPath]: { 'zh-CN': '订单 Workflow', 'en-US': 'Order workflow' },
  [purchaseContractPath]: { 'zh-CN': '采购合同和工厂履约', 'en-US': 'Purchase contracts and factory fulfillment' },
  [qualityInspectionPath]: { 'zh-CN': 'QC 任务中心', 'en-US': 'QC task center' },
  [followupPath]: { 'zh-CN': '跟单任务中心', 'en-US': 'Follow-up task center' },
  [supplierPath]: { 'zh-CN': '工厂资料和验货地址', 'en-US': 'Factories and inspection addresses' },
  [productPath]: { 'zh-CN': '产品资料、价格和质量要求', 'en-US': 'Products, prices, and quality requirements' },
  [customerPath]: { 'zh-CN': '客户资料和订单要求', 'en-US': 'Customers and order requirements' },
  [warehouseInboundOrderPath]: { 'zh-CN': '入仓和库存确认', 'en-US': 'Inbound and inventory confirmation' },
  [financePath]: { 'zh-CN': '财务摘要和订单利润', 'en-US': 'Finance summary and order profit' },
  [reportingPath]: { 'zh-CN': '老板看板和经营分析', 'en-US': 'Executive board and business analysis' },
}

export function canCreateAnnouncement(user: CurrentUser) {
  return user.permissions.includes(superAdminPermission)
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
  if (!value) return '未设置'
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

export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10)
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
  return partnerTypeOptions.find((item) => item.value === value)?.label ?? value
}

// ── Page title / tag helpers (used by App shell) ─────────────────────
export function workflowPageTitle(path: string, fallback: string, settings: AppSettings = runtimeSettings): string {
  return workflowPageTitleByPath[path]?.[settings.language] ?? fallback
}

export function pageTitle(
  path: string,
  menu: MenuItem | null,
  settings: AppSettings = runtimeSettings,
): string {
  if (isFinancePath(path)) {
    const { module } = parseFinanceView(path)
    if (module !== 'home') {
      const titles: Record<FinanceModule, string> = {
        home: '财务管理',
        overview: '经营总览',
        receipts: '收款管理',
        payments: '付款管理',
        fees: '付费管理',
        tax: '核销退税',
        misc: '杂费管理',
        settlement: '结算核算',
        reimbursements: '报销管理',
        portData: '口岸数据',
        reports: '财务报表',
      }
      return titles[module]
    }
    return workflowPageTitleByPath[financePath]?.[settings.language] ?? '财务管理'
  }
  if (path === reportingPath) {
    return workflowPageTitleByPath[reportingPath]?.[settings.language] ?? '老板看板'
  }
  const rootPath = detailRootPath(path)
  if (workflowPageTitleByPath[rootPath]) {
    return workflowPageTitleByPath[rootPath][settings.language]
  }
  return menu?.label ?? '业务模块'
}

export function statusTag(value: string) {
  const color = value === 'done' || value === 'completed' ? 'green' : 'gold'
  return <Tag color={color}>{value === 'completed' || value === 'done' ? '已完成' : value === 'pending' ? '待处理' : value}</Tag>
}

export function severityTag(value: string) {
  const color = value === 'high' || value === 'urgent' ? 'red' : value === 'warning' ? 'gold' : 'blue'
  return <Tag color={color}>{value}</Tag>
}

// ── Navigation types ─────────────────────────────────────────────────
export type NavigateToModule = (path: string) => void

export type ModuleNavigationProps = {
  onNavigate: NavigateToModule
}

export type RoutedDetailPageProps = ModuleNavigationProps & {
  detailId: string | null
}

// ── Operation Flow Rail ──────────────────────────────────────────────
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

export type OperationFlowKind = 'sales' | 'purchase' | 'warehouse' | 'finance'

type OperationFlowStep = {
  label: string
  caption: string
  path: string
}

type OperationFlowProps = {
  activeLabel?: string
  activePath: string
  kind: OperationFlowKind
  onNavigate: NavigateToModule
}

export const operationFlows: Record<OperationFlowKind, { title: string; steps: OperationFlowStep[] }> = {
  sales: {
    title: '订单 Workflow',
    steps: [
      { label: '订单中心', caption: '下单时间、客户、产品和交期', path: exportContractPath },
      { label: '采购合同', caption: '工厂、价格、质量要求', path: purchaseContractPath },
      { label: 'QC 中心', caption: '材料、样品、过程和终检', path: qualityInspectionPath },
      { label: '跟单中心', caption: '节点推进与逾期处理', path: followupPath },
      { label: '入仓', caption: 'Final QC 后入仓确认', path: warehouseInboundOrderPath },
      { label: '财务摘要', caption: '收款、应收应付和利润率', path: financePath },
    ],
  },
  purchase: {
    title: '工厂履约',
    steps: [
      { label: '采购合同', caption: '工厂、验货地址和交期', path: purchaseContractPath },
      { label: '跟单中心', caption: '今天该推进哪个节点', path: followupPath },
      { label: 'QC 中心', caption: '按质量要求验货', path: qualityInspectionPath },
      { label: '入仓', caption: '检验通过后收货入仓', path: warehouseInboundOrderPath },
      { label: '财务摘要', caption: '应付、已付和订单成本', path: financePath },
    ],
  },
  warehouse: {
    title: 'QC 入仓',
    steps: [
      { label: 'QC 中心', caption: 'Final QC 和入库资格', path: qualityInspectionPath },
      { label: '入仓', caption: '收货、库位和库存流水', path: warehouseInboundOrderPath },
      { label: '财务摘要', caption: '费用和利润归集', path: financePath },
    ],
  },
  finance: {
    title: '订单利润',
    steps: [
      { label: '财务摘要', caption: '应收应付、盈亏、利润率', path: financePath },
      { label: '收款日期', caption: '银行水单与客户回款', path: financeReceiptsPath },
      { label: '应收应付', caption: '订单收入和工厂成本', path: financePaymentsPath },
      { label: '结算核算', caption: '锁定成本与利润计算', path: financeSettlementPath },
      { label: '老板看板', caption: '订单、客户、工厂和利润', path: reportingPath },
    ],
  },
}

export function OperationFlowRail({ activeLabel, activePath, kind, onNavigate }: OperationFlowProps) {
  const flow = operationFlows[kind]

  return (
    <nav className="operation-flow" aria-label={flow.title}>
      <div className="operation-flow-title">
        <span>主闭环</span>
        <strong>{flow.title}</strong>
      </div>
      <ol className="operation-flow-list">
        {flow.steps.map((step, index) => {
          const active = activeLabel ? step.label === activeLabel : step.path === activePath
          const locked = lockedWorkflowPaths.has(step.path)

          return (
            <li key={`${kind}-${step.label}`} className="operation-flow-item">
              <button
                aria-current={active ? 'step' : undefined}
                className={[
                  'operation-flow-step',
                  active ? 'active' : '',
                  locked ? 'operation-flow-step-locked' : '',
                ].filter(Boolean).join(' ')}
                type="button"
                disabled={locked}
                onClick={() => {
                  if (!locked) onNavigate(step.path)
                }}
              >
                <span className="operation-flow-index">{index + 1}</span>
                <span className="operation-flow-copy">
                  <strong>{step.label}</strong>
                  <small>{step.caption}</small>
                </span>
                {locked ? <LockKeyhole className="operation-flow-lock" size={13} strokeWidth={2.2} /> : null}
              </button>
              {index < flow.steps.length - 1 ? <span className="operation-flow-arrow" aria-hidden="true" /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
