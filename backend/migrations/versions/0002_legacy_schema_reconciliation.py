"""legacy schema reconciliation

Revision ID: 0002_legacy_reconciliation
Revises: 0001_baseline
Create Date: 2026-11-06

把历史上启动时执行的 11 段 ``ensure_*`` 补丁收敛为一次幂等对账迁移。

- 全新数据库：``0001`` 已按模型建出全部列，本迁移逐项判存在后跳过，实际为空操作。
- 已有旧库：先用 ``python -m app.db.migrate stamp-existing`` 标记 ``0001``，
  再执行本迁移补齐缺失列、索引，并回填质量检验的历史时间字段。

downgrade 故意留空：SQLite 删除列需要重建表，收益低于风险；
回滚统一走「恢复备份 + 旧镜像」。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_legacy_reconciliation"
down_revision: str | None = "0001_baseline"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_APPROVAL_TABLES = (
    "sample_deliveries",
    "export_quotations",
    "export_contracts",
    "purchase_contracts",
    "shipment_plans",
    "warehouse_outbound_orders",
    "finance_payment_requests",
    "finance_fee_payment_requests",
    "finance_reimbursements",
)


def _has_table(table: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table in inspector.get_table_names()


def _column_names(table: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table not in inspector.get_table_names():
        return set()
    return {column["name"] for column in inspector.get_columns(table)}


def _index_names(table: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    if table not in inspector.get_table_names():
        return set()
    return {index["name"] for index in inspector.get_indexes(table)}


def _add_column(table: str, column: sa.Column) -> None:
    if not _has_table(table) or column.name in _column_names(table):
        return
    op.add_column(table, column)


def _add_index(table: str, name: str, columns: list[str]) -> None:
    if not _has_table(table) or name in _index_names(table):
        return
    op.create_index(name, table, columns)


def _add_reviewer_id(table: str, *, length: int = 64) -> None:
    _add_column(table, sa.Column("reviewer_id", sa.String(length=length)))
    _add_index(table, f"ix_{table}_reviewer_id", ["reviewer_id"])


def upgrade() -> None:
    # 1. 系统认证：头像与数据范围
    _add_column(
        "users",
        sa.Column("avatar_type", sa.String(length=20), nullable=False, server_default="preset"),
    )
    _add_column(
        "users",
        sa.Column("avatar_value", sa.Text(), nullable=False, server_default="amber-orbit"),
    )
    _add_column(
        "permissions",
        sa.Column("category", sa.String(length=20), nullable=False, server_default="functional"),
    )
    _add_column(
        "roles",
        sa.Column("data_scope", sa.String(length=20), nullable=False, server_default="self"),
    )

    # 2. 审批指派：各业务单的指定审批人
    for table in _APPROVAL_TABLES:
        _add_reviewer_id(table)
    _add_column("finance_reimbursements", sa.Column("reviewer_name", sa.String(length=160)))

    # 3. 工作台待办
    _add_column("todo_tasks", sa.Column("owner_user_name", sa.String(length=120)))
    _add_column("todo_tasks", sa.Column("creator_user_id", sa.String(length=64)))
    _add_column("todo_tasks", sa.Column("creator_user_name", sa.String(length=120)))
    _add_column("todo_tasks", sa.Column("content", sa.Text(), nullable=False, server_default=""))

    # 4. 商品
    _add_column(
        "products",
        sa.Column("status", sa.String(length=40), nullable=False, server_default="active"),
    )
    _add_column(
        "products",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    _add_column(
        "product_accessories",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    # 5. 口岸数据：报关记录与核销单匹配状态
    _add_column(
        "finance_customs_declaration_records",
        sa.Column("match_status", sa.String(length=40), nullable=False, server_default="unmatched"),
    )
    _add_column(
        "finance_customs_declaration_records",
        sa.Column("matched_verification_document_id", sa.String(length=36)),
    )
    _add_column(
        "finance_customs_declaration_records",
        sa.Column("matched_verification_document_no", sa.String(length=120)),
    )

    # 6. 采购合同：QC 指派与驳回信息
    _add_column("purchase_contracts", sa.Column("qc_user_id", sa.String(length=36)))
    _add_column("purchase_contracts", sa.Column("qc_user_name", sa.String(length=160)))
    _add_column("purchase_contracts", sa.Column("rejected_at", sa.Date()))
    _add_column("purchase_contracts", sa.Column("rejection_reason", sa.Text()))
    _add_index("purchase_contracts", "ix_purchase_contracts_qc_user_id", ["qc_user_id"])

    # 7. 出口合同明细条码
    _add_column("export_contract_lines", sa.Column("barcode", sa.String(length=64)))
    _add_index("export_contract_lines", "ix_export_contract_lines_barcode", ["barcode"])

    # 8. 质量检验：排期、复检、取消与问题处理
    _add_column("quality_inspections", sa.Column("qc_user_id", sa.String(length=36)))
    _add_column("quality_inspections", sa.Column("qc_user_name", sa.String(length=160)))
    _add_column(
        "quality_inspections",
        sa.Column("status", sa.String(length=40), nullable=False, server_default="completed"),
    )
    _add_column("quality_inspections", sa.Column("scheduled_at", sa.DateTime()))
    _add_column("quality_inspections", sa.Column("parent_inspection_id", sa.String(length=36)))
    _add_column(
        "quality_inspections",
        sa.Column("reinspection_no", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )
    _add_column("quality_inspections", sa.Column("cancel_reason", sa.Text()))
    _add_column("quality_inspections", sa.Column("updated_at", sa.DateTime()))
    _add_index("quality_inspections", "ix_quality_inspections_qc_user_id", ["qc_user_id"])
    _add_index("quality_inspections", "ix_quality_inspections_status", ["status"])
    _add_index("quality_inspections", "ix_quality_inspections_scheduled_at", ["scheduled_at"])
    _add_index(
        "quality_inspections",
        "ix_quality_inspections_parent_inspection_id",
        ["parent_inspection_id"],
    )
    if _has_table("quality_inspections"):
        op.execute(
            "UPDATE quality_inspections "
            "SET scheduled_at = inspected_at || ' 09:00:00' "
            "WHERE scheduled_at IS NULL"
        )
        op.execute(
            "UPDATE quality_inspections SET updated_at = created_at WHERE updated_at IS NULL"
        )

    _add_column("quality_issues", sa.Column("resolution_note", sa.Text()))
    _add_column("quality_issues", sa.Column("resolved_at", sa.DateTime()))
    _add_column("quality_issues", sa.Column("resolved_by_id", sa.String(length=36)))
    _add_column("quality_issues", sa.Column("resolved_by_name", sa.String(length=160)))
    _add_index("quality_issues", "ix_quality_issues_resolved_by_id", ["resolved_by_id"])

    # 9. 入库单审批人
    _add_column("warehouse_inbound_orders", sa.Column("reviewer_id", sa.String(length=36)))
    _add_index(
        "warehouse_inbound_orders",
        "ix_warehouse_inbound_orders_reviewer_id",
        ["reviewer_id"],
    )

    # 10. MCP 凭证版本
    _add_column(
        "mcp_settings",
        sa.Column("credential_version", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )
    _add_column("mcp_settings", sa.Column("credential_issued_at", sa.DateTime()))


def downgrade() -> None:
    # 加列在 SQLite 上降级需要重建表，风险大于收益；回滚走备份恢复 + 旧镜像。
    pass
