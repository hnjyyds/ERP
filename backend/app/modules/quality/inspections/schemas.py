from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

VALID_QUALITY_INSPECTION_RESULTS = (
    "passed",
    "failed",
    "partial_passed",
    "recheck_required",
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
    inspected_at: date
    result: str = Field(min_length=1, max_length=40)
    inspector_id: str | None = Field(default=None, max_length=36)
    inspector_name: str = Field(min_length=1, max_length=160)
    issue_summary: str | None = Field(default=None, max_length=4000)
    attachment_group_id: str | None = Field(default=None, max_length=80)
    lines: list[QualityInspectionLineCreate] = Field(min_length=1)
    issues: list[QualityInspectionIssueCreate] = Field(default_factory=list)

    @field_validator("result")
    @classmethod
    def validate_result(cls, value: str) -> str:
        if value not in VALID_QUALITY_INSPECTION_RESULTS:
            raise ValueError("QC 查验结果无效")
        return value


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
    inspected_at: date
    result: str
    inspector_id: str | None
    inspector_name: str
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
