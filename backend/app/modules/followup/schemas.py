from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_FOLLOW_NODE_STATUSES = ("pending", "in_progress", "completed", "overdue")
VALID_FOLLOW_PLAN_STATUSES = ("pending", "in_progress", "completed", "overdue")
VALID_FOLLOW_ACTUAL_DATE_SOURCES = (
    "purchase_contract",
    "sample_confirm",
    "sample_bulk",
    "qc",
    "inbound",
    "outbound",
)
VALID_FOLLOW_SOURCE_RECORD_TYPES = (
    "sample_followup_event",
    "quality_inspection",
    "inventory_inbound",
    "inventory_outbound",
)


class FollowProcessTemplateNodeCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    node_code: str = Field(min_length=1, max_length=80)
    node_name: str = Field(min_length=1, max_length=120)
    sequence_no: int = Field(ge=1)
    standard_days: int = Field(ge=0)
    remind_before_days: int = Field(ge=0)
    actual_date_source: str = Field(min_length=1, max_length=80)

    @field_validator("actual_date_source")
    @classmethod
    def validate_actual_date_source(cls, value: str) -> str:
        if value not in VALID_FOLLOW_ACTUAL_DATE_SOURCES:
            raise ValueError("跟单节点实际日期来源无效")
        return value


class FollowProcessTemplateCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=160)
    enabled: bool
    is_default: bool
    nodes: list[FollowProcessTemplateNodeCreate] = Field(min_length=1)


class PurchaseFollowPlanGenerateFromContract(BaseModel):
    model_config = ConfigDict(extra="forbid")

    purchase_contract_id: str = Field(min_length=1, max_length=36)
    as_of: date | None = None


class FollowSourceEventSync(BaseModel):
    model_config = ConfigDict(extra="forbid")

    purchase_contract_id: str = Field(min_length=1, max_length=36)
    node_code: str = Field(min_length=1, max_length=80)
    source_record_type: str = Field(min_length=1, max_length=80)
    source_record_id: str = Field(min_length=1, max_length=36)
    actual_date: date
    source_summary: str = Field(min_length=1, max_length=240)

    @field_validator("source_record_type")
    @classmethod
    def validate_source_record_type(cls, value: str) -> str:
        if value not in VALID_FOLLOW_SOURCE_RECORD_TYPES:
            raise ValueError("跟单来源记录类型无效")
        return value


class FollowProcessTemplateNodeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    template_id: str
    node_code: str
    node_name: str
    sequence_no: int
    standard_days: int
    remind_before_days: int
    actual_date_source: str


class FollowProcessTemplateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    enabled: bool
    is_default: bool
    owner_user_id: str
    nodes: list[FollowProcessTemplateNodeResponse]


class FollowProcessTemplateListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[FollowProcessTemplateResponse]
    total: int


class PurchaseFollowNodeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    follow_plan_id: str
    node_code: str
    node_name: str
    sequence_no: int
    planned_date: date
    remind_date: date
    actual_date: date | None
    status: str
    source_record_type: str | None
    source_record_id: str | None
    source_summary: str | None
    overdue_days: int


class PurchaseFollowPlanResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_id: str | None
    supplier_name: str
    template_id: str
    base_date: date
    overall_status: str
    owner_user_id: str
    nodes: list[PurchaseFollowNodeResponse]


class PurchaseFollowPlanListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PurchaseFollowPlanResponse]
    total: int


class PurchaseFollowOverdueNodeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    follow_plan_id: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_name: str
    node_code: str
    node_name: str
    planned_date: date
    remind_date: date
    overdue_days: int
    source_record_type: str | None
    source_record_id: str | None


class PurchaseFollowOverdueNodeListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PurchaseFollowOverdueNodeResponse]
    total: int
