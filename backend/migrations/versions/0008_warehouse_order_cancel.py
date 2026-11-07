"""add warehouse inbound/outbound order cancellation fields

Revision ID: 0008_warehouse_cancel
Revises: 0007_contract_cancel
Create Date: 2026-11-07

出入库单作废只允许草稿、待审批状态，保留原记录和原单号：

- ``cancelled_at`` / ``cancelled_by_id`` / ``cancelled_by_name`` / ``cancel_reason``
  记录作废时间、操作人和原因；
- 库存余额、库存流水、入库计划执行状态、采购合同收货数量和跟单节点都不在
  作废时回滚，因为这些联动只在审批（实际入库/出库）时发生；
- 所有字段可空，历史数据天然表示“未作废”，无需回填。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0008_warehouse_cancel"
down_revision: str | None = "0007_contract_cancel"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _columns() -> tuple[sa.Column, ...]:
    return (
        sa.Column("cancelled_at", sa.DateTime(timezone=True)),
        sa.Column("cancelled_by_id", sa.String(length=36)),
        sa.Column("cancelled_by_name", sa.String(length=160)),
        sa.Column("cancel_reason", sa.Text()),
    )


_TABLES = ("warehouse_inbound_orders", "warehouse_outbound_orders")


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
        if cancelled_index not in indexes:
            op.create_index(cancelled_index, table, ["cancelled_at"])


def downgrade() -> None:
    for table in _TABLES:
        existing = _existing_columns(table)
        if not existing:
            continue
        indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table)}
        cancelled_index = f"ix_{table}_cancelled_at"
        if cancelled_index in indexes:
            op.drop_index(cancelled_index, table_name=table)
        for column in reversed(_columns()):
            if column.name in existing:
                op.drop_column(table, column.name)
