"""Typed read models returned by the sample delivery repository."""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal


@dataclass(frozen=True)
class SampleDeliveryRow:
    id: str
    code: str
    delivery_date: date
    customer_id: str | None
    customer_name: str
    supplier_id: str | None
    supplier_name: str | None
    factory_id: str | None
    factory_name: str | None
    recipient_name: str
    recipient_company: str | None
    recipient_address: str
    express_company: str
    tracking_no: str | None
    quote_id: str | None
    quote_no: str | None
    remark: str | None
    status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    owner_user_id: str
    created_at: datetime


@dataclass(frozen=True)
class SampleDeliveryLineRow:
    id: str
    delivery_id: str
    sample_record_id: str
    sample_code: str | None
    sample_type: str
    product_id: str | None
    product_code: str | None
    product_name: str
    quantity: Decimal
    unit: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class SampleDeliveryFeeRow:
    id: str
    delivery_id: str
    fee_type: str
    amount: Decimal
    currency: str
    payer_type: str
    remark: str | None
    created_at: datetime


@dataclass(frozen=True)
class SampleDeliveryFeeStatisticRow:
    customer_id: str | None
    customer_name: str
    express_company: str
    currency: str
    total_amount: str
    delivery_count: int


@dataclass(frozen=True)
class SampleDeliveryStatusStatisticRow:
    status: str
    delivery_count: int
    total_quantity: Decimal


@dataclass(frozen=True)
class SampleDeliveryCustomerStatisticRow:
    customer_id: str | None
    customer_name: str
    delivery_count: int
    total_quantity: Decimal


@dataclass(frozen=True)
class SampleDeliveryExpressStatisticRow:
    express_company: str
    delivery_count: int
    total_quantity: Decimal
