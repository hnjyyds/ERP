"""add notification source keys

Revision ID: 0014_notifications
Revises: 0013_audit_logs
Create Date: 2026-11-09

业务通知基座：在既有 ``notifications`` 表上补齐来源单据、事件、跳转路径与
已读时间，并以 ``source_type + source_id + event + owner_user_id`` 建唯一索引，
保证审批重试不会产生重复消息。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0014_notifications"
down_revision: str | None = "0013_audit_logs"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _has_notifications_table() -> bool:
    inspector = sa.inspect(op.get_bind())
    return "notifications" in inspector.get_table_names()


def upgrade() -> None:
    # 老库可能尚未建出工作台表，跳过补齐；全新库由 0001 基线建表。
    if not _has_notifications_table():
        return
    op.add_column("notifications", sa.Column("source_type", sa.String(length=60), nullable=True))
    op.add_column("notifications", sa.Column("source_id", sa.String(length=64), nullable=True))
    op.add_column("notifications", sa.Column("event", sa.String(length=60), nullable=True))
    op.add_column("notifications", sa.Column("target_path", sa.String(length=300), nullable=True))
    op.add_column(
        "notifications",
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ux_notifications_source_event_owner",
        "notifications",
        ["source_type", "source_id", "event", "owner_user_id"],
        unique=True,
    )
    op.create_index(
        "ix_notifications_owner_read_created",
        "notifications",
        ["owner_user_id", "is_read", "created_at"],
    )


def downgrade() -> None:
    if not _has_notifications_table():
        return
    op.drop_index("ix_notifications_owner_read_created", table_name="notifications")
    op.drop_index("ux_notifications_source_event_owner", table_name="notifications")
    op.drop_column("notifications", "read_at")
    op.drop_column("notifications", "target_path")
    op.drop_column("notifications", "event")
    op.drop_column("notifications", "source_id")
    op.drop_column("notifications", "source_type")
