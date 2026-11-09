"""add finance child menus

Revision ID: 0012_finance_child_menus
Revises: 0011_shipment_rejection
Create Date: 2026-11-09

财务子菜单原先只存在于前端 ``routeDefinitions``，后端菜单表只有 ``/finance`` 一项。
本迁移把 10 个财务子菜单补进 ``menu_items``，让标题、英文名、图标、权限、排序
由后端统一提供；同时把「我的 QC 任务 / 跟单中心 / 打样管理 / 样品登记 / 寄样管理」
的排序值调整为当前侧栏展示顺序，前端不再依赖注册表顺序。

- 只补缺失行，老库重复执行不会产生重复数据；
- 菜单表不存在时直接返回（与 0005 一致，兼容早期只建了部分业务表的老库）；
- 英文名复用 ``label_en``，不新增列。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0012_finance_child_menus"
down_revision: str | None = "0011_shipment_rejection"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_MENU_TABLE = sa.table(
    "menu_items",
    sa.column("id", sa.String),
    sa.column("label", sa.String),
    sa.column("label_en", sa.String),
    sa.column("path", sa.String),
    sa.column("icon", sa.String),
    sa.column("required_permission", sa.String),
    sa.column("sort_order", sa.Integer),
    sa.column("is_active", sa.Boolean),
)

_FINANCE_MENUS: tuple[dict[str, object], ...] = (
    {
        "id": "menu-finance-overview",
        "label": "经营总览",
        "label_en": "Business Overview",
        "path": "/finance/overview",
        "icon": "bar-chart-3",
        "sort_order": 61,
    },
    {
        "id": "menu-finance-receipts",
        "label": "收款管理",
        "label_en": "Receipts",
        "path": "/finance/receipts",
        "icon": "wallet",
        "sort_order": 62,
    },
    {
        "id": "menu-finance-payments",
        "label": "付款管理",
        "label_en": "Payments",
        "path": "/finance/payments",
        "icon": "wallet",
        "sort_order": 63,
    },
    {
        "id": "menu-finance-fees",
        "label": "付费管理",
        "label_en": "Fee Payments",
        "path": "/finance/fees",
        "icon": "wallet",
        "sort_order": 64,
    },
    {
        "id": "menu-finance-tax",
        "label": "核销退税",
        "label_en": "Tax Verification & Refund",
        "path": "/finance/tax",
        "icon": "file-stack",
        "sort_order": 65,
    },
    {
        "id": "menu-finance-misc",
        "label": "杂费管理",
        "label_en": "Misc. Fees",
        "path": "/finance/misc",
        "icon": "wallet",
        "sort_order": 66,
    },
    {
        "id": "menu-finance-settlement",
        "label": "结算核算",
        "label_en": "Settlement & Costing",
        "path": "/finance/settlement",
        "icon": "bar-chart-3",
        "sort_order": 67,
    },
    {
        "id": "menu-finance-reimbursements",
        "label": "报销管理",
        "label_en": "Reimbursements",
        "path": "/finance/reimbursements",
        "icon": "wallet",
        "sort_order": 68,
    },
    {
        "id": "menu-finance-port-data",
        "label": "口岸数据",
        "label_en": "Port Data",
        "path": "/finance/port-data",
        "icon": "file-stack",
        "sort_order": 69,
    },
    {
        "id": "menu-finance-reports",
        "label": "财务报表",
        "label_en": "Financial Reports",
        "path": "/finance/reports",
        "icon": "bar-chart-3",
        "sort_order": 70,
    },
)

_SORT_ORDER_BACKFILL: tuple[tuple[str, int], ...] = (
    ("menu-quality-tasks", 41),
    ("menu-purchase-followup", 42),
    ("menu-sample-records", 81),
    ("menu-sample-requests", 82),
)


def upgrade() -> None:
    bind = op.get_bind()
    if "menu_items" not in sa.inspect(bind).get_table_names():
        return
    existing_ids = set(bind.execute(sa.text("SELECT id FROM menu_items")).scalars())
    rows = [
        {
            "required_permission": "finance:view",
            "is_active": True,
            **menu,
        }
        for menu in _FINANCE_MENUS
        if menu["id"] not in existing_ids
    ]
    if rows:
        op.bulk_insert(_MENU_TABLE, rows)
    bind.execute(
        sa.text("UPDATE menu_items SET sort_order = :sort_order WHERE id = :id"),
        [{"id": menu_id, "sort_order": sort_order} for menu_id, sort_order in _SORT_ORDER_BACKFILL],
    )


def downgrade() -> None:
    bind = op.get_bind()
    if "menu_items" not in sa.inspect(bind).get_table_names():
        return
    bind.execute(
        sa.text("DELETE FROM menu_items WHERE id IN :ids").bindparams(
            sa.bindparam("ids", expanding=True)
        ),
        {"ids": [menu["id"] for menu in _FINANCE_MENUS]},
    )
    bind.execute(
        sa.text("UPDATE menu_items SET sort_order = :sort_order WHERE id = :id"),
        [
            {"id": "menu-quality-tasks", "sort_order": 42},
            {"id": "menu-purchase-followup", "sort_order": 41},
            {"id": "menu-sample-records", "sort_order": 82},
            {"id": "menu-sample-requests", "sort_order": 81},
        ],
    )
