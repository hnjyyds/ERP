from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AnnouncementResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    content: str
    published_at: datetime


class AnnouncementCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=4000)


class TodoTaskResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    owner_user_id: str
    owner_user_name: str | None
    creator_user_id: str | None
    creator_user_name: str | None
    title: str
    content: str
    source_type: str
    source_id: str | None
    due_at: datetime | None
    status: str
    assignment_type: Literal["assigned", "self"]


class TodoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=2000)
    assignee_user_ids: list[str] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def normalize_assignees(self) -> "TodoCreate":
        normalized: list[str] = []
        for user_id in self.assignee_user_ids:
            cleaned = user_id.strip()
            if cleaned and cleaned not in normalized:
                normalized.append(cleaned)
        if not normalized:
            raise ValueError("assignee_user_ids must contain at least one user")
        self.assignee_user_ids = normalized
        return self


class TodoCreateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[TodoTaskResponse]


class NotificationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    owner_user_id: str
    title: str
    message: str
    severity: str
    is_read: bool
    created_at: datetime


class ScheduleEventResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    owner_user_id: str
    title: str
    description: str | None
    starts_at: datetime
    ends_at: datetime
    created_at: datetime


class ShortcutResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    owner_user_id: str
    label: str
    target_path: str
    icon: str
    sort_order: int


class ShortcutCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str = Field(min_length=1, max_length=80)
    target_path: str = Field(min_length=1, max_length=200)
    icon: str = Field(default="layout-dashboard", min_length=1, max_length=60)
    sort_order: int = Field(default=100, ge=0, le=9999)


class ScheduleEventPath(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schedule_id: str = Field(min_length=1, max_length=80)


class NotificationPath(BaseModel):
    model_config = ConfigDict(extra="forbid")

    notification_id: str = Field(min_length=1, max_length=80)


class ShortcutPath(BaseModel):
    model_config = ConfigDict(extra="forbid")

    shortcut_id: str = Field(min_length=1, max_length=80)


class DashboardSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    announcement_count: int
    todo_count: int
    unread_notification_count: int
    today_schedule_count: int
    shortcut_count: int


class DashboardResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    announcements: list[AnnouncementResponse]
    todos: list[TodoTaskResponse]
    notifications: list[NotificationResponse]
    schedule_events: list[ScheduleEventResponse]
    shortcuts: list[ShortcutResponse]
    summary: DashboardSummary


class ScheduleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    starts_at: datetime
    ends_at: datetime

    @model_validator(mode="after")
    def validate_time_range(self) -> "ScheduleCreate":
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be later than starts_at")
        return self
