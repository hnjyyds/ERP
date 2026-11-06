import type { TranslationKey } from '../locales'

/** 选项只存 value 与域内文案 key，渲染时再按当前语言取 label。 */
export type LocalizedOption = {
  value: string
  labelKey: TranslationKey
}

export const partnerTypeOptions: LocalizedOption[] = [
  { value: 'express', labelKey: 'masterdata.partner.type.express' },
  { value: 'freight_forwarder', labelKey: 'masterdata.partner.type.freightForwarder' },
  { value: 'insurer', labelKey: 'masterdata.partner.type.insurer' },
  { value: 'carrier', labelKey: 'masterdata.partner.type.carrier' },
]

export const partnerStatusOptions: LocalizedOption[] = [
  { value: 'active', labelKey: 'status.active' },
  { value: 'inactive', labelKey: 'status.inactive' },
]

export const documentPartyTypeOptions: LocalizedOption[] = [
  { value: 'consignee', labelKey: 'masterdata.documentParty.type.consignee' },
  { value: 'notify_party', labelKey: 'masterdata.documentParty.type.notifyParty' },
  { value: 'issuing_bank', labelKey: 'masterdata.documentParty.type.issuingBank' },
  { value: 'bill_notify_party', labelKey: 'masterdata.documentParty.type.billNotifyParty' },
]

export const sampleStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'sent', label: '已发送' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export const sampleDestinationOptions = [
  { value: 'in_house', label: '内部打样' },
  { value: 'factory', label: '外发工厂' },
]

export const sampleProgressStageOptions = [
  { value: 'request_created', label: '打样立项' },
  { value: 'sent_to_factory', label: '外发工厂' },
  { value: 'in_house', label: '内部打样' },
  { value: 'sample_received', label: '样品收回' },
  { value: 'customer_confirmed', label: '客户确认' },
]

export const sampleFeeTypeOptions = [
  { value: 'sample_making', label: '打样费' },
  { value: 'express', label: '快递费' },
  { value: 'material', label: '材料费' },
]

export const samplePayeeTypeOptions = [
  { value: 'supplier', label: '供应商' },
  { value: 'partner', label: '合作伙伴' },
  { value: 'employee', label: '员工' },
]

export const sampleRecordTypeOptions = [
  { value: 'incoming', label: '来样' },
  { value: 'confirm_sample', label: '确认样' },
  { value: 'bulk_sample', label: '大货样' },
  { value: 'retained_sample', label: '留样' },
]

export const sampleRecordStatusOptions = [
  { value: 'registered', label: '已登记' },
  { value: 'submitted', label: '已提交' },
  { value: 'confirmed', label: '已确认' },
  { value: 'archived', label: '已归档' },
]

export const sampleSourceTypeOptions = [
  { value: 'sample_request', label: '打样单' },
  { value: 'purchase_contract', label: '采购合同' },
  { value: 'customer', label: '客户提供' },
  { value: 'supplier', label: '供应商提供' },
]

export const sampleStockEventTypeOptions = [
  { value: 'received', label: '收样' },
  { value: 'delivered', label: '寄样' },
]

export const sampleDeliveryStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '待审核' },
  { value: 'approved', label: '已审核' },
  { value: 'shipped', label: '已寄出' },
  { value: 'rejected', label: '已退回' },
]

export const sampleDeliveryFeeTypeOptions = [
  { value: 'express', label: '快递费' },
  { value: 'insurance', label: '保险费' },
  { value: 'other', label: '其他费用' },
]

export const sampleDeliveryPayerTypeOptions = [
  { value: 'company', label: '公司承担' },
  { value: 'customer', label: '客户承担' },
  { value: 'supplier', label: '供应商承担' },
]

export const sampleDeliveryTrackingStatusOptions = [
  { value: 'submitted', label: '待审核' },
  { value: 'approved', label: '已审核' },
  { value: 'shipped', label: '已寄出' },
]

export const exportQuotationStatusOptions: LocalizedOption[] = [
  { value: 'draft', labelKey: 'sales.status.draft' },
  { value: 'submitted', labelKey: 'sales.status.submitted' },
  { value: 'approved', labelKey: 'sales.status.approved' },
  { value: 'contract_generated', labelKey: 'sales.status.contractGenerated' },
  { value: 'rejected', labelKey: 'sales.status.rejected' },
]

export const exportContractStatusOptions: LocalizedOption[] = [
  { value: 'draft', labelKey: 'sales.status.draft' },
  { value: 'submitted', labelKey: 'sales.status.submitted' },
  { value: 'approved', labelKey: 'sales.status.approved' },
  { value: 'rejected', labelKey: 'sales.status.rejected' },
]

