from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class AuditLogRow:
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
