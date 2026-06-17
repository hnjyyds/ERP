from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

VALID_REIMBURSEMENT_CATEGORIES = (
    "travel",
    "office",
    "entertainment",
    "other",
)
VALID_REIMBURSEMENT_STATUSES = (
    "submitted",
    "approved",
    "rejected",
    "paid",
)
VALID_REIMBURSEMENT_PAYMENT_METHODS = (
    "bank_transfer",
    "cash",
    "cheque",
    "other",
)


class ReimbursementItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expense_item: str = Field(min_length=1, max_length=160)
    amount: Decimal = Field(gt=0)
    remark: str | None = Field(default=None, max_length=2000)


class ReimbursementItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    expense_item: str
    amount: str
    remark: str | None


class ReimbursementCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reimbursement_no: str = Field(min_length=1, max_length=120)
    applicant_user_id: str = Field(min_length=1, max_length=64)
    applicant_user_name: str = Field(min_length=1, max_length=160)
    department: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=40)
    currency: str = Field(min_length=1, max_length=10)
    amount: Decimal = Field(gt=0)
    reason: str | None = Field(default=None, max_length=2000)
    remark: str | None = Field(default=None, max_length=2000)
    items: list[ReimbursementItemCreate] = Field(default_factory=list)


class ReimbursementApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    approved: bool
    approval_remark: str | None = Field(default=None, max_length=2000)


class ReimbursementPay(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payment_method: str = Field(min_length=1, max_length=40)
    remark: str | None = Field(default=None, max_length=2000)


class ReimbursementResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    reimbursement_no: str
    applicant_user_id: str
    applicant_user_name: str
    department: str
    category: str
    currency: str
    amount: str
    reason: str | None
    status: str
    approved_by_user_id: str | None
    approved_by_user_name: str | None
    approval_remark: str | None
    payment_method: str | None
    remark: str | None
    created_by_user_id: str
    created_by_user_name: str
    items: list[ReimbursementItemResponse]


class ReimbursementListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ReimbursementResponse]
    total: int
    total_amount: str
