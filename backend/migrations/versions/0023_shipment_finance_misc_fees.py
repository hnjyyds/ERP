"""recalculate shipment finance with misc fees

Revision ID: 0023_shipment_finance_misc_fees
Revises: 0022_recalc_shipment_finance
Create Date: 2026-11-19

利润统一为“应收−应付+同币种退税−同币种杂费”，利润率统一以应收为分母；
修正 0022 仅含退税、未扣杂费的遗漏。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0023_shipment_finance_misc_fees"
down_revision: str | None = "0022_recalc_shipment_finance"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    tables = set(sa.inspect(bind).get_table_names())
    if "shipment_plans" not in tables:
        return

    bind.execute(
        sa.text(
            """
            UPDATE shipment_plans
            SET receivable_amount = COALESCE(
                (SELECT SUM(shipment_lines.amount)
                 FROM shipment_lines
                 WHERE shipment_lines.shipment_id = shipment_plans.id),
                0
            )
            """
        )
    )

    refund_sql = "0"
    if {"finance_verification_tax_refunds", "finance_verification_documents"} <= tables:
        refund_sql = """
            COALESCE(
                (SELECT SUM(refunds.amount)
                 FROM finance_verification_tax_refunds AS refunds
                 JOIN finance_verification_documents AS documents
                   ON documents.id = refunds.verification_document_id
                 WHERE documents.shipment_plan_id = shipment_plans.id
                   AND refunds.currency = shipment_plans.currency),
                0
            )
        """
    fee_sql = "0"
    if "finance_misc_fee_allocations" in tables:
        fee_sql = """
            COALESCE(
                (SELECT SUM(allocations.amount)
                 FROM finance_misc_fee_allocations AS allocations
                 WHERE allocations.shipment_plan_id = shipment_plans.id
                   AND allocations.currency = shipment_plans.currency),
                0
            )
        """

    bind.execute(
        sa.text(
            f"""
            UPDATE shipment_plans
            SET profit_amount = receivable_amount - payable_amount
                + {refund_sql} - {fee_sql}
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE shipment_plans
            SET profit_rate = CASE
                WHEN receivable_amount = 0 THEN 0
                ELSE profit_amount * 100.0 / receivable_amount
            END
            """
        )
    )


def downgrade() -> None:
    # 派生金额按统一规则重算，无法还原修复前的漂移值。
    pass
