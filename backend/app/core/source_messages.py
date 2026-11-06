"""业务域中文源文案的英文映射。

采用 gettext 风格：中文源串即 key，只在错误边界按请求语言渲染。
未命中映射时保持原文，保证新增文案不会因缺译文而报错。
"""

import re

# 静态文案：与 app/modules、app/api 中直接抛出的中文消息一一对应。
SOURCE_MESSAGES: dict[str, str] = {
    # 通用
    "不能为空": "Must not be empty",
    # 组织与权限
    "上级部门不存在": "Parent department not found",
    "角色名称不能为空": "Role name must not be empty",
    "角色或权限不存在": "Role or permission not found",
    "部门名称不能为空": "Department name must not be empty",
    "部门或角色不存在": "Department or role not found",
    "权限不存在": "Permission not found",
    "审批人不存在或已停用": "The approver does not exist or is disabled",
    "不能将自己设为审批人": "You cannot set yourself as the approver",
    "所选员工没有入库审批权限": "The selected employee does not have inbound approval permission",
    "所选员工没有出库审批权限": "The selected employee does not have outbound approval permission",
    "所选员工没有报价审批权限": "The selected employee does not have quotation approval permission",
    "所选员工没有 QC 查验权限": "The selected employee does not have QC inspection permission",
    "所选员工没有出口合同审批权限": (
        "The selected employee does not have export contract approval permission"
    ),
    "所选员工没有寄样审批权限": (
        "The selected employee does not have sample delivery approval permission"
    ),
    "所选员工没有采购合同审批权限": (
        "The selected employee does not have purchase contract approval permission"
    ),
    "所选员工没有出货审批权限": "The selected employee does not have shipment approval permission",
    "所选员工没有财务审批权限": "The selected employee does not have finance approval permission",
    "审批人缺少财务权限": "The approver lacks finance permission",
    # 商品资料与导入
    "Excel 文件缺少工作表": "The Excel file has no worksheet",
    "Excel 文件损坏或格式不正确": "The Excel file is corrupted or has an invalid format",
    "CSV 文件编码无法识别，请使用 UTF-8": "Unable to detect the CSV encoding; please use UTF-8",
    "仅支持 CSV 或 Excel(.xlsx) 文件": "Only CSV or Excel (.xlsx) files are supported",
    "文件内容不是有效的 base64 编码": "File content is not valid base64",
    "导入文件为空": "The import file is empty",
    "导入文件超过 5MB 限制": "The import file exceeds the 5MB limit",
    "文件没有可导入的数据行": "The file contains no data rows to import",
    "文件缺少表头行": "The file is missing the header row",
    "合作伙伴类型无效": "Invalid partner type",
    "单证资料类型无效": "Invalid document type",
    # 采购
    "供应商报价不存在": "Supplier quotation not found",
    "供应商报价明细不属于该询价单": (
        "The supplier quotation line item does not belong to this inquiry"
    ),
    "已有供应商报价的采购询价不可编辑": (
        "A purchase inquiry with supplier quotations cannot be edited"
    ),
    "只有草稿采购询价可以编辑": "Only draft purchase inquiries can be edited",
    "采购询价状态无效": "Invalid purchase inquiry status",
    "来源出口合同不存在": "The source export contract does not exist",
    "来源出口合同明细不存在": "The source export contract line item does not exist",
    "来源出口合同没有商品明细": "The source export contract has no product line items",
    "出口合同明细未关联商品资料，请先选择商品后重试": (
        "An export contract line item is not linked to a product record; "
        "please select a product and try again"
    ),
    "出口合同来源必须选择来源合同明细": (
        "The export contract source must specify the source contract line item"
    ),
    "出口合同来源明细缺少来源合同或来源明细标识": (
        "The export contract source line is missing the source contract or source line identifier"
    ),
    "只有已提交采购合同可以审批": "Only submitted purchase contracts can be approved",
    "只有草稿或已驳回采购合同可以编辑": "Only draft or rejected purchase contracts can be edited",
    "只有草稿采购合同可以提交": "Only draft purchase contracts can be submitted",
    "只能从已审批出口合同生成采购合同": (
        "Purchase contracts can only be generated from approved export contracts"
    ),
    "采购合同审批状态无效": "Invalid purchase contract approval status",
    "采购合同来源类型无效": "Invalid purchase contract source type",
    "采购合同没有明细，无法生成入库计划": (
        "The purchase contract has no line items; cannot generate an inbound plan"
    ),
    "驳回采购合同时必须填写驳回原因": (
        "A rejection reason is required when rejecting a purchase contract"
    ),
    "只有草稿开票通知可以发送": "Only draft invoice notices can be sent",
    "开票通知已完成收票": "The invoice notice has already been fully invoiced",
    "开票通知状态无效": "Invalid invoice notice status",
    # 质检
    "QC 任务状态无效": "Invalid QC task status",
    "QC 任务状态不能这样变更": "The QC task status cannot be changed this way",
    "QC 查验结果无效": "Invalid QC inspection result",
    "QC 明细结果无效": "Invalid QC line item result",
    "QC 附件类型无效": "Invalid QC attachment type",
    "QC 异常严重程度无效": "Invalid QC anomaly severity",
    "QC 异常关联了不属于该采购合同的明细": (
        "The QC anomaly references a line item outside this purchase contract"
    ),
    "QC 完成时必须登记采购合同的全部商品明细": (
        "All purchase contract line items must be recorded when the QC task is completed"
    ),
    "QC 未通过时至少登记一项异常": "Record at least one anomaly when the QC task fails",
    "QC 查验不能更换采购合同": "The purchase contract of a QC inspection cannot be changed",
    "QC 通过时不能存在未关闭异常": "No open anomalies may remain when the QC task passes",
    "QC 通过时不良数量必须为 0": "The defective quantity must be 0 when the QC task passes",
    "QC 通过时所有明细必须通过": "All line items must pass when the QC task passes",
    "不合格数量不能大于查验数量": "The defective quantity cannot exceed the inspected quantity",
    "仅已完成且未通过的 QC 任务可以创建复检": (
        "Only completed QC tasks that failed can be re-inspected"
    ),
    "仅待执行或执行中的 QC 任务可以取消": "Only pending or in-progress QC tasks can be cancelled",
    "仅待执行或执行中的 QC 任务可以调整排期": (
        "Only pending or in-progress QC tasks can be rescheduled"
    ),
    "仅最新一笔未通过的 QC 任务可以创建复检": (
        "Only the latest failed QC task can be re-inspected"
    ),
    "取消原因不能为空": "Cancellation reason must not be empty",
    "同一采购合同明细不能重复登记 QC 结果": (
        "The same purchase contract line item cannot be recorded twice"
    ),
    "已完成的 QC 任务必须填写查验日期、结果和明细": (
        "A completed QC task must include the inspection date, result, and line items"
    ),
    "异常关闭说明不能为空": "The anomaly closure note must not be empty",
    "未完成的 QC 任务不能填写查验结果": "An incomplete QC task cannot have an inspection result",
    "未完成的 QC 任务必须填写排期时间": "An incomplete QC task must include a scheduled time",
    "该 QC 任务已经存在待执行的复检任务": (
        "A pending re-inspection already exists for this QC task"
    ),
    "该 QC 异常已经关闭": "This QC anomaly is already closed",
    "请先关闭全部 QC 异常，再创建复检任务": (
        "Close all QC anomalies before creating a re-inspection"
    ),
    "请先审批该采购合同，再登记 QC 查验": (
        "Approve the purchase contract before recording a QC inspection"
    ),
    "调整排期原因不能为空": "The rescheduling reason must not be empty",
    "查验日期或排期时间至少填写一项": (
        "Provide at least one of the inspection date or scheduled time"
    ),
    # 销售
    "只有已提交合同可以审批": "Only submitted contracts can be approved",
    "只有草稿合同可以删除": "Only draft contracts can be deleted",
    "只有草稿合同可以提交": "Only draft contracts can be submitted",
    "只有草稿合同可以编辑": "Only draft contracts can be edited",
    "合同审批状态无效": "Invalid contract approval status",
    "合同导出格式无效": "Invalid contract export format",
    "合同已被其他业务单据引用，不能删除": (
        "This contract is referenced by other documents and cannot be deleted"
    ),
    "已出货数量不能超过合同数量": "The shipped quantity cannot exceed the contract quantity",
    "已采购数量不能超过合同数量": "The purchased quantity cannot exceed the contract quantity",
    "只有已审批报价可以生成出口合同": "Only approved quotations can generate export contracts",
    "只有已提交报价可以审批": "Only submitted quotations can be approved",
    "只有草稿报价可以提交": "Only draft quotations can be submitted",
    "只有草稿报价可以编辑": "Only draft quotations can be edited",
    "报价审批状态无效": "Invalid quotation approval status",
    "报价导出格式无效": "Invalid quotation export format",
    "出货数量不能超过合同未出货数量": (
        "The shipment quantity cannot exceed the contract's unshipped quantity"
    ),
    "出货审批状态无效": "Invalid shipment approval status",
    "只有已提交出货明细可以审批": "Only submitted shipment lines can be approved",
    "只有草稿出货明细可以提交": "Only draft shipment lines can be submitted",
    "只能从已审批出口合同生成出货明细": (
        "Shipment lines can only be generated from approved export contracts"
    ),
    "合同没有可出货数量": "The contract has no shippable quantity",
    "合并出运合同币种必须一致": "Consolidated shipments must use the same currency",
    "同一合同不能重复选择": "The same contract cannot be selected twice",
    # 样品
    "样品分类无效": "Invalid sample category",
    "样品状态无效": "Invalid sample status",
    "样品留样数量不足": "Insufficient sample retention quantity",
    "样品数量事件无效": "Invalid sample quantity event",
    "寄样导出日期范围无效": "Invalid sample delivery export date range",
    "寄样日期范围无效": "Invalid sample delivery date range",
    "寄样状态无效": "Invalid sample delivery status",
    "寄样统计日期范围无效": "Invalid sample delivery statistics date range",
    "寄样费用统计日期范围无效": "Invalid sample delivery cost statistics date range",
    "只有已提交寄样单可以审核": "Only submitted sample delivery orders can be reviewed",
    "只有草稿寄样单可以提交": "Only draft sample delivery orders can be submitted",
    "只有草稿寄样单可以编辑": "Only draft sample delivery orders can be edited",
    "打样去向无效": "Invalid sampling destination",
    "打样完成后才能转为样品登记": (
        "Sampling must be completed before converting to a sample record"
    ),
    "打样日期范围无效": "Invalid sampling date range",
    "打样状态无效": "Invalid sampling status",
    # 仓库入库
    "入库单位需与待入库清单一致": "The inbound unit must match the pending inbound list",
    "入库单没有明细": "The inbound order has no line items",
    "入库单状态无效": "Invalid inbound order status",
    "入库单至少需要一条明细": "The inbound order requires at least one line item",
    "入库商品名称需与待入库清单一致": (
        "The inbound product name must match the pending inbound list"
    ),
    "入库数量不能超过待入库数量": "The inbound quantity cannot exceed the pending inbound quantity",
    "入库明细不属于该入库计划": "The inbound line item does not belong to this inbound plan",
    "入库模式无效": "Invalid inbound mode",
    "入库类型无效": "Invalid inbound type",
    "入库计划没有明细": "The inbound plan has no line items",
    "入库计划状态无效": "Invalid inbound plan status",
    "已关闭或已取消的入库计划不能排库位": (
        "A closed or cancelled inbound plan cannot be assigned a location"
    ),
    "已关闭或已取消的入库计划不能生成入库单": (
        "A closed or cancelled inbound plan cannot generate inbound orders"
    ),
    "只有已提交入库单可以审批": "Only submitted inbound orders can be approved",
    "只有草稿入库单可以提交": "Only draft inbound orders can be submitted",
    "正式入库商品名称需与待入库清单一致": (
        "The final inbound product name must match the pending inbound list"
    ),
    "正式入库数量需与待入库清单一致": (
        "The final inbound quantity must match the pending inbound list"
    ),
    "货物检验全部通过后才能正式入库": (
        "Goods can only be received into stock after all inspections pass"
    ),
    "该计划明细没有待入库数量": "This plan line has no pending inbound quantity",
    "采购合同审批通过后才能生成入库计划": (
        "The purchase contract must be approved before generating an inbound plan"
    ),
    # 仓库出库
    "出库单位需与待出库清单一致": "The outbound unit must match the pending outbound list",
    "出库单没有明细": "The outbound order has no line items",
    "出库单状态无效": "Invalid outbound order status",
    "出库单至少需要一条明细": "The outbound order requires at least one line item",
    "出库商品名称需与待出库清单一致": (
        "The outbound product name must match the pending outbound list"
    ),
    "出库数量不能超过待出库数量": (
        "The outbound quantity cannot exceed the pending outbound quantity"
    ),
    "出库明细不属于该出库计划": "The outbound line item does not belong to this outbound plan",
    "出库来源无效": "Invalid outbound source",
    "出库模式无效": "Invalid outbound mode",
    "出库类型无效": "Invalid outbound type",
    "出库计划没有明细": "The outbound plan has no line items",
    "出库计划状态无效": "Invalid outbound plan status",
    "出货明细审批通过后才能生成出库计划": (
        "Shipment lines must be approved before generating an outbound plan"
    ),
    "出货明细没有商品，无法生成出库计划": (
        "Shipment lines have no products; cannot generate an outbound plan"
    ),
    "库存不足，不能造成非授权负库存": (
        "Insufficient stock; unauthorized negative stock is not allowed"
    ),
    "异常出库必须填写异常原因": "An abnormal outbound requires an exception reason",
    "已关闭或已取消的出库计划不能排库位": (
        "A closed or cancelled outbound plan cannot be assigned a location"
    ),
    "已关闭或已取消的出库计划不能生成出库单": (
        "A closed or cancelled outbound plan cannot generate outbound orders"
    ),
    "只有已提交出库单可以审批": "Only submitted outbound orders can be approved",
    "只有草稿出库单可以提交": "Only draft outbound orders can be submitted",
    "正式出库商品名称需与待出库清单一致": (
        "The final outbound product name must match the pending outbound list"
    ),
    "正式出库数量需与待出库清单一致": (
        "The final outbound quantity must match the pending outbound list"
    ),
    "该出库计划没有待出库数量": "This outbound plan has no pending outbound quantity",
    "该计划明细没有待出库数量": "This plan line has no pending outbound quantity",
    # 财务：报销
    "付款方式无效": "Invalid payment method",
    "报销分类无效": "Invalid reimbursement category",
    "报销单状态无效": "Invalid reimbursement status",
    "报销明细金额合计必须等于报销总金额": (
        "The reimbursement line items must sum to the total amount"
    ),
    "只有已审批通过的报销单可以付款": "Only approved reimbursements can be paid",
    "只有已提交的报销单可以审批": "Only submitted reimbursements can be approved",
    # 财务：付款
    "付款申请人不能审批自己的申请": "Applicants cannot approve their own payment requests",
    "付款申请币种和供应商发票不一致": (
        "The payment request currency does not match the supplier invoice"
    ),
    "付款申请币种必须和供应商发票一致": (
        "The payment request currency must match the supplier invoice"
    ),
    "付款申请状态无效": "Invalid payment request status",
    "付款申请金额不能超过供应商发票未付金额": (
        "The payment request amount cannot exceed the unpaid supplier invoice amount"
    ),
    "付款类型无效": "Invalid payment type",
    "供应商发票关联的供应商不一致": "The supplier invoice references a different supplier",
    "供应商发票关联的开票通知编号不一致": (
        "The supplier invoice references a different invoice notice number"
    ),
    "供应商发票已付清": "The supplier invoice is fully paid",
    "供应商发票币种必须和开票通知一致": (
        "The supplier invoice currency must match the invoice notice"
    ),
    "供应商发票状态无效": "Invalid supplier invoice status",
    "供应商税票收到后才能登记付款发票": (
        "The supplier tax invoice must be received before registering a payment invoice"
    ),
    "只有待审批付款申请可以审批": "Only pending payment requests can be approved",
    "审批付款金额不能超过供应商发票未付金额": (
        "The approved payment amount cannot exceed the unpaid supplier invoice amount"
    ),
    # 财务：合作方费用
    "审批金额不能超过申请金额": "The approved amount cannot exceed the requested amount",
    "付费申请人不能审批自己的申请": "Applicants cannot approve their own fee payment requests",
    "付费申请币种和费用发票不一致": (
        "The fee payment request currency does not match the expense invoice"
    ),
    "付费申请币种必须和费用发票一致": (
        "The fee payment request currency must match the expense invoice"
    ),
    "付费申请状态无效": "Invalid fee payment request status",
    "付费申请金额不能超过费用发票未付金额": (
        "The fee payment request amount cannot exceed the unpaid expense invoice amount"
    ),
    "只有已审批出运单可以登记合作伙伴费用发票": (
        "Partner expense invoices can only be registered for approved shipments"
    ),
    "只能登记启用合作伙伴的费用发票": (
        "Expense invoices can only be registered for active partners"
    ),
    "合作伙伴费用发票关联的出运单号不一致": (
        "The partner expense invoice references a different shipment number"
    ),
    "合作伙伴费用发票关联的合作伙伴名称不一致": (
        "The partner expense invoice references a different partner name"
    ),
    "合作伙伴费用发票关联的合作伙伴类型不一致": (
        "The partner expense invoice references a different partner type"
    ),
    "合作伙伴费用发票已付清": "The partner expense invoice is fully paid",
    "合作伙伴费用发票状态无效": "Invalid partner expense invoice status",
    "费用发票币种必须和出运单币种一致": (
        "The expense invoice currency must match the shipment currency"
    ),
    "费用类型无效": "Invalid expense type",
    "只有待审批付费申请可以审批": "Only pending fee payment requests can be approved",
    "审批付费金额不能超过费用发票未付金额": (
        "The approved fee payment amount cannot exceed the unpaid expense invoice amount"
    ),
    # 财务：收款
    "分摊合同号和合同标识不一致": (
        "The allocation contract number and contract ID do not match"
    ),
    "发票分摊必须填写出口发票号": "Invoice allocation requires the export invoice number",
    "只有待认领水单可以认领": "Only unclaimed bank slips can be claimed",
    "合同分摊必须选择出口合同": "Contract allocation requires selecting an export contract",
    "收款分摊币种必须和银行水单一致": "The receipt allocation currency must match the bank slip",
    "收款分摊类型无效": "Invalid receipt allocation type",
    "收款分摊金额不能超过未分摊金额": (
        "The receipt allocation amount cannot exceed the unallocated amount"
    ),
    "银行水单收款性质无效": "Invalid bank slip receipt nature",
    "银行水单状态无效": "Invalid bank slip status",
    "银行水单认领后才能分摊": "The bank slip must be claimed before allocation",
    "预收款分摊必须填写出口发票号": (
        "Advance payment allocation requires the export invoice number"
    ),
    # 财务：杂费
    "停用杂费项目不能分摊": "A disabled miscellaneous fee item cannot be allocated",
    "只有已审批出运单可以分摊杂费": (
        "Miscellaneous fees can only be allocated to approved shipments"
    ),
    "杂费分摊出运单号和出运单标识不一致": (
        "The miscellaneous fee shipment number and shipment ID do not match"
    ),
    "杂费分摊币种必须和出运单币种一致": (
        "The miscellaneous fee allocation currency must match the shipment currency"
    ),
    "杂费分摊方式无效": "Invalid miscellaneous fee allocation method",
    "杂费分摊状态无效": "Invalid miscellaneous fee allocation status",
    "杂费项目分类无效": "Invalid miscellaneous fee category",
    "杂费项目状态无效": "Invalid miscellaneous fee item status",
    # 财务：结算
    "只有已审批出运单可以财务结算": "Only approved shipments can be financially settled",
    "手工成本币种必须和结算单币种一致": (
        "The manual cost currency must match the settlement currency"
    ),
    "手工成本日期不能晚于结算日期": (
        "The manual cost date cannot be later than the settlement date"
    ),
    "手工成本类型无效": "Invalid manual cost type",
    "结算出运单号和出运单标识不一致": (
        "The settlement shipment number and shipment ID do not match"
    ),
    "结算日期不能早于出运日期": "The settlement date cannot be earlier than the shipment date",
    "该出运单已经生成财务结算": "A financial settlement already exists for this shipment",
    "财务结算状态无效": "Invalid financial settlement status",
    "财务报表不存在": "Financial report not found",
    "财务报表参数无效": "Invalid financial report parameters",
    # 财务：退税
    "只有已领用核销单可以登记报关回单": (
        "Only claimed write-off forms can register customs receipts"
    ),
    "报关回单登记后才能核销": "The customs receipt must be registered before write-off",
    "核销单出运单号和出运单标识不一致": (
        "The write-off form shipment number and shipment ID do not match"
    ),
    "核销单只能关联已审批出运单": "Write-off forms can only be linked to approved shipments",
    "核销单币种必须和出运单一致": "The write-off form currency must match the shipment",
    "核销单提醒状态无效": "Invalid write-off form reminder status",
    "核销单有效期不能早于领用日期": (
        "The write-off form expiry date cannot be earlier than the claim date"
    ),
    "核销单状态无效": "Invalid write-off form status",
    "核销登记后才能登记退税": "Write-off must be registered before registering a tax refund",
    "退税币种必须和核销单一致": "The tax refund currency must match the write-off form",
    "退税金额不能超过未退税金额": "The tax refund amount cannot exceed the unrefunded amount",
    # 财务：口岸数据
    "口岸数据导入状态无效": "Invalid port data import status",
    "进出口报关数据贸易类型无效": "Invalid trade type for import/export customs data",
    "导入批次记录数和明细数量不一致": (
        "The import batch record count does not match the detail count"
    ),
    # 跟单
    "跟单来源记录类型无效": "Invalid follow-up source record type",
    "跟单节点实际日期来源无效": "Invalid follow-up milestone actual date source",
    "跟单计划状态无效": "Invalid follow-up plan status",
    "采购合同审批通过后才能生成跟单计划": (
        "The purchase contract must be approved before generating a follow-up plan"
    ),
    # 审批报表
    "审批状态无效": "Invalid approval status",
    "开始日期不能晚于结束日期": "The start date cannot be later than the end date",
    "审批单据类型无效": "Invalid approval document type",
    # 报表与导出表头
    "状态": "Status",
    "客户": "Customer",
    "币种": "Currency",
    "金额": "Amount",
    "备注": "Remarks",
    "日期": "Date",
    "供应商": "Supplier",
    "数量": "Quantity",
    "单位": "Unit",
    "产品": "Product",
    "寄样单号": "Sample delivery no.",
    "寄样日期": "Delivery date",
    "收件方": "Recipient",
    "快递公司": "Courier",
    "快递单号": "Tracking no.",
    "报价单": "Quotation",
    "样品编号": "Sample no.",
    "费用合计": "Total fee",
    "币种汇总": "Currency summary",
    "水单号": "Bank slip no.",
    "收款日期": "Receipt date",
    "付款方": "Payer",
    "分摊类型": "Allocation type",
    "合同号": "Contract no.",
    "发票号": "Invoice no.",
    "分摊日期": "Allocation date",
    "经办人汇总": "Operator summary",
    "汇总类型": "Summary type",
    "经办人": "Operator",
    "水单数": "Bank slips",
    "总金额": "Total amount",
    "已分摊": "Allocated",
    "未分摊": "Unallocated",
    "付款单号": "Payment no.",
    "供应商发票号": "Supplier invoice no.",
    "采购合同号": "Purchase contract no.",
    "付款类型": "Payment type",
    "申请金额": "Requested amount",
    "审批金额": "Approved amount",
    "已付金额": "Paid amount",
    "未付金额": "Unpaid amount",
    "付费单号": "Fee payment no.",
    "合作伙伴发票号": "Partner invoice no.",
    "合作伙伴": "Partner",
    "伙伴类型": "Partner type",
    "费用类型": "Expense type",
    "出运单": "Shipment",
    "业务员": "Sales rep",
    "核销单号": "Write-off form no.",
    "领用日期": "Claim date",
    "报关单号": "Customs declaration no.",
    "报关回单号": "Customs receipt no.",
    "提醒日期": "Reminder date",
    "催收状态": "Collection status",
    "有效期": "Valid until",
    "可退税额": "Refundable tax",
    "状态汇总": "Status summary",
    "核销单数": "Write-off forms",
    "已退税额": "Refunded tax",
    "待退税额": "Pending refund tax",
    "来源单据": "Source document",
    "分摊金额": "Allocated amount",
    # 财务报表说明
    "水单使用情况明细表": "Bank receipt usage details",
    "银行水单汇总表": "Bank receipt summary",
    "货款支付情况查询": "Goods payment status",
    "费用支付情况查询": "Fee payment status",
    "报关回单催收查询": "Customs receipt collection",
    "申报退税统计": "Tax refund statistics",
    "按水单分摊日期筛选。": "Filtered by bank slip allocation date.",
    "金额取银行水单分摊明细金额，币种取分摊币种。": (
        "Amount comes from bank slip allocation line items; currency is the allocation currency."
    ),
    "按收款日期筛选，并按币种/经办人汇总。": (
        "Filtered by receipt date and summarized by currency/operator."
    ),
    "按付款申请日期筛选，未付金额=申请金额-已付金额。": (
        "Filtered by payment request date; unpaid amount = requested amount - paid amount."
    ),
    "按付费申请日期筛选，支持合作伙伴、费用类型、业务员和状态筛选。": (
        "Filtered by fee payment request date; supports partner, expense type, "
        "sales rep, and status filters."
    ),
    "默认仅统计未登记报关回单的核销单，可选择包含已登记记录。": (
        "By default counts only write-off forms without a customs receipt; "
        "registered records can be included."
    ),
    "可退税额来自核销单，已退税额来自退税登记，待退税额=可退税额-已退税额。": (
        "Refundable tax comes from write-off forms, refunded tax from refund "
        "registrations; outstanding = refundable - refunded."
    ),
    # 打印单据
    "出口销售合同": "SALES CONTRACT",
    "出口合同": "Sales contract",
    "客户与联系人": "Customer and contact",
    "合同条款": "Contract terms",
    "贸易条款": "Trade term",
    "预计出运": "Planned shipment",
    "付款方式": "Payment terms",
    "商品明细": "Product details",
    "商品编号": "Product code",
    "品名": "Product name",
    "规格": "Specification",
    "单价": "Unit price",
    "总数量": "Total quantity",
    "签订日期": "Signing date",
    "无商品明细": "No product details",
    "内部打样单": "SAMPLE REQUEST",
    "打样单号": "Sample request no.",
    "打样日期": "Request date",
    "打样信息": "Sampling information",
    "供应商/打样方": "Supplier / sampling partner",
    "打样去向": "Sampling destination",
    "要求完成": "Required by",
    "客户打样要求": "Customer sampling requirements",
    "内部打样单明细": "Sample request details",
    "要求": "Requirement",
    "无打样明细": "No sampling details",
    "未维护主联系人": "No primary contact on file",
    "职务": "Title",
    "电话": "Phone",
    "邮箱": "Email",
    "内部打样": "In-house sampling",
    "外发工厂": "External factory",
    "海运": "Sea freight",
    "空运": "Air freight",
    "快递": "Express",
    "采购合同": "purchase-contract",
    "地 址": "Address",
    "电 话": "Phone",
    "邮 箱": "Email",
    # 系统与文件
    "上传文件为空": "The uploaded file is empty",
    "仅支持 JPEG / PNG / GIF / WebP 图片": "Only JPEG / PNG / GIF / WebP images are supported",
    "个人待办中存在未指定审批人的单据": "Some personal to-dos have no assigned approver",
    "日程不存在": "Schedule not found",
    "无权限发布公告": "No permission to publish announcements",
    "提醒不存在": "Reminder not found",
    "快捷入口不存在": "Shortcut not found",
}

