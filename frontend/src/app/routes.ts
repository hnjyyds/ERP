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
export const financeReimbursementsPath = '/finance/reimbursements'
export const financePortDataPath = '/finance/port-data'
export const financeReportsPath = '/finance/reports'
export const reportingPath = '/reporting'

const detailRootPaths = [
  productPath,
  customerPath,
  supplierPath,
  partnerPath,
  documentPartyPath,
  sampleRequestPath,
  sampleRecordPath,
  sampleDeliveryPath,
  exportQuotationPath,
  exportContractPath,
  shipmentPath,
  purchaseInquiryPath,
  purchaseContractPath,
  purchaseInvoiceNoticePath,
  followupPath,
  qualityInspectionPath,
  warehouseInboundPlanPath,
  warehouseInboundOrderPath,
  warehouseOutboundPlanPath,
  warehouseOutboundOrderPath,
]

export function detailRootPath(path: string): string {
  return detailRootPaths.find((root) => path === root || path.startsWith(`${root}/`)) ?? path
}

export function isDetailPathFor(rootPath: string, path: string): boolean {
  return detailRootPath(path) === rootPath
}

export function moduleDetailPath(rootPath: string, id: string): string {
  return `${rootPath}/${encodeURIComponent(id)}`
}

export function moduleDetailId(rootPath: string, path: string): string | null {
  if (!path.startsWith(`${rootPath}/`)) return null
  const id = path.slice(rootPath.length + 1).split('/')[0]
  return id ? decodeURIComponent(id) : null
}

export function isProductPath(path: string): boolean {
  return detailRootPath(path) === productPath
}

export function productDetailPath(productId: string): string {
  return moduleDetailPath(productPath, productId)
}

export function productDetailId(path: string): string | null {
  return moduleDetailId(productPath, path)
}

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
  | 'reimbursements'
  | 'portData'
  | 'reports'

const financeModuleByBasePath: Record<string, FinanceModule> = {
  [financePath]: 'home',
  [financeOverviewPath]: 'overview',
  [financeReceiptsPath]: 'receipts',
  [financePaymentsPath]: 'payments',
  [financeFeesPath]: 'fees',
  [financeTaxPath]: 'tax',
  [financeMiscPath]: 'misc',
  [financeSettlementPath]: 'settlement',
  [financeReimbursementsPath]: 'reimbursements',
  [financePortDataPath]: 'portData',
  [financeReportsPath]: 'reports',
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
  reimbursements: financeReimbursementsPath,
  portData: financePortDataPath,
  reports: financeReportsPath,
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
