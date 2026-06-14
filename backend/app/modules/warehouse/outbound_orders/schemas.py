from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

VALID_OUTBOUND_ORDER_MODES = ("formal", "exception")
VALID_OUTBOUND_ORDER_STATUSES = ("draft", "submitted", "approved", "cancelled")
VALID_OUTBOUND_STOCK_STATUSES = ("available",)


class OutboundOrderLineShip(BaseModel):
    model_config = ConfigDict(extra="forbid")

    plan_line_id: str = Field(min_length=1, max_length=36)
    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    quantity: Decimal = Field(gt=Decimal("0"))
    unit: str = Field(min_length=1, max_length=40)
    remark: str | None = None


class OutboundOrderGenerateFromPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    plan_id: str = Field(min_length=1, max_length=36)
    code: str = Field(min_length=1, max_length=80)
    outbound_mode: Literal["formal", "exception"]
    outbound_at: date
    warehouse_id: str = Field(min_length=1, max_length=36)
    warehouse_name: str = Field(min_length=1, max_length=160)
    location_id: str = Field(min_length=1, max_length=36)
    location_name: str = Field(min_length=1, max_length=160)
    operator_name: str = Field(min_length=1, max_length=160)
    exception_reason: str | None = Field(default=None, max_length=4000)
    lines: list[OutboundOrderLineShip] = Field(default_factory=list)


class OutboundOrderApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer_name: str = Field(min_length=1, max_length=160)
    approved_at: date
    allow_negative: bool = False


class OutboundOrderLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    order_id: str
    plan_line_id: str
    source_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: str
    unit: str
    stock_status: str
    remark: str | None


class OutboundOrderResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    plan_id: str
    source_type: str
    source_id: str
    source_code: str
    outbound_type: str
    customer_id: str | None
    customer_name: str | None
    outbound_mode: str
    outbound_at: date
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    operator_name: str
    status: str
    exception_reason: str | None
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    owner_user_id: str
    lines: list[OutboundOrderLineResponse]


class OutboundOrderListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[OutboundOrderResponse]
    total: int