# 角色名称英文，用于动态模板中的占位符。
ROLE_NAMES: dict[str, str] = {
    "审批人": "approver",
    "QC 负责人": "QC owner",
}

# 动态文案模板：仅在静态匹配未命中后使用，保持顺序稳定。
DYNAMIC_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"^缺少必填字段：(?P<fields>.+)$"), "Missing required fields: {fields}"),
    (
        re.compile(r"^(?P<field>\S+) 必须在 0 到 1（或 0%-100%）之间$"),
        "{field} must be between 0 and 1 (or 0%–100%)",
    ),
    (re.compile(r"^字段校验失败：(?P<detail>.+)$"), "Field validation failed: {detail}"),
    (re.compile(r"^(?P<field>\S+) 不是有效数字$"), "{field} is not a valid number"),
    (
        re.compile(r"^商品编码 (?P<code>.+) 未关联商品资料，请先选择商品后重试$"),
        "Product code {code} is not linked to a product record; "
        "please select a product and try again",
    ),
    (
        re.compile(r"^商品 (?P<reference>.+) 缺少配件明细，无法生成采购合同$"),
        "Product {reference} has no accessory details; cannot generate the purchase contract",
    ),
    (re.compile(r"^不能将自己设为(?P<role>.+)$"), "You cannot set yourself as the {role}"),
    (re.compile(r"^(?P<role>.+)不存在或已停用$"), "{role} does not exist or is disabled"),
    (re.compile(r"^文件超过 (?P<size>\d+)MB 限制$"), "File exceeds the {size}MB limit"),
]
