from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

VALID_PURCHASE_CONTRACT_STATUSES = ("draft", "submitted", "approved")
VALID_PURCHASE_CONTRACT_SOURCE_TYPES = ("export_contract", "stock_purchase", "manual")


class PurchaseContractLineCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    specification: str | None = Field(default=None, max_length=240)
    model: str | None = Field(default=None, max_length=120)
    quantity: Decimal = Field(gt=0)
    unit: str = Field(min_length=1, max_length=40)
    unit_price: Decimal = Field(ge=0)
    source_export_contract_id: str | None = Field(default=None, max_length=36)
    source_export_contract_no: str | None = Field(default=None, max_length=80)
    source_export_contract_line_id: str | None = Field(default=None, max_length=36)
    remark: str | None = Field(default=None, max_length=2000)


class PurchaseContractCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    contract_date: date
    supplier_id: str | None = Field(default=None, max_length=36)
    supplier_name: str = Field(min_length=1, max_length=240)
    buyer_user_id: str | None = Field(default=None, max_length=36)
    buyer_user_name: str | None = Field(default=None, max_length=160)
    qc_user_id: str | None = Field(default=None, max_length=36)
    qc_user_name: str | None = Field(default=None, max_length=160)
    currency: str = Field(min_length=1, max_length=10)
    delivery_date: date
    payment_terms: str = Field(min_length=1, max_length=2000)
    source_type: Literal["export_contract", "stock_purchase", "manual"]
    remarks: str | None = Field(default=None, max_length=4000)
    lines: list[PurchaseContractLineCreate] = Field(min_length=1)


class PurchaseContractSourceSelection(BaseModel):
    model_config = ConfigDict(extra="forbid")

    export_contract_id: str = Field(min_length=1, max_length=36)


class PurchaseContractGenerateFromExportContracts(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    contract_date: date
    supplier_id: str | None = Field(default=None, max_length=36)
    supplier_name: str = Field(min_length=1, max_length=240)
    buyer_user_id: str | None = Field(default=None, max_length=36)
    buyer_user_name: str | None = Field(default=None, max_length=160)
    qc_user_id: str | None = Field(default=None, max_length=36)
    qc_user_name: str | None = Field(default=None, max_length=160)
    currency: str = Field(min_length=1, max_length=10)
    delivery_date: date
    payment_terms: str = Field(min_length=1, max_length=2000)
    unit_price: Decimal = Field(ge=0)
    remarks: str | None = Field(default=None, max_length=4000)
    sources: list[PurchaseContractSourceSelection] = Field(min_length=1)


class PurchaseContractApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer_name: str = Field(min_length=1, max_length=160)
    approved_at: date


class PurchaseContractStatisticsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_quantity: str
    total_amount: str
    received_quantity: str
    unreceived_quantity: str
    paid_amount: str
    unpaid_amount: str


class PurchaseContractLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    contract_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    specification: str | None
    model: str | None
    quantity: str
    unit: str
    unit_price: str
    amount: str
    received_quantity: str
    unreceived_quantity: str
    source_export_contract_id: str | None
    source_export_contract_no: str | None
    source_export_contract_line_id: str | None
    remark: str | None


class PurchaseContractSourceLinkResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    contract_id: str
    export_contract_id: str
    export_contract_no: str
    export_contract_line_id: str
    customer_name: str
    product_id: str | None
    product_code: str | None
    demand_quantity: str
    unit: str


class PurchaseContractReminderResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    contract_id: str
    reminder_type: str
    title: str
    due_date: date
    amount: str | None
    currency: str
    status: str


class PurchaseContractResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    contract_date: date
    supplier_id: str | None
    supplier_name: str
    buyer_user_id: str | None
    buyer_user_name: str | None
    qc_user_id: str | None
    qc_user_name: str | None
    currency: str
    delivery_date: date
    payment_terms: str
    source_type: str
    remarks: str | None
    approval_status: str
    submitted_at: date | None
    approved_at: date | None
    reviewer_name: str | None
    owner_user_id: str
    statistics: PurchaseContractStatisticsResponse
    lines: list[PurchaseContractLineResponse]
    source_links: list[PurchaseContractSourceLinkResponse]
    reminders: list[PurchaseContractReminderResponse]


class PurchaseContractListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PurchaseContractResponse]
    total: int


class PurchaseContractReminderListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PurchaseContractReminderResponse]
    total: int
