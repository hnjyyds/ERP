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
export const reportingPath = '/reporting'

export const dashboardSectionPaths = new Set([
  dashboardPath,
  dashboardTodosPath,
  dashboardSchedulesPath,
  dashboardNotificationsPath,
  dashboardAnnouncementsPath,
])
