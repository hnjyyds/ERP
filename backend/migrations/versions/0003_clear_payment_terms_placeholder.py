"""clear payment_terms placeholder

Revision ID: 0003_payment_terms_placeholder
Revises: 0002_legacy_reconciliation
Create Date: 2026-11-06

历史上前端在未填写付款条件时会提交「未设置」占位文案，导致展示文案被写入
``customer_credit_profiles`` / ``supplier_credit_profiles`` 的业务字段。
本迁移把该占位值清理为空字符串，展示层统一由前端按当前语言渲染「未设置」。

执行前如需保留证据，可先备份并确认影响范围：

```sql
CREATE TABLE customer_credit_profiles_bak_20261106 AS
SELECT * FROM customer_credit_profiles;
CREATE TABLE supplier_credit_profiles_bak_20261106 AS
SELECT * FROM supplier_credit_profiles;

SELECT c.code, c.cn_name, p.payment_terms, p.updated_at
FROM customer_credit_profiles p
JOIN customers c ON c.id = p.customer_id
WHERE p.payment_terms = '未设置';
```

数据本身无法区分「系统默认写入」与「用户手工输入这四个字」，因此统一按默认
占位值处理；若确认存在手工录入的行，应先从上表备份中单独导出后再执行升级。

downgrade 故意留空：空字符串无法还原为占位文案，回滚统一走备份恢复。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_payment_terms_placeholder"
down_revision: str | None = "0002_legacy_reconciliation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_PLACEHOLDER = "未设置"
_TABLES = ("customer_credit_profiles", "supplier_credit_profiles")


def _has_table(table: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table in inspector.get_table_names()


def upgrade() -> None:
    for table in _TABLES:
        if not _has_table(table):
            continue
        op.execute(
            sa.text(f"UPDATE {table} SET payment_terms = '' WHERE payment_terms = :placeholder")
            .bindparams(placeholder=_PLACEHOLDER)
        )


def downgrade() -> None:
    """占位文案不回填，避免再次把展示文案写入业务数据。"""
