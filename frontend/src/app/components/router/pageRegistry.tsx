/* eslint-disable react-refresh/only-export-components -- 页面注册表是数据模块，不是组件模块 */
import React from 'react'
import type { ReactElement } from 'react'
import type { AuthSession, Dashboard } from '@/api'
import {
  customerPath,
  documentPartyPath,
  exportContractPath,
  exportQuotationPath,
  followupPath,
  isFinancePath,
  moduleDetailId,
  moduleNestedDetailId,
  partnerPath,
  parseFinanceView,
  productPath,
  purchaseContractPath,
  purchaseInquiryPath,
  purchaseInvoiceNoticePath,
  qualityInspectionPath,
  routeDefinition,
  routeKeyForPath,
  sampleDeliveryPath,
  sampleRecordPath,
  sampleRequestPath,
  shipmentPath,
  supplierPath,
  warehouseInboundOrderPath,
  warehouseInboundPlanPath,
  warehouseOutboundOrderPath,
  warehouseOutboundPlanPath,
} from '@/app/routes'
import type { RouteKey } from '@/app/routes'

const DashboardPage = React.lazy(() =>
  import('@/app/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const DashboardTodosPage = React.lazy(() =>
  import('@/app/pages/dashboard/views/DashboardTodosPage').then((m) => ({
    default: m.DashboardTodosPage,
  })),
)
const DashboardSchedulesPage = React.lazy(() =>
  import('@/app/pages/dashboard/views/DashboardSchedulesPage').then((m) => ({
    default: m.DashboardSchedulesPage,
  })),
)
const DashboardNotificationsPage = React.lazy(() =>
  import('@/app/pages/dashboard/views/DashboardNotificationsPage').then((m) => ({
    default: m.DashboardNotificationsPage,
  })),
)
const DashboardAnnouncementsPage = React.lazy(() =>
  import('@/app/pages/dashboard/views/DashboardAnnouncementsPage').then((m) => ({
    default: m.DashboardAnnouncementsPage,
  })),
)
const OrganizationUsersPage = React.lazy(() =>
  import('@/app/pages/organization/OrganizationUsersPage').then((m) => ({
    default: m.OrganizationUsersPage,
  })),
)
const McpSettingsPage = React.lazy(() =>
  import('@/app/pages/system/McpSettingsPage').then((m) => ({ default: m.McpSettingsPage })),
)
const AuditLogsPage = React.lazy(() =>
  import('@/app/pages/system/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })),
)
const ProductsPage = React.lazy(() =>
  import('@/app/pages/masterdata/ProductsPage').then((m) => ({ default: m.ProductsPage })),
)
const CustomersPage = React.lazy(() =>
  import('@/app/pages/masterdata/CustomersPage').then((m) => ({ default: m.CustomersPage })),
)
const SuppliersPage = React.lazy(() =>
  import('@/app/pages/masterdata/SuppliersPage').then((m) => ({ default: m.SuppliersPage })),
)
const PartnersPage = React.lazy(() =>
  import('@/app/pages/masterdata/PartnersPage').then((m) => ({ default: m.PartnersPage })),
)
const DocumentPartiesPage = React.lazy(() =>
  import('@/app/pages/masterdata/DocumentPartiesPage').then((m) => ({
    default: m.DocumentPartiesPage,
  })),
)
const SampleRequestsPage = React.lazy(() =>
  import('@/app/pages/sample/SampleRequestsPage').then((m) => ({ default: m.SampleRequestsPage })),
)
const SampleRecordsPage = React.lazy(() =>
  import('@/app/pages/sample/SampleRecordsPage').then((m) => ({ default: m.SampleRecordsPage })),
)
const SampleDeliveriesPage = React.lazy(() =>
  import('@/app/pages/sample/SampleDeliveriesPage').then((m) => ({
    default: m.SampleDeliveriesPage,
  })),
)
const ExportQuotationsPage = React.lazy(() =>
  import('@/app/pages/sales/ExportQuotationsPage').then((m) => ({
    default: m.ExportQuotationsPage,
  })),
)
const ExportContractsPage = React.lazy(() =>
  import('@/app/pages/sales/ExportContractsPage').then((m) => ({ default: m.ExportContractsPage })),
)
const ShipmentsPage = React.lazy(() =>
  import('@/app/pages/sales/ShipmentsPage').then((m) => ({ default: m.ShipmentsPage })),
)
const PurchaseInquiriesPage = React.lazy(() =>
  import('@/app/pages/purchase/PurchaseInquiriesPage').then((m) => ({
    default: m.PurchaseInquiriesPage,
  })),
)
const PurchaseContractsPage = React.lazy(() =>
  import('@/app/pages/purchase/PurchaseContractsPage').then((m) => ({
    default: m.PurchaseContractsPage,
  })),
)
const PurchaseInvoiceNoticesPage = React.lazy(() =>
  import('@/app/pages/purchase/PurchaseInvoiceNoticesPage').then((m) => ({
    default: m.PurchaseInvoiceNoticesPage,
  })),
)
const FollowupPage = React.lazy(() =>
  import('@/app/pages/purchase/FollowupPage').then((m) => ({ default: m.FollowupPage })),
)
const QualityInspectionsPage = React.lazy(() =>
  import('@/app/pages/quality/QualityInspectionsPage').then((m) => ({
    default: m.QualityInspectionsPage,
  })),
)
const MyQualityTasksPage = React.lazy(() =>
  import('@/app/pages/quality/MyQualityTasksPage').then((m) => ({
    default: m.MyQualityTasksPage,
  })),
)
const InboundPlansPage = React.lazy(() =>
  import('@/app/pages/warehouse/InboundPlansPage').then((m) => ({ default: m.InboundPlansPage })),
)
const InboundOrdersPage = React.lazy(() =>
  import('@/app/pages/warehouse/InboundOrdersPage').then((m) => ({ default: m.InboundOrdersPage })),
)
const OutboundPlansPage = React.lazy(() =>
  import('@/app/pages/warehouse/OutboundPlansPage').then((m) => ({ default: m.OutboundPlansPage })),
)
const OutboundOrdersPage = React.lazy(() =>
  import('@/app/pages/warehouse/OutboundOrdersPage').then((m) => ({
    default: m.OutboundOrdersPage,
  })),
)
const StocktakesPage = React.lazy(() =>
  import('@/app/pages/warehouse/StocktakesPage').then((m) => ({
    default: m.StocktakesPage,
  })),
)
const ReportingPage = React.lazy(() =>
  import('@/app/pages/reporting/ReportingPage').then((m) => ({ default: m.ReportingPage })),
)
const FinancePage = React.lazy(() =>
  import('@/app/pages/finance/FinancePage').then((m) => ({ default: m.FinancePage })),
)

export type PageRenderContext = {
  activePath: string
  session: AuthSession
  dashboard: Dashboard | null
  loadingDashboard: boolean
  onNavigate: (path: string) => void
  onRefreshDashboard: () => Promise<void>
  canNavigatePath: (path: string) => boolean
}

export type PageRenderer = (context: PageRenderContext) => ReactElement

const financeRenderer: PageRenderer = (context) => (
  <FinancePage
    currentUser={context.session.user}
    view={parseFinanceView(context.activePath)}
    onNavigate={context.onNavigate}
  />
)

/**
 * 页面注册表：RouteKey -> 页面渲染函数。
 * 路径、菜单、详情根由 routes.ts 的 routeDefinitions 提供，这里只声明页面组件与 props。
 */
const pageRenderers: Partial<Record<RouteKey, PageRenderer>> = {
  dashboard: (context) => (
    <DashboardPage
      currentUser={context.session.user}
      dashboard={context.dashboard}
      menus={context.session.menus}
      loading={context.loadingDashboard}
      canNavigatePath={context.canNavigatePath}
      onNavigate={context.onNavigate}
      onRefresh={context.onRefreshDashboard}
    />
  ),
  dashboardTodos: (context) => (
    <DashboardTodosPage
      currentUser={context.session.user}
      dashboard={context.dashboard}
      loading={context.loadingDashboard}
      canNavigatePath={context.canNavigatePath}
      onNavigate={context.onNavigate}
      onRefresh={context.onRefreshDashboard}
    />
  ),
  dashboardSchedules: (context) => (
    <DashboardSchedulesPage
      dashboard={context.dashboard}
      loading={context.loadingDashboard}
      onRefresh={context.onRefreshDashboard}
    />
  ),
  dashboardNotifications: (context) => (
    <DashboardNotificationsPage
      dashboard={context.dashboard}
      loading={context.loadingDashboard}
      canNavigatePath={context.canNavigatePath}
      onNavigate={context.onNavigate}
      onRefresh={context.onRefreshDashboard}
    />
  ),
  dashboardAnnouncements: (context) => (
    <DashboardAnnouncementsPage
      dashboard={context.dashboard}
      loading={context.loadingDashboard}
    />
  ),
  organizationUsers: (context) => <OrganizationUsersPage currentUser={context.session.user} />,
  mcpSettings: () => <McpSettingsPage />,
  auditLogs: () => <AuditLogsPage />,
  product: (context) => (
    <ProductsPage
      detailId={moduleDetailId(productPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  customer: (context) => (
    <CustomersPage
      detailId={moduleDetailId(customerPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  supplier: (context) => (
    <SuppliersPage
      detailId={moduleDetailId(supplierPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  partner: (context) => (
    <PartnersPage
      detailId={moduleDetailId(partnerPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  documentParty: (context) => (
    <DocumentPartiesPage
      detailId={moduleDetailId(documentPartyPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  sampleRequest: (context) => (
    <SampleRequestsPage
      currentUser={context.session.user}
      detailId={moduleDetailId(sampleRequestPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  sampleRecord: (context) => (
    <SampleRecordsPage
      detailId={moduleDetailId(sampleRecordPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  sampleDelivery: (context) => (
    <SampleDeliveriesPage
      currentUser={context.session.user}
      detailId={moduleDetailId(sampleDeliveryPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  exportQuotation: (context) => (
    <ExportQuotationsPage
      currentUser={context.session.user}
      detailId={moduleDetailId(exportQuotationPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  exportContract: (context) => (
    <ExportContractsPage
      currentUser={context.session.user}
      detailId={moduleDetailId(exportContractPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  shipment: (context) => (
    <ShipmentsPage
      currentUser={context.session.user}
      detailId={moduleDetailId(shipmentPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  purchaseInquiry: (context) => (
    <PurchaseInquiriesPage
      detailId={moduleDetailId(purchaseInquiryPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  purchaseContract: (context) => (
    <PurchaseContractsPage
      currentUser={context.session.user}
      detailId={moduleDetailId(purchaseContractPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  purchaseInvoiceNotice: (context) => (
    <PurchaseInvoiceNoticesPage
      detailId={moduleDetailId(purchaseInvoiceNoticePath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  followup: (context) => (
    <FollowupPage
      detailId={moduleDetailId(followupPath, context.activePath)}
      targetNodeId={moduleNestedDetailId(followupPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  myQualityTasks: (context) => <MyQualityTasksPage currentUser={context.session.user} />,
  qualityInspection: (context) => (
    <QualityInspectionsPage
      currentUser={context.session.user}
      detailId={moduleDetailId(qualityInspectionPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  warehouseInboundPlan: (context) => (
    <InboundPlansPage
      detailId={moduleDetailId(warehouseInboundPlanPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  warehouseInboundOrder: (context) => (
    <InboundOrdersPage
      currentUser={context.session.user}
      detailId={moduleDetailId(warehouseInboundOrderPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  warehouseOutboundPlan: (context) => (
    <OutboundPlansPage
      detailId={moduleDetailId(warehouseOutboundPlanPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  warehouseOutboundOrder: (context) => (
    <OutboundOrdersPage
      currentUser={context.session.user}
      detailId={moduleDetailId(warehouseOutboundOrderPath, context.activePath)}
      onNavigate={context.onNavigate}
    />
  ),
  warehouseStocktake: (context) => <StocktakesPage currentUser={context.session.user} />,
  reporting: (context) => <ReportingPage onNavigate={context.onNavigate} />,
  finance: financeRenderer,
  financeOverview: financeRenderer,
  financeReceipts: financeRenderer,
  financePayments: financeRenderer,
  financeFees: financeRenderer,
  financeTax: financeRenderer,
  financeMisc: financeRenderer,
  financeSettlement: financeRenderer,
  financeReimbursements: financeRenderer,
  financePortData: financeRenderer,
  financeReports: financeRenderer,
}

/**
 * 按注册表解析当前路径对应的页面。
 * 非详情根页面只接受精确路径，保持改造前逐条 `activePath === xxxPath` 的行为。
 */
export function resolvePageRenderer(activePath: string): PageRenderer | null {
  const key = routeKeyForPath(activePath)
  if (!key) return null
  const route = routeDefinition(key)
  const allowsNested = Boolean(route.detailRoot) || isFinancePath(activePath)
  if (route.path !== activePath && !allowsNested) return null
  return pageRenderers[key] ?? null
}
