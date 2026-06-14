<script setup lang="ts">
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Factory,
  FilePenLine,
  Files,
  FileText,
  FlaskConical,
  Handshake,
  Images,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Users,
  Warehouse,
  WalletCards,
} from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

import {
  addPartnerContact,
  addProductAccessory,
  addSampleRecordImage,
  addSampleRecordStockEvent,
  addSampleFee,
  addSampleProgress,
  addExportContractAdvancePayment,
  approveExportContract,
  approveExportQuotation,
  approveInboundOrder,
  approveOutboundOrder,
  approveShipment,
  approveSampleDelivery,
  addCustomerContact,
  addSupplierContact,
  addPurchaseInquiryQuotation,
  approvePurchaseContract,
  clearAuthToken,
  createFollowupTemplate,
  createExportContract,
  createCustomer,
  createDocumentParty,
  createPartner,
  createProduct,
  createExportQuotation,
  createQualityInspection,
  createPurchaseContract,
  createPurchaseInquiry,
  createSampleDelivery,
  createSampleRecord,
  createSampleRequest,
  createSupplier,
  createScheduleEvent,
  confirmExportQuotationContract,
  exportExportContract,
  exportExportQuotation,
  exportProducts,
  getCurrentSession,
  getDashboard,
  getExportQuotationHistory,
  getExportQuotationPurchaseReferences,
  getExportQuotationSampleDeliveries,
  getSampleDeliveryFeeStatistics,
  getSampleDeliveryQuoteHistory,
  getSampleDeliverySampleHistory,
  getQualityInboundEligibility,
  generateInboundPlanFromPurchaseContract,
  generatePurchaseInvoiceNoticesFromDeclaration,
  generateFollowupPlanFromPurchaseContract,
  generateInboundOrderFromPlan,
  generateOutboundOrderFromPlan,
  generateOutboundPlanFromShipment,
  generateShipmentFromContracts,
  generatePurchaseContractFromExportContracts,
  hasAuthToken,
  listPurchaseInvoiceNoticeReminders,
  listPurchaseInvoiceNotices,
  listFollowupOverdueNodes,
  listFollowupPlans,
  listFollowupTemplates,
  listInboundOrders,
  listInventoryBalances,
  listInventoryLedgers,
  listOutboundOrders,
  listOutboundPlans,
  listPurchaseContractReminders,
  listPurchaseContracts,
  listShipmentReminders,
  listShipments,
  listExportContracts,
  listCustomerTransactions,
  listCustomers,
  listDocumentParties,
  lookupDocumentParties,
  listPartnerFeeRecords,
  listPartners,
  listProducts,
  listPurchaseInquiries,
  listPurchaseInquiryReferences,
  listPurchaseInquirySupplierSamples,
  listExportQuotations,
  listQualityInspections,
  listInboundPlans,
  listSampleDeliveries,
  listSampleRecords,
  listSampleRequests,
  listSupplierTransactions,
  listSuppliers,
  login,
  requestSampleFeePayment,
  receivePurchaseInvoiceNoticeTaxInvoice,
  registerExportContractSignature,
  setAuthToken,
  sendPurchaseInvoiceNotice,
  sendPurchaseInquiryTemplate,
  scheduleInboundPlan,
  scheduleOutboundPlan,
  syncFollowupSampleEvents,
  syncFollowupSourceEvent,
  submitInboundOrder,
  submitOutboundOrder,
  submitExportContract,
  submitExportQuotation,
  submitPurchaseContract,
  submitShipment,
  updateExportContract,
  updateFollowupTemplate,
  updatePurchaseContract,
  updateQualityInspection,
  submitSampleDelivery,
  updateExportQuotation,
  updateSampleDelivery,
  updateSampleDeliveryTracking,
  updateDocumentParty,
  updatePartner,
  updatePurchaseInquiry,
  updateSupplier,
  updateCustomer,
  type Customer,
  type CustomerContactPayload,
  type CustomerCreatePayload,
  type CustomerTransactionList,
  type CustomerUpdatePayload,
  type CurrentUser,
  type Dashboard,
  type DocumentParty,
  type DocumentPartyCreatePayload,
  type DocumentPartyList,
  type DocumentPartyUpdatePayload,
  type ExportQuotation,
  type ExportContract,
  type ExportContractAdvancePaymentPayload,
  type ExportContractApprovePayload,
  type ExportContractCreatePayload,
  type ExportQuotationApprovePayload,
  type ExportQuotationConfirmContractPayload,
  type ExportQuotationContract,
  type ExportQuotationCreatePayload,
  type ExportQuotationPurchaseReference,
  type ExportContractSignaturePayload,
  type FollowProcessTemplate,
  type FollowProcessTemplatePayload,
  type FollowSourceEventPayload,
  type InboundPlan,
  type InboundPlanGeneratePayload,
  type InboundPlanSchedulePayload,
  type InboundOrder,
  type InboundOrderApprovePayload,
  type InboundOrderGeneratePayload,
  type InventoryBalance,
  type InventoryLedger,
  type MenuItem,
  type OutboundPlan,
  type OutboundPlanGeneratePayload,
  type OutboundPlanSchedulePayload,
  type OutboundOrder,
  type OutboundOrderApprovePayload,
  type OutboundOrderGeneratePayload,
  type Partner,
  type PartnerContactPayload,
  type PartnerCreatePayload,
  type PartnerFeeRecordList,
  type PartnerUpdatePayload,
  type Product,
  type ProductAccessoryPayload,
  type ProductCreatePayload,
  type QualityInspection,
  type QualityInspectionInboundEligibility,
  type QualityInspectionPayload,
  type PurchaseInquiry,
  type PurchaseContract,
  type PurchaseContractApprovePayload,
  type PurchaseContractCreatePayload,
  type PurchaseContractGeneratePayload,
  type PurchaseContractReminder,
  type PurchaseInvoiceNotice,
  type PurchaseInvoiceNoticeGeneratePayload,
  type PurchaseInvoiceNoticeLinePayload,
  type PurchaseInvoiceNoticeReceivePayload,
  type PurchaseInvoiceNoticeReminder,
  type PurchaseInvoiceNoticeSendPayload,
  type PurchaseFollowOverdueNode,
  type PurchaseFollowPlan,
  type PurchaseFollowPlanGeneratePayload,
  type PurchaseInquiryCreatePayload,
  type PurchaseInquiryReference,
  type PurchaseInquiryTemplatePayload,
  type SampleFeePayload,
  type SampleProgressPayload,
  type SampleDelivery,
  type SampleDeliveryApprovePayload,
  type SampleDeliveryCreatePayload,
  type SampleDeliveryFeeStatistics,
  type SampleDeliveryTrackingPayload,
  type SampleRecord,
  type SampleRecordCreatePayload,
  type SampleRecordImagePayload,
  type SampleRecordStockEventPayload,
  type SampleRequest,
  type SampleRequestCreatePayload,
  type SampleRequestLinePayload,
  type ScheduleCreatePayload,
  type ShipmentApprovePayload,
  type ShipmentPlan,
  type ShipmentPlanGeneratePayload,
  type ShipmentReminder,
  type SupplierQuotationPayload,
  type SupplierSampleEvidence,
  type Supplier,
  type SupplierContactPayload,
  type SupplierCreatePayload,
  type SupplierTransactionList,
  type SupplierUpdatePayload,
} from './api'

const productPath = '/masterdata/products'
const customerPath = '/masterdata/customers'
const supplierPath = '/masterdata/suppliers'
const partnerPath = '/masterdata/partners'
const documentPartyPath = '/masterdata/document-parties'
const sampleRequestPath = '/sample/requests'
const sampleRecordPath = '/sample/records'
const sampleDeliveryPath = '/sample/deliveries'
const salesQuotationPath = '/sales/quotations'
const salesContractPath = '/sales/contracts'
const salesShipmentPath = '/sales/shipments'
const purchaseInquiryPath = '/purchase/inquiries'
const purchaseContractPath = '/purchase/contracts'
const purchaseInvoiceNoticePath = '/purchase/invoice-notices'
const purchaseFollowupPath = '/purchase/followup'
const qualityInspectionPath = '/quality/inspections'
const warehouseInboundPlanPath = '/warehouse/inbound-plans'
const warehouseInboundOrderPath = '/warehouse/inbound-orders'
const warehouseOutboundPlanPath = '/warehouse/outbound-plans'
const warehouseOutboundOrderPath = '/warehouse/outbound-orders'

const dashboard = ref<Dashboard | null>(null)
const currentUser = ref<CurrentUser | null>(null)
const menus = ref<MenuItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const isAuthenticated = ref(hasAuthToken())
const activePath = ref(normalizePath(window.location.pathname))

const products = ref<Product[]>([])
const selectedProductId = ref<string | null>(null)
const productSearch = ref('')
const productMessage = ref('')
const productExportPreview = ref('')
const customers = ref<Customer[]>([])
const selectedCustomerId = ref<string | null>(null)
const customerSearch = ref('')
const customerCountryFilter = ref('')
const customerCreditFilter = ref('')
const customerMessage = ref('')
const customerTransactions = ref<CustomerTransactionList>({ items: [], total: 0 })
const suppliers = ref<Supplier[]>([])
const selectedSupplierId = ref<string | null>(null)
const supplierSearch = ref('')
const supplierCountryFilter = ref('')
const supplierCreditFilter = ref('')
const supplierMessage = ref('')
const supplierTransactions = ref<SupplierTransactionList>({ items: [], total: 0 })
const partners = ref<Partner[]>([])
const selectedPartnerId = ref<string | null>(null)
const partnerSearch = ref('')
const partnerTypeFilter = ref('')
const partnerMessage = ref('')
const partnerFeeRecords = ref<PartnerFeeRecordList>({ items: [], total: 0 })
const documentParties = ref<DocumentParty[]>([])
const selectedDocumentPartyId = ref<string | null>(null)
const documentPartySearch = ref('')
const documentPartyTypeFilter = ref('')
const documentPartyCustomerFilter = ref('')
const documentPartyMessage = ref('')
const documentPartyLookup = ref<DocumentPartyList>({ items: [], total: 0 })
const sampleRequests = ref<SampleRequest[]>([])
const selectedSampleRequestId = ref<string | null>(null)
const sampleSearch = ref('')
const sampleStatusFilter = ref('')
const sampleCustomerFilter = ref('')
const sampleMessage = ref('')
const sampleRecords = ref<SampleRecord[]>([])
const selectedSampleRecordId = ref<string | null>(null)
const sampleRecordSearch = ref('')
const sampleRecordTypeFilter = ref('')
const sampleRecordCustomerFilter = ref('')
const sampleRecordContractFilter = ref('')
const sampleRecordMessage = ref('')
const sampleDeliveries = ref<SampleDelivery[]>([])
const selectedSampleDeliveryId = ref<string | null>(null)
const sampleDeliverySearch = ref('')
const sampleDeliveryStatusFilter = ref('')
const sampleDeliveryCustomerFilter = ref('')
const sampleDeliveryExpressFilter = ref('')
const sampleDeliveryMessage = ref('')
const sampleDeliveryFeeStatistics = ref<SampleDeliveryFeeStatistics>({
  items: [],
  total_amount: '0.00',
  currency: 'USD',
})
const sampleDeliverySampleHistory = ref<SampleDelivery[]>([])
const sampleDeliveryQuoteHistory = ref<SampleDelivery[]>([])
const exportQuotations = ref<ExportQuotation[]>([])
const selectedExportQuotationId = ref<string | null>(null)
const exportQuotationSearch = ref('')
const exportQuotationStatusFilter = ref('')
const exportQuotationCustomerFilter = ref('')
const exportQuotationMessage = ref('')
const exportQuotationHistory = ref<ExportQuotation[]>([])
const exportQuotationPurchaseReferences = ref<ExportQuotationPurchaseReference[]>([])
const exportQuotationSampleDeliveries = ref<SampleDelivery[]>([])
const exportQuotationExportPreview = ref('')
const exportQuotationContract = ref<ExportQuotationContract | null>(null)
const exportContracts = ref<ExportContract[]>([])
const selectedExportContractId = ref<string | null>(null)
const exportContractSearch = ref('')
const exportContractStatusFilter = ref('')
const exportContractCustomerFilter = ref('')
const exportContractMessage = ref('')
const exportContractQuotationHistory = ref<ExportQuotation[]>([])
const exportContractExportPreview = ref('')
const shipments = ref<ShipmentPlan[]>([])
const selectedShipmentId = ref<string | null>(null)
const shipmentSearch = ref('')
const shipmentStatusFilter = ref('')
const shipmentCustomerFilter = ref('')
const shipmentContractFilter = ref('')
const shipmentMessage = ref('')
const shipmentReminders = ref<ShipmentReminder[]>([])
const purchaseInquiries = ref<PurchaseInquiry[]>([])
const selectedPurchaseInquiryId = ref<string | null>(null)
const editingPurchaseInquiryId = ref<string | null>(null)
const purchaseInquirySearch = ref('')
const purchaseInquiryStatusFilter = ref('')
const purchaseInquiryProductFilter = ref('')
const purchaseInquirySupplierFilter = ref('')
const purchaseInquiryMessage = ref('')
const purchaseInquiryTemplatePreview = ref('')
const purchaseInquirySupplierSamples = ref<SupplierSampleEvidence[]>([])
const purchaseInquiryReferences = ref<PurchaseInquiryReference[]>([])
const purchaseContracts = ref<PurchaseContract[]>([])
const selectedPurchaseContractId = ref<string | null>(null)
const editingPurchaseContractId = ref<string | null>(null)
const purchaseContractSearch = ref('')
const purchaseContractStatusFilter = ref('')
const purchaseContractSupplierFilter = ref('')
const purchaseContractSourceFilter = ref('')
const purchaseContractMessage = ref('')
const purchaseContractReminders = ref<PurchaseContractReminder[]>([])
const purchaseInvoiceNotices = ref<PurchaseInvoiceNotice[]>([])
const selectedPurchaseInvoiceNoticeId = ref<string | null>(null)
const purchaseInvoiceNoticeSearch = ref('')
const purchaseInvoiceNoticeStatusFilter = ref('')
const purchaseInvoiceNoticeSupplierFilter = ref('')
const purchaseInvoiceNoticeCustomsFilter = ref('')
const purchaseInvoiceNoticeMessage = ref('')
const purchaseInvoiceNoticeReminders = ref<PurchaseInvoiceNoticeReminder[]>([])
const followupTemplates = ref<FollowProcessTemplate[]>([])
const selectedFollowupTemplateId = ref<string | null>(null)
const followupPlans = ref<PurchaseFollowPlan[]>([])
const selectedFollowupPlanId = ref<string | null>(null)
const followupSearch = ref('')
const followupStatusFilter = ref('')
const followupSupplierFilter = ref('')
const followupContractFilter = ref('')
const followupMessage = ref('')
const followupOverdueNodes = ref<PurchaseFollowOverdueNode[]>([])
const followupOverdueAsOf = ref('2026-09-05')
const qualityInspections = ref<QualityInspection[]>([])
const selectedQualityInspectionId = ref<string | null>(null)
const editingQualityInspectionId = ref<string | null>(null)
const qualityInspectionSearch = ref('')
const qualityInspectionResultFilter = ref('')
const qualityInspectionSupplierFilter = ref('')
const qualityInspectionContractFilter = ref('')
const qualityInspectionMessage = ref('')
const qualityInboundEligibility = ref<QualityInspectionInboundEligibility | null>(null)
const inboundPlans = ref<InboundPlan[]>([])
const selectedInboundPlanId = ref<string | null>(null)
const inboundPlanSearch = ref('')
const inboundPlanStatusFilter = ref('')
const inboundPlanTypeFilter = ref('')
const inboundPlanSupplierFilter = ref('')
const inboundPlanContractFilter = ref('')
const inboundPlanMessage = ref('')
const inboundOrders = ref<InboundOrder[]>([])
const selectedInboundOrderId = ref<string | null>(null)
const inboundOrderSearch = ref('')
const inboundOrderStatusFilter = ref('')
const inboundOrderModeFilter = ref('')
const inboundOrderSupplierFilter = ref('')
const inboundOrderContractFilter = ref('')
const inboundOrderMessage = ref('')
const inventoryBalances = ref<InventoryBalance[]>([])
const inventoryLedgers = ref<InventoryLedger[]>([])
const inventorySearch = ref('')
const outboundPlans = ref<OutboundPlan[]>([])
const selectedOutboundPlanId = ref<string | null>(null)
const outboundPlanSearch = ref('')
const outboundPlanStatusFilter = ref('')
const outboundPlanTypeFilter = ref('')
const outboundPlanSourceFilter = ref('')
const outboundPlanCustomerFilter = ref('')
const outboundPlanSourceIdFilter = ref('')
const outboundPlanMessage = ref('')
const outboundOrders = ref<OutboundOrder[]>([])
const selectedOutboundOrderId = ref<string | null>(null)
const outboundOrderSearch = ref('')
const outboundOrderStatusFilter = ref('')
const outboundOrderModeFilter = ref('')
const outboundOrderTypeFilter = ref('')
const outboundOrderCustomerFilter = ref('')
const outboundOrderSourceIdFilter = ref('')
const outboundOrderMessage = ref('')

const loginForm = reactive({
  username: 'demo',
  password: 'demo123',
})

const form = reactive({
  title: '跟进采购合同节点',
  description: '确认样提交前提醒供应商',
  starts_at: '2026-06-15T09:00',
  ends_at: '2026-06-15T10:00',
})

const productForm = reactive({
  code: nextProductCode(),
  cn_name: '环保购物袋',
  en_name: 'Eco Shopping Bag',
  specification: '40x35cm',
  model: 'BAG-40',
  customs_code: '4202920000',
  tax_rate: '0.13',
  rebate_rate: '0.09',
  package_info: '100 pcs/carton',
  unit: 'pcs',
  image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
  accessory_name: '棉绳',
  accessory_unit_consumption: '0.45',
  accessory_unit: 'm',
  accessory_supplier: '远景辅料供应商',
  accessory_rule: 'by_supplier',
})

const accessoryForm = reactive({
  accessory_name: '金属扣',
  unit_consumption: '2',
  unit: 'pcs',
  default_supplier_name: '五金供应商',
  purchase_split_rule: 'by_accessory',
})

const customerForm = reactive({
  code: nextCustomerCode(),
  cn_name: '欧陆家居用品有限公司',
  en_name: 'Euro Home Retail Ltd.',
  country: 'Germany',
  address: 'Hamburg Trade Center',
  website: 'https://example.com/euro-home',
  status: 'active',
  contact_name: 'Anna Schmidt',
  contact_title: 'Sourcing Manager',
  contact_email: 'anna@example.com',
  contact_phone: '+49-40-0000',
  credit_grade: 'A',
  credit_limit: '50000',
  currency: 'USD',
  payment_terms: 'T/T 30 days',
  risk_note: '稳定采购，账期可控',
})

const customerEditForm = reactive({
  cn_name: '',
  en_name: '',
  country: '',
  address: '',
  website: '',
  status: 'active',
  credit_grade: '',
  credit_limit: '',
  currency: 'USD',
  payment_terms: '',
  risk_note: '',
})

const customerContactForm = reactive({
  name: 'Bob Carter',
  title: 'Import Director',
  email: 'bob@example.com',
  phone: '+1-212-0000',
  is_primary: true,
})

const supplierForm = reactive({
  code: nextSupplierCode(),
  cn_name: '华东包装制品厂',
  en_name: 'East China Packaging Factory',
  country: 'China',
  address: 'Ningbo Industrial Zone',
  website: 'https://example.com/east-pack',
  status: 'active',
  contact_name: 'Li Wei',
  contact_title: 'Sales Manager',
  contact_email: 'liwei@example.com',
  contact_phone: '+86-574-0000',
  credit_grade: 'A',
  credit_limit: '80000',
  currency: 'CNY',
  payment_terms: '30% deposit, 70% before shipment',
  risk_note: '长期合作供应商',
})

const supplierEditForm = reactive({
  cn_name: '',
  en_name: '',
  country: '',
  address: '',
  website: '',
  status: 'active',
  credit_grade: '',
  credit_limit: '',
  currency: 'CNY',
  payment_terms: '',
  risk_note: '',
})

const supplierContactForm = reactive({
  name: 'Zhang Min',
  title: 'Production Planner',
  email: 'zhangmin@example.com',
  phone: '+86-574-1111',
  is_primary: true,
})

const partnerForm = reactive({
  code: nextPartnerCode(),
  cn_name: '远航国际货代',
  en_name: 'Ocean Link Forwarding',
  partner_type: 'freight_forwarder',
  country: 'China',
  address: 'Shanghai Port Service Center',
  website: 'https://example.com/ocean-link',
  status: 'active',
  contact_name: 'Grace Lin',
  contact_title: 'Operation Manager',
  contact_email: 'grace@example.com',
  contact_phone: '+86-21-0000',
})

const partnerEditForm = reactive({
  cn_name: '',
  en_name: '',
  partner_type: 'freight_forwarder',
  country: '',
  address: '',
  website: '',
  status: 'active',
})

const partnerContactForm = reactive({
  name: 'Mia Chen',
  title: 'Account Executive',
  email: 'mia@example.com',
  phone: '+86-21-1111',
  is_primary: true,
})

const documentPartyForm = reactive({
  code: nextDocumentPartyCode(),
  party_type: 'consignee',
  display_name: 'Euro Home Hamburg GmbH',
  customer_id: 'customer-euro-home',
  customer_name: '欧陆家居用品有限公司',
  country: 'Germany',
  address: 'Hamburg Trade Center, HafenCity',
  contact_person: 'Anna Schmidt',
  email: 'anna.docs@example.com',
  phone: '+49-40-0000',
  bank_name: '',
  swift_code: '',
  account_no: '',
  tax_id: 'DE123456789',
  remarks: '默认收货人',
  is_default: true,
  status: 'active',
})

const documentPartyEditForm = reactive({
  party_type: 'consignee',
  display_name: '',
  customer_id: '',
  customer_name: '',
  country: '',
  address: '',
  contact_person: '',
  email: '',
  phone: '',
  bank_name: '',
  swift_code: '',
  account_no: '',
  tax_id: '',
  remarks: '',
  is_default: false,
  status: 'active',
})

const sampleRequestForm = reactive({
  code: nextSampleRequestCode(),
  request_date: '2026-06-20',
  customer_id: 'customer-euro-home',
  customer_name: '欧陆家居用品有限公司',
  product_id: 'product-bag',
  product_code: 'BAG-40',
  product_name: 'Eco Shopping Bag',
  supplier_id: 'supplier-pack',
  supplier_name: '华东包装制品厂',
  sales_user_id: 'u-001',
  sales_user_name: '演示业务主管',
  destination: 'factory',
  requirements: '客户要求环保材质，先做确认样。',
  due_date: '2026-06-28',
  status: 'draft',
  line_product_name: 'Eco Shopping Bag',
  line_product_code: 'BAG-40',
  line_specification: '40x35cm',
  line_quantity: '3',
  line_unit: 'pcs',
  line_requirement: '绿色样、自然色各一，另加留样。',
})

const sampleProgressForm = reactive({
  stage: 'sent_to_factory',
  status: 'in_progress',
  occurred_at: '2026-06-21',
  note: '已外发工厂打样。',
  handler_name: 'Li Wei',
})

const sampleFeeForm = reactive({
  fee_type: 'sample_making',
  amount: '120.50',
  currency: 'USD',
  payee_type: 'supplier',
  payee_name: '华东包装制品厂',
  remark: '外发工厂打样费',
})

const sampleRecordForm = reactive({
  code: nextSampleRecordCode(),
  sample_type: 'confirm_sample',
  status: 'registered',
  product_id: 'product-bag',
  product_code: 'BAG-40',
  product_name: 'Eco Shopping Bag',
  customer_id: 'customer-euro-home',
  customer_name: '欧陆家居用品有限公司',
  supplier_id: 'supplier-pack',
  supplier_name: '华东包装制品厂',
  customer_sku: 'CUST-BAG-40',
  supplier_sku: 'SUP-BAG-40',
  purchase_contract_id: 'pc-2026-001',
  purchase_contract_no: 'PC-2026-001',
  source_type: 'sample_request',
  source_id: 'sr-2026-001',
  source_code: 'SR-2026-001',
  source_note: '来自打样确认样',
  received_at: '2026-06-22',
  submitted_at: '2026-06-23',
  quantity: '5',
  unit: 'pcs',
  description: '客户确认样，等待采购跟单节点回写。',
  image_file_id: 'file-sample-front',
  image_filename: 'confirm-sample-front.jpg',
  image_url: 'https://assets.example.test/confirm-sample-front.jpg',
  image_caption: '正面图片',
  image_is_primary: true,
})

const sampleRecordImageForm = reactive({
  file_id: 'file-sample-side',
  filename: 'confirm-sample-side.jpg',
  url: 'https://assets.example.test/confirm-sample-side.jpg',
  caption: '侧面图片',
  is_primary: false,
})

const sampleRecordStockForm = reactive({
  event_type: 'delivered',
  quantity: '2',
  unit: 'pcs',
  occurred_at: '2026-06-24',
  delivery_no: 'SD-2026-001',
  recipient: '欧陆家居用品有限公司',
  note: '寄送客户确认。',
})

const sampleDeliveryForm = reactive({
  code: nextSampleDeliveryCode(),
  delivery_date: '2026-06-25',
  customer_id: 'customer-euro-home',
  customer_name: '欧陆家居用品有限公司',
  supplier_id: 'supplier-pack',
  supplier_name: '华东包装制品厂',
  factory_id: 'factory-pack',
  factory_name: '华东包装制品厂',
  recipient_name: 'Anna Schmidt',
  recipient_company: 'Euro Home Retail Ltd.',
  recipient_address: 'Hamburg Trade Center, HafenCity',
  express_company: 'DHL',
  tracking_no: 'DHL-2026-001',
  quote_id: 'quote-2026-001',
  quote_no: 'QT-2026-001',
  remark: '寄送客户确认样。',
  sample_record_id: '',
  sample_code: '',
  sample_type: 'confirm_sample',
  product_id: 'product-bag',
  product_code: 'BAG-40',
  product_name: 'Eco Shopping Bag',
  quantity: '2',
  unit: 'pcs',
  line_remark: '确认样寄给客户留档。',
  fee_type: 'express',
  fee_amount: '18.50',
  fee_currency: 'USD',
  fee_payer_type: 'company',
  fee_remark: 'DHL 国际快递',
})

const sampleDeliveryApproveForm = reactive({
  reviewer_name: '演示业务主管',
  approved_at: '2026-06-25',
})

const sampleDeliveryTrackingForm = reactive({
  express_company: 'DHL',
  tracking_no: 'DHL-2026-001',
  status: 'shipped',
})

const exportQuotationForm = reactive({
  code: nextExportQuotationCode(),
  quote_date: '2026-07-01',
  customer_id: 'customer-euro-home',
  customer_name: '欧陆家居用品有限公司',
  sales_user_id: 'u-001',
  sales_user_name: '演示业务主管',
  currency: 'USD',
  trade_term: 'FOB Ningbo',
  valid_until: '2026-07-15',
  description: '环保购物袋首单报价，含海运费。',
  product_id: 'product-bag',
  product_code: 'BAG-40',
  product_name: 'Eco Shopping Bag',
  specification: '40x35cm',
  model: 'BAG-40',
  quantity: '1000',
  unit: 'pcs',
  unit_price: '1.25',
  freight_method: 'sea',
  freight_amount: '120.00',
  purchase_reference_supplier_name: '华东包装制品厂',
  purchase_reference_price: '0.82',
  line_remark: '首单报价',
})

const exportQuotationApproveForm = reactive({
  reviewer_name: '演示业务主管',
  approved_at: '2026-07-02',
})

const exportQuotationContractForm = reactive({
  confirmed_at: '2026-07-03',
  contract_no: nextExportContractNo(),
})

const exportContractForm = reactive({
  code: nextExportContractNo(),
  contract_date: '2026-07-03',
  customer_id: 'customer-euro-home',
  customer_name: '欧陆家居用品有限公司',
  sales_user_id: 'u-001',
  sales_user_name: '演示业务主管',
  currency: 'USD',
  trade_term: 'FOB Ningbo',
  planned_ship_date: '2026-08-10',
  payment_terms: '30% T/T in advance, balance before shipment',
  source_quotation_id: '',
  source_quotation_no: '',
  remarks: '客户确认后签订出口合同。',
  product_id: 'product-bag',
  product_code: 'BAG-40',
  product_name: 'Eco Shopping Bag',
  specification: '40x35cm',
  model: 'BAG-40',
  quantity: '1000',
  unit: 'pcs',
  unit_price: '1.40',
  purchased_quantity: '400',
  shipped_quantity: '250',
  image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
  line_remark: '首单出口合同',
})

const exportContractApproveForm = reactive({
  reviewer_name: '演示业务主管',
  approved_at: '2026-07-06',
})

const exportContractSignatureForm = reactive({
  signed_by: 'Anna Schmidt',
  signed_at: '2026-07-04',
  signature_method: 'email_scan',
  file_no: 'SIGN-2026-001',
  remark: '客户邮件回签',
})

const exportContractAdvancePaymentForm = reactive({
  payment_no: 'AR-2026-001',
  received_at: '2026-07-05',
  amount: '300.00',
  currency: 'USD',
  payer_name: 'Euro Home Retail Ltd.',
  remark: '30% 预收款',
})

const shipmentForm = reactive({
  code: nextShipmentNo(),
  shipment_date: '2026-08-18',
  planned_ship_date: '2026-08-20',
  contract_id_a: '',
  quantity_a: '300',
  contract_id_b: '',
  quantity_b: '200',
  shipping_method: 'sea',
  port_of_loading: 'Ningbo',
  port_of_destination: 'Hamburg',
  vessel_name: 'COSCO Star',
  container_no: 'CONT-2026-001',
  booking_no: 'BOOK-2026-001',
  document_owner_name: '单证部',
  estimated_payable_amount: '780.00',
  remarks: '两个出口合同合并出运',
})

const shipmentApproveForm = reactive({
  reviewer_name: '演示业务主管',
  approved_at: '2026-08-19',
})

const purchaseInquiryForm = reactive({
  code: nextPurchaseInquiryCode(),
  inquiry_date: '2026-08-01',
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
})

const purchaseQuotationForm = reactive({
  supplier_id: 'supplier-pack-a',
  supplier_name: '华东包装制品厂',
  quoted_at: '2026-08-02',
  unit_price: '0.78',
  currency: 'USD',
  lead_time_days: '18',
  min_order_quantity: '800',
  sample_available: true,
  remark: '含环保包装',
})

const purchaseInquiryTemplateForm = reactive({
  template_name: '标准采购询价模板',
  recipient_emails: 'supplier@example.com',
})

const purchaseContractForm = reactive({
  code: nextPurchaseContractCode(),
  contract_date: '2026-08-03',
  supplier_id: 'supplier-accessory-a',
  supplier_name: '远景辅料供应商',
  buyer_user_id: 'u-001',
  buyer_user_name: '演示业务主管',
  currency: 'USD',
  delivery_date: '2026-08-24',
  payment_terms: '30% advance, 70% before delivery',
  source_type: 'stock_purchase' as PurchaseContractCreatePayload['source_type'],
  remarks: '库存补货采购，可不关联出口合同。',
  product_id: '',
  product_code: 'ACC-COTTON-ROPE',
  product_name: '棉绳',
  specification: '5mm',
  model: 'ROPE-5',
  quantity: '500',
  unit: 'm',
  unit_price: '0.12',
  source_export_contract_id: '',
  source_export_contract_no: '',
  source_export_contract_line_id: '',
  line_remark: '库存安全量补货',
})

const purchaseContractGenerateForm = reactive({
  code: nextPurchaseContractCode(),
  contract_date: '2026-08-04',
  supplier_id: 'supplier-accessory-a',
  supplier_name: '远景辅料供应商',
  buyer_user_id: 'u-001',
  buyer_user_name: '演示业务主管',
  currency: 'USD',
  delivery_date: '2026-08-24',
  payment_terms: '30% advance, 70% before delivery',
  unit_price: '0.12',
  remarks: '按已审批出口合同商品配件自动生成采购合同。',
  source_contract_id_a: '',
  source_contract_id_b: '',
})

const purchaseContractApproveForm = reactive({
  reviewer_name: '演示业务主管',
  approved_at: '2026-08-05',
})

const purchaseInvoiceNoticeForm = reactive({
  customs_declaration_id: 'customs-demo-001',
  customs_declaration_no: nextPurchaseInvoiceNoticeCustomsNo(),
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
})

const purchaseInvoiceNoticeSendForm = reactive({
  sender_name: '演示业务主管',
  sent_at: '2026-09-05',
})

const purchaseInvoiceNoticeReceiveForm = reactive({
  tax_invoice_no: 'VAT-2026-001',
  received_at: '2026-09-09',
})

const followupTemplateForm = reactive({
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
})

const followupPlanForm = reactive({
  purchase_contract_id: '',
  as_of: '2026-08-05',
})

const followupSourceEventForm = reactive({
  purchase_contract_id: '',
  node_code: 'quality_inspection',
  source_record_type: 'quality_inspection',
  source_record_id: 'qc-demo-001',
  actual_date: '2026-08-19',
  source_summary: 'QC 查验通过',
})

const qualityInspectionForm = reactive({
  code: nextQualityInspectionCode(),
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
})

const inboundPlanGenerateForm = reactive({
  purchase_contract_id: '',
  inbound_type: 'purchase_inbound',
  planned_date: '',
})

const inboundPlanScheduleForm = reactive({
  planned_date: '2026-08-28',
  warehouse_id: 'wh-ningbo',
  warehouse_name: '宁波总仓',
  location_id: 'loc-a-01',
  location_name: 'A-01',
  operator_name: '仓库主管',
})

const inboundOrderForm = reactive({
  plan_id: '',
  code: nextInboundOrderCode(),
  inbound_mode: 'formal',
  inbound_at: '2026-08-30',
  warehouse_id: 'wh-ningbo',
  warehouse_name: '宁波总仓',
  location_id: 'loc-a-01',
  location_name: 'A-01',
  operator_name: '仓库主管',
})

const inboundOrderApprovalForm = reactive({
  reviewer_name: '演示业务主管',
  approved_at: '2026-08-30',
})

const outboundPlanGenerateForm = reactive({
  shipment_plan_id: '',
  outbound_type: 'finished_goods_outbound',
  planned_date: '',
})

const outboundPlanScheduleForm = reactive({
  planned_date: '2026-08-18',
  warehouse_id: 'wh-ningbo',
  warehouse_name: '宁波总仓',
  location_id: 'loc-fg-01',
  location_name: '成品区 A-01',
  operator_name: '仓库主管',
})

const outboundOrderForm = reactive({
  plan_id: '',
  code: nextOutboundOrderCode(),
  outbound_mode: 'formal',
  outbound_at: '2026-09-30',
  warehouse_id: 'wh-ningbo',
  warehouse_name: '宁波总仓',
  location_id: 'loc-fg-01',
  location_name: '成品区 A-01',
  operator_name: '仓库主管',
  exception_reason: '',
})

const outboundOrderApprovalForm = reactive({
  reviewer_name: '演示业务主管',
  approved_at: '2026-09-30',
  allow_negative: false,
})

const summaryItems = computed(() => {
  const summary = dashboard.value?.summary
  return [
    { label: '公告', value: summary?.announcement_count ?? 0 },
    { label: '待办', value: summary?.todo_count ?? 0 },
    { label: '未读提醒', value: summary?.unread_notification_count ?? 0 },
    { label: '今日日程', value: summary?.today_schedule_count ?? 0 },
    { label: '快捷入口', value: summary?.shortcut_count ?? 0 },
  ]
})

const productStats = computed(() => {
  const accessories = products.value.reduce((count, item) => count + item.accessories.length, 0)
  const customsCodes = new Set(products.value.map((item) => item.customs_code)).size
  return [
    { label: '商品数', value: products.value.length },
    { label: '配件明细', value: accessories },
    { label: '海关编码', value: customsCodes },
  ]
})

const customerStats = computed(() => {
  const contactCount = customers.value.reduce((count, item) => count + item.contacts.length, 0)
  const countryCount = new Set(customers.value.map((item) => item.country)).size
  return [
    { label: '客户数', value: customers.value.length },
    { label: '联系人', value: contactCount },
    { label: '国家地区', value: countryCount },
  ]
})

const supplierStats = computed(() => {
  const contactCount = suppliers.value.reduce((count, item) => count + item.contacts.length, 0)
  const countryCount = new Set(suppliers.value.map((item) => item.country)).size
  return [
    { label: '供应商数', value: suppliers.value.length },
    { label: '联系人', value: contactCount },
    { label: '国家地区', value: countryCount },
  ]
})

const partnerStats = computed(() => {
  const contactCount = partners.value.reduce((count, item) => count + item.contacts.length, 0)
  const typeCount = new Set(partners.value.map((item) => item.partner_type)).size
  return [
    { label: '合作伙伴数', value: partners.value.length },
    { label: '联系人', value: contactCount },
    { label: '伙伴类型', value: typeCount },
  ]
})

const documentPartyStats = computed(() => {
  const defaultCount = documentParties.value.filter((item) => item.is_default).length
  const typeCount = new Set(documentParties.value.map((item) => item.party_type)).size
  return [
    { label: '单证资料数', value: documentParties.value.length },
    { label: '默认项', value: defaultCount },
    { label: '资料类型', value: typeCount },
  ]
})

const sampleStats = computed(() => {
  const feeTotal = sampleRequests.value.reduce(
    (total, item) => total + item.fees.reduce((sum, fee) => sum + Number(fee.amount), 0),
    0,
  )
  const inProgressCount = sampleRequests.value.filter((item) => item.status === 'in_progress').length
  return [
    { label: '打样单数', value: sampleRequests.value.length },
    { label: '进行中', value: inProgressCount },
    { label: '费用合计', value: feeTotal.toFixed(2) },
  ]
})

const sampleRecordStats = computed(() => {
  const received = sampleRecords.value.reduce(
    (total, item) => total + Number(item.stock_summary.received_quantity),
    0,
  )
  const retained = sampleRecords.value.reduce(
    (total, item) => total + Number(item.stock_summary.retained_quantity),
    0,
  )
  const followupCount = sampleRecords.value.reduce(
    (total, item) => total + item.followup_events.length,
    0,
  )
  return [
    { label: '样品数', value: sampleRecords.value.length },
    { label: '收样数', value: received },
    { label: '公司留样', value: retained },
    { label: '跟单节点', value: followupCount },
  ]
})

const sampleDeliveryStats = computed(() => {
  const approvedCount = sampleDeliveries.value.filter((item) => item.status === 'approved').length
  const submittedCount = sampleDeliveries.value.filter((item) => item.status === 'submitted').length
  return [
    { label: '寄样单数', value: sampleDeliveries.value.length },
    { label: '待审核', value: submittedCount },
    { label: '已审核', value: approvedCount },
    {
      label: '费用合计',
      value: formatMoney(sampleDeliveryFeeStatistics.value.total_amount, sampleDeliveryFeeStatistics.value.currency),
    },
  ]
})

const exportQuotationStats = computed(() => {
  const submittedCount = exportQuotations.value.filter((item) => item.approval_status === 'submitted').length
  const approvedCount = exportQuotations.value.filter((item) =>
    ['approved', 'contract_generated'].includes(item.approval_status),
  ).length
  const total = exportQuotations.value.reduce((sum, item) => sum + Number(item.total_amount), 0)
  return [
    { label: '报价单数', value: exportQuotations.value.length },
    { label: '待审批', value: submittedCount },
    { label: '已审批', value: approvedCount },
    { label: '报价金额', value: formatMoney(total.toFixed(2), exportQuotations.value[0]?.currency ?? 'USD') },
  ]
})

const exportContractStats = computed(() => {
  const submittedCount = exportContracts.value.filter((item) => item.approval_status === 'submitted').length
  const approvedCount = exportContracts.value.filter((item) => item.approval_status === 'approved').length
  const total = exportContracts.value.reduce((sum, item) => sum + Number(item.statistics.total_amount), 0)
  const advance = exportContracts.value.reduce(
    (sum, item) => sum + Number(item.statistics.advance_payment_amount),
    0,
  )
  return [
    { label: '合同数', value: exportContracts.value.length },
    { label: '待审批', value: submittedCount },
    { label: '已审批', value: approvedCount },
    { label: '合同金额', value: formatMoney(total.toFixed(2), exportContracts.value[0]?.currency ?? 'USD') },
    { label: '预收款', value: formatMoney(advance.toFixed(2), exportContracts.value[0]?.currency ?? 'USD') },
  ]
})

const shipmentStats = computed(() => {
  const submittedCount = shipments.value.filter((item) => item.approval_status === 'submitted').length
  const approvedCount = shipments.value.filter((item) => item.approval_status === 'approved').length
  const receivable = shipments.value.reduce(
    (sum, item) => sum + Number(item.finance_overview.receivable_amount),
    0,
  )
  const profit = shipments.value.reduce(
    (sum, item) => sum + Number(item.finance_overview.profit_amount),
    0,
  )
  return [
    { label: '出货单数', value: shipments.value.length },
    { label: '待审批', value: submittedCount },
    { label: '已审批', value: approvedCount },
    { label: '应收金额', value: formatMoney(receivable.toFixed(2), shipments.value[0]?.currency ?? 'USD') },
    { label: '预计利润', value: formatMoney(profit.toFixed(2), shipments.value[0]?.currency ?? 'USD') },
  ]
})

const purchaseInquiryStats = computed(() => {
  const sentCount = purchaseInquiries.value.filter((item) => item.template_sent_at !== null).length
  const quotedCount = purchaseInquiries.value.filter((item) => item.status === 'quoted').length
  const quotationCount = purchaseInquiries.value.reduce(
    (total, item) => total + item.quotations.length,
    0,
  )
  const lowestPrice = purchaseInquiries.value
    .flatMap((item) => item.quotations)
    .map((item) => Number(item.unit_price))
    .filter((value) => !Number.isNaN(value))
    .sort((left, right) => left - right)[0]
  return [
    { label: '询价单数', value: purchaseInquiries.value.length },
    { label: '已发模板', value: sentCount },
    { label: '已报价', value: quotedCount },
    { label: '供应商报价', value: quotationCount },
    {
      label: '最低参考价',
      value: lowestPrice === undefined ? '未报价' : formatMoney(lowestPrice.toFixed(2), 'USD'),
    },
  ]
})

const purchaseContractStats = computed(() => {
  const submittedCount = purchaseContracts.value.filter((item) => item.approval_status === 'submitted').length
  const approvedCount = purchaseContracts.value.filter((item) => item.approval_status === 'approved').length
  const total = purchaseContracts.value.reduce((sum, item) => sum + Number(item.statistics.total_amount), 0)
  const openReminders = purchaseContractReminders.value.filter((item) => item.status === 'open').length
  return [
    { label: '采购合同', value: purchaseContracts.value.length },
    { label: '待审批', value: submittedCount },
    { label: '已审批', value: approvedCount },
    {
      label: '采购金额',
      value: formatMoney(total.toFixed(2), purchaseContracts.value[0]?.currency ?? 'USD'),
    },
    { label: '待办提醒', value: openReminders },
  ]
})

const purchaseInvoiceNoticeStats = computed(() => {
  const sentCount = purchaseInvoiceNotices.value.filter((item) => item.status === 'sent').length
  const receivedCount = purchaseInvoiceNotices.value.filter((item) => item.status === 'received').length
  const total = purchaseInvoiceNotices.value.reduce((sum, item) => sum + Number(item.total_amount), 0)
  const openReminders = purchaseInvoiceNoticeReminders.value.filter((item) => item.status === 'open').length
  return [
    { label: '开票通知', value: purchaseInvoiceNotices.value.length },
    { label: '已发送', value: sentCount },
    { label: '已收票', value: receivedCount },
    {
      label: '通知金额',
      value: formatMoney(total.toFixed(2), purchaseInvoiceNotices.value[0]?.currency ?? 'CNY'),
    },
    { label: '待催税票', value: openReminders },
  ]
})

const followupStats = computed(() => {
  const overdueCount = followupPlans.value.filter((item) => item.overall_status === 'overdue').length
  const completedCount = followupPlans.value.filter((item) => item.overall_status === 'completed').length
  const nodeCount = followupPlans.value.reduce((total, item) => total + item.nodes.length, 0)
  const completedNodes = followupPlans.value.reduce(
    (total, item) => total + item.nodes.filter((node) => node.status === 'completed').length,
    0,
  )
  return [
    { label: '跟单计划', value: followupPlans.value.length },
    { label: '已完成计划', value: completedCount },
    { label: '逾期计划', value: overdueCount },
    { label: '完成节点', value: `${completedNodes}/${nodeCount}` },
    { label: '逾期节点', value: followupOverdueNodes.value.length },
  ]
})

const qualityInspectionStats = computed(() => {
  const passedCount = qualityInspections.value.filter((item) => item.result === 'passed').length
  const issueCount = qualityInspections.value.reduce((total, item) => total + item.issues.length, 0)
  const blockedCount = qualityInspections.value.filter((item) => item.result !== 'passed').length
  return [
    { label: 'QC 记录', value: qualityInspections.value.length },
    { label: '已通过', value: passedCount },
    { label: '待处理', value: blockedCount },
    { label: '异常问题', value: issueCount },
    {
      label: '入库判定',
      value: qualityInboundEligibility.value
        ? inboundEligibilityLabel(qualityInboundEligibility.value)
        : '未检查',
    },
  ]
})

const inboundPlanStats = computed(() => {
  const scheduledCount = inboundPlans.value.filter((item) => item.status === 'scheduled').length
  const plannedCount = inboundPlans.value.filter((item) => item.status === 'planned').length
  const totalQuantity = inboundPlans.value.reduce(
    (total, item) =>
      total + item.lines.reduce((sum, line) => sum + Number(line.planned_quantity), 0),
    0,
  )
  const typeCount = new Set(inboundPlans.value.map((item) => item.inbound_type)).size
  return [
    { label: '入库计划', value: inboundPlans.value.length },
    { label: '待安排', value: plannedCount },
    { label: '已排库位', value: scheduledCount },
    { label: '待入库数', value: Number.isNaN(totalQuantity) ? '0' : totalQuantity.toFixed(2) },
    { label: '入库类型', value: typeCount },
  ]
})

const inboundOrderStats = computed(() => {
  const draftCount = inboundOrders.value.filter((item) => item.status === 'draft').length
  const submittedCount = inboundOrders.value.filter((item) => item.status === 'submitted').length
  const approvedCount = inboundOrders.value.filter((item) => item.status === 'approved').length
  const availableQuantity = inventoryBalances.value.reduce(
    (sum, item) => sum + Number(item.available_quantity),
    0,
  )
  const pendingQuantity = inventoryBalances.value.reduce(
    (sum, item) => sum + Number(item.pending_inspection_quantity),
    0,
  )
  return [
    { label: '入库单', value: inboundOrders.value.length },
    { label: '草稿', value: draftCount },
    { label: '待审批', value: submittedCount },
    { label: '已入库', value: approvedCount },
    { label: '可用库存', value: Number.isNaN(availableQuantity) ? '0' : availableQuantity.toFixed(2) },
    { label: '待检库存', value: Number.isNaN(pendingQuantity) ? '0' : pendingQuantity.toFixed(2) },
  ]
})

const outboundPlanStats = computed(() => {
  const plannedCount = outboundPlans.value.filter((item) => item.status === 'planned').length
  const scheduledCount = outboundPlans.value.filter((item) => item.status === 'scheduled').length
  const totalQuantity = outboundPlans.value.reduce(
    (total, item) =>
      total + item.lines.reduce((sum, line) => sum + Number(line.planned_quantity), 0),
    0,
  )
  const sourceCount = new Set(outboundPlans.value.map((item) => item.source_id)).size
  return [
    { label: '出库计划', value: outboundPlans.value.length },
    { label: '待安排', value: plannedCount },
    { label: '已排库位', value: scheduledCount },
    { label: '待出库数', value: Number.isNaN(totalQuantity) ? '0' : totalQuantity.toFixed(2) },
    { label: '来源单据', value: sourceCount },
  ]
})

const outboundOrderStats = computed(() => {
  const draftCount = outboundOrders.value.filter((item) => item.status === 'draft').length
  const submittedCount = outboundOrders.value.filter((item) => item.status === 'submitted').length
  const approvedCount = outboundOrders.value.filter((item) => item.status === 'approved').length
  const exceptionCount = outboundOrders.value.filter((item) => item.outbound_mode === 'exception').length
  const totalQuantity = outboundOrders.value.reduce(
    (total, item) => total + item.lines.reduce((sum, line) => sum + Number(line.quantity), 0),
    0,
  )
  const outLedgers = inventoryLedgers.value.filter((item) => item.direction === 'out')
  return [
    { label: '出库单', value: outboundOrders.value.length },
    { label: '草稿', value: draftCount },
    { label: '待审批', value: submittedCount },
    { label: '已出库', value: approvedCount },
    { label: '异常出库', value: exceptionCount },
    { label: '出库数量', value: Number.isNaN(totalQuantity) ? '0' : totalQuantity.toFixed(2) },
    { label: '出库流水', value: outLedgers.length },
  ]
})

const activeMenu = computed(() => menus.value.find((item) => item.path === activePath.value))
const isDashboard = computed(() => activePath.value === '/')
const isProductPage = computed(() => activePath.value === productPath)
const isCustomerPage = computed(() => activePath.value === customerPath)
const isSupplierPage = computed(() => activePath.value === supplierPath)
const isPartnerPage = computed(() => activePath.value === partnerPath)
const isDocumentPartyPage = computed(() => activePath.value === documentPartyPath)
const isSampleRequestPage = computed(() => activePath.value === sampleRequestPath)
const isSampleRecordPage = computed(() => activePath.value === sampleRecordPath)
const isSampleDeliveryPage = computed(() => activePath.value === sampleDeliveryPath)
const isExportQuotationPage = computed(() => activePath.value === salesQuotationPath)
const isExportContractPage = computed(() => activePath.value === salesContractPath)
const isShipmentPage = computed(() => activePath.value === salesShipmentPath)
const isPurchaseInquiryPage = computed(() => activePath.value === purchaseInquiryPath)
const isPurchaseContractPage = computed(() => activePath.value === purchaseContractPath)
const isPurchaseInvoiceNoticePage = computed(() => activePath.value === purchaseInvoiceNoticePath)
const isPurchaseFollowupPage = computed(() => activePath.value === purchaseFollowupPath)
const isQualityInspectionPage = computed(() => activePath.value === qualityInspectionPath)
const isWarehouseInboundPlanPage = computed(() => activePath.value === warehouseInboundPlanPath)
const isWarehouseInboundOrderPage = computed(() => activePath.value === warehouseInboundOrderPath)
const isWarehouseOutboundPlanPage = computed(() => activePath.value === warehouseOutboundPlanPath)
const isWarehouseOutboundOrderPage = computed(() => activePath.value === warehouseOutboundOrderPath)

const selectedProduct = computed<Product | null>(() => {
  if (products.value.length === 0) return null
  return products.value.find((item) => item.id === selectedProductId.value) ?? products.value[0]
})

const selectedCustomer = computed<Customer | null>(() => {
  if (customers.value.length === 0) return null
  return customers.value.find((item) => item.id === selectedCustomerId.value) ?? customers.value[0]
})

const selectedSupplier = computed<Supplier | null>(() => {
  if (suppliers.value.length === 0) return null
  return suppliers.value.find((item) => item.id === selectedSupplierId.value) ?? suppliers.value[0]
})

const selectedPartner = computed<Partner | null>(() => {
  if (partners.value.length === 0) return null
  return partners.value.find((item) => item.id === selectedPartnerId.value) ?? partners.value[0]
})

const selectedDocumentParty = computed<DocumentParty | null>(() => {
  if (documentParties.value.length === 0) return null
  return (
    documentParties.value.find((item) => item.id === selectedDocumentPartyId.value) ??
    documentParties.value[0]
  )
})

const selectedSampleRequest = computed<SampleRequest | null>(() => {
  if (sampleRequests.value.length === 0) return null
  return sampleRequests.value.find((item) => item.id === selectedSampleRequestId.value) ?? sampleRequests.value[0]
})

const selectedSampleRecord = computed<SampleRecord | null>(() => {
  if (sampleRecords.value.length === 0) return null
  return sampleRecords.value.find((item) => item.id === selectedSampleRecordId.value) ?? sampleRecords.value[0]
})

const selectedSampleDelivery = computed<SampleDelivery | null>(() => {
  if (sampleDeliveries.value.length === 0) return null
  return (
    sampleDeliveries.value.find((item) => item.id === selectedSampleDeliveryId.value) ??
    sampleDeliveries.value[0]
  )
})

const selectedExportQuotation = computed<ExportQuotation | null>(() => {
  if (exportQuotations.value.length === 0) return null
  return (
    exportQuotations.value.find((item) => item.id === selectedExportQuotationId.value) ??
    exportQuotations.value[0]
  )
})

const selectedExportContract = computed<ExportContract | null>(() => {
  if (exportContracts.value.length === 0) return null
  return (
    exportContracts.value.find((item) => item.id === selectedExportContractId.value) ??
    exportContracts.value[0]
  )
})

const selectedShipment = computed<ShipmentPlan | null>(() => {
  if (shipments.value.length === 0) return null
  return shipments.value.find((item) => item.id === selectedShipmentId.value) ?? shipments.value[0]
})

const selectedPurchaseInquiry = computed<PurchaseInquiry | null>(() => {
  if (purchaseInquiries.value.length === 0) return null
  return (
    purchaseInquiries.value.find((item) => item.id === selectedPurchaseInquiryId.value) ??
    purchaseInquiries.value[0]
  )
})

const selectedPurchaseContract = computed<PurchaseContract | null>(() => {
  if (purchaseContracts.value.length === 0) return null
  return (
    purchaseContracts.value.find((item) => item.id === selectedPurchaseContractId.value) ??
    purchaseContracts.value[0]
  )
})

const selectedPurchaseInvoiceNotice = computed<PurchaseInvoiceNotice | null>(() => {
  if (purchaseInvoiceNotices.value.length === 0) return null
  return (
    purchaseInvoiceNotices.value.find(
      (item) => item.id === selectedPurchaseInvoiceNoticeId.value,
    ) ?? purchaseInvoiceNotices.value[0]
  )
})

const selectedFollowupTemplate = computed<FollowProcessTemplate | null>(() => {
  if (followupTemplates.value.length === 0) return null
  return (
    followupTemplates.value.find((item) => item.id === selectedFollowupTemplateId.value) ??
    followupTemplates.value[0]
  )
})

const selectedFollowupPlan = computed<PurchaseFollowPlan | null>(() => {
  if (followupPlans.value.length === 0) return null
  return (
    followupPlans.value.find((item) => item.id === selectedFollowupPlanId.value) ??
    followupPlans.value[0]
  )
})

const selectedQualityInspection = computed<QualityInspection | null>(() => {
  if (qualityInspections.value.length === 0) return null
  return (
    qualityInspections.value.find((item) => item.id === selectedQualityInspectionId.value) ??
    qualityInspections.value[0]
  )
})

const selectedInboundPlan = computed<InboundPlan | null>(() => {
  if (inboundPlans.value.length === 0) return null
  return inboundPlans.value.find((item) => item.id === selectedInboundPlanId.value) ?? inboundPlans.value[0]
})

const selectedInboundOrder = computed<InboundOrder | null>(() => {
  if (inboundOrders.value.length === 0) return null
  return (
    inboundOrders.value.find((item) => item.id === selectedInboundOrderId.value) ??
    inboundOrders.value[0]
  )
})

const selectedOutboundPlan = computed<OutboundPlan | null>(() => {
  if (outboundPlans.value.length === 0) return null
  return (
    outboundPlans.value.find((item) => item.id === selectedOutboundPlanId.value) ??
    outboundPlans.value[0]
  )
})

const selectedOutboundOrder = computed<OutboundOrder | null>(() => {
  if (outboundOrders.value.length === 0) return null
  return (
    outboundOrders.value.find((item) => item.id === selectedOutboundOrderId.value) ??
    outboundOrders.value[0]
  )
})

const menuIconMap = {
  'calendar-clock': CalendarClock,
  'check-circle': CheckCircle2,
  'clipboard-check': ClipboardCheck,
  factory: Factory,
  'file-stack': Files,
  'file-pen-line': FilePenLine,
  'file-text': FileText,
  'flask-conical': FlaskConical,
  handshake: Handshake,
  images: Images,
  package: Package,
  search: Search,
  send: Send,
  users: Users,
  warehouse: Warehouse,
  wallet: WalletCards,
}

function normalizePath(path: string): string {
  return path && path !== '' ? path : '/'
}

function nextProductCode(): string {
  return `P-DEMO-${Date.now().toString().slice(-6)}`
}

function nextInboundOrderCode(): string {
  return `IO-DEMO-${Date.now().toString().slice(-6)}`
}

function nextOutboundOrderCode(): string {
  return `OO-DEMO-${Date.now().toString().slice(-6)}`
}

function nextCustomerCode(): string {
  return `C-DEMO-${Date.now().toString().slice(-6)}`
}

function nextSupplierCode(): string {
  return `S-DEMO-${Date.now().toString().slice(-6)}`
}

function nextPartnerCode(): string {
  return `P-FWD-${Date.now().toString().slice(-6)}`
}

function nextDocumentPartyCode(): string {
  return `DP-${Date.now().toString().slice(-6)}`
}

function nextSampleRequestCode(): string {
  return `SR-${Date.now().toString().slice(-6)}`
}

function nextSampleRecordCode(): string {
  return `SM-${Date.now().toString().slice(-6)}`
}

function nextSampleDeliveryCode(): string {
  return `SD-${Date.now().toString().slice(-6)}`
}

function nextExportQuotationCode(): string {
  return `QT-${Date.now().toString().slice(-6)}`
}

function nextExportContractNo(): string {
  return `EC-${Date.now().toString().slice(-6)}`
}

function nextShipmentNo(): string {
  return `SP-${Date.now().toString().slice(-6)}`
}

function nextPurchaseInquiryCode(): string {
  return `PI-${Date.now().toString().slice(-6)}`
}

function nextPurchaseContractCode(): string {
  return `PC-${Date.now().toString().slice(-6)}`
}

function nextPurchaseInvoiceNoticeCustomsNo(): string {
  return `CD-${Date.now().toString().slice(-6)}`
}

function nextQualityInspectionCode(): string {
  return `QC-${Date.now().toString().slice(-6)}`
}

function menuIcon(name: string) {
  return menuIconMap[name as keyof typeof menuIconMap] ?? FileText
}

async function loadSession(): Promise<void> {
  const session = await getCurrentSession()
  currentUser.value = session.user
  menus.value = session.menus
  keepPathPermitted()
}

async function loadActivePage(): Promise<void> {
  if (isDashboard.value) {
    await loadDashboard()
    return
  }
  if (isProductPage.value) {
    await loadProducts()
    return
  }
  if (isCustomerPage.value) {
    await loadCustomers()
    return
  }
  if (isSupplierPage.value) {
    await loadSuppliers()
    return
  }
  if (isPartnerPage.value) {
    await loadPartners()
    return
  }
  if (isDocumentPartyPage.value) {
    await loadDocumentParties()
    return
  }
  if (isSampleRequestPage.value) {
    await loadSampleRequests()
    return
  }
  if (isSampleRecordPage.value) {
    await loadSampleRecords()
    return
  }
  if (isSampleDeliveryPage.value) {
    await loadSampleDeliveries()
    return
  }
  if (isExportQuotationPage.value) {
    await loadExportQuotations()
    return
  }
  if (isExportContractPage.value) {
    await loadExportContracts()
    return
  }
  if (isShipmentPage.value) {
    await loadShipments()
    return
  }
  if (isPurchaseInquiryPage.value) {
    await loadPurchaseInquiries()
    return
  }
  if (isPurchaseContractPage.value) {
    await loadPurchaseContracts()
    return
  }
  if (isPurchaseInvoiceNoticePage.value) {
    await loadPurchaseInvoiceNotices()
    return
  }
  if (isPurchaseFollowupPage.value) {
    await loadFollowupWorkspace()
    return
  }
  if (isQualityInspectionPage.value) {
    await loadQualityInspections()
    return
  }
  if (isWarehouseInboundPlanPage.value) {
    await loadInboundPlans()
    return
  }
  if (isWarehouseInboundOrderPage.value) {
    await loadInboundOrders()
    return
  }
  if (isWarehouseOutboundPlanPage.value) {
    await loadOutboundPlans()
    return
  }
  if (isWarehouseOutboundOrderPage.value) {
    await loadOutboundOrders()
  }
}

async function loadDashboard(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  try {
    dashboard.value = await getDashboard()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadProducts(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  productMessage.value = ''
  try {
    const result = await listProducts(productSearch.value.trim() || undefined)
    products.value = result.items
    if (!products.value.some((item) => item.id === selectedProductId.value)) {
      selectedProductId.value = products.value[0]?.id ?? null
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '商品资料加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadCustomers(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  customerMessage.value = ''
  try {
    const result = await listCustomers({
      q: customerSearch.value.trim() || undefined,
      country: customerCountryFilter.value.trim() || undefined,
      credit_grade: customerCreditFilter.value.trim() || undefined,
    })
    customers.value = result.items
    if (!customers.value.some((item) => item.id === selectedCustomerId.value)) {
      selectedCustomerId.value = customers.value[0]?.id ?? null
    }
    syncCustomerEditForm(selectedCustomer.value)
    if (selectedCustomer.value) {
      await loadSelectedCustomerTransactions()
    } else {
      customerTransactions.value = { items: [], total: 0 }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '客户资料加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadSuppliers(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  supplierMessage.value = ''
  try {
    const result = await listSuppliers({
      q: supplierSearch.value.trim() || undefined,
      country: supplierCountryFilter.value.trim() || undefined,
      credit_grade: supplierCreditFilter.value.trim() || undefined,
    })
    suppliers.value = result.items
    if (!suppliers.value.some((item) => item.id === selectedSupplierId.value)) {
      selectedSupplierId.value = suppliers.value[0]?.id ?? null
    }
    syncSupplierEditForm(selectedSupplier.value)
    if (selectedSupplier.value) {
      await loadSelectedSupplierTransactions()
    } else {
      supplierTransactions.value = { items: [], total: 0 }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '供应商资料加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadPartners(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  partnerMessage.value = ''
  try {
    const result = await listPartners({
      q: partnerSearch.value.trim() || undefined,
      partner_type: partnerTypeFilter.value || undefined,
    })
    partners.value = result.items
    if (!partners.value.some((item) => item.id === selectedPartnerId.value)) {
      selectedPartnerId.value = partners.value[0]?.id ?? null
    }
    syncPartnerEditForm(selectedPartner.value)
    if (selectedPartner.value) {
      await loadSelectedPartnerFeeRecords()
    } else {
      partnerFeeRecords.value = { items: [], total: 0 }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '合作伙伴加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadDocumentParties(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  documentPartyMessage.value = ''
  try {
    const result = await listDocumentParties({
      q: documentPartySearch.value.trim() || undefined,
      party_type: documentPartyTypeFilter.value || undefined,
      customer_id: documentPartyCustomerFilter.value.trim() || undefined,
    })
    documentParties.value = result.items
    if (!documentParties.value.some((item) => item.id === selectedDocumentPartyId.value)) {
      selectedDocumentPartyId.value = documentParties.value[0]?.id ?? null
    }
    syncDocumentPartyEditForm(selectedDocumentParty.value)
    if (selectedDocumentParty.value) {
      await loadDocumentPartyLookup()
    } else {
      documentPartyLookup.value = { items: [], total: 0 }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '单证资料加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadSampleRequests(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  sampleMessage.value = ''
  try {
    const result = await listSampleRequests({
      q: sampleSearch.value.trim() || undefined,
      status: sampleStatusFilter.value || undefined,
      customer_id: sampleCustomerFilter.value.trim() || undefined,
    })
    sampleRequests.value = result.items
    if (!sampleRequests.value.some((item) => item.id === selectedSampleRequestId.value)) {
      selectedSampleRequestId.value = sampleRequests.value[0]?.id ?? null
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '打样管理加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadSampleRecords(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  sampleRecordMessage.value = ''
  try {
    const result = await listSampleRecords({
      q: sampleRecordSearch.value.trim() || undefined,
      sample_type: sampleRecordTypeFilter.value || undefined,
      customer_id: sampleRecordCustomerFilter.value.trim() || undefined,
      purchase_contract_id: sampleRecordContractFilter.value.trim() || undefined,
    })
    sampleRecords.value = result.items
    if (!sampleRecords.value.some((item) => item.id === selectedSampleRecordId.value)) {
      selectedSampleRecordId.value = sampleRecords.value[0]?.id ?? null
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '样品登记加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadSampleDeliveries(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  sampleDeliveryMessage.value = ''
  try {
    const result = await listSampleDeliveries({
      q: sampleDeliverySearch.value.trim() || undefined,
      status: sampleDeliveryStatusFilter.value || undefined,
      customer_id: sampleDeliveryCustomerFilter.value.trim() || undefined,
      express_company: sampleDeliveryExpressFilter.value.trim() || undefined,
    })
    sampleDeliveries.value = result.items
    if (!sampleDeliveries.value.some((item) => item.id === selectedSampleDeliveryId.value)) {
      selectedSampleDeliveryId.value = sampleDeliveries.value[0]?.id ?? null
    }
    syncSampleDeliveryActionForms(selectedSampleDelivery.value)
    await refreshSampleDeliveryReports()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '寄样管理加载失败'
  } finally {
    isLoading.value = false
  }
}

async function refreshSampleDeliveryReports(): Promise<void> {
  sampleDeliveryFeeStatistics.value = await getSampleDeliveryFeeStatistics({
    customer_id: sampleDeliveryCustomerFilter.value.trim() || undefined,
    date_from: '2026-01-01',
    date_to: '2026-12-31',
    express_company: sampleDeliveryExpressFilter.value.trim() || undefined,
  })
  await loadSelectedSampleDeliveryHistories()
}

async function loadExportQuotations(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  exportQuotationMessage.value = ''
  try {
    const result = await listExportQuotations({
      q: exportQuotationSearch.value.trim() || undefined,
      approval_status: exportQuotationStatusFilter.value || undefined,
      customer_id: exportQuotationCustomerFilter.value.trim() || undefined,
    })
    exportQuotations.value = result.items
    if (!exportQuotations.value.some((item) => item.id === selectedExportQuotationId.value)) {
      selectedExportQuotationId.value = exportQuotations.value[0]?.id ?? null
    }
    syncExportQuotationActionForms(selectedExportQuotation.value)
    await loadSelectedExportQuotationReferences()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '出口报价加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadExportContracts(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  exportContractMessage.value = ''
  try {
    const result = await listExportContracts({
      q: exportContractSearch.value.trim() || undefined,
      approval_status: exportContractStatusFilter.value || undefined,
      customer_id: exportContractCustomerFilter.value.trim() || undefined,
    })
    exportContracts.value = result.items
    if (!exportContracts.value.some((item) => item.id === selectedExportContractId.value)) {
      selectedExportContractId.value = exportContracts.value[0]?.id ?? null
    }
    syncExportContractActionForms(selectedExportContract.value)
    await loadSelectedExportContractQuotationHistory()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '出口合同加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadShipments(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  shipmentMessage.value = ''
  try {
    const result = await listShipments({
      q: shipmentSearch.value.trim() || undefined,
      approval_status: shipmentStatusFilter.value || undefined,
      customer_id: shipmentCustomerFilter.value.trim() || undefined,
      contract_id: shipmentContractFilter.value.trim() || undefined,
    })
    const reminders = await listShipmentReminders()
    shipments.value = result.items
    shipmentReminders.value = reminders.items
    if (!shipments.value.some((item) => item.id === selectedShipmentId.value)) {
      selectedShipmentId.value = shipments.value[0]?.id ?? null
    }
    syncShipmentActionForms(selectedShipment.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '出货明细加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadPurchaseInquiries(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  purchaseInquiryMessage.value = ''
  try {
    const [result, references, samples] = await Promise.all([
      listPurchaseInquiries({
        q: purchaseInquirySearch.value.trim() || undefined,
        status: purchaseInquiryStatusFilter.value || undefined,
        product_id: purchaseInquiryProductFilter.value.trim() || undefined,
        supplier_id: purchaseInquirySupplierFilter.value.trim() || undefined,
      }),
      listPurchaseInquiryReferences({
        product_id: purchaseInquiryProductFilter.value.trim() || undefined,
      }),
      listPurchaseInquirySupplierSamples({
        product_id: purchaseInquiryProductFilter.value.trim() || undefined,
        supplier_id: purchaseInquirySupplierFilter.value.trim() || undefined,
      }),
    ])
    purchaseInquiries.value = result.items
    purchaseInquiryReferences.value = references.items
    purchaseInquirySupplierSamples.value = samples.items
    if (!purchaseInquiries.value.some((item) => item.id === selectedPurchaseInquiryId.value)) {
      selectedPurchaseInquiryId.value = purchaseInquiries.value[0]?.id ?? null
    }
    syncPurchaseInquiryActionForms(selectedPurchaseInquiry.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '采购询价加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadPurchaseContracts(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  purchaseContractMessage.value = ''
  try {
    const [result, reminders] = await Promise.all([
      listPurchaseContracts({
        q: purchaseContractSearch.value.trim() || undefined,
        approval_status: purchaseContractStatusFilter.value || undefined,
        supplier_id: purchaseContractSupplierFilter.value.trim() || undefined,
        source_type: purchaseContractSourceFilter.value || undefined,
      }),
      listPurchaseContractReminders(),
    ])
    purchaseContracts.value = result.items
    purchaseContractReminders.value = reminders.items
    if (!purchaseContracts.value.some((item) => item.id === selectedPurchaseContractId.value)) {
      selectedPurchaseContractId.value = purchaseContracts.value[0]?.id ?? null
    }
    syncPurchaseContractActionForms(selectedPurchaseContract.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '采购合同加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadPurchaseInvoiceNotices(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  purchaseInvoiceNoticeMessage.value = ''
  try {
    const [result, reminders] = await Promise.all([
      listPurchaseInvoiceNotices({
        q: purchaseInvoiceNoticeSearch.value.trim() || undefined,
        status: purchaseInvoiceNoticeStatusFilter.value || undefined,
        supplier_id: purchaseInvoiceNoticeSupplierFilter.value.trim() || undefined,
        customs_declaration_id: purchaseInvoiceNoticeCustomsFilter.value.trim() || undefined,
      }),
      listPurchaseInvoiceNoticeReminders(),
    ])
    purchaseInvoiceNotices.value = result.items
    purchaseInvoiceNoticeReminders.value = reminders.items
    if (
      !purchaseInvoiceNotices.value.some(
        (item) => item.id === selectedPurchaseInvoiceNoticeId.value,
      )
    ) {
      selectedPurchaseInvoiceNoticeId.value = purchaseInvoiceNotices.value[0]?.id ?? null
    }
    syncPurchaseInvoiceNoticeActionForms(selectedPurchaseInvoiceNotice.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '开票通知加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadFollowupWorkspace(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  followupMessage.value = ''
  try {
    const [templates, plans, overdue] = await Promise.all([
      listFollowupTemplates(),
      listFollowupPlans({
        q: followupSearch.value.trim() || undefined,
        overall_status: followupStatusFilter.value || undefined,
        supplier_id: followupSupplierFilter.value.trim() || undefined,
        purchase_contract_id: followupContractFilter.value.trim() || undefined,
      }),
      listFollowupOverdueNodes(followupOverdueAsOf.value),
    ])
    followupTemplates.value = templates.items
    followupPlans.value = plans.items
    followupOverdueNodes.value = overdue.items
    if (!followupTemplates.value.some((item) => item.id === selectedFollowupTemplateId.value)) {
      selectedFollowupTemplateId.value = followupTemplates.value[0]?.id ?? null
    }
    if (!followupPlans.value.some((item) => item.id === selectedFollowupPlanId.value)) {
      selectedFollowupPlanId.value = followupPlans.value[0]?.id ?? null
    }
    syncFollowupForms(selectedFollowupTemplate.value, selectedFollowupPlan.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '采购跟单加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadQualityInspections(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  qualityInspectionMessage.value = ''
  try {
    const result = await listQualityInspections({
      q: qualityInspectionSearch.value.trim() || undefined,
      result: qualityInspectionResultFilter.value || undefined,
      supplier_id: qualityInspectionSupplierFilter.value.trim() || undefined,
      purchase_contract_id: qualityInspectionContractFilter.value.trim() || undefined,
    })
    qualityInspections.value = result.items
    if (
      !qualityInspections.value.some((item) => item.id === selectedQualityInspectionId.value)
    ) {
      selectedQualityInspectionId.value = qualityInspections.value[0]?.id ?? null
    }
    fillQualityInspectionForm(selectedQualityInspection.value)
    await refreshQualityInboundEligibility()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'QC 查验加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadInboundPlans(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  inboundPlanMessage.value = ''
  try {
    const result = await listInboundPlans({
      q: inboundPlanSearch.value.trim() || undefined,
      inbound_type: inboundPlanTypeFilter.value || undefined,
      status: inboundPlanStatusFilter.value || undefined,
      supplier_id: inboundPlanSupplierFilter.value.trim() || undefined,
      purchase_contract_id: inboundPlanContractFilter.value.trim() || undefined,
    })
    inboundPlans.value = result.items
    if (!inboundPlans.value.some((item) => item.id === selectedInboundPlanId.value)) {
      selectedInboundPlanId.value = inboundPlans.value[0]?.id ?? null
    }
    syncInboundPlanForms(selectedInboundPlan.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '入库计划加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadInboundOrders(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  inboundOrderMessage.value = ''
  try {
    const [result, planResult] = await Promise.all([
      listInboundOrders({
        q: inboundOrderSearch.value.trim() || undefined,
        status: inboundOrderStatusFilter.value || undefined,
        inbound_mode: inboundOrderModeFilter.value || undefined,
        supplier_id: inboundOrderSupplierFilter.value.trim() || undefined,
        purchase_contract_id: inboundOrderContractFilter.value.trim() || undefined,
      }),
      listInboundPlans({}),
    ])
    inboundOrders.value = result.items
    inboundPlans.value = planResult.items
    if (!inboundOrders.value.some((item) => item.id === selectedInboundOrderId.value)) {
      selectedInboundOrderId.value = inboundOrders.value[0]?.id ?? null
    }
    if (!inboundPlans.value.some((item) => item.id === selectedInboundPlanId.value)) {
      selectedInboundPlanId.value = inboundPlans.value[0]?.id ?? null
    }
    syncInboundOrderForms(selectedInboundOrder.value)
    await loadInventorySnapshot()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '货物入库加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadInventorySnapshot(): Promise<void> {
  const q = inventorySearch.value.trim() || inboundOrderSearch.value.trim() || undefined
  const [balances, ledgers] = await Promise.all([
    listInventoryBalances({ q }),
    listInventoryLedgers({
      q,
      source_id: selectedInboundOrder.value?.id,
    }),
  ])
  inventoryBalances.value = balances.items
  inventoryLedgers.value = ledgers.items
}

async function loadOutboundInventorySnapshot(): Promise<void> {
  const q = inventorySearch.value.trim() || outboundOrderSearch.value.trim() || undefined
  const [balances, ledgers] = await Promise.all([
    listInventoryBalances({ q }),
    listInventoryLedgers({
      q,
      source_id: selectedOutboundOrder.value?.id,
    }),
  ])
  inventoryBalances.value = balances.items
  inventoryLedgers.value = ledgers.items
}

async function loadOutboundPlans(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  outboundPlanMessage.value = ''
  try {
    const [result, shipmentResult] = await Promise.all([
      listOutboundPlans({
        q: outboundPlanSearch.value.trim() || undefined,
        status: outboundPlanStatusFilter.value || undefined,
        outbound_type: outboundPlanTypeFilter.value || undefined,
        source_type: outboundPlanSourceFilter.value || undefined,
        customer_id: outboundPlanCustomerFilter.value.trim() || undefined,
        source_id: outboundPlanSourceIdFilter.value.trim() || undefined,
      }),
      listShipments({ approval_status: 'approved' }),
    ])
    outboundPlans.value = result.items
    shipments.value = shipmentResult.items
    if (!outboundPlans.value.some((item) => item.id === selectedOutboundPlanId.value)) {
      selectedOutboundPlanId.value = outboundPlans.value[0]?.id ?? null
    }
    syncOutboundPlanForms(selectedOutboundPlan.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '出库计划加载失败'
  } finally {
    isLoading.value = false
  }
}

async function loadOutboundOrders(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  outboundOrderMessage.value = ''
  try {
    const [ordersResult, plansResult, balancesResult, ledgersResult] = await Promise.all([
      listOutboundOrders({
        q: outboundOrderSearch.value.trim() || undefined,
        status: outboundOrderStatusFilter.value || undefined,
        outbound_mode: outboundOrderModeFilter.value || undefined,
        outbound_type: outboundOrderTypeFilter.value || undefined,
        customer_id: outboundOrderCustomerFilter.value.trim() || undefined,
        source_id: outboundOrderSourceIdFilter.value.trim() || undefined,
      }),
      listOutboundPlans({ status: 'scheduled' }),
      listInventoryBalances({ q: inventorySearch.value.trim() || undefined }),
      listInventoryLedgers({
        q: inventorySearch.value.trim() || undefined,
        source_id: selectedOutboundOrder.value?.id,
      }),
    ])
    outboundOrders.value = ordersResult.items
    outboundPlans.value = plansResult.items
    inventoryBalances.value = balancesResult.items
    inventoryLedgers.value = ledgersResult.items
    if (!outboundOrders.value.some((item) => item.id === selectedOutboundOrderId.value)) {
      selectedOutboundOrderId.value = outboundOrders.value[0]?.id ?? null
    }
    if (!outboundPlans.value.some((item) => item.id === outboundOrderForm.plan_id)) {
      outboundOrderForm.plan_id = outboundPlans.value[0]?.id ?? outboundOrderForm.plan_id
    }
    syncOutboundOrderForms(selectedOutboundOrder.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '货物出库加载失败'
  } finally {
    isLoading.value = false
  }
}

async function submitLogin(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const session = await login(loginForm.username, loginForm.password)
    setAuthToken(session.access_token)
    currentUser.value = session.user
    menus.value = session.menus
    isAuthenticated.value = true
    keepPathPermitted()
    await loadActivePage()
  } catch (error) {
    clearAuthToken()
    isAuthenticated.value = false
    errorMessage.value = error instanceof Error ? error.message : '登录失败'
  } finally {
    isLoading.value = false
  }
}

function keepPathPermitted(): void {
  if (menus.value.length === 0) return
  if (!menus.value.some((item) => item.path === activePath.value)) {
    activePath.value = menus.value[0].path
    window.history.replaceState(null, '', activePath.value)
  }
}

function navigateTo(path: string): void {
  activePath.value = normalizePath(path)
  window.history.pushState(null, '', activePath.value)
  errorMessage.value = ''
  productMessage.value = ''
  customerMessage.value = ''
  supplierMessage.value = ''
  partnerMessage.value = ''
  documentPartyMessage.value = ''
  sampleMessage.value = ''
  sampleRecordMessage.value = ''
  sampleDeliveryMessage.value = ''
  exportQuotationMessage.value = ''
  exportQuotationExportPreview.value = ''
  exportContractMessage.value = ''
  exportContractQuotationHistory.value = []
  exportContractExportPreview.value = ''
  shipmentMessage.value = ''
  purchaseInquiryMessage.value = ''
  purchaseInquiryTemplatePreview.value = ''
  purchaseContractMessage.value = ''
  purchaseInvoiceNoticeMessage.value = ''
  followupMessage.value = ''
  inboundPlanMessage.value = ''
  inboundOrderMessage.value = ''
  outboundPlanMessage.value = ''
  void loadActivePage()
}

function logout(): void {
  clearAuthToken()
  isAuthenticated.value = false
  currentUser.value = null
  dashboard.value = null
  products.value = []
  selectedProductId.value = null
  customers.value = []
  selectedCustomerId.value = null
  suppliers.value = []
  selectedSupplierId.value = null
  partners.value = []
  selectedPartnerId.value = null
  documentParties.value = []
  selectedDocumentPartyId.value = null
  sampleRequests.value = []
  selectedSampleRequestId.value = null
  sampleRecords.value = []
  selectedSampleRecordId.value = null
  sampleDeliveries.value = []
  selectedSampleDeliveryId.value = null
  sampleDeliveryFeeStatistics.value = { items: [], total_amount: '0.00', currency: 'USD' }
  sampleDeliverySampleHistory.value = []
  sampleDeliveryQuoteHistory.value = []
  exportQuotations.value = []
  selectedExportQuotationId.value = null
  exportQuotationHistory.value = []
  exportQuotationPurchaseReferences.value = []
  exportQuotationSampleDeliveries.value = []
  exportQuotationExportPreview.value = ''
  exportQuotationContract.value = null
  exportContracts.value = []
  selectedExportContractId.value = null
  exportContractQuotationHistory.value = []
  exportContractExportPreview.value = ''
  shipments.value = []
  selectedShipmentId.value = null
  shipmentReminders.value = []
  purchaseInquiries.value = []
  selectedPurchaseInquiryId.value = null
  purchaseInquiryTemplatePreview.value = ''
  purchaseInquirySupplierSamples.value = []
  purchaseInquiryReferences.value = []
  purchaseContracts.value = []
  selectedPurchaseContractId.value = null
  purchaseContractReminders.value = []
  purchaseInvoiceNotices.value = []
  selectedPurchaseInvoiceNoticeId.value = null
  purchaseInvoiceNoticeReminders.value = []
  followupTemplates.value = []
  selectedFollowupTemplateId.value = null
  followupPlans.value = []
  selectedFollowupPlanId.value = null
  followupOverdueNodes.value = []
  qualityInspections.value = []
  selectedQualityInspectionId.value = null
  editingQualityInspectionId.value = null
  qualityInboundEligibility.value = null
  inboundPlans.value = []
  selectedInboundPlanId.value = null
  inboundOrders.value = []
  selectedInboundOrderId.value = null
  inventoryBalances.value = []
  inventoryLedgers.value = []
  outboundPlans.value = []
  selectedOutboundPlanId.value = null
  outboundOrders.value = []
  selectedOutboundOrderId.value = null
  menus.value = []
}

function toApiDateTime(value: string): string {
  return `${value}:00+08:00`
}

async function submitSchedule(): Promise<void> {
  const payload: ScheduleCreatePayload = {
    title: form.title,
    description: form.description,
    starts_at: toApiDateTime(form.starts_at),
    ends_at: toApiDateTime(form.ends_at),
  }
  await createScheduleEvent(payload)
  await loadDashboard()
}

async function submitProduct(): Promise<void> {
  const payload: ProductCreatePayload = {
    code: productForm.code.trim(),
    cn_name: productForm.cn_name.trim(),
    en_name: productForm.en_name.trim(),
    specification: emptyToNull(productForm.specification),
    model: emptyToNull(productForm.model),
    customs_code: productForm.customs_code.trim(),
    tax_rate: productForm.tax_rate,
    rebate_rate: productForm.rebate_rate,
    package_info: productForm.package_info.trim(),
    unit: productForm.unit.trim(),
    image_url: emptyToNull(productForm.image_url),
    accessories: [initialAccessoryPayload()],
  }
  const product = await createProduct(payload)
  productSearch.value = ''
  selectedProductId.value = product.id
  productMessage.value = `已新增商品 ${product.code}`
  productExportPreview.value = ''
  resetProductForm()
  await loadProducts()
}

async function submitAccessory(): Promise<void> {
  if (!selectedProduct.value) return
  const accessory = await addProductAccessory(selectedProduct.value.id, accessoryPayload())
  const product = products.value.find((item) => item.id === selectedProduct.value?.id)
  if (product) {
    product.accessories = [...product.accessories, accessory]
  }
  productMessage.value = `已追加配件 ${accessory.accessory_name}`
}

async function submitExport(): Promise<void> {
  const result = await exportProducts()
  productExportPreview.value = result.content.split('\n').slice(0, 6).join('\n')
  productMessage.value = `CSV 已生成：${result.filename}`
}

async function submitCustomer(): Promise<void> {
  const customer = await createCustomer(customerPayload())
  customerSearch.value = ''
  selectedCustomerId.value = customer.id
  customerMessage.value = `已新增客户 ${customer.code}`
  resetCustomerForm()
  await loadCustomers()
}

async function submitCustomerUpdate(): Promise<void> {
  if (!selectedCustomer.value) return
  const customer = await updateCustomer(selectedCustomer.value.id, customerUpdatePayload())
  const index = customers.value.findIndex((item) => item.id === customer.id)
  if (index >= 0) {
    customers.value[index] = customer
  }
  selectedCustomerId.value = customer.id
  customerMessage.value = `已更新客户 ${customer.code}`
  syncCustomerEditForm(customer)
  await loadSelectedCustomerTransactions()
}

async function submitCustomerContact(): Promise<void> {
  if (!selectedCustomer.value) return
  const contact = await addCustomerContact(selectedCustomer.value.id, customerContactPayload())
  customerMessage.value = `已追加联系人 ${contact.name}`
  await loadCustomers()
}

async function submitSupplier(): Promise<void> {
  const supplier = await createSupplier(supplierPayload())
  supplierSearch.value = ''
  selectedSupplierId.value = supplier.id
  supplierMessage.value = `已新增供应商 ${supplier.code}`
  resetSupplierForm()
  await loadSuppliers()
}

async function submitSupplierUpdate(): Promise<void> {
  if (!selectedSupplier.value) return
  const supplier = await updateSupplier(selectedSupplier.value.id, supplierUpdatePayload())
  const index = suppliers.value.findIndex((item) => item.id === supplier.id)
  if (index >= 0) {
    suppliers.value[index] = supplier
  }
  selectedSupplierId.value = supplier.id
  supplierMessage.value = `已更新供应商 ${supplier.code}`
  syncSupplierEditForm(supplier)
  await loadSelectedSupplierTransactions()
}

async function submitSupplierContact(): Promise<void> {
  if (!selectedSupplier.value) return
  const contact = await addSupplierContact(selectedSupplier.value.id, supplierContactPayload())
  supplierMessage.value = `已追加联系人 ${contact.name}`
  await loadSuppliers()
}

async function submitPartner(): Promise<void> {
  const partner = await createPartner(partnerPayload())
  partnerSearch.value = ''
  partnerTypeFilter.value = ''
  selectedPartnerId.value = partner.id
  partnerMessage.value = `已新增合作伙伴 ${partner.code}`
  resetPartnerForm()
  await loadPartners()
}

async function submitPartnerUpdate(): Promise<void> {
  if (!selectedPartner.value) return
  const partner = await updatePartner(selectedPartner.value.id, partnerUpdatePayload())
  const index = partners.value.findIndex((item) => item.id === partner.id)
  if (index >= 0) {
    partners.value[index] = partner
  }
  selectedPartnerId.value = partner.id
  partnerMessage.value = `已更新合作伙伴 ${partner.code}`
  syncPartnerEditForm(partner)
  await loadSelectedPartnerFeeRecords()
}

async function submitPartnerContact(): Promise<void> {
  if (!selectedPartner.value) return
  const contact = await addPartnerContact(selectedPartner.value.id, partnerContactPayload())
  partnerMessage.value = `已追加联系人 ${contact.name}`
  await loadPartners()
}

async function submitDocumentParty(): Promise<void> {
  const party = await createDocumentParty(documentPartyPayload())
  documentPartySearch.value = ''
  documentPartyTypeFilter.value = ''
  documentPartyCustomerFilter.value = ''
  selectedDocumentPartyId.value = party.id
  documentPartyMessage.value = `已新增单证资料 ${party.code}`
  resetDocumentPartyForm()
  await loadDocumentParties()
}

async function submitDocumentPartyUpdate(): Promise<void> {
  if (!selectedDocumentParty.value) return
  const party = await updateDocumentParty(
    selectedDocumentParty.value.id,
    documentPartyUpdatePayload(),
  )
  const index = documentParties.value.findIndex((item) => item.id === party.id)
  if (index >= 0) {
    documentParties.value[index] = party
  }
  selectedDocumentPartyId.value = party.id
  documentPartyMessage.value = `已更新单证资料 ${party.code}`
  syncDocumentPartyEditForm(party)
  await loadDocumentPartyLookup()
}

async function submitSampleRequest(): Promise<void> {
  const sampleRequest = await createSampleRequest(sampleRequestPayload())
  sampleSearch.value = ''
  sampleStatusFilter.value = ''
  sampleCustomerFilter.value = ''
  selectedSampleRequestId.value = sampleRequest.id
  sampleMessage.value = `已新增打样单 ${sampleRequest.code}`
  resetSampleRequestForm()
  await loadSampleRequests()
}

async function submitSampleProgress(): Promise<void> {
  if (!selectedSampleRequest.value) return
  const progress = await addSampleProgress(
    selectedSampleRequest.value.id,
    sampleProgressPayload(),
  )
  sampleMessage.value = `已更新打样进度 ${sampleStageLabel(progress.stage)}`
  await loadSampleRequests()
}

async function submitSampleFee(): Promise<void> {
  if (!selectedSampleRequest.value) return
  const fee = await addSampleFee(selectedSampleRequest.value.id, sampleFeePayload())
  sampleMessage.value = `已登记打样费用 ${fee.currency} ${fee.amount}`
  await loadSampleRequests()
}

async function submitSampleFeePayment(feeId: string): Promise<void> {
  if (!selectedSampleRequest.value) return
  const fee = await requestSampleFeePayment(selectedSampleRequest.value.id, feeId)
  sampleMessage.value = `已发起付款申请 ${fee.payment_request_no ?? ''}`.trim()
  await loadSampleRequests()
}

async function submitSampleRecord(): Promise<void> {
  const record = await createSampleRecord(sampleRecordPayload())
  sampleRecordSearch.value = ''
  sampleRecordTypeFilter.value = ''
  sampleRecordCustomerFilter.value = ''
  sampleRecordContractFilter.value = ''
  selectedSampleRecordId.value = record.id
  sampleRecordMessage.value = `已新增样品 ${record.code}`
  resetSampleRecordForm()
  await loadSampleRecords()
}

async function submitSampleRecordImage(): Promise<void> {
  if (!selectedSampleRecord.value) return
  const image = await addSampleRecordImage(
    selectedSampleRecord.value.id,
    sampleRecordImagePayload(),
  )
  sampleRecordMessage.value = `已追加样品图片 ${image.filename}`
  await loadSampleRecords()
}

async function submitSampleRecordStockEvent(): Promise<void> {
  if (!selectedSampleRecord.value) return
  const event = await addSampleRecordStockEvent(
    selectedSampleRecord.value.id,
    sampleRecordStockEventPayload(),
  )
  sampleRecordMessage.value = `已登记样品数量 ${sampleStockEventLabel(event.event_type)}`
  await loadSampleRecords()
}

async function submitSampleDeliveryForm(): Promise<void> {
  const delivery = await createSampleDelivery(sampleDeliveryPayload())
  sampleDeliverySearch.value = ''
  sampleDeliveryStatusFilter.value = ''
  sampleDeliveryCustomerFilter.value = ''
  sampleDeliveryExpressFilter.value = ''
  selectedSampleDeliveryId.value = delivery.id
  sampleDeliveryMessage.value = `已新增寄样单 ${delivery.code}`
  resetSampleDeliveryForm()
  await loadSampleDeliveries()
}

async function updateSelectedSampleDeliveryDraft(): Promise<void> {
  if (!selectedSampleDelivery.value) return
  const delivery = await updateSampleDelivery(
    selectedSampleDelivery.value.id,
    sampleDeliveryPayload(),
  )
  selectedSampleDeliveryId.value = delivery.id
  sampleDeliveryMessage.value = `已保存寄样单 ${delivery.code}`
  await loadSampleDeliveries()
}

async function submitSampleDeliveryForReview(): Promise<void> {
  if (!selectedSampleDelivery.value) return
  const delivery = await submitSampleDelivery(selectedSampleDelivery.value.id)
  selectedSampleDeliveryId.value = delivery.id
  sampleDeliveryMessage.value = `已提交寄样单 ${delivery.code}`
  await loadSampleDeliveries()
}

async function approveSelectedSampleDelivery(): Promise<void> {
  if (!selectedSampleDelivery.value) return
  const delivery = await approveSampleDelivery(
    selectedSampleDelivery.value.id,
    sampleDeliveryApprovePayload(),
  )
  selectedSampleDeliveryId.value = delivery.id
  sampleDeliveryMessage.value = `已审核寄样单 ${delivery.code}`
  await loadSampleDeliveries()
}

async function submitSampleDeliveryTrackingUpdate(): Promise<void> {
  if (!selectedSampleDelivery.value) return
  const delivery = await updateSampleDeliveryTracking(
    selectedSampleDelivery.value.id,
    sampleDeliveryTrackingPayload(),
  )
  selectedSampleDeliveryId.value = delivery.id
  sampleDeliveryMessage.value = `已更新物流 ${delivery.tracking_no ?? ''}`.trim()
  await loadSampleDeliveries()
}

async function submitExportQuotationForm(): Promise<void> {
  const quotation = await createExportQuotation(exportQuotationPayload())
  exportQuotationSearch.value = ''
  exportQuotationStatusFilter.value = ''
  exportQuotationCustomerFilter.value = ''
  selectedExportQuotationId.value = quotation.id
  exportQuotationMessage.value = `已新增出口报价 ${quotation.code}`
  resetExportQuotationForm()
  await loadExportQuotations()
}

async function updateSelectedExportQuotationDraft(): Promise<void> {
  if (!selectedExportQuotation.value) return
  const quotation = await updateExportQuotation(
    selectedExportQuotation.value.id,
    exportQuotationPayload(),
  )
  selectedExportQuotationId.value = quotation.id
  exportQuotationMessage.value = `已保存出口报价 ${quotation.code}`
  await loadExportQuotations()
}

async function submitSelectedExportQuotation(): Promise<void> {
  if (!selectedExportQuotation.value) return
  const quotation = await submitExportQuotation(selectedExportQuotation.value.id)
  selectedExportQuotationId.value = quotation.id
  exportQuotationMessage.value = `已提交出口报价 ${quotation.code}`
  await loadExportQuotations()
}

async function approveSelectedExportQuotation(): Promise<void> {
  if (!selectedExportQuotation.value) return
  const quotation = await approveExportQuotation(
    selectedExportQuotation.value.id,
    exportQuotationApprovePayload(),
  )
  selectedExportQuotationId.value = quotation.id
  exportQuotationMessage.value = `已审批出口报价 ${quotation.code}`
  await loadExportQuotations()
}

async function confirmSelectedExportQuotationContract(): Promise<void> {
  if (!selectedExportQuotation.value) return
  exportQuotationContract.value = await confirmExportQuotationContract(
    selectedExportQuotation.value.id,
    exportQuotationContractPayload(),
  )
  exportQuotationMessage.value = `已生成出口合同 ${exportQuotationContract.value.contract_no}`
  await loadExportQuotations()
}

async function exportSelectedExportQuotation(format: 'pdf' | 'excel'): Promise<void> {
  if (!selectedExportQuotation.value) return
  const result = await exportExportQuotation(selectedExportQuotation.value.id, format)
  exportQuotationExportPreview.value = result.content.split('\n').slice(0, 10).join('\n')
  exportQuotationMessage.value = `已生成导出预览 ${result.filename}`
}

async function submitExportContractForm(): Promise<void> {
  const contract = await createExportContract(exportContractPayload())
  exportContractSearch.value = ''
  exportContractStatusFilter.value = ''
  exportContractCustomerFilter.value = ''
  selectedExportContractId.value = contract.id
  exportContractMessage.value = `已新增出口合同 ${contract.code}`
  resetExportContractForm()
  await loadExportContracts()
}

async function updateSelectedExportContractDraft(): Promise<void> {
  if (!selectedExportContract.value) return
  const contract = await updateExportContract(
    selectedExportContract.value.id,
    exportContractPayload(),
  )
  selectedExportContractId.value = contract.id
  exportContractMessage.value = `已保存出口合同 ${contract.code}`
  await loadExportContracts()
}

async function submitSelectedExportContract(): Promise<void> {
  if (!selectedExportContract.value) return
  const contract = await submitExportContract(selectedExportContract.value.id)
  selectedExportContractId.value = contract.id
  exportContractMessage.value = `已提交出口合同 ${contract.code}`
  await loadExportContracts()
}

async function approveSelectedExportContract(): Promise<void> {
  if (!selectedExportContract.value) return
  const contract = await approveExportContract(
    selectedExportContract.value.id,
    exportContractApprovePayload(),
  )
  selectedExportContractId.value = contract.id
  exportContractMessage.value = `已审批出口合同 ${contract.code}`
  await loadExportContracts()
}

async function registerSelectedExportContractSignature(): Promise<void> {
  if (!selectedExportContract.value) return
  const contract = await registerExportContractSignature(
    selectedExportContract.value.id,
    exportContractSignaturePayload(),
  )
  selectedExportContractId.value = contract.id
  exportContractMessage.value = `已登记客户回签 ${contract.code}`
  await loadExportContracts()
}

async function addSelectedExportContractAdvancePayment(): Promise<void> {
  if (!selectedExportContract.value) return
  const payment = await addExportContractAdvancePayment(
    selectedExportContract.value.id,
    exportContractAdvancePaymentPayload(),
  )
  exportContractMessage.value = `已关联预收款 ${payment.payment_no}`
  await loadExportContracts()
}

async function exportSelectedExportContract(format: 'pdf' | 'excel'): Promise<void> {
  if (!selectedExportContract.value) return
  const result = await exportExportContract(selectedExportContract.value.id, format)
  exportContractExportPreview.value = result.content.split('\n').slice(0, 12).join('\n')
  exportContractMessage.value = `已生成合同导出预览 ${result.filename}`
}

async function submitShipmentForm(): Promise<void> {
  const shipment = await generateShipmentFromContracts(shipmentPayload())
  shipmentSearch.value = ''
  shipmentStatusFilter.value = ''
  shipmentCustomerFilter.value = ''
  shipmentContractFilter.value = ''
  selectedShipmentId.value = shipment.id
  resetShipmentForm()
  await loadShipments()
  shipmentMessage.value = `已生成出货明细 ${shipment.code}`
}

async function submitSelectedShipment(): Promise<void> {
  if (!selectedShipment.value) return
  const shipment = await submitShipment(selectedShipment.value.id)
  selectedShipmentId.value = shipment.id
  await loadShipments()
  shipmentMessage.value = `已提交出货审批 ${shipment.code}`
}

async function approveSelectedShipment(): Promise<void> {
  if (!selectedShipment.value) return
  const shipment = await approveShipment(selectedShipment.value.id, shipmentApprovePayload())
  selectedShipmentId.value = shipment.id
  await loadShipments()
  shipmentMessage.value = `已审批通过并回写合同出货 ${shipment.code}`
}

async function submitPurchaseInquiryForm(): Promise<void> {
  if (editingPurchaseInquiryId.value) {
    const inquiry = await updatePurchaseInquiry(
      editingPurchaseInquiryId.value,
      purchaseInquiryPayload(),
    )
    purchaseInquirySearch.value = ''
    purchaseInquiryStatusFilter.value = ''
    purchaseInquiryProductFilter.value = purchaseInquiryForm.product_id.trim()
    selectedPurchaseInquiryId.value = inquiry.id
    editingPurchaseInquiryId.value = null
    resetPurchaseInquiryForm()
    await loadPurchaseInquiries()
    purchaseInquiryMessage.value = `已保存采购询价 ${inquiry.code}`
    return
  }

  const inquiry = await createPurchaseInquiry(purchaseInquiryPayload())
  purchaseInquirySearch.value = ''
  purchaseInquiryStatusFilter.value = ''
  purchaseInquiryProductFilter.value = purchaseInquiryForm.product_id.trim()
  selectedPurchaseInquiryId.value = inquiry.id
  resetPurchaseInquiryForm()
  await loadPurchaseInquiries()
  purchaseInquiryMessage.value = `已新增采购询价 ${inquiry.code}`
}

async function sendSelectedPurchaseInquiryTemplate(): Promise<void> {
  if (!selectedPurchaseInquiry.value) return
  const template = await sendPurchaseInquiryTemplate(
    selectedPurchaseInquiry.value.id,
    purchaseInquiryTemplatePayload(),
  )
  purchaseInquiryTemplatePreview.value = template.content
  await loadPurchaseInquiries()
  purchaseInquiryMessage.value = `已生成询价模板 ${template.filename}`
}

async function addSelectedPurchaseQuotation(): Promise<void> {
  const inquiry = selectedPurchaseInquiry.value
  const line = inquiry?.lines[0]
  if (!inquiry || !line) return
  const updated = await addPurchaseInquiryQuotation(
    inquiry.id,
    purchaseQuotationPayload(line.id),
  )
  selectedPurchaseInquiryId.value = updated.id
  purchaseInquirySupplierFilter.value = purchaseQuotationForm.supplier_id.trim()
  await loadPurchaseInquiries()
  purchaseInquiryMessage.value = `已登记供应商报价 ${purchaseQuotationForm.supplier_name}`
}

async function submitPurchaseContractForm(): Promise<void> {
  if (editingPurchaseContractId.value) {
    const contract = await updatePurchaseContract(
      editingPurchaseContractId.value,
      purchaseContractPayload(),
    )
    purchaseContractSearch.value = ''
    purchaseContractStatusFilter.value = ''
    purchaseContractSupplierFilter.value = purchaseContractForm.supplier_id.trim()
    purchaseContractSourceFilter.value = purchaseContractForm.source_type
    selectedPurchaseContractId.value = contract.id
    editingPurchaseContractId.value = null
    resetPurchaseContractForm()
    await loadPurchaseContracts()
    purchaseContractMessage.value = `已保存采购合同 ${contract.code}`
    return
  }

  const contract = await createPurchaseContract(purchaseContractPayload())
  purchaseContractSearch.value = ''
  purchaseContractStatusFilter.value = ''
  purchaseContractSupplierFilter.value = purchaseContractForm.supplier_id.trim()
  purchaseContractSourceFilter.value = purchaseContractForm.source_type
  selectedPurchaseContractId.value = contract.id
  resetPurchaseContractForm()
  await loadPurchaseContracts()
  purchaseContractMessage.value = `已新增采购合同 ${contract.code}`
}

async function generatePurchaseContractFromSources(): Promise<void> {
  const contract = await generatePurchaseContractFromExportContracts(purchaseContractGeneratePayload())
  purchaseContractSearch.value = ''
  purchaseContractStatusFilter.value = ''
  purchaseContractSourceFilter.value = 'export_contract'
  purchaseContractSupplierFilter.value = purchaseContractGenerateForm.supplier_id.trim()
  selectedPurchaseContractId.value = contract.id
  resetPurchaseContractGenerateForm()
  await loadPurchaseContracts()
  purchaseContractMessage.value = `已从出口合同生成采购合同 ${contract.code}`
}

async function submitSelectedPurchaseContract(): Promise<void> {
  if (!selectedPurchaseContract.value) return
  const contract = await submitPurchaseContract(selectedPurchaseContract.value.id)
  selectedPurchaseContractId.value = contract.id
  await loadPurchaseContracts()
  purchaseContractMessage.value = `已提交采购合同 ${contract.code}`
}

async function approveSelectedPurchaseContract(): Promise<void> {
  if (!selectedPurchaseContract.value) return
  const contract = await approvePurchaseContract(
    selectedPurchaseContract.value.id,
    purchaseContractApprovePayload(),
  )
  selectedPurchaseContractId.value = contract.id
  await loadPurchaseContracts()
  purchaseContractMessage.value = `已审批采购合同 ${contract.code}，并生成跟单和入库计划`
}

async function generatePurchaseInvoiceNoticesFromCustoms(): Promise<void> {
  const result = await generatePurchaseInvoiceNoticesFromDeclaration(
    purchaseInvoiceNoticeGeneratePayload(),
  )
  purchaseInvoiceNoticeSearch.value = ''
  purchaseInvoiceNoticeStatusFilter.value = ''
  purchaseInvoiceNoticeSupplierFilter.value = ''
  purchaseInvoiceNoticeCustomsFilter.value = purchaseInvoiceNoticeForm.customs_declaration_id.trim()
  selectedPurchaseInvoiceNoticeId.value = result.items[0]?.id ?? null
  resetPurchaseInvoiceNoticeForm()
  await loadPurchaseInvoiceNotices()
  purchaseInvoiceNoticeMessage.value = `已生成 ${result.total} 条供应商开票通知`
}

async function sendSelectedPurchaseInvoiceNotice(): Promise<void> {
  if (!selectedPurchaseInvoiceNotice.value) return
  const notice = await sendPurchaseInvoiceNotice(
    selectedPurchaseInvoiceNotice.value.id,
    purchaseInvoiceNoticeSendPayload(),
  )
  selectedPurchaseInvoiceNoticeId.value = notice.id
  await loadPurchaseInvoiceNotices()
  purchaseInvoiceNoticeMessage.value = `已发送开票通知 ${notice.code}，系统已生成税票催收提醒`
}

async function receiveSelectedPurchaseInvoiceNoticeTaxInvoice(): Promise<void> {
  if (!selectedPurchaseInvoiceNotice.value) return
  const notice = await receivePurchaseInvoiceNoticeTaxInvoice(
    selectedPurchaseInvoiceNotice.value.id,
    purchaseInvoiceNoticeReceivePayload(),
  )
  selectedPurchaseInvoiceNoticeId.value = notice.id
  await loadPurchaseInvoiceNotices()
  purchaseInvoiceNoticeMessage.value = `已登记税票 ${notice.tax_invoice_no ?? ''}`
}

async function saveFollowupTemplate(): Promise<void> {
  const payload = followupTemplatePayload()
  const current = selectedFollowupTemplate.value
  const template = current
    ? await updateFollowupTemplate(current.id, payload)
    : await createFollowupTemplate(payload)
  selectedFollowupTemplateId.value = template.id
  await loadFollowupWorkspace()
  followupMessage.value = `已保存跟单模板 ${template.name}`
}

async function generateFollowupPlan(): Promise<void> {
  const plan = await generateFollowupPlanFromPurchaseContract(followupPlanGeneratePayload())
  followupContractFilter.value = plan.purchase_contract_id
  selectedFollowupPlanId.value = plan.id
  await loadFollowupWorkspace()
  followupMessage.value = `已生成跟单计划 ${plan.purchase_contract_no}`
}

async function syncSelectedFollowupSampleEvents(): Promise<void> {
  const plan = selectedFollowupPlan.value
  if (!plan) return
  const synced = await syncFollowupSampleEvents({
    purchase_contract_id: plan.purchase_contract_id,
    as_of: plan.base_date,
  })
  selectedFollowupPlanId.value = synced.id
  await loadFollowupWorkspace()
  followupMessage.value = `已同步样品跟单事件 ${synced.purchase_contract_no}`
}

async function syncFollowupSourceEventFromForm(): Promise<void> {
  const nodeLabel = followupNodeLabel(followupSourceEventForm.node_code)
  const plan = await syncFollowupSourceEvent(followupSourceEventPayload())
  selectedFollowupPlanId.value = plan.id
  await loadFollowupWorkspace()
  followupMessage.value = `已回写节点 ${nodeLabel}`
}

async function scanFollowupOverdueNodes(): Promise<void> {
  const overdue = await listFollowupOverdueNodes(followupOverdueAsOf.value)
  followupOverdueNodes.value = overdue.items
  await loadFollowupWorkspace()
  followupMessage.value = `已扫描 ${overdue.total} 个逾期节点`
}

async function saveQualityInspection(): Promise<void> {
  const payload = qualityInspectionPayload()
  const inspection = editingQualityInspectionId.value
    ? await updateQualityInspection(editingQualityInspectionId.value, payload)
    : await createQualityInspection(payload)
  selectedQualityInspectionId.value = inspection.id
  editingQualityInspectionId.value = inspection.id
  qualityInspectionContractFilter.value = inspection.purchase_contract_id
  await loadQualityInspections()
  qualityInspectionMessage.value =
    inspection.result === 'passed'
      ? `已登记 ${inspection.code}，QC 节点已回写采购跟单`
      : `已登记 ${inspection.code}，正式入库需等待 QC 通过`
}

async function refreshQualityInboundEligibility(showMessage = false): Promise<void> {
  const purchaseContractId =
    qualityInspectionForm.purchase_contract_id.trim() ||
    selectedQualityInspection.value?.purchase_contract_id ||
    ''
  if (!purchaseContractId) {
    qualityInboundEligibility.value = null
    return
  }
  qualityInboundEligibility.value = await getQualityInboundEligibility(purchaseContractId)
  if (showMessage) {
    qualityInspectionMessage.value = `正式入库判定：${qualityInboundEligibility.value.reason}`
  }
}

async function generateInboundPlan(): Promise<void> {
  const plan = await generateInboundPlanFromPurchaseContract(inboundPlanGeneratePayload())
  inboundPlanContractFilter.value = plan.purchase_contract_id
  inboundPlanSearch.value = plan.purchase_contract_no
  selectedInboundPlanId.value = plan.id
  await loadInboundPlans()
  inboundPlanMessage.value = `已生成入库计划 ${plan.code}`
}

async function scheduleSelectedInboundPlan(): Promise<void> {
  if (!selectedInboundPlan.value) return
  const plan = await scheduleInboundPlan(
    selectedInboundPlan.value.id,
    inboundPlanSchedulePayload(),
  )
  selectedInboundPlanId.value = plan.id
  inboundPlanStatusFilter.value = 'scheduled'
  await loadInboundPlans()
  inboundPlanMessage.value = `已安排 ${plan.warehouse_name ?? ''} / ${plan.location_name ?? ''}`
}

async function generateInboundOrder(): Promise<void> {
  const order = await generateInboundOrderFromPlan(inboundOrderPayload())
  selectedInboundOrderId.value = order.id
  inboundOrderSearch.value = order.code
  inboundOrderStatusFilter.value = ''
  inboundOrderContractFilter.value = order.purchase_contract_id
  inventorySearch.value = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
  await loadInboundOrders()
  inboundOrderMessage.value = `已生成入库单 ${order.code}`
}

async function submitSelectedInboundOrder(): Promise<void> {
  if (!selectedInboundOrder.value) return
  const order = await submitInboundOrder(selectedInboundOrder.value.id)
  selectedInboundOrderId.value = order.id
  await loadInboundOrders()
  inboundOrderMessage.value = `${order.code} 已提交审批`
}

async function approveSelectedInboundOrder(): Promise<void> {
  if (!selectedInboundOrder.value) return
  const order = await approveInboundOrder(
    selectedInboundOrder.value.id,
    inboundOrderApprovePayload(),
  )
  selectedInboundOrderId.value = order.id
  inboundOrderStatusFilter.value = 'approved'
  inventorySearch.value = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
  await loadInboundOrders()
  inboundOrderMessage.value =
    order.inbound_mode === 'formal'
      ? `${order.code} 已正式入库，库存和采购跟单已回写`
      : `${order.code} 已登记待检库存`
}

async function generateOutboundPlan(): Promise<void> {
  const plan = await generateOutboundPlanFromShipment(outboundPlanGeneratePayload())
  selectedOutboundPlanId.value = plan.id
  outboundPlanSearch.value = plan.source_code
  outboundPlanSourceIdFilter.value = plan.source_id
  outboundPlanStatusFilter.value = ''
  await loadOutboundPlans()
  outboundPlanMessage.value = `已生成出库计划 ${plan.code}`
}

async function scheduleSelectedOutboundPlan(): Promise<void> {
  if (!selectedOutboundPlan.value) return
  const plan = await scheduleOutboundPlan(
    selectedOutboundPlan.value.id,
    outboundPlanSchedulePayload(),
  )
  selectedOutboundPlanId.value = plan.id
  outboundPlanStatusFilter.value = 'scheduled'
  await loadOutboundPlans()
  outboundPlanMessage.value = `已安排 ${plan.warehouse_name ?? ''} / ${plan.location_name ?? ''}`
}

async function generateOutboundOrder(): Promise<void> {
  const order = await generateOutboundOrderFromPlan(outboundOrderPayload())
  selectedOutboundOrderId.value = order.id
  outboundOrderSearch.value = order.code
  outboundOrderStatusFilter.value = ''
  outboundOrderSourceIdFilter.value = order.source_id
  inventorySearch.value = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
  await loadOutboundOrders()
  outboundOrderMessage.value = `已生成出库单 ${order.code}`
}

async function submitSelectedOutboundOrder(): Promise<void> {
  if (!selectedOutboundOrder.value) return
  const order = await submitOutboundOrder(selectedOutboundOrder.value.id)
  selectedOutboundOrderId.value = order.id
  await loadOutboundOrders()
  outboundOrderMessage.value = `${order.code} 已提交审批`
}

async function approveSelectedOutboundOrder(): Promise<void> {
  if (!selectedOutboundOrder.value) return
  const order = await approveOutboundOrder(
    selectedOutboundOrder.value.id,
    outboundOrderApprovePayload(),
  )
  selectedOutboundOrderId.value = order.id
  outboundOrderStatusFilter.value = 'approved'
  inventorySearch.value = order.lines[0]?.product_code ?? order.lines[0]?.product_name ?? ''
  await loadOutboundOrders()
  outboundOrderMessage.value =
    order.outbound_mode === 'formal'
      ? `${order.code} 已正式出库，库存和采购跟单已回写`
      : `${order.code} 已登记异常出库`
}

function initialAccessoryPayload(): ProductAccessoryPayload {
  return {
    accessory_name: productForm.accessory_name.trim(),
    unit_consumption: productForm.accessory_unit_consumption,
    unit: productForm.accessory_unit.trim(),
    default_supplier_name: emptyToNull(productForm.accessory_supplier),
    purchase_split_rule: productForm.accessory_rule,
  }
}

function accessoryPayload(): ProductAccessoryPayload {
  return {
    accessory_name: accessoryForm.accessory_name.trim(),
    unit_consumption: accessoryForm.unit_consumption,
    unit: accessoryForm.unit.trim(),
    default_supplier_name: emptyToNull(accessoryForm.default_supplier_name),
    purchase_split_rule: accessoryForm.purchase_split_rule,
  }
}

function customerPayload(): CustomerCreatePayload {
  return {
    code: customerForm.code.trim(),
    cn_name: customerForm.cn_name.trim(),
    en_name: customerForm.en_name.trim(),
    country: customerForm.country.trim(),
    address: emptyToNull(customerForm.address),
    website: emptyToNull(customerForm.website),
    status: customerForm.status,
    contacts: [customerPrimaryContactPayload()],
    credit_profile: customerCreditPayload(
      customerForm.credit_grade,
      customerForm.credit_limit,
      customerForm.currency,
      customerForm.payment_terms,
      customerForm.risk_note,
    ),
  }
}

function customerUpdatePayload(): CustomerUpdatePayload {
  return {
    cn_name: customerEditForm.cn_name.trim(),
    en_name: customerEditForm.en_name.trim(),
    country: customerEditForm.country.trim(),
    address: emptyToNull(customerEditForm.address),
    website: emptyToNull(customerEditForm.website),
    status: customerEditForm.status,
    credit_profile: customerCreditPayload(
      customerEditForm.credit_grade,
      customerEditForm.credit_limit,
      customerEditForm.currency,
      customerEditForm.payment_terms,
      customerEditForm.risk_note,
    ),
  }
}

function customerPrimaryContactPayload(): CustomerContactPayload {
  return {
    name: customerForm.contact_name.trim(),
    title: emptyToNull(customerForm.contact_title),
    email: emptyToNull(customerForm.contact_email),
    phone: emptyToNull(customerForm.contact_phone),
    is_primary: true,
  }
}

function customerContactPayload(): CustomerContactPayload {
  return {
    name: customerContactForm.name.trim(),
    title: emptyToNull(customerContactForm.title),
    email: emptyToNull(customerContactForm.email),
    phone: emptyToNull(customerContactForm.phone),
    is_primary: customerContactForm.is_primary,
  }
}

function customerCreditPayload(
  creditGrade: string,
  creditLimit: string,
  currency: string,
  paymentTerms: string,
  riskNote: string,
) {
  return {
    credit_grade: creditGrade.trim(),
    credit_limit: creditLimit,
    currency: currency.trim(),
    payment_terms: paymentTerms.trim(),
    risk_note: emptyToNull(riskNote),
  }
}

function supplierPayload(): SupplierCreatePayload {
  return {
    code: supplierForm.code.trim(),
    cn_name: supplierForm.cn_name.trim(),
    en_name: supplierForm.en_name.trim(),
    country: supplierForm.country.trim(),
    address: emptyToNull(supplierForm.address),
    website: emptyToNull(supplierForm.website),
    status: supplierForm.status,
    contacts: [supplierPrimaryContactPayload()],
    credit_profile: supplierCreditPayload(
      supplierForm.credit_grade,
      supplierForm.credit_limit,
      supplierForm.currency,
      supplierForm.payment_terms,
      supplierForm.risk_note,
    ),
  }
}

function supplierUpdatePayload(): SupplierUpdatePayload {
  return {
    cn_name: supplierEditForm.cn_name.trim(),
    en_name: supplierEditForm.en_name.trim(),
    country: supplierEditForm.country.trim(),
    address: emptyToNull(supplierEditForm.address),
    website: emptyToNull(supplierEditForm.website),
    status: supplierEditForm.status,
    credit_profile: supplierCreditPayload(
      supplierEditForm.credit_grade,
      supplierEditForm.credit_limit,
      supplierEditForm.currency,
      supplierEditForm.payment_terms,
      supplierEditForm.risk_note,
    ),
  }
}

function supplierPrimaryContactPayload(): SupplierContactPayload {
  return {
    name: supplierForm.contact_name.trim(),
    title: emptyToNull(supplierForm.contact_title),
    email: emptyToNull(supplierForm.contact_email),
    phone: emptyToNull(supplierForm.contact_phone),
    is_primary: true,
  }
}

function supplierContactPayload(): SupplierContactPayload {
  return {
    name: supplierContactForm.name.trim(),
    title: emptyToNull(supplierContactForm.title),
    email: emptyToNull(supplierContactForm.email),
    phone: emptyToNull(supplierContactForm.phone),
    is_primary: supplierContactForm.is_primary,
  }
}

function supplierCreditPayload(
  creditGrade: string,
  creditLimit: string,
  currency: string,
  paymentTerms: string,
  riskNote: string,
) {
  return {
    credit_grade: creditGrade.trim(),
    credit_limit: creditLimit,
    currency: currency.trim(),
    payment_terms: paymentTerms.trim(),
    risk_note: emptyToNull(riskNote),
  }
}

function partnerPayload(): PartnerCreatePayload {
  return {
    code: partnerForm.code.trim(),
    cn_name: partnerForm.cn_name.trim(),
    en_name: partnerForm.en_name.trim(),
    partner_type: partnerForm.partner_type,
    country: partnerForm.country.trim(),
    address: emptyToNull(partnerForm.address),
    website: emptyToNull(partnerForm.website),
    status: partnerForm.status,
    contacts: [partnerPrimaryContactPayload()],
  }
}

function partnerUpdatePayload(): PartnerUpdatePayload {
  return {
    cn_name: partnerEditForm.cn_name.trim(),
    en_name: partnerEditForm.en_name.trim(),
    partner_type: partnerEditForm.partner_type,
    country: partnerEditForm.country.trim(),
    address: emptyToNull(partnerEditForm.address),
    website: emptyToNull(partnerEditForm.website),
    status: partnerEditForm.status,
  }
}

function partnerPrimaryContactPayload(): PartnerContactPayload {
  return {
    name: partnerForm.contact_name.trim(),
    title: emptyToNull(partnerForm.contact_title),
    email: emptyToNull(partnerForm.contact_email),
    phone: emptyToNull(partnerForm.contact_phone),
    is_primary: true,
  }
}

function partnerContactPayload(): PartnerContactPayload {
  return {
    name: partnerContactForm.name.trim(),
    title: emptyToNull(partnerContactForm.title),
    email: emptyToNull(partnerContactForm.email),
    phone: emptyToNull(partnerContactForm.phone),
    is_primary: partnerContactForm.is_primary,
  }
}

function documentPartyPayload(): DocumentPartyCreatePayload {
  return {
    code: documentPartyForm.code.trim(),
    party_type: documentPartyForm.party_type,
    display_name: documentPartyForm.display_name.trim(),
    customer_id: emptyToNull(documentPartyForm.customer_id),
    customer_name: emptyToNull(documentPartyForm.customer_name),
    country: documentPartyForm.country.trim(),
    address: emptyToNull(documentPartyForm.address),
    contact_person: emptyToNull(documentPartyForm.contact_person),
    email: emptyToNull(documentPartyForm.email),
    phone: emptyToNull(documentPartyForm.phone),
    bank_name: emptyToNull(documentPartyForm.bank_name),
    swift_code: emptyToNull(documentPartyForm.swift_code),
    account_no: emptyToNull(documentPartyForm.account_no),
    tax_id: emptyToNull(documentPartyForm.tax_id),
    remarks: emptyToNull(documentPartyForm.remarks),
    is_default: documentPartyForm.is_default,
    status: documentPartyForm.status,
  }
}

function documentPartyUpdatePayload(): DocumentPartyUpdatePayload {
  return {
    party_type: documentPartyEditForm.party_type,
    display_name: documentPartyEditForm.display_name.trim(),
    customer_id: emptyToNull(documentPartyEditForm.customer_id),
    customer_name: emptyToNull(documentPartyEditForm.customer_name),
    country: documentPartyEditForm.country.trim(),
    address: emptyToNull(documentPartyEditForm.address),
    contact_person: emptyToNull(documentPartyEditForm.contact_person),
    email: emptyToNull(documentPartyEditForm.email),
    phone: emptyToNull(documentPartyEditForm.phone),
    bank_name: emptyToNull(documentPartyEditForm.bank_name),
    swift_code: emptyToNull(documentPartyEditForm.swift_code),
    account_no: emptyToNull(documentPartyEditForm.account_no),
    tax_id: emptyToNull(documentPartyEditForm.tax_id),
    remarks: emptyToNull(documentPartyEditForm.remarks),
    is_default: documentPartyEditForm.is_default,
    status: documentPartyEditForm.status,
  }
}

function sampleRequestPayload(): SampleRequestCreatePayload {
  return {
    code: sampleRequestForm.code.trim(),
    request_date: sampleRequestForm.request_date,
    customer_id: emptyToNull(sampleRequestForm.customer_id),
    customer_name: sampleRequestForm.customer_name.trim(),
    product_id: emptyToNull(sampleRequestForm.product_id),
    product_code: emptyToNull(sampleRequestForm.product_code),
    product_name: emptyToNull(sampleRequestForm.product_name),
    supplier_id: emptyToNull(sampleRequestForm.supplier_id),
    supplier_name: emptyToNull(sampleRequestForm.supplier_name),
    sales_user_id: emptyToNull(sampleRequestForm.sales_user_id),
    sales_user_name: emptyToNull(sampleRequestForm.sales_user_name),
    destination: sampleRequestForm.destination,
    requirements: sampleRequestForm.requirements.trim(),
    due_date: emptyToNull(sampleRequestForm.due_date),
    status: sampleRequestForm.status,
    lines: [sampleRequestLinePayload()],
  }
}

function sampleRequestLinePayload(): SampleRequestLinePayload {
  return {
    product_id: emptyToNull(sampleRequestForm.product_id),
    product_code: emptyToNull(sampleRequestForm.line_product_code),
    product_name: sampleRequestForm.line_product_name.trim(),
    specification: emptyToNull(sampleRequestForm.line_specification),
    quantity: sampleRequestForm.line_quantity,
    unit: sampleRequestForm.line_unit.trim(),
    requirement: emptyToNull(sampleRequestForm.line_requirement),
  }
}

function sampleProgressPayload(): SampleProgressPayload {
  return {
    stage: sampleProgressForm.stage,
    status: sampleProgressForm.status,
    occurred_at: sampleProgressForm.occurred_at,
    note: emptyToNull(sampleProgressForm.note),
    handler_name: emptyToNull(sampleProgressForm.handler_name),
  }
}

function sampleFeePayload(): SampleFeePayload {
  return {
    fee_type: sampleFeeForm.fee_type,
    amount: sampleFeeForm.amount,
    currency: sampleFeeForm.currency.trim(),
    payee_type: sampleFeeForm.payee_type,
    payee_name: sampleFeeForm.payee_name.trim(),
    remark: emptyToNull(sampleFeeForm.remark),
  }
}

function sampleRecordPayload(): SampleRecordCreatePayload {
  return {
    code: sampleRecordForm.code.trim(),
    sample_type: sampleRecordForm.sample_type,
    status: sampleRecordForm.status,
    product_id: emptyToNull(sampleRecordForm.product_id),
    product_code: emptyToNull(sampleRecordForm.product_code),
    product_name: sampleRecordForm.product_name.trim(),
    customer_id: emptyToNull(sampleRecordForm.customer_id),
    customer_name: emptyToNull(sampleRecordForm.customer_name),
    supplier_id: emptyToNull(sampleRecordForm.supplier_id),
    supplier_name: emptyToNull(sampleRecordForm.supplier_name),
    customer_sku: emptyToNull(sampleRecordForm.customer_sku),
    supplier_sku: emptyToNull(sampleRecordForm.supplier_sku),
    purchase_contract_id: emptyToNull(sampleRecordForm.purchase_contract_id),
    purchase_contract_no: emptyToNull(sampleRecordForm.purchase_contract_no),
    source_type: emptyToNull(sampleRecordForm.source_type),
    source_id: emptyToNull(sampleRecordForm.source_id),
    source_code: emptyToNull(sampleRecordForm.source_code),
    source_note: emptyToNull(sampleRecordForm.source_note),
    received_at: sampleRecordForm.received_at,
    submitted_at: emptyToNull(sampleRecordForm.submitted_at),
    quantity: sampleRecordForm.quantity,
    unit: sampleRecordForm.unit.trim(),
    description: emptyToNull(sampleRecordForm.description),
    images: [sampleRecordInitialImagePayload()],
  }
}

function sampleRecordInitialImagePayload(): SampleRecordImagePayload {
  return {
    file_id: sampleRecordForm.image_file_id.trim(),
    filename: sampleRecordForm.image_filename.trim(),
    url: sampleRecordForm.image_url.trim(),
    caption: emptyToNull(sampleRecordForm.image_caption),
    is_primary: sampleRecordForm.image_is_primary,
  }
}

function sampleRecordImagePayload(): SampleRecordImagePayload {
  return {
    file_id: sampleRecordImageForm.file_id.trim(),
    filename: sampleRecordImageForm.filename.trim(),
    url: sampleRecordImageForm.url.trim(),
    caption: emptyToNull(sampleRecordImageForm.caption),
    is_primary: sampleRecordImageForm.is_primary,
  }
}

function sampleRecordStockEventPayload(): SampleRecordStockEventPayload {
  return {
    event_type: sampleRecordStockForm.event_type,
    quantity: sampleRecordStockForm.quantity,
    unit: sampleRecordStockForm.unit.trim(),
    occurred_at: sampleRecordStockForm.occurred_at,
    delivery_no: emptyToNull(sampleRecordStockForm.delivery_no),
    recipient: emptyToNull(sampleRecordStockForm.recipient),
    note: emptyToNull(sampleRecordStockForm.note),
  }
}

function sampleDeliveryPayload(): SampleDeliveryCreatePayload {
  return {
    code: sampleDeliveryForm.code.trim(),
    delivery_date: sampleDeliveryForm.delivery_date,
    customer_id: emptyToNull(sampleDeliveryForm.customer_id),
    customer_name: sampleDeliveryForm.customer_name.trim(),
    supplier_id: emptyToNull(sampleDeliveryForm.supplier_id),
    supplier_name: emptyToNull(sampleDeliveryForm.supplier_name),
    factory_id: emptyToNull(sampleDeliveryForm.factory_id),
    factory_name: emptyToNull(sampleDeliveryForm.factory_name),
    recipient_name: sampleDeliveryForm.recipient_name.trim(),
    recipient_company: emptyToNull(sampleDeliveryForm.recipient_company),
    recipient_address: sampleDeliveryForm.recipient_address.trim(),
    express_company: sampleDeliveryForm.express_company.trim(),
    tracking_no: emptyToNull(sampleDeliveryForm.tracking_no),
    quote_id: emptyToNull(sampleDeliveryForm.quote_id),
    quote_no: emptyToNull(sampleDeliveryForm.quote_no),
    remark: emptyToNull(sampleDeliveryForm.remark),
    lines: [
      {
        sample_record_id: sampleDeliveryForm.sample_record_id.trim(),
        sample_code: emptyToNull(sampleDeliveryForm.sample_code),
        sample_type: sampleDeliveryForm.sample_type,
        product_id: emptyToNull(sampleDeliveryForm.product_id),
        product_code: emptyToNull(sampleDeliveryForm.product_code),
        product_name: sampleDeliveryForm.product_name.trim(),
        quantity: sampleDeliveryForm.quantity,
        unit: sampleDeliveryForm.unit.trim(),
        remark: emptyToNull(sampleDeliveryForm.line_remark),
      },
    ],
    fees: [
      {
        fee_type: sampleDeliveryForm.fee_type,
        amount: sampleDeliveryForm.fee_amount,
        currency: sampleDeliveryForm.fee_currency.trim(),
        payer_type: sampleDeliveryForm.fee_payer_type,
        remark: emptyToNull(sampleDeliveryForm.fee_remark),
      },
    ],
  }
}

function sampleDeliveryApprovePayload(): SampleDeliveryApprovePayload {
  return {
    reviewer_name: sampleDeliveryApproveForm.reviewer_name.trim(),
    approved_at: sampleDeliveryApproveForm.approved_at,
  }
}

function sampleDeliveryTrackingPayload(): SampleDeliveryTrackingPayload {
  return {
    express_company: sampleDeliveryTrackingForm.express_company.trim(),
    tracking_no: sampleDeliveryTrackingForm.tracking_no.trim(),
    status: sampleDeliveryTrackingForm.status,
  }
}

function exportQuotationPayload(): ExportQuotationCreatePayload {
  return {
    code: exportQuotationForm.code.trim(),
    quote_date: exportQuotationForm.quote_date,
    customer_id: emptyToNull(exportQuotationForm.customer_id),
    customer_name: exportQuotationForm.customer_name.trim(),
    sales_user_id: emptyToNull(exportQuotationForm.sales_user_id),
    sales_user_name: emptyToNull(exportQuotationForm.sales_user_name),
    currency: exportQuotationForm.currency.trim(),
    trade_term: exportQuotationForm.trade_term.trim(),
    valid_until: emptyToNull(exportQuotationForm.valid_until),
    description: emptyToNull(exportQuotationForm.description),
    lines: [
      {
        product_id: emptyToNull(exportQuotationForm.product_id),
        product_code: emptyToNull(exportQuotationForm.product_code),
        product_name: exportQuotationForm.product_name.trim(),
        specification: emptyToNull(exportQuotationForm.specification),
        model: emptyToNull(exportQuotationForm.model),
        quantity: exportQuotationForm.quantity,
        unit: exportQuotationForm.unit.trim(),
        unit_price: exportQuotationForm.unit_price,
        freight_method: exportQuotationForm.freight_method.trim(),
        freight_amount: exportQuotationForm.freight_amount,
        purchase_reference_supplier_name: emptyToNull(
          exportQuotationForm.purchase_reference_supplier_name,
        ),
        purchase_reference_price: emptyToNull(exportQuotationForm.purchase_reference_price),
        remark: emptyToNull(exportQuotationForm.line_remark),
      },
    ],
  }
}

function exportQuotationApprovePayload(): ExportQuotationApprovePayload {
  return {
    reviewer_name: exportQuotationApproveForm.reviewer_name.trim(),
    approved_at: exportQuotationApproveForm.approved_at,
  }
}

function exportQuotationContractPayload(): ExportQuotationConfirmContractPayload {
  return {
    confirmed_at: exportQuotationContractForm.confirmed_at,
    contract_no: exportQuotationContractForm.contract_no.trim(),
  }
}

function exportContractPayload(): ExportContractCreatePayload {
  return {
    code: exportContractForm.code.trim(),
    contract_date: exportContractForm.contract_date,
    customer_id: emptyToNull(exportContractForm.customer_id),
    customer_name: exportContractForm.customer_name.trim(),
    sales_user_id: emptyToNull(exportContractForm.sales_user_id),
    sales_user_name: emptyToNull(exportContractForm.sales_user_name),
    currency: exportContractForm.currency.trim(),
    trade_term: exportContractForm.trade_term.trim(),
    planned_ship_date: exportContractForm.planned_ship_date,
    payment_terms: exportContractForm.payment_terms.trim(),
    source_quotation_id: emptyToNull(exportContractForm.source_quotation_id),
    source_quotation_no: emptyToNull(exportContractForm.source_quotation_no),
    remarks: emptyToNull(exportContractForm.remarks),
    lines: [
      {
        product_id: emptyToNull(exportContractForm.product_id),
        product_code: emptyToNull(exportContractForm.product_code),
        product_name: exportContractForm.product_name.trim(),
        specification: emptyToNull(exportContractForm.specification),
        model: emptyToNull(exportContractForm.model),
        quantity: exportContractForm.quantity,
        unit: exportContractForm.unit.trim(),
        unit_price: exportContractForm.unit_price,
        purchased_quantity: exportContractForm.purchased_quantity,
        shipped_quantity: exportContractForm.shipped_quantity,
        image_url: emptyToNull(exportContractForm.image_url),
        remark: emptyToNull(exportContractForm.line_remark),
      },
    ],
  }
}

function exportContractApprovePayload(): ExportContractApprovePayload {
  return {
    reviewer_name: exportContractApproveForm.reviewer_name.trim(),
    approved_at: exportContractApproveForm.approved_at,
  }
}

function exportContractSignaturePayload(): ExportContractSignaturePayload {
  return {
    signed_by: exportContractSignatureForm.signed_by.trim(),
    signed_at: exportContractSignatureForm.signed_at,
    signature_method: exportContractSignatureForm.signature_method.trim(),
    file_no: emptyToNull(exportContractSignatureForm.file_no),
    remark: emptyToNull(exportContractSignatureForm.remark),
  }
}

function exportContractAdvancePaymentPayload(): ExportContractAdvancePaymentPayload {
  return {
    payment_no: exportContractAdvancePaymentForm.payment_no.trim(),
    received_at: exportContractAdvancePaymentForm.received_at,
    amount: exportContractAdvancePaymentForm.amount,
    currency: exportContractAdvancePaymentForm.currency.trim(),
    payer_name: exportContractAdvancePaymentForm.payer_name.trim(),
    remark: emptyToNull(exportContractAdvancePaymentForm.remark),
  }
}

function shipmentPayload(): ShipmentPlanGeneratePayload {
  const selections: ShipmentPlanGeneratePayload['selections'] = [
    {
      contract_id: shipmentForm.contract_id_a.trim(),
      quantity: shipmentForm.quantity_a,
    },
  ]

  if (shipmentForm.contract_id_b.trim()) {
    selections.push({
      contract_id: shipmentForm.contract_id_b.trim(),
      quantity: shipmentForm.quantity_b,
    })
  }

  return {
    code: shipmentForm.code.trim(),
    shipment_date: shipmentForm.shipment_date,
    planned_ship_date: shipmentForm.planned_ship_date,
    shipping_method: shipmentForm.shipping_method.trim(),
    port_of_loading: shipmentForm.port_of_loading.trim(),
    port_of_destination: shipmentForm.port_of_destination.trim(),
    vessel_name: emptyToNull(shipmentForm.vessel_name),
    container_no: emptyToNull(shipmentForm.container_no),
    booking_no: emptyToNull(shipmentForm.booking_no),
    document_owner_name: emptyToNull(shipmentForm.document_owner_name),
    estimated_payable_amount: shipmentForm.estimated_payable_amount,
    remarks: emptyToNull(shipmentForm.remarks),
    selections,
  }
}

function shipmentApprovePayload(): ShipmentApprovePayload {
  return {
    reviewer_name: shipmentApproveForm.reviewer_name.trim(),
    approved_at: shipmentApproveForm.approved_at,
  }
}

function purchaseInquiryPayload(): PurchaseInquiryCreatePayload {
  return {
    code: purchaseInquiryForm.code.trim(),
    inquiry_date: purchaseInquiryForm.inquiry_date,
    buyer_user_id: emptyToNull(purchaseInquiryForm.buyer_user_id),
    buyer_user_name: emptyToNull(purchaseInquiryForm.buyer_user_name),
    remarks: emptyToNull(purchaseInquiryForm.remarks),
    lines: [
      {
        product_id: emptyToNull(purchaseInquiryForm.product_id),
        product_code: emptyToNull(purchaseInquiryForm.product_code),
        product_name: purchaseInquiryForm.product_name.trim(),
        specification: emptyToNull(purchaseInquiryForm.specification),
        model: emptyToNull(purchaseInquiryForm.model),
        quantity: purchaseInquiryForm.quantity,
        unit: purchaseInquiryForm.unit.trim(),
      },
    ],
  }
}

function purchaseQuotationPayload(inquiryLineId: string): SupplierQuotationPayload {
  const leadTime = Number(purchaseQuotationForm.lead_time_days)
  return {
    inquiry_line_id: inquiryLineId,
    supplier_id: emptyToNull(purchaseQuotationForm.supplier_id),
    supplier_name: purchaseQuotationForm.supplier_name.trim(),
    quoted_at: purchaseQuotationForm.quoted_at,
    unit_price: purchaseQuotationForm.unit_price,
    currency: purchaseQuotationForm.currency.trim(),
    lead_time_days: Number.isNaN(leadTime) ? null : leadTime,
    min_order_quantity: emptyToNull(purchaseQuotationForm.min_order_quantity),
    sample_available: purchaseQuotationForm.sample_available,
    remark: emptyToNull(purchaseQuotationForm.remark),
  }
}

function purchaseInquiryTemplatePayload(): PurchaseInquiryTemplatePayload {
  return {
    template_name: purchaseInquiryTemplateForm.template_name.trim(),
    recipient_emails: purchaseInquiryTemplateForm.recipient_emails
      .split(/[,\n;，；]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  }
}

function purchaseContractPayload(): PurchaseContractCreatePayload {
  return {
    code: purchaseContractForm.code.trim(),
    contract_date: purchaseContractForm.contract_date,
    supplier_id: emptyToNull(purchaseContractForm.supplier_id),
    supplier_name: purchaseContractForm.supplier_name.trim(),
    buyer_user_id: emptyToNull(purchaseContractForm.buyer_user_id),
    buyer_user_name: emptyToNull(purchaseContractForm.buyer_user_name),
    currency: purchaseContractForm.currency.trim(),
    delivery_date: purchaseContractForm.delivery_date,
    payment_terms: purchaseContractForm.payment_terms.trim(),
    source_type: purchaseContractForm.source_type,
    remarks: emptyToNull(purchaseContractForm.remarks),
    lines: [
      {
        product_id: emptyToNull(purchaseContractForm.product_id),
        product_code: emptyToNull(purchaseContractForm.product_code),
        product_name: purchaseContractForm.product_name.trim(),
        specification: emptyToNull(purchaseContractForm.specification),
        model: emptyToNull(purchaseContractForm.model),
        quantity: purchaseContractForm.quantity,
        unit: purchaseContractForm.unit.trim(),
        unit_price: purchaseContractForm.unit_price,
        source_export_contract_id: emptyToNull(purchaseContractForm.source_export_contract_id),
        source_export_contract_no: emptyToNull(purchaseContractForm.source_export_contract_no),
        source_export_contract_line_id: emptyToNull(purchaseContractForm.source_export_contract_line_id),
        remark: emptyToNull(purchaseContractForm.line_remark),
      },
    ],
  }
}

function purchaseContractGeneratePayload(): PurchaseContractGeneratePayload {
  const sources = [purchaseContractGenerateForm.source_contract_id_a, purchaseContractGenerateForm.source_contract_id_b]
    .map((item) => item.trim())
    .filter(Boolean)
    .map((export_contract_id) => ({ export_contract_id }))

  return {
    code: purchaseContractGenerateForm.code.trim(),
    contract_date: purchaseContractGenerateForm.contract_date,
    supplier_id: emptyToNull(purchaseContractGenerateForm.supplier_id),
    supplier_name: purchaseContractGenerateForm.supplier_name.trim(),
    buyer_user_id: emptyToNull(purchaseContractGenerateForm.buyer_user_id),
    buyer_user_name: emptyToNull(purchaseContractGenerateForm.buyer_user_name),
    currency: purchaseContractGenerateForm.currency.trim(),
    delivery_date: purchaseContractGenerateForm.delivery_date,
    payment_terms: purchaseContractGenerateForm.payment_terms.trim(),
    unit_price: purchaseContractGenerateForm.unit_price,
    remarks: emptyToNull(purchaseContractGenerateForm.remarks),
    sources,
  }
}

function purchaseContractApprovePayload(): PurchaseContractApprovePayload {
  return {
    reviewer_name: purchaseContractApproveForm.reviewer_name.trim(),
    approved_at: purchaseContractApproveForm.approved_at,
  }
}

function purchaseInvoiceNoticeGeneratePayload(): PurchaseInvoiceNoticeGeneratePayload {
  return {
    customs_declaration_id: emptyToNull(purchaseInvoiceNoticeForm.customs_declaration_id),
    customs_declaration_no: purchaseInvoiceNoticeForm.customs_declaration_no.trim(),
    declaration_date: purchaseInvoiceNoticeForm.declaration_date,
    notice_date: purchaseInvoiceNoticeForm.notice_date,
    currency: purchaseInvoiceNoticeForm.currency.trim(),
    remarks: emptyToNull(purchaseInvoiceNoticeForm.remarks),
    lines: purchaseInvoiceNoticeLinePayloads(),
  }
}

function purchaseInvoiceNoticeLinePayloads(): PurchaseInvoiceNoticeLinePayload[] {
  const candidates: PurchaseInvoiceNoticeLinePayload[] = [
    {
      supplier_id: emptyToNull(purchaseInvoiceNoticeForm.supplier_id_a),
      supplier_name: purchaseInvoiceNoticeForm.supplier_name_a.trim(),
      purchase_contract_id: emptyToNull(purchaseInvoiceNoticeForm.purchase_contract_id_a),
      purchase_contract_no: emptyToNull(purchaseInvoiceNoticeForm.purchase_contract_no_a),
      product_id: emptyToNull(purchaseInvoiceNoticeForm.product_id_a),
      product_code: emptyToNull(purchaseInvoiceNoticeForm.product_code_a),
      product_name: purchaseInvoiceNoticeForm.product_name_a.trim(),
      customs_name: purchaseInvoiceNoticeForm.customs_name_a.trim(),
      invoice_name: purchaseInvoiceNoticeForm.invoice_name_a.trim(),
      quantity: purchaseInvoiceNoticeForm.quantity_a,
      unit: purchaseInvoiceNoticeForm.unit_a.trim(),
      amount: purchaseInvoiceNoticeForm.amount_a,
      remark: emptyToNull(purchaseInvoiceNoticeForm.remark_a),
    },
    {
      supplier_id: emptyToNull(purchaseInvoiceNoticeForm.supplier_id_b),
      supplier_name: purchaseInvoiceNoticeForm.supplier_name_b.trim(),
      purchase_contract_id: emptyToNull(purchaseInvoiceNoticeForm.purchase_contract_id_b),
      purchase_contract_no: emptyToNull(purchaseInvoiceNoticeForm.purchase_contract_no_b),
      product_id: emptyToNull(purchaseInvoiceNoticeForm.product_id_b),
      product_code: emptyToNull(purchaseInvoiceNoticeForm.product_code_b),
      product_name: purchaseInvoiceNoticeForm.product_name_b.trim(),
      customs_name: purchaseInvoiceNoticeForm.customs_name_b.trim(),
      invoice_name: purchaseInvoiceNoticeForm.invoice_name_b.trim(),
      quantity: purchaseInvoiceNoticeForm.quantity_b,
      unit: purchaseInvoiceNoticeForm.unit_b.trim(),
      amount: purchaseInvoiceNoticeForm.amount_b,
      remark: emptyToNull(purchaseInvoiceNoticeForm.remark_b),
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

function purchaseInvoiceNoticeSendPayload(): PurchaseInvoiceNoticeSendPayload {
  return {
    sender_name: purchaseInvoiceNoticeSendForm.sender_name.trim(),
    sent_at: purchaseInvoiceNoticeSendForm.sent_at,
  }
}

function purchaseInvoiceNoticeReceivePayload(): PurchaseInvoiceNoticeReceivePayload {
  return {
    tax_invoice_no: purchaseInvoiceNoticeReceiveForm.tax_invoice_no.trim(),
    received_at: purchaseInvoiceNoticeReceiveForm.received_at,
  }
}

function followupTemplatePayload(): FollowProcessTemplatePayload {
  return {
    name: followupTemplateForm.name.trim(),
    enabled: followupTemplateForm.enabled,
    is_default: followupTemplateForm.is_default,
    nodes: [
      followupNodePayload('contract_confirmed', '合同下单确立', 10, 'purchase_contract', followupTemplateForm.contract_days, followupTemplateForm.contract_remind),
      followupNodePayload('confirm_sample_submitted', '确认样提交', 20, 'sample_confirm', followupTemplateForm.confirm_days, followupTemplateForm.confirm_remind),
      followupNodePayload('bulk_sample_submitted', '大货样提交', 30, 'sample_bulk', followupTemplateForm.bulk_days, followupTemplateForm.bulk_remind),
      followupNodePayload('quality_inspection', 'QC 查验', 40, 'qc', followupTemplateForm.qc_days, followupTemplateForm.qc_remind),
      followupNodePayload('inbound_completed', '入库', 50, 'inbound', followupTemplateForm.inbound_days, followupTemplateForm.inbound_remind),
      followupNodePayload('outbound_completed', '出库', 60, 'outbound', followupTemplateForm.outbound_days, followupTemplateForm.outbound_remind),
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
) {
  return {
    node_code,
    node_name,
    sequence_no,
    standard_days: Number(standardDays),
    remind_before_days: Number(remindBeforeDays),
    actual_date_source,
  }
}

function followupPlanGeneratePayload(): PurchaseFollowPlanGeneratePayload {
  return {
    purchase_contract_id: followupPlanForm.purchase_contract_id.trim(),
    as_of: emptyToNull(followupPlanForm.as_of),
  }
}

function followupSourceEventPayload(): FollowSourceEventPayload {
  return {
    purchase_contract_id: followupSourceEventForm.purchase_contract_id.trim(),
    node_code: followupSourceEventForm.node_code,
    source_record_type: followupSourceEventForm.source_record_type,
    source_record_id: followupSourceEventForm.source_record_id.trim(),
    actual_date: followupSourceEventForm.actual_date,
    source_summary: followupSourceEventForm.source_summary.trim(),
  }
}

function qualityInspectionPayload(): QualityInspectionPayload {
  const issues = qualityInspectionIssuePayload()
  return {
    code: qualityInspectionForm.code.trim(),
    purchase_contract_id: qualityInspectionForm.purchase_contract_id.trim(),
    inspected_at: qualityInspectionForm.inspected_at,
    result: qualityInspectionForm.result,
    inspector_id: emptyToNull(qualityInspectionForm.inspector_id),
    inspector_name: qualityInspectionForm.inspector_name.trim(),
    issue_summary: emptyToNull(qualityInspectionForm.issue_summary),
    attachment_group_id: emptyToNull(qualityInspectionForm.attachment_group_id),
    lines: [
      {
        purchase_contract_line_id: emptyToNull(
          qualityInspectionForm.purchase_contract_line_id,
        ),
        product_id: emptyToNull(qualityInspectionForm.product_id),
        product_code: emptyToNull(qualityInspectionForm.product_code),
        product_name: qualityInspectionForm.product_name.trim(),
        inspected_quantity: qualityInspectionForm.inspected_quantity,
        failed_quantity: qualityInspectionForm.failed_quantity,
        unit: qualityInspectionForm.unit.trim(),
        result: qualityInspectionForm.line_result,
        remark: emptyToNull(qualityInspectionForm.line_remark),
      },
    ],
    issues: issues ? [issues] : [],
  }
}

function qualityInspectionIssuePayload() {
  if (!qualityInspectionForm.description.trim()) return null
  return {
    issue_type: qualityInspectionForm.issue_type.trim(),
    severity: qualityInspectionForm.severity,
    description: qualityInspectionForm.description.trim(),
    corrective_action: emptyToNull(qualityInspectionForm.corrective_action),
    status: qualityInspectionForm.issue_status,
    attachment_group_id: emptyToNull(qualityInspectionForm.issue_attachment_group_id),
  }
}

function inboundPlanGeneratePayload(): InboundPlanGeneratePayload {
  return {
    purchase_contract_id: inboundPlanGenerateForm.purchase_contract_id.trim(),
    inbound_type: inboundPlanGenerateForm.inbound_type,
    planned_date: emptyToNull(inboundPlanGenerateForm.planned_date),
  }
}

function inboundPlanSchedulePayload(): InboundPlanSchedulePayload {
  return {
    planned_date: inboundPlanScheduleForm.planned_date,
    warehouse_id: inboundPlanScheduleForm.warehouse_id.trim(),
    warehouse_name: inboundPlanScheduleForm.warehouse_name.trim(),
    location_id: inboundPlanScheduleForm.location_id.trim(),
    location_name: inboundPlanScheduleForm.location_name.trim(),
    operator_name: inboundPlanScheduleForm.operator_name.trim(),
  }
}

function inboundOrderPayload(): InboundOrderGeneratePayload {
  return {
    plan_id: inboundOrderForm.plan_id.trim(),
    code: inboundOrderForm.code.trim(),
    inbound_mode: inboundOrderForm.inbound_mode,
    inbound_at: inboundOrderForm.inbound_at,
    warehouse_id: inboundOrderForm.warehouse_id.trim(),
    warehouse_name: inboundOrderForm.warehouse_name.trim(),
    location_id: inboundOrderForm.location_id.trim(),
    location_name: inboundOrderForm.location_name.trim(),
    operator_name: inboundOrderForm.operator_name.trim(),
    lines: [],
  }
}

function inboundOrderApprovePayload(): InboundOrderApprovePayload {
  return {
    reviewer_name: inboundOrderApprovalForm.reviewer_name.trim(),
    approved_at: inboundOrderApprovalForm.approved_at,
  }
}

function outboundPlanGeneratePayload(): OutboundPlanGeneratePayload {
  return {
    shipment_plan_id: outboundPlanGenerateForm.shipment_plan_id.trim(),
    outbound_type: outboundPlanGenerateForm.outbound_type,
    planned_date: emptyToNull(outboundPlanGenerateForm.planned_date),
  }
}

function outboundPlanSchedulePayload(): OutboundPlanSchedulePayload {
  return {
    planned_date: outboundPlanScheduleForm.planned_date,
    warehouse_id: outboundPlanScheduleForm.warehouse_id.trim(),
    warehouse_name: outboundPlanScheduleForm.warehouse_name.trim(),
    location_id: outboundPlanScheduleForm.location_id.trim(),
    location_name: outboundPlanScheduleForm.location_name.trim(),
    operator_name: outboundPlanScheduleForm.operator_name.trim(),
  }
}

function outboundOrderPayload(): OutboundOrderGeneratePayload {
  return {
    plan_id: outboundOrderForm.plan_id.trim(),
    code: outboundOrderForm.code.trim(),
    outbound_mode: outboundOrderForm.outbound_mode,
    outbound_at: outboundOrderForm.outbound_at,
    warehouse_id: outboundOrderForm.warehouse_id.trim(),
    warehouse_name: outboundOrderForm.warehouse_name.trim(),
    location_id: outboundOrderForm.location_id.trim(),
    location_name: outboundOrderForm.location_name.trim(),
    operator_name: outboundOrderForm.operator_name.trim(),
    exception_reason:
      outboundOrderForm.outbound_mode === 'exception'
        ? outboundOrderForm.exception_reason.trim()
        : null,
    lines: [],
  }
}

function outboundOrderApprovePayload(): OutboundOrderApprovePayload {
  return {
    reviewer_name: outboundOrderApprovalForm.reviewer_name.trim(),
    approved_at: outboundOrderApprovalForm.approved_at,
    allow_negative: outboundOrderApprovalForm.allow_negative,
  }
}

function resetProductForm(): void {
  productForm.code = nextProductCode()
  productForm.cn_name = ''
  productForm.en_name = ''
  productForm.specification = ''
  productForm.model = ''
  productForm.customs_code = ''
  productForm.tax_rate = '0.13'
  productForm.rebate_rate = '0.09'
  productForm.package_info = ''
  productForm.unit = 'pcs'
  productForm.image_url = ''
  productForm.accessory_name = ''
  productForm.accessory_unit_consumption = '1'
  productForm.accessory_unit = 'pcs'
  productForm.accessory_supplier = ''
  productForm.accessory_rule = 'by_supplier'
}

function resetCustomerForm(): void {
  customerForm.code = nextCustomerCode()
  customerForm.cn_name = ''
  customerForm.en_name = ''
  customerForm.country = ''
  customerForm.address = ''
  customerForm.website = ''
  customerForm.status = 'active'
  customerForm.contact_name = ''
  customerForm.contact_title = ''
  customerForm.contact_email = ''
  customerForm.contact_phone = ''
  customerForm.credit_grade = 'B'
  customerForm.credit_limit = '0'
  customerForm.currency = 'USD'
  customerForm.payment_terms = 'T/T before shipment'
  customerForm.risk_note = ''
}

function resetSupplierForm(): void {
  supplierForm.code = nextSupplierCode()
  supplierForm.cn_name = ''
  supplierForm.en_name = ''
  supplierForm.country = ''
  supplierForm.address = ''
  supplierForm.website = ''
  supplierForm.status = 'active'
  supplierForm.contact_name = ''
  supplierForm.contact_title = ''
  supplierForm.contact_email = ''
  supplierForm.contact_phone = ''
  supplierForm.credit_grade = 'B'
  supplierForm.credit_limit = '0'
  supplierForm.currency = 'CNY'
  supplierForm.payment_terms = 'T/T before shipment'
  supplierForm.risk_note = ''
}

function resetPartnerForm(): void {
  partnerForm.code = nextPartnerCode()
  partnerForm.cn_name = ''
  partnerForm.en_name = ''
  partnerForm.partner_type = 'freight_forwarder'
  partnerForm.country = ''
  partnerForm.address = ''
  partnerForm.website = ''
  partnerForm.status = 'active'
  partnerForm.contact_name = ''
  partnerForm.contact_title = ''
  partnerForm.contact_email = ''
  partnerForm.contact_phone = ''
}

function resetDocumentPartyForm(): void {
  documentPartyForm.code = nextDocumentPartyCode()
  documentPartyForm.party_type = 'consignee'
  documentPartyForm.display_name = ''
  documentPartyForm.customer_id = ''
  documentPartyForm.customer_name = ''
  documentPartyForm.country = ''
  documentPartyForm.address = ''
  documentPartyForm.contact_person = ''
  documentPartyForm.email = ''
  documentPartyForm.phone = ''
  documentPartyForm.bank_name = ''
  documentPartyForm.swift_code = ''
  documentPartyForm.account_no = ''
  documentPartyForm.tax_id = ''
  documentPartyForm.remarks = ''
  documentPartyForm.is_default = false
  documentPartyForm.status = 'active'
}

function resetSampleRequestForm(): void {
  sampleRequestForm.code = nextSampleRequestCode()
  sampleRequestForm.request_date = '2026-06-20'
  sampleRequestForm.customer_id = ''
  sampleRequestForm.customer_name = ''
  sampleRequestForm.product_id = ''
  sampleRequestForm.product_code = ''
  sampleRequestForm.product_name = ''
  sampleRequestForm.supplier_id = ''
  sampleRequestForm.supplier_name = ''
  sampleRequestForm.sales_user_id = ''
  sampleRequestForm.sales_user_name = ''
  sampleRequestForm.destination = 'in_house'
  sampleRequestForm.requirements = ''
  sampleRequestForm.due_date = ''
  sampleRequestForm.status = 'draft'
  sampleRequestForm.line_product_name = ''
  sampleRequestForm.line_product_code = ''
  sampleRequestForm.line_specification = ''
  sampleRequestForm.line_quantity = '1'
  sampleRequestForm.line_unit = 'pcs'
  sampleRequestForm.line_requirement = ''
}

function resetSampleRecordForm(): void {
  sampleRecordForm.code = nextSampleRecordCode()
  sampleRecordForm.sample_type = 'incoming'
  sampleRecordForm.status = 'registered'
  sampleRecordForm.product_id = ''
  sampleRecordForm.product_code = ''
  sampleRecordForm.product_name = ''
  sampleRecordForm.customer_id = ''
  sampleRecordForm.customer_name = ''
  sampleRecordForm.supplier_id = ''
  sampleRecordForm.supplier_name = ''
  sampleRecordForm.customer_sku = ''
  sampleRecordForm.supplier_sku = ''
  sampleRecordForm.purchase_contract_id = ''
  sampleRecordForm.purchase_contract_no = ''
  sampleRecordForm.source_type = ''
  sampleRecordForm.source_id = ''
  sampleRecordForm.source_code = ''
  sampleRecordForm.source_note = ''
  sampleRecordForm.received_at = '2026-06-22'
  sampleRecordForm.submitted_at = ''
  sampleRecordForm.quantity = '1'
  sampleRecordForm.unit = 'pcs'
  sampleRecordForm.description = ''
  sampleRecordForm.image_file_id = `file-${Date.now().toString().slice(-6)}`
  sampleRecordForm.image_filename = ''
  sampleRecordForm.image_url = ''
  sampleRecordForm.image_caption = ''
  sampleRecordForm.image_is_primary = true
}

function resetSampleDeliveryForm(): void {
  sampleDeliveryForm.code = nextSampleDeliveryCode()
  sampleDeliveryForm.delivery_date = '2026-06-25'
  sampleDeliveryForm.customer_id = ''
  sampleDeliveryForm.customer_name = ''
  sampleDeliveryForm.supplier_id = ''
  sampleDeliveryForm.supplier_name = ''
  sampleDeliveryForm.factory_id = ''
  sampleDeliveryForm.factory_name = ''
  sampleDeliveryForm.recipient_name = ''
  sampleDeliveryForm.recipient_company = ''
  sampleDeliveryForm.recipient_address = ''
  sampleDeliveryForm.express_company = 'DHL'
  sampleDeliveryForm.tracking_no = ''
  sampleDeliveryForm.quote_id = ''
  sampleDeliveryForm.quote_no = ''
  sampleDeliveryForm.remark = ''
  sampleDeliveryForm.sample_record_id = ''
  sampleDeliveryForm.sample_code = ''
  sampleDeliveryForm.sample_type = 'confirm_sample'
  sampleDeliveryForm.product_id = ''
  sampleDeliveryForm.product_code = ''
  sampleDeliveryForm.product_name = ''
  sampleDeliveryForm.quantity = '1'
  sampleDeliveryForm.unit = 'pcs'
  sampleDeliveryForm.line_remark = ''
  sampleDeliveryForm.fee_type = 'express'
  sampleDeliveryForm.fee_amount = '0.00'
  sampleDeliveryForm.fee_currency = 'USD'
  sampleDeliveryForm.fee_payer_type = 'company'
  sampleDeliveryForm.fee_remark = ''
}

function fillSampleDeliveryForm(delivery: SampleDelivery | null): void {
  if (!delivery) return
  const line = delivery.lines[0]
  const fee = delivery.fees[0]
  sampleDeliveryForm.code = delivery.code
  sampleDeliveryForm.delivery_date = delivery.delivery_date
  sampleDeliveryForm.customer_id = delivery.customer_id ?? ''
  sampleDeliveryForm.customer_name = delivery.customer_name
  sampleDeliveryForm.supplier_id = delivery.supplier_id ?? ''
  sampleDeliveryForm.supplier_name = delivery.supplier_name ?? ''
  sampleDeliveryForm.factory_id = delivery.factory_id ?? ''
  sampleDeliveryForm.factory_name = delivery.factory_name ?? ''
  sampleDeliveryForm.recipient_name = delivery.recipient_name
  sampleDeliveryForm.recipient_company = delivery.recipient_company ?? ''
  sampleDeliveryForm.recipient_address = delivery.recipient_address
  sampleDeliveryForm.express_company = delivery.express_company
  sampleDeliveryForm.tracking_no = delivery.tracking_no ?? ''
  sampleDeliveryForm.quote_id = delivery.quote_id ?? ''
  sampleDeliveryForm.quote_no = delivery.quote_no ?? ''
  sampleDeliveryForm.remark = delivery.remark ?? ''
  sampleDeliveryForm.sample_record_id = line?.sample_record_id ?? ''
  sampleDeliveryForm.sample_code = line?.sample_code ?? ''
  sampleDeliveryForm.sample_type = line?.sample_type ?? 'confirm_sample'
  sampleDeliveryForm.product_id = line?.product_id ?? ''
  sampleDeliveryForm.product_code = line?.product_code ?? ''
  sampleDeliveryForm.product_name = line?.product_name ?? ''
  sampleDeliveryForm.quantity = line?.quantity ?? '1'
  sampleDeliveryForm.unit = line?.unit ?? 'pcs'
  sampleDeliveryForm.line_remark = line?.remark ?? ''
  sampleDeliveryForm.fee_type = fee?.fee_type ?? 'express'
  sampleDeliveryForm.fee_amount = fee?.amount ?? '0.00'
  sampleDeliveryForm.fee_currency = fee?.currency ?? 'USD'
  sampleDeliveryForm.fee_payer_type = fee?.payer_type ?? 'company'
  sampleDeliveryForm.fee_remark = fee?.remark ?? ''
}

function resetExportQuotationForm(): void {
  exportQuotationForm.code = nextExportQuotationCode()
  exportQuotationForm.quote_date = '2026-07-01'
  exportQuotationForm.customer_id = ''
  exportQuotationForm.customer_name = ''
  exportQuotationForm.sales_user_id = currentUser.value?.id ?? ''
  exportQuotationForm.sales_user_name = currentUser.value?.display_name ?? ''
  exportQuotationForm.currency = 'USD'
  exportQuotationForm.trade_term = 'FOB Ningbo'
  exportQuotationForm.valid_until = '2026-07-15'
  exportQuotationForm.description = ''
  exportQuotationForm.product_id = ''
  exportQuotationForm.product_code = ''
  exportQuotationForm.product_name = ''
  exportQuotationForm.specification = ''
  exportQuotationForm.model = ''
  exportQuotationForm.quantity = '1'
  exportQuotationForm.unit = 'pcs'
  exportQuotationForm.unit_price = '1.00'
  exportQuotationForm.freight_method = 'sea'
  exportQuotationForm.freight_amount = '0.00'
  exportQuotationForm.purchase_reference_supplier_name = ''
  exportQuotationForm.purchase_reference_price = ''
  exportQuotationForm.line_remark = ''
}

function fillExportQuotationForm(quotation: ExportQuotation | null): void {
  if (!quotation) return
  const line = quotation.lines[0]
  exportQuotationForm.code = quotation.code
  exportQuotationForm.quote_date = quotation.quote_date
  exportQuotationForm.customer_id = quotation.customer_id ?? ''
  exportQuotationForm.customer_name = quotation.customer_name
  exportQuotationForm.sales_user_id = quotation.sales_user_id ?? ''
  exportQuotationForm.sales_user_name = quotation.sales_user_name ?? ''
  exportQuotationForm.currency = quotation.currency
  exportQuotationForm.trade_term = quotation.trade_term
  exportQuotationForm.valid_until = quotation.valid_until ?? ''
  exportQuotationForm.description = quotation.description ?? ''
  exportQuotationForm.product_id = line?.product_id ?? ''
  exportQuotationForm.product_code = line?.product_code ?? ''
  exportQuotationForm.product_name = line?.product_name ?? ''
  exportQuotationForm.specification = line?.specification ?? ''
  exportQuotationForm.model = line?.model ?? ''
  exportQuotationForm.quantity = line?.quantity ?? '1'
  exportQuotationForm.unit = line?.unit ?? 'pcs'
  exportQuotationForm.unit_price = line?.unit_price ?? '1.00'
  exportQuotationForm.freight_method = line?.freight_method ?? 'sea'
  exportQuotationForm.freight_amount = line?.freight_amount ?? '0.00'
  exportQuotationForm.purchase_reference_supplier_name =
    line?.purchase_reference_supplier_name ?? ''
  exportQuotationForm.purchase_reference_price = line?.purchase_reference_price ?? ''
  exportQuotationForm.line_remark = line?.remark ?? ''
}

function resetExportContractForm(): void {
  exportContractForm.code = nextExportContractNo()
  exportContractForm.contract_date = '2026-07-03'
  exportContractForm.customer_id = ''
  exportContractForm.customer_name = ''
  exportContractForm.sales_user_id = currentUser.value?.id ?? ''
  exportContractForm.sales_user_name = currentUser.value?.display_name ?? ''
  exportContractForm.currency = 'USD'
  exportContractForm.trade_term = 'FOB Ningbo'
  exportContractForm.planned_ship_date = '2026-08-10'
  exportContractForm.payment_terms = '30% T/T in advance, balance before shipment'
  exportContractForm.source_quotation_id = ''
  exportContractForm.source_quotation_no = ''
  exportContractForm.remarks = ''
  exportContractForm.product_id = ''
  exportContractForm.product_code = ''
  exportContractForm.product_name = ''
  exportContractForm.specification = ''
  exportContractForm.model = ''
  exportContractForm.quantity = '1'
  exportContractForm.unit = 'pcs'
  exportContractForm.unit_price = '1.00'
  exportContractForm.purchased_quantity = '0'
  exportContractForm.shipped_quantity = '0'
  exportContractForm.image_url = ''
  exportContractForm.line_remark = ''
}

function resetShipmentForm(): void {
  shipmentForm.code = nextShipmentNo()
  shipmentForm.shipment_date = '2026-08-18'
  shipmentForm.planned_ship_date = '2026-08-20'
  shipmentForm.contract_id_a = ''
  shipmentForm.quantity_a = '300'
  shipmentForm.contract_id_b = ''
  shipmentForm.quantity_b = '200'
  shipmentForm.shipping_method = 'sea'
  shipmentForm.port_of_loading = 'Ningbo'
  shipmentForm.port_of_destination = 'Hamburg'
  shipmentForm.vessel_name = 'COSCO Star'
  shipmentForm.container_no = `CONT-${Date.now().toString().slice(-6)}`
  shipmentForm.booking_no = `BOOK-${Date.now().toString().slice(-6)}`
  shipmentForm.document_owner_name = '单证部'
  shipmentForm.estimated_payable_amount = '780.00'
  shipmentForm.remarks = '两个出口合同合并出运'
}

function resetPurchaseInquiryForm(): void {
  editingPurchaseInquiryId.value = null
  purchaseInquiryForm.code = nextPurchaseInquiryCode()
  purchaseInquiryForm.inquiry_date = '2026-08-01'
  purchaseInquiryForm.buyer_user_id = currentUser.value?.id ?? 'u-001'
  purchaseInquiryForm.buyer_user_name = currentUser.value?.display_name ?? '演示业务主管'
  purchaseInquiryForm.remarks = '环保袋供应商询价'
  purchaseInquiryForm.product_id = 'product-bag'
  purchaseInquiryForm.product_code = 'BAG-40'
  purchaseInquiryForm.product_name = 'Eco Shopping Bag'
  purchaseInquiryForm.specification = '40x35cm'
  purchaseInquiryForm.model = 'BAG-40'
  purchaseInquiryForm.quantity = '1000'
  purchaseInquiryForm.unit = 'pcs'
}

function resetPurchaseContractForm(): void {
  editingPurchaseContractId.value = null
  purchaseContractForm.code = nextPurchaseContractCode()
  purchaseContractForm.contract_date = '2026-08-03'
  purchaseContractForm.supplier_id = 'supplier-accessory-a'
  purchaseContractForm.supplier_name = '远景辅料供应商'
  purchaseContractForm.buyer_user_id = currentUser.value?.id ?? 'u-001'
  purchaseContractForm.buyer_user_name = currentUser.value?.display_name ?? '演示业务主管'
  purchaseContractForm.currency = 'USD'
  purchaseContractForm.delivery_date = '2026-08-24'
  purchaseContractForm.payment_terms = '30% advance, 70% before delivery'
  purchaseContractForm.source_type = 'stock_purchase'
  purchaseContractForm.remarks = '库存补货采购，可不关联出口合同。'
  purchaseContractForm.product_id = ''
  purchaseContractForm.product_code = 'ACC-COTTON-ROPE'
  purchaseContractForm.product_name = '棉绳'
  purchaseContractForm.specification = '5mm'
  purchaseContractForm.model = 'ROPE-5'
  purchaseContractForm.quantity = '500'
  purchaseContractForm.unit = 'm'
  purchaseContractForm.unit_price = '0.12'
  purchaseContractForm.source_export_contract_id = ''
  purchaseContractForm.source_export_contract_no = ''
  purchaseContractForm.source_export_contract_line_id = ''
  purchaseContractForm.line_remark = '库存安全量补货'
}

function resetPurchaseContractGenerateForm(): void {
  purchaseContractGenerateForm.code = nextPurchaseContractCode()
  purchaseContractGenerateForm.contract_date = '2026-08-04'
  purchaseContractGenerateForm.supplier_id = 'supplier-accessory-a'
  purchaseContractGenerateForm.supplier_name = '远景辅料供应商'
  purchaseContractGenerateForm.buyer_user_id = currentUser.value?.id ?? 'u-001'
  purchaseContractGenerateForm.buyer_user_name = currentUser.value?.display_name ?? '演示业务主管'
  purchaseContractGenerateForm.currency = 'USD'
  purchaseContractGenerateForm.delivery_date = '2026-08-24'
  purchaseContractGenerateForm.payment_terms = '30% advance, 70% before delivery'
  purchaseContractGenerateForm.unit_price = '0.12'
  purchaseContractGenerateForm.remarks = '按已审批出口合同商品配件自动生成采购合同。'
  purchaseContractGenerateForm.source_contract_id_a = ''
  purchaseContractGenerateForm.source_contract_id_b = ''
}

function resetPurchaseInvoiceNoticeForm(): void {
  purchaseInvoiceNoticeForm.customs_declaration_id = `customs-${Date.now().toString().slice(-6)}`
  purchaseInvoiceNoticeForm.customs_declaration_no = nextPurchaseInvoiceNoticeCustomsNo()
  purchaseInvoiceNoticeForm.declaration_date = '2026-09-03'
  purchaseInvoiceNoticeForm.notice_date = '2026-09-04'
  purchaseInvoiceNoticeForm.currency = 'CNY'
  purchaseInvoiceNoticeForm.remarks = '根据报关单证按供应商生成开票通知。'
  purchaseInvoiceNoticeForm.supplier_id_a = 'supplier-pack-a'
  purchaseInvoiceNoticeForm.supplier_name_a = '华东包装制品厂'
  purchaseInvoiceNoticeForm.purchase_contract_id_a = 'pc-pack-a'
  purchaseInvoiceNoticeForm.purchase_contract_no_a = 'PC-2026-PACK-A'
  purchaseInvoiceNoticeForm.product_id_a = 'product-bag'
  purchaseInvoiceNoticeForm.product_code_a = 'BAG-40'
  purchaseInvoiceNoticeForm.product_name_a = 'Eco Shopping Bag'
  purchaseInvoiceNoticeForm.customs_name_a = '环保购物袋'
  purchaseInvoiceNoticeForm.invoice_name_a = '无纺布购物袋'
  purchaseInvoiceNoticeForm.quantity_a = '1000'
  purchaseInvoiceNoticeForm.unit_a = 'pcs'
  purchaseInvoiceNoticeForm.amount_a = '5200.00'
  purchaseInvoiceNoticeForm.remark_a = '按报关品名和数量开具增值税发票'
  purchaseInvoiceNoticeForm.supplier_id_b = 'supplier-label-a'
  purchaseInvoiceNoticeForm.supplier_name_b = '苏州标签印务厂'
  purchaseInvoiceNoticeForm.purchase_contract_id_b = 'pc-label-a'
  purchaseInvoiceNoticeForm.purchase_contract_no_b = 'PC-2026-LABEL-A'
  purchaseInvoiceNoticeForm.product_id_b = 'product-label'
  purchaseInvoiceNoticeForm.product_code_b = 'LABEL-01'
  purchaseInvoiceNoticeForm.product_name_b = 'Hang Tag'
  purchaseInvoiceNoticeForm.customs_name_b = '纸制吊牌'
  purchaseInvoiceNoticeForm.invoice_name_b = '纸质吊牌'
  purchaseInvoiceNoticeForm.quantity_b = '450'
  purchaseInvoiceNoticeForm.unit_b = 'pcs'
  purchaseInvoiceNoticeForm.amount_b = '360.00'
  purchaseInvoiceNoticeForm.remark_b = '吊牌随货开票'
}

function fillFollowupTemplateForm(template: FollowProcessTemplate | null): void {
  if (!template) return
  followupTemplateForm.name = template.name
  followupTemplateForm.enabled = template.enabled
  followupTemplateForm.is_default = template.is_default
  const nodes = Object.fromEntries(template.nodes.map((node) => [node.node_code, node]))
  followupTemplateForm.contract_days = String(nodes.contract_confirmed?.standard_days ?? 0)
  followupTemplateForm.contract_remind = String(nodes.contract_confirmed?.remind_before_days ?? 0)
  followupTemplateForm.confirm_days = String(nodes.confirm_sample_submitted?.standard_days ?? 3)
  followupTemplateForm.confirm_remind = String(nodes.confirm_sample_submitted?.remind_before_days ?? 1)
  followupTemplateForm.bulk_days = String(nodes.bulk_sample_submitted?.standard_days ?? 7)
  followupTemplateForm.bulk_remind = String(nodes.bulk_sample_submitted?.remind_before_days ?? 2)
  followupTemplateForm.qc_days = String(nodes.quality_inspection?.standard_days ?? 14)
  followupTemplateForm.qc_remind = String(nodes.quality_inspection?.remind_before_days ?? 2)
  followupTemplateForm.inbound_days = String(nodes.inbound_completed?.standard_days ?? 20)
  followupTemplateForm.inbound_remind = String(nodes.inbound_completed?.remind_before_days ?? 3)
  followupTemplateForm.outbound_days = String(nodes.outbound_completed?.standard_days ?? 25)
  followupTemplateForm.outbound_remind = String(nodes.outbound_completed?.remind_before_days ?? 3)
}

function fillPurchaseInquiryForm(inquiry: PurchaseInquiry | null): void {
  if (!inquiry) return
  const line = inquiry.lines[0]
  editingPurchaseInquiryId.value = inquiry.id
  purchaseInquiryForm.code = inquiry.code
  purchaseInquiryForm.inquiry_date = inquiry.inquiry_date
  purchaseInquiryForm.buyer_user_id = inquiry.buyer_user_id ?? ''
  purchaseInquiryForm.buyer_user_name = inquiry.buyer_user_name ?? ''
  purchaseInquiryForm.remarks = inquiry.remarks ?? ''
  purchaseInquiryForm.product_id = line?.product_id ?? ''
  purchaseInquiryForm.product_code = line?.product_code ?? ''
  purchaseInquiryForm.product_name = line?.product_name ?? ''
  purchaseInquiryForm.specification = line?.specification ?? ''
  purchaseInquiryForm.model = line?.model ?? ''
  purchaseInquiryForm.quantity = line?.quantity ?? '1'
  purchaseInquiryForm.unit = line?.unit ?? 'pcs'
}

function fillPurchaseContractForm(contract: PurchaseContract | null): void {
  if (!contract) return
  const line = contract.lines[0]
  editingPurchaseContractId.value = contract.id
  purchaseContractForm.code = contract.code
  purchaseContractForm.contract_date = contract.contract_date
  purchaseContractForm.supplier_id = contract.supplier_id ?? ''
  purchaseContractForm.supplier_name = contract.supplier_name
  purchaseContractForm.buyer_user_id = contract.buyer_user_id ?? ''
  purchaseContractForm.buyer_user_name = contract.buyer_user_name ?? ''
  purchaseContractForm.currency = contract.currency
  purchaseContractForm.delivery_date = contract.delivery_date
  purchaseContractForm.payment_terms = contract.payment_terms
  purchaseContractForm.source_type = contract.source_type as PurchaseContractCreatePayload['source_type']
  purchaseContractForm.remarks = contract.remarks ?? ''
  purchaseContractForm.product_id = line?.product_id ?? ''
  purchaseContractForm.product_code = line?.product_code ?? ''
  purchaseContractForm.product_name = line?.product_name ?? ''
  purchaseContractForm.specification = line?.specification ?? ''
  purchaseContractForm.model = line?.model ?? ''
  purchaseContractForm.quantity = line?.quantity ?? '1'
  purchaseContractForm.unit = line?.unit ?? 'pcs'
  purchaseContractForm.unit_price = line?.unit_price ?? '0'
  purchaseContractForm.source_export_contract_id = line?.source_export_contract_id ?? ''
  purchaseContractForm.source_export_contract_no = line?.source_export_contract_no ?? ''
  purchaseContractForm.source_export_contract_line_id = line?.source_export_contract_line_id ?? ''
  purchaseContractForm.line_remark = line?.remark ?? ''
}

function cancelPurchaseInquiryEdit(): void {
  resetPurchaseInquiryForm()
}

function cancelPurchaseContractEdit(): void {
  resetPurchaseContractForm()
}

function fillExportContractForm(contract: ExportContract | null): void {
  if (!contract) return
  const line = contract.lines[0]
  exportContractForm.code = contract.code
  exportContractForm.contract_date = contract.contract_date
  exportContractForm.customer_id = contract.customer_id ?? ''
  exportContractForm.customer_name = contract.customer_name
  exportContractForm.sales_user_id = contract.sales_user_id ?? ''
  exportContractForm.sales_user_name = contract.sales_user_name ?? ''
  exportContractForm.currency = contract.currency
  exportContractForm.trade_term = contract.trade_term
  exportContractForm.planned_ship_date = contract.planned_ship_date
  exportContractForm.payment_terms = contract.payment_terms
  exportContractForm.source_quotation_id = contract.source_quotation_id ?? ''
  exportContractForm.source_quotation_no = contract.source_quotation_no ?? ''
  exportContractForm.remarks = contract.remarks ?? ''
  exportContractForm.product_id = line?.product_id ?? ''
  exportContractForm.product_code = line?.product_code ?? ''
  exportContractForm.product_name = line?.product_name ?? ''
  exportContractForm.specification = line?.specification ?? ''
  exportContractForm.model = line?.model ?? ''
  exportContractForm.quantity = line?.quantity ?? '1'
  exportContractForm.unit = line?.unit ?? 'pcs'
  exportContractForm.unit_price = line?.unit_price ?? '1.00'
  exportContractForm.purchased_quantity = line?.purchased_quantity ?? '0'
  exportContractForm.shipped_quantity = line?.shipped_quantity ?? '0'
  exportContractForm.image_url = line?.image_url ?? ''
  exportContractForm.line_remark = line?.remark ?? ''
}

function emptyToNull(value: string | number | null | undefined): string | null {
  const trimmed = String(value ?? '').trim()
  return trimmed.length > 0 ? trimmed : null
}

function selectProduct(productId: string): void {
  selectedProductId.value = productId
}

function selectCustomer(customerId: string): void {
  selectedCustomerId.value = customerId
  syncCustomerEditForm(selectedCustomer.value)
  void loadSelectedCustomerTransactions()
}

function selectSupplier(supplierId: string): void {
  selectedSupplierId.value = supplierId
  syncSupplierEditForm(selectedSupplier.value)
  void loadSelectedSupplierTransactions()
}

function selectPartner(partnerId: string): void {
  selectedPartnerId.value = partnerId
  syncPartnerEditForm(selectedPartner.value)
  void loadSelectedPartnerFeeRecords()
}

function selectDocumentParty(partyId: string): void {
  selectedDocumentPartyId.value = partyId
  syncDocumentPartyEditForm(selectedDocumentParty.value)
  void loadDocumentPartyLookup()
}

function selectSampleRequest(requestId: string): void {
  selectedSampleRequestId.value = requestId
}

function selectSampleRecord(recordId: string): void {
  selectedSampleRecordId.value = recordId
}

function selectSampleDelivery(deliveryId: string): void {
  selectedSampleDeliveryId.value = deliveryId
  syncSampleDeliveryActionForms(selectedSampleDelivery.value)
  void loadSelectedSampleDeliveryHistories()
}

function selectExportQuotation(quotationId: string): void {
  selectedExportQuotationId.value = quotationId
  syncExportQuotationActionForms(selectedExportQuotation.value)
  void loadSelectedExportQuotationReferences()
}

function selectExportContract(contractId: string): void {
  selectedExportContractId.value = contractId
  syncExportContractActionForms(selectedExportContract.value)
  exportContractExportPreview.value = ''
  void loadSelectedExportContractQuotationHistory()
}

function selectShipment(shipmentId: string): void {
  selectedShipmentId.value = shipmentId
  syncShipmentActionForms(selectedShipment.value)
}

function selectPurchaseInquiry(inquiryId: string): void {
  selectedPurchaseInquiryId.value = inquiryId
  syncPurchaseInquiryActionForms(selectedPurchaseInquiry.value)
  purchaseInquiryTemplatePreview.value = ''
}

function selectPurchaseContract(contractId: string): void {
  selectedPurchaseContractId.value = contractId
  syncPurchaseContractActionForms(selectedPurchaseContract.value)
}

function selectPurchaseInvoiceNotice(noticeId: string): void {
  selectedPurchaseInvoiceNoticeId.value = noticeId
  syncPurchaseInvoiceNoticeActionForms(selectedPurchaseInvoiceNotice.value)
}

function selectFollowupTemplate(templateId: string): void {
  selectedFollowupTemplateId.value = templateId
  fillFollowupTemplateForm(selectedFollowupTemplate.value)
}

function selectFollowupPlan(planId: string): void {
  selectedFollowupPlanId.value = planId
  syncFollowupForms(selectedFollowupTemplate.value, selectedFollowupPlan.value)
}

function loadSelectedPurchaseInquiryForEdit(): void {
  const inquiry = selectedPurchaseInquiry.value
  if (!inquiry || inquiry.status !== 'draft') return
  fillPurchaseInquiryForm(inquiry)
  purchaseInquiryMessage.value = `正在编辑采购询价 ${inquiry.code}`
}

function loadSelectedPurchaseContractForEdit(): void {
  const contract = selectedPurchaseContract.value
  if (!contract || contract.approval_status !== 'draft') return
  fillPurchaseContractForm(contract)
  purchaseContractMessage.value = `正在编辑采购合同 ${contract.code}`
}

async function loadSelectedCustomerTransactions(): Promise<void> {
  if (!selectedCustomer.value) {
    customerTransactions.value = { items: [], total: 0 }
    return
  }
  customerTransactions.value = await listCustomerTransactions(selectedCustomer.value.id)
}

async function loadSelectedSupplierTransactions(): Promise<void> {
  if (!selectedSupplier.value) {
    supplierTransactions.value = { items: [], total: 0 }
    return
  }
  supplierTransactions.value = await listSupplierTransactions(selectedSupplier.value.id)
}

async function loadSelectedPartnerFeeRecords(): Promise<void> {
  if (!selectedPartner.value) {
    partnerFeeRecords.value = { items: [], total: 0 }
    return
  }
  partnerFeeRecords.value = await listPartnerFeeRecords(selectedPartner.value.id)
}

async function loadDocumentPartyLookup(): Promise<void> {
  if (!selectedDocumentParty.value) {
    documentPartyLookup.value = { items: [], total: 0 }
    return
  }
  documentPartyLookup.value = await lookupDocumentParties({
    party_type: selectedDocumentParty.value.party_type,
    customer_id: selectedDocumentParty.value.customer_id ?? undefined,
  })
}

async function loadSelectedSampleDeliveryHistories(): Promise<void> {
  const delivery = selectedSampleDelivery.value
  const firstLine = delivery?.lines[0]
  if (!delivery || !firstLine) {
    sampleDeliverySampleHistory.value = []
    sampleDeliveryQuoteHistory.value = []
    return
  }
  const [sampleHistory, quoteHistory] = await Promise.all([
    getSampleDeliverySampleHistory(firstLine.sample_record_id),
    getSampleDeliveryQuoteHistory({
      customer_id: delivery.customer_id ?? undefined,
      product_id: firstLine.product_id ?? undefined,
    }),
  ])
  sampleDeliverySampleHistory.value = sampleHistory.items
  sampleDeliveryQuoteHistory.value = quoteHistory.items
}

async function loadSelectedExportQuotationReferences(): Promise<void> {
  const quotation = selectedExportQuotation.value
  const firstLine = quotation?.lines[0]
  if (!quotation) {
    exportQuotationHistory.value = []
    exportQuotationPurchaseReferences.value = []
    exportQuotationSampleDeliveries.value = []
    return
  }
  const [history, references, deliveries] = await Promise.all([
    getExportQuotationHistory({
      customer_id: quotation.customer_id ?? undefined,
      product_id: firstLine?.product_id ?? undefined,
    }),
    getExportQuotationPurchaseReferences({
      product_id: firstLine?.product_id ?? undefined,
    }),
    getExportQuotationSampleDeliveries(quotation.id),
  ])
  exportQuotationHistory.value = history.items
  exportQuotationPurchaseReferences.value = references.items
  exportQuotationSampleDeliveries.value = deliveries.items
}

async function loadSelectedExportContractQuotationHistory(): Promise<void> {
  const contract = selectedExportContract.value
  const firstLine = contract?.lines[0]
  if (!contract || !firstLine) {
    exportContractQuotationHistory.value = []
    return
  }
  const history = await getExportQuotationHistory({
    customer_id: contract.customer_id ?? undefined,
    product_id: firstLine.product_id ?? undefined,
  })
  exportContractQuotationHistory.value = history.items
}

function syncCustomerEditForm(customer: Customer | null): void {
  if (!customer) {
    customerEditForm.cn_name = ''
    customerEditForm.en_name = ''
    customerEditForm.country = ''
    customerEditForm.address = ''
    customerEditForm.website = ''
    customerEditForm.status = 'active'
    customerEditForm.credit_grade = ''
    customerEditForm.credit_limit = ''
    customerEditForm.currency = 'USD'
    customerEditForm.payment_terms = ''
    customerEditForm.risk_note = ''
    return
  }
  customerEditForm.cn_name = customer.cn_name
  customerEditForm.en_name = customer.en_name
  customerEditForm.country = customer.country
  customerEditForm.address = customer.address ?? ''
  customerEditForm.website = customer.website ?? ''
  customerEditForm.status = customer.status
  customerEditForm.credit_grade = customer.credit_profile?.credit_grade ?? 'B'
  customerEditForm.credit_limit = customer.credit_profile?.credit_limit ?? '0'
  customerEditForm.currency = customer.credit_profile?.currency ?? 'USD'
  customerEditForm.payment_terms = customer.credit_profile?.payment_terms ?? ''
  customerEditForm.risk_note = customer.credit_profile?.risk_note ?? ''
}

function syncSupplierEditForm(supplier: Supplier | null): void {
  if (!supplier) {
    supplierEditForm.cn_name = ''
    supplierEditForm.en_name = ''
    supplierEditForm.country = ''
    supplierEditForm.address = ''
    supplierEditForm.website = ''
    supplierEditForm.status = 'active'
    supplierEditForm.credit_grade = ''
    supplierEditForm.credit_limit = ''
    supplierEditForm.currency = 'CNY'
    supplierEditForm.payment_terms = ''
    supplierEditForm.risk_note = ''
    return
  }
  supplierEditForm.cn_name = supplier.cn_name
  supplierEditForm.en_name = supplier.en_name
  supplierEditForm.country = supplier.country
  supplierEditForm.address = supplier.address ?? ''
  supplierEditForm.website = supplier.website ?? ''
  supplierEditForm.status = supplier.status
  supplierEditForm.credit_grade = supplier.credit_profile?.credit_grade ?? 'B'
  supplierEditForm.credit_limit = supplier.credit_profile?.credit_limit ?? '0'
  supplierEditForm.currency = supplier.credit_profile?.currency ?? 'CNY'
  supplierEditForm.payment_terms = supplier.credit_profile?.payment_terms ?? ''
  supplierEditForm.risk_note = supplier.credit_profile?.risk_note ?? ''
}

function syncPartnerEditForm(partner: Partner | null): void {
  if (!partner) {
    partnerEditForm.cn_name = ''
    partnerEditForm.en_name = ''
    partnerEditForm.partner_type = 'freight_forwarder'
    partnerEditForm.country = ''
    partnerEditForm.address = ''
    partnerEditForm.website = ''
    partnerEditForm.status = 'active'
    return
  }
  partnerEditForm.cn_name = partner.cn_name
  partnerEditForm.en_name = partner.en_name
  partnerEditForm.partner_type = partner.partner_type
  partnerEditForm.country = partner.country
  partnerEditForm.address = partner.address ?? ''
  partnerEditForm.website = partner.website ?? ''
  partnerEditForm.status = partner.status
}

function syncDocumentPartyEditForm(party: DocumentParty | null): void {
  if (!party) {
    documentPartyEditForm.party_type = 'consignee'
    documentPartyEditForm.display_name = ''
    documentPartyEditForm.customer_id = ''
    documentPartyEditForm.customer_name = ''
    documentPartyEditForm.country = ''
    documentPartyEditForm.address = ''
    documentPartyEditForm.contact_person = ''
    documentPartyEditForm.email = ''
    documentPartyEditForm.phone = ''
    documentPartyEditForm.bank_name = ''
    documentPartyEditForm.swift_code = ''
    documentPartyEditForm.account_no = ''
    documentPartyEditForm.tax_id = ''
    documentPartyEditForm.remarks = ''
    documentPartyEditForm.is_default = false
    documentPartyEditForm.status = 'active'
    return
  }
  documentPartyEditForm.party_type = party.party_type
  documentPartyEditForm.display_name = party.display_name
  documentPartyEditForm.customer_id = party.customer_id ?? ''
  documentPartyEditForm.customer_name = party.customer_name ?? ''
  documentPartyEditForm.country = party.country
  documentPartyEditForm.address = party.address ?? ''
  documentPartyEditForm.contact_person = party.contact_person ?? ''
  documentPartyEditForm.email = party.email ?? ''
  documentPartyEditForm.phone = party.phone ?? ''
  documentPartyEditForm.bank_name = party.bank_name ?? ''
  documentPartyEditForm.swift_code = party.swift_code ?? ''
  documentPartyEditForm.account_no = party.account_no ?? ''
  documentPartyEditForm.tax_id = party.tax_id ?? ''
  documentPartyEditForm.remarks = party.remarks ?? ''
  documentPartyEditForm.is_default = party.is_default
  documentPartyEditForm.status = party.status
}

function syncSampleDeliveryActionForms(delivery: SampleDelivery | null): void {
  sampleDeliveryApproveForm.reviewer_name = currentUser.value?.display_name ?? '演示业务主管'
  sampleDeliveryApproveForm.approved_at = delivery?.delivery_date ?? '2026-06-25'
  sampleDeliveryTrackingForm.express_company = delivery?.express_company ?? 'DHL'
  sampleDeliveryTrackingForm.tracking_no = delivery?.tracking_no ?? ''
  sampleDeliveryTrackingForm.status = delivery?.status === 'approved' ? 'shipped' : 'submitted'
}

function syncExportQuotationActionForms(quotation: ExportQuotation | null): void {
  exportQuotationApproveForm.reviewer_name = currentUser.value?.display_name ?? '演示业务主管'
  exportQuotationApproveForm.approved_at = quotation?.quote_date ?? '2026-07-02'
  exportQuotationContractForm.confirmed_at = quotation?.approved_at ?? '2026-07-03'
  exportQuotationContractForm.contract_no =
    quotation?.generated_contract_no ?? `EC-${quotation?.code ?? Date.now().toString().slice(-6)}`
}

function syncExportContractActionForms(contract: ExportContract | null): void {
  exportContractApproveForm.reviewer_name = currentUser.value?.display_name ?? '演示业务主管'
  exportContractApproveForm.approved_at = contract?.contract_date ?? '2026-07-06'
  exportContractSignatureForm.signed_at = contract?.contract_date ?? '2026-07-04'
  exportContractSignatureForm.file_no = `SIGN-${contract?.code ?? Date.now().toString().slice(-6)}`
  exportContractAdvancePaymentForm.payment_no = `AR-${contract?.code ?? Date.now().toString().slice(-6)}`
  exportContractAdvancePaymentForm.received_at = contract?.contract_date ?? '2026-07-05'
  exportContractAdvancePaymentForm.currency = contract?.currency ?? 'USD'
  exportContractAdvancePaymentForm.payer_name = contract?.customer_name ?? ''
  exportContractExportPreview.value = ''
}

function syncShipmentActionForms(shipment: ShipmentPlan | null): void {
  shipmentApproveForm.reviewer_name = currentUser.value?.display_name ?? '演示业务主管'
  shipmentApproveForm.approved_at = shipment?.shipment_date ?? '2026-08-19'
}

function syncPurchaseInquiryActionForms(inquiry: PurchaseInquiry | null): void {
  const firstQuote = inquiry?.quotations[0]
  purchaseInquiryTemplateForm.template_name = inquiry?.template_name ?? '标准采购询价模板'
  purchaseInquiryTemplateForm.recipient_emails = firstQuote?.supplier_id
    ? `${firstQuote.supplier_id}@example.com`
    : 'supplier@example.com'
  purchaseQuotationForm.currency = firstQuote?.currency ?? 'USD'
  purchaseQuotationForm.quoted_at = inquiry?.inquiry_date ?? '2026-08-02'
  if (!firstQuote) return
  purchaseQuotationForm.supplier_id = firstQuote.supplier_id ?? ''
  purchaseQuotationForm.supplier_name = firstQuote.supplier_name
  purchaseQuotationForm.unit_price = firstQuote.unit_price
  purchaseQuotationForm.lead_time_days = String(firstQuote.lead_time_days ?? '')
  purchaseQuotationForm.min_order_quantity = firstQuote.min_order_quantity ?? ''
  purchaseQuotationForm.sample_available = firstQuote.sample_available
  purchaseQuotationForm.remark = firstQuote.remark ?? ''
}

function syncPurchaseContractActionForms(contract: PurchaseContract | null): void {
  purchaseContractApproveForm.reviewer_name = currentUser.value?.display_name ?? '演示业务主管'
  purchaseContractApproveForm.approved_at = contract?.contract_date ?? '2026-08-05'
  if (!contract) return
  purchaseContractGenerateForm.supplier_id = contract.supplier_id ?? purchaseContractGenerateForm.supplier_id
  purchaseContractGenerateForm.supplier_name = contract.supplier_name
  purchaseContractGenerateForm.currency = contract.currency
  purchaseContractForm.supplier_id = contract.supplier_id ?? purchaseContractForm.supplier_id
  purchaseContractForm.supplier_name = contract.supplier_name
  purchaseContractForm.currency = contract.currency
}

function syncPurchaseInvoiceNoticeActionForms(notice: PurchaseInvoiceNotice | null): void {
  purchaseInvoiceNoticeSendForm.sender_name = currentUser.value?.display_name ?? '演示业务主管'
  purchaseInvoiceNoticeSendForm.sent_at = notice?.notice_date ?? '2026-09-05'
  purchaseInvoiceNoticeReceiveForm.received_at = notice?.sent_at ?? '2026-09-09'
}

function syncFollowupForms(
  template: FollowProcessTemplate | null,
  plan: PurchaseFollowPlan | null,
): void {
  fillFollowupTemplateForm(template)
  if (!plan) return
  followupPlanForm.purchase_contract_id = plan.purchase_contract_id
  followupPlanForm.as_of = plan.base_date
  followupSourceEventForm.purchase_contract_id = plan.purchase_contract_id
  const firstPending = plan.nodes.find((node) => node.status !== 'completed')
  if (firstPending) {
    followupSourceEventForm.node_code = firstPending.node_code
    followupSourceEventForm.actual_date = firstPending.planned_date
    followupSourceEventForm.source_record_id = `${firstPending.node_code}-source`
    followupSourceEventForm.source_summary = `${firstPending.node_name}完成`
    followupSourceEventForm.source_record_type = followupSourceTypeForNode(firstPending.node_code)
  }
}

function fillQualityInspectionForm(inspection: QualityInspection | null): void {
  if (!inspection) {
    editingQualityInspectionId.value = null
    qualityInspectionForm.code = nextQualityInspectionCode()
    qualityInspectionForm.purchase_contract_id = qualityInspectionContractFilter.value.trim()
    qualityInspectionForm.inspected_at = '2026-08-19'
    qualityInspectionForm.result = 'passed'
    qualityInspectionForm.inspector_id = 'u-qc-001'
    qualityInspectionForm.inspector_name = currentUser.value?.display_name ?? 'QC 张工'
    qualityInspectionForm.issue_summary = ''
    qualityInspectionForm.attachment_group_id = 'attach-qc-demo'
    qualityInspectionForm.purchase_contract_line_id = ''
    qualityInspectionForm.product_id = 'product-bag'
    qualityInspectionForm.product_code = 'BAG-40'
    qualityInspectionForm.product_name = 'Eco Shopping Bag'
    qualityInspectionForm.inspected_quantity = '120'
    qualityInspectionForm.failed_quantity = '0'
    qualityInspectionForm.unit = 'pcs'
    qualityInspectionForm.line_result = 'passed'
    qualityInspectionForm.line_remark = '首检通过'
    qualityInspectionForm.issue_type = '包装破损'
    qualityInspectionForm.severity = 'major'
    qualityInspectionForm.description = ''
    qualityInspectionForm.corrective_action = ''
    qualityInspectionForm.issue_status = 'open'
    qualityInspectionForm.issue_attachment_group_id = ''
    return
  }

  const firstLine = inspection.lines[0]
  const firstIssue = inspection.issues[0]
  editingQualityInspectionId.value = inspection.id
  qualityInspectionForm.code = inspection.code
  qualityInspectionForm.purchase_contract_id = inspection.purchase_contract_id
  qualityInspectionForm.inspected_at = inspection.inspected_at
  qualityInspectionForm.result = inspection.result
  qualityInspectionForm.inspector_id = inspection.inspector_id ?? ''
  qualityInspectionForm.inspector_name = inspection.inspector_name
  qualityInspectionForm.issue_summary = inspection.issue_summary ?? ''
  qualityInspectionForm.attachment_group_id = inspection.attachment_group_id ?? ''
  qualityInspectionForm.purchase_contract_line_id =
    firstLine?.purchase_contract_line_id ?? ''
  qualityInspectionForm.product_id = firstLine?.product_id ?? ''
  qualityInspectionForm.product_code = firstLine?.product_code ?? ''
  qualityInspectionForm.product_name = firstLine?.product_name ?? ''
  qualityInspectionForm.inspected_quantity = firstLine?.inspected_quantity ?? '1'
  qualityInspectionForm.failed_quantity = firstLine?.failed_quantity ?? '0'
  qualityInspectionForm.unit = firstLine?.unit ?? 'pcs'
  qualityInspectionForm.line_result = firstLine?.result ?? inspection.result
  qualityInspectionForm.line_remark = firstLine?.remark ?? ''
  qualityInspectionForm.issue_type = firstIssue?.issue_type ?? '包装破损'
  qualityInspectionForm.severity = firstIssue?.severity ?? 'major'
  qualityInspectionForm.description = firstIssue?.description ?? ''
  qualityInspectionForm.corrective_action = firstIssue?.corrective_action ?? ''
  qualityInspectionForm.issue_status = firstIssue?.status ?? 'open'
  qualityInspectionForm.issue_attachment_group_id = firstIssue?.attachment_group_id ?? ''
}

function syncInboundPlanForms(plan: InboundPlan | null): void {
  if (!plan) return
  inboundPlanGenerateForm.purchase_contract_id = plan.purchase_contract_id
  inboundPlanGenerateForm.inbound_type = plan.inbound_type
  inboundPlanGenerateForm.planned_date = plan.planned_date
  inboundPlanScheduleForm.planned_date = plan.planned_date
  inboundPlanScheduleForm.warehouse_id = plan.warehouse_id ?? 'wh-ningbo'
  inboundPlanScheduleForm.warehouse_name = plan.warehouse_name ?? '宁波总仓'
  inboundPlanScheduleForm.location_id = plan.location_id ?? 'loc-a-01'
  inboundPlanScheduleForm.location_name = plan.location_name ?? 'A-01'
  inboundPlanScheduleForm.operator_name = plan.operator_name ?? '仓库主管'
}

function syncInboundOrderForms(order: InboundOrder | null): void {
  const plan = selectedInboundPlan.value
  if (!order) {
    inboundOrderForm.plan_id = plan?.id ?? inboundOrderForm.plan_id
    inboundOrderForm.warehouse_id = plan?.warehouse_id ?? 'wh-ningbo'
    inboundOrderForm.warehouse_name = plan?.warehouse_name ?? '宁波总仓'
    inboundOrderForm.location_id = plan?.location_id ?? 'loc-a-01'
    inboundOrderForm.location_name = plan?.location_name ?? 'A-01'
    inboundOrderForm.operator_name = plan?.operator_name ?? '仓库主管'
    return
  }
  inboundOrderForm.plan_id = order.plan_id
  inboundOrderForm.inbound_mode = order.inbound_mode
  inboundOrderForm.inbound_at = order.inbound_at
  inboundOrderForm.warehouse_id = order.warehouse_id
  inboundOrderForm.warehouse_name = order.warehouse_name
  inboundOrderForm.location_id = order.location_id
  inboundOrderForm.location_name = order.location_name
  inboundOrderForm.operator_name = order.operator_name
  inboundOrderApprovalForm.reviewer_name =
    order.reviewer_name ?? currentUser.value?.display_name ?? '演示业务主管'
  inboundOrderApprovalForm.approved_at = order.approved_at ?? order.inbound_at
}

function syncOutboundPlanForms(plan: OutboundPlan | null): void {
  if (!plan) {
    const approvedShipment = shipments.value.find((item) => item.approval_status === 'approved')
    outboundPlanGenerateForm.shipment_plan_id =
      approvedShipment?.id ?? outboundPlanGenerateForm.shipment_plan_id
    outboundPlanGenerateForm.planned_date =
      approvedShipment?.planned_ship_date ?? outboundPlanGenerateForm.planned_date
    return
  }
  outboundPlanGenerateForm.shipment_plan_id = plan.source_id
  outboundPlanGenerateForm.outbound_type = plan.outbound_type
  outboundPlanGenerateForm.planned_date = plan.planned_date
  outboundPlanScheduleForm.planned_date = plan.planned_date
  outboundPlanScheduleForm.warehouse_id = plan.warehouse_id ?? 'wh-ningbo'
  outboundPlanScheduleForm.warehouse_name = plan.warehouse_name ?? '宁波总仓'
  outboundPlanScheduleForm.location_id = plan.location_id ?? 'loc-fg-01'
  outboundPlanScheduleForm.location_name = plan.location_name ?? '成品区 A-01'
  outboundPlanScheduleForm.operator_name = plan.operator_name ?? '仓库主管'
}

function syncOutboundOrderForms(order: OutboundOrder | null): void {
  if (!order) {
    const scheduledPlan =
      outboundPlans.value.find((item) => item.status === 'scheduled') ?? outboundPlans.value[0]
    outboundOrderForm.plan_id = scheduledPlan?.id ?? outboundOrderForm.plan_id
    outboundOrderForm.outbound_at = scheduledPlan?.planned_date ?? outboundOrderForm.outbound_at
    outboundOrderForm.warehouse_id = scheduledPlan?.warehouse_id ?? outboundOrderForm.warehouse_id
    outboundOrderForm.warehouse_name =
      scheduledPlan?.warehouse_name ?? outboundOrderForm.warehouse_name
    outboundOrderForm.location_id = scheduledPlan?.location_id ?? outboundOrderForm.location_id
    outboundOrderForm.location_name =
      scheduledPlan?.location_name ?? outboundOrderForm.location_name
    outboundOrderForm.operator_name =
      scheduledPlan?.operator_name ?? outboundOrderForm.operator_name
    outboundOrderApprovalForm.approved_at = outboundOrderForm.outbound_at
    return
  }
  outboundOrderForm.plan_id = order.plan_id
  outboundOrderForm.code = order.code
  outboundOrderForm.outbound_mode = order.outbound_mode
  outboundOrderForm.outbound_at = order.outbound_at
  outboundOrderForm.warehouse_id = order.warehouse_id
  outboundOrderForm.warehouse_name = order.warehouse_name
  outboundOrderForm.location_id = order.location_id
  outboundOrderForm.location_name = order.location_name
  outboundOrderForm.operator_name = order.operator_name
  outboundOrderForm.exception_reason = order.exception_reason ?? ''
  outboundOrderApprovalForm.reviewer_name =
    order.reviewer_name ?? currentUser.value?.display_name ?? '演示业务主管'
  outboundOrderApprovalForm.approved_at = order.approved_at ?? order.outbound_at
}

function selectQualityInspection(inspectionId: string): void {
  selectedQualityInspectionId.value = inspectionId
  fillQualityInspectionForm(selectedQualityInspection.value)
  void refreshQualityInboundEligibility()
}

function selectInboundPlan(planId: string): void {
  selectedInboundPlanId.value = planId
  syncInboundPlanForms(selectedInboundPlan.value)
  syncInboundOrderForms(isWarehouseInboundOrderPage.value ? null : selectedInboundOrder.value)
}

function selectInboundOrder(orderId: string): void {
  selectedInboundOrderId.value = orderId
  syncInboundOrderForms(selectedInboundOrder.value)
  void loadInventorySnapshot()
}

function selectOutboundPlan(planId: string): void {
  selectedOutboundPlanId.value = planId
  syncOutboundPlanForms(selectedOutboundPlan.value)
}

function selectOutboundOrder(orderId: string): void {
  selectedOutboundOrderId.value = orderId
  syncOutboundOrderForms(selectedOutboundOrder.value)
  void loadOutboundInventorySnapshot()
}

function syncOutboundPlanFromShipment(): void {
  const shipment = shipments.value.find((item) => item.id === outboundPlanGenerateForm.shipment_plan_id)
  if (!shipment) return
  outboundPlanGenerateForm.planned_date = shipment.planned_ship_date
  outboundPlanScheduleForm.planned_date = shipment.planned_ship_date
}

function syncOutboundOrderFromPlan(): void {
  const plan = outboundPlans.value.find((item) => item.id === outboundOrderForm.plan_id)
  if (!plan) return
  outboundOrderForm.outbound_at = plan.planned_date
  outboundOrderForm.warehouse_id = plan.warehouse_id ?? outboundOrderForm.warehouse_id
  outboundOrderForm.warehouse_name = plan.warehouse_name ?? outboundOrderForm.warehouse_name
  outboundOrderForm.location_id = plan.location_id ?? outboundOrderForm.location_id
  outboundOrderForm.location_name = plan.location_name ?? outboundOrderForm.location_name
  outboundOrderForm.operator_name = plan.operator_name ?? outboundOrderForm.operator_name
  outboundOrderApprovalForm.approved_at = plan.planned_date
}

function startNewQualityInspection(): void {
  selectedQualityInspectionId.value = null
  fillQualityInspectionForm(null)
  qualityInboundEligibility.value = null
}

function formatDateTime(value: string | null): string {
  if (!value) return '未设置'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatPercent(value: string): string {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return value
  return `${(numeric * 100).toFixed(2).replace(/\.?0+$/, '')}%`
}

function accessoryRuleLabel(value: string): string {
  return value === 'by_accessory' ? '按配件分单' : '按供应商分单'
}

function customerStatusLabel(value: string): string {
  return value === 'inactive' ? '停用' : '有效'
}

function partnerTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    carrier: '运输公司',
    express: '快件公司',
    freight_forwarder: '货代公司',
    insurer: '保险公司',
  }
  return labels[value] ?? value
}

function documentPartyTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    bill_notify_party: '提单通知人',
    consignee: '收货人',
    issuing_bank: '开证行',
    notify_party: '通知人',
  }
  return labels[value] ?? value
}

function sampleStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    cancelled: '已取消',
    completed: '已完成',
    draft: '草稿',
    in_progress: '进行中',
    sent: '已发送',
  }
  return labels[value] ?? value
}

function sampleDestinationLabel(value: string): string {
  return value === 'factory' ? '外发工厂' : '内部打样'
}

function sampleStageLabel(value: string): string {
  const labels: Record<string, string> = {
    confirmed: '客户确认',
    internal_order: '内部打样单',
    received_sample: '收到样品',
    sent_to_factory: '外发工厂',
  }
  return labels[value] ?? value
}

function sampleFeeTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    delivery: '寄送费',
    material: '材料费',
    sample_making: '打样费',
  }
  return labels[value] ?? value
}

function samplePaymentStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    not_requested: '未申请',
    paid: '已付款',
    requested: '已申请',
  }
  return labels[value] ?? value
}

function sampleRecordTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    bulk_sample: '大货样',
    confirm_sample: '确认样',
    incoming: '来样',
    retained_sample: '留样',
  }
  return labels[value] ?? value
}

function sampleRecordStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    archived: '归档',
    confirmed: '已确认',
    registered: '已登记',
    submitted: '已提交',
  }
  return labels[value] ?? value
}

function sampleSourceTypeLabel(value: string | null): string {
  const labels: Record<string, string> = {
    customer_sample: '客户来样',
    manual: '手工登记',
    purchase_contract: '采购合同',
    sample_request: '打样管理',
  }
  return value ? labels[value] ?? value : '未指定'
}

function sampleStockEventLabel(value: string): string {
  return value === 'delivered' ? '寄样' : '收样'
}

function sampleDeliveryStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    approved: '已审核',
    draft: '草稿',
    rejected: '已退回',
    shipped: '已寄出',
    submitted: '待审核',
  }
  return labels[value] ?? value
}

function sampleDeliveryFeeTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    express: '快递费',
    insurance: '保险费',
    other: '其他费用',
  }
  return labels[value] ?? value
}

function sampleDeliveryPayerTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    company: '公司承担',
    customer: '客户承担',
    supplier: '供应商承担',
  }
  return labels[value] ?? value
}

function exportQuotationStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    approved: '已审批',
    contract_generated: '已生成合同',
    draft: '草稿',
    rejected: '已退回',
    submitted: '待审批',
  }
  return labels[value] ?? value
}

function exportContractStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    approved: '已审批',
    draft: '草稿',
    rejected: '已退回',
    submitted: '待审批',
  }
  return labels[value] ?? value
}

function shipmentStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    approved: '已审批',
    draft: '草稿',
    rejected: '已退回',
    submitted: '待审批',
  }
  return labels[value] ?? value
}

function purchaseInquiryStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    closed: '已关闭',
    draft: '草稿',
    quoted: '已报价',
    sent: '已发模板',
  }
  return labels[value] ?? value
}

function purchaseContractStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    approved: '已审批',
    draft: '草稿',
    submitted: '待审批',
  }
  return labels[value] ?? value
}

function purchaseContractSourceTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    export_contract: '出口合同生成',
    manual: '手工采购',
    stock_purchase: '库存采购',
  }
  return labels[value] ?? value
}

function purchaseInvoiceNoticeStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    draft: '草稿',
    received: '已收票',
    sent: '已发送',
  }
  return labels[value] ?? value
}

function followupPlanStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    completed: '已完成',
    in_progress: '进行中',
    overdue: '已逾期',
    pending: '待跟进',
  }
  return labels[value] ?? value
}

function followupNodeStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    completed: '已完成',
    in_progress: '进行中',
    overdue: '已逾期',
    pending: '待完成',
  }
  return labels[value] ?? value
}

function followupNodeLabel(value: string): string {
  const labels: Record<string, string> = {
    bulk_sample_submitted: '大货样提交',
    confirm_sample_submitted: '确认样提交',
    contract_confirmed: '合同下单确立',
    inbound_completed: '入库',
    outbound_completed: '出库',
    quality_inspection: 'QC 查验',
  }
  return labels[value] ?? value
}

function followupSourceTypeLabel(value: string | null): string {
  const labels: Record<string, string> = {
    inventory_inbound: '入库单',
    inventory_outbound: '出库单',
    quality_inspection: 'QC 查验',
    sample_followup_event: '样品事件',
  }
  return value ? labels[value] ?? value : '未回写'
}

function followupSourceTypeForNode(nodeCode: string): string {
  const sources: Record<string, string> = {
    bulk_sample_submitted: 'sample_followup_event',
    confirm_sample_submitted: 'sample_followup_event',
    inbound_completed: 'inventory_inbound',
    outbound_completed: 'inventory_outbound',
    quality_inspection: 'quality_inspection',
  }
  return sources[nodeCode] ?? 'quality_inspection'
}

function qualityInspectionResultLabel(value: string | null): string {
  const labels: Record<string, string> = {
    failed: '不通过',
    partial_passed: '部分通过',
    passed: '通过',
    recheck_required: '待复检',
  }
  return value ? labels[value] ?? value : '未查验'
}

function qualityIssueSeverityLabel(value: string): string {
  const labels: Record<string, string> = {
    critical: '严重',
    major: '主要',
    minor: '轻微',
  }
  return labels[value] ?? value
}

function qualityIssueStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    open: '处理中',
    resolved: '已解决',
  }
  return labels[value] ?? value
}

function inboundEligibilityLabel(value: QualityInspectionInboundEligibility): string {
  return value.eligible ? '可入库' : '需拦截'
}

function inboundPlanTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    material_inbound: '配料入库',
    packaging_inbound: '包装入库',
    processing_inbound: '加工入库',
    production_inbound: '生产入库',
    purchase_inbound: '采购入库',
    sterilization_inbound: '灭菌入库',
  }
  return labels[value] ?? value
}

function inboundPlanStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    cancelled: '已取消',
    closed: '已关闭',
    planned: '待安排',
    scheduled: '已排库位',
  }
  return labels[value] ?? value
}

function inboundPlanLineStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    closed: '已入库',
    partial: '部分入库',
    pending: '待入库',
    received: '已入库',
  }
  return labels[value] ?? value
}

function inboundOrderModeLabel(value: string): string {
  const labels: Record<string, string> = {
    formal: '正式入库',
    pending_inspection: '待检入库',
  }
  return labels[value] ?? value
}

function inboundOrderStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    approved: '已审批',
    cancelled: '已取消',
    draft: '草稿',
    submitted: '待审批',
  }
  return labels[value] ?? value
}

function stockStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    available: '可用',
    pending_inspection: '待检',
  }
  return labels[value] ?? value
}

function inventoryDirectionLabel(value: string): string {
  const labels: Record<string, string> = {
    in: '入库',
    out: '出库',
  }
  return labels[value] ?? value
}

function outboundPlanTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    finished_goods_outbound: '成品出库',
    material_outbound: '配料出库',
    processing_outbound: '加工发料',
    production_outbound: '生产出库',
  }
  return labels[value] ?? value
}

function outboundPlanSourceTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    processing_issue: '加工发料单',
    production_requisition: '生产领料单',
    shipment_plan: '发货计划',
  }
  return labels[value] ?? value
}

function outboundPlanStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    cancelled: '已取消',
    closed: '已关闭',
    planned: '待安排',
    scheduled: '已排库位',
  }
  return labels[value] ?? value
}

function outboundPlanLineStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    closed: '已出库',
    partial: '部分出库',
    pending: '待出库',
    shipped: '已出库',
  }
  return labels[value] ?? value
}

function outboundOrderModeLabel(value: string): string {
  const labels: Record<string, string> = {
    exception: '异常出库',
    formal: '正式出库',
  }
  return labels[value] ?? value
}

function outboundOrderStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    approved: '已出库',
    cancelled: '已取消',
    draft: '草稿',
    submitted: '待审批',
  }
  return labels[value] ?? value
}

function purchaseReminderTypeLabel(value: string): string {
  const labels: Record<string, string> = {
    delivery: '交货提醒',
    payment: '付款提醒',
  }
  return labels[value] ?? value
}

function progressStatusLabel(value: string): string {
  const labels: Record<string, string> = {
    completed: '已完成',
    partial: '部分完成',
    pending: '待处理',
  }
  return labels[value] ?? value
}

function freightMethodLabel(value: string): string {
  const labels: Record<string, string> = {
    air: '空运',
    courier: '快递',
    rail: '铁路',
    sea: '海运',
  }
  return labels[value] ?? value
}

function formatMoney(value: string | null | undefined, currency = ''): string {
  if (!value) return '未设置'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return value
  const amount = numeric.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currency ? `${currency} ${amount}` : amount
}

function syncPathFromLocation(): void {
  activePath.value = normalizePath(window.location.pathname)
  void loadActivePage()
}

let refreshTimer: number | undefined

onMounted(() => {
  if (isAuthenticated.value) {
    void loadSession().then(loadActivePage).catch(() => {
      logout()
    })
  }
  window.addEventListener('popstate', syncPathFromLocation)
  refreshTimer = window.setInterval(() => {
    if (isAuthenticated.value && isDashboard.value) {
      void loadDashboard()
    }
  }, 60_000)
})

onUnmounted(() => {
  window.removeEventListener('popstate', syncPathFromLocation)
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
  }
})
</script>

<template>
  <main v-if="!isAuthenticated" class="login-shell">
    <section class="login-panel">
      <div class="brand login-brand">
        <div class="brand-mark">XP</div>
        <div>
          <strong>新裴贸易</strong>
          <span>业务管理系统</span>
        </div>
      </div>
      <h1>登录工作台</h1>
      <form class="login-form" @submit.prevent="submitLogin">
        <label>
          用户名
          <input v-model="loginForm.username" autocomplete="username" required />
        </label>
        <label>
          密码
          <input
            v-model="loginForm.password"
            autocomplete="current-password"
            required
            type="password"
          />
        </label>
        <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>
        <button class="primary-button" type="submit" :disabled="isLoading">
          登录
        </button>
      </form>
    </section>
  </main>

  <main v-else class="shell">
    <aside class="sidebar" aria-label="主导航">
      <div class="brand">
        <div class="brand-mark">XP</div>
        <div>
          <strong>新裴贸易</strong>
          <span>业务管理系统</span>
        </div>
      </div>
      <nav>
        <a
          v-for="item in menus"
          :key="item.id"
          class="nav-link"
          :class="{ active: item.path === activePath }"
          :href="item.path"
          @click.prevent="navigateTo(item.path)"
        >
          <component :is="menuIcon(item.icon)" :size="18" />
          {{ item.label }}
        </a>
      </nav>
      <div class="user-block" v-if="currentUser">
        <strong>{{ currentUser.display_name }}</strong>
        <span>{{ currentUser.department_name }} · {{ currentUser.roles.join('、') }}</span>
        <button class="text-button" type="button" @click="logout">
          <LogOut :size="16" />
          退出登录
        </button>
      </div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div>
          <p class="eyebrow">{{ activeMenu?.label ?? '工作桌面' }}</p>
          <h1 v-if="isDashboard">待办、提醒和日程</h1>
          <h1 v-else-if="isProductPage">商品资料和配件明细</h1>
          <h1 v-else-if="isCustomerPage">客户资料和信用联系人</h1>
          <h1 v-else-if="isSupplierPage">供应商资料和信用联系人</h1>
          <h1 v-else-if="isPartnerPage">合作伙伴和费用联系人</h1>
          <h1 v-else-if="isDocumentPartyPage">单证资料和常用引用</h1>
          <h1 v-else-if="isSampleRequestPage">打样管理和费用进度</h1>
          <h1 v-else-if="isSampleRecordPage">样品登记和数量台账</h1>
          <h1 v-else-if="isSampleDeliveryPage">寄样管理和费用统计</h1>
          <h1 v-else-if="isExportQuotationPage">出口报价和历史参考</h1>
          <h1 v-else-if="isExportContractPage">出口合同和履约跟踪</h1>
          <h1 v-else-if="isShipmentPage">出货明细和出运计划</h1>
          <h1 v-else-if="isPurchaseInquiryPage">采购询价和供应商报价</h1>
          <h1 v-else-if="isPurchaseContractPage">采购合同和付款交货提醒</h1>
          <h1 v-else-if="isPurchaseInvoiceNoticePage">开票通知和税票催收</h1>
          <h1 v-else-if="isPurchaseFollowupPage">采购跟单和逾期预警</h1>
          <h1 v-else-if="isQualityInspectionPage">QC 查验和入库判定</h1>
          <h1 v-else-if="isWarehouseInboundPlanPage">入库计划和库位预安排</h1>
          <h1 v-else-if="isWarehouseInboundOrderPage">货物入库和库存台账</h1>
          <h1 v-else-if="isWarehouseOutboundPlanPage">出库计划和待出库清单</h1>
          <h1 v-else-if="isWarehouseOutboundOrderPage">货物出库和出库记录</h1>
          <h1 v-else>模块建设中</h1>
        </div>
        <button class="icon-button" type="button" :disabled="isLoading" @click="loadActivePage">
          <RefreshCw :size="18" />
          <span>刷新</span>
        </button>
      </header>

      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

      <template v-if="isDashboard">
        <section class="summary-strip" aria-label="工作概览">
          <div v-for="item in summaryItems" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <section class="desktop-grid">
          <section class="panel wide">
            <div class="panel-heading">
              <h2>我的待办</h2>
              <span>{{ dashboard?.todos.length ?? 0 }} 项</span>
            </div>
            <ol class="task-list">
              <li v-for="todo in dashboard?.todos" :key="todo.id" class="task-row">
                <div>
                  <strong>{{ todo.title }}</strong>
                  <span>{{ todo.source_type }} · {{ todo.source_id ?? '无来源单据' }}</span>
                </div>
                <time>{{ formatDateTime(todo.due_at) }}</time>
              </li>
            </ol>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>消息提醒</h2>
              <AlertTriangle :size="18" />
            </div>
            <article v-for="item in dashboard?.notifications" :key="item.id" class="notice-item">
              <strong>{{ item.title }}</strong>
              <p>{{ item.message }}</p>
            </article>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>公司公告</h2>
              <span>{{ dashboard?.announcements.length ?? 0 }} 条</span>
            </div>
            <article v-for="item in dashboard?.announcements" :key="item.id" class="notice-item">
              <strong>{{ item.title }}</strong>
              <p>{{ item.content }}</p>
            </article>
          </section>

          <section class="panel wide">
            <div class="panel-heading">
              <h2>我的日程</h2>
              <CalendarClock :size="18" />
            </div>
            <div class="schedule-layout">
              <ol class="schedule-list">
                <li
                  v-for="event in dashboard?.schedule_events"
                  :key="event.id"
                  class="schedule-row"
                >
                  <time>{{ formatDateTime(event.starts_at) }}</time>
                  <div>
                    <strong>{{ event.title }}</strong>
                    <span>{{ event.description ?? '无备注' }}</span>
                  </div>
                </li>
              </ol>

              <form class="schedule-form" @submit.prevent="submitSchedule">
                <label>
                  标题
                  <input v-model="form.title" required maxlength="200" />
                </label>
                <label>
                  说明
                  <textarea v-model="form.description" rows="3" maxlength="2000" />
                </label>
                <div class="form-pair">
                  <label>
                    开始
                    <input v-model="form.starts_at" required type="datetime-local" />
                  </label>
                  <label>
                    结束
                    <input v-model="form.ends_at" required type="datetime-local" />
                  </label>
                </div>
                <button class="primary-button" type="submit">
                  <Plus :size="18" />
                  <span>新增日程</span>
                </button>
              </form>
            </div>
          </section>

          <section class="panel">
            <div class="panel-heading">
              <h2>快捷入口</h2>
              <span>{{ dashboard?.shortcuts.length ?? 0 }} 个</span>
            </div>
            <div class="shortcut-list">
              <a
                v-for="item in dashboard?.shortcuts"
                :key="item.id"
                :href="item.target_path"
              >
                {{ item.label }}
              </a>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="isProductPage">
        <section class="summary-strip product-summary" aria-label="商品概览">
          <div v-for="item in productStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="productMessage" class="success-banner">{{ productMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>商品列表</h2>
              <form class="search-form" @submit.prevent="loadProducts">
                <label>
                  <span>商品搜索</span>
                  <input v-model="productSearch" placeholder="编号 / 名称 / 海关编码" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
                <button class="icon-button compact" type="button" @click="submitExport">
                  <Download :size="16" />
                  <span>导出</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>产品编号</th>
                    <th>中文名称</th>
                    <th>英文名称</th>
                    <th>海关编码</th>
                    <th>税率</th>
                    <th>退税率</th>
                    <th>配件</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="product in products"
                    :key="product.id"
                    :class="{ selected: product.id === selectedProduct?.id }"
                    @click="selectProduct(product.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ product.code }}</button>
                    </td>
                    <td>{{ product.cn_name }}</td>
                    <td>{{ product.en_name }}</td>
                    <td>{{ product.customs_code }}</td>
                    <td>{{ formatPercent(product.tax_rate) }}</td>
                    <td>{{ formatPercent(product.rebate_rate) }}</td>
                    <td>{{ product.accessories.length }}</td>
                  </tr>
                  <tr v-if="products.length === 0">
                    <td colspan="7" class="empty-cell">暂无商品资料</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>新增商品</h2>
              <Package :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitProduct">
              <div class="form-pair two">
                <label>
                  产品编号
                  <input v-model="productForm.code" required maxlength="80" />
                </label>
                <label>
                  商品单位
                  <input v-model="productForm.unit" required maxlength="40" />
                </label>
              </div>
              <label>
                中文名称
                <input v-model="productForm.cn_name" required maxlength="200" />
              </label>
              <label>
                英文名称
                <input v-model="productForm.en_name" required maxlength="200" />
              </label>
              <div class="form-pair two">
                <label>
                  规格
                  <input v-model="productForm.specification" maxlength="200" />
                </label>
                <label>
                  型号
                  <input v-model="productForm.model" maxlength="120" />
                </label>
              </div>
              <div class="form-pair three">
                <label>
                  海关编码
                  <input v-model="productForm.customs_code" required maxlength="40" />
                </label>
                <label>
                  税率
                  <input v-model="productForm.tax_rate" required max="1" min="0" step="0.01" type="number" />
                </label>
                <label>
                  退税率
                  <input v-model="productForm.rebate_rate" required max="1" min="0" step="0.01" type="number" />
                </label>
              </div>
              <label>
                包装资料
                <textarea v-model="productForm.package_info" required rows="3" maxlength="2000" />
              </label>
              <label>
                图片地址
                <input v-model="productForm.image_url" maxlength="2000" />
              </label>

              <div class="form-divider">首个配件</div>
              <div class="form-pair two">
                <label>
                  配件名称
                  <input v-model="productForm.accessory_name" required maxlength="200" />
                </label>
                <label>
                  配件单位
                  <input v-model="productForm.accessory_unit" required maxlength="40" />
                </label>
              </div>
              <div class="form-pair two">
                <label>
                  单耗
                  <input
                    v-model="productForm.accessory_unit_consumption"
                    required
                    min="0.0001"
                    step="0.0001"
                    type="number"
                  />
                </label>
                <label>
                  默认供应商
                  <input v-model="productForm.accessory_supplier" maxlength="200" />
                </label>
              </div>
              <label>
                分单规则
                <select v-model="productForm.accessory_rule">
                  <option value="by_supplier">按供应商分单</option>
                  <option value="by_accessory">按配件分单</option>
                </select>
              </label>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>新增商品</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>商品明细</h2>
              <span>{{ selectedProduct?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedProduct" class="product-detail">
              <div class="product-photo">
                <img v-if="selectedProduct.image_url" :src="selectedProduct.image_url" alt="" />
                <Package v-else :size="42" />
              </div>
              <dl class="detail-list">
                <div>
                  <dt>中文名称</dt>
                  <dd>{{ selectedProduct.cn_name }}</dd>
                </div>
                <div>
                  <dt>英文名称</dt>
                  <dd>{{ selectedProduct.en_name }}</dd>
                </div>
                <div>
                  <dt>规格型号</dt>
                  <dd>{{ selectedProduct.specification ?? '未填' }} / {{ selectedProduct.model ?? '未填' }}</dd>
                </div>
                <div>
                  <dt>包装资料</dt>
                  <dd>{{ selectedProduct.package_info }}</dd>
                </div>
              </dl>

              <div class="accessory-heading">
                <strong>配件明细</strong>
                <span>{{ selectedProduct.accessories.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>配件名称</th>
                    <th>单耗</th>
                    <th>单位</th>
                    <th>供应商</th>
                    <th>规则</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in selectedProduct.accessories" :key="item.id">
                    <td>{{ item.accessory_name }}</td>
                    <td>{{ item.unit_consumption }}</td>
                    <td>{{ item.unit }}</td>
                    <td>{{ item.default_supplier_name ?? '未指定' }}</td>
                    <td>{{ accessoryRuleLabel(item.purchase_split_rule) }}</td>
                  </tr>
                </tbody>
              </table>

              <form class="record-form accessory-form" @submit.prevent="submitAccessory">
                <div class="form-divider">追加配件</div>
                <div class="form-pair two">
                  <label>
                    追加配件名称
                    <input v-model="accessoryForm.accessory_name" required maxlength="200" />
                  </label>
                  <label>
                    追加单位
                    <input v-model="accessoryForm.unit" required maxlength="40" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label>
                    追加单耗
                    <input
                      v-model="accessoryForm.unit_consumption"
                      required
                      min="0.0001"
                      step="0.0001"
                      type="number"
                    />
                  </label>
                  <label>
                    追加供应商
                    <input v-model="accessoryForm.default_supplier_name" maxlength="200" />
                  </label>
                </div>
                <label>
                  追加分单规则
                  <select v-model="accessoryForm.purchase_split_rule">
                    <option value="by_supplier">按供应商分单</option>
                    <option value="by_accessory">按配件分单</option>
                  </select>
                </label>
                <button class="secondary-button" type="submit">
                  <Plus :size="18" />
                  <span>追加配件</span>
                </button>
              </form>
            </div>
          </section>

          <section v-if="productExportPreview" class="panel export-panel">
            <div class="panel-heading">
              <h2>导出预览</h2>
              <Download :size="18" />
            </div>
            <pre>{{ productExportPreview }}</pre>
          </section>
        </section>
      </template>

      <template v-else-if="isCustomerPage">
        <section class="summary-strip product-summary" aria-label="客户概览">
          <div v-for="item in customerStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="customerMessage" class="success-banner">{{ customerMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>客户列表</h2>
              <form class="search-form" @submit.prevent="loadCustomers">
                <label>
                  <span>客户搜索</span>
                  <input v-model="customerSearch" placeholder="编号 / 名称 / 联系人" />
                </label>
                <label>
                  <span>国家</span>
                  <input v-model="customerCountryFilter" placeholder="国家地区" />
                </label>
                <label>
                  <span>信用筛选</span>
                  <input v-model="customerCreditFilter" placeholder="A / B / C" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>客户编号</th>
                    <th>中文名称</th>
                    <th>英文名称</th>
                    <th>国家</th>
                    <th>信用</th>
                    <th>授信额度</th>
                    <th>主联系人</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="customer in customers"
                    :key="customer.id"
                    :class="{ selected: customer.id === selectedCustomer?.id }"
                    @click="selectCustomer(customer.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ customer.code }}</button>
                    </td>
                    <td>{{ customer.cn_name }}</td>
                    <td>{{ customer.en_name }}</td>
                    <td>{{ customer.country }}</td>
                    <td>{{ customer.credit_profile?.credit_grade ?? '未评' }}</td>
                    <td>
                      {{ formatMoney(customer.credit_profile?.credit_limit, customer.credit_profile?.currency) }}
                    </td>
                    <td>{{ customer.primary_contact?.name ?? '未设置' }}</td>
                  </tr>
                  <tr v-if="customers.length === 0">
                    <td colspan="7" class="empty-cell">暂无客户资料</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>新增客户</h2>
              <Users :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitCustomer">
              <div class="form-pair two">
                <label>
                  客户编号
                  <input v-model="customerForm.code" required maxlength="80" />
                </label>
                <label>
                  客户状态
                  <select v-model="customerForm.status">
                    <option value="active">有效</option>
                    <option value="inactive">停用</option>
                  </select>
                </label>
              </div>
              <label>
                客户中文名称
                <input v-model="customerForm.cn_name" required maxlength="200" />
              </label>
              <label>
                客户英文名称
                <input v-model="customerForm.en_name" required maxlength="200" />
              </label>
              <label>
                客户国家
                <input v-model="customerForm.country" required maxlength="120" />
              </label>
              <label>
                客户地址
                <textarea v-model="customerForm.address" rows="3" maxlength="2000" />
              </label>
              <label>
                客户网址
                <input v-model="customerForm.website" maxlength="2000" />
              </label>

              <div class="form-divider">主联系人</div>
              <div class="form-pair two">
                <label>
                  主联系人姓名
                  <input v-model="customerForm.contact_name" required maxlength="160" />
                </label>
                <label>
                  主联系人职务
                  <input v-model="customerForm.contact_title" maxlength="160" />
                </label>
              </div>
              <div class="form-pair two">
                <label>
                  主联系人邮箱
                  <input v-model="customerForm.contact_email" maxlength="200" />
                </label>
                <label>
                  主联系人电话
                  <input v-model="customerForm.contact_phone" maxlength="80" />
                </label>
              </div>

              <div class="form-divider">信用信息</div>
              <div class="form-pair three">
                <label>
                  信用等级
                  <input v-model="customerForm.credit_grade" required maxlength="40" />
                </label>
                <label>
                  授信额度
                  <input v-model="customerForm.credit_limit" required min="0" step="0.01" type="number" />
                </label>
                <label>
                  授信币种
                  <input v-model="customerForm.currency" required maxlength="10" />
                </label>
              </div>
              <label>
                付款条款
                <input v-model="customerForm.payment_terms" required maxlength="200" />
              </label>
              <label>
                风险备注
                <textarea v-model="customerForm.risk_note" rows="3" maxlength="2000" />
              </label>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>新增客户</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>客户明细</h2>
              <span>{{ selectedCustomer?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedCustomer" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>中文名称</dt>
                  <dd>{{ selectedCustomer.cn_name }}</dd>
                </div>
                <div>
                  <dt>英文名称</dt>
                  <dd>{{ selectedCustomer.en_name }}</dd>
                </div>
                <div>
                  <dt>国家/状态</dt>
                  <dd>{{ selectedCustomer.country }} / {{ customerStatusLabel(selectedCustomer.status) }}</dd>
                </div>
                <div>
                  <dt>授信额度</dt>
                  <dd>
                    {{ formatMoney(selectedCustomer.credit_profile?.credit_limit, selectedCustomer.credit_profile?.currency) }}
                  </dd>
                </div>
                <div>
                  <dt>信用等级</dt>
                  <dd>{{ selectedCustomer.credit_profile?.credit_grade ?? '未评' }}</dd>
                </div>
                <div>
                  <dt>付款条款</dt>
                  <dd>{{ selectedCustomer.credit_profile?.payment_terms ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>主联系人</dt>
                  <dd>{{ selectedCustomer.primary_contact?.name ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>交易记录</dt>
                  <dd>{{ customerTransactions.total }} 条</dd>
                </div>
              </dl>

              <div class="accessory-heading">
                <strong>联系人</strong>
                <span>{{ selectedCustomer.contacts.length }} 位</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>职务</th>
                    <th>邮箱</th>
                    <th>电话</th>
                    <th>主联系人</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in selectedCustomer.contacts" :key="item.id">
                    <td>{{ item.name }}</td>
                    <td>{{ item.title ?? '未填' }}</td>
                    <td>{{ item.email ?? '未填' }}</td>
                    <td>{{ item.phone ?? '未填' }}</td>
                    <td>{{ item.is_primary ? '是' : '否' }}</td>
                  </tr>
                </tbody>
              </table>

              <form class="record-form accessory-form" @submit.prevent="submitCustomerUpdate">
                <div class="form-divider">编辑客户</div>
                <div class="form-pair two">
                  <label>
                    编辑中文名称
                    <input v-model="customerEditForm.cn_name" required maxlength="200" />
                  </label>
                  <label>
                    编辑英文名称
                    <input v-model="customerEditForm.en_name" required maxlength="200" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label>
                    编辑国家
                    <input v-model="customerEditForm.country" required maxlength="120" />
                  </label>
                  <label>
                    编辑状态
                    <select v-model="customerEditForm.status">
                      <option value="active">有效</option>
                      <option value="inactive">停用</option>
                    </select>
                  </label>
                </div>
                <label>
                  编辑地址
                  <textarea v-model="customerEditForm.address" rows="2" maxlength="2000" />
                </label>
                <div class="form-pair three">
                  <label>
                    编辑信用等级
                    <input v-model="customerEditForm.credit_grade" required maxlength="40" />
                  </label>
                  <label>
                    编辑授信额度
                    <input
                      v-model="customerEditForm.credit_limit"
                      required
                      min="0"
                      step="0.01"
                      type="number"
                    />
                  </label>
                  <label>
                    编辑币种
                    <input v-model="customerEditForm.currency" required maxlength="10" />
                  </label>
                </div>
                <label>
                  编辑付款条款
                  <input v-model="customerEditForm.payment_terms" required maxlength="200" />
                </label>
                <label>
                  编辑风险备注
                  <textarea v-model="customerEditForm.risk_note" rows="2" maxlength="2000" />
                </label>
                <button class="secondary-button" type="submit">
                  <Save :size="18" />
                  <span>更新客户</span>
                </button>
              </form>

              <form class="record-form accessory-form" @submit.prevent="submitCustomerContact">
                <div class="form-divider">追加联系人</div>
                <div class="form-pair two">
                  <label>
                    追加联系人姓名
                    <input v-model="customerContactForm.name" required maxlength="160" />
                  </label>
                  <label>
                    追加联系人职务
                    <input v-model="customerContactForm.title" maxlength="160" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label>
                    追加联系人邮箱
                    <input v-model="customerContactForm.email" maxlength="200" />
                  </label>
                  <label>
                    追加联系人电话
                    <input v-model="customerContactForm.phone" maxlength="80" />
                  </label>
                </div>
                <label class="checkbox-line">
                  <input v-model="customerContactForm.is_primary" type="checkbox" />
                  设为主联系人
                </label>
                <button class="secondary-button" type="submit">
                  <Plus :size="18" />
                  <span>追加联系人</span>
                </button>
              </form>

              <div class="transaction-box">
                <strong>交易记录</strong>
                <p v-if="customerTransactions.total === 0">
                  报价、出口合同、出货和收款模块接入后将在此汇总。
                </p>
              </div>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="isSupplierPage">
        <section class="summary-strip product-summary" aria-label="供应商概览">
          <div v-for="item in supplierStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="supplierMessage" class="success-banner">{{ supplierMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>供应商列表</h2>
              <form class="search-form" @submit.prevent="loadSuppliers">
                <label>
                  <span>供应商搜索</span>
                  <input v-model="supplierSearch" placeholder="编号 / 名称 / 联系人" />
                </label>
                <label>
                  <span>国家</span>
                  <input v-model="supplierCountryFilter" placeholder="国家地区" />
                </label>
                <label>
                  <span>信用筛选</span>
                  <input v-model="supplierCreditFilter" placeholder="A / B / C" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>供应商编号</th>
                    <th>中文名称</th>
                    <th>英文名称</th>
                    <th>国家</th>
                    <th>信用</th>
                    <th>授信额度</th>
                    <th>主联系人</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="supplier in suppliers"
                    :key="supplier.id"
                    :class="{ selected: supplier.id === selectedSupplier?.id }"
                    @click="selectSupplier(supplier.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ supplier.code }}</button>
                    </td>
                    <td>{{ supplier.cn_name }}</td>
                    <td>{{ supplier.en_name }}</td>
                    <td>{{ supplier.country }}</td>
                    <td>{{ supplier.credit_profile?.credit_grade ?? '未评' }}</td>
                    <td>
                      {{ formatMoney(supplier.credit_profile?.credit_limit, supplier.credit_profile?.currency) }}
                    </td>
                    <td>{{ supplier.primary_contact?.name ?? '未设置' }}</td>
                  </tr>
                  <tr v-if="suppliers.length === 0">
                    <td colspan="7" class="empty-cell">暂无供应商资料</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>新增供应商</h2>
              <Factory :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitSupplier">
              <div class="form-pair two">
                <label>
                  供应商编号
                  <input v-model="supplierForm.code" required maxlength="80" />
                </label>
                <label>
                  供应商状态
                  <select v-model="supplierForm.status">
                    <option value="active">有效</option>
                    <option value="inactive">停用</option>
                  </select>
                </label>
              </div>
              <label>
                供应商中文名称
                <input v-model="supplierForm.cn_name" required maxlength="200" />
              </label>
              <label>
                供应商英文名称
                <input v-model="supplierForm.en_name" required maxlength="200" />
              </label>
              <label>
                供应商国家
                <input v-model="supplierForm.country" required maxlength="120" />
              </label>
              <label>
                供应商地址
                <textarea v-model="supplierForm.address" rows="3" maxlength="2000" />
              </label>
              <label>
                供应商网址
                <input v-model="supplierForm.website" maxlength="2000" />
              </label>

              <div class="form-divider">主联系人</div>
              <div class="form-pair two">
                <label>
                  供应商主联系人姓名
                  <input v-model="supplierForm.contact_name" required maxlength="160" />
                </label>
                <label>
                  供应商主联系人职务
                  <input v-model="supplierForm.contact_title" maxlength="160" />
                </label>
              </div>
              <div class="form-pair two">
                <label>
                  供应商主联系人邮箱
                  <input v-model="supplierForm.contact_email" maxlength="200" />
                </label>
                <label>
                  供应商主联系人电话
                  <input v-model="supplierForm.contact_phone" maxlength="80" />
                </label>
              </div>

              <div class="form-divider">信用信息</div>
              <div class="form-pair three">
                <label>
                  供应商信用等级
                  <input v-model="supplierForm.credit_grade" required maxlength="40" />
                </label>
                <label>
                  供应商授信额度
                  <input v-model="supplierForm.credit_limit" required min="0" step="0.01" type="number" />
                </label>
                <label>
                  供应商授信币种
                  <input v-model="supplierForm.currency" required maxlength="10" />
                </label>
              </div>
              <label>
                供应商付款条款
                <input v-model="supplierForm.payment_terms" required maxlength="200" />
              </label>
              <label>
                供应商风险备注
                <textarea v-model="supplierForm.risk_note" rows="3" maxlength="2000" />
              </label>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>新增供应商</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>供应商明细</h2>
              <span>{{ selectedSupplier?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedSupplier" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>中文名称</dt>
                  <dd>{{ selectedSupplier.cn_name }}</dd>
                </div>
                <div>
                  <dt>英文名称</dt>
                  <dd>{{ selectedSupplier.en_name }}</dd>
                </div>
                <div>
                  <dt>国家/状态</dt>
                  <dd>{{ selectedSupplier.country }} / {{ customerStatusLabel(selectedSupplier.status) }}</dd>
                </div>
                <div>
                  <dt>授信额度</dt>
                  <dd>
                    {{ formatMoney(selectedSupplier.credit_profile?.credit_limit, selectedSupplier.credit_profile?.currency) }}
                  </dd>
                </div>
                <div>
                  <dt>信用等级</dt>
                  <dd>{{ selectedSupplier.credit_profile?.credit_grade ?? '未评' }}</dd>
                </div>
                <div>
                  <dt>付款条款</dt>
                  <dd>{{ selectedSupplier.credit_profile?.payment_terms ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>主联系人</dt>
                  <dd>{{ selectedSupplier.primary_contact?.name ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>交易记录</dt>
                  <dd>{{ supplierTransactions.total }} 条</dd>
                </div>
              </dl>

              <div class="accessory-heading">
                <strong>联系人</strong>
                <span>{{ selectedSupplier.contacts.length }} 位</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>职务</th>
                    <th>邮箱</th>
                    <th>电话</th>
                    <th>主联系人</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in selectedSupplier.contacts" :key="item.id">
                    <td>{{ item.name }}</td>
                    <td>{{ item.title ?? '未填' }}</td>
                    <td>{{ item.email ?? '未填' }}</td>
                    <td>{{ item.phone ?? '未填' }}</td>
                    <td>{{ item.is_primary ? '是' : '否' }}</td>
                  </tr>
                </tbody>
              </table>

              <form class="record-form accessory-form" @submit.prevent="submitSupplierUpdate">
                <div class="form-divider">编辑供应商</div>
                <div class="form-pair two">
                  <label>
                    编辑供应商中文名称
                    <input v-model="supplierEditForm.cn_name" required maxlength="200" />
                  </label>
                  <label>
                    编辑供应商英文名称
                    <input v-model="supplierEditForm.en_name" required maxlength="200" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label>
                    编辑供应商国家
                    <input v-model="supplierEditForm.country" required maxlength="120" />
                  </label>
                  <label>
                    编辑供应商状态
                    <select v-model="supplierEditForm.status">
                      <option value="active">有效</option>
                      <option value="inactive">停用</option>
                    </select>
                  </label>
                </div>
                <label>
                  编辑供应商地址
                  <textarea v-model="supplierEditForm.address" rows="2" maxlength="2000" />
                </label>
                <div class="form-pair three">
                  <label>
                    编辑供应商信用等级
                    <input v-model="supplierEditForm.credit_grade" required maxlength="40" />
                  </label>
                  <label>
                    编辑供应商授信额度
                    <input
                      v-model="supplierEditForm.credit_limit"
                      required
                      min="0"
                      step="0.01"
                      type="number"
                    />
                  </label>
                  <label>
                    编辑供应商币种
                    <input v-model="supplierEditForm.currency" required maxlength="10" />
                  </label>
                </div>
                <label>
                  编辑供应商付款条款
                  <input v-model="supplierEditForm.payment_terms" required maxlength="200" />
                </label>
                <label>
                  编辑供应商风险备注
                  <textarea v-model="supplierEditForm.risk_note" rows="2" maxlength="2000" />
                </label>
                <button class="secondary-button" type="submit">
                  <Save :size="18" />
                  <span>更新供应商</span>
                </button>
              </form>

              <form class="record-form accessory-form" @submit.prevent="submitSupplierContact">
                <div class="form-divider">追加联系人</div>
                <div class="form-pair two">
                  <label>
                    追加供应商联系人姓名
                    <input v-model="supplierContactForm.name" required maxlength="160" />
                  </label>
                  <label>
                    追加供应商联系人职务
                    <input v-model="supplierContactForm.title" maxlength="160" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label>
                    追加供应商联系人邮箱
                    <input v-model="supplierContactForm.email" maxlength="200" />
                  </label>
                  <label>
                    追加供应商联系人电话
                    <input v-model="supplierContactForm.phone" maxlength="80" />
                  </label>
                </div>
                <label class="checkbox-line">
                  <input v-model="supplierContactForm.is_primary" type="checkbox" />
                  设为主联系人
                </label>
                <button class="secondary-button" type="submit">
                  <Plus :size="18" />
                  <span>追加供应商联系人</span>
                </button>
              </form>

              <div class="transaction-box">
                <strong>交易记录</strong>
                <p v-if="supplierTransactions.total === 0">
                  采购询价、采购合同、入库和付款模块接入后将在此汇总。
                </p>
              </div>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="isPartnerPage">
        <section class="summary-strip product-summary" aria-label="合作伙伴概览">
          <div v-for="item in partnerStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="partnerMessage" class="success-banner">{{ partnerMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>合作伙伴列表</h2>
              <form class="search-form" @submit.prevent="loadPartners">
                <label>
                  <span>合作伙伴搜索</span>
                  <input v-model="partnerSearch" placeholder="编号 / 名称 / 联系人" />
                </label>
                <label>
                  <span>伙伴类型</span>
                  <select v-model="partnerTypeFilter">
                    <option value="">全部类型</option>
                    <option value="express">快件公司</option>
                    <option value="freight_forwarder">货代公司</option>
                    <option value="insurer">保险公司</option>
                    <option value="carrier">运输公司</option>
                  </select>
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>伙伴编号</th>
                    <th>中文名称</th>
                    <th>英文名称</th>
                    <th>类型</th>
                    <th>国家</th>
                    <th>主联系人</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="partner in partners"
                    :key="partner.id"
                    :class="{ selected: partner.id === selectedPartner?.id }"
                    @click="selectPartner(partner.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ partner.code }}</button>
                    </td>
                    <td>{{ partner.cn_name }}</td>
                    <td>{{ partner.en_name }}</td>
                    <td>{{ partnerTypeLabel(partner.partner_type) }}</td>
                    <td>{{ partner.country }}</td>
                    <td>{{ partner.primary_contact?.name ?? '未设置' }}</td>
                  </tr>
                  <tr v-if="partners.length === 0">
                    <td colspan="6" class="empty-cell">暂无合作伙伴资料</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>新增合作伙伴</h2>
              <Handshake :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitPartner">
              <div class="form-pair two">
                <label>
                  合作伙伴编号
                  <input v-model="partnerForm.code" required maxlength="80" />
                </label>
                <label>
                  合作伙伴状态
                  <select v-model="partnerForm.status">
                    <option value="active">有效</option>
                    <option value="inactive">停用</option>
                  </select>
                </label>
              </div>
              <label>
                合作伙伴中文名称
                <input v-model="partnerForm.cn_name" required maxlength="200" />
              </label>
              <label>
                合作伙伴英文名称
                <input v-model="partnerForm.en_name" required maxlength="200" />
              </label>
              <div class="form-pair two">
                <label>
                  合作伙伴类型
                  <select v-model="partnerForm.partner_type">
                    <option value="express">快件公司</option>
                    <option value="freight_forwarder">货代公司</option>
                    <option value="insurer">保险公司</option>
                    <option value="carrier">运输公司</option>
                  </select>
                </label>
                <label>
                  合作伙伴国家
                  <input v-model="partnerForm.country" required maxlength="120" />
                </label>
              </div>
              <label>
                合作伙伴地址
                <textarea v-model="partnerForm.address" rows="3" maxlength="2000" />
              </label>
              <label>
                合作伙伴网址
                <input v-model="partnerForm.website" maxlength="2000" />
              </label>

              <div class="form-divider">主联系人</div>
              <div class="form-pair two">
                <label>
                  合作伙伴主联系人姓名
                  <input v-model="partnerForm.contact_name" required maxlength="160" />
                </label>
                <label>
                  合作伙伴主联系人职务
                  <input v-model="partnerForm.contact_title" maxlength="160" />
                </label>
              </div>
              <div class="form-pair two">
                <label>
                  合作伙伴主联系人邮箱
                  <input v-model="partnerForm.contact_email" maxlength="200" />
                </label>
                <label>
                  合作伙伴主联系人电话
                  <input v-model="partnerForm.contact_phone" maxlength="80" />
                </label>
              </div>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>新增合作伙伴</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>合作伙伴明细</h2>
              <span>{{ selectedPartner?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedPartner" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>中文名称</dt>
                  <dd>{{ selectedPartner.cn_name }}</dd>
                </div>
                <div>
                  <dt>英文名称</dt>
                  <dd>{{ selectedPartner.en_name }}</dd>
                </div>
                <div>
                  <dt>伙伴类型</dt>
                  <dd>{{ partnerTypeLabel(selectedPartner.partner_type) }}</dd>
                </div>
                <div>
                  <dt>国家/状态</dt>
                  <dd>{{ selectedPartner.country }} / {{ customerStatusLabel(selectedPartner.status) }}</dd>
                </div>
                <div>
                  <dt>主联系人</dt>
                  <dd>{{ selectedPartner.primary_contact?.name ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>费用记录</dt>
                  <dd>{{ partnerFeeRecords.total }} 条</dd>
                </div>
              </dl>

              <div class="accessory-heading">
                <strong>联系人</strong>
                <span>{{ selectedPartner.contacts.length }} 位</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>职务</th>
                    <th>邮箱</th>
                    <th>电话</th>
                    <th>主联系人</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in selectedPartner.contacts" :key="item.id">
                    <td>{{ item.name }}</td>
                    <td>{{ item.title ?? '未填' }}</td>
                    <td>{{ item.email ?? '未填' }}</td>
                    <td>{{ item.phone ?? '未填' }}</td>
                    <td>{{ item.is_primary ? '是' : '否' }}</td>
                  </tr>
                </tbody>
              </table>

              <form class="record-form accessory-form" @submit.prevent="submitPartnerUpdate">
                <div class="form-divider">编辑合作伙伴</div>
                <div class="form-pair two">
                  <label>
                    编辑合作伙伴中文名称
                    <input v-model="partnerEditForm.cn_name" required maxlength="200" />
                  </label>
                  <label>
                    编辑合作伙伴英文名称
                    <input v-model="partnerEditForm.en_name" required maxlength="200" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label>
                    编辑合作伙伴类型
                    <select v-model="partnerEditForm.partner_type">
                      <option value="express">快件公司</option>
                      <option value="freight_forwarder">货代公司</option>
                      <option value="insurer">保险公司</option>
                      <option value="carrier">运输公司</option>
                    </select>
                  </label>
                  <label>
                    编辑合作伙伴国家
                    <input v-model="partnerEditForm.country" required maxlength="120" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label>
                    编辑合作伙伴状态
                    <select v-model="partnerEditForm.status">
                      <option value="active">有效</option>
                      <option value="inactive">停用</option>
                    </select>
                  </label>
                  <label>
                    编辑合作伙伴网址
                    <input v-model="partnerEditForm.website" maxlength="2000" />
                  </label>
                </div>
                <label>
                  编辑合作伙伴地址
                  <textarea v-model="partnerEditForm.address" rows="2" maxlength="2000" />
                </label>
                <button class="secondary-button" type="submit">
                  <Save :size="18" />
                  <span>更新合作伙伴</span>
                </button>
              </form>

              <form class="record-form accessory-form" @submit.prevent="submitPartnerContact">
                <div class="form-divider">追加联系人</div>
                <div class="form-pair two">
                  <label>
                    追加合作伙伴联系人姓名
                    <input v-model="partnerContactForm.name" required maxlength="160" />
                  </label>
                  <label>
                    追加合作伙伴联系人职务
                    <input v-model="partnerContactForm.title" maxlength="160" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label>
                    追加合作伙伴联系人邮箱
                    <input v-model="partnerContactForm.email" maxlength="200" />
                  </label>
                  <label>
                    追加合作伙伴联系人电话
                    <input v-model="partnerContactForm.phone" maxlength="80" />
                  </label>
                </div>
                <label class="checkbox-line">
                  <input v-model="partnerContactForm.is_primary" type="checkbox" />
                  设为主联系人
                </label>
                <button class="secondary-button" type="submit">
                  <Plus :size="18" />
                  <span>追加合作伙伴联系人</span>
                </button>
              </form>

              <div class="transaction-box">
                <strong>费用记录</strong>
                <p v-if="partnerFeeRecords.total === 0">
                  费用申请、单证和付费管理模块接入后将在此汇总。
                </p>
              </div>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="isDocumentPartyPage">
        <section class="summary-strip product-summary" aria-label="单证资料概览">
          <div v-for="item in documentPartyStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="documentPartyMessage" class="success-banner">{{ documentPartyMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>单证资料列表</h2>
              <form class="search-form" @submit.prevent="loadDocumentParties">
                <label>
                  <span>单证资料搜索</span>
                  <input v-model="documentPartySearch" placeholder="编号 / 名称 / 联系人 / 银行" />
                </label>
                <label>
                  <span>资料类型</span>
                  <select v-model="documentPartyTypeFilter">
                    <option value="">全部类型</option>
                    <option value="consignee">收货人</option>
                    <option value="notify_party">通知人</option>
                    <option value="issuing_bank">开证行</option>
                    <option value="bill_notify_party">提单通知人</option>
                  </select>
                </label>
                <label>
                  <span>客户标识</span>
                  <input v-model="documentPartyCustomerFilter" placeholder="customer-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>资料编号</th>
                    <th>资料名称</th>
                    <th>类型</th>
                    <th>客户</th>
                    <th>国家</th>
                    <th>默认</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="party in documentParties"
                    :key="party.id"
                    :class="{ selected: party.id === selectedDocumentParty?.id }"
                    @click="selectDocumentParty(party.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ party.code }}</button>
                    </td>
                    <td>{{ party.display_name }}</td>
                    <td>{{ documentPartyTypeLabel(party.party_type) }}</td>
                    <td>{{ party.customer_name ?? party.customer_id ?? '通用' }}</td>
                    <td>{{ party.country }}</td>
                    <td>{{ party.is_default ? '是' : '否' }}</td>
                  </tr>
                  <tr v-if="documentParties.length === 0">
                    <td colspan="6" class="empty-cell">暂无单证资料</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>新增单证资料</h2>
              <Files :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitDocumentParty">
              <div class="form-pair two">
                <label>
                  单证资料编号
                  <input v-model="documentPartyForm.code" required maxlength="80" />
                </label>
                <label>
                  单证资料状态
                  <select v-model="documentPartyForm.status">
                    <option value="active">有效</option>
                    <option value="inactive">停用</option>
                  </select>
                </label>
              </div>
              <div class="form-pair two">
                <label>
                  单证资料类型
                  <select v-model="documentPartyForm.party_type">
                    <option value="consignee">收货人</option>
                    <option value="notify_party">通知人</option>
                    <option value="issuing_bank">开证行</option>
                    <option value="bill_notify_party">提单通知人</option>
                  </select>
                </label>
                <label>
                  单证资料国家
                  <input v-model="documentPartyForm.country" required maxlength="120" />
                </label>
              </div>
              <label>
                单证资料名称
                <input v-model="documentPartyForm.display_name" required maxlength="240" />
              </label>
              <div class="form-pair two">
                <label>
                  关联客户标识
                  <input v-model="documentPartyForm.customer_id" maxlength="36" />
                </label>
                <label>
                  关联客户名称
                  <input v-model="documentPartyForm.customer_name" maxlength="240" />
                </label>
              </div>
              <label>
                单证资料地址
                <textarea v-model="documentPartyForm.address" rows="3" maxlength="2000" />
              </label>
              <div class="form-pair two">
                <label>
                  单证联系人
                  <input v-model="documentPartyForm.contact_person" maxlength="160" />
                </label>
                <label>
                  单证联系电话
                  <input v-model="documentPartyForm.phone" maxlength="80" />
                </label>
              </div>
              <label>
                单证联系邮箱
                <input v-model="documentPartyForm.email" maxlength="200" />
              </label>

              <div class="form-divider">银行和税务</div>
              <label>
                单证银行名称
                <input v-model="documentPartyForm.bank_name" maxlength="240" />
              </label>
              <div class="form-pair two">
                <label>
                  Swift Code
                  <input v-model="documentPartyForm.swift_code" maxlength="80" />
                </label>
                <label>
                  银行账号
                  <input v-model="documentPartyForm.account_no" maxlength="120" />
                </label>
              </div>
              <label>
                税号
                <input v-model="documentPartyForm.tax_id" maxlength="120" />
              </label>
              <label>
                单证资料备注
                <textarea v-model="documentPartyForm.remarks" rows="2" maxlength="2000" />
              </label>
              <label class="checkbox-line">
                <input v-model="documentPartyForm.is_default" type="checkbox" />
                设为该客户该类型默认资料
              </label>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>新增单证资料</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>单证资料明细</h2>
              <span>{{ selectedDocumentParty?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedDocumentParty" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>资料名称</dt>
                  <dd>{{ selectedDocumentParty.display_name }}</dd>
                </div>
                <div>
                  <dt>资料类型</dt>
                  <dd>{{ documentPartyTypeLabel(selectedDocumentParty.party_type) }}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{{ selectedDocumentParty.customer_name ?? selectedDocumentParty.customer_id ?? '通用' }}</dd>
                </div>
                <div>
                  <dt>国家/状态</dt>
                  <dd>{{ selectedDocumentParty.country }} / {{ customerStatusLabel(selectedDocumentParty.status) }}</dd>
                </div>
                <div>
                  <dt>联系人</dt>
                  <dd>{{ selectedDocumentParty.contact_person ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>地址</dt>
                  <dd>{{ selectedDocumentParty.address ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>默认资料</dt>
                  <dd>{{ selectedDocumentParty.is_default ? '是' : '否' }}</dd>
                </div>
                <div>
                  <dt>银行</dt>
                  <dd>{{ selectedDocumentParty.bank_name ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>Swift Code</dt>
                  <dd>{{ selectedDocumentParty.swift_code ?? '未设置' }}</dd>
                </div>
              </dl>

              <div class="transaction-box">
                <strong>快速引用</strong>
                <p v-if="documentPartyLookup.total === 0">
                  暂无同客户同类型的可引用单证资料。
                </p>
                <table v-else class="data-table compact-table">
                  <thead>
                    <tr>
                      <th>资料编号</th>
                      <th>资料名称</th>
                      <th>默认</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in documentPartyLookup.items" :key="item.id">
                      <td>{{ item.code }}</td>
                      <td>{{ item.display_name }}</td>
                      <td>{{ item.is_default ? '是' : '否' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <form class="record-form accessory-form" @submit.prevent="submitDocumentPartyUpdate">
                <div class="form-divider">编辑单证资料</div>
                <div class="form-pair two">
                  <label>
                    编辑单证资料类型
                    <select v-model="documentPartyEditForm.party_type">
                      <option value="consignee">收货人</option>
                      <option value="notify_party">通知人</option>
                      <option value="issuing_bank">开证行</option>
                      <option value="bill_notify_party">提单通知人</option>
                    </select>
                  </label>
                  <label>
                    编辑单证资料状态
                    <select v-model="documentPartyEditForm.status">
                      <option value="active">有效</option>
                      <option value="inactive">停用</option>
                    </select>
                  </label>
                </div>
                <label>
                  编辑单证资料名称
                  <input v-model="documentPartyEditForm.display_name" required maxlength="240" />
                </label>
                <div class="form-pair two">
                  <label>
                    编辑关联客户标识
                    <input v-model="documentPartyEditForm.customer_id" maxlength="36" />
                  </label>
                  <label>
                    编辑关联客户名称
                    <input v-model="documentPartyEditForm.customer_name" maxlength="240" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label>
                    编辑单证资料国家
                    <input v-model="documentPartyEditForm.country" required maxlength="120" />
                  </label>
                  <label>
                    编辑单证联系人
                    <input v-model="documentPartyEditForm.contact_person" maxlength="160" />
                  </label>
                </div>
                <label>
                  编辑单证资料地址
                  <textarea v-model="documentPartyEditForm.address" rows="2" maxlength="2000" />
                </label>
                <div class="form-pair two">
                  <label>
                    编辑单证联系邮箱
                    <input v-model="documentPartyEditForm.email" maxlength="200" />
                  </label>
                  <label>
                    编辑单证联系电话
                    <input v-model="documentPartyEditForm.phone" maxlength="80" />
                  </label>
                </div>
                <label>
                  编辑单证银行名称
                  <input v-model="documentPartyEditForm.bank_name" maxlength="240" />
                </label>
                <div class="form-pair three">
                  <label>
                    编辑 Swift Code
                    <input v-model="documentPartyEditForm.swift_code" maxlength="80" />
                  </label>
                  <label>
                    编辑银行账号
                    <input v-model="documentPartyEditForm.account_no" maxlength="120" />
                  </label>
                  <label>
                    编辑税号
                    <input v-model="documentPartyEditForm.tax_id" maxlength="120" />
                  </label>
                </div>
                <label>
                  编辑单证资料备注
                  <textarea v-model="documentPartyEditForm.remarks" rows="2" maxlength="2000" />
                </label>
                <label class="checkbox-line">
                  <input v-model="documentPartyEditForm.is_default" type="checkbox" />
                  设为默认资料
                </label>
                <button class="secondary-button" type="submit">
                  <Save :size="18" />
                  <span>更新单证资料</span>
                </button>
              </form>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="isSampleRequestPage">
        <section class="summary-strip product-summary" aria-label="打样管理概览">
          <div v-for="item in sampleStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="sampleMessage" class="success-banner">{{ sampleMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>打样单列表</h2>
              <form class="search-form" @submit.prevent="loadSampleRequests">
                <label>
                  <span>打样搜索</span>
                  <input v-model="sampleSearch" placeholder="编号 / 客户 / 产品 / 要求" />
                </label>
                <label>
                  <span>打样状态</span>
                  <select v-model="sampleStatusFilter">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="sent">已发送</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </label>
                <label>
                  <span>客户标识</span>
                  <input v-model="sampleCustomerFilter" placeholder="customer-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>打样单号</th>
                    <th>客户</th>
                    <th>产品</th>
                    <th>去向</th>
                    <th>状态</th>
                    <th>要求日期</th>
                    <th>费用</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in sampleRequests"
                    :key="item.id"
                    :class="{ selected: item.id === selectedSampleRequest?.id }"
                    @click="selectSampleRequest(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.product_name ?? item.product_code ?? '未指定' }}</td>
                    <td>{{ sampleDestinationLabel(item.destination) }}</td>
                    <td>{{ sampleStatusLabel(item.status) }}</td>
                    <td>{{ item.due_date ?? '未设置' }}</td>
                    <td>{{ item.fees.length }}</td>
                  </tr>
                  <tr v-if="sampleRequests.length === 0">
                    <td colspan="7" class="empty-cell">暂无打样单</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>新增打样单</h2>
              <FlaskConical :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitSampleRequest">
              <div class="form-pair two">
                <label for="sample-request-code">
                  打样单号
                  <input id="sample-request-code" v-model="sampleRequestForm.code" required maxlength="80" />
                </label>
                <label for="sample-request-status">
                  打样状态
                  <select
                    id="sample-request-status"
                    v-model="sampleRequestForm.status"
                    aria-label="打样状态"
                  >
                    <option value="draft">草稿</option>
                    <option value="sent">已发送</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-request-date">
                  打样日期
                  <input id="sample-request-date" v-model="sampleRequestForm.request_date" required type="date" />
                </label>
                <label for="sample-request-due-date">
                  要求完成日期
                  <input id="sample-request-due-date" v-model="sampleRequestForm.due_date" type="date" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-request-customer-id">
                  打样客户标识
                  <input id="sample-request-customer-id" v-model="sampleRequestForm.customer_id" maxlength="36" />
                </label>
                <label for="sample-request-customer-name">
                  打样客户名称
                  <input id="sample-request-customer-name" v-model="sampleRequestForm.customer_name" required maxlength="240" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-request-product-code">
                  打样产品编号
                  <input id="sample-request-product-code" v-model="sampleRequestForm.product_code" maxlength="80" />
                </label>
                <label for="sample-request-product-name">
                  打样产品名称
                  <input id="sample-request-product-name" v-model="sampleRequestForm.product_name" maxlength="240" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-request-supplier-name">
                  打样供应商名称
                  <input id="sample-request-supplier-name" v-model="sampleRequestForm.supplier_name" maxlength="240" />
                </label>
                <label for="sample-request-destination">
                  打样去向
                  <select
                    id="sample-request-destination"
                    v-model="sampleRequestForm.destination"
                    aria-label="打样去向"
                  >
                    <option value="in_house">内部打样</option>
                    <option value="factory">外发工厂</option>
                  </select>
                </label>
              </div>
              <label for="sample-request-requirements">
                客户打样要求
                <textarea
                  id="sample-request-requirements"
                  v-model="sampleRequestForm.requirements"
                  required
                  rows="3"
                  maxlength="4000"
                />
              </label>

              <div class="form-divider">内部打样单明细</div>
              <div class="form-pair two">
                <label for="sample-request-line-product-code">
                  明细产品编号
                  <input
                    id="sample-request-line-product-code"
                    v-model="sampleRequestForm.line_product_code"
                    maxlength="80"
                  />
                </label>
                <label for="sample-request-line-product-name">
                  明细产品名称
                  <input
                    id="sample-request-line-product-name"
                    v-model="sampleRequestForm.line_product_name"
                    required
                    maxlength="240"
                  />
                </label>
              </div>
              <div class="form-pair three">
                <label for="sample-request-line-specification">
                  明细规格
                  <input
                    id="sample-request-line-specification"
                    v-model="sampleRequestForm.line_specification"
                    maxlength="240"
                  />
                </label>
                <label for="sample-request-line-quantity">
                  明细数量
                  <input
                    id="sample-request-line-quantity"
                    v-model="sampleRequestForm.line_quantity"
                    required
                    min="0.0001"
                    step="0.0001"
                    type="number"
                  />
                </label>
                <label for="sample-request-line-unit">
                  明细单位
                  <input
                    id="sample-request-line-unit"
                    v-model="sampleRequestForm.line_unit"
                    required
                    maxlength="40"
                  />
                </label>
              </div>
              <label for="sample-request-line-requirement">
                明细要求
                <textarea
                  id="sample-request-line-requirement"
                  v-model="sampleRequestForm.line_requirement"
                  rows="2"
                  maxlength="2000"
                />
              </label>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>新增打样单</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>打样单明细</h2>
              <span>{{ selectedSampleRequest?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedSampleRequest" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>客户</dt>
                  <dd>{{ selectedSampleRequest.customer_name }}</dd>
                </div>
                <div>
                  <dt>产品</dt>
                  <dd>{{ selectedSampleRequest.product_name ?? selectedSampleRequest.product_code ?? '未指定' }}</dd>
                </div>
                <div>
                  <dt>去向/状态</dt>
                  <dd>
                    {{ sampleDestinationLabel(selectedSampleRequest.destination) }} /
                    {{ sampleStatusLabel(selectedSampleRequest.status) }}
                  </dd>
                </div>
                <div>
                  <dt>打样日期</dt>
                  <dd>{{ selectedSampleRequest.request_date }}</dd>
                </div>
                <div>
                  <dt>要求完成</dt>
                  <dd>{{ selectedSampleRequest.due_date ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{{ selectedSampleRequest.supplier_name ?? '未指定' }}</dd>
                </div>
              </dl>

              <div class="transaction-box">
                <strong>客户打样要求</strong>
                <p>{{ selectedSampleRequest.requirements }}</p>
              </div>

              <div class="accessory-heading">
                <strong>内部打样单明细</strong>
                <span>{{ selectedSampleRequest.lines.length }} 行</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>产品编号</th>
                    <th>产品名称</th>
                    <th>规格</th>
                    <th>数量</th>
                    <th>要求</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedSampleRequest.lines" :key="line.id">
                    <td>{{ line.product_code ?? '未填' }}</td>
                    <td>{{ line.product_name }}</td>
                    <td>{{ line.specification ?? '未填' }}</td>
                    <td>{{ line.quantity }} {{ line.unit }}</td>
                    <td>{{ line.requirement ?? '未填' }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>进度记录</strong>
                <span>{{ selectedSampleRequest.progress_events.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>阶段</th>
                    <th>状态</th>
                    <th>日期</th>
                    <th>经办</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="progress in selectedSampleRequest.progress_events" :key="progress.id">
                    <td>{{ sampleStageLabel(progress.stage) }}</td>
                    <td>{{ sampleStatusLabel(progress.status) }}</td>
                    <td>{{ progress.occurred_at }}</td>
                    <td>{{ progress.handler_name ?? '未填' }}</td>
                    <td>{{ progress.note ?? '未填' }}</td>
                  </tr>
                  <tr v-if="selectedSampleRequest.progress_events.length === 0">
                    <td colspan="5" class="empty-cell">暂无进度记录</td>
                  </tr>
                </tbody>
              </table>

              <form class="record-form accessory-form" @submit.prevent="submitSampleProgress">
                <div class="form-divider">更新打样进度</div>
                <div class="form-pair three">
                  <label for="sample-progress-stage">
                    进度阶段
                    <select
                      id="sample-progress-stage"
                      v-model="sampleProgressForm.stage"
                      aria-label="进度阶段"
                    >
                      <option value="internal_order">内部打样单</option>
                      <option value="sent_to_factory">外发工厂</option>
                      <option value="received_sample">收到样品</option>
                      <option value="confirmed">客户确认</option>
                    </select>
                  </label>
                  <label for="sample-progress-status">
                    进度状态
                    <select
                      id="sample-progress-status"
                      v-model="sampleProgressForm.status"
                      aria-label="进度状态"
                    >
                      <option value="sent">已发送</option>
                      <option value="in_progress">进行中</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </label>
                  <label for="sample-progress-date">
                    进度日期
                    <input
                      id="sample-progress-date"
                      v-model="sampleProgressForm.occurred_at"
                      required
                      type="date"
                    />
                  </label>
                </div>
                <div class="form-pair two">
                  <label for="sample-progress-handler">
                    进度经办人
                    <input
                      id="sample-progress-handler"
                      v-model="sampleProgressForm.handler_name"
                      maxlength="160"
                    />
                  </label>
                  <label for="sample-progress-note">
                    进度说明
                    <input id="sample-progress-note" v-model="sampleProgressForm.note" maxlength="2000" />
                  </label>
                </div>
                <button class="secondary-button" type="submit">
                  <Save :size="18" />
                  <span>更新打样进度</span>
                </button>
              </form>

              <div class="accessory-heading">
                <strong>打样费用</strong>
                <span>{{ selectedSampleRequest.fees.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>费用类型</th>
                    <th>金额</th>
                    <th>收款方</th>
                    <th>付款状态</th>
                    <th>付款申请</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="fee in selectedSampleRequest.fees" :key="fee.id">
                    <td>{{ sampleFeeTypeLabel(fee.fee_type) }}</td>
                    <td>{{ fee.currency }} {{ fee.amount }}</td>
                    <td>{{ fee.payee_name }}</td>
                    <td>{{ samplePaymentStatusLabel(fee.payment_status) }}</td>
                    <td>
                      <button
                        v-if="fee.payment_status === 'not_requested'"
                        class="text-button inline-action"
                        type="button"
                        @click="submitSampleFeePayment(fee.id)"
                      >
                        发起付款
                      </button>
                      <span v-else>{{ fee.payment_request_no ?? '已申请' }}</span>
                    </td>
                  </tr>
                  <tr v-if="selectedSampleRequest.fees.length === 0">
                    <td colspan="5" class="empty-cell">暂无打样费用</td>
                  </tr>
                </tbody>
              </table>

              <form class="record-form accessory-form" @submit.prevent="submitSampleFee">
                <div class="form-divider">登记打样费用</div>
                <div class="form-pair three">
                  <label for="sample-fee-type">
                    打样费用类型
                    <select
                      id="sample-fee-type"
                      v-model="sampleFeeForm.fee_type"
                      aria-label="打样费用类型"
                    >
                      <option value="sample_making">打样费</option>
                      <option value="material">材料费</option>
                      <option value="delivery">寄送费</option>
                    </select>
                  </label>
                  <label for="sample-fee-amount">
                    打样费用金额
                    <input
                      id="sample-fee-amount"
                      v-model="sampleFeeForm.amount"
                      required
                      min="0"
                      step="0.01"
                      type="number"
                    />
                  </label>
                  <label for="sample-fee-currency">
                    打样费用币种
                    <input
                      id="sample-fee-currency"
                      v-model="sampleFeeForm.currency"
                      required
                      maxlength="10"
                    />
                  </label>
                </div>
                <div class="form-pair two">
                  <label for="sample-fee-payee-type">
                    收款方类型
                    <select
                      id="sample-fee-payee-type"
                      v-model="sampleFeeForm.payee_type"
                      aria-label="收款方类型"
                    >
                      <option value="supplier">供应商</option>
                      <option value="partner">合作伙伴</option>
                      <option value="other">其他</option>
                    </select>
                  </label>
                  <label for="sample-fee-payee-name">
                    收款方名称
                    <input
                      id="sample-fee-payee-name"
                      v-model="sampleFeeForm.payee_name"
                      required
                      maxlength="240"
                    />
                  </label>
                </div>
                <label for="sample-fee-remark">
                  打样费用备注
                  <textarea id="sample-fee-remark" v-model="sampleFeeForm.remark" rows="2" maxlength="2000" />
                </label>
                <button class="secondary-button" type="submit">
                  <Plus :size="18" />
                  <span>登记打样费用</span>
                </button>
              </form>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="isSampleRecordPage">
        <section class="summary-strip product-summary" aria-label="样品登记概览">
          <div v-for="item in sampleRecordStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="sampleRecordMessage" class="success-banner">{{ sampleRecordMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>样品列表</h2>
              <form class="search-form" @submit.prevent="loadSampleRecords">
                <label>
                  <span>样品搜索</span>
                  <input v-model="sampleRecordSearch" placeholder="编号 / 产品 / 客户货号" />
                </label>
                <label>
                  <span>样品分类</span>
                  <select v-model="sampleRecordTypeFilter">
                    <option value="">全部分类</option>
                    <option value="incoming">来样</option>
                    <option value="confirm_sample">确认样</option>
                    <option value="bulk_sample">大货样</option>
                    <option value="retained_sample">留样</option>
                  </select>
                </label>
                <label>
                  <span>客户标识</span>
                  <input v-model="sampleRecordCustomerFilter" placeholder="customer-id" />
                </label>
                <label>
                  <span>采购合同</span>
                  <input v-model="sampleRecordContractFilter" placeholder="purchase-contract-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>样品编号</th>
                    <th>分类</th>
                    <th>产品</th>
                    <th>客户货号</th>
                    <th>收样</th>
                    <th>留样</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in sampleRecords"
                    :key="item.id"
                    :class="{ selected: item.id === selectedSampleRecord?.id }"
                    @click="selectSampleRecord(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ sampleRecordTypeLabel(item.sample_type) }}</td>
                    <td>{{ item.product_name }}</td>
                    <td>{{ item.customer_sku ?? '未填' }}</td>
                    <td>{{ item.stock_summary.received_quantity }} {{ item.stock_summary.unit }}</td>
                    <td>{{ item.stock_summary.retained_quantity }} {{ item.stock_summary.unit }}</td>
                  </tr>
                  <tr v-if="sampleRecords.length === 0">
                    <td colspan="6" class="empty-cell">暂无样品记录</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>新增样品</h2>
              <Images :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitSampleRecord">
              <div class="form-pair two">
                <label for="sample-record-code">
                  样品编号
                  <input id="sample-record-code" v-model="sampleRecordForm.code" required maxlength="80" />
                </label>
                <label for="sample-record-type">
                  样品分类
                  <select
                    id="sample-record-type"
                    v-model="sampleRecordForm.sample_type"
                    aria-label="样品分类"
                  >
                    <option value="incoming">来样</option>
                    <option value="confirm_sample">确认样</option>
                    <option value="bulk_sample">大货样</option>
                    <option value="retained_sample">留样</option>
                  </select>
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-record-status">
                  样品状态
                  <select
                    id="sample-record-status"
                    v-model="sampleRecordForm.status"
                    aria-label="样品状态"
                  >
                    <option value="registered">已登记</option>
                    <option value="submitted">已提交</option>
                    <option value="confirmed">已确认</option>
                    <option value="archived">归档</option>
                  </select>
                </label>
                <label for="sample-record-quantity">
                  收样数量
                  <input
                    id="sample-record-quantity"
                    v-model="sampleRecordForm.quantity"
                    required
                    min="0.0001"
                    step="0.0001"
                    type="number"
                  />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-record-received-at">
                  收样日期
                  <input
                    id="sample-record-received-at"
                    v-model="sampleRecordForm.received_at"
                    required
                    type="date"
                  />
                </label>
                <label for="sample-record-submitted-at">
                  提交日期
                  <input id="sample-record-submitted-at" v-model="sampleRecordForm.submitted_at" type="date" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-record-product-code">
                  产品编号
                  <input id="sample-record-product-code" v-model="sampleRecordForm.product_code" maxlength="80" />
                </label>
                <label for="sample-record-product-name">
                  产品名称
                  <input
                    id="sample-record-product-name"
                    v-model="sampleRecordForm.product_name"
                    required
                    maxlength="240"
                  />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-record-customer-sku">
                  客户货号
                  <input id="sample-record-customer-sku" v-model="sampleRecordForm.customer_sku" maxlength="120" />
                </label>
                <label for="sample-record-supplier-sku">
                  供应商货号
                  <input id="sample-record-supplier-sku" v-model="sampleRecordForm.supplier_sku" maxlength="120" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-record-customer-name">
                  客户名称
                  <input id="sample-record-customer-name" v-model="sampleRecordForm.customer_name" maxlength="240" />
                </label>
                <label for="sample-record-supplier-name">
                  供应商名称
                  <input id="sample-record-supplier-name" v-model="sampleRecordForm.supplier_name" maxlength="240" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-record-contract-no">
                  采购合同号
                  <input
                    id="sample-record-contract-no"
                    v-model="sampleRecordForm.purchase_contract_no"
                    maxlength="80"
                  />
                </label>
                <label for="sample-record-unit">
                  单位
                  <input id="sample-record-unit" v-model="sampleRecordForm.unit" required maxlength="40" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-record-source-type">
                  样品来源
                  <select
                    id="sample-record-source-type"
                    v-model="sampleRecordForm.source_type"
                    aria-label="样品来源"
                  >
                    <option value="sample_request">打样管理</option>
                    <option value="customer_sample">客户来样</option>
                    <option value="purchase_contract">采购合同</option>
                    <option value="manual">手工登记</option>
                  </select>
                </label>
                <label for="sample-record-source-code">
                  来源单号
                  <input id="sample-record-source-code" v-model="sampleRecordForm.source_code" maxlength="80" />
                </label>
              </div>
              <label for="sample-record-description">
                样品说明
                <textarea
                  id="sample-record-description"
                  v-model="sampleRecordForm.description"
                  rows="2"
                  maxlength="4000"
                />
              </label>

              <div class="form-divider">样品图片</div>
              <div class="form-pair two">
                <label for="sample-record-image-file-id">
                  图片文件标识
                  <input
                    id="sample-record-image-file-id"
                    v-model="sampleRecordForm.image_file_id"
                    required
                    maxlength="120"
                  />
                </label>
                <label for="sample-record-image-filename">
                  图片文件名
                  <input
                    id="sample-record-image-filename"
                    v-model="sampleRecordForm.image_filename"
                    required
                    maxlength="240"
                  />
                </label>
              </div>
              <label for="sample-record-image-url">
                图片地址
                <input id="sample-record-image-url" v-model="sampleRecordForm.image_url" required maxlength="2000" />
              </label>
              <label for="sample-record-image-caption">
                图片说明
                <input id="sample-record-image-caption" v-model="sampleRecordForm.image_caption" maxlength="240" />
              </label>
              <label class="checkbox-label">
                <input v-model="sampleRecordForm.image_is_primary" type="checkbox" />
                主图
              </label>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>新增样品</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>样品明细</h2>
              <span>{{ selectedSampleRecord?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedSampleRecord" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>分类/状态</dt>
                  <dd>
                    {{ sampleRecordTypeLabel(selectedSampleRecord.sample_type) }} /
                    {{ sampleRecordStatusLabel(selectedSampleRecord.status) }}
                  </dd>
                </div>
                <div>
                  <dt>产品</dt>
                  <dd>{{ selectedSampleRecord.product_name }}</dd>
                </div>
                <div>
                  <dt>客户货号</dt>
                  <dd>{{ selectedSampleRecord.customer_sku ?? '未填' }}</dd>
                </div>
                <div>
                  <dt>供应商货号</dt>
                  <dd>{{ selectedSampleRecord.supplier_sku ?? '未填' }}</dd>
                </div>
                <div>
                  <dt>采购合同</dt>
                  <dd>{{ selectedSampleRecord.purchase_contract_no ?? '未关联' }}</dd>
                </div>
                <div>
                  <dt>来源</dt>
                  <dd>
                    {{ sampleSourceTypeLabel(selectedSampleRecord.source_type) }} /
                    {{ selectedSampleRecord.source_code ?? '未填' }}
                  </dd>
                </div>
              </dl>

              <div class="transaction-box">
                <strong>样品说明</strong>
                <p>{{ selectedSampleRecord.description ?? selectedSampleRecord.source_note ?? '未填' }}</p>
              </div>

              <div class="accessory-heading">
                <strong>数量汇总</strong>
                <span>{{ selectedSampleRecord.stock_summary.unit }}</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>收样数</th>
                    <th>寄样数</th>
                    <th>公司留样</th>
                    <th>收样日期</th>
                    <th>提交日期</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ selectedSampleRecord.stock_summary.received_quantity }}</td>
                    <td>{{ selectedSampleRecord.stock_summary.delivered_quantity }}</td>
                    <td>{{ selectedSampleRecord.stock_summary.retained_quantity }}</td>
                    <td>{{ selectedSampleRecord.received_at }}</td>
                    <td>{{ selectedSampleRecord.submitted_at ?? '未提交' }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>样品图片</strong>
                <span>{{ selectedSampleRecord.images.length }} 张</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>文件名</th>
                    <th>说明</th>
                    <th>主图</th>
                    <th>地址</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="image in selectedSampleRecord.images" :key="image.id">
                    <td>{{ image.filename }}</td>
                    <td>{{ image.caption ?? '未填' }}</td>
                    <td>{{ image.is_primary ? '是' : '否' }}</td>
                    <td>{{ image.url }}</td>
                  </tr>
                  <tr v-if="selectedSampleRecord.images.length === 0">
                    <td colspan="4" class="empty-cell">暂无图片</td>
                  </tr>
                </tbody>
              </table>

              <form class="record-form accessory-form" @submit.prevent="submitSampleRecordImage">
                <div class="form-divider">追加样品图片</div>
                <div class="form-pair two">
                  <label for="sample-record-extra-image-file-id">
                    图片文件标识
                    <input
                      id="sample-record-extra-image-file-id"
                      v-model="sampleRecordImageForm.file_id"
                      required
                      maxlength="120"
                    />
                  </label>
                  <label for="sample-record-extra-image-filename">
                    图片文件名
                    <input
                      id="sample-record-extra-image-filename"
                      v-model="sampleRecordImageForm.filename"
                      required
                      maxlength="240"
                    />
                  </label>
                </div>
                <label for="sample-record-extra-image-url">
                  图片地址
                  <input
                    id="sample-record-extra-image-url"
                    v-model="sampleRecordImageForm.url"
                    required
                    maxlength="2000"
                  />
                </label>
                <label for="sample-record-extra-image-caption">
                  图片说明
                  <input
                    id="sample-record-extra-image-caption"
                    v-model="sampleRecordImageForm.caption"
                    maxlength="240"
                  />
                </label>
                <label class="checkbox-label">
                  <input v-model="sampleRecordImageForm.is_primary" type="checkbox" />
                  主图
                </label>
                <button class="secondary-button" type="submit">
                  <Plus :size="18" />
                  <span>追加样品图片</span>
                </button>
              </form>

              <div class="accessory-heading">
                <strong>数量事件</strong>
                <span>{{ selectedSampleRecord.stock_events.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>数量</th>
                    <th>日期</th>
                    <th>寄样单</th>
                    <th>接收方</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="event in selectedSampleRecord.stock_events" :key="event.id">
                    <td>{{ sampleStockEventLabel(event.event_type) }}</td>
                    <td>{{ event.quantity }} {{ event.unit }}</td>
                    <td>{{ event.occurred_at }}</td>
                    <td>{{ event.delivery_no ?? '未关联' }}</td>
                    <td>{{ event.recipient ?? '未填' }}</td>
                  </tr>
                </tbody>
              </table>

              <form class="record-form accessory-form" @submit.prevent="submitSampleRecordStockEvent">
                <div class="form-divider">登记寄样数量</div>
                <div class="form-pair three">
                  <label for="sample-record-stock-event-type">
                    事件类型
                    <select
                      id="sample-record-stock-event-type"
                      v-model="sampleRecordStockForm.event_type"
                      aria-label="事件类型"
                    >
                      <option value="delivered">寄样</option>
                      <option value="received">收样</option>
                    </select>
                  </label>
                  <label for="sample-record-stock-quantity">
                    数量
                    <input
                      id="sample-record-stock-quantity"
                      v-model="sampleRecordStockForm.quantity"
                      required
                      min="0.0001"
                      step="0.0001"
                      type="number"
                    />
                  </label>
                  <label for="sample-record-stock-date">
                    日期
                    <input
                      id="sample-record-stock-date"
                      v-model="sampleRecordStockForm.occurred_at"
                      required
                      type="date"
                    />
                  </label>
                </div>
                <div class="form-pair three">
                  <label for="sample-record-stock-unit">
                    单位
                    <input id="sample-record-stock-unit" v-model="sampleRecordStockForm.unit" required maxlength="40" />
                  </label>
                  <label for="sample-record-delivery-no">
                    寄样单号
                    <input id="sample-record-delivery-no" v-model="sampleRecordStockForm.delivery_no" maxlength="80" />
                  </label>
                  <label for="sample-record-recipient">
                    接收方
                    <input id="sample-record-recipient" v-model="sampleRecordStockForm.recipient" maxlength="240" />
                  </label>
                </div>
                <label for="sample-record-stock-note">
                  事件备注
                  <input id="sample-record-stock-note" v-model="sampleRecordStockForm.note" maxlength="2000" />
                </label>
                <button class="secondary-button" type="submit">
                  <Save :size="18" />
                  <span>登记样品数量</span>
                </button>
              </form>

              <div class="accessory-heading">
                <strong>采购跟单节点</strong>
                <span>{{ selectedSampleRecord.followup_events.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>节点</th>
                    <th>实际日期</th>
                    <th>采购合同</th>
                    <th>事件</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="event in selectedSampleRecord.followup_events" :key="event.id">
                    <td>{{ event.node_label }}</td>
                    <td>{{ event.actual_date }}</td>
                    <td>{{ event.purchase_contract_no ?? '未关联' }}</td>
                    <td>{{ event.event_type }}</td>
                  </tr>
                  <tr v-if="selectedSampleRecord.followup_events.length === 0">
                    <td colspan="4" class="empty-cell">暂无跟单节点事件</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="isSampleDeliveryPage">
        <section class="summary-strip delivery-summary" aria-label="寄样管理概览">
          <div v-for="item in sampleDeliveryStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="sampleDeliveryMessage" class="success-banner">{{ sampleDeliveryMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>寄样单列表</h2>
              <form class="search-form" @submit.prevent="loadSampleDeliveries">
                <label>
                  <span>寄样搜索</span>
                  <input v-model="sampleDeliverySearch" placeholder="单号 / 客户 / 样品 / 快递" />
                </label>
                <label>
                  <span>审核状态</span>
                  <select v-model="sampleDeliveryStatusFilter">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="submitted">待审核</option>
                    <option value="approved">已审核</option>
                    <option value="shipped">已寄出</option>
                  </select>
                </label>
                <label>
                  <span>客户标识</span>
                  <input v-model="sampleDeliveryCustomerFilter" placeholder="customer-id" />
                </label>
                <label>
                  <span>快递公司</span>
                  <input v-model="sampleDeliveryExpressFilter" placeholder="DHL / FedEx" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>寄样单号</th>
                    <th>状态</th>
                    <th>客户</th>
                    <th>快递</th>
                    <th>报价单</th>
                    <th>费用</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in sampleDeliveries"
                    :key="item.id"
                    :class="{ selected: item.id === selectedSampleDelivery?.id }"
                    @click="selectSampleDelivery(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ sampleDeliveryStatusLabel(item.status) }}</td>
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.express_company }} / {{ item.tracking_no ?? '未填' }}</td>
                    <td>{{ item.quote_no ?? '未关联' }}</td>
                    <td>{{ formatMoney(item.fee_total, item.fees[0]?.currency ?? '') }}</td>
                  </tr>
                  <tr v-if="sampleDeliveries.length === 0">
                    <td colspan="6" class="empty-cell">暂无寄样单</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>新增寄样单</h2>
              <Send :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitSampleDeliveryForm">
              <div class="form-pair two">
                <label for="sample-delivery-code">
                  寄样单号
                  <input id="sample-delivery-code" v-model="sampleDeliveryForm.code" required maxlength="80" />
                </label>
                <label for="sample-delivery-date">
                  寄样日期
                  <input id="sample-delivery-date" v-model="sampleDeliveryForm.delivery_date" required type="date" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-delivery-customer-id">
                  客户标识
                  <input id="sample-delivery-customer-id" v-model="sampleDeliveryForm.customer_id" maxlength="36" />
                </label>
                <label for="sample-delivery-customer-name">
                  客户名称
                  <input id="sample-delivery-customer-name" v-model="sampleDeliveryForm.customer_name" required maxlength="240" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-delivery-supplier-name">
                  供应商
                  <input id="sample-delivery-supplier-name" v-model="sampleDeliveryForm.supplier_name" maxlength="240" />
                </label>
                <label for="sample-delivery-factory-name">
                  工厂
                  <input id="sample-delivery-factory-name" v-model="sampleDeliveryForm.factory_name" maxlength="240" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-delivery-recipient-name">
                  收件人
                  <input id="sample-delivery-recipient-name" v-model="sampleDeliveryForm.recipient_name" required maxlength="160" />
                </label>
                <label for="sample-delivery-recipient-company">
                  收件公司
                  <input id="sample-delivery-recipient-company" v-model="sampleDeliveryForm.recipient_company" maxlength="240" />
                </label>
              </div>
              <label for="sample-delivery-recipient-address">
                收件地址
                <input id="sample-delivery-recipient-address" v-model="sampleDeliveryForm.recipient_address" required maxlength="2000" />
              </label>
              <div class="form-pair two">
                <label for="sample-delivery-express-company">
                  快递公司
                  <input id="sample-delivery-express-company" v-model="sampleDeliveryForm.express_company" required maxlength="120" />
                </label>
                <label for="sample-delivery-tracking-no">
                  快递单号
                  <input id="sample-delivery-tracking-no" v-model="sampleDeliveryForm.tracking_no" maxlength="120" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-delivery-quote-no">
                  报价单号
                  <input id="sample-delivery-quote-no" v-model="sampleDeliveryForm.quote_no" maxlength="80" />
                </label>
                <label for="sample-delivery-quote-id">
                  报价标识
                  <input id="sample-delivery-quote-id" v-model="sampleDeliveryForm.quote_id" maxlength="36" />
                </label>
              </div>

              <div class="form-divider">寄样明细</div>
              <div class="form-pair two">
                <label for="sample-delivery-record-id">
                  样品标识
                  <input id="sample-delivery-record-id" v-model="sampleDeliveryForm.sample_record_id" required maxlength="36" />
                </label>
                <label for="sample-delivery-sample-code">
                  样品编号
                  <input id="sample-delivery-sample-code" v-model="sampleDeliveryForm.sample_code" maxlength="80" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-delivery-sample-type">
                  样品分类
                  <select
                    id="sample-delivery-sample-type"
                    v-model="sampleDeliveryForm.sample_type"
                    aria-label="样品分类"
                  >
                    <option value="incoming">来样</option>
                    <option value="confirm_sample">确认样</option>
                    <option value="bulk_sample">大货样</option>
                    <option value="retained_sample">留样</option>
                  </select>
                </label>
                <label for="sample-delivery-product-code">
                  产品编号
                  <input id="sample-delivery-product-code" v-model="sampleDeliveryForm.product_code" maxlength="80" />
                </label>
              </div>
              <label for="sample-delivery-product-name">
                产品名称
                <input id="sample-delivery-product-name" v-model="sampleDeliveryForm.product_name" required maxlength="240" />
              </label>
              <div class="form-pair two">
                <label for="sample-delivery-line-quantity">
                  寄样数量
                  <input id="sample-delivery-line-quantity" v-model="sampleDeliveryForm.quantity" required min="0.0001" step="0.0001" type="number" />
                </label>
                <label for="sample-delivery-line-unit">
                  单位
                  <input id="sample-delivery-line-unit" v-model="sampleDeliveryForm.unit" required maxlength="40" />
                </label>
              </div>
              <label for="sample-delivery-line-remark">
                明细备注
                <input id="sample-delivery-line-remark" v-model="sampleDeliveryForm.line_remark" maxlength="2000" />
              </label>

              <div class="form-divider">费用登记</div>
              <div class="form-pair two">
                <label for="sample-delivery-fee-type">
                  费用类型
                  <select
                    id="sample-delivery-fee-type"
                    v-model="sampleDeliveryForm.fee_type"
                    aria-label="费用类型"
                  >
                    <option value="express">快递费</option>
                    <option value="insurance">保险费</option>
                    <option value="other">其他费用</option>
                  </select>
                </label>
                <label for="sample-delivery-fee-amount">
                  金额
                  <input id="sample-delivery-fee-amount" v-model="sampleDeliveryForm.fee_amount" required min="0" step="0.01" type="number" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="sample-delivery-fee-currency">
                  币种
                  <input id="sample-delivery-fee-currency" v-model="sampleDeliveryForm.fee_currency" required maxlength="10" />
                </label>
                <label for="sample-delivery-fee-payer">
                  承担方
                  <select
                    id="sample-delivery-fee-payer"
                    v-model="sampleDeliveryForm.fee_payer_type"
                    aria-label="承担方"
                  >
                    <option value="company">公司承担</option>
                    <option value="customer">客户承担</option>
                    <option value="supplier">供应商承担</option>
                  </select>
                </label>
              </div>
              <label for="sample-delivery-fee-remark">
                费用备注
                <input id="sample-delivery-fee-remark" v-model="sampleDeliveryForm.fee_remark" maxlength="2000" />
              </label>
              <label for="sample-delivery-remark">
                寄样备注
                <textarea id="sample-delivery-remark" v-model="sampleDeliveryForm.remark" rows="2" maxlength="4000" />
              </label>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>新增寄样单</span>
              </button>
              <button
                class="secondary-button"
                type="button"
                :disabled="selectedSampleDelivery?.status !== 'draft'"
                @click="updateSelectedSampleDeliveryDraft"
              >
                <Save :size="18" />
                <span>保存草稿编辑</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>寄样明细</h2>
              <span>{{ selectedSampleDelivery?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedSampleDelivery" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>状态/日期</dt>
                  <dd>{{ sampleDeliveryStatusLabel(selectedSampleDelivery.status) }} / {{ selectedSampleDelivery.delivery_date }}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{{ selectedSampleDelivery.customer_name }}</dd>
                </div>
                <div>
                  <dt>供应商/工厂</dt>
                  <dd>{{ selectedSampleDelivery.supplier_name ?? '未填' }} / {{ selectedSampleDelivery.factory_name ?? '未填' }}</dd>
                </div>
                <div>
                  <dt>收件方</dt>
                  <dd>{{ selectedSampleDelivery.recipient_name }} / {{ selectedSampleDelivery.recipient_company ?? '未填' }}</dd>
                </div>
                <div>
                  <dt>快递</dt>
                  <dd>{{ selectedSampleDelivery.express_company }} / {{ selectedSampleDelivery.tracking_no ?? '未填' }}</dd>
                </div>
                <div>
                  <dt>报价单</dt>
                  <dd>{{ selectedSampleDelivery.quote_no ?? '未关联' }}</dd>
                </div>
                <div>
                  <dt>费用合计</dt>
                  <dd>{{ formatMoney(selectedSampleDelivery.fee_total, selectedSampleDelivery.fees[0]?.currency ?? '') }}</dd>
                </div>
                <div>
                  <dt>审核人</dt>
                  <dd>{{ selectedSampleDelivery.reviewer_name ?? '未审核' }}</dd>
                </div>
              </dl>

              <div class="transaction-box">
                <strong>寄样备注</strong>
                <p>{{ selectedSampleDelivery.remark ?? selectedSampleDelivery.recipient_address }}</p>
              </div>

              <div class="delivery-action-row">
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="selectedSampleDelivery.status !== 'draft'"
                  @click="fillSampleDeliveryForm(selectedSampleDelivery)"
                >
                  <FileText :size="18" />
                  <span>载入编辑</span>
                </button>
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="selectedSampleDelivery.status !== 'draft'"
                  @click="submitSampleDeliveryForReview"
                >
                  <Save :size="18" />
                  <span>提交审核</span>
                </button>
                <button
                  class="primary-button"
                  type="button"
                  :disabled="selectedSampleDelivery.status !== 'submitted'"
                  @click="approveSelectedSampleDelivery"
                >
                  <CheckCircle2 :size="18" />
                  <span>审核通过</span>
                </button>
              </div>

              <form class="record-form accessory-form" @submit.prevent="submitSampleDeliveryTrackingUpdate">
                <div class="form-divider">物流跟踪</div>
                <div class="form-pair three">
                  <label for="sample-delivery-track-company">
                    快递公司
                    <input id="sample-delivery-track-company" v-model="sampleDeliveryTrackingForm.express_company" required maxlength="120" />
                  </label>
                  <label for="sample-delivery-track-no">
                    快递单号
                    <input id="sample-delivery-track-no" v-model="sampleDeliveryTrackingForm.tracking_no" required maxlength="120" />
                  </label>
                  <label for="sample-delivery-track-status">
                    物流状态
                    <select
                      id="sample-delivery-track-status"
                      v-model="sampleDeliveryTrackingForm.status"
                      aria-label="物流状态"
                    >
                      <option value="submitted">待审核</option>
                      <option value="approved">已审核</option>
                      <option value="shipped">已寄出</option>
                    </select>
                  </label>
                </div>
                <button class="secondary-button" type="submit">
                  <Save :size="18" />
                  <span>更新物流</span>
                </button>
              </form>

              <div class="accessory-heading">
                <strong>寄样明细</strong>
                <span>{{ selectedSampleDelivery.lines.length }} 行</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>样品编号</th>
                    <th>产品</th>
                    <th>数量</th>
                    <th>分类</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedSampleDelivery.lines" :key="line.id">
                    <td>{{ line.sample_code ?? line.sample_record_id }}</td>
                    <td>{{ line.product_code ?? '未填' }} / {{ line.product_name }}</td>
                    <td>{{ line.quantity }} {{ line.unit }}</td>
                    <td>{{ sampleRecordTypeLabel(line.sample_type) }}</td>
                    <td>{{ line.remark ?? '未填' }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>费用明细</strong>
                <span>{{ selectedSampleDelivery.fees.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>费用类型</th>
                    <th>金额</th>
                    <th>承担方</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="fee in selectedSampleDelivery.fees" :key="fee.id">
                    <td>{{ sampleDeliveryFeeTypeLabel(fee.fee_type) }}</td>
                    <td>{{ formatMoney(fee.amount, fee.currency) }}</td>
                    <td>{{ sampleDeliveryPayerTypeLabel(fee.payer_type) }}</td>
                    <td>{{ fee.remark ?? '未填' }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>费用统计</strong>
                <span>{{ formatMoney(sampleDeliveryFeeStatistics.total_amount, sampleDeliveryFeeStatistics.currency) }}</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>客户</th>
                    <th>快递公司</th>
                    <th>寄样单数</th>
                    <th>费用合计</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in sampleDeliveryFeeStatistics.items" :key="`${item.customer_id}-${item.express_company}-${item.currency}`">
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.express_company }}</td>
                    <td>{{ item.delivery_count }}</td>
                    <td>{{ formatMoney(item.total_amount, item.currency) }}</td>
                  </tr>
                  <tr v-if="sampleDeliveryFeeStatistics.items.length === 0">
                    <td colspan="4" class="empty-cell">暂无已审核费用</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>样品寄样历史</strong>
                <span>{{ sampleDeliverySampleHistory.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>寄样单</th>
                    <th>客户</th>
                    <th>日期</th>
                    <th>状态</th>
                    <th>快递</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in sampleDeliverySampleHistory" :key="item.id">
                    <td>{{ item.code }}</td>
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.delivery_date }}</td>
                    <td>{{ sampleDeliveryStatusLabel(item.status) }}</td>
                    <td>{{ item.express_company }} / {{ item.tracking_no ?? '未填' }}</td>
                  </tr>
                  <tr v-if="sampleDeliverySampleHistory.length === 0">
                    <td colspan="5" class="empty-cell">暂无该样品寄样历史</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>报价关联寄样</strong>
                <span>{{ sampleDeliveryQuoteHistory.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>报价单</th>
                    <th>寄样单</th>
                    <th>客户</th>
                    <th>产品</th>
                    <th>审核日期</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in sampleDeliveryQuoteHistory" :key="item.id">
                    <td>{{ item.quote_no ?? '未关联' }}</td>
                    <td>{{ item.code }}</td>
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.lines[0]?.product_name ?? '未填' }}</td>
                    <td>{{ item.approved_at ?? '未审核' }}</td>
                  </tr>
                  <tr v-if="sampleDeliveryQuoteHistory.length === 0">
                    <td colspan="5" class="empty-cell">暂无报价关联寄样记录</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="isExportQuotationPage">
        <section class="summary-strip delivery-summary" aria-label="出口报价概览">
          <div v-for="item in exportQuotationStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="exportQuotationMessage" class="success-banner">{{ exportQuotationMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>报价单列表</h2>
              <form class="search-form" @submit.prevent="loadExportQuotations">
                <label>
                  <span>报价搜索</span>
                  <input v-model="exportQuotationSearch" placeholder="单号 / 客户 / 产品 / 条款" />
                </label>
                <label>
                  <span>审批状态</span>
                  <select v-model="exportQuotationStatusFilter">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="submitted">待审批</option>
                    <option value="approved">已审批</option>
                    <option value="contract_generated">已生成合同</option>
                  </select>
                </label>
                <label>
                  <span>客户标识</span>
                  <input v-model="exportQuotationCustomerFilter" placeholder="customer-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>报价单号</th>
                    <th>状态</th>
                    <th>客户</th>
                    <th>贸易条款</th>
                    <th>有效期</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in exportQuotations"
                    :key="item.id"
                    :class="{ selected: item.id === selectedExportQuotation?.id }"
                    @click="selectExportQuotation(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ exportQuotationStatusLabel(item.approval_status) }}</td>
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.trade_term }}</td>
                    <td>{{ item.valid_until ?? '未设置' }}</td>
                    <td>{{ formatMoney(item.total_amount, item.currency) }}</td>
                  </tr>
                  <tr v-if="exportQuotations.length === 0">
                    <td colspan="6" class="empty-cell">暂无出口报价</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>新增出口报价</h2>
              <FilePenLine :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitExportQuotationForm">
              <div class="form-pair two">
                <label for="export-quotation-code">
                  报价单号
                  <input id="export-quotation-code" v-model="exportQuotationForm.code" required maxlength="80" />
                </label>
                <label for="export-quotation-date">
                  报价日期
                  <input id="export-quotation-date" v-model="exportQuotationForm.quote_date" required type="date" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="export-quotation-customer-id">
                  客户标识
                  <input id="export-quotation-customer-id" v-model="exportQuotationForm.customer_id" maxlength="36" />
                </label>
                <label for="export-quotation-customer-name">
                  客户名称
                  <input id="export-quotation-customer-name" v-model="exportQuotationForm.customer_name" required maxlength="240" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="export-quotation-sales-user">
                  业务员
                  <input id="export-quotation-sales-user" v-model="exportQuotationForm.sales_user_name" maxlength="160" />
                </label>
                <label for="export-quotation-currency">
                  币种
                  <input id="export-quotation-currency" v-model="exportQuotationForm.currency" required maxlength="10" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="export-quotation-trade-term">
                  贸易条款
                  <input id="export-quotation-trade-term" v-model="exportQuotationForm.trade_term" required maxlength="80" />
                </label>
                <label for="export-quotation-valid-until">
                  有效期
                  <input id="export-quotation-valid-until" v-model="exportQuotationForm.valid_until" type="date" />
                </label>
              </div>
              <label for="export-quotation-description">
                报价描述
                <textarea id="export-quotation-description" v-model="exportQuotationForm.description" rows="2" maxlength="4000" />
              </label>

              <div class="form-divider">报价商品明细</div>
              <div class="form-pair two">
                <label for="export-quotation-product-id">
                  商品标识
                  <input id="export-quotation-product-id" v-model="exportQuotationForm.product_id" maxlength="36" />
                </label>
                <label for="export-quotation-product-code">
                  商品编号
                  <input id="export-quotation-product-code" v-model="exportQuotationForm.product_code" maxlength="80" />
                </label>
              </div>
              <label for="export-quotation-product-name">
                商品名称
                <input id="export-quotation-product-name" v-model="exportQuotationForm.product_name" required maxlength="240" />
              </label>
              <div class="form-pair two">
                <label for="export-quotation-specification">
                  规格
                  <input id="export-quotation-specification" v-model="exportQuotationForm.specification" maxlength="240" />
                </label>
                <label for="export-quotation-model">
                  型号
                  <input id="export-quotation-model" v-model="exportQuotationForm.model" maxlength="120" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="export-quotation-quantity">
                  数量
                  <input id="export-quotation-quantity" v-model="exportQuotationForm.quantity" required min="0.0001" step="0.0001" type="number" />
                </label>
                <label for="export-quotation-unit">
                  单位
                  <input id="export-quotation-unit" v-model="exportQuotationForm.unit" required maxlength="40" />
                </label>
                <label for="export-quotation-unit-price">
                  销售单价
                  <input id="export-quotation-unit-price" v-model="exportQuotationForm.unit_price" required min="0.0001" step="0.0001" type="number" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="export-quotation-freight-method">
                  货运方式
                  <select id="export-quotation-freight-method" v-model="exportQuotationForm.freight_method" aria-label="货运方式">
                    <option value="sea">海运</option>
                    <option value="air">空运</option>
                    <option value="rail">铁路</option>
                    <option value="courier">快递</option>
                  </select>
                </label>
                <label for="export-quotation-freight-amount">
                  运费
                  <input id="export-quotation-freight-amount" v-model="exportQuotationForm.freight_amount" required min="0" step="0.01" type="number" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="export-quotation-reference-supplier">
                  采购参考供应商
                  <input id="export-quotation-reference-supplier" v-model="exportQuotationForm.purchase_reference_supplier_name" maxlength="240" />
                </label>
                <label for="export-quotation-reference-price">
                  采购参考价
                  <input id="export-quotation-reference-price" v-model="exportQuotationForm.purchase_reference_price" min="0" step="0.0001" type="number" />
                </label>
              </div>
              <label for="export-quotation-line-remark">
                明细备注
                <input id="export-quotation-line-remark" v-model="exportQuotationForm.line_remark" maxlength="2000" />
              </label>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>新增出口报价</span>
              </button>
              <button
                class="secondary-button"
                type="button"
                :disabled="selectedExportQuotation?.approval_status !== 'draft'"
                @click="updateSelectedExportQuotationDraft"
              >
                <Save :size="18" />
                <span>保存草稿编辑</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>报价单明细</h2>
              <span>{{ selectedExportQuotation?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedExportQuotation" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>状态/报价日</dt>
                  <dd>{{ exportQuotationStatusLabel(selectedExportQuotation.approval_status) }} / {{ selectedExportQuotation.quote_date }}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{{ selectedExportQuotation.customer_name }}</dd>
                </div>
                <div>
                  <dt>业务员</dt>
                  <dd>{{ selectedExportQuotation.sales_user_name ?? '未指定' }}</dd>
                </div>
                <div>
                  <dt>贸易条款</dt>
                  <dd>{{ selectedExportQuotation.trade_term }}</dd>
                </div>
                <div>
                  <dt>有效期</dt>
                  <dd>{{ selectedExportQuotation.valid_until ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>总金额</dt>
                  <dd>{{ formatMoney(selectedExportQuotation.total_amount, selectedExportQuotation.currency) }}</dd>
                </div>
                <div>
                  <dt>审批人</dt>
                  <dd>{{ selectedExportQuotation.reviewer_name ?? '未审批' }}</dd>
                </div>
                <div>
                  <dt>出口合同</dt>
                  <dd>{{ selectedExportQuotation.generated_contract_no ?? '未生成' }}</dd>
                </div>
              </dl>

              <div class="transaction-box">
                <strong>报价描述</strong>
                <p>{{ selectedExportQuotation.description ?? '未填写' }}</p>
              </div>

              <div class="delivery-action-row">
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="selectedExportQuotation.approval_status !== 'draft'"
                  @click="fillExportQuotationForm(selectedExportQuotation)"
                >
                  <FileText :size="18" />
                  <span>载入编辑</span>
                </button>
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="selectedExportQuotation.approval_status !== 'draft'"
                  @click="submitSelectedExportQuotation"
                >
                  <Save :size="18" />
                  <span>提交审批</span>
                </button>
                <button
                  class="primary-button"
                  type="button"
                  :disabled="selectedExportQuotation.approval_status !== 'submitted'"
                  @click="approveSelectedExportQuotation"
                >
                  <CheckCircle2 :size="18" />
                  <span>审批通过</span>
                </button>
              </div>

              <form class="record-form accessory-form" @submit.prevent="confirmSelectedExportQuotationContract">
                <div class="form-divider">报价确认生成出口合同</div>
                <div class="form-pair two">
                  <label for="export-quotation-confirmed-at">
                    客户确认日期
                    <input id="export-quotation-confirmed-at" v-model="exportQuotationContractForm.confirmed_at" required type="date" />
                  </label>
                  <label for="export-quotation-contract-no">
                    合同号
                    <input id="export-quotation-contract-no" v-model="exportQuotationContractForm.contract_no" required maxlength="80" />
                  </label>
                </div>
                <button
                  class="secondary-button"
                  type="submit"
                  :disabled="selectedExportQuotation.approval_status !== 'approved'"
                >
                  <FileText :size="18" />
                  <span>生成出口合同</span>
                </button>
              </form>

              <div v-if="exportQuotationContract" class="transaction-box">
                <strong>已生成出口合同</strong>
                <p>
                  {{ exportQuotationContract.contract_no }} /
                  {{ formatMoney(exportQuotationContract.total_amount, exportQuotationContract.currency) }}
                </p>
              </div>

              <div class="accessory-heading">
                <strong>报价商品明细</strong>
                <span>{{ selectedExportQuotation.lines.length }} 行</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格/型号</th>
                    <th>数量</th>
                    <th>单价</th>
                    <th>运费</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedExportQuotation.lines" :key="line.id">
                    <td>{{ line.product_code ?? '未填' }} / {{ line.product_name }}</td>
                    <td>{{ line.specification ?? '未填' }} / {{ line.model ?? '未填' }}</td>
                    <td>{{ line.quantity }} {{ line.unit }}</td>
                    <td>{{ formatMoney(line.unit_price, selectedExportQuotation.currency) }}</td>
                    <td>{{ freightMethodLabel(line.freight_method) }} / {{ formatMoney(line.freight_amount, selectedExportQuotation.currency) }}</td>
                    <td>{{ formatMoney(line.amount, selectedExportQuotation.currency) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="delivery-action-row">
                <button class="secondary-button" type="button" @click="exportSelectedExportQuotation('pdf')">
                  <Download :size="18" />
                  <span>导出 PDF</span>
                </button>
                <button class="secondary-button" type="button" @click="exportSelectedExportQuotation('excel')">
                  <Download :size="18" />
                  <span>导出 Excel</span>
                </button>
              </div>

              <div v-if="exportQuotationExportPreview" class="transaction-box">
                <strong>导出预览</strong>
                <pre>{{ exportQuotationExportPreview }}</pre>
              </div>

              <div class="accessory-heading">
                <strong>历史报价</strong>
                <span>{{ exportQuotationHistory.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>报价单</th>
                    <th>客户</th>
                    <th>日期</th>
                    <th>状态</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in exportQuotationHistory" :key="item.id">
                    <td>{{ item.code }}</td>
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.quote_date }}</td>
                    <td>{{ exportQuotationStatusLabel(item.approval_status) }}</td>
                    <td>{{ formatMoney(item.total_amount, item.currency) }}</td>
                  </tr>
                  <tr v-if="exportQuotationHistory.length === 0">
                    <td colspan="5" class="empty-cell">暂无历史报价</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>采购询价参考</strong>
                <span>{{ exportQuotationPurchaseReferences.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>产品</th>
                    <th>供应商</th>
                    <th>参考价</th>
                    <th>来源报价</th>
                    <th>日期</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in exportQuotationPurchaseReferences" :key="`${item.source_quotation_no}-${item.supplier_name}`">
                    <td>{{ item.product_code ?? '未填' }} / {{ item.product_name }}</td>
                    <td>{{ item.supplier_name }}</td>
                    <td>{{ formatMoney(item.reference_price, item.currency) }}</td>
                    <td>{{ item.source_quotation_no }}</td>
                    <td>{{ item.quote_date }}</td>
                  </tr>
                  <tr v-if="exportQuotationPurchaseReferences.length === 0">
                    <td colspan="5" class="empty-cell">暂无采购参考价</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>寄样关联</strong>
                <span>{{ exportQuotationSampleDeliveries.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>寄样单</th>
                    <th>客户</th>
                    <th>日期</th>
                    <th>快递</th>
                    <th>报价单</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in exportQuotationSampleDeliveries" :key="item.id">
                    <td>{{ item.code }}</td>
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.delivery_date }}</td>
                    <td>{{ item.express_company }} / {{ item.tracking_no ?? '未填' }}</td>
                    <td>{{ item.quote_no ?? '未关联' }}</td>
                  </tr>
                  <tr v-if="exportQuotationSampleDeliveries.length === 0">
                    <td colspan="5" class="empty-cell">暂无寄样关联</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="isExportContractPage">
        <section class="summary-strip delivery-summary" aria-label="出口合同概览">
          <div v-for="item in exportContractStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="exportContractMessage" class="success-banner">{{ exportContractMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>合同列表</h2>
              <form class="search-form" @submit.prevent="loadExportContracts">
                <label>
                  <span>合同搜索</span>
                  <input v-model="exportContractSearch" placeholder="合同号 / 客户 / 商品 / 报价" />
                </label>
                <label>
                  <span>审批状态</span>
                  <select v-model="exportContractStatusFilter">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="submitted">待审批</option>
                    <option value="approved">已审批</option>
                  </select>
                </label>
                <label>
                  <span>客户标识</span>
                  <input v-model="exportContractCustomerFilter" placeholder="customer-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>合同号</th>
                    <th>状态</th>
                    <th>客户</th>
                    <th>计划出运</th>
                    <th>回签</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in exportContracts"
                    :key="item.id"
                    :class="{ selected: item.id === selectedExportContract?.id }"
                    @click="selectExportContract(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ exportContractStatusLabel(item.approval_status) }}</td>
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.planned_ship_date }}</td>
                    <td>{{ item.signature_status === 'signed' ? '已回签' : '未回签' }}</td>
                    <td>{{ formatMoney(item.statistics.total_amount, item.currency) }}</td>
                  </tr>
                  <tr v-if="exportContracts.length === 0">
                    <td colspan="6" class="empty-cell">暂无出口合同</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>新增出口合同</h2>
              <FileText :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitExportContractForm">
              <div class="form-pair two">
                <label for="export-contract-code">
                  合同号
                  <input id="export-contract-code" v-model="exportContractForm.code" required maxlength="80" />
                </label>
                <label for="export-contract-date">
                  合同日期
                  <input id="export-contract-date" v-model="exportContractForm.contract_date" required type="date" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="export-contract-customer-id">
                  客户标识
                  <input id="export-contract-customer-id" v-model="exportContractForm.customer_id" maxlength="36" />
                </label>
                <label for="export-contract-customer-name">
                  客户名称
                  <input id="export-contract-customer-name" v-model="exportContractForm.customer_name" required maxlength="240" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="export-contract-sales-user">
                  业务员
                  <input id="export-contract-sales-user" v-model="exportContractForm.sales_user_name" maxlength="160" />
                </label>
                <label for="export-contract-currency">
                  币种
                  <input id="export-contract-currency" v-model="exportContractForm.currency" required maxlength="10" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="export-contract-trade-term">
                  贸易条款
                  <input id="export-contract-trade-term" v-model="exportContractForm.trade_term" required maxlength="80" />
                </label>
                <label for="export-contract-ship-date">
                  计划出运日
                  <input id="export-contract-ship-date" v-model="exportContractForm.planned_ship_date" required type="date" />
                </label>
              </div>
              <label for="export-contract-payment-terms">
                付款条款
                <input id="export-contract-payment-terms" v-model="exportContractForm.payment_terms" required maxlength="400" />
              </label>
              <div class="form-pair two">
                <label for="export-contract-source-quotation-no">
                  来源报价号
                  <input id="export-contract-source-quotation-no" v-model="exportContractForm.source_quotation_no" maxlength="80" />
                </label>
                <label for="export-contract-source-quotation-id">
                  来源报价标识
                  <input id="export-contract-source-quotation-id" v-model="exportContractForm.source_quotation_id" maxlength="36" />
                </label>
              </div>
              <label for="export-contract-remarks">
                合同备注
                <textarea id="export-contract-remarks" v-model="exportContractForm.remarks" rows="2" maxlength="4000" />
              </label>

              <div class="form-divider">合同商品明细</div>
              <div class="form-pair two">
                <label for="export-contract-product-id">
                  商品标识
                  <input id="export-contract-product-id" v-model="exportContractForm.product_id" maxlength="36" />
                </label>
                <label for="export-contract-product-code">
                  商品编号
                  <input id="export-contract-product-code" v-model="exportContractForm.product_code" maxlength="80" />
                </label>
              </div>
              <label for="export-contract-product-name">
                商品名称
                <input id="export-contract-product-name" v-model="exportContractForm.product_name" required maxlength="240" />
              </label>
              <div class="form-pair two">
                <label for="export-contract-specification">
                  规格
                  <input id="export-contract-specification" v-model="exportContractForm.specification" maxlength="240" />
                </label>
                <label for="export-contract-model">
                  型号
                  <input id="export-contract-model" v-model="exportContractForm.model" maxlength="120" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="export-contract-quantity">
                  数量
                  <input id="export-contract-quantity" v-model="exportContractForm.quantity" required min="0.0001" step="0.0001" type="number" />
                </label>
                <label for="export-contract-unit">
                  单位
                  <input id="export-contract-unit" v-model="exportContractForm.unit" required maxlength="40" />
                </label>
                <label for="export-contract-unit-price">
                  销售单价
                  <input id="export-contract-unit-price" v-model="exportContractForm.unit_price" required min="0.0001" step="0.0001" type="number" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="export-contract-purchased-quantity">
                  已采购数量
                  <input id="export-contract-purchased-quantity" v-model="exportContractForm.purchased_quantity" min="0" step="0.0001" type="number" />
                </label>
                <label for="export-contract-shipped-quantity">
                  已出货数量
                  <input id="export-contract-shipped-quantity" v-model="exportContractForm.shipped_quantity" min="0" step="0.0001" type="number" />
                </label>
              </div>
              <label for="export-contract-image-url">
                商品图片
                <input id="export-contract-image-url" v-model="exportContractForm.image_url" maxlength="1000" />
              </label>
              <label for="export-contract-line-remark">
                明细备注
                <input id="export-contract-line-remark" v-model="exportContractForm.line_remark" maxlength="2000" />
              </label>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>新增出口合同</span>
              </button>
              <button
                class="secondary-button"
                type="button"
                :disabled="selectedExportContract?.approval_status !== 'draft'"
                @click="updateSelectedExportContractDraft"
              >
                <Save :size="18" />
                <span>保存草稿编辑</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>合同明细</h2>
              <span>{{ selectedExportContract?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedExportContract" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>状态/合同日</dt>
                  <dd>{{ exportContractStatusLabel(selectedExportContract.approval_status) }} / {{ selectedExportContract.contract_date }}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{{ selectedExportContract.customer_name }}</dd>
                </div>
                <div>
                  <dt>业务员</dt>
                  <dd>{{ selectedExportContract.sales_user_name ?? '未指定' }}</dd>
                </div>
                <div>
                  <dt>贸易条款</dt>
                  <dd>{{ selectedExportContract.trade_term }}</dd>
                </div>
                <div>
                  <dt>计划出运</dt>
                  <dd>{{ selectedExportContract.planned_ship_date }}</dd>
                </div>
                <div>
                  <dt>合同金额</dt>
                  <dd>{{ formatMoney(selectedExportContract.statistics.total_amount, selectedExportContract.currency) }}</dd>
                </div>
                <div>
                  <dt>预收款</dt>
                  <dd>{{ formatMoney(selectedExportContract.statistics.advance_payment_amount, selectedExportContract.currency) }}</dd>
                </div>
                <div>
                  <dt>客户回签</dt>
                  <dd>{{ selectedExportContract.signature_status === 'signed' ? '已回签' : '未回签' }}</dd>
                </div>
                <div>
                  <dt>来源报价</dt>
                  <dd>{{ selectedExportContract.source_quotation_no ?? '手工新增' }}</dd>
                </div>
              </dl>

              <div class="transaction-box">
                <strong>付款条款</strong>
                <p>{{ selectedExportContract.payment_terms }}</p>
              </div>
              <div class="transaction-box">
                <strong>合同备注</strong>
                <p>{{ selectedExportContract.remarks ?? '未填写' }}</p>
              </div>

              <div class="delivery-action-row">
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="selectedExportContract.approval_status !== 'draft'"
                  @click="fillExportContractForm(selectedExportContract)"
                >
                  <FileText :size="18" />
                  <span>载入编辑</span>
                </button>
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="selectedExportContract.approval_status !== 'draft'"
                  @click="submitSelectedExportContract"
                >
                  <Save :size="18" />
                  <span>提交审批</span>
                </button>
                <button
                  class="primary-button"
                  type="button"
                  :disabled="selectedExportContract.approval_status !== 'submitted'"
                  @click="approveSelectedExportContract"
                >
                  <CheckCircle2 :size="18" />
                  <span>审批通过</span>
                </button>
              </div>

              <form class="record-form accessory-form" @submit.prevent="registerSelectedExportContractSignature">
                <div class="form-divider">客户回签信息</div>
                <div class="form-pair two">
                  <label for="export-contract-signed-by">
                    回签人
                    <input id="export-contract-signed-by" v-model="exportContractSignatureForm.signed_by" required maxlength="160" />
                  </label>
                  <label for="export-contract-signed-at">
                    回签日期
                    <input id="export-contract-signed-at" v-model="exportContractSignatureForm.signed_at" required type="date" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label for="export-contract-signature-method">
                    回签方式
                    <input id="export-contract-signature-method" v-model="exportContractSignatureForm.signature_method" required maxlength="80" />
                  </label>
                  <label for="export-contract-signature-file">
                    回签文件号
                    <input id="export-contract-signature-file" v-model="exportContractSignatureForm.file_no" maxlength="120" />
                  </label>
                </div>
                <label for="export-contract-signature-remark">
                  回签备注
                  <input id="export-contract-signature-remark" v-model="exportContractSignatureForm.remark" maxlength="2000" />
                </label>
                <button class="secondary-button" type="submit">
                  <FileText :size="18" />
                  <span>登记回签</span>
                </button>
              </form>

              <form class="record-form accessory-form" @submit.prevent="addSelectedExportContractAdvancePayment">
                <div class="form-divider">预收款关联</div>
                <div class="form-pair two">
                  <label for="export-contract-payment-no">
                    水单号
                    <input id="export-contract-payment-no" v-model="exportContractAdvancePaymentForm.payment_no" required maxlength="80" />
                  </label>
                  <label for="export-contract-payment-date">
                    收款日期
                    <input id="export-contract-payment-date" v-model="exportContractAdvancePaymentForm.received_at" required type="date" />
                  </label>
                </div>
                <div class="form-pair three">
                  <label for="export-contract-payment-amount">
                    金额
                    <input id="export-contract-payment-amount" v-model="exportContractAdvancePaymentForm.amount" required min="0.01" step="0.01" type="number" />
                  </label>
                  <label for="export-contract-payment-currency">
                    币种
                    <input id="export-contract-payment-currency" v-model="exportContractAdvancePaymentForm.currency" required maxlength="10" />
                  </label>
                  <label for="export-contract-payer">
                    付款方
                    <input id="export-contract-payer" v-model="exportContractAdvancePaymentForm.payer_name" required maxlength="240" />
                  </label>
                </div>
                <label for="export-contract-payment-remark">
                  收款备注
                  <input id="export-contract-payment-remark" v-model="exportContractAdvancePaymentForm.remark" maxlength="2000" />
                </label>
                <button class="secondary-button" type="submit">
                  <WalletCards :size="18" />
                  <span>关联预收款</span>
                </button>
              </form>

              <div class="accessory-heading">
                <strong>合同商品明细</strong>
                <span>{{ selectedExportContract.lines.length }} 行</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>图片</th>
                    <th>规格/型号</th>
                    <th>数量</th>
                    <th>单价</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedExportContract.lines" :key="line.id">
                    <td>{{ line.product_code ?? '未填' }} / {{ line.product_name }}</td>
                    <td>
                      <img v-if="line.image_url" :src="line.image_url" alt="" />
                      <span v-else>未上传</span>
                    </td>
                    <td>{{ line.specification ?? '未填' }} / {{ line.model ?? '未填' }}</td>
                    <td>{{ line.quantity }} {{ line.unit }}</td>
                    <td>{{ formatMoney(line.unit_price, selectedExportContract.currency) }}</td>
                    <td>{{ formatMoney(line.amount, selectedExportContract.currency) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>历史询报价参考</strong>
                <span>{{ exportContractQuotationHistory.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>报价单</th>
                    <th>客户</th>
                    <th>商品</th>
                    <th>数量</th>
                    <th>单价</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in exportContractQuotationHistory" :key="item.id">
                    <td>{{ item.code }}</td>
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.lines[0]?.product_code ?? '未填' }} / {{ item.lines[0]?.product_name ?? '未填' }}</td>
                    <td>{{ item.lines[0]?.quantity ?? '-' }} {{ item.lines[0]?.unit ?? '' }}</td>
                    <td>{{ item.lines[0] ? formatMoney(item.lines[0].unit_price, item.currency) : '-' }}</td>
                    <td>{{ exportQuotationStatusLabel(item.approval_status) }}</td>
                  </tr>
                  <tr v-if="exportContractQuotationHistory.length === 0">
                    <td colspan="6" class="empty-cell">暂无历史询报价</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>合同采购情况</strong>
                <span>{{ selectedExportContract.purchase_statuses.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>总数量</th>
                    <th>已采购</th>
                    <th>未采购</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in selectedExportContract.purchase_statuses" :key="`${item.product_code}-${item.product_name}`">
                    <td>{{ item.product_code ?? '未填' }} / {{ item.product_name }}</td>
                    <td>{{ item.total_quantity }} {{ item.unit }}</td>
                    <td>{{ item.purchased_quantity }} {{ item.unit }}</td>
                    <td>{{ item.unpurchased_quantity }} {{ item.unit }}</td>
                    <td>{{ progressStatusLabel(item.status) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>合同出货情况</strong>
                <span>{{ selectedExportContract.shipment_statuses.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>计划出运</th>
                    <th>已出货</th>
                    <th>未出货</th>
                    <th>未出货金额</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in selectedExportContract.shipment_statuses" :key="`${item.product_code}-${item.planned_ship_date}`">
                    <td>{{ item.product_code ?? '未填' }} / {{ item.product_name }}</td>
                    <td>{{ item.planned_ship_date }}</td>
                    <td>{{ item.shipped_quantity }} {{ item.unit }}</td>
                    <td>{{ item.unshipped_quantity }} {{ item.unit }}</td>
                    <td>{{ formatMoney(item.unshipped_amount, selectedExportContract.currency) }}</td>
                    <td>{{ progressStatusLabel(item.status) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>预收款记录</strong>
                <span>{{ selectedExportContract.advance_payments.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>水单号</th>
                    <th>日期</th>
                    <th>付款方</th>
                    <th>金额</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="payment in selectedExportContract.advance_payments" :key="payment.id">
                    <td>{{ payment.payment_no }}</td>
                    <td>{{ payment.received_at }}</td>
                    <td>{{ payment.payer_name }}</td>
                    <td>{{ formatMoney(payment.amount, payment.currency) }}</td>
                    <td>{{ payment.remark ?? '未填' }}</td>
                  </tr>
                  <tr v-if="selectedExportContract.advance_payments.length === 0">
                    <td colspan="5" class="empty-cell">暂无预收款</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>回签记录</strong>
                <span>{{ selectedExportContract.signatures.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>回签人</th>
                    <th>日期</th>
                    <th>方式</th>
                    <th>文件号</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="signature in selectedExportContract.signatures" :key="signature.id">
                    <td>{{ signature.signed_by }}</td>
                    <td>{{ signature.signed_at }}</td>
                    <td>{{ signature.signature_method }}</td>
                    <td>{{ signature.file_no ?? '未填' }}</td>
                    <td>{{ signature.remark ?? '未填' }}</td>
                  </tr>
                  <tr v-if="selectedExportContract.signatures.length === 0">
                    <td colspan="5" class="empty-cell">暂无回签记录</td>
                  </tr>
                </tbody>
              </table>

              <div class="delivery-action-row">
                <button class="secondary-button" type="button" @click="exportSelectedExportContract('pdf')">
                  <Download :size="18" />
                  <span>导出 PDF</span>
                </button>
                <button class="secondary-button" type="button" @click="exportSelectedExportContract('excel')">
                  <Download :size="18" />
                  <span>导出 Excel</span>
                </button>
              </div>

              <div v-if="exportContractExportPreview" class="transaction-box">
                <strong>导出预览</strong>
                <pre>{{ exportContractExportPreview }}</pre>
              </div>
            </div>
          </section>
        </section>
      </template>

      <template v-else-if="isShipmentPage">
        <section class="summary-strip delivery-summary" aria-label="出货明细概览">
          <div v-for="item in shipmentStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="shipmentMessage" class="success-banner">{{ shipmentMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>出货计划列表</h2>
              <form class="search-form" @submit.prevent="loadShipments">
                <label>
                  <span>出货搜索</span>
                  <input v-model="shipmentSearch" placeholder="出货单号 / 客户 / 箱号" />
                </label>
                <label>
                  <span>审批状态</span>
                  <select v-model="shipmentStatusFilter">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="submitted">待审批</option>
                    <option value="approved">已审批</option>
                  </select>
                </label>
                <label>
                  <span>客户标识</span>
                  <input v-model="shipmentCustomerFilter" placeholder="customer-id" />
                </label>
                <label>
                  <span>合同标识</span>
                  <input v-model="shipmentContractFilter" placeholder="contract-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>出货单号</th>
                    <th>状态</th>
                    <th>客户</th>
                    <th>计划出运</th>
                    <th>目的港</th>
                    <th>应收</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in shipments"
                    :key="item.id"
                    :class="{ selected: item.id === selectedShipment?.id }"
                    @click="selectShipment(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ shipmentStatusLabel(item.approval_status) }}</td>
                    <td>{{ item.customer_name }}</td>
                    <td>{{ item.planned_ship_date }}</td>
                    <td>{{ item.port_of_destination }}</td>
                    <td>{{ formatMoney(item.finance_overview.receivable_amount, item.currency) }}</td>
                  </tr>
                  <tr v-if="shipments.length === 0">
                    <td colspan="6" class="empty-cell">暂无出货明细</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>从出口合同生成出货明细</h2>
              <Send :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitShipmentForm">
              <div class="form-pair two">
                <label for="shipment-code">
                  出货单号
                  <input id="shipment-code" v-model="shipmentForm.code" required maxlength="80" />
                </label>
                <label for="shipment-date">
                  出货日期
                  <input id="shipment-date" v-model="shipmentForm.shipment_date" required type="date" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="shipment-planned-date">
                  计划出运日
                  <input id="shipment-planned-date" v-model="shipmentForm.planned_ship_date" required type="date" />
                </label>
                <label for="shipment-method">
                  出运方式
                  <select id="shipment-method" v-model="shipmentForm.shipping_method">
                    <option value="sea">海运</option>
                    <option value="air">空运</option>
                    <option value="rail">铁路</option>
                    <option value="courier">快递</option>
                  </select>
                </label>
              </div>

              <div class="form-divider">多合同合并出运</div>
              <label for="shipment-contract-a">
                合同标识 A
                <input id="shipment-contract-a" v-model="shipmentForm.contract_id_a" required maxlength="36" />
              </label>
              <label for="shipment-quantity-a">
                合同 A 出货数量
                <input id="shipment-quantity-a" v-model="shipmentForm.quantity_a" required min="0.0001" step="0.0001" type="number" />
              </label>
              <label for="shipment-contract-b">
                合同标识 B
                <input id="shipment-contract-b" v-model="shipmentForm.contract_id_b" maxlength="36" />
              </label>
              <label for="shipment-quantity-b">
                合同 B 出货数量
                <input id="shipment-quantity-b" v-model="shipmentForm.quantity_b" min="0.0001" step="0.0001" type="number" />
              </label>

              <div class="form-divider">物流和单证</div>
              <div class="form-pair two">
                <label for="shipment-pol">
                  起运港
                  <input id="shipment-pol" v-model="shipmentForm.port_of_loading" required maxlength="120" />
                </label>
                <label for="shipment-pod">
                  目的港
                  <input id="shipment-pod" v-model="shipmentForm.port_of_destination" required maxlength="120" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="shipment-vessel">
                  船名航次
                  <input id="shipment-vessel" v-model="shipmentForm.vessel_name" maxlength="160" />
                </label>
                <label for="shipment-container">
                  箱号
                  <input id="shipment-container" v-model="shipmentForm.container_no" maxlength="120" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="shipment-booking">
                  订舱号
                  <input id="shipment-booking" v-model="shipmentForm.booking_no" maxlength="120" />
                </label>
                <label for="shipment-document-owner">
                  单证负责人
                  <input id="shipment-document-owner" v-model="shipmentForm.document_owner_name" maxlength="160" />
                </label>
              </div>
              <label for="shipment-payable">
                预计付款成本
                <input id="shipment-payable" v-model="shipmentForm.estimated_payable_amount" required min="0" step="0.01" type="number" />
              </label>
              <label for="shipment-remarks">
                出货备注
                <textarea id="shipment-remarks" v-model="shipmentForm.remarks" rows="2" maxlength="2000" />
              </label>
              <button class="primary-button" type="submit">
                <Plus :size="18" />
                <span>生成出货明细</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>出货明细</h2>
              <span>{{ selectedShipment?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedShipment" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>状态/出货日</dt>
                  <dd>{{ shipmentStatusLabel(selectedShipment.approval_status) }} / {{ selectedShipment.shipment_date }}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{{ selectedShipment.customer_name }}</dd>
                </div>
                <div>
                  <dt>计划出运</dt>
                  <dd>{{ selectedShipment.planned_ship_date }}</dd>
                </div>
                <div>
                  <dt>航线</dt>
                  <dd>{{ selectedShipment.port_of_loading }} → {{ selectedShipment.port_of_destination }}</dd>
                </div>
                <div>
                  <dt>方式</dt>
                  <dd>{{ freightMethodLabel(selectedShipment.shipping_method) }}</dd>
                </div>
                <div>
                  <dt>单证负责人</dt>
                  <dd>{{ selectedShipment.document_owner_name ?? '未指定' }}</dd>
                </div>
                <div>
                  <dt>箱号</dt>
                  <dd>{{ selectedShipment.container_no ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>订舱号</dt>
                  <dd>{{ selectedShipment.booking_no ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>审批人</dt>
                  <dd>{{ selectedShipment.reviewer_name ?? '未审批' }}</dd>
                </div>
              </dl>

              <div class="transaction-box">
                <strong>收付款和利润概览</strong>
                <dl class="detail-list">
                  <div>
                    <dt>应收金额</dt>
                    <dd>{{ formatMoney(selectedShipment.finance_overview.receivable_amount, selectedShipment.currency) }}</dd>
                  </div>
                  <div>
                    <dt>预计付款</dt>
                    <dd>{{ formatMoney(selectedShipment.finance_overview.payable_amount, selectedShipment.currency) }}</dd>
                  </div>
                  <div>
                    <dt>预计利润</dt>
                    <dd>{{ formatMoney(selectedShipment.finance_overview.profit_amount, selectedShipment.currency) }}</dd>
                  </div>
                  <div>
                    <dt>利润率</dt>
                    <dd>{{ selectedShipment.finance_overview.profit_rate }}%</dd>
                  </div>
                </dl>
              </div>

              <div class="transaction-box">
                <strong>出货提醒</strong>
                <p>
                  {{ selectedShipment.reminder.reminder_date }}
                  · {{ selectedShipment.reminder.message }}
                  · {{ selectedShipment.reminder.status === 'done' ? '已完成' : '待提醒' }}
                </p>
              </div>

              <div class="delivery-action-row">
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="selectedShipment.approval_status !== 'draft'"
                  @click="submitSelectedShipment"
                >
                  <Save :size="18" />
                  <span>提交审批</span>
                </button>
              </div>

              <form class="record-form accessory-form" @submit.prevent="approveSelectedShipment">
                <div class="form-divider">出货审批</div>
                <div class="form-pair two">
                  <label for="shipment-reviewer">
                    审批人
                    <input id="shipment-reviewer" v-model="shipmentApproveForm.reviewer_name" required maxlength="160" />
                  </label>
                  <label for="shipment-approved-at">
                    审批日期
                    <input id="shipment-approved-at" v-model="shipmentApproveForm.approved_at" required type="date" />
                  </label>
                </div>
                <button
                  class="primary-button"
                  type="submit"
                  :disabled="selectedShipment.approval_status !== 'submitted'"
                >
                  <CheckCircle2 :size="18" />
                  <span>审批通过</span>
                </button>
              </form>

              <div class="accessory-heading">
                <strong>出货商品明细</strong>
                <span>{{ selectedShipment.lines.length }} 行</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>合同</th>
                    <th>商品</th>
                    <th>规格/型号</th>
                    <th>数量</th>
                    <th>单价</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedShipment.lines" :key="line.id">
                    <td>{{ line.contract_no }}</td>
                    <td>{{ line.product_code ?? '未填' }} / {{ line.product_name }}</td>
                    <td>{{ line.specification ?? '未填' }} / {{ line.model ?? '未填' }}</td>
                    <td>{{ line.quantity }} {{ line.unit }}</td>
                    <td>{{ formatMoney(line.unit_price, selectedShipment.currency) }}</td>
                    <td>{{ formatMoney(line.amount, selectedShipment.currency) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>出口合同出货情况</strong>
                <span>{{ selectedShipment.contract_progresses.length }} 份合同</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>合同</th>
                    <th>商品</th>
                    <th>计划出运</th>
                    <th>已出货</th>
                    <th>未出货</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="progress in selectedShipment.contract_progresses" :key="`shipment-${progress.contract_id}`">
                    <tr v-for="item in progress.shipment_statuses" :key="`${progress.contract_id}-${item.product_code}-${item.planned_ship_date}`">
                      <td>{{ progress.contract_no }}</td>
                      <td>{{ item.product_code ?? '未填' }} / {{ item.product_name }}</td>
                      <td>{{ item.planned_ship_date }}</td>
                      <td>{{ item.shipped_quantity }} {{ item.unit }}</td>
                      <td>{{ item.unshipped_quantity }} {{ item.unit }}</td>
                      <td>{{ progressStatusLabel(item.status) }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>出口合同采购情况</strong>
                <span>{{ selectedShipment.contract_progresses.length }} 份合同</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>合同</th>
                    <th>商品</th>
                    <th>总数量</th>
                    <th>已采购</th>
                    <th>未采购</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="progress in selectedShipment.contract_progresses" :key="`purchase-${progress.contract_id}`">
                    <tr v-for="item in progress.purchase_statuses" :key="`${progress.contract_id}-${item.product_code}`">
                      <td>{{ progress.contract_no }}</td>
                      <td>{{ item.product_code ?? '未填' }} / {{ item.product_name }}</td>
                      <td>{{ item.total_quantity }} {{ item.unit }}</td>
                      <td>{{ item.purchased_quantity }} {{ item.unit }}</td>
                      <td>{{ item.unpurchased_quantity }} {{ item.unit }}</td>
                      <td>{{ progressStatusLabel(item.status) }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>出货提醒列表</strong>
                <span>{{ shipmentReminders.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>出货单号</th>
                    <th>提醒日</th>
                    <th>提醒内容</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in shipmentReminders" :key="item.shipment_id">
                    <td>{{ item.shipment_no }}</td>
                    <td>{{ item.reminder_date }}</td>
                    <td>{{ item.message }}</td>
                    <td>{{ item.status === 'done' ? '已完成' : '待提醒' }}</td>
                  </tr>
                  <tr v-if="shipmentReminders.length === 0">
                    <td colspan="4" class="empty-cell">暂无出货提醒</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-cell">暂无出货明细</div>
          </section>
        </section>
      </template>

      <template v-else-if="isPurchaseInquiryPage">
        <section class="summary-strip delivery-summary" aria-label="采购询价概览">
          <div v-for="item in purchaseInquiryStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="purchaseInquiryMessage" class="success-banner">{{ purchaseInquiryMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>采购询价列表</h2>
              <form class="search-form" @submit.prevent="loadPurchaseInquiries">
                <label>
                  <span>询价搜索</span>
                  <input v-model="purchaseInquirySearch" placeholder="询价单号 / 商品 / 备注" />
                </label>
                <label>
                  <span>询价状态</span>
                  <select v-model="purchaseInquiryStatusFilter">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="sent">已发模板</option>
                    <option value="quoted">已报价</option>
                    <option value="closed">已关闭</option>
                  </select>
                </label>
                <label>
                  <span>商品标识</span>
                  <input v-model="purchaseInquiryProductFilter" placeholder="product-id" />
                </label>
                <label>
                  <span>供应商标识</span>
                  <input v-model="purchaseInquirySupplierFilter" placeholder="supplier-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>询价单号</th>
                    <th>状态</th>
                    <th>商品</th>
                    <th>询价日</th>
                    <th>报价数</th>
                    <th>最低价</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in purchaseInquiries"
                    :key="item.id"
                    :class="{ selected: item.id === selectedPurchaseInquiry?.id }"
                    @click="selectPurchaseInquiry(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ purchaseInquiryStatusLabel(item.status) }}</td>
                    <td>{{ item.lines[0]?.product_code ?? '未填' }} / {{ item.lines[0]?.product_name ?? '未填' }}</td>
                    <td>{{ item.inquiry_date }}</td>
                    <td>{{ item.quotations.length }}</td>
                    <td>
                      {{
                        item.quotations[0]
                          ? formatMoney(item.quotations[0].unit_price, item.quotations[0].currency)
                          : '未报价'
                      }}
                    </td>
                  </tr>
                  <tr v-if="purchaseInquiries.length === 0">
                    <td colspan="6" class="empty-cell">暂无采购询价</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>{{ editingPurchaseInquiryId ? '编辑采购询价' : '新增采购询价' }}</h2>
              <Search :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitPurchaseInquiryForm">
              <div class="form-pair two">
                <label for="purchase-inquiry-code">
                  询价单号
                  <input id="purchase-inquiry-code" v-model="purchaseInquiryForm.code" required maxlength="80" />
                </label>
                <label for="purchase-inquiry-date">
                  询价日期
                  <input id="purchase-inquiry-date" v-model="purchaseInquiryForm.inquiry_date" required type="date" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="purchase-inquiry-buyer-id">
                  业务员标识
                  <input id="purchase-inquiry-buyer-id" v-model="purchaseInquiryForm.buyer_user_id" maxlength="36" />
                </label>
                <label for="purchase-inquiry-buyer-name">
                  业务员
                  <input id="purchase-inquiry-buyer-name" v-model="purchaseInquiryForm.buyer_user_name" maxlength="160" />
                </label>
              </div>

              <div class="form-divider">询价商品</div>
              <div class="form-pair two">
                <label for="purchase-inquiry-product-id">
                  商品标识
                  <input id="purchase-inquiry-product-id" v-model="purchaseInquiryForm.product_id" maxlength="36" />
                </label>
                <label for="purchase-inquiry-product-code">
                  商品编号
                  <input id="purchase-inquiry-product-code" v-model="purchaseInquiryForm.product_code" maxlength="80" />
                </label>
              </div>
              <label for="purchase-inquiry-product-name">
                商品名称
                <input id="purchase-inquiry-product-name" v-model="purchaseInquiryForm.product_name" required maxlength="240" />
              </label>
              <div class="form-pair two">
                <label for="purchase-inquiry-specification">
                  规格
                  <input id="purchase-inquiry-specification" v-model="purchaseInquiryForm.specification" maxlength="240" />
                </label>
                <label for="purchase-inquiry-model">
                  型号
                  <input id="purchase-inquiry-model" v-model="purchaseInquiryForm.model" maxlength="120" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="purchase-inquiry-quantity">
                  询价数量
                  <input id="purchase-inquiry-quantity" v-model="purchaseInquiryForm.quantity" required min="0.0001" step="0.0001" type="number" />
                </label>
                <label for="purchase-inquiry-unit">
                  单位
                  <input id="purchase-inquiry-unit" v-model="purchaseInquiryForm.unit" required maxlength="40" />
                </label>
              </div>
              <label for="purchase-inquiry-remarks">
                询价备注
                <textarea id="purchase-inquiry-remarks" v-model="purchaseInquiryForm.remarks" rows="2" maxlength="4000" />
              </label>
              <button class="primary-button" type="submit">
                <Save v-if="editingPurchaseInquiryId" :size="18" />
                <Plus v-else :size="18" />
                <span>{{ editingPurchaseInquiryId ? '保存草稿编辑' : '新增采购询价' }}</span>
              </button>
              <button
                v-if="editingPurchaseInquiryId"
                class="secondary-button"
                type="button"
                @click="cancelPurchaseInquiryEdit"
              >
                <RefreshCw :size="18" />
                <span>取消编辑</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>询价明细</h2>
              <span>{{ selectedPurchaseInquiry?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedPurchaseInquiry" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>状态/询价日</dt>
                  <dd>{{ purchaseInquiryStatusLabel(selectedPurchaseInquiry.status) }} / {{ selectedPurchaseInquiry.inquiry_date }}</dd>
                </div>
                <div>
                  <dt>业务员</dt>
                  <dd>{{ selectedPurchaseInquiry.buyer_user_name ?? '未指定' }}</dd>
                </div>
                <div>
                  <dt>模板</dt>
                  <dd>{{ selectedPurchaseInquiry.template_name ?? '未发送' }}</dd>
                </div>
                <div>
                  <dt>模板发送日</dt>
                  <dd>{{ selectedPurchaseInquiry.template_sent_at ?? '未发送' }}</dd>
                </div>
              </dl>

              <div class="transaction-box">
                <strong>询价备注</strong>
                <p>{{ selectedPurchaseInquiry.remarks ?? '未填写' }}</p>
              </div>
              <div class="delivery-action-row">
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="selectedPurchaseInquiry.status !== 'draft'"
                  @click="loadSelectedPurchaseInquiryForEdit"
                >
                  <FilePenLine :size="18" />
                  <span>载入编辑</span>
                </button>
              </div>

              <form class="record-form accessory-form" @submit.prevent="sendSelectedPurchaseInquiryTemplate">
                <div class="form-divider">询价模板发送</div>
                <label for="purchase-inquiry-template-name">
                  模板名称
                  <input id="purchase-inquiry-template-name" v-model="purchaseInquiryTemplateForm.template_name" required maxlength="120" />
                </label>
                <label for="purchase-inquiry-template-emails">
                  收件邮箱
                  <input id="purchase-inquiry-template-emails" v-model="purchaseInquiryTemplateForm.recipient_emails" maxlength="400" />
                </label>
                <button class="secondary-button" type="submit">
                  <Send :size="18" />
                  <span>发送询价模板</span>
                </button>
              </form>

              <div v-if="purchaseInquiryTemplatePreview" class="transaction-box">
                <strong>询价模板预览</strong>
                <pre>{{ purchaseInquiryTemplatePreview }}</pre>
              </div>

              <form class="record-form accessory-form" @submit.prevent="addSelectedPurchaseQuotation">
                <div class="form-divider">供应商报价明细</div>
                <div class="form-pair two">
                  <label for="purchase-quotation-supplier-id">
                    供应商标识
                    <input id="purchase-quotation-supplier-id" v-model="purchaseQuotationForm.supplier_id" maxlength="36" />
                  </label>
                  <label for="purchase-quotation-supplier-name">
                    供应商名称
                    <input id="purchase-quotation-supplier-name" v-model="purchaseQuotationForm.supplier_name" required maxlength="240" />
                  </label>
                </div>
                <div class="form-pair three">
                  <label for="purchase-quotation-date">
                    报价日期
                    <input id="purchase-quotation-date" v-model="purchaseQuotationForm.quoted_at" required type="date" />
                  </label>
                  <label for="purchase-quotation-price">
                    单价
                    <input id="purchase-quotation-price" v-model="purchaseQuotationForm.unit_price" required min="0.0001" step="0.0001" type="number" />
                  </label>
                  <label for="purchase-quotation-currency">
                    币种
                    <input id="purchase-quotation-currency" v-model="purchaseQuotationForm.currency" required maxlength="10" />
                  </label>
                </div>
                <div class="form-pair two">
                  <label for="purchase-quotation-lead-time">
                    交期天数
                    <input id="purchase-quotation-lead-time" v-model="purchaseQuotationForm.lead_time_days" min="0" step="1" type="number" />
                  </label>
                  <label for="purchase-quotation-moq">
                    最小起订量
                    <input id="purchase-quotation-moq" v-model="purchaseQuotationForm.min_order_quantity" min="0" step="0.0001" type="number" />
                  </label>
                </div>
                <label class="checkbox-label" for="purchase-quotation-sample">
                  <input id="purchase-quotation-sample" v-model="purchaseQuotationForm.sample_available" type="checkbox" />
                  可提供样品
                </label>
                <label for="purchase-quotation-remark">
                  报价备注
                  <input id="purchase-quotation-remark" v-model="purchaseQuotationForm.remark" maxlength="2000" />
                </label>
                <button class="primary-button" type="submit">
                  <Plus :size="18" />
                  <span>登记供应商报价</span>
                </button>
              </form>

              <div class="accessory-heading">
                <strong>询价商品明细</strong>
                <span>{{ selectedPurchaseInquiry.lines.length }} 行</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格/型号</th>
                    <th>数量</th>
                    <th>单位</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedPurchaseInquiry.lines" :key="line.id">
                    <td>{{ line.product_code ?? '未填' }} / {{ line.product_name }}</td>
                    <td>{{ line.specification ?? '未填' }} / {{ line.model ?? '未填' }}</td>
                    <td>{{ line.quantity }}</td>
                    <td>{{ line.unit }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>供应商报价比较</strong>
                <span>{{ selectedPurchaseInquiry.quotations.length }} 条</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="quote in selectedPurchaseInquiry.quotations" :key="quote.id">
                    <td>{{ quote.supplier_name }}</td>
                    <td>{{ quote.product_code ?? '未填' }} / {{ quote.product_name }}</td>
                    <td>{{ formatMoney(quote.unit_price, quote.currency) }}</td>
                    <td>{{ quote.lead_time_days ?? '未填' }} 天</td>
                    <td>{{ quote.min_order_quantity ?? '未填' }}</td>
                    <td>{{ quote.has_sample ? '有样品' : '未提供' }}</td>
                    <td>{{ quote.remark ?? '未填' }}</td>
                  </tr>
                  <tr v-if="selectedPurchaseInquiry.quotations.length === 0">
                    <td colspan="7" class="empty-cell">暂无供应商报价</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>供应商样品关联</strong>
                <span>{{ purchaseInquirySupplierSamples.length }} 条</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="sample in purchaseInquirySupplierSamples" :key="sample.sample_record_id">
                    <td>{{ sample.sample_code }}</td>
                    <td>{{ sample.supplier_name ?? '未填' }}</td>
                    <td>{{ sample.product_code ?? '未填' }} / {{ sample.product_name }}</td>
                    <td>{{ sample.received_at }}</td>
                    <td>{{ sample.quantity }} {{ sample.unit }}</td>
                    <td>{{ sample.status }}</td>
                  </tr>
                  <tr v-if="purchaseInquirySupplierSamples.length === 0">
                    <td colspan="6" class="empty-cell">暂无供应商样品</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>采购参考价</strong>
                <span>{{ purchaseInquiryReferences.length }} 条</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="reference in purchaseInquiryReferences" :key="`${reference.source_inquiry_no}-${reference.supplier_name}`">
                    <td>{{ reference.source_inquiry_no }}</td>
                    <td>{{ reference.product_code ?? '未填' }} / {{ reference.product_name }}</td>
                    <td>{{ reference.supplier_name }}</td>
                    <td>{{ formatMoney(reference.reference_price, reference.currency) }}</td>
                    <td>{{ reference.quote_date }}</td>
                  </tr>
                  <tr v-if="purchaseInquiryReferences.length === 0">
                    <td colspan="5" class="empty-cell">暂无采购参考价</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-cell">暂无采购询价</div>
          </section>
        </section>
      </template>

      <template v-else-if="isPurchaseContractPage">
        <section class="summary-strip delivery-summary" aria-label="采购合同概览">
          <div v-for="item in purchaseContractStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="purchaseContractMessage" class="success-banner">{{ purchaseContractMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>采购合同列表</h2>
              <form class="search-form" @submit.prevent="loadPurchaseContracts">
                <label>
                  <span>合同搜索</span>
                  <input v-model="purchaseContractSearch" placeholder="合同号 / 供应商 / 商品 / 备注" />
                </label>
                <label>
                  <span>审批状态</span>
                  <select v-model="purchaseContractStatusFilter">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="submitted">待审批</option>
                    <option value="approved">已审批</option>
                  </select>
                </label>
                <label>
                  <span>来源类型</span>
                  <select v-model="purchaseContractSourceFilter">
                    <option value="">全部来源</option>
                    <option value="export_contract">出口合同生成</option>
                    <option value="stock_purchase">库存采购</option>
                    <option value="manual">手工采购</option>
                  </select>
                </label>
                <label>
                  <span>供应商标识</span>
                  <input v-model="purchaseContractSupplierFilter" placeholder="supplier-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>采购合同</th>
                    <th>状态</th>
                    <th>来源</th>
                    <th>供应商</th>
                    <th>交货日</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in purchaseContracts"
                    :key="item.id"
                    :class="{ selected: item.id === selectedPurchaseContract?.id }"
                    @click="selectPurchaseContract(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ purchaseContractStatusLabel(item.approval_status) }}</td>
                    <td>{{ purchaseContractSourceTypeLabel(item.source_type) }}</td>
                    <td>{{ item.supplier_name }}</td>
                    <td>{{ item.delivery_date }}</td>
                    <td>{{ formatMoney(item.statistics.total_amount, item.currency) }}</td>
                  </tr>
                  <tr v-if="purchaseContracts.length === 0">
                    <td colspan="6" class="empty-cell">暂无采购合同</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>{{ editingPurchaseContractId ? '编辑采购合同' : '库存/手工采购合同' }}</h2>
              <FileText :size="18" />
            </div>
            <form class="record-form" @submit.prevent="submitPurchaseContractForm">
              <div class="form-pair two">
                <label for="purchase-contract-code">
                  合同号
                  <input id="purchase-contract-code" v-model="purchaseContractForm.code" required maxlength="80" />
                </label>
                <label for="purchase-contract-date">
                  合同日期
                  <input id="purchase-contract-date" v-model="purchaseContractForm.contract_date" required type="date" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="purchase-contract-supplier-id">
                  供应商标识
                  <input id="purchase-contract-supplier-id" v-model="purchaseContractForm.supplier_id" maxlength="36" />
                </label>
                <label for="purchase-contract-supplier-name">
                  供应商
                  <input id="purchase-contract-supplier-name" v-model="purchaseContractForm.supplier_name" required maxlength="240" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="purchase-contract-buyer-name">
                  采购员
                  <input id="purchase-contract-buyer-name" v-model="purchaseContractForm.buyer_user_name" maxlength="160" />
                </label>
                <label for="purchase-contract-buyer-id">
                  采购员标识
                  <input id="purchase-contract-buyer-id" v-model="purchaseContractForm.buyer_user_id" maxlength="36" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="purchase-contract-currency">
                  币种
                  <input id="purchase-contract-currency" v-model="purchaseContractForm.currency" required maxlength="10" />
                </label>
                <label for="purchase-contract-delivery-date">
                  交货日期
                  <input id="purchase-contract-delivery-date" v-model="purchaseContractForm.delivery_date" required type="date" />
                </label>
                <label for="purchase-contract-source-type">
                  来源
                  <select id="purchase-contract-source-type" v-model="purchaseContractForm.source_type" required>
                    <option value="stock_purchase">库存采购</option>
                    <option value="manual">手工采购</option>
                    <option value="export_contract">出口合同生成</option>
                  </select>
                </label>
              </div>
              <label for="purchase-contract-payment-terms">
                付款条款
                <input id="purchase-contract-payment-terms" v-model="purchaseContractForm.payment_terms" required maxlength="2000" />
              </label>

              <div class="form-divider">合同商品明细</div>
              <div class="form-pair two">
                <label for="purchase-contract-product-id">
                  商品标识
                  <input id="purchase-contract-product-id" v-model="purchaseContractForm.product_id" maxlength="36" />
                </label>
                <label for="purchase-contract-product-code">
                  商品编号
                  <input id="purchase-contract-product-code" v-model="purchaseContractForm.product_code" maxlength="80" />
                </label>
              </div>
              <label for="purchase-contract-product-name">
                商品名称
                <input id="purchase-contract-product-name" v-model="purchaseContractForm.product_name" required maxlength="240" />
              </label>
              <div class="form-pair two">
                <label for="purchase-contract-specification">
                  规格
                  <input id="purchase-contract-specification" v-model="purchaseContractForm.specification" maxlength="240" />
                </label>
                <label for="purchase-contract-model">
                  型号
                  <input id="purchase-contract-model" v-model="purchaseContractForm.model" maxlength="120" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="purchase-contract-quantity">
                  数量
                  <input id="purchase-contract-quantity" v-model="purchaseContractForm.quantity" required min="0.0001" step="0.0001" type="number" />
                </label>
                <label for="purchase-contract-unit">
                  单位
                  <input id="purchase-contract-unit" v-model="purchaseContractForm.unit" required maxlength="40" />
                </label>
                <label for="purchase-contract-unit-price">
                  单价
                  <input id="purchase-contract-unit-price" v-model="purchaseContractForm.unit_price" required min="0" step="0.0001" type="number" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="purchase-contract-source-contract-id">
                  来源出口合同 ID
                  <input id="purchase-contract-source-contract-id" v-model="purchaseContractForm.source_export_contract_id" maxlength="36" />
                </label>
                <label for="purchase-contract-source-contract-no">
                  来源合同号
                  <input id="purchase-contract-source-contract-no" v-model="purchaseContractForm.source_export_contract_no" maxlength="80" />
                </label>
                <label for="purchase-contract-source-line-id">
                  来源明细 ID
                  <input id="purchase-contract-source-line-id" v-model="purchaseContractForm.source_export_contract_line_id" maxlength="36" />
                </label>
              </div>
              <label for="purchase-contract-line-remark">
                行备注
                <input id="purchase-contract-line-remark" v-model="purchaseContractForm.line_remark" maxlength="2000" />
              </label>
              <label for="purchase-contract-remarks">
                合同备注
                <textarea id="purchase-contract-remarks" v-model="purchaseContractForm.remarks" rows="2" maxlength="4000" />
              </label>
              <button class="primary-button" type="submit">
                <Save v-if="editingPurchaseContractId" :size="18" />
                <Plus v-else :size="18" />
                <span>{{ editingPurchaseContractId ? '保存采购合同' : '新增采购合同' }}</span>
              </button>
              <button
                v-if="editingPurchaseContractId"
                class="secondary-button"
                type="button"
                @click="cancelPurchaseContractEdit"
              >
                <RefreshCw :size="18" />
                <span>取消编辑</span>
              </button>
            </form>

            <form class="record-form accessory-form" @submit.prevent="generatePurchaseContractFromSources">
              <div class="form-divider">从已审批出口合同生成</div>
              <div class="form-pair two">
                <label for="purchase-contract-generate-code">
                  采购合同号
                  <input id="purchase-contract-generate-code" v-model="purchaseContractGenerateForm.code" required maxlength="80" />
                </label>
                <label for="purchase-contract-generate-date">
                  合同日期
                  <input id="purchase-contract-generate-date" v-model="purchaseContractGenerateForm.contract_date" required type="date" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="purchase-contract-source-a">
                  出口合同 ID A
                  <input id="purchase-contract-source-a" v-model="purchaseContractGenerateForm.source_contract_id_a" required maxlength="36" />
                </label>
                <label for="purchase-contract-source-b">
                  出口合同 ID B
                  <input id="purchase-contract-source-b" v-model="purchaseContractGenerateForm.source_contract_id_b" maxlength="36" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="purchase-contract-generate-supplier-id">
                  供应商标识
                  <input id="purchase-contract-generate-supplier-id" v-model="purchaseContractGenerateForm.supplier_id" maxlength="36" />
                </label>
                <label for="purchase-contract-generate-supplier-name">
                  供应商
                  <input id="purchase-contract-generate-supplier-name" v-model="purchaseContractGenerateForm.supplier_name" required maxlength="240" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="purchase-contract-generate-currency">
                  币种
                  <input id="purchase-contract-generate-currency" v-model="purchaseContractGenerateForm.currency" required maxlength="10" />
                </label>
                <label for="purchase-contract-generate-delivery-date">
                  交货日期
                  <input id="purchase-contract-generate-delivery-date" v-model="purchaseContractGenerateForm.delivery_date" required type="date" />
                </label>
                <label for="purchase-contract-generate-unit-price">
                  配件单价
                  <input id="purchase-contract-generate-unit-price" v-model="purchaseContractGenerateForm.unit_price" required min="0" step="0.0001" type="number" />
                </label>
              </div>
              <label for="purchase-contract-generate-payment">
                付款条款
                <input id="purchase-contract-generate-payment" v-model="purchaseContractGenerateForm.payment_terms" required maxlength="2000" />
              </label>
              <label for="purchase-contract-generate-remarks">
                生成备注
                <input id="purchase-contract-generate-remarks" v-model="purchaseContractGenerateForm.remarks" maxlength="4000" />
              </label>
              <button class="primary-button" type="submit">
                <Files :size="18" />
                <span>生成采购合同</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>采购合同明细</h2>
              <span>{{ selectedPurchaseContract?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedPurchaseContract" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>状态/合同日</dt>
                  <dd>{{ purchaseContractStatusLabel(selectedPurchaseContract.approval_status) }} / {{ selectedPurchaseContract.contract_date }}</dd>
                </div>
                <div>
                  <dt>来源</dt>
                  <dd>{{ purchaseContractSourceTypeLabel(selectedPurchaseContract.source_type) }}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{{ selectedPurchaseContract.supplier_name }}</dd>
                </div>
                <div>
                  <dt>采购员</dt>
                  <dd>{{ selectedPurchaseContract.buyer_user_name ?? '未指定' }}</dd>
                </div>
                <div>
                  <dt>交货日期</dt>
                  <dd>{{ selectedPurchaseContract.delivery_date }}</dd>
                </div>
                <div>
                  <dt>合同金额</dt>
                  <dd>{{ formatMoney(selectedPurchaseContract.statistics.total_amount, selectedPurchaseContract.currency) }}</dd>
                </div>
                <div>
                  <dt>未付金额</dt>
                  <dd>{{ formatMoney(selectedPurchaseContract.statistics.unpaid_amount, selectedPurchaseContract.currency) }}</dd>
                </div>
                <div>
                  <dt>审批人</dt>
                  <dd>{{ selectedPurchaseContract.reviewer_name ?? '未审批' }}</dd>
                </div>
              </dl>

              <div class="transaction-box">
                <strong>付款条款</strong>
                <p>{{ selectedPurchaseContract.payment_terms }}</p>
              </div>
              <div class="transaction-box">
                <strong>合同备注</strong>
                <p>{{ selectedPurchaseContract.remarks ?? '未填写' }}</p>
              </div>

              <div class="delivery-action-row">
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="selectedPurchaseContract.approval_status !== 'draft'"
                  @click="loadSelectedPurchaseContractForEdit"
                >
                  <FilePenLine :size="18" />
                  <span>载入编辑</span>
                </button>
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="selectedPurchaseContract.approval_status !== 'draft'"
                  @click="submitSelectedPurchaseContract"
                >
                  <Send :size="18" />
                  <span>提交采购合同</span>
                </button>
              </div>

              <form class="record-form accessory-form" @submit.prevent="approveSelectedPurchaseContract">
                <div class="form-divider">采购合同审批</div>
                <div class="form-pair two">
                  <label for="purchase-contract-reviewer">
                    审批人
                    <input id="purchase-contract-reviewer" v-model="purchaseContractApproveForm.reviewer_name" required maxlength="160" />
                  </label>
                  <label for="purchase-contract-approved-at">
                    审批日期
                    <input id="purchase-contract-approved-at" v-model="purchaseContractApproveForm.approved_at" required type="date" />
                  </label>
                </div>
                <button
                  class="primary-button"
                  type="submit"
                  :disabled="selectedPurchaseContract.approval_status !== 'submitted'"
                >
                  <CheckCircle2 :size="18" />
                  <span>审批采购合同</span>
                </button>
              </form>

              <div class="accessory-heading">
                <strong>合同商品明细</strong>
                <span>{{ selectedPurchaseContract.lines.length }} 行</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="line in selectedPurchaseContract.lines" :key="line.id">
                    <td>{{ line.product_code ?? '未填' }} / {{ line.product_name }}</td>
                    <td>{{ line.specification ?? '未填' }} / {{ line.model ?? '未填' }}</td>
                    <td>{{ line.quantity }} {{ line.unit }}</td>
                    <td>{{ formatMoney(line.unit_price, selectedPurchaseContract.currency) }}</td>
                    <td>{{ formatMoney(line.amount, selectedPurchaseContract.currency) }}</td>
                    <td>{{ line.unreceived_quantity }} {{ line.unit }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>来源出口合同</strong>
                <span>{{ selectedPurchaseContract.source_links.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>出口合同</th>
                    <th>客户</th>
                    <th>商品</th>
                    <th>需求数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="source in selectedPurchaseContract.source_links" :key="source.id">
                    <td>{{ source.export_contract_no }}</td>
                    <td>{{ source.customer_name }}</td>
                    <td>{{ source.product_code ?? '未填' }}</td>
                    <td>{{ source.demand_quantity }} {{ source.unit }}</td>
                  </tr>
                  <tr v-if="selectedPurchaseContract.source_links.length === 0">
                    <td colspan="4" class="empty-cell">库存采购或手工采购，无来源出口合同</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>付款和交货提醒</strong>
                <span>{{ selectedPurchaseContract.reminders.length }} 条</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="reminder in selectedPurchaseContract.reminders" :key="reminder.id">
                    <td>{{ purchaseReminderTypeLabel(reminder.reminder_type) }}</td>
                    <td>{{ reminder.title }}</td>
                    <td>{{ reminder.due_date }}</td>
                    <td>{{ reminder.amount ? formatMoney(reminder.amount, reminder.currency) : '无金额' }}</td>
                    <td>{{ reminder.status === 'open' ? '待处理' : '已完成' }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>进度概览</strong>
                <span>{{ selectedPurchaseContract.statistics.unreceived_quantity }} 未收</span>
              </div>
              <table class="data-table compact-table">
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
                    <td>{{ selectedPurchaseContract.statistics.total_quantity }}</td>
                    <td>{{ selectedPurchaseContract.statistics.received_quantity }}</td>
                    <td>{{ selectedPurchaseContract.statistics.unreceived_quantity }}</td>
                    <td>{{ formatMoney(selectedPurchaseContract.statistics.paid_amount, selectedPurchaseContract.currency) }}</td>
                    <td>{{ formatMoney(selectedPurchaseContract.statistics.unpaid_amount, selectedPurchaseContract.currency) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>全局采购提醒</strong>
                <span>{{ purchaseContractReminders.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="reminder in purchaseContractReminders" :key="reminder.id">
                    <td>{{ purchaseReminderTypeLabel(reminder.reminder_type) }}</td>
                    <td>{{ reminder.title }}</td>
                    <td>{{ reminder.due_date }}</td>
                    <td>{{ reminder.amount ? formatMoney(reminder.amount, reminder.currency) : '无金额' }}</td>
                  </tr>
                  <tr v-if="purchaseContractReminders.length === 0">
                    <td colspan="4" class="empty-cell">暂无采购提醒</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-cell">暂无采购合同</div>
          </section>
        </section>
      </template>

      <template v-else-if="isPurchaseInvoiceNoticePage">
        <section class="summary-strip" aria-label="开票通知概览">
          <div v-for="item in purchaseInvoiceNoticeStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="purchaseInvoiceNoticeMessage" class="success-banner">{{ purchaseInvoiceNoticeMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>开票通知列表</h2>
              <form class="search-form" @submit.prevent="loadPurchaseInvoiceNotices">
                <label>
                  <span>通知搜索</span>
                  <input v-model="purchaseInvoiceNoticeSearch" placeholder="通知号 / 供应商 / 品名" />
                </label>
                <label>
                  <span>通知状态</span>
                  <select v-model="purchaseInvoiceNoticeStatusFilter">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="sent">已发送</option>
                    <option value="received">已收票</option>
                  </select>
                </label>
                <label>
                  <span>供应商标识</span>
                  <input v-model="purchaseInvoiceNoticeSupplierFilter" placeholder="supplier-id" />
                </label>
                <label>
                  <span>报关单证 ID</span>
                  <input v-model="purchaseInvoiceNoticeCustomsFilter" placeholder="customs-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>开票通知</th>
                    <th>状态</th>
                    <th>供应商</th>
                    <th>报关单</th>
                    <th>金额</th>
                    <th>提醒</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in purchaseInvoiceNotices"
                    :key="item.id"
                    :class="{ selected: item.id === selectedPurchaseInvoiceNotice?.id }"
                    @click="selectPurchaseInvoiceNotice(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ purchaseInvoiceNoticeStatusLabel(item.status) }}</td>
                    <td>{{ item.supplier_name }}</td>
                    <td>{{ item.customs_declaration_no }}</td>
                    <td>{{ formatMoney(item.total_amount, item.currency) }}</td>
                    <td>{{ item.reminders.filter((reminder) => reminder.status === 'open').length }} 个</td>
                  </tr>
                  <tr v-if="purchaseInvoiceNotices.length === 0">
                    <td colspan="6" class="empty-cell">暂无开票通知</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>从报关单证生成</h2>
              <Files :size="18" />
            </div>
            <form class="record-form" @submit.prevent="generatePurchaseInvoiceNoticesFromCustoms">
              <div class="form-pair two">
                <label for="purchase-invoice-customs-id">
                  报关单证 ID
                  <input id="purchase-invoice-customs-id" v-model="purchaseInvoiceNoticeForm.customs_declaration_id" maxlength="36" />
                </label>
                <label for="purchase-invoice-customs-no">
                  报关单号
                  <input id="purchase-invoice-customs-no" v-model="purchaseInvoiceNoticeForm.customs_declaration_no" required maxlength="80" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="purchase-invoice-declaration-date">
                  报关日期
                  <input id="purchase-invoice-declaration-date" v-model="purchaseInvoiceNoticeForm.declaration_date" required type="date" />
                </label>
                <label for="purchase-invoice-notice-date">
                  通知日期
                  <input id="purchase-invoice-notice-date" v-model="purchaseInvoiceNoticeForm.notice_date" required type="date" />
                </label>
                <label for="purchase-invoice-currency">
                  币种
                  <input id="purchase-invoice-currency" v-model="purchaseInvoiceNoticeForm.currency" required maxlength="10" />
                </label>
              </div>
              <label for="purchase-invoice-remarks">
                生成备注
                <input id="purchase-invoice-remarks" v-model="purchaseInvoiceNoticeForm.remarks" maxlength="4000" />
              </label>

              <div class="form-divider">供应商 A 开票要求</div>
              <div class="form-pair two">
                <label for="purchase-invoice-supplier-id-a">
                  供应商标识
                  <input id="purchase-invoice-supplier-id-a" v-model="purchaseInvoiceNoticeForm.supplier_id_a" maxlength="36" />
                </label>
                <label for="purchase-invoice-supplier-name-a">
                  供应商
                  <input id="purchase-invoice-supplier-name-a" v-model="purchaseInvoiceNoticeForm.supplier_name_a" required maxlength="240" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="purchase-invoice-contract-no-a">
                  采购合同号
                  <input id="purchase-invoice-contract-no-a" v-model="purchaseInvoiceNoticeForm.purchase_contract_no_a" maxlength="80" />
                </label>
                <label for="purchase-invoice-product-code-a">
                  商品编号
                  <input id="purchase-invoice-product-code-a" v-model="purchaseInvoiceNoticeForm.product_code_a" maxlength="80" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="purchase-invoice-product-name-a">
                  商品名称
                  <input id="purchase-invoice-product-name-a" v-model="purchaseInvoiceNoticeForm.product_name_a" required maxlength="240" />
                </label>
                <label for="purchase-invoice-customs-name-a">
                  报关品名
                  <input id="purchase-invoice-customs-name-a" v-model="purchaseInvoiceNoticeForm.customs_name_a" required maxlength="240" />
                </label>
                <label for="purchase-invoice-name-a">
                  开票品名
                  <input id="purchase-invoice-name-a" v-model="purchaseInvoiceNoticeForm.invoice_name_a" required maxlength="240" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="purchase-invoice-quantity-a">
                  开票数量
                  <input id="purchase-invoice-quantity-a" v-model="purchaseInvoiceNoticeForm.quantity_a" required min="0.0001" step="0.0001" type="number" />
                </label>
                <label for="purchase-invoice-unit-a">
                  单位
                  <input id="purchase-invoice-unit-a" v-model="purchaseInvoiceNoticeForm.unit_a" required maxlength="40" />
                </label>
                <label for="purchase-invoice-amount-a">
                  金额
                  <input id="purchase-invoice-amount-a" v-model="purchaseInvoiceNoticeForm.amount_a" required min="0" step="0.01" type="number" />
                </label>
              </div>
              <label for="purchase-invoice-remark-a">
                行备注
                <input id="purchase-invoice-remark-a" v-model="purchaseInvoiceNoticeForm.remark_a" maxlength="2000" />
              </label>

              <div class="form-divider">供应商 B 开票要求</div>
              <div class="form-pair two">
                <label for="purchase-invoice-supplier-id-b">
                  供应商标识
                  <input id="purchase-invoice-supplier-id-b" v-model="purchaseInvoiceNoticeForm.supplier_id_b" maxlength="36" />
                </label>
                <label for="purchase-invoice-supplier-name-b">
                  供应商
                  <input id="purchase-invoice-supplier-name-b" v-model="purchaseInvoiceNoticeForm.supplier_name_b" maxlength="240" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="purchase-invoice-contract-no-b">
                  采购合同号
                  <input id="purchase-invoice-contract-no-b" v-model="purchaseInvoiceNoticeForm.purchase_contract_no_b" maxlength="80" />
                </label>
                <label for="purchase-invoice-product-code-b">
                  商品编号
                  <input id="purchase-invoice-product-code-b" v-model="purchaseInvoiceNoticeForm.product_code_b" maxlength="80" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="purchase-invoice-product-name-b">
                  商品名称
                  <input id="purchase-invoice-product-name-b" v-model="purchaseInvoiceNoticeForm.product_name_b" maxlength="240" />
                </label>
                <label for="purchase-invoice-customs-name-b">
                  报关品名
                  <input id="purchase-invoice-customs-name-b" v-model="purchaseInvoiceNoticeForm.customs_name_b" maxlength="240" />
                </label>
                <label for="purchase-invoice-name-b">
                  开票品名
                  <input id="purchase-invoice-name-b" v-model="purchaseInvoiceNoticeForm.invoice_name_b" maxlength="240" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="purchase-invoice-quantity-b">
                  开票数量
                  <input id="purchase-invoice-quantity-b" v-model="purchaseInvoiceNoticeForm.quantity_b" min="0.0001" step="0.0001" type="number" />
                </label>
                <label for="purchase-invoice-unit-b">
                  单位
                  <input id="purchase-invoice-unit-b" v-model="purchaseInvoiceNoticeForm.unit_b" maxlength="40" />
                </label>
                <label for="purchase-invoice-amount-b">
                  金额
                  <input id="purchase-invoice-amount-b" v-model="purchaseInvoiceNoticeForm.amount_b" min="0" step="0.01" type="number" />
                </label>
              </div>
              <label for="purchase-invoice-remark-b">
                行备注
                <input id="purchase-invoice-remark-b" v-model="purchaseInvoiceNoticeForm.remark_b" maxlength="2000" />
              </label>

              <button class="primary-button" type="submit">
                <Files :size="18" />
                <span>生成开票通知</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>开票通知明细</h2>
              <span>{{ selectedPurchaseInvoiceNotice?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedPurchaseInvoiceNotice" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>状态/通知日</dt>
                  <dd>{{ purchaseInvoiceNoticeStatusLabel(selectedPurchaseInvoiceNotice.status) }} / {{ selectedPurchaseInvoiceNotice.notice_date }}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{{ selectedPurchaseInvoiceNotice.supplier_name }}</dd>
                </div>
                <div>
                  <dt>报关单号</dt>
                  <dd>{{ selectedPurchaseInvoiceNotice.customs_declaration_no }}</dd>
                </div>
                <div>
                  <dt>报关日期</dt>
                  <dd>{{ selectedPurchaseInvoiceNotice.declaration_date }}</dd>
                </div>
                <div>
                  <dt>开票数量</dt>
                  <dd>{{ selectedPurchaseInvoiceNotice.total_quantity }}</dd>
                </div>
                <div>
                  <dt>通知金额</dt>
                  <dd>{{ formatMoney(selectedPurchaseInvoiceNotice.total_amount, selectedPurchaseInvoiceNotice.currency) }}</dd>
                </div>
                <div>
                  <dt>发送人</dt>
                  <dd>{{ selectedPurchaseInvoiceNotice.sender_name ?? '未发送' }}</dd>
                </div>
                <div>
                  <dt>税票号</dt>
                  <dd>{{ selectedPurchaseInvoiceNotice.tax_invoice_no ?? '未收票' }}</dd>
                </div>
              </dl>

              <div class="transaction-box">
                <strong>开票通知备注</strong>
                <p>{{ selectedPurchaseInvoiceNotice.remarks ?? '未填写' }}</p>
              </div>

              <form class="record-form accessory-form" @submit.prevent="sendSelectedPurchaseInvoiceNotice">
                <div class="form-divider">发送开票通知</div>
                <div class="form-pair two">
                  <label for="purchase-invoice-sender">
                    发送人
                    <input id="purchase-invoice-sender" v-model="purchaseInvoiceNoticeSendForm.sender_name" required maxlength="160" />
                  </label>
                  <label for="purchase-invoice-sent-at">
                    发送日期
                    <input id="purchase-invoice-sent-at" v-model="purchaseInvoiceNoticeSendForm.sent_at" required type="date" />
                  </label>
                </div>
                <button
                  class="primary-button"
                  type="submit"
                  :disabled="selectedPurchaseInvoiceNotice.status !== 'draft'"
                >
                  <Send :size="18" />
                  <span>发送开票通知</span>
                </button>
              </form>

              <form class="record-form accessory-form" @submit.prevent="receiveSelectedPurchaseInvoiceNoticeTaxInvoice">
                <div class="form-divider">登记供应商税票</div>
                <div class="form-pair two">
                  <label for="purchase-invoice-tax-no">
                    税票号
                    <input id="purchase-invoice-tax-no" v-model="purchaseInvoiceNoticeReceiveForm.tax_invoice_no" required maxlength="120" />
                  </label>
                  <label for="purchase-invoice-received-at">
                    收票日期
                    <input id="purchase-invoice-received-at" v-model="purchaseInvoiceNoticeReceiveForm.received_at" required type="date" />
                  </label>
                </div>
                <button
                  class="secondary-button"
                  type="submit"
                  :disabled="selectedPurchaseInvoiceNotice.status === 'received'"
                >
                  <CheckCircle2 :size="18" />
                  <span>登记税票</span>
                </button>
              </form>

              <div class="accessory-heading">
                <strong>开票品名和数量</strong>
                <span>{{ selectedPurchaseInvoiceNotice.lines.length }} 行</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="line in selectedPurchaseInvoiceNotice.lines" :key="line.id">
                    <td>{{ line.purchase_contract_no ?? '未关联' }}</td>
                    <td>{{ line.customs_name }}</td>
                    <td>{{ line.invoice_name }}</td>
                    <td>{{ line.quantity }} {{ line.unit }}</td>
                    <td>{{ formatMoney(line.amount, line.currency) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>税票催收提醒</strong>
                <span>{{ selectedPurchaseInvoiceNotice.reminders.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="reminder in selectedPurchaseInvoiceNotice.reminders" :key="reminder.id">
                    <td>{{ reminder.title }}</td>
                    <td>{{ reminder.due_date }}</td>
                    <td>{{ reminder.status === 'open' ? '待催收' : '已完成' }}</td>
                  </tr>
                  <tr v-if="selectedPurchaseInvoiceNotice.reminders.length === 0">
                    <td colspan="3" class="empty-cell">发送后自动生成税票催收提醒</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>全局税票催收</strong>
                <span>{{ purchaseInvoiceNoticeReminders.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>到期日</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="reminder in purchaseInvoiceNoticeReminders" :key="reminder.id">
                    <td>{{ reminder.title }}</td>
                    <td>{{ reminder.due_date }}</td>
                    <td>{{ reminder.status === 'open' ? '待催收' : '已完成' }}</td>
                  </tr>
                  <tr v-if="purchaseInvoiceNoticeReminders.length === 0">
                    <td colspan="3" class="empty-cell">暂无税票催收提醒</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-cell">暂无开票通知</div>
          </section>
        </section>
      </template>

      <template v-else-if="isPurchaseFollowupPage">
        <section class="summary-strip" aria-label="采购跟单概览">
          <div v-for="item in followupStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="followupMessage" class="success-banner">{{ followupMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>采购跟单计划</h2>
              <form class="search-form" @submit.prevent="loadFollowupWorkspace">
                <label>
                  <span>计划搜索</span>
                  <input v-model="followupSearch" placeholder="采购合同 / 供应商" />
                </label>
                <label>
                  <span>整体状态</span>
                  <select v-model="followupStatusFilter">
                    <option value="">全部状态</option>
                    <option value="pending">待跟进</option>
                    <option value="in_progress">进行中</option>
                    <option value="overdue">已逾期</option>
                    <option value="completed">已完成</option>
                  </select>
                </label>
                <label>
                  <span>供应商标识</span>
                  <input v-model="followupSupplierFilter" placeholder="supplier-id" />
                </label>
                <label>
                  <span>采购合同 ID</span>
                  <input v-model="followupContractFilter" placeholder="purchase-contract-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>采购合同</th>
                    <th>状态</th>
                    <th>供应商</th>
                    <th>基准日</th>
                    <th>节点</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in followupPlans"
                    :key="item.id"
                    :class="{ selected: item.id === selectedFollowupPlan?.id }"
                    @click="selectFollowupPlan(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.purchase_contract_no }}</button>
                    </td>
                    <td>{{ followupPlanStatusLabel(item.overall_status) }}</td>
                    <td>{{ item.supplier_name }}</td>
                    <td>{{ item.base_date }}</td>
                    <td>{{ item.nodes.filter((node) => node.status === 'completed').length }}/{{ item.nodes.length }}</td>
                  </tr>
                  <tr v-if="followupPlans.length === 0">
                    <td colspan="5" class="empty-cell">暂无采购跟单计划</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>跟单流程模板</h2>
              <CheckCircle2 :size="18" />
            </div>
            <form class="record-form" @submit.prevent="saveFollowupTemplate">
              <div class="form-pair two">
                <label for="followup-template-name">
                  模板名称
                  <input id="followup-template-name" v-model="followupTemplateForm.name" required maxlength="160" />
                </label>
                <label for="followup-template-default">
                  默认模板
                  <select id="followup-template-default" v-model="followupTemplateForm.is_default">
                    <option :value="true">是</option>
                    <option :value="false">否</option>
                  </select>
                </label>
              </div>
              <label class="checkbox-label" for="followup-template-enabled">
                <input id="followup-template-enabled" v-model="followupTemplateForm.enabled" type="checkbox" />
                启用模板
              </label>

              <div class="form-divider">节点标准天数 / 提前提醒天数</div>
              <div class="form-pair two">
                <label for="followup-contract-days">
                  合同下单确立
                  <input id="followup-contract-days" v-model="followupTemplateForm.contract_days" min="0" type="number" />
                </label>
                <label for="followup-contract-remind">
                  合同提醒
                  <input id="followup-contract-remind" v-model="followupTemplateForm.contract_remind" min="0" type="number" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="followup-confirm-days">
                  确认样提交
                  <input id="followup-confirm-days" v-model="followupTemplateForm.confirm_days" min="0" type="number" />
                </label>
                <label for="followup-confirm-remind">
                  确认样提醒
                  <input id="followup-confirm-remind" v-model="followupTemplateForm.confirm_remind" min="0" type="number" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="followup-bulk-days">
                  大货样提交
                  <input id="followup-bulk-days" v-model="followupTemplateForm.bulk_days" min="0" type="number" />
                </label>
                <label for="followup-bulk-remind">
                  大货样提醒
                  <input id="followup-bulk-remind" v-model="followupTemplateForm.bulk_remind" min="0" type="number" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="followup-qc-days">
                  QC 查验
                  <input id="followup-qc-days" v-model="followupTemplateForm.qc_days" min="0" type="number" />
                </label>
                <label for="followup-qc-remind">
                  QC 提醒
                  <input id="followup-qc-remind" v-model="followupTemplateForm.qc_remind" min="0" type="number" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="followup-inbound-days">
                  入库
                  <input id="followup-inbound-days" v-model="followupTemplateForm.inbound_days" min="0" type="number" />
                </label>
                <label for="followup-inbound-remind">
                  入库提醒
                  <input id="followup-inbound-remind" v-model="followupTemplateForm.inbound_remind" min="0" type="number" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="followup-outbound-days">
                  出库
                  <input id="followup-outbound-days" v-model="followupTemplateForm.outbound_days" min="0" type="number" />
                </label>
                <label for="followup-outbound-remind">
                  出库提醒
                  <input id="followup-outbound-remind" v-model="followupTemplateForm.outbound_remind" min="0" type="number" />
                </label>
              </div>
              <button class="primary-button" type="submit">
                <Save :size="18" />
                <span>保存跟单模板</span>
              </button>
            </form>

            <form class="record-form accessory-form" @submit.prevent="generateFollowupPlan">
              <div class="form-divider">采购合同生成跟单计划</div>
              <label for="followup-contract-id">
                采购合同 ID
                <input id="followup-contract-id" v-model="followupPlanForm.purchase_contract_id" required maxlength="36" />
              </label>
              <label for="followup-base-date">
                基准日期
                <input id="followup-base-date" v-model="followupPlanForm.as_of" type="date" />
              </label>
              <button class="secondary-button" type="submit">
                <Plus :size="18" />
                <span>生成跟单计划</span>
              </button>
            </form>

            <form class="record-form accessory-form" @submit.prevent="syncFollowupSourceEventFromForm">
              <div class="form-divider">业务来源回写</div>
              <label for="followup-source-contract-id">
                采购合同 ID
                <input id="followup-source-contract-id" v-model="followupSourceEventForm.purchase_contract_id" required maxlength="36" />
              </label>
              <div class="form-pair two">
                <label for="followup-source-node">
                  节点
                  <select id="followup-source-node" v-model="followupSourceEventForm.node_code">
                    <option value="confirm_sample_submitted">确认样提交</option>
                    <option value="bulk_sample_submitted">大货样提交</option>
                    <option value="quality_inspection">QC 查验</option>
                    <option value="inbound_completed">入库</option>
                    <option value="outbound_completed">出库</option>
                  </select>
                </label>
                <label for="followup-source-type">
                  来源类型
                  <select id="followup-source-type" v-model="followupSourceEventForm.source_record_type">
                    <option value="sample_followup_event">样品事件</option>
                    <option value="quality_inspection">QC 查验</option>
                    <option value="inventory_inbound">入库单</option>
                    <option value="inventory_outbound">出库单</option>
                  </select>
                </label>
              </div>
              <div class="form-pair two">
                <label for="followup-source-id">
                  来源记录 ID
                  <input id="followup-source-id" v-model="followupSourceEventForm.source_record_id" required maxlength="36" />
                </label>
                <label for="followup-actual-date">
                  实际日期
                  <input id="followup-actual-date" v-model="followupSourceEventForm.actual_date" required type="date" />
                </label>
              </div>
              <label for="followup-source-summary">
                来源摘要
                <input id="followup-source-summary" v-model="followupSourceEventForm.source_summary" required maxlength="240" />
              </label>
              <button class="secondary-button" type="submit">
                <CheckCircle2 :size="18" />
                <span>回写实际日期</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>节点进度查询</h2>
              <span>{{ selectedFollowupPlan?.purchase_contract_no ?? '未选择' }}</span>
            </div>
            <div v-if="selectedFollowupPlan" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>整体状态</dt>
                  <dd>{{ followupPlanStatusLabel(selectedFollowupPlan.overall_status) }}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{{ selectedFollowupPlan.supplier_name }}</dd>
                </div>
                <div>
                  <dt>基准日期</dt>
                  <dd>{{ selectedFollowupPlan.base_date }}</dd>
                </div>
                <div>
                  <dt>采购合同 ID</dt>
                  <dd>{{ selectedFollowupPlan.purchase_contract_id }}</dd>
                </div>
              </dl>

              <div class="delivery-action-row">
                <button class="secondary-button" type="button" @click="syncSelectedFollowupSampleEvents">
                  <RefreshCw :size="18" />
                  <span>同步样品事件</span>
                </button>
                <button class="secondary-button" type="button" @click="scanFollowupOverdueNodes">
                  <AlertTriangle :size="18" />
                  <span>扫描逾期节点</span>
                </button>
              </div>

              <div class="accessory-heading">
                <strong>采购合同节点进度</strong>
                <span>{{ selectedFollowupPlan.nodes.length }} 个节点</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="node in selectedFollowupPlan.nodes" :key="node.id">
                    <td>{{ node.node_name }}</td>
                    <td>{{ node.planned_date }}</td>
                    <td>{{ node.remind_date }}</td>
                    <td>{{ node.actual_date ?? '待回写' }}</td>
                    <td>{{ followupNodeStatusLabel(node.status) }}</td>
                    <td>{{ followupSourceTypeLabel(node.source_record_type) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>逾期节点预警</strong>
                <span>{{ followupOverdueNodes.length }} 条</span>
              </div>
              <form class="search-form inline-search" @submit.prevent="scanFollowupOverdueNodes">
                <label>
                  <span>扫描日期</span>
                  <input v-model="followupOverdueAsOf" type="date" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>扫描</span>
                </button>
              </form>
              <table class="data-table compact-table">
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
                  <tr v-for="node in followupOverdueNodes" :key="node.id">
                    <td>{{ node.purchase_contract_no }}</td>
                    <td>{{ node.supplier_name }}</td>
                    <td>{{ node.node_name }}</td>
                    <td>{{ node.planned_date }}</td>
                    <td>{{ node.overdue_days }} 天</td>
                  </tr>
                  <tr v-if="followupOverdueNodes.length === 0">
                    <td colspan="5" class="empty-cell">暂无逾期节点</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-cell">暂无采购跟单计划</div>
          </section>
        </section>
      </template>

      <template v-else-if="isQualityInspectionPage">
        <section class="summary-strip" aria-label="QC 查验概览">
          <div v-for="item in qualityInspectionStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="qualityInspectionMessage" class="success-banner">
          {{ qualityInspectionMessage }}
        </p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>QC 查验列表</h2>
              <form class="search-form" @submit.prevent="loadQualityInspections">
                <label>
                  <span>查验搜索</span>
                  <input v-model="qualityInspectionSearch" placeholder="QC 单号 / 采购合同 / 商品" />
                </label>
                <label>
                  <span>查验结果</span>
                  <select v-model="qualityInspectionResultFilter">
                    <option value="">全部结果</option>
                    <option value="passed">通过</option>
                    <option value="failed">不通过</option>
                    <option value="partial_passed">部分通过</option>
                    <option value="recheck_required">待复检</option>
                  </select>
                </label>
                <label>
                  <span>供应商标识</span>
                  <input v-model="qualityInspectionSupplierFilter" placeholder="supplier-id" />
                </label>
                <label>
                  <span>采购合同 ID</span>
                  <input v-model="qualityInspectionContractFilter" placeholder="purchase-contract-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>QC 单号</th>
                    <th>结果</th>
                    <th>采购合同</th>
                    <th>供应商</th>
                    <th>查验日期</th>
                    <th>异常</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in qualityInspections"
                    :key="item.id"
                    :class="{ selected: item.id === selectedQualityInspection?.id }"
                    @click="selectQualityInspection(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ qualityInspectionResultLabel(item.result) }}</td>
                    <td>{{ item.purchase_contract_no }}</td>
                    <td>{{ item.supplier_name }}</td>
                    <td>{{ item.inspected_at }}</td>
                    <td>{{ item.issues.length }}</td>
                  </tr>
                  <tr v-if="qualityInspections.length === 0">
                    <td colspan="6" class="empty-cell">暂无 QC 查验记录</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>{{ editingQualityInspectionId ? '编辑 QC 查验' : '新增 QC 查验' }}</h2>
              <ClipboardCheck :size="18" />
            </div>
            <form class="record-form" @submit.prevent="saveQualityInspection">
              <div class="form-pair two">
                <label for="quality-code">
                  QC 单号
                  <input id="quality-code" v-model="qualityInspectionForm.code" required maxlength="80" />
                </label>
                <label for="quality-contract-id">
                  采购合同 ID
                  <input id="quality-contract-id" v-model="qualityInspectionForm.purchase_contract_id" required maxlength="36" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="quality-inspected-at">
                  查验日期
                  <input id="quality-inspected-at" v-model="qualityInspectionForm.inspected_at" required type="date" />
                </label>
                <label for="quality-result">
                  查验结果
                  <select id="quality-result" v-model="qualityInspectionForm.result">
                    <option value="passed">通过</option>
                    <option value="failed">不通过</option>
                    <option value="partial_passed">部分通过</option>
                    <option value="recheck_required">待复检</option>
                  </select>
                </label>
              </div>
              <div class="form-pair two">
                <label for="quality-inspector-name">
                  查验人
                  <input id="quality-inspector-name" v-model="qualityInspectionForm.inspector_name" required maxlength="160" />
                </label>
                <label for="quality-attachment-group">
                  附件组
                  <input id="quality-attachment-group" v-model="qualityInspectionForm.attachment_group_id" maxlength="80" />
                </label>
              </div>
              <label for="quality-summary">
                问题摘要
                <textarea id="quality-summary" v-model="qualityInspectionForm.issue_summary" rows="2" maxlength="4000" />
              </label>

              <div class="form-divider">查验明细</div>
              <label for="quality-line-id">
                采购合同明细 ID
                <input id="quality-line-id" v-model="qualityInspectionForm.purchase_contract_line_id" maxlength="36" />
              </label>
              <div class="form-pair two">
                <label for="quality-product-code">
                  商品编码
                  <input id="quality-product-code" v-model="qualityInspectionForm.product_code" maxlength="80" />
                </label>
                <label for="quality-product-name">
                  商品名称
                  <input id="quality-product-name" v-model="qualityInspectionForm.product_name" required maxlength="240" />
                </label>
              </div>
              <div class="form-pair three">
                <label for="quality-inspected-quantity">
                  查验数量
                  <input id="quality-inspected-quantity" v-model="qualityInspectionForm.inspected_quantity" required type="number" min="0.0001" step="0.0001" />
                </label>
                <label for="quality-failed-quantity">
                  不合格数量
                  <input id="quality-failed-quantity" v-model="qualityInspectionForm.failed_quantity" type="number" min="0" step="0.0001" />
                </label>
                <label for="quality-unit">
                  单位
                  <input id="quality-unit" v-model="qualityInspectionForm.unit" required maxlength="40" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="quality-line-result">
                  明细结果
                  <select id="quality-line-result" v-model="qualityInspectionForm.line_result">
                    <option value="passed">通过</option>
                    <option value="failed">不通过</option>
                    <option value="partial_passed">部分通过</option>
                    <option value="recheck_required">待复检</option>
                  </select>
                </label>
                <label for="quality-line-remark">
                  明细备注
                  <input id="quality-line-remark" v-model="qualityInspectionForm.line_remark" maxlength="2000" />
                </label>
              </div>

              <div class="form-divider">异常问题</div>
              <div class="form-pair two">
                <label for="quality-issue-type">
                  问题类型
                  <input id="quality-issue-type" v-model="qualityInspectionForm.issue_type" maxlength="120" />
                </label>
                <label for="quality-severity">
                  严重程度
                  <select id="quality-severity" v-model="qualityInspectionForm.severity">
                    <option value="minor">轻微</option>
                    <option value="major">主要</option>
                    <option value="critical">严重</option>
                  </select>
                </label>
              </div>
              <label for="quality-description">
                异常描述
                <textarea id="quality-description" v-model="qualityInspectionForm.description" rows="2" maxlength="4000" />
              </label>
              <label for="quality-corrective-action">
                处理措施
                <textarea id="quality-corrective-action" v-model="qualityInspectionForm.corrective_action" rows="2" maxlength="4000" />
              </label>
              <div class="form-pair two">
                <label for="quality-issue-status">
                  处理状态
                  <select id="quality-issue-status" v-model="qualityInspectionForm.issue_status">
                    <option value="open">处理中</option>
                    <option value="resolved">已解决</option>
                  </select>
                </label>
                <label for="quality-issue-attachment">
                  异常附件组
                  <input id="quality-issue-attachment" v-model="qualityInspectionForm.issue_attachment_group_id" maxlength="80" />
                </label>
              </div>

              <button class="primary-button" type="submit">
                <Save :size="18" />
                <span>{{ editingQualityInspectionId ? '保存 QC 查验' : '新增 QC 查验' }}</span>
              </button>
              <button class="secondary-button" type="button" @click="startNewQualityInspection">
                <Plus :size="18" />
                <span>新建 QC 单</span>
              </button>
              <button class="secondary-button" type="button" @click="refreshQualityInboundEligibility(true)">
                <CheckCircle2 :size="18" />
                <span>检查入库资格</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>QC 历史和入库判定</h2>
              <span>{{ selectedQualityInspection?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedQualityInspection" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>采购合同</dt>
                  <dd>{{ selectedQualityInspection.purchase_contract_no }}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{{ selectedQualityInspection.supplier_name }}</dd>
                </div>
                <div>
                  <dt>查验结果</dt>
                  <dd>{{ qualityInspectionResultLabel(selectedQualityInspection.result) }}</dd>
                </div>
                <div>
                  <dt>查验日期</dt>
                  <dd>{{ selectedQualityInspection.inspected_at }}</dd>
                </div>
                <div>
                  <dt>附件组</dt>
                  <dd>{{ selectedQualityInspection.attachment_group_id ?? '未关联' }}</dd>
                </div>
                <div>
                  <dt>入库判定</dt>
                  <dd>
                    {{ qualityInboundEligibility?.reason ?? '未检查' }}
                  </dd>
                </div>
              </dl>

              <div class="accessory-heading">
                <strong>查验明细</strong>
                <span>{{ selectedQualityInspection.lines.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>查验数量</th>
                    <th>不合格</th>
                    <th>结果</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedQualityInspection.lines" :key="line.id">
                    <td>{{ line.product_code ?? '-' }} {{ line.product_name }}</td>
                    <td>{{ line.inspected_quantity }} {{ line.unit }}</td>
                    <td>{{ line.failed_quantity }} {{ line.unit }}</td>
                    <td>{{ qualityInspectionResultLabel(line.result) }}</td>
                    <td>{{ line.remark ?? '无' }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>异常问题</strong>
                <span>{{ selectedQualityInspection.issues.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>严重程度</th>
                    <th>描述</th>
                    <th>措施</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="issue in selectedQualityInspection.issues" :key="issue.id">
                    <td>{{ issue.issue_type }}</td>
                    <td>{{ qualityIssueSeverityLabel(issue.severity) }}</td>
                    <td>{{ issue.description }}</td>
                    <td>{{ issue.corrective_action ?? '未设置' }}</td>
                    <td>{{ qualityIssueStatusLabel(issue.status) }}</td>
                  </tr>
                  <tr v-if="selectedQualityInspection.issues.length === 0">
                    <td colspan="5" class="empty-cell">暂无异常问题</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-cell">暂无 QC 查验记录</div>
          </section>
        </section>
      </template>

      <template v-else-if="isWarehouseInboundPlanPage">
        <section class="summary-strip" aria-label="入库计划概览">
          <div v-for="item in inboundPlanStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="inboundPlanMessage" class="success-banner">{{ inboundPlanMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>待入库计划</h2>
              <form class="search-form" @submit.prevent="loadInboundPlans">
                <label>
                  <span>计划搜索</span>
                  <input v-model="inboundPlanSearch" placeholder="计划号 / 采购合同 / 商品" />
                </label>
                <label>
                  <span>入库状态</span>
                  <select v-model="inboundPlanStatusFilter">
                    <option value="">全部状态</option>
                    <option value="planned">待安排</option>
                    <option value="scheduled">已排库位</option>
                    <option value="closed">已关闭</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </label>
                <label>
                  <span>入库类型</span>
                  <select v-model="inboundPlanTypeFilter">
                    <option value="">全部类型</option>
                    <option value="material_inbound">配料入库</option>
                    <option value="purchase_inbound">采购入库</option>
                    <option value="processing_inbound">加工入库</option>
                    <option value="production_inbound">生产入库</option>
                    <option value="packaging_inbound">包装入库</option>
                    <option value="sterilization_inbound">灭菌入库</option>
                  </select>
                </label>
                <label>
                  <span>供应商标识</span>
                  <input v-model="inboundPlanSupplierFilter" placeholder="supplier-id" />
                </label>
                <label>
                  <span>采购合同 ID</span>
                  <input v-model="inboundPlanContractFilter" placeholder="purchase-contract-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>计划号</th>
                    <th>状态</th>
                    <th>类型</th>
                    <th>采购合同</th>
                    <th>供应商</th>
                    <th>计划入库日</th>
                    <th>数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in inboundPlans"
                    :key="item.id"
                    :class="{ selected: item.id === selectedInboundPlan?.id }"
                    @click="selectInboundPlan(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ inboundPlanStatusLabel(item.status) }}</td>
                    <td>{{ inboundPlanTypeLabel(item.inbound_type) }}</td>
                    <td>{{ item.purchase_contract_no }}</td>
                    <td>{{ item.supplier_name }}</td>
                    <td>{{ item.planned_date }}</td>
                    <td>
                      {{ item.lines.reduce((sum, line) => sum + Number(line.planned_quantity), 0).toFixed(2) }}
                    </td>
                  </tr>
                  <tr v-if="inboundPlans.length === 0">
                    <td colspan="7" class="empty-cell">暂无入库计划</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>计划生成和排库位</h2>
              <Warehouse :size="18" />
            </div>
            <form class="record-form" @submit.prevent="generateInboundPlan">
              <div class="form-divider">从采购合同生成</div>
              <label for="inbound-plan-contract-id">
                采购合同 ID
                <input id="inbound-plan-contract-id" v-model="inboundPlanGenerateForm.purchase_contract_id" required maxlength="36" />
              </label>
              <div class="form-pair two">
                <label for="inbound-plan-type">
                  入库类型
                  <select id="inbound-plan-type" v-model="inboundPlanGenerateForm.inbound_type">
                    <option value="material_inbound">配料入库</option>
                    <option value="purchase_inbound">采购入库</option>
                    <option value="processing_inbound">加工入库</option>
                    <option value="production_inbound">生产入库</option>
                    <option value="packaging_inbound">包装入库</option>
                    <option value="sterilization_inbound">灭菌入库</option>
                  </select>
                </label>
                <label for="inbound-plan-date">
                  计划入库日
                  <input id="inbound-plan-date" v-model="inboundPlanGenerateForm.planned_date" type="date" />
                </label>
              </div>
              <button class="secondary-button" type="submit">
                <Plus :size="18" />
                <span>生成入库计划</span>
              </button>
            </form>

            <form class="record-form accessory-form" @submit.prevent="scheduleSelectedInboundPlan">
              <div class="form-divider">库位预安排</div>
              <label for="inbound-schedule-date">
                计划入库日
                <input id="inbound-schedule-date" v-model="inboundPlanScheduleForm.planned_date" required type="date" />
              </label>
              <div class="form-pair two">
                <label for="inbound-warehouse-id">
                  仓库 ID
                  <input id="inbound-warehouse-id" v-model="inboundPlanScheduleForm.warehouse_id" required maxlength="36" />
                </label>
                <label for="inbound-warehouse-name">
                  仓库
                  <input id="inbound-warehouse-name" v-model="inboundPlanScheduleForm.warehouse_name" required maxlength="160" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="inbound-location-id">
                  库位 ID
                  <input id="inbound-location-id" v-model="inboundPlanScheduleForm.location_id" required maxlength="36" />
                </label>
                <label for="inbound-location-name">
                  库位
                  <input id="inbound-location-name" v-model="inboundPlanScheduleForm.location_name" required maxlength="160" />
                </label>
              </div>
              <label for="inbound-operator-name">
                经办人
                <input id="inbound-operator-name" v-model="inboundPlanScheduleForm.operator_name" required maxlength="160" />
              </label>
              <button class="primary-button" type="submit" :disabled="!selectedInboundPlan">
                <Save :size="18" />
                <span>保存库位安排</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>计划明细</h2>
              <span>{{ selectedInboundPlan?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedInboundPlan" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>采购合同</dt>
                  <dd>{{ selectedInboundPlan.purchase_contract_no }}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{{ selectedInboundPlan.supplier_name }}</dd>
                </div>
                <div>
                  <dt>入库类型</dt>
                  <dd>{{ inboundPlanTypeLabel(selectedInboundPlan.inbound_type) }}</dd>
                </div>
                <div>
                  <dt>计划状态</dt>
                  <dd>{{ inboundPlanStatusLabel(selectedInboundPlan.status) }}</dd>
                </div>
                <div>
                  <dt>计划入库日</dt>
                  <dd>{{ selectedInboundPlan.planned_date }}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>{{ selectedInboundPlan.warehouse_name ?? '未安排' }} / {{ selectedInboundPlan.location_name ?? '未安排' }}</dd>
                </div>
              </dl>

              <div class="accessory-heading">
                <strong>待入库商品</strong>
                <span>{{ selectedInboundPlan.lines.length }} 条</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="line in selectedInboundPlan.lines" :key="line.id">
                    <td>{{ line.product_code ?? '-' }} {{ line.product_name }}</td>
                    <td>{{ line.specification ?? line.model ?? '未设置' }}</td>
                    <td>{{ line.planned_quantity }} {{ line.unit }}</td>
                    <td>{{ line.received_quantity }} {{ line.unit }}</td>
                    <td>{{ inboundPlanLineStatusLabel(line.status) }}</td>
                  </tr>
                  <tr v-if="selectedInboundPlan.lines.length === 0">
                    <td colspan="5" class="empty-cell">暂无计划明细</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-cell">暂无入库计划</div>
          </section>
        </section>
      </template>

      <template v-else-if="isWarehouseInboundOrderPage">
        <section class="summary-strip" aria-label="货物入库概览">
          <div v-for="item in inboundOrderStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="inboundOrderMessage" class="success-banner">{{ inboundOrderMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>入库单</h2>
              <form class="search-form" @submit.prevent="loadInboundOrders">
                <label>
                  <span>入库搜索</span>
                  <input v-model="inboundOrderSearch" placeholder="入库单 / 采购合同 / 商品" />
                </label>
                <label>
                  <span>单据状态</span>
                  <select v-model="inboundOrderStatusFilter">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="submitted">待审批</option>
                    <option value="approved">已审批</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </label>
                <label>
                  <span>入库模式</span>
                  <select v-model="inboundOrderModeFilter">
                    <option value="">全部模式</option>
                    <option value="formal">正式入库</option>
                    <option value="pending_inspection">待检入库</option>
                  </select>
                </label>
                <label>
                  <span>供应商标识</span>
                  <input v-model="inboundOrderSupplierFilter" placeholder="supplier-id" />
                </label>
                <label>
                  <span>采购合同 ID</span>
                  <input v-model="inboundOrderContractFilter" placeholder="purchase-contract-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>入库单</th>
                    <th>状态</th>
                    <th>模式</th>
                    <th>采购合同</th>
                    <th>供应商</th>
                    <th>入库日</th>
                    <th>库位</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in inboundOrders"
                    :key="item.id"
                    :class="{ selected: item.id === selectedInboundOrder?.id }"
                    @click="selectInboundOrder(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ inboundOrderStatusLabel(item.status) }}</td>
                    <td>{{ inboundOrderModeLabel(item.inbound_mode) }}</td>
                    <td>{{ item.purchase_contract_no }}</td>
                    <td>{{ item.supplier_name }}</td>
                    <td>{{ item.inbound_at }}</td>
                    <td>{{ item.warehouse_name }} / {{ item.location_name }}</td>
                  </tr>
                  <tr v-if="inboundOrders.length === 0">
                    <td colspan="7" class="empty-cell">暂无入库单</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>入库登记</h2>
              <Warehouse :size="18" />
            </div>
            <form class="record-form" @submit.prevent="generateInboundOrder">
              <div class="form-divider">从入库计划生成</div>
              <label for="inbound-order-plan-id">
                入库计划
                <select
                  id="inbound-order-plan-id"
                  v-model="inboundOrderForm.plan_id"
                  required
                  @change="selectInboundPlan(inboundOrderForm.plan_id)"
                >
                  <option value="">选择入库计划</option>
                  <option v-for="plan in inboundPlans" :key="plan.id" :value="plan.id">
                    {{ plan.code }} / {{ plan.purchase_contract_no }} / {{ inboundPlanStatusLabel(plan.status) }}
                  </option>
                </select>
              </label>
              <label for="inbound-order-code">
                入库单号
                <input id="inbound-order-code" v-model="inboundOrderForm.code" required maxlength="80" />
              </label>
              <div class="form-pair two">
                <label for="inbound-order-mode">
                  入库模式
                  <select id="inbound-order-mode" v-model="inboundOrderForm.inbound_mode">
                    <option value="formal">正式入库</option>
                    <option value="pending_inspection">待检入库</option>
                  </select>
                </label>
                <label for="inbound-order-date">
                  入库日期
                  <input id="inbound-order-date" v-model="inboundOrderForm.inbound_at" required type="date" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="inbound-order-warehouse-id">
                  仓库 ID
                  <input id="inbound-order-warehouse-id" v-model="inboundOrderForm.warehouse_id" required maxlength="36" />
                </label>
                <label for="inbound-order-warehouse-name">
                  仓库
                  <input id="inbound-order-warehouse-name" v-model="inboundOrderForm.warehouse_name" required maxlength="160" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="inbound-order-location-id">
                  库位 ID
                  <input id="inbound-order-location-id" v-model="inboundOrderForm.location_id" required maxlength="36" />
                </label>
                <label for="inbound-order-location-name">
                  库位
                  <input id="inbound-order-location-name" v-model="inboundOrderForm.location_name" required maxlength="160" />
                </label>
              </div>
              <label for="inbound-order-operator">
                经办人
                <input id="inbound-order-operator" v-model="inboundOrderForm.operator_name" required maxlength="160" />
              </label>
              <button class="secondary-button" type="submit" :disabled="!inboundOrderForm.plan_id">
                <Plus :size="18" />
                <span>生成入库单</span>
              </button>
            </form>

            <form class="record-form accessory-form" @submit.prevent="approveSelectedInboundOrder">
              <div class="form-divider">提交和审批</div>
              <button
                class="secondary-button"
                type="button"
                :disabled="!selectedInboundOrder || selectedInboundOrder.status !== 'draft'"
                @click="submitSelectedInboundOrder"
              >
                <Send :size="18" />
                <span>提交审批</span>
              </button>
              <div class="form-pair two">
                <label for="inbound-order-reviewer">
                  审批人
                  <input id="inbound-order-reviewer" v-model="inboundOrderApprovalForm.reviewer_name" required maxlength="160" />
                </label>
                <label for="inbound-order-approved-at">
                  审批日期
                  <input id="inbound-order-approved-at" v-model="inboundOrderApprovalForm.approved_at" required type="date" />
                </label>
              </div>
              <button
                class="primary-button"
                type="submit"
                :disabled="!selectedInboundOrder || selectedInboundOrder.status !== 'submitted'"
              >
                <CheckCircle2 :size="18" />
                <span>审批入库</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>明细和库存</h2>
              <span>{{ selectedInboundOrder?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedInboundOrder" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>采购合同</dt>
                  <dd>{{ selectedInboundOrder.purchase_contract_no }}</dd>
                </div>
                <div>
                  <dt>供应商</dt>
                  <dd>{{ selectedInboundOrder.supplier_name }}</dd>
                </div>
                <div>
                  <dt>入库模式</dt>
                  <dd>{{ inboundOrderModeLabel(selectedInboundOrder.inbound_mode) }}</dd>
                </div>
                <div>
                  <dt>单据状态</dt>
                  <dd>{{ inboundOrderStatusLabel(selectedInboundOrder.status) }}</dd>
                </div>
                <div>
                  <dt>入库日期</dt>
                  <dd>{{ selectedInboundOrder.inbound_at }}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>{{ selectedInboundOrder.warehouse_name }} / {{ selectedInboundOrder.location_name }}</dd>
                </div>
              </dl>

              <div class="accessory-heading">
                <strong>入库明细</strong>
                <span>{{ selectedInboundOrder.lines.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格</th>
                    <th>数量</th>
                    <th>库存状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedInboundOrder.lines" :key="line.id">
                    <td>{{ line.product_code ?? '-' }} {{ line.product_name }}</td>
                    <td>{{ line.specification ?? line.model ?? '未设置' }}</td>
                    <td>{{ line.quantity }} {{ line.unit }}</td>
                    <td>{{ stockStatusLabel(line.stock_status) }}</td>
                  </tr>
                  <tr v-if="selectedInboundOrder.lines.length === 0">
                    <td colspan="4" class="empty-cell">暂无入库明细</td>
                  </tr>
                </tbody>
              </table>

              <form class="search-form inventory-search-form" @submit.prevent="loadInventorySnapshot">
                <label>
                  <span>库存搜索</span>
                  <input v-model="inventorySearch" placeholder="商品编码 / 商品名称 / 仓库" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查库存</span>
                </button>
              </form>

              <div class="accessory-heading">
                <strong>库存余额</strong>
                <span>{{ inventoryBalances.length }} 条</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="balance in inventoryBalances" :key="balance.id">
                    <td>{{ balance.product_code ?? '-' }} {{ balance.product_name }}</td>
                    <td>{{ balance.warehouse_name }} / {{ balance.location_name }}</td>
                    <td>{{ balance.available_quantity }} {{ balance.unit }}</td>
                    <td>{{ balance.pending_inspection_quantity }} {{ balance.unit }}</td>
                    <td>{{ balance.locked_quantity }} {{ balance.unit }}</td>
                  </tr>
                  <tr v-if="inventoryBalances.length === 0">
                    <td colspan="5" class="empty-cell">暂无库存余额</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>库存流水</strong>
                <span>{{ inventoryLedgers.length }} 条</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="ledger in inventoryLedgers" :key="ledger.id">
                    <td>{{ ledger.occurred_at }}</td>
                    <td>{{ inventoryDirectionLabel(ledger.direction) }} / {{ stockStatusLabel(ledger.stock_status) }}</td>
                    <td>{{ ledger.product_code ?? '-' }} {{ ledger.product_name }}</td>
                    <td>{{ ledger.quantity }} {{ ledger.unit }}</td>
                    <td>{{ ledger.source_code }}</td>
                  </tr>
                  <tr v-if="inventoryLedgers.length === 0">
                    <td colspan="5" class="empty-cell">暂无库存流水</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-cell">暂无入库单</div>
          </section>
        </section>
      </template>

      <template v-else-if="isWarehouseOutboundPlanPage">
        <section class="summary-strip" aria-label="出库计划概览">
          <div v-for="item in outboundPlanStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="outboundPlanMessage" class="success-banner">{{ outboundPlanMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>出库计划</h2>
              <form class="search-form" @submit.prevent="loadOutboundPlans">
                <label>
                  <span>计划搜索</span>
                  <input v-model="outboundPlanSearch" placeholder="计划号 / 来源单 / 商品" />
                </label>
                <label>
                  <span>计划状态</span>
                  <select v-model="outboundPlanStatusFilter">
                    <option value="">全部状态</option>
                    <option value="planned">待安排</option>
                    <option value="scheduled">已排库位</option>
                    <option value="closed">已关闭</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </label>
                <label>
                  <span>出库类型</span>
                  <select v-model="outboundPlanTypeFilter">
                    <option value="">全部类型</option>
                    <option value="material_outbound">配料出库</option>
                    <option value="production_outbound">生产出库</option>
                    <option value="finished_goods_outbound">成品出库</option>
                    <option value="processing_outbound">加工发料</option>
                  </select>
                </label>
                <label>
                  <span>来源类型</span>
                  <select v-model="outboundPlanSourceFilter">
                    <option value="">全部来源</option>
                    <option value="shipment_plan">发货计划</option>
                    <option value="production_requisition">生产领料单</option>
                    <option value="processing_issue">加工发料单</option>
                  </select>
                </label>
                <label>
                  <span>客户 ID</span>
                  <input v-model="outboundPlanCustomerFilter" placeholder="customer-id" />
                </label>
                <label>
                  <span>来源单 ID</span>
                  <input v-model="outboundPlanSourceIdFilter" placeholder="shipment-plan-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>计划号</th>
                    <th>状态</th>
                    <th>类型</th>
                    <th>来源</th>
                    <th>客户</th>
                    <th>计划日期</th>
                    <th>数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in outboundPlans"
                    :key="item.id"
                    :class="{ selected: item.id === selectedOutboundPlan?.id }"
                    @click="selectOutboundPlan(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ outboundPlanStatusLabel(item.status) }}</td>
                    <td>{{ outboundPlanTypeLabel(item.outbound_type) }}</td>
                    <td>{{ outboundPlanSourceTypeLabel(item.source_type) }} / {{ item.source_code }}</td>
                    <td>{{ item.customer_name ?? '未设置' }}</td>
                    <td>{{ item.planned_date }}</td>
                    <td>
                      {{ item.lines.reduce((sum, line) => sum + Number(line.planned_quantity), 0).toFixed(2) }}
                    </td>
                  </tr>
                  <tr v-if="outboundPlans.length === 0">
                    <td colspan="7" class="empty-cell">暂无出库计划</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>计划生成和排库位</h2>
              <Send :size="18" />
            </div>
            <form class="record-form" @submit.prevent="generateOutboundPlan">
              <div class="form-divider">从发货计划生成</div>
              <label for="outbound-plan-shipment-id">
                发货计划
                <select
                  id="outbound-plan-shipment-id"
                  v-model="outboundPlanGenerateForm.shipment_plan_id"
                  required
                  @change="syncOutboundPlanFromShipment"
                >
                  <option value="">选择已审批发货计划</option>
                  <option v-for="shipment in shipments" :key="shipment.id" :value="shipment.id">
                    {{ shipment.code }} / {{ shipment.customer_name }} / {{ shipment.planned_ship_date }}
                  </option>
                </select>
              </label>
              <div class="form-pair two">
                <label for="outbound-plan-type">
                  出库类型
                  <select id="outbound-plan-type" v-model="outboundPlanGenerateForm.outbound_type">
                    <option value="finished_goods_outbound">成品出库</option>
                    <option value="material_outbound">配料出库</option>
                    <option value="production_outbound">生产出库</option>
                    <option value="processing_outbound">加工发料</option>
                  </select>
                </label>
                <label for="outbound-plan-date">
                  计划出库日
                  <input id="outbound-plan-date" v-model="outboundPlanGenerateForm.planned_date" type="date" />
                </label>
              </div>
              <button class="secondary-button" type="submit" :disabled="!outboundPlanGenerateForm.shipment_plan_id">
                <Plus :size="18" />
                <span>生成出库计划</span>
              </button>
            </form>

            <form class="record-form accessory-form" @submit.prevent="scheduleSelectedOutboundPlan">
              <div class="form-divider">库位预安排</div>
              <label for="outbound-schedule-date">
                计划出库日
                <input id="outbound-schedule-date" v-model="outboundPlanScheduleForm.planned_date" required type="date" />
              </label>
              <div class="form-pair two">
                <label for="outbound-warehouse-id">
                  仓库 ID
                  <input id="outbound-warehouse-id" v-model="outboundPlanScheduleForm.warehouse_id" required maxlength="36" />
                </label>
                <label for="outbound-warehouse-name">
                  仓库
                  <input id="outbound-warehouse-name" v-model="outboundPlanScheduleForm.warehouse_name" required maxlength="160" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="outbound-location-id">
                  库位 ID
                  <input id="outbound-location-id" v-model="outboundPlanScheduleForm.location_id" required maxlength="36" />
                </label>
                <label for="outbound-location-name">
                  库位
                  <input id="outbound-location-name" v-model="outboundPlanScheduleForm.location_name" required maxlength="160" />
                </label>
              </div>
              <label for="outbound-operator-name">
                经办人
                <input id="outbound-operator-name" v-model="outboundPlanScheduleForm.operator_name" required maxlength="160" />
              </label>
              <button class="primary-button" type="submit" :disabled="!selectedOutboundPlan">
                <Save :size="18" />
                <span>保存库位安排</span>
              </button>
            </form>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>待出库清单</h2>
              <span>{{ selectedOutboundPlan?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedOutboundPlan" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>来源单据</dt>
                  <dd>{{ outboundPlanSourceTypeLabel(selectedOutboundPlan.source_type) }} / {{ selectedOutboundPlan.source_code }}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{{ selectedOutboundPlan.customer_name ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>出库类型</dt>
                  <dd>{{ outboundPlanTypeLabel(selectedOutboundPlan.outbound_type) }}</dd>
                </div>
                <div>
                  <dt>计划状态</dt>
                  <dd>{{ outboundPlanStatusLabel(selectedOutboundPlan.status) }}</dd>
                </div>
                <div>
                  <dt>计划出库日</dt>
                  <dd>{{ selectedOutboundPlan.planned_date }}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>{{ selectedOutboundPlan.warehouse_name ?? '未安排' }} / {{ selectedOutboundPlan.location_name ?? '未安排' }}</dd>
                </div>
              </dl>

              <div class="accessory-heading">
                <strong>待出库商品</strong>
                <span>{{ selectedOutboundPlan.lines.length }} 条</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="line in selectedOutboundPlan.lines" :key="line.id">
                    <td>{{ line.product_code ?? '-' }} {{ line.product_name }}</td>
                    <td>{{ line.specification ?? line.model ?? '未设置' }}</td>
                    <td>{{ line.planned_quantity }} {{ line.unit }}</td>
                    <td>{{ line.outbound_quantity }} {{ line.unit }}</td>
                    <td>{{ outboundPlanLineStatusLabel(line.status) }}</td>
                  </tr>
                  <tr v-if="selectedOutboundPlan.lines.length === 0">
                    <td colspan="5" class="empty-cell">暂无计划明细</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-cell">暂无出库计划</div>
          </section>
        </section>
      </template>

      <template v-else-if="isWarehouseOutboundOrderPage">
        <section class="summary-strip" aria-label="货物出库概览">
          <div v-for="item in outboundOrderStats" :key="item.label" class="summary-cell">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <p v-if="outboundOrderMessage" class="success-banner">{{ outboundOrderMessage }}</p>

        <section class="product-grid">
          <section class="panel product-list-panel">
            <div class="panel-heading toolbar-heading">
              <h2>出库单</h2>
              <form class="search-form" @submit.prevent="loadOutboundOrders">
                <label>
                  <span>出库搜索</span>
                  <input v-model="outboundOrderSearch" placeholder="出库单 / 来源单 / 商品" />
                </label>
                <label>
                  <span>出库状态</span>
                  <select v-model="outboundOrderStatusFilter">
                    <option value="">全部状态</option>
                    <option value="draft">草稿</option>
                    <option value="submitted">待审批</option>
                    <option value="approved">已出库</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </label>
                <label>
                  <span>出库模式</span>
                  <select v-model="outboundOrderModeFilter">
                    <option value="">全部模式</option>
                    <option value="formal">正式出库</option>
                    <option value="exception">异常出库</option>
                  </select>
                </label>
                <label>
                  <span>出库类型</span>
                  <select v-model="outboundOrderTypeFilter">
                    <option value="">全部类型</option>
                    <option value="finished_goods_outbound">成品出库</option>
                    <option value="material_outbound">配料出库</option>
                    <option value="production_outbound">生产出库</option>
                    <option value="processing_outbound">加工发料</option>
                  </select>
                </label>
                <label>
                  <span>客户 ID</span>
                  <input v-model="outboundOrderCustomerFilter" placeholder="customer-id" />
                </label>
                <label>
                  <span>来源单 ID</span>
                  <input v-model="outboundOrderSourceIdFilter" placeholder="shipment-plan-id" />
                </label>
                <button class="icon-button compact" type="submit">
                  <Search :size="16" />
                  <span>查询</span>
                </button>
              </form>
            </div>

            <div class="table-scroll">
              <table class="data-table customer-table">
                <thead>
                  <tr>
                    <th>出库单号</th>
                    <th>状态</th>
                    <th>模式</th>
                    <th>类型</th>
                    <th>来源</th>
                    <th>出库日</th>
                    <th>数量</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in outboundOrders"
                    :key="item.id"
                    :class="{ selected: item.id === selectedOutboundOrder?.id }"
                    @click="selectOutboundOrder(item.id)"
                  >
                    <td>
                      <button class="row-button" type="button">{{ item.code }}</button>
                    </td>
                    <td>{{ outboundOrderStatusLabel(item.status) }}</td>
                    <td>{{ outboundOrderModeLabel(item.outbound_mode) }}</td>
                    <td>{{ outboundPlanTypeLabel(item.outbound_type) }}</td>
                    <td>{{ outboundPlanSourceTypeLabel(item.source_type) }} / {{ item.source_code }}</td>
                    <td>{{ item.outbound_at }}</td>
                    <td>{{ item.lines.reduce((sum, line) => sum + Number(line.quantity), 0).toFixed(2) }}</td>
                  </tr>
                  <tr v-if="outboundOrders.length === 0">
                    <td colspan="7" class="empty-cell">暂无出库单</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel product-form-panel">
            <div class="panel-heading">
              <h2>出库登记和审批</h2>
              <Send :size="18" />
            </div>
            <form class="record-form" @submit.prevent="generateOutboundOrder">
              <div class="form-divider">从出库计划生成</div>
              <label for="outbound-order-plan-id">
                出库计划
                <select
                  id="outbound-order-plan-id"
                  v-model="outboundOrderForm.plan_id"
                  required
                  @change="syncOutboundOrderFromPlan"
                >
                  <option value="">选择已排库位出库计划</option>
                  <option v-for="plan in outboundPlans" :key="plan.id" :value="plan.id">
                    {{ plan.code }} / {{ plan.customer_name ?? '未设置客户' }} / {{ plan.planned_date }}
                  </option>
                </select>
              </label>
              <label for="outbound-order-code">
                出库单号
                <input id="outbound-order-code" v-model="outboundOrderForm.code" required maxlength="80" />
              </label>
              <div class="form-pair two">
                <label for="outbound-order-mode">
                  出库模式
                  <select id="outbound-order-mode" v-model="outboundOrderForm.outbound_mode">
                    <option value="formal">正式出库</option>
                    <option value="exception">异常出库</option>
                  </select>
                </label>
                <label for="outbound-order-date">
                  出库日期
                  <input id="outbound-order-date" v-model="outboundOrderForm.outbound_at" required type="date" />
                </label>
              </div>
              <label v-if="outboundOrderForm.outbound_mode === 'exception'" for="outbound-exception-reason">
                异常原因
                <textarea
                  id="outbound-exception-reason"
                  v-model="outboundOrderForm.exception_reason"
                  required
                  rows="3"
                />
              </label>
              <div class="form-pair two">
                <label for="outbound-order-warehouse-id">
                  仓库 ID
                  <input id="outbound-order-warehouse-id" v-model="outboundOrderForm.warehouse_id" required maxlength="36" />
                </label>
                <label for="outbound-order-warehouse-name">
                  仓库
                  <input id="outbound-order-warehouse-name" v-model="outboundOrderForm.warehouse_name" required maxlength="160" />
                </label>
              </div>
              <div class="form-pair two">
                <label for="outbound-order-location-id">
                  库位 ID
                  <input id="outbound-order-location-id" v-model="outboundOrderForm.location_id" required maxlength="36" />
                </label>
                <label for="outbound-order-location-name">
                  库位
                  <input id="outbound-order-location-name" v-model="outboundOrderForm.location_name" required maxlength="160" />
                </label>
              </div>
              <label for="outbound-order-operator-name">
                经办人
                <input id="outbound-order-operator-name" v-model="outboundOrderForm.operator_name" required maxlength="160" />
              </label>
              <button class="secondary-button" type="submit" :disabled="!outboundOrderForm.plan_id">
                <Plus :size="18" />
                <span>生成出库单</span>
              </button>
            </form>

            <div class="record-form accessory-form">
              <div class="form-divider">出库审批</div>
              <label for="outbound-reviewer-name">
                审批人
                <input id="outbound-reviewer-name" v-model="outboundOrderApprovalForm.reviewer_name" required maxlength="160" />
              </label>
              <label for="outbound-approved-at">
                审批日期
                <input id="outbound-approved-at" v-model="outboundOrderApprovalForm.approved_at" required type="date" />
              </label>
              <label class="checkbox-line" for="outbound-allow-negative">
                <input id="outbound-allow-negative" v-model="outboundOrderApprovalForm.allow_negative" type="checkbox" />
                授权负库存出库
              </label>
              <div class="form-actions">
                <button
                  class="secondary-button"
                  type="button"
                  :disabled="!selectedOutboundOrder || selectedOutboundOrder.status !== 'draft'"
                  @click="submitSelectedOutboundOrder"
                >
                  <Send :size="18" />
                  <span>提交审批</span>
                </button>
                <button
                  class="primary-button"
                  type="button"
                  :disabled="!selectedOutboundOrder || selectedOutboundOrder.status !== 'submitted'"
                  @click="approveSelectedOutboundOrder"
                >
                  <CheckCircle2 :size="18" />
                  <span>审批出库</span>
                </button>
              </div>
            </div>
          </section>

          <section class="panel product-detail-panel">
            <div class="panel-heading">
              <h2>出库明细和库存流水</h2>
              <span>{{ selectedOutboundOrder?.code ?? '未选择' }}</span>
            </div>
            <div v-if="selectedOutboundOrder" class="product-detail">
              <dl class="detail-list">
                <div>
                  <dt>来源单据</dt>
                  <dd>{{ outboundPlanSourceTypeLabel(selectedOutboundOrder.source_type) }} / {{ selectedOutboundOrder.source_code }}</dd>
                </div>
                <div>
                  <dt>客户</dt>
                  <dd>{{ selectedOutboundOrder.customer_name ?? '未设置' }}</dd>
                </div>
                <div>
                  <dt>出库模式</dt>
                  <dd>{{ outboundOrderModeLabel(selectedOutboundOrder.outbound_mode) }}</dd>
                </div>
                <div>
                  <dt>出库状态</dt>
                  <dd>{{ outboundOrderStatusLabel(selectedOutboundOrder.status) }}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>{{ selectedOutboundOrder.warehouse_name }} / {{ selectedOutboundOrder.location_name }}</dd>
                </div>
                <div v-if="selectedOutboundOrder.exception_reason">
                  <dt>异常原因</dt>
                  <dd>{{ selectedOutboundOrder.exception_reason }}</dd>
                </div>
              </dl>

              <div class="accessory-heading">
                <strong>出库商品</strong>
                <span>{{ selectedOutboundOrder.lines.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>规格</th>
                    <th>数量</th>
                    <th>库存状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in selectedOutboundOrder.lines" :key="line.id">
                    <td>{{ line.product_code ?? '-' }} {{ line.product_name }}</td>
                    <td>{{ line.specification ?? line.model ?? '未设置' }}</td>
                    <td>{{ line.quantity }} {{ line.unit }}</td>
                    <td>{{ stockStatusLabel(line.stock_status) }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>库存余额</strong>
                <span>{{ inventoryBalances.length }} 条</span>
              </div>
              <table class="data-table compact-table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>库位</th>
                    <th>可用</th>
                    <th>待检</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="balance in inventoryBalances" :key="balance.id">
                    <td>{{ balance.product_code ?? '-' }} {{ balance.product_name }}</td>
                    <td>{{ balance.warehouse_name }} / {{ balance.location_name }}</td>
                    <td>{{ balance.available_quantity }} {{ balance.unit }}</td>
                    <td>{{ balance.pending_inspection_quantity }} {{ balance.unit }}</td>
                  </tr>
                  <tr v-if="inventoryBalances.length === 0">
                    <td colspan="4" class="empty-cell">暂无库存余额</td>
                  </tr>
                </tbody>
              </table>

              <div class="accessory-heading">
                <strong>出库流水</strong>
                <span>{{ inventoryLedgers.length }} 条</span>
              </div>
              <table class="data-table compact-table">
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
                  <tr v-for="ledger in inventoryLedgers" :key="ledger.id">
                    <td>{{ ledger.occurred_at }}</td>
                    <td>{{ inventoryDirectionLabel(ledger.direction) }} / {{ stockStatusLabel(ledger.stock_status) }}</td>
                    <td>{{ ledger.product_code ?? '-' }} {{ ledger.product_name }}</td>
                    <td>{{ ledger.quantity }} {{ ledger.unit }}</td>
                    <td>{{ ledger.source_code }}</td>
                  </tr>
                  <tr v-if="inventoryLedgers.length === 0">
                    <td colspan="5" class="empty-cell">暂无出库流水</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-cell">暂无出库单</div>
          </section>
        </section>
      </template>

      <section v-else class="panel placeholder-panel">
        <h2>{{ activeMenu?.label ?? '业务模块' }}</h2>
        <p>该模块会按 PDF 功能清单继续逐项实现。</p>
      </section>
    </section>
  </main>
</template>