export const shipmentStatusOptions: LocalizedOption[] = [
  { value: 'draft', labelKey: 'sales.status.draft' },
  { value: 'submitted', labelKey: 'sales.status.submitted' },
  { value: 'approved', labelKey: 'sales.status.approved' },
  { value: 'rejected', labelKey: 'sales.status.rejected' },
]

export const receiptStatusOptions: LocalizedOption[] = [
  { value: 'unclaimed', labelKey: 'finance.receipt.status.unclaimed' },
  { value: 'claimed', labelKey: 'finance.receipt.status.claimed' },
  { value: 'partially_allocated', labelKey: 'finance.receipt.status.partiallyAllocated' },
  { value: 'allocated', labelKey: 'finance.receipt.status.allocated' },
]

export const receiptTypeOptions: LocalizedOption[] = [
  { value: 'normal', labelKey: 'finance.receipt.type.normal' },
  { value: 'advance', labelKey: 'finance.receipt.type.advance' },
]

export const allocationTypeOptions: LocalizedOption[] = [
  { value: 'contract', labelKey: 'finance.receipt.allocationType.contract' },
  { value: 'invoice', labelKey: 'finance.receipt.allocationType.invoice' },
  { value: 'advance', labelKey: 'finance.receipt.allocationType.advance' },
]

export const supplierInvoiceStatusOptions: LocalizedOption[] = [
  { value: 'unpaid', labelKey: 'finance.supplierInvoice.status.unpaid' },
  { value: 'partial', labelKey: 'finance.supplierInvoice.status.partial' },
  { value: 'paid', labelKey: 'finance.supplierInvoice.status.paid' },
]

export const paymentRequestStatusOptions: LocalizedOption[] = [
  { value: 'submitted', labelKey: 'finance.payment.requestStatus.submitted' },
  { value: 'approved', labelKey: 'finance.payment.requestStatus.approved' },
  { value: 'rejected', labelKey: 'finance.payment.requestStatus.rejected' },
]

export const paymentTypeOptions: LocalizedOption[] = [
  { value: 'prepayment', labelKey: 'finance.payment.type.prepayment' },
  { value: 'goods_payment', labelKey: 'finance.payment.type.goodsPayment' },
  { value: 'other', labelKey: 'finance.payment.type.other' },
]

export const partnerFeeInvoiceStatusOptions = supplierInvoiceStatusOptions

export const feePaymentRequestStatusOptions = paymentRequestStatusOptions

export const feeTypeOptions: LocalizedOption[] = [
  { value: 'freight', labelKey: 'finance.fee.type.freight' },
  { value: 'insurance', labelKey: 'finance.fee.type.insurance' },
  { value: 'transport', labelKey: 'finance.fee.type.transport' },
  { value: 'inspection', labelKey: 'finance.fee.type.inspection' },
  { value: 'express', labelKey: 'finance.fee.type.express' },
  { value: 'other', labelKey: 'finance.fee.type.other' },
]

export const verificationDocumentStatusOptions: LocalizedOption[] = [
  { value: 'issued', labelKey: 'finance.tax.verificationDocument.status.issued' },
  { value: 'customs_receipt_registered', labelKey: 'finance.tax.verificationDocument.status.customsReceiptRegistered' },
  { value: 'verified', labelKey: 'finance.tax.verificationDocument.status.verified' },
  { value: 'refunded', labelKey: 'finance.tax.verificationDocument.status.refunded' },
]

export const verificationReminderStatusOptions: LocalizedOption[] = [
  { value: 'pending', labelKey: 'finance.tax.verificationReminder.status.pending' },
  { value: 'done', labelKey: 'finance.tax.verificationReminder.status.done' },
  { value: 'overdue', labelKey: 'finance.tax.verificationReminder.status.overdue' },
]

export const miscFeeCategoryOptions: LocalizedOption[] = [
  { value: 'office', labelKey: 'finance.misc.category.office' },
  { value: 'capital_interest', labelKey: 'finance.misc.category.capitalInterest' },
  { value: 'tax_refund_interest', labelKey: 'finance.misc.category.taxRefundInterest' },
  { value: 'other', labelKey: 'finance.misc.category.other' },
]

export const miscFeeAllocationMethodOptions: LocalizedOption[] = [
  { value: 'manual', labelKey: 'finance.misc.allocationMethod.manual' },
  { value: 'ratio', labelKey: 'finance.misc.allocationMethod.ratio' },
  { value: 'amount', labelKey: 'finance.misc.allocationMethod.amount' },
  { value: 'quantity', labelKey: 'finance.misc.allocationMethod.quantity' },
]

export const miscFeeItemStatusOptions: LocalizedOption[] = [
  { value: 'active', labelKey: 'status.active' },
  { value: 'inactive', labelKey: 'status.inactive' },
]

export const settlementStatusOptions: LocalizedOption[] = [
  { value: 'locked', labelKey: 'finance.settlement.status.locked' },
]

