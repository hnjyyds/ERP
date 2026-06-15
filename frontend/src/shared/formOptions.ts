export const partnerTypeOptions = [
  { value: 'express', label: '快件公司' },
  { value: 'freight_forwarder', label: '货代公司' },
  { value: 'insurer', label: '保险公司' },
  { value: 'carrier', label: '运输公司' },
]

export const partnerStatusOptions = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
]

export const documentPartyTypeOptions = [
  { value: 'consignee', label: '收货人' },
  { value: 'notify_party', label: '通知人' },
  { value: 'issuing_bank', label: '开证行' },
  { value: 'bill_notify_party', label: '提单通知人' },
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

export const exportQuotationStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'contract_generated', label: '已生成合同' },
  { value: 'rejected', label: '已退回' },
]

export const exportContractStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'rejected', label: '已退回' },
]

export const shipmentStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'rejected', label: '已退回' },
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

export const purchaseInquiryStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'sent', label: '已发模板' },
  { value: 'quoted', label: '已报价' },
  { value: 'closed', label: '已关闭' },
]

export const purchaseContractStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '待审批' },
  { value: 'approved', label: '已审批' },
]

export const purchaseContractSourceTypeOptions = [
  { value: 'export_contract', label: '出口合同生成' },
  { value: 'stock_purchase', label: '库存采购' },
  { value: 'manual', label: '手工采购' },
]

export const purchaseInvoiceNoticeStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'sent', label: '已发送' },
  { value: 'received', label: '已收票' },
]

export const followupStatusOptions = [
  { value: 'pending', label: '待跟进' },
  { value: 'in_progress', label: '进行中' },
  { value: 'overdue', label: '已逾期' },
  { value: 'completed', label: '已完成' },
]

export const followupNodeOptions = [
  { value: 'confirm_sample_submitted', label: '确认样提交' },
  { value: 'bulk_sample_submitted', label: '大货样提交' },
  { value: 'quality_inspection', label: 'QC 查验' },
  { value: 'inbound_completed', label: '入库' },
  { value: 'outbound_completed', label: '出库' },
]

export const followupSourceTypeOptions = [
  { value: 'sample_followup_event', label: '样品事件' },
  { value: 'quality_inspection', label: 'QC 查验' },
  { value: 'inventory_inbound', label: '入库单' },
  { value: 'inventory_outbound', label: '出库单' },
]

export const qualityResultOptions = [
  { value: 'passed', label: '通过' },
  { value: 'failed', label: '不通过' },
  { value: 'partial_passed', label: '部分通过' },
  { value: 'recheck_required', label: '待复检' },
]

export const qualityIssueSeverityOptions = [
  { value: 'minor', label: '轻微' },
  { value: 'major', label: '主要' },
  { value: 'critical', label: '严重' },
]

export const qualityIssueStatusOptions = [
  { value: 'open', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'closed', label: '已关闭' },
]

export const inboundPlanStatusOptions = [
  { value: 'planned', label: '待安排' },
  { value: 'scheduled', label: '已排库位' },
  { value: 'closed', label: '已关闭' },
  { value: 'cancelled', label: '已取消' },
]

export const inboundPlanTypeOptions = [
  { value: 'material_inbound', label: '配料入库' },
  { value: 'purchase_inbound', label: '采购入库' },
  { value: 'processing_inbound', label: '加工入库' },
  { value: 'production_inbound', label: '生产入库' },
  { value: 'packaging_inbound', label: '包装入库' },
  { value: 'sterilization_inbound', label: '灭菌入库' },
]

export const inboundOrderStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'cancelled', label: '已取消' },
]

export const inboundOrderModeOptions = [
  { value: 'formal', label: '正式入库' },
  { value: 'pending_inspection', label: '待检入库' },
]

export const outboundPlanStatusOptions = [
  { value: 'planned', label: '待安排' },
  { value: 'scheduled', label: '已排库位' },
  { value: 'closed', label: '已关闭' },
  { value: 'cancelled', label: '已取消' },
]

export const outboundPlanTypeOptions = [
  { value: 'material_outbound', label: '配料出库' },
  { value: 'production_outbound', label: '生产出库' },
  { value: 'finished_goods_outbound', label: '成品出库' },
  { value: 'processing_outbound', label: '加工发料' },
]

export const outboundPlanSourceTypeOptions = [
  { value: 'shipment_plan', label: '发货计划' },
  { value: 'production_requisition', label: '生产领料' },
  { value: 'processing_issue', label: '加工发料' },
]

export const outboundOrderStatusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '待审批' },
  { value: 'approved', label: '已出库' },
  { value: 'cancelled', label: '已取消' },
]

export const outboundOrderModeOptions = [
  { value: 'formal', label: '正式出库' },
  { value: 'exception', label: '异常出库' },
]

export const freightMethodOptions = [
  { value: 'sea', label: '海运' },
  { value: 'air', label: '空运' },
  { value: 'express', label: '快递' },
  { value: 'rail', label: '铁路' },
]
