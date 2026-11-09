from datetime import datetime

from pydantic import ConfigDict, Field

from app.schemas.base import BaseModel


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    actor_user_id: str
    actor_name: str
    action: str
    resource_type: str
    resource_id: str | None
    resource_no: str | None
    summary: str
    payload: str | None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[AuditLogResponse] = Field(description="当前分页返回的审计记录。")
    total: int = Field(description="符合筛选条件的审计记录总数。")


class AuditLogExportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str
    content_type: str
    content: str
