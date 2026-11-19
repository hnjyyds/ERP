"""recalculate shipment finance

Revision ID: 0022_recalc_shipment_finance
Revises: 0021_product_image_names
Create Date: 2026-11-19

按“应收−应付+已登记退税”统一重算历史出货单，修复派生金额漂移。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0022_recalc_shipment_finance"
down_revision: str | None = "0021_product_image_names"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
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
    if {"finance_verification_tax_refunds", "finance_verification_documents"} <= tables:
        bind.execute(
            sa.text(
                """
                UPDATE shipment_plans
                SET profit_amount = receivable_amount - payable_amount + COALESCE(
                    (SELECT SUM(refunds.amount)
                     FROM finance_verification_tax_refunds AS refunds
                     JOIN finance_verification_documents AS documents
                       ON documents.id = refunds.verification_document_id
                     WHERE documents.shipment_plan_id = shipment_plans.id),
                    0
                )
                """
            )
        )
    else:
        bind.execute(
            sa.text(
                """
                UPDATE shipment_plans
                SET profit_amount = receivable_amount - payable_amount
                """
            )
        )
    if {"finance_verification_tax_refunds", "finance_verification_documents"} <= tables:
        refund_subquery = """
            COALESCE(
                (SELECT SUM(refunds.amount)
                 FROM finance_verification_tax_refunds AS refunds
                 JOIN finance_verification_documents AS documents
                   ON documents.id = refunds.verification_document_id
                 WHERE documents.shipment_plan_id = shipment_plans.id),
                0
            )
        """
    else:
        refund_subquery = "0"
    bind.execute(
        sa.text(
            f"""
            UPDATE shipment_plans
            SET profit_rate = CASE
                WHEN receivable_amount + {refund_subquery} = 0 THEN 0
                ELSE profit_amount * 100.0 / (receivable_amount + {refund_subquery})
            END
            """
        )
    )


def downgrade() -> None:
    # 派生金额按统一规则重算，无法还原修复前的漂移值。
    pass
