from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.sample.records.schemas import SampleImageCreate

VALID_SAMPLE_STATUSES = ("draft", "sent", "in_progress", "completed", "cancelled")
VALID_SAMPLE_DESTINATIONS = ("in_house", "factory")
VALID_SAMPLE_FEE_PAYMENT_STATUSES = ("not_requested", "requested", "paid")


class SampleRequestLineCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    specification: str | None = Field(default=None, max_length=240)
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    requirement: str | None = Field(default=None, max_length=2000)


class SampleRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    request_date: date
    customer_id: str | None = Field(default=None, max_length=36)
    customer_name: str = Field(min_length=1, max_length=240)
    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str | None = Field(default=None, max_length=240)
    supplier_id: str | None = Field(default=None, max_length=36)
    supplier_name: str | None = Field(default=None, max_length=240)
    sales_user_id: str | None = Field(default=None, max_length=36)
    sales_user_name: str | None = Field(default=None, max_length=160)
    destination: str = Field(default="in_house", min_length=1, max_length=40)
    requirements: str = Field(min_length=1, max_length=4000)
    due_date: date | None = None
    status: str = Field(default="draft", min_length=1, max_length=40)
    lines: list[SampleRequestLineCreate] = Field(default_factory=list)


class SampleProgressCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage: str = Field(min_length=1, max_length=80)
    status: str = Field(min_length=1, max_length=40)
    occurred_at: date
    note: str | None = Field(default=None, max_length=2000)
    handler_name: str | None = Field(default=None, max_length=160)


class SampleFeeCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fee_type: str = Field(min_length=1, max_length=80)
    amount: Decimal = Field(ge=0)
    currency: str = Field(min_length=1, max_length=10)
    payee_type: str = Field(min_length=1, max_length=40)
    payee_name: str = Field(min_length=1, max_length=240)
    remark: str | None = Field(default=None, max_length=2000)


class SampleRequestLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    sample_request_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    quantity: str
    unit: str
    requirement: str | None


class SampleProgressResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    sample_request_id: str
    stage: str
    status: str
    occurred_at: date
    note: str | None
    handler_name: str | None


class SampleFeeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    sample_request_id: str
    fee_type: str
    amount: str
    currency: str
    payee_type: str
    payee_name: str
    remark: str | None
    payment_status: str
    payment_request_no: str | None
    finance_invoice_no: str | None
    finance_payment_request_id: str | None


class SampleRequestResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    request_date: date
    customer_id: str | None
    customer_name: str
    product_id: str | None
    product_code: str | None
    product_name: str | None
    supplier_id: str | None
    supplier_name: str | None
    sales_user_id: str | None
    sales_user_name: str | None
    destination: str
    requirements: str
    due_date: date | None
    status: str
    owner_user_id: str
    lines: list[SampleRequestLineResponse]
    progress_events: list[SampleProgressResponse]
    fees: list[SampleFeeResponse]


class SampleRequestListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SampleRequestResponse]
    total: int


class SampleRequestToRecordCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    sample_type: str = Field(default="confirm_sample", min_length=1, max_length=40)
    status: str = Field(default="registered", min_length=1, max_length=40)
    received_at: date
    submitted_at: date | None = None
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    customer_sku: str | None = Field(default=None, max_length=120)
    supplier_sku: str | None = Field(default=None, max_length=120)
    purchase_contract_id: str | None = Field(default=None, max_length=36)
    purchase_contract_no: str | None = Field(default=None, max_length=80)
    description: str | None = Field(default=None, max_length=4000)
    images: list[SampleImageCreate] = Field(default_factory=list)
