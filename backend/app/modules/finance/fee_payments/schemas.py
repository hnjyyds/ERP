from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_PARTNER_FEE_INVOICE_STATUSES = ("unpaid", "partial", "paid")
VALID_FEE_PAYMENT_REQUEST_STATUSES = ("submitted", "approved", "rejected")
VALID_FEE_TYPES = ("freight", "insurance", "transport", "inspection", "express", "other")


class PartnerFeeInvoiceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    invoice_no: str = Field(min_length=1, max_length=120)
    invoice_date: date
    partner_id: str | None = Field(default=None, max_length=36)
    partner_name: str = Field(min_length=1, max_length=240)
    partner_type: str | None = Field(default=None, max_length=40)
    shipment_plan_id: str | None = Field(default=None, max_length=36)
    shipment_no: str | None = Field(default=None, max_length=80)
    sales_user_id: str | None = Field(default=None, max_length=64)
    sales_user_name: str | None = Field(default=None, max_length=160)
    fee_type: str = Field(min_length=1, max_length=40)
    total_amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    due_date: date | None = None
    remark: str | None = Field(default=None, max_length=2000)


class FeePaymentRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    request_no: str = Field(min_length=1, max_length=120)
    partner_fee_invoice_id: str = Field(min_length=1, max_length=36)
    request_date: date
    requested_amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    remark: str | None = Field(default=None, max_length=2000)


class FeePaymentRequestApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    approved_amount: Decimal = Field(gt=0)
    approved_at: date
    reviewer_name: str = Field(min_length=1, max_length=160)
    payment_account: str | None = Field(default=None, max_length=160)
    remark: str | None = Field(default=None, max_length=2000)


class FeePaymentAllocationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    fee_payment_request_id: str
    partner_fee_invoice_id: str
    allocated_at: date
    amount: str
    currency: str
    remark: str | None


class FeePaymentRequestResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    request_no: str
    partner_fee_invoice_id: str
    partner_fee_invoice_no: str
    partner_id: str | None
    partner_name: str
    partner_type: str | None
    shipment_plan_id: str | None
    shipment_no: str | None
    sales_user_id: str | None
    sales_user_name: str | None
    fee_type: str
    request_date: date
    requested_amount: str
    approved_amount: str
    paid_amount: str
    currency: str
    status: str
    requester_user_id: str
    requester_user_name: str
    reviewer_name: str | None
    approved_at: date | None
    payment_account: str | None
    remark: str | None


class PartnerFeeInvoiceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    invoice_no: str
    invoice_date: date
    partner_id: str | None
    partner_name: str
    partner_type: str | None
    shipment_plan_id: str | None
    shipment_no: str | None
    sales_user_id: str | None
    sales_user_name: str | None
    fee_type: str
    total_amount: str
    paid_amount: str
    unpaid_amount: str
    currency: str
    due_date: date | None
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    fee_payment_requests: list[FeePaymentRequestResponse]
    allocations: list[FeePaymentAllocationResponse]


class PartnerFeeInvoiceListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PartnerFeeInvoiceResponse]
    total: int


class FeePaymentRequestListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[FeePaymentRequestResponse]
    total: int


class FeePayableItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    partner_fee_invoice_id: str
    invoice_no: str
    partner_id: str | None
    partner_name: str
    partner_type: str | None
    shipment_plan_id: str | None
    shipment_no: str | None
    sales_user_id: str | None
    sales_user_name: str | None
    fee_type: str
    currency: str
    total_amount: str
    paid_amount: str
    payable_amount: str
    due_date: date | None
    status: str


class FeePayableListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[FeePayableItemResponse]
    total: int
    total_payable_amount: str
