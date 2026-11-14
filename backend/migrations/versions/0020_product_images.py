"""product multiple images

Revision ID: 0020_product_images
Revises: 0019_menu_terminology
Create Date: 2026-11-14

商品支持一组图片：新增 image_urls（JSON 数组文本），顺序即展示顺序，第一张为主图。
既有 image_url 回填为数组首项；image_url 本身继续保存主图，兼容打印与合同行。
"""

import json
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0020_product_images"
down_revision: str | None = "0019_menu_terminology"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "products" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("products")}
    if "image_urls" not in columns:
        op.add_column("products", sa.Column("image_urls", sa.Text(), nullable=True))

    rows = bind.execute(
        sa.text(
            "SELECT id, image_url FROM products "
            "WHERE image_url IS NOT NULL AND image_url != ''"
        )
    ).all()
    for product_id, image_url in rows:
        bind.execute(
            sa.text("UPDATE products SET image_urls = :image_urls WHERE id = :product_id"),
            {"image_urls": json.dumps([image_url], ensure_ascii=False), "product_id": product_id},
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "products" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("products")}
    if "image_urls" in columns:
        op.drop_column("products", "image_urls")
