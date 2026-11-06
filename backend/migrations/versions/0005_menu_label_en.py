"""add menu label_en

Revision ID: 0005_menu_label_en
Revises: 0004_generated_placeholder
Create Date: 2026-11-06

菜单名称新增英文列，接口按请求语言返回单个 ``label``；英文缺失时回落中文。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_menu_label_en"
down_revision: str | None = "0004_generated_placeholder"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_MENU_LABELS_EN: tuple[tuple[str, str], ...] = (
    ("menu-dashboard", "Dashboard"),
    ("menu-organization-users", "Organization"),
    ("menu-mcp-settings", "MCP"),
    ("menu-products", "Products"),
    ("menu-customers", "Customers"),
    ("menu-suppliers", "Suppliers"),
    ("menu-partners", "Partners"),
    ("menu-document-parties", "Document Parties"),
    ("menu-sample-requests", "Sampling"),
    ("menu-sample-records", "Sample Records"),
    ("menu-sample-deliveries", "Sample Deliveries"),
    ("menu-sales-quotations", "Export Quotations"),
    ("menu-sales-contracts", "Order Center"),
    ("menu-sales-shipments", "Shipments"),
    ("menu-purchase-inquiries", "Purchase Inquiries"),
    ("menu-purchase-contracts", "Purchase Contracts"),
    ("menu-purchase-invoice-notices", "Invoice Notices"),
    ("menu-purchase-followup", "Follow-up Center"),
    ("menu-quality-inspections", "QC Center"),
    ("menu-quality-tasks", "My QC Tasks"),
    ("menu-warehouse-inbound-plans", "Inbound Plans"),
    ("menu-warehouse-inbound-orders", "Inbound Receipts"),
    ("menu-warehouse-outbound-plans", "Outbound Plans"),
    ("menu-warehouse-outbound-orders", "Outbound"),
    ("menu-finance", "Finance Summary"),
    ("menu-reporting", "Executive Dashboard"),
)


def upgrade() -> None:
    bind = op.get_bind()
    if "menu_items" not in sa.inspect(bind).get_table_names():
        # 老库只包含部分业务表，菜单表创建后由种子数据写入双语名称。
        return
    op.add_column(
        "menu_items",
        sa.Column("label_en", sa.String(length=120), nullable=True),
    )
    bind.execute(
        sa.text(
            "UPDATE menu_items SET label_en = :label_en WHERE id = :id AND label_en IS NULL"
        ),
        [{"id": menu_id, "label_en": label_en} for menu_id, label_en in _MENU_LABELS_EN],
    )


def downgrade() -> None:
    op.drop_column("menu_items", "label_en")
