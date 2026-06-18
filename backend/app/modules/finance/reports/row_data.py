"""Row and summary dataclasses returned by the finance reports repository.

These are plain read-only data containers shared between the repository and the
service layer. They live in their own module to keep ``repositories.py`` focused
on query logic.
"""

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class ReceiptUsageDetailRowData:
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


@dataclass(frozen=True)
class ReceiptUsageCurrencySummaryData:
    currency: str
    allocation_count: int
    allocated_amount: str


@dataclass(frozen=True)
class BankReceiptCurrencySummaryData:
    currency: str
    receipt_count: int
    total_amount: str
    allocated_amount: str
    unallocated_amount: str


@dataclass(frozen=True)
class BankReceiptOperatorSummaryData:
    operator_name: str
    currency: str
    receipt_count: int
    total_amount: str


@dataclass(frozen=True)
class PaymentQueryRowData:
    request_no: str
    request_date: date
    reference_no: str
    party_name: str
    secondary_ref: str | None
    type_label: str
    currency: str
    requested_amount: str
    approved_amount: str
    paid_amount: str
    outstanding_amount: str
    status: str
    partner_type: str | None = None
    shipment_no: str | None = None
    sales_user_name: str | None = None


@dataclass(frozen=True)
class PaymentCurrencySummaryData:
    currency: str
    request_count: int
    requested_amount: str
    approved_amount: str
    paid_amount: str
    outstanding_amount: str


@dataclass(frozen=True)
class CustomsReceiptCollectionRowData:
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


@dataclass(frozen=True)
class CustomsReceiptStatusSummaryData:
    reminder_status: str
    count: int


@dataclass(frozen=True)
class TaxRefundStatusSummaryData:
    status: str
    currency: str
    document_count: int
    refundable_amount: str
    refunded_amount: str
    outstanding_amount: str


@dataclass(frozen=True)
class TaxRefundCurrencyTotalData:
    currency: str
    document_count: int
    refundable_amount: str
    refunded_amount: str
    outstanding_amount: str
