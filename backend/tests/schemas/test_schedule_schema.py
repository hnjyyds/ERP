from datetime import datetime

import pytest
from pydantic import ValidationError

from app.modules.system.dashboard.schemas import (
    NotificationPath,
    ScheduleCreate,
    ScheduleEventPath,
    ShortcutPath,
)


def test_schedule_create_forbids_extra_fields() -> None:
    with pytest.raises(ValidationError):
        ScheduleCreate.model_validate(
            {
                "title": "拜访客户",
                "starts_at": "2026-06-15T09:00:00+08:00",
                "ends_at": "2026-06-15T10:00:00+08:00",
                "extra": "blocked",
            }
        )


def test_schedule_create_requires_end_after_start() -> None:
    with pytest.raises(ValidationError):
        ScheduleCreate(
            title="错误时间",
            starts_at=datetime.fromisoformat("2026-06-15T10:00:00+08:00"),
            ends_at=datetime.fromisoformat("2026-06-15T09:00:00+08:00"),
        )


@pytest.mark.parametrize(
    ("schema_cls", "field_name"),
    [
        (ScheduleEventPath, "schedule_id"),
        (NotificationPath, "notification_id"),
        (ShortcutPath, "shortcut_id"),
    ],
)
def test_dashboard_path_schemas_reject_empty_identifiers(
    schema_cls: type[ScheduleEventPath | NotificationPath | ShortcutPath],
    field_name: str,
) -> None:
    with pytest.raises(ValidationError):
        schema_cls.model_validate({field_name: ""})

    parsed = schema_cls.model_validate({field_name: "entity-001"})
    assert getattr(parsed, field_name) == "entity-001"
