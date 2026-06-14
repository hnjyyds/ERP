from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_MISC_FEE_CATEGORIES = (
    "office",
    "capital_interest",
    "tax_refund_interest",
    "other",
)
VALID_MISC_ALLOCATION_METHODS = ("manual", "ratio", "amount", "quantity")
VALID_MISC_FEE_ITEM_STATUSES = ("active", "inactive")
VALID_MISC_FEE_ALLOCATION_STATUSES = ("allocated",)


class MiscFeeItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    category: str = Field(min_length=1, max_length=40)
    default_allocation_method: str = Field(min_length=1, max_length=40)
    is_active: bool = True
    remark: str | None = Field(default=None, max_length=2000)


class MiscFeeAllocationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    allocation_no: str = Field(min_length=1, max_length=120)
    item_id: str = Field(min_length=1, max_length=36)
    shipment_plan_id: str = Field(min_length=1, max_length=36)
    shipment_no: str | None = Field(default=None, max_length=80)
    sales_user_id: str | None = Field(default=None, max_length=64)
    sales_user_name: str | None = Field(default=None, max_length=160)
    allocated_at: date
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=1, max_length=10)
    allocation_method: str = Field(min_length=1, max_length=40)
    basis: str | None = Field(default=None, max_length=2000)
    remark: str | None = Field(default=None, max_length=2000)


class MiscFeeItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    name: str
    category: str
    default_allocation_method: str
    is_active: bool
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str


class MiscFeeItemListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[MiscFeeItemResponse]
    total: int


class MiscFeeAllocationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    allocation_no: str
    item_id: str
    item_code: str
    item_name: str
    item_category: str
    shipment_plan_id: str
    shipment_no: str
    customer_name: str
    sales_user_id: str | None
    sales_user_name: str | None
    allocated_at: date
    amount: str
    currency: str
    allocation_method: str
    basis: str | None
    status: str
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str


class MiscFeeAllocationListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[MiscFeeAllocationResponse]
    total: int
    total_allocated_amount: str
