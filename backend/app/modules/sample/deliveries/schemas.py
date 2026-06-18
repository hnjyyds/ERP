from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_SAMPLE_DELIVERY_STATUSES = ("draft", "submitted", "approved", "rejected", "shipped")


class SampleDeliveryLineCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sample_record_id: str = Field(min_length=1, max_length=36)
    sample_code: str | None = Field(default=None, max_length=80)
    sample_type: str = Field(min_length=1, max_length=40)
    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    remark: str | None = Field(default=None, max_length=2000)


class SampleDeliveryFeeCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fee_type: str = Field(min_length=1, max_length=80)
    amount: Decimal = Field(ge=0)
    currency: str = Field(min_length=1, max_length=10)
    payer_type: str = Field(min_length=1, max_length=40)
    remark: str | None = Field(default=None, max_length=2000)


class SampleDeliveryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    delivery_date: date
    customer_id: str | None = Field(default=None, max_length=36)
    customer_name: str = Field(min_length=1, max_length=240)
    supplier_id: str | None = Field(default=None, max_length=36)
    supplier_name: str | None = Field(default=None, max_length=240)
    factory_id: str | None = Field(default=None, max_length=36)
    factory_name: str | None = Field(default=None, max_length=240)
    recipient_name: str = Field(min_length=1, max_length=160)
    recipient_company: str | None = Field(default=None, max_length=240)
    recipient_address: str = Field(min_length=1, max_length=2000)
    express_company: str = Field(min_length=1, max_length=120)
    tracking_no: str | None = Field(default=None, max_length=120)
    quote_id: str | None = Field(default=None, max_length=36)
    quote_no: str | None = Field(default=None, max_length=80)
    remark: str | None = Field(default=None, max_length=4000)
    lines: list[SampleDeliveryLineCreate] = Field(min_length=1)
    fees: list[SampleDeliveryFeeCreate] = Field(default_factory=list)


class SampleDeliveryApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer_name: str = Field(min_length=1, max_length=160)
    approved_at: date


class SampleDeliveryTrackingUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    express_company: str = Field(min_length=1, max_length=120)
    tracking_no: str = Field(min_length=1, max_length=120)
    status: str = Field(default="shipped", min_length=1, max_length=40)


class SampleDeliveryLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    delivery_id: str
    sample_record_id: str
    sample_code: str | None
    sample_type: str
    product_id: str | None
    product_code: str | None
    product_name: str
    quantity: str
    unit: str
    remark: str | None


class SampleDeliveryFeeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    delivery_id: str
    fee_type: str
    amount: str
    currency: str
    payer_type: str
    remark: str | None


class SampleDeliveryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

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
    lines: list[SampleDeliveryLineResponse]
    fees: list[SampleDeliveryFeeResponse]
    fee_total: str


class SampleDeliveryListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SampleDeliveryResponse]
    total: int


class SampleDeliveryFeeStatisticResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_id: str | None
    customer_name: str
    express_company: str
    currency: str
    total_amount: str
    delivery_count: int


class SampleDeliveryFeeStatisticsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[SampleDeliveryFeeStatisticResponse]
    total_amount: str
    currency: str


class SampleDeliveryStatusStatisticResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str
    delivery_count: int
    total_quantity: str


class SampleDeliveryCustomerStatisticResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_id: str | None
    customer_name: str
    delivery_count: int
    total_quantity: str


class SampleDeliveryExpressStatisticResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    express_company: str
    delivery_count: int
    total_quantity: str


class SampleDeliveryStatisticsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_deliveries: int
    total_quantity: str
    by_status: list[SampleDeliveryStatusStatisticResponse]
    by_customer: list[SampleDeliveryCustomerStatisticResponse]
    by_express: list[SampleDeliveryExpressStatisticResponse]


class SampleDeliveryExportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str
    content_type: str
    content: str
    total: int
