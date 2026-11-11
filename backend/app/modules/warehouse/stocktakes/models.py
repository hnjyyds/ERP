from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _new_id() -> str:
    return str(uuid4())


class StocktakeOrder(Base):
    __tablename__ = "warehouse_stocktake_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    warehouse_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    warehouse_name: Mapped[str] = mapped_column(String(160), nullable=False)
    location_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    location_name: Mapped[str] = mapped_column(String(160), nullable=False)
    count_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(40), index=True, default="draft", nullable=False)
    operator_name: Mapped[str] = mapped_column(String(160), nullable=False)
    owner_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    reviewer_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    reviewer_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    approved_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )


class StocktakeOrderLine(Base):
    __tablename__ = "warehouse_stocktake_order_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_id)
    order_id: Mapped[str] = mapped_column(
        ForeignKey("warehouse_stocktake_orders.id"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)
    product_name: Mapped[str] = mapped_column(String(240), index=True, nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False)
    book_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    actual_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    difference_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
