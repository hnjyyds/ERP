"""Static descriptions and source mappings for finance reports."""

from app.modules.finance.reports.schemas import (
    FinanceReportExplanationResponse,
    FinanceReportFieldExplanation,
)

REPORT_SOURCE_TYPES = {
    "receipt-usage": "bank_receipt",
    "goods-payment": "payment_request",
    "fee-payment": "fee_payment_request",
    "customs-receipt-collection": "verification_document",
}


REPORT_EXPLANATIONS = {
    "receipt-usage": FinanceReportExplanationResponse(
        report_key="receipt-usage",
        title="水单使用情况明细表",
        source_tables=["finance_bank_receipts", "finance_receipt_allocations"],
        metric_rules=[
            "按水单分摊日期筛选。",
            "金额取银行水单分摊明细金额，币种取分摊币种。",
        ],
        fields=[
            FinanceReportFieldExplanation(
                label="水单号",
                field="receipt_no",
                formula="finance_bank_receipts.receipt_no",
            ),
            FinanceReportFieldExplanation(
                label="分摊金额",
                field="amount",
                formula="finance_receipt_allocations.amount",
            ),
        ],
    ),
    "bank-receipt-summary": FinanceReportExplanationResponse(
        report_key="bank-receipt-summary",
        title="银行水单汇总表",
        source_tables=["finance_bank_receipts"],
        metric_rules=["按收款日期筛选，并按币种/经办人汇总。"],
        fields=[
            FinanceReportFieldExplanation(
                label="总金额",
                field="total_amount",
                formula="sum(amount)",
            ),
            FinanceReportFieldExplanation(
                label="未分摊",
                field="unallocated_amount",
                formula="sum(amount) - sum(allocated_amount)",
            ),
        ],
    ),
    "goods-payment": FinanceReportExplanationResponse(
        report_key="goods-payment",
        title="货款支付情况查询",
        source_tables=["finance_payment_requests"],
        metric_rules=["按付款申请日期筛选，未付金额=申请金额-已付金额。"],
        fields=[
            FinanceReportFieldExplanation(
                label="付款单号",
                field="request_no",
                formula="finance_payment_requests.request_no",
            ),
            FinanceReportFieldExplanation(
                label="未付金额",
                field="outstanding_amount",
                formula="requested_amount - paid_amount",
            ),
        ],
    ),
    "fee-payment": FinanceReportExplanationResponse(
        report_key="fee-payment",
        title="费用支付情况查询",
        source_tables=["finance_fee_payment_requests"],
        metric_rules=["按付费申请日期筛选，支持合作伙伴、费用类型、业务员和状态筛选。"],
        fields=[
            FinanceReportFieldExplanation(
                label="付费单号",
                field="request_no",
                formula="finance_fee_payment_requests.request_no",
            ),
            FinanceReportFieldExplanation(
                label="未付金额",
                field="outstanding_amount",
                formula="requested_amount - paid_amount",
            ),
        ],
    ),
    "customs-receipt-collection": FinanceReportExplanationResponse(
        report_key="customs-receipt-collection",
        title="报关回单催收查询",
        source_tables=["finance_verification_documents"],
        metric_rules=["默认仅统计未登记报关回单的核销单，可选择包含已登记记录。"],
        fields=[
            FinanceReportFieldExplanation(
                label="核销单号",
                field="document_no",
                formula="finance_verification_documents.document_no",
            ),
            FinanceReportFieldExplanation(
                label="催收状态",
                field="reminder_status",
                formula="finance_verification_documents.reminder_status",
            ),
        ],
    ),
    "tax-refund-statistics": FinanceReportExplanationResponse(
        report_key="tax-refund-statistics",
        title="申报退税统计",
        source_tables=[
            "finance_verification_documents",
            "finance_verification_tax_refunds",
        ],
        metric_rules=["可退税额来自核销单，已退税额来自退税登记，待退税额=可退税额-已退税额。"],
        fields=[
            FinanceReportFieldExplanation(
                label="可退税额",
                field="refundable_amount",
                formula="sum(finance_verification_documents.refundable_amount)",
            ),
            FinanceReportFieldExplanation(
                label="已退税额",
                field="refunded_amount",
                formula="sum(finance_verification_documents.refunded_amount)",
            ),
        ],
    ),
}
