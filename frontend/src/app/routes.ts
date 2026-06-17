export const loginPath = '/login'
export const dashboardPath = '/'
export const dashboardTodosPath = '/workspace/todos'
export const dashboardSchedulesPath = '/workspace/schedules'
export const dashboardNotificationsPath = '/workspace/notifications'
export const dashboardAnnouncementsPath = '/workspace/announcements'
export const organizationUsersPath = '/organization/users'
export const productPath = '/masterdata/products'
export const customerPath = '/masterdata/customers'
export const supplierPath = '/masterdata/suppliers'
export const partnerPath = '/masterdata/partners'
export const documentPartyPath = '/masterdata/document-parties'
export const sampleRequestPath = '/sample/requests'
export const sampleRecordPath = '/sample/records'
export const sampleDeliveryPath = '/sample/deliveries'
export const exportQuotationPath = '/sales/quotations'
export const exportContractPath = '/sales/contracts'
export const shipmentPath = '/sales/shipments'
export const purchaseInquiryPath = '/purchase/inquiries'
export const purchaseContractPath = '/purchase/contracts'
export const purchaseInvoiceNoticePath = '/purchase/invoice-notices'
export const followupPath = '/purchase/followup'
export const qualityInspectionPath = '/quality/inspections'
export const warehouseInboundPlanPath = '/warehouse/inbound-plans'
export const warehouseInboundOrderPath = '/warehouse/inbound-orders'
export const warehouseOutboundPlanPath = '/warehouse/outbound-plans'
export const warehouseOutboundOrderPath = '/warehouse/outbound-orders'
export const financePath = '/finance'
export const financeOverviewPath = '/finance/overview'
export const financeReceiptsPath = '/finance/receipts'
export const financePaymentsPath = '/finance/payments'
export const financeFeesPath = '/finance/fees'
export const financeTaxPath = '/finance/tax'
export const financeMiscPath = '/finance/misc'
export const financeSettlementPath = '/finance/settlement'
export const reportingPath = '/reporting'

export const dashboardSectionPaths = new Set([
  dashboardPath,
  dashboardTodosPath,
  dashboardSchedulesPath,
  dashboardNotificationsPath,
  dashboardAnnouncementsPath,
])

export type FinanceModule =
  | 'home'
  | 'overview'
  | 'receipts'
  | 'payments'
  | 'fees'
  | 'tax'
  | 'misc'
  | 'settlement'

const financeModuleByBasePath: Record<string, FinanceModule> = {
  [financePath]: 'home',
  [financeOverviewPath]: 'overview',
  [financeReceiptsPath]: 'receipts',
  [financePaymentsPath]: 'payments',
  [financeFeesPath]: 'fees',
  [financeTaxPath]: 'tax',
  [financeMiscPath]: 'misc',
  [financeSettlementPath]: 'settlement',
}

export const financeModulePathByModule: Record<FinanceModule, string> = {
  home: financePath,
  overview: financeOverviewPath,
  receipts: financeReceiptsPath,
  payments: financePaymentsPath,
  fees: financeFeesPath,
  tax: financeTaxPath,
  misc: financeMiscPath,
  settlement: financeSettlementPath,
}

export function isFinancePath(path: string) {
  return path === financePath || path.startsWith(`${financePath}/`)
}

export type FinanceView = { module: FinanceModule; id: string | null }

export function parseFinanceView(path: string): FinanceView {
  if (!isFinancePath(path)) return { module: 'home', id: null }
  const segments = path.split('/').filter(Boolean) // ['finance', module?, id?]
  if (segments.length <= 1) return { module: 'home', id: null }
  const basePath = `/${segments[0]}/${segments[1]}`
  const module = financeModuleByBasePath[basePath]
  if (!module) return { module: 'home', id: null }
  const id = segments[2] ? decodeURIComponent(segments[2]) : null
  return { module, id }
}

export function financeDetailPath(module: FinanceModule, id: string) {
  return `${financeModulePathByModule[module]}/${encodeURIComponent(id)}`
}
