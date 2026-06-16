export interface ApiResponse<T> {
  success: boolean
  code: string
  message: string
  data: T
  error: { code: string; message: string } | null
}

type ApiErrorBody = Partial<ApiResponse<unknown>> & {
  detail?: string | Array<{ msg?: string }>
}

export interface MenuItem {
  id: string
  label: string
  path: string
  icon: string
  required_permission: string
  sort_order: number
}

export type UserAvatarType = 'preset' | 'upload'

export interface UserAvatarFields {
  avatar_type: UserAvatarType
  avatar_value: string
}

export interface CurrentUser {
  id: string
  username: string
  display_name: string
  department_name: string
  avatar_type: UserAvatarType
  avatar_value: string
  roles: string[]
  permissions: string[]
}

export interface AssignableUser {
  id: string
  username: string
  display_name: string
  department_name: string
  avatar_type: UserAvatarType
  avatar_value: string
}

export interface OrganizationDepartment {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
}

export interface OrganizationRole {
  id: string
  name: string
  code: string
  permissions: OrganizationPermission[]
}

export interface OrganizationPermission {
  id: string
  code: string
  name: string
}

export interface OrganizationUser {
  id: string
  username: string
  display_name: string
  department_id: string | null
  department_name: string
  avatar_type: UserAvatarType
  avatar_value: string
  roles: OrganizationRole[]
  is_active: boolean
  created_at: string
  password_set: boolean
}

export interface OrganizationOptions {
  departments: OrganizationDepartment[]
  roles: OrganizationRole[]
  permissions: OrganizationPermission[]
}

export interface OrganizationUserCreatePayload {
  username: string
  display_name: string
  department_id: string
  role_ids: string[]
  is_active: boolean
  avatar_type: UserAvatarType
  avatar_value: string
}

export interface OrganizationUserUpdatePayload {
  display_name?: string
  department_id?: string
  role_ids?: string[]
  is_active?: boolean
  avatar_type?: UserAvatarType
  avatar_value?: string
}

export interface OrganizationDepartmentCreatePayload {
  name: string
  parent_id?: string | null
  sort_order: number
}

export interface OrganizationDepartmentUpdatePayload {
  name?: string
  parent_id?: string | null
  sort_order?: number
}

export interface OrganizationRolePermissionUpdatePayload {
  permission_ids: string[]
}

export interface OrganizationUserCreateResult {
  user: OrganizationUser
  initial_password: string
}

export interface OrganizationPasswordResetResult {
  user: OrganizationUser
  temporary_password: string
}

export interface AuthSession {
  access_token: string
  token_type: string
  user: CurrentUser
  menus: MenuItem[]
}

export interface CurrentUserAvatarUpdatePayload {
  avatar_type: UserAvatarType
  avatar_value: string
}

export type AppLanguage = 'zh-CN' | 'en-US'
export type AppTimeZone = 'Asia/Shanghai' | 'UTC'

export interface I18nLanguageConfig {
  code: AppLanguage
  label: string
  description: string
  time_zone: AppTimeZone
}

export interface I18nConfig {
  default_language: AppLanguage
  supported_languages: I18nLanguageConfig[]
  messages: Record<AppLanguage, Record<string, string>>
  path_labels: Record<string, Record<AppLanguage, string>>
  page_titles: Record<string, Record<AppLanguage, string>>
  sidebar_groups: Record<string, Record<AppLanguage, string>>
}

export interface Announcement {
  id: string
  title: string
  content: string
  published_at: string
}

export interface TodoTask {
  id: string
  owner_user_id: string
  owner_user_name: string | null
  creator_user_id: string | null
  creator_user_name: string | null
  title: string
  content: string
  source_type: string
  source_id: string | null
  due_at: string | null
  status: string
  assignment_type: 'assigned' | 'self'
}

export interface NotificationItem {
  id: string
  owner_user_id: string
  title: string
  message: string
  severity: string
  is_read: boolean
  created_at: string
}

export interface ScheduleEvent {
  id: string
  owner_user_id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  created_at: string
}

export interface DashboardShortcut {
  id: string
  owner_user_id: string
  label: string
  target_path: string
  icon: string
  sort_order: number
}

export interface DashboardSummary {
  announcement_count: number
  todo_count: number
  unread_notification_count: number
  today_schedule_count: number
  shortcut_count: number
}

export interface Dashboard {
  announcements: Announcement[]
  todos: TodoTask[]
  notifications: NotificationItem[]
  schedule_events: ScheduleEvent[]
  shortcuts: DashboardShortcut[]
  summary: DashboardSummary
}

export interface FinanceOverviewSummary {
  shipment_count: number
  currency_label: string
  receivable_amount: string
  payable_amount: string
  profit_amount: string
  profit_rate: string
  invoice_notice_count: number
  invoice_notice_amount: string
  sample_fee_count: number
  sample_fee_amount: string
  partner_count: number
  active_partner_count: number
}

export interface FinanceCurrencySummary {
  currency: string
  shipment_count: number
  receivable_amount: string
  payable_amount: string
  profit_amount: string
  profit_rate: string
}

export interface FinanceStatusAmount {
  status: string
  currency: string
  count: number
  amount: string
}

export interface FinancePartnerTypeSummary {
  partner_type: string
  count: number
}

export interface FinanceShipmentProfit {
  id: string
  code: string
  shipment_date: string
  planned_ship_date: string
  customer_name: string
  currency: string
  approval_status: string
  receivable_amount: string
  payable_amount: string
  profit_amount: string
  profit_rate: string
}

export interface FinanceOverview {
  summary: FinanceOverviewSummary
  currency_summaries: FinanceCurrencySummary[]
  invoice_notice_statuses: FinanceStatusAmount[]
  sample_fee_statuses: FinanceStatusAmount[]
  partner_type_summaries: FinancePartnerTypeSummary[]
  shipment_profit_items: FinanceShipmentProfit[]
}

export interface ApprovalDocument {
  document_type: string
  document_type_label: string
  document_id: string
  document_no: string
  counterparty_name: string
  applicant_user_id: string | null
  applicant_user_name: string | null
  business_date: string
  submitted_at: string | null
  approved_at: string | null
  status: string
  status_label: string
  amount: string
  currency: string
  source_path: string
}

export interface ApprovalTypeSummary {
  document_type: string
  document_type_label: string
  pending_count: number
  approved_count: number
  total_count: number
}

export interface ApprovalQuery {
  items: ApprovalDocument[]
  total: number
  pending_count: number
  approved_count: number
  type_summaries: ApprovalTypeSummary[]
}

export interface ReportingSummary {
  date_from: string | null
  date_to: string | null
  currency_label: string
  export_contract_count: number
  export_contract_amount: string
  purchase_contract_count: number
  purchase_contract_amount: string
  shipment_count: number
  shipment_receivable_amount: string
  shipment_profit_amount: string
  settlement_count: number
  settlement_gross_profit: string
}

export interface StatusAmountStatistic {
  status: string
  status_label: string
  currency: string
  count: number
  amount: string
  source_path: string
}

export interface ReportDocumentStatistic {
  document_id: string
  document_no: string
  party_name: string
  business_user_name: string | null
  business_date: string
  status: string
  status_label: string
  amount: string
  currency: string
  source_path: string
}

export interface CustomerShipmentStatistic {
  customer_id: string | null
  customer_name: string
  currency: string
  shipment_count: number
  receivable_amount: string
  profit_amount: string
  source_path: string
}

export interface SalesMonthlyShipmentStatistic {
  period: string
  sales_user_id: string | null
  sales_user_name: string | null
  currency: string
  shipment_count: number
  shipped_amount: string
  source_path: string
}

export interface ShipmentStatisticItem {
  shipment_id: string
  shipment_no: string
  customer_name: string
  shipment_date: string
  status: string
  status_label: string
  receivable_amount: string
  profit_amount: string
  currency: string
  source_path: string
}

export interface ReportingStatistics {
  summary: ReportingSummary
  export_contract_statuses: StatusAmountStatistic[]
  purchase_contract_statuses: StatusAmountStatistic[]
  export_contract_items: ReportDocumentStatistic[]
  purchase_contract_items: ReportDocumentStatistic[]
  customer_shipments: CustomerShipmentStatistic[]
  sales_monthly_shipments: SalesMonthlyShipmentStatistic[]
  shipment_items: ShipmentStatisticItem[]
}

export interface BankReceiptClaim {
  id: string
  receipt_id: string
  claimed_by_user_id: string
  claimed_by_user_name: string
  claimed_at: string
  note: string | null
}

export interface BankReceiptAllocation {
  id: string
  receipt_id: string
  allocation_type: string
  contract_id: string | null
  contract_no: string | null
  invoice_no: string | null
  allocated_at: string
  amount: string
  currency: string
  remark: string | null
}

export interface BankReceipt {
  id: string
  receipt_no: string
  received_at: string
  payer_name: string
  customer_id: string | null
  customer_name: string | null
  amount: string
  allocated_amount: string
  unallocated_amount: string
  currency: string
  bank_account: string
  reference_no: string | null
  receipt_type: string
  status: string
  claim_message: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  claims: BankReceiptClaim[]
  allocations: BankReceiptAllocation[]
}

export interface BankReceiptList {
  items: BankReceipt[]
  total: number
}

export interface BankReceiptCreatePayload {
  receipt_no: string
  received_at: string
  payer_name: string
  customer_id?: string | null
  customer_name?: string | null
  amount: string
  currency: string
  bank_account: string
  reference_no?: string | null
  receipt_type: string
  remark?: string | null
}

export interface BankReceiptClaimPayload {
  claimed_at: string
  sales_user_id?: string | null
  sales_user_name?: string | null
  note?: string | null
}

export interface BankReceiptAllocationPayload {
  allocation_type: string
  contract_id?: string | null
  contract_no?: string | null
  invoice_no?: string | null
  allocated_at: string
  amount: string
  currency: string
  remark?: string | null
}

export interface ReceivableItem {
  contract_id: string
  contract_no: string
  customer_id: string | null
  customer_name: string
  sales_user_id: string | null
  sales_user_name: string | null
  currency: string
  total_amount: string
  received_amount: string
  receivable_amount: string
  status: string
}

export interface ReceivableList {
  items: ReceivableItem[]
  total: number
  total_receivable_amount: string
}

export interface PaymentAllocation {
  id: string
  payment_request_id: string
  supplier_invoice_id: string
  allocated_at: string
  amount: string
  currency: string
  remark: string | null
}

export interface SupplierPaymentRequest {
  id: string
  request_no: string
  supplier_invoice_id: string
  supplier_invoice_no: string
  supplier_id: string | null
  supplier_name: string
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  payment_type: string
  request_date: string
  requested_amount: string
  approved_amount: string
  paid_amount: string
  currency: string
  status: string
  requester_user_id: string
  requester_user_name: string
  reviewer_name: string | null
  approved_at: string | null
  payment_account: string | null
  remark: string | null
}

export interface SupplierInvoice {
  id: string
  invoice_no: string
  invoice_date: string
  supplier_id: string | null
  supplier_name: string
  purchase_invoice_notice_id: string | null
  purchase_invoice_notice_code: string | null
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  total_amount: string
  paid_amount: string
  unpaid_amount: string
  currency: string
  due_date: string | null
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  payment_requests: SupplierPaymentRequest[]
  allocations: PaymentAllocation[]
}

export interface SupplierInvoiceList {
  items: SupplierInvoice[]
  total: number
}

export interface SupplierInvoiceCreatePayload {
  invoice_no: string
  invoice_date: string
  supplier_id?: string | null
  supplier_name: string
  purchase_invoice_notice_id?: string | null
  purchase_invoice_notice_code?: string | null
  purchase_contract_id?: string | null
  purchase_contract_no?: string | null
  total_amount: string
  currency: string
  due_date?: string | null
  remark?: string | null
}

export interface PaymentRequestCreatePayload {
  request_no: string
  supplier_invoice_id: string
  payment_type: string
  request_date: string
  requested_amount: string
  currency: string
  remark?: string | null
}

export interface PaymentRequestApprovePayload {
  approved_amount: string
  approved_at: string
  reviewer_name: string
  payment_account?: string | null
  remark?: string | null
}

export interface SupplierPaymentRequestList {
  items: SupplierPaymentRequest[]
  total: number
}

export interface PayableItem {
  supplier_invoice_id: string
  invoice_no: string
  supplier_id: string | null
  supplier_name: string
  purchase_invoice_notice_id: string | null
  purchase_invoice_notice_code: string | null
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  currency: string
  total_amount: string
  paid_amount: string
  payable_amount: string
  due_date: string | null
  status: string
}

