// Finance page shared types, form states, and helper functions
// Extracted from FinancePage.tsx during refactor

import { Tag } from 'antd'
import type { FormEvent, ReactNode } from 'react'
import type {
  BankReceipt,
  BankReceiptAllocationPayload,
  BankReceiptClaimPayload,
  BankReceiptCreatePayload,
  CustomsReceiptRegisterPayload,
  FeePayableItem,
  FeePaymentRequest,
  FeePaymentRequestApprovePayload,
  FeePaymentRequestCreatePayload,
  FinancialSettlement,
  FinancialSettlementCreatePayload,
  PayableItem,
  PaymentRequestApprovePayload,
  PaymentRequestCreatePayload,
  PartnerFeeInvoice,
  PartnerFeeInvoiceCreatePayload,
  ManualProfitCostCreatePayload,
  Reimbursement,
  ReimbursementCreatePayload as _ReimbursementCreatePayload,
  ReimbursementItemCreatePayload as _ReimbursementItemCreatePayload,
  SupplierInvoice,
  SupplierInvoiceCreatePayload,
  VerificationDocument,
  VerificationDocumentCreatePayload,
  VerificationUsageItem,
  VerificationRegisterPayload,
  TaxRefundRegisterPayload,
  MiscFeeItem,
  MiscFeeItemCreatePayload,
  MiscFeeAllocationCreatePayload,
  FinanceOverview,
  ReceivableItem,
  SupplierPaymentRequest,
  MiscFeeAllocation,
  PortImportBatch,
  PortImportBatchCreatePayload as _PortImportBatchCreatePayload,
  CustomsDeclarationRecord,
  CustomsDeclarationRecordCreatePayload as _CustomsDeclarationRecordCreatePayload,
  FinanceReportExplanation,
  FinanceReportDrilldown,
  ReceiptUsageDetailReport,
  BankReceiptSummaryReport,
  GoodsPaymentQueryReport,
  FeePaymentQueryReport,
  CustomsReceiptCollectionReport,
  TaxRefundStatisticsReport,
} from '../../../api'
import { translate, type TranslationKey } from '../../../locales'
import { daysFromTodayInputValue, emptyToNull, getRuntimeSettings, todayInputValue } from '../appHelpers'
import { type LocalizedOption, allocationTypeOptions, feePaymentRequestStatusOptions, feeTypeOptions, miscFeeAllocationMethodOptions, miscFeeCategoryOptions, miscFeeItemStatusOptions, partnerFeeInvoiceStatusOptions, paymentRequestStatusOptions, paymentTypeOptions, profitCostTypeOptions, purchaseInvoiceNoticeStatusOptions, receiptStatusOptions, receiptTypeOptions, reportingDocumentTypeOptions, reportingStatusOptions, sampleFeeTypeOptions, settlementStatusOptions, shipmentStatusOptions, supplierInvoiceStatusOptions, verificationDocumentStatusOptions, verificationReminderStatusOptions } from '../../../shared/formOptions'

import type { FinanceModule } from '../../routes'

function optionLabel(options: LocalizedOption[], value: string): string {
  const option = options.find((item) => item.value === value)
  return option ? translate(getRuntimeSettings().language, option.labelKey) : value
}

export function shipmentStatusLabel(value: string): string {
  const option = shipmentStatusOptions.find((item) => item.value === value)
  return option ? translate(getRuntimeSettings().language, option.labelKey) : value
}

export function purchaseInvoiceNoticeStatusLabel(value: string): string {
  const option = purchaseInvoiceNoticeStatusOptions.find((item) => item.value === value)
  return option ? translate(getRuntimeSettings().language, option.labelKey) : value
}

export function samplePaymentStatusLabel(value: string): string {
  return optionLabel(sampleFeeTypeOptions, value)
}


