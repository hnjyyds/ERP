import type { TranslationKey } from '@/locales'

export type NavGroupId =
  | 'masterdata'
  | 'workflow'
  | 'taskCenter'
  | 'warehouse'
  | 'finance'
  | 'system'
  | 'legacyPurchase'

export type RouteDefinition = {
  /** 路径唯一来源：其他模块只允许从这里引用，不再手写字符串。 */
  path: string
  /** 页面标题文案键；缺省时回退到后端菜单标题。 */
  titleKey?: TranslationKey
  /** 侧边栏分组；未设置表示不进入侧边栏。 */
  navGroup?: NavGroupId
  /** 是否为分组内的子项（如财务各模块）。 */
  navChild?: boolean
  /** 侧边栏子项文案键（后端菜单缺失时兜底）。 */
  navLabelKey?: TranslationKey
  /** 是否支持 /{id} 详情路径。 */
  detailRoot?: boolean
  /** 访问该路径所需的菜单路径；缺省为该条目自身路径。 */
  menuPath?: string
}

const routeDefinitions = {
  dashboard: { path: '/', menuPath: '/' },
  dashboardTodos: { path: '/workspace/todos', menuPath: '/' },
  dashboardSchedules: { path: '/workspace/schedules', menuPath: '/' },
  dashboardNotifications: { path: '/workspace/notifications', menuPath: '/' },
  dashboardAnnouncements: { path: '/workspace/announcements', menuPath: '/' },
  product: {
    path: '/masterdata/products',
    titleKey: 'nav.page.products',
    navGroup: 'masterdata',
    detailRoot: true,
  },
  supplier: {
    path: '/masterdata/suppliers',
    titleKey: 'nav.page.suppliers',
    navGroup: 'masterdata',
    detailRoot: true,
  },
  customer: {
    path: '/masterdata/customers',
    titleKey: 'nav.page.customers',
    navGroup: 'masterdata',
    detailRoot: true,
  },
  partner: { path: '/masterdata/partners', navGroup: 'masterdata', detailRoot: true },
  documentParty: {
    path: '/masterdata/document-parties',
    navGroup: 'masterdata',
    detailRoot: true,
  },
  exportContract: {
    path: '/sales/contracts',
    titleKey: 'nav.page.exportContracts',
    navGroup: 'workflow',
    detailRoot: true,
  },
  purchaseContract: {
    path: '/purchase/contracts',
    titleKey: 'nav.page.purchaseContracts',
    navGroup: 'workflow',
    detailRoot: true,
  },
  exportQuotation: { path: '/sales/quotations', navGroup: 'workflow', detailRoot: true },
  shipment: { path: '/sales/shipments', navGroup: 'workflow', detailRoot: true },
  qualityInspection: {
    path: '/quality/inspections',
    titleKey: 'nav.page.qualityInspections',
    navGroup: 'taskCenter',
    detailRoot: true,
  },
  myQualityTasks: {
    path: '/quality/tasks',
    titleKey: 'nav.page.myQualityTasks',
    navGroup: 'taskCenter',
  },
  followup: {
    path: '/purchase/followup',
    titleKey: 'nav.page.followup',
    navGroup: 'taskCenter',
    detailRoot: true,
  },
  sampleRecord: { path: '/sample/records', navGroup: 'taskCenter', detailRoot: true },
  sampleRequest: { path: '/sample/requests', navGroup: 'taskCenter', detailRoot: true },
  sampleDelivery: { path: '/sample/deliveries', navGroup: 'taskCenter', detailRoot: true },
  warehouseInboundOrder: {
    path: '/warehouse/inbound-orders',
    titleKey: 'nav.page.warehouseInboundOrders',
    navGroup: 'warehouse',
    detailRoot: true,
  },
  warehouseInboundPlan: {
    path: '/warehouse/inbound-plans',
    navGroup: 'warehouse',
    detailRoot: true,
  },
  warehouseOutboundPlan: {
    path: '/warehouse/outbound-plans',
    navGroup: 'warehouse',
    detailRoot: true,
  },
  warehouseOutboundOrder: {
    path: '/warehouse/outbound-orders',
    navGroup: 'warehouse',
    detailRoot: true,
  },
  finance: {
    path: '/finance',
    titleKey: 'nav.page.finance',
    navGroup: 'finance',
    menuPath: '/finance',
  },
  financeOverview: {
    path: '/finance/overview',
    titleKey: 'nav.page.financeOverview',
    navGroup: 'finance',
    navChild: true,
    navLabelKey: 'nav.item.financeOverview',
    menuPath: '/finance',
  },
  financeReceipts: {
    path: '/finance/receipts',
    titleKey: 'nav.page.financeReceipts',
    navGroup: 'finance',
    navChild: true,
    navLabelKey: 'nav.item.financeReceipts',
    menuPath: '/finance',
  },
  financePayments: {
    path: '/finance/payments',
    titleKey: 'nav.page.financePayments',
    navGroup: 'finance',
    navChild: true,
    navLabelKey: 'nav.item.financePayments',
    menuPath: '/finance',
  },
  financeFees: {
    path: '/finance/fees',
    titleKey: 'nav.page.financeFees',
    navGroup: 'finance',
    navChild: true,
    navLabelKey: 'nav.item.financeFees',
    menuPath: '/finance',
  },
  financeTax: {
    path: '/finance/tax',
    titleKey: 'nav.page.financeTax',
    navGroup: 'finance',
    navChild: true,
    navLabelKey: 'nav.item.financeTax',
    menuPath: '/finance',
  },
  financeMisc: {
    path: '/finance/misc',
    titleKey: 'nav.page.financeMisc',
    navGroup: 'finance',
    navChild: true,
    navLabelKey: 'nav.item.financeMisc',
    menuPath: '/finance',
  },
  financeSettlement: {
    path: '/finance/settlement',
    titleKey: 'nav.page.financeSettlement',
    navGroup: 'finance',
    navChild: true,
    navLabelKey: 'nav.item.financeSettlement',
    menuPath: '/finance',
  },
  financeReimbursements: {
    path: '/finance/reimbursements',
    titleKey: 'nav.page.financeReimbursements',
    navGroup: 'finance',
    navChild: true,
    navLabelKey: 'nav.item.financeReimbursements',
    menuPath: '/finance',
  },
  financePortData: {
    path: '/finance/port-data',
    titleKey: 'nav.page.financePortData',
    navGroup: 'finance',
    navChild: true,
    navLabelKey: 'nav.item.financePortData',
    menuPath: '/finance',
  },
  financeReports: {
    path: '/finance/reports',
    titleKey: 'nav.page.financeReports',
    navGroup: 'finance',
    navChild: true,
    navLabelKey: 'nav.item.financeReports',
    menuPath: '/finance',
  },
  reporting: {
    path: '/reporting',
    titleKey: 'nav.page.reporting',
    navGroup: 'finance',
  },
  organizationUsers: { path: '/organization/users', navGroup: 'system' },
  mcpSettings: {
    path: '/system/mcp',
    titleKey: 'nav.page.mcpSettings',
    navGroup: 'system',
  },
  purchaseInquiry: {
    path: '/purchase/inquiries',
    navGroup: 'legacyPurchase',
    detailRoot: true,
  },
  purchaseInvoiceNotice: {
    path: '/purchase/invoice-notices',
    navGroup: 'legacyPurchase',
    detailRoot: true,
  },
} as const satisfies Record<string, RouteDefinition>