export interface PayableList {
  items: PayableItem[]
  total: number
  total_payable_amount: string
}

export interface FeePaymentAllocation {
  id: string
  fee_payment_request_id: string
  partner_fee_invoice_id: string
  allocated_at: string
  amount: string
  currency: string
  remark: string | null
}

export interface FeePaymentRequest {
  id: string
  request_no: string
  partner_fee_invoice_id: string
  partner_fee_invoice_no: string
  partner_id: string | null
  partner_name: string
  partner_type: string | null
  shipment_plan_id: string | null
  shipment_no: string | null
  sales_user_id: string | null
  sales_user_name: string | null
  fee_type: string
  request_date: string
  requested_amount: string
  approved_amount: string
  paid_amount: string
  currency: string
  status: string
  requester_user_id: string
  requester_user_name: string
  reviewer_name: string | null
  approved_at: string | null
  payment_account: string | null
  remark: string | null
}

export interface PartnerFeeInvoice {
  id: string
  invoice_no: string
  invoice_date: string
  partner_id: string | null
  partner_name: string
  partner_type: string | null
  shipment_plan_id: string | null
  shipment_no: string | null
  sales_user_id: string | null
  sales_user_name: string | null
  fee_type: string
  total_amount: string
  paid_amount: string
  unpaid_amount: string
  currency: string
  due_date: string | null
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  fee_payment_requests: FeePaymentRequest[]
  allocations: FeePaymentAllocation[]
}

export interface PartnerFeeInvoiceList {
  items: PartnerFeeInvoice[]
  total: number
}

export interface PartnerFeeInvoiceCreatePayload {
  invoice_no: string
  invoice_date: string
  partner_id?: string | null
  partner_name: string
  partner_type?: string | null
  shipment_plan_id?: string | null
  shipment_no?: string | null
  sales_user_id?: string | null
  sales_user_name?: string | null
  fee_type: string
  total_amount: string
  currency: string
  due_date?: string | null
  remark?: string | null
}

export interface FeePaymentRequestCreatePayload {
  request_no: string
  partner_fee_invoice_id: string
  request_date: string
  requested_amount: string
  currency: string
  remark?: string | null
}

export interface FeePaymentRequestApprovePayload {
  approved_amount: string
  approved_at: string
  reviewer_name: string
  payment_account?: string | null
  remark?: string | null
}

export interface FeePaymentRequestList {
  items: FeePaymentRequest[]
  total: number
}

export interface FeePayableItem {
  partner_fee_invoice_id: string
  invoice_no: string
  partner_id: string | null
  partner_name: string
  partner_type: string | null
  shipment_plan_id: string | null
  shipment_no: string | null
  sales_user_id: string | null
  sales_user_name: string | null
  fee_type: string
  currency: string
  total_amount: string
  paid_amount: string
  payable_amount: string
  due_date: string | null
  status: string
}

export interface FeePayableList {
  items: FeePayableItem[]
  total: number
  total_payable_amount: string
}

export interface VerificationTaxRefund {
  id: string
  verification_document_id: string
  refund_no: string
  refunded_at: string
  amount: string
  currency: string
  bank_receipt_no: string | null
  remark: string | null
}

export interface VerificationDocument {
  id: string
  document_no: string
  received_at: string
  owner_user_id: string | null
  owner_user_name: string | null
  shipment_plan_id: string | null
  shipment_no: string | null
  customer_name: string | null
  currency: string
  refundable_amount: string
  refunded_amount: string
  unrefunded_amount: string
  valid_until: string
  reminder_date: string
  reminder_status: string
  reminder_message: string
  status: string
  customs_declaration_no: string | null
  customs_receipt_no: string | null
  customs_receipt_at: string | null
  verification_no: string | null
  verified_at: string | null
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  refunds: VerificationTaxRefund[]
}

export interface VerificationDocumentList {
  items: VerificationDocument[]
  total: number
}

export interface VerificationDocumentCreatePayload {
  document_no: string
  received_at: string
  owner_user_id?: string | null
  owner_user_name?: string | null
  shipment_plan_id?: string | null
  shipment_no?: string | null
  customer_name?: string | null
  currency: string
  refundable_amount: string
  valid_until: string
  remark?: string | null
}

export interface CustomsReceiptRegisterPayload {
  customs_declaration_no: string
  customs_receipt_no: string
  received_at: string
  remark?: string | null
}

export interface VerificationRegisterPayload {
  verification_no: string
  verified_at: string
  remark?: string | null
}

export interface TaxRefundRegisterPayload {
  refund_no: string
  refunded_at: string
  amount: string
  currency: string
  bank_receipt_no?: string | null
  remark?: string | null
}

export interface VerificationUsageItem {
  verification_document_id: string
  document_no: string
  shipment_plan_id: string | null
  shipment_no: string | null
  owner_user_id: string | null
  owner_user_name: string | null
  customer_name: string | null
  currency: string
  refundable_amount: string
  refunded_amount: string
  unrefunded_amount: string
  valid_until: string
  reminder_date: string
  reminder_status: string
  status: string
  customs_receipt_no: string | null
  verification_no: string | null
}

export interface VerificationUsageList {
  items: VerificationUsageItem[]
  total: number
  total_refunded_amount: string
}

export interface MiscFeeItem {
  id: string
  code: string
  name: string
  category: string
  default_allocation_method: string
  is_active: boolean
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
}

export interface MiscFeeItemList {
  items: MiscFeeItem[]
  total: number
}

export interface MiscFeeItemCreatePayload {
  code: string
  name: string
  category: string
  default_allocation_method: string
  is_active: boolean
  remark?: string | null
}

export interface MiscFeeAllocation {
  id: string
  allocation_no: string
  item_id: string
  item_code: string
  item_name: string
  item_category: string
  shipment_plan_id: string
  shipment_no: string
  customer_name: string
  sales_user_id: string | null
  sales_user_name: string | null
  allocated_at: string
  amount: string
  currency: string
  allocation_method: string
  basis: string | null
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
}

export interface MiscFeeAllocationList {
  items: MiscFeeAllocation[]
  total: number
  total_allocated_amount: string
}

export interface MiscFeeAllocationCreatePayload {
  allocation_no: string
  item_id: string
  shipment_plan_id: string
  shipment_no?: string | null
  sales_user_id?: string | null
  sales_user_name?: string | null
  allocated_at: string
  amount: string
  currency: string
  allocation_method: string
  basis?: string | null
  remark?: string | null
}

export interface ProfitCostItem {
  id: string
  settlement_id: string
  shipment_plan_id: string
  shipment_no: string
  cost_no: string
  cost_type: string
  source_type: string
  source_id: string | null
  source_no: string | null
  cost_date: string
  amount: string
  currency: string
  direction: string
  reason: string | null
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
}

export interface FinancialSettlement {
  id: string
  settlement_no: string
  shipment_plan_id: string
  shipment_no: string
  customer_name: string
  settlement_date: string
  currency: string
  sales_income: string
  purchase_cost_amount: string
  partner_fee_amount: string
  misc_fee_amount: string
  tax_refund_amount: string
  manual_cost_amount: string
  gross_profit: string
  gross_profit_rate: string
  status: string
  remark: string | null
  created_by_user_id: string
  created_by_user_name: string
  created_at: string
  cost_items: ProfitCostItem[]
}

export interface FinancialSettlementList {
  items: FinancialSettlement[]
  total: number
  total_sales_income: string
  total_gross_profit: string
}

export interface ProfitCalculationList {
  items: FinancialSettlement[]
  total: number
  total_sales_income: string
  total_gross_profit: string
}

export interface FinancialSettlementCreatePayload {
  settlement_no: string
  shipment_plan_id: string
  shipment_no?: string | null
  settlement_date: string
  remark?: string | null
}

export interface ManualProfitCostCreatePayload {
  cost_no: string
  cost_type: string
  cost_date: string
  amount: string
  currency: string
  source_no?: string | null
  reason: string
  remark?: string | null
}

export interface ScheduleCreatePayload {
  title: string
  description?: string
  starts_at: string
  ends_at: string
}

export interface AnnouncementCreatePayload {
  title: string
  content: string
}

export interface TodoCreatePayload {
  title: string
  content: string
  assignee_user_ids: string[]
}

export interface TodoCreateResult {
  items: TodoTask[]
}

export interface ShortcutCreatePayload {
  label: string
  target_path: string
  icon?: string
  sort_order?: number
}

export interface ProductAccessory {
  id: string
  product_id: string
  accessory_name: string
  unit_consumption: string
  unit: string
  default_supplier_name: string | null
  purchase_split_rule: string
}

export interface Product {
  id: string
  code: string
  cn_name: string
  en_name: string
  specification: string | null
  model: string | null
  customs_code: string
  tax_rate: string
  rebate_rate: string
  package_info: string
  unit: string
  image_url: string | null
  status: string
  accessories: ProductAccessory[]
}

export interface ProductList {
  items: Product[]
  total: number
}

export interface ProductAccessoryPayload {
  accessory_name: string
  unit_consumption: string
  unit: string
  default_supplier_name?: string | null
  purchase_split_rule: string
}

export interface ProductCreatePayload {
  code: string
  cn_name: string
  en_name: string
  specification?: string | null
  model?: string | null
  customs_code: string
  tax_rate: string
  rebate_rate: string
  package_info: string
  unit: string
  image_url?: string | null
  status?: string
  accessories: ProductAccessoryPayload[]
}

export type ProductUpdatePayload = Omit<ProductCreatePayload, 'accessories'> & {
  status: string
}

export interface ProductExport {
  filename: string
  content_type: string
  content: string
}

export interface CustomerContact {
  id: string
  customer_id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
}

export interface CustomerCreditProfile {
  credit_grade: string
  credit_limit: string | null
  currency: string
  payment_terms: string
  risk_note: string | null
}

export interface Customer {
  id: string
  code: string
  cn_name: string
  en_name: string
  country: string
  address: string | null
  website: string | null
  status: string
  owner_user_id: string
  contacts: CustomerContact[]
  primary_contact: CustomerContact | null
  credit_profile: CustomerCreditProfile | null
}

export interface CustomerList {
  items: Customer[]
  total: number
}

export interface CustomerContactPayload {
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  is_primary: boolean
}

export interface CustomerCreditProfilePayload {
  credit_grade: string
  credit_limit: string
  currency: string
  payment_terms: string
  risk_note?: string | null
}

export interface CustomerCreatePayload {
  code: string
  cn_name: string
  en_name: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  contacts: CustomerContactPayload[]
  credit_profile?: CustomerCreditProfilePayload | null
}

export interface CustomerUpdatePayload {
  cn_name: string
  en_name: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  credit_profile?: CustomerCreditProfilePayload | null
}

export interface CustomerTransaction {
  source_type: string
  source_code: string
  occurred_at: string
  amount: string | null
  summary: string
}

export interface CustomerTransactionList {
  items: CustomerTransaction[]
  total: number
}

export interface SupplierContact {
  id: string
  supplier_id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
}

export interface SupplierCreditProfile {
  credit_grade: string
  credit_limit: string | null
  currency: string
  payment_terms: string
  risk_note: string | null
}

export interface Supplier {
  id: string
  code: string
  cn_name: string
  en_name: string
  country: string
  address: string | null
  website: string | null
  status: string
  owner_user_id: string
  contacts: SupplierContact[]
  primary_contact: SupplierContact | null
  credit_profile: SupplierCreditProfile | null
}

export interface SupplierList {
  items: Supplier[]
  total: number
}

export interface SupplierContactPayload {
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  is_primary: boolean
}

export interface SupplierCreditProfilePayload {
  credit_grade: string
  credit_limit: string
  currency: string
  payment_terms: string
  risk_note?: string | null
}

export interface SupplierCreatePayload {
  code: string
  cn_name: string
  en_name: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  contacts: SupplierContactPayload[]
  credit_profile?: SupplierCreditProfilePayload | null
}

export interface SupplierUpdatePayload {
  cn_name: string
  en_name: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  credit_profile?: SupplierCreditProfilePayload | null
}

export interface SupplierTransaction {
  source_type: string
  source_code: string
  occurred_at: string
  amount: string | null
  summary: string
}

export interface SupplierTransactionList {
  items: SupplierTransaction[]
  total: number
}

export interface PartnerContact {
  id: string
  partner_id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
}

export interface Partner {
  id: string
  code: string
  cn_name: string
  en_name: string
  partner_type: string
  country: string
  address: string | null
  website: string | null
  status: string
  owner_user_id: string
  contacts: PartnerContact[]
  primary_contact: PartnerContact | null
}

export interface PartnerList {
  items: Partner[]
  total: number
}

export interface PartnerContactPayload {
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  is_primary: boolean
}

