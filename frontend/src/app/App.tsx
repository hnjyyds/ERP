import {
  Alert,
  Button,
  ConfigProvider,
  Descriptions,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  Tag,
} from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import {
  Banner as SemiBanner,
  Button as SemiButton,
  Input as SemiInput,
} from '@douyinfe/semi-ui'
import {
  ArrowLeft,
  AtSign,
  BarChart3,
  Bell,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Factory,
  FilePenLine,
  FileSpreadsheet,
  FileStack,
  FileText,
  FlaskConical,
  Handshake,
  Receipt,
  Images,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Package,
  PackagePlus,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Ship,
  Trash2,
  UserRound,
  UsersRound,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import type { ErrorInfo, FormEvent, MouseEvent, ReactNode } from 'react'
import { Component, useEffect, useMemo, useState } from 'react'

import {
  downloadBase64File,
  downloadCsv,
  openExportContractPrint,
  openSampleRequestPrint,
} from '../shared/print'
import {
  addManualProfitCost,
  addSampleRecordImage,
  addSampleRecordStockEvent,
  addSampleFee,
  addSampleProgress,
  addExportContractAdvancePayment,
  allocateBankReceipt,
  approveFeePaymentRequest,
  approvePaymentRequest,
  approveExportContract,
  approveExportQuotation,
  approveInboundOrder,
  approveOutboundOrder,
  approvePurchaseContract,
  approveShipment,
  approveSampleDelivery,
  confirmExportQuotationContract,
  clearAuthToken,
  addPurchaseInquiryQuotation,
  claimBankReceipt,
  createAnnouncement,
  createTodos,
  createFollowupTemplate,
  createBankReceipt,
  createFinancialSettlement,
  createFeePaymentRequest,
  createMiscFeeAllocation,
  createMiscFeeItem,
  createPaymentRequest,
  createPartnerFeeInvoice,
  createQualityInspection,
  createSupplierInvoice,
  createVerificationDocument,
  createPurchaseContract,
  createExportContract,
  createExportQuotation,
  createPurchaseInquiry,
  createSampleDelivery,
  createSampleRecordFromRequest,
  createSampleRecord,
  createSampleRequest,
  createScheduleEvent,
  deleteScheduleEvent,
  exportExportContract,
  exportExportQuotation,
  exportBankReceiptSummaryReport,
  exportCustomsReceiptCollectionReport,
  exportFeePaymentReport,
  exportGoodsPaymentReport,
  exportReceiptUsageReport,
  exportSampleDeliveries,
  exportSampleRecords,
  exportTaxRefundStatisticsReport,
  importSampleRecords,
  generateFollowupPlanFromPurchaseContract,
  generateInboundOrderFromPlan,
  generateInboundPlanFromPurchaseContract,
  generateOutboundOrderFromPlan,
  generateOutboundPlanFromShipment,
  generatePurchaseContractTemplate,
  generatePurchaseContractFromExportContracts,
  generatePurchaseInvoiceNoticesFromDeclaration,
  generateShipmentFromContracts,
  getCurrentSession,
  getDashboard,
  getI18nConfig,
  getFinanceOverview,
  getExportQuotationHistory,
  getExportQuotationPurchaseReferences,
  getExportQuotationSampleDeliveries,
  getQualityInboundEligibility,
  getSampleDeliveryFeeStatistics,
  getSampleDeliveryStatistics,
  getSampleDeliveryQuoteHistory,
  getSampleDeliverySampleHistory,
  hasAuthToken,
  listAssignableUsers,
  listCustomers,
  listFollowupOverdueNodes,
  listFollowupPlans,
  listFollowupTemplates,
  listBankReceipts,
  listFinancialSettlements,
  listFeePayables,
  listFeePaymentRequests,
  listInboundOrders,
  listInboundPlans,
  listInventoryBalances,
  listInventoryLedgers,
  listMiscFeeAllocationSummary,
  listMiscFeeAllocations,
  listMiscFeeItems,
  listOutboundOrders,
  listOutboundPlans,
  listPartnerFeeInvoices,
  listApprovalDocuments,
  listReportingStatistics,
  listProfitCalculations,
  listPayables,
  listPaymentRequests,
  listExportContracts,
  listExportQuotations,
  listProducts,
  listQualityInspections,
  listReceivables,
  listPurchaseInquiries,
  listPurchaseInquiryReferences,
  listPurchaseInquirySupplierSamples,
  listPurchaseContractReminders,
  listPurchaseContracts,
  listPurchaseInvoiceNoticeReminders,
  listPurchaseInvoiceNotices,
  listShipmentReminders,
  listShipments,
  listSampleDeliveries,
  listSampleRecords,
  listSampleRequests,
  listSuppliers,
  listSupplierInvoices,
  listVerificationDocuments,
  listVerificationUsage,
  login,
  markNotificationRead,
  setAuthToken,
  updateCurrentUserAvatar,
  type AssignableUser,
  type Announcement,
  type AnnouncementCreatePayload,
  type ApprovalDocument,
  type ApprovalQuery,
  type ApprovalTypeSummary,
  type AuthSession,
  type BankReceipt,
  type BankReceiptAllocationPayload,
  type BankReceiptClaimPayload,
  type BankReceiptCreatePayload,
  type CustomsReceiptRegisterPayload,
  type FeePayableItem,
  type FeePaymentRequest,
  type FeePaymentRequestApprovePayload,
  type FeePaymentRequestCreatePayload,
  type FinancialSettlement,
  type FinancialSettlementCreatePayload,
  type PayableItem,
  type PaymentRequestApprovePayload,
  type PaymentRequestCreatePayload,
  type Customer,
  type CustomerShipmentStatistic,
  type CurrentUser,
  type Dashboard,
  type ExportContract,
  type ExportContractAdvancePayment,
  type ExportContractAdvancePaymentPayload,
  type ExportContractApprovePayload,
  type ExportContractCreatePayload,
  type ExportContractLine,
  type ExportContractPurchaseStatus,
  type ExportContractShipmentStatus,
  type ExportContractSignature,
  type ExportContractSignaturePayload,
  type ExportQuotation,
  type ExportQuotationApprovePayload,
  type ExportQuotationConfirmContractPayload,
  type ExportQuotationContract,
  type ExportQuotationCreatePayload,
  type ExportQuotationLine,
  type ExportQuotationPurchaseReference,
  type FinanceCurrencySummary,
  type FinanceOverview,
  type FinancePartnerTypeSummary,
  type FinanceShipmentProfit,
  type FinanceStatusAmount,
  type FollowProcessTemplate,
  type FollowProcessTemplateNodePayload,
  type FollowProcessTemplatePayload,
  type FollowSourceEventPayload,
  type InboundOrder,
  type InboundOrderApprovePayload,
  type InboundOrderGeneratePayload,
  type InboundPlan,
  type InboundPlanGeneratePayload,
  type InboundPlanSchedulePayload,
  type InventoryBalance,
  type InventoryLedger,
  type AppLanguage,
  type AppTimeZone,
  type I18nConfig,
  type MenuItem,
  type MiscFeeAllocation,
  type MiscFeeAllocationCreatePayload,
  type MiscFeeItem,
  type MiscFeeItemCreatePayload,
  type NotificationItem,
  type OutboundOrder,
  type OutboundOrderApprovePayload,
  type OutboundOrderGeneratePayload,
  type OutboundPlan,
  type OutboundPlanGeneratePayload,
  type OutboundPlanSchedulePayload,
  type Partner,
  type PartnerFeeInvoice,
  type PartnerFeeInvoiceCreatePayload,
  type ManualProfitCostCreatePayload,
  type ProfitCostItem,
  type ReportDocumentStatistic,
  type ReportingStatistics,
  type Product,
  type PurchaseContract,
  type PurchaseContractApprovePayload,
  type PurchaseContractCreatePayload,
  type PurchaseContractGeneratePayload,
  type PurchaseContractLine,
  type PurchaseContractReminder,
  type PurchaseContractSourceLink,
  type PurchaseInvoiceNotice,
  type PurchaseInvoiceNoticeGeneratePayload,
  type PurchaseInvoiceNoticeLinePayload,
  type PurchaseInvoiceNoticeReceivePayload,
  type PurchaseInvoiceNoticeReminder,
  type PurchaseInvoiceNoticeSendPayload,
  type PurchaseFollowOverdueNode,
  type PurchaseFollowPlan,
  type PurchaseFollowPlanGeneratePayload,
  type QualityInspection,
  type QualityInspectionInboundEligibility,
  type QualityInspectionPayload,
  type PurchaseInquiry,
  type PurchaseInquiryCreatePayload,
  type PurchaseInquiryLine,
  type PurchaseInquiryReference,
  type PurchaseInquiryTemplate,
  type PurchaseInquiryTemplatePayload,
  type ReceivableItem,
  type ScheduleCreatePayload,
  type ScheduleEvent,
  type SampleFee,
  type SampleFeePayload,
  type SampleProgress,
  type SampleProgressPayload,
  type SampleDelivery,
  type SampleDeliveryApprovePayload,
  type SampleDeliveryCreatePayload,
  type SampleDeliveryFee,
  type SampleDeliveryFeeStatistic,
  type SampleDeliveryFeeStatistics,
  type SampleDeliveryCustomerStatistic,
  type SampleDeliveryExpressStatistic,
  type SampleDeliveryStatistics,
  type SampleDeliveryLine,
  type SampleDeliveryStatusStatistic,
  type SampleDeliveryTrackingPayload,
  type SampleRecord,
  type SampleRecordCreatePayload,
  type SampleRecordImage,
  type SampleRecordImagePayload,
  type SampleRecordStockEvent,
  type SampleRecordStockEventPayload,
  type SampleRequest,
  type SampleRequestCreatePayload,
  type SampleRequestLinePayload,
  type SampleRequestToRecordPayload,
  type ShipmentLine,
  type ShipmentPlan,
  type ShipmentStatisticItem,
  type ShipmentPlanGeneratePayload,
  type ShipmentReminder,
  type ShipmentApprovePayload,
  type Supplier,
  type SupplierQuotation,
  type SupplierQuotationPayload,
  type SupplierSampleEvidence,
  type SupplierInvoice,
  type SupplierInvoiceCreatePayload,
  type SupplierPaymentRequest,
  type SalesMonthlyShipmentStatistic,
  type StatusAmountStatistic,
  type TaxRefundRegisterPayload,
  type TodoCreatePayload,
  type TodoTask,
  type VerificationDocument,
  type VerificationDocumentCreatePayload,
  type VerificationRegisterPayload,
  type VerificationUsageItem,
  registerExportContractSignature,
  registerTaxRefund,
  registerVerification,
  registerVerificationCustomsReceipt,
  submitExportContract,
  submitExportQuotation,
  submitInboundOrder,
  submitOutboundOrder,
  submitPurchaseContract,
  submitShipment,
  submitSampleDelivery,
  sendPurchaseInquiryTemplate,
  syncFollowupSampleEvents,
  syncFollowupSourceEvent,
  updateExportContract,
  updateExportQuotation,
  updateFollowupTemplate,
  updateQualityInspection,
  updatePurchaseContract,
  updatePurchaseInquiry,
  requestSampleFeePayment,
  receivePurchaseInvoiceNoticeTaxInvoice,
  scheduleInboundPlan,
  scheduleOutboundPlan,
  updateSampleDelivery,
  updateSampleDeliveryTracking,
  sendPurchaseInvoiceNotice,
  authExpiredEventName,
  listReimbursements,
  createReimbursement,
  approveReimbursement,
  autoMatchCustomsReceipts,
  payReimbursement,
  listPortImportBatches,
  createPortImportBatch,
  listCustomsDeclarationRecords,
  getReceiptUsageReport,
  getBankReceiptSummaryReport,
  getGoodsPaymentReport,
  getFeePaymentReport,
  getCustomsReceiptCollectionReport,
  getTaxRefundStatisticsReport,
  drilldownFinanceReport,
  explainFinanceReport,
  type Reimbursement,
  type ReimbursementCreatePayload,
  type ReimbursementItemCreatePayload,
  type PortImportBatch,
  type PortImportBatchCreatePayload,
  type CustomsDeclarationRecord,
  type CustomsDeclarationRecordCreatePayload,
  type FinanceReportDrilldown,
  type FinanceReportExplanation,
  type ReceiptUsageDetailRow,
  type ReceiptUsageDetailReport,
  type BankReceiptCurrencySummary,
  type BankReceiptSummaryReport,
  type GoodsPaymentQueryRow,
  type GoodsPaymentQueryReport,
  type FeePaymentQueryRow,
  type FeePaymentQueryReport,
  type CustomsReceiptCollectionRow,
  type CustomsReceiptCollectionReport,
  type TaxRefundCurrencyTotal,
  type TaxRefundStatisticsReport,
} from '../api'
import {
  loginPath,
  detailRootPath,
  isDetailPathFor,
  moduleDetailId,
  moduleDetailPath,
  dashboardPath,
  dashboardTodosPath,
  dashboardSchedulesPath,
  dashboardNotificationsPath,
  dashboardAnnouncementsPath,
  organizationUsersPath,
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
  financePath,
  financeOverviewPath,
  financeReceiptsPath,
  financePaymentsPath,
  financeFeesPath,
  financeTaxPath,
  financeMiscPath,
  financeSettlementPath,
  financeReimbursementsPath,
  financePortDataPath,
  financeReportsPath,
  financeModulePathByModule,
  financeDetailPath,
  isFinancePath,
  parseFinanceView,
  reportingPath,
  dashboardSectionPaths,
  isProductPath,
  productDetailId,
  type FinanceModule,
  type FinanceView,
} from './routes'
import { erpAntTheme } from './theme'
import { ProductsPage } from './pages/masterdata/ProductsPage'
import { CustomersPage as MasterdataCustomersPage } from './pages/masterdata/CustomersPage'
import { SuppliersPage as MasterdataSuppliersPage } from './pages/masterdata/SuppliersPage'
import { PartnersPage as MasterdataPartnersPage } from './pages/masterdata/PartnersPage'
import { DocumentPartiesPage as MasterdataDocumentPartiesPage } from './pages/masterdata/DocumentPartiesPage'
import { OrganizationUsersPage } from './pages/organization/OrganizationUsersPage'
import {
  partnerTypeOptions,
  partnerStatusOptions,
  documentPartyTypeOptions,
  sampleStatusOptions,
  sampleDestinationOptions,
  sampleProgressStageOptions,
  sampleFeeTypeOptions,
  samplePayeeTypeOptions,
  sampleRecordTypeOptions,
  sampleRecordStatusOptions,
  sampleSourceTypeOptions,
  sampleStockEventTypeOptions,
  sampleDeliveryStatusOptions,
  sampleDeliveryFeeTypeOptions,
  sampleDeliveryPayerTypeOptions,
  sampleDeliveryTrackingStatusOptions,
  exportQuotationStatusOptions,
  exportContractStatusOptions,
  shipmentStatusOptions,
  receiptStatusOptions,
  receiptTypeOptions,
  allocationTypeOptions,
  supplierInvoiceStatusOptions,
  paymentRequestStatusOptions,
  paymentTypeOptions,
  partnerFeeInvoiceStatusOptions,
  feePaymentRequestStatusOptions,
  feeTypeOptions,
  verificationDocumentStatusOptions,
  verificationReminderStatusOptions,
  miscFeeCategoryOptions,
  miscFeeAllocationMethodOptions,
  miscFeeItemStatusOptions,
  settlementStatusOptions,
  reportingDocumentTypeOptions,
  reportingStatusOptions,
  profitCostTypeOptions,
  purchaseInquiryStatusOptions,
  purchaseContractStatusOptions,
  purchaseContractSourceTypeOptions,
  purchaseInvoiceNoticeStatusOptions,
  followupStatusOptions,
  followupNodeOptions,
  followupSourceTypeOptions,
  qualityResultOptions,
  qualityIssueSeverityOptions,
  qualityIssueStatusOptions,
  inboundPlanStatusOptions,
  inboundPlanTypeOptions,
  inboundOrderStatusOptions,
  inboundOrderModeOptions,
  outboundPlanStatusOptions,
  outboundPlanTypeOptions,
  outboundPlanSourceTypeOptions,
  outboundOrderStatusOptions,
  outboundOrderModeOptions,
  freightMethodOptions,
} from '../shared/formOptions'
import {
  FormSelect,
  Metric,
  PanelTitle,
  UserAvatar,
  UserAvatarPicker,
  defaultAvatarPreset,
  type UserAvatarPickerValue,
} from '../shared/ui'
import { showError } from '../shared/errors'

type AppSettings = {
  language: AppLanguage
  timeZone: AppTimeZone
}

type PageErrorBoundaryProps = {
  children: ReactNode
  pageKey: string
}

type PageErrorBoundaryState = {
  message: string
}

class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { message: '' }

  static getDerivedStateFromError(error: unknown): PageErrorBoundaryState {
    return {
      message: error instanceof Error ? error.message : '页面渲染失败',
    }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('Page render failed', error, errorInfo)
  }

  componentDidUpdate(previousProps: PageErrorBoundaryProps) {
    if (previousProps.pageKey !== this.props.pageKey && this.state.message) {
      this.setState({ message: '' })
    }
  }

  render() {
    if (this.state.message) {
      return (
        <section className="dashboard-feedback error" role="alert">
          页面加载失败：{this.state.message}
        </section>
      )
    }
    return this.props.children
  }
}

type TranslationKey =
  | 'app.brandName'
  | 'app.productName'
  | 'common.cancel'
  | 'common.close'
  | 'common.create'
  | 'common.delete'
  | 'common.refresh'
  | 'common.viewAll'
  | 'common.notSet'
  | 'common.none'
  | 'access.deniedTitle'
  | 'access.deniedDescription'
  | 'settings.open'
  | 'settings.title'
  | 'settings.account'
  | 'settings.language'
  | 'settings.timeZone'
  | 'settings.timeZoneHint'
  | 'settings.logout'
  | 'dashboard.aria'
  | 'dashboard.announcement'
  | 'dashboard.todo'
  | 'dashboard.unreadNotifications'
  | 'dashboard.todaySchedule'
  | 'dashboard.addTodo'
  | 'dashboard.addSchedule'
  | 'dashboard.publishAnnouncement'
  | 'dashboard.myTodos'
  | 'dashboard.messages'
  | 'dashboard.mySchedule'
  | 'dashboard.companyAnnouncements'
  | 'dashboard.noTodos'
  | 'dashboard.noNotifications'
  | 'dashboard.noSchedules'
  | 'dashboard.noAnnouncements'
  | 'dashboard.goHandle'
  | 'dashboard.handle'
  | 'dashboard.read'
  | 'dashboard.publish'
  | 'dashboard.add'
  | 'dashboard.title'
  | 'dashboard.content'
  | 'dashboard.start'
  | 'dashboard.end'
  | 'dashboard.note'
  | 'dashboard.assignees'
  | 'dashboard.assigneeRequired'
  | 'dashboard.selectAssignees'
  | 'dashboard.todoCreated'
  | 'dashboard.todoRequired'
  | 'dashboard.createdAt'
  | 'dashboard.scheduleDetail'
  | 'dashboard.deleteSchedule'
  | 'dashboard.deleteScheduleTitle'
  | 'dashboard.deleteScheduleConfirm'
  | 'dashboard.scheduleCreated'
  | 'dashboard.scheduleDeleted'
  | 'dashboard.scheduleRequired'
  | 'dashboard.scheduleTimeInvalid'
  | 'dashboard.announcementDeniedTitle'
  | 'dashboard.announcementDenied'
  | 'dashboard.announcementRequired'
  | 'dashboard.announcementCreated'
  | 'dashboard.notificationHandled'
  | 'dashboard.operationFailed'
  | 'dashboard.deadline'
  | 'dashboard.noNote'
  | 'dashboard.pendingConfirm'
  | 'dashboard.countdownPrefix'
  | 'dashboard.inProgress'
  | 'dashboard.ended'
  | 'dashboard.minutes'
  | 'dashboard.hours'
  | 'dashboard.days'
  | 'dashboard.minutesShort'
  | 'dashboard.hoursShort'
  | 'dashboard.daysShort'
  | 'dashboard.secondsShort'
  | 'status.completed'
  | 'status.pending'
  | 'severity.high'
  | 'severity.urgent'
  | 'severity.warning'
  | 'todo.approval'
  | 'todo.followup'
  | 'todo.manual'
  | 'todo.system'
  | 'todo.assignedToMe'
  | 'todo.selfCreated'
  | 'page.businessModule'
  | 'page.personalWorkbench'

const appSettingsStorageKey = 'yuanjing_app_settings'

const fallbackI18nConfig: I18nConfig = {
  default_language: 'zh-CN',
  supported_languages: [
    { code: 'zh-CN', label: '中文', description: 'UTC+8 / Asia Shanghai', time_zone: 'Asia/Shanghai' },
    { code: 'en-US', label: 'English', description: 'UTC', time_zone: 'UTC' },
  ],
  messages: {
    'zh-CN': {},
    'en-US': {},
  },
  path_labels: {},
  page_titles: {},
  sidebar_groups: {},
}

let runtimeI18nConfig: I18nConfig = fallbackI18nConfig

function timeZoneForLanguage(language: AppLanguage, config: I18nConfig = runtimeI18nConfig): AppTimeZone {
  return (
    config.supported_languages.find((option) => option.code === language)?.time_zone ??
    (language === 'en-US' ? 'UTC' : 'Asia/Shanghai')
  )
}

function normalizeAppSettings(value: Partial<AppSettings> | null, config: I18nConfig = runtimeI18nConfig): AppSettings {
  const languages = new Set(config.supported_languages.map((option) => option.code))
  const defaultLanguage = languages.has(config.default_language) ? config.default_language : 'zh-CN'
  const language = value?.language && languages.has(value.language) ? value.language : defaultLanguage
  return { language, timeZone: timeZoneForLanguage(language, config) }
}

function readAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(appSettingsStorageKey)
    return normalizeAppSettings(raw ? JSON.parse(raw) : null)
  } catch {
    return normalizeAppSettings(null)
  }
}

function saveAppSettings(settings: AppSettings) {
  localStorage.setItem(appSettingsStorageKey, JSON.stringify(settings))
}

let runtimeSettings: AppSettings = normalizeAppSettings(null)

function applyRuntimeSettings(settings: AppSettings, config: I18nConfig = runtimeI18nConfig) {
  runtimeSettings = settings
  runtimeI18nConfig = config
}

const fallbackTranslations: Record<AppLanguage, Partial<Record<TranslationKey, string>>> = {
  'zh-CN': {
    'app.brandName': '新裴贸易',
    'app.productName': '业务管理系统',
    'common.close': '关闭',
    'common.refresh': '刷新',
    'common.viewAll': '查看全部',
    'access.deniedTitle': '暂无访问权限',
    'access.deniedDescription': '当前账号未开通该模块，请联系超级管理员配置权限。',
    'dashboard.addTodo': '新增待办',
    'dashboard.assignees': '指派人',
    'dashboard.assigneeRequired': '请选择指派人',
    'dashboard.mySchedule': '我的日程',
    'dashboard.operationFailed': '操作失败',
    'dashboard.selectAssignees': '选择指派人',
    'dashboard.todoCreated': '待办已创建',
    'dashboard.todoRequired': '请填写待办标题和内容',
    'page.businessModule': '业务模块',
    'page.personalWorkbench': '个人工作台',
    'settings.title': '系统设置',
    'todo.assignedToMe': '别人给我的',
    'todo.manual': '手动',
    'todo.selfCreated': '我创建的',
  },
  'en-US': {
    'app.brandName': 'Xinpei Trade',
    'app.productName': 'Business Management',
    'common.close': 'Close',
    'common.refresh': 'Refresh',
    'common.viewAll': 'View all',
    'access.deniedTitle': 'No access',
    'access.deniedDescription': 'This account does not have access to this module. Contact a super administrator.',
    'dashboard.addTodo': 'New task',
    'dashboard.assignees': 'Assignees',
    'dashboard.assigneeRequired': 'Select at least one assignee',
    'dashboard.mySchedule': 'My schedule',
    'dashboard.operationFailed': 'Operation failed',
    'dashboard.selectAssignees': 'Select assignees',
    'dashboard.todoCreated': 'Task created',
    'dashboard.todoRequired': 'Enter a task title and content',
    'page.businessModule': 'Business module',
    'page.personalWorkbench': 'Personal workbench',
    'settings.title': 'Settings',
    'todo.assignedToMe': 'Assigned to me',
    'todo.manual': 'Manual',
    'todo.selfCreated': 'Created by me',
  },
}

function t(key: TranslationKey, settings: AppSettings = runtimeSettings) {
  return runtimeI18nConfig.messages[settings.language]?.[key] ?? fallbackTranslations[settings.language]?.[key] ?? key
}

function timeZoneLabel(settings: AppSettings = runtimeSettings) {
  return (
    runtimeI18nConfig.supported_languages.find((option) => option.code === settings.language)?.description ??
    (settings.timeZone === 'UTC' ? 'UTC' : 'UTC+8 / Asia Shanghai')
  )
}

function joinDisplay(values: string[], settings: AppSettings = runtimeSettings) {
  return values.join(settings.language === 'en-US' ? ', ' : '、')
}

function translatePathLabel(path: string, fallback: string, settings: AppSettings = runtimeSettings) {
  return runtimeI18nConfig.path_labels[path]?.[settings.language] ?? fallback
}

function groupLabel(id: string, fallback: string, settings: AppSettings = runtimeSettings) {
  return runtimeI18nConfig.sidebar_groups[id]?.[settings.language] ?? fallback
}

const menuIconMap: Record<string, LucideIcon> = {
  'bar-chart-3': BarChart3,
  'calendar-clock': CalendarClock,
  'check-circle': CheckCircle2,
  'clipboard-check': ClipboardCheck,
  factory: Factory,
  'file-pen-line': FilePenLine,
  'file-stack': FileStack,
  'file-text': FileText,
  'flask-conical': FlaskConical,
  handshake: Handshake,
  images: Images,
  package: Package,
  search: Search,
  send: Send,
  users: UsersRound,
  wallet: Wallet,
  warehouse: Warehouse,
}

const workflowLabelByPath: Record<string, { 'zh-CN': string; 'en-US': string }> = {
  [dashboardPath]: { 'zh-CN': '工作台', 'en-US': 'Workbench' },
  [exportContractPath]: { 'zh-CN': '订单中心', 'en-US': 'Order workflow' },
  [purchaseContractPath]: { 'zh-CN': '采购合同', 'en-US': 'Purchase contracts' },
  [qualityInspectionPath]: { 'zh-CN': 'QC 中心', 'en-US': 'QC center' },
  [followupPath]: { 'zh-CN': '跟单中心', 'en-US': 'Follow-up center' },
  [productPath]: { 'zh-CN': '产品资料', 'en-US': 'Products' },
  [supplierPath]: { 'zh-CN': '工厂资料', 'en-US': 'Factories' },
  [customerPath]: { 'zh-CN': '客户资料', 'en-US': 'Customers' },
  [warehouseInboundOrderPath]: { 'zh-CN': '入仓', 'en-US': 'Inbound' },
  [financePath]: { 'zh-CN': '财务摘要', 'en-US': 'Finance summary' },
  [reportingPath]: { 'zh-CN': '老板看板', 'en-US': 'Executive board' },
}

const workflowPageTitleByPath: Record<string, { 'zh-CN': string; 'en-US': string }> = {
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

const workflowIconByPath: Record<string, LucideIcon> = {
  [exportContractPath]: ClipboardCheck,
  [purchaseContractPath]: FileText,
  [qualityInspectionPath]: ShieldCheck,
  [followupPath]: CheckCircle2,
  [productPath]: Package,
  [supplierPath]: Factory,
  [customerPath]: UsersRound,
  [warehouseInboundOrderPath]: Warehouse,
  [financePath]: Coins,
  [reportingPath]: BarChart3,
}

const lockedWorkflowPaths = new Set([
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

const sidebarNavGroups: Array<{
  id: string
  label: string
  icon: LucideIcon
  paths: string[]
}> = [
  {
    id: 'masterdata',
    label: '基础资料',
    icon: Package,
    paths: [productPath, supplierPath, customerPath, partnerPath, documentPartyPath],
  },
  {
    id: 'workflow',
    label: '订单 Workflow',
    icon: ClipboardCheck,
    paths: [exportContractPath, purchaseContractPath, exportQuotationPath, shipmentPath],
  },
  {
    id: 'taskCenter',
    label: 'QC / 跟单',
    icon: ShieldCheck,
    paths: [qualityInspectionPath, followupPath, sampleRecordPath, sampleRequestPath, sampleDeliveryPath],
  },
  {
    id: 'warehouse',
    label: '仓库',
    icon: Warehouse,
    paths: [
      warehouseInboundOrderPath,
      warehouseInboundPlanPath,
      warehouseOutboundPlanPath,
      warehouseOutboundOrderPath,
    ],
  },
  {
    id: 'finance',
    label: '财务经营',
    icon: BarChart3,
    paths: [financePath, reportingPath],
  },
  {
    id: 'system',
    label: '系统设置',
    icon: Settings,
    paths: [organizationUsersPath],
  },
  {
    id: 'legacyPurchase',
    label: '暂缓模块',
    icon: LockKeyhole,
    paths: [purchaseInquiryPath, purchaseInvoiceNoticePath],
  },
]

function resolveMenuIcon(item: MenuItem) {
  if (item.path === dashboardPath) return LayoutDashboard
  if (workflowIconByPath[item.path]) return workflowIconByPath[item.path]
  return menuIconMap[item.icon] ?? LayoutDashboard
}

function workflowLabel(path: string, fallback: string, settings: AppSettings = runtimeSettings) {
  return workflowLabelByPath[path]?.[settings.language] ?? translatePathLabel(path, fallback, settings)
}

const superAdminPermission = 'system:super_admin'

function authenticatedPath(path: string) {
  return path && path !== loginPath ? path : dashboardPath
}

function canAccessPath(path: string, session: AuthSession) {
  const normalizedPath = authenticatedPath(path)
  if (dashboardSectionPaths.has(normalizedPath)) {
    return session.menus.some((item) => item.path === dashboardPath)
  }
  if (isFinancePath(normalizedPath)) {
    return session.menus.some((item) => item.path === financePath)
  }
  return session.menus.some((item) => item.path === detailRootPath(normalizedPath))
}

function isMenuPathActive(menuPath: string, activePath: string) {
  if (menuPath === financePath) return isFinancePath(activePath)
  return menuPath === detailRootPath(activePath)
}

function firstAccessiblePath(session: AuthSession) {
  return session.menus.find((item) => item.path === dashboardPath)?.path ?? session.menus[0]?.path ?? null
}

function permittedPath(path: string, session: AuthSession) {
  const normalizedPath = authenticatedPath(path)
  if (canAccessPath(normalizedPath, session)) return normalizedPath
  return firstAccessiblePath(session)
}

function canCreateAnnouncement(user: CurrentUser) {
  return user.permissions.includes(superAdminPermission)
}

function getSidebarMenuGroups(menus: MenuItem[]) {
  const menuByPath = new Map(menus.map((item) => [item.path, item]))
  const groupedPaths = new Set<string>()
  const groups = sidebarNavGroups
    .map((group) => {
      const items = group.paths
        .map((path) => menuByPath.get(path))
        .filter((item): item is MenuItem => Boolean(item))

      items.forEach((item) => groupedPaths.add(item.path))

      return { ...group, items }
    })
    .filter((group) => group.items.length > 0)
  const otherItems = menus.filter((item) => item.path !== dashboardPath && !groupedPaths.has(item.path))

  if (otherItems.length === 0) return groups

  return [
    ...groups,
    {
      id: 'other',
      label: '其他',
      icon: LayoutDashboard,
      paths: [],
      items: otherItems,
    },
  ]
}

function topbarEyebrow(path: string): string {
  const rootPath = detailRootPath(path)
  if (dashboardSectionPaths.has(rootPath)) return t('page.personalWorkbench')
  const group = sidebarNavGroups.find((item) => item.paths.includes(rootPath))
  if (group) return groupLabel(group.id, group.label)
  return t('page.businessModule')
}

type BankReceiptFormState = {
  receipt_no: string
  received_at: string
  payer_name: string
  customer_id: string
  customer_name: string
  amount: string
  currency: string
  bank_account: string
  reference_no: string
  receipt_type: string
  remark: string
}

type ReceiptClaimFormState = {
  claimed_at: string
  sales_user_id: string
  sales_user_name: string
  note: string
}

type ReceiptAllocationFormState = {
  allocation_type: string
  contract_id: string
  contract_no: string
  invoice_no: string
  allocated_at: string
  amount: string
  currency: string
  remark: string
}

type SupplierInvoiceFormState = {
  invoice_no: string
  invoice_date: string
  supplier_id: string
  supplier_name: string
  purchase_invoice_notice_id: string
  purchase_invoice_notice_code: string
  purchase_contract_id: string
  purchase_contract_no: string
  total_amount: string
  currency: string
  due_date: string
  remark: string
}

type PaymentRequestFormState = {
  request_no: string
  supplier_invoice_id: string
  payment_type: string
  request_date: string
  requested_amount: string
  currency: string
  remark: string
}

type PaymentApprovalFormState = {
  approved_amount: string
  approved_at: string
  reviewer_name: string
  payment_account: string
  remark: string
}

type PartnerFeeInvoiceFormState = {
  invoice_no: string
  invoice_date: string
  partner_id: string
  partner_name: string
  partner_type: string
  shipment_plan_id: string
  shipment_no: string
  sales_user_id: string
  sales_user_name: string
  fee_type: string
  total_amount: string
  currency: string
  due_date: string
  remark: string
}

type FeePaymentRequestFormState = {
  request_no: string
  partner_fee_invoice_id: string
  request_date: string
  requested_amount: string
  currency: string
  remark: string
}

type FeePaymentApprovalFormState = {
  approved_amount: string
  approved_at: string
  reviewer_name: string
  payment_account: string
  remark: string
}

type VerificationDocumentFormState = {
  document_no: string
  received_at: string
  owner_user_id: string
  owner_user_name: string
  shipment_plan_id: string
  shipment_no: string
  customer_name: string
  currency: string
  refundable_amount: string
  valid_until: string
  remark: string
}

type CustomsReceiptFormState = {
  customs_declaration_no: string
  customs_receipt_no: string
  received_at: string
  remark: string
}

type VerificationRegisterFormState = {
  verification_no: string
  verified_at: string
  remark: string
}

type TaxRefundFormState = {
  refund_no: string
  refunded_at: string
  amount: string
  currency: string
  bank_receipt_no: string
  remark: string
}

type MiscFeeItemFormState = {
  code: string
  name: string
  category: string
  default_allocation_method: string
  is_active: boolean
  remark: string
}

type MiscFeeAllocationFormState = {
  allocation_no: string
  item_id: string
  shipment_plan_id: string
  shipment_no: string
  sales_user_id: string
  sales_user_name: string
  allocated_at: string
  amount: string
  currency: string
  allocation_method: string
  basis: string
  remark: string
}

type FinancialSettlementFormState = {
  settlement_no: string
  shipment_plan_id: string
  shipment_no: string
  settlement_date: string
  remark: string
}

type ManualProfitCostFormState = {
  cost_no: string
  cost_type: string
  cost_date: string
  amount: string
  currency: string
  source_no: string
  reason: string
  remark: string
}

type SampleRequestFormState = {
  code: string
  status: string
  request_date: string
  due_date: string
  customer_id: string
  customer_name: string
  product_id: string
  product_code: string
  product_name: string
  supplier_id: string
  supplier_name: string
  sales_user_id: string
  sales_user_name: string
  destination: string
  requirements: string
  line_product_id: string
  line_product_code: string
  line_product_name: string
  line_specification: string
  line_quantity: string
  line_unit: string
  line_requirement: string
}

type SampleProgressFormState = {
  stage: string
  status: string
  occurred_at: string
  handler_name: string
  note: string
}

type SampleFeeFormState = {
  fee_type: string
  amount: string
  currency: string
  payee_type: string
  payee_name: string
  remark: string
}

type SampleRecordFormState = {
  code: string
  sample_type: string
  status: string
  quantity: string
  received_at: string
  submitted_at: string
  product_id: string
  product_code: string
  product_name: string
  customer_id: string
  customer_name: string
  supplier_id: string
  supplier_name: string
  customer_sku: string
  supplier_sku: string
  purchase_contract_id: string
  purchase_contract_no: string
  unit: string
  source_type: string
  source_id: string
  source_code: string
  source_note: string
  description: string
  image_file_id: string
  image_filename: string
  image_url: string
  image_caption: string
}

type SampleRecordImageFormState = {
  file_id: string
  filename: string
  url: string
  caption: string
}

type SampleRecordStockFormState = {
  event_type: string
  quantity: string
  occurred_at: string
  unit: string
  delivery_no: string
  recipient: string
  note: string
}

type SampleDeliveryFormState = {
  code: string
  delivery_date: string
  customer_id: string
  customer_name: string
  supplier_id: string
  supplier_name: string
  factory_id: string
  factory_name: string
  recipient_name: string
  recipient_company: string
  recipient_address: string
  express_company: string
  tracking_no: string
  quote_id: string
  quote_no: string
  remark: string
  sample_record_id: string
  sample_code: string
  sample_type: string
  product_id: string
  product_code: string
  product_name: string
  quantity: string
  unit: string
  line_remark: string
  fee_type: string
  fee_amount: string
  fee_currency: string
  fee_payer_type: string
  fee_remark: string
}

type SampleDeliveryApproveFormState = {
  reviewer_name: string
  approved_at: string
}

type SampleDeliveryTrackingFormState = {
  express_company: string
  tracking_no: string
  status: string
}

type ExportQuotationFormState = {
  code: string
  quote_date: string
  customer_id: string
  customer_name: string
  sales_user_id: string
  sales_user_name: string
  currency: string
  trade_term: string
  valid_until: string
  description: string
  product_id: string
  product_code: string
  product_name: string
  specification: string
  model: string
  quantity: string
  unit: string
  unit_price: string
  freight_method: string
  freight_amount: string
  purchase_reference_supplier_name: string
  purchase_reference_price: string
  line_remark: string
}

type ExportQuotationApproveFormState = {
  reviewer_name: string
  approved_at: string
}

type ExportQuotationContractFormState = {
  confirmed_at: string
  contract_no: string
}

type ExportContractFormState = {
  code: string
  contract_date: string
  customer_id: string
  customer_name: string
  sales_user_id: string
  sales_user_name: string
  currency: string
  trade_term: string
  planned_ship_date: string
  payment_terms: string
  source_quotation_id: string
  source_quotation_no: string
  remarks: string
  product_id: string
  product_code: string
  product_name: string
  specification: string
  model: string
  quantity: string
  unit: string
  unit_price: string
  purchased_quantity: string
  shipped_quantity: string
  image_url: string
  line_remark: string
}

type ExportContractApproveFormState = {
  reviewer_name: string
  approved_at: string
}

type ExportContractSignatureFormState = {
  signed_by: string
  signed_at: string
  signature_method: string
  file_no: string
  remark: string
}

type ExportContractAdvancePaymentFormState = {
  payment_no: string
  received_at: string
  amount: string
  currency: string
  payer_name: string
  remark: string
}

type ShipmentFormState = {
  code: string
  shipment_date: string
  planned_ship_date: string
  shipping_method: string
  contract_id_a: string
  contract_quantity_a: string
  contract_id_b: string
  contract_quantity_b: string
  port_of_loading: string
  port_of_destination: string
  vessel_name: string
  container_no: string
  booking_no: string
  document_owner_name: string
  estimated_payable_amount: string
  remarks: string
}

type ShipmentApproveFormState = {
  reviewer_name: string
  approved_at: string
}

type PurchaseInquiryFormState = {
  code: string
  inquiry_date: string
  buyer_user_id: string
  buyer_user_name: string
  remarks: string
  product_id: string
  product_code: string
  product_name: string
  specification: string
  model: string
  quantity: string
  unit: string
}

type PurchaseQuotationFormState = {
  supplier_id: string
  supplier_name: string
  quoted_at: string
  unit_price: string
  currency: string
  lead_time_days: string
  min_order_quantity: string
  sample_available: boolean
  remark: string
}

type PurchaseInquiryTemplateFormState = {
  template_name: string
  recipient_emails: string
}

type PurchaseContractFormState = {
  code: string
  contract_date: string
  supplier_id: string
  supplier_name: string
  buyer_user_id: string
  buyer_user_name: string
  currency: string
  delivery_date: string
  payment_terms: string
  source_type: PurchaseContractCreatePayload['source_type']
  remarks: string
  product_id: string
  product_code: string
  product_name: string
  specification: string
  model: string
  quantity: string
  unit: string
  unit_price: string
  source_export_contract_id: string
  source_export_contract_no: string
  source_export_contract_line_id: string
  line_remark: string
}

type PurchaseContractGenerateFormState = {
  code: string
  contract_date: string
  source_contract_id_a: string
  source_contract_id_b: string
  supplier_id: string
  supplier_name: string
  buyer_user_id: string
  buyer_user_name: string
  currency: string
  delivery_date: string
  unit_price: string
  payment_terms: string
  remarks: string
}

type PurchaseContractApproveFormState = {
  reviewer_name: string
  approved_at: string
}

type PurchaseInvoiceNoticeFormState = {
  customs_declaration_id: string
  customs_declaration_no: string
  declaration_date: string
  notice_date: string
  currency: string
  remarks: string
  supplier_id_a: string
  supplier_name_a: string
  purchase_contract_id_a: string
  purchase_contract_no_a: string
  product_id_a: string
  product_code_a: string
  product_name_a: string
  customs_name_a: string
  invoice_name_a: string
  quantity_a: string
  unit_a: string
  amount_a: string
  remark_a: string
  supplier_id_b: string
  supplier_name_b: string
  purchase_contract_id_b: string
  purchase_contract_no_b: string
  product_id_b: string
  product_code_b: string
  product_name_b: string
  customs_name_b: string
  invoice_name_b: string
  quantity_b: string
  unit_b: string
  amount_b: string
  remark_b: string
}

type PurchaseInvoiceNoticeSendFormState = {
  sender_name: string
  sent_at: string
}

type PurchaseInvoiceNoticeReceiveFormState = {
  tax_invoice_no: string
  received_at: string
}

type FollowupTemplateFormState = {
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

type FollowupPlanFormState = {
  purchase_contract_id: string
  as_of: string
}

type FollowupSourceEventFormState = {
  purchase_contract_id: string
  node_code: string
  source_record_type: string
  source_record_id: string
  actual_date: string
  source_summary: string
}

type QualityInspectionFormState = {
  code: string
  purchase_contract_id: string
  inspected_at: string
  result: string
  inspector_id: string
  inspector_name: string
  issue_summary: string
  attachment_group_id: string
  purchase_contract_line_id: string
  product_id: string
  product_code: string
  product_name: string
  inspected_quantity: string
  failed_quantity: string
  unit: string
  line_result: string
  line_remark: string
  issue_type: string
  severity: string
  description: string
  corrective_action: string
  issue_status: string
  issue_attachment_group_id: string
}

type InboundPlanGenerateFormState = {
  purchase_contract_id: string
  inbound_type: string
  planned_date: string
}

type InboundPlanScheduleFormState = {
  planned_date: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

type InboundOrderFormState = {
  plan_id: string
  code: string
  inbound_mode: string
  inbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

type InboundOrderApprovalFormState = {
  reviewer_name: string
  approved_at: string
}

type OutboundPlanGenerateFormState = {
  shipment_plan_id: string
  outbound_type: string
  planned_date: string
}

type OutboundPlanScheduleFormState = {
  planned_date: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

type OutboundOrderFormState = {
  plan_id: string
  code: string
  outbound_mode: string
  outbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  exception_reason: string
}

type OutboundOrderApprovalFormState = {
  reviewer_name: string
  approved_at: string
  allow_negative: boolean
}

type NavigateToModule = (path: string) => void

type ModuleNavigationProps = {
  onNavigate: NavigateToModule
}

type RoutedDetailPageProps = ModuleNavigationProps & {
  detailId: string | null
}

type OperationFlowKind = 'sales' | 'purchase' | 'warehouse' | 'finance'

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

const operationFlows: Record<OperationFlowKind, { title: string; steps: OperationFlowStep[] }> = {
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

function OperationFlowRail({ activeLabel, activePath, kind, onNavigate }: OperationFlowProps) {
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

function App() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [activePath, setActivePath] = useState(window.location.pathname || dashboardPath)
  const [booting, setBooting] = useState(true)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [error, setError] = useState('')
  const [i18nConfig, setI18nConfig] = useState<I18nConfig>(fallbackI18nConfig)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => readAppSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsAvatarDraft, setSettingsAvatarDraft] = useState<UserAvatarPickerValue | null>(null)
  const [savingSettingsAvatar, setSavingSettingsAvatar] = useState(false)

  applyRuntimeSettings(appSettings, i18nConfig)

  const antdLocale = appSettings.language === 'en-US' ? enUS : zhCN

  function replaceRoute(path: string) {
    if (window.location.pathname !== path) {
      window.history.replaceState({}, '', path)
    }
    setActivePath(path)
  }

  function redirectToLogin(message?: string) {
    clearAuthToken()
    setSession(null)
    setDashboard(null)
    setSettingsOpen(false)
    if (message) setError(message)
    replaceRoute(loginPath)
  }

  useEffect(() => {
    saveAppSettings(appSettings)
    document.documentElement.lang = appSettings.language
  }, [appSettings])

  useEffect(() => {
    const onPopState = () => {
      if (!hasAuthToken()) {
        replaceRoute(loginPath)
        return
      }
      if (session) {
        const nextPath = permittedPath(window.location.pathname || dashboardPath, session)
        if (nextPath) {
          replaceRoute(nextPath)
          return
        }
      }
      setActivePath(authenticatedPath(window.location.pathname || dashboardPath))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [session])

  useEffect(() => {
    const onAuthExpired = () => redirectToLogin('登录状态已失效')
    window.addEventListener(authExpiredEventName, onAuthExpired)
    return () => window.removeEventListener(authExpiredEventName, onAuthExpired)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      let nextI18nConfig = fallbackI18nConfig
      try {
        nextI18nConfig = await getI18nConfig()
        if (cancelled) return
        setI18nConfig(nextI18nConfig)
        setAppSettings((current) => normalizeAppSettings(current, nextI18nConfig))
      } catch (caught) {
        if (!cancelled) {
          showError(caught, '系统配置加载失败')
        }
      }

      if (!hasAuthToken()) {
        replaceRoute(loginPath)
        setBooting(false)
        return
      }
      try {
        const current = await getCurrentSession()
        if (cancelled) return
        const nextSession: AuthSession = {
          access_token: localStorage.getItem('yuanjing_access_token') ?? '',
          token_type: 'bearer',
          user: current.user,
          menus: current.menus,
        }
        setSession(nextSession)
        replaceRoute(permittedPath(window.location.pathname || dashboardPath, nextSession) ?? dashboardPath)
      } catch (caught) {
        if (!cancelled) {
          redirectToLogin(caught instanceof Error ? caught.message : '登录状态已失效')
        }
      } finally {
        if (!cancelled) setBooting(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (booting) return
    if (!session && activePath !== loginPath) {
      replaceRoute(loginPath)
      return
    }
    if (session && activePath === loginPath) {
      replaceRoute(firstAccessiblePath(session) ?? dashboardPath)
      return
    }
    if (session && !canAccessPath(activePath, session)) {
      const fallbackPath = firstAccessiblePath(session)
      if (fallbackPath) replaceRoute(fallbackPath)
    }
  }, [activePath, booting, session])

  useEffect(() => {
    if (!session || !dashboardSectionPaths.has(activePath)) return
    void loadDashboard()
  }, [session, activePath])

  useEffect(() => {
    if (!settingsOpen || !session) return
    setSettingsAvatarDraft({
      avatar_type: session.user.avatar_type,
      avatar_value: session.user.avatar_value || defaultAvatarPreset,
    })
  }, [settingsOpen, session])

  const activeMenu = useMemo(() => {
    if (!session) return null
    if (dashboardSectionPaths.has(activePath)) {
      return session.menus.find((item) => item.path === dashboardPath) ?? null
    }
    if (isFinancePath(activePath)) {
      return session.menus.find((item) => item.path === financePath) ?? null
    }
    return session.menus.find((item) => item.path === detailRootPath(activePath)) ?? null
  }, [activePath, session])

  async function loadDashboard() {
    setLoadingDashboard(true)
    setError('')
    try {
      setDashboard(await getDashboard())
    } catch (caught) {
      showError(caught, `${t('dashboard.mySchedule')} ${t('dashboard.operationFailed')}`)
    } finally {
      setLoadingDashboard(false)
    }
  }

  function updateLanguage(language: AppLanguage) {
    setAppSettings(normalizeAppSettings({ language }, i18nConfig))
  }

  async function saveCurrentUserAvatar() {
    if (!session || !settingsAvatarDraft) return
    setSavingSettingsAvatar(true)
    setError('')
    try {
      const current = await updateCurrentUserAvatar(settingsAvatarDraft)
      setSession({
        ...session,
        user: current.user,
        menus: current.menus,
      })
    } catch (caught) {
      showError(caught, '头像保存失败')
    } finally {
      setSavingSettingsAvatar(false)
    }
  }

  function navigate(path: string) {
    if (!session) {
      replaceRoute(loginPath)
      return
    }
    const nextPath = permittedPath(path, session)
    if (!nextPath) {
      setError(t('access.deniedDescription'))
      return
    }
    setError('')
    window.history.pushState({}, '', nextPath)
    setActivePath(nextPath)
  }

  function logout() {
    clearAuthToken()
    setSession(null)
    setDashboard(null)
    setSettingsOpen(false)
    replaceRoute(loginPath)
  }

  if (booting) {
    return (
      <ConfigProvider locale={antdLocale}>
        <main className="login-shell">
          <section className="login-panel" aria-label={t('dashboard.mySchedule')}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </section>
        </main>
      </ConfigProvider>
    )
  }

  if (!session) {
    return (
      <ConfigProvider locale={antdLocale} theme={erpAntTheme}>
        <LoginPage
          error={error}
          onLogin={(nextSession) => {
            setSession(nextSession)
            setDashboard(null)
            replaceRoute(permittedPath(dashboardPath, nextSession) ?? dashboardPath)
          }}
        />
      </ConfigProvider>
    )
  }

  const dashboardMenu = session.menus.find((item) => item.path === dashboardPath)
  const sidebarMenuGroups = getSidebarMenuGroups(session.menus)
  const isDashboardActive = dashboardSectionPaths.has(activePath)
  const isDashboardHome = activePath === dashboardPath
  const canViewActivePath = canAccessPath(activePath, session)

  return (
    <ConfigProvider locale={antdLocale} theme={erpAntTheme}>
      <>
        <main className={isDashboardHome ? 'react-shell react-shell-home' : 'react-shell'}>
          <aside className="react-sidebar">
          <div className="brand" aria-label={`${t('app.brandName')} ${t('app.productName')}`}>
            <div className="brand-wordmark" aria-label="D-DUTCH">D-DUTCH</div>
            <div>
              <strong>{t('app.brandName')}</strong>
              <span>{t('app.productName')}</span>
            </div>
          </div>

          <nav className="react-nav" aria-label="主导航">
            {dashboardMenu ? (
              <a
                aria-current={isDashboardActive ? 'page' : undefined}
                className={isDashboardActive ? 'nav-link nav-dashboard active' : 'nav-link nav-dashboard'}
                href={dashboardMenu.path}
                onClick={(event) => {
                  event.preventDefault()
                  navigate(dashboardMenu.path)
                }}
              >
                <LayoutDashboard className="nav-link-icon" size={17} strokeWidth={2} />
                <span>{workflowLabel(dashboardMenu.path, dashboardMenu.label)}</span>
              </a>
            ) : null}

            <div className="nav-groups" aria-label={t('page.businessModule')}>
              {sidebarMenuGroups.map((group) => {
                const GroupIcon = group.icon
                const isGroupActive = group.items.some(
                  (item) => !lockedWorkflowPaths.has(item.path) && isMenuPathActive(item.path, activePath),
                )

                return (
                  <details className="nav-group" key={group.id} open={isGroupActive || undefined}>
                    <summary className="nav-group-summary">
                      <GroupIcon size={16} strokeWidth={2} />
                      <span>{groupLabel(group.id, group.label)}</span>
                      <ChevronDown className="nav-group-chevron" size={15} />
                    </summary>
                    <div className="nav-group-items">
                      {group.items.map((item) => {
                        const MenuIcon = resolveMenuIcon(item)
                        const isLocked = lockedWorkflowPaths.has(item.path)
                        const isActive = !isLocked && isMenuPathActive(item.path, activePath)
                        const itemLabel = workflowLabel(item.path, item.label)

                        if (isLocked) {
                          return (
                            <button
                              key={item.id}
                              aria-disabled="true"
                              className="nav-link nav-link-locked"
                              title={`${itemLabel} 暂不进入主流程`}
                              type="button"
                              disabled
                            >
                              <MenuIcon className="nav-link-icon" size={16} strokeWidth={2} />
                              <span>{itemLabel}</span>
                              <LockKeyhole className="nav-lock-icon" size={13} strokeWidth={2.2} />
                            </button>
                          )
                        }

                        return (
                          <a
                            key={item.id}
                            aria-current={isActive ? 'page' : undefined}
                            className={isActive ? 'nav-link active' : 'nav-link'}
                            href={item.path}
                            onClick={(event) => {
                              event.preventDefault()
                              navigate(item.path)
                            }}
                          >
                            <MenuIcon className="nav-link-icon" size={16} strokeWidth={2} />
                            <span>{itemLabel}</span>
                          </a>
                        )
                      })}
                    </div>
                  </details>
                )
              })}
            </div>
          </nav>

          </aside>

          <section className="react-workspace">
            <header className="react-topbar">
              <div>
                <p className="eyebrow">
                  {topbarEyebrow(activePath)}
                </p>
                <h1>{pageTitle(activePath, activeMenu)}</h1>
              </div>
              <div className="react-topbar-actions">
                <button
                  aria-label={t('settings.open')}
                  className="topbar-settings-button"
                  title={t('settings.open')}
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings size={22} strokeWidth={2} />
                </button>
              </div>
            </header>

          {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

          <PageErrorBoundary pageKey={activePath}>
            {!canViewActivePath ? (
              <AccessDeniedPage />
            ) : activePath === dashboardPath ? (
              <DashboardPage
                currentUser={session.user}
                dashboard={dashboard}
                loading={loadingDashboard}
                canNavigatePath={(path) => canAccessPath(path, session)}
                onNavigate={navigate}
                onRefresh={loadDashboard}
              />
            ) : activePath === dashboardTodosPath ? (
              <DashboardTodosPage
                dashboard={dashboard}
                loading={loadingDashboard}
                canNavigatePath={(path) => canAccessPath(path, session)}
                onNavigate={navigate}
              />
            ) : activePath === dashboardSchedulesPath ? (
              <DashboardSchedulesPage dashboard={dashboard} loading={loadingDashboard} onRefresh={loadDashboard} />
            ) : activePath === dashboardNotificationsPath ? (
              <DashboardNotificationsPage dashboard={dashboard} loading={loadingDashboard} onRefresh={loadDashboard} />
            ) : activePath === dashboardAnnouncementsPath ? (
              <DashboardAnnouncementsPage dashboard={dashboard} loading={loadingDashboard} />
            ) : activePath === organizationUsersPath ? (
              <OrganizationUsersPage currentUser={session.user} translate={t} />
            ) : isProductPath(activePath) ? (
              <ProductsPage detailId={productDetailId(activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(customerPath, activePath) ? (
              <MasterdataCustomersPage detailId={moduleDetailId(customerPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(supplierPath, activePath) ? (
              <MasterdataSuppliersPage detailId={moduleDetailId(supplierPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(partnerPath, activePath) ? (
              <MasterdataPartnersPage detailId={moduleDetailId(partnerPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(documentPartyPath, activePath) ? (
              <MasterdataDocumentPartiesPage
                detailId={moduleDetailId(documentPartyPath, activePath)}
                onNavigate={navigate}
              />
            ) : isDetailPathFor(sampleRequestPath, activePath) ? (
              <SampleRequestsPage detailId={moduleDetailId(sampleRequestPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(sampleRecordPath, activePath) ? (
              <SampleRecordsPage detailId={moduleDetailId(sampleRecordPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(sampleDeliveryPath, activePath) ? (
              <SampleDeliveriesPage detailId={moduleDetailId(sampleDeliveryPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(exportQuotationPath, activePath) ? (
              <ExportQuotationsPage detailId={moduleDetailId(exportQuotationPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(exportContractPath, activePath) ? (
              <ExportContractsPage detailId={moduleDetailId(exportContractPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(shipmentPath, activePath) ? (
              <ShipmentsPage detailId={moduleDetailId(shipmentPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(purchaseInquiryPath, activePath) ? (
              <PurchaseInquiriesPage detailId={moduleDetailId(purchaseInquiryPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(purchaseContractPath, activePath) ? (
              <PurchaseContractsPage detailId={moduleDetailId(purchaseContractPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(purchaseInvoiceNoticePath, activePath) ? (
              <PurchaseInvoiceNoticesPage
                detailId={moduleDetailId(purchaseInvoiceNoticePath, activePath)}
                onNavigate={navigate}
              />
            ) : isDetailPathFor(followupPath, activePath) ? (
              <FollowupPage detailId={moduleDetailId(followupPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(qualityInspectionPath, activePath) ? (
              <QualityInspectionsPage detailId={moduleDetailId(qualityInspectionPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(warehouseInboundPlanPath, activePath) ? (
              <InboundPlansPage detailId={moduleDetailId(warehouseInboundPlanPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(warehouseInboundOrderPath, activePath) ? (
              <InboundOrdersPage detailId={moduleDetailId(warehouseInboundOrderPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(warehouseOutboundPlanPath, activePath) ? (
              <OutboundPlansPage detailId={moduleDetailId(warehouseOutboundPlanPath, activePath)} onNavigate={navigate} />
            ) : isDetailPathFor(warehouseOutboundOrderPath, activePath) ? (
              <OutboundOrdersPage detailId={moduleDetailId(warehouseOutboundOrderPath, activePath)} onNavigate={navigate} />
            ) : activePath === reportingPath ? (
              <ReportingPage onNavigate={navigate} />
            ) : isFinancePath(activePath) ? (
              <FinancePage view={parseFinanceView(activePath)} onNavigate={navigate} />
            ) : (
              <ModulePage menu={activeMenu} />
            )}
          </PageErrorBoundary>
          </section>
        </main>

        <Modal
          centered
          footer={null}
          open={settingsOpen}
          title={t('settings.title')}
          width={720}
          onCancel={() => setSettingsOpen(false)}
        >
          <section className="settings-window">
            <div className="settings-window-user">
              <UserAvatar
                avatarType={session.user.avatar_type}
                avatarValue={session.user.avatar_value}
                label={session.user.display_name}
                size="sm"
              />
              <div className="user-meta">
                <span>{t('settings.account')}</span>
                <strong>{session.user.display_name}</strong>
                <small>{session.user.department_name} · {joinDisplay(session.user.roles)}</small>
              </div>
            </div>

            {settingsAvatarDraft ? (
              <div className="settings-avatar-editor">
                <UserAvatarPicker
                  description="保存后会同步到当前账号和待办指派列表。"
                  label={session.user.display_name}
                  value={settingsAvatarDraft}
                  onChange={setSettingsAvatarDraft}
                />
                <button
                  className="secondary-inline"
                  disabled={savingSettingsAvatar}
                  type="button"
                  onClick={() => void saveCurrentUserAvatar()}
                >
                  保存头像
                </button>
              </div>
            ) : null}

            <div className="settings-field">
              <span>{t('settings.language')}</span>
              <div className="settings-language-options">
                {i18nConfig.supported_languages.map((option) => (
                  <button
                    className={option.code === appSettings.language ? 'active' : ''}
                    key={option.code}
                    type="button"
                    onClick={() => updateLanguage(option.code)}
                  >
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-field">
              <span>{t('settings.timeZone')}</span>
              <div className="settings-timezone">
                <strong>{timeZoneLabel(appSettings)}</strong>
                <small>{t('settings.timeZoneHint')}</small>
              </div>
            </div>

            <div className="modal-actions split">
              <button className="danger-inline" type="button" onClick={logout}>
                <LogOut size={15} />
                {t('settings.logout')}
              </button>
              <button className="secondary-inline" type="button" onClick={() => setSettingsOpen(false)}>
                {t('common.close')}
              </button>
            </div>
          </section>
        </Modal>
      </>
    </ConfigProvider>
  )
}

function LoginPage({
  error,
  onLogin,
}: {
  error: string
  onLogin: (session: AuthSession) => void
}) {
  const [username, setUsername] = useState('superadmin')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(error)
  const usernameValue = username.trim()
  const missingUsername = usernameValue.length === 0
  const missingPassword = password.length === 0
  const requiredMessage =
    missingUsername && missingPassword
      ? '请填写用户名和密码'
      : missingUsername
        ? '请填写用户名'
        : missingPassword
          ? '请填写密码'
          : ''
  const canSubmit = !requiredMessage && !submitting

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (requiredMessage) {
      setFormError(requiredMessage)
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const nextSession = await login(usernameValue, password)
      setAuthToken(nextSession.access_token)
      onLogin(nextSession)
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-stage" aria-label="新裴贸易业务管理系统登录">
        <div className="login-intro">
          <div className="login-editorial-brand" aria-label="D-DUTCH">
            D-DUTCH
          </div>

          <figure className="login-editorial-hero">
            <img src="/brand/d-dutch-studio.jpg" alt="D-DUTCH 样品展示空间" />
            <figcaption>
              <span>YOUR SOURCING</span>
              <span>PRODUCTION</span>
              <span>PARTNER FOR FASHION ACCESSORIES</span>
            </figcaption>
          </figure>

          <div className="login-editorial-footer">
            <span>BUSINESS ERP</span>
            <div>
              <strong>外贸业务管理后台</strong>
              <p>样品、销售、采购、仓库、财务与审批统一协作</p>
            </div>
          </div>
        </div>

        <section className="login-panel">
          <div className="login-panel-heading">
            <p className="eyebrow">账号登录</p>
            <h2>登陆</h2>
          </div>

          {formError ? (
            <SemiBanner
              bordered
              className="login-error"
              description={formError}
              title="登录未完成"
              type="danger"
            />
          ) : null}

          <form className="login-form" onSubmit={submit}>
            <label htmlFor="login-username">
              用户名
              <SemiInput
                id="login-username"
                autoComplete="username"
                prefix={<UserRound aria-hidden="true" size={16} />}
                showClear
                size="large"
                value={username}
                onChange={(value) => {
                  setUsername(value)
                  setFormError('')
                }}
              />
            </label>
            <label htmlFor="login-password">
              密码
              <SemiInput
                id="login-password"
                autoComplete="current-password"
                mode="password"
                prefix={<KeyRound aria-hidden="true" size={16} />}
                size="large"
                value={password}
                onChange={(value) => {
                  setPassword(value)
                  setFormError('')
                }}
              />
            </label>
            {requiredMessage ? <p className="login-form-hint">{requiredMessage}</p> : null}
            <SemiButton
              block
              className="login-submit"
              disabled={!canSubmit}
              htmlType="submit"
              icon={<LayoutDashboard size={16} />}
              loading={submitting}
              size="large"
              theme="solid"
              type="primary"
            >
              登录
            </SemiButton>
          </form>
        </section>
      </section>
    </main>
  )
}

type DashboardScheduleFormState = {
  title: string
  description: string
  starts_at: string
  ends_at: string
}

type DashboardAnnouncementFormState = {
  title: string
  content: string
}

type DashboardTodoFormState = {
  title: string
  content: string
  assignee_user_ids: string[]
}

function timeZoneOffsetMinutes(timeZone: AppTimeZone) {
  return timeZone === 'Asia/Shanghai' ? 8 * 60 : 0
}

function dateTimeLocalValue(date: Date, settings: AppSettings = runtimeSettings) {
  const zoned = new Date(date.getTime() + timeZoneOffsetMinutes(settings.timeZone) * 60_000)
  return zoned.toISOString().slice(0, 16)
}

function parseDateTimeLocal(value: string, settings: AppSettings = runtimeSettings) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  const utcMs =
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) -
    timeZoneOffsetMinutes(settings.timeZone) * 60_000
  return new Date(utcMs)
}

function dateTimeLocalToIso(value: string, settings: AppSettings = runtimeSettings) {
  return parseDateTimeLocal(value, settings)?.toISOString() ?? ''
}

function normalizeApiDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)) return value
  return `${value}Z`
}

function parseApiDate(value: string | null) {
  if (!value) return null
  const date = new Date(normalizeApiDateValue(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function dateParts(value: string | null, settings: AppSettings = runtimeSettings) {
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

function initialDashboardScheduleForm(): DashboardScheduleFormState {
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

function initialDashboardAnnouncementForm(): DashboardAnnouncementFormState {
  return { title: '', content: '' }
}

function initialDashboardTodoForm(currentUser?: CurrentUser): DashboardTodoFormState {
  return {
    title: '',
    content: '',
    assignee_user_ids: currentUser ? [currentUser.id] : [],
  }
}

function todoTargetPath(todo: TodoTask) {
  if (todo.source_type === 'followup') return followupPath
  if (todo.source_type === 'approval') return reportingPath
  return dashboardPath
}

function todoSourceLabel(value: string) {
  const labels: Record<string, string> = {
    approval: t('todo.approval'),
    followup: t('todo.followup'),
    manual: t('todo.manual'),
    system: t('todo.system'),
  }
  return labels[value] ?? value
}

function formatTime(value: string | null) {
  return dateParts(value)?.time ?? '-'
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

function scheduleCountdownLabel(startsAt: string | null, endsAt: string | null, nowMs: number) {
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

function DashboardScheduleTimeline({
  events,
  currentTimeMs,
  onSelect,
}: {
  events: ScheduleEvent[]
  currentTimeMs: number
  onSelect: (event: ScheduleEvent) => void
}) {
  return (
    <div className="dashboard-timeline">
      {events.map((event) => {
        const countdown = scheduleCountdownLabel(event.starts_at, event.ends_at, currentTimeMs)

        return (
          <button
            className="dashboard-timeline-item"
            key={event.id}
            type="button"
            onClick={() => onSelect(event)}
          >
            <span className="dashboard-timeline-time">
              <strong>{formatTime(event.starts_at)}</strong>
              <small>{formatDate(event.starts_at)}</small>
              <em className={`dashboard-timeline-countdown ${countdown.tone}`}>
                {countdown.segments ? (
                  <span className="dashboard-timeline-countdown-parts">
                    {countdown.segments.map((segment, index) => (
                      <span className="dashboard-timeline-countdown-piece" key={`${segment.unit}-${index}`}>
                        <span className="dashboard-timeline-countdown-value">{segment.value}</span>
                        <span className="dashboard-timeline-countdown-unit">{segment.unit}</span>
                        {index < countdown.segments.length - 1 ? (
                          <span className="dashboard-timeline-countdown-dot" aria-hidden="true" />
                        ) : null}
                      </span>
                    ))}
                  </span>
                ) : (
                  countdown.label
                )}
              </em>
            </span>
            <span className="dashboard-timeline-pin" aria-hidden="true" />
            <span className="dashboard-timeline-content">
              <span className="dashboard-timeline-title">{event.title}</span>
              <span className="dashboard-timeline-note">
                {event.description?.trim() || `${formatTime(event.starts_at)} 至 ${formatTime(event.ends_at)}`}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function DashboardPage({
  currentUser,
  dashboard,
  loading,
  canNavigatePath,
  onNavigate,
  onRefresh,
}: {
  currentUser: CurrentUser
  dashboard: Dashboard | null
  loading: boolean
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
  onRefresh: () => Promise<void>
}) {
  const [scheduleForm, setScheduleForm] = useState<DashboardScheduleFormState>(() =>
    initialDashboardScheduleForm(),
  )
  const [announcementForm, setAnnouncementForm] = useState<DashboardAnnouncementFormState>(() =>
    initialDashboardAnnouncementForm(),
  )
  const [todoForm, setTodoForm] = useState<DashboardTodoFormState>(() =>
    initialDashboardTodoForm(currentUser),
  )
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false)
  const [createModal, setCreateModal] = useState<'todo' | 'schedule' | 'announcement' | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEvent | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTimeMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (createModal !== 'todo' || assignableUsers.length) return
    let isRequestCancelled = false

    listAssignableUsers()
      .then((result) => {
        if (!isRequestCancelled) setAssignableUsers(result.users)
      })
      .catch((caught) => {
        if (!isRequestCancelled) {
          showError(caught, t('dashboard.operationFailed'))
        }
      })

    return () => {
      isRequestCancelled = true
    }
  }, [assignableUsers.length, createModal])

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 10 }} />
  }

  const summary = dashboard?.summary
  const previewTodos = dashboard?.todos.slice(0, 2) ?? []
  const previewNotifications = dashboard?.notifications.slice(0, 1) ?? []
  const previewSchedules = dashboard?.schedule_events.slice(0, 3) ?? []
  const previewAnnouncements = dashboard?.announcements.slice(0, 1) ?? []
  const canPublishAnnouncement = canCreateAnnouncement(currentUser)
  const selectedTodoAssignees = todoForm.assignee_user_ids
    .map(
      (userId) =>
        assignableUsers.find((user) => user.id === userId) ??
        (userId === currentUser.id
          ? {
              id: currentUser.id,
              username: currentUser.username,
              display_name: currentUser.display_name,
              department_name: currentUser.department_name,
              avatar_type: currentUser.avatar_type,
              avatar_value: currentUser.avatar_value || defaultAvatarPreset,
            }
          : null),
    )
    .filter((user): user is AssignableUser => Boolean(user))

  function showAnnouncementDenied() {
    Modal.warning({
      centered: true,
      content: t('dashboard.announcementDenied'),
      okText: t('common.close'),
      title: t('dashboard.announcementDeniedTitle'),
    })
  }

  function openAnnouncementModal() {
    if (!canPublishAnnouncement) {
      showAnnouncementDenied()
      return
    }
    setCreateModal('announcement')
  }

  function openTodoModal() {
    setTodoForm(initialDashboardTodoForm(currentUser))
    setAssigneePickerOpen(false)
    setCreateModal('todo')
  }

  function toggleTodoAssignee(userId: string) {
    setTodoForm((current) => {
      const exists = current.assignee_user_ids.includes(userId)
      return {
        ...current,
        assignee_user_ids: exists
          ? current.assignee_user_ids.filter((id) => id !== userId)
          : [...current.assignee_user_ids, userId],
      }
    })
  }

  async function runDashboardAction(action: string, handler: () => Promise<void>, success: string) {
    setBusyAction(action)
    setActionError('')
    setActionMessage('')
    try {
      await handler()
      setActionMessage(success)
      await onRefresh()
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  async function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduleForm.title.trim() || !scheduleForm.starts_at || !scheduleForm.ends_at) {
      setActionError(t('dashboard.scheduleRequired'))
      return
    }
    const startsAt = parseDateTimeLocal(scheduleForm.starts_at)
    const endsAt = parseDateTimeLocal(scheduleForm.ends_at)
    if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      setActionError(t('dashboard.scheduleTimeInvalid'))
      return
    }
    const payload: ScheduleCreatePayload = {
      title: scheduleForm.title.trim(),
      description: scheduleForm.description.trim() || undefined,
      starts_at: dateTimeLocalToIso(scheduleForm.starts_at),
      ends_at: dateTimeLocalToIso(scheduleForm.ends_at),
    }
    await runDashboardAction(
      'schedule',
      async () => {
        await createScheduleEvent(payload)
        setScheduleForm(initialDashboardScheduleForm())
        setCreateModal(null)
      },
      t('dashboard.scheduleCreated'),
    )
  }

  async function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canPublishAnnouncement) {
      setCreateModal(null)
      showAnnouncementDenied()
      return
    }
    const payload: AnnouncementCreatePayload = {
      title: announcementForm.title.trim(),
      content: announcementForm.content.trim(),
    }
    if (!payload.title || !payload.content) {
      setActionError(t('dashboard.announcementRequired'))
      return
    }
    await runDashboardAction(
      'announcement',
      async () => {
        await createAnnouncement(payload)
        setAnnouncementForm(initialDashboardAnnouncementForm())
        setCreateModal(null)
      },
      t('dashboard.announcementCreated'),
    )
  }

  async function submitTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload: TodoCreatePayload = {
      title: todoForm.title.trim(),
      content: todoForm.content.trim(),
      assignee_user_ids: todoForm.assignee_user_ids,
    }
    if (!payload.title || !payload.content) {
      setActionError(t('dashboard.todoRequired'))
      return
    }
    if (!payload.assignee_user_ids.length) {
      setActionError(t('dashboard.assigneeRequired'))
      return
    }
    await runDashboardAction(
      'todo',
      async () => {
        await createTodos(payload)
        setTodoForm(initialDashboardTodoForm(currentUser))
        setAssigneePickerOpen(false)
        setCreateModal(null)
      },
      t('dashboard.todoCreated'),
    )
  }

  async function readNotification(notification: NotificationItem) {
    await runDashboardAction(
      `notification-${notification.id}`,
      async () => {
        await markNotificationRead(notification.id)
      },
      t('dashboard.notificationHandled'),
    )
  }

  function confirmRemoveSchedule(schedule: ScheduleEvent) {
    Modal.confirm({
      centered: true,
      content: t('dashboard.deleteScheduleConfirm'),
      okButtonProps: { danger: true },
      okText: t('dashboard.deleteSchedule'),
      cancelText: t('common.cancel'),
      title: t('dashboard.deleteScheduleTitle'),
      onOk: () =>
        runDashboardAction(
          `schedule-delete-${schedule.id}`,
          async () => {
            await deleteScheduleEvent(schedule.id)
            setSelectedSchedule(null)
          },
          t('dashboard.scheduleDeleted'),
        ),
    })
  }

  return (
    <section className="dashboard-grid dashboard-workbench">
      <div className="metric-strip" aria-label={t('dashboard.aria')}>
        <Metric
          icon={<FileText size={17} />}
          label={t('dashboard.announcement')}
          value={summary?.announcement_count ?? 0}
          onClick={() => onNavigate(dashboardAnnouncementsPath)}
        />
        <Metric
          icon={<ClipboardCheck size={17} />}
          label={t('dashboard.todo')}
          value={summary?.todo_count ?? 0}
          intent="warning"
          onClick={() => onNavigate(dashboardTodosPath)}
        />
        <Metric
          icon={<Bell size={17} />}
          label={t('dashboard.unreadNotifications')}
          value={summary?.unread_notification_count ?? 0}
          intent="danger"
          onClick={() => onNavigate(dashboardNotificationsPath)}
        />
        <Metric
          icon={<CalendarClock size={17} />}
          label={t('dashboard.todaySchedule')}
          value={summary?.today_schedule_count ?? 0}
          onClick={() => onNavigate(dashboardSchedulesPath)}
        />
      </div>

      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}

      <div className="dashboard-toolbar" aria-label={t('dashboard.aria')}>
        <button
          type="button"
          onClick={() => {
            setScheduleForm(initialDashboardScheduleForm())
            setCreateModal('schedule')
          }}
        >
          <CalendarClock size={15} />
          <span>{t('dashboard.addSchedule')}</span>
        </button>
        <button type="button" onClick={openAnnouncementModal}>
          <FileText size={15} />
          <span>{t('dashboard.publishAnnouncement')}</span>
        </button>
      </div>

      <div className="dashboard-board">
        <section className="workspace-panel dashboard-panel dashboard-panel-primary">
          <div className="dashboard-panel-heading">
            <PanelTitle icon={<ClipboardCheck size={18} />} title={t('dashboard.myTodos')} />
            <div className="dashboard-panel-actions">
              <button
                aria-label={t('dashboard.addTodo')}
                className="panel-icon-button"
                title={t('dashboard.addTodo')}
                type="button"
                onClick={openTodoModal}
              >
                <Plus size={17} />
              </button>
              <button className="panel-action-button panel-link-button" type="button" onClick={() => onNavigate(dashboardTodosPath)}>
                {t('common.viewAll')}
              </button>
            </div>
          </div>
          <div className="dashboard-task-list">
            {previewTodos.length ? (
              previewTodos.map((todo) => {
                const targetPath = todoTargetPath(todo)

                return (
                  <article className="dashboard-task" key={todo.id}>
                    <div className="dashboard-task-icon" aria-hidden="true">
                      <ClipboardCheck size={17} />
                    </div>
                    <div className="dashboard-task-body">
                      <div className="dashboard-task-title">
                        <strong>{todo.title}</strong>
                        {statusTag(todo.status)}
                      </div>
                      {todo.content ? <p className="dashboard-task-content">{todo.content}</p> : null}
                      <div className="dashboard-task-meta">
                        <span>{todoSourceLabel(todo.source_type)}</span>
                        <span>{t('dashboard.deadline')} {formatDate(todo.due_at)}</span>
                      </div>
                    </div>
                    {canNavigatePath(targetPath) ? (
                      <button className="table-action" type="button" onClick={() => onNavigate(targetPath)}>
                        {t('dashboard.goHandle')}
                      </button>
                    ) : null}
                  </article>
                )
              })
            ) : (
              <div className="dashboard-empty">{t('dashboard.noTodos')}</div>
            )}
          </div>
        </section>

        <section className="workspace-panel dashboard-panel dashboard-panel-reminders">
          <div className="dashboard-panel-heading">
            <PanelTitle icon={<Bell size={18} />} title={t('dashboard.messages')} />
            <button className="panel-action-button panel-link-button" type="button" onClick={() => onNavigate(dashboardNotificationsPath)}>
              {t('common.viewAll')}
            </button>
          </div>
          <div className="dashboard-reminders">
            {previewNotifications.length ? (
              previewNotifications.map((notification) => (
                <div className="dashboard-reminder" key={notification.id}>
                  <div>
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                  </div>
                  <div className="dashboard-reminder-actions">
                    {severityTag(notification.severity)}
                    {notification.is_read ? (
                      <Tag color="green">{t('dashboard.read')}</Tag>
                    ) : (
                      <button
                        className="table-action"
                        disabled={busyAction === `notification-${notification.id}`}
                        type="button"
                        onClick={() => void readNotification(notification)}
                      >
                        {t('dashboard.handle')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-empty">{t('dashboard.noNotifications')}</div>
            )}
          </div>
        </section>

        <section className="workspace-panel dashboard-panel dashboard-panel-schedule">
          <div className="dashboard-panel-heading">
            <PanelTitle icon={<CalendarClock size={18} />} title={t('dashboard.mySchedule')} />
            <button className="panel-action-button panel-link-button" type="button" onClick={() => onNavigate(dashboardSchedulesPath)}>
              {t('common.viewAll')}
            </button>
          </div>
          {previewSchedules.length ? (
            <DashboardScheduleTimeline
              currentTimeMs={currentTimeMs}
              events={previewSchedules}
              onSelect={(event) => setSelectedSchedule(event)}
            />
          ) : (
            <div className="dashboard-empty">{t('dashboard.noSchedules')}</div>
          )}
        </section>

        <section className="workspace-panel dashboard-panel dashboard-announcements-panel">
          <div className="dashboard-panel-heading">
            <PanelTitle icon={<Search size={18} />} title={t('dashboard.companyAnnouncements')} />
            <div className="dashboard-panel-actions">
              <button className="panel-action-button panel-link-button" type="button" onClick={() => onNavigate(dashboardAnnouncementsPath)}>
                {t('common.viewAll')}
              </button>
            </div>
          </div>
          <div className="dashboard-announcements">
            {previewAnnouncements.length ? (
              previewAnnouncements.map((announcement) => (
                <article className="dashboard-announcement" key={announcement.id}>
                  <div>
                    <strong>{announcement.title}</strong>
                    <p>{announcement.content}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="dashboard-empty">{t('dashboard.noAnnouncements')}</div>
            )}
          </div>
        </section>
      </div>

      <Modal
        centered
        footer={null}
        open={Boolean(selectedSchedule)}
        title={t('dashboard.scheduleDetail')}
        width={560}
        onCancel={() => setSelectedSchedule(null)}
      >
        {selectedSchedule ? (
          <section className="dashboard-detail">
            <header className="dashboard-detail-heading">
              <strong>{selectedSchedule.title}</strong>
              <span>
                {formatDateTime(selectedSchedule.starts_at)} 至 {formatDateTime(selectedSchedule.ends_at)}
              </span>
            </header>
            <dl className="dashboard-detail-list">
              <div>
                <dt>{t('dashboard.start')}</dt>
                <dd>{formatDateTime(selectedSchedule.starts_at)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.end')}</dt>
                <dd>{formatDateTime(selectedSchedule.ends_at)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.createdAt')}</dt>
                <dd>{formatDateTime(selectedSchedule.created_at)}</dd>
              </div>
            </dl>
            <div className="dashboard-detail-note">
              <span>{t('dashboard.note')}</span>
              <p>{selectedSchedule.description?.trim() || t('dashboard.noNote')}</p>
            </div>
            <div className="modal-actions split">
              <button
                className="danger-inline"
                disabled={busyAction === `schedule-delete-${selectedSchedule.id}`}
                type="button"
                onClick={() => confirmRemoveSchedule(selectedSchedule)}
              >
                <Trash2 size={15} />
                {t('dashboard.deleteSchedule')}
              </button>
              <button className="secondary-inline" type="button" onClick={() => setSelectedSchedule(null)}>
                {t('common.close')}
              </button>
            </div>
          </section>
        ) : null}
      </Modal>

      <Modal
        centered
        footer={null}
        open={createModal === 'todo'}
        title={t('dashboard.addTodo')}
        width={780}
        onCancel={() => {
          setAssigneePickerOpen(false)
          setCreateModal(null)
        }}
      >
        <form className="dashboard-form modal-dashboard-form todo-compose-form" onSubmit={submitTodo}>
          <section className="todo-composer" aria-label={t('dashboard.addTodo')}>
            <input
              aria-label={t('dashboard.title')}
              className="todo-composer-title"
              placeholder={t('dashboard.title')}
              value={todoForm.title}
              onChange={(event) => setTodoForm({ ...todoForm, title: event.target.value })}
            />
            <textarea
              aria-label={t('dashboard.content')}
              className="todo-composer-body"
              placeholder={t('dashboard.content')}
              rows={8}
              value={todoForm.content}
              onChange={(event) => setTodoForm({ ...todoForm, content: event.target.value })}
            />
            <div className="todo-composer-footer">
              <div className="todo-composer-assignees" aria-label={t('dashboard.assignees')}>
                {selectedTodoAssignees.length ? (
                  <span className="dashboard-assignee-tags">
                    {selectedTodoAssignees.map((user) => (
                      <span className="dashboard-assignee-tag" key={user.id}>
                        {user.display_name}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span>{t('dashboard.selectAssignees')}</span>
                )}
              </div>
              <button
                aria-expanded={assigneePickerOpen}
                aria-label={t('dashboard.assignees')}
                className="todo-assignee-button"
                type="button"
                onClick={() => setAssigneePickerOpen((open) => !open)}
              >
                <AtSign size={18} />
              </button>
            </div>
            {assigneePickerOpen ? (
              <div className="todo-assignee-menu">
                {assignableUsers.length ? (
                  assignableUsers.map((user) => {
                    const selected = todoForm.assignee_user_ids.includes(user.id)

                    return (
                      <button
                        aria-pressed={selected}
                        className={`dashboard-assignee-option${selected ? ' selected' : ''}`}
                        key={user.id}
                        type="button"
                        onClick={() => toggleTodoAssignee(user.id)}
                      >
                        <UserAvatar
                          avatarType={user.avatar_type}
                          avatarValue={user.avatar_value}
                          className="dashboard-assignee-avatar"
                          label={user.display_name}
                          size="sm"
                        />
                        <span>
                          <strong>{user.display_name}</strong>
                          <small>
                            {user.username} · {user.department_name}
                          </small>
                        </span>
                        {selected ? <CheckCircle2 size={16} /> : null}
                      </button>
                    )
                  })
                ) : (
                  <div className="dashboard-empty">{t('dashboard.selectAssignees')}</div>
                )}
              </div>
            ) : null}
          </section>
          <div className="modal-actions">
            <button
              className="secondary-inline"
              type="button"
              onClick={() => {
                setAssigneePickerOpen(false)
                setCreateModal(null)
              }}
            >
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction === 'todo'} type="submit">
              {t('dashboard.addTodo')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={createModal === 'schedule'}
        title={t('dashboard.addSchedule')}
        width={620}
        onCancel={() => setCreateModal(null)}
      >
        <form className="dashboard-form modal-dashboard-form" onSubmit={submitSchedule}>
          <label>
            <span>{t('dashboard.title')}</span>
            <input
              value={scheduleForm.title}
              onChange={(event) => setScheduleForm({ ...scheduleForm, title: event.target.value })}
            />
          </label>
          <div className="dashboard-form-row">
            <label>
              <span>{t('dashboard.start')}</span>
              <input
                type="datetime-local"
                value={scheduleForm.starts_at}
                onChange={(event) => setScheduleForm({ ...scheduleForm, starts_at: event.target.value })}
              />
            </label>
            <label>
              <span>{t('dashboard.end')}</span>
              <input
                type="datetime-local"
                value={scheduleForm.ends_at}
                onChange={(event) => setScheduleForm({ ...scheduleForm, ends_at: event.target.value })}
              />
            </label>
          </div>
          <label>
            <span>{t('dashboard.note')}</span>
            <textarea
              rows={3}
              value={scheduleForm.description}
              onChange={(event) => setScheduleForm({ ...scheduleForm, description: event.target.value })}
            />
          </label>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setCreateModal(null)}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction === 'schedule'} type="submit">
              {t('dashboard.addSchedule')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={createModal === 'announcement'}
        title={t('dashboard.publishAnnouncement')}
        width={620}
        onCancel={() => setCreateModal(null)}
      >
        <form className="dashboard-form modal-dashboard-form" onSubmit={submitAnnouncement}>
          <label>
            <span>{t('dashboard.title')}</span>
            <input
              value={announcementForm.title}
              onChange={(event) => setAnnouncementForm({ ...announcementForm, title: event.target.value })}
            />
          </label>
          <label>
            <span>{t('dashboard.content')}</span>
            <textarea
              rows={4}
              value={announcementForm.content}
              onChange={(event) => setAnnouncementForm({ ...announcementForm, content: event.target.value })}
            />
          </label>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setCreateModal(null)}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={busyAction === 'announcement'} type="submit">
              {t('dashboard.publishAnnouncement')}
            </button>
          </div>
        </form>
      </Modal>

    </section>
  )
}

function DashboardTodosPage({
  dashboard,
  loading,
  canNavigatePath,
  onNavigate,
}: {
  dashboard: Dashboard | null
  loading: boolean
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
}) {
  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const todos = dashboard?.todos ?? []
  const groupedTodos = [
    { id: 'assigned', label: t('todo.assignedToMe'), items: todos.filter((todo) => todo.assignment_type === 'assigned') },
    { id: 'self', label: t('todo.selfCreated'), items: todos.filter((todo) => todo.assignment_type === 'self') },
  ]

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<ClipboardCheck size={18} />} title={t('dashboard.myTodos')} />
          <span className="dashboard-section-count">{todos.length}</span>
        </div>
        {todos.length ? (
          <div className="dashboard-kanban">
            {groupedTodos.map((group) => (
              <section className="dashboard-kanban-column" key={group.id}>
                <header>
                  <strong>{group.label}</strong>
                  <span>{group.items.length}</span>
                </header>
                <div className="dashboard-kanban-items">
                  {group.items.length ? (
                    group.items.map((todo) => {
                      const targetPath = todoTargetPath(todo)

                      return (
                        <article className="dashboard-task-card" key={todo.id}>
                          <div>
                            <strong>{todo.title}</strong>
                            <p>{todo.content || todoSourceLabel(todo.source_type)}</p>
                            <span>
                              {todo.creator_user_name ?? todoSourceLabel(todo.source_type)}
                              {' / '}
                              {t('dashboard.deadline')} {formatDate(todo.due_at)}
                            </span>
                          </div>
                          {canNavigatePath(targetPath) ? (
                            <button className="table-action" type="button" onClick={() => onNavigate(targetPath)}>
                              {t('dashboard.goHandle')}
                            </button>
                          ) : null}
                        </article>
                      )
                    })
                  ) : (
                    <div className="dashboard-empty">{t('common.none')}</div>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">{t('dashboard.noTodos')}</div>
        )}
      </section>
    </section>
  )
}

function DashboardSchedulesPage({
  dashboard,
  loading,
  onRefresh,
}: {
  dashboard: Dashboard | null
  loading: boolean
  onRefresh: () => Promise<void>
}) {
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEvent | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTimeMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const schedules = dashboard?.schedule_events ?? []

  function confirmRemoveSchedule(schedule: ScheduleEvent) {
    Modal.confirm({
      centered: true,
      content: t('dashboard.deleteScheduleConfirm'),
      okButtonProps: { danger: true },
      okText: t('dashboard.deleteSchedule'),
      cancelText: t('common.cancel'),
      title: t('dashboard.deleteScheduleTitle'),
      onOk: async () => {
        setBusyAction(`schedule-delete-${schedule.id}`)
        setActionMessage('')
        setActionError('')
        try {
          await deleteScheduleEvent(schedule.id)
          setSelectedSchedule(null)
          setActionMessage(t('dashboard.scheduleDeleted'))
          await onRefresh()
        } catch (caught) {
          showError(caught, t('dashboard.operationFailed'))
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<CalendarClock size={18} />} title={t('dashboard.mySchedule')} />
          <span className="dashboard-section-count">{schedules.length}</span>
        </div>
        {schedules.length ? (
          <DashboardScheduleTimeline
            currentTimeMs={currentTimeMs}
            events={schedules}
            onSelect={(event) => setSelectedSchedule(event)}
          />
        ) : (
          <div className="dashboard-empty">{t('dashboard.noSchedules')}</div>
        )}
      </section>

      <Modal
        centered
        footer={null}
        open={Boolean(selectedSchedule)}
        title={t('dashboard.scheduleDetail')}
        width={560}
        onCancel={() => setSelectedSchedule(null)}
      >
        {selectedSchedule ? (
          <section className="dashboard-detail">
            <header className="dashboard-detail-heading">
              <strong>{selectedSchedule.title}</strong>
              <span>
                {formatDateTime(selectedSchedule.starts_at)} 至 {formatDateTime(selectedSchedule.ends_at)}
              </span>
            </header>
            <dl className="dashboard-detail-list">
              <div>
                <dt>{t('dashboard.start')}</dt>
                <dd>{formatDateTime(selectedSchedule.starts_at)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.end')}</dt>
                <dd>{formatDateTime(selectedSchedule.ends_at)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.createdAt')}</dt>
                <dd>{formatDateTime(selectedSchedule.created_at)}</dd>
              </div>
            </dl>
            <div className="dashboard-detail-note">
              <span>{t('dashboard.note')}</span>
              <p>{selectedSchedule.description?.trim() || t('dashboard.noNote')}</p>
            </div>
            <div className="modal-actions split">
              <button
                className="danger-inline"
                disabled={busyAction === `schedule-delete-${selectedSchedule.id}`}
                type="button"
                onClick={() => confirmRemoveSchedule(selectedSchedule)}
              >
                <Trash2 size={15} />
                {t('dashboard.deleteSchedule')}
              </button>
              <button className="secondary-inline" type="button" onClick={() => setSelectedSchedule(null)}>
                {t('common.close')}
              </button>
            </div>
          </section>
        ) : null}
      </Modal>
    </section>
  )
}

function DashboardNotificationsPage({
  dashboard,
  loading,
  onRefresh,
}: {
  dashboard: Dashboard | null
  loading: boolean
  onRefresh: () => Promise<void>
}) {
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const notifications = dashboard?.notifications ?? []

  async function readNotification(notification: NotificationItem) {
    setBusyAction(`notification-${notification.id}`)
    setActionMessage('')
    setActionError('')
    try {
      await markNotificationRead(notification.id)
      setActionMessage(t('dashboard.notificationHandled'))
      await onRefresh()
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<Bell size={18} />} title={t('dashboard.messages')} />
          <span className="dashboard-section-count">{notifications.length}</span>
        </div>
        {notifications.length ? (
          <div className="dashboard-reminder-list">
            {notifications.map((notification) => (
              <article className="dashboard-reminder" key={notification.id}>
                <div>
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                </div>
                <div className="dashboard-reminder-actions">
                  {severityTag(notification.severity)}
                  {notification.is_read ? (
                    <Tag color="green">{t('dashboard.read')}</Tag>
                  ) : (
                    <button
                      className="table-action"
                      disabled={busyAction === `notification-${notification.id}`}
                      type="button"
                      onClick={() => void readNotification(notification)}
                    >
                      {t('dashboard.handle')}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">{t('dashboard.noNotifications')}</div>
        )}
      </section>
    </section>
  )
}

function DashboardAnnouncementsPage({
  dashboard,
  loading,
}: {
  dashboard: Dashboard | null
  loading: boolean
}) {
  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const announcements = dashboard?.announcements ?? []

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<Search size={18} />} title={t('dashboard.companyAnnouncements')} />
          <span className="dashboard-section-count">{announcements.length}</span>
        </div>
        {announcements.length ? (
          <div className="dashboard-announcement-list">
            {announcements.map((announcement) => (
              <article className="dashboard-announcement-card" key={announcement.id}>
                <time dateTime={announcement.published_at}>{formatDate(announcement.published_at)}</time>
                <div>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.content}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">{t('dashboard.noAnnouncements')}</div>
        )}
      </section>
    </section>
  )
}


function SampleRequestsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [requests, setRequests] = useState<SampleRequest[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<SampleRequestFormState>(() => initialSampleRequestForm())
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [progressForm, setProgressForm] = useState<SampleProgressFormState>(() =>
    initialSampleProgressForm(),
  )
  const [feeForm, setFeeForm] = useState<SampleFeeFormState>(() => initialSampleFeeForm())
  const [recordForm, setRecordForm] = useState<SampleRecordFormState>(() =>
    initialSampleRecordForm(),
  )

  const selectedRequest = useMemo(
    () => {
      if (detailId) return requests.find((item) => item.id === detailId) ?? null
      return requests.find((item) => item.id === selectedRequestId) ?? requests[0] ?? null
    },
    [detailId, requests, selectedRequestId],
  )

  useEffect(() => {
    void loadRequests()
  }, [])

  useEffect(() => {
    if (detailId && requests.length > 0 && !requests.some((item) => item.id === detailId)) {
      onNavigate(sampleRequestPath)
    }
  }, [detailId, onNavigate, requests])

  function openRequestDetail(request: SampleRequest) {
    setSelectedRequestId(request.id)
    onNavigate(moduleDetailPath(sampleRequestPath, request.id))
  }

  function stopAndOpenRequestDetail(event: MouseEvent<HTMLElement>, request: SampleRequest) {
    event.stopPropagation()
    openRequestDetail(request)
  }

  async function loadRequests(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listSampleRequests({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
      })
      setRequests(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedRequestId) ? selectedRequestId : null) ??
        result.items[0]?.id ??
        null
      setSelectedRequestId(nextSelectedId)
    } catch (caught) {
      showError(caught, '打样单加载失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreateRequest() {
    setForm(initialSampleRequestForm())
    setRequestModalOpen(true)
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const created = await createSampleRequest(sampleRequestPayload(form))
      setMessage(`已新增打样单 ${created.code}`)
      setForm(initialSampleRequestForm())
      setRequestModalOpen(false)
      await loadRequests(created.id)
    } catch (caught) {
      showError(caught, '打样单新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const progress = await addSampleProgress(selectedRequest.id, sampleProgressPayload(progressForm))
      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? {
                ...item,
                status: progress.status,
                progress_events: [...item.progress_events, progress],
              }
            : item,
        ),
      )
      setMessage(`已更新打样进度 ${sampleProgressStageLabel(progress.stage)}`)
      setProgressForm(initialSampleProgressForm())
    } catch (caught) {
      showError(caught, '打样进度更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitFee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const fee = await addSampleFee(selectedRequest.id, sampleFeePayload(feeForm))
      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id ? { ...item, fees: [...item.fees, fee] } : item,
        ),
      )
      setMessage(`已登记打样费用 ${fee.currency} ${fee.amount}`)
      setFeeForm(initialSampleFeeForm())
    } catch (caught) {
      showError(caught, '打样费用登记失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitPaymentRequest(fee: SampleFee) {
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updatedFee = await requestSampleFeePayment(selectedRequest.id, fee.id)
      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? {
                ...item,
                fees: item.fees.map((currentFee) =>
                  currentFee.id === updatedFee.id ? updatedFee : currentFee,
                ),
              }
            : item,
        ),
      )
      setMessage('已发起打样费用付款申请')
    } catch (caught) {
      showError(caught, '打样费用付款发起失败')
    } finally {
      setSubmitting(false)
    }
  }

  function loadRequestIntoRecordForm(request: SampleRequest) {
    setRecordForm(sampleRecordFormFromRequest(request, recordForm))
    setMessage(`已载入 ${request.code}，可转为样品登记`)
  }

  async function submitRecordFromRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRequest) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const record = await createSampleRecordFromRequest(
        selectedRequest.id,
        sampleRequestToRecordPayload(recordForm),
      )
      setMessage(`已转为样品 ${record.code}`)
      setRecordForm(initialSampleRecordForm())
    } catch (caught) {
      showError(caught, '打样转样品失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sample-request-page">
      <div className="summary-strip" aria-label="打样管理概览">
        <Metric label="打样单" value={requests.length} />
        <Metric label="进行中" value={requests.filter((item) => item.status === 'in_progress').length} />
        <Metric label="进度记录" value={selectedRequest?.progress_events.length ?? 0} />
        <Metric label="费用记录" value={selectedRequest?.fees.length ?? 0} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid sample-request-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="打样单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadRequests()
              }}
            >
              <label className="inline-filter-search">
                打样搜索
                <Input
                  value={search}
                  placeholder="编号 / 客户 / 产品 / 供应商"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                打样状态筛选
                <FormSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">全部状态</option>
                  {sampleStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label className="inline-filter-compact">
                打样客户筛选
                <Input
                  value={customerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                打样起始日期
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(event) => setDateFromFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                打样截止日期
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(event) => setDateToFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateRequest}>
                新增打样单
              </Button>
            </form>
          </div>

          <Table<SampleRequest>
            columns={[
              {
                title: '打样单号',
                dataIndex: 'code',
                render: (value: string, record: SampleRequest) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenRequestDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '产品', dataIndex: 'product_name', render: nullableText },
              {
                title: '去向',
                dataIndex: 'destination',
                render: sampleDestinationLabel,
              },
              {
                title: '状态',
                dataIndex: 'status',
                render: sampleStatusLabel,
              },
              { title: '要求完成', dataIndex: 'due_date', render: formatDate },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: SampleRequest) => (
                  <Button size="small" onClick={(event) => stopAndOpenRequestDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={requests}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedRequest?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedRequestId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={requestModalOpen}
          title="新增打样单"
          width={980}
          onCancel={() => setRequestModalOpen(false)}
        >
          <form className="record-form entity-modal-form sample-modal-form" onSubmit={submitRequest}>
            <label>
              打样单号
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            </label>
            <label htmlFor="sample-request-status">
              打样状态
              <FormSelect
                id="sample-request-status"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {sampleStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              打样日期
              <Input
                type="date"
                value={form.request_date}
                onChange={(event) => setForm({ ...form, request_date: event.target.value })}
              />
            </label>
            <label>
              要求完成日期
              <Input
                type="date"
                value={form.due_date}
                onChange={(event) => setForm({ ...form, due_date: event.target.value })}
              />
            </label>
            <label>
              打样客户标识
              <Input
                value={form.customer_id}
                onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
              />
            </label>
            <label>
              打样客户名称
              <Input
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </label>
            <label>
              打样产品编号
              <Input
                value={form.product_code}
                onChange={(event) => setForm({ ...form, product_code: event.target.value })}
              />
            </label>
            <label>
              打样产品名称
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <label>
              打样供应商名称
              <Input
                value={form.supplier_name}
                onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
              />
            </label>
            <label htmlFor="sample-request-destination">
              打样去向
              <FormSelect
                id="sample-request-destination"
                value={form.destination}
                onChange={(event) => setForm({ ...form, destination: event.target.value })}
              >
                {sampleDestinationOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              客户打样要求
              <Input.TextArea
                rows={3}
                value={form.requirements}
                onChange={(event) => setForm({ ...form, requirements: event.target.value })}
              />
            </label>
            <div className="form-divider">内部打样单明细</div>
            <label>
              明细产品编号
              <Input
                value={form.line_product_code}
                onChange={(event) =>
                  setForm({ ...form, line_product_code: event.target.value, line_product_id: event.target.value })
                }
              />
            </label>
            <label>
              明细产品名称
              <Input
                value={form.line_product_name}
                onChange={(event) => setForm({ ...form, line_product_name: event.target.value })}
              />
            </label>
            <label>
              明细规格
              <Input
                value={form.line_specification}
                onChange={(event) => setForm({ ...form, line_specification: event.target.value })}
              />
            </label>
            <label>
              明细数量
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.line_quantity}
                onChange={(event) => setForm({ ...form, line_quantity: event.target.value })}
              />
            </label>
            <label>
              明细单位
              <Input
                value={form.line_unit}
                onChange={(event) => setForm({ ...form, line_unit: event.target.value })}
              />
            </label>
            <label>
              明细要求
              <Input.TextArea
                rows={2}
                value={form.line_requirement}
                onChange={(event) => setForm({ ...form, line_requirement: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button className="secondary-inline" type="button" onClick={() => setRequestModalOpen(false)}>
                取消
              </button>
              <button className="inline-submit" disabled={submitting} type="submit">
                新增打样单
              </button>
            </div>
          </form>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="打样单明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(sampleRequestPath)}>
              返回列表
            </Button>
          </div>
          {selectedRequest ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>打样单号</dt>
                  <dd>{selectedRequest.code}</dd>
                </div>
                <div>
                  <dt>客户/产品</dt>
                  <dd>{selectedRequest.customer_name} / {selectedRequest.product_name ?? '-'}</dd>
                </div>
                <div>
                  <dt>去向/状态</dt>
                  <dd>{sampleDestinationLabel(selectedRequest.destination)} / {sampleStatusLabel(selectedRequest.status)}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedRequest.supplier_name ?? '未设置'}</dd>
                </div>
                <div>
                  <dt>打样日期</dt>
                  <dd>{formatDate(selectedRequest.request_date)}</dd>
                </div>
                <div>
                  <dt>要求完成</dt>
                  <dd>{formatDate(selectedRequest.due_date)}</dd>
                </div>
                <div>
                  <dt>客户要求</dt>
                  <dd>{selectedRequest.requirements}</dd>
                </div>
              </dl>

              <div className="delivery-action-row">
                <Button onClick={() => void openSampleRequestPrint(selectedRequest.id)}>
                  打印内部打样单
                </Button>
                <Button
                  disabled={selectedRequest.status !== 'completed'}
                  onClick={() => loadRequestIntoRecordForm(selectedRequest)}
                >
                  载入为样品
                </Button>
              </div>

              <section className="compact-section">
                <PanelTitle icon={<Search size={18} />} title="内部打样单明细" />
                <Table
                  columns={[
                    { title: '产品编号', dataIndex: 'product_code', render: nullableText },
                    { title: '产品名称', dataIndex: 'product_name' },
                    { title: '规格', dataIndex: 'specification', render: nullableText },
                    { title: '数量', dataIndex: 'quantity', width: 90 },
                    { title: '单位', dataIndex: 'unit', width: 80 },
                    { title: '要求', dataIndex: 'requirement', render: nullableText },
                  ]}
                  dataSource={selectedRequest.lines}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />
              </section>

              <form className="record-form compact-section" onSubmit={submitProgress}>
                <div className="form-divider">打样进度</div>
                <label>
                  进度阶段
                <FormSelect
                  value={progressForm.stage}
                  onChange={(event) => setProgressForm({ ...progressForm, stage: event.target.value })}
                >
                  {sampleProgressStageOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
                </label>
                <label>
                  进度状态
                <FormSelect
                  value={progressForm.status}
                  onChange={(event) => setProgressForm({ ...progressForm, status: event.target.value })}
                >
                  {sampleStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
                </label>
                <label>
                  进度日期
                  <Input
                    type="date"
                    value={progressForm.occurred_at}
                    onChange={(event) => setProgressForm({ ...progressForm, occurred_at: event.target.value })}
                  />
                </label>
                <label>
                  进度经办人
                  <Input
                    value={progressForm.handler_name}
                    onChange={(event) => setProgressForm({ ...progressForm, handler_name: event.target.value })}
                  />
                </label>
                <label>
                  进度说明
                  <Input.TextArea
                    rows={2}
                    value={progressForm.note}
                    onChange={(event) => setProgressForm({ ...progressForm, note: event.target.value })}
                  />
                </label>
                <Button htmlType="submit" loading={submitting} type="primary">
                  更新打样进度
                </Button>
              </form>

              <Table<SampleProgress>
                className="compact-section"
                columns={[
                  { title: '阶段', dataIndex: 'stage', render: sampleProgressStageLabel },
                  { title: '状态', dataIndex: 'status', render: sampleStatusLabel },
                  { title: '日期', dataIndex: 'occurred_at', render: formatDate },
                  { title: '经办人', dataIndex: 'handler_name', render: nullableText },
                  { title: '说明', dataIndex: 'note', render: nullableText },
                ]}
                dataSource={selectedRequest.progress_events}
                locale={{ emptyText: '暂无进度记录' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <form className="record-form compact-section" onSubmit={submitFee}>
                <div className="form-divider">打样费用</div>
                <label>
                  打样费用类型
                <FormSelect
                  value={feeForm.fee_type}
                  onChange={(event) => setFeeForm({ ...feeForm, fee_type: event.target.value })}
                >
                  {sampleFeeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
                </label>
                <label>
                  打样费用金额
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={feeForm.amount}
                    onChange={(event) => setFeeForm({ ...feeForm, amount: event.target.value })}
                  />
                </label>
                <label>
                  打样费用币种
                  <Input
                    value={feeForm.currency}
                    onChange={(event) => setFeeForm({ ...feeForm, currency: event.target.value })}
                  />
                </label>
                <label>
                  收款方类型
                <FormSelect
                  value={feeForm.payee_type}
                  onChange={(event) => setFeeForm({ ...feeForm, payee_type: event.target.value })}
                >
                  {samplePayeeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
                </label>
                <label>
                  收款方名称
                  <Input
                    value={feeForm.payee_name}
                    onChange={(event) => setFeeForm({ ...feeForm, payee_name: event.target.value })}
                  />
                </label>
                <label>
                  打样费用备注
                  <Input.TextArea
                    rows={2}
                    value={feeForm.remark}
                    onChange={(event) => setFeeForm({ ...feeForm, remark: event.target.value })}
                  />
                </label>
                <Button htmlType="submit" loading={submitting}>
                  登记打样费用
                </Button>
              </form>

              <Table<SampleFee>
                className="compact-section"
                columns={[
                  { title: '费用类型', dataIndex: 'fee_type', render: sampleFeeTypeLabel },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (_, record) => `${record.currency} ${record.amount}`,
                  },
                  { title: '收款方', dataIndex: 'payee_name' },
                  { title: '付款状态', dataIndex: 'payment_status', render: samplePaymentStatusLabel },
                  { title: '付款申请', dataIndex: 'payment_request_no', render: nullableText },
                  {
                    title: '操作',
                    dataIndex: 'id',
                    width: 120,
                    render: (_, record) => (
                      <Button
                        disabled={Boolean(record.payment_request_no)}
                        loading={submitting}
                        size="small"
                        onClick={() => void submitPaymentRequest(record)}
                      >
                        发起付款
                      </Button>
                    ),
                  },
                ]}
                dataSource={selectedRequest.fees}
                locale={{ emptyText: '暂无打样费用' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <form className="record-form compact-section" onSubmit={submitRecordFromRequest}>
                <div className="form-divider">打样完成转样品登记</div>
                <div className="form-pair three">
                    <label>
                    样品编号
                    <Input
                      value={recordForm.code}
                      onChange={(event) => setRecordForm({ ...recordForm, code: event.target.value })}
                    />
                  </label>
                  <label>
                    样品分类
                  <FormSelect
                    value={recordForm.sample_type}
                    onChange={(event) => setRecordForm({ ...recordForm, sample_type: event.target.value })}
                  >
                    {sampleRecordTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                  </label>
                  <label>
                    收样数量
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={recordForm.quantity}
                      onChange={(event) => setRecordForm({ ...recordForm, quantity: event.target.value })}
                    />
                  </label>
                </div>
                <div className="form-pair three">
                  <label>
                    收样日期
                    <Input
                      type="date"
                      value={recordForm.received_at}
                      onChange={(event) => setRecordForm({ ...recordForm, received_at: event.target.value })}
                    />
                  </label>
                  <label>
                    提交日期
                    <Input
                      type="date"
                      value={recordForm.submitted_at}
                      onChange={(event) => setRecordForm({ ...recordForm, submitted_at: event.target.value })}
                    />
                  </label>
                  <label>
                    单位
                    <Input
                      value={recordForm.unit}
                      onChange={(event) => setRecordForm({ ...recordForm, unit: event.target.value })}
                    />
                  </label>
                </div>
                <div className="form-pair two">
                  <label>
                    客户货号
                    <Input
                      value={recordForm.customer_sku}
                      onChange={(event) => setRecordForm({ ...recordForm, customer_sku: event.target.value })}
                    />
                  </label>
                  <label>
                    供应商货号
                    <Input
                      value={recordForm.supplier_sku}
                      onChange={(event) => setRecordForm({ ...recordForm, supplier_sku: event.target.value })}
                    />
                  </label>
                </div>
                <div className="form-pair two">
                  <label>
                    采购合同标识
                    <Input
                      value={recordForm.purchase_contract_id}
                      onChange={(event) =>
                        setRecordForm({ ...recordForm, purchase_contract_id: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    采购合同号
                    <Input
                      value={recordForm.purchase_contract_no}
                      onChange={(event) =>
                        setRecordForm({ ...recordForm, purchase_contract_no: event.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  样品说明
                  <Input.TextArea
                    rows={2}
                    value={recordForm.description}
                    onChange={(event) => setRecordForm({ ...recordForm, description: event.target.value })}
                  />
                </label>
                <Button
                  disabled={selectedRequest.status !== 'completed'}
                  htmlType="submit"
                  loading={submitting}
                  type="primary"
                >
                  转为样品登记
                </Button>
              </form>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FlaskConical size={28} />
              <strong>暂无打样单</strong>
              <span>请返回列表选择打样单查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function SampleRecordsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [records, setRecords] = useState<SampleRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [purchaseContractFilter, setPurchaseContractFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<SampleRecordFormState>(() => initialSampleRecordForm())
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [imageForm, setImageForm] = useState<SampleRecordImageFormState>(() =>
    initialSampleRecordImageForm(),
  )
  const [stockForm, setStockForm] = useState<SampleRecordStockFormState>(() =>
    initialSampleRecordStockForm(),
  )

  const selectedRecord = useMemo(
    () => {
      if (detailId) return records.find((item) => item.id === detailId) ?? null
      return records.find((item) => item.id === selectedRecordId) ?? records[0] ?? null
    },
    [detailId, records, selectedRecordId],
  )

  useEffect(() => {
    void loadRecords()
  }, [])

  useEffect(() => {
    if (detailId && records.length > 0 && !records.some((item) => item.id === detailId)) {
      onNavigate(sampleRecordPath)
    }
  }, [detailId, onNavigate, records])

  function openRecordDetail(record: SampleRecord) {
    setSelectedRecordId(record.id)
    onNavigate(moduleDetailPath(sampleRecordPath, record.id))
  }

  function stopAndOpenRecordDetail(event: MouseEvent<HTMLElement>, record: SampleRecord) {
    event.stopPropagation()
    openRecordDetail(record)
  }

  async function loadRecords(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listSampleRecords({
        q: search.trim() || undefined,
        sample_type: typeFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
        purchase_contract_id: purchaseContractFilter.trim() || undefined,
      })
      setRecords(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedRecordId) ? selectedRecordId : null) ??
        result.items[0]?.id ??
        null
      setSelectedRecordId(nextSelectedId)
    } catch (caught) {
      showError(caught, '样品台账加载失败')
    } finally {
      setLoading(false)
    }
  }

  function openCreateRecord() {
    setForm(initialSampleRecordForm())
    setRecordModalOpen(true)
  }

  async function submitRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const created = await createSampleRecord(sampleRecordPayload(form))
      setMessage(`已新增样品 ${created.code}`)
      setForm(initialSampleRecordForm())
      setRecordModalOpen(false)
      await loadRecords(created.id)
      setRecords((current) =>
        current.some((record) => record.id === created.id) ? current : [created, ...current],
      )
      setSelectedRecordId(created.id)
    } catch (caught) {
      showError(caught, '样品新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRecord) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const image = await addSampleRecordImage(selectedRecord.id, sampleRecordImagePayload(imageForm))
      setRecords((current) =>
        current.map((record) =>
          record.id === selectedRecord.id ? { ...record, images: [...record.images, image] } : record,
        ),
      )
      setMessage(`已追加样品图片 ${image.filename}`)
      setImageForm(initialSampleRecordImageForm())
    } catch (caught) {
      showError(caught, '样品图片追加失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitStockEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRecord) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const stockEvent = await addSampleRecordStockEvent(
        selectedRecord.id,
        sampleRecordStockPayload(stockForm),
      )
      setRecords((current) =>
        current.map((record) =>
          record.id === selectedRecord.id ? applySampleStockEvent(record, stockEvent) : record,
        ),
      )
      setMessage(`已登记样品数量 ${stockEvent.quantity} ${stockEvent.unit}`)
      setStockForm(initialSampleRecordStockForm())
    } catch (caught) {
      showError(caught, '样品数量登记失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitRecordImport() {
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const result = await importSampleRecords({ records: [sampleRecordPayload(form)] })
      setMessage(`已导入 ${result.created_count} 条样品`)
      setForm(initialSampleRecordForm())
      setRecordModalOpen(false)
      await loadRecords(result.records[0]?.id)
    } catch (caught) {
      showError(caught, '样品导入失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadRecordExport() {
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const exported = await exportSampleRecords({
        q: search.trim() || undefined,
        sample_type: typeFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
        purchase_contract_id: purchaseContractFilter.trim() || undefined,
      })
      downloadCsv(exported.filename, exported.content)
      setMessage(`已导出 ${exported.total} 条样品台账`)
    } catch (caught) {
      showError(caught, '样品导出失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sample-record-page">
      <div className="summary-strip" aria-label="样品登记概览">
        <Metric label="样品" value={records.length} />
        <Metric label="确认样" value={records.filter((item) => item.sample_type === 'confirm_sample').length} />
        <Metric label="图片" value={selectedRecord?.images.length ?? 0} />
        <Metric label="留样" value={Number(selectedRecord?.stock_summary.retained_quantity ?? 0)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid sample-record-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="样品列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadRecords()
              }}
            >
              <label className="inline-filter-search">
                样品搜索
                <Input
                  value={search}
                  placeholder="编号 / 产品 / 客户 / 供应商"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                样品分类筛选
                <FormSelect value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option value="">全部分类</option>
                  {sampleRecordTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label className="inline-filter-compact">
                样品客户筛选
                <Input
                  value={customerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                采购合同筛选
                <Input
                  value={purchaseContractFilter}
                  placeholder="purchase-contract-id"
                  onChange={(event) => setPurchaseContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button loading={submitting} onClick={() => void downloadRecordExport()}>
                导出台账
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateRecord}>
                新增样品
              </Button>
            </form>
          </div>

          <Table<SampleRecord>
            columns={[
              {
                title: '样品编号',
                dataIndex: 'code',
                render: (value: string, record: SampleRecord) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenRecordDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '分类', dataIndex: 'sample_type', render: sampleRecordTypeLabel },
              { title: '产品', dataIndex: 'product_name' },
              { title: '客户货号', dataIndex: 'customer_sku', render: nullableText },
              { title: '供应商货号', dataIndex: 'supplier_sku', render: nullableText },
              { title: '数量', dataIndex: 'quantity', width: 80 },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: SampleRecord) => (
                  <Button size="small" onClick={(event) => stopAndOpenRecordDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={records}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedRecord?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedRecordId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={recordModalOpen}
          title="新增样品"
          width={1040}
          onCancel={() => setRecordModalOpen(false)}
        >
          <form className="record-form entity-modal-form sample-modal-form" onSubmit={submitRecord}>
            <label>
              样品编号
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            </label>
            <label htmlFor="sample-record-type">
              样品分类
              <FormSelect
                id="sample-record-type"
                value={form.sample_type}
                onChange={(event) => setForm({ ...form, sample_type: event.target.value })}
              >
                {sampleRecordTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label htmlFor="sample-record-status">
              样品状态
              <FormSelect
                id="sample-record-status"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {sampleRecordStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              收样数量
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
              />
            </label>
            <label>
              收样日期
              <Input
                type="date"
                value={form.received_at}
                onChange={(event) => setForm({ ...form, received_at: event.target.value })}
              />
            </label>
            <label>
              提交日期
              <Input
                type="date"
                value={form.submitted_at}
                onChange={(event) => setForm({ ...form, submitted_at: event.target.value })}
              />
            </label>
            <label>
              产品编号
              <Input
                value={form.product_code}
                onChange={(event) => setForm({ ...form, product_code: event.target.value })}
              />
            </label>
            <label>
              产品名称
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <label>
              客户货号
              <Input
                value={form.customer_sku}
                onChange={(event) => setForm({ ...form, customer_sku: event.target.value })}
              />
            </label>
            <label>
              供应商货号
              <Input
                value={form.supplier_sku}
                onChange={(event) => setForm({ ...form, supplier_sku: event.target.value })}
              />
            </label>
            <label>
              客户名称
              <Input
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </label>
            <label>
              供应商名称
              <Input
                value={form.supplier_name}
                onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
              />
            </label>
            <label>
              采购合同号
              <Input
                value={form.purchase_contract_no}
                onChange={(event) =>
                  setForm({
                    ...form,
                    purchase_contract_no: event.target.value,
                    purchase_contract_id: event.target.value,
                  })
                }
              />
            </label>
            <label>
              单位
              <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
            </label>
            <label htmlFor="sample-record-source-type">
              样品来源
              <FormSelect
                id="sample-record-source-type"
                value={form.source_type}
                onChange={(event) => setForm({ ...form, source_type: event.target.value })}
              >
                {sampleSourceTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              来源单号
              <Input
                value={form.source_code}
                onChange={(event) => setForm({ ...form, source_code: event.target.value })}
              />
            </label>
            <label>
              样品说明
              <Input.TextArea
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <div className="form-divider">样品图片</div>
            <label>
              图片文件标识
              <Input
                value={form.image_file_id}
                onChange={(event) => setForm({ ...form, image_file_id: event.target.value })}
              />
            </label>
            <label>
              图片文件名
              <Input
                value={form.image_filename}
                onChange={(event) => setForm({ ...form, image_filename: event.target.value })}
              />
            </label>
            <label>
              图片地址
              <Input
                value={form.image_url}
                onChange={(event) => setForm({ ...form, image_url: event.target.value })}
              />
            </label>
            <label>
              图片说明
              <Input
                value={form.image_caption}
                onChange={(event) => setForm({ ...form, image_caption: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button className="secondary-inline" type="button" onClick={() => setRecordModalOpen(false)}>
                取消
              </button>
              <button className="secondary-inline" disabled={submitting} type="button" onClick={() => void submitRecordImport()}>
                按当前表单导入
              </button>
              <button className="inline-submit" disabled={submitting} type="submit">
                新增样品
              </button>
            </div>
          </form>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="样品明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(sampleRecordPath)}>
              返回列表
            </Button>
          </div>
          {selectedRecord ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>样品编号</dt>
                  <dd>{selectedRecord.code}</dd>
                </div>
                <div>
                  <dt>分类/状态</dt>
                  <dd>{sampleRecordTypeLabel(selectedRecord.sample_type)} / {sampleRecordStatusLabel(selectedRecord.status)}</dd>
                </div>
                <div>
                  <dt>产品</dt>
                  <dd>{selectedRecord.product_code ?? '-'} / {selectedRecord.product_name}</dd>
                </div>
                <div>
                  <dt>客户/供应商</dt>
                  <dd>{selectedRecord.customer_name ?? '-'} / {selectedRecord.supplier_name ?? '-'}</dd>
                </div>
                <div>
                  <dt>客户货号</dt>
                  <dd>{selectedRecord.customer_sku ?? '-'}</dd>
                </div>
                <div>
                  <dt>供应商货号</dt>
                  <dd>{selectedRecord.supplier_sku ?? '-'}</dd>
                </div>
                <div>
                  <dt>采购合同</dt>
                  <dd>{selectedRecord.purchase_contract_no ?? '-'}</dd>
                </div>
                <div>
                  <dt>收样/提交</dt>
                  <dd>{formatDate(selectedRecord.received_at)} / {formatDate(selectedRecord.submitted_at)}</dd>
                </div>
              </dl>

              <Table
                className="compact-section"
                columns={[
                  { title: '收样数', dataIndex: 'received_quantity' },
                  { title: '寄样数', dataIndex: 'delivered_quantity' },
                  { title: '公司留样', dataIndex: 'retained_quantity' },
                  { title: '单位', dataIndex: 'unit' },
                ]}
                dataSource={[selectedRecord.stock_summary]}
                pagination={false}
                rowKey="sample_record_id"
                size="small"
              />

              <Table<SampleRecordImage>
                className="compact-section"
                columns={[
                  { title: '图片文件', dataIndex: 'filename' },
                  { title: '文件标识', dataIndex: 'file_id' },
                  { title: '图片地址', dataIndex: 'url' },
                  { title: '说明', dataIndex: 'caption', render: nullableText },
                  {
                    title: '主图',
                    dataIndex: 'is_primary',
                    width: 72,
                    render: (value: boolean) => (value ? '是' : '否'),
                  },
                ]}
                dataSource={selectedRecord.images}
                locale={{ emptyText: '暂无样品图片' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <Table
                className="compact-section"
                columns={[
                  { title: '跟单节点', dataIndex: 'node_label' },
                  { title: '实际日期', dataIndex: 'actual_date', render: formatDate },
                  { title: '采购合同', dataIndex: 'purchase_contract_no', render: nullableText },
                  { title: '事件', dataIndex: 'event_type' },
                ]}
                dataSource={selectedRecord.followup_events}
                locale={{ emptyText: '暂无跟单节点事件' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="sample-record-actions compact-section">
                <form className="record-form" onSubmit={submitImage}>
                  <div className="form-divider">追加图片</div>
                  <label>
                    图片文件标识
                    <Input
                      value={imageForm.file_id}
                      onChange={(event) => setImageForm({ ...imageForm, file_id: event.target.value })}
                    />
                  </label>
                  <label>
                    图片文件名
                    <Input
                      value={imageForm.filename}
                      onChange={(event) => setImageForm({ ...imageForm, filename: event.target.value })}
                    />
                  </label>
                  <label>
                    图片地址
                    <Input
                      value={imageForm.url}
                      onChange={(event) => setImageForm({ ...imageForm, url: event.target.value })}
                    />
                  </label>
                  <label>
                    图片说明
                    <Input
                      value={imageForm.caption}
                      onChange={(event) => setImageForm({ ...imageForm, caption: event.target.value })}
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    追加样品图片
                  </Button>
                </form>

                <form className="record-form" onSubmit={submitStockEvent}>
                  <div className="form-divider">数量事件</div>
                  <label>
                    事件类型
                  <FormSelect
                    value={stockForm.event_type}
                    onChange={(event) => setStockForm({ ...stockForm, event_type: event.target.value })}
                  >
                    {sampleStockEventTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                  </label>
                  <label>
                    数量
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={stockForm.quantity}
                      onChange={(event) => setStockForm({ ...stockForm, quantity: event.target.value })}
                    />
                  </label>
                  <label>
                    日期
                    <Input
                      type="date"
                      value={stockForm.occurred_at}
                      onChange={(event) => setStockForm({ ...stockForm, occurred_at: event.target.value })}
                    />
                  </label>
                  <label>
                    单位
                    <Input
                      value={stockForm.unit}
                      onChange={(event) => setStockForm({ ...stockForm, unit: event.target.value })}
                    />
                  </label>
                  <label>
                    寄样单号
                    <Input
                      value={stockForm.delivery_no}
                      onChange={(event) => setStockForm({ ...stockForm, delivery_no: event.target.value })}
                    />
                  </label>
                  <label>
                    接收方
                    <Input
                      value={stockForm.recipient}
                      onChange={(event) => setStockForm({ ...stockForm, recipient: event.target.value })}
                    />
                  </label>
                  <label>
                    事件备注
                    <Input.TextArea
                      rows={2}
                      value={stockForm.note}
                      onChange={(event) => setStockForm({ ...stockForm, note: event.target.value })}
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    登记样品数量
                  </Button>
                </form>
              </div>

              <Table<SampleRecordStockEvent>
                className="compact-section"
                columns={[
                  { title: '事件类型', dataIndex: 'event_type', render: sampleStockEventTypeLabel },
                  { title: '数量', dataIndex: 'quantity' },
                  { title: '单位', dataIndex: 'unit' },
                  { title: '日期', dataIndex: 'occurred_at', render: formatDate },
                  { title: '寄样单号', dataIndex: 'delivery_no', render: nullableText },
                  { title: '接收方', dataIndex: 'recipient', render: nullableText },
                  { title: '备注', dataIndex: 'note', render: nullableText },
                ]}
                dataSource={selectedRecord.stock_events}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Images size={28} />
              <strong>暂无样品记录</strong>
              <span>请返回列表选择样品查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function SampleDeliveriesPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [deliveries, setDeliveries] = useState<SampleDelivery[]>([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [expressFilter, setExpressFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [feeStatistics, setFeeStatistics] = useState<SampleDeliveryFeeStatistics>(() =>
    initialSampleDeliveryFeeStatistics(),
  )
  const [deliveryStatistics, setDeliveryStatistics] = useState<SampleDeliveryStatistics>(() =>
    initialSampleDeliveryStatistics(),
  )
  const [sampleHistory, setSampleHistory] = useState<SampleDelivery[]>([])
  const [quoteHistory, setQuoteHistory] = useState<SampleDelivery[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<SampleDeliveryFormState>(() => initialSampleDeliveryForm())
  const [deliveryModalMode, setDeliveryModalMode] = useState<'create' | 'edit' | null>(null)
  const [approveForm, setApproveForm] = useState<SampleDeliveryApproveFormState>(() =>
    initialSampleDeliveryApproveForm(),
  )
  const [trackingForm, setTrackingForm] = useState<SampleDeliveryTrackingFormState>(() =>
    initialSampleDeliveryTrackingForm(),
  )

  const selectedDelivery = useMemo(
    () => {
      if (detailId) return deliveries.find((item) => item.id === detailId) ?? null
      return deliveries.find((item) => item.id === selectedDeliveryId) ?? deliveries[0] ?? null
    },
    [deliveries, detailId, selectedDeliveryId],
  )

  useEffect(() => {
    void loadDeliveries()
  }, [])

  useEffect(() => {
    if (detailId && deliveries.length > 0 && !deliveries.some((item) => item.id === detailId)) {
      onNavigate(sampleDeliveryPath)
    }
  }, [deliveries, detailId, onNavigate])

  useEffect(() => {
    syncDeliveryActionForms(selectedDelivery)
    void loadSelectedDeliveryHistories(selectedDelivery)
  }, [selectedDelivery?.id, selectedDelivery?.status, selectedDelivery?.tracking_no])

  async function loadDeliveries(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const reportFilters = {
        customer_id: customerFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
        express_company: expressFilter.trim() || undefined,
      }
      const [result, feeStats, deliveryStats] = await Promise.all([
        listSampleDeliveries({
          q: search.trim() || undefined,
          status: statusFilter || undefined,
          customer_id: customerFilter.trim() || undefined,
          express_company: expressFilter.trim() || undefined,
          date_from: dateFromFilter || undefined,
          date_to: dateToFilter || undefined,
        }),
        getSampleDeliveryFeeStatistics(reportFilters),
        getSampleDeliveryStatistics(reportFilters),
      ])
      setDeliveries(result.items)
      setFeeStatistics(feeStats)
      setDeliveryStatistics(deliveryStats)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedDeliveryId) ? selectedDeliveryId : null) ??
        result.items[0]?.id ??
        null
      setSelectedDeliveryId(nextSelectedId)
    } catch (caught) {
      showError(caught, '寄样管理加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadSelectedDeliveryHistories(delivery: SampleDelivery | null) {
    const line = delivery?.lines[0]
    if (!delivery || !line) {
      setSampleHistory([])
      setQuoteHistory([])
      return
    }
    try {
      const [sampleResult, quoteResult] = await Promise.all([
        getSampleDeliverySampleHistory(line.sample_record_id),
        getSampleDeliveryQuoteHistory({
          customer_id: delivery.customer_id ?? undefined,
          product_id: line.product_id ?? undefined,
        }),
      ])
      setSampleHistory(sampleResult.items)
      setQuoteHistory(quoteResult.items)
    } catch (caught) {
      showError(caught, '寄样历史加载失败')
    }
  }

  function syncDeliveryActionForms(delivery: SampleDelivery | null) {
    setApproveForm({
      reviewer_name: '演示业务主管',
      approved_at: delivery?.delivery_date ?? todayInputValue(),
    })
    setTrackingForm({
      express_company: delivery?.express_company ?? 'DHL',
      tracking_no: delivery?.tracking_no ?? '',
      status: delivery?.status === 'approved' ? 'shipped' : 'submitted',
    })
  }

  function upsertDelivery(delivery: SampleDelivery) {
    setDeliveries((current) => {
      const exists = current.some((item) => item.id === delivery.id)
      return exists
        ? current.map((item) => (item.id === delivery.id ? delivery : item))
        : [delivery, ...current]
    })
    setSelectedDeliveryId(delivery.id)
  }

  function openDeliveryDetail(delivery: SampleDelivery) {
    setSelectedDeliveryId(delivery.id)
    onNavigate(moduleDetailPath(sampleDeliveryPath, delivery.id))
  }

  function stopAndOpenDeliveryDetail(event: MouseEvent<HTMLElement>, delivery: SampleDelivery) {
    event.stopPropagation()
    openDeliveryDetail(delivery)
  }

  function openCreateDelivery() {
    setForm(initialSampleDeliveryForm())
    setDeliveryModalMode('create')
  }

  function openEditDelivery(delivery: SampleDelivery) {
    setForm(sampleDeliveryToForm(delivery))
    setDeliveryModalMode('edit')
  }

  async function submitDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const created = await createSampleDelivery(sampleDeliveryPayload(form))
      setMessage(`已新增寄样单 ${created.code}`)
      setForm(initialSampleDeliveryForm())
      setDeliveryModalMode(null)
      upsertDelivery(created)
      await loadDeliveries(created.id)
      setDeliveries((current) =>
        current.some((delivery) => delivery.id === created.id) ? current : [created, ...current],
      )
      setSelectedDeliveryId(created.id)
    } catch (caught) {
      showError(caught, '寄样单新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function saveDeliveryDraft() {
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updated = await updateSampleDelivery(selectedDelivery.id, sampleDeliveryPayload(form))
      setMessage(`已保存寄样单 ${updated.code}`)
      setDeliveryModalMode(null)
      upsertDelivery(updated)
      await loadDeliveries(updated.id)
    } catch (caught) {
      showError(caught, '寄样单草稿保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitDeliveryForReview() {
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitSampleDelivery(selectedDelivery.id)
      setMessage(`已提交寄样单 ${submitted.code}`)
      upsertDelivery(submitted)
      await loadDeliveries(submitted.id)
    } catch (caught) {
      showError(caught, '寄样单提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveDelivery() {
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveSampleDelivery(
        selectedDelivery.id,
        sampleDeliveryApprovePayload(approveForm),
      )
      setMessage(`已审核寄样单 ${approved.code}`)
      upsertDelivery(approved)
      await loadDeliveries(approved.id)
    } catch (caught) {
      showError(caught, '寄样单审核失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitTracking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const tracked = await updateSampleDeliveryTracking(
        selectedDelivery.id,
        sampleDeliveryTrackingPayload(trackingForm),
      )
      setMessage(`已更新物流 ${tracked.tracking_no ?? ''}`.trim())
      upsertDelivery(tracked)
      await loadDeliveries(tracked.id)
    } catch (caught) {
      showError(caught, '物流跟踪更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadDeliveryExport() {
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const exported = await exportSampleDeliveries({
        customer_id: customerFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
        express_company: expressFilter.trim() || undefined,
      })
      downloadCsv(exported.filename, exported.content)
      setMessage(`已导出 ${exported.total} 条寄样记录`)
    } catch (caught) {
      showError(caught, '寄样导出失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sample-delivery-page">
      <div className="summary-strip" aria-label="寄样管理概览">
        <Metric label="寄样单" value={deliveries.length} />
        <Metric label="待审核" value={deliveries.filter((item) => item.status === 'submitted').length} />
        <Metric label="已审核" value={deliveries.filter((item) => ['approved', 'shipped'].includes(item.status)).length} />
        <Metric label="寄样数量" value={deliveryStatistics.total_quantity} />
        <Metric label="费用" value={formatMoney(feeStatistics.total_amount, feeStatistics.currency)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid sample-delivery-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="寄样单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadDeliveries()
              }}
            >
              <label className="inline-filter-search">
                寄样搜索
                <Input
                  value={search}
                  placeholder="单号 / 客户 / 样品 / 快递"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact" htmlFor="sample-delivery-status-filter">
                审核状态
                <FormSelect
                  id="sample-delivery-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {sampleDeliveryStatusOptions
                    .filter((item) => item.value !== 'rejected')
                    .map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                </FormSelect>
              </label>
              <label className="inline-filter-compact">
                客户标识
                <Input
                  value={customerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                快递公司
                <Input
                  value={expressFilter}
                  placeholder="DHL / FedEx"
                  onChange={(event) => setExpressFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                寄样起始日期
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(event) => setDateFromFilter(event.target.value)}
                />
              </label>
              <label className="inline-filter-compact">
                寄样截止日期
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(event) => setDateToFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button loading={submitting} onClick={() => void downloadDeliveryExport()}>
                导出寄样
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateDelivery}>
                新增寄样单
              </Button>
            </form>
          </div>

          <Table<SampleDelivery>
            columns={[
              {
                title: '寄样单号',
                dataIndex: 'code',
                render: (value: string, record: SampleDelivery) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenDeliveryDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: sampleDeliveryStatusLabel },
              { title: '客户', dataIndex: 'customer_name' },
              {
                title: '快递',
                dataIndex: 'express_company',
                render: (_, record) => `${record.express_company} / ${record.tracking_no ?? '未填'}`,
              },
              { title: '报价单', dataIndex: 'quote_no', render: nullableText },
              {
                title: '费用',
                dataIndex: 'fee_total',
                render: (_, record) => formatMoney(record.fee_total, record.fees[0]?.currency ?? 'USD'),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: SampleDelivery) => (
                  <Button size="small" onClick={(event) => stopAndOpenDeliveryDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={deliveries}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedDelivery?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedDeliveryId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={Boolean(deliveryModalMode)}
          title={deliveryModalMode === 'edit' ? '编辑寄样单草稿' : '新增寄样单'}
          width={1040}
          onCancel={() => setDeliveryModalMode(null)}
        >
          <form
            className="record-form entity-modal-form sample-modal-form"
            onSubmit={
              deliveryModalMode === 'edit'
                ? (event) => {
                    event.preventDefault()
                    void saveDeliveryDraft()
                  }
                : submitDelivery
            }
          >
            <div className="form-pair two">
              <label>
                寄样单号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                寄样日期
                <Input
                  type="date"
                  value={form.delivery_date}
                  onChange={(event) => setForm({ ...form, delivery_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                客户标识
                <Input
                  value={form.customer_id}
                  onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
                />
              </label>
              <label>
                客户名称
                <Input
                  value={form.customer_name}
                  onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                供应商
                <Input
                  value={form.supplier_name}
                  onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
                />
              </label>
              <label>
                工厂
                <Input
                  value={form.factory_name}
                  onChange={(event) => setForm({ ...form, factory_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                收件人
                <Input
                  value={form.recipient_name}
                  onChange={(event) => setForm({ ...form, recipient_name: event.target.value })}
                />
              </label>
              <label>
                收件公司
                <Input
                  value={form.recipient_company}
                  onChange={(event) => setForm({ ...form, recipient_company: event.target.value })}
                />
              </label>
            </div>
            <label>
              收件地址
              <Input
                value={form.recipient_address}
                onChange={(event) => setForm({ ...form, recipient_address: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                快递公司
                <Input
                  value={form.express_company}
                  onChange={(event) => setForm({ ...form, express_company: event.target.value })}
                />
              </label>
              <label>
                快递单号
                <Input
                  value={form.tracking_no}
                  onChange={(event) => setForm({ ...form, tracking_no: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                报价单号
                <Input
                  value={form.quote_no}
                  onChange={(event) => setForm({ ...form, quote_no: event.target.value })}
                />
              </label>
              <label>
                报价标识
                <Input
                  value={form.quote_id}
                  onChange={(event) => setForm({ ...form, quote_id: event.target.value })}
                />
              </label>
            </div>
            <div className="form-divider">寄样明细</div>
            <div className="form-pair two">
              <label>
                样品标识
                <Input
                  value={form.sample_record_id}
                  onChange={(event) => setForm({ ...form, sample_record_id: event.target.value })}
                />
              </label>
              <label>
                样品编号
                <Input
                  value={form.sample_code}
                  onChange={(event) => setForm({ ...form, sample_code: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="sample-delivery-sample-type">
                样品分类
                <FormSelect
                  id="sample-delivery-sample-type"
                  value={form.sample_type}
                  onChange={(event) => setForm({ ...form, sample_type: event.target.value })}
                >
                  {sampleRecordTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                产品编号
                <Input
                  value={form.product_code}
                  onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                />
              </label>
            </div>
            <label>
              产品名称
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                寄样数量
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                />
              </label>
              <label>
                单位
                <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
              </label>
            </div>
            <label>
              明细备注
              <Input
                value={form.line_remark}
                onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
              />
            </label>
            <div className="form-divider">费用登记</div>
            <div className="form-pair two">
              <label htmlFor="sample-delivery-fee-type">
                费用类型
                <FormSelect
                  id="sample-delivery-fee-type"
                  value={form.fee_type}
                  onChange={(event) => setForm({ ...form, fee_type: event.target.value })}
                >
                  {sampleDeliveryFeeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                金额
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fee_amount}
                  onChange={(event) => setForm({ ...form, fee_amount: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                币种
                <Input
                  value={form.fee_currency}
                  onChange={(event) => setForm({ ...form, fee_currency: event.target.value })}
                />
              </label>
              <label htmlFor="sample-delivery-fee-payer">
                承担方
                <FormSelect
                  id="sample-delivery-fee-payer"
                  value={form.fee_payer_type}
                  onChange={(event) => setForm({ ...form, fee_payer_type: event.target.value })}
                >
                  {sampleDeliveryPayerTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <label>
              费用备注
              <Input
                value={form.fee_remark}
                onChange={(event) => setForm({ ...form, fee_remark: event.target.value })}
              />
            </label>
            <label htmlFor="sample-delivery-remark">
              寄样备注
              <Input.TextArea
                id="sample-delivery-remark"
                rows={2}
                value={form.remark}
                onChange={(event) => setForm({ ...form, remark: event.target.value })}
              />
            </label>
            <div className="modal-actions">
              <button className="secondary-inline" type="button" onClick={() => setDeliveryModalMode(null)}>
                取消
              </button>
              {deliveryModalMode === 'edit' ? (
                <button className="inline-submit" disabled={submitting} type="button" onClick={() => void saveDeliveryDraft()}>
                  保存草稿编辑
                </button>
              ) : (
                <button className="inline-submit" disabled={submitting} type="submit">
                  新增寄样单
                </button>
              )}
            </div>
          </form>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="寄样明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(sampleDeliveryPath)}>
              返回列表
            </Button>
          </div>
          {selectedDelivery ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/日期</dt>
                  <dd>{sampleDeliveryStatusLabel(selectedDelivery.status)} / {formatDate(selectedDelivery.delivery_date)}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedDelivery.customer_name}</dd>
                </div>
                <div>
                  <dt>供应商/工厂</dt>
                  <dd>{selectedDelivery.supplier_name ?? '未填'} / {selectedDelivery.factory_name ?? '未填'}</dd>
                </div>
                <div>
                  <dt>收件方</dt>
                  <dd>{selectedDelivery.recipient_name} / {selectedDelivery.recipient_company ?? '未填'}</dd>
                </div>
                <div>
                  <dt>快递</dt>
                  <dd>{selectedDelivery.express_company} / {selectedDelivery.tracking_no ?? '未填'}</dd>
                </div>
                <div>
                  <dt>报价单</dt>
                  <dd>{selectedDelivery.quote_no ?? '未关联'}</dd>
                </div>
                <div>
                  <dt>费用合计</dt>
                  <dd>{formatMoney(selectedDelivery.fee_total, selectedDelivery.fees[0]?.currency ?? 'USD')}</dd>
                </div>
                <div>
                  <dt>审核人</dt>
                  <dd>{selectedDelivery.reviewer_name ?? '未审核'}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>寄样备注</strong>
                <p>{selectedDelivery.remark ?? selectedDelivery.recipient_address}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedDelivery.status !== 'draft'}
                  onClick={() => openEditDelivery(selectedDelivery)}
                >
                  编辑草稿
                </Button>
                <Button
                  disabled={selectedDelivery.status !== 'draft'}
                  loading={submitting}
                  onClick={() => void submitDeliveryForReview()}
                >
                  提交审核
                </Button>
                <Button
                  disabled={selectedDelivery.status !== 'submitted'}
                  loading={submitting}
                  type="primary"
                  onClick={() => void approveDelivery()}
                >
                  审核通过
                </Button>
              </div>

              <form className="record-form accessory-form" onSubmit={submitTracking}>
                <div className="form-divider">物流跟踪</div>
                <div className="form-pair three">
                  <label>
                    快递公司
                    <Input
                      value={trackingForm.express_company}
                      onChange={(event) =>
                        setTrackingForm({ ...trackingForm, express_company: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    快递单号
                    <Input
                      value={trackingForm.tracking_no}
                      onChange={(event) => setTrackingForm({ ...trackingForm, tracking_no: event.target.value })}
                    />
                  </label>
                  <label>
                    物流状态
                  <FormSelect
                    value={trackingForm.status}
                    onChange={(event) => setTrackingForm({ ...trackingForm, status: event.target.value })}
                  >
                    {sampleDeliveryTrackingStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                  </label>
                </div>
                <Button htmlType="submit" loading={submitting}>
                  更新物流
                </Button>
              </form>

              <Table<SampleDeliveryLine>
                className="compact-section"
                columns={[
                  { title: '样品编号', dataIndex: 'sample_code', render: nullableText },
                  {
                    title: '产品',
                    dataIndex: 'product_name',
                    render: (_, line) => `${line.product_code ?? '未填'} / ${line.product_name}`,
                  },
                  { title: '数量', dataIndex: 'quantity', render: (_, line) => `${line.quantity} ${line.unit}` },
                  { title: '分类', dataIndex: 'sample_type', render: sampleRecordTypeLabel },
                  { title: '备注', dataIndex: 'remark', render: nullableText },
                ]}
                dataSource={selectedDelivery.lines}
                locale={{ emptyText: '暂无寄样明细' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <Table<SampleDeliveryFee>
                className="compact-section"
                columns={[
                  { title: '费用类型', dataIndex: 'fee_type', render: sampleDeliveryFeeTypeLabel },
                  { title: '金额', dataIndex: 'amount', render: (_, fee) => formatMoney(fee.amount, fee.currency) },
                  { title: '承担方', dataIndex: 'payer_type', render: sampleDeliveryPayerTypeLabel },
                  { title: '备注', dataIndex: 'remark', render: nullableText },
                ]}
                dataSource={selectedDelivery.fees}
                locale={{ emptyText: '暂无费用明细' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>费用统计</strong>
                <span>{formatMoney(feeStatistics.total_amount, feeStatistics.currency)}</span>
              </div>
              <Table<SampleDeliveryFeeStatistic>
                columns={[
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '快递公司', dataIndex: 'express_company' },
                  { title: '寄样单数', dataIndex: 'delivery_count' },
                  {
                    title: '费用合计',
                    dataIndex: 'total_amount',
                    render: (_, item) => formatMoney(item.total_amount, item.currency),
                  },
                ]}
                dataSource={feeStatistics.items}
                locale={{ emptyText: '暂无已审核费用' }}
                pagination={false}
                rowKey={(item) => `${item.customer_id ?? 'none'}-${item.express_company}-${item.currency}`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>寄样统计</strong>
                <span>{deliveryStatistics.total_deliveries} 单 / {deliveryStatistics.total_quantity} 件</span>
              </div>
              <Table<SampleDeliveryStatusStatistic>
                columns={[
                  { title: '状态', dataIndex: 'status', render: sampleDeliveryStatusLabel },
                  { title: '寄样单数', dataIndex: 'delivery_count' },
                  { title: '寄样数量', dataIndex: 'total_quantity' },
                ]}
                dataSource={deliveryStatistics.by_status}
                locale={{ emptyText: '暂无状态统计' }}
                pagination={false}
                rowKey="status"
                size="small"
              />
              <Table<SampleDeliveryCustomerStatistic>
                className="compact-section"
                columns={[
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '寄样单数', dataIndex: 'delivery_count' },
                  { title: '寄样数量', dataIndex: 'total_quantity' },
                ]}
                dataSource={deliveryStatistics.by_customer}
                locale={{ emptyText: '暂无客户统计' }}
                pagination={false}
                rowKey={(item) => item.customer_id ?? item.customer_name}
                size="small"
              />
              <Table<SampleDeliveryExpressStatistic>
                className="compact-section"
                columns={[
                  { title: '快递公司', dataIndex: 'express_company' },
                  { title: '寄样单数', dataIndex: 'delivery_count' },
                  { title: '寄样数量', dataIndex: 'total_quantity' },
                ]}
                dataSource={deliveryStatistics.by_express}
                locale={{ emptyText: '暂无快递统计' }}
                pagination={false}
                rowKey="express_company"
                size="small"
              />

              <div className="accessory-heading">
                <strong>样品寄样历史</strong>
                <span>{sampleHistory.length} 条</span>
              </div>
              <Table<SampleDelivery>
                columns={[
                  { title: '寄样单', dataIndex: 'code' },
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '日期', dataIndex: 'delivery_date', render: formatDate },
                  { title: '状态', dataIndex: 'status', render: sampleDeliveryStatusLabel },
                  {
                    title: '快递',
                    dataIndex: 'express_company',
                    render: (_, delivery) => `${delivery.express_company} / ${delivery.tracking_no ?? '未填'}`,
                  },
                ]}
                dataSource={sampleHistory}
                locale={{ emptyText: '暂无该样品寄样历史' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>报价关联寄样</strong>
                <span>{quoteHistory.length} 条</span>
              </div>
              <Table<SampleDelivery>
                columns={[
                  { title: '报价单', dataIndex: 'quote_no', render: nullableText },
                  { title: '寄样单', dataIndex: 'code' },
                  { title: '客户', dataIndex: 'customer_name' },
                  {
                    title: '产品',
                    dataIndex: 'lines',
                    render: (_, delivery) => delivery.lines[0]?.product_name ?? '未填',
                  },
                  { title: '审核日期', dataIndex: 'approved_at', render: formatDate },
                ]}
                dataSource={quoteHistory}
                locale={{ emptyText: '暂无报价关联寄样记录' }}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Send size={28} />
              <strong>暂无寄样单</strong>
              <span>请返回列表选择寄样单查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function ExportQuotationsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [quotations, setQuotations] = useState<ExportQuotation[]>([])
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [history, setHistory] = useState<ExportQuotation[]>([])
  const [purchaseReferences, setPurchaseReferences] = useState<ExportQuotationPurchaseReference[]>([])
  const [sampleDeliveries, setSampleDeliveries] = useState<SampleDelivery[]>([])
  const [exportPreview, setExportPreview] = useState('')
  const [generatedContract, setGeneratedContract] = useState<ExportQuotationContract | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<ExportQuotationFormState>(() => initialExportQuotationForm())
  const [approveForm, setApproveForm] = useState<ExportQuotationApproveFormState>(() =>
    initialExportQuotationApproveForm(),
  )
  const [contractForm, setContractForm] = useState<ExportQuotationContractFormState>(() =>
    initialExportQuotationContractForm(),
  )

  const selectedQuotation = useMemo(
    () => {
      if (detailId) return quotations.find((item) => item.id === detailId) ?? null
      return quotations.find((item) => item.id === selectedQuotationId) ?? quotations[0] ?? null
    },
    [detailId, quotations, selectedQuotationId],
  )

  useEffect(() => {
    void loadQuotations()
    void loadQuotationCustomerOptions()
  }, [])

  useEffect(() => {
    if (!detailId) {
      setHistory([])
      setPurchaseReferences([])
      setSampleDeliveries([])
      return
    }
    syncExportQuotationActionForms(selectedQuotation)
    void loadSelectedQuotationReferences(selectedQuotation)
  }, [detailId, selectedQuotation?.id, selectedQuotation?.approval_status])

  useEffect(() => {
    if (detailId && quotations.length > 0 && !quotations.some((item) => item.id === detailId)) {
      onNavigate(exportQuotationPath)
    }
  }, [detailId, onNavigate, quotations])

  async function loadQuotations(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listExportQuotations({
        q: search.trim() || undefined,
        approval_status: statusFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
      })
      setQuotations(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedQuotationId) ? selectedQuotationId : null) ??
        result.items[0]?.id ??
        null
      setSelectedQuotationId(nextSelectedId)
    } catch (caught) {
      showError(caught, '出口报价加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadQuotationCustomerOptions() {
    setLoadingCustomers(true)
    try {
      const result = await listCustomers()
      setCustomers(result.items)
    } catch (caught) {
      showError(caught, '客户资料加载失败')
    } finally {
      setLoadingCustomers(false)
    }
  }

  function applyCustomerToQuotationForm(customerId?: string) {
    const customer = customers.find((item) => item.id === customerId)
    setForm((current) => ({
      ...current,
      customer_id: customer?.id ?? '',
      customer_name: customer ? customerDisplayName(customer) : '',
    }))
  }

  async function loadSelectedQuotationReferences(quotation: ExportQuotation | null) {
    const line = quotation?.lines[0]
    if (!quotation) {
      setHistory([])
      setPurchaseReferences([])
      setSampleDeliveries([])
      return
    }
    try {
      const [historyResult, referenceResult, deliveryResult] = await Promise.all([
        getExportQuotationHistory({
          customer_id: quotation.customer_id ?? undefined,
          product_id: line?.product_id ?? undefined,
        }),
        getExportQuotationPurchaseReferences({
          product_id: line?.product_id ?? undefined,
        }),
        getExportQuotationSampleDeliveries(quotation.id),
      ])
      setHistory(historyResult.items)
      setPurchaseReferences(referenceResult.items)
      setSampleDeliveries(deliveryResult.items)
    } catch (caught) {
      showError(caught, '报价参考资料加载失败')
    }
  }

  function syncExportQuotationActionForms(quotation: ExportQuotation | null) {
    setApproveForm({
      reviewer_name: '演示业务主管',
      approved_at: quotation?.quote_date ?? todayInputValue(),
    })
    setContractForm({
      confirmed_at: quotation?.approved_at ?? todayInputValue(),
      contract_no: quotation?.generated_contract_no ?? `EC-${quotation?.code ?? Date.now().toString().slice(-6)}`,
    })
  }

  function upsertQuotation(quotation: ExportQuotation) {
    setQuotations((current) => {
      const exists = current.some((item) => item.id === quotation.id)
      return exists
        ? current.map((item) => (item.id === quotation.id ? quotation : item))
        : [quotation, ...current]
    })
    setSelectedQuotationId(quotation.id)
  }

  function openQuotationDetail(quotation: ExportQuotation) {
    setSelectedQuotationId(quotation.id)
    onNavigate(moduleDetailPath(exportQuotationPath, quotation.id))
  }

  function stopAndOpenQuotationDetail(event: MouseEvent<HTMLElement>, quotation: ExportQuotation) {
    event.stopPropagation()
    openQuotationDetail(quotation)
  }

  function loadQuotationIntoForm(quotation: ExportQuotation) {
    setSelectedQuotationId(quotation.id)
    setForm(exportQuotationToForm(quotation))
    onNavigate(exportQuotationPath)
  }

  async function submitQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    setExportPreview('')
    try {
      const created = await createExportQuotation(exportQuotationPayload(form))
      setMessage(`已新增出口报价 ${created.code}`)
      setForm(initialExportQuotationForm())
      upsertQuotation(created)
      await loadQuotations(created.id)
      setQuotations((current) =>
        current.some((quotation) => quotation.id === created.id) ? current : [created, ...current],
      )
      setSelectedQuotationId(created.id)
    } catch (caught) {
      showError(caught, '出口报价新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function saveQuotationDraft() {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updated = await updateExportQuotation(selectedQuotation.id, exportQuotationPayload(form))
      setMessage(`已保存出口报价 ${updated.code}`)
      upsertQuotation(updated)
      await loadQuotations(updated.id)
    } catch (caught) {
      showError(caught, '出口报价草稿保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitQuotationForApproval() {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitExportQuotation(selectedQuotation.id)
      setMessage(`已提交出口报价 ${submitted.code}`)
      upsertQuotation(submitted)
      await loadQuotations(submitted.id)
    } catch (caught) {
      showError(caught, '出口报价提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveQuotation() {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveExportQuotation(
        selectedQuotation.id,
        exportQuotationApprovePayload(approveForm),
      )
      setMessage(`已审批出口报价 ${approved.code}`)
      upsertQuotation(approved)
      await loadQuotations(approved.id)
    } catch (caught) {
      showError(caught, '出口报价审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function exportQuotation(format: 'pdf' | 'excel') {
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const result = await exportExportQuotation(selectedQuotation.id, format)
      setExportPreview(result.content.split('\n').slice(0, 10).join('\n'))
      setMessage(`已生成导出预览 ${result.filename}`)
    } catch (caught) {
      showError(caught, '出口报价导出失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedQuotation) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const contract = await confirmExportQuotationContract(
        selectedQuotation.id,
        exportQuotationContractPayload(contractForm),
      )
      setGeneratedContract(contract)
      setMessage(`已生成出口合同 ${contract.contract_no}`)
      await loadQuotations(selectedQuotation.id)
    } catch (caught) {
      showError(caught, '出口合同生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = quotations.reduce((sum, item) => sum + Number(item.total_amount), 0)
  const currency = quotations[0]?.currency ?? 'USD'

  return (
    <section className="export-quotation-page">
      <OperationFlowRail activePath={exportQuotationPath} kind="sales" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="出口报价概览">
        <Metric label="报价单" value={quotations.length} />
        <Metric label="待审批" value={quotations.filter((item) => item.approval_status === 'submitted').length} />
        <Metric
          label="已审批"
          value={quotations.filter((item) => ['approved', 'contract_generated'].includes(item.approval_status)).length}
        />
        <Metric label="报价金额" value={formatMoney(totalAmount.toFixed(2), currency)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid export-quotation-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="报价单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadQuotations()
              }}
            >
              <label>
                报价搜索
                <Input
                  value={search}
                  placeholder="单号 / 客户 / 产品 / 条款"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                审批状态
              <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {exportQuotationStatusOptions
                  .filter((item) => item.value !== 'rejected')
                  .map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
              </FormSelect>
              </label>
              <label>
                客户筛选
                <Select
                  allowClear
                  showSearch
                  loading={loadingCustomers}
                  value={customerFilter || undefined}
                  placeholder="从客户资料筛选"
                  optionFilterProp="label"
                  notFoundContent={loadingCustomers ? '加载客户资料中' : '暂无客户资料'}
                  onChange={(value) => setCustomerFilter(value ?? '')}
                >
                  {renderCustomerOptions(customers)}
                </Select>
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>

          <Table<ExportQuotation>
            columns={[
              {
                title: '报价单号',
                dataIndex: 'code',
                render: (value: string, record: ExportQuotation) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenQuotationDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'approval_status', render: exportQuotationStatusLabel },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '贸易条款', dataIndex: 'trade_term' },
              {
                title: '金额',
                dataIndex: 'total_amount',
                render: (_, quotation) => formatMoney(quotation.total_amount, quotation.currency),
              },
              { title: '合同', dataIndex: 'generated_contract_no', render: nullableText },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: ExportQuotation) => (
                  <Button size="small" onClick={(event) => stopAndOpenQuotationDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={quotations}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedQuotation?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedQuotationId(record.id),
            })}
          />
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel form-panel product-form-panel">
          <PanelTitle icon={<LayoutDashboard size={18} />} title="新增出口报价" />
          <form className="record-form" onSubmit={submitQuotation}>
            <div className="form-pair two">
              <label>
                报价单号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                报价日期
                <Input
                  type="date"
                  value={form.quote_date}
                  onChange={(event) => setForm({ ...form, quote_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                选择客户
                <Select
                  allowClear
                  showSearch
                  loading={loadingCustomers}
                  value={form.customer_id || undefined}
                  placeholder={customers.length > 0 ? '从客户资料选择' : '请先在客户资料录入'}
                  optionFilterProp="label"
                  notFoundContent={loadingCustomers ? '加载客户资料中' : '暂无客户资料'}
                  onChange={applyCustomerToQuotationForm}
                >
                  {renderCustomerOptions(customers)}
                </Select>
              </label>
              <label>
                客户标识
                <Input value={form.customer_id} readOnly placeholder="选择客户后自动带出" />
              </label>
            </div>
            <label>
              客户名称
              <Input value={form.customer_name} readOnly placeholder="选择客户后自动带出" />
            </label>
            <div className="form-pair two">
              <label>
                业务员
                <Input
                  value={form.sales_user_name}
                  onChange={(event) => setForm({ ...form, sales_user_name: event.target.value })}
                />
              </label>
              <label>
                币种
                <Input
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                贸易条款
                <Input
                  value={form.trade_term}
                  onChange={(event) => setForm({ ...form, trade_term: event.target.value })}
                />
              </label>
              <label>
                有效期
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(event) => setForm({ ...form, valid_until: event.target.value })}
                />
              </label>
            </div>
            <label>
              报价描述
              <Input.TextArea
                rows={2}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <div className="form-divider">报价商品明细</div>
            <div className="form-pair two">
              <label>
                商品标识
                <Input
                  value={form.product_id}
                  onChange={(event) => setForm({ ...form, product_id: event.target.value })}
                />
              </label>
              <label>
                商品编号
                <Input
                  value={form.product_code}
                  onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                />
              </label>
            </div>
            <label>
              商品名称
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                规格
                <Input
                  value={form.specification}
                  onChange={(event) => setForm({ ...form, specification: event.target.value })}
                />
              </label>
              <label>
                型号
                <Input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                数量
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                />
              </label>
              <label>
                单位
                <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
              </label>
              <label>
                销售单价
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.unit_price}
                  onChange={(event) => setForm({ ...form, unit_price: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                货运方式
                <FormSelect
                value={form.freight_method}
                onChange={(event) => setForm({ ...form, freight_method: event.target.value })}
              >
                {freightMethodOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
              <label>
                运费
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.freight_amount}
                  onChange={(event) => setForm({ ...form, freight_amount: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                采购参考供应商
                <Input
                  value={form.purchase_reference_supplier_name}
                  onChange={(event) =>
                    setForm({ ...form, purchase_reference_supplier_name: event.target.value })
                  }
                />
              </label>
              <label>
                采购参考价
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={form.purchase_reference_price}
                  onChange={(event) => setForm({ ...form, purchase_reference_price: event.target.value })}
                />
              </label>
            </div>
            <label>
              明细备注
              <Input
                value={form.line_remark}
                onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              新增出口报价
            </Button>
            <Button
              disabled={!selectedQuotation || selectedQuotation.approval_status !== 'draft'}
              loading={submitting}
              onClick={() => void saveQuotationDraft()}
            >
              保存草稿编辑
            </Button>
          </form>
          </section>
        ) : null}

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="报价单明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(exportQuotationPath)}>
              返回列表
            </Button>
          </div>
          {selectedQuotation ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/日期</dt>
                  <dd>{exportQuotationStatusLabel(selectedQuotation.approval_status)} / {formatDate(selectedQuotation.quote_date)}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedQuotation.customer_name}</dd>
                </div>
                <div>
                  <dt>业务员</dt>
                  <dd>{selectedQuotation.sales_user_name ?? '未填'}</dd>
                </div>
                <div>
                  <dt>贸易条款</dt>
                  <dd>{selectedQuotation.trade_term}</dd>
                </div>
                <div>
                  <dt>报价金额</dt>
                  <dd>{formatMoney(selectedQuotation.total_amount, selectedQuotation.currency)}</dd>
                </div>
                <div>
                  <dt>审核人</dt>
                  <dd>{selectedQuotation.reviewer_name ?? '未审批'}</dd>
                </div>
                <div>
                  <dt>合同号</dt>
                  <dd>{selectedQuotation.generated_contract_no ?? generatedContract?.contract_no ?? '未生成'}</dd>
                </div>
                <div>
                  <dt>有效期</dt>
                  <dd>{formatDate(selectedQuotation.valid_until)}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>报价描述</strong>
                <p>{selectedQuotation.description ?? '未填写报价描述'}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedQuotation.approval_status !== 'draft'}
                  onClick={() => loadQuotationIntoForm(selectedQuotation)}
                >
                  载入编辑
                </Button>
                <Button
                  disabled={selectedQuotation.approval_status !== 'draft'}
                  loading={submitting}
                  onClick={() => void submitQuotationForApproval()}
                >
                  提交审批
                </Button>
                <Button
                  disabled={selectedQuotation.approval_status !== 'submitted'}
                  loading={submitting}
                  type="primary"
                  onClick={() => void approveQuotation()}
                >
                  审批通过
                </Button>
                <Button loading={submitting} onClick={() => void exportQuotation('pdf')}>
                  导出 PDF
                </Button>
              </div>

              <form className="record-form accessory-form" onSubmit={confirmContract}>
                <div className="form-divider">报价确认生成出口合同</div>
                <div className="form-pair two">
                  <label>
                    确认日期
                    <Input
                      type="date"
                      value={contractForm.confirmed_at}
                      onChange={(event) =>
                        setContractForm({ ...contractForm, confirmed_at: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    合同号
                    <Input
                      value={contractForm.contract_no}
                      onChange={(event) => setContractForm({ ...contractForm, contract_no: event.target.value })}
                    />
                  </label>
                </div>
                <Button
                  htmlType="submit"
                  loading={submitting}
                  disabled={!['approved', 'contract_generated'].includes(selectedQuotation.approval_status)}
                >
                  生成出口合同
                </Button>
              </form>

              {generatedContract ? (
                <div className="transaction-box">
                  <strong>已生成出口合同</strong>
                  <p>{generatedContract.contract_no} / {formatMoney(generatedContract.total_amount, generatedContract.currency)}</p>
                </div>
              ) : null}

              {exportPreview ? (
                <div className="transaction-box export-preview">
                  <strong>导出预览</strong>
                  <pre>{exportPreview}</pre>
                </div>
              ) : null}

              <Table<ExportQuotationLine>
                className="compact-section"
                columns={[
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '规格', dataIndex: 'specification', render: nullableText },
                  { title: '型号', dataIndex: 'model', render: nullableText },
                  { title: '数量', dataIndex: 'quantity', render: (_, line) => `${line.quantity} ${line.unit}` },
                  { title: '销售单价', dataIndex: 'unit_price' },
                  { title: '金额', dataIndex: 'amount' },
                  { title: '货运方式', dataIndex: 'freight_method', render: freightMethodLabel },
                  { title: '运费', dataIndex: 'freight_amount' },
                ]}
                dataSource={selectedQuotation.lines}
                locale={{ emptyText: '暂无报价商品明细' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>历史报价</strong>
                <span>{history.length} 条</span>
              </div>
              <Table<ExportQuotation>
                columns={[
                  { title: '报价单', dataIndex: 'code' },
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '日期', dataIndex: 'quote_date', render: formatDate },
                  { title: '状态', dataIndex: 'approval_status', render: exportQuotationStatusLabel },
                  {
                    title: '金额',
                    dataIndex: 'total_amount',
                    render: (_, quotation) => formatMoney(quotation.total_amount, quotation.currency),
                  },
                ]}
                dataSource={history}
                locale={{ emptyText: '暂无历史报价' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>采购询价参考</strong>
                <span>{purchaseReferences.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>供应商</th>
                    <th>参考价</th>
                    <th>日期</th>
                    <th>来源单号</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseReferences.map((item) => (
                    <tr key={`${item.source_quotation_no}-${item.supplier_name}`}>
                      <td>{item.supplier_name}</td>
                      <td>{formatMoney(item.reference_price, item.currency)}</td>
                      <td>{formatDate(item.quote_date)}</td>
                      <td>{item.source_quotation_no}</td>
                    </tr>
                  ))}
                  {purchaseReferences.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={4}>暂无采购询价参考</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>寄样关联</strong>
                <span>{sampleDeliveries.length} 条</span>
              </div>
              <Table<SampleDelivery>
                columns={[
                  { title: '寄样单', dataIndex: 'code' },
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '日期', dataIndex: 'delivery_date', render: formatDate },
                  { title: '状态', dataIndex: 'status', render: sampleDeliveryStatusLabel },
                  {
                    title: '快递',
                    dataIndex: 'express_company',
                    render: (_, delivery) => `${delivery.express_company} / ${delivery.tracking_no ?? '未填'}`,
                  },
                ]}
                dataSource={sampleDeliveries}
                locale={{ emptyText: '暂无寄样关联' }}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FileText size={28} />
              <strong>暂无出口报价</strong>
              <span>请返回列表选择报价单查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function ExportContractsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [contracts, setContracts] = useState<ExportContract[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [history, setHistory] = useState<ExportQuotation[]>([])
  const [exportPreview, setExportPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [form, setForm] = useState<ExportContractFormState>(() => initialExportContractForm())
  const [approveForm, setApproveForm] = useState<ExportContractApproveFormState>(() =>
    initialExportContractApproveForm(),
  )
  const [signatureForm, setSignatureForm] = useState<ExportContractSignatureFormState>(() =>
    initialExportContractSignatureForm(),
  )
  const [advancePaymentForm, setAdvancePaymentForm] =
    useState<ExportContractAdvancePaymentFormState>(() => initialExportContractAdvancePaymentForm())

  const selectedContract = useMemo(
    () => {
      if (detailId) return contracts.find((item) => item.id === detailId) ?? null
      return contracts.find((item) => item.id === selectedContractId) ?? contracts[0] ?? null
    },
    [contracts, detailId, selectedContractId],
  )

  useEffect(() => {
    void loadContracts()
    void loadCustomerOptions()
  }, [])

  useEffect(() => {
    if (!detailId) {
      setHistory([])
      return
    }
    syncExportContractActionForms(selectedContract)
    void loadSelectedContractHistory(selectedContract)
  }, [detailId, selectedContract?.id, selectedContract?.approval_status, selectedContract?.signature_status])

  useEffect(() => {
    if (detailId && contracts.length > 0 && !contracts.some((item) => item.id === detailId)) {
      onNavigate(exportContractPath)
    }
  }, [contracts, detailId, onNavigate])

  async function loadContracts(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listExportContracts({
        q: search.trim() || undefined,
        approval_status: statusFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
      })
      setContracts(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedContractId) ? selectedContractId : null) ??
        result.items[0]?.id ??
        null
      setSelectedContractId(nextSelectedId)
    } catch (caught) {
      showError(caught, '出口合同加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadCustomerOptions() {
    setLoadingCustomers(true)
    try {
      const result = await listCustomers()
      setCustomers(result.items)
    } catch (caught) {
      showError(caught, '客户资料加载失败')
    } finally {
      setLoadingCustomers(false)
    }
  }

  function applyCustomerToContractForm(customerId?: string) {
    const customer = customers.find((item) => item.id === customerId)
    setForm((current) => ({
      ...current,
      customer_id: customer?.id ?? '',
      customer_name: customer ? customerDisplayName(customer) : '',
    }))
  }

  async function loadSelectedContractHistory(contract: ExportContract | null) {
    const line = contract?.lines[0]
    if (!contract) {
      setHistory([])
      return
    }
    try {
      const result = await getExportQuotationHistory({
        customer_id: contract.customer_id ?? undefined,
        product_id: line?.product_id ?? undefined,
      })
      setHistory(result.items)
    } catch (caught) {
      showError(caught, '历史询报价参考加载失败')
    }
  }

  function syncExportContractActionForms(contract: ExportContract | null) {
    setApproveForm({
      reviewer_name: contract?.reviewer_name ?? '演示业务主管',
      approved_at: contract?.approved_at ?? todayInputValue(),
    })
    setSignatureForm({
      signed_by: contract?.signatures[0]?.signed_by ?? '',
      signed_at: contract?.customer_signed_at ?? contract?.contract_date ?? todayInputValue(),
      signature_method: contract?.signatures[0]?.signature_method ?? 'email_scan',
      file_no: contract?.signatures[0]?.file_no ?? '',
      remark: contract?.signatures[0]?.remark ?? '',
    })
    setAdvancePaymentForm({
      payment_no: `AR-${Date.now().toString().slice(-6)}`,
      received_at: todayInputValue(),
      amount: '',
      currency: contract?.currency ?? 'USD',
      payer_name: contract?.customer_name ?? '',
      remark: '',
    })
  }

  function upsertContract(contract: ExportContract) {
    setContracts((current) => {
      const exists = current.some((item) => item.id === contract.id)
      return exists
        ? current.map((item) => (item.id === contract.id ? contract : item))
        : [contract, ...current]
    })
    setSelectedContractId(contract.id)
  }

  function openContractDetail(contract: ExportContract) {
    setSelectedContractId(contract.id)
    onNavigate(moduleDetailPath(exportContractPath, contract.id))
  }

  function stopAndOpenContractDetail(event: MouseEvent<HTMLElement>, contract: ExportContract) {
    event.stopPropagation()
    openContractDetail(contract)
  }

  function loadContractIntoForm(contract: ExportContract) {
    setSelectedContractId(contract.id)
    setForm(exportContractToForm(contract))
    setCreateModalOpen(true)
  }

  async function submitContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    setExportPreview('')
    try {
      const created = await createExportContract(exportContractPayload(form))
      setMessage(`已新增出口合同 ${created.code}`)
      setForm(initialExportContractForm())
      setCreateModalOpen(false)
      upsertContract(created)
      await loadContracts(created.id)
    } catch (caught) {
      showError(caught, '出口合同新增失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function saveContractDraft() {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updated = await updateExportContract(selectedContract.id, exportContractPayload(form))
      setMessage(`已保存出口合同 ${updated.code}`)
      upsertContract(updated)
      await loadContracts(updated.id)
    } catch (caught) {
      showError(caught, '出口合同草稿保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitContractForApproval() {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitExportContract(selectedContract.id)
      setMessage(`已提交出口合同 ${submitted.code}`)
      upsertContract(submitted)
      await loadContracts(submitted.id)
    } catch (caught) {
      showError(caught, '出口合同提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveContract() {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveExportContract(
        selectedContract.id,
        exportContractApprovePayload(approveForm),
      )
      setMessage(`已审批出口合同 ${approved.code}`)
      upsertContract(approved)
      await loadContracts(approved.id)
    } catch (caught) {
      showError(caught, '出口合同审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function registerSignature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const signed = await registerExportContractSignature(
        selectedContract.id,
        exportContractSignaturePayload(signatureForm),
      )
      setMessage(`已登记合同回签 ${signed.code}`)
      upsertContract(signed)
      await loadContracts(signed.id)
    } catch (caught) {
      showError(caught, '合同回签登记失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function addAdvancePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const payment = await addExportContractAdvancePayment(
        selectedContract.id,
        exportContractAdvancePaymentPayload(advancePaymentForm),
      )
      setContracts((current) =>
        current.map((contract) =>
          contract.id === selectedContract.id
            ? {
                ...contract,
                advance_payments: [payment, ...contract.advance_payments],
              }
            : contract,
        ),
      )
      setMessage(`已关联预收款 ${payment.payment_no}`)
      setAdvancePaymentForm({
        ...initialExportContractAdvancePaymentForm(),
        currency: selectedContract.currency,
        payer_name: selectedContract.customer_name,
      })
      await loadContracts(selectedContract.id)
    } catch (caught) {
      showError(caught, '预收款关联失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function exportContract(format: 'pdf' | 'excel') {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const result = await exportExportContract(selectedContract.id, format)
      setExportPreview(result.content.split('\n').slice(0, 14).join('\n'))
      setMessage(`已生成合同导出预览 ${result.filename}`)
    } catch (caught) {
      showError(caught, '出口合同导出失败')
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = contracts.reduce((sum, item) => sum + Number(item.statistics.total_amount), 0)
  const totalAdvance = contracts.reduce(
    (sum, item) => sum + Number(item.statistics.advance_payment_amount),
    0,
  )
  const currency = contracts[0]?.currency ?? 'USD'

  return (
    <section className="export-contract-page">
      <OperationFlowRail activePath={exportContractPath} kind="sales" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="出口合同概览">
        <Metric label="合同数" value={contracts.length} />
        <Metric label="待审批" value={contracts.filter((item) => item.approval_status === 'submitted').length} />
        <Metric label="已审批" value={contracts.filter((item) => item.approval_status === 'approved').length} />
        <Metric label="合同金额" value={formatMoney(totalAmount.toFixed(2), currency)} />
        <Metric label="预收款" value={formatMoney(totalAdvance.toFixed(2), currency)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid export-contract-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="合同列表" />
            <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
              新增合同
            </Button>
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadContracts()
            }}
          >
            <label>
              合同搜索
              <Input
                value={search}
                placeholder="合同号 / 客户 / 产品 / 条款"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              审批状态
              <FormSelect
                id="export-contract-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {exportContractStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              客户筛选
              <Select
                allowClear
                showSearch
                loading={loadingCustomers}
                value={customerFilter || undefined}
                placeholder="从客户资料筛选"
                optionFilterProp="label"
                notFoundContent={loadingCustomers ? '加载客户资料中' : '暂无客户资料'}
                onChange={(value) => setCustomerFilter(value ?? '')}
              >
                {renderCustomerOptions(customers)}
              </Select>
            </label>
            <label>
              <span>&nbsp;</span>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </label>
          </form>

          <Table<ExportContract>
            columns={[
              {
                title: '合同号',
                dataIndex: 'code',
                render: (value: string, record: ExportContract) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenContractDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'approval_status', render: exportContractStatusLabel },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '计划出运日', dataIndex: 'planned_ship_date', render: formatDate },
              {
                title: '金额',
                dataIndex: 'statistics',
                render: (_, contract) => formatMoney(contract.statistics.total_amount, contract.currency),
              },
              { title: '回签', dataIndex: 'signature_status', render: signatureStatusLabel },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: ExportContract) => (
                  <Button size="small" onClick={(event) => stopAndOpenContractDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={contracts}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedContract?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedContractId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={createModalOpen}
          title={selectedContract && form.code ? '编辑出口合同' : '新增出口合同'}
          width={960}
          onCancel={() => setCreateModalOpen(false)}
        >
          <form className="record-form entity-modal-form contract-modal-form" onSubmit={submitContract}>
            <div className="form-row">
              <label>
                合同号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                合同日期
                <Input
                  type="date"
                  value={form.contract_date}
                  onChange={(event) => setForm({ ...form, contract_date: event.target.value })}
                />
              </label>
              <label>
                业务员
                <Input
                  value={form.sales_user_name}
                  onChange={(event) => setForm({ ...form, sales_user_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                选择客户
                <Select
                  allowClear
                  showSearch
                  loading={loadingCustomers}
                  value={form.customer_id || undefined}
                  placeholder={customers.length > 0 ? '从客户资料选择' : '请先在客户资料录入'}
                  optionFilterProp="label"
                  notFoundContent={loadingCustomers ? '加载客户资料中' : '暂无客户资料'}
                  onChange={applyCustomerToContractForm}
                >
                  {renderCustomerOptions(customers)}
                </Select>
              </label>
              <label>
                客户名称
                <Input value={form.customer_name} readOnly placeholder="选择客户后自动带出" />
              </label>
              <label>
                币种
                <Input
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                贸易条款
                <Input
                  value={form.trade_term}
                  onChange={(event) => setForm({ ...form, trade_term: event.target.value })}
                />
              </label>
              <label>
                付款条款
                <Input
                  value={form.payment_terms}
                  onChange={(event) => setForm({ ...form, payment_terms: event.target.value })}
                />
              </label>
              <label>
                计划出运日
                <Input
                  type="date"
                  value={form.planned_ship_date}
                  onChange={(event) => setForm({ ...form, planned_ship_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                来源报价号
                <Input
                  value={form.source_quotation_no}
                  onChange={(event) => setForm({ ...form, source_quotation_no: event.target.value })}
                />
              </label>
              <label>
                合同备注
                <Input
                  value={form.remarks}
                  onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                />
              </label>
              <label>
                <span>&nbsp;</span>
                <Button htmlType="submit" type="primary" loading={submitting}>
                  {selectedContract && form.code ? '保存合同' : '新增出口合同'}
                </Button>
              </label>
            </div>
            <div className="form-divider">合同商品明细</div>
            <div className="form-row">
              <label>
                商品编号
                <Input
                  value={form.product_code}
                  onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                />
              </label>
              <label>
                商品名称
                <Input
                  value={form.product_name}
                  onChange={(event) => setForm({ ...form, product_name: event.target.value })}
                />
              </label>
              <label>
                规格
                <Input
                  value={form.specification}
                  onChange={(event) => setForm({ ...form, specification: event.target.value })}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                型号
                <Input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
              </label>
              <label>
                数量
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                />
              </label>
              <label>
                销售单价
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.unit_price}
                  onChange={(event) => setForm({ ...form, unit_price: event.target.value })}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                单位
                <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
              </label>
              <label>
                已采购数量
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={form.purchased_quantity}
                  onChange={(event) => setForm({ ...form, purchased_quantity: event.target.value })}
                />
              </label>
              <label>
                已出货数量
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={form.shipped_quantity}
                  onChange={(event) => setForm({ ...form, shipped_quantity: event.target.value })}
                />
              </label>
            </div>
          </form>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="合同明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(exportContractPath)}>
              返回列表
            </Button>
          </div>
          {selectedContract ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/回签</dt>
                  <dd>{exportContractStatusLabel(selectedContract.approval_status)} / {signatureStatusLabel(selectedContract.signature_status)}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedContract.customer_name}</dd>
                </div>
                <div>
                  <dt>业务员</dt>
                  <dd>{selectedContract.sales_user_name ?? '未填'}</dd>
                </div>
                <div>
                  <dt>贸易条款</dt>
                  <dd>{selectedContract.trade_term}</dd>
                </div>
                <div>
                  <dt>付款条款</dt>
                  <dd>{selectedContract.payment_terms}</dd>
                </div>
                <div>
                  <dt>合同金额</dt>
                  <dd>{formatMoney(selectedContract.statistics.total_amount, selectedContract.currency)}</dd>
                </div>
                <div>
                  <dt>已采购/已出货</dt>
                  <dd>
                    {selectedContract.statistics.purchased_quantity} / {selectedContract.statistics.shipped_quantity}
                  </dd>
                </div>
                <div>
                  <dt>来源报价</dt>
                  <dd>{selectedContract.source_quotation_no ?? '未关联'}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>合同备注</strong>
                <p>{selectedContract.remarks ?? '未填写合同备注'}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedContract.approval_status !== 'draft'}
                  onClick={() => loadContractIntoForm(selectedContract)}
                >
                  载入编辑
                </Button>
                <Button
                  disabled={selectedContract.approval_status !== 'draft'}
                  loading={submitting}
                  onClick={() => void submitContractForApproval()}
                >
                  提交审批
                </Button>
                <Button
                  disabled={selectedContract.approval_status !== 'submitted'}
                  loading={submitting}
                  type="primary"
                  onClick={() => void approveContract()}
                >
                  审批通过
                </Button>
                <Button loading={submitting} onClick={() => void exportContract('pdf')}>
                  导出 PDF
                </Button>
                <Button onClick={() => void openExportContractPrint(selectedContract.id)}>
                  打印单据
                </Button>
              </div>

              {exportPreview ? (
                <div className="transaction-box export-preview">
                  <strong>合同导出预览</strong>
                  <pre>{exportPreview}</pre>
                </div>
              ) : null}

              <div className="contract-detail-split">
                <form className="record-form accessory-form" onSubmit={registerSignature}>
                  <div className="form-divider">客户回签</div>
                  <div className="form-pair two">
                    <label>
                      回签人
                      <Input
                        value={signatureForm.signed_by}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, signed_by: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      回签日期
                      <Input
                        type="date"
                        value={signatureForm.signed_at}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, signed_at: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      回签方式
                      <Input
                        value={signatureForm.signature_method}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, signature_method: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      回签文件号
                      <Input
                        value={signatureForm.file_no}
                        onChange={(event) =>
                          setSignatureForm({ ...signatureForm, file_no: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    回签备注
                    <Input
                      value={signatureForm.remark}
                      onChange={(event) => setSignatureForm({ ...signatureForm, remark: event.target.value })}
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    登记回签
                  </Button>
                </form>

                <form className="record-form accessory-form" onSubmit={addAdvancePayment}>
                  <div className="form-divider">预收款</div>
                  <div className="form-pair two">
                    <label>
                      水单号
                      <Input
                        value={advancePaymentForm.payment_no}
                        onChange={(event) =>
                          setAdvancePaymentForm({ ...advancePaymentForm, payment_no: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      收款日期
                      <Input
                        type="date"
                        value={advancePaymentForm.received_at}
                        onChange={(event) =>
                          setAdvancePaymentForm({ ...advancePaymentForm, received_at: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      金额
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={advancePaymentForm.amount}
                        onChange={(event) =>
                          setAdvancePaymentForm({ ...advancePaymentForm, amount: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      付款方
                      <Input
                        value={advancePaymentForm.payer_name}
                        onChange={(event) =>
                          setAdvancePaymentForm({ ...advancePaymentForm, payer_name: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    收款备注
                    <Input
                      value={advancePaymentForm.remark}
                      onChange={(event) =>
                        setAdvancePaymentForm({ ...advancePaymentForm, remark: event.target.value })
                      }
                    />
                  </label>
                  <Button htmlType="submit" loading={submitting}>
                    关联预收款
                  </Button>
                </form>
              </div>

              <Table<ExportContractLine>
                className="compact-section"
                columns={[
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '规格', dataIndex: 'specification', render: nullableText },
                  { title: '型号', dataIndex: 'model', render: nullableText },
                  { title: '数量', dataIndex: 'quantity', render: (_, line) => `${line.quantity} ${line.unit}` },
                  {
                    title: '销售单价',
                    dataIndex: 'unit_price',
                    render: (_, line) => formatMoney(line.unit_price, selectedContract.currency),
                  },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (_, line) => formatMoney(line.amount, selectedContract.currency),
                  },
                  { title: '已采购', dataIndex: 'purchased_quantity' },
                  { title: '已出货', dataIndex: 'shipped_quantity' },
                ]}
                dataSource={selectedContract.lines}
                locale={{ emptyText: '暂无合同商品明细' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="contract-media-row">
                <div className="product-photo compact-photo">
                  {selectedContract.lines[0]?.image_url ? (
                    <img src={selectedContract.lines[0].image_url} alt="" />
                  ) : (
                    <span>暂无商品图片</span>
                  )}
                </div>
                <dl className="detail-list compact-detail-list">
                  <div>
                    <dt>未采购数量</dt>
                    <dd>{selectedContract.statistics.unpurchased_quantity}</dd>
                  </div>
                  <div>
                    <dt>未出货金额</dt>
                    <dd>{formatMoney(selectedContract.statistics.unshipped_amount, selectedContract.currency)}</dd>
                  </div>
                  <div>
                    <dt>预收款合计</dt>
                    <dd>{formatMoney(selectedContract.statistics.advance_payment_amount, selectedContract.currency)}</dd>
                  </div>
                  <div>
                    <dt>客户回签日</dt>
                    <dd>{formatDate(selectedContract.customer_signed_at)}</dd>
                  </div>
                </dl>
              </div>

              <div className="accessory-heading">
                <strong>历史询报价参考</strong>
                <span>{history.length} 条</span>
              </div>
              <Table<ExportQuotation>
                columns={[
                  { title: '报价单', dataIndex: 'code' },
                  { title: '客户', dataIndex: 'customer_name' },
                  { title: '日期', dataIndex: 'quote_date', render: formatDate },
                  {
                    title: '金额',
                    dataIndex: 'total_amount',
                    render: (_, quotation) => formatMoney(quotation.total_amount, quotation.currency),
                  },
                ]}
                dataSource={history}
                locale={{ emptyText: '暂无历史询报价参考' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>合同采购情况</strong>
                <span>{selectedContract.purchase_statuses.length} 条</span>
              </div>
              <Table<ExportContractPurchaseStatus>
                columns={[
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '合同数量', dataIndex: 'total_quantity' },
                  { title: '已采购', dataIndex: 'purchased_quantity' },
                  { title: '未采购', dataIndex: 'unpurchased_quantity' },
                  { title: '状态', dataIndex: 'status', render: contractProgressStatusLabel },
                ]}
                dataSource={selectedContract.purchase_statuses}
                locale={{ emptyText: '暂无采购履约情况' }}
                pagination={false}
                rowKey={(item) => `${item.product_id ?? item.product_code ?? item.product_name}-purchase`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>合同出货情况</strong>
                <span>{selectedContract.shipment_statuses.length} 条</span>
              </div>
              <Table<ExportContractShipmentStatus>
                columns={[
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '计划出运日', dataIndex: 'planned_ship_date', render: formatDate },
                  { title: '合同数量', dataIndex: 'total_quantity' },
                  { title: '已出货', dataIndex: 'shipped_quantity' },
                  { title: '未出货', dataIndex: 'unshipped_quantity' },
                  {
                    title: '未出货金额',
                    dataIndex: 'unshipped_amount',
                    render: (_, item) => formatMoney(item.unshipped_amount, selectedContract.currency),
                  },
                  { title: '状态', dataIndex: 'status', render: contractProgressStatusLabel },
                ]}
                dataSource={selectedContract.shipment_statuses}
                locale={{ emptyText: '暂无出货履约情况' }}
                pagination={false}
                rowKey={(item) => `${item.product_id ?? item.product_code ?? item.product_name}-shipment`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>回签记录</strong>
                <span>{selectedContract.signatures.length} 条</span>
              </div>
              <Table<ExportContractSignature>
                columns={[
                  { title: '回签人', dataIndex: 'signed_by' },
                  { title: '回签日期', dataIndex: 'signed_at', render: formatDate },
                  { title: '方式', dataIndex: 'signature_method' },
                  { title: '文件号', dataIndex: 'file_no', render: nullableText },
                  { title: '备注', dataIndex: 'remark', render: nullableText },
                ]}
                dataSource={selectedContract.signatures}
                locale={{ emptyText: '暂无回签记录' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>预收款记录</strong>
                <span>{selectedContract.advance_payments.length} 条</span>
              </div>
              <Table<ExportContractAdvancePayment>
                columns={[
                  { title: '水单号', dataIndex: 'payment_no' },
                  { title: '收款日期', dataIndex: 'received_at', render: formatDate },
                  { title: '付款方', dataIndex: 'payer_name' },
                  { title: '金额', dataIndex: 'amount', render: (_, payment) => formatMoney(payment.amount, payment.currency) },
                  { title: '备注', dataIndex: 'remark', render: nullableText },
                ]}
                dataSource={selectedContract.advance_payments}
                locale={{ emptyText: '暂无预收款记录' }}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FileStack size={28} />
              <strong>暂无出口合同</strong>
              <span>请返回列表选择合同查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function ShipmentsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [shipments, setShipments] = useState<ShipmentPlan[]>([])
  const [reminders, setReminders] = useState<ShipmentReminder[]>([])
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<ShipmentFormState>(() => initialShipmentForm())
  const [approveForm, setApproveForm] = useState<ShipmentApproveFormState>(() =>
    initialShipmentApproveForm(),
  )

  const selectedShipment = useMemo(
    () => {
      if (detailId) return shipments.find((item) => item.id === detailId) ?? null
      return shipments.find((item) => item.id === selectedShipmentId) ?? shipments[0] ?? null
    },
    [detailId, shipments, selectedShipmentId],
  )

  useEffect(() => {
    void loadShipments()
    void loadReminders()
  }, [])

  useEffect(() => {
    setApproveForm({
      reviewer_name: selectedShipment?.reviewer_name ?? '演示业务主管',
      approved_at: selectedShipment?.approved_at ?? todayInputValue(),
    })
  }, [selectedShipment?.id, selectedShipment?.approval_status])

  useEffect(() => {
    if (detailId && shipments.length > 0 && !shipments.some((item) => item.id === detailId)) {
      onNavigate(shipmentPath)
    }
  }, [detailId, onNavigate, shipments])

  async function loadShipments(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listShipments({
        q: search.trim() || undefined,
        approval_status: statusFilter || undefined,
        customer_id: customerFilter.trim() || undefined,
        contract_id: contractFilter.trim() || undefined,
      })
      setShipments(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedShipmentId) ? selectedShipmentId : null) ??
        result.items[0]?.id ??
        null
      setSelectedShipmentId(nextSelectedId)
    } catch (caught) {
      showError(caught, '出货明细加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadReminders() {
    try {
      const result = await listShipmentReminders()
      setReminders(result.items)
    } catch (caught) {
      showError(caught, '出货提醒加载失败')
    }
  }

  function upsertShipment(shipment: ShipmentPlan) {
    setShipments((current) => {
      const exists = current.some((item) => item.id === shipment.id)
      return exists
        ? current.map((item) => (item.id === shipment.id ? shipment : item))
        : [shipment, ...current]
    })
    setSelectedShipmentId(shipment.id)
  }

  function openShipmentDetail(shipment: ShipmentPlan) {
    setSelectedShipmentId(shipment.id)
    onNavigate(moduleDetailPath(shipmentPath, shipment.id))
  }

  function stopAndOpenShipmentDetail(event: MouseEvent<HTMLElement>, shipment: ShipmentPlan) {
    event.stopPropagation()
    openShipmentDetail(shipment)
  }

  async function submitGeneratedShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const created = await generateShipmentFromContracts(shipmentGeneratePayload(form))
      setMessage(`已生成出货明细 ${created.code}`)
      setForm(initialShipmentForm())
      upsertShipment(created)
      await Promise.all([loadShipments(created.id), loadReminders()])
    } catch (caught) {
      showError(caught, '出货明细生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitShipmentForApproval() {
    if (!selectedShipment) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitShipment(selectedShipment.id)
      setMessage(`已提交出货明细 ${submitted.code}`)
      upsertShipment(submitted)
      await Promise.all([loadShipments(submitted.id), loadReminders()])
    } catch (caught) {
      showError(caught, '出货明细提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedShipment) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveShipment(
        selectedShipment.id,
        shipmentApprovePayload(approveForm),
      )
      setMessage(`已审批出货明细 ${approved.code}`)
      upsertShipment(approved)
      await Promise.all([loadShipments(approved.id), loadReminders()])
    } catch (caught) {
      showError(caught, '出货明细审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  const totalReceivable = shipments.reduce(
    (sum, item) => sum + Number(item.finance_overview.receivable_amount),
    0,
  )
  const totalProfit = shipments.reduce(
    (sum, item) => sum + Number(item.finance_overview.profit_amount),
    0,
  )
  const currency = shipments[0]?.currency ?? 'USD'
  const selectedShipmentRows = selectedShipment?.contract_progresses.flatMap((progress) =>
    progress.shipment_statuses.map((status) => ({
      ...status,
      contract_id: progress.contract_id,
      contract_no: progress.contract_no,
    })),
  ) ?? []
  const selectedPurchaseRows = selectedShipment?.contract_progresses.flatMap((progress) =>
    progress.purchase_statuses.map((status) => ({
      ...status,
      contract_id: progress.contract_id,
      contract_no: progress.contract_no,
    })),
  ) ?? []

  return (
    <section className="shipment-page">
      <OperationFlowRail activePath={shipmentPath} kind="sales" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="出货明细概览">
        <Metric label="出货单" value={shipments.length} />
        <Metric label="待审批" value={shipments.filter((item) => item.approval_status === 'submitted').length} />
        <Metric label="已审批" value={shipments.filter((item) => item.approval_status === 'approved').length} />
        <Metric label="应收金额" value={formatMoney(totalReceivable.toFixed(2), currency)} />
        <Metric label="预计利润" value={formatMoney(totalProfit.toFixed(2), currency)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid shipment-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="出货计划列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadShipments()
              }}
            >
              <label>
                出货搜索
                <Input
                  value={search}
                  placeholder="出货单 / 客户 / 合同 / 港口"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                审批状态
              <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {shipmentStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
              <label>
                客户标识
                <Input
                  value={customerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                />
              </label>
              <label>
                合同标识
                <Input
                  value={contractFilter}
                  placeholder="contract-id"
                  onChange={(event) => setContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>

          <Table<ShipmentPlan>
            columns={[
              {
                title: '出货单号',
                dataIndex: 'code',
                render: (value: string, record: ShipmentPlan) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenShipmentDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'approval_status', render: shipmentStatusLabel },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '出货日期', dataIndex: 'shipment_date', render: formatDate },
              { title: '计划出运日', dataIndex: 'planned_ship_date', render: formatDate },
              {
                title: '应收',
                dataIndex: 'finance_overview',
                render: (_, shipment) =>
                  formatMoney(shipment.finance_overview.receivable_amount, shipment.finance_overview.currency),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: ShipmentPlan) => (
                  <Button size="small" onClick={(event) => stopAndOpenShipmentDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={shipments}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedShipment?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedShipmentId(record.id),
            })}
          />
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel form-panel product-form-panel">
          <PanelTitle icon={<LayoutDashboard size={18} />} title="从出口合同生成出货明细" />
          <form className="record-form" onSubmit={submitGeneratedShipment}>
            <div className="form-pair two">
              <label>
                出货单号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                出货日期
                <Input
                  type="date"
                  value={form.shipment_date}
                  onChange={(event) => setForm({ ...form, shipment_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                计划出运日
                <Input
                  type="date"
                  value={form.planned_ship_date}
                  onChange={(event) => setForm({ ...form, planned_ship_date: event.target.value })}
                />
              </label>
              <label>
                运输方式
              <FormSelect
                value={form.shipping_method}
                onChange={(event) => setForm({ ...form, shipping_method: event.target.value })}
              >
                {freightMethodOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
            </div>
            <div className="form-divider">出口合同选择</div>
            <div className="form-pair two">
              <label>
                合同标识 A
                <Input
                  value={form.contract_id_a}
                  onChange={(event) => setForm({ ...form, contract_id_a: event.target.value })}
                />
              </label>
              <label>
                合同 A 出货数量
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.contract_quantity_a}
                  onChange={(event) => setForm({ ...form, contract_quantity_a: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                合同标识 B
                <Input
                  value={form.contract_id_b}
                  onChange={(event) => setForm({ ...form, contract_id_b: event.target.value })}
                />
              </label>
              <label>
                合同 B 出货数量
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.contract_quantity_b}
                  onChange={(event) => setForm({ ...form, contract_quantity_b: event.target.value })}
                />
              </label>
            </div>
            <div className="form-divider">物流单证</div>
            <div className="form-pair two">
              <label>
                起运港
                <Input
                  value={form.port_of_loading}
                  onChange={(event) => setForm({ ...form, port_of_loading: event.target.value })}
                />
              </label>
              <label>
                目的港
                <Input
                  value={form.port_of_destination}
                  onChange={(event) => setForm({ ...form, port_of_destination: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                船名航次
                <Input
                  value={form.vessel_name}
                  onChange={(event) => setForm({ ...form, vessel_name: event.target.value })}
                />
              </label>
              <label>
                箱号
                <Input
                  value={form.container_no}
                  onChange={(event) => setForm({ ...form, container_no: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                订舱号
                <Input
                  value={form.booking_no}
                  onChange={(event) => setForm({ ...form, booking_no: event.target.value })}
                />
              </label>
              <label>
                单证负责人
                <Input
                  value={form.document_owner_name}
                  onChange={(event) => setForm({ ...form, document_owner_name: event.target.value })}
                />
              </label>
            </div>
            <label>
              预计付款成本
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.estimated_payable_amount}
                onChange={(event) =>
                  setForm({ ...form, estimated_payable_amount: event.target.value })
                }
              />
            </label>
            <label>
              出货备注
              <Input
                value={form.remarks}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              生成出货明细
            </Button>
          </form>
          </section>
        ) : null}

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="出货明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(shipmentPath)}>
              返回列表
            </Button>
          </div>
          {selectedShipment ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/日期</dt>
                  <dd>{shipmentStatusLabel(selectedShipment.approval_status)} / {formatDate(selectedShipment.shipment_date)}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedShipment.customer_name}</dd>
                </div>
                <div>
                  <dt>运输方式</dt>
                  <dd>{freightMethodLabel(selectedShipment.shipping_method)}</dd>
                </div>
                <div>
                  <dt>出运港口</dt>
                  <dd>{`${selectedShipment.port_of_loading} -> ${selectedShipment.port_of_destination}`}</dd>
                </div>
                <div>
                  <dt>船名/箱号</dt>
                  <dd>{selectedShipment.vessel_name ?? '未填'} / {selectedShipment.container_no ?? '未填'}</dd>
                </div>
                <div>
                  <dt>订舱号</dt>
                  <dd>{selectedShipment.booking_no ?? '未填'}</dd>
                </div>
                <div>
                  <dt>单证负责人</dt>
                  <dd>{selectedShipment.document_owner_name ?? '未填'}</dd>
                </div>
                <div>
                  <dt>审批人</dt>
                  <dd>{selectedShipment.reviewer_name ?? '未审批'}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>收付款和利润概览</strong>
                <div className="finance-overview-grid">
                  <Metric
                    label="应收金额"
                    value={formatMoney(
                      selectedShipment.finance_overview.receivable_amount,
                      selectedShipment.finance_overview.currency,
                    )}
                  />
                  <Metric
                    label="预计付款"
                    value={formatMoney(
                      selectedShipment.finance_overview.payable_amount,
                      selectedShipment.finance_overview.currency,
                    )}
                  />
                  <Metric
                    label="预计利润"
                    value={formatMoney(
                      selectedShipment.finance_overview.profit_amount,
                      selectedShipment.finance_overview.currency,
                    )}
                  />
                  <Metric
                    label="利润率"
                    value={formatPercent(selectedShipment.finance_overview.profit_rate)}
                  />
                </div>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedShipment.approval_status !== 'draft'}
                  loading={submitting}
                  onClick={() => void submitShipmentForApproval()}
                >
                  提交审批
                </Button>
              </div>

              <form className="record-form accessory-form approval-form" onSubmit={approveSelectedShipment}>
                <div className="form-divider">出货审批</div>
                <div className="form-pair two">
                  <label>
                    审批人
                    <Input
                      value={approveForm.reviewer_name}
                      onChange={(event) =>
                        setApproveForm({ ...approveForm, reviewer_name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    审批日期
                    <Input
                      type="date"
                      value={approveForm.approved_at}
                      onChange={(event) =>
                        setApproveForm({ ...approveForm, approved_at: event.target.value })
                      }
                    />
                  </label>
                </div>
                <Button
                  disabled={selectedShipment.approval_status !== 'submitted'}
                  htmlType="submit"
                  loading={submitting}
                  type="primary"
                >
                  审批通过
                </Button>
              </form>

              <div className="transaction-box">
                <strong>出货提醒</strong>
                <p>{selectedShipment.reminder.message}</p>
              </div>
              <Table<ShipmentReminder>
                className="compact-section"
                columns={[
                  { title: '提醒日期', dataIndex: 'reminder_date', render: formatDate },
                  { title: '出货单', dataIndex: 'shipment_no' },
                  { title: '状态', dataIndex: 'status', render: reminderStatusLabel },
                  { title: '提醒内容', dataIndex: 'message' },
                ]}
                dataSource={[selectedShipment.reminder]}
                locale={{ emptyText: '暂无当前出货提醒' }}
                pagination={false}
                rowKey={(item) => `${item.shipment_id}-${item.reminder_date}`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>出货商品明细</strong>
                <span>{selectedShipment.lines.length} 条</span>
              </div>
              <Table<ShipmentLine>
                columns={[
                  { title: '合同号', dataIndex: 'contract_no' },
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '规格', dataIndex: 'specification', render: nullableText },
                  { title: '型号', dataIndex: 'model', render: nullableText },
                  { title: '出货数量', dataIndex: 'quantity', render: (_, line) => `${line.quantity} ${line.unit}` },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (_, line) => formatMoney(line.amount, selectedShipment.currency),
                  },
                  { title: '计划出运日', dataIndex: 'planned_ship_date', render: formatDate },
                ]}
                dataSource={selectedShipment.lines}
                locale={{ emptyText: '暂无出货商品明细' }}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="accessory-heading">
                <strong>出口合同出货情况</strong>
                <span>{selectedShipmentRows.length} 条</span>
              </div>
              <Table<(ExportContractShipmentStatus & { contract_id: string; contract_no: string })>
                columns={[
                  { title: '合同号', dataIndex: 'contract_no' },
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '合同数量', dataIndex: 'total_quantity' },
                  { title: '已出货', dataIndex: 'shipped_quantity' },
                  { title: '未出货', dataIndex: 'unshipped_quantity' },
                  {
                    title: '未出货金额',
                    dataIndex: 'unshipped_amount',
                    render: (_, item) => formatMoney(item.unshipped_amount, selectedShipment.currency),
                  },
                  { title: '状态', dataIndex: 'status', render: contractProgressStatusLabel },
                ]}
                dataSource={selectedShipmentRows}
                locale={{ emptyText: '暂无出口合同出货情况' }}
                pagination={false}
                rowKey={(item) => `${item.contract_id}-${item.product_id ?? item.product_code ?? item.product_name}-shipment`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>出口合同采购情况</strong>
                <span>{selectedPurchaseRows.length} 条</span>
              </div>
              <Table<(ExportContractPurchaseStatus & { contract_id: string; contract_no: string })>
                columns={[
                  { title: '合同号', dataIndex: 'contract_no' },
                  { title: '商品编号', dataIndex: 'product_code', render: nullableText },
                  { title: '商品名称', dataIndex: 'product_name' },
                  { title: '合同数量', dataIndex: 'total_quantity' },
                  { title: '已采购', dataIndex: 'purchased_quantity' },
                  { title: '未采购', dataIndex: 'unpurchased_quantity' },
                  { title: '状态', dataIndex: 'status', render: contractProgressStatusLabel },
                ]}
                dataSource={selectedPurchaseRows}
                locale={{ emptyText: '暂无出口合同采购情况' }}
                pagination={false}
                rowKey={(item) => `${item.contract_id}-${item.product_id ?? item.product_code ?? item.product_name}-purchase`}
                size="small"
              />

              <div className="accessory-heading">
                <strong>出货提醒列表</strong>
                <span>{reminders.length} 条</span>
              </div>
              <Table<ShipmentReminder>
                columns={[
                  { title: '提醒日期', dataIndex: 'reminder_date', render: formatDate },
                  { title: '出货单', dataIndex: 'shipment_no' },
                  { title: '状态', dataIndex: 'status', render: reminderStatusLabel },
                  { title: '提醒内容', dataIndex: 'message' },
                ]}
                dataSource={reminders}
                locale={{ emptyText: '暂无出货提醒' }}
                pagination={false}
                rowKey={(item) => `${item.shipment_id}-${item.reminder_date}`}
                size="small"
              />
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Ship size={28} />
              <strong>暂无出货明细</strong>
              <span>请返回列表选择出货记录查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function PurchaseInquiriesPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [inquiries, setInquiries] = useState<PurchaseInquiry[]>([])
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)
  const [editingInquiryId, setEditingInquiryId] = useState<string | null>(null)
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false)
  const [inquiryActionModal, setInquiryActionModal] = useState<'template' | 'quotation' | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [supplierSamples, setSupplierSamples] = useState<SupplierSampleEvidence[]>([])
  const [references, setReferences] = useState<PurchaseInquiryReference[]>([])
  const [templatePreview, setTemplatePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<PurchaseInquiryFormState>(() => initialPurchaseInquiryForm())
  const [quotationForm, setQuotationForm] = useState<PurchaseQuotationFormState>(() =>
    initialPurchaseQuotationForm(),
  )
  const [templateForm, setTemplateForm] = useState<PurchaseInquiryTemplateFormState>(() =>
    initialPurchaseInquiryTemplateForm(),
  )

  const selectedInquiry = useMemo(
    () => {
      if (detailId) return inquiries.find((item) => item.id === detailId) ?? null
      return inquiries.find((item) => item.id === selectedInquiryId) ?? inquiries[0] ?? null
    },
    [detailId, inquiries, selectedInquiryId],
  )

  useEffect(() => {
    void loadInquiries()
  }, [])

  useEffect(() => {
    if (!detailId) {
      setSupplierSamples([])
      setReferences([])
      return
    }
    syncPurchaseInquiryActionForms(selectedInquiry)
    void loadPurchaseInquiryAuxiliary(selectedInquiry)
  }, [detailId, selectedInquiry?.id, selectedInquiry?.status, selectedInquiry?.quotations.length])

  useEffect(() => {
    if (detailId && inquiries.length > 0 && !inquiries.some((item) => item.id === detailId)) {
      onNavigate(purchaseInquiryPath)
    }
  }, [detailId, inquiries, onNavigate])

  async function loadInquiries(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listPurchaseInquiries({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        product_id: productFilter.trim() || undefined,
        supplier_id: supplierFilter.trim() || undefined,
      })
      setInquiries(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedInquiryId) ? selectedInquiryId : null) ??
        result.items[0]?.id ??
        null
      setSelectedInquiryId(nextSelectedId)
    } catch (caught) {
      showError(caught, '采购询价加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadPurchaseInquiryAuxiliary(inquiry: PurchaseInquiry | null) {
    const line = inquiry?.lines[0]
    if (!inquiry || !line) {
      setSupplierSamples([])
      setReferences([])
      return
    }
    const supplierId = inquiry.quotations[0]?.supplier_id ?? undefined
    try {
      const [referenceResult, sampleResult] = await Promise.all([
        listPurchaseInquiryReferences({
          product_id: line.product_id ?? undefined,
        }),
        listPurchaseInquirySupplierSamples({
          product_id: line.product_id ?? undefined,
          supplier_id: supplierId,
        }),
      ])
      setReferences(referenceResult.items)
      setSupplierSamples(sampleResult.items)
    } catch (caught) {
      showError(caught, '采购询价参考资料加载失败')
    }
  }

  function syncPurchaseInquiryActionForms(inquiry: PurchaseInquiry | null) {
    const firstQuote = inquiry?.quotations[0]
    setTemplateForm({
      template_name: inquiry?.template_name ?? '标准采购询价模板',
      recipient_emails: firstQuote?.supplier_id ? `${firstQuote.supplier_id}@example.com` : 'supplier@example.com',
    })
    setQuotationForm((current) => ({
      ...current,
      currency: firstQuote?.currency ?? current.currency,
      quoted_at: inquiry?.inquiry_date ?? current.quoted_at,
    }))
  }

  function upsertInquiry(inquiry: PurchaseInquiry) {
    setInquiries((current) => {
      const exists = current.some((item) => item.id === inquiry.id)
      return exists
        ? current.map((item) => (item.id === inquiry.id ? inquiry : item))
        : [inquiry, ...current]
    })
    setSelectedInquiryId(inquiry.id)
  }

  function openInquiryDetail(inquiry: PurchaseInquiry) {
    setSelectedInquiryId(inquiry.id)
    onNavigate(moduleDetailPath(purchaseInquiryPath, inquiry.id))
  }

  function stopAndOpenInquiryDetail(event: MouseEvent<HTMLElement>, inquiry: PurchaseInquiry) {
    event.stopPropagation()
    openInquiryDetail(inquiry)
  }

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const payload = purchaseInquiryPayload(form)
      const saved = editingInquiryId
        ? await updatePurchaseInquiry(editingInquiryId, payload)
        : await createPurchaseInquiry(payload)
      setMessage(editingInquiryId ? `已保存采购询价 ${saved.code}` : `已新增采购询价 ${saved.code}`)
      setEditingInquiryId(null)
      setForm(initialPurchaseInquiryForm())
      setInquiryModalOpen(false)
      upsertInquiry(saved)
      await loadInquiries(saved.id)
    } catch (caught) {
      showError(caught, '采购询价保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function sendTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedInquiry) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const template = await sendPurchaseInquiryTemplate(
        selectedInquiry.id,
        purchaseInquiryTemplatePayload(templateForm),
      )
      setTemplatePreview(template.content)
      setMessage(`已生成询价模板 ${template.filename}`)
      setInquiryActionModal(null)
      await loadInquiries(selectedInquiry.id)
    } catch (caught) {
      showError(caught, '询价模板发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function addSupplierQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedInquiry?.lines[0]) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updated = await addPurchaseInquiryQuotation(
        selectedInquiry.id,
        purchaseQuotationPayload(quotationForm, selectedInquiry.lines[0].id),
      )
      setMessage(`已登记供应商报价 ${quotationForm.supplier_name}`)
      setInquiryActionModal(null)
      upsertInquiry(updated)
      await Promise.all([loadInquiries(updated.id), loadPurchaseInquiryAuxiliary(updated)])
    } catch (caught) {
      showError(caught, '供应商报价登记失败')
    } finally {
      setSubmitting(false)
    }
  }

  function openCreateInquiry() {
    setEditingInquiryId(null)
    setForm(initialPurchaseInquiryForm())
    setMessage('')
    setError('')
    setInquiryModalOpen(true)
  }

  function loadSelectedInquiryForEdit() {
    if (!selectedInquiry) return
    setEditingInquiryId(selectedInquiry.id)
    setForm(purchaseInquiryToForm(selectedInquiry))
    setMessage(`正在编辑采购询价 ${selectedInquiry.code}`)
    setInquiryModalOpen(true)
  }

  function cancelInquiryEdit() {
    setEditingInquiryId(null)
    setForm(initialPurchaseInquiryForm())
    setInquiryModalOpen(false)
  }

  const quotedCount = inquiries.filter((item) => item.status === 'quoted').length
  const sentCount = inquiries.filter((item) => item.status === 'sent').length
  const quotationCount = inquiries.reduce((sum, item) => sum + item.quotations.length, 0)

  return (
    <section className="purchase-inquiry-page">
      <OperationFlowRail activePath={purchaseInquiryPath} kind="purchase" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="采购询价概览">
        <Metric label="询价单" value={inquiries.length} />
        <Metric label="已发模板" value={sentCount} />
        <Metric label="已报价" value={quotedCount} />
        <Metric label="供应商报价" value={quotationCount} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid purchase-inquiry-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="采购询价列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadInquiries()
              }}
            >
              <label>
                询价搜索
                <Input
                  value={search}
                  placeholder="询价单号 / 商品 / 备注"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                询价状态
              <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {purchaseInquiryStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
              <label>
                商品标识
                <Input
                  value={productFilter}
                  placeholder="product-id"
                  onChange={(event) => setProductFilter(event.target.value)}
                />
              </label>
              <label>
                供应商标识
                <Input
                  value={supplierFilter}
                  placeholder="supplier-id"
                  onChange={(event) => setSupplierFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateInquiry}>
                新增采购询价
              </Button>
            </form>
          </div>

          <Table<PurchaseInquiry>
            columns={[
              {
                title: '询价单号',
                dataIndex: 'code',
                render: (value: string, record: PurchaseInquiry) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenInquiryDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: purchaseInquiryStatusLabel },
              {
                title: '商品',
                dataIndex: 'lines',
                render: (_, inquiry) =>
                  `${inquiry.lines[0]?.product_code ?? '未填'} / ${inquiry.lines[0]?.product_name ?? '未填'}`,
              },
              { title: '询价日', dataIndex: 'inquiry_date', render: formatDate },
              { title: '报价数', dataIndex: 'quotations', render: (_, inquiry) => inquiry.quotations.length },
              {
                title: '最低价',
                dataIndex: 'quotations',
                render: (_, inquiry) => {
                  const lowest = lowestSupplierQuotation(inquiry.quotations)
                  return lowest ? formatMoney(lowest.unit_price, lowest.currency) : '未报价'
                },
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: PurchaseInquiry) => (
                  <Button size="small" onClick={(event) => stopAndOpenInquiryDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={inquiries}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedInquiry?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedInquiryId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={inquiryModalOpen}
          title={editingInquiryId ? '编辑采购询价' : '新增采购询价'}
          width={980}
          onCancel={cancelInquiryEdit}
        >
          <div className="workflow-modal-content entity-modal-form">
          <form className="record-form" onSubmit={submitInquiry}>
            <div className="form-pair two">
              <label>
                询价单号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                询价日期
                <Input
                  type="date"
                  value={form.inquiry_date}
                  onChange={(event) => setForm({ ...form, inquiry_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                业务员标识
                <Input
                  value={form.buyer_user_id}
                  onChange={(event) => setForm({ ...form, buyer_user_id: event.target.value })}
                />
              </label>
              <label>
                业务员
                <Input
                  value={form.buyer_user_name}
                  onChange={(event) => setForm({ ...form, buyer_user_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-divider">询价商品</div>
            <div className="form-pair two">
              <label>
                商品标识
                <Input
                  value={form.product_id}
                  onChange={(event) => setForm({ ...form, product_id: event.target.value })}
                />
              </label>
              <label>
                商品编号
                <Input
                  value={form.product_code}
                  onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                />
              </label>
            </div>
            <label>
              商品名称
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                规格
                <Input
                  value={form.specification}
                  onChange={(event) => setForm({ ...form, specification: event.target.value })}
                />
              </label>
              <label>
                型号
                <Input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                询价数量
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                />
              </label>
              <label>
                单位
                <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
              </label>
            </div>
            <label>
              询价备注
              <Input.TextArea
                rows={2}
                value={form.remarks}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              {editingInquiryId ? '保存草稿编辑' : '新增采购询价'}
            </Button>
            {editingInquiryId ? (
              <Button onClick={cancelInquiryEdit}>
                取消编辑
              </Button>
            ) : null}
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="询价明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(purchaseInquiryPath)}>
              返回列表
            </Button>
          </div>
          {selectedInquiry ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/询价日</dt>
                  <dd>{purchaseInquiryStatusLabel(selectedInquiry.status)} / {formatDate(selectedInquiry.inquiry_date)}</dd>
                </div>
                <div>
                  <dt>业务员</dt>
                  <dd>{selectedInquiry.buyer_user_name ?? '未指定'}</dd>
                </div>
                <div>
                  <dt>模板</dt>
                  <dd>{selectedInquiry.template_name ?? '未发送'}</dd>
                </div>
                <div>
                  <dt>模板发送日</dt>
                  <dd>{formatDate(selectedInquiry.template_sent_at)}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>询价备注</strong>
                <p>{selectedInquiry.remarks ?? '未填写'}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedInquiry.status !== 'draft'}
                  onClick={loadSelectedInquiryForEdit}
                >
                  编辑询价
                </Button>
                <Button htmlType="button" onClick={() => setInquiryActionModal('template')}>
                  发送询价模板
                </Button>
                <Button
                  disabled={!selectedInquiry.lines[0]}
                  htmlType="button"
                  type="primary"
                  onClick={() => setInquiryActionModal('quotation')}
                >
                  登记供应商报价
                </Button>
              </div>

              <Modal
                centered
                footer={null}
                open={inquiryActionModal === 'template'}
                title="发送询价模板"
                width={720}
                onCancel={() => setInquiryActionModal(null)}
              >
                <div className="workflow-modal-content entity-modal-form">
                  <form className="record-form accessory-form" onSubmit={sendTemplate}>
                    <div className="form-divider">询价模板发送</div>
                    <label>
                      模板名称
                      <Input
                        value={templateForm.template_name}
                        onChange={(event) =>
                          setTemplateForm({ ...templateForm, template_name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      收件邮箱
                      <Input
                        value={templateForm.recipient_emails}
                        onChange={(event) =>
                          setTemplateForm({ ...templateForm, recipient_emails: event.target.value })
                        }
                      />
                    </label>
                    <Button htmlType="submit" loading={submitting}>
                      发送询价模板
                    </Button>
                  </form>
                </div>
              </Modal>

              <Modal
                centered
                footer={null}
                open={inquiryActionModal === 'quotation'}
                title="登记供应商报价"
                width={880}
                onCancel={() => setInquiryActionModal(null)}
              >
                <div className="workflow-modal-content entity-modal-form">
                  <form className="record-form accessory-form" onSubmit={addSupplierQuotation}>
                    <div className="form-divider">供应商报价明细</div>
                    <div className="form-pair two">
                      <label>
                        供应商标识
                        <Input
                          value={quotationForm.supplier_id}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, supplier_id: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        供应商名称
                        <Input
                          value={quotationForm.supplier_name}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, supplier_name: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <div className="form-pair three">
                      <label>
                        报价日期
                        <Input
                          type="date"
                          value={quotationForm.quoted_at}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, quoted_at: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        单价
                        <Input
                          type="number"
                          min="0.0001"
                          step="0.0001"
                          value={quotationForm.unit_price}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, unit_price: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        币种
                        <Input
                          value={quotationForm.currency}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, currency: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <div className="form-pair two">
                      <label>
                        交期天数
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={quotationForm.lead_time_days}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, lead_time_days: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        最小起订量
                        <Input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={quotationForm.min_order_quantity}
                          onChange={(event) =>
                            setQuotationForm({ ...quotationForm, min_order_quantity: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <label className="checkbox-label">
                      <input
                        checked={quotationForm.sample_available}
                        type="checkbox"
                        onChange={(event) =>
                          setQuotationForm({ ...quotationForm, sample_available: event.target.checked })
                        }
                      />
                      可提供样品
                    </label>
                  <label>
                      报价备注
                      <Input
                        value={quotationForm.remark}
                        onChange={(event) =>
                          setQuotationForm({ ...quotationForm, remark: event.target.value })
                        }
                      />
                    </label>
                    <Button htmlType="submit" loading={submitting} type="primary">
                      登记供应商报价
                    </Button>
                  </form>
                </div>
              </Modal>

              {templatePreview ? (
                <div className="transaction-box export-preview">
                  <strong>询价模板预览</strong>
                  <pre>{templatePreview}</pre>
                </div>
              ) : null}

              <div className="accessory-heading">
                <strong>询价商品明细</strong>
                <span>{selectedInquiry.lines.length} 行</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格/型号</th>
                    <th>数量</th>
                    <th>单位</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInquiry.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_code ?? '未填'} / {line.product_name}</td>
                      <td>{line.specification ?? '未填'} / {line.model ?? '未填'}</td>
                      <td>{line.quantity}</td>
                      <td>{line.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>供应商报价比较</strong>
                <span>{selectedInquiry.quotations.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>供应商</th>
                    <th>商品</th>
                    <th>单价</th>
                    <th>交期</th>
                    <th>起订量</th>
                    <th>样品</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInquiry.quotations.map((quote) => (
                    <tr key={quote.id}>
                      <td>{quote.supplier_name}</td>
                      <td>{quote.product_code ?? '未填'} / {quote.product_name}</td>
                      <td>{formatMoney(quote.unit_price, quote.currency)}</td>
                      <td>{quote.lead_time_days ?? '未填'} 天</td>
                      <td>{quote.min_order_quantity ?? '未填'}</td>
                      <td>{quote.has_sample ? '有样品' : '未提供'}</td>
                      <td>{quote.remark ?? '未填'}</td>
                    </tr>
                  ))}
                  {selectedInquiry.quotations.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={7}>暂无供应商报价</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>供应商样品关联</strong>
                <span>{supplierSamples.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>样品编号</th>
                    <th>供应商</th>
                    <th>商品</th>
                    <th>收样日期</th>
                    <th>数量</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierSamples.map((sample) => (
                    <tr key={sample.sample_record_id}>
                      <td>{sample.sample_code}</td>
                      <td>{sample.supplier_name ?? '未填'}</td>
                      <td>{sample.product_code ?? '未填'} / {sample.product_name}</td>
                      <td>{formatDate(sample.received_at)}</td>
                      <td>{sample.quantity} {sample.unit}</td>
                      <td>{sampleRecordStatusLabel(sample.status)}</td>
                    </tr>
                  ))}
                  {supplierSamples.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={6}>暂无供应商样品</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>采购参考价</strong>
                <span>{references.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>询价单</th>
                    <th>商品</th>
                    <th>供应商</th>
                    <th>参考价</th>
                    <th>报价日</th>
                  </tr>
                </thead>
                <tbody>
                  {references.map((reference) => (
                    <tr key={`${reference.source_inquiry_no}-${reference.supplier_name}`}>
                      <td>{reference.source_inquiry_no}</td>
                      <td>{reference.product_code ?? '未填'} / {reference.product_name}</td>
                      <td>{reference.supplier_name}</td>
                      <td>{formatMoney(reference.reference_price, reference.currency)}</td>
                      <td>{formatDate(reference.quote_date)}</td>
                    </tr>
                  ))}
                  {references.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>暂无采购参考价</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FileText size={28} />
              <strong>暂无采购询价</strong>
              <span>请返回列表选择询价单查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function PurchaseContractsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [contracts, setContracts] = useState<PurchaseContract[]>([])
  const [reminders, setReminders] = useState<PurchaseContractReminder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [editingContractId, setEditingContractId] = useState<string | null>(null)
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [contractModalMode, setContractModalMode] = useState<'manual' | 'generate'>('manual')
  const [contractApprovalModalOpen, setContractApprovalModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<PurchaseContractFormState>(() => initialPurchaseContractForm())
  const [generateForm, setGenerateForm] = useState<PurchaseContractGenerateFormState>(() =>
    initialPurchaseContractGenerateForm(),
  )
  const [approveForm, setApproveForm] = useState<PurchaseContractApproveFormState>(() =>
    initialPurchaseContractApproveForm(),
  )

  const selectedContract = useMemo(
    () => {
      if (detailId) return contracts.find((item) => item.id === detailId) ?? null
      return contracts.find((item) => item.id === selectedContractId) ?? contracts[0] ?? null
    },
    [contracts, detailId, selectedContractId],
  )

  useEffect(() => {
    void loadContracts()
    void loadContractReminders()
    void loadProductsForContract()
    void loadSuppliersForContract()
  }, [])

  useEffect(() => {
    setApproveForm({
      reviewer_name: selectedContract?.reviewer_name ?? '演示业务主管',
      approved_at: selectedContract?.approved_at ?? selectedContract?.contract_date ?? todayInputValue(),
    })
    if (selectedContract) {
      setGenerateForm((current) => ({
        ...current,
        supplier_id: selectedContract.supplier_id ?? current.supplier_id,
        supplier_name: selectedContract.supplier_name,
        currency: selectedContract.currency,
      }))
      setForm((current) => ({
        ...current,
        supplier_id: selectedContract.supplier_id ?? current.supplier_id,
        supplier_name: selectedContract.supplier_name,
        currency: selectedContract.currency,
      }))
    }
  }, [selectedContract?.id, selectedContract?.approval_status])

  useEffect(() => {
    if (detailId && contracts.length > 0 && !contracts.some((item) => item.id === detailId)) {
      onNavigate(purchaseContractPath)
    }
  }, [contracts, detailId, onNavigate])

  async function loadContracts(preferredId?: string, preferredContract?: PurchaseContract) {
    setLoading(true)
    setError('')
    try {
      const result = await listPurchaseContracts({
        q: search.trim() || undefined,
        approval_status: statusFilter || undefined,
        supplier_id: supplierFilter.trim() || undefined,
        source_type: sourceFilter || undefined,
      })
      const items = preferredContract
        ? [
            preferredContract,
            ...result.items.filter((item) => item.id !== preferredContract.id),
          ]
        : result.items
      setContracts(items)
      const nextSelectedId =
        preferredId ??
        (items.some((item) => item.id === selectedContractId) ? selectedContractId : null) ??
        items[0]?.id ??
        null
      setSelectedContractId(nextSelectedId)
    } catch (caught) {
      showError(caught, '采购合同加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadContractReminders() {
    try {
      const result = await listPurchaseContractReminders()
      setReminders(result.items)
    } catch (caught) {
      showError(caught, '采购提醒加载失败')
    }
  }

  async function loadProductsForContract() {
    setLoadingProducts(true)
    try {
      const result = await listProducts()
      setProducts(result.items)
    } catch (caught) {
      showError(caught, '商品资料加载失败')
    } finally {
      setLoadingProducts(false)
    }
  }

  async function loadSuppliersForContract() {
    setLoadingSuppliers(true)
    try {
      const result = await listSuppliers()
      setSuppliers(result.items)
    } catch (caught) {
      showError(caught, '工厂资料加载失败')
    } finally {
      setLoadingSuppliers(false)
    }
  }

  function upsertContract(contract: PurchaseContract) {
    setContracts((current) => {
      const exists = current.some((item) => item.id === contract.id)
      return exists
        ? current.map((item) => (item.id === contract.id ? contract : item))
        : [contract, ...current]
    })
    setSelectedContractId(contract.id)
  }

  function openPurchaseContractDetail(contract: PurchaseContract) {
    setSelectedContractId(contract.id)
    onNavigate(moduleDetailPath(purchaseContractPath, contract.id))
  }

  function stopAndOpenPurchaseContractDetail(event: MouseEvent<HTMLElement>, contract: PurchaseContract) {
    event.stopPropagation()
    openPurchaseContractDetail(contract)
  }

  function applyProductToPurchaseContractForm(productId: string | undefined) {
    if (!productId) {
      setForm((current) => ({
        ...current,
        product_id: '',
      }))
      return
    }
    const product = products.find((item) => item.id === productId)
    if (!product) return
    setForm((current) => ({
      ...current,
      product_id: product.id,
      product_code: product.code,
      product_name: product.cn_name,
      specification: product.specification ?? '',
      model: product.model ?? '',
      unit: product.unit,
      line_remark: product.package_info
        ? mergePurchaseLineRemark(current.line_remark, `包装: ${product.package_info}`)
        : current.line_remark,
    }))
  }

  function applySupplierToPurchaseContractForm(supplierId: string | undefined) {
    if (!supplierId) {
      setForm((current) => ({
        ...current,
        supplier_id: '',
      }))
      return
    }
    const supplier = suppliers.find((item) => item.id === supplierId)
    if (!supplier) return
    setForm((current) => ({
      ...current,
      supplier_id: supplier.id,
      supplier_name: supplier.cn_name,
    }))
  }

  async function submitContractForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const payload = purchaseContractPayload(form)
      const saved = editingContractId
        ? await updatePurchaseContract(editingContractId, payload)
        : await createPurchaseContract(payload)
      setMessage(editingContractId ? `已保存采购合同 ${saved.code}` : `已新增采购合同 ${saved.code}`)
      setEditingContractId(null)
      setContractModalMode('manual')
      setForm(initialPurchaseContractForm())
      setContractModalOpen(false)
      upsertContract(saved)
      await Promise.all([loadContracts(saved.id, saved), loadContractReminders()])
      upsertContract(saved)
    } catch (caught) {
      showError(caught, '采购合同保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function generateContractFromSources(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const generated = await generatePurchaseContractFromExportContracts(
        purchaseContractGeneratePayload(generateForm),
      )
      setMessage(`已从出口合同生成采购合同 ${generated.code}`)
      setContractModalMode('manual')
      setGenerateForm(initialPurchaseContractGenerateForm())
      setContractModalOpen(false)
      upsertContract(generated)
      await Promise.all([loadContracts(generated.id, generated), loadContractReminders()])
    } catch (caught) {
      showError(caught, '采购合同生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSelectedContract() {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const submitted = await submitPurchaseContract(selectedContract.id)
      setMessage(`已提交采购合同 ${submitted.code}`)
      upsertContract(submitted)
      await Promise.all([loadContracts(submitted.id, submitted), loadContractReminders()])
    } catch (caught) {
      showError(caught, '采购合同提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const approved = await approvePurchaseContract(
        selectedContract.id,
        purchaseContractApprovePayload(approveForm),
      )
      setMessage(`已审批采购合同 ${approved.code}`)
      setContractApprovalModalOpen(false)
      upsertContract(approved)
      await Promise.all([loadContracts(approved.id, approved), loadContractReminders()])
    } catch (caught) {
      showError(caught, '采购合同审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function generateSelectedContractTemplate() {
    if (!selectedContract) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const document_ = await generatePurchaseContractTemplate(selectedContract.id)
      downloadBase64File(document_.filename, document_.content_base64, document_.content_type)
      setMessage(`已用合同模板生成 ${document_.filename}`)
    } catch (caught) {
      showError(caught, '采购合同模板生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  function openCreateContract() {
    setEditingContractId(null)
    setContractModalMode('manual')
    setForm(initialPurchaseContractForm())
    setMessage('')
    setError('')
    setContractModalOpen(true)
  }

  function openGenerateContract() {
    setEditingContractId(null)
    setContractModalMode('generate')
    setGenerateForm(initialPurchaseContractGenerateForm())
    setMessage('')
    setError('')
    setContractModalOpen(true)
  }

  function loadSelectedContractForEdit() {
    if (!selectedContract) return
    setEditingContractId(selectedContract.id)
    setContractModalMode('manual')
    setForm(purchaseContractToForm(selectedContract))
    setMessage(`正在编辑采购合同 ${selectedContract.code}`)
    setContractModalOpen(true)
  }

  function cancelContractEdit() {
    setEditingContractId(null)
    setContractModalMode('manual')
    setForm(initialPurchaseContractForm())
    setContractModalOpen(false)
  }

  const totalAmount = contracts.reduce((sum, item) => sum + Number(item.statistics.total_amount), 0)
  const openReminders = reminders.filter((item) => item.status === 'open').length
  const currency = contracts[0]?.currency ?? 'USD'

  return (
    <section className="purchase-contract-page">
      <OperationFlowRail activePath={purchaseContractPath} kind="purchase" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="采购合同概览">
        <Metric label="采购合同" value={contracts.length} />
        <Metric label="待审批" value={contracts.filter((item) => item.approval_status === 'submitted').length} />
        <Metric label="已审批" value={contracts.filter((item) => item.approval_status === 'approved').length} />
        <Metric label="合同金额" value={formatMoney(totalAmount.toFixed(2), currency)} />
        <Metric label="待办提醒" value={openReminders} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid purchase-contract-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="采购合同列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadContracts()
              }}
            >
              <label>
                合同搜索
                <Input
                  value={search}
                  placeholder="合同号 / 供应商 / 商品 / 备注"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                审批状态
                <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {purchaseContractStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
              <label>
                来源类型
              <FormSelect
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <option value="">全部来源</option>
                {purchaseContractSourceTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
              <label>
                供应商标识
                <Input
                  value={supplierFilter}
                  placeholder="supplier-id"
                  onChange={(event) => setSupplierFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={openCreateContract}>
                新增采购合同
              </Button>
              <Button htmlType="button" icon={<FileStack size={16} />} onClick={openGenerateContract}>
                从出口合同生成
              </Button>
            </form>
          </div>

          <Table<PurchaseContract>
            columns={[
              {
                title: '采购合同',
                dataIndex: 'code',
                render: (value: string, record: PurchaseContract) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenPurchaseContractDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'approval_status', render: purchaseContractStatusLabel },
              { title: '来源', dataIndex: 'source_type', render: purchaseContractSourceTypeLabel },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '交货日', dataIndex: 'delivery_date', render: formatDate },
              {
                title: '金额',
                dataIndex: 'statistics',
                render: (_, contract) => formatMoney(contract.statistics.total_amount, contract.currency),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: PurchaseContract) => (
                  <Button size="small" onClick={(event) => stopAndOpenPurchaseContractDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={contracts}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedContract?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedContractId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={contractModalOpen}
          title={
            editingContractId
              ? '编辑采购合同'
              : contractModalMode === 'generate'
                ? '从出口合同生成采购合同'
                : '新增采购合同'
          }
          width={1040}
          onCancel={cancelContractEdit}
        >
          <div className="workflow-modal-content entity-modal-form">
          {contractModalMode === 'manual' ? (
            <>
          <PanelTitle icon={<LayoutDashboard size={18} />} title={editingContractId ? '编辑采购合同' : '库存/手工采购合同'} />
          <form className="record-form" onSubmit={submitContractForm}>
            <div className="form-pair two">
              <label>
                合同号
                <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
              </label>
              <label>
                合同日期
                <Input
                  type="date"
                  value={form.contract_date}
                  onChange={(event) => setForm({ ...form, contract_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                选择工厂
                <Select
                  allowClear
                  showSearch
                  loading={loadingSuppliers}
                  value={form.supplier_id || undefined}
                  placeholder={suppliers.length > 0 ? '从工厂资料选择' : '请先在工厂资料录入'}
                  optionFilterProp="label"
                  notFoundContent={loadingSuppliers ? '加载工厂资料中' : '暂无工厂资料'}
                  onChange={applySupplierToPurchaseContractForm}
                >
                  {renderSupplierOptions(suppliers)}
                </Select>
              </label>
              <label>
                工厂标识
                <Input value={form.supplier_id} readOnly placeholder="选择工厂后自动带出" />
              </label>
              <label>
                工厂名称
                <Input
                  value={form.supplier_name}
                  onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                采购员
                <Input
                  value={form.buyer_user_name}
                  onChange={(event) => setForm({ ...form, buyer_user_name: event.target.value })}
                />
              </label>
              <label>
                采购员标识
                <Input
                  value={form.buyer_user_id}
                  onChange={(event) => setForm({ ...form, buyer_user_id: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                币种
                <Input
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                />
              </label>
              <label>
                交货日期
                <Input
                  type="date"
                  value={form.delivery_date}
                  onChange={(event) => setForm({ ...form, delivery_date: event.target.value })}
                />
              </label>
              <label>
                来源
              <FormSelect
                value={form.source_type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    source_type: event.target.value as PurchaseContractCreatePayload['source_type'],
                  })
                }
              >
                {purchaseContractSourceTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
            </div>
            <label>
              付款条款
              <Input
                value={form.payment_terms}
                onChange={(event) => setForm({ ...form, payment_terms: event.target.value })}
              />
            </label>

            <div className="form-divider">合同商品明细</div>
            <div className="form-pair two">
              <label>
                选择商品
                <Select
                  allowClear
                  showSearch
                  loading={loadingProducts}
                  value={form.product_id || undefined}
                  placeholder={products.length > 0 ? '从商品资料选择' : '请先在商品资料录入'}
                  optionFilterProp="label"
                  notFoundContent={loadingProducts ? '加载商品资料中' : '暂无商品资料'}
                  onChange={applyProductToPurchaseContractForm}
                >
                  {renderProductOptions(products)}
                </Select>
              </label>
              <label>
                商品编号
                <Input
                  value={form.product_code}
                  onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                />
              </label>
            </div>
            <label>
              商品名称
              <Input
                value={form.product_name}
                onChange={(event) => setForm({ ...form, product_name: event.target.value })}
              />
            </label>
            <label>
              商品标识
              <Input value={form.product_id} readOnly placeholder="选择商品后自动带出" />
            </label>
            <div className="form-pair two">
              <label>
                规格
                <Input
                  value={form.specification}
                  onChange={(event) => setForm({ ...form, specification: event.target.value })}
                />
              </label>
              <label>
                型号
                <Input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                数量
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                />
              </label>
              <label>
                单位
                <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
              </label>
              <label>
                单价
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={form.unit_price}
                  onChange={(event) => setForm({ ...form, unit_price: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                来源出口合同 ID
                <Input
                  value={form.source_export_contract_id}
                  onChange={(event) =>
                    setForm({ ...form, source_export_contract_id: event.target.value })
                  }
                />
              </label>
              <label>
                来源合同号
                <Input
                  value={form.source_export_contract_no}
                  onChange={(event) =>
                    setForm({ ...form, source_export_contract_no: event.target.value })
                  }
                />
              </label>
              <label>
                来源明细 ID
                <Input
                  value={form.source_export_contract_line_id}
                  onChange={(event) =>
                    setForm({ ...form, source_export_contract_line_id: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              行备注
              <Input
                value={form.line_remark}
                onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
              />
            </label>
            <label>
              合同备注
              <Input.TextArea
                rows={2}
                value={form.remarks}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              {editingContractId ? '保存采购合同' : '新增采购合同'}
            </Button>
            {editingContractId ? (
              <Button onClick={cancelContractEdit}>
                取消编辑
              </Button>
            ) : null}
          </form>
            </>
          ) : (
            <>
          <PanelTitle icon={<FileStack size={18} />} title="从已审批出口合同生成" />

          <form className="record-form accessory-form generation-form" onSubmit={generateContractFromSources}>
            <div className="form-divider">从已审批出口合同生成</div>
            <div className="form-pair two">
              <label>
                采购合同号
                <Input
                  value={generateForm.code}
                  onChange={(event) => setGenerateForm({ ...generateForm, code: event.target.value })}
                />
              </label>
              <label>
                合同日期
                <Input
                  type="date"
                  value={generateForm.contract_date}
                  onChange={(event) => setGenerateForm({ ...generateForm, contract_date: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                出口合同 ID A
                <Input
                  value={generateForm.source_contract_id_a}
                  onChange={(event) =>
                    setGenerateForm({ ...generateForm, source_contract_id_a: event.target.value })
                  }
                />
              </label>
              <label>
                出口合同 ID B
                <Input
                  value={generateForm.source_contract_id_b}
                  onChange={(event) =>
                    setGenerateForm({ ...generateForm, source_contract_id_b: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                供应商标识
                <Input
                  value={generateForm.supplier_id}
                  onChange={(event) => setGenerateForm({ ...generateForm, supplier_id: event.target.value })}
                />
              </label>
              <label>
                供应商
                <Input
                  value={generateForm.supplier_name}
                  onChange={(event) => setGenerateForm({ ...generateForm, supplier_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                币种
                <Input
                  value={generateForm.currency}
                  onChange={(event) => setGenerateForm({ ...generateForm, currency: event.target.value })}
                />
              </label>
              <label>
                交货日期
                <Input
                  type="date"
                  value={generateForm.delivery_date}
                  onChange={(event) => setGenerateForm({ ...generateForm, delivery_date: event.target.value })}
                />
              </label>
              <label>
                配件单价
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={generateForm.unit_price}
                  onChange={(event) => setGenerateForm({ ...generateForm, unit_price: event.target.value })}
                />
              </label>
            </div>
            <label>
              付款条款
              <Input
                value={generateForm.payment_terms}
                onChange={(event) => setGenerateForm({ ...generateForm, payment_terms: event.target.value })}
              />
            </label>
            <label>
              生成备注
              <Input
                value={generateForm.remarks}
                onChange={(event) => setGenerateForm({ ...generateForm, remarks: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              生成采购合同
            </Button>
          </form>
            </>
          )}
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="采购合同明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(purchaseContractPath)}>
              返回列表
            </Button>
          </div>
          {selectedContract ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/合同日</dt>
                  <dd>{purchaseContractStatusLabel(selectedContract.approval_status)} / {formatDate(selectedContract.contract_date)}</dd>
                </div>
                <div>
                  <dt>来源</dt>
                  <dd>{purchaseContractSourceTypeLabel(selectedContract.source_type)}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedContract.supplier_name}</dd>
                </div>
                <div>
                  <dt>采购员</dt>
                  <dd>{selectedContract.buyer_user_name ?? '未指定'}</dd>
                </div>
                <div>
                  <dt>交货日期</dt>
                  <dd>{formatDate(selectedContract.delivery_date)}</dd>
                </div>
                <div>
                  <dt>合同金额</dt>
                  <dd>{formatMoney(selectedContract.statistics.total_amount, selectedContract.currency)}</dd>
                </div>
                <div>
                  <dt>未付金额</dt>
                  <dd>{formatMoney(selectedContract.statistics.unpaid_amount, selectedContract.currency)}</dd>
                </div>
                <div>
                  <dt>审批人</dt>
                  <dd>{selectedContract.reviewer_name ?? '未审批'}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>付款条款</strong>
                <p>{selectedContract.payment_terms}</p>
              </div>
              <div className="transaction-box">
                <strong>合同备注</strong>
                <p>{selectedContract.remarks ?? '未填写'}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedContract.approval_status !== 'draft'}
                  onClick={loadSelectedContractForEdit}
                >
                  编辑合同
                </Button>
                <Button
                  disabled={selectedContract.approval_status !== 'draft'}
                  loading={submitting}
                  onClick={() => void submitSelectedContract()}
                >
                  提交采购合同
                </Button>
                <Button
                  disabled={selectedContract.approval_status !== 'submitted'}
                  onClick={() => setContractApprovalModalOpen(true)}
                >
                  审批采购合同
                </Button>
                <Button
                  icon={<FileSpreadsheet size={16} />}
                  loading={submitting}
                  onClick={() => void generateSelectedContractTemplate()}
                >
                  用合同模板生成
                </Button>
              </div>

              <Modal
                centered
                footer={null}
                open={contractApprovalModalOpen}
                title="审批采购合同"
                width={720}
                onCancel={() => setContractApprovalModalOpen(false)}
              >
                <div className="workflow-modal-content entity-modal-form">
                  <form className="record-form accessory-form approval-form" onSubmit={approveSelectedContract}>
                    <div className="form-divider">采购合同审批</div>
                    <div className="form-pair two">
                      <label>
                        审批人
                        <Input
                          value={approveForm.reviewer_name}
                          onChange={(event) =>
                            setApproveForm({ ...approveForm, reviewer_name: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        审批日期
                        <Input
                          type="date"
                          value={approveForm.approved_at}
                          onChange={(event) =>
                            setApproveForm({ ...approveForm, approved_at: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <Button
                      disabled={selectedContract.approval_status !== 'submitted'}
                      htmlType="submit"
                      loading={submitting}
                      type="primary"
                    >
                      审批采购合同
                    </Button>
                  </form>
                </div>
              </Modal>

              <div className="accessory-heading">
                <strong>合同商品明细</strong>
                <span>{selectedContract.lines.length} 行</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格/型号</th>
                    <th>数量</th>
                    <th>单价</th>
                    <th>金额</th>
                    <th>未收</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContract.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_code ?? '未填'} / {line.product_name}</td>
                      <td>{line.specification ?? '未填'} / {line.model ?? '未填'}</td>
                      <td>{line.quantity} {line.unit}</td>
                      <td>{formatMoney(line.unit_price, selectedContract.currency)}</td>
                      <td>{formatMoney(line.amount, selectedContract.currency)}</td>
                      <td>{line.unreceived_quantity} {line.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>来源出口合同</strong>
                <span>{selectedContract.source_links.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>出口合同</th>
                    <th>客户</th>
                    <th>商品</th>
                    <th>需求数量</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContract.source_links.map((source) => (
                    <tr key={source.id}>
                      <td>{source.export_contract_no}</td>
                      <td>{source.customer_name}</td>
                      <td>{source.product_code ?? '未填'}</td>
                      <td>{source.demand_quantity} {source.unit}</td>
                    </tr>
                  ))}
                  {selectedContract.source_links.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={4}>库存采购或手工采购，无来源出口合同</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>付款和交货提醒</strong>
                <span>{selectedContract.reminders.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>金额</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContract.reminders.map((reminder) => (
                    <tr key={reminder.id}>
                      <td>{purchaseReminderTypeLabel(reminder.reminder_type)}</td>
                      <td>{reminder.title}</td>
                      <td>{formatDate(reminder.due_date)}</td>
                      <td>{reminder.amount ? formatMoney(reminder.amount, reminder.currency) : '无金额'}</td>
                      <td>{purchaseReminderStatusLabel(reminder.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>进度概览</strong>
                <span>{selectedContract.statistics.unreceived_quantity} 未收</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>总数量</th>
                    <th>已收</th>
                    <th>未收</th>
                    <th>已付</th>
                    <th>未付</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{selectedContract.statistics.total_quantity}</td>
                    <td>{selectedContract.statistics.received_quantity}</td>
                    <td>{selectedContract.statistics.unreceived_quantity}</td>
                    <td>{formatMoney(selectedContract.statistics.paid_amount, selectedContract.currency)}</td>
                    <td>{formatMoney(selectedContract.statistics.unpaid_amount, selectedContract.currency)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>全局采购提醒</strong>
                <span>{reminders.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map((reminder) => (
                    <tr key={reminder.id}>
                      <td>{purchaseReminderTypeLabel(reminder.reminder_type)}</td>
                      <td>{reminder.title}</td>
                      <td>{formatDate(reminder.due_date)}</td>
                      <td>{reminder.amount ? formatMoney(reminder.amount, reminder.currency) : '无金额'}</td>
                    </tr>
                  ))}
                  {reminders.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={4}>暂无采购提醒</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <FileStack size={28} />
              <strong>暂无采购合同</strong>
              <span>请返回列表选择采购合同查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function PurchaseInvoiceNoticesPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [notices, setNotices] = useState<PurchaseInvoiceNotice[]>([])
  const [reminders, setReminders] = useState<PurchaseInvoiceNoticeReminder[]>([])
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [customsFilter, setCustomsFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [invoiceActionModal, setInvoiceActionModal] = useState<'send' | 'receive' | null>(null)
  const [form, setForm] = useState<PurchaseInvoiceNoticeFormState>(() =>
    initialPurchaseInvoiceNoticeForm(),
  )
  const [sendForm, setSendForm] = useState<PurchaseInvoiceNoticeSendFormState>(() =>
    initialPurchaseInvoiceNoticeSendForm(),
  )
  const [receiveForm, setReceiveForm] = useState<PurchaseInvoiceNoticeReceiveFormState>(() =>
    initialPurchaseInvoiceNoticeReceiveForm(),
  )

  const selectedNotice = useMemo(
    () => {
      if (detailId) return notices.find((item) => item.id === detailId) ?? null
      return notices.find((item) => item.id === selectedNoticeId) ?? notices[0] ?? null
    },
    [detailId, notices, selectedNoticeId],
  )

  useEffect(() => {
    void loadNotices()
  }, [])

  useEffect(() => {
    setSendForm((current) => ({
      ...current,
      sent_at: selectedNotice?.sent_at ?? selectedNotice?.notice_date ?? current.sent_at,
    }))
    setReceiveForm((current) => ({
      ...current,
      received_at: selectedNotice?.tax_invoice_received_at ?? selectedNotice?.sent_at ?? current.received_at,
    }))
  }, [selectedNotice?.id, selectedNotice?.status])

  useEffect(() => {
    if (detailId && notices.length > 0 && !notices.some((item) => item.id === detailId)) {
      onNavigate(purchaseInvoiceNoticePath)
    }
  }, [detailId, notices, onNavigate])

  async function loadNotices(preferredId?: string, overrideCustomsFilter?: string) {
    setLoading(true)
    setError('')
    try {
      const [noticeResult, reminderResult] = await Promise.all([
        listPurchaseInvoiceNotices({
          q: search.trim() || undefined,
          status: statusFilter || undefined,
          supplier_id: supplierFilter.trim() || undefined,
          customs_declaration_id: (overrideCustomsFilter ?? customsFilter).trim() || undefined,
        }),
        listPurchaseInvoiceNoticeReminders(),
      ])
      setNotices(noticeResult.items)
      setReminders(reminderResult.items)
      const nextSelectedId =
        preferredId ??
        (noticeResult.items.some((item) => item.id === selectedNoticeId) ? selectedNoticeId : null) ??
        noticeResult.items[0]?.id ??
        null
      setSelectedNoticeId(nextSelectedId)
    } catch (caught) {
      showError(caught, '开票通知加载失败')
    } finally {
      setLoading(false)
    }
  }

  function upsertNotice(notice: PurchaseInvoiceNotice) {
    setNotices((current) => {
      const exists = current.some((item) => item.id === notice.id)
      return exists
        ? current.map((item) => (item.id === notice.id ? notice : item))
        : [notice, ...current]
    })
    setSelectedNoticeId(notice.id)
  }

  function openInvoiceNoticeDetail(notice: PurchaseInvoiceNotice) {
    setSelectedNoticeId(notice.id)
    onNavigate(moduleDetailPath(purchaseInvoiceNoticePath, notice.id))
  }

  function stopAndOpenInvoiceNoticeDetail(event: MouseEvent<HTMLElement>, notice: PurchaseInvoiceNotice) {
    event.stopPropagation()
    openInvoiceNoticeDetail(notice)
  }

  async function generateFromCustoms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const customsId = form.customs_declaration_id.trim()
      const result = await generatePurchaseInvoiceNoticesFromDeclaration(
        purchaseInvoiceNoticeGeneratePayload(form),
      )
      const firstNotice = result.items[0] ?? null
      setSearch('')
      setStatusFilter('')
      setSupplierFilter('')
      setCustomsFilter(customsId)
      setMessage(`已生成 ${result.total} 条供应商开票通知`)
      setForm(initialPurchaseInvoiceNoticeForm())
      setInvoiceModalOpen(false)
      if (firstNotice) upsertNotice(firstNotice)
      await loadNotices(firstNotice?.id, customsId)
    } catch (caught) {
      showError(caught, '开票通知生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function sendSelectedNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedNotice) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const sent = await sendPurchaseInvoiceNotice(
        selectedNotice.id,
        purchaseInvoiceNoticeSendPayload(sendForm),
      )
      setMessage(`已发送开票通知 ${sent.code}，系统已生成税票催收提醒`)
      setInvoiceActionModal(null)
      upsertNotice(sent)
      await loadNotices(sent.id)
    } catch (caught) {
      showError(caught, '开票通知发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function receiveSelectedNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedNotice) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const received = await receivePurchaseInvoiceNoticeTaxInvoice(
        selectedNotice.id,
        purchaseInvoiceNoticeReceivePayload(receiveForm),
      )
      setMessage(`已登记税票 ${received.tax_invoice_no ?? ''}`)
      setInvoiceActionModal(null)
      upsertNotice(received)
      await loadNotices(received.id)
    } catch (caught) {
      showError(caught, '税票登记失败')
    } finally {
      setSubmitting(false)
    }
  }

  const sentCount = notices.filter((item) => item.status === 'sent').length
  const receivedCount = notices.filter((item) => item.status === 'received').length
  const openReminders = reminders.filter((item) => item.status === 'open').length
  const totalAmount = notices.reduce((sum, item) => sum + Number(item.total_amount), 0)
  const currency = notices[0]?.currency ?? 'CNY'

  return (
    <section className="purchase-invoice-page">
      <OperationFlowRail activePath={purchaseInvoiceNoticePath} kind="purchase" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="开票通知概览">
        <Metric label="开票通知" value={notices.length} />
        <Metric label="已发送" value={sentCount} />
        <Metric label="已收票" value={receivedCount} />
        <Metric label="通知金额" value={formatMoney(totalAmount.toFixed(2), currency)} />
        <Metric label="待催收" value={openReminders} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid purchase-invoice-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="开票通知列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadNotices()
              }}
            >
              <label>
                通知搜索
                <Input
                  value={search}
                  placeholder="通知号 / 供应商 / 品名"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                通知状态
                <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {purchaseInvoiceNoticeStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
              <label>
                供应商标识
                <Input
                  value={supplierFilter}
                  placeholder="supplier-id"
                  onChange={(event) => setSupplierFilter(event.target.value)}
                />
              </label>
              <label>
                报关单证 ID
                <Input
                  value={customsFilter}
                  placeholder="customs-id"
                  onChange={(event) => setCustomsFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button
                htmlType="button"
                icon={<Plus size={16} />}
                onClick={() => {
                  setForm(initialPurchaseInvoiceNoticeForm())
                  setInvoiceModalOpen(true)
                }}
              >
                生成开票通知
              </Button>
            </form>
          </div>

          <Table<PurchaseInvoiceNotice>
            columns={[
              {
                title: '开票通知',
                dataIndex: 'code',
                render: (value: string, record: PurchaseInvoiceNotice) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenInvoiceNoticeDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: purchaseInvoiceNoticeStatusLabel },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '报关单', dataIndex: 'customs_declaration_no' },
              {
                title: '金额',
                dataIndex: 'total_amount',
                render: (_, notice) => formatMoney(notice.total_amount, notice.currency),
              },
              {
                title: '提醒',
                dataIndex: 'reminders',
                render: (_, notice) => `${notice.reminders.filter((item) => item.status === 'open').length} 个`,
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: PurchaseInvoiceNotice) => (
                  <Button size="small" onClick={(event) => stopAndOpenInvoiceNoticeDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={notices}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedNotice?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedNoticeId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={invoiceModalOpen}
          title="从报关单证生成开票通知"
          width={1040}
          onCancel={() => setInvoiceModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<LayoutDashboard size={18} />} title="从报关单证生成" />
          <form className="record-form" onSubmit={generateFromCustoms}>
            <div className="form-pair two">
              <label htmlFor="purchase-invoice-customs-id">
                报关单证 ID
                <Input
                  id="purchase-invoice-customs-id"
                  value={form.customs_declaration_id}
                  onChange={(event) => setForm({ ...form, customs_declaration_id: event.target.value })}
                />
              </label>
              <label htmlFor="purchase-invoice-customs-no">
                报关单号
                <Input
                  id="purchase-invoice-customs-no"
                  required
                  value={form.customs_declaration_no}
                  onChange={(event) => setForm({ ...form, customs_declaration_no: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label htmlFor="purchase-invoice-declaration-date">
                报关日期
                <Input
                  id="purchase-invoice-declaration-date"
                  required
                  type="date"
                  value={form.declaration_date}
                  onChange={(event) => setForm({ ...form, declaration_date: event.target.value })}
                />
              </label>
              <label htmlFor="purchase-invoice-notice-date">
                通知日期
                <Input
                  id="purchase-invoice-notice-date"
                  required
                  type="date"
                  value={form.notice_date}
                  onChange={(event) => setForm({ ...form, notice_date: event.target.value })}
                />
              </label>
              <label htmlFor="purchase-invoice-currency">
                币种
                <Input
                  id="purchase-invoice-currency"
                  required
                  value={form.currency}
                  onChange={(event) => setForm({ ...form, currency: event.target.value })}
                />
              </label>
            </div>
            <label htmlFor="purchase-invoice-remarks">
              生成备注
              <Input
                id="purchase-invoice-remarks"
                value={form.remarks}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
              />
            </label>

            <PurchaseInvoiceLineFields
              form={form}
              lineKey="a"
              required
              setForm={setForm}
              title="供应商 A 开票要求"
            />
            <PurchaseInvoiceLineFields
              form={form}
              lineKey="b"
              setForm={setForm}
              title="供应商 B 开票要求"
            />

            <Button htmlType="submit" loading={submitting} type="primary">
              生成开票通知
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="开票通知明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(purchaseInvoiceNoticePath)}>
              返回列表
            </Button>
          </div>
          {selectedNotice ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>状态/通知日</dt>
                  <dd>{purchaseInvoiceNoticeStatusLabel(selectedNotice.status)} / {formatDate(selectedNotice.notice_date)}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedNotice.supplier_name}</dd>
                </div>
                <div>
                  <dt>报关单号</dt>
                  <dd>{selectedNotice.customs_declaration_no}</dd>
                </div>
                <div>
                  <dt>报关日期</dt>
                  <dd>{formatDate(selectedNotice.declaration_date)}</dd>
                </div>
                <div>
                  <dt>开票数量</dt>
                  <dd>{selectedNotice.total_quantity}</dd>
                </div>
                <div>
                  <dt>通知金额</dt>
                  <dd>{formatMoney(selectedNotice.total_amount, selectedNotice.currency)}</dd>
                </div>
                <div>
                  <dt>发送人</dt>
                  <dd>{selectedNotice.sender_name ?? '未发送'}</dd>
                </div>
                <div>
                  <dt>税票号</dt>
                  <dd>{selectedNotice.tax_invoice_no ?? '未收票'}</dd>
                </div>
              </dl>

              <div className="transaction-box">
                <strong>开票通知备注</strong>
                <p>{selectedNotice.remarks ?? '未填写'}</p>
              </div>

              <div className="delivery-action-row">
                <Button
                  disabled={selectedNotice.status !== 'draft'}
                  type="primary"
                  onClick={() => setInvoiceActionModal('send')}
                >
                  发送开票通知
                </Button>
                <Button
                  disabled={selectedNotice.status === 'received'}
                  onClick={() => setInvoiceActionModal('receive')}
                >
                  登记税票
                </Button>
              </div>

              <Modal
                centered
                footer={null}
                open={invoiceActionModal === 'send'}
                title="发送开票通知"
                width={720}
                onCancel={() => setInvoiceActionModal(null)}
              >
                <div className="workflow-modal-content entity-modal-form">
                  <form className="record-form accessory-form generation-form" onSubmit={sendSelectedNotice}>
                    <div className="form-divider">发送开票通知</div>
                    <div className="form-pair two">
                      <label htmlFor="purchase-invoice-sender">
                        发送人
                        <Input
                          id="purchase-invoice-sender"
                          required
                          value={sendForm.sender_name}
                          onChange={(event) => setSendForm({ ...sendForm, sender_name: event.target.value })}
                        />
                      </label>
                      <label htmlFor="purchase-invoice-sent-at">
                        发送日期
                        <Input
                          id="purchase-invoice-sent-at"
                          required
                          type="date"
                          value={sendForm.sent_at}
                          onChange={(event) => setSendForm({ ...sendForm, sent_at: event.target.value })}
                        />
                      </label>
                    </div>
                    <Button
                      disabled={selectedNotice.status !== 'draft'}
                      htmlType="submit"
                      loading={submitting}
                      type="primary"
                    >
                      发送开票通知
                    </Button>
                  </form>
                </div>
              </Modal>

              <Modal
                centered
                footer={null}
                open={invoiceActionModal === 'receive'}
                title="登记供应商税票"
                width={720}
                onCancel={() => setInvoiceActionModal(null)}
              >
                <div className="workflow-modal-content entity-modal-form">
                  <form className="record-form accessory-form generation-form" onSubmit={receiveSelectedNotice}>
                    <div className="form-divider">登记供应商税票</div>
                    <div className="form-pair two">
                      <label htmlFor="purchase-invoice-tax-no">
                        税票号
                        <Input
                          id="purchase-invoice-tax-no"
                          required
                          value={receiveForm.tax_invoice_no}
                          onChange={(event) =>
                            setReceiveForm({ ...receiveForm, tax_invoice_no: event.target.value })
                          }
                        />
                      </label>
                      <label htmlFor="purchase-invoice-received-at">
                        收票日期
                        <Input
                          id="purchase-invoice-received-at"
                          required
                          type="date"
                          value={receiveForm.received_at}
                          onChange={(event) =>
                            setReceiveForm({ ...receiveForm, received_at: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <Button
                      disabled={selectedNotice.status === 'received'}
                      htmlType="submit"
                      loading={submitting}
                    >
                      登记税票
                    </Button>
                  </form>
                </div>
              </Modal>

              <div className="accessory-heading">
                <strong>开票品名和数量</strong>
                <span>{selectedNotice.lines.length} 行</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>采购合同</th>
                    <th>报关品名</th>
                    <th>开票品名</th>
                    <th>数量</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedNotice.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.purchase_contract_no ?? '未关联'}</td>
                      <td>{line.customs_name}</td>
                      <td>{line.invoice_name}</td>
                      <td>{line.quantity} {line.unit}</td>
                      <td>{formatMoney(line.amount, line.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>税票催收提醒</strong>
                <span>{selectedNotice.reminders.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedNotice.reminders.map((reminder) => (
                    <tr key={reminder.id}>
                      <td>{reminder.title}</td>
                      <td>{formatDate(reminder.due_date)}</td>
                      <td>{purchaseInvoiceReminderStatusLabel(reminder.status)}</td>
                    </tr>
                  ))}
                  {selectedNotice.reminders.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={3}>发送后自动生成税票催收提醒</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>全局税票催收</strong>
                <span>{reminders.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map((reminder) => (
                    <tr key={reminder.id}>
                      <td>{reminder.title}</td>
                      <td>{formatDate(reminder.due_date)}</td>
                      <td>{purchaseInvoiceReminderStatusLabel(reminder.status)}</td>
                    </tr>
                  ))}
                  {reminders.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={3}>暂无税票催收提醒</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Receipt size={28} />
              <strong>暂无开票通知</strong>
              <span>请返回列表选择开票通知查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function PurchaseInvoiceLineFields({
  form,
  lineKey,
  required = false,
  setForm,
  title,
}: {
  form: PurchaseInvoiceNoticeFormState
  lineKey: 'a' | 'b'
  required?: boolean
  setForm: (form: PurchaseInvoiceNoticeFormState) => void
  title: string
}) {
  const suffix = lineKey
  const values = {
    supplier_id: form[`supplier_id_${suffix}`],
    supplier_name: form[`supplier_name_${suffix}`],
    purchase_contract_id: form[`purchase_contract_id_${suffix}`],
    purchase_contract_no: form[`purchase_contract_no_${suffix}`],
    product_id: form[`product_id_${suffix}`],
    product_code: form[`product_code_${suffix}`],
    product_name: form[`product_name_${suffix}`],
    customs_name: form[`customs_name_${suffix}`],
    invoice_name: form[`invoice_name_${suffix}`],
    quantity: form[`quantity_${suffix}`],
    unit: form[`unit_${suffix}`],
    amount: form[`amount_${suffix}`],
    remark: form[`remark_${suffix}`],
  }

  function update(field: keyof typeof values, value: string) {
    setForm({
      ...form,
      [`${field}_${suffix}`]: value,
    } as PurchaseInvoiceNoticeFormState)
  }

  return (
    <>
      <div className="form-divider">{title}</div>
      <div className="form-pair two">
        <label htmlFor={`purchase-invoice-supplier-id-${suffix}`}>
          供应商标识
          <Input
            id={`purchase-invoice-supplier-id-${suffix}`}
            value={values.supplier_id}
            onChange={(event) => update('supplier_id', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-supplier-name-${suffix}`}>
          供应商
          <Input
            id={`purchase-invoice-supplier-name-${suffix}`}
            required={required}
            value={values.supplier_name}
            onChange={(event) => update('supplier_name', event.target.value)}
          />
        </label>
      </div>
      <div className="form-pair two">
        <label htmlFor={`purchase-invoice-contract-no-${suffix}`}>
          采购合同号
          <Input
            id={`purchase-invoice-contract-no-${suffix}`}
            value={values.purchase_contract_no}
            onChange={(event) => update('purchase_contract_no', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-product-code-${suffix}`}>
          商品编号
          <Input
            id={`purchase-invoice-product-code-${suffix}`}
            value={values.product_code}
            onChange={(event) => update('product_code', event.target.value)}
          />
        </label>
      </div>
      <div className="visually-hidden">
        <label htmlFor={`purchase-invoice-contract-id-${suffix}`}>
          采购合同 ID
          <Input
            id={`purchase-invoice-contract-id-${suffix}`}
            value={values.purchase_contract_id}
            onChange={(event) => update('purchase_contract_id', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-product-id-${suffix}`}>
          商品 ID
          <Input
            id={`purchase-invoice-product-id-${suffix}`}
            value={values.product_id}
            onChange={(event) => update('product_id', event.target.value)}
          />
        </label>
      </div>
      <div className="form-pair three">
        <label htmlFor={`purchase-invoice-product-name-${suffix}`}>
          商品名称
          <Input
            id={`purchase-invoice-product-name-${suffix}`}
            required={required}
            value={values.product_name}
            onChange={(event) => update('product_name', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-customs-name-${suffix}`}>
          报关品名
          <Input
            id={`purchase-invoice-customs-name-${suffix}`}
            required={required}
            value={values.customs_name}
            onChange={(event) => update('customs_name', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-name-${suffix}`}>
          开票品名
          <Input
            id={`purchase-invoice-name-${suffix}`}
            required={required}
            value={values.invoice_name}
            onChange={(event) => update('invoice_name', event.target.value)}
          />
        </label>
      </div>
      <div className="form-pair three">
        <label htmlFor={`purchase-invoice-quantity-${suffix}`}>
          开票数量
          <Input
            id={`purchase-invoice-quantity-${suffix}`}
            min="0.0001"
            required={required}
            step="0.0001"
            type="number"
            value={values.quantity}
            onChange={(event) => update('quantity', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-unit-${suffix}`}>
          单位
          <Input
            id={`purchase-invoice-unit-${suffix}`}
            required={required}
            value={values.unit}
            onChange={(event) => update('unit', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-amount-${suffix}`}>
          金额
          <Input
            id={`purchase-invoice-amount-${suffix}`}
            min="0"
            step="0.01"
            type="number"
            value={values.amount}
            onChange={(event) => update('amount', event.target.value)}
          />
        </label>
      </div>
      <label htmlFor={`purchase-invoice-remark-${suffix}`}>
        行备注
        <Input
          id={`purchase-invoice-remark-${suffix}`}
          value={values.remark}
          onChange={(event) => update('remark', event.target.value)}
        />
      </label>
    </>
  )
}

function FollowupPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [templates, setTemplates] = useState<FollowProcessTemplate[]>([])
  const [plans, setPlans] = useState<PurchaseFollowPlan[]>([])
  const [overdueNodes, setOverdueNodes] = useState<PurchaseFollowOverdueNode[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [overdueAsOf, setOverdueAsOf] = useState('2026-09-05')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [followupModalOpen, setFollowupModalOpen] = useState(false)
  const [templateForm, setTemplateForm] = useState<FollowupTemplateFormState>(() =>
    initialFollowupTemplateForm(),
  )
  const [planForm, setPlanForm] = useState<FollowupPlanFormState>(() =>
    initialFollowupPlanForm(),
  )
  const [sourceEventForm, setSourceEventForm] = useState<FollowupSourceEventFormState>(() =>
    initialFollowupSourceEventForm(),
  )

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? templates[0] ?? null,
    [templates, selectedTemplateId],
  )
  const selectedPlan = useMemo(
    () => {
      if (detailId) return plans.find((item) => item.id === detailId) ?? null
      return plans.find((item) => item.id === selectedPlanId) ?? plans[0] ?? null
    },
    [detailId, plans, selectedPlanId],
  )

  useEffect(() => {
    void loadFollowupWorkspace()
  }, [])

  useEffect(() => {
    setTemplateForm(followupTemplateToForm(selectedTemplate))
  }, [selectedTemplate?.id])

  useEffect(() => {
    if (!selectedPlan) return
    setPlanForm({
      purchase_contract_id: selectedPlan.purchase_contract_id,
      as_of: selectedPlan.base_date,
    })
    setSourceEventForm((current) => followupSourceEventFormForPlan(selectedPlan, current))
  }, [selectedPlan?.id, selectedPlan?.overall_status])

  useEffect(() => {
    if (detailId && plans.length > 0 && !plans.some((item) => item.id === detailId)) {
      onNavigate(followupPath)
    }
  }, [detailId, onNavigate, plans])

  function openFollowupDetail(plan: PurchaseFollowPlan) {
    setSelectedPlanId(plan.id)
    onNavigate(moduleDetailPath(followupPath, plan.id))
  }

  function stopAndOpenFollowupDetail(event: MouseEvent<HTMLElement>, plan: PurchaseFollowPlan) {
    event.stopPropagation()
    openFollowupDetail(plan)
  }

  async function loadFollowupWorkspace(preferredPlanId?: string, preferredTemplateId?: string) {
    setLoading(true)
    setError('')
    try {
      const [templateResult, planResult, overdueResult] = await Promise.all([
        listFollowupTemplates(),
        listFollowupPlans({
          q: search.trim() || undefined,
          overall_status: statusFilter || undefined,
          supplier_id: supplierFilter.trim() || undefined,
          purchase_contract_id: contractFilter.trim() || undefined,
        }),
        listFollowupOverdueNodes(overdueAsOf),
      ])
      setTemplates(templateResult.items)
      setPlans(planResult.items)
      setOverdueNodes(overdueResult.items)

      const nextTemplateId =
        preferredTemplateId ??
        (templateResult.items.some((item) => item.id === selectedTemplateId) ? selectedTemplateId : null) ??
        templateResult.items[0]?.id ??
        null
      const nextPlanId =
        preferredPlanId ??
        (planResult.items.some((item) => item.id === selectedPlanId) ? selectedPlanId : null) ??
        planResult.items[0]?.id ??
        null
      setSelectedTemplateId(nextTemplateId)
      setSelectedPlanId(nextPlanId)
    } catch (caught) {
      showError(caught, '采购跟单加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function saveFollowupTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const payload = followupTemplatePayload(templateForm)
      const template = selectedTemplate
        ? await updateFollowupTemplate(selectedTemplate.id, payload)
        : await createFollowupTemplate(payload)
      setMessage(`已保存跟单模板 ${template.name}`)
      setFollowupModalOpen(false)
      await loadFollowupWorkspace(selectedPlan?.id, template.id)
    } catch (caught) {
      showError(caught, '跟单模板保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function generateFollowupPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const plan = await generateFollowupPlanFromPurchaseContract(followupPlanGeneratePayload(planForm))
      setContractFilter(plan.purchase_contract_id)
      setSelectedPlanId(plan.id)
      setFollowupModalOpen(false)
      await loadFollowupWorkspace(plan.id)
      setMessage(`已生成跟单计划 ${plan.purchase_contract_no}`)
    } catch (caught) {
      showError(caught, '跟单计划生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function syncSelectedFollowupSampleEvents() {
    if (!selectedPlan) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const synced = await syncFollowupSampleEvents({
        purchase_contract_id: selectedPlan.purchase_contract_id,
        as_of: selectedPlan.base_date,
      })
      await loadFollowupWorkspace(synced.id)
      setMessage(`已同步样品跟单事件 ${synced.purchase_contract_no}`)
    } catch (caught) {
      showError(caught, '样品事件同步失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function syncFollowupSourceEventFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const nodeLabel = followupNodeLabel(sourceEventForm.node_code)
      const plan = await syncFollowupSourceEvent(followupSourceEventPayload(sourceEventForm))
      setFollowupModalOpen(false)
      await loadFollowupWorkspace(plan.id)
      setMessage(`已回写节点 ${nodeLabel}`)
    } catch (caught) {
      showError(caught, '来源事件回写失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function scanFollowupOverdueNodes(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const overdue = await listFollowupOverdueNodes(overdueAsOf)
      setOverdueNodes(overdue.items)
      setMessage(`已扫描 ${overdue.total} 个逾期节点`)
    } catch (caught) {
      showError(caught, '逾期节点扫描失败')
    } finally {
      setSubmitting(false)
    }
  }

  const completedPlans = plans.filter((item) => item.overall_status === 'completed').length
  const overduePlans = plans.filter((item) => item.overall_status === 'overdue').length
  const totalNodes = plans.reduce((sum, item) => sum + item.nodes.length, 0)
  const completedNodes = plans.reduce(
    (sum, item) => sum + item.nodes.filter((node) => node.status === 'completed').length,
    0,
  )

  return (
    <section className="followup-page">
      <OperationFlowRail activePath={followupPath} kind="purchase" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="采购跟单概览">
        <Metric label="跟单计划" value={plans.length} />
        <Metric label="已完成计划" value={completedPlans} />
        <Metric label="逾期计划" value={overduePlans} intent={overduePlans > 0 ? 'warning' : 'normal'} />
        <Metric label="完成节点" value={`${completedNodes}/${totalNodes}`} />
        <Metric label="逾期节点" value={overdueNodes.length} intent={overdueNodes.length > 0 ? 'danger' : 'normal'} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid followup-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="采购跟单计划" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadFollowupWorkspace()
              }}
            >
              <label>
                计划搜索
                <Input
                  value={search}
                  placeholder="采购合同 / 供应商"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label>
                整体状态
              <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {followupStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
              <label>
                供应商标识
                <Input
                  value={supplierFilter}
                  placeholder="supplier-id"
                  onChange={(event) => setSupplierFilter(event.target.value)}
                />
              </label>
              <label>
                采购合同 ID
                <Input
                  value={contractFilter}
                  placeholder="purchase-contract-id"
                  onChange={(event) => setContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Settings size={16} />} onClick={() => setFollowupModalOpen(true)}>
                配置/生成
              </Button>
            </form>
          </div>

          <Table<PurchaseFollowPlan>
            columns={[
              {
                title: '采购合同',
                dataIndex: 'purchase_contract_no',
                render: (value: string, record: PurchaseFollowPlan) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenFollowupDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'overall_status', render: followupPlanStatusLabel },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '基准日', dataIndex: 'base_date', render: formatDate },
              {
                title: '节点',
                dataIndex: 'nodes',
                render: (_, plan) => `${plan.nodes.filter((node) => node.status === 'completed').length}/${plan.nodes.length}`,
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: PurchaseFollowPlan) => (
                  <Button size="small" onClick={(event) => stopAndOpenFollowupDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={plans}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedPlan?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedPlanId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={followupModalOpen}
          title="跟单模板和计划生成"
          width={1040}
          onCancel={() => setFollowupModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<LayoutDashboard size={18} />} title="跟单流程模板" />
          <form className="record-form" onSubmit={saveFollowupTemplate}>
            <div className="form-pair two">
              <label htmlFor="followup-template-name">
                模板名称
                <Input
                  id="followup-template-name"
                  required
                  value={templateForm.name}
                  onChange={(event) => setTemplateForm({ ...templateForm, name: event.target.value })}
                />
              </label>
              <label>
                默认模板
              <FormSelect
                value={String(templateForm.is_default)}
                onChange={(event) =>
                  setTemplateForm({ ...templateForm, is_default: event.target.value === 'true' })
                }
              >
                <option value="true">是</option>
                <option value="false">否</option>
              </FormSelect>
              </label>
            </div>
            <label className="checkbox-label" htmlFor="followup-template-enabled">
              <input
                checked={templateForm.enabled}
                id="followup-template-enabled"
                type="checkbox"
                onChange={(event) =>
                  setTemplateForm({ ...templateForm, enabled: event.target.checked })
                }
              />
              启用模板
            </label>

            <div className="form-divider">节点标准天数 / 提前提醒天数</div>
            <FollowupTemplateNodeFields
              daysKey="contract_days"
              label="合同下单确立"
              remindKey="contract_remind"
              remindLabel="合同提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <FollowupTemplateNodeFields
              daysKey="confirm_days"
              label="确认样提交"
              remindKey="confirm_remind"
              remindLabel="确认样提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <FollowupTemplateNodeFields
              daysKey="bulk_days"
              label="大货样提交"
              remindKey="bulk_remind"
              remindLabel="大货样提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <FollowupTemplateNodeFields
              daysKey="qc_days"
              label="QC 查验"
              remindKey="qc_remind"
              remindLabel="QC 提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <FollowupTemplateNodeFields
              daysKey="inbound_days"
              label="入库"
              remindKey="inbound_remind"
              remindLabel="入库提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <FollowupTemplateNodeFields
              daysKey="outbound_days"
              label="出库"
              remindKey="outbound_remind"
              remindLabel="出库提醒"
              setTemplateForm={setTemplateForm}
              templateForm={templateForm}
            />
            <Button htmlType="submit" loading={submitting} type="primary">
              保存跟单模板
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={generateFollowupPlan}>
            <div className="form-divider">采购合同生成跟单计划</div>
            <label htmlFor="followup-contract-id">
              采购合同 ID
              <Input
                id="followup-contract-id"
                required
                value={planForm.purchase_contract_id}
                onChange={(event) =>
                  setPlanForm({ ...planForm, purchase_contract_id: event.target.value })
                }
              />
            </label>
            <label htmlFor="followup-base-date">
              基准日期
              <Input
                id="followup-base-date"
                type="date"
                value={planForm.as_of}
                onChange={(event) => setPlanForm({ ...planForm, as_of: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting}>
              生成跟单计划
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={syncFollowupSourceEventFromForm}>
            <div className="form-divider">业务来源回写</div>
            <label htmlFor="followup-source-contract-id">
              采购合同 ID
              <Input
                id="followup-source-contract-id"
                required
                value={sourceEventForm.purchase_contract_id}
                onChange={(event) =>
                  setSourceEventForm({ ...sourceEventForm, purchase_contract_id: event.target.value })
                }
              />
            </label>
            <div className="form-pair two">
              <label>
                节点
              <FormSelect
                value={sourceEventForm.node_code}
                onChange={(event) =>
                  setSourceEventForm({
                    ...sourceEventForm,
                    node_code: event.target.value,
                    source_record_type: followupSourceTypeForNode(event.target.value),
                  })
                }
              >
                {followupNodeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
              <label>
                来源类型
              <FormSelect
                value={sourceEventForm.source_record_type}
                onChange={(event) =>
                  setSourceEventForm({ ...sourceEventForm, source_record_type: event.target.value })
                }
              >
                {followupSourceTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="followup-source-id">
                来源记录 ID
                <Input
                  id="followup-source-id"
                  required
                  value={sourceEventForm.source_record_id}
                  onChange={(event) =>
                    setSourceEventForm({ ...sourceEventForm, source_record_id: event.target.value })
                  }
                />
              </label>
              <label htmlFor="followup-actual-date">
                实际日期
                <Input
                  id="followup-actual-date"
                  required
                  type="date"
                  value={sourceEventForm.actual_date}
                  onChange={(event) =>
                    setSourceEventForm({ ...sourceEventForm, actual_date: event.target.value })
                  }
                />
              </label>
            </div>
            <label htmlFor="followup-source-summary">
              来源摘要
              <Input
                id="followup-source-summary"
                required
                value={sourceEventForm.source_summary}
                onChange={(event) =>
                  setSourceEventForm({ ...sourceEventForm, source_summary: event.target.value })
                }
              />
            </label>
            <Button htmlType="submit" loading={submitting}>
              回写实际日期
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="节点进度查询" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(followupPath)}>
              返回列表
            </Button>
          </div>
          {selectedPlan ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>整体状态</dt>
                  <dd>{followupPlanStatusLabel(selectedPlan.overall_status)}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedPlan.supplier_name}</dd>
                </div>
                <div>
                  <dt>基准日期</dt>
                  <dd>{formatDate(selectedPlan.base_date)}</dd>
                </div>
                <div>
                  <dt>采购合同 ID</dt>
                  <dd>{selectedPlan.purchase_contract_id}</dd>
                </div>
              </dl>

              <div className="delivery-action-row">
                <Button
                  icon={<RefreshCw size={16} />}
                  loading={submitting}
                  onClick={() => void syncSelectedFollowupSampleEvents()}
                >
                  同步样品事件
                </Button>
                <Button
                  icon={<Search size={16} />}
                  loading={submitting}
                  onClick={() => void scanFollowupOverdueNodes()}
                >
                  扫描逾期节点
                </Button>
              </div>

              <div className="accessory-heading">
                <strong>采购合同节点进度</strong>
                <span>{selectedPlan.nodes.length} 个节点</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>节点</th>
                    <th>预计</th>
                    <th>提醒</th>
                    <th>实际</th>
                    <th>状态</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.nodes.map((node) => (
                    <tr key={node.id}>
                      <td>{node.node_name}</td>
                      <td>{formatDate(node.planned_date)}</td>
                      <td>{formatDate(node.remind_date)}</td>
                      <td>{node.actual_date ? formatDate(node.actual_date) : '待回写'}</td>
                      <td>{followupNodeStatusLabel(node.status)}</td>
                      <td>{followupSourceTypeLabel(node.source_record_type)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>逾期节点预警</strong>
                <span>{overdueNodes.length} 条</span>
              </div>
              <form className="inline-filters inline-search" onSubmit={scanFollowupOverdueNodes}>
                <label>
                  扫描日期
                  <Input
                    type="date"
                    value={overdueAsOf}
                    onChange={(event) => setOverdueAsOf(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />} loading={submitting}>
                  扫描
                </Button>
              </form>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>采购合同</th>
                    <th>供应商</th>
                    <th>节点</th>
                    <th>预计</th>
                    <th>逾期</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueNodes.map((node) => (
                    <tr key={node.id}>
                      <td>{node.purchase_contract_no}</td>
                      <td>{node.supplier_name}</td>
                      <td>{node.node_name}</td>
                      <td>{formatDate(node.planned_date)}</td>
                      <td>{node.overdue_days} 天</td>
                    </tr>
                  ))}
                  {overdueNodes.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>暂无逾期节点</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <ClipboardCheck size={28} />
              <strong>暂无采购跟单计划</strong>
              <span>请返回列表选择跟单计划查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function QualityInspectionsPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [inspections, setInspections] = useState<QualityInspection[]>([])
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null)
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [resultFilter, setResultFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [eligibility, setEligibility] = useState<QualityInspectionInboundEligibility | null>(null)
  const [form, setForm] = useState<QualityInspectionFormState>(() => initialQualityInspectionForm())
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedInspection = useMemo(
    () => {
      if (detailId) return inspections.find((item) => item.id === detailId) ?? null
      return inspections.find((item) => item.id === selectedInspectionId) ?? inspections[0] ?? null
    },
    [detailId, inspections, selectedInspectionId],
  )

  useEffect(() => {
    void loadQualityInspections()
  }, [])

  useEffect(() => {
    if (detailId && selectedInspection) {
      void refreshQualityInboundEligibility(selectedInspection.purchase_contract_id)
      return
    }
    setEligibility(null)
  }, [detailId, selectedInspection?.id])

  useEffect(() => {
    if (detailId && inspections.length > 0 && !inspections.some((item) => item.id === detailId)) {
      onNavigate(qualityInspectionPath)
    }
  }, [detailId, inspections, onNavigate])

  async function loadQualityInspections(preferredInspectionId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listQualityInspections({
        q: search.trim() || undefined,
        result: resultFilter || undefined,
        supplier_id: supplierFilter.trim() || undefined,
        purchase_contract_id: contractFilter.trim() || undefined,
      })
      setInspections(result.items)
      const nextId =
        preferredInspectionId ??
        (result.items.some((item) => item.id === selectedInspectionId)
          ? selectedInspectionId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedInspectionId(nextId)
    } catch (caught) {
      showError(caught, 'QC 查验加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function refreshQualityInboundEligibility(purchaseContractId: string) {
    if (!purchaseContractId.trim()) {
      setEligibility(null)
      return
    }
    try {
      const result = await getQualityInboundEligibility(purchaseContractId)
      setEligibility(result)
    } catch (caught) {
      setEligibility(null)
      showError(caught, '入库判定加载失败')
    }
  }

  function startNewInspection() {
    setEditingInspectionId(null)
    setForm(initialQualityInspectionForm())
    setMessage('')
    setError('')
    setInspectionModalOpen(true)
  }

  function selectInspection(inspection: QualityInspection) {
    setSelectedInspectionId(inspection.id)
  }

  function openInspectionDetail(inspection: QualityInspection) {
    setSelectedInspectionId(inspection.id)
    onNavigate(moduleDetailPath(qualityInspectionPath, inspection.id))
  }

  function stopAndOpenInspectionDetail(event: MouseEvent<HTMLElement>, inspection: QualityInspection) {
    event.stopPropagation()
    openInspectionDetail(inspection)
  }

  function editSelectedInspection() {
    if (!selectedInspection) return
    setEditingInspectionId(selectedInspection.id)
    setForm(qualityInspectionToForm(selectedInspection))
    setInspectionModalOpen(true)
  }

  async function saveQualityInspection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const payload = qualityInspectionPayload(form)
      const inspection = editingInspectionId
        ? await updateQualityInspection(editingInspectionId, payload)
        : await createQualityInspection(payload)
      setSelectedInspectionId(inspection.id)
      setEditingInspectionId(null)
      setForm(qualityInspectionToForm(inspection))
      setInspectionModalOpen(false)
      setMessage(`已登记 ${inspection.code}，QC 节点已回写采购跟单`)
      await loadQualityInspections(inspection.id)
      await refreshQualityInboundEligibility(inspection.purchase_contract_id)
    } catch (caught) {
      showError(caught, 'QC 查验保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const passedCount = inspections.filter((item) => item.result === 'passed').length
  const failedCount = inspections.filter((item) => item.result === 'failed').length
  const recheckCount = inspections.filter((item) =>
    ['partial_passed', 'recheck_required'].includes(item.result),
  ).length
  const issueCount = inspections.reduce((sum, item) => sum + item.issues.length, 0)

  return (
    <section className="quality-inspection-page">
      <OperationFlowRail activePath={qualityInspectionPath} kind="warehouse" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="QC 查验概览">
        <Metric label="QC 单数" value={inspections.length} />
        <Metric label="已通过" value={passedCount} />
        <Metric label="不通过" value={failedCount} intent={failedCount > 0 ? 'danger' : 'normal'} />
        <Metric label="待复检" value={recheckCount} intent={recheckCount > 0 ? 'warning' : 'normal'} />
        <Metric label="异常问题" value={issueCount} intent={issueCount > 0 ? 'warning' : 'normal'} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid quality-inspection-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="QC 查验列表" />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadQualityInspections()
            }}
          >
            <label>
              查验搜索
              <Input
                value={search}
                placeholder="QC 单号 / 合同 / 供应商"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              查验结果
              <FormSelect
                value={resultFilter}
                onChange={(event) => setResultFilter(event.target.value)}
              >
                <option value="">全部结果</option>
                {qualityResultOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              供应商标识
              <Input
                value={supplierFilter}
                placeholder="supplier-id"
                onChange={(event) => setSupplierFilter(event.target.value)}
              />
            </label>
            <label>
              采购合同 ID
              <Input
                value={contractFilter}
                placeholder="purchase-contract-id"
                onChange={(event) => setContractFilter(event.target.value)}
              />
            </label>
            <label>
              <span>&nbsp;</span>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </label>
            <label>
              <span>&nbsp;</span>
              <Button type="primary" icon={<Plus size={16} />} onClick={startNewInspection}>
                新增 QC 单
              </Button>
            </label>
          </form>

          <Table<QualityInspection>
            columns={[
              {
                title: 'QC 单号',
                dataIndex: 'code',
                render: (value: string, record: QualityInspection) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenInspectionDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              {
                title: '结果',
                dataIndex: 'result',
                render: (value: string) => (
                  <Tag color={qualityResultTagColor(value)}>{qualityResultLabel(value)}</Tag>
                ),
              },
              { title: '采购合同', dataIndex: 'purchase_contract_no' },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '查验日', dataIndex: 'inspected_at', render: formatDate },
              {
                title: '异常',
                dataIndex: 'issues',
                render: (_, inspection) => `${inspection.issues.length} 条`,
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: QualityInspection) => (
                  <Button size="small" onClick={(event) => stopAndOpenInspectionDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={inspections}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedInspection?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => selectInspection(record),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={inspectionModalOpen}
          title={editingInspectionId ? '编辑 QC 查验' : '新增 QC 查验'}
          width={1040}
          onCancel={() => {
            setEditingInspectionId(null)
            setInspectionModalOpen(false)
          }}
        >
          <div className="workflow-modal-content entity-modal-form">
          <div className="panel-heading quality-form-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="QC 查验登记" />
          </div>

          <form className="record-form" onSubmit={saveQualityInspection}>
            <div className="form-divider">查验主信息</div>
            <div className="form-pair two">
              <label htmlFor="quality-code">
                QC 单号
                <Input
                  id="quality-code"
                  required
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                />
              </label>
              <label htmlFor="quality-contract-id">
                采购合同 ID
                <Input
                  id="quality-contract-id"
                  required
                  value={form.purchase_contract_id}
                  onChange={(event) =>
                    setForm({ ...form, purchase_contract_id: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="quality-inspected-at">
                查验日期
                <Input
                  id="quality-inspected-at"
                  required
                  type="date"
                  value={form.inspected_at}
                  onChange={(event) => setForm({ ...form, inspected_at: event.target.value })}
                />
              </label>
              <label htmlFor="quality-result">
                查验结果
                <FormSelect
                  id="quality-result"
                  value={form.result}
                  onChange={(event) => setForm({ ...form, result: event.target.value })}
                >
                  {qualityResultOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="quality-inspector-name">
                查验人
                <Input
                  id="quality-inspector-name"
                  required
                  value={form.inspector_name}
                  onChange={(event) => setForm({ ...form, inspector_name: event.target.value })}
                />
              </label>
              <label htmlFor="quality-attachment-group">
                附件组
                <Input
                  id="quality-attachment-group"
                  value={form.attachment_group_id}
                  onChange={(event) =>
                    setForm({ ...form, attachment_group_id: event.target.value })
                  }
                />
              </label>
            </div>
            <label htmlFor="quality-issue-summary">
              查验摘要
              <Input
                id="quality-issue-summary"
                value={form.issue_summary}
                onChange={(event) => setForm({ ...form, issue_summary: event.target.value })}
              />
            </label>

            <div className="form-divider">查验明细</div>
            <label htmlFor="quality-line-id">
              采购合同明细 ID
              <Input
                id="quality-line-id"
                value={form.purchase_contract_line_id}
                onChange={(event) =>
                  setForm({ ...form, purchase_contract_line_id: event.target.value })
                }
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="quality-product-code">
                商品编码
                <Input
                  id="quality-product-code"
                  value={form.product_code}
                  onChange={(event) => setForm({ ...form, product_code: event.target.value })}
                />
              </label>
              <label htmlFor="quality-product-name">
                商品名称
                <Input
                  id="quality-product-name"
                  required
                  value={form.product_name}
                  onChange={(event) => setForm({ ...form, product_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label htmlFor="quality-inspected-quantity">
                查验数量
                <Input
                  id="quality-inspected-quantity"
                  min="0"
                  required
                  step="0.0001"
                  type="number"
                  value={form.inspected_quantity}
                  onChange={(event) =>
                    setForm({ ...form, inspected_quantity: event.target.value })
                  }
                />
              </label>
              <label htmlFor="quality-failed-quantity">
                不良数量
                <Input
                  id="quality-failed-quantity"
                  min="0"
                  step="0.0001"
                  type="number"
                  value={form.failed_quantity}
                  onChange={(event) => setForm({ ...form, failed_quantity: event.target.value })}
                />
              </label>
              <label htmlFor="quality-unit">
                单位
                <Input
                  id="quality-unit"
                  required
                  value={form.unit}
                  onChange={(event) => setForm({ ...form, unit: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="quality-line-result">
                明细结果
                <FormSelect
                  id="quality-line-result"
                  value={form.line_result}
                  onChange={(event) => setForm({ ...form, line_result: event.target.value })}
                >
                  {qualityResultOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="quality-line-remark">
                明细备注
                <Input
                  id="quality-line-remark"
                  value={form.line_remark}
                  onChange={(event) => setForm({ ...form, line_remark: event.target.value })}
                />
              </label>
            </div>

            <div className="form-divider">异常问题（可选）</div>
            <div className="form-pair three">
              <label htmlFor="quality-issue-type">
                问题类型
                <Input
                  id="quality-issue-type"
                  value={form.issue_type}
                  onChange={(event) => setForm({ ...form, issue_type: event.target.value })}
                />
              </label>
              <label htmlFor="quality-severity">
                严重度
                <FormSelect
                  id="quality-severity"
                  value={form.severity}
                  onChange={(event) => setForm({ ...form, severity: event.target.value })}
                >
                  {qualityIssueSeverityOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="quality-issue-status">
                处理状态
                <FormSelect
                  id="quality-issue-status"
                  value={form.issue_status}
                  onChange={(event) => setForm({ ...form, issue_status: event.target.value })}
                >
                  {qualityIssueStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <label htmlFor="quality-description">
              问题描述
              <Input.TextArea
                id="quality-description"
                rows={2}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <label htmlFor="quality-corrective-action">
              整改措施
              <Input
                id="quality-corrective-action"
                value={form.corrective_action}
                onChange={(event) =>
                  setForm({ ...form, corrective_action: event.target.value })
                }
              />
            </label>

            <Button htmlType="submit" loading={submitting} type="primary">
              {editingInspectionId ? '保存 QC 查验' : '新增 QC 查验'}
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="QC 查验明细和入库判定" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(qualityInspectionPath)}>
              返回列表
            </Button>
          </div>
          {selectedInspection ? (
            <>
              <div
                className={`quality-eligibility ${
                  eligibility?.eligible ? 'eligible' : 'blocked'
                }`}
              >
                <strong>{eligibility?.reason ?? qualityInboundReason(selectedInspection)}</strong>
                <span>
                  最新查验：{formatDate(eligibility?.inspected_at ?? selectedInspection.inspected_at)}
                  {' / '}
                  {qualityResultLabel(eligibility?.latest_result ?? selectedInspection.result)}
                </span>
              </div>

              <dl className="detail-list">
                <div>
                  <dt>QC 单号</dt>
                  <dd>{selectedInspection.code}</dd>
                </div>
                <div>
                  <dt>查验结果</dt>
                  <dd>{qualityResultLabel(selectedInspection.result)}</dd>
                </div>
                <div>
                  <dt>采购合同</dt>
                  <dd>{selectedInspection.purchase_contract_no}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedInspection.supplier_name}</dd>
                </div>
                <div>
                  <dt>查验日期</dt>
                  <dd>{formatDate(selectedInspection.inspected_at)}</dd>
                </div>
                <div>
                  <dt>查验人</dt>
                  <dd>{selectedInspection.inspector_name}</dd>
                </div>
                <div>
                  <dt>附件组</dt>
                  <dd>{nullableText(selectedInspection.attachment_group_id)}</dd>
                </div>
                <div>
                  <dt>摘要</dt>
                  <dd>{nullableText(selectedInspection.issue_summary)}</dd>
                </div>
              </dl>

              <div className="delivery-action-row">
                <Button icon={<FilePenLine size={16} />} onClick={editSelectedInspection}>
                  编辑 QC 单
                </Button>
              </div>

              <div className="accessory-heading">
                <strong>商品查验明细</strong>
                <span>{selectedInspection.lines.length} 行</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>查验数量</th>
                    <th>不良数量</th>
                    <th>单位</th>
                    <th>结果</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInspection.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_name}</td>
                      <td>{line.inspected_quantity}</td>
                      <td>{line.failed_quantity}</td>
                      <td>{line.unit}</td>
                      <td>{qualityResultLabel(line.result)}</td>
                      <td>{nullableText(line.remark)}</td>
                    </tr>
                  ))}
                  {selectedInspection.lines.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={6}>
                        暂无查验明细
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>异常问题</strong>
                <span>{selectedInspection.issues.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>严重度</th>
                    <th>描述</th>
                    <th>整改</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInspection.issues.map((issue) => (
                    <tr key={issue.id}>
                      <td>{issue.issue_type}</td>
                      <td>{qualityIssueSeverityLabel(issue.severity)}</td>
                      <td>{issue.description}</td>
                      <td>{nullableText(issue.corrective_action)}</td>
                      <td>{qualityIssueStatusLabel(issue.status)}</td>
                    </tr>
                  ))}
                  {selectedInspection.issues.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        暂无异常问题
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <ShieldCheck size={28} />
              <strong>暂无 QC 查验单</strong>
              <span>请返回列表选择 QC 单查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function InboundPlansPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [plans, setPlans] = useState<InboundPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [generateForm, setGenerateForm] = useState<InboundPlanGenerateFormState>(() =>
    initialInboundPlanGenerateForm(),
  )
  const [scheduleForm, setScheduleForm] = useState<InboundPlanScheduleFormState>(() =>
    initialInboundPlanScheduleForm(),
  )
  const [inboundPlanModalOpen, setInboundPlanModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedPlan = useMemo(
    () => {
      if (detailId) return plans.find((item) => item.id === detailId) ?? null
      return plans.find((item) => item.id === selectedPlanId) ?? plans[0] ?? null
    },
    [detailId, plans, selectedPlanId],
  )

  useEffect(() => {
    void loadInboundPlans()
  }, [])

  useEffect(() => {
    if (!selectedPlan) return
    setGenerateForm((current) => ({
      ...current,
      purchase_contract_id: selectedPlan.purchase_contract_id,
      inbound_type: selectedPlan.inbound_type,
      planned_date: selectedPlan.planned_date,
    }))
    setScheduleForm(inboundPlanToScheduleForm(selectedPlan))
  }, [selectedPlan?.id])

  useEffect(() => {
    if (detailId && plans.length > 0 && !plans.some((item) => item.id === detailId)) {
      onNavigate(warehouseInboundPlanPath)
    }
  }, [detailId, onNavigate, plans])

  function openInboundPlanDetail(plan: InboundPlan) {
    setSelectedPlanId(plan.id)
    onNavigate(moduleDetailPath(warehouseInboundPlanPath, plan.id))
  }

  function stopAndOpenInboundPlanDetail(event: MouseEvent<HTMLElement>, plan: InboundPlan) {
    event.stopPropagation()
    openInboundPlanDetail(plan)
  }

  async function loadInboundPlans(preferredPlanId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listInboundPlans({
        q: search.trim() || undefined,
        status: statusFilter || undefined,
        inbound_type: typeFilter || undefined,
        supplier_id: supplierFilter.trim() || undefined,
        purchase_contract_id: contractFilter.trim() || undefined,
      })
      setPlans(result.items)
      const nextId =
        preferredPlanId ??
        (result.items.some((item) => item.id === selectedPlanId) ? selectedPlanId : null) ??
        result.items[0]?.id ??
        null
      setSelectedPlanId(nextId)
    } catch (caught) {
      showError(caught, '入库计划加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function generateInboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const plan = await generateInboundPlanFromPurchaseContract(inboundPlanGeneratePayload(generateForm))
      setSearch(plan.purchase_contract_no)
      setContractFilter(plan.purchase_contract_id)
      setSelectedPlanId(plan.id)
      setInboundPlanModalOpen(false)
      await loadInboundPlans(plan.id)
      setMessage(`已生成入库计划 ${plan.code}`)
    } catch (caught) {
      showError(caught, '入库计划生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function scheduleSelectedInboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlan) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const plan = await scheduleInboundPlan(selectedPlan.id, inboundPlanSchedulePayload(scheduleForm))
      setSelectedPlanId(plan.id)
      setInboundPlanModalOpen(false)
      await loadInboundPlans(plan.id)
      setMessage(`已安排 ${plan.warehouse_name ?? ''} / ${plan.location_name ?? ''}`)
    } catch (caught) {
      showError(caught, '库位安排保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const scheduledCount = plans.filter((item) => item.status === 'scheduled').length
  const plannedCount = plans.filter((item) => item.status === 'planned').length
  const totalQuantity = plans.reduce((sum, item) => sum + inboundPlanTotalQuantity(item), 0)
  const typeCount = new Set(plans.map((item) => item.inbound_type)).size

  return (
    <section className="inbound-plan-page">
      <OperationFlowRail activePath={warehouseInboundPlanPath} kind="warehouse" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="入库计划概览">
        <Metric label="入库计划" value={plans.length} />
        <Metric label="待安排" value={plannedCount} intent={plannedCount > 0 ? 'warning' : 'normal'} />
        <Metric label="已排库位" value={scheduledCount} />
        <Metric label="待入库数量" value={totalQuantity.toFixed(2)} />
        <Metric label="入库类型" value={typeCount} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid inbound-plan-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="待入库计划" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadInboundPlans()
              }}
            >
              <label>
                计划搜索
                <Input
                  value={search}
                  placeholder="计划号 / 采购合同 / 商品"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor="inbound-status-filter">
                入库状态
                <FormSelect
                  id="inbound-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {inboundPlanStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="inbound-type-filter">
                入库类型
                <FormSelect
                  id="inbound-type-filter"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="">全部类型</option>
                  {inboundPlanTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                供应商标识
                <Input
                  value={supplierFilter}
                  placeholder="supplier-id"
                  onChange={(event) => setSupplierFilter(event.target.value)}
                />
              </label>
              <label>
                采购合同 ID
                <Input
                  value={contractFilter}
                  placeholder="purchase-contract-id"
                  onChange={(event) => setContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={() => setInboundPlanModalOpen(true)}>
                生成/排库位
              </Button>
            </form>
          </div>

          <Table<InboundPlan>
            columns={[
              {
                title: '计划号',
                dataIndex: 'code',
                render: (value: string, record: InboundPlan) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenInboundPlanDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: inboundPlanStatusLabel },
              { title: '类型', dataIndex: 'inbound_type', render: inboundPlanTypeLabel },
              { title: '采购合同', dataIndex: 'purchase_contract_no' },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '计划入库日', dataIndex: 'planned_date', render: formatDate },
              {
                title: '数量',
                dataIndex: 'lines',
                render: (_, plan) => inboundPlanTotalQuantity(plan).toFixed(2),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: InboundPlan) => (
                  <Button size="small" onClick={(event) => stopAndOpenInboundPlanDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={plans}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedPlan?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedPlanId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={inboundPlanModalOpen}
          title="入库计划生成和排库位"
          width={980}
          onCancel={() => setInboundPlanModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<Warehouse size={18} />} title="计划生成和排库位" />
          <form className="record-form" onSubmit={generateInboundPlan}>
            <div className="form-divider">从采购合同生成</div>
            <label htmlFor="inbound-plan-contract-id">
              采购合同 ID
              <Input
                id="inbound-plan-contract-id"
                required
                value={generateForm.purchase_contract_id}
                onChange={(event) =>
                  setGenerateForm({ ...generateForm, purchase_contract_id: event.target.value })
                }
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="inbound-plan-type">
                入库类型
                <FormSelect
                  id="inbound-plan-type"
                  value={generateForm.inbound_type}
                  onChange={(event) =>
                    setGenerateForm({ ...generateForm, inbound_type: event.target.value })
                  }
                >
                  {inboundPlanTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="inbound-plan-date">
                计划入库日
                <Input
                  id="inbound-plan-date"
                  type="date"
                  value={generateForm.planned_date}
                  onChange={(event) =>
                    setGenerateForm({ ...generateForm, planned_date: event.target.value })
                  }
                />
              </label>
            </div>
            <Button htmlType="submit" icon={<PackagePlus size={16} />} loading={submitting}>
              生成入库计划
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={scheduleSelectedInboundPlan}>
            <div className="form-divider">库位预安排</div>
            <label htmlFor="inbound-schedule-date">
              计划入库日
              <Input
                id="inbound-schedule-date"
                required
                type="date"
                value={scheduleForm.planned_date}
                onChange={(event) =>
                  setScheduleForm({ ...scheduleForm, planned_date: event.target.value })
                }
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="inbound-warehouse-id">
                仓库 ID
                <Input
                  id="inbound-warehouse-id"
                  required
                  value={scheduleForm.warehouse_id}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, warehouse_id: event.target.value })
                  }
                />
              </label>
              <label htmlFor="inbound-warehouse-name">
                仓库
                <Input
                  id="inbound-warehouse-name"
                  required
                  value={scheduleForm.warehouse_name}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, warehouse_name: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="inbound-location-id">
                库位 ID
                <Input
                  id="inbound-location-id"
                  required
                  value={scheduleForm.location_id}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, location_id: event.target.value })
                  }
                />
              </label>
              <label htmlFor="inbound-location-name">
                库位
                <Input
                  id="inbound-location-name"
                  required
                  value={scheduleForm.location_name}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, location_name: event.target.value })
                  }
                />
              </label>
            </div>
            <label htmlFor="inbound-operator-name">
              经办人
              <Input
                id="inbound-operator-name"
                required
                value={scheduleForm.operator_name}
                onChange={(event) =>
                  setScheduleForm({ ...scheduleForm, operator_name: event.target.value })
                }
              />
            </label>
            <Button
              disabled={!selectedPlan}
              htmlType="submit"
              icon={<Save size={16} />}
              loading={submitting}
              type="primary"
            >
              保存库位安排
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="计划明细" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(warehouseInboundPlanPath)}>
              返回列表
            </Button>
          </div>
          {selectedPlan ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>采购合同</dt>
                  <dd>{selectedPlan.purchase_contract_no}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedPlan.supplier_name}</dd>
                </div>
                <div>
                  <dt>入库类型</dt>
                  <dd>{inboundPlanTypeLabel(selectedPlan.inbound_type)}</dd>
                </div>
                <div>
                  <dt>计划状态</dt>
                  <dd>{inboundPlanStatusLabel(selectedPlan.status)}</dd>
                </div>
                <div>
                  <dt>计划入库日</dt>
                  <dd>{formatDate(selectedPlan.planned_date)}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>
                    {selectedPlan.warehouse_name ?? '未安排'} / {selectedPlan.location_name ?? '未安排'}
                  </dd>
                </div>
              </dl>

              <div className="accessory-heading">
                <strong>待入库商品</strong>
                <span>{selectedPlan.lines.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格</th>
                    <th>计划数量</th>
                    <th>已入库</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{`${line.product_code ?? '-'} ${line.product_name}`}</td>
                      <td>{line.specification ?? line.model ?? '未设置'}</td>
                      <td>{`${trimDecimal(line.planned_quantity)} ${line.unit}`}</td>
                      <td>{`${trimDecimal(line.received_quantity)} ${line.unit}`}</td>
                      <td>{inboundPlanLineStatusLabel(line.status)}</td>
                    </tr>
                  ))}
                  {selectedPlan.lines.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        暂无计划明细
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <PackagePlus size={28} />
              <strong>暂无入库计划</strong>
              <span>请返回列表选择入库计划查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function InboundOrdersPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [orders, setOrders] = useState<InboundOrder[]>([])
  const [inboundPlans, setInboundPlans] = useState<InboundPlan[]>([])
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([])
  const [inventoryLedgers, setInventoryLedgers] = useState<InventoryLedger[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [inventorySearch, setInventorySearch] = useState('')
  const [form, setForm] = useState<InboundOrderFormState>(() => initialInboundOrderForm())
  const [approvalForm, setApprovalForm] = useState<InboundOrderApprovalFormState>(() =>
    initialInboundOrderApprovalForm(),
  )
  const [inboundOrderModalOpen, setInboundOrderModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedOrder = useMemo(
    () => {
      if (detailId) return orders.find((item) => item.id === detailId) ?? null
      return orders.find((item) => item.id === selectedOrderId) ?? orders[0] ?? null
    },
    [detailId, orders, selectedOrderId],
  )

  useEffect(() => {
    void loadInboundOrders()
  }, [])

  useEffect(() => {
    if (!selectedOrder) return
    setForm(inboundOrderToForm(selectedOrder))
    setApprovalForm({
      reviewer_name: selectedOrder.reviewer_name ?? '演示业务主管',
      approved_at: selectedOrder.approved_at ?? selectedOrder.inbound_at,
    })
  }, [selectedOrder?.id, selectedOrder?.status])

  useEffect(() => {
    if (detailId && orders.length > 0 && !orders.some((item) => item.id === detailId)) {
      onNavigate(warehouseInboundOrderPath)
    }
  }, [detailId, onNavigate, orders])

  async function loadInboundOrders(
    preferredOrderId?: string,
    preferredOrder?: InboundOrder,
    inventoryQuery?: string,
  ) {
    setLoading(true)
    setError('')
    try {
      const [orderResult, planOptions] = await Promise.all([
        listInboundOrders({
          q: preferredOrder?.code ?? (search.trim() || undefined),
          status: statusFilter || undefined,
          inbound_mode: modeFilter || undefined,
          supplier_id: supplierFilter.trim() || undefined,
          purchase_contract_id: contractFilter.trim() || undefined,
        }),
        loadInboundOrderPlanOptions(),
      ])
      const nextOrders = preferredOrder
        ? [preferredOrder, ...orderResult.items.filter((item) => item.id !== preferredOrder.id)]
        : orderResult.items
      const nextSelectedId =
        preferredOrderId ??
        (nextOrders.some((item) => item.id === selectedOrderId) ? selectedOrderId : null) ??
        nextOrders[0]?.id ??
        null
      const nextOrder = nextOrders.find((item) => item.id === nextSelectedId) ?? null
      setOrders(nextOrders)
      setInboundPlans(planOptions)
      setSelectedOrderId(nextSelectedId)
      if (!nextOrder && planOptions[0]) {
        setForm((current) => inboundOrderFormForPlan(planOptions[0], current))
      }
      await loadInventorySnapshotForOrder(nextOrder, inventoryQuery)
    } catch (caught) {
      showError(caught, '货物入库加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadInboundOrderPlanOptions(): Promise<InboundPlan[]> {
    const [allPlans, scheduledPlans, plannedPlans] = await Promise.all([
      listInboundPlans({}),
      listInboundPlans({ status: 'scheduled' }),
      listInboundPlans({ status: 'planned' }),
    ])
    const planById = new Map<string, InboundPlan>()
    for (const plan of [...scheduledPlans.items, ...plannedPlans.items, ...allPlans.items]) {
      planById.set(plan.id, plan)
    }
    return [...planById.values()]
  }

  async function loadInventorySnapshotForOrder(
    order: InboundOrder | null = selectedOrder,
    inventoryQuery?: string,
  ) {
    const query =
      inventoryQuery ??
      (inventorySearch.trim() ||
        search.trim() ||
        order?.lines[0]?.product_code ||
        order?.lines[0]?.product_name ||
        undefined)
    const [balances, ledgers] = await Promise.all([
      listInventoryBalances({ q: query }),
      listInventoryLedgers({
        q: query,
        source_id: order?.id,
      }),
    ])
    setInventoryBalances(balances.items)
    setInventoryLedgers(ledgers.items)
  }

  async function refreshInventorySnapshot(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setError('')
    try {
      await loadInventorySnapshotForOrder(selectedOrder)
    } catch (caught) {
      showError(caught, '库存快照加载失败')
    }
  }

  function handleInboundOrderPlanChange(planId: string) {
    const plan = inboundPlans.find((item) => item.id === planId)
    setForm((current) => (plan ? inboundOrderFormForPlan(plan, current) : { ...current, plan_id: planId }))
  }

  function upsertInboundOrder(order: InboundOrder) {
    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id)
      return exists ? current.map((item) => (item.id === order.id ? order : item)) : [order, ...current]
    })
    setSelectedOrderId(order.id)
  }

  function openInboundOrderDetail(order: InboundOrder) {
    setSelectedOrderId(order.id)
    onNavigate(moduleDetailPath(warehouseInboundOrderPath, order.id))
  }

  function stopAndOpenInboundOrderDetail(event: MouseEvent<HTMLElement>, order: InboundOrder) {
    event.stopPropagation()
    openInboundOrderDetail(order)
  }

  async function generateInboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const order = await generateInboundOrderFromPlan(inboundOrderPayload(form))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setSearch(order.code)
      setStatusFilter('')
      setContractFilter(order.purchase_contract_id)
      setInventorySearch(inventoryQuery)
      upsertInboundOrder(order)
      setInboundOrderModalOpen(false)
      await loadInboundOrders(order.id, order, inventoryQuery)
      setMessage(`已生成入库单 ${order.code}`)
    } catch (caught) {
      showError(caught, '入库单生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSelectedInboundOrder() {
    if (!selectedOrder) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const order = await submitInboundOrder(selectedOrder.id)
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      upsertInboundOrder(order)
      await loadInboundOrders(order.id, order, inventoryQuery)
      setMessage(`${order.code} 已提交审批`)
    } catch (caught) {
      showError(caught, '入库单提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedInboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    if (selectedOrder.status !== 'submitted') return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const order = await approveInboundOrder(selectedOrder.id, inboundOrderApprovePayload(approvalForm))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setStatusFilter('approved')
      setInventorySearch(inventoryQuery)
      upsertInboundOrder(order)
      setInboundOrderModalOpen(false)
      await loadInboundOrders(order.id, order, inventoryQuery)
      setMessage(
        order.inbound_mode === 'formal'
          ? `${order.code} 已正式入库，库存和采购跟单已回写`
          : `${order.code} 已登记待检库存`,
      )
    } catch (caught) {
      showError(caught, '入库审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  const draftCount = orders.filter((item) => item.status === 'draft').length
  const submittedCount = orders.filter((item) => item.status === 'submitted').length
  const approvedCount = orders.filter((item) => item.status === 'approved').length
  const availableQuantity = inventoryBalances.reduce(
    (sum, item) => sum + Number(item.available_quantity || 0),
    0,
  )
  const pendingQuantity = inventoryBalances.reduce(
    (sum, item) => sum + Number(item.pending_inspection_quantity || 0),
    0,
  )

  return (
    <section className="inbound-order-page">
      <OperationFlowRail activePath={warehouseInboundOrderPath} kind="warehouse" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="货物入库概览">
        <Metric label="入库单" value={orders.length} />
        <Metric label="草稿" value={draftCount} />
        <Metric label="待审批" value={submittedCount} intent={submittedCount > 0 ? 'warning' : 'normal'} />
        <Metric label="已审批" value={approvedCount} />
        <Metric label="可用库存" value={availableQuantity.toFixed(2)} />
        <Metric label="待检库存" value={pendingQuantity.toFixed(2)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid inbound-order-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="入库单" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadInboundOrders()
              }}
            >
              <label>
                入库搜索
                <Input
                  value={search}
                  placeholder="入库单 / 采购合同 / 商品"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor="inbound-order-status-filter">
                单据状态
                <FormSelect
                  id="inbound-order-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {inboundOrderStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="inbound-order-mode-filter">
                入库模式
                <FormSelect
                  id="inbound-order-mode-filter"
                  value={modeFilter}
                  onChange={(event) => setModeFilter(event.target.value)}
                >
                  <option value="">全部模式</option>
                  {inboundOrderModeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                供应商标识
                <Input
                  value={supplierFilter}
                  placeholder="supplier-id"
                  onChange={(event) => setSupplierFilter(event.target.value)}
                />
              </label>
              <label>
                采购合同 ID
                <Input
                  value={contractFilter}
                  placeholder="purchase-contract-id"
                  onChange={(event) => setContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={() => setInboundOrderModalOpen(true)}>
                生成/审批入库单
              </Button>
            </form>
          </div>

          <Table<InboundOrder>
            columns={[
              {
                title: '入库单',
                dataIndex: 'code',
                render: (value: string, record: InboundOrder) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenInboundOrderDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: inboundOrderStatusLabel },
              { title: '模式', dataIndex: 'inbound_mode', render: inboundOrderModeLabel },
              { title: '采购合同', dataIndex: 'purchase_contract_no' },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '入库日', dataIndex: 'inbound_at', render: formatDate },
              {
                title: '库位',
                dataIndex: 'location_name',
                render: (_, order) => `${order.warehouse_name} / ${order.location_name}`,
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: InboundOrder) => (
                  <Button size="small" onClick={(event) => stopAndOpenInboundOrderDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={orders}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedOrder?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedOrderId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={inboundOrderModalOpen}
          title="入库单生成和审批"
          width={980}
          onCancel={() => setInboundOrderModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<Warehouse size={18} />} title="入库登记" />
          <form className="record-form" onSubmit={generateInboundOrder}>
            <div className="form-divider">从入库计划生成</div>
            <label htmlFor="inbound-order-plan-id">
              入库计划
              <FormSelect
                id="inbound-order-plan-id"
                required
                value={form.plan_id}
                onChange={(event) => handleInboundOrderPlanChange(event.target.value)}
              >
                <option value="">选择入库计划</option>
                {inboundPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.code} / {plan.purchase_contract_no} / {inboundPlanStatusLabel(plan.status)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label htmlFor="inbound-order-code">
              入库单号
              <Input
                id="inbound-order-code"
                required
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="inbound-order-mode">
                入库模式
                <FormSelect
                  id="inbound-order-mode"
                  value={form.inbound_mode}
                  onChange={(event) => setForm({ ...form, inbound_mode: event.target.value })}
                >
                  {inboundOrderModeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="inbound-order-date">
                入库日期
                <Input
                  id="inbound-order-date"
                  required
                  type="date"
                  value={form.inbound_at}
                  onChange={(event) => setForm({ ...form, inbound_at: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="inbound-order-warehouse-id">
                仓库 ID
                <Input
                  id="inbound-order-warehouse-id"
                  required
                  value={form.warehouse_id}
                  onChange={(event) => setForm({ ...form, warehouse_id: event.target.value })}
                />
              </label>
              <label htmlFor="inbound-order-warehouse-name">
                仓库
                <Input
                  id="inbound-order-warehouse-name"
                  required
                  value={form.warehouse_name}
                  onChange={(event) => setForm({ ...form, warehouse_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="inbound-order-location-id">
                库位 ID
                <Input
                  id="inbound-order-location-id"
                  required
                  value={form.location_id}
                  onChange={(event) => setForm({ ...form, location_id: event.target.value })}
                />
              </label>
              <label htmlFor="inbound-order-location-name">
                库位
                <Input
                  id="inbound-order-location-name"
                  required
                  value={form.location_name}
                  onChange={(event) => setForm({ ...form, location_name: event.target.value })}
                />
              </label>
            </div>
            <label htmlFor="inbound-order-operator">
              经办人
              <Input
                id="inbound-order-operator"
                required
                value={form.operator_name}
                onChange={(event) => setForm({ ...form, operator_name: event.target.value })}
              />
            </label>
            <Button
              disabled={!form.plan_id}
              htmlType="submit"
              icon={<PackagePlus size={16} />}
              loading={submitting}
            >
              生成入库单
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={approveSelectedInboundOrder}>
            <div className="form-divider">提交和审批</div>
            <Button
              disabled={!selectedOrder || selectedOrder.status !== 'draft'}
              htmlType="button"
              icon={<Send size={16} />}
              loading={submitting}
              onClick={() => void submitSelectedInboundOrder()}
            >
              提交审批
            </Button>
            <div className="form-pair two">
              <label htmlFor="inbound-order-reviewer">
                审批人
                <Input
                  id="inbound-order-reviewer"
                  required
                  value={approvalForm.reviewer_name}
                  onChange={(event) =>
                    setApprovalForm({ ...approvalForm, reviewer_name: event.target.value })
                  }
                />
              </label>
              <label htmlFor="inbound-order-approved-at">
                审批日期
                <Input
                  id="inbound-order-approved-at"
                  required
                  type="date"
                  value={approvalForm.approved_at}
                  onChange={(event) =>
                    setApprovalForm({ ...approvalForm, approved_at: event.target.value })
                  }
                />
              </label>
            </div>
            <Button
              disabled={!selectedOrder || selectedOrder.status !== 'submitted'}
              htmlType="submit"
              icon={<CheckCircle2 size={16} />}
              loading={submitting}
              type="primary"
            >
              审批入库
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="明细和库存" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(warehouseInboundOrderPath)}>
              返回列表
            </Button>
          </div>
          {selectedOrder ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>采购合同</dt>
                  <dd>{selectedOrder.purchase_contract_no}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{selectedOrder.supplier_name}</dd>
                </div>
                <div>
                  <dt>入库模式</dt>
                  <dd>{inboundOrderModeLabel(selectedOrder.inbound_mode)}</dd>
                </div>
                <div>
                  <dt>单据状态</dt>
                  <dd>{inboundOrderStatusLabel(selectedOrder.status)}</dd>
                </div>
                <div>
                  <dt>入库日期</dt>
                  <dd>{formatDate(selectedOrder.inbound_at)}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>{selectedOrder.warehouse_name} / {selectedOrder.location_name}</dd>
                </div>
              </dl>

              <div className="accessory-heading">
                <strong>入库明细</strong>
                <span>{selectedOrder.lines.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格</th>
                    <th>数量</th>
                    <th>库存状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_code ?? '-'} {line.product_name}</td>
                      <td>{line.specification ?? line.model ?? '未设置'}</td>
                      <td>{trimDecimal(line.quantity)} {line.unit}</td>
                      <td>{stockStatusLabel(line.stock_status)}</td>
                    </tr>
                  ))}
                  {selectedOrder.lines.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={4}>
                        暂无入库明细
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <form className="inline-filters inline-search inventory-search-form" onSubmit={refreshInventorySnapshot}>
                <label>
                  库存搜索
                  <Input
                    value={inventorySearch}
                    placeholder="商品编码 / 商品名称 / 仓库"
                    onChange={(event) => setInventorySearch(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查库存
                </Button>
              </form>

              <div className="accessory-heading">
                <strong>库存余额</strong>
                <span>{inventoryBalances.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>库位</th>
                    <th>可用</th>
                    <th>待检</th>
                    <th>锁定</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryBalances.map((balance) => (
                    <tr key={balance.id}>
                      <td>{balance.product_code ?? '-'} {balance.product_name}</td>
                      <td>{balance.warehouse_name} / {balance.location_name}</td>
                      <td>{trimDecimal(balance.available_quantity)} {balance.unit}</td>
                      <td>{trimDecimal(balance.pending_inspection_quantity)} {balance.unit}</td>
                      <td>{trimDecimal(balance.locked_quantity)} {balance.unit}</td>
                    </tr>
                  ))}
                  {inventoryBalances.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        暂无库存余额
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>库存流水</strong>
                <span>{inventoryLedgers.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>方向</th>
                    <th>商品</th>
                    <th>数量</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLedgers.map((ledger) => (
                    <tr key={ledger.id}>
                      <td>{formatDate(ledger.occurred_at)}</td>
                      <td>{inventoryDirectionLabel(ledger.direction)} / {stockStatusLabel(ledger.stock_status)}</td>
                      <td>{ledger.product_code ?? '-'} {ledger.product_name}</td>
                      <td>{trimDecimal(ledger.quantity)} {ledger.unit}</td>
                      <td>{ledger.source_code}</td>
                    </tr>
                  ))}
                  {inventoryLedgers.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        暂无库存流水
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Warehouse size={28} />
              <strong>暂无入库单</strong>
              <span>请返回列表选择入库单查看明细和库存</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function OutboundPlansPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [plans, setPlans] = useState<OutboundPlan[]>([])
  const [shipments, setShipments] = useState<ShipmentPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [sourceIdFilter, setSourceIdFilter] = useState('')
  const [generateForm, setGenerateForm] = useState<OutboundPlanGenerateFormState>(() =>
    initialOutboundPlanGenerateForm(),
  )
  const [scheduleForm, setScheduleForm] = useState<OutboundPlanScheduleFormState>(() =>
    initialOutboundPlanScheduleForm(),
  )
  const [outboundPlanModalOpen, setOutboundPlanModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedPlan = useMemo(
    () => {
      if (detailId) return plans.find((item) => item.id === detailId) ?? null
      return plans.find((item) => item.id === selectedPlanId) ?? plans[0] ?? null
    },
    [detailId, plans, selectedPlanId],
  )

  useEffect(() => {
    void loadOutboundPlans()
  }, [])

  useEffect(() => {
    if (!selectedPlan) return
    setGenerateForm((current) => ({
      ...current,
      shipment_plan_id: selectedPlan.source_type === 'shipment_plan' ? selectedPlan.source_id : current.shipment_plan_id,
      outbound_type: selectedPlan.outbound_type,
      planned_date: selectedPlan.planned_date,
    }))
    setScheduleForm(outboundPlanToScheduleForm(selectedPlan))
  }, [selectedPlan?.id])

  useEffect(() => {
    if (detailId && plans.length > 0 && !plans.some((item) => item.id === detailId)) {
      onNavigate(warehouseOutboundPlanPath)
    }
  }, [detailId, onNavigate, plans])

  async function loadOutboundPlans(preferredPlanId?: string, preferredPlan?: OutboundPlan) {
    setLoading(true)
    setError('')
    try {
      const [planResult, shipmentOptions] = await Promise.all([
        listOutboundPlans({
          q: preferredPlan?.code ?? (search.trim() || undefined),
          status: statusFilter || undefined,
          outbound_type: typeFilter || undefined,
          source_type: sourceFilter || undefined,
          customer_id: customerFilter.trim() || undefined,
          source_id: sourceIdFilter.trim() || undefined,
        }),
        loadOutboundShipmentOptions(),
      ])
      const nextPlans = preferredPlan
        ? [preferredPlan, ...planResult.items.filter((item) => item.id !== preferredPlan.id)]
        : planResult.items
      const nextPlanId =
        preferredPlanId ??
        (nextPlans.some((item) => item.id === selectedPlanId) ? selectedPlanId : null) ??
        nextPlans[0]?.id ??
        null
      setPlans(nextPlans)
      setShipments(shipmentOptions)
      setSelectedPlanId(nextPlanId)
      if (!nextPlanId && shipmentOptions[0]) {
        setGenerateForm((current) => outboundPlanGenerateFormForShipment(shipmentOptions[0], current))
      }
    } catch (caught) {
      showError(caught, '出库计划加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadOutboundShipmentOptions(): Promise<ShipmentPlan[]> {
    const [approvedShipments, recentShipments] = await Promise.all([
      listShipments({ approval_status: 'approved' }),
      listShipments({}),
    ])
    const shipmentById = new Map<string, ShipmentPlan>()
    for (const shipment of [...approvedShipments.items, ...recentShipments.items]) {
      if (shipment.approval_status === 'approved') shipmentById.set(shipment.id, shipment)
    }
    return [...shipmentById.values()]
  }

  function handleOutboundShipmentChange(shipmentId: string) {
    const shipment = shipments.find((item) => item.id === shipmentId)
    setGenerateForm((current) =>
      shipment ? outboundPlanGenerateFormForShipment(shipment, current) : { ...current, shipment_plan_id: shipmentId },
    )
  }

  function upsertOutboundPlan(plan: OutboundPlan) {
    setPlans((current) => {
      const exists = current.some((item) => item.id === plan.id)
      return exists ? current.map((item) => (item.id === plan.id ? plan : item)) : [plan, ...current]
    })
    setSelectedPlanId(plan.id)
  }

  function openOutboundPlanDetail(plan: OutboundPlan) {
    setSelectedPlanId(plan.id)
    onNavigate(moduleDetailPath(warehouseOutboundPlanPath, plan.id))
  }

  function stopAndOpenOutboundPlanDetail(event: MouseEvent<HTMLElement>, plan: OutboundPlan) {
    event.stopPropagation()
    openOutboundPlanDetail(plan)
  }

  async function generateOutboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const plan = await generateOutboundPlanFromShipment(outboundPlanGeneratePayload(generateForm))
      setSearch(plan.source_code)
      setStatusFilter('')
      setTypeFilter(plan.outbound_type)
      setSourceFilter(plan.source_type)
      setCustomerFilter(plan.customer_id ?? '')
      setSourceIdFilter(plan.source_id)
      upsertOutboundPlan(plan)
      setOutboundPlanModalOpen(false)
      await loadOutboundPlans(plan.id, plan)
      setMessage(`已生成出库计划 ${plan.code}`)
    } catch (caught) {
      showError(caught, '出库计划生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function scheduleSelectedOutboundPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPlan) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const plan = await scheduleOutboundPlan(selectedPlan.id, outboundPlanSchedulePayload(scheduleForm))
      upsertOutboundPlan(plan)
      setOutboundPlanModalOpen(false)
      await loadOutboundPlans(plan.id, plan)
      setMessage(`已安排 ${plan.warehouse_name ?? ''} / ${plan.location_name ?? ''}`)
    } catch (caught) {
      showError(caught, '库位安排保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const plannedCount = plans.filter((item) => item.status === 'planned').length
  const scheduledCount = plans.filter((item) => item.status === 'scheduled').length
  const totalQuantity = plans.reduce((sum, item) => sum + outboundPlanTotalQuantity(item), 0)
  const shipmentSourceCount = plans.filter((item) => item.source_type === 'shipment_plan').length

  return (
    <section className="outbound-plan-page">
      <OperationFlowRail activePath={warehouseOutboundPlanPath} kind="warehouse" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="出库计划概览">
        <Metric label="出库计划" value={plans.length} />
        <Metric label="待安排" value={plannedCount} intent={plannedCount > 0 ? 'warning' : 'normal'} />
        <Metric label="已排库位" value={scheduledCount} />
        <Metric label="待出库数量" value={totalQuantity.toFixed(2)} />
        <Metric label="发货来源" value={shipmentSourceCount} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid outbound-plan-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="出库计划" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadOutboundPlans()
              }}
            >
              <label>
                计划搜索
                <Input
                  value={search}
                  placeholder="计划号 / 来源单 / 商品"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor="outbound-status-filter">
                出库状态
                <FormSelect
                  id="outbound-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {outboundPlanStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-type-filter">
                出库类型
                <FormSelect
                  id="outbound-type-filter"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="">全部类型</option>
                  {outboundPlanTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-source-filter">
                来源类型
                <FormSelect
                  id="outbound-source-filter"
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value)}
                >
                  <option value="">全部来源</option>
                  {outboundPlanSourceTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                客户标识
                <Input
                  value={customerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                />
              </label>
              <label>
                来源单 ID
                <Input
                  value={sourceIdFilter}
                  placeholder="shipment-id"
                  onChange={(event) => setSourceIdFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={() => setOutboundPlanModalOpen(true)}>
                生成/排库位
              </Button>
            </form>
          </div>

          <Table<OutboundPlan>
            columns={[
              {
                title: '计划号',
                dataIndex: 'code',
                render: (value: string, record: OutboundPlan) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenOutboundPlanDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: outboundPlanStatusLabel },
              { title: '类型', dataIndex: 'outbound_type', render: outboundPlanTypeLabel },
              { title: '来源单', dataIndex: 'source_code' },
              { title: '客户', dataIndex: 'customer_name', render: nullableText },
              { title: '计划出库日', dataIndex: 'planned_date', render: formatDate },
              {
                title: '数量',
                dataIndex: 'lines',
                render: (_, plan) => outboundPlanTotalQuantity(plan).toFixed(2),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: OutboundPlan) => (
                  <Button size="small" onClick={(event) => stopAndOpenOutboundPlanDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={plans}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedPlan?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedPlanId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={outboundPlanModalOpen}
          title="出库计划生成和排库位"
          width={980}
          onCancel={() => setOutboundPlanModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<Warehouse size={18} />} title="计划生成和排库位" />
          <form className="record-form" onSubmit={generateOutboundPlan}>
            <div className="form-divider">从发货计划生成</div>
            <label htmlFor="outbound-plan-shipment-id">
              发货计划
              <FormSelect
                id="outbound-plan-shipment-id"
                required
                value={generateForm.shipment_plan_id}
                onChange={(event) => handleOutboundShipmentChange(event.target.value)}
              >
                <option value="">选择已审批发货计划</option>
                {shipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.code} / {shipment.customer_name ?? '未设置客户'} / {formatDate(shipment.planned_ship_date)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <div className="form-pair two">
              <label htmlFor="outbound-plan-type">
                出库类型
                <FormSelect
                  id="outbound-plan-type"
                  value={generateForm.outbound_type}
                  onChange={(event) =>
                    setGenerateForm({ ...generateForm, outbound_type: event.target.value })
                  }
                >
                  {outboundPlanTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-plan-date">
                计划出库日
                <Input
                  id="outbound-plan-date"
                  type="date"
                  value={generateForm.planned_date}
                  onChange={(event) =>
                    setGenerateForm({ ...generateForm, planned_date: event.target.value })
                  }
                />
              </label>
            </div>
            <Button
              disabled={!generateForm.shipment_plan_id}
              htmlType="submit"
              icon={<PackagePlus size={16} />}
              loading={submitting}
            >
              生成出库计划
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={scheduleSelectedOutboundPlan}>
            <div className="form-divider">库位预安排</div>
            <label htmlFor="outbound-schedule-date">
              计划出库日
              <Input
                id="outbound-schedule-date"
                required
                type="date"
                value={scheduleForm.planned_date}
                onChange={(event) =>
                  setScheduleForm({ ...scheduleForm, planned_date: event.target.value })
                }
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="outbound-warehouse-id">
                仓库 ID
                <Input
                  id="outbound-warehouse-id"
                  required
                  value={scheduleForm.warehouse_id}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, warehouse_id: event.target.value })
                  }
                />
              </label>
              <label htmlFor="outbound-warehouse-name">
                仓库
                <Input
                  id="outbound-warehouse-name"
                  required
                  value={scheduleForm.warehouse_name}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, warehouse_name: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="outbound-location-id">
                库位 ID
                <Input
                  id="outbound-location-id"
                  required
                  value={scheduleForm.location_id}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, location_id: event.target.value })
                  }
                />
              </label>
              <label htmlFor="outbound-location-name">
                库位
                <Input
                  id="outbound-location-name"
                  required
                  value={scheduleForm.location_name}
                  onChange={(event) =>
                    setScheduleForm({ ...scheduleForm, location_name: event.target.value })
                  }
                />
              </label>
            </div>
            <label htmlFor="outbound-operator-name">
              经办人
              <Input
                id="outbound-operator-name"
                required
                value={scheduleForm.operator_name}
                onChange={(event) =>
                  setScheduleForm({ ...scheduleForm, operator_name: event.target.value })
                }
              />
            </label>
            <Button
              disabled={!selectedPlan}
              htmlType="submit"
              icon={<Save size={16} />}
              loading={submitting}
              type="primary"
            >
              保存库位安排
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="待出库清单" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(warehouseOutboundPlanPath)}>
              返回列表
            </Button>
          </div>
          {selectedPlan ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>来源单据</dt>
                  <dd>{outboundPlanSourceTypeLabel(selectedPlan.source_type)} / {selectedPlan.source_code}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedPlan.customer_name ?? '未设置客户'}</dd>
                </div>
                <div>
                  <dt>出库类型</dt>
                  <dd>{outboundPlanTypeLabel(selectedPlan.outbound_type)}</dd>
                </div>
                <div>
                  <dt>计划状态</dt>
                  <dd>{outboundPlanStatusLabel(selectedPlan.status)}</dd>
                </div>
                <div>
                  <dt>计划出库日</dt>
                  <dd>{formatDate(selectedPlan.planned_date)}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>
                    {selectedPlan.warehouse_name ?? '未安排'} / {selectedPlan.location_name ?? '未安排'}
                  </dd>
                </div>
              </dl>

              <div className="accessory-heading">
                <strong>待出库商品</strong>
                <span>{selectedPlan.lines.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格</th>
                    <th>计划数量</th>
                    <th>已出库</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_code ?? '-'} {line.product_name}</td>
                      <td>{line.specification ?? line.model ?? '未设置'}</td>
                      <td>{trimDecimal(line.planned_quantity)} {line.unit}</td>
                      <td>{trimDecimal(line.outbound_quantity)} {line.unit}</td>
                      <td>{outboundPlanLineStatusLabel(line.status)}</td>
                    </tr>
                  ))}
                  {selectedPlan.lines.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        暂无待出库明细
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Send size={28} />
              <strong>暂无出库计划</strong>
              <span>请返回列表选择出库计划查看待出库清单</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function OutboundOrdersPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const [orders, setOrders] = useState<OutboundOrder[]>([])
  const [outboundPlans, setOutboundPlans] = useState<OutboundPlan[]>([])
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([])
  const [inventoryLedgers, setInventoryLedgers] = useState<InventoryLedger[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [sourceIdFilter, setSourceIdFilter] = useState('')
  const [inventorySearch, setInventorySearch] = useState('')
  const [form, setForm] = useState<OutboundOrderFormState>(() => initialOutboundOrderForm())
  const [approvalForm, setApprovalForm] = useState<OutboundOrderApprovalFormState>(() =>
    initialOutboundOrderApprovalForm(),
  )
  const [outboundOrderModalOpen, setOutboundOrderModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedOrder = useMemo(
    () => {
      if (detailId) return orders.find((item) => item.id === detailId) ?? null
      return orders.find((item) => item.id === selectedOrderId) ?? orders[0] ?? null
    },
    [detailId, orders, selectedOrderId],
  )

  useEffect(() => {
    void loadOutboundOrders()
  }, [])

  useEffect(() => {
    if (!selectedOrder) return
    setForm(outboundOrderToForm(selectedOrder))
    setApprovalForm((current) => ({
      ...current,
      reviewer_name: selectedOrder.reviewer_name ?? '演示业务主管',
      approved_at: selectedOrder.approved_at ?? selectedOrder.outbound_at,
    }))
  }, [selectedOrder?.id, selectedOrder?.status])

  useEffect(() => {
    if (detailId && orders.length > 0 && !orders.some((item) => item.id === detailId)) {
      onNavigate(warehouseOutboundOrderPath)
    }
  }, [detailId, onNavigate, orders])

  async function loadOutboundOrders(
    preferredOrderId?: string,
    preferredOrder?: OutboundOrder,
    inventoryQuery?: string,
  ) {
    setLoading(true)
    setError('')
    try {
      const [orderResult, planOptions] = await Promise.all([
        listOutboundOrders({
          q: preferredOrder?.code ?? (search.trim() || undefined),
          status: statusFilter || undefined,
          outbound_mode: modeFilter || undefined,
          outbound_type: typeFilter || undefined,
          customer_id: customerFilter.trim() || undefined,
          source_id: sourceIdFilter.trim() || undefined,
        }),
        loadOutboundOrderPlanOptions(),
      ])
      const nextOrders = preferredOrder
        ? [preferredOrder, ...orderResult.items.filter((item) => item.id !== preferredOrder.id)]
        : orderResult.items
      const nextOrderId =
        preferredOrderId ??
        (nextOrders.some((item) => item.id === selectedOrderId) ? selectedOrderId : null) ??
        nextOrders[0]?.id ??
        null
      const nextOrder = nextOrders.find((item) => item.id === nextOrderId) ?? null
      setOrders(nextOrders)
      setOutboundPlans(planOptions)
      setSelectedOrderId(nextOrderId)
      if (!nextOrder && planOptions[0]) {
        setForm((current) => outboundOrderFormForPlan(planOptions[0], current))
      }
      await loadOutboundInventorySnapshot(nextOrder, inventoryQuery)
    } catch (caught) {
      showError(caught, '货物出库加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadOutboundOrderPlanOptions(): Promise<OutboundPlan[]> {
    const [allPlans, scheduledPlans, plannedPlans] = await Promise.all([
      listOutboundPlans({}),
      listOutboundPlans({ status: 'scheduled' }),
      listOutboundPlans({ status: 'planned' }),
    ])
    const planById = new Map<string, OutboundPlan>()
    for (const plan of [...scheduledPlans.items, ...plannedPlans.items, ...allPlans.items]) {
      planById.set(plan.id, plan)
    }
    return [...planById.values()]
  }

  async function loadOutboundInventorySnapshot(
    order: OutboundOrder | null = selectedOrder,
    inventoryQuery?: string,
  ) {
    const query =
      inventoryQuery ??
      (inventorySearch.trim() ||
        search.trim() ||
        order?.lines[0]?.product_code ||
        order?.lines[0]?.product_name ||
        undefined)
    const [balances, ledgers] = await Promise.all([
      listInventoryBalances({ q: query }),
      listInventoryLedgers({
        q: query,
        source_id: order?.id,
      }),
    ])
    setInventoryBalances(balances.items)
    setInventoryLedgers(ledgers.items)
  }

  async function refreshOutboundInventorySnapshot(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setError('')
    try {
      await loadOutboundInventorySnapshot(selectedOrder)
    } catch (caught) {
      showError(caught, '库存快照加载失败')
    }
  }

  function handleOutboundOrderPlanChange(planId: string) {
    const plan = outboundPlans.find((item) => item.id === planId)
    setForm((current) => (plan ? outboundOrderFormForPlan(plan, current) : { ...current, plan_id: planId }))
  }

  function upsertOutboundOrder(order: OutboundOrder) {
    setOrders((current) => {
      const exists = current.some((item) => item.id === order.id)
      return exists ? current.map((item) => (item.id === order.id ? order : item)) : [order, ...current]
    })
    setSelectedOrderId(order.id)
  }

  function openOutboundOrderDetail(order: OutboundOrder) {
    setSelectedOrderId(order.id)
    onNavigate(moduleDetailPath(warehouseOutboundOrderPath, order.id))
  }

  function stopAndOpenOutboundOrderDetail(event: MouseEvent<HTMLElement>, order: OutboundOrder) {
    event.stopPropagation()
    openOutboundOrderDetail(order)
  }

  async function generateOutboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const order = await generateOutboundOrderFromPlan(outboundOrderPayload(form))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setSearch(order.code)
      setStatusFilter('')
      setTypeFilter(order.outbound_type)
      setCustomerFilter(order.customer_id ?? '')
      setSourceIdFilter(order.source_id)
      setInventorySearch(inventoryQuery)
      upsertOutboundOrder(order)
      setOutboundOrderModalOpen(false)
      await loadOutboundOrders(order.id, order, inventoryQuery)
      setMessage(`已生成出库单 ${order.code}`)
    } catch (caught) {
      showError(caught, '出库单生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitSelectedOutboundOrder() {
    if (!selectedOrder) return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const order = await submitOutboundOrder(selectedOrder.id)
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      upsertOutboundOrder(order)
      await loadOutboundOrders(order.id, order, inventoryQuery)
      setMessage(`${order.code} 已提交审批`)
    } catch (caught) {
      showError(caught, '出库单提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function approveSelectedOutboundOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrder) return
    if (selectedOrder.status !== 'submitted') return
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const order = await approveOutboundOrder(selectedOrder.id, outboundOrderApprovePayload(approvalForm))
      const inventoryQuery = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
      setStatusFilter('approved')
      setInventorySearch(inventoryQuery)
      upsertOutboundOrder(order)
      setOutboundOrderModalOpen(false)
      await loadOutboundOrders(order.id, order, inventoryQuery)
      setMessage(
        order.outbound_mode === 'formal'
          ? `${order.code} 已正式出库，库存和采购跟单已回写`
          : `${order.code} 已记录异常出库`,
      )
    } catch (caught) {
      showError(caught, '出库审批失败')
    } finally {
      setSubmitting(false)
    }
  }

  const draftCount = orders.filter((item) => item.status === 'draft').length
  const submittedCount = orders.filter((item) => item.status === 'submitted').length
  const approvedCount = orders.filter((item) => item.status === 'approved').length
  const outboundQuantity = orders.reduce((sum, item) => sum + outboundOrderTotalQuantity(item), 0)
  const availableQuantity = inventoryBalances.reduce(
    (sum, item) => sum + Number(item.available_quantity || 0),
    0,
  )

  return (
    <section className="outbound-order-page">
      <OperationFlowRail activePath={warehouseOutboundOrderPath} kind="warehouse" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="货物出库概览">
        <Metric label="出库单" value={orders.length} />
        <Metric label="草稿" value={draftCount} />
        <Metric label="待审批" value={submittedCount} intent={submittedCount > 0 ? 'warning' : 'normal'} />
        <Metric label="已出库" value={approvedCount} />
        <Metric label="出库数量" value={outboundQuantity.toFixed(2)} />
        <Metric label="可用库存" value={availableQuantity.toFixed(2)} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="business-grid outbound-order-grid">
        {!detailId ? (
          <section className="workspace-panel list-panel product-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="出库单" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadOutboundOrders()
              }}
            >
              <label>
                出库搜索
                <Input
                  value={search}
                  placeholder="出库单 / 来源单 / 商品"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label htmlFor="outbound-order-status-filter">
                单据状态
                <FormSelect
                  id="outbound-order-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {outboundOrderStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-order-mode-filter">
                出库模式
                <FormSelect
                  id="outbound-order-mode-filter"
                  value={modeFilter}
                  onChange={(event) => setModeFilter(event.target.value)}
                >
                  <option value="">全部模式</option>
                  {outboundOrderModeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-order-type-filter">
                出库类型
                <FormSelect
                  id="outbound-order-type-filter"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="">全部类型</option>
                  {outboundPlanTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                客户标识
                <Input
                  value={customerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setCustomerFilter(event.target.value)}
                />
              </label>
              <label>
                来源单 ID
                <Input
                  value={sourceIdFilter}
                  placeholder="shipment-id"
                  onChange={(event) => setSourceIdFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
              <Button htmlType="button" icon={<Plus size={16} />} onClick={() => setOutboundOrderModalOpen(true)}>
                生成/审批出库单
              </Button>
            </form>
          </div>

          <Table<OutboundOrder>
            columns={[
              {
                title: '出库单',
                dataIndex: 'code',
                render: (value: string, record: OutboundOrder) => (
                  <button
                    className="row-button"
                    type="button"
                    onClick={(event) => stopAndOpenOutboundOrderDetail(event, record)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: outboundOrderStatusLabel },
              { title: '模式', dataIndex: 'outbound_mode', render: outboundOrderModeLabel },
              { title: '出库类型', dataIndex: 'outbound_type', render: outboundPlanTypeLabel },
              { title: '来源单', dataIndex: 'source_code' },
              { title: '客户', dataIndex: 'customer_name', render: nullableText },
              { title: '出库日', dataIndex: 'outbound_at', render: formatDate },
              {
                title: '数量',
                dataIndex: 'lines',
                render: (_, order) => outboundOrderTotalQuantity(order).toFixed(2),
              },
              {
                title: '入口',
                key: 'detail',
                width: 110,
                render: (_: unknown, record: OutboundOrder) => (
                  <Button size="small" onClick={(event) => stopAndOpenOutboundOrderDetail(event, record)}>
                    查看详情
                  </Button>
                ),
              },
            ]}
            dataSource={orders}
            loading={loading}
            pagination={false}
            rowClassName={(record) => (record.id === selectedOrder?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setSelectedOrderId(record.id),
            })}
          />
          </section>
        ) : null}

        <Modal
          centered
          footer={null}
          open={outboundOrderModalOpen}
          title="出库单生成和审批"
          width={980}
          onCancel={() => setOutboundOrderModalOpen(false)}
        >
          <div className="workflow-modal-content entity-modal-form">
          <PanelTitle icon={<Warehouse size={18} />} title="出库登记" />
          <form className="record-form" onSubmit={generateOutboundOrder}>
            <div className="form-divider">从出库计划生成</div>
            <label htmlFor="outbound-order-plan-id">
              出库计划
              <FormSelect
                id="outbound-order-plan-id"
                required
                value={form.plan_id}
                onChange={(event) => handleOutboundOrderPlanChange(event.target.value)}
              >
                <option value="">选择出库计划</option>
                {outboundPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.code} / {plan.source_code} / {outboundPlanStatusLabel(plan.status)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label htmlFor="outbound-order-code">
              出库单号
              <Input
                id="outbound-order-code"
                required
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label htmlFor="outbound-order-mode">
                出库模式
                <FormSelect
                  id="outbound-order-mode"
                  value={form.outbound_mode}
                  onChange={(event) => setForm({ ...form, outbound_mode: event.target.value })}
                >
                  {outboundOrderModeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="outbound-order-date">
                出库日期
                <Input
                  id="outbound-order-date"
                  required
                  type="date"
                  value={form.outbound_at}
                  onChange={(event) => setForm({ ...form, outbound_at: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="outbound-order-warehouse-id">
                仓库 ID
                <Input
                  id="outbound-order-warehouse-id"
                  required
                  value={form.warehouse_id}
                  onChange={(event) => setForm({ ...form, warehouse_id: event.target.value })}
                />
              </label>
              <label htmlFor="outbound-order-warehouse-name">
                仓库
                <Input
                  id="outbound-order-warehouse-name"
                  required
                  value={form.warehouse_name}
                  onChange={(event) => setForm({ ...form, warehouse_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="outbound-order-location-id">
                库位 ID
                <Input
                  id="outbound-order-location-id"
                  required
                  value={form.location_id}
                  onChange={(event) => setForm({ ...form, location_id: event.target.value })}
                />
              </label>
              <label htmlFor="outbound-order-location-name">
                库位
                <Input
                  id="outbound-order-location-name"
                  required
                  value={form.location_name}
                  onChange={(event) => setForm({ ...form, location_name: event.target.value })}
                />
              </label>
            </div>
            <label htmlFor="outbound-order-operator">
              经办人
              <Input
                id="outbound-order-operator"
                required
                value={form.operator_name}
                onChange={(event) => setForm({ ...form, operator_name: event.target.value })}
              />
            </label>
            <label htmlFor="outbound-exception-reason">
              异常原因
              <Input.TextArea
                id="outbound-exception-reason"
                rows={3}
                value={form.exception_reason}
                onChange={(event) => setForm({ ...form, exception_reason: event.target.value })}
              />
            </label>
            <Button
              disabled={!form.plan_id}
              htmlType="submit"
              icon={<PackagePlus size={16} />}
              loading={submitting}
            >
              生成出库单
            </Button>
          </form>

          <form className="record-form accessory-form generation-form" onSubmit={approveSelectedOutboundOrder}>
            <div className="form-divider">提交和审批</div>
            <Button
              disabled={!selectedOrder || selectedOrder.status !== 'draft'}
              htmlType="button"
              icon={<Send size={16} />}
              loading={submitting}
              onClick={() => void submitSelectedOutboundOrder()}
            >
              提交审批
            </Button>
            <div className="form-pair two">
              <label htmlFor="outbound-reviewer-name">
                审批人
                <Input
                  id="outbound-reviewer-name"
                  required
                  value={approvalForm.reviewer_name}
                  onChange={(event) =>
                    setApprovalForm({ ...approvalForm, reviewer_name: event.target.value })
                  }
                />
              </label>
              <label htmlFor="outbound-approved-at">
                审批日期
                <Input
                  id="outbound-approved-at"
                  required
                  type="date"
                  value={approvalForm.approved_at}
                  onChange={(event) =>
                    setApprovalForm({ ...approvalForm, approved_at: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="checkbox-line" htmlFor="outbound-allow-negative">
              <input
                id="outbound-allow-negative"
                type="checkbox"
                checked={approvalForm.allow_negative}
                onChange={(event) =>
                  setApprovalForm({ ...approvalForm, allow_negative: event.target.checked })
                }
              />
              授权负库存出库
            </label>
            <Button
              disabled={!selectedOrder || selectedOrder.status !== 'submitted'}
              htmlType="submit"
              icon={<CheckCircle2 size={16} />}
              loading={submitting}
              type="primary"
            >
              审批出库
            </Button>
          </form>
          </div>
        </Modal>

        {detailId ? (
          <section className="workspace-panel detail-panel product-detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="出库明细和库存流水" />
            <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(warehouseOutboundOrderPath)}>
              返回列表
            </Button>
          </div>
          {selectedOrder ? (
            <>
              <dl className="detail-list">
                <div>
                  <dt>来源单据</dt>
                  <dd>{outboundPlanSourceTypeLabel(selectedOrder.source_type)} / {selectedOrder.source_code}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{selectedOrder.customer_name ?? '未设置客户'}</dd>
                </div>
                <div>
                  <dt>出库模式</dt>
                  <dd>{outboundOrderModeLabel(selectedOrder.outbound_mode)}</dd>
                </div>
                <div>
                  <dt>单据状态</dt>
                  <dd>{outboundOrderStatusLabel(selectedOrder.status)}</dd>
                </div>
                <div>
                  <dt>出库日期</dt>
                  <dd>{formatDate(selectedOrder.outbound_at)}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>{selectedOrder.warehouse_name} / {selectedOrder.location_name}</dd>
                </div>
              </dl>

              <div className="accessory-heading">
                <strong>出库明细</strong>
                <span>{selectedOrder.lines.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格</th>
                    <th>数量</th>
                    <th>库存状态</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.product_code ?? '-'} {line.product_name}</td>
                      <td>{line.specification ?? line.model ?? '未设置'}</td>
                      <td>{trimDecimal(line.quantity)} {line.unit}</td>
                      <td>{stockStatusLabel(line.stock_status)}</td>
                    </tr>
                  ))}
                  {selectedOrder.lines.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={4}>
                        暂无出库明细
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <form className="inline-filters inline-search inventory-search-form" onSubmit={refreshOutboundInventorySnapshot}>
                <label>
                  库存搜索
                  <Input
                    value={inventorySearch}
                    placeholder="商品编码 / 商品名称 / 仓库"
                    onChange={(event) => setInventorySearch(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查库存
                </Button>
              </form>

              <div className="accessory-heading">
                <strong>库存余额</strong>
                <span>{inventoryBalances.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>库位</th>
                    <th>可用</th>
                    <th>待检</th>
                    <th>锁定</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryBalances.map((balance) => (
                    <tr key={balance.id}>
                      <td>{balance.product_code ?? '-'} {balance.product_name}</td>
                      <td>{balance.warehouse_name} / {balance.location_name}</td>
                      <td>{trimDecimal(balance.available_quantity)} {balance.unit}</td>
                      <td>{trimDecimal(balance.pending_inspection_quantity)} {balance.unit}</td>
                      <td>{trimDecimal(balance.locked_quantity)} {balance.unit}</td>
                    </tr>
                  ))}
                  {inventoryBalances.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        暂无库存余额
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="accessory-heading">
                <strong>出库流水</strong>
                <span>{inventoryLedgers.length} 条</span>
              </div>
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>方向</th>
                    <th>商品</th>
                    <th>数量</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLedgers.map((ledger) => (
                    <tr key={ledger.id}>
                      <td>{formatDate(ledger.occurred_at)}</td>
                      <td>{inventoryDirectionLabel(ledger.direction)} / {stockStatusLabel(ledger.stock_status)}</td>
                      <td>{ledger.product_code ?? '-'} {ledger.product_name}</td>
                      <td>{trimDecimal(ledger.quantity)} {ledger.unit}</td>
                      <td>{ledger.source_code}</td>
                    </tr>
                  ))}
                  {inventoryLedgers.length === 0 ? (
                    <tr>
                      <td className="empty-cell" colSpan={5}>
                        暂无出库流水
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <Package size={28} />
              <strong>暂无出库单</strong>
              <span>请返回列表选择出库单查看明细和库存流水</span>
            </div>
          )}
          </section>
        ) : null}
      </section>
    </section>
  )
}

function FollowupTemplateNodeFields({
  daysKey,
  label,
  remindKey,
  remindLabel,
  setTemplateForm,
  templateForm,
}: {
  daysKey: keyof FollowupTemplateFormState
  label: string
  remindKey: keyof FollowupTemplateFormState
  remindLabel: string
  setTemplateForm: (form: FollowupTemplateFormState) => void
  templateForm: FollowupTemplateFormState
}) {
  return (
    <div className="form-pair two">
      <label htmlFor={`followup-${String(daysKey).replace('_', '-')}`}>
        {label}
        <Input
          id={`followup-${String(daysKey).replace('_', '-')}`}
          min="0"
          type="number"
          value={String(templateForm[daysKey])}
          onChange={(event) => setTemplateForm({ ...templateForm, [daysKey]: event.target.value })}
        />
      </label>
      <label htmlFor={`followup-${String(remindKey).replace('_', '-')}`}>
        {remindLabel}
        <Input
          id={`followup-${String(remindKey).replace('_', '-')}`}
          min="0"
          type="number"
          value={String(templateForm[remindKey])}
          onChange={(event) => setTemplateForm({ ...templateForm, [remindKey]: event.target.value })}
        />
      </label>
    </div>
  )
}

function ModulePage({ menu }: { menu: MenuItem | null }) {
  return (
    <section className="workspace-panel module-panel">
      <PanelTitle icon={<LayoutDashboard size={18} />} title={menu?.label ?? '业务模块'} />
      <div className="module-state">
        <strong>{menu?.label ?? '业务模块'}</strong>
        <span>React 工作台入口已就绪</span>
      </div>
    </section>
  )
}

function AccessDeniedPage() {
  return (
    <section className="module-panel access-denied-panel" role="alert">
      <ShieldCheck size={30} strokeWidth={1.8} />
      <strong>{t('access.deniedTitle')}</strong>
      <span>{t('access.deniedDescription')}</span>
    </section>
  )
}

function ReportingPage({ onNavigate }: ModuleNavigationProps) {
  const [approvals, setApprovals] = useState<ApprovalQuery | null>(null)
  const [statistics, setStatistics] = useState<ReportingStatistics | null>(null)
  const [documentTypeFilter, setDocumentTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [applicantUserFilter, setApplicantUserFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [statisticsDateFromFilter, setStatisticsDateFromFilter] = useState('')
  const [statisticsDateToFilter, setStatisticsDateToFilter] = useState('')
  const [statisticsStatusFilter, setStatisticsStatusFilter] = useState('')
  const [statisticsCustomerFilter, setStatisticsCustomerFilter] = useState('')
  const [statisticsSupplierFilter, setStatisticsSupplierFilter] = useState('')
  const [statisticsSalesFilter, setStatisticsSalesFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStatistics, setLoadingStatistics] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadApprovals()
    void loadStatistics()
  }, [])

  async function loadApprovals() {
    setLoading(true)
    setError('')
    try {
      const result = await listApprovalDocuments({
        document_type: documentTypeFilter || undefined,
        status: statusFilter || undefined,
        applicant_user_id: applicantUserFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
      })
      setApprovals(result)
    } catch (caught) {
      showError(caught, '经理查询加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadStatistics() {
    setLoadingStatistics(true)
    setError('')
    try {
      const result = await listReportingStatistics({
        date_from: statisticsDateFromFilter || undefined,
        date_to: statisticsDateToFilter || undefined,
        approval_status: statisticsStatusFilter || undefined,
        customer_id: statisticsCustomerFilter.trim() || undefined,
        supplier_id: statisticsSupplierFilter.trim() || undefined,
        sales_user_id: statisticsSalesFilter.trim() || undefined,
      })
      setStatistics(result)
    } catch (caught) {
      showError(caught, '统计分析加载失败')
    } finally {
      setLoadingStatistics(false)
    }
  }

  function resetFilters() {
    setDocumentTypeFilter('')
    setStatusFilter('submitted')
    setApplicantUserFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    void listApprovalDocuments({ status: 'submitted' })
      .then(setApprovals)
      .catch((caught: unknown) => {
        showError(caught, '经理查询加载失败')
      })
  }

  function resetStatisticsFilters() {
    setStatisticsDateFromFilter('')
    setStatisticsDateToFilter('')
    setStatisticsStatusFilter('')
    setStatisticsCustomerFilter('')
    setStatisticsSupplierFilter('')
    setStatisticsSalesFilter('')
    void listReportingStatistics()
      .then(setStatistics)
      .catch((caught: unknown) => {
        showError(caught, '统计分析加载失败')
      })
  }

  const items = approvals?.items ?? []
  const statisticsSummary = statistics?.summary

  return (
    <section className="reporting-page">
      <OperationFlowRail activeLabel="经理报表" activePath={reportingPath} kind="finance" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="经理查询概览">
        <Metric label="审批单据" value={approvals?.total ?? 0} />
        <Metric
          label="待审批"
          value={approvals?.pending_count ?? 0}
          intent={(approvals?.pending_count ?? 0) > 0 ? 'warning' : 'normal'}
        />
        <Metric label="已审批" value={approvals?.approved_count ?? 0} />
        <Metric label="单据类型" value={approvals?.type_summaries.length ?? 0} />
      </div>

      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="reporting-grid">
        <section className="workspace-panel reporting-approval-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<BarChart3 size={18} />} title="审批单据查询" />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadApprovals()
            }}
          >
            <label>
              单据类型
              <FormSelect
                value={documentTypeFilter}
                onChange={(event) => setDocumentTypeFilter(event.target.value)}
              >
                <option value="">全部类型</option>
                {reportingDocumentTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              审批状态
              <FormSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">全部状态</option>
                {reportingStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              申请人标识
              <Input
                value={applicantUserFilter}
                placeholder="u-001"
                onChange={(event) => setApplicantUserFilter(event.target.value)}
              />
            </label>
            <label>
              开始日期
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(event) => setDateFromFilter(event.target.value)}
              />
            </label>
            <label>
              结束日期
              <Input
                type="date"
                value={dateToFilter}
                onChange={(event) => setDateToFilter(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />} loading={loading}>
              查询
            </Button>
            <Button type="default" onClick={resetFilters}>
              重置
            </Button>
          </form>

          <Table<ApprovalDocument>
            columns={[
              {
                title: '单据编号',
                dataIndex: 'document_no',
                render: (value: string) => <strong>{value}</strong>,
              },
              { title: '类型', dataIndex: 'document_type', render: approvalDocumentTypeTag },
              { title: '状态', dataIndex: 'status', render: approvalStatusTag },
              { title: '客户/供应商', dataIndex: 'counterparty_name' },
              { title: '申请人', dataIndex: 'applicant_user_name', render: nullableText },
              { title: '业务日期', dataIndex: 'business_date', render: formatDate },
              { title: '提交日期', dataIndex: 'submitted_at', render: formatDate },
              { title: '审批日期', dataIndex: 'approved_at', render: formatDate },
              {
                title: '金额',
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={items}
            loading={loading}
            pagination={false}
            rowKey={(record) => `${record.document_type}-${record.document_id}`}
            size="small"
          />
        </section>

        <section className="workspace-panel reporting-type-summary-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="类型汇总" />
          <Table<ApprovalTypeSummary>
            columns={[
              { title: '单据类型', dataIndex: 'document_type', render: approvalDocumentTypeTag },
              { title: '待审批', dataIndex: 'pending_count' },
              { title: '已审批', dataIndex: 'approved_count' },
              { title: '合计', dataIndex: 'total_count' },
            ]}
            dataSource={approvals?.type_summaries ?? []}
            loading={loading}
            pagination={false}
            rowKey="document_type"
            size="small"
          />
        </section>
      </section>

      <section className="reporting-statistics-grid" aria-label="统计分析报表">
        <section className="workspace-panel reporting-statistics-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<BarChart3 size={18} />} title="统计分析报表" />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadStatistics()
            }}
          >
            <label>
              统计开始
              <Input
                type="date"
                value={statisticsDateFromFilter}
                onChange={(event) => setStatisticsDateFromFilter(event.target.value)}
              />
            </label>
            <label>
              统计结束
              <Input
                type="date"
                value={statisticsDateToFilter}
                onChange={(event) => setStatisticsDateToFilter(event.target.value)}
              />
            </label>
            <label>
              统计状态
              <FormSelect
                value={statisticsStatusFilter}
                onChange={(event) => setStatisticsStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {exportContractStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              客户标识
              <Input
                value={statisticsCustomerFilter}
                placeholder="customer-id"
                onChange={(event) => setStatisticsCustomerFilter(event.target.value)}
              />
            </label>
            <label>
              供应商标识
              <Input
                value={statisticsSupplierFilter}
                placeholder="supplier-id"
                onChange={(event) => setStatisticsSupplierFilter(event.target.value)}
              />
            </label>
            <label>
              业务员标识
              <Input
                value={statisticsSalesFilter}
                placeholder="u-001"
                onChange={(event) => setStatisticsSalesFilter(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />} loading={loadingStatistics}>
              查询统计
            </Button>
            <Button type="default" onClick={resetStatisticsFilters}>
              重置统计
            </Button>
          </form>

          <div className="summary-strip reporting-stat-strip">
            <Metric
              label="出口合同"
              value={formatFinanceAmount(
                statisticsSummary?.export_contract_amount,
                statisticsSummary?.currency_label,
              )}
            />
            <Metric
              label="采购合同"
              value={formatFinanceAmount(
                statisticsSummary?.purchase_contract_amount,
                statisticsSummary?.currency_label,
              )}
            />
            <Metric
              label="出货应收"
              value={formatFinanceAmount(
                statisticsSummary?.shipment_receivable_amount,
                statisticsSummary?.currency_label,
              )}
            />
            <Metric
              label="出货利润"
              value={formatFinanceAmount(
                statisticsSummary?.shipment_profit_amount,
                statisticsSummary?.currency_label,
              )}
            />
          </div>

          <Table<CustomerShipmentStatistic>
            columns={[
              { title: '客户', dataIndex: 'customer_name' },
              { title: '出货单', dataIndex: 'shipment_count' },
              {
                title: '应收',
                dataIndex: 'receivable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '利润',
                dataIndex: 'profit_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '下钻', dataIndex: 'source_path', render: sourcePathTag },
            ]}
            dataSource={statistics?.customer_shipments ?? []}
            loading={loadingStatistics}
            pagination={false}
            rowKey={(record) => `${record.customer_id ?? record.customer_name}-${record.currency}`}
            size="small"
          />
        </section>

        <section className="workspace-panel reporting-stat-side-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="业务员月度出货" />
          <Table<SalesMonthlyShipmentStatistic>
            columns={[
              { title: '月份', dataIndex: 'period' },
              { title: '业务员', dataIndex: 'sales_user_name', render: nullableText },
              { title: '出货单', dataIndex: 'shipment_count' },
              {
                title: '出货额',
                dataIndex: 'shipped_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={statistics?.sales_monthly_shipments ?? []}
            loading={loadingStatistics}
            pagination={false}
            rowKey={(record) => `${record.period}-${record.sales_user_id ?? '-'}-${record.currency}`}
            size="small"
          />
        </section>

        <section className="workspace-panel reporting-stat-side-panel">
          <PanelTitle icon={<ShieldCheck size={18} />} title="合同状态金额" />
          <div className="reporting-status-stack">
            <div>
              <strong>出口合同</strong>
              <Table<StatusAmountStatistic>
                columns={[
                  { title: '状态', dataIndex: 'status', render: approvalStatusTag },
                  { title: '数量', dataIndex: 'count' },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                ]}
                dataSource={statistics?.export_contract_statuses ?? []}
                loading={loadingStatistics}
                pagination={false}
                rowKey={(record) => `export-${record.status}-${record.currency}`}
                size="small"
              />
            </div>
            <div>
              <strong>采购合同</strong>
              <Table<StatusAmountStatistic>
                columns={[
                  { title: '状态', dataIndex: 'status', render: approvalStatusTag },
                  { title: '数量', dataIndex: 'count' },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                ]}
                dataSource={statistics?.purchase_contract_statuses ?? []}
                loading={loadingStatistics}
                pagination={false}
                rowKey={(record) => `purchase-${record.status}-${record.currency}`}
                size="small"
              />
            </div>
          </div>
        </section>

        <section className="workspace-panel reporting-drilldown-panel">
          <PanelTitle icon={<Search size={18} />} title="原始单据追溯" />
          <div className="reporting-drilldown-stack">
            <Table<ShipmentStatisticItem>
              columns={[
                { title: '出货单', dataIndex: 'shipment_no', render: (value: string) => <strong>{value}</strong> },
                { title: '客户', dataIndex: 'customer_name' },
                { title: '状态', dataIndex: 'status', render: approvalStatusTag },
                { title: '出货日', dataIndex: 'shipment_date', render: formatDate },
                {
                  title: '应收',
                  dataIndex: 'receivable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '利润',
                  dataIndex: 'profit_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '下钻', dataIndex: 'source_path', render: sourcePathTag },
              ]}
              dataSource={statistics?.shipment_items ?? []}
              loading={loadingStatistics}
              pagination={false}
              rowKey="shipment_id"
              size="small"
            />
            <Table<ReportDocumentStatistic>
              columns={[
                { title: '出口合同', dataIndex: 'document_no', render: (value: string) => <strong>{value}</strong> },
                { title: '客户', dataIndex: 'party_name' },
                { title: '业务员', dataIndex: 'business_user_name', render: nullableText },
                { title: '状态', dataIndex: 'status', render: approvalStatusTag },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '下钻', dataIndex: 'source_path', render: sourcePathTag },
              ]}
              dataSource={statistics?.export_contract_items ?? []}
              loading={loadingStatistics}
              pagination={false}
              rowKey="document_id"
              size="small"
            />
          </div>
        </section>
      </section>
    </section>
  )
}

type FinancePageProps = ModuleNavigationProps & {
  view: FinanceView
}

function FinancePage({ view, onNavigate }: FinancePageProps) {
  const activeModule = view.module
  const detailId = view.id
  const goModule = (module: FinanceModule) => onNavigate(financeModulePathByModule[module])
  const goDetail = (module: FinanceModule, id: string) => onNavigate(financeDetailPath(module, id))
  const goFinanceHome = () => onNavigate(financePath)
  const [overview, setOverview] = useState<FinanceOverview | null>(null)
  const [receipts, setReceipts] = useState<BankReceipt[]>([])
  const [receivables, setReceivables] = useState<ReceivableItem[]>([])
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([])
  const [paymentRequests, setPaymentRequests] = useState<SupplierPaymentRequest[]>([])
  const [payables, setPayables] = useState<PayableItem[]>([])
  const [partnerFeeInvoices, setPartnerFeeInvoices] = useState<PartnerFeeInvoice[]>([])
  const [feePaymentRequests, setFeePaymentRequests] = useState<FeePaymentRequest[]>([])
  const [feePayables, setFeePayables] = useState<FeePayableItem[]>([])
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([])
  const [verificationUsage, setVerificationUsage] = useState<VerificationUsageItem[]>([])
  const [miscFeeItems, setMiscFeeItems] = useState<MiscFeeItem[]>([])
  const [miscFeeAllocations, setMiscFeeAllocations] = useState<MiscFeeAllocation[]>([])
  const [miscFeeAllocationSummary, setMiscFeeAllocationSummary] = useState<MiscFeeAllocation[]>([])
  const [financialSettlements, setFinancialSettlements] = useState<FinancialSettlement[]>([])
  const [profitCalculations, setProfitCalculations] = useState<FinancialSettlement[]>([])
  // ---- 报销管理 / 口岸数据 / 财务报表 ----
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [portImportBatches, setPortImportBatches] = useState<PortImportBatch[]>([])
  const [customsRecords, setCustomsRecords] = useState<CustomsDeclarationRecord[]>([])
  const [reimbursementsTotalAmount, setReimbursementsTotalAmount] = useState('0.00')
  const [selectedReimbursementId, setSelectedReimbursementId] = useState<string | null>(null)
  const [reimbursementSearch, setReimbursementSearch] = useState('')
  const [reimbursementStatusFilter, setReimbursementStatusFilter] = useState('')
  const [reimbursementCategoryFilter, setReimbursementCategoryFilter] = useState('')
  const [loadingReimbursements, setLoadingReimbursements] = useState(false)
  const [submittingReimbursement, setSubmittingReimbursement] = useState(false)
  const [submittingReimbursementAction, setSubmittingReimbursementAction] = useState(false)
  const [reimbursementForm, setReimbursementForm] = useState({
    reimbursement_no: '',
    applicant_user_id: '',
    applicant_user_name: '',
    department: '',
    category: 'travel',
    currency: 'CNY',
    amount: '',
    reason: '',
    remark: '',
  })
  const [reimbursementPayMethod, setReimbursementPayMethod] = useState('bank_transfer')
  const [loadingPortBatches, setLoadingPortBatches] = useState(false)
  const [loadingCustomsRecords, setLoadingCustomsRecords] = useState(false)
  const [submittingPortBatch, setSubmittingPortBatch] = useState(false)
  const [portBatchSourceFilter, setPortBatchSourceFilter] = useState('')
  const [customsDeclarationFilter, setCustomsDeclarationFilter] = useState('')
  const [customsReceiptFilter, setCustomsReceiptFilter] = useState('')
  const [customsTradeTypeFilter, setCustomsTradeTypeFilter] = useState('')
  const [portBatchForm, setPortBatchForm] = useState({
    batch_no: '',
    source: '',
    imported_at: '',
    remark: '',
  })
  const [portRecordForm, setPortRecordForm] = useState({
    declaration_no: '',
    customs_receipt_no: '',
    trade_type: 'export',
    export_contract_no: '',
    customs_date: '',
    product_name: '',
    hs_code: '',
    quantity: '',
    unit: '',
    amount: '',
    currency: 'USD',
    customer_or_supplier: '',
  })
  const [reportDateFrom, setReportDateFrom] = useState('')
  const [reportDateTo, setReportDateTo] = useState('')
  const [reportCurrency, setReportCurrency] = useState('')
  const [reportReceiptNo, setReportReceiptNo] = useState('')
  const [reportReceiptType, setReportReceiptType] = useState('')
  const [reportSupplierName, setReportSupplierName] = useState('')
  const [reportPartnerName, setReportPartnerName] = useState('')
  const [reportFeeType, setReportFeeType] = useState('')
  const [reportSalesUserId, setReportSalesUserId] = useState('')
  const [reportOwnerUserId, setReportOwnerUserId] = useState('')
  const [reportReminderStatus, setReportReminderStatus] = useState('')
  const [reportStatus, setReportStatus] = useState('')
  const [reportIncludeRegistered, setReportIncludeRegistered] = useState(false)
  const [activeReport, setActiveReport] = useState('receipt-usage')
  const [loadingReport, setLoadingReport] = useState(false)
  const [exportingReport, setExportingReport] = useState(false)
  const [loadingReportExplanation, setLoadingReportExplanation] = useState(false)
  const [reportExplanation, setReportExplanation] = useState<FinanceReportExplanation | null>(null)
  const [reportDrilldown, setReportDrilldown] = useState<FinanceReportDrilldown | null>(null)
  const [matchingCustomsReceipts, setMatchingCustomsReceipts] = useState(false)
  const [receiptUsageReport, setReceiptUsageReport] = useState<ReceiptUsageDetailReport | null>(null)
  const [bankReceiptSummaryReport, setBankReceiptSummaryReport] =
    useState<BankReceiptSummaryReport | null>(null)
  const [goodsPaymentReport, setGoodsPaymentReport] = useState<GoodsPaymentQueryReport | null>(null)
  const [feePaymentReport, setFeePaymentReport] = useState<FeePaymentQueryReport | null>(null)
  const [customsCollectionReport, setCustomsCollectionReport] =
    useState<CustomsReceiptCollectionReport | null>(null)
  const [taxRefundStatisticsReport, setTaxRefundStatisticsReport] =
    useState<TaxRefundStatisticsReport | null>(null)
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)
  const [selectedSupplierInvoiceId, setSelectedSupplierInvoiceId] = useState<string | null>(null)
  const [selectedPaymentRequestId, setSelectedPaymentRequestId] = useState<string | null>(null)
  const [selectedPartnerFeeInvoiceId, setSelectedPartnerFeeInvoiceId] = useState<string | null>(null)
  const [selectedFeePaymentRequestId, setSelectedFeePaymentRequestId] = useState<string | null>(null)
  const [selectedVerificationDocumentId, setSelectedVerificationDocumentId] = useState<string | null>(null)
  const [selectedMiscFeeItemId, setSelectedMiscFeeItemId] = useState<string | null>(null)
  const [selectedFinancialSettlementId, setSelectedFinancialSettlementId] = useState<string | null>(null)
  const [receiptSearch, setReceiptSearch] = useState('')
  const [receiptStatusFilter, setReceiptStatusFilter] = useState('')
  const [receiptCustomerFilter, setReceiptCustomerFilter] = useState('')
  const [receivableSearch, setReceivableSearch] = useState('')
  const [receivableContractFilter, setReceivableContractFilter] = useState('')
  const [receivableInvoiceFilter, setReceivableInvoiceFilter] = useState('')
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('')
  const [invoiceSupplierFilter, setInvoiceSupplierFilter] = useState('')
  const [invoiceContractFilter, setInvoiceContractFilter] = useState('')
  const [paymentRequestSearch, setPaymentRequestSearch] = useState('')
  const [paymentRequestStatusFilter, setPaymentRequestStatusFilter] = useState('')
  const [paymentRequestTypeFilter, setPaymentRequestTypeFilter] = useState('')
  const [payableSearch, setPayableSearch] = useState('')
  const [payableStatusFilter, setPayableStatusFilter] = useState('')
  const [payableSupplierFilter, setPayableSupplierFilter] = useState('')
  const [payableContractFilter, setPayableContractFilter] = useState('')
  const [feeInvoiceSearch, setFeeInvoiceSearch] = useState('')
  const [feeInvoiceStatusFilter, setFeeInvoiceStatusFilter] = useState('')
  const [feeInvoiceTypeFilter, setFeeInvoiceTypeFilter] = useState('')
  const [feeInvoicePartnerFilter, setFeeInvoicePartnerFilter] = useState('')
  const [feeInvoiceShipmentFilter, setFeeInvoiceShipmentFilter] = useState('')
  const [feePaymentRequestSearch, setFeePaymentRequestSearch] = useState('')
  const [feePaymentRequestStatusFilter, setFeePaymentRequestStatusFilter] = useState('')
  const [feePaymentRequestTypeFilter, setFeePaymentRequestTypeFilter] = useState('')
  const [feePayableSearch, setFeePayableSearch] = useState('')
  const [feePayableStatusFilter, setFeePayableStatusFilter] = useState('')
  const [feePayableTypeFilter, setFeePayableTypeFilter] = useState('')
  const [feePayablePartnerFilter, setFeePayablePartnerFilter] = useState('')
  const [feePayableShipmentFilter, setFeePayableShipmentFilter] = useState('')
  const [verificationSearch, setVerificationSearch] = useState('')
  const [verificationStatusFilter, setVerificationStatusFilter] = useState('')
  const [verificationReminderFilter, setVerificationReminderFilter] = useState('')
  const [verificationOwnerFilter, setVerificationOwnerFilter] = useState('')
  const [verificationShipmentFilter, setVerificationShipmentFilter] = useState('')
  const [verificationUsageSearch, setVerificationUsageSearch] = useState('')
  const [verificationUsageStatusFilter, setVerificationUsageStatusFilter] = useState('')
  const [verificationUsageReminderFilter, setVerificationUsageReminderFilter] = useState('')
  const [verificationUsageShipmentFilter, setVerificationUsageShipmentFilter] = useState('')
  const [miscFeeItemSearch, setMiscFeeItemSearch] = useState('')
  const [miscFeeItemCategoryFilter, setMiscFeeItemCategoryFilter] = useState('')
  const [miscFeeItemStatusFilter, setMiscFeeItemStatusFilter] = useState('')
  const [miscFeeAllocationSearch, setMiscFeeAllocationSearch] = useState('')
  const [miscFeeAllocationCategoryFilter, setMiscFeeAllocationCategoryFilter] = useState('')
  const [miscFeeAllocationShipmentFilter, setMiscFeeAllocationShipmentFilter] = useState('')
  const [miscFeeAllocationSalesFilter, setMiscFeeAllocationSalesFilter] = useState('')
  const [miscFeeSummaryShipmentFilter, setMiscFeeSummaryShipmentFilter] = useState('')
  const [miscFeeSummaryCategoryFilter, setMiscFeeSummaryCategoryFilter] = useState('')
  const [settlementSearch, setSettlementSearch] = useState('')
  const [settlementShipmentFilter, setSettlementShipmentFilter] = useState('')
  const [profitCalculationSearch, setProfitCalculationSearch] = useState('')
  const [profitCalculationShipmentFilter, setProfitCalculationShipmentFilter] = useState('')
  const [receiptForm, setReceiptForm] = useState<BankReceiptFormState>(() => initialBankReceiptForm())
  const [claimForm, setClaimForm] = useState<ReceiptClaimFormState>(() => initialReceiptClaimForm())
  const [allocationForm, setAllocationForm] = useState<ReceiptAllocationFormState>(() =>
    initialReceiptAllocationForm(),
  )
  const [supplierInvoiceForm, setSupplierInvoiceForm] = useState<SupplierInvoiceFormState>(() =>
    initialSupplierInvoiceForm(),
  )
  const [paymentRequestForm, setPaymentRequestForm] = useState<PaymentRequestFormState>(() =>
    initialPaymentRequestForm(),
  )
  const [paymentApprovalForm, setPaymentApprovalForm] = useState<PaymentApprovalFormState>(() =>
    initialPaymentApprovalForm(),
  )
  const [partnerFeeInvoiceForm, setPartnerFeeInvoiceForm] = useState<PartnerFeeInvoiceFormState>(() =>
    initialPartnerFeeInvoiceForm(),
  )
  const [feePaymentRequestForm, setFeePaymentRequestForm] = useState<FeePaymentRequestFormState>(() =>
    initialFeePaymentRequestForm(),
  )
  const [feePaymentApprovalForm, setFeePaymentApprovalForm] = useState<FeePaymentApprovalFormState>(() =>
    initialFeePaymentApprovalForm(),
  )
  const [verificationDocumentForm, setVerificationDocumentForm] =
    useState<VerificationDocumentFormState>(() => initialVerificationDocumentForm())
  const [customsReceiptForm, setCustomsReceiptForm] = useState<CustomsReceiptFormState>(() =>
    initialCustomsReceiptForm(),
  )
  const [verificationRegisterForm, setVerificationRegisterForm] =
    useState<VerificationRegisterFormState>(() => initialVerificationRegisterForm())
  const [taxRefundForm, setTaxRefundForm] = useState<TaxRefundFormState>(() => initialTaxRefundForm())
  const [miscFeeItemForm, setMiscFeeItemForm] = useState<MiscFeeItemFormState>(() =>
    initialMiscFeeItemForm(),
  )
  const [miscFeeAllocationForm, setMiscFeeAllocationForm] =
    useState<MiscFeeAllocationFormState>(() => initialMiscFeeAllocationForm())
  const [settlementForm, setSettlementForm] = useState<FinancialSettlementFormState>(() =>
    initialFinancialSettlementForm(),
  )
  const [manualProfitCostForm, setManualProfitCostForm] = useState<ManualProfitCostFormState>(() =>
    initialManualProfitCostForm(),
  )
  const [loading, setLoading] = useState(false)
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const [loadingReceivables, setLoadingReceivables] = useState(false)
  const [loadingSupplierInvoices, setLoadingSupplierInvoices] = useState(false)
  const [loadingPaymentRequests, setLoadingPaymentRequests] = useState(false)
  const [loadingPayables, setLoadingPayables] = useState(false)
  const [loadingPartnerFeeInvoices, setLoadingPartnerFeeInvoices] = useState(false)
  const [loadingFeePaymentRequests, setLoadingFeePaymentRequests] = useState(false)
  const [loadingFeePayables, setLoadingFeePayables] = useState(false)
  const [loadingVerificationDocuments, setLoadingVerificationDocuments] = useState(false)
  const [loadingVerificationUsage, setLoadingVerificationUsage] = useState(false)
  const [loadingMiscFeeItems, setLoadingMiscFeeItems] = useState(false)
  const [loadingMiscFeeAllocations, setLoadingMiscFeeAllocations] = useState(false)
  const [loadingMiscFeeSummary, setLoadingMiscFeeSummary] = useState(false)
  const [loadingFinancialSettlements, setLoadingFinancialSettlements] = useState(false)
  const [loadingProfitCalculations, setLoadingProfitCalculations] = useState(false)
  const [submittingReceipt, setSubmittingReceipt] = useState(false)
  const [submittingClaim, setSubmittingClaim] = useState(false)
  const [submittingAllocation, setSubmittingAllocation] = useState(false)
  const [submittingSupplierInvoice, setSubmittingSupplierInvoice] = useState(false)
  const [submittingPaymentRequest, setSubmittingPaymentRequest] = useState(false)
  const [submittingPaymentApproval, setSubmittingPaymentApproval] = useState(false)
  const [submittingPartnerFeeInvoice, setSubmittingPartnerFeeInvoice] = useState(false)
  const [submittingFeePaymentRequest, setSubmittingFeePaymentRequest] = useState(false)
  const [submittingFeePaymentApproval, setSubmittingFeePaymentApproval] = useState(false)
  const [submittingVerificationDocument, setSubmittingVerificationDocument] = useState(false)
  const [submittingCustomsReceipt, setSubmittingCustomsReceipt] = useState(false)
  const [submittingVerificationRegister, setSubmittingVerificationRegister] = useState(false)
  const [submittingTaxRefund, setSubmittingTaxRefund] = useState(false)
  const [submittingMiscFeeItem, setSubmittingMiscFeeItem] = useState(false)
  const [submittingMiscFeeAllocation, setSubmittingMiscFeeAllocation] = useState(false)
  const [submittingSettlement, setSubmittingSettlement] = useState(false)
  const [submittingManualProfitCost, setSubmittingManualProfitCost] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void loadOverview()
    void loadReceipts()
    void loadReceivables()
    void loadSupplierInvoices()
    void loadPaymentRequests()
    void loadPayables()
    void loadPartnerFeeInvoices()
    void loadFeePaymentRequests()
    void loadFeePayables()
    void loadVerificationDocuments()
    void loadVerificationUsage()
    void loadMiscFeeItems()
    void loadMiscFeeAllocations()
    void loadMiscFeeAllocationSummary()
    void loadFinancialSettlements()
    void loadProfitCalculations()
    void loadReimbursements()
    void loadPortImportBatches()
    void loadCustomsRecords()
  }, [])

  useEffect(() => {
    if (activeModule === 'reports') {
      void loadFinanceReport(activeReport)
      void loadReportExplanation(activeReport)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule, activeReport])

  // Keep the per-module selection in sync with the detail id in the URL so that
  // opening a detail page directly (or via the browser back/forward) selects the
  // matching record.
  useEffect(() => {
    if (!detailId) return
    switch (activeModule) {
      case 'receipts':
        setSelectedReceiptId(detailId)
        break
      case 'payments':
        setSelectedSupplierInvoiceId(detailId)
        break
      case 'fees':
        setSelectedPartnerFeeInvoiceId(detailId)
        break
      case 'tax':
        setSelectedVerificationDocumentId(detailId)
        break
      case 'misc':
        setSelectedMiscFeeItemId(detailId)
        break
      case 'settlement':
        setSelectedFinancialSettlementId(detailId)
        break
      case 'reimbursements':
        setSelectedReimbursementId(detailId)
        break
      default:
        break
    }
  }, [activeModule, detailId])

  const selectedReceipt = useMemo(
    () => receipts.find((item) => item.id === selectedReceiptId) ?? receipts[0] ?? null,
    [receipts, selectedReceiptId],
  )
  const selectedSupplierInvoice = useMemo(
    () => supplierInvoices.find((item) => item.id === selectedSupplierInvoiceId) ?? supplierInvoices[0] ?? null,
    [supplierInvoices, selectedSupplierInvoiceId],
  )
  const selectedPaymentRequest = useMemo(
    () => paymentRequests.find((item) => item.id === selectedPaymentRequestId) ?? paymentRequests[0] ?? null,
    [paymentRequests, selectedPaymentRequestId],
  )
  const selectedPartnerFeeInvoice = useMemo(
    () =>
      partnerFeeInvoices.find((item) => item.id === selectedPartnerFeeInvoiceId) ??
      partnerFeeInvoices[0] ??
      null,
    [partnerFeeInvoices, selectedPartnerFeeInvoiceId],
  )
  const selectedFeePaymentRequest = useMemo(
    () =>
      feePaymentRequests.find((item) => item.id === selectedFeePaymentRequestId) ??
      feePaymentRequests[0] ??
      null,
    [feePaymentRequests, selectedFeePaymentRequestId],
  )
  const selectedVerificationDocument = useMemo(
    () =>
      verificationDocuments.find((item) => item.id === selectedVerificationDocumentId) ??
      verificationDocuments[0] ??
      null,
    [verificationDocuments, selectedVerificationDocumentId],
  )
  const selectedMiscFeeItem = useMemo(
    () => miscFeeItems.find((item) => item.id === selectedMiscFeeItemId) ?? miscFeeItems[0] ?? null,
    [miscFeeItems, selectedMiscFeeItemId],
  )
  const selectedFinancialSettlement = useMemo(
    () =>
      financialSettlements.find((item) => item.id === selectedFinancialSettlementId) ??
      financialSettlements[0] ??
      null,
    [financialSettlements, selectedFinancialSettlementId],
  )

  useEffect(() => {
    if (!selectedSupplierInvoice) return
    setPaymentRequestForm((current) => ({
      ...current,
      supplier_invoice_id: selectedSupplierInvoice.id,
      requested_amount: selectedSupplierInvoice.unpaid_amount,
      currency: selectedSupplierInvoice.currency,
    }))
    setPaymentApprovalForm((current) => ({
      ...current,
      approved_amount: selectedSupplierInvoice.unpaid_amount,
    }))
  }, [selectedSupplierInvoice?.id, selectedSupplierInvoice?.unpaid_amount, selectedSupplierInvoice?.currency])

  useEffect(() => {
    if (!selectedPartnerFeeInvoice) return
    setFeePaymentRequestForm((current) => ({
      ...current,
      partner_fee_invoice_id: selectedPartnerFeeInvoice.id,
      requested_amount: selectedPartnerFeeInvoice.unpaid_amount,
      currency: selectedPartnerFeeInvoice.currency,
    }))
    setFeePaymentApprovalForm((current) => ({
      ...current,
      approved_amount: selectedPartnerFeeInvoice.unpaid_amount,
    }))
  }, [
    selectedPartnerFeeInvoice?.id,
    selectedPartnerFeeInvoice?.unpaid_amount,
    selectedPartnerFeeInvoice?.currency,
  ])

  useEffect(() => {
    if (!selectedVerificationDocument) return
    setTaxRefundForm((current) => ({
      ...current,
      amount: selectedVerificationDocument.unrefunded_amount,
      currency: selectedVerificationDocument.currency,
    }))
  }, [
    selectedVerificationDocument?.id,
    selectedVerificationDocument?.unrefunded_amount,
    selectedVerificationDocument?.currency,
  ])

  useEffect(() => {
    if (!selectedMiscFeeItem) return
    setMiscFeeAllocationForm((current) => ({
      ...current,
      item_id: selectedMiscFeeItem.id,
      allocation_method: selectedMiscFeeItem.default_allocation_method,
    }))
  }, [
    selectedMiscFeeItem?.id,
    selectedMiscFeeItem?.default_allocation_method,
  ])

  useEffect(() => {
    if (!selectedFinancialSettlement) return
    setManualProfitCostForm((current) => ({
      ...current,
      currency: selectedFinancialSettlement.currency,
      cost_date: selectedFinancialSettlement.settlement_date,
    }))
  }, [
    selectedFinancialSettlement?.id,
    selectedFinancialSettlement?.currency,
    selectedFinancialSettlement?.settlement_date,
  ])

  async function loadOverview() {
    setLoading(true)
    setError('')
    try {
      setOverview(await getFinanceOverview())
    } catch (caught) {
      showError(caught, '财务总览加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadReceipts(preferredId?: string) {
    setLoadingReceipts(true)
    setError('')
    try {
      const result = await listBankReceipts({
        q: receiptSearch.trim() || undefined,
        status: receiptStatusFilter || undefined,
        customer_id: receiptCustomerFilter.trim() || undefined,
      })
      setReceipts(result.items)
      const nextReceiptId =
        preferredId ??
        (result.items.some((item) => item.id === selectedReceiptId) ? selectedReceiptId : null) ??
        result.items[0]?.id ??
        null
      setSelectedReceiptId(nextReceiptId)
    } catch (caught) {
      showError(caught, '银行水单加载失败')
    } finally {
      setLoadingReceipts(false)
    }
  }

  async function loadReceivables() {
    setLoadingReceivables(true)
    setError('')
    try {
      const result = await listReceivables({
        q: receivableSearch.trim() || undefined,
        contract_no: receivableContractFilter.trim() || undefined,
        invoice_no: receivableInvoiceFilter.trim() || undefined,
      })
      setReceivables(result.items)
    } catch (caught) {
      showError(caught, '应收账款加载失败')
    } finally {
      setLoadingReceivables(false)
    }
  }

  async function loadSupplierInvoices(preferredId?: string) {
    setLoadingSupplierInvoices(true)
    setError('')
    try {
      const result = await listSupplierInvoices({
        q: invoiceSearch.trim() || undefined,
        status: invoiceStatusFilter || undefined,
        supplier_id: invoiceSupplierFilter.trim() || undefined,
        purchase_contract_no: invoiceContractFilter.trim() || undefined,
      })
      setSupplierInvoices(result.items)
      const nextInvoiceId =
        preferredId ??
        (result.items.some((item) => item.id === selectedSupplierInvoiceId) ? selectedSupplierInvoiceId : null) ??
        result.items[0]?.id ??
        null
      setSelectedSupplierInvoiceId(nextInvoiceId)
    } catch (caught) {
      showError(caught, '供应商发票加载失败')
    } finally {
      setLoadingSupplierInvoices(false)
    }
  }

  async function loadPaymentRequests(preferredId?: string) {
    setLoadingPaymentRequests(true)
    setError('')
    try {
      const result = await listPaymentRequests({
        q: paymentRequestSearch.trim() || undefined,
        status: paymentRequestStatusFilter || undefined,
        payment_type: paymentRequestTypeFilter || undefined,
        supplier_id: invoiceSupplierFilter.trim() || undefined,
      })
      setPaymentRequests(result.items)
      const nextRequestId =
        preferredId ??
        (result.items.some((item) => item.id === selectedPaymentRequestId) ? selectedPaymentRequestId : null) ??
        result.items[0]?.id ??
        null
      setSelectedPaymentRequestId(nextRequestId)
    } catch (caught) {
      showError(caught, '付款申请加载失败')
    } finally {
      setLoadingPaymentRequests(false)
    }
  }

  async function loadPayables() {
    setLoadingPayables(true)
    setError('')
    try {
      const result = await listPayables({
        q: payableSearch.trim() || undefined,
        status: payableStatusFilter || undefined,
        supplier_id: payableSupplierFilter.trim() || undefined,
        purchase_contract_no: payableContractFilter.trim() || undefined,
      })
      setPayables(result.items)
    } catch (caught) {
      showError(caught, '应付账款加载失败')
    } finally {
      setLoadingPayables(false)
    }
  }

  async function loadPartnerFeeInvoices(preferredId?: string) {
    setLoadingPartnerFeeInvoices(true)
    setError('')
    try {
      const result = await listPartnerFeeInvoices({
        q: feeInvoiceSearch.trim() || undefined,
        status: feeInvoiceStatusFilter || undefined,
        fee_type: feeInvoiceTypeFilter || undefined,
        partner_id: feeInvoicePartnerFilter.trim() || undefined,
        shipment_no: feeInvoiceShipmentFilter.trim() || undefined,
      })
      setPartnerFeeInvoices(result.items)
      const nextInvoiceId =
        preferredId ??
        (result.items.some((item) => item.id === selectedPartnerFeeInvoiceId)
          ? selectedPartnerFeeInvoiceId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedPartnerFeeInvoiceId(nextInvoiceId)
    } catch (caught) {
      showError(caught, '合作伙伴费用发票加载失败')
    } finally {
      setLoadingPartnerFeeInvoices(false)
    }
  }

  async function loadFeePaymentRequests(preferredId?: string) {
    setLoadingFeePaymentRequests(true)
    setError('')
    try {
      const result = await listFeePaymentRequests({
        q: feePaymentRequestSearch.trim() || undefined,
        status: feePaymentRequestStatusFilter || undefined,
        fee_type: feePaymentRequestTypeFilter || undefined,
        partner_id: feeInvoicePartnerFilter.trim() || undefined,
        shipment_no: feeInvoiceShipmentFilter.trim() || undefined,
      })
      setFeePaymentRequests(result.items)
      const nextRequestId =
        preferredId ??
        (result.items.some((item) => item.id === selectedFeePaymentRequestId)
          ? selectedFeePaymentRequestId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedFeePaymentRequestId(nextRequestId)
    } catch (caught) {
      showError(caught, '付费申请加载失败')
    } finally {
      setLoadingFeePaymentRequests(false)
    }
  }

  async function loadFeePayables() {
    setLoadingFeePayables(true)
    setError('')
    try {
      const result = await listFeePayables({
        q: feePayableSearch.trim() || undefined,
        status: feePayableStatusFilter || undefined,
        fee_type: feePayableTypeFilter || undefined,
        partner_id: feePayablePartnerFilter.trim() || undefined,
        shipment_no: feePayableShipmentFilter.trim() || undefined,
      })
      setFeePayables(result.items)
    } catch (caught) {
      showError(caught, '应付费用加载失败')
    } finally {
      setLoadingFeePayables(false)
    }
  }

  async function loadVerificationDocuments(preferredId?: string) {
    setLoadingVerificationDocuments(true)
    setError('')
    try {
      const result = await listVerificationDocuments({
        q: verificationSearch.trim() || undefined,
        status: verificationStatusFilter || undefined,
        owner_user_id: verificationOwnerFilter.trim() || undefined,
        shipment_no: verificationShipmentFilter.trim() || undefined,
        reminder_status: verificationReminderFilter || undefined,
      })
      setVerificationDocuments(result.items)
      const nextDocumentId =
        preferredId ??
        (result.items.some((item) => item.id === selectedVerificationDocumentId)
          ? selectedVerificationDocumentId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedVerificationDocumentId(nextDocumentId)
    } catch (caught) {
      showError(caught, '核销单加载失败')
    } finally {
      setLoadingVerificationDocuments(false)
    }
  }

  async function loadVerificationUsage() {
    setLoadingVerificationUsage(true)
    setError('')
    try {
      const result = await listVerificationUsage({
        q: verificationUsageSearch.trim() || undefined,
        status: verificationUsageStatusFilter || undefined,
        shipment_no: verificationUsageShipmentFilter.trim() || undefined,
        reminder_status: verificationUsageReminderFilter || undefined,
      })
      setVerificationUsage(result.items)
    } catch (caught) {
      showError(caught, '核销单使用情况加载失败')
    } finally {
      setLoadingVerificationUsage(false)
    }
  }

  async function loadMiscFeeItems(preferredId?: string) {
    setLoadingMiscFeeItems(true)
    setError('')
    try {
      const result = await listMiscFeeItems({
        q: miscFeeItemSearch.trim() || undefined,
        category: miscFeeItemCategoryFilter || undefined,
        status: miscFeeItemStatusFilter || undefined,
      })
      setMiscFeeItems(result.items)
      const nextItemId =
        preferredId ??
        (result.items.some((item) => item.id === selectedMiscFeeItemId) ? selectedMiscFeeItemId : null) ??
        result.items[0]?.id ??
        null
      setSelectedMiscFeeItemId(nextItemId)
    } catch (caught) {
      showError(caught, '杂费项目加载失败')
    } finally {
      setLoadingMiscFeeItems(false)
    }
  }

  async function loadMiscFeeAllocations() {
    setLoadingMiscFeeAllocations(true)
    setError('')
    try {
      const result = await listMiscFeeAllocations({
        q: miscFeeAllocationSearch.trim() || undefined,
        category: miscFeeAllocationCategoryFilter || undefined,
        shipment_no: miscFeeAllocationShipmentFilter.trim() || undefined,
        sales_user_id: miscFeeAllocationSalesFilter.trim() || undefined,
      })
      setMiscFeeAllocations(result.items)
    } catch (caught) {
      showError(caught, '杂费分摊加载失败')
    } finally {
      setLoadingMiscFeeAllocations(false)
    }
  }

  async function loadMiscFeeAllocationSummary() {
    setLoadingMiscFeeSummary(true)
    setError('')
    try {
      const result = await listMiscFeeAllocationSummary({
        shipment_no: miscFeeSummaryShipmentFilter.trim() || undefined,
        category: miscFeeSummaryCategoryFilter || undefined,
      })
      setMiscFeeAllocationSummary(result.items)
    } catch (caught) {
      showError(caught, '杂费分摊汇总加载失败')
    } finally {
      setLoadingMiscFeeSummary(false)
    }
  }

  async function loadFinancialSettlements(preferredId?: string) {
    setLoadingFinancialSettlements(true)
    setError('')
    try {
      const result = await listFinancialSettlements({
        q: settlementSearch.trim() || undefined,
        status: 'locked',
        shipment_no: settlementShipmentFilter.trim() || undefined,
      })
      setFinancialSettlements(result.items)
      const nextSettlementId =
        preferredId ??
        (result.items.some((item) => item.id === selectedFinancialSettlementId)
          ? selectedFinancialSettlementId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedFinancialSettlementId(nextSettlementId)
    } catch (caught) {
      showError(caught, '财务结算加载失败')
    } finally {
      setLoadingFinancialSettlements(false)
    }
  }

  async function loadProfitCalculations() {
    setLoadingProfitCalculations(true)
    setError('')
    try {
      const result = await listProfitCalculations({
        q: profitCalculationSearch.trim() || undefined,
        shipment_no: profitCalculationShipmentFilter.trim() || undefined,
      })
      setProfitCalculations(result.items)
    } catch (caught) {
      showError(caught, '利润核算加载失败')
    } finally {
      setLoadingProfitCalculations(false)
    }
  }

  async function loadReimbursements(preferredId?: string) {
    setLoadingReimbursements(true)
    setError('')
    try {
      const result = await listReimbursements({
        q: reimbursementSearch.trim() || undefined,
        status: reimbursementStatusFilter || undefined,
        category: reimbursementCategoryFilter || undefined,
      })
      setReimbursements(result.items)
      setReimbursementsTotalAmount(result.total_amount)
      const nextId =
        preferredId ??
        (result.items.some((item) => item.id === selectedReimbursementId)
          ? selectedReimbursementId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedReimbursementId(nextId)
    } catch (caught) {
      showError(caught, '报销单加载失败')
    } finally {
      setLoadingReimbursements(false)
    }
  }

  async function submitReimbursement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingReimbursement(true)
    setMessage('')
    setError('')
    try {
      const payload: ReimbursementCreatePayload = {
        reimbursement_no: reimbursementForm.reimbursement_no.trim(),
        applicant_user_id: reimbursementForm.applicant_user_id.trim(),
        applicant_user_name: reimbursementForm.applicant_user_name.trim(),
        department: reimbursementForm.department.trim(),
        category: reimbursementForm.category,
        currency: reimbursementForm.currency.trim(),
        amount: reimbursementForm.amount.trim(),
        reason: reimbursementForm.reason.trim() || undefined,
        remark: reimbursementForm.remark.trim() || undefined,
      }
      const created = await createReimbursement(payload)
      setMessage(`已登记报销单 ${created.reimbursement_no}`)
      setReimbursementForm({
        reimbursement_no: '',
        applicant_user_id: '',
        applicant_user_name: '',
        department: '',
        category: 'travel',
        currency: 'CNY',
        amount: '',
        reason: '',
        remark: '',
      })
      await loadReimbursements(created.id)
    } catch (caught) {
      showError(caught, '报销单登记失败')
    } finally {
      setSubmittingReimbursement(false)
    }
  }

  async function handleReimbursementApprove(approved: boolean) {
    if (!selectedReimbursementId) return
    setSubmittingReimbursementAction(true)
    setMessage('')
    setError('')
    try {
      const updated = await approveReimbursement(selectedReimbursementId, { approved })
      setMessage(`报销单 ${updated.reimbursement_no} 已${approved ? '审批通过' : '驳回'}`)
      await loadReimbursements(updated.id)
    } catch (caught) {
      showError(caught, '报销单审批失败')
    } finally {
      setSubmittingReimbursementAction(false)
    }
  }

  async function handleReimbursementPay() {
    if (!selectedReimbursementId) return
    setSubmittingReimbursementAction(true)
    setMessage('')
    setError('')
    try {
      const updated = await payReimbursement(selectedReimbursementId, {
        payment_method: reimbursementPayMethod,
      })
      setMessage(`报销单 ${updated.reimbursement_no} 已付款`)
      await loadReimbursements(updated.id)
    } catch (caught) {
      showError(caught, '报销单付款失败')
    } finally {
      setSubmittingReimbursementAction(false)
    }
  }

  async function loadPortImportBatches() {
    setLoadingPortBatches(true)
    setError('')
    try {
      const result = await listPortImportBatches({
        source: portBatchSourceFilter.trim() || undefined,
      })
      setPortImportBatches(result.items)
    } catch (caught) {
      showError(caught, '口岸导入批次加载失败')
    } finally {
      setLoadingPortBatches(false)
    }
  }

  async function loadCustomsRecords() {
    setLoadingCustomsRecords(true)
    setError('')
    try {
      const result = await listCustomsDeclarationRecords({
        declaration_no: customsDeclarationFilter.trim() || undefined,
        customs_receipt_no: customsReceiptFilter.trim() || undefined,
        trade_type: customsTradeTypeFilter || undefined,
      })
      setCustomsRecords(result.items)
    } catch (caught) {
      showError(caught, '进出口报关数据加载失败')
    } finally {
      setLoadingCustomsRecords(false)
    }
  }

  async function submitPortBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingPortBatch(true)
    setMessage('')
    setError('')
    try {
      const record: CustomsDeclarationRecordCreatePayload = {
        declaration_no: portRecordForm.declaration_no.trim(),
        customs_receipt_no: portRecordForm.customs_receipt_no.trim() || undefined,
        trade_type: portRecordForm.trade_type,
        export_contract_no: portRecordForm.export_contract_no.trim() || undefined,
        customs_date: portRecordForm.customs_date || undefined,
        product_name: portRecordForm.product_name.trim(),
        hs_code: portRecordForm.hs_code.trim() || undefined,
        quantity: portRecordForm.quantity.trim() || undefined,
        unit: portRecordForm.unit.trim() || undefined,
        amount: portRecordForm.amount.trim(),
        currency: portRecordForm.currency.trim(),
        customer_or_supplier: portRecordForm.customer_or_supplier.trim() || undefined,
      }
      const payload: PortImportBatchCreatePayload = {
        batch_no: portBatchForm.batch_no.trim(),
        source: portBatchForm.source.trim(),
        imported_at: portBatchForm.imported_at,
        record_count: 1,
        remark: portBatchForm.remark.trim() || undefined,
        records: [record],
      }
      const created = await createPortImportBatch(payload)
      setMessage(`已导入口岸数据批次 ${created.batch_no}`)
      setPortBatchForm({ batch_no: '', source: '', imported_at: '', remark: '' })
      setPortRecordForm({
        declaration_no: '',
        customs_receipt_no: '',
        trade_type: 'export',
        export_contract_no: '',
        customs_date: '',
        product_name: '',
        hs_code: '',
        quantity: '',
        unit: '',
        amount: '',
        currency: 'USD',
        customer_or_supplier: '',
      })
      await loadPortImportBatches()
      await loadCustomsRecords()
    } catch (caught) {
      showError(caught, '口岸数据导入失败')
    } finally {
      setSubmittingPortBatch(false)
    }
  }

  function financeReportFilters(report: string) {
    const base = {
      date_from: reportDateFrom || undefined,
      date_to: reportDateTo || undefined,
      currency: reportCurrency.trim() || undefined,
    }
    if (report === 'receipt-usage') {
      return { ...base, receipt_no: reportReceiptNo.trim() || undefined }
    }
    if (report === 'bank-receipt-summary') {
      return { ...base, receipt_type: reportReceiptType.trim() || undefined }
    }
    if (report === 'goods-payment') {
      return {
        ...base,
        supplier_name: reportSupplierName.trim() || undefined,
        status: reportStatus.trim() || undefined,
      }
    }
    if (report === 'fee-payment') {
      return {
        ...base,
        partner_name: reportPartnerName.trim() || undefined,
        fee_type: reportFeeType.trim() || undefined,
        sales_user_id: reportSalesUserId.trim() || undefined,
        status: reportStatus.trim() || undefined,
      }
    }
    if (report === 'customs-receipt-collection') {
      return {
        date_from: reportDateFrom || undefined,
        date_to: reportDateTo || undefined,
        owner_user_id: reportOwnerUserId.trim() || undefined,
        reminder_status: reportReminderStatus.trim() || undefined,
        include_registered: reportIncludeRegistered,
      }
    }
    return { ...base, status: reportStatus.trim() || undefined }
  }

  async function loadFinanceReport(report: string) {
    setLoadingReport(true)
    setError('')
    setReportDrilldown(null)
    const filters = financeReportFilters(report)
    try {
      if (report === 'receipt-usage') {
        setReceiptUsageReport(await getReceiptUsageReport(filters))
      } else if (report === 'bank-receipt-summary') {
        setBankReceiptSummaryReport(await getBankReceiptSummaryReport(filters))
      } else if (report === 'goods-payment') {
        setGoodsPaymentReport(await getGoodsPaymentReport(filters))
      } else if (report === 'fee-payment') {
        setFeePaymentReport(await getFeePaymentReport(filters))
      } else if (report === 'customs-receipt-collection') {
        setCustomsCollectionReport(await getCustomsReceiptCollectionReport(filters))
      } else if (report === 'tax-refund-statistics') {
        setTaxRefundStatisticsReport(await getTaxRefundStatisticsReport(filters))
      }
    } catch (caught) {
      showError(caught, '财务报表加载失败')
    } finally {
      setLoadingReport(false)
    }
  }

  async function exportFinanceReport(report: string) {
    setExportingReport(true)
    setMessage('')
    setError('')
    const filters = financeReportFilters(report)
    try {
      const exported =
        report === 'receipt-usage'
          ? await exportReceiptUsageReport(filters)
          : report === 'bank-receipt-summary'
            ? await exportBankReceiptSummaryReport(filters)
            : report === 'goods-payment'
              ? await exportGoodsPaymentReport(filters)
              : report === 'fee-payment'
                ? await exportFeePaymentReport(filters)
                : report === 'customs-receipt-collection'
                  ? await exportCustomsReceiptCollectionReport(filters)
                  : await exportTaxRefundStatisticsReport(filters)
      downloadCsv(exported.filename, exported.content)
      setMessage(`已导出 ${exported.total} 行财务报表`)
    } catch (caught) {
      showError(caught, '财务报表导出失败')
    } finally {
      setExportingReport(false)
    }
  }

  async function loadReportExplanation(report: string) {
    setLoadingReportExplanation(true)
    setError('')
    try {
      setReportExplanation(await explainFinanceReport(report))
    } catch (caught) {
      showError(caught, '报表口径加载失败')
    } finally {
      setLoadingReportExplanation(false)
    }
  }

  async function openFinanceReportDrilldown(report: string, sourceNo: string) {
    setError('')
    try {
      setReportDrilldown(await drilldownFinanceReport(report, sourceNo))
    } catch (caught) {
      showError(caught, '报表下钻失败')
    }
  }

  async function autoMatchPortCustomsReceipts() {
    setMatchingCustomsReceipts(true)
    setMessage('')
    setError('')
    try {
      const result = await autoMatchCustomsReceipts()
      setMessage(`已自动匹配 ${result.matched_count} 条报关回单`)
      await loadCustomsRecords()
      await loadFinanceReport('customs-receipt-collection')
    } catch (caught) {
      showError(caught, '报关回单自动匹配失败')
    } finally {
      setMatchingCustomsReceipts(false)
    }
  }

  async function submitReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingReceipt(true)
    setMessage('')
    setError('')
    try {
      const created = await createBankReceipt(bankReceiptPayload(receiptForm))
      setMessage(`已录入银行水单 ${created.receipt_no}`)
      setReceiptForm(initialBankReceiptForm())
      await loadReceipts(created.id)
    } catch (caught) {
      showError(caught, '银行水单录入失败')
    } finally {
      setSubmittingReceipt(false)
    }
  }

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedReceipt) return
    setSubmittingClaim(true)
    setMessage('')
    setError('')
    try {
      const claimed = await claimBankReceipt(selectedReceipt.id, receiptClaimPayload(claimForm))
      setMessage(`已认领银行水单 ${claimed.receipt_no}`)
      setClaimForm(initialReceiptClaimForm())
      setReceipts((current) => current.map((item) => (item.id === claimed.id ? claimed : item)))
      setSelectedReceiptId(claimed.id)
      await loadReceipts(claimed.id)
    } catch (caught) {
      showError(caught, '银行水单认领失败')
    } finally {
      setSubmittingClaim(false)
    }
  }

  async function submitAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedReceipt) return
    setSubmittingAllocation(true)
    setMessage('')
    setError('')
    try {
      const allocated = await allocateBankReceipt(
        selectedReceipt.id,
        receiptAllocationPayload(allocationForm),
      )
      setMessage(`已分摊银行水单 ${allocated.receipt_no}`)
      setAllocationForm(initialReceiptAllocationForm(allocated.currency))
      setReceipts((current) => current.map((item) => (item.id === allocated.id ? allocated : item)))
      setSelectedReceiptId(allocated.id)
      await loadReceipts(allocated.id)
      await loadReceivables()
    } catch (caught) {
      showError(caught, '收款分摊失败')
    } finally {
      setSubmittingAllocation(false)
    }
  }

  async function submitSupplierInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingSupplierInvoice(true)
    setMessage('')
    setError('')
    try {
      const created = await createSupplierInvoice(supplierInvoicePayload(supplierInvoiceForm))
      setMessage(`已登记供应商发票 ${created.invoice_no}`)
      setSupplierInvoiceForm(initialSupplierInvoiceForm())
      await loadSupplierInvoices(created.id)
      await loadPayables()
    } catch (caught) {
      showError(caught, '供应商发票登记失败')
    } finally {
      setSubmittingSupplierInvoice(false)
    }
  }

  async function submitPaymentRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingPaymentRequest(true)
    setMessage('')
    setError('')
    try {
      const created = await createPaymentRequest(paymentRequestPayload(paymentRequestForm))
      setMessage(`已新增付款申请 ${created.request_no}`)
      setPaymentRequestForm(initialPaymentRequestForm(selectedSupplierInvoice ?? undefined))
      await loadPaymentRequests(created.id)
    } catch (caught) {
      showError(caught, '付款申请新增失败')
    } finally {
      setSubmittingPaymentRequest(false)
    }
  }

  async function submitPaymentApproval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPaymentRequest) return
    setSubmittingPaymentApproval(true)
    setMessage('')
    setError('')
    try {
      const approved = await approvePaymentRequest(
        selectedPaymentRequest.id,
        paymentApprovalPayload(paymentApprovalForm),
      )
      setMessage(`已审批付款申请 ${approved.request_no}`)
      setPaymentApprovalForm(initialPaymentApprovalForm())
      await loadPaymentRequests(approved.id)
      await loadSupplierInvoices(selectedSupplierInvoice?.id)
      await loadPayables()
    } catch (caught) {
      showError(caught, '付款审批失败')
    } finally {
      setSubmittingPaymentApproval(false)
    }
  }

  async function submitPartnerFeeInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingPartnerFeeInvoice(true)
    setMessage('')
    setError('')
    try {
      const created = await createPartnerFeeInvoice(partnerFeeInvoicePayload(partnerFeeInvoiceForm))
      setMessage(`已登记合作伙伴费用发票 ${created.invoice_no}`)
      setPartnerFeeInvoiceForm(initialPartnerFeeInvoiceForm())
      await loadPartnerFeeInvoices(created.id)
      await loadFeePayables()
    } catch (caught) {
      showError(caught, '合作伙伴费用发票登记失败')
    } finally {
      setSubmittingPartnerFeeInvoice(false)
    }
  }

  async function submitFeePaymentRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingFeePaymentRequest(true)
    setMessage('')
    setError('')
    try {
      const created = await createFeePaymentRequest(feePaymentRequestPayload(feePaymentRequestForm))
      setMessage(`已新增付费申请 ${created.request_no}`)
      setFeePaymentRequestForm(initialFeePaymentRequestForm(selectedPartnerFeeInvoice ?? undefined))
      await loadFeePaymentRequests(created.id)
    } catch (caught) {
      showError(caught, '付费申请新增失败')
    } finally {
      setSubmittingFeePaymentRequest(false)
    }
  }

  async function submitFeePaymentApproval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedFeePaymentRequest) return
    setSubmittingFeePaymentApproval(true)
    setMessage('')
    setError('')
    try {
      const approved = await approveFeePaymentRequest(
        selectedFeePaymentRequest.id,
        feePaymentApprovalPayload(feePaymentApprovalForm),
      )
      setMessage(`已审批付费申请 ${approved.request_no}`)
      setFeePaymentApprovalForm(initialFeePaymentApprovalForm())
      await loadFeePaymentRequests(approved.id)
      await loadPartnerFeeInvoices(selectedPartnerFeeInvoice?.id)
      await loadFeePayables()
    } catch (caught) {
      showError(caught, '付费审批失败')
    } finally {
      setSubmittingFeePaymentApproval(false)
    }
  }

  async function submitVerificationDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingVerificationDocument(true)
    setMessage('')
    setError('')
    try {
      const created = await createVerificationDocument(
        verificationDocumentPayload(verificationDocumentForm),
      )
      setMessage(`已领用核销单 ${created.document_no}`)
      setVerificationDocumentForm(initialVerificationDocumentForm())
      await loadVerificationDocuments(created.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, '核销单领用失败')
    } finally {
      setSubmittingVerificationDocument(false)
    }
  }

  async function submitCustomsReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingCustomsReceipt(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerVerificationCustomsReceipt(
        selectedVerificationDocument.id,
        customsReceiptPayload(customsReceiptForm),
      )
      setMessage(`已登记报关回单 ${updated.customs_receipt_no ?? updated.document_no}`)
      setCustomsReceiptForm(initialCustomsReceiptForm())
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, '报关回单登记失败')
    } finally {
      setSubmittingCustomsReceipt(false)
    }
  }

  async function submitVerificationRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingVerificationRegister(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerVerification(
        selectedVerificationDocument.id,
        verificationRegisterPayload(verificationRegisterForm),
      )
      setMessage(`已核销 ${updated.document_no}`)
      setVerificationRegisterForm(initialVerificationRegisterForm())
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, '核销登记失败')
    } finally {
      setSubmittingVerificationRegister(false)
    }
  }

  async function submitTaxRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingTaxRefund(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerTaxRefund(
        selectedVerificationDocument.id,
        taxRefundPayload(taxRefundForm),
      )
      setMessage(`已登记退税 ${updated.document_no}`)
      setTaxRefundForm(initialTaxRefundForm(updated.currency, updated.unrefunded_amount))
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
      await loadOverview()
    } catch (caught) {
      showError(caught, '退税登记失败')
    } finally {
      setSubmittingTaxRefund(false)
    }
  }

  async function submitMiscFeeItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingMiscFeeItem(true)
    setMessage('')
    setError('')
    try {
      const created = await createMiscFeeItem(miscFeeItemPayload(miscFeeItemForm))
      setMessage(`已配置杂费项目 ${created.name}`)
      setMiscFeeItemForm(initialMiscFeeItemForm())
      await loadMiscFeeItems(created.id)
    } catch (caught) {
      showError(caught, '杂费项目配置失败')
    } finally {
      setSubmittingMiscFeeItem(false)
    }
  }

  async function submitMiscFeeAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingMiscFeeAllocation(true)
    setMessage('')
    setError('')
    try {
      const created = await createMiscFeeAllocation(
        miscFeeAllocationPayload(miscFeeAllocationForm, selectedMiscFeeItem),
      )
      setMessage(`已分摊杂费 ${created.allocation_no}`)
      setMiscFeeAllocationForm(initialMiscFeeAllocationForm(selectedMiscFeeItem ?? undefined))
      await loadMiscFeeAllocations()
      await loadMiscFeeAllocationSummary()
      await loadOverview()
    } catch (caught) {
      showError(caught, '杂费分摊失败')
    } finally {
      setSubmittingMiscFeeAllocation(false)
    }
  }

  async function submitFinancialSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingSettlement(true)
    setMessage('')
    setError('')
    try {
      const created = await createFinancialSettlement(financialSettlementPayload(settlementForm))
      setMessage(`已锁定财务结算 ${created.settlement_no}`)
      setSettlementForm(initialFinancialSettlementForm())
      await loadFinancialSettlements(created.id)
      await loadProfitCalculations()
      await loadOverview()
    } catch (caught) {
      showError(caught, '财务结算锁定失败')
    } finally {
      setSubmittingSettlement(false)
    }
  }

  async function submitManualProfitCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedFinancialSettlement) return
    setSubmittingManualProfitCost(true)
    setMessage('')
    setError('')
    try {
      const updated = await addManualProfitCost(
        selectedFinancialSettlement.id,
        manualProfitCostPayload(manualProfitCostForm),
      )
      setMessage(`已关联手工成本 ${manualProfitCostForm.cost_no}`)
      setManualProfitCostForm(
        initialManualProfitCostForm(updated.currency, updated.settlement_date),
      )
      await loadFinancialSettlements(updated.id)
      await loadProfitCalculations()
    } catch (caught) {
      showError(caught, '手工成本关联失败')
    } finally {
      setSubmittingManualProfitCost(false)
    }
  }

  const summary = overview?.summary
  const currencyLabel = summary?.currency_label ?? '-'
  const profitAmount = Number(summary?.profit_amount ?? 0)
  const totalReceiptAmount = receipts.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalUnallocatedAmount = receipts.reduce((sum, item) => sum + Number(item.unallocated_amount || 0), 0)
  const selectedReceiptCanClaim = selectedReceipt?.status === 'unclaimed'
  const selectedReceiptCanAllocate = selectedReceipt
    ? selectedReceipt.status !== 'unclaimed' && Number(selectedReceipt.unallocated_amount) > 0
    : false
  const selectedPaymentRequestCanApprove = selectedPaymentRequest?.status === 'submitted'
  const selectedFeePaymentRequestCanApprove = selectedFeePaymentRequest?.status === 'submitted'
  const selectedVerificationCanRegisterCustoms =
    selectedVerificationDocument?.status === 'issued' ||
    selectedVerificationDocument?.status === 'customs_receipt_registered'
  const selectedVerificationCanVerify =
    selectedVerificationDocument?.status === 'customs_receipt_registered' ||
    selectedVerificationDocument?.status === 'verified'
  const selectedVerificationCanRefund =
    selectedVerificationDocument?.status === 'verified' ||
    (selectedVerificationDocument?.status === 'refunded' &&
      Number(selectedVerificationDocument.unrefunded_amount) > 0)
  const totalMiscFeeAmount = miscFeeAllocationSummary.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  )
  const totalSettlementSalesIncome = financialSettlements.reduce(
    (sum, item) => sum + Number(item.sales_income || 0),
    0,
  )
  const totalSettlementGrossProfit = financialSettlements.reduce(
    (sum, item) => sum + Number(item.gross_profit || 0),
    0,
  )
  const totalProfitCalculationGrossProfit = profitCalculations.reduce(
    (sum, item) => sum + Number(item.gross_profit || 0),
    0,
  )

  const summaryStrip = (
    <div className="summary-strip" aria-label="财务管理概览">
      <Metric label="出货单" value={summary?.shipment_count ?? 0} />
      <Metric label="应收金额" value={formatFinanceAmount(summary?.receivable_amount, currencyLabel)} />
      <Metric label="应付成本" value={formatFinanceAmount(summary?.payable_amount, currencyLabel)} />
      <Metric
        label="预计利润"
        value={formatFinanceAmount(summary?.profit_amount, currencyLabel)}
        intent={profitAmount < 0 ? 'danger' : 'normal'}
      />
      <Metric label="开票通知" value={summary?.invoice_notice_count ?? 0} />
      <Metric label="样品费用" value={formatFinanceAmount(summary?.sample_fee_amount, '多币种')} />
    </div>
  )

  const moduleAlerts = (
    <>
      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}
    </>
  )

  const financeModuleCards: {
    module: FinanceModule
    icon: ReactNode
    title: string
    caption: string
    metric: string
    metricLabel: string
  }[] = [
    {
      module: 'overview',
      icon: <BarChart3 size={20} />,
      title: '经营总览',
      caption: '出运利润 / 分币种 / 状态汇总',
      metric: formatFinanceAmount(summary?.profit_amount, currencyLabel),
      metricLabel: '预计利润',
    },
    {
      module: 'receipts',
      icon: <Wallet size={20} />,
      title: '收款管理',
      caption: '银行水单认领、分摊与应收账款',
      metric: formatFinanceAmount(summary?.receivable_amount, currencyLabel),
      metricLabel: '应收金额',
    },
    {
      module: 'payments',
      icon: <Coins size={20} />,
      title: '付款管理',
      caption: '供应商发票、付款申请与应付账款',
      metric: formatFinanceAmount(summary?.payable_amount, currencyLabel),
      metricLabel: '应付成本',
    },
    {
      module: 'fees',
      icon: <Handshake size={20} />,
      title: '付费管理',
      caption: '合作伙伴费用发票、付费申请与审批',
      metric: String(summary?.active_partner_count ?? 0),
      metricLabel: '启用伙伴',
    },
    {
      module: 'tax',
      icon: <ShieldCheck size={20} />,
      title: '核销退税',
      caption: '核销单领用、回单核销与退税登记',
      metric: String(verificationDocuments.length),
      metricLabel: '核销单',
    },
    {
      module: 'misc',
      icon: <FileStack size={20} />,
      title: '杂费管理',
      caption: '杂费项目配置与单票分摊查询',
      metric: String(miscFeeItems.length),
      metricLabel: '杂费项目',
    },
    {
      module: 'settlement',
      icon: <PackagePlus size={20} />,
      title: '结算核算',
      caption: '单票结算锁定、手工成本与利润核算',
      metric: String(financialSettlements.length),
      metricLabel: '锁定结算',
    },
    {
      module: 'reimbursements',
      icon: <Receipt size={20} />,
      title: '报销管理',
      caption: '员工报销单登记、审批与付款',
      metric: String(reimbursements.length),
      metricLabel: '报销单',
    },
    {
      module: 'portData',
      icon: <Ship size={20} />,
      title: '口岸数据导入',
      caption: '进出口报关数据导入与查询',
      metric: String(portImportBatches.length),
      metricLabel: '导入批次',
    },
    {
      module: 'reports',
      icon: <FileSpreadsheet size={20} />,
      title: '财务报表',
      caption: '水单、收付与退税统计报表',
      metric: '6',
      metricLabel: '报表',
    },
  ]

  if (activeModule === 'home') {
    return (
      <section className="finance-page finance-home">
        <OperationFlowRail
          activeLabel="银行水单"
          activePath={financeReceiptsPath}
          kind="finance"
          onNavigate={onNavigate}
        />

        {summaryStrip}
        {moduleAlerts}

        <section className="finance-module-cards" aria-label="财务模块入口">
          {financeModuleCards.map((card) => (
            <button
              key={card.module}
              className="finance-module-card"
              type="button"
              onClick={() => goModule(card.module)}
            >
              <span className="finance-module-card-icon">{card.icon}</span>
              <span className="finance-module-card-body">
                <strong>{card.title}</strong>
                <small>{card.caption}</small>
              </span>
              <span className="finance-module-card-metric">
                <em>{card.metric}</em>
                <span>{card.metricLabel}</span>
              </span>
              <ChevronRight className="finance-module-card-arrow" size={18} />
            </button>
          ))}
        </section>
      </section>
    )
  }

  const moduleHeader = (
    <div className="finance-subnav">
      <button className="finance-back-button" type="button" onClick={goFinanceHome}>
        <ArrowLeft size={16} />
        财务首页
      </button>
      <nav className="finance-tab-rail" aria-label="财务模块切换">
        {financeModuleCards.map((card) => (
          <button
            key={card.module}
            aria-current={card.module === activeModule ? 'page' : undefined}
            className={card.module === activeModule ? 'finance-tab active' : 'finance-tab'}
            type="button"
            onClick={() => goModule(card.module)}
          >
            {card.title}
          </button>
        ))}
      </nav>
    </div>
  )

  if (activeModule === 'overview') {
    return (
      <section className="finance-page">
        {moduleHeader}
        {summaryStrip}
        {moduleAlerts}
        {loading && !overview ? (
          <section className="workspace-panel">
            <Skeleton active paragraph={{ rows: 8 }} />
          </section>
        ) : (
          <section className="finance-grid">
          <section className="workspace-panel finance-profit-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Wallet size={18} />} title="出运利润明细" />
            </div>
            <Table<FinanceShipmentProfit>
              columns={[
                { title: '出货单', dataIndex: 'code', render: (value: string) => <strong>{value}</strong> },
                { title: '客户', dataIndex: 'customer_name' },
                { title: '状态', dataIndex: 'approval_status', render: shipmentStatusLabel },
                { title: '出货日期', dataIndex: 'shipment_date', render: formatDate },
                { title: '计划出运', dataIndex: 'planned_ship_date', render: formatDate },
                {
                  title: '应收',
                  dataIndex: 'receivable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '应付',
                  dataIndex: 'payable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '利润',
                  dataIndex: 'profit_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '利润率', dataIndex: 'profit_rate', render: formatPercent },
              ]}
              dataSource={overview?.shipment_profit_items ?? []}
              loading={loading}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </section>

          <section className="workspace-panel finance-side-panel">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="分币种汇总" />
            <Table<FinanceCurrencySummary>
              columns={[
                { title: '币种', dataIndex: 'currency' },
                { title: '出货', dataIndex: 'shipment_count' },
                {
                  title: '应收',
                  dataIndex: 'receivable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '利润',
                  dataIndex: 'profit_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '利润率', dataIndex: 'profit_rate', render: formatPercent },
              ]}
              dataSource={overview?.currency_summaries ?? []}
              pagination={false}
              rowKey="currency"
              size="small"
            />
          </section>

          <section className="workspace-panel finance-side-panel">
            <PanelTitle icon={<CheckCircle2 size={18} />} title="开票和付款状态" />
            <div className="finance-status-stack">
              <div>
                <strong>采购开票通知</strong>
                <Table<FinanceStatusAmount>
                  columns={[
                    { title: '状态', dataIndex: 'status', render: purchaseInvoiceNoticeStatusLabel },
                    { title: '数量', dataIndex: 'count' },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      render: (value: string, record) => formatFinanceAmount(value, record.currency),
                    },
                  ]}
                  dataSource={overview?.invoice_notice_statuses ?? []}
                  pagination={false}
                  rowKey={(record) => `${record.status}-${record.currency}`}
                  size="small"
                />
              </div>
              <div>
                <strong>样品费用付款</strong>
                <Table<FinanceStatusAmount>
                  columns={[
                    { title: '状态', dataIndex: 'status', render: samplePaymentStatusLabel },
                    { title: '数量', dataIndex: 'count' },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      render: (value: string, record) => formatFinanceAmount(value, record.currency),
                    },
                  ]}
                  dataSource={overview?.sample_fee_statuses ?? []}
                  pagination={false}
                  rowKey={(record) => `${record.status}-${record.currency}`}
                  size="small"
                />
              </div>
            </div>
          </section>

          <section className="workspace-panel finance-side-panel">
            <PanelTitle icon={<ShieldCheck size={18} />} title="合作伙伴费用入口" />
            <dl className="finance-compact-list">
              <div>
                <dt>合作伙伴</dt>
                <dd>{summary?.partner_count ?? 0}</dd>
              </div>
              <div>
                <dt>启用伙伴</dt>
                <dd>{summary?.active_partner_count ?? 0}</dd>
              </div>
              <div>
                <dt>待收税票金额</dt>
                <dd>{formatFinanceAmount(summary?.invoice_notice_amount, '多币种')}</dd>
              </div>
            </dl>
            <Table<FinancePartnerTypeSummary>
              columns={[
                { title: '伙伴类型', dataIndex: 'partner_type', render: partnerTypeLabel },
                { title: '数量', dataIndex: 'count' },
              ]}
              dataSource={overview?.partner_type_summaries ?? []}
              pagination={false}
              rowKey="partner_type"
              size="small"
            />
          </section>
        </section>
        )}
      </section>
    )
  }

  if (activeModule === 'receipts') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('receipts')}>
              <ArrowLeft size={16} />
              收款管理
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-receipt-grid'}
          aria-label="收款管理"
        >
        {!detailId ? (
        <section className="workspace-panel finance-receipt-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="银行水单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadReceipts()
              }}
            >
              <label>
                水单搜索
                <Input
                  value={receiptSearch}
                  placeholder="水单号 / 付款人 / 客户"
                  onChange={(event) => setReceiptSearch(event.target.value)}
                />
              </label>
              <label>
                水单状态
                <FormSelect
                  value={receiptStatusFilter}
                  onChange={(event) => setReceiptStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {receiptStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                客户标识
                <Input
                  value={receiptCustomerFilter}
                  placeholder="customer-id"
                  onChange={(event) => setReceiptCustomerFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>

          <div className="finance-receipt-strip">
            <span>本次列表 {receipts.length} 条</span>
            <strong>{formatFinanceAmount(totalReceiptAmount.toFixed(2), receipts[0]?.currency ?? 'USD')}</strong>
            <span>未分摊 {formatFinanceAmount(totalUnallocatedAmount.toFixed(2), receipts[0]?.currency ?? 'USD')}</span>
          </div>

          <Table<BankReceipt>
            columns={[
              {
                title: '水单号',
                dataIndex: 'receipt_no',
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: receiptStatusTag },
              { title: '性质', dataIndex: 'receipt_type', render: receiptTypeLabel },
              { title: '收款日', dataIndex: 'received_at', render: formatDate },
              { title: '付款人', dataIndex: 'payer_name' },
              { title: '客户', dataIndex: 'customer_name', render: nullableText },
              {
                title: '金额',
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '未分摊',
                dataIndex: 'unallocated_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={receipts}
            loading={loadingReceipts}
            pagination={false}
            rowClassName={(record) => (record.id === selectedReceipt?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedReceiptId(record.id)
                setAllocationForm(initialReceiptAllocationForm(record.currency))
                goDetail('receipts', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-receipt-form-panel">
          <PanelTitle icon={<Wallet size={18} />} title="水单录入" />
          <form className="record-form" onSubmit={submitReceipt}>
            <div className="form-pair two">
              <label>
                银行水单号
                <Input
                  value={receiptForm.receipt_no}
                  onChange={(event) => setReceiptForm({ ...receiptForm, receipt_no: event.target.value })}
                />
              </label>
              <label>
                收款日期
                <Input
                  type="date"
                  value={receiptForm.received_at}
                  onChange={(event) => setReceiptForm({ ...receiptForm, received_at: event.target.value })}
                />
              </label>
            </div>
            <label>
              付款人
              <Input
                value={receiptForm.payer_name}
                onChange={(event) => setReceiptForm({ ...receiptForm, payer_name: event.target.value })}
              />
            </label>
            <div className="form-pair two">
              <label>
                客户标识
                <Input
                  value={receiptForm.customer_id}
                  onChange={(event) => setReceiptForm({ ...receiptForm, customer_id: event.target.value })}
                />
              </label>
              <label>
                客户名称
                <Input
                  value={receiptForm.customer_name}
                  onChange={(event) => setReceiptForm({ ...receiptForm, customer_name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                收款金额
                <Input
                  value={receiptForm.amount}
                  onChange={(event) => setReceiptForm({ ...receiptForm, amount: event.target.value })}
                />
              </label>
              <label>
                币种
                <Input
                  value={receiptForm.currency}
                  onChange={(event) => setReceiptForm({ ...receiptForm, currency: event.target.value })}
                />
              </label>
              <label>
                收款性质
                <FormSelect
                  value={receiptForm.receipt_type}
                  onChange={(event) => setReceiptForm({ ...receiptForm, receipt_type: event.target.value })}
                >
                  {receiptTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <label>
              收款银行账号
              <Input
                value={receiptForm.bank_account}
                onChange={(event) => setReceiptForm({ ...receiptForm, bank_account: event.target.value })}
              />
            </label>
            <label>
              银行流水号
              <Input
                value={receiptForm.reference_no}
                onChange={(event) => setReceiptForm({ ...receiptForm, reference_no: event.target.value })}
              />
            </label>
            <label>
              备注
              <Input.TextArea
                rows={2}
                value={receiptForm.remark}
                onChange={(event) => setReceiptForm({ ...receiptForm, remark: event.target.value })}
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingReceipt}>
              保存水单
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-receipt-detail-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="认领和分摊" />
          {selectedReceipt ? (
            <>
              <dl className="detail-list finance-receipt-detail-list">
                <div>
                  <dt>当前水单</dt>
                  <dd>{selectedReceipt.receipt_no}</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{receiptStatusLabel(selectedReceipt.status)}</dd>
                </div>
                <div>
                  <dt>已分摊</dt>
                  <dd>{formatFinanceAmount(selectedReceipt.allocated_amount, selectedReceipt.currency)}</dd>
                </div>
                <div>
                  <dt>未分摊</dt>
                  <dd>{formatFinanceAmount(selectedReceipt.unallocated_amount, selectedReceipt.currency)}</dd>
                </div>
              </dl>
              <div className="finance-receipt-actions">
                <form className="record-form compact-section" onSubmit={submitClaim}>
                  <div className="form-divider">水单认领</div>
                  <div className="form-pair two">
                    <label>
                      认领日期
                      <Input
                        type="date"
                        value={claimForm.claimed_at}
                        onChange={(event) => setClaimForm({ ...claimForm, claimed_at: event.target.value })}
                      />
                    </label>
                    <label>
                      业务员标识
                      <Input
                        value={claimForm.sales_user_id}
                        onChange={(event) => setClaimForm({ ...claimForm, sales_user_id: event.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    业务员姓名
                    <Input
                      value={claimForm.sales_user_name}
                      onChange={(event) => setClaimForm({ ...claimForm, sales_user_name: event.target.value })}
                    />
                  </label>
                  <label>
                    认领说明
                    <Input
                      value={claimForm.note}
                      onChange={(event) => setClaimForm({ ...claimForm, note: event.target.value })}
                    />
                  </label>
                  <Button
                    htmlType="submit"
                    icon={<CheckCircle2 size={16} />}
                    loading={submittingClaim}
                    disabled={!selectedReceiptCanClaim}
                  >
                    确认认领
                  </Button>
                </form>

                <form className="record-form compact-section" onSubmit={submitAllocation}>
                  <div className="form-divider">收款分摊</div>
                  <div className="form-pair two">
                    <label>
                      分摊类型
                      <FormSelect
                        value={allocationForm.allocation_type}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, allocation_type: event.target.value })
                        }
                      >
                        {allocationTypeOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </FormSelect>
                    </label>
                    <label>
                      分摊日期
                      <Input
                        type="date"
                        value={allocationForm.allocated_at}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, allocated_at: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair two">
                    <label>
                      出口合同标识
                      <Input
                        value={allocationForm.contract_id}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, contract_id: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      出口合同号
                      <Input
                        value={allocationForm.contract_no}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, contract_no: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="form-pair three">
                    <label>
                      发票号
                      <Input
                        value={allocationForm.invoice_no}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, invoice_no: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      分摊金额
                      <Input
                        value={allocationForm.amount}
                        onChange={(event) => setAllocationForm({ ...allocationForm, amount: event.target.value })}
                      />
                    </label>
                    <label>
                      币种
                      <Input
                        value={allocationForm.currency}
                        onChange={(event) => setAllocationForm({ ...allocationForm, currency: event.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    分摊备注
                    <Input
                      value={allocationForm.remark}
                      onChange={(event) => setAllocationForm({ ...allocationForm, remark: event.target.value })}
                    />
                  </label>
                  <Button
                    htmlType="submit"
                    icon={<Save size={16} />}
                    loading={submittingAllocation}
                    disabled={!selectedReceiptCanAllocate}
                  >
                    保存分摊
                  </Button>
                </form>
              </div>
              {selectedReceipt.allocations.length > 0 ? (
                <section className="finance-allocation-history">
                  <strong>分摊记录</strong>
                  <Table<BankReceipt['allocations'][number]>
                    columns={[
                      { title: '类型', dataIndex: 'allocation_type', render: allocationTypeLabel },
                      { title: '合同号', dataIndex: 'contract_no', render: nullableText },
                      { title: '发票号', dataIndex: 'invoice_no', render: nullableText },
                      {
                        title: '金额',
                        dataIndex: 'amount',
                        render: (value: string, record) => formatFinanceAmount(value, record.currency),
                      },
                      { title: '日期', dataIndex: 'allocated_at', render: formatDate },
                    ]}
                    dataSource={selectedReceipt.allocations}
                    pagination={false}
                    rowKey="id"
                    size="small"
                  />
                </section>
              ) : null}
            </>
          ) : (
            <div className="module-state">暂无银行水单</div>
          )}
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-receivable-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="应收账款查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadReceivables()
              }}
            >
              <label>
                应收搜索
                <Input
                  value={receivableSearch}
                  placeholder="合同号 / 客户 / 报价号"
                  onChange={(event) => setReceivableSearch(event.target.value)}
                />
              </label>
              <label>
                出口合同号
                <Input
                  value={receivableContractFilter}
                  onChange={(event) => setReceivableContractFilter(event.target.value)}
                />
              </label>
              <label>
                发票号
                <Input
                  value={receivableInvoiceFilter}
                  onChange={(event) => setReceivableInvoiceFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<ReceivableItem>
            columns={[
              { title: '出口合同', dataIndex: 'contract_no', render: (value: string) => <strong>{value}</strong> },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '业务员', dataIndex: 'sales_user_name', render: nullableText },
              {
                title: '合同金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已收款',
                dataIndex: 'received_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '应收余额',
                dataIndex: 'receivable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '状态', dataIndex: 'status', render: receivableStatusTag },
            ]}
            dataSource={receivables}
            loading={loadingReceivables}
            pagination={false}
            rowKey="contract_id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'payments') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('payments')}>
              <ArrowLeft size={16} />
              付款管理
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-payment-grid'}
          aria-label="付款管理"
        >
        {!detailId ? (
        <section className="workspace-panel finance-payment-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Search size={18} />} title="供应商发票列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadSupplierInvoices()
              }}
            >
              <label>
                发票搜索
                <Input value={invoiceSearch} onChange={(event) => setInvoiceSearch(event.target.value)} />
              </label>
              <label>
                付款状态
                <FormSelect
                  value={invoiceStatusFilter}
                  onChange={(event) => setInvoiceStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {supplierInvoiceStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                供应商标识
                <Input
                  value={invoiceSupplierFilter}
                  onChange={(event) => setInvoiceSupplierFilter(event.target.value)}
                />
              </label>
              <label>
                采购合同号
                <Input
                  value={invoiceContractFilter}
                  onChange={(event) => setInvoiceContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<SupplierInvoice>
            columns={[
              {
                title: '供应商发票',
                dataIndex: 'invoice_no',
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: supplierInvoiceStatusTag },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '采购合同', dataIndex: 'purchase_contract_no', render: nullableText },
              {
                title: '发票金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '未付',
                dataIndex: 'unpaid_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={supplierInvoices}
            loading={loadingSupplierInvoices}
            pagination={false}
            rowClassName={(record) => (record.id === selectedSupplierInvoice?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedSupplierInvoiceId(record.id)
                setPaymentRequestForm(initialPaymentRequestForm(record))
                setPaymentApprovalForm(initialPaymentApprovalForm(record.unpaid_amount))
                goDetail('payments', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-payment-form-panel">
          <PanelTitle icon={<Wallet size={18} />} title="供应商发票登记" />
          <form className="record-form" onSubmit={submitSupplierInvoice}>
            <div className="form-pair two">
              <label>
                供应商发票号
                <Input
                  value={supplierInvoiceForm.invoice_no}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, invoice_no: event.target.value })
                  }
                />
              </label>
              <label>
                发票日期
                <Input
                  type="date"
                  value={supplierInvoiceForm.invoice_date}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, invoice_date: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                供应商标识
                <Input
                  value={supplierInvoiceForm.supplier_id}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, supplier_id: event.target.value })
                  }
                />
              </label>
              <label>
                供应商名称
                <Input
                  value={supplierInvoiceForm.supplier_name}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, supplier_name: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                开票通知标识
                <Input
                  value={supplierInvoiceForm.purchase_invoice_notice_id}
                  onChange={(event) =>
                    setSupplierInvoiceForm({
                      ...supplierInvoiceForm,
                      purchase_invoice_notice_id: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                开票通知编号
                <Input
                  value={supplierInvoiceForm.purchase_invoice_notice_code}
                  onChange={(event) =>
                    setSupplierInvoiceForm({
                      ...supplierInvoiceForm,
                      purchase_invoice_notice_code: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                采购合同标识
                <Input
                  value={supplierInvoiceForm.purchase_contract_id}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, purchase_contract_id: event.target.value })
                  }
                />
              </label>
              <label>
                采购合同号
                <Input
                  value={supplierInvoiceForm.purchase_contract_no}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, purchase_contract_no: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                发票金额
                <Input
                  value={supplierInvoiceForm.total_amount}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, total_amount: event.target.value })
                  }
                />
              </label>
              <label>
                币种
                <Input
                  value={supplierInvoiceForm.currency}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, currency: event.target.value })
                  }
                />
              </label>
              <label>
                到期日
                <Input
                  type="date"
                  value={supplierInvoiceForm.due_date}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, due_date: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              备注
              <Input
                value={supplierInvoiceForm.remark}
                onChange={(event) =>
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, remark: event.target.value })
                }
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingSupplierInvoice}>
              登记供应商发票
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-payment-request-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="付款申请和审批" />
          {selectedSupplierInvoice ? (
            <dl className="detail-list finance-payment-detail-list">
              <div>
                <dt>当前发票</dt>
                <dd>{selectedSupplierInvoice.invoice_no}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>{supplierInvoiceStatusLabel(selectedSupplierInvoice.status)}</dd>
              </div>
              <div>
                <dt>已付</dt>
                <dd>{formatFinanceAmount(selectedSupplierInvoice.paid_amount, selectedSupplierInvoice.currency)}</dd>
              </div>
              <div>
                <dt>未付</dt>
                <dd>{formatFinanceAmount(selectedSupplierInvoice.unpaid_amount, selectedSupplierInvoice.currency)}</dd>
              </div>
            </dl>
          ) : (
            <div className="module-state">暂无供应商发票</div>
          )}
          <div className="finance-receipt-actions">
            <form className="record-form compact-section" onSubmit={submitPaymentRequest}>
              <div className="form-divider">付款申请新增</div>
              <div className="form-pair two">
                <label>
                  付款申请号
                  <Input
                    value={paymentRequestForm.request_no}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, request_no: event.target.value })
                    }
                  />
                </label>
                <label>
                  供应商发票标识
                  <Input
                    value={paymentRequestForm.supplier_invoice_id}
                    onChange={(event) =>
                      setPaymentRequestForm({
                        ...paymentRequestForm,
                        supplier_invoice_id: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  付款类别
                  <FormSelect
                    value={paymentRequestForm.payment_type}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, payment_type: event.target.value })
                    }
                  >
                    {paymentTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  申请日期
                  <Input
                    type="date"
                    value={paymentRequestForm.request_date}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, request_date: event.target.value })
                    }
                  />
                </label>
                <label>
                  申请金额
                  <Input
                    value={paymentRequestForm.requested_amount}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, requested_amount: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  币种
                  <Input
                    value={paymentRequestForm.currency}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, currency: event.target.value })
                    }
                  />
                </label>
                <label>
                  申请备注
                  <Input
                    value={paymentRequestForm.remark}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, remark: event.target.value })
                    }
                  />
                </label>
              </div>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingPaymentRequest}
                disabled={!selectedSupplierInvoice}
              >
                新增付款申请
              </Button>
            </form>
            <form className="record-form compact-section" onSubmit={submitPaymentApproval}>
              <div className="form-divider">付款审批</div>
              <div className="form-pair two">
                <label>
                  审批金额
                  <Input
                    value={paymentApprovalForm.approved_amount}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, approved_amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  审批日期
                  <Input
                    type="date"
                    value={paymentApprovalForm.approved_at}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, approved_at: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  审批人
                  <Input
                    value={paymentApprovalForm.reviewer_name}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, reviewer_name: event.target.value })
                    }
                  />
                </label>
                <label>
                  付款账号
                  <Input
                    value={paymentApprovalForm.payment_account}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, payment_account: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                审批备注
                <Input
                  value={paymentApprovalForm.remark}
                  onChange={(event) =>
                    setPaymentApprovalForm({ ...paymentApprovalForm, remark: event.target.value })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<CheckCircle2 size={16} />}
                loading={submittingPaymentApproval}
                disabled={!selectedPaymentRequestCanApprove}
              >
                审批付款
              </Button>
            </form>
          </div>
          <section className="finance-allocation-history">
            <strong>付款申请列表</strong>
            <Table<SupplierPaymentRequest>
              columns={[
                {
                  title: '申请号',
                  dataIndex: 'request_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: '状态', dataIndex: 'status', render: paymentRequestStatusTag },
                { title: '类别', dataIndex: 'payment_type', render: paymentTypeLabel },
                { title: '供应商', dataIndex: 'supplier_name' },
                { title: '发票号', dataIndex: 'supplier_invoice_no' },
                {
                  title: '申请金额',
                  dataIndex: 'requested_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已付',
                  dataIndex: 'paid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={paymentRequests}
              loading={loadingPaymentRequests}
              pagination={false}
              rowClassName={(record) => (record.id === selectedPaymentRequest?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedPaymentRequestId(record.id)
                  setPaymentApprovalForm(initialPaymentApprovalForm(record.requested_amount))
                },
              })}
            />
          </section>
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-payable-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="应付账款查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadPayables()
              }}
            >
              <label>
                应付搜索
                <Input value={payableSearch} onChange={(event) => setPayableSearch(event.target.value)} />
              </label>
              <label>
                应付状态
                <FormSelect
                  value={payableStatusFilter}
                  onChange={(event) => setPayableStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {supplierInvoiceStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                供应商标识
                <Input
                  value={payableSupplierFilter}
                  onChange={(event) => setPayableSupplierFilter(event.target.value)}
                />
              </label>
              <label>
                采购合同号
                <Input
                  value={payableContractFilter}
                  onChange={(event) => setPayableContractFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<PayableItem>
            columns={[
              { title: '供应商发票', dataIndex: 'invoice_no', render: (value: string) => <strong>{value}</strong> },
              { title: '供应商', dataIndex: 'supplier_name' },
              { title: '采购合同', dataIndex: 'purchase_contract_no', render: nullableText },
              {
                title: '发票金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已付款',
                dataIndex: 'paid_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '应付余额',
                dataIndex: 'payable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '状态', dataIndex: 'status', render: supplierInvoiceStatusTag },
            ]}
            dataSource={payables}
            loading={loadingPayables}
            pagination={false}
            rowKey="supplier_invoice_id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'fees') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('fees')}>
              <ArrowLeft size={16} />
              付费管理
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-fee-grid'}
          aria-label="付费管理"
        >
        {!detailId ? (
        <section className="workspace-panel finance-fee-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Wallet size={18} />} title="合作伙伴费用发票" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadPartnerFeeInvoices()
              }}
            >
              <label>
                费用发票搜索
                <Input value={feeInvoiceSearch} onChange={(event) => setFeeInvoiceSearch(event.target.value)} />
              </label>
              <label>
                发票状态
                <FormSelect
                  value={feeInvoiceStatusFilter}
                  onChange={(event) => setFeeInvoiceStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {partnerFeeInvoiceStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                费用类型
                <FormSelect value={feeInvoiceTypeFilter} onChange={(event) => setFeeInvoiceTypeFilter(event.target.value)}>
                  <option value="">全部类型</option>
                  {feeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                合作伙伴标识
                <Input
                  value={feeInvoicePartnerFilter}
                  onChange={(event) => setFeeInvoicePartnerFilter(event.target.value)}
                />
              </label>
              <label>
                出运单号
                <Input
                  value={feeInvoiceShipmentFilter}
                  onChange={(event) => setFeeInvoiceShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<PartnerFeeInvoice>
            columns={[
              {
                title: '费用发票',
                dataIndex: 'invoice_no',
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: partnerFeeInvoiceStatusTag },
              { title: '合作伙伴', dataIndex: 'partner_name' },
              { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
              { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
              {
                title: '发票金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '未付',
                dataIndex: 'unpaid_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={partnerFeeInvoices}
            loading={loadingPartnerFeeInvoices}
            pagination={false}
            rowClassName={(record) => (record.id === selectedPartnerFeeInvoice?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedPartnerFeeInvoiceId(record.id)
                setFeePaymentRequestForm(initialFeePaymentRequestForm(record))
                setFeePaymentApprovalForm(initialFeePaymentApprovalForm(record.unpaid_amount))
                goDetail('fees', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-fee-form-panel">
          <PanelTitle icon={<Wallet size={18} />} title="费用发票登记" />
          <form className="record-form" onSubmit={submitPartnerFeeInvoice}>
            <div className="form-pair two">
              <label>
                费用发票号
                <Input
                  value={partnerFeeInvoiceForm.invoice_no}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, invoice_no: event.target.value })
                  }
                />
              </label>
              <label>
                发票日期
                <Input
                  type="date"
                  value={partnerFeeInvoiceForm.invoice_date}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, invoice_date: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                合作伙伴标识
                <Input
                  value={partnerFeeInvoiceForm.partner_id}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, partner_id: event.target.value })
                  }
                />
              </label>
              <label>
                合作伙伴名称
                <Input
                  value={partnerFeeInvoiceForm.partner_name}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, partner_name: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                合作伙伴类型
                <FormSelect
                  value={partnerFeeInvoiceForm.partner_type}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, partner_type: event.target.value })
                  }
                >
                  <option value="">自动匹配</option>
                  {partnerTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                费用类型
                <FormSelect
                  value={partnerFeeInvoiceForm.fee_type}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, fee_type: event.target.value })
                  }
                >
                  {feeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <div className="form-pair two">
              <label>
                出运单标识
                <Input
                  value={partnerFeeInvoiceForm.shipment_plan_id}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, shipment_plan_id: event.target.value })
                  }
                />
              </label>
              <label>
                出运单号
                <Input
                  value={partnerFeeInvoiceForm.shipment_no}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, shipment_no: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                业务员标识
                <Input
                  value={partnerFeeInvoiceForm.sales_user_id}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, sales_user_id: event.target.value })
                  }
                />
              </label>
              <label>
                业务员姓名
                <Input
                  value={partnerFeeInvoiceForm.sales_user_name}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, sales_user_name: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                发票金额
                <Input
                  value={partnerFeeInvoiceForm.total_amount}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, total_amount: event.target.value })
                  }
                />
              </label>
              <label>
                币种
                <Input
                  value={partnerFeeInvoiceForm.currency}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, currency: event.target.value })
                  }
                />
              </label>
              <label>
                到期日
                <Input
                  type="date"
                  value={partnerFeeInvoiceForm.due_date}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, due_date: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              备注
              <Input
                value={partnerFeeInvoiceForm.remark}
                onChange={(event) =>
                  setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, remark: event.target.value })
                }
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingPartnerFeeInvoice}>
              登记费用发票
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-fee-request-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="付费申请和审批" />
          {selectedPartnerFeeInvoice ? (
            <dl className="detail-list finance-fee-detail-list">
              <div>
                <dt>当前费用发票</dt>
                <dd>{selectedPartnerFeeInvoice.invoice_no}</dd>
              </div>
              <div>
                <dt>费用类型</dt>
                <dd>{feeTypeLabel(selectedPartnerFeeInvoice.fee_type)}</dd>
              </div>
              <div>
                <dt>已付</dt>
                <dd>{formatFinanceAmount(selectedPartnerFeeInvoice.paid_amount, selectedPartnerFeeInvoice.currency)}</dd>
              </div>
              <div>
                <dt>未付</dt>
                <dd>{formatFinanceAmount(selectedPartnerFeeInvoice.unpaid_amount, selectedPartnerFeeInvoice.currency)}</dd>
              </div>
            </dl>
          ) : (
            <div className="module-state">暂无合作伙伴费用发票</div>
          )}
          <div className="finance-receipt-actions">
            <form className="record-form compact-section" onSubmit={submitFeePaymentRequest}>
              <div className="form-divider">付费申请新增</div>
              <div className="form-pair two">
                <label>
                  付费申请号
                  <Input
                    value={feePaymentRequestForm.request_no}
                    onChange={(event) =>
                      setFeePaymentRequestForm({ ...feePaymentRequestForm, request_no: event.target.value })
                    }
                  />
                </label>
                <label>
                  费用发票标识
                  <Input
                    value={feePaymentRequestForm.partner_fee_invoice_id}
                    onChange={(event) =>
                      setFeePaymentRequestForm({
                        ...feePaymentRequestForm,
                        partner_fee_invoice_id: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  申请日期
                  <Input
                    type="date"
                    value={feePaymentRequestForm.request_date}
                    onChange={(event) =>
                      setFeePaymentRequestForm({ ...feePaymentRequestForm, request_date: event.target.value })
                    }
                  />
                </label>
                <label>
                  申请金额
                  <Input
                    value={feePaymentRequestForm.requested_amount}
                    onChange={(event) =>
                      setFeePaymentRequestForm({ ...feePaymentRequestForm, requested_amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  币种
                  <Input
                    value={feePaymentRequestForm.currency}
                    onChange={(event) =>
                      setFeePaymentRequestForm({ ...feePaymentRequestForm, currency: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                申请备注
                <Input
                  value={feePaymentRequestForm.remark}
                  onChange={(event) =>
                    setFeePaymentRequestForm({ ...feePaymentRequestForm, remark: event.target.value })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingFeePaymentRequest}
                disabled={!selectedPartnerFeeInvoice}
              >
                新增付费申请
              </Button>
            </form>
            <form className="record-form compact-section" onSubmit={submitFeePaymentApproval}>
              <div className="form-divider">付费审批</div>
              <div className="form-pair two">
                <label>
                  审批金额
                  <Input
                    value={feePaymentApprovalForm.approved_amount}
                    onChange={(event) =>
                      setFeePaymentApprovalForm({ ...feePaymentApprovalForm, approved_amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  审批日期
                  <Input
                    type="date"
                    value={feePaymentApprovalForm.approved_at}
                    onChange={(event) =>
                      setFeePaymentApprovalForm({ ...feePaymentApprovalForm, approved_at: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  审批人
                  <Input
                    value={feePaymentApprovalForm.reviewer_name}
                    onChange={(event) =>
                      setFeePaymentApprovalForm({ ...feePaymentApprovalForm, reviewer_name: event.target.value })
                    }
                  />
                </label>
                <label>
                  付款账号
                  <Input
                    value={feePaymentApprovalForm.payment_account}
                    onChange={(event) =>
                      setFeePaymentApprovalForm({
                        ...feePaymentApprovalForm,
                        payment_account: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                审批备注
                <Input
                  value={feePaymentApprovalForm.remark}
                  onChange={(event) =>
                    setFeePaymentApprovalForm({ ...feePaymentApprovalForm, remark: event.target.value })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<CheckCircle2 size={16} />}
                loading={submittingFeePaymentApproval}
                disabled={!selectedFeePaymentRequestCanApprove}
              >
                审批付费
              </Button>
            </form>
          </div>
          <section className="finance-allocation-history">
            <strong>付费申请列表</strong>
            <Table<FeePaymentRequest>
              columns={[
                {
                  title: '申请号',
                  dataIndex: 'request_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: '状态', dataIndex: 'status', render: feePaymentRequestStatusTag },
                { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
                { title: '合作伙伴', dataIndex: 'partner_name' },
                { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                {
                  title: '申请金额',
                  dataIndex: 'requested_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已付',
                  dataIndex: 'paid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={feePaymentRequests}
              loading={loadingFeePaymentRequests}
              pagination={false}
              rowClassName={(record) => (record.id === selectedFeePaymentRequest?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedFeePaymentRequestId(record.id)
                  setFeePaymentApprovalForm(initialFeePaymentApprovalForm(record.requested_amount))
                },
              })}
            />
          </section>
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-fee-payable-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="应付费用查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadFeePayables()
              }}
            >
              <label>
                应付费用搜索
                <Input value={feePayableSearch} onChange={(event) => setFeePayableSearch(event.target.value)} />
              </label>
              <label>
                应付状态
                <FormSelect
                  value={feePayableStatusFilter}
                  onChange={(event) => setFeePayableStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {partnerFeeInvoiceStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                费用类型
                <FormSelect value={feePayableTypeFilter} onChange={(event) => setFeePayableTypeFilter(event.target.value)}>
                  <option value="">全部类型</option>
                  {feeTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                合作伙伴标识
                <Input
                  value={feePayablePartnerFilter}
                  onChange={(event) => setFeePayablePartnerFilter(event.target.value)}
                />
              </label>
              <label>
                出运单号
                <Input
                  value={feePayableShipmentFilter}
                  onChange={(event) => setFeePayableShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<FeePayableItem>
            columns={[
              { title: '费用发票', dataIndex: 'invoice_no', render: (value: string) => <strong>{value}</strong> },
              { title: '合作伙伴', dataIndex: 'partner_name' },
              { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
              { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
              {
                title: '发票金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已付费',
                dataIndex: 'paid_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '应付余额',
                dataIndex: 'payable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '状态', dataIndex: 'status', render: partnerFeeInvoiceStatusTag },
            ]}
            dataSource={feePayables}
            loading={loadingFeePayables}
            pagination={false}
            rowKey="partner_fee_invoice_id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'tax') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('tax')}>
              <ArrowLeft size={16} />
              核销退税
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-tax-grid'}
          aria-label="核销退税"
        >
        {!detailId ? (
        <section className="workspace-panel finance-tax-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="核销单列表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadVerificationDocuments()
              }}
            >
              <label>
                核销单搜索
                <Input value={verificationSearch} onChange={(event) => setVerificationSearch(event.target.value)} />
              </label>
              <label>
                进度状态
                <FormSelect
                  value={verificationStatusFilter}
                  onChange={(event) => setVerificationStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {verificationDocumentStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                提醒状态
                <FormSelect
                  value={verificationReminderFilter}
                  onChange={(event) => setVerificationReminderFilter(event.target.value)}
                >
                  <option value="">全部提醒</option>
                  {verificationReminderStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                业务员标识
                <Input
                  value={verificationOwnerFilter}
                  onChange={(event) => setVerificationOwnerFilter(event.target.value)}
                />
              </label>
              <label>
                出运单号
                <Input
                  value={verificationShipmentFilter}
                  onChange={(event) => setVerificationShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<VerificationDocument>
            columns={[
              {
                title: '核销单',
                dataIndex: 'document_no',
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '状态', dataIndex: 'status', render: verificationDocumentStatusTag },
              { title: '提醒', dataIndex: 'reminder_status', render: verificationReminderStatusTag },
              { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
              { title: '有效期', dataIndex: 'valid_until', render: formatDate },
              {
                title: '可退税',
                dataIndex: 'refundable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已退税',
                dataIndex: 'refunded_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={verificationDocuments}
            loading={loadingVerificationDocuments}
            pagination={false}
            rowClassName={(record) => (record.id === selectedVerificationDocument?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedVerificationDocumentId(record.id)
                setTaxRefundForm(initialTaxRefundForm(record.currency, record.unrefunded_amount))
                goDetail('tax', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-tax-form-panel">
          <PanelTitle icon={<Save size={18} />} title="核销单领用" />
          <form className="record-form" onSubmit={submitVerificationDocument}>
            <div className="form-pair two">
              <label>
                核销单号
                <Input
                  value={verificationDocumentForm.document_no}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      document_no: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                领用日期
                <Input
                  type="date"
                  value={verificationDocumentForm.received_at}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      received_at: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                出运单标识
                <Input
                  value={verificationDocumentForm.shipment_plan_id}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      shipment_plan_id: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                出运单号
                <Input
                  value={verificationDocumentForm.shipment_no}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      shipment_no: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                业务员标识
                <Input
                  value={verificationDocumentForm.owner_user_id}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      owner_user_id: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                业务员姓名
                <Input
                  value={verificationDocumentForm.owner_user_name}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      owner_user_name: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                客户名称
                <Input
                  value={verificationDocumentForm.customer_name}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      customer_name: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                有效期至
                <Input
                  type="date"
                  value={verificationDocumentForm.valid_until}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      valid_until: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                可退税金额
                <Input
                  value={verificationDocumentForm.refundable_amount}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      refundable_amount: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                币种
                <Input
                  value={verificationDocumentForm.currency}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      currency: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <label>
              备注
              <Input
                value={verificationDocumentForm.remark}
                onChange={(event) =>
                  setVerificationDocumentForm({
                    ...verificationDocumentForm,
                    remark: event.target.value,
                  })
                }
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingVerificationDocument}>
              领用核销单
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-tax-process-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="回单、核销和退税登记" />
          {selectedVerificationDocument ? (
            <dl className="detail-list finance-tax-detail-list">
              <div>
                <dt>当前核销单</dt>
                <dd>{selectedVerificationDocument.document_no}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>{verificationDocumentStatusLabel(selectedVerificationDocument.status)}</dd>
              </div>
              <div>
                <dt>未退税</dt>
                <dd>
                  {formatFinanceAmount(
                    selectedVerificationDocument.unrefunded_amount,
                    selectedVerificationDocument.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt>提醒日</dt>
                <dd>{formatDate(selectedVerificationDocument.reminder_date)}</dd>
              </div>
            </dl>
          ) : (
            <div className="module-state">暂无核销单</div>
          )}
          <div className="finance-tax-actions">
            <form className="record-form compact-section" onSubmit={submitCustomsReceipt}>
              <div className="form-divider">报关回单登记</div>
              <div className="form-pair two">
                <label>
                  报关单号
                  <Input
                    value={customsReceiptForm.customs_declaration_no}
                    onChange={(event) =>
                      setCustomsReceiptForm({
                        ...customsReceiptForm,
                        customs_declaration_no: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  回单号
                  <Input
                    value={customsReceiptForm.customs_receipt_no}
                    onChange={(event) =>
                      setCustomsReceiptForm({
                        ...customsReceiptForm,
                        customs_receipt_no: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  回单日期
                  <Input
                    type="date"
                    value={customsReceiptForm.received_at}
                    onChange={(event) =>
                      setCustomsReceiptForm({ ...customsReceiptForm, received_at: event.target.value })
                    }
                  />
                </label>
                <label>
                  回单备注
                  <Input
                    value={customsReceiptForm.remark}
                    onChange={(event) =>
                      setCustomsReceiptForm({ ...customsReceiptForm, remark: event.target.value })
                    }
                  />
                </label>
              </div>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingCustomsReceipt}
                disabled={!selectedVerificationCanRegisterCustoms}
              >
                登记回单
              </Button>
            </form>

            <form className="record-form compact-section" onSubmit={submitVerificationRegister}>
              <div className="form-divider">核销登记</div>
              <div className="form-pair two">
                <label>
                  核销编号
                  <Input
                    value={verificationRegisterForm.verification_no}
                    onChange={(event) =>
                      setVerificationRegisterForm({
                        ...verificationRegisterForm,
                        verification_no: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  核销日期
                  <Input
                    type="date"
                    value={verificationRegisterForm.verified_at}
                    onChange={(event) =>
                      setVerificationRegisterForm({
                        ...verificationRegisterForm,
                        verified_at: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                核销备注
                <Input
                  value={verificationRegisterForm.remark}
                  onChange={(event) =>
                    setVerificationRegisterForm({
                      ...verificationRegisterForm,
                      remark: event.target.value,
                    })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<CheckCircle2 size={16} />}
                loading={submittingVerificationRegister}
                disabled={!selectedVerificationCanVerify}
              >
                登记核销
              </Button>
            </form>

            <form className="record-form compact-section" onSubmit={submitTaxRefund}>
              <div className="form-divider">退税登记</div>
              <div className="form-pair two">
                <label>
                  退税编号
                  <Input
                    value={taxRefundForm.refund_no}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, refund_no: event.target.value })
                    }
                  />
                </label>
                <label>
                  退税日期
                  <Input
                    type="date"
                    value={taxRefundForm.refunded_at}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, refunded_at: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  退税金额
                  <Input
                    value={taxRefundForm.amount}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  币种
                  <Input
                    value={taxRefundForm.currency}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, currency: event.target.value })
                    }
                  />
                </label>
                <label>
                  银行水单号
                  <Input
                    value={taxRefundForm.bank_receipt_no}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, bank_receipt_no: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                退税备注
                <Input
                  value={taxRefundForm.remark}
                  onChange={(event) =>
                    setTaxRefundForm({ ...taxRefundForm, remark: event.target.value })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingTaxRefund}
                disabled={!selectedVerificationCanRefund}
              >
                登记退税
              </Button>
            </form>
          </div>
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-tax-usage-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="核销单使用情况查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadVerificationUsage()
              }}
            >
              <label>
                使用情况搜索
                <Input
                  value={verificationUsageSearch}
                  onChange={(event) => setVerificationUsageSearch(event.target.value)}
                />
              </label>
              <label>
                进度状态
                <FormSelect
                  value={verificationUsageStatusFilter}
                  onChange={(event) => setVerificationUsageStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {verificationDocumentStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                提醒状态
                <FormSelect
                  value={verificationUsageReminderFilter}
                  onChange={(event) => setVerificationUsageReminderFilter(event.target.value)}
                >
                  <option value="">全部提醒</option>
                  {verificationReminderStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                出运单号
                <Input
                  value={verificationUsageShipmentFilter}
                  onChange={(event) => setVerificationUsageShipmentFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<VerificationUsageItem>
            columns={[
              { title: '核销单', dataIndex: 'document_no', render: (value: string) => <strong>{value}</strong> },
              { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
              { title: '业务员', dataIndex: 'owner_user_name', render: nullableText },
              { title: '状态', dataIndex: 'status', render: verificationDocumentStatusTag },
              { title: '提醒', dataIndex: 'reminder_status', render: verificationReminderStatusTag },
              {
                title: '可退税',
                dataIndex: 'refundable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已退税',
                dataIndex: 'refunded_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '回单号', dataIndex: 'customs_receipt_no', render: nullableText },
              { title: '核销编号', dataIndex: 'verification_no', render: nullableText },
            ]}
            dataSource={verificationUsage}
            loading={loadingVerificationUsage}
            pagination={false}
            rowKey="verification_document_id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'misc') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('misc')}>
              <ArrowLeft size={16} />
              杂费管理
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-misc-grid'}
          aria-label="杂费管理"
        >
        {!detailId ? (
        <section className="workspace-panel finance-misc-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<ShieldCheck size={18} />} title="杂费项目配置" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadMiscFeeItems()
              }}
            >
              <label>
                项目搜索
                <Input value={miscFeeItemSearch} onChange={(event) => setMiscFeeItemSearch(event.target.value)} />
              </label>
              <label>
                项目分类
                <FormSelect
                  value={miscFeeItemCategoryFilter}
                  onChange={(event) => setMiscFeeItemCategoryFilter(event.target.value)}
                >
                  <option value="">全部分类</option>
                  {miscFeeCategoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                启停状态
                <FormSelect
                  value={miscFeeItemStatusFilter}
                  onChange={(event) => setMiscFeeItemStatusFilter(event.target.value)}
                >
                  <option value="">全部状态</option>
                  {miscFeeItemStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <Table<MiscFeeItem>
            columns={[
              {
                title: '项目编码',
                dataIndex: 'code',
                render: (value: string) => (
                  <button className="row-button" type="button">
                    {value}
                  </button>
                ),
              },
              { title: '项目名称', dataIndex: 'name' },
              { title: '分类', dataIndex: 'category', render: miscFeeCategoryLabel },
              {
                title: '默认分摊',
                dataIndex: 'default_allocation_method',
                render: miscFeeAllocationMethodLabel,
              },
              { title: '状态', dataIndex: 'status', render: miscFeeItemStatusTag },
            ]}
            dataSource={miscFeeItems}
            loading={loadingMiscFeeItems}
            pagination={false}
            rowClassName={(record) => (record.id === selectedMiscFeeItem?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedMiscFeeItemId(record.id)
                setMiscFeeAllocationForm(initialMiscFeeAllocationForm(record))
                goDetail('misc', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-misc-form-panel">
          <PanelTitle icon={<Save size={18} />} title="新增杂费项目" />
          <form className="record-form" onSubmit={submitMiscFeeItem}>
            <div className="form-pair two">
              <label>
                项目编码
                <Input
                  value={miscFeeItemForm.code}
                  onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, code: event.target.value })}
                />
              </label>
              <label>
                项目名称
                <Input
                  value={miscFeeItemForm.name}
                  onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, name: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                项目分类
                <FormSelect
                  value={miscFeeItemForm.category}
                  onChange={(event) =>
                    setMiscFeeItemForm({ ...miscFeeItemForm, category: event.target.value })
                  }
                >
                  {miscFeeCategoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                默认分摊方式
                <FormSelect
                  value={miscFeeItemForm.default_allocation_method}
                  onChange={(event) =>
                    setMiscFeeItemForm({
                      ...miscFeeItemForm,
                      default_allocation_method: event.target.value,
                    })
                  }
                >
                  {miscFeeAllocationMethodOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={miscFeeItemForm.is_active}
                onChange={(event) =>
                  setMiscFeeItemForm({ ...miscFeeItemForm, is_active: event.target.checked })
                }
              />
              启用项目
            </label>
            <label>
              备注
              <Input
                value={miscFeeItemForm.remark}
                onChange={(event) => setMiscFeeItemForm({ ...miscFeeItemForm, remark: event.target.value })}
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingMiscFeeItem}>
              保存项目
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-misc-allocation-panel">
          <PanelTitle icon={<Wallet size={18} />} title="单票杂费分摊" />
          {selectedMiscFeeItem ? (
            <dl className="detail-list finance-misc-detail-list">
              <div>
                <dt>当前项目</dt>
                <dd>{selectedMiscFeeItem.name}</dd>
              </div>
              <div>
                <dt>分类</dt>
                <dd>{miscFeeCategoryLabel(selectedMiscFeeItem.category)}</dd>
              </div>
              <div>
                <dt>默认方式</dt>
                <dd>{miscFeeAllocationMethodLabel(selectedMiscFeeItem.default_allocation_method)}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd>{miscFeeItemStatusLabel(selectedMiscFeeItem.status)}</dd>
              </div>
            </dl>
          ) : (
            <div className="module-state">暂无杂费项目</div>
          )}
          <form className="record-form" onSubmit={submitMiscFeeAllocation}>
            <div className="form-pair two">
              <label>
                分摊单号
                <Input
                  value={miscFeeAllocationForm.allocation_no}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      allocation_no: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                项目标识
                <Input
                  value={miscFeeAllocationForm.item_id}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({ ...miscFeeAllocationForm, item_id: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                出运单标识
                <Input
                  value={miscFeeAllocationForm.shipment_plan_id}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      shipment_plan_id: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                出运单号
                <Input
                  value={miscFeeAllocationForm.shipment_no}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({ ...miscFeeAllocationForm, shipment_no: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                业务员标识
                <Input
                  value={miscFeeAllocationForm.sales_user_id}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      sales_user_id: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                业务员姓名
                <Input
                  value={miscFeeAllocationForm.sales_user_name}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      sales_user_name: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                分摊日期
                <Input
                  type="date"
                  value={miscFeeAllocationForm.allocated_at}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({
                      ...miscFeeAllocationForm,
                      allocated_at: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                金额
                <Input
                  value={miscFeeAllocationForm.amount}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({ ...miscFeeAllocationForm, amount: event.target.value })
                  }
                />
              </label>
              <label>
                币种
                <Input
                  value={miscFeeAllocationForm.currency}
                  onChange={(event) =>
                    setMiscFeeAllocationForm({ ...miscFeeAllocationForm, currency: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              分摊方式
              <FormSelect
                value={miscFeeAllocationForm.allocation_method}
                onChange={(event) =>
                  setMiscFeeAllocationForm({
                    ...miscFeeAllocationForm,
                    allocation_method: event.target.value,
                  })
                }
              >
                {miscFeeAllocationMethodOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              分摊依据
              <Input
                value={miscFeeAllocationForm.basis}
                onChange={(event) =>
                  setMiscFeeAllocationForm({ ...miscFeeAllocationForm, basis: event.target.value })
                }
              />
            </label>
            <label>
              备注
              <Input
                value={miscFeeAllocationForm.remark}
                onChange={(event) =>
                  setMiscFeeAllocationForm({ ...miscFeeAllocationForm, remark: event.target.value })
                }
              />
            </label>
            <Button
              htmlType="submit"
              icon={<Save size={16} />}
              loading={submittingMiscFeeAllocation}
              disabled={!selectedMiscFeeItem}
            >
              保存分摊
            </Button>
          </form>
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-misc-summary-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="杂费分摊查询" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadMiscFeeAllocations()
                void loadMiscFeeAllocationSummary()
              }}
            >
              <label>
                分摊搜索
                <Input
                  value={miscFeeAllocationSearch}
                  onChange={(event) => setMiscFeeAllocationSearch(event.target.value)}
                />
              </label>
              <label>
                分类
                <FormSelect
                  value={miscFeeAllocationCategoryFilter}
                  onChange={(event) => {
                    setMiscFeeAllocationCategoryFilter(event.target.value)
                    setMiscFeeSummaryCategoryFilter(event.target.value)
                  }}
                >
                  <option value="">全部分类</option>
                  {miscFeeCategoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                出运单号
                <Input
                  value={miscFeeAllocationShipmentFilter}
                  onChange={(event) => {
                    setMiscFeeAllocationShipmentFilter(event.target.value)
                    setMiscFeeSummaryShipmentFilter(event.target.value)
                  }}
                />
              </label>
              <label>
                业务员标识
                <Input
                  value={miscFeeAllocationSalesFilter}
                  onChange={(event) => setMiscFeeAllocationSalesFilter(event.target.value)}
                />
              </label>
              <Button htmlType="submit" icon={<Search size={16} />}>
                查询
              </Button>
            </form>
          </div>
          <div className="finance-receipt-strip">
            <span>分摊记录 {miscFeeAllocations.length} 条</span>
            <strong>{formatFinanceAmount(totalMiscFeeAmount.toFixed(2), miscFeeAllocations[0]?.currency ?? 'USD')}</strong>
            <span>已进入单票利润成本</span>
          </div>
          <Table<MiscFeeAllocation>
            columns={[
              {
                title: '分摊单号',
                dataIndex: 'allocation_no',
                render: (value: string) => <strong>{value}</strong>,
              },
              { title: '杂费项目', dataIndex: 'item_name' },
              { title: '分类', dataIndex: 'item_category', render: miscFeeCategoryLabel },
              { title: '出运单', dataIndex: 'shipment_no' },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '业务员', dataIndex: 'sales_user_name', render: nullableText },
              { title: '分摊日', dataIndex: 'allocated_at', render: formatDate },
              {
                title: '金额',
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '方式', dataIndex: 'allocation_method', render: miscFeeAllocationMethodLabel },
            ]}
            dataSource={miscFeeAllocations}
            loading={loadingMiscFeeAllocations || loadingMiscFeeSummary}
            pagination={false}
            rowKey="id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'settlement') {
    return (
      <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
        {detailId ? (
          <div className="finance-subnav">
            <button className="finance-back-button" type="button" onClick={() => goModule('settlement')}>
              <ArrowLeft size={16} />
              结算核算
            </button>
          </div>
        ) : (
          moduleHeader
        )}
        {moduleAlerts}
        <section
          className={detailId ? 'finance-detail-grid' : 'finance-settlement-grid'}
          aria-label="财务结算和利润核算"
        >
        {!detailId ? (
        <section className="workspace-panel finance-settlement-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<Wallet size={18} />} title="财务结算列表" />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadFinancialSettlements()
            }}
          >
            <label>
              结算搜索
              <Input
                value={settlementSearch}
                placeholder="结算单 / 出运单 / 客户"
                onChange={(event) => setSettlementSearch(event.target.value)}
              />
            </label>
            <label>
              出运单号
              <Input
                value={settlementShipmentFilter}
                onChange={(event) => setSettlementShipmentFilter(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>
              查询
            </Button>
          </form>
          <div className="finance-receipt-strip">
            <span>锁定结算 {financialSettlements.length} 单</span>
            <strong>{formatFinanceAmount(totalSettlementSalesIncome.toFixed(2), financialSettlements[0]?.currency ?? 'USD')}</strong>
            <span>毛利 {formatFinanceAmount(totalSettlementGrossProfit.toFixed(2), financialSettlements[0]?.currency ?? 'USD')}</span>
          </div>
          <Table<FinancialSettlement>
            columns={[
              {
                title: '结算单',
                dataIndex: 'settlement_no',
                render: (value: string) => <strong>{value}</strong>,
              },
              { title: '出运单', dataIndex: 'shipment_no' },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '结算日', dataIndex: 'settlement_date', render: formatDate },
              {
                title: '收入',
                dataIndex: 'sales_income',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '成本',
                dataIndex: 'purchase_cost_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '退税',
                dataIndex: 'tax_refund_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '杂费',
                dataIndex: 'misc_fee_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '手工成本',
                dataIndex: 'manual_cost_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '毛利',
                dataIndex: 'gross_profit',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '毛利率', dataIndex: 'gross_profit_rate', render: formatPercent },
              { title: '状态', dataIndex: 'status', render: settlementStatusTag },
            ]}
            dataSource={financialSettlements}
            loading={loadingFinancialSettlements}
            pagination={false}
            rowClassName={(record) => (record.id === selectedFinancialSettlement?.id ? 'selected-row' : '')}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => {
                setSelectedFinancialSettlementId(record.id)
                setManualProfitCostForm(initialManualProfitCostForm(record.currency, record.settlement_date))
                goDetail('settlement', record.id)
              },
            })}
          />
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-settlement-form-panel">
          <PanelTitle icon={<Save size={18} />} title="单票结算锁定" />
          <form className="record-form" onSubmit={submitFinancialSettlement}>
            <label>
              结算单号
              <Input
                required
                value={settlementForm.settlement_no}
                onChange={(event) => setSettlementForm({ ...settlementForm, settlement_no: event.target.value })}
              />
            </label>
            <label>
              出运单 ID
              <Input
                required
                value={settlementForm.shipment_plan_id}
                onChange={(event) => setSettlementForm({ ...settlementForm, shipment_plan_id: event.target.value })}
              />
            </label>
            <label>
              出运单号
              <Input
                value={settlementForm.shipment_no}
                onChange={(event) => setSettlementForm({ ...settlementForm, shipment_no: event.target.value })}
              />
            </label>
            <label>
              结算日期
              <Input
                required
                type="date"
                value={settlementForm.settlement_date}
                onChange={(event) => setSettlementForm({ ...settlementForm, settlement_date: event.target.value })}
              />
            </label>
            <label>
              备注
              <textarea
                rows={3}
                value={settlementForm.remark}
                onChange={(event) => setSettlementForm({ ...settlementForm, remark: event.target.value })}
              />
            </label>
            <Button htmlType="submit" icon={<Save size={16} />} loading={submittingSettlement}>
              锁定结算
            </Button>
          </form>
        </section>
        ) : null}

        {detailId ? (
        <section className="workspace-panel finance-manual-cost-panel">
          <PanelTitle icon={<PackagePlus size={18} />} title="手工成本关联" />
          {selectedFinancialSettlement ? (
            <Descriptions
              bordered
              className="finance-settlement-descriptions"
              column={2}
              items={[
                { key: 'settlement_no', label: '结算单', children: selectedFinancialSettlement.settlement_no },
                { key: 'shipment_no', label: '出运单', children: selectedFinancialSettlement.shipment_no },
                {
                  key: 'gross_profit',
                  label: '当前毛利',
                  children: formatFinanceAmount(
                    selectedFinancialSettlement.gross_profit,
                    selectedFinancialSettlement.currency,
                  ),
                },
                {
                  key: 'manual_cost_amount',
                  label: '手工成本',
                  children: formatFinanceAmount(
                    selectedFinancialSettlement.manual_cost_amount,
                    selectedFinancialSettlement.currency,
                  ),
                },
              ]}
              size="small"
            />
          ) : (
            <div className="module-state">暂无可关联结算单</div>
          )}
          <form className="record-form compact-section" onSubmit={submitManualProfitCost}>
            <label>
              成本单号
              <Input
                required
                value={manualProfitCostForm.cost_no}
                onChange={(event) => setManualProfitCostForm({ ...manualProfitCostForm, cost_no: event.target.value })}
              />
            </label>
            <label>
              成本类型
              <FormSelect
                value={manualProfitCostForm.cost_type}
                onChange={(event) =>
                  setManualProfitCostForm({ ...manualProfitCostForm, cost_type: event.target.value })
                }
              >
                <option value="other_cost">其他成本</option>
              </FormSelect>
            </label>
            <label>
              成本日期
              <Input
                required
                type="date"
                value={manualProfitCostForm.cost_date}
                onChange={(event) =>
                  setManualProfitCostForm({ ...manualProfitCostForm, cost_date: event.target.value })
                }
              />
            </label>
            <div className="form-pair two">
              <label>
                金额
                <Input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={manualProfitCostForm.amount}
                  onChange={(event) =>
                    setManualProfitCostForm({ ...manualProfitCostForm, amount: event.target.value })
                  }
                />
              </label>
              <label>
                币种
                <Input
                  required
                  value={manualProfitCostForm.currency}
                  onChange={(event) =>
                    setManualProfitCostForm({ ...manualProfitCostForm, currency: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              来源单号
              <Input
                value={manualProfitCostForm.source_no}
                onChange={(event) =>
                  setManualProfitCostForm({ ...manualProfitCostForm, source_no: event.target.value })
                }
              />
            </label>
            <label>
              原因
              <Input
                required
                value={manualProfitCostForm.reason}
                onChange={(event) =>
                  setManualProfitCostForm({ ...manualProfitCostForm, reason: event.target.value })
                }
              />
            </label>
            <label>
              备注
              <textarea
                rows={3}
                value={manualProfitCostForm.remark}
                onChange={(event) =>
                  setManualProfitCostForm({ ...manualProfitCostForm, remark: event.target.value })
                }
              />
            </label>
            <Button
              htmlType="submit"
              icon={<Save size={16} />}
              loading={submittingManualProfitCost}
              disabled={!selectedFinancialSettlement}
            >
              关联成本
            </Button>
          </form>
        </section>
        ) : null}

        {!detailId ? (
        <section className="workspace-panel finance-profit-calculation-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<CheckCircle2 size={18} />} title="利润核算表" />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadProfitCalculations()
            }}
          >
            <label>
              核算搜索
              <Input
                value={profitCalculationSearch}
                placeholder="结算单 / 出运单 / 客户"
                onChange={(event) => setProfitCalculationSearch(event.target.value)}
              />
            </label>
            <label>
              出运单号
              <Input
                value={profitCalculationShipmentFilter}
                onChange={(event) => setProfitCalculationShipmentFilter(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>
              查询
            </Button>
          </form>
          <div className="finance-receipt-strip">
            <span>核算单票 {profitCalculations.length} 单</span>
            <strong>{formatFinanceAmount(totalProfitCalculationGrossProfit.toFixed(2), profitCalculations[0]?.currency ?? 'USD')}</strong>
            <span>按结算锁定口径展开成本明细</span>
          </div>
          <Table<FinancialSettlement>
            columns={[
              {
                title: '结算单',
                dataIndex: 'settlement_no',
                render: (value: string) => <strong>{value}</strong>,
              },
              { title: '出运单', dataIndex: 'shipment_no' },
              { title: '客户', dataIndex: 'customer_name' },
              {
                title: '收入',
                dataIndex: 'sales_income',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '总成本',
                render: (_, record) =>
                  formatFinanceAmount(
                    (
                      Number(record.purchase_cost_amount || 0) +
                      Number(record.partner_fee_amount || 0) +
                      Number(record.misc_fee_amount || 0) +
                      Number(record.manual_cost_amount || 0)
                    ).toFixed(2),
                    record.currency,
                  ),
              },
              {
                title: '退税',
                dataIndex: 'tax_refund_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '毛利',
                dataIndex: 'gross_profit',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '毛利率', dataIndex: 'gross_profit_rate', render: formatPercent },
            ]}
            dataSource={profitCalculations}
            expandable={{
              expandedRowRender: (record) => (
                <Table<ProfitCostItem>
                  columns={[
                    { title: '类型', dataIndex: 'cost_type', render: profitCostTypeLabel },
                    { title: '方向', dataIndex: 'direction', render: profitCostDirectionTag },
                    { title: '来源', dataIndex: 'source_no', render: nullableText },
                    { title: '日期', dataIndex: 'cost_date', render: formatDate },
                    {
                      title: '金额',
                      dataIndex: 'amount',
                      render: (value: string, item) => formatFinanceAmount(value, item.currency),
                    },
                    { title: '原因', dataIndex: 'reason', render: nullableText },
                  ]}
                  dataSource={record.cost_items}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />
              ),
            }}
            loading={loadingProfitCalculations}
            pagination={false}
            rowKey="id"
            size="small"
          />
        </section>
        ) : null}
        </section>
      </section>
    )
  }

  if (activeModule === 'reimbursements') {
    const selectedReimbursement =
      reimbursements.find((item) => item.id === selectedReimbursementId) ?? reimbursements[0] ?? null
    return (
      <section className="finance-page">
        {moduleHeader}
        {moduleAlerts}
        <section className="finance-settlement-grid" aria-label="报销管理">
          <section className="workspace-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Receipt size={18} />} title="报销单列表" />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadReimbursements()
                }}
              >
                <label>
                  搜索
                  <Input
                    value={reimbursementSearch}
                    placeholder="单号 / 申请人 / 部门"
                    onChange={(event) => setReimbursementSearch(event.target.value)}
                  />
                </label>
                <label>
                  状态
                  <FormSelect
                    value={reimbursementStatusFilter}
                    onChange={(event) => setReimbursementStatusFilter(event.target.value)}
                  >
                    <option value="">全部状态</option>
                    <option value="submitted">待审批</option>
                    <option value="approved">已审批</option>
                    <option value="rejected">已驳回</option>
                    <option value="paid">已付款</option>
                  </FormSelect>
                </label>
                <label>
                  分类
                  <FormSelect
                    value={reimbursementCategoryFilter}
                    onChange={(event) => setReimbursementCategoryFilter(event.target.value)}
                  >
                    <option value="">全部分类</option>
                    <option value="travel">差旅</option>
                    <option value="office">办公</option>
                    <option value="entertainment">招待</option>
                    <option value="other">其他</option>
                  </FormSelect>
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
              </form>
            </div>
            <Table<Reimbursement>
              columns={[
                { title: '报销单号', dataIndex: 'reimbursement_no' },
                { title: '申请人', dataIndex: 'applicant_user_name' },
                { title: '部门', dataIndex: 'department' },
                { title: '分类', dataIndex: 'category', render: reimbursementCategoryLabel },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '状态', dataIndex: 'status', render: reimbursementStatusTag },
              ]}
              dataSource={reimbursements}
              loading={loadingReimbursements}
              pagination={false}
              rowClassName={(record) =>
                record.id === selectedReimbursement?.id ? 'selected-row' : ''
              }
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedReimbursementId(record.id),
              })}
            />
            <div className="finance-receipt-strip">
              <span>报销单 {reimbursements.length} 条</span>
              <strong>{formatFinanceAmount(reimbursementsTotalAmount, 'CNY')}</strong>
            </div>
          </section>

          <section className="workspace-panel">
            <div className="panel-heading">
              <PanelTitle icon={<Plus size={18} />} title="新增报销单" />
            </div>
            <form className="record-form" onSubmit={submitReimbursement}>
              <label>
                报销单号
                <Input
                  value={reimbursementForm.reimbursement_no}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, reimbursement_no: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                申请人工号
                <Input
                  value={reimbursementForm.applicant_user_id}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, applicant_user_id: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                申请人姓名
                <Input
                  value={reimbursementForm.applicant_user_name}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({
                      ...prev,
                      applicant_user_name: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                部门
                <Input
                  value={reimbursementForm.department}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, department: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                分类
                <FormSelect
                  value={reimbursementForm.category}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                >
                  <option value="travel">差旅</option>
                  <option value="office">办公</option>
                  <option value="entertainment">招待</option>
                  <option value="other">其他</option>
                </FormSelect>
              </label>
              <label>
                币种
                <Input
                  value={reimbursementForm.currency}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, currency: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                金额
                <Input
                  value={reimbursementForm.amount}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                事由
                <Input
                  value={reimbursementForm.reason}
                  onChange={(event) =>
                    setReimbursementForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                />
              </label>
              <Button htmlType="submit" type="primary" loading={submittingReimbursement} icon={<Save size={16} />}>
                登记报销单
              </Button>
            </form>

            {selectedReimbursement ? (
              <div className="finance-action-block">
                <PanelTitle icon={<ClipboardCheck size={18} />} title="审批与付款" />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="报销单号">
                    {selectedReimbursement.reimbursement_no}
                  </Descriptions.Item>
                  <Descriptions.Item label="当前状态">
                    {reimbursementStatusTag(selectedReimbursement.status)}
                  </Descriptions.Item>
                  <Descriptions.Item label="金额">
                    {formatFinanceAmount(selectedReimbursement.amount, selectedReimbursement.currency)}
                  </Descriptions.Item>
                </Descriptions>
                <div className="finance-action-row">
                  <Button
                    disabled={selectedReimbursement.status !== 'submitted'}
                    loading={submittingReimbursementAction}
                    type="primary"
                    onClick={() => void handleReimbursementApprove(true)}
                  >
                    审批通过
                  </Button>
                  <Button
                    disabled={selectedReimbursement.status !== 'submitted'}
                    loading={submittingReimbursementAction}
                    danger
                    onClick={() => void handleReimbursementApprove(false)}
                  >
                    驳回
                  </Button>
                </div>
                <div className="finance-action-row">
                  <FormSelect
                    value={reimbursementPayMethod}
                    onChange={(event) => setReimbursementPayMethod(event.target.value)}
                  >
                    <option value="bank_transfer">银行转账</option>
                    <option value="cash">现金</option>
                    <option value="cheque">支票</option>
                    <option value="other">其他</option>
                  </FormSelect>
                  <Button
                    disabled={selectedReimbursement.status !== 'approved'}
                    loading={submittingReimbursementAction}
                    type="primary"
                    onClick={() => void handleReimbursementPay()}
                  >
                    确认付款
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </section>
      </section>
    )
  }

  if (activeModule === 'portData') {
    return (
      <section className="finance-page">
        {moduleHeader}
        {moduleAlerts}
        <section className="finance-settlement-grid" aria-label="口岸数据导入">
          <section className="workspace-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Ship size={18} />} title="进出口报关数据查询" />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadCustomsRecords()
                }}
              >
                <label>
                  报关单号
                  <Input
                    value={customsDeclarationFilter}
                    onChange={(event) => setCustomsDeclarationFilter(event.target.value)}
                  />
                </label>
                <label>
                  报关回单号
                  <Input
                    value={customsReceiptFilter}
                    onChange={(event) => setCustomsReceiptFilter(event.target.value)}
                  />
                </label>
                <label>
                  进出口
                  <FormSelect
                    value={customsTradeTypeFilter}
                    onChange={(event) => setCustomsTradeTypeFilter(event.target.value)}
                  >
                    <option value="">全部</option>
                    <option value="export">出口</option>
                    <option value="import">进口</option>
                  </FormSelect>
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
                <Button
                  htmlType="button"
                  icon={<RefreshCw size={16} />}
                  loading={matchingCustomsReceipts}
                  onClick={() => void autoMatchPortCustomsReceipts()}
                >
                  自动匹配回单
                </Button>
              </form>
            </div>
            <Table<CustomsDeclarationRecord>
              columns={[
                { title: '报关单号', dataIndex: 'declaration_no' },
                { title: '回单号', dataIndex: 'customs_receipt_no', render: nullableText },
                {
                  title: '进出口',
                  dataIndex: 'trade_type',
                  render: (value: string) => (value === 'import' ? '进口' : '出口'),
                },
                { title: '商品', dataIndex: 'product_name' },
                {
                  title: '匹配',
                  dataIndex: 'match_status',
                  render: (value: string) =>
                    value === 'matched' ? <Tag color="green">已匹配</Tag> : <Tag>未匹配</Tag>,
                },
                { title: '核销单', dataIndex: 'verification_document_no', render: nullableText },
                { title: '报关日期', dataIndex: 'customs_date', render: nullableText },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={customsRecords}
              loading={loadingCustomsRecords}
              pagination={false}
              rowKey="id"
              size="small"
            />
            <div className="finance-receipt-strip">
              <span>报关数据 {customsRecords.length} 条</span>
            </div>

            <div className="panel-heading">
              <PanelTitle icon={<FileText size={18} />} title="导入批次记录" />
            </div>
            <Table<PortImportBatch>
              columns={[
                { title: '批次号', dataIndex: 'batch_no' },
                { title: '来源', dataIndex: 'source' },
                { title: '导入日期', dataIndex: 'imported_at' },
                { title: '记录数', dataIndex: 'record_count' },
                { title: '状态', dataIndex: 'status' },
              ]}
              dataSource={portImportBatches}
              loading={loadingPortBatches}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </section>

          <section className="workspace-panel">
            <div className="panel-heading">
              <PanelTitle icon={<Plus size={18} />} title="导入口岸数据" />
            </div>
            <form className="record-form" onSubmit={submitPortBatch}>
              <label>
                批次号
                <Input
                  value={portBatchForm.batch_no}
                  onChange={(event) =>
                    setPortBatchForm((prev) => ({ ...prev, batch_no: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                数据来源
                <Input
                  value={portBatchForm.source}
                  placeholder="如：电子口岸 / 海关"
                  onChange={(event) =>
                    setPortBatchForm((prev) => ({ ...prev, source: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                导入日期
                <Input
                  type="date"
                  value={portBatchForm.imported_at}
                  onChange={(event) =>
                    setPortBatchForm((prev) => ({ ...prev, imported_at: event.target.value }))
                  }
                  required
                />
              </label>
              <div className="form-divider">报关数据明细</div>
              <label>
                报关单号
                <Input
                  value={portRecordForm.declaration_no}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, declaration_no: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                报关回单号
                <Input
                  value={portRecordForm.customs_receipt_no}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, customs_receipt_no: event.target.value }))
                  }
                />
              </label>
              <label>
                进出口类型
                <FormSelect
                  value={portRecordForm.trade_type}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, trade_type: event.target.value }))
                  }
                >
                  <option value="export">出口</option>
                  <option value="import">进口</option>
                </FormSelect>
              </label>
              <label>
                商品名称
                <Input
                  value={portRecordForm.product_name}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, product_name: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                报关金额
                <Input
                  value={portRecordForm.amount}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                币种
                <Input
                  value={portRecordForm.currency}
                  onChange={(event) =>
                    setPortRecordForm((prev) => ({ ...prev, currency: event.target.value }))
                  }
                  required
                />
              </label>
              <Button htmlType="submit" type="primary" loading={submittingPortBatch} icon={<Save size={16} />}>
                导入数据
              </Button>
            </form>
          </section>
        </section>
      </section>
    )
  }

  if (activeModule === 'reports') {
    const reportTabs: { key: string; label: string }[] = [
      { key: 'receipt-usage', label: '水单使用明细' },
      { key: 'bank-receipt-summary', label: '银行水单汇总' },
      { key: 'goods-payment', label: '货款支付情况' },
      { key: 'fee-payment', label: '费用支付情况' },
      { key: 'customs-receipt-collection', label: '报关回单催收' },
      { key: 'tax-refund-statistics', label: '申报退税统计' },
    ]
    return (
      <section className="finance-page">
        {moduleHeader}
        {moduleAlerts}
        <section className="workspace-panel" aria-label="财务统计报表">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<FileSpreadsheet size={18} />} title="财务统计报表" />
            <form
              className="inline-filters"
              onSubmit={(event) => {
                event.preventDefault()
                void loadFinanceReport(activeReport)
              }}
            >
              <label>
                起始日期
                <Input
                  type="date"
                  value={reportDateFrom}
                  onChange={(event) => setReportDateFrom(event.target.value)}
                />
              </label>
              <label>
                结束日期
                <Input
                  type="date"
                  value={reportDateTo}
                  onChange={(event) => setReportDateTo(event.target.value)}
                />
              </label>
              <label>
                币种
                <Input
                  value={reportCurrency}
                  placeholder="如 USD"
                  onChange={(event) => setReportCurrency(event.target.value)}
                />
              </label>
              {activeReport === 'receipt-usage' ? (
                <label>
                  水单号
                  <Input
                    value={reportReceiptNo}
                    onChange={(event) => setReportReceiptNo(event.target.value)}
                  />
                </label>
              ) : null}
              {activeReport === 'bank-receipt-summary' ? (
                <label>
                  收款性质
                  <FormSelect
                    value={reportReceiptType}
                    onChange={(event) => setReportReceiptType(event.target.value)}
                  >
                    <option value="">全部</option>
                    <option value="advance">预收</option>
                    <option value="normal">普通</option>
                    <option value="tax_refund">退税</option>
                  </FormSelect>
                </label>
              ) : null}
              {activeReport === 'goods-payment' ? (
                <label>
                  供应商
                  <Input
                    value={reportSupplierName}
                    onChange={(event) => setReportSupplierName(event.target.value)}
                  />
                </label>
              ) : null}
              {activeReport === 'fee-payment' ? (
                <>
                  <label>
                    合作伙伴
                    <Input
                      value={reportPartnerName}
                      onChange={(event) => setReportPartnerName(event.target.value)}
                    />
                  </label>
                  <label>
                    费用类型
                    <Input
                      value={reportFeeType}
                      onChange={(event) => setReportFeeType(event.target.value)}
                    />
                  </label>
                  <label>
                    业务员
                    <Input
                      value={reportSalesUserId}
                      onChange={(event) => setReportSalesUserId(event.target.value)}
                    />
                  </label>
                </>
              ) : null}
              {activeReport === 'customs-receipt-collection' ? (
                <>
                  <label>
                    业务员
                    <Input
                      value={reportOwnerUserId}
                      onChange={(event) => setReportOwnerUserId(event.target.value)}
                    />
                  </label>
                  <label>
                    催收状态
                    <FormSelect
                      value={reportReminderStatus}
                      onChange={(event) => setReportReminderStatus(event.target.value)}
                    >
                      <option value="">全部</option>
                      <option value="pending">待处理</option>
                      <option value="done">已完成</option>
                      <option value="overdue">已逾期</option>
                    </FormSelect>
                  </label>
                  <label>
                    包含已登记
                    <input
                      checked={reportIncludeRegistered}
                      type="checkbox"
                      onChange={(event) => setReportIncludeRegistered(event.target.checked)}
                    />
                  </label>
                </>
              ) : null}
              {['goods-payment', 'fee-payment', 'tax-refund-statistics'].includes(activeReport) ? (
                <label>
                  状态
                  <Input
                    value={reportStatus}
                    onChange={(event) => setReportStatus(event.target.value)}
                  />
                </label>
              ) : null}
              <Button htmlType="submit" icon={<Search size={16} />} loading={loadingReport}>
                查询
              </Button>
              <Button
                htmlType="button"
                icon={<FileSpreadsheet size={16} />}
                loading={exportingReport}
                onClick={() => void exportFinanceReport(activeReport)}
              >
                导出 CSV
              </Button>
            </form>
          </div>

          <nav className="finance-tab-rail" aria-label="报表切换">
            {reportTabs.map((tab) => (
              <button
                key={tab.key}
                aria-current={tab.key === activeReport ? 'page' : undefined}
                className={tab.key === activeReport ? 'finance-tab active' : 'finance-tab'}
                type="button"
                onClick={() => setActiveReport(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeReport === 'receipt-usage' ? (
            <Table<ReceiptUsageDetailRow>
              columns={[
                { title: '水单号', dataIndex: 'receipt_no' },
                { title: '收款日期', dataIndex: 'received_at' },
                { title: '付款方', dataIndex: 'payer_name' },
                { title: '分摊类型', dataIndex: 'allocation_type' },
                { title: '合同号', dataIndex: 'contract_no', render: nullableText },
                { title: '发票号', dataIndex: 'invoice_no', render: nullableText },
                {
                  title: '分摊金额',
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '下钻',
                  render: (_, record) => (
                    <Button
                      size="small"
                      onClick={() => void openFinanceReportDrilldown(activeReport, record.receipt_no)}
                    >
                      来源
                    </Button>
                  ),
                },
              ]}
              dataSource={receiptUsageReport?.rows ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey={(record) => `${record.receipt_no}-${record.invoice_no ?? record.contract_no ?? ''}-${record.allocated_at}`}
              size="small"
            />
          ) : null}

          {activeReport === 'bank-receipt-summary' ? (
            <Table<BankReceiptCurrencySummary>
              columns={[
                { title: '币种', dataIndex: 'currency' },
                { title: '水单数', dataIndex: 'receipt_count' },
                {
                  title: '合计金额',
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已分摊',
                  dataIndex: 'allocated_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '未分摊',
                  dataIndex: 'unallocated_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={bankReceiptSummaryReport?.currency_summaries ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey="currency"
              size="small"
            />
          ) : null}

          {activeReport === 'goods-payment' ? (
            <Table<GoodsPaymentQueryRow>
              columns={[
                { title: '付款单号', dataIndex: 'request_no' },
                { title: '日期', dataIndex: 'request_date' },
                { title: '供应商', dataIndex: 'supplier_name' },
                { title: '发票号', dataIndex: 'supplier_invoice_no' },
                {
                  title: '申请金额',
                  dataIndex: 'requested_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已付',
                  dataIndex: 'paid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '未付',
                  dataIndex: 'outstanding_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '状态', dataIndex: 'status' },
                {
                  title: '下钻',
                  render: (_, record) => (
                    <Button
                      size="small"
                      onClick={() => void openFinanceReportDrilldown(activeReport, record.request_no)}
                    >
                      来源
                    </Button>
                  ),
                },
              ]}
              dataSource={goodsPaymentReport?.rows ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey="request_no"
              size="small"
            />
          ) : null}

          {activeReport === 'fee-payment' ? (
            <Table<FeePaymentQueryRow>
              columns={[
                { title: '付费单号', dataIndex: 'request_no' },
                { title: '日期', dataIndex: 'request_date' },
                { title: '合作伙伴', dataIndex: 'partner_name' },
                { title: '费用类型', dataIndex: 'fee_type' },
                { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                {
                  title: '申请金额',
                  dataIndex: 'requested_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '未付',
                  dataIndex: 'outstanding_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '状态', dataIndex: 'status' },
                {
                  title: '下钻',
                  render: (_, record) => (
                    <Button
                      size="small"
                      onClick={() => void openFinanceReportDrilldown(activeReport, record.request_no)}
                    >
                      来源
                    </Button>
                  ),
                },
              ]}
              dataSource={feePaymentReport?.rows ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey="request_no"
              size="small"
            />
          ) : null}

          {activeReport === 'customs-receipt-collection' ? (
            <Table<CustomsReceiptCollectionRow>
              columns={[
                { title: '核销单号', dataIndex: 'document_no' },
                { title: '领用日期', dataIndex: 'received_at' },
                { title: '业务员', dataIndex: 'owner_user_name', render: nullableText },
                { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
                { title: '报关单号', dataIndex: 'customs_declaration_no', render: nullableText },
                { title: '提醒日期', dataIndex: 'reminder_date' },
                { title: '催收状态', dataIndex: 'reminder_status' },
                {
                  title: '可退税额',
                  dataIndex: 'refundable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '下钻',
                  render: (_, record) => (
                    <Button
                      size="small"
                      onClick={() => void openFinanceReportDrilldown(activeReport, record.document_no)}
                    >
                      来源
                    </Button>
                  ),
                },
              ]}
              dataSource={customsCollectionReport?.rows ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey="document_no"
              size="small"
            />
          ) : null}

          {activeReport === 'tax-refund-statistics' ? (
            <Table<TaxRefundCurrencyTotal>
              columns={[
                { title: '币种', dataIndex: 'currency' },
                { title: '核销单数', dataIndex: 'document_count' },
                {
                  title: '可退税额',
                  dataIndex: 'refundable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已退税额',
                  dataIndex: 'refunded_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '待退税额',
                  dataIndex: 'outstanding_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={taxRefundStatisticsReport?.currency_totals ?? []}
              loading={loadingReport}
              pagination={false}
              rowKey="currency"
              size="small"
            />
          ) : null}

          {reportExplanation ? (
            <section className="finance-action-block" aria-label="报表口径说明">
              <PanelTitle icon={<FileText size={18} />} title="统计口径" />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="数据来源">
                  {reportExplanation.source_tables.join('、')}
                </Descriptions.Item>
                <Descriptions.Item label="计算规则">
                  {reportExplanation.metric_rules.join('；')}
                </Descriptions.Item>
                <Descriptions.Item label="字段">
                  {reportExplanation.fields.map((field) => `${field.label}: ${field.formula}`).join('；')}
                </Descriptions.Item>
              </Descriptions>
              {loadingReportExplanation ? <Skeleton active paragraph={false} /> : null}
            </section>
          ) : null}

          {reportDrilldown ? (
            <section className="finance-action-block" aria-label="报表下钻">
              <PanelTitle icon={<ChevronRight size={18} />} title="来源下钻" />
              <Descriptions column={1} size="small">
                <Descriptions.Item label="来源编号">{reportDrilldown.source_no}</Descriptions.Item>
                <Descriptions.Item label="来源类型">{reportDrilldown.source_type}</Descriptions.Item>
                <Descriptions.Item label="入口">
                  {reportDrilldown.items.length > 0
                    ? reportDrilldown.items
                        .map((item) => `${item.label}: ${item.value ?? ''} ${item.target_path ?? ''}`)
                        .join('；')
                    : '未找到可下钻来源'}
                </Descriptions.Item>
              </Descriptions>
            </section>
          ) : null}
        </section>
      </section>
    )
  }

  return null
}

function initialBankReceiptForm(): BankReceiptFormState {
  return {
    receipt_no: `BR-${Date.now().toString().slice(-6)}`,
    received_at: '2026-08-01',
    payer_name: 'Euro Home Retail Ltd.',
    customer_id: 'customer-euro-home',
    customer_name: '欧陆家居用品有限公司',
    amount: '500.00',
    currency: 'USD',
    bank_account: 'BOC 6222 ****',
    reference_no: '',
    receipt_type: 'advance',
    remark: '',
  }
}

function initialReceiptClaimForm(): ReceiptClaimFormState {
  return {
    claimed_at: '2026-08-02',
    sales_user_id: 'u-001',
    sales_user_name: '演示业务主管',
    note: '确认客户预收款',
  }
}

function initialReceiptAllocationForm(currency = 'USD'): ReceiptAllocationFormState {
  return {
    allocation_type: 'contract',
    contract_id: '',
    contract_no: '',
    invoice_no: '',
    allocated_at: '2026-08-03',
    amount: '300.00',
    currency,
    remark: '',
  }
}

function bankReceiptPayload(form: BankReceiptFormState): BankReceiptCreatePayload {
  return {
    receipt_no: form.receipt_no.trim(),
    received_at: form.received_at,
    payer_name: form.payer_name.trim(),
    customer_id: emptyToNull(form.customer_id),
    customer_name: emptyToNull(form.customer_name),
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    bank_account: form.bank_account.trim(),
    reference_no: emptyToNull(form.reference_no),
    receipt_type: form.receipt_type,
    remark: emptyToNull(form.remark),
  }
}

function receiptClaimPayload(form: ReceiptClaimFormState): BankReceiptClaimPayload {
  return {
    claimed_at: form.claimed_at,
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    note: emptyToNull(form.note),
  }
}

function receiptAllocationPayload(
  form: ReceiptAllocationFormState,
): BankReceiptAllocationPayload {
  return {
    allocation_type: form.allocation_type,
    contract_id: emptyToNull(form.contract_id),
    contract_no: emptyToNull(form.contract_no),
    invoice_no: emptyToNull(form.invoice_no),
    allocated_at: form.allocated_at,
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    remark: emptyToNull(form.remark),
  }
}

function receiptStatusLabel(value: string): string {
  return receiptStatusOptions.find((item) => item.value === value)?.label ?? value
}

function receiptStatusColor(value: string): string {
  if (value === 'allocated') return 'success'
  if (value === 'partially_allocated') return 'processing'
  if (value === 'claimed') return 'warning'
  return 'default'
}

function receiptStatusTag(value: string): ReactNode {
  return <Tag color={receiptStatusColor(value)}>{receiptStatusLabel(value)}</Tag>
}

function receiptTypeLabel(value: string): string {
  return receiptTypeOptions.find((item) => item.value === value)?.label ?? value
}

function allocationTypeLabel(value: string): string {
  return allocationTypeOptions.find((item) => item.value === value)?.label ?? value
}

function receivableStatusLabel(value: string): string {
  if (value === 'paid') return '已收清'
  if (value === 'partial') return '部分收款'
  return '未收款'
}

function receivableStatusTag(value: string): ReactNode {
  const color = value === 'paid' ? 'success' : value === 'partial' ? 'warning' : 'default'
  return <Tag color={color}>{receivableStatusLabel(value)}</Tag>
}

function initialSupplierInvoiceForm(): SupplierInvoiceFormState {
  return {
    invoice_no: `SI-${Date.now().toString().slice(-6)}`,
    invoice_date: '2026-09-09',
    supplier_id: 'supplier-pack-a',
    supplier_name: '华东包装制品厂',
    purchase_invoice_notice_id: '',
    purchase_invoice_notice_code: '',
    purchase_contract_id: 'pc-pay-ui-001',
    purchase_contract_no: 'PC-PAY-UI-001',
    total_amount: '3200.00',
    currency: 'CNY',
    due_date: '2026-09-20',
    remark: '',
  }
}

function initialPaymentRequestForm(invoice?: SupplierInvoice): PaymentRequestFormState {
  return {
    request_no: `PR-${Date.now().toString().slice(-6)}`,
    supplier_invoice_id: invoice?.id ?? '',
    payment_type: 'goods_payment',
    request_date: '2026-09-10',
    requested_amount: invoice?.unpaid_amount ?? '1200.00',
    currency: invoice?.currency ?? 'CNY',
    remark: '',
  }
}

function initialPaymentApprovalForm(amount = '1200.00'): PaymentApprovalFormState {
  return {
    approved_amount: amount,
    approved_at: '2026-09-11',
    reviewer_name: '演示财务',
    payment_account: 'BOC 8888',
    remark: '',
  }
}

function supplierInvoicePayload(form: SupplierInvoiceFormState): SupplierInvoiceCreatePayload {
  return {
    invoice_no: form.invoice_no.trim(),
    invoice_date: form.invoice_date,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    purchase_invoice_notice_id: emptyToNull(form.purchase_invoice_notice_id),
    purchase_invoice_notice_code: emptyToNull(form.purchase_invoice_notice_code),
    purchase_contract_id: emptyToNull(form.purchase_contract_id),
    purchase_contract_no: emptyToNull(form.purchase_contract_no),
    total_amount: form.total_amount.trim(),
    currency: form.currency.trim(),
    due_date: emptyToNull(form.due_date),
    remark: emptyToNull(form.remark),
  }
}

function paymentRequestPayload(form: PaymentRequestFormState): PaymentRequestCreatePayload {
  return {
    request_no: form.request_no.trim(),
    supplier_invoice_id: form.supplier_invoice_id.trim(),
    payment_type: form.payment_type,
    request_date: form.request_date,
    requested_amount: form.requested_amount.trim(),
    currency: form.currency.trim(),
    remark: emptyToNull(form.remark),
  }
}

function paymentApprovalPayload(form: PaymentApprovalFormState): PaymentRequestApprovePayload {
  return {
    approved_amount: form.approved_amount.trim(),
    approved_at: form.approved_at,
    reviewer_name: form.reviewer_name.trim(),
    payment_account: emptyToNull(form.payment_account),
    remark: emptyToNull(form.remark),
  }
}

function supplierInvoiceStatusLabel(value: string): string {
  return supplierInvoiceStatusOptions.find((item) => item.value === value)?.label ?? value
}

function supplierInvoiceStatusTag(value: string): ReactNode {
  const color = value === 'paid' ? 'success' : value === 'partial' ? 'warning' : 'default'
  return <Tag color={color}>{supplierInvoiceStatusLabel(value)}</Tag>
}

function paymentRequestStatusLabel(value: string): string {
  return paymentRequestStatusOptions.find((item) => item.value === value)?.label ?? value
}

function paymentRequestStatusTag(value: string): ReactNode {
  const color = value === 'approved' ? 'success' : value === 'submitted' ? 'processing' : 'error'
  return <Tag color={color}>{paymentRequestStatusLabel(value)}</Tag>
}

function paymentTypeLabel(value: string): string {
  return paymentTypeOptions.find((item) => item.value === value)?.label ?? value
}

function initialPartnerFeeInvoiceForm(): PartnerFeeInvoiceFormState {
  return {
    invoice_no: `PFI-${Date.now().toString().slice(-6)}`,
    invoice_date: '2026-09-12',
    partner_id: 'partner-freight-ui',
    partner_name: '上海远洋货代有限公司',
    partner_type: 'freight_forwarder',
    shipment_plan_id: '',
    shipment_no: 'SHIP-FEE-UI-001',
    sales_user_id: 'u-001',
    sales_user_name: '演示业务主管',
    fee_type: 'freight',
    total_amount: '980.00',
    currency: 'USD',
    due_date: '2026-09-25',
    remark: '',
  }
}

function initialFeePaymentRequestForm(invoice?: PartnerFeeInvoice): FeePaymentRequestFormState {
  return {
    request_no: `FPR-${Date.now().toString().slice(-6)}`,
    partner_fee_invoice_id: invoice?.id ?? '',
    request_date: '2026-09-13',
    requested_amount: invoice?.unpaid_amount ?? '400.00',
    currency: invoice?.currency ?? 'USD',
    remark: '',
  }
}

function initialFeePaymentApprovalForm(amount = '400.00'): FeePaymentApprovalFormState {
  return {
    approved_amount: amount,
    approved_at: '2026-09-14',
    reviewer_name: '演示财务',
    payment_account: 'BOC 9999',
    remark: '',
  }
}

function partnerFeeInvoicePayload(form: PartnerFeeInvoiceFormState): PartnerFeeInvoiceCreatePayload {
  return {
    invoice_no: form.invoice_no.trim(),
    invoice_date: form.invoice_date,
    partner_id: emptyToNull(form.partner_id),
    partner_name: form.partner_name.trim(),
    partner_type: emptyToNull(form.partner_type),
    shipment_plan_id: emptyToNull(form.shipment_plan_id),
    shipment_no: emptyToNull(form.shipment_no),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    fee_type: form.fee_type,
    total_amount: form.total_amount.trim(),
    currency: form.currency.trim(),
    due_date: emptyToNull(form.due_date),
    remark: emptyToNull(form.remark),
  }
}

function feePaymentRequestPayload(form: FeePaymentRequestFormState): FeePaymentRequestCreatePayload {
  return {
    request_no: form.request_no.trim(),
    partner_fee_invoice_id: form.partner_fee_invoice_id.trim(),
    request_date: form.request_date,
    requested_amount: form.requested_amount.trim(),
    currency: form.currency.trim(),
    remark: emptyToNull(form.remark),
  }
}

function feePaymentApprovalPayload(form: FeePaymentApprovalFormState): FeePaymentRequestApprovePayload {
  return {
    approved_amount: form.approved_amount.trim(),
    approved_at: form.approved_at,
    reviewer_name: form.reviewer_name.trim(),
    payment_account: emptyToNull(form.payment_account),
    remark: emptyToNull(form.remark),
  }
}

function partnerFeeInvoiceStatusLabel(value: string): string {
  return partnerFeeInvoiceStatusOptions.find((item) => item.value === value)?.label ?? value
}

function partnerFeeInvoiceStatusTag(value: string): ReactNode {
  const color = value === 'paid' ? 'success' : value === 'partial' ? 'warning' : 'default'
  return <Tag color={color}>{partnerFeeInvoiceStatusLabel(value)}</Tag>
}

function feePaymentRequestStatusLabel(value: string): string {
  return feePaymentRequestStatusOptions.find((item) => item.value === value)?.label ?? value
}

function feePaymentRequestStatusTag(value: string): ReactNode {
  const color = value === 'approved' ? 'success' : value === 'submitted' ? 'processing' : 'error'
  return <Tag color={color}>{feePaymentRequestStatusLabel(value)}</Tag>
}

function feeTypeLabel(value: string): string {
  return feeTypeOptions.find((item) => item.value === value)?.label ?? value
}

function initialVerificationDocumentForm(): VerificationDocumentFormState {
  return {
    document_no: `VD-${Date.now().toString().slice(-6)}`,
    received_at: '2026-11-27',
    owner_user_id: 'u-001',
    owner_user_name: '演示业务主管',
    shipment_plan_id: '',
    shipment_no: 'SP-TAX-UI-001',
    customer_name: '欧陆家居用品有限公司',
    currency: 'USD',
    refundable_amount: '96.00',
    valid_until: '2026-12-27',
    remark: '',
  }
}

function initialCustomsReceiptForm(): CustomsReceiptFormState {
  return {
    customs_declaration_no: `CD-${Date.now().toString().slice(-6)}`,
    customs_receipt_no: `CR-${Date.now().toString().slice(-6)}`,
    received_at: '2026-11-28',
    remark: '',
  }
}

function initialVerificationRegisterForm(): VerificationRegisterFormState {
  return {
    verification_no: `VERIFY-${Date.now().toString().slice(-6)}`,
    verified_at: '2026-12-01',
    remark: '',
  }
}

function initialTaxRefundForm(currency = 'USD', amount = '96.00'): TaxRefundFormState {
  return {
    refund_no: `TR-${Date.now().toString().slice(-6)}`,
    refunded_at: '2026-12-08',
    amount,
    currency,
    bank_receipt_no: '',
    remark: '',
  }
}

function verificationDocumentPayload(
  form: VerificationDocumentFormState,
): VerificationDocumentCreatePayload {
  return {
    document_no: form.document_no.trim(),
    received_at: form.received_at,
    owner_user_id: emptyToNull(form.owner_user_id),
    owner_user_name: emptyToNull(form.owner_user_name),
    shipment_plan_id: emptyToNull(form.shipment_plan_id),
    shipment_no: emptyToNull(form.shipment_no),
    customer_name: emptyToNull(form.customer_name),
    currency: form.currency.trim(),
    refundable_amount: form.refundable_amount.trim(),
    valid_until: form.valid_until,
    remark: emptyToNull(form.remark),
  }
}

function customsReceiptPayload(form: CustomsReceiptFormState): CustomsReceiptRegisterPayload {
  return {
    customs_declaration_no: form.customs_declaration_no.trim(),
    customs_receipt_no: form.customs_receipt_no.trim(),
    received_at: form.received_at,
    remark: emptyToNull(form.remark),
  }
}

function verificationRegisterPayload(form: VerificationRegisterFormState): VerificationRegisterPayload {
  return {
    verification_no: form.verification_no.trim(),
    verified_at: form.verified_at,
    remark: emptyToNull(form.remark),
  }
}

function taxRefundPayload(form: TaxRefundFormState): TaxRefundRegisterPayload {
  return {
    refund_no: form.refund_no.trim(),
    refunded_at: form.refunded_at,
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    bank_receipt_no: emptyToNull(form.bank_receipt_no),
    remark: emptyToNull(form.remark),
  }
}

function verificationDocumentStatusLabel(value: string): string {
  return verificationDocumentStatusOptions.find((item) => item.value === value)?.label ?? value
}

function verificationDocumentStatusTag(value: string): ReactNode {
  const color =
    value === 'refunded'
      ? 'success'
      : value === 'verified'
        ? 'processing'
        : value === 'customs_receipt_registered'
          ? 'warning'
          : 'default'
  return <Tag color={color}>{verificationDocumentStatusLabel(value)}</Tag>
}

function verificationReminderStatusLabel(value: string): string {
  return verificationReminderStatusOptions.find((item) => item.value === value)?.label ?? value
}

function verificationReminderStatusTag(value: string): ReactNode {
  const color = value === 'done' ? 'success' : value === 'overdue' ? 'error' : 'default'
  return <Tag color={color}>{verificationReminderStatusLabel(value)}</Tag>
}

function initialMiscFeeItemForm(): MiscFeeItemFormState {
  return {
    code: `MISC-${Date.now().toString().slice(-6)}`,
    name: '办公费用',
    category: 'office',
    default_allocation_method: 'manual',
    is_active: true,
    remark: '',
  }
}

function initialMiscFeeAllocationForm(item?: MiscFeeItem): MiscFeeAllocationFormState {
  return {
    allocation_no: `MFA-${Date.now().toString().slice(-6)}`,
    item_id: item?.id ?? '',
    shipment_plan_id: '',
    shipment_no: 'SP-MISC-UI-001',
    sales_user_id: 'u-001',
    sales_user_name: '演示业务主管',
    allocated_at: '2026-12-22',
    amount: '36.00',
    currency: 'USD',
    allocation_method: item?.default_allocation_method ?? 'manual',
    basis: '按本票业务实际占用分摊',
    remark: '',
  }
}

function miscFeeItemPayload(form: MiscFeeItemFormState): MiscFeeItemCreatePayload {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    category: form.category,
    default_allocation_method: form.default_allocation_method,
    is_active: form.is_active,
    remark: emptyToNull(form.remark),
  }
}

function miscFeeAllocationPayload(
  form: MiscFeeAllocationFormState,
  selectedItem: MiscFeeItem | null,
): MiscFeeAllocationCreatePayload {
  return {
    allocation_no: form.allocation_no.trim(),
    item_id: form.item_id.trim() || selectedItem?.id || '',
    shipment_plan_id: form.shipment_plan_id.trim(),
    shipment_no: emptyToNull(form.shipment_no),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    allocated_at: form.allocated_at,
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    allocation_method: form.allocation_method,
    basis: emptyToNull(form.basis),
    remark: emptyToNull(form.remark),
  }
}

function miscFeeCategoryLabel(value: string): string {
  return miscFeeCategoryOptions.find((item) => item.value === value)?.label ?? value
}

function miscFeeAllocationMethodLabel(value: string): string {
  return miscFeeAllocationMethodOptions.find((item) => item.value === value)?.label ?? value
}

function miscFeeItemStatusLabel(value: string): string {
  return miscFeeItemStatusOptions.find((item) => item.value === value)?.label ?? value
}

function miscFeeItemStatusTag(value: string): ReactNode {
  const color = value === 'active' ? 'success' : 'default'
  return <Tag color={color}>{miscFeeItemStatusLabel(value)}</Tag>
}

function reimbursementCategoryLabel(value: string): string {
  const labels: Record<string, string> = {
    travel: '差旅',
    office: '办公',
    entertainment: '招待',
    other: '其他',
  }
  return labels[value] ?? value
}

function reimbursementStatusTag(value: string): ReactNode {
  const config: Record<string, { color: string; label: string }> = {
    submitted: { color: 'processing', label: '待审批' },
    approved: { color: 'success', label: '已审批' },
    rejected: { color: 'error', label: '已驳回' },
    paid: { color: 'default', label: '已付款' },
  }
  const item = config[value] ?? { color: 'default', label: value }
  return <Tag color={item.color}>{item.label}</Tag>
}

function initialFinancialSettlementForm(): FinancialSettlementFormState {
  return {
    settlement_no: `FS-${Date.now().toString().slice(-6)}`,
    shipment_plan_id: '',
    shipment_no: '',
    settlement_date: '2027-01-22',
    remark: '',
  }
}

function initialManualProfitCostForm(
  currency = 'USD',
  settlementDate = '2027-01-22',
): ManualProfitCostFormState {
  return {
    cost_no: `MC-${Date.now().toString().slice(-6)}`,
    cost_type: 'other_cost',
    cost_date: settlementDate,
    amount: '18.00',
    currency,
    source_no: '',
    reason: '补录单票其他成本',
    remark: '',
  }
}

function financialSettlementPayload(
  form: FinancialSettlementFormState,
): FinancialSettlementCreatePayload {
  return {
    settlement_no: form.settlement_no.trim(),
    shipment_plan_id: form.shipment_plan_id.trim(),
    shipment_no: emptyToNull(form.shipment_no),
    settlement_date: form.settlement_date,
    remark: emptyToNull(form.remark),
  }
}

function manualProfitCostPayload(
  form: ManualProfitCostFormState,
): ManualProfitCostCreatePayload {
  return {
    cost_no: form.cost_no.trim(),
    cost_type: form.cost_type,
    cost_date: form.cost_date,
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    source_no: emptyToNull(form.source_no),
    reason: form.reason.trim(),
    remark: emptyToNull(form.remark),
  }
}

function settlementStatusLabel(value: string): string {
  return settlementStatusOptions.find((item) => item.value === value)?.label ?? value
}

function settlementStatusTag(value: string): ReactNode {
  const color = value === 'locked' ? 'success' : 'default'
  return <Tag color={color}>{settlementStatusLabel(value)}</Tag>
}

function approvalDocumentTypeLabel(value: string): string {
  return reportingDocumentTypeOptions.find((item) => item.value === value)?.label ?? value
}

function approvalDocumentTypeTag(value: string): ReactNode {
  const color = value === 'export_contract' ? 'processing' : 'purple'
  return <Tag color={color}>{approvalDocumentTypeLabel(value)}</Tag>
}

function approvalStatusTag(value: string): ReactNode {
  const color = value === 'approved' ? 'success' : value === 'submitted' ? 'warning' : 'default'
  const label = reportingStatusOptions.find((item) => item.value === value)?.label ?? value
  return <Tag color={color}>{label}</Tag>
}

function sourcePathTag(value: string): ReactNode {
  return <Tag color="default">{value}</Tag>
}

function profitCostTypeLabel(value: string): string {
  return profitCostTypeOptions.find((item) => item.value === value)?.label ?? value
}

function profitCostDirectionTag(value: string): ReactNode {
  const label = value === 'income' ? '收入' : '成本'
  const color = value === 'income' ? 'success' : 'warning'
  return <Tag color={color}>{label}</Tag>
}



function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function nullableText(value: string | null): string {
  return value ?? '-'
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

function initialSampleRequestForm(): SampleRequestFormState {
  return {
    code: `SR-${Date.now().toString().slice(-6)}`,
    status: 'draft',
    request_date: todayInputValue(),
    due_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    product_id: '',
    product_code: '',
    product_name: '',
    supplier_id: '',
    supplier_name: '',
    sales_user_id: '',
    sales_user_name: '',
    destination: 'in_house',
    requirements: '',
    line_product_id: '',
    line_product_code: '',
    line_product_name: '',
    line_specification: '',
    line_quantity: '1',
    line_unit: 'pcs',
    line_requirement: '',
  }
}

function initialSampleProgressForm(): SampleProgressFormState {
  return {
    stage: 'sent_to_factory',
    status: 'in_progress',
    occurred_at: todayInputValue(),
    handler_name: '',
    note: '',
  }
}

function initialSampleFeeForm(): SampleFeeFormState {
  return {
    fee_type: 'sample_making',
    amount: '0',
    currency: 'USD',
    payee_type: 'supplier',
    payee_name: '',
    remark: '',
  }
}

function sampleRequestPayload(form: SampleRequestFormState): SampleRequestCreatePayload {
  const lines: SampleRequestLinePayload[] = []
  if (form.line_product_name.trim()) {
    lines.push({
      product_id: emptyToNull(form.line_product_id),
      product_code: emptyToNull(form.line_product_code),
      product_name: form.line_product_name.trim(),
      specification: emptyToNull(form.line_specification),
      quantity: form.line_quantity,
      unit: form.line_unit.trim(),
      requirement: emptyToNull(form.line_requirement),
    })
  }

  return {
    code: form.code.trim(),
    request_date: form.request_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    product_id: emptyToNull(form.product_id),
    product_code: emptyToNull(form.product_code),
    product_name: emptyToNull(form.product_name),
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: emptyToNull(form.supplier_name),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    destination: form.destination,
    requirements: form.requirements.trim(),
    due_date: emptyToNull(form.due_date),
    status: form.status,
    lines,
  }
}

function sampleProgressPayload(form: SampleProgressFormState): SampleProgressPayload {
  return {
    stage: form.stage,
    status: form.status,
    occurred_at: form.occurred_at,
    handler_name: emptyToNull(form.handler_name),
    note: emptyToNull(form.note),
  }
}

function sampleFeePayload(form: SampleFeeFormState): SampleFeePayload {
  return {
    fee_type: form.fee_type,
    amount: form.amount,
    currency: form.currency.trim(),
    payee_type: form.payee_type,
    payee_name: form.payee_name.trim(),
    remark: emptyToNull(form.remark),
  }
}

function sampleStatusLabel(value: string): string {
  return sampleStatusOptions.find((item) => item.value === value)?.label ?? value
}

function sampleDestinationLabel(value: string): string {
  return sampleDestinationOptions.find((item) => item.value === value)?.label ?? value
}

function sampleProgressStageLabel(value: string): string {
  return sampleProgressStageOptions.find((item) => item.value === value)?.label ?? value
}

function sampleFeeTypeLabel(value: string): string {
  return sampleFeeTypeOptions.find((item) => item.value === value)?.label ?? value
}

function samplePaymentStatusLabel(value: string): string {
  if (value === 'requested') return '已申请'
  if (value === 'paid') return '已付款'
  return '未申请'
}

function initialSampleRecordForm(): SampleRecordFormState {
  return {
    code: `SM-${Date.now().toString().slice(-6)}`,
    sample_type: 'confirm_sample',
    status: 'registered',
    quantity: '1',
    received_at: todayInputValue(),
    submitted_at: todayInputValue(),
    product_id: '',
    product_code: '',
    product_name: '',
    customer_id: '',
    customer_name: '',
    supplier_id: '',
    supplier_name: '',
    customer_sku: '',
    supplier_sku: '',
    purchase_contract_id: '',
    purchase_contract_no: '',
    unit: 'pcs',
    source_type: 'sample_request',
    source_id: '',
    source_code: '',
    source_note: '',
    description: '',
    image_file_id: '',
    image_filename: '',
    image_url: '',
    image_caption: '',
  }
}

function sampleRecordFormFromRequest(
  request: SampleRequest,
  current: SampleRecordFormState,
): SampleRecordFormState {
  const line = request.lines[0]
  return {
    ...current,
    code: `SM-${request.code}`,
    sample_type: 'confirm_sample',
    status: 'registered',
    quantity: line?.quantity ?? current.quantity,
    received_at: todayInputValue(),
    submitted_at: todayInputValue(),
    product_id: line?.product_id ?? request.product_id ?? current.product_id,
    product_code: line?.product_code ?? request.product_code ?? current.product_code,
    product_name: line?.product_name ?? request.product_name ?? current.product_name,
    customer_id: request.customer_id ?? current.customer_id,
    customer_name: request.customer_name,
    supplier_id: request.supplier_id ?? current.supplier_id,
    supplier_name: request.supplier_name ?? current.supplier_name,
    unit: line?.unit ?? current.unit,
    source_type: 'sample_request',
    source_id: request.id,
    source_code: request.code,
    source_note: request.requirements,
    description: line?.requirement ?? request.requirements,
  }
}

function initialSampleRecordImageForm(): SampleRecordImageFormState {
  return {
    file_id: '',
    filename: '',
    url: '',
    caption: '',
  }
}

function initialSampleRecordStockForm(): SampleRecordStockFormState {
  return {
    event_type: 'delivered',
    quantity: '1',
    occurred_at: todayInputValue(),
    unit: 'pcs',
    delivery_no: '',
    recipient: '',
    note: '',
  }
}

function sampleRequestToRecordPayload(form: SampleRecordFormState): SampleRequestToRecordPayload {
  const images: SampleRecordImagePayload[] = []
  if (form.image_file_id.trim() && form.image_filename.trim() && form.image_url.trim()) {
    images.push({
      file_id: form.image_file_id.trim(),
      filename: form.image_filename.trim(),
      url: form.image_url.trim(),
      caption: emptyToNull(form.image_caption),
      is_primary: true,
    })
  }

  return {
    code: form.code.trim(),
    sample_type: form.sample_type,
    status: form.status,
    received_at: form.received_at,
    submitted_at: emptyToNull(form.submitted_at),
    quantity: form.quantity,
    unit: form.unit.trim(),
    customer_sku: emptyToNull(form.customer_sku),
    supplier_sku: emptyToNull(form.supplier_sku),
    purchase_contract_id: emptyToNull(form.purchase_contract_id),
    purchase_contract_no: emptyToNull(form.purchase_contract_no),
    description: emptyToNull(form.description),
    images,
  }
}

function sampleRecordPayload(form: SampleRecordFormState): SampleRecordCreatePayload {
  const images: SampleRecordImagePayload[] = []
  if (form.image_file_id.trim() && form.image_filename.trim() && form.image_url.trim()) {
    images.push({
      file_id: form.image_file_id.trim(),
      filename: form.image_filename.trim(),
      url: form.image_url.trim(),
      caption: emptyToNull(form.image_caption),
      is_primary: true,
    })
  }

  return {
    code: form.code.trim(),
    sample_type: form.sample_type,
    status: form.status,
    product_id: emptyToNull(form.product_id),
    product_code: emptyToNull(form.product_code),
    product_name: form.product_name.trim(),
    customer_id: emptyToNull(form.customer_id),
    customer_name: emptyToNull(form.customer_name),
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: emptyToNull(form.supplier_name),
    customer_sku: emptyToNull(form.customer_sku),
    supplier_sku: emptyToNull(form.supplier_sku),
    purchase_contract_id: emptyToNull(form.purchase_contract_id),
    purchase_contract_no: emptyToNull(form.purchase_contract_no),
    source_type: emptyToNull(form.source_type),
    source_id: emptyToNull(form.source_id),
    source_code: emptyToNull(form.source_code),
    source_note: emptyToNull(form.source_note),
    received_at: form.received_at,
    submitted_at: emptyToNull(form.submitted_at),
    quantity: form.quantity,
    unit: form.unit.trim(),
    description: emptyToNull(form.description),
    images,
  }
}

function sampleRecordImagePayload(form: SampleRecordImageFormState): SampleRecordImagePayload {
  return {
    file_id: form.file_id.trim(),
    filename: form.filename.trim(),
    url: form.url.trim(),
    caption: emptyToNull(form.caption),
    is_primary: false,
  }
}

function sampleRecordStockPayload(form: SampleRecordStockFormState): SampleRecordStockEventPayload {
  return {
    event_type: form.event_type,
    quantity: form.quantity,
    unit: form.unit.trim(),
    occurred_at: form.occurred_at,
    delivery_no: emptyToNull(form.delivery_no),
    recipient: emptyToNull(form.recipient),
    note: emptyToNull(form.note),
  }
}

function applySampleStockEvent(record: SampleRecord, stockEvent: SampleRecordStockEvent): SampleRecord {
  const received = Number(record.stock_summary.received_quantity)
  const delivered = Number(record.stock_summary.delivered_quantity)
  const quantity = Number(stockEvent.quantity)
  const nextReceived = stockEvent.event_type === 'received' ? received + quantity : received
  const nextDelivered = stockEvent.event_type === 'delivered' ? delivered + quantity : delivered
  const nextRetained = Math.max(nextReceived - nextDelivered, 0)

  return {
    ...record,
    stock_events: [...record.stock_events, stockEvent],
    stock_summary: {
      ...record.stock_summary,
      received_quantity: formatQuantity(nextReceived),
      delivered_quantity: formatQuantity(nextDelivered),
      retained_quantity: formatQuantity(nextRetained),
      unit: stockEvent.unit,
    },
  }
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

function sampleRecordTypeLabel(value: string): string {
  return sampleRecordTypeOptions.find((item) => item.value === value)?.label ?? value
}

function sampleRecordStatusLabel(value: string): string {
  return sampleRecordStatusOptions.find((item) => item.value === value)?.label ?? value
}

function sampleStockEventTypeLabel(value: string): string {
  return sampleStockEventTypeOptions.find((item) => item.value === value)?.label ?? value
}

function initialSampleDeliveryFeeStatistics(): SampleDeliveryFeeStatistics {
  return {
    items: [],
    total_amount: '0.00',
    currency: 'USD',
  }
}

function initialSampleDeliveryStatistics(): SampleDeliveryStatistics {
  return {
    total_deliveries: 0,
    total_quantity: '0.00',
    by_status: [],
    by_customer: [],
    by_express: [],
  }
}

function initialSampleDeliveryForm(): SampleDeliveryFormState {
  return {
    code: `SD-${Date.now().toString().slice(-6)}`,
    delivery_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    supplier_id: '',
    supplier_name: '',
    factory_id: '',
    factory_name: '',
    recipient_name: '',
    recipient_company: '',
    recipient_address: '',
    express_company: 'DHL',
    tracking_no: '',
    quote_id: '',
    quote_no: '',
    remark: '',
    sample_record_id: '',
    sample_code: '',
    sample_type: 'confirm_sample',
    product_id: '',
    product_code: '',
    product_name: '',
    quantity: '1',
    unit: 'pcs',
    line_remark: '',
    fee_type: 'express',
    fee_amount: '0.00',
    fee_currency: 'USD',
    fee_payer_type: 'company',
    fee_remark: '',
  }
}

function initialSampleDeliveryApproveForm(): SampleDeliveryApproveFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: todayInputValue(),
  }
}

function initialSampleDeliveryTrackingForm(): SampleDeliveryTrackingFormState {
  return {
    express_company: 'DHL',
    tracking_no: '',
    status: 'shipped',
  }
}

function sampleDeliveryToForm(delivery: SampleDelivery): SampleDeliveryFormState {
  const line = delivery.lines[0]
  const fee = delivery.fees[0]
  return {
    code: delivery.code,
    delivery_date: delivery.delivery_date,
    customer_id: delivery.customer_id ?? '',
    customer_name: delivery.customer_name,
    supplier_id: delivery.supplier_id ?? '',
    supplier_name: delivery.supplier_name ?? '',
    factory_id: delivery.factory_id ?? '',
    factory_name: delivery.factory_name ?? '',
    recipient_name: delivery.recipient_name,
    recipient_company: delivery.recipient_company ?? '',
    recipient_address: delivery.recipient_address,
    express_company: delivery.express_company,
    tracking_no: delivery.tracking_no ?? '',
    quote_id: delivery.quote_id ?? '',
    quote_no: delivery.quote_no ?? '',
    remark: delivery.remark ?? '',
    sample_record_id: line?.sample_record_id ?? '',
    sample_code: line?.sample_code ?? '',
    sample_type: line?.sample_type ?? 'confirm_sample',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
    line_remark: line?.remark ?? '',
    fee_type: fee?.fee_type ?? 'express',
    fee_amount: fee?.amount ?? '0.00',
    fee_currency: fee?.currency ?? 'USD',
    fee_payer_type: fee?.payer_type ?? 'company',
    fee_remark: fee?.remark ?? '',
  }
}

function sampleDeliveryPayload(form: SampleDeliveryFormState): SampleDeliveryCreatePayload {
  return {
    code: form.code.trim(),
    delivery_date: form.delivery_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: emptyToNull(form.supplier_name),
    factory_id: emptyToNull(form.factory_id),
    factory_name: emptyToNull(form.factory_name),
    recipient_name: form.recipient_name.trim(),
    recipient_company: emptyToNull(form.recipient_company),
    recipient_address: form.recipient_address.trim(),
    express_company: form.express_company.trim(),
    tracking_no: emptyToNull(form.tracking_no),
    quote_id: emptyToNull(form.quote_id),
    quote_no: emptyToNull(form.quote_no),
    remark: emptyToNull(form.remark),
    lines: [
      {
        sample_record_id: form.sample_record_id.trim(),
        sample_code: emptyToNull(form.sample_code),
        sample_type: form.sample_type,
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        quantity: form.quantity,
        unit: form.unit.trim(),
        remark: emptyToNull(form.line_remark),
      },
    ],
    fees: [
      {
        fee_type: form.fee_type,
        amount: form.fee_amount,
        currency: form.fee_currency.trim(),
        payer_type: form.fee_payer_type,
        remark: emptyToNull(form.fee_remark),
      },
    ],
  }
}

function sampleDeliveryApprovePayload(
  form: SampleDeliveryApproveFormState,
): SampleDeliveryApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function sampleDeliveryTrackingPayload(
  form: SampleDeliveryTrackingFormState,
): SampleDeliveryTrackingPayload {
  return {
    express_company: form.express_company.trim(),
    tracking_no: form.tracking_no.trim(),
    status: form.status,
  }
}

function sampleDeliveryStatusLabel(value: string): string {
  return sampleDeliveryStatusOptions.find((item) => item.value === value)?.label ?? value
}

function sampleDeliveryFeeTypeLabel(value: string): string {
  return sampleDeliveryFeeTypeOptions.find((item) => item.value === value)?.label ?? value
}

function sampleDeliveryPayerTypeLabel(value: string): string {
  return sampleDeliveryPayerTypeOptions.find((item) => item.value === value)?.label ?? value
}

function initialExportQuotationForm(): ExportQuotationFormState {
  return {
    code: `QT-${Date.now().toString().slice(-6)}`,
    quote_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    sales_user_id: '',
    sales_user_name: '演示业务主管',
    currency: 'USD',
    trade_term: 'FOB Ningbo',
    valid_until: todayInputValue(),
    description: '',
    product_id: '',
    product_code: '',
    product_name: '',
    specification: '',
    model: '',
    quantity: '1',
    unit: 'pcs',
    unit_price: '1.00',
    freight_method: 'sea',
    freight_amount: '0.00',
    purchase_reference_supplier_name: '',
    purchase_reference_price: '',
    line_remark: '',
  }
}

function initialExportQuotationApproveForm(): ExportQuotationApproveFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: todayInputValue(),
  }
}

function initialExportQuotationContractForm(): ExportQuotationContractFormState {
  return {
    confirmed_at: todayInputValue(),
    contract_no: `EC-${Date.now().toString().slice(-6)}`,
  }
}

function exportQuotationToForm(quotation: ExportQuotation): ExportQuotationFormState {
  const line = quotation.lines[0]
  return {
    code: quotation.code,
    quote_date: quotation.quote_date,
    customer_id: quotation.customer_id ?? '',
    customer_name: quotation.customer_name,
    sales_user_id: quotation.sales_user_id ?? '',
    sales_user_name: quotation.sales_user_name ?? '',
    currency: quotation.currency,
    trade_term: quotation.trade_term,
    valid_until: quotation.valid_until ?? '',
    description: quotation.description ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    specification: line?.specification ?? '',
    model: line?.model ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
    unit_price: line?.unit_price ?? '1.00',
    freight_method: line?.freight_method ?? 'sea',
    freight_amount: line?.freight_amount ?? '0.00',
    purchase_reference_supplier_name: line?.purchase_reference_supplier_name ?? '',
    purchase_reference_price: line?.purchase_reference_price ?? '',
    line_remark: line?.remark ?? '',
  }
}

function exportQuotationPayload(form: ExportQuotationFormState): ExportQuotationCreatePayload {
  return {
    code: form.code.trim(),
    quote_date: form.quote_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    currency: form.currency.trim(),
    trade_term: form.trade_term.trim(),
    valid_until: emptyToNull(form.valid_until),
    description: emptyToNull(form.description),
    lines: [
      {
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        specification: emptyToNull(form.specification),
        model: emptyToNull(form.model),
        quantity: form.quantity,
        unit: form.unit.trim(),
        unit_price: form.unit_price,
        freight_method: form.freight_method,
        freight_amount: form.freight_amount,
        purchase_reference_supplier_name: emptyToNull(form.purchase_reference_supplier_name),
        purchase_reference_price: emptyToNull(form.purchase_reference_price),
        remark: emptyToNull(form.line_remark),
      },
    ],
  }
}

function exportQuotationApprovePayload(
  form: ExportQuotationApproveFormState,
): ExportQuotationApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function exportQuotationContractPayload(
  form: ExportQuotationContractFormState,
): ExportQuotationConfirmContractPayload {
  return {
    confirmed_at: form.confirmed_at,
    contract_no: form.contract_no.trim(),
  }
}

function exportQuotationStatusLabel(value: string): string {
  return exportQuotationStatusOptions.find((item) => item.value === value)?.label ?? value
}

function freightMethodLabel(value: string): string {
  return freightMethodOptions.find((item) => item.value === value)?.label ?? value
}

function customerDisplayName(customer: Customer): string {
  return customer.cn_name || customer.en_name || customer.code
}

function customerOptionLabel(customer: Customer): string {
  return [customer.code, customerDisplayName(customer), customer.country].filter(Boolean).join(' / ')
}

function renderCustomerOptions(customers: Customer[]): ReactNode {
  return customers.map((customer) => {
    const label = customerOptionLabel(customer)
    return (
      <Select.Option key={customer.id} value={customer.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

function productOptionLabel(product: Product): string {
  return [product.code, product.cn_name, product.en_name].filter(Boolean).join(' / ')
}

function renderProductOptions(products: Product[]): ReactNode {
  return products.map((product) => {
    const label = productOptionLabel(product)
    return (
      <Select.Option key={product.id} value={product.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

function supplierOptionLabel(supplier: Supplier): string {
  return [supplier.code, supplier.cn_name, supplier.en_name].filter(Boolean).join(' / ')
}

function renderSupplierOptions(suppliers: Supplier[]): ReactNode {
  return suppliers.map((supplier) => {
    const label = supplierOptionLabel(supplier)
    return (
      <Select.Option key={supplier.id} value={supplier.id} label={label}>
        {label}
      </Select.Option>
    )
  })
}

function mergePurchaseLineRemark(current: string, addition: string): string {
  if (!current.trim()) return addition
  if (current.includes(addition)) return current
  return `${current}; ${addition}`
}

function initialExportContractForm(): ExportContractFormState {
  return {
    code: `EC-${Date.now().toString().slice(-6)}`,
    contract_date: todayInputValue(),
    customer_id: '',
    customer_name: '',
    sales_user_id: '',
    sales_user_name: '演示业务主管',
    currency: 'USD',
    trade_term: 'FOB Ningbo',
    planned_ship_date: todayInputValue(),
    payment_terms: '30% T/T in advance, balance before shipment',
    source_quotation_id: '',
    source_quotation_no: '',
    remarks: '',
    product_id: '',
    product_code: '',
    product_name: '',
    specification: '',
    model: '',
    quantity: '1',
    unit: 'pcs',
    unit_price: '1.00',
    purchased_quantity: '0',
    shipped_quantity: '0',
    image_url: '',
    line_remark: '',
  }
}

function initialExportContractApproveForm(): ExportContractApproveFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: todayInputValue(),
  }
}

function initialExportContractSignatureForm(): ExportContractSignatureFormState {
  return {
    signed_by: '',
    signed_at: todayInputValue(),
    signature_method: 'email_scan',
    file_no: '',
    remark: '',
  }
}

function initialExportContractAdvancePaymentForm(): ExportContractAdvancePaymentFormState {
  return {
    payment_no: `AR-${Date.now().toString().slice(-6)}`,
    received_at: todayInputValue(),
    amount: '',
    currency: 'USD',
    payer_name: '',
    remark: '',
  }
}

function exportContractToForm(contract: ExportContract): ExportContractFormState {
  const line = contract.lines[0]
  return {
    code: contract.code,
    contract_date: contract.contract_date,
    customer_id: contract.customer_id ?? '',
    customer_name: contract.customer_name,
    sales_user_id: contract.sales_user_id ?? '',
    sales_user_name: contract.sales_user_name ?? '',
    currency: contract.currency,
    trade_term: contract.trade_term,
    planned_ship_date: contract.planned_ship_date,
    payment_terms: contract.payment_terms,
    source_quotation_id: contract.source_quotation_id ?? '',
    source_quotation_no: contract.source_quotation_no ?? '',
    remarks: contract.remarks ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    specification: line?.specification ?? '',
    model: line?.model ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
    unit_price: line?.unit_price ?? '1.00',
    purchased_quantity: line?.purchased_quantity ?? '0',
    shipped_quantity: line?.shipped_quantity ?? '0',
    image_url: line?.image_url ?? '',
    line_remark: line?.remark ?? '',
  }
}

function exportContractPayload(form: ExportContractFormState): ExportContractCreatePayload {
  return {
    code: form.code.trim(),
    contract_date: form.contract_date,
    customer_id: emptyToNull(form.customer_id),
    customer_name: form.customer_name.trim(),
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    currency: form.currency.trim(),
    trade_term: form.trade_term.trim(),
    planned_ship_date: form.planned_ship_date,
    payment_terms: form.payment_terms.trim(),
    source_quotation_id: emptyToNull(form.source_quotation_id),
    source_quotation_no: emptyToNull(form.source_quotation_no),
    remarks: emptyToNull(form.remarks),
    lines: [
      {
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        specification: emptyToNull(form.specification),
        model: emptyToNull(form.model),
        quantity: form.quantity,
        unit: form.unit.trim(),
        unit_price: form.unit_price,
        purchased_quantity: form.purchased_quantity || '0',
        shipped_quantity: form.shipped_quantity || '0',
        image_url: emptyToNull(form.image_url),
        remark: emptyToNull(form.line_remark),
      },
    ],
  }
}

function exportContractApprovePayload(
  form: ExportContractApproveFormState,
): ExportContractApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function exportContractSignaturePayload(
  form: ExportContractSignatureFormState,
): ExportContractSignaturePayload {
  return {
    signed_by: form.signed_by.trim(),
    signed_at: form.signed_at,
    signature_method: form.signature_method.trim(),
    file_no: emptyToNull(form.file_no),
    remark: emptyToNull(form.remark),
  }
}

function exportContractAdvancePaymentPayload(
  form: ExportContractAdvancePaymentFormState,
): ExportContractAdvancePaymentPayload {
  return {
    payment_no: form.payment_no.trim(),
    received_at: form.received_at,
    amount: form.amount,
    currency: form.currency.trim(),
    payer_name: form.payer_name.trim(),
    remark: emptyToNull(form.remark),
  }
}

function exportContractStatusLabel(value: string): string {
  return exportContractStatusOptions.find((item) => item.value === value)?.label ?? value
}

function signatureStatusLabel(value: string): string {
  if (value === 'signed') return '已回签'
  if (value === 'not_signed') return '未回签'
  if (value === 'pending') return '待回签'
  return value
}

function contractProgressStatusLabel(value: string): string {
  if (value === 'completed') return '已完成'
  if (value === 'partial') return '部分完成'
  if (value === 'pending') return '未开始'
  return value
}

function initialShipmentForm(): ShipmentFormState {
  return {
    code: `SP-${Date.now().toString().slice(-6)}`,
    shipment_date: todayInputValue(),
    planned_ship_date: todayInputValue(),
    shipping_method: 'sea',
    contract_id_a: '',
    contract_quantity_a: '',
    contract_id_b: '',
    contract_quantity_b: '',
    port_of_loading: 'Ningbo',
    port_of_destination: '',
    vessel_name: '',
    container_no: '',
    booking_no: '',
    document_owner_name: '单证部',
    estimated_payable_amount: '0.00',
    remarks: '',
  }
}

function initialShipmentApproveForm(): ShipmentApproveFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: todayInputValue(),
  }
}

function shipmentGeneratePayload(form: ShipmentFormState): ShipmentPlanGeneratePayload {
  const selections = [
    {
      contract_id: form.contract_id_a.trim(),
      quantity: emptyToNull(form.contract_quantity_a),
    },
  ]
  if (form.contract_id_b.trim()) {
    selections.push({
      contract_id: form.contract_id_b.trim(),
      quantity: emptyToNull(form.contract_quantity_b),
    })
  }

  return {
    code: form.code.trim(),
    shipment_date: form.shipment_date,
    planned_ship_date: form.planned_ship_date,
    shipping_method: form.shipping_method,
    port_of_loading: form.port_of_loading.trim(),
    port_of_destination: form.port_of_destination.trim(),
    vessel_name: emptyToNull(form.vessel_name),
    container_no: emptyToNull(form.container_no),
    booking_no: emptyToNull(form.booking_no),
    document_owner_name: emptyToNull(form.document_owner_name),
    estimated_payable_amount: form.estimated_payable_amount || '0',
    remarks: emptyToNull(form.remarks),
    selections,
  }
}

function shipmentApprovePayload(form: ShipmentApproveFormState): ShipmentApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function shipmentStatusLabel(value: string): string {
  return shipmentStatusOptions.find((item) => item.value === value)?.label ?? value
}

function reminderStatusLabel(value: string): string {
  if (value === 'pending') return '待提醒'
  if (value === 'done') return '已处理'
  if (value === 'overdue') return '已逾期'
  return value
}

function formatPercent(value?: string | null): string {
  if (!value) return '0.00%'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return `${value}%`
  return `${numeric.toFixed(2)}%`
}

function initialPurchaseInquiryForm(): PurchaseInquiryFormState {
  return {
    code: `PI-${Date.now().toString().slice(-6)}`,
    inquiry_date: todayInputValue(),
    buyer_user_id: 'u-001',
    buyer_user_name: '演示业务主管',
    remarks: '环保袋供应商询价',
    product_id: 'product-bag',
    product_code: 'BAG-40',
    product_name: 'Eco Shopping Bag',
    specification: '40x35cm',
    model: 'BAG-40',
    quantity: '1000',
    unit: 'pcs',
  }
}

function initialPurchaseQuotationForm(): PurchaseQuotationFormState {
  return {
    supplier_id: 'supplier-pack-a',
    supplier_name: '华东包装制品厂',
    quoted_at: todayInputValue(),
    unit_price: '0.78',
    currency: 'USD',
    lead_time_days: '18',
    min_order_quantity: '800',
    sample_available: true,
    remark: '含环保包装',
  }
}

function initialPurchaseInquiryTemplateForm(): PurchaseInquiryTemplateFormState {
  return {
    template_name: '标准采购询价模板',
    recipient_emails: 'supplier@example.com',
  }
}

function purchaseInquiryToForm(inquiry: PurchaseInquiry): PurchaseInquiryFormState {
  const line = inquiry.lines[0]
  return {
    code: inquiry.code,
    inquiry_date: inquiry.inquiry_date,
    buyer_user_id: inquiry.buyer_user_id ?? '',
    buyer_user_name: inquiry.buyer_user_name ?? '',
    remarks: inquiry.remarks ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    specification: line?.specification ?? '',
    model: line?.model ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
  }
}

function purchaseInquiryPayload(form: PurchaseInquiryFormState): PurchaseInquiryCreatePayload {
  return {
    code: form.code.trim(),
    inquiry_date: form.inquiry_date,
    buyer_user_id: emptyToNull(form.buyer_user_id),
    buyer_user_name: emptyToNull(form.buyer_user_name),
    remarks: emptyToNull(form.remarks),
    lines: [
      {
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        specification: emptyToNull(form.specification),
        model: emptyToNull(form.model),
        quantity: form.quantity,
        unit: form.unit.trim(),
      },
    ],
  }
}

function purchaseQuotationPayload(
  form: PurchaseQuotationFormState,
  inquiryLineId: string,
): SupplierQuotationPayload {
  const leadTime = Number(form.lead_time_days)
  return {
    inquiry_line_id: inquiryLineId,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    quoted_at: form.quoted_at,
    unit_price: form.unit_price,
    currency: form.currency.trim(),
    lead_time_days: Number.isNaN(leadTime) ? null : leadTime,
    min_order_quantity: emptyToNull(form.min_order_quantity),
    sample_available: form.sample_available,
    remark: emptyToNull(form.remark),
  }
}

function purchaseInquiryTemplatePayload(
  form: PurchaseInquiryTemplateFormState,
): PurchaseInquiryTemplatePayload {
  return {
    template_name: form.template_name.trim(),
    recipient_emails: form.recipient_emails
      .split(/[,\n;，；]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  }
}

function purchaseInquiryStatusLabel(value: string): string {
  return purchaseInquiryStatusOptions.find((item) => item.value === value)?.label ?? value
}

function lowestSupplierQuotation(quotations: SupplierQuotation[]): SupplierQuotation | null {
  if (quotations.length === 0) return null
  return quotations.reduce((lowest, item) =>
    Number(item.unit_price) < Number(lowest.unit_price) ? item : lowest,
  )
}

function initialPurchaseContractForm(): PurchaseContractFormState {
  return {
    code: `PC-${Date.now().toString().slice(-6)}`,
    contract_date: todayInputValue(),
    supplier_id: '',
    supplier_name: '',
    buyer_user_id: '',
    buyer_user_name: '',
    currency: 'RMB',
    delivery_date: todayInputValue(),
    payment_terms: '',
    source_type: 'manual',
    remarks: '',
    product_id: '',
    product_code: '',
    product_name: '',
    specification: '',
    model: '',
    quantity: '1',
    unit: 'pcs',
    unit_price: '0',
    source_export_contract_id: '',
    source_export_contract_no: '',
    source_export_contract_line_id: '',
    line_remark: '',
  }
}

function initialPurchaseContractGenerateForm(): PurchaseContractGenerateFormState {
  return {
    code: `PC-${Date.now().toString().slice(-6)}`,
    contract_date: todayInputValue(),
    source_contract_id_a: '',
    source_contract_id_b: '',
    supplier_id: 'supplier-accessory-a',
    supplier_name: '远景辅料供应商',
    buyer_user_id: 'u-001',
    buyer_user_name: '演示业务主管',
    currency: 'USD',
    delivery_date: todayInputValue(),
    unit_price: '0.12',
    payment_terms: '30% advance, 70% before delivery',
    remarks: '按已审批出口合同商品配件自动生成采购合同。',
  }
}

function initialPurchaseContractApproveForm(): PurchaseContractApproveFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: todayInputValue(),
  }
}

function purchaseContractToForm(contract: PurchaseContract): PurchaseContractFormState {
  const line = contract.lines[0]
  return {
    code: contract.code,
    contract_date: contract.contract_date,
    supplier_id: contract.supplier_id ?? '',
    supplier_name: contract.supplier_name,
    buyer_user_id: contract.buyer_user_id ?? '',
    buyer_user_name: contract.buyer_user_name ?? '',
    currency: contract.currency,
    delivery_date: contract.delivery_date,
    payment_terms: contract.payment_terms,
    source_type: contract.source_type as PurchaseContractCreatePayload['source_type'],
    remarks: contract.remarks ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    specification: line?.specification ?? '',
    model: line?.model ?? '',
    quantity: line?.quantity ?? '1',
    unit: line?.unit ?? 'pcs',
    unit_price: line?.unit_price ?? '0',
    source_export_contract_id: line?.source_export_contract_id ?? '',
    source_export_contract_no: line?.source_export_contract_no ?? '',
    source_export_contract_line_id: line?.source_export_contract_line_id ?? '',
    line_remark: line?.remark ?? '',
  }
}

function purchaseContractPayload(form: PurchaseContractFormState): PurchaseContractCreatePayload {
  return {
    code: form.code.trim(),
    contract_date: form.contract_date,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    buyer_user_id: emptyToNull(form.buyer_user_id),
    buyer_user_name: emptyToNull(form.buyer_user_name),
    currency: form.currency.trim(),
    delivery_date: form.delivery_date,
    payment_terms: form.payment_terms.trim(),
    source_type: form.source_type,
    remarks: emptyToNull(form.remarks),
    lines: [
      {
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        specification: emptyToNull(form.specification),
        model: emptyToNull(form.model),
        quantity: form.quantity,
        unit: form.unit.trim(),
        unit_price: form.unit_price,
        source_export_contract_id: emptyToNull(form.source_export_contract_id),
        source_export_contract_no: emptyToNull(form.source_export_contract_no),
        source_export_contract_line_id: emptyToNull(form.source_export_contract_line_id),
        remark: emptyToNull(form.line_remark),
      },
    ],
  }
}

function purchaseContractGeneratePayload(
  form: PurchaseContractGenerateFormState,
): PurchaseContractGeneratePayload {
  const sources = [form.source_contract_id_a, form.source_contract_id_b]
    .map((item) => item.trim())
    .filter(Boolean)
    .map((export_contract_id) => ({ export_contract_id }))

  return {
    code: form.code.trim(),
    contract_date: form.contract_date,
    supplier_id: emptyToNull(form.supplier_id),
    supplier_name: form.supplier_name.trim(),
    buyer_user_id: emptyToNull(form.buyer_user_id),
    buyer_user_name: emptyToNull(form.buyer_user_name),
    currency: form.currency.trim(),
    delivery_date: form.delivery_date,
    payment_terms: form.payment_terms.trim(),
    unit_price: form.unit_price,
    remarks: emptyToNull(form.remarks),
    sources,
  }
}

function purchaseContractApprovePayload(
  form: PurchaseContractApproveFormState,
): PurchaseContractApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function purchaseContractStatusLabel(value: string): string {
  return purchaseContractStatusOptions.find((item) => item.value === value)?.label ?? value
}

function purchaseContractSourceTypeLabel(value: string): string {
  return purchaseContractSourceTypeOptions.find((item) => item.value === value)?.label ?? value
}

function purchaseReminderTypeLabel(value: string): string {
  if (value === 'payment') return '付款提醒'
  if (value === 'delivery') return '交货提醒'
  return value
}

function purchaseReminderStatusLabel(value: string): string {
  if (value === 'open') return '待处理'
  if (value === 'closed') return '已完成'
  return value
}

function initialPurchaseInvoiceNoticeForm(): PurchaseInvoiceNoticeFormState {
  return {
    customs_declaration_id: `customs-${Date.now().toString().slice(-6)}`,
    customs_declaration_no: `CD-${Date.now().toString().slice(-6)}`,
    declaration_date: '2026-09-03',
    notice_date: '2026-09-04',
    currency: 'CNY',
    remarks: '根据报关单证按供应商生成开票通知。',
    supplier_id_a: 'supplier-pack-a',
    supplier_name_a: '华东包装制品厂',
    purchase_contract_id_a: 'pc-pack-a',
    purchase_contract_no_a: 'PC-2026-PACK-A',
    product_id_a: 'product-bag',
    product_code_a: 'BAG-40',
    product_name_a: 'Eco Shopping Bag',
    customs_name_a: '环保购物袋',
    invoice_name_a: '无纺布购物袋',
    quantity_a: '1000',
    unit_a: 'pcs',
    amount_a: '5200.00',
    remark_a: '按报关品名和数量开具增值税发票',
    supplier_id_b: 'supplier-label-a',
    supplier_name_b: '苏州标签印务厂',
    purchase_contract_id_b: 'pc-label-a',
    purchase_contract_no_b: 'PC-2026-LABEL-A',
    product_id_b: 'product-label',
    product_code_b: 'LABEL-01',
    product_name_b: 'Hang Tag',
    customs_name_b: '纸制吊牌',
    invoice_name_b: '纸质吊牌',
    quantity_b: '450',
    unit_b: 'pcs',
    amount_b: '360.00',
    remark_b: '吊牌随货开票',
  }
}

function initialPurchaseInvoiceNoticeSendForm(): PurchaseInvoiceNoticeSendFormState {
  return {
    sender_name: '演示业务主管',
    sent_at: '2026-09-05',
  }
}

function initialPurchaseInvoiceNoticeReceiveForm(): PurchaseInvoiceNoticeReceiveFormState {
  return {
    tax_invoice_no: 'VAT-2026-001',
    received_at: '2026-09-09',
  }
}

function purchaseInvoiceNoticeGeneratePayload(
  form: PurchaseInvoiceNoticeFormState,
): PurchaseInvoiceNoticeGeneratePayload {
  return {
    customs_declaration_id: emptyToNull(form.customs_declaration_id),
    customs_declaration_no: form.customs_declaration_no.trim(),
    declaration_date: form.declaration_date,
    notice_date: form.notice_date,
    currency: form.currency.trim(),
    remarks: emptyToNull(form.remarks),
    lines: purchaseInvoiceNoticeLinePayloads(form),
  }
}

function purchaseInvoiceNoticeLinePayloads(
  form: PurchaseInvoiceNoticeFormState,
): PurchaseInvoiceNoticeLinePayload[] {
  const candidates: PurchaseInvoiceNoticeLinePayload[] = [
    {
      supplier_id: emptyToNull(form.supplier_id_a),
      supplier_name: form.supplier_name_a.trim(),
      purchase_contract_id: emptyToNull(form.purchase_contract_id_a),
      purchase_contract_no: emptyToNull(form.purchase_contract_no_a),
      product_id: emptyToNull(form.product_id_a),
      product_code: emptyToNull(form.product_code_a),
      product_name: form.product_name_a.trim(),
      customs_name: form.customs_name_a.trim(),
      invoice_name: form.invoice_name_a.trim(),
      quantity: form.quantity_a,
      unit: form.unit_a.trim(),
      amount: form.amount_a,
      remark: emptyToNull(form.remark_a),
    },
    {
      supplier_id: emptyToNull(form.supplier_id_b),
      supplier_name: form.supplier_name_b.trim(),
      purchase_contract_id: emptyToNull(form.purchase_contract_id_b),
      purchase_contract_no: emptyToNull(form.purchase_contract_no_b),
      product_id: emptyToNull(form.product_id_b),
      product_code: emptyToNull(form.product_code_b),
      product_name: form.product_name_b.trim(),
      customs_name: form.customs_name_b.trim(),
      invoice_name: form.invoice_name_b.trim(),
      quantity: form.quantity_b,
      unit: form.unit_b.trim(),
      amount: form.amount_b,
      remark: emptyToNull(form.remark_b),
    },
  ]

  return candidates.filter(
    (line) =>
      line.supplier_name &&
      line.product_name &&
      line.customs_name &&
      line.invoice_name &&
      line.quantity &&
      line.unit,
  )
}

function purchaseInvoiceNoticeSendPayload(
  form: PurchaseInvoiceNoticeSendFormState,
): PurchaseInvoiceNoticeSendPayload {
  return {
    sender_name: form.sender_name.trim(),
    sent_at: form.sent_at,
  }
}

function purchaseInvoiceNoticeReceivePayload(
  form: PurchaseInvoiceNoticeReceiveFormState,
): PurchaseInvoiceNoticeReceivePayload {
  return {
    tax_invoice_no: form.tax_invoice_no.trim(),
    received_at: form.received_at,
  }
}

function purchaseInvoiceNoticeStatusLabel(value: string): string {
  return purchaseInvoiceNoticeStatusOptions.find((item) => item.value === value)?.label ?? value
}

function purchaseInvoiceReminderStatusLabel(value: string): string {
  if (value === 'open') return '待催收'
  if (value === 'done') return '已完成'
  return value
}

function initialFollowupTemplateForm(): FollowupTemplateFormState {
  return {
    name: '标准采购跟单流程',
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

function initialFollowupPlanForm(): FollowupPlanFormState {
  return {
    purchase_contract_id: '',
    as_of: '2026-08-05',
  }
}

function initialFollowupSourceEventForm(): FollowupSourceEventFormState {
  return {
    purchase_contract_id: '',
    node_code: 'quality_inspection',
    source_record_type: 'quality_inspection',
    source_record_id: 'qc-demo-001',
    actual_date: '2026-08-19',
    source_summary: 'QC 查验通过',
  }
}

function followupTemplateToForm(template: FollowProcessTemplate | null): FollowupTemplateFormState {
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

function followupSourceEventFormForPlan(
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
    source_summary: `${firstPending.node_name}完成`,
  }
}

function followupTemplatePayload(form: FollowupTemplateFormState): FollowProcessTemplatePayload {
  return {
    name: form.name.trim(),
    enabled: form.enabled,
    is_default: form.is_default,
    nodes: [
      followupNodePayload('contract_confirmed', '合同下单确立', 10, 'purchase_contract', form.contract_days, form.contract_remind),
      followupNodePayload('confirm_sample_submitted', '确认样提交', 20, 'sample_confirm', form.confirm_days, form.confirm_remind),
      followupNodePayload('bulk_sample_submitted', '大货样提交', 30, 'sample_bulk', form.bulk_days, form.bulk_remind),
      followupNodePayload('quality_inspection', 'QC 查验', 40, 'qc', form.qc_days, form.qc_remind),
      followupNodePayload('inbound_completed', '入库', 50, 'inbound', form.inbound_days, form.inbound_remind),
      followupNodePayload('outbound_completed', '出库', 60, 'outbound', form.outbound_days, form.outbound_remind),
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

function followupPlanGeneratePayload(
  form: FollowupPlanFormState,
): PurchaseFollowPlanGeneratePayload {
  return {
    purchase_contract_id: form.purchase_contract_id.trim(),
    as_of: emptyToNull(form.as_of),
  }
}

function followupSourceEventPayload(form: FollowupSourceEventFormState): FollowSourceEventPayload {
  return {
    purchase_contract_id: form.purchase_contract_id.trim(),
    node_code: form.node_code,
    source_record_type: form.source_record_type,
    source_record_id: form.source_record_id.trim(),
    actual_date: form.actual_date,
    source_summary: form.source_summary.trim(),
  }
}

function followupPlanStatusLabel(value: string): string {
  return followupStatusOptions.find((item) => item.value === value)?.label ?? value
}

function followupNodeStatusLabel(value: string): string {
  if (value === 'pending') return '待完成'
  if (value === 'in_progress') return '进行中'
  if (value === 'completed') return '已完成'
  if (value === 'overdue') return '已逾期'
  return value
}

function followupNodeLabel(value: string): string {
  if (value === 'contract_confirmed') return '合同下单确立'
  return followupNodeOptions.find((item) => item.value === value)?.label ?? value
}

function followupSourceTypeForNode(nodeCode: string): string {
  if (nodeCode === 'confirm_sample_submitted' || nodeCode === 'bulk_sample_submitted') {
    return 'sample_followup_event'
  }
  if (nodeCode === 'inbound_completed') return 'inventory_inbound'
  if (nodeCode === 'outbound_completed') return 'inventory_outbound'
  return 'quality_inspection'
}

function followupSourceTypeLabel(value: string | null): string {
  if (!value) return '未回写'
  return followupSourceTypeOptions.find((item) => item.value === value)?.label ?? value
}

function initialQualityInspectionForm(): QualityInspectionFormState {
  return {
    code: `QC-${Date.now().toString().slice(-6)}`,
    purchase_contract_id: '',
    inspected_at: '2026-08-19',
    result: 'passed',
    inspector_id: 'u-qc-001',
    inspector_name: 'QC 张工',
    issue_summary: '',
    attachment_group_id: 'attach-qc-demo',
    purchase_contract_line_id: '',
    product_id: 'product-bag',
    product_code: 'BAG-40',
    product_name: 'Eco Shopping Bag',
    inspected_quantity: '120',
    failed_quantity: '0',
    unit: 'pcs',
    line_result: 'passed',
    line_remark: '首检通过',
    issue_type: '包装破损',
    severity: 'major',
    description: '',
    corrective_action: '',
    issue_status: 'open',
    issue_attachment_group_id: '',
  }
}

function qualityInspectionToForm(inspection: QualityInspection): QualityInspectionFormState {
  const line = inspection.lines[0]
  const issue = inspection.issues[0]
  return {
    code: inspection.code,
    purchase_contract_id: inspection.purchase_contract_id,
    inspected_at: inspection.inspected_at,
    result: inspection.result,
    inspector_id: inspection.inspector_id ?? '',
    inspector_name: inspection.inspector_name,
    issue_summary: inspection.issue_summary ?? '',
    attachment_group_id: inspection.attachment_group_id ?? '',
    purchase_contract_line_id: line?.purchase_contract_line_id ?? '',
    product_id: line?.product_id ?? '',
    product_code: line?.product_code ?? '',
    product_name: line?.product_name ?? '',
    inspected_quantity: line?.inspected_quantity ?? '0',
    failed_quantity: line?.failed_quantity ?? '0',
    unit: line?.unit ?? 'pcs',
    line_result: line?.result ?? inspection.result,
    line_remark: line?.remark ?? '',
    issue_type: issue?.issue_type ?? '包装破损',
    severity: issue?.severity ?? 'major',
    description: issue?.description ?? '',
    corrective_action: issue?.corrective_action ?? '',
    issue_status: issue?.status ?? 'open',
    issue_attachment_group_id: issue?.attachment_group_id ?? '',
  }
}

function qualityInspectionPayload(form: QualityInspectionFormState): QualityInspectionPayload {
  const issues = form.description.trim()
    ? [
        {
          issue_type: form.issue_type.trim(),
          severity: form.severity,
          description: form.description.trim(),
          corrective_action: emptyToNull(form.corrective_action),
          status: form.issue_status,
          attachment_group_id: emptyToNull(form.issue_attachment_group_id),
        },
      ]
    : []

  return {
    code: form.code.trim(),
    purchase_contract_id: form.purchase_contract_id.trim(),
    inspected_at: form.inspected_at,
    result: form.result,
    inspector_id: emptyToNull(form.inspector_id),
    inspector_name: form.inspector_name.trim(),
    issue_summary: emptyToNull(form.issue_summary),
    attachment_group_id: emptyToNull(form.attachment_group_id),
    lines: [
      {
        purchase_contract_line_id: emptyToNull(form.purchase_contract_line_id),
        product_id: emptyToNull(form.product_id),
        product_code: emptyToNull(form.product_code),
        product_name: form.product_name.trim(),
        inspected_quantity: form.inspected_quantity,
        failed_quantity: form.failed_quantity || '0',
        unit: form.unit.trim(),
        result: form.line_result,
        remark: emptyToNull(form.line_remark),
      },
    ],
    issues,
  }
}

function qualityResultLabel(value: string | null): string {
  if (!value) return '未判定'
  return qualityResultOptions.find((item) => item.value === value)?.label ?? value
}

function qualityResultTagColor(value: string): string {
  if (value === 'passed') return 'success'
  if (value === 'failed') return 'error'
  if (value === 'partial_passed') return 'warning'
  if (value === 'recheck_required') return 'processing'
  return 'default'
}

function qualityIssueSeverityLabel(value: string): string {
  return qualityIssueSeverityOptions.find((item) => item.value === value)?.label ?? value
}

function qualityIssueStatusLabel(value: string): string {
  return qualityIssueStatusOptions.find((item) => item.value === value)?.label ?? value
}

function qualityInboundReason(inspection: QualityInspection): string {
  if (inspection.result === 'passed') return 'QC 已通过'
  if (inspection.result === 'failed') return 'QC 未通过，禁止入库'
  if (inspection.result === 'partial_passed') return 'QC 部分通过，需按合格数量入库'
  if (inspection.result === 'recheck_required') return 'QC 待复检，暂缓入库'
  return '等待 QC 判定'
}

function initialInboundPlanGenerateForm(): InboundPlanGenerateFormState {
  return {
    purchase_contract_id: '',
    inbound_type: 'purchase_inbound',
    planned_date: '',
  }
}

function initialInboundPlanScheduleForm(): InboundPlanScheduleFormState {
  return {
    planned_date: '2026-08-28',
    warehouse_id: 'wh-ningbo',
    warehouse_name: '宁波总仓',
    location_id: 'loc-a-01',
    location_name: 'A-01',
    operator_name: '仓库主管',
  }
}

function inboundPlanToScheduleForm(plan: InboundPlan): InboundPlanScheduleFormState {
  return {
    planned_date: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? 'wh-ningbo',
    warehouse_name: plan.warehouse_name ?? '宁波总仓',
    location_id: plan.location_id ?? 'loc-a-01',
    location_name: plan.location_name ?? 'A-01',
    operator_name: plan.operator_name ?? '仓库主管',
  }
}

function inboundPlanGeneratePayload(
  form: InboundPlanGenerateFormState,
): InboundPlanGeneratePayload {
  return {
    purchase_contract_id: form.purchase_contract_id.trim(),
    inbound_type: form.inbound_type,
    planned_date: emptyToNull(form.planned_date),
  }
}

function inboundPlanSchedulePayload(
  form: InboundPlanScheduleFormState,
): InboundPlanSchedulePayload {
  return {
    planned_date: form.planned_date,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    operator_name: form.operator_name.trim(),
  }
}

function inboundPlanTypeLabel(value: string): string {
  return inboundPlanTypeOptions.find((item) => item.value === value)?.label ?? value
}

function inboundPlanStatusLabel(value: string): string {
  return inboundPlanStatusOptions.find((item) => item.value === value)?.label ?? value
}

function inboundPlanLineStatusLabel(value: string): string {
  if (value === 'pending') return '待入库'
  if (value === 'partial') return '部分入库'
  if (value === 'completed') return '已入库'
  if (value === 'cancelled') return '已取消'
  return value
}

function inboundPlanTotalQuantity(plan: InboundPlan): number {
  return plan.lines.reduce((sum, line) => sum + Number(line.planned_quantity || 0), 0)
}

function trimDecimal(value: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  return Number.isInteger(numeric) ? String(numeric) : String(numeric)
}

function initialInboundOrderForm(): InboundOrderFormState {
  return {
    plan_id: '',
    code: `IO-${Date.now().toString().slice(-6)}`,
    inbound_mode: 'formal',
    inbound_at: '2026-08-30',
    warehouse_id: 'wh-ningbo',
    warehouse_name: '宁波总仓',
    location_id: 'loc-a-01',
    location_name: 'A-01',
    operator_name: '仓库主管',
  }
}

function initialInboundOrderApprovalForm(): InboundOrderApprovalFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: '2026-08-30',
  }
}

function inboundOrderFormForPlan(
  plan: InboundPlan,
  current: InboundOrderFormState,
): InboundOrderFormState {
  return {
    ...current,
    plan_id: plan.id,
    inbound_at: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? 'wh-ningbo',
    warehouse_name: plan.warehouse_name ?? '宁波总仓',
    location_id: plan.location_id ?? 'loc-a-01',
    location_name: plan.location_name ?? 'A-01',
    operator_name: plan.operator_name ?? '仓库主管',
  }
}

function inboundOrderToForm(order: InboundOrder): InboundOrderFormState {
  return {
    plan_id: order.plan_id,
    code: order.code,
    inbound_mode: order.inbound_mode,
    inbound_at: order.inbound_at,
    warehouse_id: order.warehouse_id,
    warehouse_name: order.warehouse_name,
    location_id: order.location_id,
    location_name: order.location_name,
    operator_name: order.operator_name,
  }
}

function inboundOrderPayload(form: InboundOrderFormState): InboundOrderGeneratePayload {
  return {
    plan_id: form.plan_id.trim(),
    code: form.code.trim(),
    inbound_mode: form.inbound_mode,
    inbound_at: form.inbound_at,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    operator_name: form.operator_name.trim(),
    lines: [],
  }
}

function inboundOrderApprovePayload(
  form: InboundOrderApprovalFormState,
): InboundOrderApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
  }
}

function inboundOrderModeLabel(value: string): string {
  return inboundOrderModeOptions.find((item) => item.value === value)?.label ?? value
}

function inboundOrderStatusLabel(value: string): string {
  return inboundOrderStatusOptions.find((item) => item.value === value)?.label ?? value
}

function stockStatusLabel(value: string): string {
  if (value === 'available') return '可用'
  if (value === 'pending_inspection') return '待检'
  return value
}

function inventoryDirectionLabel(value: string): string {
  if (value === 'in') return '入库'
  if (value === 'out') return '出库'
  return value
}

function initialOutboundPlanGenerateForm(): OutboundPlanGenerateFormState {
  return {
    shipment_plan_id: '',
    outbound_type: 'finished_goods_outbound',
    planned_date: '',
  }
}

function initialOutboundPlanScheduleForm(): OutboundPlanScheduleFormState {
  return {
    planned_date: '2026-09-27',
    warehouse_id: 'wh-ningbo',
    warehouse_name: '宁波总仓',
    location_id: 'loc-fg-b02',
    location_name: '成品区 B-02',
    operator_name: '仓库主管',
  }
}

function outboundPlanGenerateFormForShipment(
  shipment: ShipmentPlan,
  current: OutboundPlanGenerateFormState,
): OutboundPlanGenerateFormState {
  return {
    ...current,
    shipment_plan_id: shipment.id,
    planned_date: shipment.planned_ship_date,
  }
}

function outboundPlanToScheduleForm(plan: OutboundPlan): OutboundPlanScheduleFormState {
  return {
    planned_date: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? 'wh-ningbo',
    warehouse_name: plan.warehouse_name ?? '宁波总仓',
    location_id: plan.location_id ?? 'loc-fg-b02',
    location_name: plan.location_name ?? '成品区 B-02',
    operator_name: plan.operator_name ?? '仓库主管',
  }
}

function outboundPlanGeneratePayload(
  form: OutboundPlanGenerateFormState,
): OutboundPlanGeneratePayload {
  return {
    shipment_plan_id: form.shipment_plan_id.trim(),
    outbound_type: form.outbound_type,
    planned_date: emptyToNull(form.planned_date),
  }
}

function outboundPlanSchedulePayload(
  form: OutboundPlanScheduleFormState,
): OutboundPlanSchedulePayload {
  return {
    planned_date: form.planned_date,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    operator_name: form.operator_name.trim(),
  }
}

function outboundPlanStatusLabel(value: string): string {
  return outboundPlanStatusOptions.find((item) => item.value === value)?.label ?? value
}

function outboundPlanTypeLabel(value: string): string {
  return outboundPlanTypeOptions.find((item) => item.value === value)?.label ?? value
}

function outboundPlanSourceTypeLabel(value: string): string {
  return outboundPlanSourceTypeOptions.find((item) => item.value === value)?.label ?? value
}

function outboundPlanLineStatusLabel(value: string): string {
  if (value === 'pending') return '待出库'
  if (value === 'partial') return '部分出库'
  if (value === 'completed') return '已出库'
  if (value === 'cancelled') return '已取消'
  return value
}

function outboundPlanTotalQuantity(plan: OutboundPlan): number {
  return plan.lines.reduce((sum, line) => sum + Number(line.planned_quantity || 0), 0)
}

function initialOutboundOrderForm(): OutboundOrderFormState {
  return {
    plan_id: '',
    code: `OO-${Date.now().toString().slice(-6)}`,
    outbound_mode: 'formal',
    outbound_at: '2026-10-30',
    warehouse_id: 'wh-ningbo',
    warehouse_name: '宁波总仓',
    location_id: 'loc-fg-01',
    location_name: '成品区 A-01',
    operator_name: '仓库主管',
    exception_reason: '',
  }
}

function initialOutboundOrderApprovalForm(): OutboundOrderApprovalFormState {
  return {
    reviewer_name: '演示业务主管',
    approved_at: '2026-10-30',
    allow_negative: false,
  }
}

function outboundOrderFormForPlan(
  plan: OutboundPlan,
  current: OutboundOrderFormState,
): OutboundOrderFormState {
  return {
    ...current,
    plan_id: plan.id,
    outbound_at: plan.planned_date,
    warehouse_id: plan.warehouse_id ?? 'wh-ningbo',
    warehouse_name: plan.warehouse_name ?? '宁波总仓',
    location_id: plan.location_id ?? 'loc-fg-01',
    location_name: plan.location_name ?? '成品区 A-01',
    operator_name: plan.operator_name ?? '仓库主管',
  }
}

function outboundOrderToForm(order: OutboundOrder): OutboundOrderFormState {
  return {
    plan_id: order.plan_id,
    code: order.code,
    outbound_mode: order.outbound_mode,
    outbound_at: order.outbound_at,
    warehouse_id: order.warehouse_id,
    warehouse_name: order.warehouse_name,
    location_id: order.location_id,
    location_name: order.location_name,
    operator_name: order.operator_name,
    exception_reason: order.exception_reason ?? '',
  }
}

function outboundOrderPayload(form: OutboundOrderFormState): OutboundOrderGeneratePayload {
  return {
    plan_id: form.plan_id.trim(),
    code: form.code.trim(),
    outbound_mode: form.outbound_mode,
    outbound_at: form.outbound_at,
    warehouse_id: form.warehouse_id.trim(),
    warehouse_name: form.warehouse_name.trim(),
    location_id: form.location_id.trim(),
    location_name: form.location_name.trim(),
    operator_name: form.operator_name.trim(),
    exception_reason: emptyToNull(form.exception_reason),
    lines: [],
  }
}

function outboundOrderApprovePayload(
  form: OutboundOrderApprovalFormState,
): OutboundOrderApprovePayload {
  return {
    reviewer_name: form.reviewer_name.trim(),
    approved_at: form.approved_at,
    allow_negative: form.allow_negative,
  }
}

function outboundOrderModeLabel(value: string): string {
  return outboundOrderModeOptions.find((item) => item.value === value)?.label ?? value
}

function outboundOrderStatusLabel(value: string): string {
  return outboundOrderStatusOptions.find((item) => item.value === value)?.label ?? value
}

function outboundOrderTotalQuantity(order: OutboundOrder): number {
  return order.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
}

function formatMoney(value?: string | null, currency?: string | null): string {
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

function formatFinanceAmount(value?: string | null, currency?: string | null): string {
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

function partnerTypeLabel(value: string): string {
  return partnerTypeOptions.find((item) => item.value === value)?.label ?? value
}

const financeModuleTitles: Record<FinanceModule, string> = {
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

function pageTitle(path: string, menu: MenuItem | null): string {
  if (isFinancePath(path)) {
    const { module } = parseFinanceView(path)
    if (module !== 'home') return financeModuleTitles[module]
    return workflowPageTitleByPath[financePath]?.[runtimeSettings.language] ?? '财务管理'
  }
  if (path === reportingPath) {
    return workflowPageTitleByPath[reportingPath]?.[runtimeSettings.language] ?? '老板看板'
  }
  const rootPath = detailRootPath(path)
  if (workflowPageTitleByPath[rootPath]) {
    return workflowPageTitleByPath[rootPath][runtimeSettings.language]
  }
  return runtimeI18nConfig.page_titles[rootPath]?.[runtimeSettings.language] ?? menu?.label ?? t('page.businessModule')
}

function statusTag(value: string) {
  const labelMap: Record<string, string> = {
    completed: t('status.completed'),
    done: t('status.completed'),
    pending: t('status.pending'),
  }
  const color = value === 'done' || value === 'completed' ? 'green' : 'gold'
  return <Tag color={color}>{labelMap[value] ?? value}</Tag>
}

function severityTag(value: string) {
  const color = value === 'high' || value === 'urgent' ? 'red' : value === 'warning' ? 'gold' : 'blue'
  const labelMap: Record<string, string> = {
    high: t('severity.high'),
    urgent: t('severity.urgent'),
    warning: t('severity.warning'),
  }
  return <Tag color={color}>{labelMap[value] ?? value}</Tag>
}

function formatDate(value: string | null) {
  return dateParts(value)?.date ?? '-'
}

function formatDateTime(value: string | null) {
  const parts = dateParts(value)
  return parts ? `${parts.date} ${parts.time}` : '-'
}

export default App