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

export const receiptStatusOptions = [
  { value: 'unclaimed', label: '待认领' },
  { value: 'claimed', label: '已认领' },
  { value: 'partially_allocated', label: '部分分摊' },
  { value: 'allocated', label: '已分摊' },
]

export const receiptTypeOptions = [
  { value: 'normal', label: '普通收款' },
  { value: 'advance', label: '预收款' },
]

export const allocationTypeOptions = [
  { value: 'contract', label: '合同分摊' },
  { value: 'invoice', label: '发票分摊' },
  { value: 'advance', label: '预收款分摊' },
]

export const supplierInvoiceStatusOptions = [
  { value: 'unpaid', label: '未付款' },
  { value: 'partial', label: '部分付款' },
  { value: 'paid', label: '已付清' },
]

export const paymentRequestStatusOptions = [
  { value: 'submitted', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'rejected', label: '已退回' },
]

export const paymentTypeOptions = [
  { value: 'prepayment', label: '预付款' },
  { value: 'goods_payment', label: '货款' },
  { value: 'other', label: '其他付款' },
]

export const partnerFeeInvoiceStatusOptions = supplierInvoiceStatusOptions

export const feePaymentRequestStatusOptions = paymentRequestStatusOptions

export const feeTypeOptions = [
  { value: 'freight', label: '货代费' },
  { value: 'insurance', label: '保险费' },
  { value: 'transport', label: '运输费' },
  { value: 'inspection', label: '查验费' },
  { value: 'express', label: '快递费' },
  { value: 'other', label: '其他费用' },
]

export const verificationDocumentStatusOptions = [
  { value: 'issued', label: '已领用' },
  { value: 'customs_receipt_registered', label: '已回单' },
  { value: 'verified', label: '已核销' },
  { value: 'refunded', label: '已退税' },
]

export const verificationReminderStatusOptions = [
  { value: 'pending', label: '待提醒' },
  { value: 'done', label: '已完成' },
  { value: 'overdue', label: '已逾期' },
]

export const miscFeeCategoryOptions = [
  { value: 'office', label: '办公费用' },
  { value: 'capital_interest', label: '资金占用利息' },
  { value: 'tax_refund_interest', label: '退税利息' },
  { value: 'other', label: '其他杂费' },
]

export const miscFeeAllocationMethodOptions = [
  { value: 'manual', label: '手工分摊' },
  { value: 'ratio', label: '按比例分摊' },
  { value: 'amount', label: '按金额分摊' },
  { value: 'quantity', label: '按数量分摊' },
]

export const miscFeeItemStatusOptions = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
]

export const settlementStatusOptions = [{ value: 'locked', label: '已锁定' }]

export const reportingDocumentTypeOptions = [
  { value: 'export_contract', label: '出口合同' },
  { value: 'purchase_contract', label: '采购合同' },
]

export const reportingStatusOptions = [
  { value: 'submitted', label: '待审批' },
  { value: 'approved', label: '已审批' },
]

export const profitCostTypeOptions = [
  { value: 'sales_income', label: '销售收入' },
  { value: 'purchase_cost', label: '采购成本' },
  { value: 'partner_fee', label: '合作伙伴费' },
  { value: 'misc_fee', label: '杂费分摊' },
  { value: 'tax_refund', label: '退税收入' },
  { value: 'other_cost', label: '其他成本' },
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
