from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_SUPPLIER_INVOICE_STATUSES = ("unpaid", "partial", "paid")
VALID_PAYMENT_REQUEST_STATUSES = ("submitted", "approved", "rejected")
VALID_PAYMENT_TYPES = ("prepayment", "goods_payment", "other")


class SupplierInvoiceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    invoice_no: str = Field(min_length=1, max_length=120)
    invoice_date: date
    supplier_id: str | None = Field(default=None, max_length=36)
    supplier_name: str = Field(min_length=1, max_length=240)
    purchase_invoice_notice_id: str | None = Field(default=None, max_length=36)
    purchase_invoice_notice_code: str | None = Field(default=None, max_length=80)
    purchase_contract_id: str | None = Field(default=None, max_length=36)
    purchase_contract_no: str | None = Field(default=None, max_length=80)
    total_amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    due_date: date | None = None
    remark: str | None = Field(default=None, max_length=2000)


class PaymentRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    request_no: str = Field(min_length=1, max_length=120)
    supplier_invoice_id: str = Field(min_length=1, max_length=36)
    payment_type: str = Field(min_length=1, max_length=40)
    request_date: date
    requested_amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    remark: str | None = Field(default=None, max_length=2000)


class PaymentRequestApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    approved_amount: Decimal = Field(gt=0)
    approved_at: date
    reviewer_name: str = Field(min_length=1, max_length=160)
    payment_account: str | None = Field(default=None, max_length=160)
    remark: str | None = Field(default=None, max_length=2000)


class PaymentAllocationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    payment_request_id: str
    supplier_invoice_id: str
    allocated_at: date
    amount: str
    currency: str
    remark: str | None


class PaymentRequestResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    request_no: str
    supplier_invoice_id: str
    supplier_invoice_no: str
    supplier_id: str | None
    supplier_name: str
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    payment_type: str
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


class SupplierInvoiceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    invoice_no: str
    invoice_date: date
    supplier_id: str | None
    supplier_name: str
    purchase_invoice_notice_id: str | None
    purchase_invoice_notice_code: str | None
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    total_amount: str
    paid_amount: str
    unpaid_amount: str
    currency: str
    due_date: date | None
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    payment_requests: list[PaymentRequestResponse]
    allocations: list[PaymentAllocationResponse]


class SupplierInvoiceListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SupplierInvoiceResponse]
    total: int


class PaymentRequestListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PaymentRequestResponse]
    total: int


class PayableItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    supplier_invoice_id: str
    invoice_no: str
    supplier_id: str | None
    supplier_name: str
    purchase_invoice_notice_id: str | None
    purchase_invoice_notice_code: str | None
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    currency: str
    total_amount: str
    paid_amount: str
    payable_amount: str
    due_date: date | None
    status: str


class PayableListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PayableItemResponse]
    total: int
    total_payable_amount: str
