from pydantic import ConfigDict, Field

from app.schemas.base import BaseModel


class ApprovalSubmit(BaseModel):
    """Select the employee responsible for the next approval step."""

    model_config = ConfigDict(extra="forbid")

    reviewer_id: str = Field(
        min_length=1,
        max_length=64,
        description="被指定审批人的用户 ID。",
    )