export interface PartnerCreatePayload {
  code: string
  cn_name: string
  en_name: string
  partner_type: string
  country: string
  address?: string | null
  website?: string | null
  status: string
  contacts: PartnerContactPayload[]
}

export interface PartnerUpdatePayload {
  cn_name: string
  en_name: string
  partner_type: string
  country: string
  address?: string | null
  website?: string | null
  status: string
}

export interface PartnerFeeRecord {
  source_type: string
  source_code: string
  occurred_at: string
  amount: string | null
  summary: string
}

export interface PartnerFeeRecordList {
  items: PartnerFeeRecord[]
  total: number
}

export interface DocumentParty {
  id: string
  code: string
  party_type: string
  display_name: string
  customer_id: string | null
  customer_name: string | null
  country: string
  address: string | null
  contact_person: string | null
  email: string | null
  phone: string | null
  bank_name: string | null
  swift_code: string | null
  account_no: string | null
  tax_id: string | null
  remarks: string | null
  is_default: boolean
  status: string
  owner_user_id: string
}

export interface DocumentPartyList {
  items: DocumentParty[]
  total: number
}

export interface DocumentPartyCreatePayload {
  code: string
  party_type: string
  display_name: string
  customer_id?: string | null
  customer_name?: string | null
  country: string
  address?: string | null
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  bank_name?: string | null
  swift_code?: string | null
  account_no?: string | null
  tax_id?: string | null
  remarks?: string | null
  is_default: boolean
  status: string
}

export type DocumentPartyUpdatePayload = Omit<DocumentPartyCreatePayload, 'code'>

export interface SampleRequestLine {
  id: string
  sample_request_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  quantity: string
  unit: string
  requirement: string | null
}

export interface SampleProgress {
  id: string
  sample_request_id: string
  stage: string
  status: string
  occurred_at: string
  note: string | null
  handler_name: string | null
}

export interface SampleFee {
  id: string
  sample_request_id: string
  fee_type: string
  amount: string
  currency: string
  payee_type: string
  payee_name: string
  remark: string | null
  payment_status: string
  payment_request_no: string | null
}

export interface SampleRequest {
  id: string
  code: string
  request_date: string
  customer_id: string | null
  customer_name: string
  product_id: string | null
  product_code: string | null
  product_name: string | null
  supplier_id: string | null
  supplier_name: string | null
  sales_user_id: string | null
  sales_user_name: string | null
  destination: string
  requirements: string
  due_date: string | null
  status: string
  owner_user_id: string
  lines: SampleRequestLine[]
  progress_events: SampleProgress[]
  fees: SampleFee[]
}

export interface SampleRequestList {
  items: SampleRequest[]
  total: number
}

export interface SampleRequestLinePayload {
  product_id?: string | null
  product_code?: string | null
  product_name: string
  specification?: string | null
  quantity: string
  unit: string
  requirement?: string | null
}

export interface SampleRequestCreatePayload {
  code: string
  request_date: string
  customer_id?: string | null
  customer_name: string
  product_id?: string | null
  product_code?: string | null
  product_name?: string | null
  supplier_id?: string | null
  supplier_name?: string | null
  sales_user_id?: string | null
  sales_user_name?: string | null
  destination: string
  requirements: string
  due_date?: string | null
  status: string
  lines: SampleRequestLinePayload[]
}

export interface SampleProgressPayload {
  stage: string
  status: string
  occurred_at: string
  note?: string | null
  handler_name?: string | null
}

export interface SampleFeePayload {
  fee_type: string
  amount: string
  currency: string
  payee_type: string
  payee_name: string
  remark?: string | null
}

export interface SampleRecordImage {
  id: string
  sample_record_id: string
  file_id: string
  filename: string
  url: string
  caption: string | null
  is_primary: boolean
}

export interface SampleRecordStockSummary {
  sample_record_id: string
  received_quantity: string
  delivered_quantity: string
  retained_quantity: string
  unit: string
}

export interface SampleRecordStockEvent {
  id: string
  sample_record_id: string
  event_type: string
  quantity: string
  unit: string
  occurred_at: string
  delivery_no: string | null
  recipient: string | null
  note: string | null
}

export interface SampleRecordFollowupEvent {
  id: string
  sample_record_id: string
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  node_code: string
  node_label: string
  actual_date: string
  event_type: string
}

export interface SampleRecord {
  id: string
  code: string
  sample_type: string
  status: string
  product_id: string | null
  product_code: string | null
  product_name: string
  customer_id: string | null
  customer_name: string | null
  supplier_id: string | null
  supplier_name: string | null
  customer_sku: string | null
  supplier_sku: string | null
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  source_type: string | null
  source_id: string | null
  source_code: string | null
  source_note: string | null
  received_at: string
  submitted_at: string | null
  quantity: string
  unit: string
  description: string | null
  owner_user_id: string
  images: SampleRecordImage[]
  stock_summary: SampleRecordStockSummary
  stock_events: SampleRecordStockEvent[]
  followup_events: SampleRecordFollowupEvent[]
}

export interface SampleRecordList {
  items: SampleRecord[]
  total: number
}

export interface SampleRecordImagePayload {
  file_id: string
  filename: string
  url: string
  caption?: string | null
  is_primary: boolean
}

export interface SampleRecordCreatePayload {
  code: string
  sample_type: string
  status: string
  product_id?: string | null
  product_code?: string | null
  product_name: string
  customer_id?: string | null
  customer_name?: string | null
  supplier_id?: string | null
  supplier_name?: string | null
  customer_sku?: string | null
  supplier_sku?: string | null
  purchase_contract_id?: string | null
  purchase_contract_no?: string | null
  source_type?: string | null
  source_id?: string | null
  source_code?: string | null
  source_note?: string | null
  received_at: string
  submitted_at?: string | null
  quantity: string
  unit: string
  description?: string | null
  images: SampleRecordImagePayload[]
}

export interface SampleRecordStockEventPayload {
  event_type: string
  quantity: string
  unit: string
  occurred_at: string
  delivery_no?: string | null
  recipient?: string | null
  note?: string | null
}

export interface SampleDeliveryLine {
  id: string
  delivery_id: string
  sample_record_id: string
  sample_code: string | null
  sample_type: string
  product_id: string | null
  product_code: string | null
  product_name: string
  quantity: string
  unit: string
  remark: string | null
}

export interface SampleDeliveryFee {
  id: string
  delivery_id: string
  fee_type: string
  amount: string
  currency: string
  payer_type: string
  remark: string | null
}

export interface SampleDelivery {
  id: string
  code: string
  delivery_date: string
  customer_id: string | null
  customer_name: string
  supplier_id: string | null
  supplier_name: string | null
  factory_id: string | null
  factory_name: string | null
  recipient_name: string
  recipient_company: string | null
  recipient_address: string
  express_company: string
  tracking_no: string | null
  quote_id: string | null
  quote_no: string | null
  remark: string | null
  status: string
  submitted_at: string | null
  approved_at: string | null
  reviewer_name: string | null
  owner_user_id: string
  lines: SampleDeliveryLine[]
  fees: SampleDeliveryFee[]
  fee_total: string
}

export interface SampleDeliveryList {
  items: SampleDelivery[]
  total: number
}

export interface SampleDeliveryLinePayload {
  sample_record_id: string
  sample_code?: string | null
  sample_type: string
  product_id?: string | null
  product_code?: string | null
  product_name: string
  quantity: string
  unit: string
  remark?: string | null
}

export interface SampleDeliveryFeePayload {
  fee_type: string
  amount: string
  currency: string
  payer_type: string
  remark?: string | null
}

export interface SampleDeliveryCreatePayload {
  code: string
  delivery_date: string
  customer_id?: string | null
  customer_name: string
  supplier_id?: string | null
  supplier_name?: string | null
  factory_id?: string | null
  factory_name?: string | null
  recipient_name: string
  recipient_company?: string | null
  recipient_address: string
  express_company: string
  tracking_no?: string | null
  quote_id?: string | null
  quote_no?: string | null
  remark?: string | null
  lines: SampleDeliveryLinePayload[]
  fees: SampleDeliveryFeePayload[]
}

export interface SampleDeliveryApprovePayload {
  reviewer_name: string
  approved_at: string
}

export interface SampleDeliveryTrackingPayload {
  express_company: string
  tracking_no: string
  status: string
}

export interface SampleDeliveryFeeStatistic {
  customer_id: string | null
  customer_name: string
  express_company: string
  currency: string
  total_amount: string
  delivery_count: number
}

export interface SampleDeliveryFeeStatistics {
  items: SampleDeliveryFeeStatistic[]
  total_amount: string
  currency: string
}

export interface ExportQuotationLine {
  id: string
  quotation_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  unit_price: string
  amount: string
  freight_method: string
  freight_amount: string
  purchase_reference_supplier_name: string | null
  purchase_reference_price: string | null
  remark: string | null
}

export interface ExportQuotation {
  id: string
  code: string
  quote_date: string
  customer_id: string | null
  customer_name: string
  sales_user_id: string | null
  sales_user_name: string | null
  currency: string
  trade_term: string
  valid_until: string | null
  description: string | null
  total_amount: string
  approval_status: string
  submitted_at: string | null
  approved_at: string | null
  reviewer_name: string | null
  confirmed_at: string | null
  generated_contract_id: string | null
  generated_contract_no: string | null
  owner_user_id: string
  lines: ExportQuotationLine[]
}

export interface ExportQuotationList {
  items: ExportQuotation[]
  total: number
}

export interface ExportQuotationLinePayload {
  product_id?: string | null
  product_code?: string | null
  product_name: string
  specification?: string | null
  model?: string | null
  quantity: string
  unit: string
  unit_price: string
  freight_method: string
  freight_amount: string
  purchase_reference_supplier_name?: string | null
  purchase_reference_price?: string | null
  remark?: string | null
}

export interface ExportQuotationCreatePayload {
  code: string
  quote_date: string
  customer_id?: string | null
  customer_name: string
  sales_user_id?: string | null
  sales_user_name?: string | null
  currency: string
  trade_term: string
  valid_until?: string | null
  description?: string | null
  lines: ExportQuotationLinePayload[]
}

export interface ExportQuotationApprovePayload {
  reviewer_name: string
  approved_at: string
}

export interface ExportQuotationConfirmContractPayload {
  confirmed_at: string
  contract_no: string
}

export interface ExportQuotationPurchaseReference {
  product_id: string | null
  product_code: string | null
  product_name: string
  supplier_name: string
  reference_price: string
  currency: string
  quote_date: string
  source_quotation_no: string
}

export interface ExportQuotationPurchaseReferenceList {
  items: ExportQuotationPurchaseReference[]
  total: number
}

export interface ExportQuotationExport {
  filename: string
  content_type: string
  content: string
}

export interface ExportQuotationContract {
  quotation_id: string
  quotation_no: string
  contract_id: string
  contract_no: string
  customer_id: string | null
  customer_name: string
  confirmed_at: string
  currency: string
  trade_term: string
  total_amount: string
}

export interface ExportContractLine {
  id: string
  contract_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  unit_price: string
  amount: string
  purchased_quantity: string
  unpurchased_quantity: string
  shipped_quantity: string
  unshipped_quantity: string
  shipped_amount: string
  unshipped_amount: string
  image_url: string | null
  remark: string | null
}

export interface ExportContractSignature {
  id: string
  contract_id: string
  signed_by: string
  signed_at: string
  signature_method: string
  file_no: string | null
  remark: string | null
}

export interface ExportContractAdvancePayment {
  id: string
  contract_id: string
  payment_no: string
  received_at: string
  amount: string
  currency: string
  payer_name: string
  remark: string | null
}

export interface ExportContractStatistics {
  total_quantity: string
  total_amount: string
  shipped_quantity: string
  shipped_amount: string
  unshipped_quantity: string
  unshipped_amount: string
  purchased_quantity: string
  unpurchased_quantity: string
  advance_payment_amount: string
}

export interface ExportContractPurchaseStatus {
  product_id: string | null
  product_code: string | null
  product_name: string
  total_quantity: string
  purchased_quantity: string
  unpurchased_quantity: string
  unit: string
  status: string
}

export interface ExportContractShipmentStatus {
  product_id: string | null
  product_code: string | null
  product_name: string
  planned_ship_date: string
  total_quantity: string
  shipped_quantity: string
  unshipped_quantity: string
  shipped_amount: string
  unshipped_amount: string
  unit: string
  status: string
}

