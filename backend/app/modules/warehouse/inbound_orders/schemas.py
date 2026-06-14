from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

VALID_INBOUND_ORDER_MODES = ("pending_inspection", "formal")
VALID_INBOUND_ORDER_STATUSES = ("draft", "submitted", "approved", "cancelled")
VALID_STOCK_STATUSES = ("pending_inspection", "available")


class InboundOrderLineReceive(BaseModel):
    model_config = ConfigDict(extra="forbid")

    plan_line_id: str = Field(min_length=1, max_length=36)
    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    quantity: Decimal = Field(gt=Decimal("0"))
    unit: str = Field(min_length=1, max_length=40)
    remark: str | None = None


class InboundOrderGenerateFromPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    plan_id: str = Field(min_length=1, max_length=36)
    code: str = Field(min_length=1, max_length=80)
    inbound_mode: Literal["pending_inspection", "formal"]
    inbound_at: date
    warehouse_id: str = Field(min_length=1, max_length=36)
    warehouse_name: str = Field(min_length=1, max_length=160)
    location_id: str = Field(min_length=1, max_length=36)
    location_name: str = Field(min_length=1, max_length=160)
    operator_name: str = Field(min_length=1, max_length=160)
    lines: list[InboundOrderLineReceive] = Field(default_factory=list)


class InboundOrderApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer_name: str = Field(min_length=1, max_length=160)
    approved_at: date


class InboundOrderLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    order_id: str
    plan_line_id: str
    purchase_contract_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: str
    unit: str
    stock_status: str
    remark: str | None


class InboundOrderResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    plan_id: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_id: str | None
    supplier_name: str
    inbound_type: str
    inbound_mode: str
    inbound_at: date
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    operator_name: str
    status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    owner_user_id: str
    lines: list[InboundOrderLineResponse]


class InboundOrderListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[InboundOrderResponse]
    total: int


class InventoryBalanceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    product_id: str | None
    product_code: str | None
    product_name: str
    available_quantity: str
    locked_quantity: str
    pending_inspection_quantity: str
    unit: str


class InventoryBalanceListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[InventoryBalanceResponse]
    total: int


class InventoryLedgerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    product_id: str | None
    product_code: str | None
    product_name: str
    direction: str
    quantity: str
    unit: str
    stock_status: str
    source_type: str
    source_id: str
    source_code: str
    occurred_at: date
    remark: str | None


class InventoryLedgerListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[InventoryLedgerResponse]
    total: int
