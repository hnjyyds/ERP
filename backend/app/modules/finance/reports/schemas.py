"""Response models for finance statistical reports (read-only aggregations).

All monetary values are serialised as ``str`` with two decimal places to match
the convention used by the finance overview module.
"""

from datetime import date

from pydantic import BaseModel, ConfigDict

# ---------------------------------------------------------------------------
# 1. 水单使用情况明细表 (bank receipt usage detail)
#    Source tables: finance_bank_receipts + finance_receipt_allocations
# ---------------------------------------------------------------------------


class ReceiptUsageDetailRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    receipt_no: str
    received_at: date
    payer_name: str
    customer_name: str | None
    allocation_type: str
    contract_no: str | None
    invoice_no: str | None
    allocated_at: date
    currency: str
    amount: str


class ReceiptUsageCurrencySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency: str
    allocation_count: int
    allocated_amount: str


class ReceiptUsageDetailResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rows: list[ReceiptUsageDetailRow]
    currency_summaries: list[ReceiptUsageCurrencySummary]
    total_count: int


# ---------------------------------------------------------------------------
# 2. 银行水单汇总表 (bank receipt summary)
#    Source table: finance_bank_receipts
# ---------------------------------------------------------------------------


class BankReceiptCurrencySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency: str
    receipt_count: int
    total_amount: str
    allocated_amount: str
    unallocated_amount: str


class BankReceiptOperatorSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # NOTE: finance_bank_receipts has no dedicated salesperson column, so the
    # recording operator (created_by_user_name) is used as the closest proxy
    # for the "业务员" dimension requested by the report.
    operator_name: str
    currency: str
    receipt_count: int
    total_amount: str


class BankReceiptSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency_summaries: list[BankReceiptCurrencySummary]
    operator_summaries: list[BankReceiptOperatorSummary]
    receipt_count: int


# ---------------------------------------------------------------------------
# 3. 货款支付情况查询 (goods payment query)
#    Source table: finance_payment_requests
# ---------------------------------------------------------------------------


class GoodsPaymentQueryRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    request_no: str
    request_date: date
    supplier_invoice_no: str
    supplier_name: str
    purchase_contract_no: str | None
    payment_type: str
    currency: str
    requested_amount: str
    approved_amount: str
    paid_amount: str
    outstanding_amount: str
    status: str


class GoodsPaymentCurrencySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency: str
    request_count: int
    requested_amount: str
    approved_amount: str
    paid_amount: str
    outstanding_amount: str


class GoodsPaymentQueryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rows: list[GoodsPaymentQueryRow]
    currency_summaries: list[GoodsPaymentCurrencySummary]
    total_count: int


# ---------------------------------------------------------------------------
# 4. 费用支付情况查询 (fee payment query)
#    Source table: finance_fee_payment_requests
# ---------------------------------------------------------------------------


class FeePaymentQueryRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    request_no: str
    request_date: date
    partner_fee_invoice_no: str
    partner_name: str
    partner_type: str | None
    fee_type: str
    shipment_no: str | None
    sales_user_name: str | None
    currency: str
    requested_amount: str
    approved_amount: str
    paid_amount: str
    outstanding_amount: str
    status: str


class FeePaymentCurrencySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency: str
    request_count: int
    requested_amount: str
    approved_amount: str
    paid_amount: str
    outstanding_amount: str


class FeePaymentQueryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rows: list[FeePaymentQueryRow]
    currency_summaries: list[FeePaymentCurrencySummary]
    total_count: int


# ---------------------------------------------------------------------------
# 5. 报关回单催收查询 (customs receipt collection)
#    Source table: finance_verification_documents (customs receipt not registered)
# ---------------------------------------------------------------------------


class CustomsReceiptCollectionRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_no: str
    received_at: date
    owner_user_name: str | None
    shipment_no: str | None
    customer_name: str | None
    customs_declaration_no: str | None
    customs_receipt_no: str | None
    reminder_date: date
    reminder_status: str
    valid_until: date
    currency: str
    refundable_amount: str


class CustomsReceiptStatusSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reminder_status: str
    count: int


class CustomsReceiptCollectionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rows: list[CustomsReceiptCollectionRow]
    status_summaries: list[CustomsReceiptStatusSummary]
    total_count: int


# ---------------------------------------------------------------------------
# 6. 申报退税统计 (tax refund statistics)
#    Source tables: finance_verification_documents + finance_verification_tax_refunds
# ---------------------------------------------------------------------------


class TaxRefundStatusSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str
    currency: str
    document_count: int
    refundable_amount: str
    refunded_amount: str
    outstanding_amount: str


class TaxRefundCurrencyTotal(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency: str
    document_count: int
    refundable_amount: str
    refunded_amount: str
    outstanding_amount: str


class TaxRefundStatisticsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status_summaries: list[TaxRefundStatusSummary]
    currency_totals: list[TaxRefundCurrencyTotal]
    document_count: int
    refund_record_count: int