export interface ExportContract {
  id: string
  code: string
  contract_date: string
  customer_id: string | null
  customer_name: string
  sales_user_id: string | null
  sales_user_name: string | null
  currency: string
  trade_term: string
  planned_ship_date: string
  payment_terms: string
  source_quotation_id: string | null
  source_quotation_no: string | null
  remarks: string | null
  approval_status: string
  submitted_at: string | null
  approved_at: string | null
  reviewer_name: string | null
  signature_status: string
  customer_signed_at: string | null
  owner_user_id: string
  statistics: ExportContractStatistics
  lines: ExportContractLine[]
  signatures: ExportContractSignature[]
  advance_payments: ExportContractAdvancePayment[]
  purchase_statuses: ExportContractPurchaseStatus[]
  shipment_statuses: ExportContractShipmentStatus[]
}

export interface ExportContractList {
  items: ExportContract[]
  total: number
}

export interface ExportContractLinePayload {
  product_id?: string | null
  product_code?: string | null
  product_name: string
  specification?: string | null
  model?: string | null
  quantity: string
  unit: string
  unit_price: string
  purchased_quantity?: string
  shipped_quantity?: string
  image_url?: string | null
  remark?: string | null
}

export interface ExportContractCreatePayload {
  code: string
  contract_date: string
  customer_id?: string | null
  customer_name: string
  sales_user_id?: string | null
  sales_user_name?: string | null
  currency: string
  trade_term: string
  planned_ship_date: string
  payment_terms: string
  source_quotation_id?: string | null
  source_quotation_no?: string | null
  remarks?: string | null
  lines: ExportContractLinePayload[]
}

export interface ExportContractApprovePayload {
  reviewer_name: string
  approved_at: string
}

export interface ExportContractSignaturePayload {
  signed_by: string
  signed_at: string
  signature_method: string
  file_no?: string | null
  remark?: string | null
}

export interface ExportContractAdvancePaymentPayload {
  payment_no: string
  received_at: string
  amount: string
  currency: string
  payer_name: string
  remark?: string | null
}

export interface ExportContractExport {
  filename: string
  content_type: string
  content: string
}

export interface ShipmentLine {
  id: string
  shipment_id: string
  contract_id: string
  contract_no: string
  contract_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  unit_price: string
  amount: string
  planned_ship_date: string
}

export interface ShipmentFinanceOverview {
  receivable_amount: string
  payable_amount: string
  profit_amount: string
  profit_rate: string
  currency: string
}

export interface ShipmentReminder {
  shipment_id: string
  shipment_no: string
  reminder_date: string
  message: string
  status: string
}

export interface ShipmentContractProgress {
  contract_id: string
  contract_no: string
  purchase_statuses: ExportContractPurchaseStatus[]
  shipment_statuses: ExportContractShipmentStatus[]
}

export interface ShipmentPlan {
  id: string
  code: string
  shipment_date: string
  planned_ship_date: string
  customer_id: string | null
  customer_name: string
  currency: string
  shipping_method: string
  port_of_loading: string
  port_of_destination: string
  vessel_name: string | null
  container_no: string | null
  booking_no: string | null
  document_owner_name: string | null
  approval_status: string
  submitted_at: string | null
  approved_at: string | null
  reviewer_name: string | null
  remarks: string | null
  owner_user_id: string
  finance_overview: ShipmentFinanceOverview
  reminder: ShipmentReminder
  lines: ShipmentLine[]
  contract_progresses: ShipmentContractProgress[]
}

export interface ShipmentPlanList {
  items: ShipmentPlan[]
  total: number
}

export interface ShipmentReminderList {
  items: ShipmentReminder[]
  total: number
}

export interface ShipmentContractSelectionPayload {
  contract_id: string
  quantity?: string | null
}

export interface ShipmentPlanGeneratePayload {
  code: string
  shipment_date: string
  planned_ship_date: string
  shipping_method: string
  port_of_loading: string
  port_of_destination: string
  vessel_name?: string | null
  container_no?: string | null
  booking_no?: string | null
  document_owner_name?: string | null
  estimated_payable_amount: string
  remarks?: string | null
  selections: ShipmentContractSelectionPayload[]
}

export interface ShipmentApprovePayload {
  reviewer_name: string
  approved_at: string
}

export interface PurchaseContractStatistics {
  total_quantity: string
  total_amount: string
  received_quantity: string
  unreceived_quantity: string
  paid_amount: string
  unpaid_amount: string
}

export interface PurchaseContractLine {
  id: string
  contract_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  unit_price: string
  amount: string
  received_quantity: string
  unreceived_quantity: string
  source_export_contract_id: string | null
  source_export_contract_no: string | null
  source_export_contract_line_id: string | null
  remark: string | null
}

export interface PurchaseContractSourceLink {
  id: string
  contract_id: string
  export_contract_id: string
  export_contract_no: string
  export_contract_line_id: string
  customer_name: string
  product_id: string | null
  product_code: string | null
  demand_quantity: string
  unit: string
}

export interface PurchaseContractReminder {
  id: string
  contract_id: string
  reminder_type: string
  title: string
  due_date: string
  amount: string | null
  currency: string
  status: string
}

export interface PurchaseContract {
  id: string
  code: string
  contract_date: string
  supplier_id: string | null
  supplier_name: string
  buyer_user_id: string | null
  buyer_user_name: string | null
  currency: string
  delivery_date: string
  payment_terms: string
  source_type: string
  remarks: string | null
  approval_status: string
  submitted_at: string | null
  approved_at: string | null
  reviewer_name: string | null
  owner_user_id: string
  statistics: PurchaseContractStatistics
  lines: PurchaseContractLine[]
  source_links: PurchaseContractSourceLink[]
  reminders: PurchaseContractReminder[]
}

export interface PurchaseContractList {
  items: PurchaseContract[]
  total: number
}

export interface PurchaseContractReminderList {
  items: PurchaseContractReminder[]
  total: number
}

export interface InboundPlanLine {
  id: string
  plan_id: string
  purchase_contract_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  planned_quantity: string
  received_quantity: string
  unit: string
  status: string
  remark: string | null
}

export interface InboundPlan {
  id: string
  code: string
  purchase_contract_id: string
  purchase_contract_no: string
  supplier_id: string | null
  supplier_name: string
  inbound_type: string
  planned_date: string
  status: string
  warehouse_id: string | null
  warehouse_name: string | null
  location_id: string | null
  location_name: string | null
  operator_name: string | null
  owner_user_id: string
  lines: InboundPlanLine[]
}

export interface InboundPlanList {
  items: InboundPlan[]
  total: number
}

export interface InboundPlanGeneratePayload {
  purchase_contract_id: string
  inbound_type: string
  planned_date?: string | null
}

