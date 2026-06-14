from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

VALID_OUTBOUND_TYPES = (
    "material_outbound",
    "production_outbound",
    "finished_goods_outbound",
    "processing_outbound",
)
VALID_OUTBOUND_SOURCE_TYPES = (
    "shipment_plan",
    "production_requisition",
    "processing_issue",
)
VALID_OUTBOUND_PLAN_STATUSES = ("planned", "scheduled", "closed", "cancelled")


class OutboundPlanGenerateFromShipment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    shipment_plan_id: str = Field(min_length=1, max_length=36)
    outbound_type: Literal[
        "material_outbound",
        "production_outbound",
        "finished_goods_outbound",
        "processing_outbound",
    ] = "finished_goods_outbound"
    planned_date: date | None = None


class OutboundPlanSchedule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    planned_date: date
    warehouse_id: str = Field(min_length=1, max_length=36)
    warehouse_name: str = Field(min_length=1, max_length=160)
    location_id: str = Field(min_length=1, max_length=36)
    location_name: str = Field(min_length=1, max_length=160)
    operator_name: str = Field(min_length=1, max_length=160)


class OutboundPlanLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    plan_id: str
    source_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    planned_quantity: str
    outbound_quantity: str
    unit: str
    status: str
    remark: str | None


class OutboundPlanResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    source_type: str
    source_id: str
    source_code: str
    outbound_type: str
    planned_date: date
    status: str
    customer_id: str | None
    customer_name: str | None
    warehouse_id: str | None
    warehouse_name: str | None
    location_id: str | None
    location_name: str | None
    operator_name: str | None
    owner_user_id: str
    lines: list[OutboundPlanLineResponse]


class OutboundPlanListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[OutboundPlanResponse]
    total: int
