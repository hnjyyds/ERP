"""quotation-sample links

Revision ID: 0015_quotation_sample_link
Revises: 0014_notifications
Create Date: 2026-11-10

打通报价 → 打样 → 寄样链路：
- ``sample_requests`` 增加报价引用（ID + 报价号快照）；
- ``sample_deliveries`` 的手填 ``quote_id/quote_no`` 重命名为真实引用
  ``quotation_id/quotation_no``，数据原样保留；
- ``sample_records`` 以 ``(source_type, source_id)`` 唯一索引兜底
  「打样 → 样品登记」重复转换。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0015_quotation_sample_link"
down_revision: str | None = "0014_notifications"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _has_table(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    if _has_table("sample_requests"):
        op.add_column(
            "sample_requests",
            sa.Column("quotation_id", sa.String(length=36), nullable=True),
        )
        op.add_column(
            "sample_requests",
            sa.Column("quotation_no", sa.String(length=80), nullable=True),
        )
        op.create_index(
            "ix_sample_requests_quotation_id",
            "sample_requests",
            ["quotation_id"],
        )
        op.create_index(
            "ix_sample_requests_quotation_no",
            "sample_requests",
            ["quotation_no"],
        )

    if _has_table("sample_deliveries"):
        inspector = sa.inspect(op.get_bind())
        columns = {item["name"] for item in inspector.get_columns("sample_deliveries")}
        if "quote_id" in columns:
            with op.batch_alter_table("sample_deliveries") as batch_op:
                batch_op.drop_index("ix_sample_deliveries_quote_id")
                batch_op.drop_index("ix_sample_deliveries_quote_no")
                batch_op.alter_column(
                    "quote_id",
                    new_column_name="quotation_id",
                    existing_type=sa.String(length=36),
                    existing_nullable=True,
                )
                batch_op.alter_column(
                    "quote_no",
                    new_column_name="quotation_no",
                    existing_type=sa.String(length=80),
                    existing_nullable=True,
                )
            op.create_index(
                "ix_sample_deliveries_quotation_id",
                "sample_deliveries",
                ["quotation_id"],
            )
            op.create_index(
                "ix_sample_deliveries_quotation_no",
                "sample_deliveries",
                ["quotation_no"],
            )


def downgrade() -> None:
    if _has_table("sample_deliveries"):
        inspector = sa.inspect(op.get_bind())
        columns = {item["name"] for item in inspector.get_columns("sample_deliveries")}
        if "quotation_id" in columns:
            with op.batch_alter_table("sample_deliveries") as batch_op:
                batch_op.drop_index("ix_sample_deliveries_quotation_id")
                batch_op.drop_index("ix_sample_deliveries_quotation_no")
                batch_op.alter_column(
                    "quotation_id",
                    new_column_name="quote_id",
                    existing_type=sa.String(length=36),
                    existing_nullable=True,
                )
                batch_op.alter_column(
                    "quotation_no",
                    new_column_name="quote_no",
                    existing_type=sa.String(length=80),
                    existing_nullable=True,
                )
            op.create_index("ix_sample_deliveries_quote_id", "sample_deliveries", ["quote_id"])
            op.create_index("ix_sample_deliveries_quote_no", "sample_deliveries", ["quote_no"])

    if _has_table("sample_requests"):
        op.drop_index("ix_sample_requests_quotation_no", table_name="sample_requests")
        op.drop_index("ix_sample_requests_quotation_id", table_name="sample_requests")
        op.drop_column("sample_requests", "quotation_no")
        op.drop_column("sample_requests", "quotation_id")