export const reportingDocumentTypeOptions: LocalizedOption[] = [
  { value: 'export_contract', labelKey: 'finance.report.documentType.exportContract' },
  { value: 'purchase_contract', labelKey: 'finance.report.documentType.purchaseContract' },
]

export const reportingStatusOptions: LocalizedOption[] = [
  { value: 'submitted', labelKey: 'finance.report.status.submitted' },
  { value: 'approved', labelKey: 'finance.report.status.approved' },
]

export const profitCostTypeOptions: LocalizedOption[] = [
  { value: 'sales_income', labelKey: 'finance.report.costType.salesIncome' },
  { value: 'purchase_cost', labelKey: 'finance.report.costType.purchaseCost' },
  { value: 'partner_fee', labelKey: 'finance.report.costType.partnerFee' },
  { value: 'misc_fee', labelKey: 'finance.report.costType.miscFee' },
  { value: 'tax_refund', labelKey: 'finance.report.costType.taxRefund' },
  { value: 'other_cost', labelKey: 'finance.report.costType.otherCost' },
]

export const purchaseInquiryStatusOptions: LocalizedOption[] = [
  { value: 'draft', labelKey: 'purchase.inquiry.status.draft' },
  { value: 'sent', labelKey: 'purchase.inquiry.status.sent' },
  { value: 'quoted', labelKey: 'purchase.inquiry.status.quoted' },
  { value: 'closed', labelKey: 'purchase.inquiry.status.closed' },
]

export const purchaseContractStatusOptions: LocalizedOption[] = [
  { value: 'draft', labelKey: 'purchase.contract.status.draft' },
  { value: 'submitted', labelKey: 'purchase.contract.status.submitted' },
  { value: 'approved', labelKey: 'purchase.contract.status.approved' },
  { value: 'rejected', labelKey: 'purchase.contract.status.rejected' },
]

export const purchaseContractSourceTypeOptions: LocalizedOption[] = [
  { value: 'export_contract', labelKey: 'purchase.contract.source.exportContract' },
  { value: 'stock_purchase', labelKey: 'purchase.contract.source.stockPurchase' },
  { value: 'manual', labelKey: 'purchase.contract.source.manual' },
]

export const purchaseInvoiceNoticeStatusOptions: LocalizedOption[] = [
  { value: 'draft', labelKey: 'purchase.invoiceNotice.status.draft' },
  { value: 'sent', labelKey: 'purchase.invoiceNotice.status.sent' },
  { value: 'received', labelKey: 'purchase.invoiceNotice.status.received' },
]

export const followupStatusOptions: LocalizedOption[] = [
  { value: 'pending', labelKey: 'purchase.followup.status.pending' },
  { value: 'in_progress', labelKey: 'purchase.followup.status.inProgress' },
  { value: 'overdue', labelKey: 'purchase.followup.status.overdue' },
  { value: 'completed', labelKey: 'purchase.followup.status.completed' },
]

export const followupNodeLabelKeys: Record<string, TranslationKey> = {
  contract_confirmed: 'purchase.followup.node.contractConfirmed',
  confirm_sample_submitted: 'purchase.followup.node.confirmSampleSubmitted',
  bulk_sample_submitted: 'purchase.followup.node.bulkSampleSubmitted',
  quality_inspection: 'purchase.followup.node.qualityInspection',
  inbound_completed: 'purchase.followup.node.inboundCompleted',
  outbound_completed: 'purchase.followup.node.outboundCompleted',
}

export const followupNodeOptions: LocalizedOption[] = [
  { value: 'confirm_sample_submitted', labelKey: 'purchase.followup.node.confirmSampleSubmitted' },
  { value: 'bulk_sample_submitted', labelKey: 'purchase.followup.node.bulkSampleSubmitted' },
  { value: 'quality_inspection', labelKey: 'purchase.followup.node.qualityInspection' },
  { value: 'inbound_completed', labelKey: 'purchase.followup.node.inboundCompleted' },
  { value: 'outbound_completed', labelKey: 'purchase.followup.node.outboundCompleted' },
]

export const followupSourceTypeOptions: LocalizedOption[] = [
  { value: 'sample_followup_event', labelKey: 'purchase.followup.sourceType.sampleFollowupEvent' },
  { value: 'quality_inspection', labelKey: 'purchase.followup.sourceType.qualityInspection' },
  { value: 'inventory_inbound', labelKey: 'purchase.followup.sourceType.inventoryInbound' },
  { value: 'inventory_outbound', labelKey: 'purchase.followup.sourceType.inventoryOutbound' },
]

export const qualityResultOptions = [
  { value: 'passed', label: '通过' },
  { value: 'failed', label: '不通过' },
  { value: 'partial_passed', label: '部分通过' },
  { value: 'recheck_required', label: '待复检' },
]

