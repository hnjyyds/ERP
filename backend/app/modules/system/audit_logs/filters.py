from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class AuditLogFilters:
    created_from: datetime | None = None
    created_to: datetime | None = None
    actor: str | None = None
    resource_type: str | None = None
    action: str | None = None
    keyword: str | None = None
