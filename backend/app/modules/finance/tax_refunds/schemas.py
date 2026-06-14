from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_VERIFICATION_DOCUMENT_STATUSES = (
    "issued",
    "customs_receipt_registered",
    "verified",
    "refunded",
)
VALID_VERIFICATION_REMINDER_STATUSES = ("pending", "done", "overdue")


class VerificationDocumentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_no: str = Field(min_length=1, max_length=120)
    received_at: date
    owner_user_id: str | None = Field(default=None, max_length=64)
    owner_user_name: str | None = Field(default=None, max_length=160)
    shipment_plan_id: str | None = Field(default=None, max_length=36)
    shipment_no: str | None = Field(default=None, max_length=80)
    customer_name: str | None = Field(default=None, max_length=240)
    currency: str = Field(min_length=1, max_length=10)
    refundable_amount: Decimal = Field(gt=0)
    valid_until: date
    remark: str | None = Field(default=None, max_length=2000)


class CustomsReceiptRegister(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customs_declaration_no: str = Field(min_length=1, max_length=120)
    customs_receipt_no: str = Field(min_length=1, max_length=120)
    received_at: date
    remark: str | None = Field(default=None, max_length=2000)


class VerificationRegister(BaseModel):
    model_config = ConfigDict(extra="forbid")

    verification_no: str = Field(min_length=1, max_length=120)
    verified_at: date
    remark: str | None = Field(default=None, max_length=2000)


class TaxRefundRegister(BaseModel):
    model_config = ConfigDict(extra="forbid")

    refund_no: str = Field(min_length=1, max_length=120)
    refunded_at: date
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    bank_receipt_no: str | None = Field(default=None, max_length=120)
    remark: str | None = Field(default=None, max_length=2000)


class VerificationTaxRefundResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    verification_document_id: str
    refund_no: str
    refunded_at: date
    amount: str
    currency: str
    bank_receipt_no: str | None
    remark: str | None


class VerificationDocumentResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    document_no: str
    received_at: date
    owner_user_id: str | None
    owner_user_name: str | None
    shipment_plan_id: str | None
    shipment_no: str | None
    customer_name: str | None
    currency: str
    refundable_amount: str
    refunded_amount: str
    unrefunded_amount: str
    valid_until: date
    reminder_date: date
    reminder_status: str
    reminder_message: str
    status: str
    customs_declaration_no: str | None
    customs_receipt_no: str | None
    customs_receipt_at: date | None
    verification_no: str | None
    verified_at: date | None
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    refunds: list[VerificationTaxRefundResponse]


class VerificationDocumentListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[VerificationDocumentResponse]
    total: int


class VerificationUsageItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    verification_document_id: str
    document_no: str
    shipment_plan_id: str | None
    shipment_no: str | None
    owner_user_id: str | None
    owner_user_name: str | None
    customer_name: str | None
    currency: str
    refundable_amount: str
    refunded_amount: str
    unrefunded_amount: str
    valid_until: date
    reminder_date: date
    reminder_status: str
    status: str
    customs_receipt_no: str | None
    verification_no: str | None


class VerificationUsageListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[VerificationUsageItemResponse]
    total: int
    total_refunded_amount: str
