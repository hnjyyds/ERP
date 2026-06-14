from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_SETTLEMENT_STATUSES = ("locked",)
VALID_PROFIT_COST_TYPES = (
    "sales_income",
    "purchase_cost",
    "partner_fee",
    "misc_fee",
    "tax_refund",
    "other_cost",
)
VALID_MANUAL_PROFIT_COST_TYPES = ("other_cost",)
VALID_PROFIT_COST_DIRECTIONS = ("income", "cost")


class FinancialSettlementCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    settlement_no: str = Field(min_length=1, max_length=120)
    shipment_plan_id: str = Field(min_length=1, max_length=36)
    shipment_no: str | None = Field(default=None, max_length=80)
    settlement_date: date
    remark: str | None = Field(default=None, max_length=2000)


class ManualProfitCostCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cost_no: str = Field(min_length=1, max_length=120)
    cost_type: str = Field(min_length=1, max_length=40)
    cost_date: date
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    source_no: str | None = Field(default=None, max_length=120)
    reason: str = Field(min_length=1, max_length=400)
    remark: str | None = Field(default=None, max_length=2000)


class ProfitCostItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    settlement_id: str
    shipment_plan_id: str
    shipment_no: str
    cost_no: str
    cost_type: str
    source_type: str
    source_id: str | None
    source_no: str | None
    cost_date: date
    amount: str
    currency: str
    direction: str
    reason: str | None
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str


class FinancialSettlementResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    settlement_no: str
    shipment_plan_id: str
    shipment_no: str
    customer_name: str
    settlement_date: date
    currency: str
    sales_income: str
    purchase_cost_amount: str
    partner_fee_amount: str
    misc_fee_amount: str
    tax_refund_amount: str
    manual_cost_amount: str
    gross_profit: str
    gross_profit_rate: str
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    created_at: datetime
    cost_items: list[ProfitCostItemResponse]


class FinancialSettlementListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[FinancialSettlementResponse]
    total: int
    total_sales_income: str
    total_gross_profit: str


class ProfitCalculationListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[FinancialSettlementResponse]
    total: int
    total_sales_income: str
    total_gross_profit: str
