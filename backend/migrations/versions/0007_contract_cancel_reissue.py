"""add contract cancellation and reissue fields

Revision ID: 0007_contract_cancel
Revises: 0006_sample_stock_note
Create Date: 2026-11-07

出口合同与采购合同新增作废/重开字段：

- 作废保留原记录、原单号，仅把 ``approval_status`` 改为 ``cancelled``；
- ``cancelled_at`` / ``cancelled_by_id`` / ``cancelled_by_name`` / ``cancel_reason``
  记录作废时间、操作人和原因；
- ``reissued_from_id`` / ``reissued_from_code`` / ``reissue_reason`` 让新单可以
  指回被作废的原单。

所有字段均可为空，历史数据天然表示“未作废、未重开”，无需回填。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0007_contract_cancel"
down_revision: str | None = "0006_sample_stock_note"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def _columns() -> tuple[sa.Column, ...]:
    return (
        sa.Column("cancelled_at", sa.DateTime(timezone=True)),
        sa.Column("cancelled_by_id", sa.String(length=36)),
        sa.Column("cancelled_by_name", sa.String(length=160)),
        sa.Column("cancel_reason", sa.Text()),
        sa.Column("reissued_from_id", sa.String(length=36)),
        sa.Column("reissued_from_code", sa.String(length=80)),
        sa.Column("reissue_reason", sa.Text()),
    )

_TABLES = ("export_contracts", "purchase_contracts")


def _existing_columns(table: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table not in inspector.get_table_names():
        return set()
    return {column["name"] for column in inspector.get_columns(table)}


def upgrade() -> None:
    for table in _TABLES:
        existing = _existing_columns(table)
        if not existing:
            continue
        for column in _columns():
            if column.name in existing:
                continue
            op.add_column(table, column)
        indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table)}
        cancelled_index = f"ix_{table}_cancelled_at"
        reissued_index = f"ix_{table}_reissued_from_id"
        reissued_code_index = f"ix_{table}_reissued_from_code"
        if cancelled_index not in indexes:
            op.create_index(cancelled_index, table, ["cancelled_at"])
        if reissued_index not in indexes:
            op.create_index(reissued_index, table, ["reissued_from_id"])
        if reissued_code_index not in indexes:
            op.create_index(reissued_code_index, table, ["reissued_from_code"])


def downgrade() -> None:
    for table in _TABLES:
        existing = _existing_columns(table)
        if not existing:
            continue
        indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table)}
        for name in (
            f"ix_{table}_reissued_from_code",
            f"ix_{table}_reissued_from_id",
            f"ix_{table}_cancelled_at",
        ):
            if name in indexes:
                op.drop_index(name, table_name=table)
        for column in reversed(_columns()):
            if column.name in existing:
                op.drop_column(table, column.name)
