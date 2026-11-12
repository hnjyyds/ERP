"""unify menu terminology

Revision ID: 0019_menu_terminology
Revises: 0018_stocktake_orders
Create Date: 2026-11-12

统一菜单名称，避免同一业务在不同位置出现多个叫法：
- 产品资料 -> 商品资料
- 工厂资料 -> 供应商资料
- 订单中心 -> 出口合同

只回填菜单名称，不改动权限、路径和排序。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0019_menu_terminology"
down_revision: str | None = "0018_stocktake_orders"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_MENU_LABELS: tuple[tuple[str, str, str], ...] = (
    ("menu-products", "商品资料", "Products"),
    ("menu-suppliers", "供应商资料", "Suppliers"),
    ("menu-sales-contracts", "出口合同", "Export Contracts"),
)


def upgrade() -> None:
    bind = op.get_bind()
    if "menu_items" not in sa.inspect(bind).get_table_names():
        return
    for menu_id, label, label_en in _MENU_LABELS:
        bind.execute(
            sa.text(
                "UPDATE menu_items SET label = :label, label_en = :label_en "
                "WHERE id = :menu_id"
            ),
            {"menu_id": menu_id, "label": label, "label_en": label_en},
        )


def downgrade() -> None:
    bind = op.get_bind()
    if "menu_items" not in sa.inspect(bind).get_table_names():
        return
    previous = (
        ("menu-products", "产品资料", "Products"),
        ("menu-suppliers", "工厂资料", "Suppliers"),
        ("menu-sales-contracts", "订单中心", "Order Center"),
    )
    for menu_id, label, label_en in previous:
        bind.execute(
            sa.text(
                "UPDATE menu_items SET label = :label, label_en = :label_en "
                "WHERE id = :menu_id"
            ),
            {"menu_id": menu_id, "label": label, "label_en": label_en},
        )
