"""plan source uniqueness

Revision ID: 0016_plan_source_unique
Revises: 0015_quotation_sample_link
Create Date: 2026-11-11

入库/出库计划的来源唯一约束下沉到数据库层：
- 入库计划在 0001 baseline 已有
  ``ix_warehouse_inbound_plans_purchase_contract_id`` 唯一索引，本迁移只做缺失校验；
- 出库计划原本只靠应用层查询防重，本迁移补
  ``ux_warehouse_outbound_plans_source(source_type, source_id)``。
  建索引前先检查存量重复；有重复时直接失败并列出冲突来源，不做静默删改。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0016_plan_source_unique"
down_revision: str | None = "0015_quotation_sample_link"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_OUTBOUND_SOURCE_INDEX = "ux_warehouse_outbound_plans_source"


def _has_table(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def _index_names(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {item["name"] for item in inspector.get_indexes(table_name)}


def _inbound_contract_unique_exists() -> bool:
    inspector = sa.inspect(op.get_bind())
    indexes = inspector.get_indexes("warehouse_inbound_plans")
    for item in indexes:
        if item.get("unique") and item.get("column_names") == ["purchase_contract_id"]:
            return True
    constraints = inspector.get_unique_constraints("warehouse_inbound_plans")
    return any(
        item.get("column_names") == ["purchase_contract_id"] for item in constraints
    )


def _duplicate_outbound_sources() -> list[tuple[str, str, int]]:
    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            "SELECT source_type, source_id, COUNT(*) AS total "
            "FROM warehouse_outbound_plans "
            "GROUP BY source_type, source_id "
            "HAVING COUNT(*) > 1 "
            "ORDER BY total DESC"
        )
    ).fetchall()
    return [(str(row[0]), str(row[1]), int(row[2])) for row in rows]


def upgrade() -> None:
    if _has_table("warehouse_inbound_plans") and not _inbound_contract_unique_exists():
        op.create_index(
            "ix_warehouse_inbound_plans_purchase_contract_id",
            "warehouse_inbound_plans",
            ["purchase_contract_id"],
            unique=True,
        )

    if _has_table("warehouse_outbound_plans"):
        duplicates = _duplicate_outbound_sources()
        if duplicates:
            detail = ", ".join(
                f"{source_type}/{source_id} x{total}"
                for source_type, source_id, total in duplicates
            )
            raise RuntimeError(
                "出库计划来源存在重复数据，无法建立唯一约束，请先人工确认："
                f"{detail}"
            )
        if _OUTBOUND_SOURCE_INDEX not in _index_names("warehouse_outbound_plans"):
            op.create_index(
                _OUTBOUND_SOURCE_INDEX,
                "warehouse_outbound_plans",
                ["source_type", "source_id"],
                unique=True,
            )


def downgrade() -> None:
    if not _has_table("warehouse_outbound_plans"):
        return
    if _OUTBOUND_SOURCE_INDEX in _index_names("warehouse_outbound_plans"):
        op.drop_index(
            _OUTBOUND_SOURCE_INDEX,
            table_name="warehouse_outbound_plans",
        )
