import type { TranslationKey } from '@/locales'

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

export const sampleStatusOptions: LocalizedOption[] = [
  { value: 'draft', labelKey: 'sample.request.status.draft' },
  { value: 'sent', labelKey: 'sample.request.status.sent' },
  { value: 'in_progress', labelKey: 'sample.request.status.inProgress' },
  { value: 'completed', labelKey: 'sample.request.status.completed' },
  { value: 'cancelled', labelKey: 'sample.request.status.cancelled' },
]

export const sampleDestinationOptions: LocalizedOption[] = [
  { value: 'in_house', labelKey: 'sample.request.destination.inHouse' },
  { value: 'factory', labelKey: 'sample.request.destination.factory' },
]

export const sampleProgressStageOptions: LocalizedOption[] = [
  { value: 'request_created', labelKey: 'sample.request.progressStage.requestCreated' },
  { value: 'sent_to_factory', labelKey: 'sample.request.progressStage.sentToFactory' },
  { value: 'in_house', labelKey: 'sample.request.progressStage.inHouse' },
  { value: 'sample_received', labelKey: 'sample.request.progressStage.sampleReceived' },
  { value: 'customer_confirmed', labelKey: 'sample.request.progressStage.customerConfirmed' },
]

export const sampleFeeTypeOptions: LocalizedOption[] = [
  { value: 'sample_making', labelKey: 'sample.request.feeType.sampleMaking' },
  { value: 'express', labelKey: 'sample.request.feeType.express' },
  { value: 'material', labelKey: 'sample.request.feeType.material' },
]

export const samplePayeeTypeOptions: LocalizedOption[] = [
  { value: 'supplier', labelKey: 'sample.request.payeeType.supplier' },
  { value: 'partner', labelKey: 'sample.request.payeeType.partner' },
  { value: 'employee', labelKey: 'sample.request.payeeType.employee' },
]

export const sampleRecordTypeOptions: LocalizedOption[] = [
  { value: 'incoming', labelKey: 'sample.record.type.incoming' },
  { value: 'confirm_sample', labelKey: 'sample.record.type.confirmSample' },
  { value: 'bulk_sample', labelKey: 'sample.record.type.bulkSample' },
  { value: 'retained_sample', labelKey: 'sample.record.type.retainedSample' },
]

export const sampleRecordStatusOptions: LocalizedOption[] = [
  { value: 'registered', labelKey: 'sample.record.status.registered' },
  { value: 'submitted', labelKey: 'sample.record.status.submitted' },
  { value: 'confirmed', labelKey: 'sample.record.status.confirmed' },
  { value: 'archived', labelKey: 'sample.record.status.archived' },
]

export const sampleSourceTypeOptions: LocalizedOption[] = [
  { value: 'sample_request', labelKey: 'sample.record.sourceType.sampleRequest' },
  { value: 'purchase_contract', labelKey: 'sample.record.sourceType.purchaseContract' },
  { value: 'customer', labelKey: 'sample.record.sourceType.customer' },
  { value: 'supplier', labelKey: 'sample.record.sourceType.supplier' },
]

export const sampleStockEventTypeOptions: LocalizedOption[] = [
  { value: 'received', labelKey: 'sample.record.stockEventType.received' },
  { value: 'delivered', labelKey: 'sample.record.stockEventType.delivered' },
]

export const sampleDeliveryStatusOptions: LocalizedOption[] = [
  { value: 'draft', labelKey: 'sample.delivery.status.draft' },
  { value: 'submitted', labelKey: 'sample.delivery.status.submitted' },
  { value: 'approved', labelKey: 'sample.delivery.status.approved' },
  { value: 'shipped', labelKey: 'sample.delivery.status.shipped' },
  { value: 'rejected', labelKey: 'sample.delivery.status.rejected' },
]

export const sampleDeliveryFeeTypeOptions: LocalizedOption[] = [
  { value: 'express', labelKey: 'sample.delivery.feeType.express' },
  { value: 'insurance', labelKey: 'sample.delivery.feeType.insurance' },
  { value: 'other', labelKey: 'sample.delivery.feeType.other' },
]

export const sampleDeliveryPayerTypeOptions: LocalizedOption[] = [
  { value: 'company', labelKey: 'sample.delivery.payerType.company' },
  { value: 'customer', labelKey: 'sample.delivery.payerType.customer' },
  { value: 'supplier', labelKey: 'sample.delivery.payerType.supplier' },
]

export const sampleDeliveryTrackingStatusOptions: LocalizedOption[] = [
  { value: 'submitted', labelKey: 'sample.delivery.trackingStatus.submitted' },
  { value: 'approved', labelKey: 'sample.delivery.trackingStatus.approved' },
  { value: 'shipped', labelKey: 'sample.delivery.trackingStatus.shipped' },
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
  { value: 'cancelled', labelKey: 'sales.status.cancelled' },
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
  { value: 'cancelled', labelKey: 'purchase.contract.status.cancelled' },
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

export const qualityResultOptions: LocalizedOption[] = [
  { value: 'passed', labelKey: 'quality.inspection.result.passed' },
  { value: 'failed', labelKey: 'quality.inspection.result.failed' },
  { value: 'partial_passed', labelKey: 'quality.inspection.result.partialPassed' },
  { value: 'recheck_required', labelKey: 'quality.inspection.result.recheckRequired' },
]

export const qualityTaskStatusOptions: LocalizedOption[] = [
  { value: 'pending', labelKey: 'quality.inspection.status.pending' },
  { value: 'in_progress', labelKey: 'quality.inspection.status.inProgress' },
  { value: 'completed', labelKey: 'quality.inspection.status.completed' },
  { value: 'cancelled', labelKey: 'quality.inspection.status.cancelled' },
]

export const qualityIssueSeverityOptions: LocalizedOption[] = [
  { value: 'minor', labelKey: 'quality.inspection.severity.minor' },
  { value: 'major', labelKey: 'quality.inspection.severity.major' },
  { value: 'critical', labelKey: 'quality.inspection.severity.critical' },
]

export const qualityIssueStatusOptions: LocalizedOption[] = [
  { value: 'open', labelKey: 'quality.inspection.issueStatus.open' },
  { value: 'processing', labelKey: 'quality.inspection.issueStatus.processing' },
  { value: 'resolved', labelKey: 'quality.inspection.issueStatus.resolved' },
  { value: 'closed', labelKey: 'quality.inspection.issueStatus.resolved' },
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