export type RouteKey = keyof typeof routeDefinitions

/** 路由注册表：路径、导航分组、详情根路径、权限菜单的单一事实来源。 */
export const routeRegistry: readonly RouteDefinition[] = Object.values(routeDefinitions)

export function routeDefinition(key: RouteKey): RouteDefinition {
  return routeDefinitions[key]
}

const routeKeyByPath = new Map<string, RouteKey>(
  (Object.keys(routeDefinitions) as RouteKey[]).map((key) => [routeDefinitions[key].path, key]),
)

/** 当前路径命中的注册表键；供页面注册表解析组件。 */
export function routeKeyForPath(path: string): RouteKey | null {
  const route = routeDefinitionFor(path)
  return route ? routeKeyByPath.get(route.path) ?? null : null
}

export const loginPath = '/login'
export const dashboardPath = routeDefinitions.dashboard.path
export const dashboardTodosPath = routeDefinitions.dashboardTodos.path
export const dashboardSchedulesPath = routeDefinitions.dashboardSchedules.path
export const dashboardNotificationsPath = routeDefinitions.dashboardNotifications.path
export const dashboardAnnouncementsPath = routeDefinitions.dashboardAnnouncements.path
export const organizationUsersPath = routeDefinitions.organizationUsers.path
export const mcpSettingsPath = routeDefinitions.mcpSettings.path
export const productPath = routeDefinitions.product.path
export const customerPath = routeDefinitions.customer.path
export const supplierPath = routeDefinitions.supplier.path
export const partnerPath = routeDefinitions.partner.path
export const documentPartyPath = routeDefinitions.documentParty.path
export const sampleRequestPath = routeDefinitions.sampleRequest.path
export const sampleRecordPath = routeDefinitions.sampleRecord.path
export const sampleDeliveryPath = routeDefinitions.sampleDelivery.path
export const exportQuotationPath = routeDefinitions.exportQuotation.path
export const exportContractPath = routeDefinitions.exportContract.path
export const shipmentPath = routeDefinitions.shipment.path
export const purchaseInquiryPath = routeDefinitions.purchaseInquiry.path
export const purchaseContractPath = routeDefinitions.purchaseContract.path
export const purchaseInvoiceNoticePath = routeDefinitions.purchaseInvoiceNotice.path
export const followupPath = routeDefinitions.followup.path
export const qualityInspectionPath = routeDefinitions.qualityInspection.path
export const myQualityTasksPath = routeDefinitions.myQualityTasks.path
export const warehouseInboundPlanPath = routeDefinitions.warehouseInboundPlan.path
export const warehouseInboundOrderPath = routeDefinitions.warehouseInboundOrder.path
export const warehouseOutboundPlanPath = routeDefinitions.warehouseOutboundPlan.path
export const warehouseOutboundOrderPath = routeDefinitions.warehouseOutboundOrder.path
export const financePath = routeDefinitions.finance.path
export const financeOverviewPath = routeDefinitions.financeOverview.path
export const financeReceiptsPath = routeDefinitions.financeReceipts.path
export const financePaymentsPath = routeDefinitions.financePayments.path
export const financeFeesPath = routeDefinitions.financeFees.path
export const financeTaxPath = routeDefinitions.financeTax.path
export const financeMiscPath = routeDefinitions.financeMisc.path
export const financeSettlementPath = routeDefinitions.financeSettlement.path
export const financeReimbursementsPath = routeDefinitions.financeReimbursements.path
export const financePortDataPath = routeDefinitions.financePortData.path
export const financeReportsPath = routeDefinitions.financeReports.path
export const reportingPath = routeDefinitions.reporting.path

