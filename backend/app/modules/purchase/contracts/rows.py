from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal


@dataclass(frozen=True)
class PurchaseContractRow:
    id: str
    code: str
    contract_date: date
    supplier_id: str | None
    supplier_name: str
    buyer_user_id: str | None
    buyer_user_name: str | None
    qc_user_id: str | None
    qc_user_name: str | None
    currency: str
    delivery_date: date
    payment_terms: str
    source_type: str
    remarks: str | None
    approval_status: str
    submitted_at: date | None
    approved_at: date | None
    rejected_at: date | None
    rejection_reason: str | None
    reviewer_id: str | None
    reviewer_name: str | None
    total_quantity: str
    total_amount: str
    received_quantity: str
    unreceived_quantity: str
    paid_amount: str
    unpaid_amount: str
    cancelled_at: datetime | None
    cancelled_by_id: str | None
    cancelled_by_name: str | None
    cancel_reason: str | None
    reissued_from_id: str | None
    reissued_from_code: str | None
    reissue_reason: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class PurchaseContractLineRow:
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
    received_quantity: Decimal
    unreceived_quantity: str
    source_export_contract_id: str | None
    source_export_contract_no: str | None
    source_export_contract_line_id: str | None
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class PurchaseContractSourceLinkRow:
    id: str
    contract_id: str
    export_contract_id: str
    export_contract_no: str
    export_contract_line_id: str
    customer_name: str
    product_id: str | None
    product_code: str | None
    demand_quantity: str
    unit: str
    created_at: datetime


@dataclass(frozen=True)
class PurchaseContractReminderRow:
    id: str
    contract_id: str
    reminder_type: str
    title: str
    due_date: date
    amount: str | None
    currency: str
    status: str
    created_at: datetime


@dataclass
class PurchaseContractDetails:
    """Child rows loaded in batches for purchase-contract responses."""

    lines: list[PurchaseContractLineRow]
    source_links: list[PurchaseContractSourceLinkRow]
    reminders: list[PurchaseContractReminderRow]
