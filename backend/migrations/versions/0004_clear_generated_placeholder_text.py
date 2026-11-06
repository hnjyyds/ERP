"""clear generated placeholder text

Revision ID: 0004_generated_placeholder
Revises: 0003_payment_terms_placeholder
Create Date: 2026-11-06

历史代码在自动生成业务记录时，把展示文案写进了业务字段：

- ``export_contracts.payment_terms``：报价转合同无付款条件时的「按合同约定」
- ``quality_inspection_events.notes``：创建事件备注「QC 任务已创建」
- ``purchase_contract_lines.remark``：配件耗料生成行的「按商品配件单位耗料生成」
- ``finance_verification_documents.remark``：口岸自动匹配回单备注
- ``purchase_follow_nodes.source_summary``：采购合同审批通过节点摘要

这些信息已由 ``event_type`` / ``source_record_type`` / ``source_record_id`` /
``status`` 等结构化字段表达，本迁移把历史占位文本清理为空值。数据本身无法区分
自动写入与用户手工输入同名字样，如确认存在手工录入，请先备份对应行再执行升级。

downgrade 故意留空：清理后的空值无法还原，回滚统一走备份恢复。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_generated_placeholder"
down_revision: str | None = "0003_payment_terms_placeholder"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# (table, column, placeholder, replacement)
_CLEANUPS: tuple[tuple[str, str, str, str | None], ...] = (
    ("export_contracts", "payment_terms", "按合同约定", ""),
    ("quality_inspection_events", "notes", "QC 任务已创建", None),
    ("purchase_contract_lines", "remark", "按商品配件单位耗料生成", None),
    ("finance_verification_documents", "remark", "由口岸导入数据自动匹配报关回单", None),
    ("purchase_follow_nodes", "source_summary", "采购合同审批通过", None),
)


def _has_table(table: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table in inspector.get_table_names()


def upgrade() -> None:
    for table, column, placeholder, replacement in _CLEANUPS:
        if not _has_table(table):
            continue
        op.execute(
            sa.text(
                f"UPDATE {table} SET {column} = :replacement WHERE {column} = :placeholder"
            ).bindparams(replacement=replacement, placeholder=placeholder)
        )


def downgrade() -> None:
    """占位文案不回填，避免再次把展示文案写入业务数据。"""
