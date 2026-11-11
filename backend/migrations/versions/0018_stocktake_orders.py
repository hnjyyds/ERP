"""stocktake orders

Revision ID: 0018_stocktake_orders
Revises: 0017_pending_inspection
Create Date: 2026-11-11

新增库存盘点单（表头 + 明细），并把盘点权限、角色授权、菜单项回填到既有库：
- 权限与菜单以 ``seed_permissions.py`` / ``seed_navigation.py`` 为单一来源，
  本迁移只做幂等插入，不改动其它权限。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0018_stocktake_orders"
down_revision: str | None = "0017_pending_inspection"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_ORDERS = "warehouse_stocktake_orders"
_LINES = "warehouse_stocktake_order_lines"

_PERMISSIONS = (
    (
        "perm-warehouse-stocktake-view",
        "warehouse:stocktake:view",
        "查看库存盘点",
        "functional",
    ),
    (
        "perm-warehouse-stocktake-edit",
        "warehouse:stocktake:edit",
        "维护库存盘点",
        "functional",
    ),
    (
        "perm-warehouse-stocktake-approve",
        "warehouse:stocktake:approve",
        "审批库存盘点",
        "process",
    ),
    (
        "perm-warehouse-stocktake-view-all",
        "warehouse:stocktake:view_all",
        "查看全部库存盘点",
        "data",
    ),
)

_ROLE_PERMISSION_ROLES = ("role-warehouse", "role-sales-manager")

_MENU_ID = "menu-warehouse-stocktakes"


def _has_table(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def _create_tables() -> None:
    if not _has_table(_ORDERS):
        op.create_table(
            _ORDERS,
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("code", sa.String(length=80), nullable=False),
            sa.Column("warehouse_id", sa.String(length=36), nullable=False),
            sa.Column("warehouse_name", sa.String(length=160), nullable=False),
            sa.Column("location_id", sa.String(length=36), nullable=False),
            sa.Column("location_name", sa.String(length=160), nullable=False),
            sa.Column("count_date", sa.Date(), nullable=False),
            sa.Column("status", sa.String(length=40), nullable=False),
            sa.Column("operator_name", sa.String(length=160), nullable=False),
            sa.Column("owner_user_id", sa.String(length=36), nullable=False),
            sa.Column("reviewer_id", sa.String(length=36), nullable=True),
            sa.Column("reviewer_name", sa.String(length=160), nullable=True),
            sa.Column("remark", sa.Text(), nullable=True),
            sa.Column("submitted_at", sa.Date(), nullable=True),
            sa.Column("approved_at", sa.Date(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index(f"ix_{_ORDERS}_code", _ORDERS, ["code"], unique=True)
        for column in (
            "warehouse_id",
            "location_id",
            "count_date",
            "status",
            "owner_user_id",
            "reviewer_id",
        ):
            op.create_index(f"ix_{_ORDERS}_{column}", _ORDERS, [column])

    if not _has_table(_LINES):
        op.create_table(
            _LINES,
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("order_id", sa.String(length=36), nullable=False),
            sa.Column("product_id", sa.String(length=36), nullable=True),
            sa.Column("product_code", sa.String(length=80), nullable=True),
            sa.Column("product_name", sa.String(length=240), nullable=False),
            sa.Column("unit", sa.String(length=40), nullable=False),
            sa.Column("book_quantity", sa.Numeric(precision=14, scale=4), nullable=False),
            sa.Column("actual_quantity", sa.Numeric(precision=14, scale=4), nullable=False),
            sa.Column(
                "difference_quantity",
                sa.Numeric(precision=14, scale=4),
                nullable=False,
            ),
            sa.Column("remark", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["order_id"], [f"{_ORDERS}.id"]),
        )
        for column in ("order_id", "product_id", "product_code", "product_name"):
            op.create_index(f"ix_{_LINES}_{column}", _LINES, [column])


def _backfill_permissions() -> None:
    if not _has_table("permissions") or not _has_table("role_permissions"):
        return
    bind = op.get_bind()
    for permission_id, code, name, category in _PERMISSIONS:
        existing = bind.execute(
            sa.text("SELECT id FROM permissions WHERE code = :code"),
            {"code": code},
        ).first()
        if existing is None:
            bind.execute(
                sa.text(
                    "INSERT INTO permissions (id, code, name, category) "
                    "VALUES (:id, :code, :name, :category)"
                ),
                {
                    "id": permission_id,
                    "code": code,
                    "name": name,
                    "category": category,
                },
            )

    for role_id in _ROLE_PERMISSION_ROLES:
        role_exists = bind.execute(
            sa.text("SELECT id FROM roles WHERE id = :role_id"),
            {"role_id": role_id},
        ).first()
        if role_exists is None:
            continue
        for permission_id, _code, _name, _category in _PERMISSIONS:
            link_id = f"rp-{role_id.removeprefix('role-')}-{permission_id.removeprefix('perm-')}"
            existing = bind.execute(
                sa.text(
                    "SELECT id FROM role_permissions "
                    "WHERE role_id = :role_id AND permission_id = :permission_id"
                ),
                {"role_id": role_id, "permission_id": permission_id},
            ).first()
            if existing is None:
                bind.execute(
                    sa.text(
                        "INSERT INTO role_permissions (id, role_id, permission_id) "
                        "VALUES (:id, :role_id, :permission_id)"
                    ),
                    {"id": link_id, "role_id": role_id, "permission_id": permission_id},
                )


def _backfill_menu() -> None:
    if not _has_table("menu_items"):
        return
    bind = op.get_bind()
    existing = bind.execute(
        sa.text("SELECT id FROM menu_items WHERE id = :id"),
        {"id": _MENU_ID},
    ).first()
    if existing is not None:
        return
    bind.execute(
        sa.text(
            "INSERT INTO menu_items ("
            "id, label, label_en, path, icon, required_permission, sort_order, is_active"
            ") VALUES ("
            ":id, :label, :label_en, :path, :icon, :required_permission, :sort_order, :is_active"
            ")"
        ),
        {
            "id": _MENU_ID,
            "label": "库存盘点",
            "label_en": "Stocktake",
            "path": "/warehouse/stocktakes",
            "icon": "clipboard",
            "required_permission": "warehouse:stocktake:view",
            "sort_order": 93,
            "is_active": True,
        },
    )


def upgrade() -> None:
    _create_tables()
    _backfill_permissions()
    _backfill_menu()


def downgrade() -> None:
    bind = op.get_bind()
    if _has_table("role_permissions"):
        bind.execute(
            sa.text("DELETE FROM role_permissions WHERE permission_id LIKE :prefix"),
            {"prefix": "perm-warehouse-stocktake-%"},
        )
    if _has_table("permissions"):
        bind.execute(
            sa.text("DELETE FROM permissions WHERE code LIKE :prefix"),
            {"prefix": "warehouse:stocktake:%"},
        )
    if _has_table("menu_items"):
        bind.execute(
            sa.text("DELETE FROM menu_items WHERE id = :id"),
            {"id": _MENU_ID},
        )

    if _has_table(_LINES):
        for column in ("order_id", "product_id", "product_code", "product_name"):
            op.drop_index(f"ix_{_LINES}_{column}", table_name=_LINES)
        op.drop_table(_LINES)

    if _has_table(_ORDERS):
        for column in (
            "code",
            "warehouse_id",
            "location_id",
            "count_date",
            "status",
            "owner_user_id",
            "reviewer_id",
        ):
            op.drop_index(f"ix_{_ORDERS}_{column}", table_name=_ORDERS)
        op.drop_table(_ORDERS)
