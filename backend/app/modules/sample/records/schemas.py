from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_SAMPLE_RECORD_TYPES = ("incoming", "confirm_sample", "bulk_sample", "retained_sample")
VALID_SAMPLE_RECORD_STATUSES = ("registered", "submitted", "confirmed", "archived")
VALID_SAMPLE_STOCK_EVENT_TYPES = ("received", "delivered")


class SampleImageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    file_id: str = Field(min_length=1, max_length=120)
    filename: str = Field(min_length=1, max_length=240)
    url: str = Field(min_length=1, max_length=2000)
    caption: str | None = Field(default=None, max_length=240)
    is_primary: bool = False


class SampleStockEventCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_type: str = Field(min_length=1, max_length=40)
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    occurred_at: date
    delivery_no: str | None = Field(default=None, max_length=80)
    recipient: str | None = Field(default=None, max_length=240)
    note: str | None = Field(default=None, max_length=2000)


class SampleRecordCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    sample_type: str = Field(min_length=1, max_length=40)
    status: str = Field(default="registered", min_length=1, max_length=40)
    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    customer_id: str | None = Field(default=None, max_length=36)
    customer_name: str | None = Field(default=None, max_length=240)
    supplier_id: str | None = Field(default=None, max_length=36)
    supplier_name: str | None = Field(default=None, max_length=240)
    customer_sku: str | None = Field(default=None, max_length=120)
    supplier_sku: str | None = Field(default=None, max_length=120)
    purchase_contract_id: str | None = Field(default=None, max_length=36)
    purchase_contract_no: str | None = Field(default=None, max_length=80)
    source_type: str | None = Field(default=None, max_length=80)
    source_id: str | None = Field(default=None, max_length=36)
    source_code: str | None = Field(default=None, max_length=80)
    source_note: str | None = Field(default=None, max_length=2000)
    received_at: date
    submitted_at: date | None = None
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    description: str | None = Field(default=None, max_length=4000)
    images: list[SampleImageCreate] = Field(default_factory=list)


class SampleImageResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    sample_record_id: str
    file_id: str
    filename: str
    url: str
    caption: str | None
    is_primary: bool


class SampleStockEventResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    sample_record_id: str
    event_type: str
    quantity: str
    unit: str
    occurred_at: date
    delivery_no: str | None
    recipient: str | None
    note: str | None


class SampleStockSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sample_record_id: str
    received_quantity: str
    delivered_quantity: str
    retained_quantity: str
    unit: str


class SampleFollowupEventResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    sample_record_id: str
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    node_code: str
    node_label: str
    actual_date: date
    event_type: str


class SampleRecordResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    sample_type: str
    status: str
    product_id: str | None
    product_code: str | None
    product_name: str
    customer_id: str | None
    customer_name: str | None
    supplier_id: str | None
    supplier_name: str | None
    customer_sku: str | None
    supplier_sku: str | None
    purchase_contract_id: str | None
    purchase_contract_no: str | None
    source_type: str | None
    source_id: str | None
    source_code: str | None
    source_note: str | None
    received_at: date
    submitted_at: date | None
    quantity: str
    unit: str
    description: str | None
    owner_user_id: str
    images: list[SampleImageResponse]
    stock_summary: SampleStockSummaryResponse
    stock_events: list[SampleStockEventResponse]
    followup_events: list[SampleFollowupEventResponse]


class SampleRecordListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SampleRecordResponse]
    total: int