/** 侧边栏某分组下的顶层路径，顺序即注册顺序。 */
export function navPathsForGroup(group: NavGroupId): string[] {
  return routeRegistry
    .filter((route) => route.navGroup === group && !route.navChild)
    .map((route) => route.path)
}

/** 侧边栏某分组下的子项（如财务各模块）。 */
export function navChildrenForGroup(
  group: NavGroupId,
): Array<{ path: string; labelKey?: TranslationKey }> {
  return routeRegistry
    .filter((route) => route.navGroup === group && route.navChild)
    .map((route) => ({ path: route.path, labelKey: route.navLabelKey }))
}

const detailRootPaths = routeRegistry
  .filter((route) => route.detailRoot)
  .map((route) => route.path)

export function detailRootPath(path: string): string {
  return detailRootPaths.find((root) => path === root || path.startsWith(`${root}/`)) ?? path
}

export function isDetailPathFor(rootPath: string, path: string): boolean {
  return detailRootPath(path) === rootPath
}

export function moduleDetailPath(rootPath: string, id: string): string {
  return `${rootPath}/${encodeURIComponent(id)}`
}

export function moduleNestedDetailPath(
  rootPath: string,
  parentId: string,
  childId: string,
): string {
  return `${moduleDetailPath(rootPath, parentId)}/${encodeURIComponent(childId)}`
}

export function moduleDetailId(rootPath: string, path: string): string | null {
  if (!path.startsWith(`${rootPath}/`)) return null
  const id = path.slice(rootPath.length + 1).split('/')[0]
  return id ? decodeURIComponent(id) : null
}

export function moduleNestedDetailId(rootPath: string, path: string): string | null {
  if (!path.startsWith(`${rootPath}/`)) return null
  const id = path.slice(rootPath.length + 1).split('/')[1]
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

export type FinanceView = {
  module: FinanceModule
  id: string | null
  itemId?: string | null
}

export function parseFinanceView(path: string): FinanceView {
  if (!isFinancePath(path)) return { module: 'home', id: null }
  const segments = path.split('/').filter(Boolean) // ['finance', module?, id?, itemId?]
  if (segments.length <= 1) return { module: 'home', id: null }
  const basePath = `/${segments[0]}/${segments[1]}`
  const module = financeModuleByBasePath[basePath]
  if (!module) return { module: 'home', id: null }
  const id = segments[2] ? decodeURIComponent(segments[2]) : null
  const itemId = segments[3] ? decodeURIComponent(segments[3]) : null
  return { module, id, itemId }
}

export function financeDetailPath(module: FinanceModule, id: string, itemId?: string) {
  const detailPath = `${financeModulePathByModule[module]}/${encodeURIComponent(id)}`
  return itemId ? `${detailPath}/${encodeURIComponent(itemId)}` : detailPath
}

/** 按最长路径匹配注册表条目；'/' 仅精确匹配，避免吞掉其他路径。 */
export function routeDefinitionFor(path: string): RouteDefinition | null {
  let matched: RouteDefinition | null = null
  for (const route of routeRegistry) {
    const matches =
      route.path === '/'
        ? path === '/'
        : path === route.path || path.startsWith(`${route.path}/`)
    if (!matches) continue
    if (!matched || route.path.length > matched.path.length) matched = route
  }
  return matched
}

export function canAccessPath(path: string, menuPaths: readonly string[]): boolean {
  const route = routeDefinitionFor(path)
  return menuPaths.includes(route?.menuPath ?? route?.path ?? detailRootPath(path))
}
