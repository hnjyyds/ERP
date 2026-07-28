from datetime import date, datetime
from decimal import Decimal

from pydantic import ConfigDict, Field, field_validator, model_validator

from app.schemas.base import BaseModel

VALID_QUALITY_INSPECTION_RESULTS = (
    "passed",
    "failed",
    "partial_passed",
    "recheck_required",
)
VALID_QUALITY_INSPECTION_STATUSES = (
    "pending",
    "in_progress",
    "completed",
    "cancelled",
)
VALID_QUALITY_ISSUE_SEVERITIES = ("minor", "major", "critical")
VALID_QUALITY_ISSUE_STATUSES = ("open", "resolved")


class QualityInspectionLineCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    purchase_contract_line_id: str | None = Field(default=None, max_length=36)
    product_id: str | None = Field(default=None, max_length=36)
    product_code: str | None = Field(default=None, max_length=80)
    product_name: str = Field(min_length=1, max_length=240)
    inspected_quantity: Decimal = Field(gt=0)
    failed_quantity: Decimal = Field(default=Decimal("0"), ge=0)
    unit: str = Field(min_length=1, max_length=40)
    result: str = Field(min_length=1, max_length=40)
    remark: str | None = Field(default=None, max_length=2000)

    @field_validator("result")
    @classmethod
    def validate_result(cls, value: str) -> str:
        if value not in VALID_QUALITY_INSPECTION_RESULTS:
            raise ValueError("QC 明细结果无效")
        return value

    @field_validator("product_name", "unit")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("不能为空")
        return normalized

    @model_validator(mode="after")
    def validate_failed_quantity(self) -> "QualityInspectionLineCreate":
        if self.failed_quantity > self.inspected_quantity:
            raise ValueError("不合格数量不能大于查验数量")
        return self


class QualityInspectionIssueCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    issue_type: str = Field(min_length=1, max_length=120)
    severity: str = Field(default="major", min_length=1, max_length=40)
    description: str = Field(min_length=1, max_length=4000)
    corrective_action: str | None = Field(default=None, max_length=4000)
    status: str = Field(default="open", min_length=1, max_length=40)
    attachment_group_id: str | None = Field(default=None, max_length=80)

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, value: str) -> str:
        if value not in VALID_QUALITY_ISSUE_SEVERITIES:
            raise ValueError("QC 异常严重程度无效")
        return value

    @field_validator("issue_type", "description")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("不能为空")
        return normalized

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in VALID_QUALITY_ISSUE_STATUSES:
            raise ValueError("QC 异常状态无效")
        return value


class QualityInspectionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80)
    purchase_contract_id: str = Field(min_length=1, max_length=36)
    scheduled_at: datetime | None = None
    status: str | None = Field(default=None, min_length=1, max_length=40)
    inspected_at: date | None = None
    result: str | None = Field(default=None, min_length=1, max_length=40)
    inspector_id: str = Field(min_length=1, max_length=36)
    inspector_name: str = Field(min_length=1, max_length=160)
    issue_summary: str | None = Field(default=None, max_length=4000)
    attachment_group_id: str | None = Field(default=None, max_length=80)
    lines: list[QualityInspectionLineCreate] = Field(default_factory=list)
    issues: list[QualityInspectionIssueCreate] = Field(default_factory=list)

    @field_validator("result")
    @classmethod
    def validate_result(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if value not in VALID_QUALITY_INSPECTION_RESULTS:
            raise ValueError("QC 查验结果无效")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if value not in VALID_QUALITY_INSPECTION_STATUSES:
            raise ValueError("QC 任务状态无效")
        return value

    @field_validator("code", "purchase_contract_id", "inspector_id", "inspector_name")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("不能为空")
        return normalized

    @model_validator(mode="after")
    def validate_task_lifecycle(self) -> "QualityInspectionCreate":
        if self.status is None:
            self.status = (
                "completed"
                if self.inspected_at is not None or self.result is not None or self.lines
                else "pending"
            )
        if self.status in {"pending", "in_progress", "cancelled"} and self.scheduled_at is None:
            raise ValueError("未完成的 QC 任务必须填写排期时间")
        if self.status == "completed" and (
            self.inspected_at is None or self.result is None or not self.lines
        ):
            raise ValueError("已完成的 QC 任务必须填写查验日期、结果和明细")
        return self


class QualityInspectionLineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    inspection_id: str
    purchase_contract_line_id: str | None
    product_id: str | None
    product_code: str | None
    product_name: str
    inspected_quantity: str
    failed_quantity: str
    unit: str
    result: str
    remark: str | None


class QualityIssueResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    inspection_id: str
    line_id: str | None
    issue_type: str
    severity: str
    description: str
    corrective_action: str | None
    status: str
    attachment_group_id: str | None


class QualityInspectionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    code: str
    purchase_contract_id: str
    purchase_contract_no: str
    supplier_id: str | None
    supplier_name: str
    status: str
    scheduled_at: datetime
    inspected_at: date | None
    result: str | None
    inspector_id: str | None
    inspector_name: str
    qc_user_id: str | None
    qc_user_name: str | None
    issue_summary: str | None
    attachment_group_id: str | None
    owner_user_id: str
    lines: list[QualityInspectionLineResponse]
    issues: list[QualityIssueResponse]


class QualityInspectionListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[QualityInspectionResponse]
    total: int


class QualityInspectionInboundEligibilityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    purchase_contract_id: str
    eligible: bool
    latest_inspection_id: str | None
    latest_result: str | None
    inspected_at: date | None
    reason: str