export interface InboundPlanSchedulePayload {
  planned_date: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

export interface InboundOrderLine {
  id: string
  order_id: string
  plan_line_id: string
  purchase_contract_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  stock_status: string
  remark: string | null
}

export interface InboundOrder {
  id: string
  code: string
  plan_id: string
  purchase_contract_id: string
  purchase_contract_no: string
  supplier_id: string | null
  supplier_name: string
  inbound_type: string
  inbound_mode: string
  inbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  status: string
  submitted_at: string | null
  approved_at: string | null
  reviewer_name: string | null
  owner_user_id: string
  lines: InboundOrderLine[]
}

export interface InboundOrderList {
  items: InboundOrder[]
  total: number
}

export interface InboundOrderLinePayload {
  plan_line_id: string
  product_id?: string | null
  product_code?: string | null
  product_name: string
  quantity: string
  unit: string
  remark?: string | null
}

export interface InboundOrderGeneratePayload {
  plan_id: string
  code: string
  inbound_mode: string
  inbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  lines: InboundOrderLinePayload[]
}

export interface InboundOrderApprovePayload {
  reviewer_name: string
  approved_at: string
}

export interface OutboundPlanLine {
  id: string
  plan_id: string
  source_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  planned_quantity: string
  outbound_quantity: string
  unit: string
  status: string
  remark: string | null
}

export interface OutboundPlan {
  id: string
  code: string
  source_type: string
  source_id: string
  source_code: string
  outbound_type: string
  planned_date: string
  status: string
  customer_id: string | null
  customer_name: string | null
  warehouse_id: string | null
  warehouse_name: string | null
  location_id: string | null
  location_name: string | null
  operator_name: string | null
  owner_user_id: string
  lines: OutboundPlanLine[]
}

export interface OutboundPlanList {
  items: OutboundPlan[]
  total: number
}

export interface OutboundPlanGeneratePayload {
  shipment_plan_id: string
  outbound_type: string
  planned_date?: string | null
}

export interface OutboundPlanSchedulePayload {
  planned_date: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
}

export interface OutboundOrderLine {
  id: string
  order_id: string
  plan_line_id: string
  source_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
  stock_status: string
  remark: string | null
}

export interface OutboundOrder {
  id: string
  code: string
  plan_id: string
  source_type: string
  source_id: string
  source_code: string
  outbound_type: string
  customer_id: string | null
  customer_name: string | null
  outbound_mode: string
  outbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  status: string
  exception_reason: string | null
  submitted_at: string | null
  approved_at: string | null
  reviewer_name: string | null
  owner_user_id: string
  lines: OutboundOrderLine[]
}

export interface OutboundOrderList {
  items: OutboundOrder[]
  total: number
}

export interface OutboundOrderLinePayload {
  plan_line_id: string
  product_id?: string | null
  product_code?: string | null
  product_name: string
  quantity: string
  unit: string
  remark?: string | null
}

export interface OutboundOrderGeneratePayload {
  plan_id: string
  code: string
  outbound_mode: string
  outbound_at: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  operator_name: string
  exception_reason?: string | null
  lines: OutboundOrderLinePayload[]
}

export interface OutboundOrderApprovePayload {
  reviewer_name: string
  approved_at: string
  allow_negative?: boolean
}

export interface InventoryBalance {
  id: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  product_id: string | null
  product_code: string | null
  product_name: string
  available_quantity: string
  locked_quantity: string
  pending_inspection_quantity: string
  unit: string
}

export interface InventoryBalanceList {
  items: InventoryBalance[]
  total: number
}

export interface InventoryLedger {
  id: string
  warehouse_id: string
  warehouse_name: string
  location_id: string
  location_name: string
  product_id: string | null
  product_code: string | null
  product_name: string
  direction: string
  quantity: string
  unit: string
  stock_status: string
  source_type: string
  source_id: string
  source_code: string
  occurred_at: string
  remark: string | null
}

export interface InventoryLedgerList {
  items: InventoryLedger[]
  total: number
}

export interface PurchaseContractLinePayload {
  product_id?: string | null
  product_code?: string | null
  product_name: string
  specification?: string | null
  model?: string | null
  quantity: string
  unit: string
  unit_price: string
  source_export_contract_id?: string | null
  source_export_contract_no?: string | null
  source_export_contract_line_id?: string | null
  remark?: string | null
}

export interface PurchaseContractCreatePayload {
  code: string
  contract_date: string
  supplier_id?: string | null
  supplier_name: string
  buyer_user_id?: string | null
  buyer_user_name?: string | null
  currency: string
  delivery_date: string
  payment_terms: string
  source_type: 'export_contract' | 'stock_purchase' | 'manual'
  remarks?: string | null
  lines: PurchaseContractLinePayload[]
}

export interface PurchaseContractGeneratePayload {
  code: string
  contract_date: string
  supplier_id?: string | null
  supplier_name: string
  buyer_user_id?: string | null
  buyer_user_name?: string | null
  currency: string
  delivery_date: string
  payment_terms: string
  unit_price: string
  remarks?: string | null
  sources: Array<{ export_contract_id: string }>
}

export interface PurchaseContractApprovePayload {
  reviewer_name: string
  approved_at: string
}

export interface PurchaseInvoiceNoticeLine {
  id: string
  notice_id: string
  purchase_contract_id: string | null
  purchase_contract_no: string | null
  product_id: string | null
  product_code: string | null
  product_name: string
  customs_name: string
  invoice_name: string
  quantity: string
  unit: string
  amount: string
  currency: string
  remark: string | null
}

export interface PurchaseInvoiceNoticeReminder {
  id: string
  notice_id: string
  title: string
  due_date: string
  status: string
}

export interface PurchaseInvoiceNotice {
  id: string
  code: string
  notice_date: string
  supplier_id: string | null
  supplier_name: string
  customs_declaration_id: string | null
  customs_declaration_no: string
  declaration_date: string
  currency: string
  remarks: string | null
  status: string
  sent_at: string | null
  sender_name: string | null
  tax_invoice_no: string | null
  tax_invoice_received_at: string | null
  total_quantity: string
  total_amount: string
  owner_user_id: string
  lines: PurchaseInvoiceNoticeLine[]
  reminders: PurchaseInvoiceNoticeReminder[]
}

export interface PurchaseInvoiceNoticeList {
  items: PurchaseInvoiceNotice[]
  total: number
}

export interface PurchaseInvoiceNoticeReminderList {
  items: PurchaseInvoiceNoticeReminder[]
  total: number
}

export interface PurchaseInvoiceNoticeLinePayload {
  supplier_id?: string | null
  supplier_name: string
  purchase_contract_id?: string | null
  purchase_contract_no?: string | null
  product_id?: string | null
  product_code?: string | null
  product_name: string
  customs_name: string
  invoice_name: string
  quantity: string
  unit: string
  amount: string
  remark?: string | null
}

export interface PurchaseInvoiceNoticeGeneratePayload {
  customs_declaration_id?: string | null
  customs_declaration_no: string
  declaration_date: string
  notice_date: string
  currency: string
  remarks?: string | null
  lines: PurchaseInvoiceNoticeLinePayload[]
}

export interface PurchaseInvoiceNoticeSendPayload {
  sender_name: string
  sent_at: string
}

export interface PurchaseInvoiceNoticeReceivePayload {
  tax_invoice_no: string
  received_at: string
}

export interface FollowProcessTemplateNode {
  id: string
  template_id: string
  node_code: string
  node_name: string
  sequence_no: number
  standard_days: number
  remind_before_days: number
  actual_date_source: string
}

export interface FollowProcessTemplate {
  id: string
  name: string
  enabled: boolean
  is_default: boolean
  owner_user_id: string
  nodes: FollowProcessTemplateNode[]
}

export interface FollowProcessTemplateList {
  items: FollowProcessTemplate[]
  total: number
}

export interface FollowProcessTemplateNodePayload {
  node_code: string
  node_name: string
  sequence_no: number
  standard_days: number
  remind_before_days: number
  actual_date_source: string
}

export interface FollowProcessTemplatePayload {
  name: string
  enabled: boolean
  is_default: boolean
  nodes: FollowProcessTemplateNodePayload[]
}

export interface PurchaseFollowNode {
  id: string
  follow_plan_id: string
  node_code: string
  node_name: string
  sequence_no: number
  planned_date: string
  remind_date: string
  actual_date: string | null
  status: string
  source_record_type: string | null
  source_record_id: string | null
  source_summary: string | null
  overdue_days: number
}

export interface PurchaseFollowPlan {
  id: string
  purchase_contract_id: string
  purchase_contract_no: string
  supplier_id: string | null
  supplier_name: string
  template_id: string
  base_date: string
  overall_status: string
  owner_user_id: string
  nodes: PurchaseFollowNode[]
}

export interface PurchaseFollowPlanList {
  items: PurchaseFollowPlan[]
  total: number
}

export interface PurchaseFollowOverdueNode {
  id: string
  follow_plan_id: string
  purchase_contract_id: string
  purchase_contract_no: string
  supplier_name: string
  node_code: string
  node_name: string
  planned_date: string
  remind_date: string
  overdue_days: number
  source_record_type: string | null
  source_record_id: string | null
}

export interface PurchaseFollowOverdueNodeList {
  items: PurchaseFollowOverdueNode[]
  total: number
}

export interface PurchaseFollowPlanGeneratePayload {
  purchase_contract_id: string
  as_of?: string | null
}

export interface FollowSourceEventPayload {
  purchase_contract_id: string
  node_code: string
  source_record_type: string
  source_record_id: string
  actual_date: string
  source_summary: string
}

export interface QualityInspectionLine {
  id: string
  inspection_id: string
  purchase_contract_line_id: string | null
  product_id: string | null
  product_code: string | null
  product_name: string
  inspected_quantity: string
  failed_quantity: string
  unit: string
  result: string
  remark: string | null
}

export interface QualityIssue {
  id: string
  inspection_id: string
  line_id: string | null
  issue_type: string
  severity: string
  description: string
  corrective_action: string | null
  status: string
  attachment_group_id: string | null
}

export interface QualityInspection {
  id: string
  code: string
  purchase_contract_id: string
  purchase_contract_no: string
  supplier_id: string | null
  supplier_name: string
  inspected_at: string
  result: string
  inspector_id: string | null
  inspector_name: string
  issue_summary: string | null
  attachment_group_id: string | null
  owner_user_id: string
  lines: QualityInspectionLine[]
  issues: QualityIssue[]
}

export interface QualityInspectionList {
  items: QualityInspection[]
  total: number
}

export interface QualityInspectionLinePayload {
  purchase_contract_line_id?: string | null
  product_id?: string | null
  product_code?: string | null
  product_name: string
  inspected_quantity: string
  failed_quantity?: string
  unit: string
  result: string
  remark?: string | null
}

export interface QualityIssuePayload {
  issue_type: string
  severity: string
  description: string
  corrective_action?: string | null
  status: string
  attachment_group_id?: string | null
}

export interface QualityInspectionPayload {
  code: string
  purchase_contract_id: string
  inspected_at: string
  result: string
  inspector_id?: string | null
  inspector_name: string
  issue_summary?: string | null
  attachment_group_id?: string | null
  lines: QualityInspectionLinePayload[]
  issues: QualityIssuePayload[]
}

export interface QualityInspectionInboundEligibility {
  purchase_contract_id: string
  eligible: boolean
  latest_inspection_id: string | null
  latest_result: string | null
  inspected_at: string | null
  reason: string
}

export interface PurchaseInquiryLine {
  id: string
  inquiry_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  specification: string | null
  model: string | null
  quantity: string
  unit: string
}

export interface SupplierSampleEvidence {
  sample_record_id: string
  sample_code: string
  sample_type: string
  status: string
  supplier_id: string | null
  supplier_name: string | null
  product_id: string | null
  product_code: string | null
  product_name: string
  received_at: string
  quantity: string
  unit: string
}

export interface SupplierQuotation {
  id: string
  inquiry_id: string
  inquiry_line_id: string
  product_id: string | null
  product_code: string | null
  product_name: string
  supplier_id: string | null
  supplier_name: string
  quoted_at: string
  unit_price: string
  currency: string
  lead_time_days: number | null
  min_order_quantity: string | null
  sample_available: boolean
  has_sample: boolean
  remark: string | null
}

export interface PurchaseInquiry {
  id: string
  code: string
  inquiry_date: string
  buyer_user_id: string | null
  buyer_user_name: string | null
  status: string
  template_name: string | null
  template_sent_at: string | null
  remarks: string | null
  owner_user_id: string
  lines: PurchaseInquiryLine[]
  quotations: SupplierQuotation[]
}

export interface PurchaseInquiryList {
  items: PurchaseInquiry[]
  total: number
}

export interface SupplierSampleEvidenceList {
  items: SupplierSampleEvidence[]
  total: number
}

export interface PurchaseInquiryReference {
  product_id: string | null
  product_code: string | null
  product_name: string
  supplier_name: string
  reference_price: string
  currency: string
  quote_date: string
  source_inquiry_no: string
}

export interface PurchaseInquiryReferenceList {
  items: PurchaseInquiryReference[]
  total: number
}

export interface PurchaseInquiryTemplate {
  filename: string
  content_type: string
  content: string
}

export interface PurchaseInquiryLinePayload {
  product_id?: string | null
  product_code?: string | null
  product_name: string
  specification?: string | null
  model?: string | null
  quantity: string
  unit: string
}

export interface PurchaseInquiryCreatePayload {
  code: string
  inquiry_date: string
  buyer_user_id?: string | null
  buyer_user_name?: string | null
  remarks?: string | null
  lines: PurchaseInquiryLinePayload[]
}

export interface SupplierQuotationPayload {
  inquiry_line_id: string
  supplier_id?: string | null
  supplier_name: string
  quoted_at: string
  unit_price: string
  currency: string
  lead_time_days?: number | null
  min_order_quantity?: string | null
  sample_available: boolean
  remark?: string | null
}

export interface PurchaseInquiryTemplatePayload {
  template_name: string
  recipient_emails: string[]
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
export const authExpiredEventName = 'yuanjing-auth-expired'

let authToken = localStorage.getItem('yuanjing_access_token') ?? ''

export function setAuthToken(token: string): void {
  authToken = token
  localStorage.setItem('yuanjing_access_token', token)
}

export function clearAuthToken(): void {
  authToken = ''
  localStorage.removeItem('yuanjing_access_token')
}

export function hasAuthToken(): boolean {
  return authToken.length > 0
}

function notifyAuthExpired(): void {
  if (!authToken) return
  clearAuthToken()
  window.dispatchEvent(new Event(authExpiredEventName))
}

async function readApiErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody
    if (body.error?.message) return body.error.message
    if (body.message) return body.message
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((item) => item.msg)
        .filter((message): message is string => Boolean(message))
        .join('；')
    }
  } catch {
    return ''
  }
  return ''
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await readApiErrorMessage(response)
    if (response.status === 401) {
      notifyAuthExpired()
      throw new Error(message || '登录状态已失效')
    }
    throw new Error(message || `请求失败：${response.status}`)
  }

  const body = (await response.json()) as ApiResponse<T>
  if (!body.success || body.error) {
    throw new Error(body.error?.message ?? '请求失败')
  }
  return body.data
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const nextUsername = username.trim()
  if (!nextUsername || !password) {
    throw new Error('请填写用户名和密码')
  }

  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: nextUsername, password }),
  })

  if (!response.ok) {
    const message = await readApiErrorMessage(response)
    if (response.status === 401) throw new Error(message || '用户名或密码错误')
    if (response.status === 422) throw new Error('请填写用户名和密码')
    throw new Error(message || '登录失败，请稍后重试')
  }

  const body = (await response.json()) as ApiResponse<AuthSession>
  if (!body.success || body.error) {
    throw new Error(body.error?.message ?? '用户名或密码错误')
  }
  return body.data
}

export function getCurrentSession(): Promise<{ user: CurrentUser; menus: MenuItem[] }> {
  return request<{ user: CurrentUser; menus: MenuItem[] }>('/auth/me')
}

