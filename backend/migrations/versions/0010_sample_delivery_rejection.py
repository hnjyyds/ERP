"""add sample delivery rejection fields

Revision ID: 0010_sample_delivery_rejection
Revises: 0009_quotation_rejection
Create Date: 2026-11-09

寄样单支持驳回，字段名与出口报价/采购合同保持一致：

- ``rejected_at`` / ``rejection_reason`` 记录驳回时间和原因；
- 编辑已驳回寄样单时自动回到草稿，驳回原因保留用于展示，重新提交时清空；
- 两列均可空，历史数据天然表示“未驳回”，无需回填。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0010_sample_delivery_rejection"
down_revision: str | None = "0009_quotation_rejection"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_TABLE = "sample_deliveries"


def _columns() -> tuple[sa.Column, ...]:
    return (
        sa.Column("rejected_at", sa.Date()),
        sa.Column("rejection_reason", sa.Text()),
    )


def _existing_columns(table: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table not in inspector.get_table_names():
        return set()
    return {column["name"] for column in inspector.get_columns(table)}


def upgrade() -> None:
    existing = _existing_columns(_TABLE)
    if not existing:
        return
    for column in _columns():
        if column.name in existing:
            continue
        op.add_column(_TABLE, column)
    indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(_TABLE)}
    rejected_index = f"ix_{_TABLE}_rejected_at"
    if rejected_index not in indexes:
        op.create_index(rejected_index, _TABLE, ["rejected_at"])


def downgrade() -> None:
    existing = _existing_columns(_TABLE)
    if not existing:
        return
    indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(_TABLE)}
    rejected_index = f"ix_{_TABLE}_rejected_at"
    if rejected_index in indexes:
        op.drop_index(rejected_index, table_name=_TABLE)
    for column in _columns():
        if column.name not in existing:
            continue
        op.drop_column(_TABLE, column.name)
