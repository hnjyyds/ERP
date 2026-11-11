"""pending inspection traceability

Revision ID: 0017_pending_inspection
Revises: 0016_plan_source_unique
Create Date: 2026-11-11

待检量按入库单行挂账，避免不同入库单互相占用待检库存：
- 新建 ``warehouse_pending_inspections``，一笔入库单行一条待检记录；
- 回填存量：已审批且入库方式为 ``pending_inspection`` 的入库单，按行补建
  一条 pending 记录（数量取入库单行数量）。存量数据没有历史 QC 判定痕迹，
  因此不自动转账，保留 pending 供人工核对（见交付报告「兼容口径」）。
"""

from collections.abc import Sequence
from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

import sqlalchemy as sa
from alembic import op

revision: str = "0017_pending_inspection"
down_revision: str | None = "0016_plan_source_unique"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_TABLE = "warehouse_pending_inspections"
_INDEXED_COLUMNS = (
    "inbound_order_id",
    "inbound_order_line_id",
    "purchase_contract_id",
    "purchase_contract_line_id",
    "warehouse_id",
    "location_id",
    "product_id",
    "product_code",
    "product_name",
    "status",
    "inspection_id",
)


def _has_table(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if not _has_table(_TABLE):
        op.create_table(
            _TABLE,
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("inbound_order_id", sa.String(length=36), nullable=False),
            sa.Column("inbound_order_code", sa.String(length=80), nullable=False),
            sa.Column("inbound_order_line_id", sa.String(length=36), nullable=False),
            sa.Column("purchase_contract_id", sa.String(length=36), nullable=False),
            sa.Column("purchase_contract_line_id", sa.String(length=36), nullable=True),
            sa.Column("warehouse_id", sa.String(length=36), nullable=False),
            sa.Column("warehouse_name", sa.String(length=160), nullable=False),
            sa.Column("location_id", sa.String(length=36), nullable=False),
            sa.Column("location_name", sa.String(length=160), nullable=False),
            sa.Column("product_id", sa.String(length=36), nullable=True),
            sa.Column("product_code", sa.String(length=80), nullable=True),
            sa.Column("product_name", sa.String(length=240), nullable=False),
            sa.Column("quantity", sa.Numeric(precision=14, scale=4), nullable=False),
            sa.Column("unit", sa.String(length=40), nullable=False),
            sa.Column("status", sa.String(length=40), nullable=False),
            sa.Column("inspection_id", sa.String(length=36), nullable=True),
            sa.Column("inspection_code", sa.String(length=80), nullable=True),
            sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )
        for column in _INDEXED_COLUMNS:
            op.create_index(
                f"ix_{_TABLE}_{column}",
                _TABLE,
                [column],
                unique=column == "inbound_order_line_id",
            )

    _backfill_existing_pending_orders()


def _backfill_existing_pending_orders() -> None:
    if not _has_table("warehouse_inbound_orders") or not _has_table(
        "warehouse_inbound_order_lines"
    ):
        return

    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            "SELECT o.id, o.code, o.purchase_contract_id, o.warehouse_id, o.warehouse_name, "
            "o.location_id, o.location_name, l.id, l.purchase_contract_line_id, "
            "l.product_id, l.product_code, l.product_name, l.quantity, l.unit "
            "FROM warehouse_inbound_orders o "
            "JOIN warehouse_inbound_order_lines l ON l.order_id = o.id "
            "LEFT JOIN warehouse_pending_inspections p "
            "ON p.inbound_order_line_id = l.id "
            "WHERE o.status = 'approved' "
            "AND o.inbound_mode = 'pending_inspection' "
            "AND p.id IS NULL"
        )
    ).fetchall()

    now = datetime.now(UTC)
    for row in rows:
        bind.execute(
            sa.text(
                f"INSERT INTO {_TABLE} ("
                "id, inbound_order_id, inbound_order_code, inbound_order_line_id, "
                "purchase_contract_id, purchase_contract_line_id, warehouse_id, warehouse_name, "
                "location_id, location_name, product_id, product_code, product_name, "
                "quantity, unit, status, inspection_id, inspection_code, resolved_at, created_at"
                ") VALUES ("
                ":id, :inbound_order_id, :inbound_order_code, :inbound_order_line_id, "
                ":purchase_contract_id, :purchase_contract_line_id, :warehouse_id, "
                ":warehouse_name, :location_id, :location_name, :product_id, :product_code, "
                ":product_name, :quantity, :unit, 'pending', NULL, NULL, NULL, :created_at"
                ")"
            ),
            {
                "id": str(uuid4()),
                "inbound_order_id": row[0],
                "inbound_order_code": row[1],
                "inbound_order_line_id": row[7],
                "purchase_contract_id": row[2],
                "purchase_contract_line_id": row[8],
                "warehouse_id": row[3],
                "warehouse_name": row[4],
                "location_id": row[5],
                "location_name": row[6],
                "product_id": row[9],
                "product_code": row[10],
                "product_name": row[11],
                "quantity": Decimal(str(row[12])),
                "unit": row[13],
                "created_at": now,
            },
        )


def downgrade() -> None:
    if not _has_table(_TABLE):
        return
    for column in _INDEXED_COLUMNS:
        op.drop_index(f"ix_{_TABLE}_{column}", table_name=_TABLE)
    op.drop_table(_TABLE)