export function updateCurrentUserAvatar(
  payload: CurrentUserAvatarUpdatePayload,
): Promise<{ user: CurrentUser; menus: MenuItem[] }> {
  return request<{ user: CurrentUser; menus: MenuItem[] }>('/auth/me/avatar', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function listAssignableUsers(): Promise<{ users: AssignableUser[] }> {
  return request<{ users: AssignableUser[] }>('/auth/users')
}

export function getOrganizationOptions(): Promise<OrganizationOptions> {
  return request<OrganizationOptions>('/organization/options')
}

export function listOrganizationUsers(): Promise<{ users: OrganizationUser[] }> {
  return request<{ users: OrganizationUser[] }>('/organization/users')
}

export function createOrganizationDepartment(
  payload: OrganizationDepartmentCreatePayload,
): Promise<OrganizationDepartment> {
  return request<OrganizationDepartment>('/organization/departments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateOrganizationDepartment(
  departmentId: string,
  payload: OrganizationDepartmentUpdatePayload,
): Promise<OrganizationDepartment> {
  return request<OrganizationDepartment>(`/organization/departments/${departmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteOrganizationDepartment(departmentId: string): Promise<OrganizationDepartment> {
  return request<OrganizationDepartment>(`/organization/departments/${departmentId}`, {
    method: 'DELETE',
  })
}

export function createOrganizationUser(
  payload: OrganizationUserCreatePayload,
): Promise<OrganizationUserCreateResult> {
  return request<OrganizationUserCreateResult>('/organization/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateOrganizationUser(
  userId: string,
  payload: OrganizationUserUpdatePayload,
): Promise<OrganizationUser> {
  return request<OrganizationUser>(`/organization/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteOrganizationUser(userId: string): Promise<OrganizationUser> {
  return request<OrganizationUser>(`/organization/users/${userId}`, {
    method: 'DELETE',
  })
}

export function resetOrganizationUserPassword(userId: string): Promise<OrganizationPasswordResetResult> {
  return request<OrganizationPasswordResetResult>(`/organization/users/${userId}/reset-password`, {
    method: 'POST',
  })
}

export function updateOrganizationRolePermissions(
  roleId: string,
  payload: OrganizationRolePermissionUpdatePayload,
): Promise<OrganizationRole> {
  return request<OrganizationRole>(`/organization/roles/${roleId}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getI18nConfig(): Promise<I18nConfig> {
  return request<I18nConfig>('/system/i18n')
}

export function getDashboard(): Promise<Dashboard> {
  return request<Dashboard>('/dashboard')
}

export function createAnnouncement(payload: AnnouncementCreatePayload): Promise<Announcement> {
  return request<Announcement>('/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createTodos(payload: TodoCreatePayload): Promise<TodoCreateResult> {
  return request<TodoCreateResult>('/todos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function markNotificationRead(notificationId: string): Promise<NotificationItem> {
  return request<NotificationItem>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  })
}

export function createDashboardShortcut(payload: ShortcutCreatePayload): Promise<DashboardShortcut> {
  return request<DashboardShortcut>('/shortcuts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteDashboardShortcut(shortcutId: string): Promise<DashboardShortcut> {
  return request<DashboardShortcut>(`/shortcuts/${shortcutId}`, {
    method: 'DELETE',
  })
}

export function getFinanceOverview(): Promise<FinanceOverview> {
  return request<FinanceOverview>('/finance/overview')
}

export function listApprovalDocuments(filters: {
  document_type?: string
  status?: string
  applicant_user_id?: string
  date_from?: string
  date_to?: string
} = {}): Promise<ApprovalQuery> {
  const params = new URLSearchParams()
  if (filters.document_type) params.set('document_type', filters.document_type)
  if (filters.status) params.set('status', filters.status)
  if (filters.applicant_user_id) params.set('applicant_user_id', filters.applicant_user_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ApprovalQuery>(`/reporting/approvals${suffix}`)
}

export function listReportingStatistics(filters: {
  date_from?: string
  date_to?: string
  customer_id?: string
  supplier_id?: string
  sales_user_id?: string
  approval_status?: string
} = {}): Promise<ReportingStatistics> {
  const params = new URLSearchParams()
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.approval_status) params.set('approval_status', filters.approval_status)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ReportingStatistics>(`/reporting/statistics${suffix}`)
}

export function listBankReceipts(filters: {
  q?: string
  status?: string
  customer_id?: string
} = {}): Promise<BankReceiptList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<BankReceiptList>(`/finance/receipts${suffix}`)
}

export function createBankReceipt(payload: BankReceiptCreatePayload): Promise<BankReceipt> {
  return request<BankReceipt>('/finance/receipts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function claimBankReceipt(
  receiptId: string,
  payload: BankReceiptClaimPayload,
): Promise<BankReceipt> {
  return request<BankReceipt>(`/finance/receipts/${receiptId}/claim`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function allocateBankReceipt(
  receiptId: string,
  payload: BankReceiptAllocationPayload,
): Promise<BankReceipt> {
  return request<BankReceipt>(`/finance/receipts/${receiptId}/allocations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listReceivables(filters: {
  q?: string
  customer_id?: string
  sales_user_id?: string
  contract_no?: string
  invoice_no?: string
} = {}): Promise<ReceivableList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.contract_no) params.set('contract_no', filters.contract_no)
  if (filters.invoice_no) params.set('invoice_no', filters.invoice_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ReceivableList>(`/finance/receivables${suffix}`)
}

export function listSupplierInvoices(filters: {
  q?: string
  status?: string
  supplier_id?: string
  purchase_contract_no?: string
} = {}): Promise<SupplierInvoiceList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_no) params.set('purchase_contract_no', filters.purchase_contract_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SupplierInvoiceList>(`/finance/supplier-invoices${suffix}`)
}

export function createSupplierInvoice(
  payload: SupplierInvoiceCreatePayload,
): Promise<SupplierInvoice> {
  return request<SupplierInvoice>('/finance/supplier-invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPaymentRequests(filters: {
  q?: string
  status?: string
  payment_type?: string
  supplier_id?: string
} = {}): Promise<SupplierPaymentRequestList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.payment_type) params.set('payment_type', filters.payment_type)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SupplierPaymentRequestList>(`/finance/payment-requests${suffix}`)
}

export function createPaymentRequest(
  payload: PaymentRequestCreatePayload,
): Promise<SupplierPaymentRequest> {
  return request<SupplierPaymentRequest>('/finance/payment-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approvePaymentRequest(
  paymentRequestId: string,
  payload: PaymentRequestApprovePayload,
): Promise<SupplierPaymentRequest> {
  return request<SupplierPaymentRequest>(`/finance/payment-requests/${paymentRequestId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPayables(filters: {
  q?: string
  status?: string
  supplier_id?: string
  purchase_contract_no?: string
} = {}): Promise<PayableList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_no) params.set('purchase_contract_no', filters.purchase_contract_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PayableList>(`/finance/payables${suffix}`)
}

export function listPartnerFeeInvoices(filters: {
  q?: string
  status?: string
  fee_type?: string
  partner_id?: string
  sales_user_id?: string
  shipment_no?: string
} = {}): Promise<PartnerFeeInvoiceList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.fee_type) params.set('fee_type', filters.fee_type)
  if (filters.partner_id) params.set('partner_id', filters.partner_id)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PartnerFeeInvoiceList>(`/finance/partner-fee-invoices${suffix}`)
}

export function createPartnerFeeInvoice(
  payload: PartnerFeeInvoiceCreatePayload,
): Promise<PartnerFeeInvoice> {
  return request<PartnerFeeInvoice>('/finance/partner-fee-invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listFeePaymentRequests(filters: {
  q?: string
  status?: string
  fee_type?: string
  partner_id?: string
  sales_user_id?: string
  shipment_no?: string
} = {}): Promise<FeePaymentRequestList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.fee_type) params.set('fee_type', filters.fee_type)
  if (filters.partner_id) params.set('partner_id', filters.partner_id)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<FeePaymentRequestList>(`/finance/fee-payment-requests${suffix}`)
}

export function createFeePaymentRequest(
  payload: FeePaymentRequestCreatePayload,
): Promise<FeePaymentRequest> {
  return request<FeePaymentRequest>('/finance/fee-payment-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveFeePaymentRequest(
  feePaymentRequestId: string,
  payload: FeePaymentRequestApprovePayload,
): Promise<FeePaymentRequest> {
  return request<FeePaymentRequest>(`/finance/fee-payment-requests/${feePaymentRequestId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listFeePayables(filters: {
  q?: string
  status?: string
  fee_type?: string
  partner_id?: string
  sales_user_id?: string
  shipment_no?: string
} = {}): Promise<FeePayableList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.fee_type) params.set('fee_type', filters.fee_type)
  if (filters.partner_id) params.set('partner_id', filters.partner_id)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<FeePayableList>(`/finance/fee-payables${suffix}`)
}

export function listVerificationDocuments(filters: {
  q?: string
  status?: string
  owner_user_id?: string
  shipment_no?: string
  reminder_status?: string
} = {}): Promise<VerificationDocumentList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.owner_user_id) params.set('owner_user_id', filters.owner_user_id)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  if (filters.reminder_status) params.set('reminder_status', filters.reminder_status)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<VerificationDocumentList>(`/finance/verification-documents${suffix}`)
}

export function createVerificationDocument(
  payload: VerificationDocumentCreatePayload,
): Promise<VerificationDocument> {
  return request<VerificationDocument>('/finance/verification-documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function registerVerificationCustomsReceipt(
  verificationDocumentId: string,
  payload: CustomsReceiptRegisterPayload,
): Promise<VerificationDocument> {
  return request<VerificationDocument>(
    `/finance/verification-documents/${verificationDocumentId}/customs-receipt`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function registerVerification(
  verificationDocumentId: string,
  payload: VerificationRegisterPayload,
): Promise<VerificationDocument> {
  return request<VerificationDocument>(
    `/finance/verification-documents/${verificationDocumentId}/verify`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function registerTaxRefund(
  verificationDocumentId: string,
  payload: TaxRefundRegisterPayload,
): Promise<VerificationDocument> {
  return request<VerificationDocument>(
    `/finance/verification-documents/${verificationDocumentId}/tax-refunds`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function listVerificationUsage(filters: {
  q?: string
  status?: string
  owner_user_id?: string
  shipment_no?: string
  reminder_status?: string
} = {}): Promise<VerificationUsageList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.owner_user_id) params.set('owner_user_id', filters.owner_user_id)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  if (filters.reminder_status) params.set('reminder_status', filters.reminder_status)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<VerificationUsageList>(`/finance/verification-usage${suffix}`)
}

export function listMiscFeeItems(filters: {
  q?: string
  category?: string
  status?: string
} = {}): Promise<MiscFeeItemList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('category', filters.category)
  if (filters.status) params.set('status', filters.status)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<MiscFeeItemList>(`/finance/misc-fee-items${suffix}`)
}

export function createMiscFeeItem(payload: MiscFeeItemCreatePayload): Promise<MiscFeeItem> {
  return request<MiscFeeItem>('/finance/misc-fee-items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listMiscFeeAllocations(filters: {
  q?: string
  item_id?: string
  category?: string
  shipment_no?: string
  sales_user_id?: string
  status?: string
} = {}): Promise<MiscFeeAllocationList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.item_id) params.set('item_id', filters.item_id)
  if (filters.category) params.set('category', filters.category)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.status) params.set('status', filters.status)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<MiscFeeAllocationList>(`/finance/misc-fee-allocations${suffix}`)
}

export function createMiscFeeAllocation(
  payload: MiscFeeAllocationCreatePayload,
): Promise<MiscFeeAllocation> {
  return request<MiscFeeAllocation>('/finance/misc-fee-allocations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listMiscFeeAllocationSummary(filters: {
  q?: string
  item_id?: string
  category?: string
  shipment_no?: string
  sales_user_id?: string
  status?: string
} = {}): Promise<MiscFeeAllocationList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.item_id) params.set('item_id', filters.item_id)
  if (filters.category) params.set('category', filters.category)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  if (filters.sales_user_id) params.set('sales_user_id', filters.sales_user_id)
  if (filters.status) params.set('status', filters.status)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<MiscFeeAllocationList>(`/finance/misc-fee-allocations/summary${suffix}`)
}

export function listFinancialSettlements(filters: {
  q?: string
  status?: string
  shipment_no?: string
} = {}): Promise<FinancialSettlementList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<FinancialSettlementList>(`/finance/settlements${suffix}`)
}

export function createFinancialSettlement(
  payload: FinancialSettlementCreatePayload,
): Promise<FinancialSettlement> {
  return request<FinancialSettlement>('/finance/settlements', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addManualProfitCost(
  settlementId: string,
  payload: ManualProfitCostCreatePayload,
): Promise<FinancialSettlement> {
  return request<FinancialSettlement>(`/finance/settlements/${settlementId}/manual-costs`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listProfitCalculations(filters: {
  q?: string
  shipment_no?: string
} = {}): Promise<ProfitCalculationList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.shipment_no) params.set('shipment_no', filters.shipment_no)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ProfitCalculationList>(`/finance/profit-calculations${suffix}`)
}

export function createScheduleEvent(payload: ScheduleCreatePayload): Promise<ScheduleEvent> {
  return request<ScheduleEvent>('/schedules', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteScheduleEvent(scheduleId: string): Promise<ScheduleEvent> {
  return request<ScheduleEvent>(`/schedules/${scheduleId}`, {
    method: 'DELETE',
  })
}

export function listProducts(q?: string): Promise<ProductList> {
  const params = q ? `?q=${encodeURIComponent(q)}` : ''
  return request<ProductList>(`/masterdata/products${params}`)
}

export function createProduct(payload: ProductCreatePayload): Promise<Product> {
  return request<Product>('/masterdata/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProduct(productId: string, payload: ProductUpdatePayload): Promise<Product> {
  return request<Product>(`/masterdata/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deactivateProduct(productId: string): Promise<Product> {
  return request<Product>(`/masterdata/products/${productId}`, {
    method: 'DELETE',
  })
}

export function addProductAccessory(
  productId: string,
  payload: ProductAccessoryPayload,
): Promise<ProductAccessory> {
  return request<ProductAccessory>(`/masterdata/products/${productId}/accessories`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProductAccessory(
  productId: string,
  accessoryId: string,
  payload: ProductAccessoryPayload,
): Promise<ProductAccessory> {
  return request<ProductAccessory>(`/masterdata/products/${productId}/accessories/${accessoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteProductAccessory(
  productId: string,
  accessoryId: string,
): Promise<ProductAccessory> {
  return request<ProductAccessory>(`/masterdata/products/${productId}/accessories/${accessoryId}`, {
    method: 'DELETE',
  })
}

export function exportProducts(): Promise<ProductExport> {
  return request<ProductExport>('/masterdata/products/export')
}

export function listCustomers(filters: {
  q?: string
  country?: string
  credit_grade?: string
} = {}): Promise<CustomerList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.country) params.set('country', filters.country)
  if (filters.credit_grade) params.set('credit_grade', filters.credit_grade)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<CustomerList>(`/masterdata/customers${suffix}`)
}

export function createCustomer(payload: CustomerCreatePayload): Promise<Customer> {
  return request<Customer>('/masterdata/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCustomer(
  customerId: string,
  payload: CustomerUpdatePayload,
): Promise<Customer> {
  return request<Customer>(`/masterdata/customers/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deactivateCustomer(customerId: string): Promise<Customer> {
  return request<Customer>(`/masterdata/customers/${customerId}`, {
    method: 'DELETE',
  })
}

export function addCustomerContact(
  customerId: string,
  payload: CustomerContactPayload,
): Promise<CustomerContact> {
  return request<CustomerContact>(`/masterdata/customers/${customerId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listCustomerTransactions(customerId: string): Promise<CustomerTransactionList> {
  return request<CustomerTransactionList>(`/masterdata/customers/${customerId}/transactions`)
}

export function listSuppliers(filters: {
  q?: string
  country?: string
  credit_grade?: string
} = {}): Promise<SupplierList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.country) params.set('country', filters.country)
  if (filters.credit_grade) params.set('credit_grade', filters.credit_grade)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SupplierList>(`/masterdata/suppliers${suffix}`)
}

export function createSupplier(payload: SupplierCreatePayload): Promise<Supplier> {
  return request<Supplier>('/masterdata/suppliers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSupplier(
  supplierId: string,
  payload: SupplierUpdatePayload,
): Promise<Supplier> {
  return request<Supplier>(`/masterdata/suppliers/${supplierId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deactivateSupplier(supplierId: string): Promise<Supplier> {
  return request<Supplier>(`/masterdata/suppliers/${supplierId}`, {
    method: 'DELETE',
  })
}

export function addSupplierContact(
  supplierId: string,
  payload: SupplierContactPayload,
): Promise<SupplierContact> {
  return request<SupplierContact>(`/masterdata/suppliers/${supplierId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listSupplierTransactions(supplierId: string): Promise<SupplierTransactionList> {
  return request<SupplierTransactionList>(`/masterdata/suppliers/${supplierId}/transactions`)
}

export function listPartners(filters: {
  q?: string
  partner_type?: string
} = {}): Promise<PartnerList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.partner_type) params.set('partner_type', filters.partner_type)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PartnerList>(`/masterdata/partners${suffix}`)
}

export function createPartner(payload: PartnerCreatePayload): Promise<Partner> {
  return request<Partner>('/masterdata/partners', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePartner(
  partnerId: string,
  payload: PartnerUpdatePayload,
): Promise<Partner> {
  return request<Partner>(`/masterdata/partners/${partnerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function addPartnerContact(
  partnerId: string,
  payload: PartnerContactPayload,
): Promise<PartnerContact> {
  return request<PartnerContact>(`/masterdata/partners/${partnerId}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPartnerFeeRecords(partnerId: string): Promise<PartnerFeeRecordList> {
  return request<PartnerFeeRecordList>(`/masterdata/partners/${partnerId}/fee-records`)
}

export function listDocumentParties(filters: {
  q?: string
  party_type?: string
  customer_id?: string
} = {}): Promise<DocumentPartyList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.party_type) params.set('party_type', filters.party_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<DocumentPartyList>(`/masterdata/document-parties${suffix}`)
}

export function createDocumentParty(
  payload: DocumentPartyCreatePayload,
): Promise<DocumentParty> {
  return request<DocumentParty>('/masterdata/document-parties', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDocumentParty(
  partyId: string,
  payload: DocumentPartyUpdatePayload,
): Promise<DocumentParty> {
  return request<DocumentParty>(`/masterdata/document-parties/${partyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deactivateDocumentParty(partyId: string): Promise<DocumentParty> {
  return request<DocumentParty>(`/masterdata/document-parties/${partyId}`, {
    method: 'DELETE',
  })
}

export function lookupDocumentParties(filters: {
  party_type: string
  customer_id?: string
}): Promise<DocumentPartyList> {
  const params = new URLSearchParams()
  params.set('party_type', filters.party_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  return request<DocumentPartyList>(`/masterdata/document-parties/lookup?${params.toString()}`)
}

export function listSampleRequests(filters: {
  q?: string
  status?: string
  customer_id?: string
} = {}): Promise<SampleRequestList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleRequestList>(`/sample/requests${suffix}`)
}

export function createSampleRequest(
  payload: SampleRequestCreatePayload,
): Promise<SampleRequest> {
  return request<SampleRequest>('/sample/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addSampleProgress(
  requestId: string,
  payload: SampleProgressPayload,
): Promise<SampleProgress> {
  return request<SampleProgress>(`/sample/requests/${requestId}/progress`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addSampleFee(requestId: string, payload: SampleFeePayload): Promise<SampleFee> {
  return request<SampleFee>(`/sample/requests/${requestId}/fees`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function requestSampleFeePayment(
  requestId: string,
  feeId: string,
): Promise<SampleFee> {
  return request<SampleFee>(`/sample/requests/${requestId}/fees/${feeId}/payment-request`, {
    method: 'POST',
  })
}

export function listSampleRecords(filters: {
  q?: string
  sample_type?: string
  customer_id?: string
  purchase_contract_id?: string
} = {}): Promise<SampleRecordList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.sample_type) params.set('sample_type', filters.sample_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.purchase_contract_id) {
    params.set('purchase_contract_id', filters.purchase_contract_id)
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleRecordList>(`/sample/records${suffix}`)
}

export function createSampleRecord(
  payload: SampleRecordCreatePayload,
): Promise<SampleRecord> {
  return request<SampleRecord>('/sample/records', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addSampleRecordImage(
  recordId: string,
  payload: SampleRecordImagePayload,
): Promise<SampleRecordImage> {
  return request<SampleRecordImage>(`/sample/records/${recordId}/images`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addSampleRecordStockEvent(
  recordId: string,
  payload: SampleRecordStockEventPayload,
): Promise<SampleRecordStockEvent> {
  return request<SampleRecordStockEvent>(`/sample/records/${recordId}/stock-events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listSampleDeliveries(filters: {
  q?: string
  status?: string
  customer_id?: string
  express_company?: string
} = {}): Promise<SampleDeliveryList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.express_company) params.set('express_company', filters.express_company)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleDeliveryList>(`/sample/deliveries${suffix}`)
}

export function createSampleDelivery(
  payload: SampleDeliveryCreatePayload,
): Promise<SampleDelivery> {
  return request<SampleDelivery>('/sample/deliveries', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSampleDelivery(
  deliveryId: string,
  payload: SampleDeliveryCreatePayload,
): Promise<SampleDelivery> {
  return request<SampleDelivery>(`/sample/deliveries/${deliveryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function submitSampleDelivery(deliveryId: string): Promise<SampleDelivery> {
  return request<SampleDelivery>(`/sample/deliveries/${deliveryId}/submit`, {
    method: 'POST',
  })
}

export function approveSampleDelivery(
  deliveryId: string,
  payload: SampleDeliveryApprovePayload,
): Promise<SampleDelivery> {
  return request<SampleDelivery>(`/sample/deliveries/${deliveryId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSampleDeliveryTracking(
  deliveryId: string,
  payload: SampleDeliveryTrackingPayload,
): Promise<SampleDelivery> {
  return request<SampleDelivery>(`/sample/deliveries/${deliveryId}/tracking`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getSampleDeliveryFeeStatistics(filters: {
  customer_id?: string
  date_from?: string
  date_to?: string
  express_company?: string
} = {}): Promise<SampleDeliveryFeeStatistics> {
  const params = new URLSearchParams()
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.express_company) params.set('express_company', filters.express_company)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleDeliveryFeeStatistics>(`/sample/deliveries/fee-statistics${suffix}`)
}

export function getSampleDeliverySampleHistory(
  sampleRecordId: string,
): Promise<SampleDeliveryList> {
  return request<SampleDeliveryList>(`/sample/deliveries/history/sample/${sampleRecordId}`)
}

export function getSampleDeliveryQuoteHistory(filters: {
  customer_id?: string
  product_id?: string
} = {}): Promise<SampleDeliveryList> {
  const params = new URLSearchParams()
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SampleDeliveryList>(`/sample/deliveries/quote-history${suffix}`)
}

export function listExportQuotations(filters: {
  q?: string
  approval_status?: string
  customer_id?: string
} = {}): Promise<ExportQuotationList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.approval_status) params.set('approval_status', filters.approval_status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ExportQuotationList>(`/sales/quotations${suffix}`)
}

export function createExportQuotation(
  payload: ExportQuotationCreatePayload,
): Promise<ExportQuotation> {
  return request<ExportQuotation>('/sales/quotations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateExportQuotation(
  quotationId: string,
  payload: ExportQuotationCreatePayload,
): Promise<ExportQuotation> {
  return request<ExportQuotation>(`/sales/quotations/${quotationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function submitExportQuotation(quotationId: string): Promise<ExportQuotation> {
  return request<ExportQuotation>(`/sales/quotations/${quotationId}/submit`, {
    method: 'POST',
  })
}

export function approveExportQuotation(
  quotationId: string,
  payload: ExportQuotationApprovePayload,
): Promise<ExportQuotation> {
  return request<ExportQuotation>(`/sales/quotations/${quotationId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function confirmExportQuotationContract(
  quotationId: string,
  payload: ExportQuotationConfirmContractPayload,
): Promise<ExportQuotationContract> {
  return request<ExportQuotationContract>(`/sales/quotations/${quotationId}/confirm-contract`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getExportQuotationHistory(filters: {
  customer_id?: string
  product_id?: string
} = {}): Promise<ExportQuotationList> {
  const params = new URLSearchParams()
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ExportQuotationList>(`/sales/quotations/history${suffix}`)
}

export function getExportQuotationPurchaseReferences(filters: {
  product_id?: string
} = {}): Promise<ExportQuotationPurchaseReferenceList> {
  const params = new URLSearchParams()
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ExportQuotationPurchaseReferenceList>(
    `/sales/quotations/purchase-references${suffix}`,
  )
}

export function getExportQuotationSampleDeliveries(
  quotationId: string,
): Promise<SampleDeliveryList> {
  return request<SampleDeliveryList>(`/sales/quotations/${quotationId}/sample-deliveries`)
}

export function exportExportQuotation(
  quotationId: string,
  format: 'pdf' | 'excel',
): Promise<ExportQuotationExport> {
  return request<ExportQuotationExport>(`/sales/quotations/${quotationId}/export?format=${format}`)
}

export function listExportContracts(filters: {
  q?: string
  approval_status?: string
  customer_id?: string
} = {}): Promise<ExportContractList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.approval_status) params.set('approval_status', filters.approval_status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ExportContractList>(`/sales/contracts${suffix}`)
}

export function createExportContract(
  payload: ExportContractCreatePayload,
): Promise<ExportContract> {
  return request<ExportContract>('/sales/contracts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateExportContract(
  contractId: string,
  payload: ExportContractCreatePayload,
): Promise<ExportContract> {
  return request<ExportContract>(`/sales/contracts/${contractId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function submitExportContract(contractId: string): Promise<ExportContract> {
  return request<ExportContract>(`/sales/contracts/${contractId}/submit`, {
    method: 'POST',
  })
}

export function approveExportContract(
  contractId: string,
  payload: ExportContractApprovePayload,
): Promise<ExportContract> {
  return request<ExportContract>(`/sales/contracts/${contractId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function registerExportContractSignature(
  contractId: string,
  payload: ExportContractSignaturePayload,
): Promise<ExportContract> {
  return request<ExportContract>(`/sales/contracts/${contractId}/signature`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function addExportContractAdvancePayment(
  contractId: string,
  payload: ExportContractAdvancePaymentPayload,
): Promise<ExportContractAdvancePayment> {
  return request<ExportContractAdvancePayment>(`/sales/contracts/${contractId}/advance-payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function exportExportContract(
  contractId: string,
  format: 'pdf' | 'excel',
): Promise<ExportContractExport> {
  return request<ExportContractExport>(`/sales/contracts/${contractId}/export?format=${format}`)
}

export function listShipments(filters: {
  q?: string
  approval_status?: string
  customer_id?: string
  contract_id?: string
} = {}): Promise<ShipmentPlanList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.approval_status) params.set('approval_status', filters.approval_status)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.contract_id) params.set('contract_id', filters.contract_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ShipmentPlanList>(`/sales/shipments${suffix}`)
}

export function generateShipmentFromContracts(
  payload: ShipmentPlanGeneratePayload,
): Promise<ShipmentPlan> {
  return request<ShipmentPlan>('/sales/shipments/from-contracts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitShipment(shipmentId: string): Promise<ShipmentPlan> {
  return request<ShipmentPlan>(`/sales/shipments/${shipmentId}/submit`, {
    method: 'POST',
  })
}

export function approveShipment(
  shipmentId: string,
  payload: ShipmentApprovePayload,
): Promise<ShipmentPlan> {
  return request<ShipmentPlan>(`/sales/shipments/${shipmentId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listShipmentReminders(): Promise<ShipmentReminderList> {
  return request<ShipmentReminderList>('/sales/shipments/reminders')
}

export function listOutboundPlans(filters: {
  q?: string
  status?: string
  outbound_type?: string
  source_type?: string
  customer_id?: string
  source_id?: string
} = {}): Promise<OutboundPlanList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.outbound_type) params.set('outbound_type', filters.outbound_type)
  if (filters.source_type) params.set('source_type', filters.source_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.source_id) params.set('source_id', filters.source_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<OutboundPlanList>(`/warehouse/outbound-plans${suffix}`)
}

export function generateOutboundPlanFromShipment(
  payload: OutboundPlanGeneratePayload,
): Promise<OutboundPlan> {
  return request<OutboundPlan>('/warehouse/outbound-plans/from-shipment', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function scheduleOutboundPlan(
  planId: string,
  payload: OutboundPlanSchedulePayload,
): Promise<OutboundPlan> {
  return request<OutboundPlan>(`/warehouse/outbound-plans/${planId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listOutboundOrders(filters: {
  q?: string
  status?: string
  outbound_mode?: string
  outbound_type?: string
  customer_id?: string
  source_id?: string
} = {}): Promise<OutboundOrderList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.outbound_mode) params.set('outbound_mode', filters.outbound_mode)
  if (filters.outbound_type) params.set('outbound_type', filters.outbound_type)
  if (filters.customer_id) params.set('customer_id', filters.customer_id)
  if (filters.source_id) params.set('source_id', filters.source_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<OutboundOrderList>(`/warehouse/outbound-orders${suffix}`)
}

export function generateOutboundOrderFromPlan(
  payload: OutboundOrderGeneratePayload,
): Promise<OutboundOrder> {
  return request<OutboundOrder>('/warehouse/outbound-orders/from-plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitOutboundOrder(orderId: string): Promise<OutboundOrder> {
  return request<OutboundOrder>(`/warehouse/outbound-orders/${orderId}/submit`, {
    method: 'POST',
  })
}

export function approveOutboundOrder(
  orderId: string,
  payload: OutboundOrderApprovePayload,
): Promise<OutboundOrder> {
  return request<OutboundOrder>(`/warehouse/outbound-orders/${orderId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPurchaseContracts(filters: {
  q?: string
  approval_status?: string
  supplier_id?: string
  source_type?: string
} = {}): Promise<PurchaseContractList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.approval_status) params.set('approval_status', filters.approval_status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.source_type) params.set('source_type', filters.source_type)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PurchaseContractList>(`/purchase/contracts${suffix}`)
}

export function createPurchaseContract(
  payload: PurchaseContractCreatePayload,
): Promise<PurchaseContract> {
  return request<PurchaseContract>('/purchase/contracts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePurchaseContract(
  contractId: string,
  payload: PurchaseContractCreatePayload,
): Promise<PurchaseContract> {
  return request<PurchaseContract>(`/purchase/contracts/${contractId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function generatePurchaseContractFromExportContracts(
  payload: PurchaseContractGeneratePayload,
): Promise<PurchaseContract> {
  return request<PurchaseContract>('/purchase/contracts/generate-from-export-contracts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitPurchaseContract(contractId: string): Promise<PurchaseContract> {
  return request<PurchaseContract>(`/purchase/contracts/${contractId}/submit`, {
    method: 'POST',
  })
}

export function approvePurchaseContract(
  contractId: string,
  payload: PurchaseContractApprovePayload,
): Promise<PurchaseContract> {
  return request<PurchaseContract>(`/purchase/contracts/${contractId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPurchaseContractReminders(): Promise<PurchaseContractReminderList> {
  return request<PurchaseContractReminderList>('/purchase/contracts/reminders')
}

export function listInboundPlans(filters: {
  q?: string
  inbound_type?: string
  status?: string
  supplier_id?: string
  purchase_contract_id?: string
} = {}): Promise<InboundPlanList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.inbound_type) params.set('inbound_type', filters.inbound_type)
  if (filters.status) params.set('status', filters.status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_id) params.set('purchase_contract_id', filters.purchase_contract_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<InboundPlanList>(`/warehouse/inbound-plans${suffix}`)
}

export function generateInboundPlanFromPurchaseContract(
  payload: InboundPlanGeneratePayload,
): Promise<InboundPlan> {
  return request<InboundPlan>('/warehouse/inbound-plans/from-purchase-contract', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function scheduleInboundPlan(
  planId: string,
  payload: InboundPlanSchedulePayload,
): Promise<InboundPlan> {
  return request<InboundPlan>(`/warehouse/inbound-plans/${planId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listInboundOrders(filters: {
  q?: string
  status?: string
  inbound_mode?: string
  supplier_id?: string
  purchase_contract_id?: string
} = {}): Promise<InboundOrderList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.inbound_mode) params.set('inbound_mode', filters.inbound_mode)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_id) params.set('purchase_contract_id', filters.purchase_contract_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<InboundOrderList>(`/warehouse/inbound-orders${suffix}`)
}

export function generateInboundOrderFromPlan(
  payload: InboundOrderGeneratePayload,
): Promise<InboundOrder> {
  return request<InboundOrder>('/warehouse/inbound-orders/from-plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function submitInboundOrder(orderId: string): Promise<InboundOrder> {
  return request<InboundOrder>(`/warehouse/inbound-orders/${orderId}/submit`, {
    method: 'POST',
  })
}

export function approveInboundOrder(
  orderId: string,
  payload: InboundOrderApprovePayload,
): Promise<InboundOrder> {
  return request<InboundOrder>(`/warehouse/inbound-orders/${orderId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listInventoryBalances(filters: {
  q?: string
  warehouse_id?: string
  location_id?: string
  product_id?: string
} = {}): Promise<InventoryBalanceList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.warehouse_id) params.set('warehouse_id', filters.warehouse_id)
  if (filters.location_id) params.set('location_id', filters.location_id)
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<InventoryBalanceList>(`/warehouse/inbound-orders/inventory-balances${suffix}`)
}

export function listInventoryLedgers(filters: {
  q?: string
  source_id?: string
  product_id?: string
} = {}): Promise<InventoryLedgerList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.source_id) params.set('source_id', filters.source_id)
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<InventoryLedgerList>(`/warehouse/inbound-orders/inventory-ledgers${suffix}`)
}

export function listPurchaseInvoiceNotices(filters: {
  q?: string
  status?: string
  supplier_id?: string
  customs_declaration_id?: string
} = {}): Promise<PurchaseInvoiceNoticeList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.customs_declaration_id) {
    params.set('customs_declaration_id', filters.customs_declaration_id)
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PurchaseInvoiceNoticeList>(`/purchase/invoice-notices${suffix}`)
}

export function generatePurchaseInvoiceNoticesFromDeclaration(
  payload: PurchaseInvoiceNoticeGeneratePayload,
): Promise<PurchaseInvoiceNoticeList> {
  return request<PurchaseInvoiceNoticeList>('/purchase/invoice-notices/from-customs-declaration', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function sendPurchaseInvoiceNotice(
  noticeId: string,
  payload: PurchaseInvoiceNoticeSendPayload,
): Promise<PurchaseInvoiceNotice> {
  return request<PurchaseInvoiceNotice>(`/purchase/invoice-notices/${noticeId}/send`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function receivePurchaseInvoiceNoticeTaxInvoice(
  noticeId: string,
  payload: PurchaseInvoiceNoticeReceivePayload,
): Promise<PurchaseInvoiceNotice> {
  return request<PurchaseInvoiceNotice>(
    `/purchase/invoice-notices/${noticeId}/receive-tax-invoice`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function listPurchaseInvoiceNoticeReminders(): Promise<PurchaseInvoiceNoticeReminderList> {
  return request<PurchaseInvoiceNoticeReminderList>('/purchase/invoice-notices/reminders')
}

export function listFollowupTemplates(): Promise<FollowProcessTemplateList> {
  return request<FollowProcessTemplateList>('/followup/templates')
}

export function createFollowupTemplate(
  payload: FollowProcessTemplatePayload,
): Promise<FollowProcessTemplate> {
  return request<FollowProcessTemplate>('/followup/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateFollowupTemplate(
  templateId: string,
  payload: FollowProcessTemplatePayload,
): Promise<FollowProcessTemplate> {
  return request<FollowProcessTemplate>(`/followup/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function listFollowupPlans(filters: {
  q?: string
  overall_status?: string
  supplier_id?: string
  purchase_contract_id?: string
} = {}): Promise<PurchaseFollowPlanList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.overall_status) params.set('overall_status', filters.overall_status)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_id) params.set('purchase_contract_id', filters.purchase_contract_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PurchaseFollowPlanList>(`/followup/plans${suffix}`)
}

export function generateFollowupPlanFromPurchaseContract(
  payload: PurchaseFollowPlanGeneratePayload,
): Promise<PurchaseFollowPlan> {
  return request<PurchaseFollowPlan>('/followup/plans/from-purchase-contract', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function syncFollowupSampleEvents(
  payload: PurchaseFollowPlanGeneratePayload,
): Promise<PurchaseFollowPlan> {
  return request<PurchaseFollowPlan>('/followup/sample-events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function syncFollowupSourceEvent(
  payload: FollowSourceEventPayload,
): Promise<PurchaseFollowPlan> {
  return request<PurchaseFollowPlan>('/followup/source-events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listFollowupOverdueNodes(asOf: string): Promise<PurchaseFollowOverdueNodeList> {
  return request<PurchaseFollowOverdueNodeList>(`/followup/overdue-nodes?as_of=${asOf}`)
}

export function listQualityInspections(filters: {
  q?: string
  result?: string
  supplier_id?: string
  purchase_contract_id?: string
} = {}): Promise<QualityInspectionList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.result) params.set('result', filters.result)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  if (filters.purchase_contract_id) {
    params.set('purchase_contract_id', filters.purchase_contract_id)
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<QualityInspectionList>(`/quality/inspections${suffix}`)
}

export function createQualityInspection(
  payload: QualityInspectionPayload,
): Promise<QualityInspection> {
  return request<QualityInspection>('/quality/inspections', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateQualityInspection(
  inspectionId: string,
  payload: QualityInspectionPayload,
): Promise<QualityInspection> {
  return request<QualityInspection>(`/quality/inspections/${inspectionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function getQualityInboundEligibility(
  purchaseContractId: string,
): Promise<QualityInspectionInboundEligibility> {
  const params = new URLSearchParams({ purchase_contract_id: purchaseContractId })
  return request<QualityInspectionInboundEligibility>(
    `/quality/inspections/inbound-eligibility?${params.toString()}`,
  )
}

export function listPurchaseInquiries(filters: {
  q?: string
  status?: string
  product_id?: string
  supplier_id?: string
} = {}): Promise<PurchaseInquiryList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.product_id) params.set('product_id', filters.product_id)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PurchaseInquiryList>(`/purchase/inquiries${suffix}`)
}

export function createPurchaseInquiry(
  payload: PurchaseInquiryCreatePayload,
): Promise<PurchaseInquiry> {
  return request<PurchaseInquiry>('/purchase/inquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePurchaseInquiry(
  inquiryId: string,
  payload: PurchaseInquiryCreatePayload,
): Promise<PurchaseInquiry> {
  return request<PurchaseInquiry>(`/purchase/inquiries/${inquiryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function addPurchaseInquiryQuotation(
  inquiryId: string,
  payload: SupplierQuotationPayload,
): Promise<PurchaseInquiry> {
  return request<PurchaseInquiry>(`/purchase/inquiries/${inquiryId}/quotations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function sendPurchaseInquiryTemplate(
  inquiryId: string,
  payload: PurchaseInquiryTemplatePayload,
): Promise<PurchaseInquiryTemplate> {
  return request<PurchaseInquiryTemplate>(`/purchase/inquiries/${inquiryId}/send-template`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listPurchaseInquirySupplierSamples(filters: {
  product_id?: string
  supplier_id?: string
} = {}): Promise<SupplierSampleEvidenceList> {
  const params = new URLSearchParams()
  if (filters.product_id) params.set('product_id', filters.product_id)
  if (filters.supplier_id) params.set('supplier_id', filters.supplier_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<SupplierSampleEvidenceList>(`/purchase/inquiries/supplier-samples${suffix}`)
}

export function listPurchaseInquiryReferences(filters: {
  product_id?: string
} = {}): Promise<PurchaseInquiryReferenceList> {
  const params = new URLSearchParams()
  if (filters.product_id) params.set('product_id', filters.product_id)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<PurchaseInquiryReferenceList>(`/purchase/inquiries/references${suffix}`)
}