export type BankReceiptFormState = {
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

export type ReceiptClaimFormState = {
  claimed_at: string
  sales_user_id: string
  sales_user_name: string
  note: string
}

export type ReceiptAllocationFormState = {
  allocation_type: string
  contract_id: string
  contract_no: string
  invoice_no: string
  allocated_at: string
  amount: string
  currency: string
  remark: string
}

export type SupplierInvoiceFormState = {
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

export type PaymentRequestFormState = {
  request_no: string
  supplier_invoice_id: string
  payment_type: string
  request_date: string
  requested_amount: string
  currency: string
  reviewer_id: string
  remark: string
}

export type PaymentApprovalFormState = {
  approved_amount: string
  approved_at: string
  reviewer_name: string
  payment_account: string
  remark: string
}

export type PartnerFeeInvoiceFormState = {
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

export type FeePaymentRequestFormState = {
  request_no: string
  partner_fee_invoice_id: string
  request_date: string
  requested_amount: string
  currency: string
  reviewer_id: string
  remark: string
}

export type FeePaymentApprovalFormState = {
  approved_amount: string
  approved_at: string
  reviewer_name: string
  payment_account: string
  remark: string
}

export type VerificationDocumentFormState = {
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

export type CustomsReceiptFormState = {
  customs_declaration_no: string
  customs_receipt_no: string
  received_at: string
  remark: string
}

export type VerificationRegisterFormState = {
  verification_no: string
  verified_at: string
  remark: string
}

export type TaxRefundFormState = {
  refund_no: string
  refunded_at: string
  amount: string
  currency: string
  bank_receipt_no: string
  remark: string
}

export type MiscFeeItemFormState = {
  code: string
  name: string
  category: string
  default_allocation_method: string
  is_active: boolean
  remark: string
}

export type MiscFeeAllocationFormState = {
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

export type FinancialSettlementFormState = {
  settlement_no: string
  shipment_plan_id: string
  shipment_no: string
  settlement_date: string
  remark: string
}

export type ManualProfitCostFormState = {
  cost_no: string
  cost_type: string
  cost_date: string
  amount: string
  currency: string
  source_no: string
  reason: string
  remark: string
}



export function initialBankReceiptForm(): BankReceiptFormState {
  return {
    receipt_no: '',
    received_at: todayInputValue(),
    payer_name: '',
    customer_id: '',
    customer_name: '',
    amount: '',
    currency: 'USD',
    bank_account: '',
    reference_no: '',
    receipt_type: 'advance',
    remark: '',
  }
}

export function initialReceiptClaimForm(): ReceiptClaimFormState {
  return {
    claimed_at: todayInputValue(),
    sales_user_id: '',
    sales_user_name: '',
    note: '',
  }
}

export function initialReceiptAllocationForm(currency = 'USD'): ReceiptAllocationFormState {
  return {
    allocation_type: 'contract',
    contract_id: '',
    contract_no: '',
    invoice_no: '',
    allocated_at: todayInputValue(),
    amount: '',
    currency,
    remark: '',
  }
}

export function bankReceiptPayload(form: BankReceiptFormState): BankReceiptCreatePayload {
  return {
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

export function receiptClaimPayload(form: ReceiptClaimFormState): BankReceiptClaimPayload {
  return {
    claimed_at: form.claimed_at,
    sales_user_id: emptyToNull(form.sales_user_id),
    sales_user_name: emptyToNull(form.sales_user_name),
    note: emptyToNull(form.note),
  }
}

export function receiptAllocationPayload(
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

export function receiptStatusLabel(value: string): string {
  return optionLabel(receiptStatusOptions, value)
}

export function receiptStatusColor(value: string): string {
  if (value === 'allocated') return 'success'
  if (value === 'partially_allocated') return 'processing'
  if (value === 'claimed') return 'warning'
  return 'default'
}

export function receiptStatusTag(value: string): ReactNode {
  return <Tag color={receiptStatusColor(value)}>{receiptStatusLabel(value)}</Tag>
}

export function receiptTypeLabel(value: string): string {
  return optionLabel(receiptTypeOptions, value)
}

export function allocationTypeLabel(value: string): string {
  return optionLabel(allocationTypeOptions, value)
}

export function receivableStatusLabel(value: string): string {
  if (value === 'paid') return translate(getRuntimeSettings().language, 'finance.receivable.status.paid')
  if (value === 'partial') return translate(getRuntimeSettings().language, 'finance.receivable.status.partial')
  return translate(getRuntimeSettings().language, 'finance.receivable.status.unpaid')
}

export function receivableStatusTag(value: string): ReactNode {
  const color = value === 'paid' ? 'success' : value === 'partial' ? 'warning' : 'default'
  return <Tag color={color}>{receivableStatusLabel(value)}</Tag>
}

export function initialSupplierInvoiceForm(): SupplierInvoiceFormState {
  return {
    invoice_no: '',
    invoice_date: todayInputValue(),
    supplier_id: '',
    supplier_name: '',
    purchase_invoice_notice_id: '',
    purchase_invoice_notice_code: '',
    purchase_contract_id: '',
    purchase_contract_no: '',
    total_amount: '',
    currency: 'CNY',
    due_date: daysFromTodayInputValue(30),
    remark: '',
  }
}

export function initialPaymentRequestForm(invoice?: SupplierInvoice): PaymentRequestFormState {
  return {
    request_no: '',
    supplier_invoice_id: invoice?.id ?? '',
    payment_type: 'goods_payment',
    request_date: todayInputValue(),
    requested_amount: invoice?.unpaid_amount ?? '',
    currency: invoice?.currency ?? 'CNY',
    reviewer_id: '',
    remark: '',
  }
}

export function initialPaymentApprovalForm(
  amount = '',
  reviewerName = '',
): PaymentApprovalFormState {
  return {
    approved_amount: amount,
    approved_at: todayInputValue(),
    reviewer_name: reviewerName,
    payment_account: '',
    remark: '',
  }
}

export function supplierInvoicePayload(form: SupplierInvoiceFormState): SupplierInvoiceCreatePayload {
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

export function paymentRequestPayload(form: PaymentRequestFormState): PaymentRequestCreatePayload {
  return {
    supplier_invoice_id: form.supplier_invoice_id.trim(),
    payment_type: form.payment_type,
    request_date: form.request_date,
    requested_amount: form.requested_amount.trim(),
    currency: form.currency.trim(),
    reviewer_id: form.reviewer_id,
    remark: emptyToNull(form.remark),
  }
}

export function paymentApprovalPayload(form: PaymentApprovalFormState): PaymentRequestApprovePayload {
  return {
    approved_amount: form.approved_amount.trim(),
    approved_at: form.approved_at,
    payment_account: emptyToNull(form.payment_account),
    remark: emptyToNull(form.remark),
  }
}

export function supplierInvoiceStatusLabel(value: string): string {
  return optionLabel(supplierInvoiceStatusOptions, value)
}

export function supplierInvoiceStatusTag(value: string): ReactNode {
  const color = value === 'paid' ? 'success' : value === 'partial' ? 'warning' : 'default'
  return <Tag color={color}>{supplierInvoiceStatusLabel(value)}</Tag>
}

export function paymentRequestStatusLabel(value: string): string {
  return optionLabel(paymentRequestStatusOptions, value)
}

export function paymentRequestStatusTag(value: string): ReactNode {
  const color = value === 'approved' ? 'success' : value === 'submitted' ? 'processing' : 'error'
  return <Tag color={color}>{paymentRequestStatusLabel(value)}</Tag>
}

export function paymentTypeLabel(value: string): string {
  return optionLabel(paymentTypeOptions, value)
}

export function initialPartnerFeeInvoiceForm(): PartnerFeeInvoiceFormState {
  return {
    invoice_no: '',
    invoice_date: todayInputValue(),
    partner_id: '',
    partner_name: '',
    partner_type: 'freight_forwarder',
    shipment_plan_id: '',
    shipment_no: '',
    sales_user_id: '',
    sales_user_name: '',
    fee_type: 'freight',
    total_amount: '',
    currency: 'USD',
    due_date: daysFromTodayInputValue(30),
    remark: '',
  }
}

export function initialFeePaymentRequestForm(invoice?: PartnerFeeInvoice): FeePaymentRequestFormState {
  return {
    request_no: '',
    partner_fee_invoice_id: invoice?.id ?? '',
    request_date: todayInputValue(),
    requested_amount: invoice?.unpaid_amount ?? '',
    currency: invoice?.currency ?? 'USD',
    reviewer_id: '',
    remark: '',
  }
}

export function initialFeePaymentApprovalForm(
  amount = '',
  reviewerName = '',
): FeePaymentApprovalFormState {
  return {
    approved_amount: amount,
    approved_at: todayInputValue(),
    reviewer_name: reviewerName,
    payment_account: '',
    remark: '',
  }
}

export function partnerFeeInvoicePayload(form: PartnerFeeInvoiceFormState): PartnerFeeInvoiceCreatePayload {
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

export function feePaymentRequestPayload(form: FeePaymentRequestFormState): FeePaymentRequestCreatePayload {
  return {
    partner_fee_invoice_id: form.partner_fee_invoice_id.trim(),
    request_date: form.request_date,
    requested_amount: form.requested_amount.trim(),
    currency: form.currency.trim(),
    reviewer_id: form.reviewer_id,
    remark: emptyToNull(form.remark),
  }
}

export function feePaymentApprovalPayload(form: FeePaymentApprovalFormState): FeePaymentRequestApprovePayload {
  return {
    approved_amount: form.approved_amount.trim(),
    approved_at: form.approved_at,
    payment_account: emptyToNull(form.payment_account),
    remark: emptyToNull(form.remark),
  }
}

export function partnerFeeInvoiceStatusLabel(value: string): string {
  return optionLabel(partnerFeeInvoiceStatusOptions, value)
}

export function partnerFeeInvoiceStatusTag(value: string): ReactNode {
  const color = value === 'paid' ? 'success' : value === 'partial' ? 'warning' : 'default'
  return <Tag color={color}>{partnerFeeInvoiceStatusLabel(value)}</Tag>
}

export function feePaymentRequestStatusLabel(value: string): string {
  return optionLabel(feePaymentRequestStatusOptions, value)
}

export function feePaymentRequestStatusTag(value: string): ReactNode {
  const color = value === 'approved' ? 'success' : value === 'submitted' ? 'processing' : 'error'
  return <Tag color={color}>{feePaymentRequestStatusLabel(value)}</Tag>
}

export function feeTypeLabel(value: string): string {
  return optionLabel(feeTypeOptions, value)
}

export function initialVerificationDocumentForm(): VerificationDocumentFormState {
  return {
    document_no: '',
    received_at: todayInputValue(),
    owner_user_id: '',
    owner_user_name: '',
    shipment_plan_id: '',
    shipment_no: '',
    customer_name: '',
    currency: 'USD',
    refundable_amount: '',
    valid_until: daysFromTodayInputValue(30),
    remark: '',
  }
}

export function initialCustomsReceiptForm(): CustomsReceiptFormState {
  return {
    customs_declaration_no: '',
    customs_receipt_no: '',
    received_at: todayInputValue(),
    remark: '',
  }
}

export function initialVerificationRegisterForm(): VerificationRegisterFormState {
  return {
    verification_no: '',
    verified_at: todayInputValue(),
    remark: '',
  }
}

export function initialTaxRefundForm(currency = 'USD', amount = ''): TaxRefundFormState {
  return {
    refund_no: '',
    refunded_at: todayInputValue(),
    amount,
    currency,
    bank_receipt_no: '',
    remark: '',
  }
}

export function verificationDocumentPayload(
  form: VerificationDocumentFormState,
): VerificationDocumentCreatePayload {
  return {
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

export function customsReceiptPayload(form: CustomsReceiptFormState): CustomsReceiptRegisterPayload {
  return {
    customs_declaration_no: form.customs_declaration_no.trim(),
    customs_receipt_no: form.customs_receipt_no.trim(),
    received_at: form.received_at,
    remark: emptyToNull(form.remark),
  }
}

export function verificationRegisterPayload(form: VerificationRegisterFormState): VerificationRegisterPayload {
  return {
    verified_at: form.verified_at,
    remark: emptyToNull(form.remark),
  }
}

export function taxRefundPayload(form: TaxRefundFormState): TaxRefundRegisterPayload {
  return {
    refunded_at: form.refunded_at,
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    bank_receipt_no: emptyToNull(form.bank_receipt_no),
    remark: emptyToNull(form.remark),
  }
}

export function verificationDocumentStatusLabel(value: string): string {
  return optionLabel(verificationDocumentStatusOptions, value)
}

export function verificationDocumentStatusTag(value: string): ReactNode {
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

export function verificationReminderStatusLabel(value: string): string {
  return optionLabel(verificationReminderStatusOptions, value)
}

export function verificationReminderStatusTag(value: string): ReactNode {
  const color = value === 'done' ? 'success' : value === 'overdue' ? 'error' : 'default'
  return <Tag color={color}>{verificationReminderStatusLabel(value)}</Tag>
}

export function initialMiscFeeItemForm(): MiscFeeItemFormState {
  return {
    code: `MISC-${Date.now().toString().slice(-6)}`,
    name: '',
    category: 'office',
    default_allocation_method: 'manual',
    is_active: true,
    remark: '',
  }
}

export function initialMiscFeeAllocationForm(item?: MiscFeeItem): MiscFeeAllocationFormState {
  return {
    allocation_no: '',
    item_id: item?.id ?? '',
    shipment_plan_id: '',
    shipment_no: '',
    sales_user_id: '',
    sales_user_name: '',
    allocated_at: todayInputValue(),
    amount: '',
    currency: 'USD',
    allocation_method: item?.default_allocation_method ?? 'manual',
    basis: '',
    remark: '',
  }
}

export function miscFeeItemPayload(form: MiscFeeItemFormState): MiscFeeItemCreatePayload {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    category: form.category,
    default_allocation_method: form.default_allocation_method,
    is_active: form.is_active,
    remark: emptyToNull(form.remark),
  }
}

export function miscFeeAllocationPayload(
  form: MiscFeeAllocationFormState,
  selectedItem: MiscFeeItem | null,
): MiscFeeAllocationCreatePayload {
  return {
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

export function miscFeeCategoryLabel(value: string): string {
  return optionLabel(miscFeeCategoryOptions, value)
}

export function miscFeeAllocationMethodLabel(value: string): string {
  return optionLabel(miscFeeAllocationMethodOptions, value)
}

export function miscFeeItemStatusLabel(value: string): string {
  return optionLabel(miscFeeItemStatusOptions, value)
}

export function miscFeeItemStatusTag(value: string): ReactNode {
  const color = value === 'active' ? 'success' : 'default'
  return <Tag color={color}>{miscFeeItemStatusLabel(value)}</Tag>
}

export function reimbursementCategoryLabel(value: string): string {
  const labelKeys: Record<string, TranslationKey> = {
    travel: 'finance.reimbursement.category.travel',
    office: 'finance.reimbursement.category.office',
    entertainment: 'finance.reimbursement.category.entertainment',
    other: 'finance.reimbursement.category.other',
  }
  const labelKey = labelKeys[value]
  return labelKey ? translate(getRuntimeSettings().language, labelKey) : value
}

export function reimbursementStatusTag(value: string): ReactNode {
  const config: Record<string, { color: string; labelKey: TranslationKey }> = {
    submitted: { color: 'processing', labelKey: 'finance.reimbursement.status.submitted' },
    approved: { color: 'success', labelKey: 'finance.reimbursement.status.approved' },
    rejected: { color: 'error', labelKey: 'finance.reimbursement.status.rejected' },
    paid: { color: 'default', labelKey: 'finance.reimbursement.status.paid' },
  }
  const item = config[value]
  if (!item) return <Tag color="default">{value}</Tag>
  return <Tag color={item.color}>{translate(getRuntimeSettings().language, item.labelKey)}</Tag>
}

export function initialFinancialSettlementForm(): FinancialSettlementFormState {
  return {
    settlement_no: '',
    shipment_plan_id: '',
    shipment_no: '',
    settlement_date: todayInputValue(),
    remark: '',
  }
}

export function initialManualProfitCostForm(
  currency = 'USD',
  settlementDate = todayInputValue(),
): ManualProfitCostFormState {
  return {
    cost_no: '',
    cost_type: 'other_cost',
    cost_date: settlementDate,
    amount: '',
    currency,
    source_no: '',
    reason: '',
    remark: '',
  }
}

export function financialSettlementPayload(
  form: FinancialSettlementFormState,
): FinancialSettlementCreatePayload {
  return {
    shipment_plan_id: form.shipment_plan_id.trim(),
    shipment_no: emptyToNull(form.shipment_no),
    settlement_date: form.settlement_date,
    remark: emptyToNull(form.remark),
  }
}

export function manualProfitCostPayload(
  form: ManualProfitCostFormState,
): ManualProfitCostCreatePayload {
  return {
    cost_type: form.cost_type,
    cost_date: form.cost_date,
    amount: form.amount.trim(),
    currency: form.currency.trim(),
    source_no: emptyToNull(form.source_no),
    reason: form.reason.trim(),
    remark: emptyToNull(form.remark),
  }
}

export function settlementStatusLabel(value: string): string {
  return optionLabel(settlementStatusOptions, value)
}

export function settlementStatusTag(value: string): ReactNode {
  const color = value === 'locked' ? 'success' : 'default'
  return <Tag color={color}>{settlementStatusLabel(value)}</Tag>
}

export function approvalDocumentTypeLabel(value: string): string {
  return optionLabel(reportingDocumentTypeOptions, value)
}

export function approvalDocumentTypeTag(value: string): ReactNode {
  const color = value === 'export_contract' ? 'processing' : 'purple'
  return <Tag color={color}>{approvalDocumentTypeLabel(value)}</Tag>
}

export function approvalStatusTag(value: string): ReactNode {
  const color = value === 'approved' ? 'success' : value === 'submitted' ? 'warning' : 'default'
  const label = optionLabel(reportingStatusOptions, value)
  return <Tag color={color}>{label}</Tag>
}

export function sourcePathTag(value: string): ReactNode {
  return <Tag color="default">{value}</Tag>
}

export function profitCostTypeLabel(value: string): string {
  return optionLabel(profitCostTypeOptions, value)
}

export function profitCostDirectionTag(value: string): ReactNode {
  const label = translate(
    getRuntimeSettings().language,
    value === 'income' ? 'finance.report.direction.income' : 'finance.report.direction.cost',
  )
  const color = value === 'income' ? 'success' : 'warning'
  return <Tag color={color}>{label}</Tag>
}

// ---- FinancePageContext: shared state + handlers for all finance views ----

export type FinanceModuleCard = {
  module: FinanceModule
  icon: ReactNode
  title: string
  caption: string
  metric: string
  metricLabel: string
}

export type FinancePageContext = {
  // Navigation
  activeModule: FinanceModule
  detailId: string | undefined
  onNavigate: (path: string) => void
  goModule: (module: FinanceModule) => void
  goDetail: (module: FinanceModule, id: string) => void
  goFinanceHome: () => void

  // Shared UI
  summaryStrip: ReactNode
  moduleAlerts: ReactNode
  moduleHeader: ReactNode
  financeModuleCards: FinanceModuleCard[]
  loading: boolean
  message: string
  error: string
  setMessage: (value: string) => void
  setError: (value: string) => void

  // Overview
  overview: FinanceOverview | null
  summary: ReturnType<() => FinanceOverview['summary']> | undefined
  currencyLabel: string
  profitAmount: number
  loadOverview: () => Promise<void>

  // Receipts
  receipts: BankReceipt[]
  receivables: ReceivableItem[]
  selectedReceipt: BankReceipt | null
  selectedReceiptId: string | null
  setSelectedReceiptId: (id: string | null) => void
  selectedReceiptCanClaim: boolean
  selectedReceiptCanAllocate: boolean
  totalReceiptAmount: number
  totalUnallocatedAmount: number
  receiptSearch: string
  setReceiptSearch: (v: string) => void
  receiptStatusFilter: string
  setReceiptStatusFilter: (v: string) => void
  receiptCustomerFilter: string
  setReceiptCustomerFilter: (v: string) => void
  receivableSearch: string
  setReceivableSearch: (v: string) => void
  receivableContractFilter: string
  setReceivableContractFilter: (v: string) => void
  receivableInvoiceFilter: string
  setReceivableInvoiceFilter: (v: string) => void
  receiptForm: BankReceiptFormState
  setReceiptForm: (v: BankReceiptFormState) => void
  claimForm: ReceiptClaimFormState
  setClaimForm: (v: ReceiptClaimFormState) => void
  allocationForm: ReceiptAllocationFormState
  setAllocationForm: (v: ReceiptAllocationFormState) => void
  submittingReceipt: boolean
  submittingClaim: boolean
  submittingAllocation: boolean
  submitReceipt: (event: FormEvent<HTMLFormElement>) => Promise<void>
  submitClaim: (event: FormEvent<HTMLFormElement>) => Promise<void>
  submitAllocation: (event: FormEvent<HTMLFormElement>) => Promise<void>
  loadReceipts: (preferredId?: string) => Promise<void>
  loadReceivables: () => Promise<void>

  // Payments
  supplierInvoices: SupplierInvoice[]
  paymentRequests: SupplierPaymentRequest[]
  payables: PayableItem[]
  selectedSupplierInvoice: SupplierInvoice | null
  selectedSupplierInvoiceId: string | null
  setSelectedSupplierInvoiceId: (id: string | null) => void
  selectedPaymentRequest: SupplierPaymentRequest | null
  selectedPaymentRequestId: string | null
  setSelectedPaymentRequestId: (id: string | null) => void
  selectedPaymentRequestCanApprove: boolean
  invoiceSearch: string
  setInvoiceSearch: (v: string) => void
  invoiceStatusFilter: string
  setInvoiceStatusFilter: (v: string) => void
  invoiceSupplierFilter: string
  setInvoiceSupplierFilter: (v: string) => void
  invoiceContractFilter: string
  setInvoiceContractFilter: (v: string) => void
  paymentRequestSearch: string
  setPaymentRequestSearch: (v: string) => void
  paymentRequestStatusFilter: string
  setPaymentRequestStatusFilter: (v: string) => void
  paymentRequestTypeFilter: string
  setPaymentRequestTypeFilter: (v: string) => void
  payableSearch: string
  setPayableSearch: (v: string) => void
  payableStatusFilter: string
  setPayableStatusFilter: (v: string) => void
  payableSupplierFilter: string
  setPayableSupplierFilter: (v: string) => void
  payableContractFilter: string
  setPayableContractFilter: (v: string) => void
  supplierInvoiceForm: SupplierInvoiceFormState
  setSupplierInvoiceForm: (v: SupplierInvoiceFormState) => void
  paymentRequestForm: PaymentRequestFormState
  setPaymentRequestForm: (v: PaymentRequestFormState) => void
  paymentApprovalForm: PaymentApprovalFormState
  setPaymentApprovalForm: (v: PaymentApprovalFormState) => void
  submittingSupplierInvoice: boolean
  submittingPaymentRequest: boolean
  submittingPaymentApproval: boolean
  submitSupplierInvoice: (event: FormEvent<HTMLFormElement>) => Promise<void>
  submitPaymentRequest: (event: FormEvent<HTMLFormElement>) => Promise<void>
  submitPaymentApproval: (event: FormEvent<HTMLFormElement>) => Promise<void>
  loadSupplierInvoices: (preferredId?: string) => Promise<void>
  loadPaymentRequests: (preferredId?: string) => Promise<void>
  loadPayables: () => Promise<void>

  // Fees
  partnerFeeInvoices: PartnerFeeInvoice[]
  feePaymentRequests: FeePaymentRequest[]
  feePayables: FeePayableItem[]
  selectedPartnerFeeInvoice: PartnerFeeInvoice | null
  selectedPartnerFeeInvoiceId: string | null
  setSelectedPartnerFeeInvoiceId: (id: string | null) => void
  selectedFeePaymentRequest: FeePaymentRequest | null
  selectedFeePaymentRequestId: string | null
  setSelectedFeePaymentRequestId: (id: string | null) => void
  selectedFeePaymentRequestCanApprove: boolean
  feeInvoiceSearch: string
  setFeeInvoiceSearch: (v: string) => void
  feeInvoiceStatusFilter: string
  setFeeInvoiceStatusFilter: (v: string) => void
  feeInvoiceTypeFilter: string
  setFeeInvoiceTypeFilter: (v: string) => void
  feeInvoicePartnerFilter: string
  setFeeInvoicePartnerFilter: (v: string) => void
  feeInvoiceShipmentFilter: string
  setFeeInvoiceShipmentFilter: (v: string) => void
  feePaymentRequestSearch: string
  setFeePaymentRequestSearch: (v: string) => void
  feePaymentRequestStatusFilter: string
  setFeePaymentRequestStatusFilter: (v: string) => void
  feePaymentRequestTypeFilter: string
  setFeePaymentRequestTypeFilter: (v: string) => void
  feePayableSearch: string
  setFeePayableSearch: (v: string) => void
  feePayableStatusFilter: string
  setFeePayableStatusFilter: (v: string) => void
  feePayableTypeFilter: string
  setFeePayableTypeFilter: (v: string) => void
  feePayablePartnerFilter: string
  setFeePayablePartnerFilter: (v: string) => void
  feePayableShipmentFilter: string
  setFeePayableShipmentFilter: (v: string) => void
  partnerFeeInvoiceForm: PartnerFeeInvoiceFormState
  setPartnerFeeInvoiceForm: (v: PartnerFeeInvoiceFormState) => void
  feePaymentRequestForm: FeePaymentRequestFormState
  setFeePaymentRequestForm: (v: FeePaymentRequestFormState) => void
  feePaymentApprovalForm: FeePaymentApprovalFormState
  setFeePaymentApprovalForm: (v: FeePaymentApprovalFormState) => void
  submittingPartnerFeeInvoice: boolean
  submittingFeePaymentRequest: boolean
  submittingFeePaymentApproval: boolean
  submitPartnerFeeInvoice: (event: FormEvent<HTMLFormElement>) => Promise<void>
  submitFeePaymentRequest: (event: FormEvent<HTMLFormElement>) => Promise<void>
  submitFeePaymentApproval: (event: FormEvent<HTMLFormElement>) => Promise<void>
  loadPartnerFeeInvoices: (preferredId?: string) => Promise<void>
  loadFeePaymentRequests: (preferredId?: string) => Promise<void>
  loadFeePayables: () => Promise<void>

  // Tax / Verification
  verificationDocuments: VerificationDocument[]
  verificationUsage: VerificationUsageItem[]
  selectedVerificationDocument: VerificationDocument | null
  selectedVerificationDocumentId: string | null
  setSelectedVerificationDocumentId: (id: string | null) => void
  selectedVerificationCanRegisterCustoms: boolean
  selectedVerificationCanVerify: boolean
  selectedVerificationCanRefund: boolean
  verificationSearch: string
  setVerificationSearch: (v: string) => void
  verificationStatusFilter: string
  setVerificationStatusFilter: (v: string) => void
  verificationReminderFilter: string
  setVerificationReminderFilter: (v: string) => void
  verificationOwnerFilter: string
  setVerificationOwnerFilter: (v: string) => void
  verificationShipmentFilter: string
  setVerificationShipmentFilter: (v: string) => void
  verificationUsageSearch: string
  setVerificationUsageSearch: (v: string) => void
  verificationUsageStatusFilter: string
  setVerificationUsageStatusFilter: (v: string) => void
  verificationUsageReminderFilter: string
  setVerificationUsageReminderFilter: (v: string) => void
  verificationUsageShipmentFilter: string
  setVerificationUsageShipmentFilter: (v: string) => void
  verificationDocumentForm: VerificationDocumentFormState
  setVerificationDocumentForm: (v: VerificationDocumentFormState) => void
  customsReceiptForm: CustomsReceiptFormState
  setCustomsReceiptForm: (v: CustomsReceiptFormState) => void
  verificationRegisterForm: VerificationRegisterFormState
  setVerificationRegisterForm: (v: VerificationRegisterFormState) => void
  taxRefundForm: TaxRefundFormState
  setTaxRefundForm: (v: TaxRefundFormState) => void
  submittingVerificationDocument: boolean
  submittingCustomsReceipt: boolean
  submittingVerificationRegister: boolean
  submittingTaxRefund: boolean
  submitVerificationDocument: (event: FormEvent<HTMLFormElement>) => Promise<boolean>
  submitCustomsReceipt: (event: FormEvent<HTMLFormElement>) => Promise<void>
  submitVerificationRegister: (event: FormEvent<HTMLFormElement>) => Promise<void>
  submitTaxRefund: (event: FormEvent<HTMLFormElement>) => Promise<void>
  loadVerificationDocuments: (preferredId?: string) => Promise<void>
  loadVerificationUsage: () => Promise<void>

  // Misc fees
  miscFeeItems: MiscFeeItem[]
  miscFeeAllocations: MiscFeeAllocation[]
  miscFeeAllocationSummary: MiscFeeAllocation[]
  totalMiscFeeAmount: number
  selectedMiscFeeItem: MiscFeeItem | null
  selectedMiscFeeItemId: string | null
  setSelectedMiscFeeItemId: (id: string | null) => void
  miscFeeItemSearch: string
  setMiscFeeItemSearch: (v: string) => void
  miscFeeItemCategoryFilter: string
  setMiscFeeItemCategoryFilter: (v: string) => void
  miscFeeItemStatusFilter: string
  setMiscFeeItemStatusFilter: (v: string) => void
  miscFeeAllocationSearch: string
  setMiscFeeAllocationSearch: (v: string) => void
  miscFeeAllocationCategoryFilter: string
  setMiscFeeAllocationCategoryFilter: (v: string) => void
  miscFeeAllocationShipmentFilter: string
  setMiscFeeAllocationShipmentFilter: (v: string) => void
  miscFeeAllocationSalesFilter: string
  setMiscFeeAllocationSalesFilter: (v: string) => void
  miscFeeSummaryShipmentFilter: string
  setMiscFeeSummaryShipmentFilter: (v: string) => void
  miscFeeSummaryCategoryFilter: string
  setMiscFeeSummaryCategoryFilter: (v: string) => void
  miscFeeItemForm: MiscFeeItemFormState
  setMiscFeeItemForm: (v: MiscFeeItemFormState) => void
  miscFeeAllocationForm: MiscFeeAllocationFormState
  setMiscFeeAllocationForm: (v: MiscFeeAllocationFormState) => void
  submittingMiscFeeItem: boolean
  submittingMiscFeeAllocation: boolean
  submitMiscFeeItem: (event: FormEvent<HTMLFormElement>) => Promise<void>
  submitMiscFeeAllocation: (event: FormEvent<HTMLFormElement>) => Promise<void>
  loadMiscFeeItems: (preferredId?: string) => Promise<void>
  loadMiscFeeAllocations: () => Promise<void>
  loadMiscFeeAllocationSummary: () => Promise<void>

  // Settlement
  financialSettlements: FinancialSettlement[]
  profitCalculations: FinancialSettlement[]
  totalSettlementSalesIncome: number
  totalSettlementGrossProfit: number
  totalProfitCalculationGrossProfit: number
  selectedFinancialSettlement: FinancialSettlement | null
  selectedFinancialSettlementId: string | null
  setSelectedFinancialSettlementId: (id: string | null) => void
  settlementSearch: string
  setSettlementSearch: (v: string) => void
  settlementShipmentFilter: string
  setSettlementShipmentFilter: (v: string) => void
  profitCalculationSearch: string
  setProfitCalculationSearch: (v: string) => void
  profitCalculationShipmentFilter: string
  setProfitCalculationShipmentFilter: (v: string) => void
  settlementForm: FinancialSettlementFormState
  setSettlementForm: (v: FinancialSettlementFormState) => void
  manualProfitCostForm: ManualProfitCostFormState
  setManualProfitCostForm: (v: ManualProfitCostFormState) => void
  submittingSettlement: boolean
  submittingManualProfitCost: boolean
  submitFinancialSettlement: (event: FormEvent<HTMLFormElement>) => Promise<void>
  submitManualProfitCost: (event: FormEvent<HTMLFormElement>) => Promise<void>
  loadFinancialSettlements: (preferredId?: string) => Promise<void>
  loadProfitCalculations: () => Promise<void>

  // Reimbursements
  reimbursements: Reimbursement[]
  reimbursementsTotalAmount: string
  selectedReimbursementId: string | null
  setSelectedReimbursementId: (id: string | null) => void
  reimbursementSearch: string
  setReimbursementSearch: (v: string) => void
  reimbursementStatusFilter: string
  setReimbursementStatusFilter: (v: string) => void
  reimbursementCategoryFilter: string
  setReimbursementCategoryFilter: (v: string) => void
  reimbursementForm: {
    reimbursement_no: string
    applicant_user_id: string
    applicant_user_name: string
    department: string
    category: string
    currency: string
    amount: string
    reason: string
    remark: string
  }
  setReimbursementForm: (v: FinancePageContext['reimbursementForm']) => void
  reimbursementPayMethod: string
  setReimbursementPayMethod: (v: string) => void
  submittingReimbursement: boolean
  submittingReimbursementAction: boolean
  submitReimbursement: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleReimbursementApprove: (approved: boolean) => Promise<void>
  handleReimbursementPay: () => Promise<void>
  loadReimbursements: (preferredId?: string) => Promise<void>

  // Port data
  portImportBatches: PortImportBatch[]
  customsRecords: CustomsDeclarationRecord[]
  portBatchSourceFilter: string
  setPortBatchSourceFilter: (v: string) => void
  customsDeclarationFilter: string
  setCustomsDeclarationFilter: (v: string) => void
  customsReceiptFilter: string
  setCustomsReceiptFilter: (v: string) => void
  customsTradeTypeFilter: string
  setCustomsTradeTypeFilter: (v: string) => void
  portBatchForm: { batch_no: string; source: string; imported_at: string; remark: string }
  setPortBatchForm: (v: FinancePageContext['portBatchForm']) => void
  portRecordForm: {
    declaration_no: string
    customs_receipt_no: string
    trade_type: string
    export_contract_no: string
    customs_date: string
    product_name: string
    hs_code: string
    quantity: string
    unit: string
    amount: string
    currency: string
    customer_or_supplier: string
  }
  setPortRecordForm: (v: FinancePageContext['portRecordForm']) => void
  submittingPortBatch: boolean
  matchingCustomsReceipts: boolean
  submitPortBatch: (event: FormEvent<HTMLFormElement>) => Promise<void>
  autoMatchPortCustomsReceipts: () => Promise<void>
  loadPortImportBatches: () => Promise<void>
  loadCustomsRecords: () => Promise<void>

  // Reports
  activeReport: string
  setActiveReport: (v: string) => void
  reportDateFrom: string
  setReportDateFrom: (v: string) => void
  reportDateTo: string
  setReportDateTo: (v: string) => void
  reportCurrency: string
  setReportCurrency: (v: string) => void
  reportReceiptNo: string
  setReportReceiptNo: (v: string) => void
  reportReceiptType: string
  setReportReceiptType: (v: string) => void
  reportSupplierName: string
  setReportSupplierName: (v: string) => void
  reportPartnerName: string
  setReportPartnerName: (v: string) => void
  reportFeeType: string
  setReportFeeType: (v: string) => void
  reportSalesUserId: string
  setReportSalesUserId: (v: string) => void
  reportOwnerUserId: string
  setReportOwnerUserId: (v: string) => void
  reportReminderStatus: string
  setReportReminderStatus: (v: string) => void
  reportStatus: string
  setReportStatus: (v: string) => void
  reportIncludeRegistered: boolean
  setReportIncludeRegistered: (v: boolean) => void
  loadingReport: boolean
  exportingReport: boolean
  loadingReportExplanation: boolean
  reportExplanation: FinanceReportExplanation | null
  reportDrilldown: FinanceReportDrilldown | null
  receiptUsageReport: ReceiptUsageDetailReport | null
  bankReceiptSummaryReport: BankReceiptSummaryReport | null
  goodsPaymentReport: GoodsPaymentQueryReport | null
  feePaymentReport: FeePaymentQueryReport | null
  customsCollectionReport: CustomsReceiptCollectionReport | null
  taxRefundStatisticsReport: TaxRefundStatisticsReport | null
  loadFinanceReport: (report: string) => Promise<void>
  exportFinanceReport: (report: string) => Promise<void>
  openFinanceReportDrilldown: (report: string, sourceNo: string) => Promise<void>
}
