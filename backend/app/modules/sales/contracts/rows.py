"""Typed read models returned by the export contract repository."""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal


@dataclass(frozen=True)
class ExportContractRow:
    id: str
    code: str
    contract_date: date
    customer_id: str | None
    customer_name: str
    sales_user_id: str | None
    sales_user_name: str | None
    currency: str
    trade_term: str
    planned_ship_date: date
    payment_terms: str
    source_quotation_id: str | None
    source_quotation_no: str | None
    remarks: str | None
    total_quantity: str
    total_amount: str
    shipped_quantity: str
    shipped_amount: str
    unshipped_quantity: str
    unshipped_amount: str
    purchased_quantity: str
    unpurchased_quantity: str
    advance_payment_amount: str
    approval_status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_id: str | None
    reviewer_name: str | None
    signature_status: str
    customer_signed_at: date | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class ExportContractLineRow:
    id: str
    contract_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: Decimal
    unit: str
    unit_price: Decimal
    amount: str
    purchased_quantity: Decimal
    unpurchased_quantity: str
    shipped_quantity: Decimal
    unshipped_quantity: str
    shipped_amount: str
    unshipped_amount: str
    image_url: str | None
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class ExportContractSignatureRow:
    id: str
    contract_id: str
    signed_by: str
    signed_at: date
    signature_method: str
    file_no: str | None
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class ExportContractAdvancePaymentRow:
    id: str
    contract_id: str
    payment_no: str
    received_at: date
    amount: str
    currency: str
    payer_name: str
    remark: str | None
    created_at: datetime


@dataclass
class ExportContractDetails:
    """Child rows loaded in batches for export-contract responses."""

    lines: list[ExportContractLineRow]
    signatures: list[ExportContractSignatureRow]
    advance_payments: list[ExportContractAdvancePaymentRow]


@dataclass(frozen=True)
class ExportContractEventRow:
    id: str
    contract_id: str
    contract_no: str
    event_type: str
    payload: str
    created_at: datetime
