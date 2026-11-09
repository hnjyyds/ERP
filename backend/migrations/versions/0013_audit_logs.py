"""add audit logs

Revision ID: 0013_audit_logs
Revises: 0012_finance_child_menus
Create Date: 2026-11-09

审计日志基座：新增只增不删的 ``audit_logs`` 表，并把「审计日志」菜单补进
``menu_items``（仅超级管理员可见）。表与菜单都由本迁移创建，老库升级后即可
使用；前端菜单继续由后端菜单表下发。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0013_audit_logs"
down_revision: str | None = "0012_finance_child_menus"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_MENU_TABLE = sa.table(
    "menu_items",
    sa.column("id", sa.String),
    sa.column("label", sa.String),
    sa.column("label_en", sa.String),
    sa.column("path", sa.String),
    sa.column("icon", sa.String),
    sa.column("required_permission", sa.String),
    sa.column("sort_order", sa.Integer),
    sa.column("is_active", sa.Boolean),
)

_AUDIT_MENU = {
    "id": "menu-system-audit-logs",
    "label": "审计日志",
    "label_en": "Audit Logs",
    "path": "/system/audit-logs",
    "icon": "scroll-text",
    "required_permission": "system:super_admin",
    "sort_order": 94,
    "is_active": True,
}


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("actor_user_id", sa.String(length=64), nullable=False),
        sa.Column("actor_name", sa.String(length=160), nullable=False),
        sa.Column("action", sa.String(length=40), nullable=False),
        sa.Column("resource_type", sa.String(length=60), nullable=False),
        sa.Column("resource_id", sa.String(length=64), nullable=True),
        sa.Column("resource_no", sa.String(length=120), nullable=True),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("payload", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_resource_type", "audit_logs", ["resource_type"])
    op.create_index("ix_audit_logs_resource_id", "audit_logs", ["resource_id"])
    op.create_index("ix_audit_logs_resource_no", "audit_logs", ["resource_no"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])

    bind = op.get_bind()
    if "menu_items" not in sa.inspect(bind).get_table_names():
        return
    exists = bind.execute(
        sa.text("SELECT 1 FROM menu_items WHERE id = :id"),
        {"id": _AUDIT_MENU["id"]},
    ).first()
    if exists is None:
        op.bulk_insert(_MENU_TABLE, [_AUDIT_MENU])


def downgrade() -> None:
    bind = op.get_bind()
    if "menu_items" in sa.inspect(bind).get_table_names():
        bind.execute(
            sa.text("DELETE FROM menu_items WHERE id = :id"),
            {"id": _AUDIT_MENU["id"]},
        )
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_resource_no", table_name="audit_logs")
    op.drop_index("ix_audit_logs_resource_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_resource_type", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")