export const qualityTaskStatusOptions = [
  { value: 'pending', label: '待查验' },
  { value: 'in_progress', label: '查验中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export const qualityIssueSeverityOptions = [
  { value: 'minor', label: '轻微' },
  { value: 'major', label: '主要' },
  { value: 'critical', label: '严重' },
]

export const qualityIssueStatusOptions = [
  { value: 'open', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已关闭' },
  { value: 'closed', label: '已关闭' },
]

export const inboundPlanStatusOptions: LocalizedOption[] = [
  { value: 'planned', labelKey: 'warehouse.inboundPlan.status.planned' },
  { value: 'scheduled', labelKey: 'warehouse.inboundPlan.status.scheduled' },
  { value: 'closed', labelKey: 'warehouse.inboundPlan.status.closed' },
  { value: 'cancelled', labelKey: 'warehouse.inboundPlan.status.cancelled' },
]

export const inboundPlanTypeOptions: LocalizedOption[] = [
  { value: 'material_inbound', labelKey: 'warehouse.inboundPlan.type.materialInbound' },
  { value: 'purchase_inbound', labelKey: 'warehouse.inboundPlan.type.purchaseInbound' },
  { value: 'processing_inbound', labelKey: 'warehouse.inboundPlan.type.processingInbound' },
  { value: 'production_inbound', labelKey: 'warehouse.inboundPlan.type.productionInbound' },
  { value: 'packaging_inbound', labelKey: 'warehouse.inboundPlan.type.packagingInbound' },
  { value: 'sterilization_inbound', labelKey: 'warehouse.inboundPlan.type.sterilizationInbound' },
]

export const inboundOrderStatusOptions: LocalizedOption[] = [
  { value: 'draft', labelKey: 'warehouse.inboundOrder.status.draft' },
  { value: 'submitted', labelKey: 'warehouse.inboundOrder.status.submitted' },
  { value: 'approved', labelKey: 'warehouse.inboundOrder.status.approved' },
  { value: 'cancelled', labelKey: 'warehouse.inboundOrder.status.cancelled' },
]

export const inboundOrderModeOptions: LocalizedOption[] = [
  { value: 'formal', labelKey: 'warehouse.inboundOrder.mode.formal' },
  { value: 'pending_inspection', labelKey: 'warehouse.inboundOrder.mode.pendingInspection' },
]

export const outboundPlanStatusOptions: LocalizedOption[] = [
  { value: 'planned', labelKey: 'warehouse.outboundPlan.status.planned' },
  { value: 'scheduled', labelKey: 'warehouse.outboundPlan.status.scheduled' },
  { value: 'closed', labelKey: 'warehouse.outboundPlan.status.closed' },
  { value: 'cancelled', labelKey: 'warehouse.outboundPlan.status.cancelled' },
]

export const outboundPlanTypeOptions: LocalizedOption[] = [
  { value: 'material_outbound', labelKey: 'warehouse.outboundPlan.type.materialOutbound' },
  { value: 'production_outbound', labelKey: 'warehouse.outboundPlan.type.productionOutbound' },
  {
    value: 'finished_goods_outbound',
    labelKey: 'warehouse.outboundPlan.type.finishedGoodsOutbound',
  },
  { value: 'processing_outbound', labelKey: 'warehouse.outboundPlan.type.processingOutbound' },
]

export const outboundPlanSourceTypeOptions: LocalizedOption[] = [
  { value: 'shipment_plan', labelKey: 'warehouse.outboundPlan.sourceType.shipmentPlan' },
  {
    value: 'production_requisition',
    labelKey: 'warehouse.outboundPlan.sourceType.productionRequisition',
  },
  { value: 'processing_issue', labelKey: 'warehouse.outboundPlan.sourceType.processingIssue' },
]

export const outboundOrderStatusOptions: LocalizedOption[] = [
  { value: 'draft', labelKey: 'warehouse.outboundOrder.status.draft' },
  { value: 'submitted', labelKey: 'warehouse.outboundOrder.status.submitted' },
  { value: 'approved', labelKey: 'warehouse.outboundOrder.status.approved' },
  { value: 'cancelled', labelKey: 'warehouse.outboundOrder.status.cancelled' },
]

export const outboundOrderModeOptions: LocalizedOption[] = [
  { value: 'formal', labelKey: 'warehouse.outboundOrder.mode.formal' },
  { value: 'exception', labelKey: 'warehouse.outboundOrder.mode.exception' },
]

export const freightMethodOptions: LocalizedOption[] = [
  { value: 'sea', labelKey: 'sales.freightMethod.sea' },
  { value: 'air', labelKey: 'sales.freightMethod.air' },
  { value: 'express', labelKey: 'sales.freightMethod.express' },
  { value: 'rail', labelKey: 'sales.freightMethod.rail' },
]
