from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.sales.contracts.schemas import (
    ExportContractPurchaseStatusResponse,
    ExportContractShipmentStatusResponse,
)

VALID_SHIPMENT_STATUSES = ("draft", "submitted", "approved", "rejected")


class ShipmentContractSelection(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_id: str = Field(min_length=1, max_length=36)
    quantity: Decimal | None = Field(default=None, gt=0)


class ShipmentPlanGenerate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    shipment_date: date
    planned_ship_date: date
    shipping_method: str = Field(min_length=1, max_length=80)
    port_of_loading: str = Field(min_length=1, max_length=120)
    port_of_destination: str = Field(min_length=1, max_length=120)
    vessel_name: str | None = Field(default=None, max_length=160)
    container_no: str | None = Field(default=None, max_length=120)
    booking_no: str | None = Field(default=None, max_length=120)
    document_owner_name: str | None = Field(default=None, max_length=160)
    estimated_payable_amount: Decimal = Field(default=Decimal("0"), ge=0)
    remarks: str | None = Field(default=None, max_length=4000)
    selections: list[ShipmentContractSelection] = Field(min_length=1)


class ShipmentApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer_name: str = Field(min_length=1, max_length=160)
    approved_at: date


class ShipmentLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    shipment_id: str
    contract_id: str
    contract_no: str
    contract_line_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: str
    unit: str
    unit_price: str
    amount: str
    planned_ship_date: date


class ShipmentFinanceOverviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    receivable_amount: str
    payable_amount: str
    profit_amount: str
    profit_rate: str
    currency: str


class ShipmentReminderResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    shipment_id: str
    shipment_no: str
    reminder_date: date
    message: str
    status: str


class ShipmentContractProgressResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_id: str
    contract_no: str
    purchase_statuses: list[ExportContractPurchaseStatusResponse]
    shipment_statuses: list[ExportContractShipmentStatusResponse]


class ShipmentPlanResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    shipment_date: date
    planned_ship_date: date
    customer_id: str | None
    customer_name: str
    currency: str
    shipping_method: str
    port_of_loading: str
    port_of_destination: str
    vessel_name: str | None
    container_no: str | None
    booking_no: str | None
    document_owner_name: str | None
    approval_status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    remarks: str | None
    owner_user_id: str
    finance_overview: ShipmentFinanceOverviewResponse
    reminder: ShipmentReminderResponse
    lines: list[ShipmentLineResponse]
    contract_progresses: list[ShipmentContractProgressResponse]


class ShipmentPlanListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ShipmentPlanResponse]
    total: int


class ShipmentReminderListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ShipmentReminderResponse]
    total: int
