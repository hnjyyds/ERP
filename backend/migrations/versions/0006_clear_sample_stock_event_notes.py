"""clear generated sample stock event notes

Revision ID: 0006_sample_stock_note
Revises: 0005_menu_label_en
Create Date: 2026-11-07

历史代码在自动写入样品库存事件时，把展示文案写进了 ``sample_stock_events.note``：

- 寄样审核通过 → ``delivered`` 事件
- 样品登记收样 → ``received`` 事件
- 样品批量导入收样 → ``received`` 事件

事件类型、单据号、收件方已由 ``event_type`` / ``delivery_no`` / ``recipient`` 表达，
本迁移只清理这三类固定字符串，其它 ``note`` 视为用户可编辑内容，保持原样。

downgrade 故意留空：清理后的空值无法还原，回滚统一走备份恢复。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0006_sample_stock_note"
down_revision: str | None = "0005_menu_label_en"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_PLACEHOLDER_NOTES: tuple[str, ...] = (
    "寄样审核通过",
    "样品登记收样",
    "样品批量导入收样",
)


def upgrade() -> None:
    bind = op.get_bind()
    if "sample_stock_events" not in sa.inspect(bind).get_table_names():
        return
    bind.execute(
        sa.text(
            "UPDATE sample_stock_events SET note = NULL WHERE note IN :placeholders"
        ).bindparams(sa.bindparam("placeholders", expanding=True)),
        {"placeholders": list(_PLACEHOLDER_NOTES)},
    )


def downgrade() -> None:
    """占位文案不回填，避免再次把展示文案写入业务数据。"""
