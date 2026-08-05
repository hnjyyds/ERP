from datetime import date, datetime
from decimal import Decimal
from typing import Literal

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
VALID_QUALITY_ATTACHMENT_CATEGORIES = ("inspection", "resolution")


class QualityAttachmentCreate(BaseModel):
    """Reference to an uploaded QC evidence file."""

    model_config = ConfigDict(extra="forbid")

    filename: str = Field(min_length=1, max_length=240, description="附件原始文件名")
    url: str = Field(min_length=1, max_length=2000, description="附件访问地址")
    category: str = Field(description="附件用途：查验凭证或整改凭证")

    @field_validator("filename", "url")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("不能为空")
        return normalized

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in VALID_QUALITY_ATTACHMENT_CATEGORIES:
            raise ValueError("QC 附件类型无效")
        return value


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

    purchase_contract_line_id: str | None = Field(
        default=None,
        max_length=36,
        description="异常对应的采购合同明细标识",
    )
    issue_type: str = Field(min_length=1, max_length=120)
    severity: str = Field(default="major", min_length=1, max_length=40)
    description: str = Field(min_length=1, max_length=4000)
    corrective_action: str | None = Field(default=None, max_length=4000)
    status: Literal["open"] = Field(default="open", description="新建异常的初始状态")
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
    attachments: list[QualityAttachmentCreate] = Field(
        default_factory=list,
        description="本次查验的现场凭证",
    )

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
        if self.status != "completed" and (
            self.inspected_at is not None or self.result is not None or self.lines or self.issues
        ):
            raise ValueError("未完成的 QC 任务不能填写查验结果")
        if self.status == "completed" and self.result == "passed":
            if any(line.failed_quantity > 0 for line in self.lines):
                raise ValueError("QC 通过时不良数量必须为 0")
            if any(line.result != "passed" for line in self.lines):
                raise ValueError("QC 通过时所有明细必须通过")
            if any(issue.status == "open" for issue in self.issues):
                raise ValueError("QC 通过时不能存在未关闭异常")
        if self.status == "completed" and self.result != "passed" and not self.issues:
            raise ValueError("QC 未通过时至少登记一项异常")
        return self


class QualityScheduleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scheduled_at: datetime = Field(description="新的 QC 排期时间")
    reason: str = Field(min_length=1, max_length=1000, description="调整排期原因")

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("调整排期原因不能为空")
        return normalized


class QualityCancelRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=1, max_length=1000, description="取消任务原因")

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("取消原因不能为空")
        return normalized


class QualityIssueResolveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    resolution_note: str = Field(min_length=1, max_length=4000, description="异常关闭说明")
    attachments: list[QualityAttachmentCreate] = Field(
        default_factory=list,
        description="整改凭证",
    )

    @field_validator("resolution_note")
    @classmethod
    def validate_resolution_note(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("异常关闭说明不能为空")
        return normalized


class QualityReinspectionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=80, description="复检任务编号")
    scheduled_at: datetime = Field(description="复检排期时间")
    inspector_id: str = Field(min_length=1, max_length=36, description="复检负责人标识")
    reason: str = Field(min_length=1, max_length=1000, description="创建复检原因")

    @field_validator("code", "inspector_id", "reason")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("不能为空")
        return normalized


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


class QualityAttachmentResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    inspection_id: str
    issue_id: str | None
    category: str
    filename: str
    url: str
    uploaded_by_id: str
    uploaded_by_name: str
    created_at: datetime


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
    resolution_note: str | None
    resolved_at: datetime | None
    resolved_by_id: str | None
    resolved_by_name: str | None
    attachments: list[QualityAttachmentResponse]


class QualityInspectionEventResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    inspection_id: str
    event_type: str
    from_status: str | None
    to_status: str | None
    notes: str | None
    actor_user_id: str
    actor_user_name: str
    created_at: datetime


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
    parent_inspection_id: str | None
    reinspection_no: int
    cancel_reason: str | None
    owner_user_id: str
    lines: list[QualityInspectionLineResponse]
    issues: list[QualityIssueResponse]
    attachments: list[QualityAttachmentResponse]
    events: list[QualityInspectionEventResponse]


class QualityInspectionListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[QualityInspectionResponse]
    total: int


class QualityInspectionInboundEligibilityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    purchase_contract_id: str
    eligible: bool
    latest_inspection_id: str | None
    latest_status: str | None
    latest_result: str | None
    inspected_at: date | None
    reason: str
