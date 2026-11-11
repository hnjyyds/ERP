from datetime import date, datetime
from decimal import Decimal

from pydantic import ConfigDict, Field

from app.schemas.approvals import ApprovalSubmit
from app.schemas.base import BaseModel

VALID_STOCKTAKE_STATUSES = ("draft", "submitted", "approved")


class StocktakeLineCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    unit: str = Field(min_length=1, max_length=40)
    actual_quantity: Decimal = Field(ge=Decimal("0"))
    remark: str | None = Field(default=None, max_length=2000)


class StocktakeCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    warehouse_id: str = Field(min_length=1, max_length=36)
    warehouse_name: str = Field(min_length=1, max_length=160)
    location_id: str = Field(min_length=1, max_length=36)
    location_name: str = Field(min_length=1, max_length=160)
    count_date: date
    operator_name: str = Field(min_length=1, max_length=160)
    remark: str | None = Field(default=None, max_length=4000)
    lines: list[StocktakeLineCreate] = Field(min_length=1)


class StocktakeSubmit(ApprovalSubmit):
    """指定盘点单的审批人。"""


class StocktakeApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    approved_at: date


class StocktakeLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    order_id: str
    product_id: str | None
    product_code: str | None
    product_name: str
    unit: str
    book_quantity: str
    actual_quantity: str
    difference_quantity: str
    remark: str | None


class StocktakeOrderResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    warehouse_id: str
    warehouse_name: str
    location_id: str
    location_name: str
    count_date: date
    status: str
    operator_name: str
    owner_user_id: str
    reviewer_id: str | None
    reviewer_name: str | None
    remark: str | None
    submitted_at: date | None
    approved_at: date | None
    created_at: datetime
    lines: list[StocktakeLineResponse]


class StocktakeOrderListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[StocktakeOrderResponse]
    total: int
