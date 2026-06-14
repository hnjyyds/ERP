from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_RECEIPT_STATUSES = ("unclaimed", "claimed", "partially_allocated", "allocated")
VALID_RECEIPT_TYPES = ("normal", "advance")
VALID_ALLOCATION_TYPES = ("contract", "invoice", "advance")


class BankReceiptCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    receipt_no: str = Field(min_length=1, max_length=80)
    received_at: date
    payer_name: str = Field(min_length=1, max_length=240)
    customer_id: str | None = Field(default=None, max_length=36)
    customer_name: str | None = Field(default=None, max_length=240)
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    bank_account: str = Field(min_length=1, max_length=160)
    reference_no: str | None = Field(default=None, max_length=120)
    receipt_type: str = Field(default="normal", min_length=1, max_length=40)
    remark: str | None = Field(default=None, max_length=2000)


class ReceiptClaimCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    claimed_at: date
    sales_user_id: str | None = Field(default=None, max_length=64)
    sales_user_name: str | None = Field(default=None, max_length=160)
    note: str | None = Field(default=None, max_length=2000)


class ReceiptAllocationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    allocation_type: str = Field(min_length=1, max_length=40)
    contract_id: str | None = Field(default=None, max_length=36)
    contract_no: str | None = Field(default=None, max_length=80)
    invoice_no: str | None = Field(default=None, max_length=120)
    allocated_at: date
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    remark: str | None = Field(default=None, max_length=2000)


class ReceiptClaimResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    receipt_id: str
    claimed_by_user_id: str
    claimed_by_user_name: str
    claimed_at: date
    note: str | None


class ReceiptAllocationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    receipt_id: str
    allocation_type: str
    contract_id: str | None
    contract_no: str | None
    invoice_no: str | None
    allocated_at: date
    amount: str
    currency: str
    remark: str | None


class BankReceiptResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    receipt_no: str
    received_at: date
    payer_name: str
    customer_id: str | None
    customer_name: str | None
    amount: str
    allocated_amount: str
    unallocated_amount: str
    currency: str
    bank_account: str
    reference_no: str | None
    receipt_type: str
    status: str
    claim_message: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    claims: list[ReceiptClaimResponse]
    allocations: list[ReceiptAllocationResponse]


class BankReceiptListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[BankReceiptResponse]
    total: int


class ReceivableItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_id: str
    contract_no: str
    customer_id: str | None
    customer_name: str
    sales_user_id: str | None
    sales_user_name: str | None
    currency: str
    total_amount: str
    received_amount: str
    receivable_amount: str
    status: str


class ReceivableListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ReceivableItemResponse]
    total: int
    total_receivable_amount: str
