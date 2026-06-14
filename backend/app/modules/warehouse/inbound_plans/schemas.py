from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

VALID_INBOUND_TYPES = (
    "material_inbound",
    "purchase_inbound",
    "processing_inbound",
    "production_inbound",
    "packaging_inbound",
    "sterilization_inbound",
)
VALID_INBOUND_PLAN_STATUSES = ("planned", "scheduled", "closed", "cancelled")


class InboundPlanGenerateFromPurchaseContract(BaseModel):
    model_config = ConfigDict(extra="forbid")

    purchase_contract_id: str = Field(min_length=1, max_length=36)
    inbound_type: Literal[
        "material_inbound",
        "purchase_inbound",
        "processing_inbound",
        "production_inbound",
        "packaging_inbound",
        "sterilization_inbound",
    ] = "purchase_inbound"
    planned_date: date | None = None


class InboundPlanSchedule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    planned_date: date
    warehouse_id: str = Field(min_length=1, max_length=36)
    warehouse_name: str = Field(min_length=1, max_length=160)
    location_id: str = Field(min_length=1, max_length=36)
    location_name: str = Field(min_length=1, max_length=160)
    operator_name: str = Field(min_length=1, max_length=160)


class InboundPlanLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    plan_id: str
    purchase_contract_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    planned_quantity: str
    received_quantity: str
    unit: str
    status: str
    remark: str | None


class InboundPlanResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_id: str | None
    supplier_name: str
    inbound_type: str
    planned_date: date
    status: str
    warehouse_id: str | None
    warehouse_name: str | None
    location_id: str | None
    location_name: str | None
    operator_name: str | None
    owner_user_id: str
    lines: list[InboundPlanLineResponse]


class InboundPlanListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[InboundPlanResponse]
    total: int
