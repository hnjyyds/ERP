import React, { Suspense } from 'react'
import { Skeleton } from 'antd'
import type { AuthSession, Dashboard, MenuItem } from '../../../api'
import {
  isDetailPathFor,
  moduleDetailId,
  dashboardPath,
  dashboardTodosPath,
  dashboardSchedulesPath,
  dashboardNotificationsPath,
  dashboardAnnouncementsPath,
  organizationUsersPath,
  reportingPath,
  productPath,
  isProductPath,
  productDetailId,
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
  isFinancePath,
  parseFinanceView,
} from '../../routes'
import { PageErrorBoundary } from '../../App'

// Lazy pages
const DashboardPage = React.lazy(() => import('../../pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const DashboardTodosPage = React.lazy(() => import('../../pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardTodosPage })))
const DashboardSchedulesPage = React.lazy(() => import('../../pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardSchedulesPage })))
const DashboardNotificationsPage = React.lazy(() => import('../../pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardNotificationsPage })))
const DashboardAnnouncementsPage = React.lazy(() => import('../../pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardAnnouncementsPage })))
const OrganizationUsersPage = React.lazy(() => import('../../pages/organization/OrganizationUsersPage').then(m => ({ default: m.OrganizationUsersPage })))
const ProductsPage = React.lazy(() => import('../../pages/masterdata/ProductsPage').then(m => ({ default: m.ProductsPage })))
const CustomersPage = React.lazy(() => import('../../pages/masterdata/CustomersPage').then(m => ({ default: m.CustomersPage })))
const SuppliersPage = React.lazy(() => import('../../pages/masterdata/SuppliersPage').then(m => ({ default: m.SuppliersPage })))
const PartnersPage = React.lazy(() => import('../../pages/masterdata/PartnersPage').then(m => ({ default: m.PartnersPage })))
const DocumentPartiesPage = React.lazy(() => import('../../pages/masterdata/DocumentPartiesPage').then(m => ({ default: m.DocumentPartiesPage })))
const SampleRequestsPage = React.lazy(() => import('../../pages/sample/SampleRequestsPage').then(m => ({ default: m.SampleRequestsPage })))
const SampleRecordsPage = React.lazy(() => import('../../pages/sample/SampleRecordsPage').then(m => ({ default: m.SampleRecordsPage })))
const SampleDeliveriesPage = React.lazy(() => import('../../pages/sample/SampleDeliveriesPage').then(m => ({ default: m.SampleDeliveriesPage })))
const ExportQuotationsPage = React.lazy(() => import('../../pages/sales/ExportQuotationsPage').then(m => ({ default: m.ExportQuotationsPage })))
const ExportContractsPage = React.lazy(() => import('../../pages/sales/ExportContractsPage').then(m => ({ default: m.ExportContractsPage })))
const ShipmentsPage = React.lazy(() => import('../../pages/sales/ShipmentsPage').then(m => ({ default: m.ShipmentsPage })))
const PurchaseInquiriesPage = React.lazy(() => import('../../pages/purchase/PurchaseInquiriesPage').then(m => ({ default: m.PurchaseInquiriesPage })))
const PurchaseContractsPage = React.lazy(() => import('../../pages/purchase/PurchaseContractsPage').then(m => ({ default: m.PurchaseContractsPage })))
const PurchaseInvoiceNoticesPage = React.lazy(() => import('../../pages/purchase/PurchaseInvoiceNoticesPage').then(m => ({ default: m.PurchaseInvoiceNoticesPage })))
const FollowupPage = React.lazy(() => import('../../pages/purchase/FollowupPage').then(m => ({ default: m.FollowupPage })))
const QualityInspectionsPage = React.lazy(() => import('../../pages/quality/QualityInspectionsPage').then(m => ({ default: m.QualityInspectionsPage })))
const InboundPlansPage = React.lazy(() => import('../../pages/warehouse/InboundPlansPage').then(m => ({ default: m.InboundPlansPage })))
const InboundOrdersPage = React.lazy(() => import('../../pages/warehouse/InboundOrdersPage').then(m => ({ default: m.InboundOrdersPage })))
const OutboundPlansPage = React.lazy(() => import('../../pages/warehouse/OutboundPlansPage').then(m => ({ default: m.OutboundPlansPage })))
const OutboundOrdersPage = React.lazy(() => import('../../pages/warehouse/OutboundOrdersPage').then(m => ({ default: m.OutboundOrdersPage })))
const ReportingPage = React.lazy(() => import('../../pages/reporting/ReportingPage').then(m => ({ default: m.ReportingPage })))
const FinancePage = React.lazy(() => import('../../pages/finance/FinancePage').then(m => ({ default: m.FinancePage })))
const AccessDeniedPage = React.lazy(() => import('../../pages/reporting/ReportingPage').then(m => ({ default: m.AccessDeniedPage })))

type Props = {
  activePath: string
  session: AuthSession
  dashboard: Dashboard | null
  loadingDashboard: boolean
  activeMenu: MenuItem | null
  onNavigate: (path: string) => void
  onRefreshDashboard: () => Promise<void>
  canNavigatePath: (path: string) => boolean
}

export function AppRouter({ activePath, session, dashboard, loadingDashboard, activeMenu, onNavigate, onRefreshDashboard, canNavigatePath }: Props) {
  return (
    <PageErrorBoundary pageKey={activePath}>
      <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
        {activePath === dashboardPath ? (
          <DashboardPage currentUser={session.user} dashboard={dashboard} loading={loadingDashboard} canNavigatePath={canNavigatePath} onNavigate={onNavigate} onRefresh={onRefreshDashboard} />
        ) : activePath === dashboardTodosPath ? (
          <DashboardTodosPage dashboard={dashboard} loading={loadingDashboard} canNavigatePath={canNavigatePath} onNavigate={onNavigate} />
        ) : activePath === dashboardSchedulesPath ? (
          <DashboardSchedulesPage dashboard={dashboard} loading={loadingDashboard} onRefresh={onRefreshDashboard} />
        ) : activePath === dashboardNotificationsPath ? (
          <DashboardNotificationsPage dashboard={dashboard} loading={loadingDashboard} onRefresh={onRefreshDashboard} />
        ) : activePath === dashboardAnnouncementsPath ? (
          <DashboardAnnouncementsPage dashboard={dashboard} loading={loadingDashboard} />
        ) : activePath === organizationUsersPath ? (
          <OrganizationUsersPage currentUser={session.user} />
        ) : isProductPath(activePath) ? (
          <ProductsPage detailId={productDetailId(activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(customerPath, activePath) ? (
          <CustomersPage detailId={moduleDetailId(customerPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(supplierPath, activePath) ? (
          <SuppliersPage detailId={moduleDetailId(supplierPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(partnerPath, activePath) ? (
          <PartnersPage detailId={moduleDetailId(partnerPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(documentPartyPath, activePath) ? (
          <DocumentPartiesPage detailId={moduleDetailId(documentPartyPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(sampleRequestPath, activePath) ? (
          <SampleRequestsPage detailId={moduleDetailId(sampleRequestPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(sampleRecordPath, activePath) ? (
          <SampleRecordsPage detailId={moduleDetailId(sampleRecordPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(sampleDeliveryPath, activePath) ? (
          <SampleDeliveriesPage detailId={moduleDetailId(sampleDeliveryPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(exportQuotationPath, activePath) ? (
          <ExportQuotationsPage detailId={moduleDetailId(exportQuotationPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(exportContractPath, activePath) ? (
          <ExportContractsPage detailId={moduleDetailId(exportContractPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(shipmentPath, activePath) ? (
          <ShipmentsPage detailId={moduleDetailId(shipmentPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(purchaseInquiryPath, activePath) ? (
          <PurchaseInquiriesPage detailId={moduleDetailId(purchaseInquiryPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(purchaseContractPath, activePath) ? (
          <PurchaseContractsPage detailId={moduleDetailId(purchaseContractPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(purchaseInvoiceNoticePath, activePath) ? (
          <PurchaseInvoiceNoticesPage detailId={moduleDetailId(purchaseInvoiceNoticePath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(followupPath, activePath) ? (
          <FollowupPage detailId={moduleDetailId(followupPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(qualityInspectionPath, activePath) ? (
          <QualityInspectionsPage currentUser={session.user} detailId={moduleDetailId(qualityInspectionPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(warehouseInboundPlanPath, activePath) ? (
          <InboundPlansPage detailId={moduleDetailId(warehouseInboundPlanPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(warehouseInboundOrderPath, activePath) ? (
          <InboundOrdersPage detailId={moduleDetailId(warehouseInboundOrderPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(warehouseOutboundPlanPath, activePath) ? (
          <OutboundPlansPage detailId={moduleDetailId(warehouseOutboundPlanPath, activePath)} onNavigate={onNavigate} />
        ) : isDetailPathFor(warehouseOutboundOrderPath, activePath) ? (
          <OutboundOrdersPage detailId={moduleDetailId(warehouseOutboundOrderPath, activePath)} onNavigate={onNavigate} />
        ) : activePath === reportingPath ? (
          <ReportingPage onNavigate={onNavigate} />
        ) : isFinancePath(activePath) ? (
          <FinancePage view={parseFinanceView(activePath)} onNavigate={onNavigate} />
        ) : (
          <AccessDeniedPage />
        )}
      </Suspense>
    </PageErrorBoundary>
  )
}
