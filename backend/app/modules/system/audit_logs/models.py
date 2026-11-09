from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class AuditLog(Base):
    """只增不删的写操作审计流水。"""

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    actor_user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    actor_name: Mapped[str] = mapped_column(String(160), nullable=False)
    action: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    resource_type: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    resource_no: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        index=True,
        nullable=False,
    )
