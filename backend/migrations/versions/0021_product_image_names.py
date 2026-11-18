"""product image names

Revision ID: 0021_product_image_names
Revises: 0020_product_images
Create Date: 2026-11-18

保存商品图片的原始文件名，保证保存并刷新后仍可辨识图片。
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0021_product_image_names"
down_revision: str | None = "0020_product_images"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "products" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("products")}
    if "image_names" not in columns:
        op.add_column("products", sa.Column("image_names", sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "products" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("products")}
    if "image_names" in columns:
        op.drop_column("products", "image_names")
